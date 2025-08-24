const logger = require('../utils/logger');
const raceBackupService = require('../services/raceBackupService');

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
      
      // Sauvegarde automatique JSON - passer les données de la course créée
      try {
        await raceBackupService.backupRaceWithData(race);
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON de la nouvelle course', {
          raceId: race.id,
          error: backupError.message
        });
      }
      
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
      // Récupérer l'ancien nom de la course avant la mise à jour
      const oldRace = await this.raceService.getRaceById(raceId);
      const oldRaceName = oldRace ? oldRace.name : null;
      
      const race = await this.raceService.updateRace(raceId, updateData);
      
      // Sauvegarde automatique JSON avec gestion du changement de nom
      try {
        await raceBackupService.backupRace(raceId, oldRaceName);
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON de la course mise à jour', {
          raceId: raceId,
          error: backupError.message
        });
      }
      
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
      // Récupérer le nom de la course avant suppression
      const race = await this.raceService.getRaceById(raceId);
      const raceName = race ? race.name : null;
      
      const result = await this.raceService.deleteRace(raceId);
      
      // Supprimer le fichier de sauvegarde JSON
      if (raceName) {
        try {
          await raceBackupService.deleteRaceBackup(raceName);
        } catch (backupError) {
          logger.warn('Erreur lors de la suppression du fichier de sauvegarde JSON', {
            raceName: raceName,
            error: backupError.message
          });
        }
      }
      
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
      
      // Sauvegarder automatiquement dans le fichier JSON
      try {
        await raceBackupService.backupRace(raceId);
        logger.info('Sauvegarde JSON effectuée après changement de statut', {
          raceId: raceId,
          newStatus: newStatus
        });
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON après changement de statut', {
          raceId: raceId,
          error: backupError.message
        });
      }
      
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
      
      // Sauvegarder automatiquement dans le fichier JSON pour la nouvelle course
      if (race && race.id) {
        try {
          await raceBackupService.backupRaceWithData(race.id);
          logger.info('Sauvegarde JSON effectuée après duplication de course', {
            originalRaceId: raceId,
            newRaceId: race.id,
            newRaceName: race.name
          });
        } catch (backupError) {
          logger.warn('Erreur lors de la sauvegarde JSON après duplication de course', {
            raceId: race.id,
            error: backupError.message
          });
        }
      }
      
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

  /**
   * Mettre à jour le statut d'une course
   */
  async updateStatus(raceId, status) {
    try {
      const result = await this.raceService.updateRaceStatus(raceId, status);
      
      // Sauvegarde automatique JSON après changement de statut
      try {
        await raceBackupService.backupRace(raceId);
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON après changement de statut', {
          raceId: raceId,
          status: status,
          error: backupError.message
        });
      }
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('RaceController.updateStatus:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = RaceController;
