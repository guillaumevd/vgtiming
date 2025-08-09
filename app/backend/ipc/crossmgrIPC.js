const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class CrossMgrIPCHandler {
  constructor(controllers, mainWindow) {
    this.crossMgrController = controllers.crossmgr;
    this.mainWindow = mainWindow;
    this.listenersConfigured = false; // Éviter les multiples configurations
    
    // Obtenir le service de logs
    if (controllers._serviceFactory && typeof controllers._serviceFactory.getAppLogService === 'function') {
      this.appLogService = controllers._serviceFactory.getAppLogService();
    } else {
      // Fallback - essayer d'accéder via les services du controller
      this.appLogService = this.crossMgrController?.services?.appLog;
    }
    
    this.registerHandlers();
    this.setupEventListeners();
  }

  /**
   * Configurer les listeners d'événements du service CrossMgr
   */
  setupEventListeners() {
    // Éviter les multiples configurations
    if (this.listenersConfigured) {
      return;
    }

    // Cette méthode sera appelée quand le service devient disponible
    if (!this.crossMgrController || !this.crossMgrController.crossMgrService) {
      logger.debug('CrossMgr service not yet available for event listening, will setup later');
      return;
    }

    const service = this.crossMgrController.crossMgrService;

    // Écouter les événements de connexion
    service.on('connected', (data) => {
      logger.debug('CrossMgr service: client connected');
      this.notifyFrontend('crossmgr:connected', data);
      this.notifyFrontend('crossmgr:message', {
        type: 'connection',
        message: `📡 Client CrossMgr connecté depuis ${data.address}:${data.port}`,
        timestamp: new Date().toISOString(),
        direction: 'in'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          `Client CrossMgr connecté depuis ${data.address}:${data.port}`, 
          'success', 
          'crossmgr',
          { type: 'connection', address: data.address, port: data.port }
        );
      }
    });

    // Écouter le handshake (première étape de connexion)
    service.on('handshake_received', (data) => {
      logger.debug('CrossMgr service: handshake received');
      this.notifyFrontend('crossmgr:handshake', data);
      this.notifyFrontend('crossmgr:message', {
        type: 'handshake',
        message: `🤝 Handshake reçu: ${data.message}`,
        response: 'GT',
        timestamp: new Date().toISOString(),
        direction: 'both'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          data.message, 
          'info', 
          'crossmgr',
          { type: 'handshake' }
        );
      }
    });

    // Écouter la vraie connexion établie (message GT confirmé)
    service.on('connection_established', (data) => {
      logger.debug('CrossMgr service: true connection established via GT message');
      logger.debug('About to send crossmgr:connection_established event to frontend');
      this.notifyFrontend('crossmgr:connection_established', { established: true, data });
      this.notifyFrontend('crossmgr:message', {
        type: 'connection_established',
        message: `✅ Connexion CrossMgr établie (GT confirmé)`,
        timestamp: new Date().toISOString(),
        direction: 'in'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          'Connexion CrossMgr établie (GT confirmé)', 
          'success', 
          'crossmgr',
          { type: 'connection_established', gtMessage: data.message }
        );
      }
    });

    // Écouter les messages de timing
    service.on('timing_message', (data) => {
      logger.debug('CrossMgr service: timing message received');
      this.notifyFrontend('crossmgr:message', {
        type: 'timing',
        message: `⏱️ Message de timing: ${data.message}`,
        response: 'S0000',
        timestamp: new Date().toISOString(),
        direction: 'both'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          `Message de timing reçu (${data.message.substring(0, 30)}...)`, 
          'info', 
          'crossmgr',
          { type: 'timing', message: data.message }
        );
      }
    });

    // Écouter les données JSON
    service.on('timing_data', (data) => {
      logger.debug('CrossMgr service: timing data received');
      this.notifyFrontend('crossmgr:message', {
        type: 'data',
        message: `📊 Données reçues - Type: ${data.type || 'unknown'}, Dossard: ${data.bib || 'N/A'}`,
        response: 'S0000',
        timestamp: new Date().toISOString(),
        direction: 'both'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          `Données CrossMgr - Type: ${data.type || 'unknown'}, Dossard: ${data.bib || 'N/A'}`, 
          'info', 
          'crossmgr',
          { type: 'data', bibNumber: data.bib, dataType: data.type }
        );
      }
    });

    // Écouter les messages envoyés par VG-Timing
    service.on('message_sent', (data) => {
      logger.debug('CrossMgr service: message sent');
      this.notifyFrontend('crossmgr:message', {
        type: `${data.type}_response`,
        message: `📤 Réponse envoyée: ${data.message}`,
        originalMessage: data.originalMessage || (data.originalData ? JSON.stringify(data.originalData) : ''),
        timestamp: new Date().toISOString(),
        direction: 'out'
      });
      
      // Ajouter au journal d'activité (seulement pour les messages importants)
      if (this.appLogService && data.type === 'handshake') {
        this.appLogService.addLog(
          `Réponse envoyée à CrossMgr: ${data.message}`, 
          'info', 
          'crossmgr',
          { type: 'response', responseMessage: data.message, responseType: data.type }
        );
      }
    });

    // Écouter les déconnexions
    service.on('disconnected', (data) => {
      logger.debug('CrossMgr service: client disconnected');
      this.notifyFrontend('crossmgr:disconnected', data);
      
      // Message différent selon la raison de déconnexion
      let message = '📴 Client CrossMgr déconnecté';
      let level = 'warning';
      
      if (data && data.reason) {
        switch(data.reason) {
          case 'client_close':
            message = '📴 CrossMgr fermé normalement';
            level = 'info';
            break;
          case 'error':
          case 'error_close':
            message = `❌ CrossMgr déconnecté suite à une erreur${data.errorMessage ? ': ' + data.errorMessage : ''}`;
            level = 'error';
            break;
          case 'timeout':
            message = '⏰ CrossMgr déconnecté (timeout - application probablement fermée)';
            level = 'warning';
            break;
          case 'normal_close':
            message = '📴 CrossMgr déconnecté normalement';
            level = 'info';
            break;
        }
      }
      
      this.notifyFrontend('crossmgr:message', {
        type: 'disconnection',
        message,
        timestamp: new Date().toISOString(),
        direction: 'system'
      });
      
      // Ajouter au journal d'activité
      if (this.appLogService) {
        this.appLogService.addLog(
          message.replace(/[📴❌⏰📡✅🤝⏱️📊]/g, '').trim(), 
          level, 
          'crossmgr',
          { type: 'disconnection', reason: data?.reason, errorMessage: data?.errorMessage }
        );
      }
    });

    // Écouter les erreurs
    service.on('error', (error) => {
      logger.debug('CrossMgr service: error occurred', { error: error.message });
      this.notifyFrontend('crossmgr:error', { message: error.message });
    });

    this.listenersConfigured = true;
    logger.debug('CrossMgr event listeners configured successfully');
  }

  /**
   * Configurer les listeners une fois que le service est disponible
   */
  setupEventListenersIfReady() {
    if (!this.listenersConfigured && this.crossMgrController && this.crossMgrController.crossMgrService) {
      this.setupEventListeners();
    }
  }

  /**
   * Notifier le frontend via IPC
   */
  notifyFrontend(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      logger.debug(`Sending IPC event: ${channel}`, { data });
      this.mainWindow.webContents.send(channel, data);
    } else {
      logger.warn(`Cannot send IPC event ${channel}: mainWindow not available`);
    }
  }

  registerHandlers() {
    // Démarrer la connexion CrossMgr
    ipcMain.handle('crossmgr:start', async (event) => {
      try {
        logger.debug('IPC: crossmgr:start');
        const result = await this.crossMgrController.startConnection();
        
        // Configurer les listeners maintenant que le service est démarré
        this.setupEventListenersIfReady();
        
        return result;
      } catch (error) {
        logger.error('IPC crossmgr:start error:', error);
        return { success: false, error: error.message };
      }
    });

    // Arrêter la connexion CrossMgr
    ipcMain.handle('crossmgr:stop', async (event) => {
      try {
        logger.debug('IPC: crossmgr:stop');
        const result = await this.crossMgrController.stopConnection();
        return result;
      } catch (error) {
        logger.error('IPC crossmgr:stop error:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir le statut de la connexion
    ipcMain.handle('crossmgr:status', async (event) => {
      try {
        logger.debug('IPC: crossmgr:status');
        const result = this.crossMgrController.getConnectionStatus();
        return result;
      } catch (error) {
        logger.error('IPC crossmgr:status error:', error);
        return { success: false, error: error.message };
      }
    });

    // Envoyer un message à CrossMgr
    ipcMain.handle('crossmgr:send', async (event, message) => {
      try {
        logger.debug('IPC: crossmgr:send', { message });
        const result = this.crossMgrController.sendMessage(message);
        return result;
      } catch (error) {
        logger.error('IPC crossmgr:send error:', error);
        return { success: false, error: error.message };
      }
    });

    logger.info('Gestionnaires IPC CrossMgr enregistrés');
  }

  /**
   * Nettoyer les gestionnaires
   */
  cleanup() {
    const handlers = [
      'crossmgr:start',
      'crossmgr:stop',
      'crossmgr:status',
      'crossmgr:send'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });

    logger.info('Gestionnaires IPC CrossMgr nettoyés');
  }
}

module.exports = CrossMgrIPCHandler;
