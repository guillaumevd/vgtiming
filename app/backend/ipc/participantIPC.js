const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class ParticipantIPCHandler {
  constructor(controllers) {
    this.participantController = controllers.participant;
    this.registerHandlers();
  }

  registerHandlers() {
    // Créer un participant
    ipcMain.handle('participant:create', async (event, data) => {
      logger.debug('IPC: participant:create', data);
      return await this.participantController.createParticipant(data);
    });

    // Créer plusieurs participants en lot
    ipcMain.handle('participant:createBatch', async (event, participants) => {
      logger.debug('IPC: participant:createBatch', { count: participants?.length });
      return await this.participantController.createParticipantsBatch(participants);
    });

    // Obtenir les participants d'une course
    ipcMain.handle('participant:getByRace', async (event, raceId, options = {}) => {
      logger.debug('IPC: participant:getByRace', { raceId, options });
      return await this.participantController.getParticipantsByRace(raceId, options);
    });

    // Obtenir un participant par ID
    ipcMain.handle('participant:getById', async (event, participantId) => {
      logger.debug('IPC: participant:getById', { participantId });
      return await this.participantController.getParticipantById(participantId);
    });

    // Mettre à jour un participant
    ipcMain.handle('participant:update', async (event, participantId, updateData) => {
      logger.debug('IPC: participant:update', { participantId, updateData });
      return await this.participantController.updateParticipant(participantId, updateData);
    });

    // Supprimer un participant
    ipcMain.handle('participant:delete', async (event, participantId) => {
      logger.debug('IPC: participant:delete', { participantId });
      return await this.participantController.deleteParticipant(participantId);
    });

    // Supprimer tous les participants d'une course
    ipcMain.handle('participant:deleteAll', async (event, raceId) => {
      logger.debug('IPC: participant:deleteAll', { raceId });
      return await this.participantController.deleteAllParticipants(raceId);
    });

    // Rechercher des participants
    ipcMain.handle('participant:search', async (event, searchTerm, raceId = null) => {
      logger.debug('IPC: participant:search', { searchTerm, raceId });
      return await this.participantController.searchParticipants(searchTerm, raceId);
    });

    // Obtenir les statistiques des participants
    ipcMain.handle('participant:getStats', async (event, raceId) => {
      logger.debug('IPC: participant:getStats', { raceId });
      return await this.participantController.getParticipantStats(raceId);
    });

    // Dupliquer les participants
    ipcMain.handle('participant:duplicate', async (event, sourceRaceId, targetRaceId) => {
      logger.debug('IPC: participant:duplicate', { sourceRaceId, targetRaceId });
      return await this.participantController.duplicateParticipants(sourceRaceId, targetRaceId);
    });

    // Importer depuis CSV
    ipcMain.handle('participant:importCSV', async (event, raceId, csvData) => {
      logger.debug('IPC: participant:importCSV', { raceId, dataLength: csvData?.length });
      return await this.participantController.importParticipantsFromCSV(raceId, csvData);
    });

    // Exporter vers CSV
    ipcMain.handle('participant:exportCSV', async (event, raceId, options = {}) => {
      logger.debug('IPC: participant:exportCSV', { raceId, options });
      return await this.participantController.exportParticipantsToCSV(raceId, options);
    });

    // Obtenir le prochain numéro disponible
    ipcMain.handle('participant:getNextNumber', async (event, raceId) => {
      logger.debug('IPC: participant:getNextNumber', { raceId });
      return await this.participantController.getNextAvailableNumber(raceId);
    });

    // Vérifier la disponibilité d'un numéro
    ipcMain.handle('participant:isNumberAvailable', async (event, raceId, number) => {
      logger.debug('IPC: participant:isNumberAvailable', { raceId, number });
      return await this.participantController.isNumberAvailable(raceId, number);
    });

    // Réorganiser les numéros
    ipcMain.handle('participant:renumber', async (event, raceId, startNumber = 1) => {
      logger.debug('IPC: participant:renumber', { raceId, startNumber });
      return await this.participantController.renumberParticipants(raceId, startNumber);
    });

    // Obtenir par catégorie
    ipcMain.handle('participant:getByCategory', async (event, raceId, category) => {
      logger.debug('IPC: participant:getByCategory', { raceId, category });
      return await this.participantController.getParticipantsByCategory(raceId, category);
    });

    // Obtenir par équipe
    ipcMain.handle('participant:getByTeam', async (event, raceId, team) => {
      logger.debug('IPC: participant:getByTeam', { raceId, team });
      return await this.participantController.getParticipantsByTeam(raceId, team);
    });
  }

  unregisterHandlers() {
    const handlers = [
      'participant:create', 'participant:createBatch', 'participant:getByRace',
      'participant:getById', 'participant:update', 'participant:delete',
      'participant:deleteAll', 'participant:search', 'participant:getStats',
      'participant:duplicate', 'participant:importCSV', 'participant:exportCSV',
      'participant:getNextNumber', 'participant:isNumberAvailable',
      'participant:renumber', 'participant:getByCategory', 'participant:getByTeam'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = ParticipantIPCHandler;
