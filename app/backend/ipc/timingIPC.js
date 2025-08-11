const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class TimingIPCHandler {
  constructor(controllers) {
    this.timingController = controllers.timing;
    this.registerHandlers();
  }

  registerHandlers() {
    // Initialiser le chronométrage
    ipcMain.handle('timing:initialize', async (event, raceId) => {
      logger.debug('IPC: timing:initialize', { raceId });
      return await this.timingController.initializeRaceTiming(raceId);
    });

    // Démarrer une course avec chronométrage complet
    ipcMain.handle('timing:startRace', async (event, raceId) => {
      logger.debug('IPC: timing:startRace', { raceId });
      return await this.timingController.startRaceWithTiming(raceId);
    });

    // Obtenir les données de chronométrage d'une course
    ipcMain.handle('timing:getByRace', async (event, raceId, options = {}) => {
      logger.debug('IPC: timing:getByRace', { raceId, options });
      return await this.timingController.getTimingDataByRace(raceId, options);
    });

    // Obtenir les données par ID
    ipcMain.handle('timing:getById', async (event, timingId) => {
      logger.debug('IPC: timing:getById', { timingId });
      return await this.timingController.getTimingDataById(timingId);
    });

    // Démarrer le chronométrage d'un participant
    ipcMain.handle('timing:start', async (event, raceId, bibNumber, startTime = null) => {
      logger.debug('IPC: timing:start', { raceId, bibNumber, startTime });
      return await this.timingController.startParticipantTiming(raceId, bibNumber, startTime);
    });

    // Terminer le chronométrage d'un participant
    ipcMain.handle('timing:finish', async (event, raceId, bibNumber, finishTime = null) => {
      logger.debug('IPC: timing:finish', { raceId, bibNumber, finishTime });
      return await this.timingController.finishParticipantTiming(raceId, bibNumber, finishTime);
    });

    // Marquer DNS
    ipcMain.handle('timing:markDNS', async (event, raceId, bibNumber) => {
      logger.debug('IPC: timing:markDNS', { raceId, bibNumber });
      return await this.timingController.markParticipantDNS(raceId, bibNumber);
    });

    // Marquer DNF
    ipcMain.handle('timing:markDNF', async (event, raceId, bibNumber) => {
      logger.debug('IPC: timing:markDNF', { raceId, bibNumber });
      return await this.timingController.markParticipantDNF(raceId, bibNumber);
    });

    // Ajouter un passage
    ipcMain.handle('timing:addPassing', async (event, raceId, bibNumber, passingData) => {
      logger.debug('IPC: timing:addPassing', { raceId, bibNumber, passingData });
      return await this.timingController.addPassing(raceId, bibNumber, passingData);
    });

    // Calculer les positions
    ipcMain.handle('timing:calculatePositions', async (event, raceId, category = null) => {
      logger.debug('IPC: timing:calculatePositions', { raceId, category });
      return await this.timingController.calculatePositions(raceId, category);
    });

    // Obtenir le classement
    ipcMain.handle('timing:getRanking', async (event, raceId, category = null) => {
      logger.debug('IPC: timing:getRanking', { raceId, category });
      return await this.timingController.getRanking(raceId, category);
    });

    // Obtenir les statistiques
    ipcMain.handle('timing:getStats', async (event, raceId) => {
      logger.debug('IPC: timing:getStats', { raceId });
      return await this.timingController.getTimingStats(raceId);
    });

    // Démarrage de masse
    ipcMain.handle('timing:startMass', async (event, raceId, startTime = null) => {
      logger.debug('IPC: timing:startMass', { raceId, startTime });
      return await this.timingController.startMassTiming(raceId, startTime);
    });

    // Obtenir les participants en course
    ipcMain.handle('timing:getRunning', async (event, raceId) => {
      logger.debug('IPC: timing:getRunning', { raceId });
      return await this.timingController.getRunningParticipants(raceId);
    });

    // Obtenir les participants terminés
    ipcMain.handle('timing:getFinished', async (event, raceId) => {
      logger.debug('IPC: timing:getFinished', { raceId });
      return await this.timingController.getFinishedParticipants(raceId);
    });

    // Exporter les résultats
    ipcMain.handle('timing:exportResults', async (event, raceId, options = {}) => {
      logger.debug('IPC: timing:exportResults', { raceId, options });
      return await this.timingController.exportTimingResults(raceId, options);
    });

    // Réinitialiser le chronométrage d'un participant
    ipcMain.handle('timing:resetParticipant', async (event, raceId, bibNumber) => {
      logger.debug('IPC: timing:resetParticipant', { raceId, bibNumber });
      return await this.timingController.resetParticipantTiming(raceId, bibNumber);
    });

    // Réinitialiser le chronométrage de la course
    ipcMain.handle('timing:resetRace', async (event, raceId) => {
      logger.debug('IPC: timing:resetRace', { raceId });
      return await this.timingController.resetRaceTiming(raceId);
    });

    // Obtenir les passages d'un participant
    ipcMain.handle('timing:getPassings', async (event, raceId, bibNumber) => {
      logger.debug('IPC: timing:getPassings', { raceId, bibNumber });
      return await this.timingController.getParticipantPassings(raceId, bibNumber);
    });

    // Obtenir le temps en cours
    ipcMain.handle('timing:getCurrentTime', async (event, raceId, bibNumber) => {
      logger.debug('IPC: timing:getCurrentTime', { raceId, bibNumber });
      return await this.timingController.getParticipantCurrentTime(raceId, bibNumber);
    });
  }

  unregisterHandlers() {
    const handlers = [
      'timing:initialize', 'timing:getByRace', 'timing:getById', 'timing:start',
      'timing:finish', 'timing:markDNS', 'timing:markDNF', 'timing:addPassing',
      'timing:calculatePositions', 'timing:getRanking', 'timing:getStats',
      'timing:startMass', 'timing:getRunning', 'timing:getFinished',
      'timing:exportResults', 'timing:resetParticipant', 'timing:resetRace',
      'timing:getPassings', 'timing:getCurrentTime'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = TimingIPCHandler;
