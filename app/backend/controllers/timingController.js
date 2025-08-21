const logger = require('../utils/logger');
const raceBackupService = require('../services/raceBackupService');

class TimingController {
  constructor(services) {
    this.timingService = services.timing;
    this.raceService = services.race;
  }

  /**
   * Méthode helper pour sauvegarder automatiquement les données de timing
   */
  async _backupTimingData(raceId) {
    if (raceId) {
      try {
        await raceBackupService.updateTimingData(raceId);
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON des données de chronométrage', {
          raceId: raceId,
          error: backupError.message
        });
      }
    }
  }

  /**
   * Initialiser le chronométrage pour une course
   */
  async initializeRaceTiming(raceId) {
    try {
      const result = await this.timingService.initializeRaceTiming(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.initializeRaceTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Démarrer une course avec chronométrage
   * Cette méthode unifie: changement de statut + initialisation + démarrage masse
   */
  async startRaceWithTiming(raceId) {
    try {
      // 1. Changer le statut de la course à "in_progress"
      logger.info(`Démarrage complet de la course ${raceId}`);
      const raceResult = await this.raceService.changeRaceStatus(raceId, 'in_progress');
      
      // 2. Initialiser le chronométrage (envoie GT à CrossMgr)
      const timingResult = await this.timingService.initializeRaceTiming(raceId);
      
      // 3. Démarrer le chronométrage de masse
      const massTimingResult = await this.timingService.startMassTiming(raceId);
      
      // 4. Sauvegarde automatique JSON après toutes les opérations
      await this._backupTimingData(raceId);
      
      return { 
        success: true, 
        data: {
          race: raceResult,
          timing: timingResult,
          massStart: massTimingResult
        }
      };
    } catch (error) {
      logger.error('TimingController.startRaceWithTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les données de chronométrage d'une course
   */
  async getTimingDataByRace(raceId, options = {}) {
    try {
      const timingData = await this.timingService.getTimingDataByRace(raceId, options);
      return { success: true, data: timingData };
    } catch (error) {
      logger.error('TimingController.getTimingDataByRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les données de chronométrage par ID
   */
  async getTimingDataById(timingId) {
    try {
      const timingData = await this.timingService.getTimingDataById(timingId);
      return { success: true, data: timingData };
    } catch (error) {
      logger.error('TimingController.getTimingDataById:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Démarrer le chronométrage d'un participant
   */
  async startParticipantTiming(raceId, bibNumber, startTime = null) {
    try {
      const result = await this.timingService.startParticipantTiming(raceId, bibNumber, startTime);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.startParticipantTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Terminer le chronométrage d'un participant
   */
  async finishParticipantTiming(raceId, bibNumber, finishTime = null) {
    try {
      const result = await this.timingService.finishParticipantTiming(raceId, bibNumber, finishTime);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.finishParticipantTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marquer un participant comme DNS
   */
  async markParticipantDNS(raceId, bibNumber) {
    try {
      const result = await this.timingService.markParticipantDNS(raceId, bibNumber);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.markParticipantDNS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marquer un participant comme DNF
   */
  async markParticipantDNF(raceId, bibNumber) {
    try {
      const result = await this.timingService.markParticipantDNF(raceId, bibNumber);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.markParticipantDNF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajouter un passage intermédiaire
   */
  async addPassing(raceId, bibNumber, passingData) {
    try {
      const result = await this.timingService.addPassing(raceId, bibNumber, passingData);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.addPassing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculer les positions
   */
  async calculatePositions(raceId, category = null) {
    try {
      const result = await this.timingService.calculatePositions(raceId, category);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.calculatePositions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le classement
   */
  async getRanking(raceId, category = null) {
    try {
      const ranking = await this.timingService.getRanking(raceId, category);
      return { success: true, data: ranking };
    } catch (error) {
      logger.error('TimingController.getRanking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques de chronométrage
   */
  async getTimingStats(raceId) {
    try {
      const stats = await this.timingService.getTimingStats(raceId);
      return { success: true, data: stats };
    } catch (error) {
      logger.error('TimingController.getTimingStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Démarrage de masse
   */
  async startMassTiming(raceId, startTime = null) {
    try {
      const result = await this.timingService.startMassTiming(raceId, startTime);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.startMassTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les participants en course
   */
  async getRunningParticipants(raceId) {
    try {
      const participants = await this.timingService.getRunningParticipants(raceId);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('TimingController.getRunningParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les participants terminés
   */
  async getFinishedParticipants(raceId) {
    try {
      const participants = await this.timingService.getFinishedParticipants(raceId);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('TimingController.getFinishedParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter les résultats
   */
  async exportTimingResults(raceId, options = {}) {
    try {
      const result = await this.timingService.exportTimingResults(raceId, options);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.exportTimingResults:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser le chronométrage d'un participant
   */
  async resetParticipantTiming(raceId, bibNumber) {
    try {
      const result = await this.timingService.resetParticipantTiming(raceId, bibNumber);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.resetParticipantTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser tout le chronométrage d'une course
   */
  async resetRaceTiming(raceId) {
    try {
      const result = await this.timingService.resetRaceTiming(raceId);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.resetRaceTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les passages d'un participant
   */
  async getParticipantPassings(raceId, bibNumber) {
    try {
      const passings = await this.timingService.getParticipantPassings(raceId, bibNumber);
      return { success: true, data: passings };
    } catch (error) {
      logger.error('TimingController.getParticipantPassings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le temps en cours d'un participant
   */
  async getParticipantCurrentTime(raceId, bibNumber) {
    try {
      const currentTime = await this.timingService.getParticipantCurrentTime(raceId, bibNumber);
      return { success: true, data: currentTime };
    } catch (error) {
      logger.error('TimingController.getParticipantCurrentTime:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier les conditions de fin de course
   */
  async checkRaceFinishConditions(raceId) {
    try {
      const result = await this.timingService.checkRaceFinishConditions(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.checkRaceFinishConditions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Terminer automatiquement une course
   */
  async autoFinishRace(raceId, reason) {
    try {
      const result = await this.timingService.autoFinishRace(raceId, reason);
      
      // Sauvegarde automatique JSON
      await this._backupTimingData(raceId);
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.autoFinishRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Méthode privée pour déclencher la sauvegarde automatique après modification des données de chronométrage
   */
  async _backupTimingData(raceId) {
    try {
      const raceBackupService = require('../services/raceBackupService');
      await raceBackupService.backupRace(raceId);
    } catch (error) {
      logger.error('TimingController._backupTimingData:', error);
    }
  }
}

module.exports = TimingController;
