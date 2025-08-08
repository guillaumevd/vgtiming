const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class RaceIPCHandler {
  constructor(controllers) {
    this.raceController = controllers.race;
    this.registerHandlers();
  }

  registerHandlers() {
    // Créer une course
    ipcMain.handle('race:create', async (event, data) => {
      logger.debug('IPC: race:create', data);
      return await this.raceController.createRace(data);
    });

    // Obtenir toutes les courses
    ipcMain.handle('race:getAll', async (event, options = {}) => {
      logger.debug('IPC: race:getAll', options);
      return await this.raceController.getAllRaces(options);
    });

    // Obtenir une course par ID
    ipcMain.handle('race:getById', async (event, raceId, includeStats = false) => {
      logger.debug('IPC: race:getById', { raceId, includeStats });
      return await this.raceController.getRaceById(raceId, includeStats);
    });

    // Mettre à jour une course
    ipcMain.handle('race:update', async (event, raceId, updateData) => {
      logger.debug('IPC: race:update', { raceId, updateData });
      return await this.raceController.updateRace(raceId, updateData);
    });

    // Supprimer une course
    ipcMain.handle('race:delete', async (event, raceId) => {
      logger.debug('IPC: race:delete', { raceId });
      return await this.raceController.deleteRace(raceId);
    });

    // Changer le statut d'une course
    ipcMain.handle('race:changeStatus', async (event, raceId, newStatus) => {
      logger.debug('IPC: race:changeStatus', { raceId, newStatus });
      return await this.raceController.changeRaceStatus(raceId, newStatus);
    });

    // Dupliquer une course
    ipcMain.handle('race:duplicate', async (event, raceId, newRaceData = {}) => {
      logger.debug('IPC: race:duplicate', { raceId, newRaceData });
      return await this.raceController.duplicateRace(raceId, newRaceData);
    });

    // Rechercher des courses
    ipcMain.handle('race:search', async (event, searchTerm, options = {}) => {
      logger.debug('IPC: race:search', { searchTerm, options });
      return await this.raceController.searchRaces(searchTerm, options);
    });

    // Obtenir les statistiques d'une course
    ipcMain.handle('race:getStats', async (event, raceId) => {
      logger.debug('IPC: race:getStats', { raceId });
      return await this.raceController.getRaceStats(raceId);
    });

    // Obtenir les courses récentes
    ipcMain.handle('race:getRecent', async (event, limit = 10) => {
      logger.debug('IPC: race:getRecent', { limit });
      return await this.raceController.getRecentRaces(limit);
    });

    // Obtenir les courses à venir
    ipcMain.handle('race:getUpcoming', async (event, limit = 10) => {
      logger.debug('IPC: race:getUpcoming', { limit });
      return await this.raceController.getUpcomingRaces(limit);
    });

    // Réinitialiser une course
    ipcMain.handle('race:reset', async (event, raceId) => {
      logger.debug('IPC: race:reset', { raceId });
      return await this.raceController.resetRace(raceId);
    });

    // Vérifier si une course peut être supprimée
    ipcMain.handle('race:canDelete', async (event, raceId) => {
      logger.debug('IPC: race:canDelete', { raceId });
      return await this.raceController.canDeleteRace(raceId);
    });
  }

  unregisterHandlers() {
    const handlers = [
      'race:create', 'race:getAll', 'race:getById', 'race:update', 
      'race:delete', 'race:changeStatus', 'race:duplicate', 'race:search',
      'race:getStats', 'race:getRecent', 'race:getUpcoming', 'race:reset',
      'race:canDelete'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = RaceIPCHandler;
