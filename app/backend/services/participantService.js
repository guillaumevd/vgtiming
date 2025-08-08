const { validateParticipant, validateParticipantUpdate, validateParticipantBatch } = require('../utils/validation');
const { parseCSVData, exportToCSV } = require('../utils/helpers');
const logger = require('../utils/logger');

class ParticipantService {
  constructor(models) {
    this.participantModel = models.participant;
    this.raceModel = models.race;
    this.timingDataModel = models.timingData;
  }

  /**
   * Créer un nouveau participant
   */
  async createParticipant(participantData) {
    try {
      // Validation des données
      const { error, value } = validateParticipant(participantData);
      if (error) {
        throw new Error(`Erreur de validation: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Vérifier que la course existe
      const race = this.raceModel.findById(value.raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      // Vérifier le nombre maximum de participants si défini
      if (race.maxParticipants) {
        const currentCount = this.participantModel.getStatsByRace(value.raceId).total;
        if (currentCount >= race.maxParticipants) {
          throw new Error(`Nombre maximum de participants atteint (${race.maxParticipants})`);
        }
      }

      // Si aucun numéro n'est fourni, utiliser le prochain disponible
      if (!value.number) {
        value.number = this.participantModel.getNextAvailableNumber(value.raceId);
      }

      const participant = this.participantModel.create(value);
      if (!participant) {
        throw new Error('Échec de la création du participant');
      }

      logger.info(`Participant créé: ${participant.name} (#${participant.number}) pour la course ${race.name}`);
      return participant;
    } catch (error) {
      logger.error('Erreur lors de la création du participant:', error);
      throw error;
    }
  }

  /**
   * Créer plusieurs participants en lot
   */
  async createParticipantsBatch(participants) {
    try {
      // Validation du lot
      const { error, value } = validateParticipantBatch(participants);
      if (error) {
        throw new Error(`Erreur de validation: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Vérifier que toutes les courses existent
      const raceIds = [...new Set(participants.map(p => p.raceId))];
      const races = new Map();
      
      for (const raceId of raceIds) {
        const race = this.raceModel.findById(raceId);
        if (!race) {
          throw new Error(`Course non trouvée: ${raceId}`);
        }
        races.set(raceId, race);
      }

      // Assigner les numéros manquants
      const participantsWithNumbers = [];
      for (const participant of value) {
        if (!participant.number) {
          participant.number = this.participantModel.getNextAvailableNumber(participant.raceId);
        }
        participantsWithNumbers.push(participant);
      }

      const createdParticipants = this.participantModel.createBatch(participantsWithNumbers);
      
      logger.info(`${createdParticipants.length} participants créés en lot`);
      return createdParticipants;
    } catch (error) {
      logger.error('Erreur lors de la création de participants en lot:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les participants d'une course
   */
  async getParticipantsByRace(raceId, options = {}) {
    try {
      // Vérifier que la course existe
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const participants = this.participantModel.findByRace(raceId, options);
      return participants;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des participants de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir un participant par ID
   */
  async getParticipantById(participantId) {
    try {
      const participant = this.participantModel.findById(participantId);
      if (!participant) {
        throw new Error('Participant non trouvé');
      }

      return participant;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Mettre à jour un participant
   */
  async updateParticipant(participantId, updateData) {
    try {
      // Validation des données
      const { error, value } = validateParticipantUpdate(updateData);
      if (error) {
        throw new Error(`Erreur de validation: ${error.details.map(d => d.message).join(', ')}`);
      }

      const participant = this.participantModel.update(participantId, value);
      if (!participant) {
        throw new Error('Participant non trouvé ou échec de la mise à jour');
      }

      logger.info(`Participant mis à jour: ${participant.name} (#${participant.number})`);
      return participant;
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour du participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un participant
   */
  async deleteParticipant(participantId) {
    try {
      const participant = await this.getParticipantById(participantId);
      
      // Vérifier s'il y a des données de timing associées
      const timingData = this.timingDataModel.findByParticipant(participantId);
      if (timingData && timingData.status !== 'registered') {
        throw new Error('Impossible de supprimer un participant avec des données de chronométrage');
      }

      const success = this.participantModel.delete(participantId);
      if (!success) {
        throw new Error('Échec de la suppression du participant');
      }

      logger.info(`Participant supprimé: ${participant.name} (#${participant.number})`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du participant ${participantId}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer tous les participants d'une course
   */
  async deleteAllParticipants(raceId) {
    try {
      // Vérifier que la course existe
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      // Vérifier s'il y a des données de timing
      const timingStats = this.timingDataModel.getRaceStats(raceId);
      if (timingStats.total > timingStats.registered) {
        throw new Error('Impossible de supprimer les participants avec des données de chronométrage');
      }

      const deletedCount = this.participantModel.deleteByRace(raceId);
      
      // Supprimer aussi les données de timing associées
      this.timingDataModel.deleteByRace(raceId);

      logger.info(`${deletedCount} participants supprimés de la course ${race.name}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Erreur lors de la suppression des participants de la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Rechercher des participants
   */
  async searchParticipants(searchTerm, raceId = null) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const results = this.participantModel.search(searchTerm.trim(), raceId);
      return results;
    } catch (error) {
      logger.error('Erreur lors de la recherche de participants:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des participants d'une course
   */
  async getParticipantStats(raceId) {
    try {
      // Vérifier que la course existe
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const stats = this.participantModel.getStatsByRace(raceId);
      return stats;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques des participants pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Dupliquer les participants d'une course vers une autre
   */
  async duplicateParticipants(sourceRaceId, targetRaceId) {
    try {
      // Vérifier que les deux courses existent
      const sourceRace = this.raceModel.findById(sourceRaceId);
      const targetRace = this.raceModel.findById(targetRaceId);
      
      if (!sourceRace || !targetRace) {
        throw new Error('Course source ou cible non trouvée');
      }

      const duplicatedParticipants = this.participantModel.duplicateToRace(sourceRaceId, targetRaceId);
      
      logger.info(`${duplicatedParticipants.length} participants dupliqués de ${sourceRace.name} vers ${targetRace.name}`);
      return duplicatedParticipants;
    } catch (error) {
      logger.error(`Erreur lors de la duplication des participants:`, error);
      throw error;
    }
  }

  /**
   * Importer des participants depuis un fichier CSV
   */
  async importParticipantsFromCSV(raceId, csvData) {
    try {
      // Vérifier que la course existe
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      // Parser les données CSV
      const parsedData = parseCSVData(csvData);
      if (parsedData.length === 0) {
        throw new Error('Aucune donnée valide trouvée dans le fichier CSV');
      }

      // Convertir en format participant
      const participants = parsedData.map((row, index) => {
        const participant = {
          raceId,
          number: row.number || row.numero || row.bib,
          name: row.name || row.nom || row.participant,
          email: row.email || row.courriel,
          team: row.team || row.equipe || row.club,
          category: row.category || row.categorie || 'Général',
          birthYear: row.birthYear || row.anneeNaissance
        };

        // Valider les champs requis
        if (!participant.name) {
          throw new Error(`Ligne ${index + 2}: Nom du participant manquant`);
        }

        return participant;
      });

      // Créer les participants
      const createdParticipants = await this.createParticipantsBatch(participants);
      
      logger.info(`${createdParticipants.length} participants importés depuis CSV pour la course ${race.name}`);
      return {
        imported: createdParticipants.length,
        participants: createdParticipants
      };
    } catch (error) {
      logger.error(`Erreur lors de l'import CSV pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Exporter les participants d'une course vers CSV
   */
  async exportParticipantsToCSV(raceId, options = {}) {
    try {
      // Vérifier que la course existe
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const participants = this.participantModel.findByRace(raceId, {
        orderBy: options.orderBy || 'number',
        order: options.order || 'ASC'
      });

      if (participants.length === 0) {
        throw new Error('Aucun participant à exporter');
      }

      // Définir les colonnes à exporter
      const columns = [
        { key: 'number', header: 'Numéro' },
        { key: 'name', header: 'Nom' },
        { key: 'email', header: 'Email' },
        { key: 'team', header: 'Équipe' },
        { key: 'category', header: 'Catégorie' },
        { key: 'birthYear', header: 'Année de naissance' },
        { key: 'notes', header: 'Notes' }
      ];

      const csvData = exportToCSV(participants, columns);
      
      logger.info(`${participants.length} participants exportés en CSV pour la course ${race.name}`);
      return {
        filename: `participants_${race.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        data: csvData,
        count: participants.length
      };
    } catch (error) {
      logger.error(`Erreur lors de l'export CSV pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le prochain numéro disponible
   */
  async getNextAvailableNumber(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      return this.participantModel.getNextAvailableNumber(raceId);
    } catch (error) {
      logger.error(`Erreur lors de la récupération du prochain numéro pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier la disponibilité d'un numéro
   */
  async isNumberAvailable(raceId, number) {
    try {
      const existing = this.participantModel.findByRaceAndNumber(raceId, number);
      return !existing;
    } catch (error) {
      logger.error(`Erreur lors de la vérification du numéro ${number} pour la course ${raceId}:`, error);
      return false;
    }
  }

  /**
   * Réorganiser les numéros des participants
   */
  async renumberParticipants(raceId, startNumber = 1) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const participants = this.participantModel.findByRace(raceId, {
        orderBy: 'name',
        order: 'ASC'
      });

      if (participants.length === 0) {
        return [];
      }

      const updatedParticipants = [];
      let currentNumber = startNumber;

      for (const participant of participants) {
        const updated = this.participantModel.update(participant.id, {
          number: currentNumber
        });
        
        if (updated) {
          updatedParticipants.push(updated);
        }
        
        currentNumber++;
      }

      logger.info(`Numérotation mise à jour pour ${updatedParticipants.length} participants de la course ${race.name}`);
      return updatedParticipants;
    } catch (error) {
      logger.error(`Erreur lors de la renumérotation des participants pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les participants par catégorie
   */
  async getParticipantsByCategory(raceId, category) {
    try {
      return this.participantModel.findByRace(raceId, { category });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des participants de la catégorie ${category} pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les participants par équipe
   */
  async getParticipantsByTeam(raceId, team) {
    try {
      return this.participantModel.findByRace(raceId, { team });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des participants de l'équipe ${team} pour la course ${raceId}:`, error);
      throw error;
    }
  }
}

module.exports = ParticipantService;
