const { ipcMain } = require('electron');
const { getBackendInstance } = require('../index');
const logger = require('../utils/logger');

class AppIPCHandler {
  constructor() {
    this.registerHandlers();
  }

  registerHandlers() {
        // Ping du backend pour vérifier la connexion
    ipcMain.handle('app:ping', async (event) => {
      try {
        return { 
          success: true, 
          data: { 
            backend: true,
            timestamp: Date.now() 
          } 
        };
      } catch (error) {
        logger.error('Erreur lors du ping backend:', error);
        return { success: false, error: error.message };
      }
    });

    // DIAGNOSTIC: Signal de réception des événements CrossMgr côté frontend
    ipcMain.handle('debug:frontend-received-crossmgr', async (event, data) => {
      try {
        logger.info('🎯 DIAGNOSTIC: Frontend a reçu un événement CrossMgr!', { 
          timestamp: data.timestamp, 
          epcTag: data.data?.epcTag,
          passingTime: data.data?.passingTime 
        });
        return { success: true };
      } catch (error) {
        logger.error('Erreur lors du diagnostic frontend:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir l'état du backend
    ipcMain.handle('app:getBackendStatus', async (event) => {
      try {
        const backend = getBackendInstance();
        return { success: true, data: backend.getStatus() };
      } catch (error) {
        logger.error('Erreur lors de la récupération du statut backend:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir les statistiques de l'application
    ipcMain.handle('app:getStats', async (event) => {
      try {
        const backend = getBackendInstance();
        const stats = await backend.getStats();
        return { success: true, data: stats };
      } catch (error) {
        logger.error('Erreur lors de la récupération des statistiques:', error);
        return { success: false, error: error.message };
      }
    });

    // Créer une sauvegarde
    ipcMain.handle('app:createBackup', async (event, backupPath = null) => {
      try {
        const backend = getBackendInstance();
        const backup = await backend.createBackup(backupPath);
        return { success: true, data: backup };
      } catch (error) {
        logger.error('Erreur lors de la création de sauvegarde:', error);
        return { success: false, error: error.message };
      }
    });

    // Restaurer une sauvegarde
    ipcMain.handle('app:restoreBackup', async (event, backupPath) => {
      try {
        const backend = getBackendInstance();
        const result = await backend.restoreBackup(backupPath);
        return { success: true, data: result };
      } catch (error) {
        logger.error('Erreur lors de la restauration:', error);
        return { success: false, error: error.message };
      }
    });

    // Redémarrer le backend
    ipcMain.handle('app:restartBackend', async (event) => {
      try {
        const backend = getBackendInstance();
        await backend.restart();
        return { success: true, message: 'Backend redémarré avec succès' };
      } catch (error) {
        logger.error('Erreur lors du redémarrage du backend:', error);
        return { success: false, error: error.message };
      }
    });

    // API de compatibilité pour l'ancien système
    // (Permet de migrer progressivement du store vers la base de données)
    
    // Obtenir toutes les courses (compatible avec l'ancien système)
    ipcMain.handle('race:getAllCompat', async (event) => {
      try {
        const backend = getBackendInstance();
        const controllers = backend.getControllers();
        const result = await controllers.race.getAllRaces({ includeStats: true });
        
        if (result.success) {
          // Convertir au format attendu par le frontend
          const races = result.data.map(race => ({
            id: race.id,
            name: race.name,
            date: race.date,
            time: race.time,
            location: race.location,
            type: race.type,
            status: race.status,
            participants: race.stats?.participants || 0
          }));
          
          return { success: true, data: races };
        }
        
        return result;
      } catch (error) {
        logger.error('Erreur dans race:getAllCompat:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir les participants d'une course (compatible)
    ipcMain.handle('participants:getByRaceCompat', async (event, raceId) => {
      try {
        const backend = getBackendInstance();
        const controllers = backend.getControllers();
        const result = await controllers.participant.getParticipantsByRace(raceId);
        
        if (result.success) {
          // Convertir au format attendu par le frontend
          const participants = result.data.map(participant => ({
            id: participant.id,
            number: participant.number,
            name: participant.name,
            email: participant.email,
            team: participant.team,
            category: participant.category,
            birthYear: participant.birthYear,
            status: 'registered' // Par défaut
          }));
          
          return { success: true, data: participants };
        }
        
        return result;
      } catch (error) {
        logger.error('Erreur dans participants:getByRaceCompat:', error);
        return { success: false, error: error.message };
      }
    });

    // Obtenir les données de chronométrage (compatible)
    ipcMain.handle('timing:getByRaceCompat', async (event, raceId) => {
      try {
        const backend = getBackendInstance();
        const controllers = backend.getControllers();
        const result = await controllers.timing.getTimingDataByRace(raceId);
        
        if (result.success) {
          // Convertir au format attendu par le frontend
          const timingData = result.data.map(timing => ({
            id: timing.id,
            participantId: timing.participantId,
            participantName: timing.participantName,
            number: timing.bibNumber,
            status: timing.status,
            startTime: timing.startTime,
            finishTime: timing.finishTime,
            totalTime: timing.totalTime,
            position: timing.position,
            team: timing.participantTeam
          }));
          
          return { success: true, data: timingData };
        }
        
        return result;
      } catch (error) {
        logger.error('Erreur dans timing:getByRaceCompat:', error);
        return { success: false, error: error.message };
      }
    });

    logger.info('Gestionnaires IPC de l\'application enregistrés');
  }

  unregisterHandlers() {
    const handlers = [
      'app:getBackendStatus', 'app:getStats', 'app:createBackup', 
      'app:restoreBackup', 'app:restartBackend', 'race:getAllCompat',
      'participants:getByRaceCompat', 'timing:getByRaceCompat', 'app:ping'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = AppIPCHandler;
