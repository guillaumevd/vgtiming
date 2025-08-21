const logger = require('../utils/logger');
const raceBackupService = require('../services/raceBackupService');

class ParticipantController {
  constructor(services) {
    this.participantService = services.participant;
  }

  /**
   * Créer un nouveau participant
   */
  async createParticipant(data) {
    try {
      const participant = await this.participantService.createParticipant(data);
      
      // Sauvegarde automatique JSON si le participant a un raceId
      if (participant.raceId) {
        try {
          await raceBackupService.backupRace(participant.raceId);
        } catch (backupError) {
          logger.warn('Erreur lors de la sauvegarde JSON après ajout de participant', {
            raceId: participant.raceId,
            participantId: participant.id,
            error: backupError.message
          });
        }
      }
      
      return { success: true, data: participant };
    } catch (error) {
      logger.error('ParticipantController.createParticipant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Créer plusieurs participants en lot
   */
  async createParticipantsBatch(participants) {
    try {
      const result = await this.participantService.createParticipantsBatch(participants);
      
      // Sauvegarde automatique JSON pour toutes les courses concernées
      const raceIds = [...new Set(participants.map(p => p.raceId).filter(id => id))];
      for (const raceId of raceIds) {
        try {
          await raceBackupService.backupRace(raceId);
        } catch (backupError) {
          logger.warn('Erreur lors de la sauvegarde JSON après ajout de participants en lot', {
            raceId: raceId,
            error: backupError.message
          });
        }
      }
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('ParticipantController.createParticipantsBatch:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir tous les participants d'une course
   */
  async getParticipantsByRace(raceId, options = {}) {
    try {
      const participants = await this.participantService.getParticipantsByRace(raceId, options);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.getParticipantsByRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir un participant par ID
   */
  async getParticipantById(participantId) {
    try {
      const participant = await this.participantService.getParticipantById(participantId);
      return { success: true, data: participant };
    } catch (error) {
      logger.error('ParticipantController.getParticipantById:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour un participant
   */
  async updateParticipant(participantId, updateData) {
    try {
      const participant = await this.participantService.updateParticipant(participantId, updateData);
      
      // Sauvegarde automatique JSON si le participant a un raceId
      if (participant.raceId) {
        try {
          await raceBackupService.backupRace(participant.raceId);
        } catch (backupError) {
          logger.warn('Erreur lors de la sauvegarde JSON après mise à jour de participant', {
            raceId: participant.raceId,
            participantId: participant.id,
            error: backupError.message
          });
        }
      }
      
      return { success: true, data: participant };
    } catch (error) {
      logger.error('ParticipantController.updateParticipant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer un participant
   */
  async deleteParticipant(participantId) {
    try {
      // Récupérer les infos du participant avant suppression pour avoir le raceId
      const participant = await this.participantService.getParticipantById(participantId);
      const raceId = participant ? participant.raceId : null;
      
      const result = await this.participantService.deleteParticipant(participantId);
      
      // Sauvegarde automatique JSON
      if (raceId) {
        try {
          await raceBackupService.backupRace(raceId);
        } catch (backupError) {
          logger.warn('Erreur lors de la sauvegarde JSON après suppression de participant', {
            raceId: raceId,
            participantId: participantId,
            error: backupError.message
          });
        }
      }
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('ParticipantController.deleteParticipant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer tous les participants d'une course
   */
  async deleteAllParticipants(raceId) {
    try {
      const result = await this.participantService.deleteAllParticipants(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('ParticipantController.deleteAllParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rechercher des participants
   */
  async searchParticipants(searchTerm, raceId = null) {
    try {
      const participants = await this.participantService.searchParticipants(searchTerm, raceId);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.searchParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques des participants
   */
  async getParticipantStats(raceId) {
    try {
      const stats = await this.participantService.getParticipantStats(raceId);
      return { success: true, data: stats };
    } catch (error) {
      logger.error('ParticipantController.getParticipantStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dupliquer les participants d'une course
   */
  async duplicateParticipants(sourceRaceId, targetRaceId) {
    try {
      const participants = await this.participantService.duplicateParticipants(sourceRaceId, targetRaceId);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.duplicateParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Importer des participants depuis CSV
   */
  async importParticipantsFromCSV(raceId, csvData) {
    try {
      const result = await this.participantService.importParticipantsFromCSV(raceId, csvData);
      return { success: true, data: result };
    } catch (error) {
      logger.error('ParticipantController.importParticipantsFromCSV:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter les participants vers CSV
   */
  async exportParticipantsToCSV(raceId, options = {}) {
    try {
      const result = await this.participantService.exportParticipantsToCSV(raceId, options);
      return { success: true, data: result };
    } catch (error) {
      logger.error('ParticipantController.exportParticipantsToCSV:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le prochain numéro disponible
   */
  async getNextAvailableNumber(raceId) {
    try {
      const number = await this.participantService.getNextAvailableNumber(raceId);
      return { success: true, data: number };
    } catch (error) {
      logger.error('ParticipantController.getNextAvailableNumber:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Vérifier la disponibilité d'un numéro
   */
  async isNumberAvailable(raceId, number) {
    try {
      const available = await this.participantService.isNumberAvailable(raceId, number);
      return { success: true, data: available };
    } catch (error) {
      logger.error('ParticipantController.isNumberAvailable:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réorganiser les numéros des participants
   */
  async renumberParticipants(raceId, startNumber = 1) {
    try {
      const participants = await this.participantService.renumberParticipants(raceId, startNumber);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.renumberParticipants:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les participants par catégorie
   */
  async getParticipantsByCategory(raceId, category) {
    try {
      const participants = await this.participantService.getParticipantsByCategory(raceId, category);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.getParticipantsByCategory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les participants par équipe
   */
  async getParticipantsByTeam(raceId, team) {
    try {
      const participants = await this.participantService.getParticipantsByTeam(raceId, team);
      return { success: true, data: participants };
    } catch (error) {
      logger.error('ParticipantController.getParticipantsByTeam:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ParticipantController;
