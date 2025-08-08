const { validateRace, validateRaceUpdate } = require('../utils/validation');
const logger = require('../utils/logger');
const { RACE_STATUS, RACE_TYPES } = require('../utils/constants');

class RaceService {
  constructor(models) {
    this.raceModel = models.race;
    this.participantModel = models.participant;
    this.timingDataModel = models.timingData;
  }

  /**
   * Créer une nouvelle course
   */
  async createRace(raceData) {
    try {
      // Validation des données
      const { error, value } = validateRace(raceData);
      if (error) {
        throw new Error(`Erreur de validation: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Créer la course
      const race = this.raceModel.create(value);
      if (!race) {
        throw new Error('Échec de la création de la course');
      }

      logger.info(`Course créée: ${race.name} (${race.id})`);
      return race;
    } catch (error) {
      logger.error('Erreur lors de la création de la course:', error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les courses
   */
  async getAllRaces(options = {}) {
    try {
      const races = this.raceModel.findAll(options);
      
      // Enrichir avec les statistiques si demandé
      if (options.includeStats) {
        return Promise.all(races.map(async race => ({
          ...race,
          stats: await this.getRaceStats(race.id)
        })));
      }

      return races;
    } catch (error) {
      logger.error('Erreur lors de la récupération des courses:', error);
      throw error;
    }
  }

  /**
   * Obtenir une course par ID
   */
  async getRaceById(raceId, includeStats = false) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      if (includeStats) {
        race.stats = await this.getRaceStats(raceId);
      }

      return race;
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour une course
   */
  async updateRace(raceId, updateData) {
    try {
      // Validation des données
      const { error, value } = validateRaceUpdate(updateData);
      if (error) {
        throw new Error(`Erreur de validation: ${error.details.map(d => d.message).join(', ')}`);
      }

      const race = this.raceModel.update(raceId, value);
      if (!race) {
        throw new Error('Course non trouvée ou échec de la mise à jour');
      }

      logger.info(`Course mise à jour: ${race.name} (${race.id})`);
      return race;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer une course
   */
  async deleteRace(raceId) {
    try {
      const race = await this.getRaceById(raceId);
      
      // Vérifier si la course peut être supprimée
      if (!this.raceModel.canDelete(raceId)) {
        throw new Error('La course ne peut pas être supprimée car elle contient des données de chronométrage');
      }

      const success = this.raceModel.delete(raceId);
      if (!success) {
        throw new Error('Échec de la suppression de la course');
      }

      logger.info(`Course supprimée: ${race.name} (${race.id})`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Changer le statut d'une course
   */
  async changeRaceStatus(raceId, newStatus) {
    try {
      const race = this.raceModel.updateStatus(raceId, newStatus);
      if (!race) {
        throw new Error('Course non trouvée ou transition de statut invalide');
      }

      // Actions spécifiques selon le nouveau statut
      switch (newStatus) {
        case RACE_STATUS.READY:
          await this.prepareRaceForStart(raceId);
          break;
        case RACE_STATUS.IN_PROGRESS:
          await this.startRace(raceId);
          break;
        case RACE_STATUS.COMPLETED:
          await this.finishRace(raceId);
          break;
      }

      logger.info(`Statut de la course changé: ${race.name} -> ${newStatus}`);
      return race;
    } catch (error) {
      logger.error(`Erreur lors du changement de statut de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Préparer une course pour le démarrage
   */
  async prepareRaceForStart(raceId) {
    try {
      // Initialiser les données de chronométrage pour tous les participants
      const timings = this.timingDataModel.initializeRaceTimings(raceId);
      logger.info(`Données de chronométrage initialisées pour ${timings.length} participants`);
      
      return timings;
    } catch (error) {
      logger.error(`Erreur lors de la préparation de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Démarrer une course
   */
  async startRace(raceId) {
    try {
      const race = await this.getRaceById(raceId);
      logger.info(`Course démarrée: ${race.name}`);
      
      // Ici, on pourrait ajouter d'autres actions comme :
      // - Envoyer des notifications
      // - Démarrer des timers automatiques
      // - Initialiser des connexions avec des systèmes externes
      
      return race;
    } catch (error) {
      logger.error(`Erreur lors du démarrage de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Terminer une course
   */
  async finishRace(raceId) {
    try {
      const race = await this.getRaceById(raceId);
      
      // Calculer les positions finales
      const updatedCount = this.timingDataModel.calculatePositions(raceId);
      
      logger.info(`Course terminée: ${race.name} - ${updatedCount} positions calculées`);
      return race;
    } catch (error) {
      logger.error(`Erreur lors de la finalisation de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'une course
   */
  async getRaceStats(raceId) {
    try {
      const raceStats = this.raceModel.getStats(raceId);
      const timingStats = this.timingDataModel.getRaceStats(raceId);
      
      return {
        ...raceStats,
        timing: timingStats
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Dupliquer une course
   */
  async duplicateRace(raceId, newRaceData = {}) {
    try {
      const originalRace = await this.getRaceById(raceId);
      
      const raceData = {
        ...originalRace,
        ...newRaceData,
        name: newRaceData.name || `${originalRace.name} (Copie)`,
        status: RACE_STATUS.DRAFT
      };

      // Supprimer les champs qui ne doivent pas être copiés
      delete raceData.id;
      delete raceData.createdAt;
      delete raceData.updatedAt;

      const newRace = await this.createRace(raceData);

      // Dupliquer les participants si demandé
      if (newRaceData.includeParticipants) {
        const duplicatedParticipants = this.participantModel.duplicateToRace(
          raceId, 
          newRace.id
        );
        logger.info(`${duplicatedParticipants.length} participants dupliqués`);
      }

      logger.info(`Course dupliquée: ${originalRace.name} -> ${newRace.name}`);
      return newRace;
    } catch (error) {
      logger.error(`Erreur lors de la duplication de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Rechercher des courses
   */
  async searchRaces(searchTerm, options = {}) {
    try {
      const allRaces = this.raceModel.findAll(options);
      
      if (!searchTerm) {
        return allRaces;
      }

      const searchTermLower = searchTerm.toLowerCase();
      const filtered = allRaces.filter(race => 
        race.name.toLowerCase().includes(searchTermLower) ||
        (race.location && race.location.toLowerCase().includes(searchTermLower)) ||
        (race.description && race.description.toLowerCase().includes(searchTermLower))
      );

      return filtered;
    } catch (error) {
      logger.error('Erreur lors de la recherche de courses:', error);
      throw error;
    }
  }

  /**
   * Obtenir les courses récentes
   */
  async getRecentRaces(limit = 10) {
    try {
      return this.raceModel.findAll({
        orderBy: 'updatedAt',
        order: 'DESC',
        limit
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des courses récentes:', error);
      throw error;
    }
  }

  /**
   * Obtenir les courses à venir
   */
  async getUpcomingRaces(limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];
      return this.raceModel.findAll({
        dateFrom: today,
        orderBy: 'date',
        order: 'ASC',
        limit
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des courses à venir:', error);
      throw error;
    }
  }

  /**
   * Obtenir les courses par type
   */
  async getRacesByType(type, options = {}) {
    try {
      return this.raceModel.findAll({
        ...options,
        type
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des courses de type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Valider qu'une course peut être supprimée
   */
  async canDeleteRace(raceId) {
    try {
      return this.raceModel.canDelete(raceId);
    } catch (error) {
      logger.error(`Erreur lors de la validation de suppression de la course ${raceId}:`, error);
      return false;
    }
  }

  /**
   * Réinitialiser une course (supprimer toutes les données de timing)
   */
  async resetRace(raceId) {
    try {
      const race = await this.getRaceById(raceId);
      
      if (race.status === RACE_STATUS.IN_PROGRESS) {
        throw new Error('Impossible de réinitialiser une course en cours');
      }

      // Supprimer toutes les données de timing
      const deletedCount = this.timingDataModel.deleteByRace(raceId);
      
      // Remettre le statut à "ready" ou "draft"
      const newStatus = race.status === RACE_STATUS.COMPLETED ? RACE_STATUS.READY : race.status;
      await this.changeRaceStatus(raceId, newStatus);

      logger.info(`Course réinitialisée: ${race.name} - ${deletedCount} données de timing supprimées`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation de la course ${raceId}:`, error);
      throw error;
    }
  }
}

module.exports = RaceService;
