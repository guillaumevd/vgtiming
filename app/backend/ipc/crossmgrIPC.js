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
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter le handshake (première étape de connexion)
    service.on('handshake_received', (data) => {
      logger.debug('CrossMgr service: handshake received');
      this.notifyFrontend('crossmgr:handshake', data);
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter la vraie connexion établie (message GT confirmé)
    service.on('connection_established', (data) => {
      logger.debug('CrossMgr service: true connection established via GT message');
      logger.debug('About to send crossmgr:connection_established event to frontend');
      this.notifyFrontend('crossmgr:connection_established', { established: true, data });
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter les messages de timing
    service.on('timing_message', (data) => {
      logger.debug('CrossMgr service: timing message received');
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter les données JSON
    service.on('timing_data', (data) => {
      logger.debug('CrossMgr service: timing data received');
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter les passages de participants
    service.on('participant_passing', (data) => {
      logger.debug('CrossMgr service: participant passing detected');
      this.notifyFrontend('crossmgr:message', data);
      // Pas de message automatique - géré par sendLogToApp du service
    });

    // Écouter les messages envoyés par VG-Timing
    service.on('message_sent', (data) => {
      logger.debug('CrossMgr service: message sent');
      // Pas de message automatique pour les réponses - éviter la pollution du journal
    });

    // Écouter les déconnexions
    service.on('disconnected', (data) => {
      logger.debug('CrossMgr service: client disconnected');
      this.notifyFrontend('crossmgr:disconnected', data);
      // Pas de message automatique - géré par sendLogToApp du service
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
