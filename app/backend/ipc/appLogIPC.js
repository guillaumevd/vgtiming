const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class AppLogIPCHandler {
  constructor(controllers, mainWindow) {
    this.mainWindow = mainWindow;
    
    // Obtenir le service de logs
    if (controllers._serviceFactory && typeof controllers._serviceFactory.getAppLogService === 'function') {
      this.appLogService = controllers._serviceFactory.getAppLogService();
    } else {
      // Fallback - chercher dans les services
      this.appLogService = controllers.crossmgr?.services?.appLog;
    }
    
    this.registerHandlers();
    this.setupEventListeners();
  }

  /**
   * Configurer les listeners d'événements du service de logs
   */
  setupEventListeners() {
    if (!this.appLogService) {
      logger.warn('Service de logs d\'application non disponible');
      return;
    }

    // Écouter les nouveaux logs pour les transmettre au frontend
    this.appLogService.on('log_added', (logEntry) => {
      this.notifyFrontend('app-log:new', logEntry);
    });

    // Écouter l'effacement des logs
    this.appLogService.on('logs_cleared', () => {
      this.notifyFrontend('app-log:cleared');
    });

    logger.debug('Listeners d\'événements de logs configurés');
  }

  /**
   * Notifier le frontend via IPC
   */
  notifyFrontend(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  registerHandlers() {
    // Obtenir tous les logs
    ipcMain.handle('app-log:getAll', async (event) => {
      try {
        if (!this.appLogService) {
          return { success: false, error: 'Service de logs non disponible' };
        }
        
        const logs = this.appLogService.getLogs();
        return { success: true, data: logs };
      } catch (error) {
        logger.error('IPC app-log:getAll error:', error);
        return { success: false, error: error.message };
      }
    });

    // Ajouter un log
    ipcMain.handle('app-log:add', async (event, { message, level, category, metadata }) => {
      try {
        if (!this.appLogService) {
          return { success: false, error: 'Service de logs non disponible' };
        }
        
        this.appLogService.addLog(message, level, category, metadata);
        return { success: true };
      } catch (error) {
        logger.error('IPC app-log:add error:', error);
        return { success: false, error: error.message };
      }
    });

    // Effacer tous les logs
    ipcMain.handle('app-log:clear', async (event) => {
      try {
        if (!this.appLogService) {
          return { success: false, error: 'Service de logs non disponible' };
        }
        
        this.appLogService.clearLogs();
        return { success: true };
      } catch (error) {
        logger.error('IPC app-log:clear error:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir les logs par catégorie
    ipcMain.handle('app-log:getByCategory', async (event, category) => {
      try {
        if (!this.appLogService) {
          return { success: false, error: 'Service de logs non disponible' };
        }
        
        const logs = this.appLogService.getLogsByCategory(category);
        return { success: true, data: logs };
      } catch (error) {
        logger.error('IPC app-log:getByCategory error:', error);
        return { success: false, error: error.message };
      }
    });

    logger.info('Gestionnaires IPC de logs d\'application enregistrés');
  }

  /**
   * Nettoyer les gestionnaires
   */
  cleanup() {
    const handlers = [
      'app-log:getAll',
      'app-log:add',
      'app-log:clear',
      'app-log:getByCategory'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });

    logger.info('Gestionnaires IPC de logs d\'application nettoyés');
  }
}

module.exports = AppLogIPCHandler;
