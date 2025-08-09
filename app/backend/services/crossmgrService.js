const net = require('net');
const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * Service de connexion à CrossMgr
 * Gère la communication TCP avec CrossMgr sur 127.0.0.1:53135
 */
class CrossMgrService extends EventEmitter {
  constructor(mainWindow = null) {
    super();
    this.server = null;
    this.client = null;
    this.isConnected = false;
    this.isListening = false;
    this.host = '127.0.0.1';
    this.port = 53135;
    this.reconnectTimeout = null;
    this.reconnectInterval = 5000; // 5 secondes
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
    this.mainWindow = mainWindow; // Pour envoyer directement au frontend
    // Pas de keepAliveTimer - connexion maintenue indéfiniment
  }

  /**
   * Définir la fenêtre principale pour l'envoi de messages
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Envoyer un log au journal d'activité via IPC
   */
  sendLogToApp(message, level = 'info', category = 'crossmgr', metadata = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('app-log:add', {
        message,
        level,
        category,
        metadata,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Démarrer l'écoute sur le port CrossMgr
   */
  async startListening() {
    try {
      if (this.isListening) {
        logger.warn('CrossMgr: Serveur déjà en écoute', { port: this.port });
        return true;
      }

      return new Promise((resolve, reject) => {
        this.server = net.createServer((socket) => {
          this.handleClientConnection(socket);
        });

        this.server.on('listening', () => {
          this.isListening = true;
          this.reconnectAttempts = 0;
          logger.info(`CrossMgr: Serveur en écoute sur ${this.host}:${this.port}`);
          // Message unique de démarrage
          this.sendLogToApp(`🔄 CrossMgr en écoute sur ${this.port}`, 'info', 'crossmgr', { type: 'server_start', port: this.port });
          this.emit('listening', { host: this.host, port: this.port });
          resolve(true);
        });

        this.server.on('error', (error) => {
          logger.error('CrossMgr: Erreur serveur', { error: error.message, code: error.code });
          this.emit('error', error);
          reject(error);
        });

        this.server.on('close', () => {
          this.isListening = false;
          logger.info('CrossMgr: Serveur fermé');
          // Message géré par stopListening() pour éviter les doublons
          this.emit('listening_stopped');
        });

        // Démarrer l'écoute
        this.server.listen(this.port, this.host);
      });
    } catch (error) {
      logger.error('CrossMgr: Erreur lors du démarrage de l\'écoute', { error: error.message });
      throw error;
    }
  }

  /**
   * Arrêter l'écoute
   */
  async stopListening() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.client) {
        this.client.destroy();
        this.client = null;
      }

      if (this.server) {
        return new Promise((resolve) => {
          this.server.close(() => {
            logger.info('CrossMgr: Écoute arrêtée');
            // Un seul message consolidé pour l'arrêt
            this.sendLogToApp('🔌 CrossMgr arrêté', 'info', 'crossmgr', { type: 'server_stop' });
            
            // Émettre un événement spécial pour l'arrêt complet du serveur
            this.emit('disconnected', {
              reason: 'server_stopped',
              errorMessage: null,
              timestamp: new Date().toISOString(),
              serverStopped: true // Serveur complètement arrêté
            });
            
            resolve();
          });
        });
      }
    } catch (error) {
      logger.error('CrossMgr: Erreur lors de l\'arrêt de l\'écoute', { error: error.message });
      throw error;
    }
  }

  /**
   * Gérer une nouvelle connexion client (CrossMgr)
   */
  handleClientConnection(socket) {
    logger.info('CrossMgr: Nouvelle connexion client', { 
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort 
    });

    this.client = socket;
    // Ne pas marquer comme connecté ici - attendre le message GT
    
    // Envoyer au journal d'activité
    this.sendLogToApp(
      `📡 Client CrossMgr connecté depuis ${socket.remoteAddress}:${socket.remotePort}`, 
      'info',
      'crossmgr',
      { type: 'connection', address: socket.remoteAddress, port: socket.remotePort }
    );
    
    this.emit('connected', {
      address: socket.remoteAddress,
      port: socket.remotePort
    });

    // Buffer pour accumuler les données
    let buffer = '';

    // Pas de timeout automatique - garder la connexion ouverte indéfiniment
    // La déconnexion sera détectée uniquement par les événements 'end' et 'error'

    socket.on('data', (data) => {
      // Traiter les données reçues
      buffer += data.toString();
      buffer = this.processBuffer(buffer, socket);
    });

    socket.on('end', () => {
      logger.info('CrossMgr: Connexion fermée par le client');
      this.handleDisconnection('client_close');
    });

    socket.on('error', (error) => {
      logger.error('CrossMgr: Erreur socket client', { error: error.message });
      this.handleDisconnection('error', error.message);
    });

    socket.on('close', (hadError) => {
      logger.info('CrossMgr: Socket client fermé', { hadError });
      this.handleDisconnection(hadError ? 'error_close' : 'normal_close');
    });
  }

  /**
   * Traiter les données reçues dans le buffer
   */
  processBuffer(buffer, socket) {
    const lines = buffer.split('\r');
    
    // Garder la dernière ligne incomplète dans le buffer
    const remainingBuffer = lines.pop() || '';

    lines.forEach(line => {
      if (line.trim()) {
        this.processMessage(line.trim(), socket);
      }
    });

    return remainingBuffer;
  }

  /**
   * Traiter un message reçu de CrossMgr
   */
  processMessage(message, socket) {
    logger.debug('CrossMgr: Message reçu', { message });

    try {
      // Protocole CrossMgr : N0000... -> répondre GT\r (handshake initial)
      if (message.startsWith('N0000')) {
        logger.info('CrossMgr: Handshake initial reçu, envoi de GT');
        socket.write('GT\r');
        this.sendLogToApp(`🤝 Handshake reçu de CrossMgr`, 'info', 'crossmgr', { type: 'handshake' });
        this.emit('handshake_received', { message });
        this.emit('message_sent', { message: 'GT', originalMessage: message, type: 'handshake' });
        return;
      }

      // Messages GT (vraie connexion établie) - Détection prioritaire
      if (message.startsWith('GT') && message.includes('date=')) {
        logger.info('CrossMgr: Message GT reçu - connexion vraiment établie');
        // C'est maintenant que la connexion est vraiment établie
        if (!this.isConnected) {
          this.isConnected = true;
          socket.write('S0000\r'); // S0000 seulement au premier GT pour confirmer la connexion
          this.sendLogToApp(`✅ Connexion CrossMgr établie (GT confirmé)`, 'success');
          logger.debug('CrossMgr service: true connection established via GT message');
          this.emit('connection_established', { message });
          this.emit('message_sent', { message: 'S0000', originalMessage: message, type: 'connection_confirm' });
        } else {
          // Messages GT suivants (timing) - afficher le message complet
          this.sendLogToApp(`⏱️ ${message}`, 'info', 'crossmgr', { type: 'timing' });
        }
        // Pas d'événement timing_message pour éviter les doublons de logs
        return;
      }

      // Autres messages de timing CrossMgr (après connexion établie) - afficher le message complet
      if (message.includes('date=') || message.includes('time=')) {
        logger.info('CrossMgr: Message de timing reçu');
        this.sendLogToApp(`⏱️ ${message}`, 'info', 'crossmgr', { type: 'timing' });
        // Pas d'événement timing_message pour éviter les doublons de logs
        return;
      }

      // Messages JSON (données de timing) - pas de réponse automatique
      if (message.startsWith('{') && message.endsWith('}')) {
        try {
          const data = JSON.parse(message);
          logger.info('CrossMgr: Données JSON reçues', { 
            type: data.type || 'unknown',
            bib: data.bib || 'unknown' 
          });
          this.sendLogToApp(`📊 Données CrossMgr - Type: ${data.type || 'unknown'}, Dossard: ${data.bib || 'N/A'}`, 'info');
          this.emit('timing_data', data);
          // Pas de S0000 automatique pour les données JSON
        } catch (parseError) {
          logger.warn('CrossMgr: Erreur parsing JSON', { 
            message, 
            error: parseError.message 
          });
        }
        return;
      }

      // Autres messages - ne pas logger en tant qu'erreur pour éviter le spam
      logger.debug('CrossMgr: Message non traité', { message });

    } catch (error) {
      logger.error('CrossMgr: Erreur traitement message', { 
        message, 
        error: error.message 
      });
    }
  }

  /**
   * Gérer la déconnexion
   */
  handleDisconnection(reason = 'unknown', errorMessage = null) {
    // Éviter les messages multiples si déjà déconnecté
    if (!this.isConnected && !this.client) {
      return;
    }
    
    // Marquer comme déconnecté
    this.isConnected = false;
    this.client = null;
    
    const disconnectData = {
      reason,
      errorMessage,
      timestamp: new Date().toISOString(),
      serverStopped: false // Client déconnecté mais serveur toujours en écoute
    };
    
    logger.info('CrossMgr: Client déconnecté', disconnectData);
    
    // Un seul message simple selon le contexte
    if (this.isListening) {
      // Client déconnecté mais serveur encore en écoute = attendre reconnexion
      this.sendLogToApp('📴 CrossMgr déconnecté (en attente de reconnexion)', 'info', 'crossmgr', { 
        type: 'client_disconnection', 
        reason, 
        errorMessage 
      });
    } else {
      // Serveur arrêté = vraie déconnexion
      this.sendLogToApp('📴 CrossMgr déconnecté', 'warning', 'crossmgr', { 
        type: 'disconnection', 
        reason, 
        errorMessage 
      });
    }
    
    // Émettre l'événement de déconnexion
    this.emit('disconnected', disconnectData);
    
    // Programmer une tentative de reconnexion si le serveur est encore en écoute
    if (this.isListening && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Programmer une tentative de reconnexion
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    
    this.reconnectTimeout = setTimeout(() => {
      logger.info(`CrossMgr: Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.emit('reconnecting', { 
        attempt: this.reconnectAttempts, 
        maxAttempts: this.maxReconnectAttempts 
      });
    }, this.reconnectInterval);
  }

  /**
   * Obtenir le statut de la connexion
   */
  getStatus() {
    return {
      isListening: this.isListening,
      isConnected: this.isConnected,
      host: this.host,
      port: this.port,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Envoyer un message à CrossMgr
   */
  sendMessage(message) {
    if (this.client && this.isConnected) {
      try {
        this.client.write(message + '\r');
        logger.debug('CrossMgr: Message envoyé', { message });
        return true;
      } catch (error) {
        logger.error('CrossMgr: Erreur envoi message', { 
          message, 
          error: error.message 
        });
        return false;
      }
    } else {
      logger.warn('CrossMgr: Tentative d\'envoi sans connexion', { message });
      return false;
    }
  }

  /**
   * Nettoyer les ressources
   */
  async cleanup() {
    try {
      await this.stopListening();
      this.removeAllListeners();
      logger.info('CrossMgr: Nettoyage terminé');
    } catch (error) {
      logger.error('CrossMgr: Erreur lors du nettoyage', { error: error.message });
    }
  }
}

module.exports = CrossMgrService;
