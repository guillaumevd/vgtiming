const logger = require('../utils/logger');

class RaceController {
  constructor(services) {
    this.raceService = services.race;
  }

  /**
   * Créer une nouvelle course
   */
  async createRace(data) {
    try {
      const race = await this.raceService.createRace(data);
      return { success: true, data: race };
    } catch (error) {
      logger.error('RaceController.createRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir toutes les courses
   */
  async getAllRaces(options = {}) {
    try {
      const races = await this.raceService.getAllRaces(options);
      return { success: true, data: races };
    } catch (error) {
      logger.error('RaceController.getAllRaces:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir une course par ID
   */
  async getRaceById(raceId, includeStats = false) {
    try {
      const race = await this.raceService.getRaceById(raceId, includeStats);
      return { success: true, data: race };
    } catch (error) {
      logger.error('RaceController.getRaceById:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour une course
   */
  async updateRace(raceId, updateData) {
    try {
      const race = await this.raceService.updateRace(raceId, updateData);
      return { success: true, data: race };
    } catch (error) {
      logger.error('RaceController.updateRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une course
   */
  async deleteRace(raceId) {
    try {
      const result = await this.raceService.deleteRace(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('RaceController.deleteRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Changer le statut d'une course
   */
  async changeRaceStatus(raceId, newStatus) {
    try {
      const race = await this.raceService.changeRaceStatus(raceId, newStatus);
      return { success: true, data: race };
    } catch (error) {
      logger.error('RaceController.changeRaceStatus:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dupliquer une course
   */
  async duplicateRace(raceId, newRaceData = {}) {
    try {
      const race = await this.raceService.duplicateRace(raceId, newRaceData);
      return { success: true, data: race };
    } catch (error) {
      logger.error('RaceController.duplicateRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechercher des courses
   */
  async searchRaces(searchTerm, options = {}) {
    try {
      const races = await this.raceService.searchRaces(searchTerm, options);
      return { success: true, data: races };
    } catch (error) {
      logger.error('RaceController.searchRaces:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques d'une course
   */
  async getRaceStats(raceId) {
    try {
      const stats = await this.raceService.getRaceStats(raceId);
      return { success: true, data: stats };
    } catch (error) {
      logger.error('RaceController.getRaceStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les courses récentes
   */
  async getRecentRaces(limit = 10) {
    try {
      const races = await this.raceService.getRecentRaces(limit);
      return { success: true, data: races };
    } catch (error) {
      logger.error('RaceController.getRecentRaces:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les courses à venir
   */
  async getUpcomingRaces(limit = 10) {
    try {
      const races = await this.raceService.getUpcomingRaces(limit);
      return { success: true, data: races };
    } catch (error) {
      logger.error('RaceController.getUpcomingRaces:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser une course
   */
  async resetRace(raceId) {
    try {
      const result = await this.raceService.resetRace(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('RaceController.resetRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier si une course peut être supprimée
   */
  async canDeleteRace(raceId) {
    try {
      const canDelete = await this.raceService.canDeleteRace(raceId);
      return { success: true, data: canDelete };
    } catch (error) {
      logger.error('RaceController.canDeleteRace:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = RaceController;
