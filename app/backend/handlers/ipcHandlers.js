const { ipcMain } = require('electron');

/**
 * Handlers IPC pour les appels du frontend vers le backend
 */
class IPCHandlers {
  constructor(controllers) {
    this.controllers = controllers;
    this.registerHandlers();
  }

  registerHandlers() {
    // ===== APP HANDLERS =====
    
    // Ping pour vérifier que le backend est prêt
    ipcMain.handle('app:ping', async () => {
      try {
        return {
          success: true,
          data: {
            backend: true,
            timestamp: Date.now()
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Statut du backend
    ipcMain.handle('app:getBackendStatus', async () => {
      try {
        return {
          success: true,
          data: {
            backend: true,
            database: true,
            models: true,
            services: true,
            controllers: true
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // Statistiques de l'application
    ipcMain.handle('app:getStats', async () => {
      try {
        // Récupérer les stats via les services
        const raceController = this.controllers.getRaceController();
        const participantController = this.controllers.getParticipantController();
        
        // TODO: Implémenter les méthodes getCount dans les controllers
        return {
          success: true,
          data: {
            races: 0, // À implémenter
            participants: 0, // À implémenter
            timingRecords: 0, // À implémenter
            uptime: process.uptime() * 1000
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });

    // ===== RACE HANDLERS =====
    
    ipcMain.handle('race:getAll', async (event, options = {}) => {
      try {
        const raceController = this.controllers.getRaceController();
        const races = await raceController.getAllRaces(options);
        
        return {
          success: true,
          data: races
        };
      } catch (error) {
        console.error('IPC race:getAll error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('race:getById', async (event, raceId, includeStats = false) => {
      try {
        const raceController = this.controllers.getRaceController();
        const race = await raceController.getRaceById(raceId, includeStats);
        
        return {
          success: true,
          data: race
        };
      } catch (error) {
        console.error('IPC race:getById error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('race:create', async (event, raceData) => {
      try {
        const raceController = this.controllers.getRaceController();
        const newRace = await raceController.createRace(raceData);
        
        return {
          success: true,
          data: newRace
        };
      } catch (error) {
        console.error('IPC race:create error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('race:update', async (event, raceId, updateData) => {
      try {
        const raceController = this.controllers.getRaceController();
        const updatedRace = await raceController.updateRace(raceId, updateData);
        
        return {
          success: true,
          data: updatedRace
        };
      } catch (error) {
        console.error('IPC race:update error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('race:delete', async (event, raceId) => {
      try {
        const raceController = this.controllers.getRaceController();
        await raceController.deleteRace(raceId);
        
        return {
          success: true,
          data: true
        };
      } catch (error) {
        console.error('IPC race:delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('race:changeStatus', async (event, raceId, newStatus) => {
      try {
        const raceController = this.controllers.getRaceController();
        const updatedRace = await raceController.updateRace(raceId, { status: newStatus });
        
        return {
          success: true,
          data: updatedRace
        };
      } catch (error) {
        console.error('IPC race:changeStatus error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // ===== PARTICIPANT HANDLERS =====
    
    ipcMain.handle('participant:getByRace', async (event, raceId, options = {}) => {
      try {
        const participantController = this.controllers.getParticipantController();
        const participants = await participantController.getParticipantsByRace(raceId, options);
        
        return {
          success: true,
          data: participants
        };
      } catch (error) {
        console.error('IPC participant:getByRace error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('participant:create', async (event, participantData) => {
      try {
        const participantController = this.controllers.getParticipantController();
        const newParticipant = await participantController.createParticipant(participantData);
        
        return {
          success: true,
          data: newParticipant
        };
      } catch (error) {
        console.error('IPC participant:create error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('participant:update', async (event, participantId, updateData) => {
      try {
        const participantController = this.controllers.getParticipantController();
        const updatedParticipant = await participantController.updateParticipant(participantId, updateData);
        
        return {
          success: true,
          data: updatedParticipant
        };
      } catch (error) {
        console.error('IPC participant:update error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('participant:delete', async (event, participantId) => {
      try {
        const participantController = this.controllers.getParticipantController();
        await participantController.deleteParticipant(participantId);
        
        return {
          success: true,
          data: true
        };
      } catch (error) {
        console.error('IPC participant:delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // ===== TIMING HANDLERS =====
    
    ipcMain.handle('timing:getByRace', async (event, raceId, options = {}) => {
      try {
        const timingController = this.controllers.getTimingController();
        const timingData = await timingController.getTimingDataByRace(raceId, options);
        
        return {
          success: true,
          data: timingData
        };
      } catch (error) {
        console.error('IPC timing:getByRace error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    // ===== SETTINGS HANDLERS =====
    
    ipcMain.handle('settings:get', async (event, key) => {
      try {
        const settingsController = this.controllers.getSettingsController();
        const setting = await settingsController.getSetting(key);
        
        return {
          success: true,
          data: setting
        };
      } catch (error) {
        console.error('IPC settings:get error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    ipcMain.handle('settings:set', async (event, key, value, type = null, description = null) => {
      try {
        const settingsController = this.controllers.getSettingsController();
        const setting = await settingsController.setSetting(key, value, type, description);
        
        return {
          success: true,
          data: setting
        };
      } catch (error) {
        console.error('IPC settings:set error:', error);
        return {
          success: false,
          error: error.message
        };
      }
    });

    console.log('✅ All IPC handlers registered successfully');
  }

  // Méthode pour nettoyer les handlers
  removeAllHandlers() {
    ipcMain.removeAllListeners('app:ping');
    ipcMain.removeAllListeners('app:getBackendStatus');
    ipcMain.removeAllListeners('app:getStats');
    ipcMain.removeAllListeners('race:getAll');
    ipcMain.removeAllListeners('race:getById');
    ipcMain.removeAllListeners('race:create');
    ipcMain.removeAllListeners('race:update');
    ipcMain.removeAllListeners('race:delete');
    ipcMain.removeAllListeners('race:changeStatus');
    ipcMain.removeAllListeners('participant:getByRace');
    ipcMain.removeAllListeners('participant:create');
    ipcMain.removeAllListeners('participant:update');
    ipcMain.removeAllListeners('participant:delete');
    ipcMain.removeAllListeners('timing:getByRace');
    ipcMain.removeAllListeners('settings:get');
    ipcMain.removeAllListeners('settings:set');
    console.log('🧹 All IPC handlers removed');
  }
}

module.exports = IPCHandlers;
