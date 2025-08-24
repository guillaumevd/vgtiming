const logger = require('../utils/logger');
const raceBackupService = require('../services/raceBackupService');

class TimingController {
  constructor(services) {
    this.timingService = services.timing;
    this.raceService = services.race;
  }

  /**
   * Importer des données de timing en lot (pour l'importation de courses)
   */
  async importTimingData(raceId, timingDataArray) {
    try {
      logger.info('Début d\'importation des données de timing', { 
        raceId: raceId, 
        count: timingDataArray.length 
      });

      const results = [];
      for (const timingData of timingDataArray) {
        try {
          const result = await this.timingService.createTimingData({
            ...timingData,
            raceId: raceId
          });
          results.push(result);
        } catch (error) {
          logger.warn('Erreur lors de l\'importation d\'une donnée de timing', {
            timingData,
            error: error.message
          });
        }
      }

      // Backup automatique après importation
      await this._backupTimingData(raceId);

      logger.info('Importation des données de timing terminée', { 
        raceId: raceId, 
        imported: results.length 
      });

      return { success: true, data: results };
    } catch (error) {
      logger.error('TimingController.importTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialiser le chronométrage pour une course
   */
  async initializeRaceTiming(raceId) {
    try {
      const result = await this.timingService.initializeRaceTiming(raceId);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.initializeRaceTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Démarrer une course avec chronométrage
   */
  async startRaceWithTiming(raceId) {
    try {
      // Mettre à jour le statut de la course
      await this.raceService.updateRaceStatus(raceId, 'in_progress');
      
      // Initialiser le chronométrage
      const timingResult = await this.timingService.initializeRaceTiming(raceId);
      
      // Sauvegarder automatiquement
      await this._backupTimingData(raceId);
      
      return { 
        success: true, 
        data: { 
          race: { id: raceId, status: 'in_progress' },
          timing: timingResult 
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
   * Obtenir une donnée de chronométrage par ID
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
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.finishParticipantTiming:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marquer un participant comme DNS (Did Not Start)
   */
  async markParticipantDNS(raceId, bibNumber) {
    try {
      const result = await this.timingService.markParticipantDNS(raceId, bibNumber);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.markParticipantDNS:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marquer un participant comme DNF (Did Not Finish)
   */
  async markParticipantDNF(raceId, bibNumber) {
    try {
      const result = await this.timingService.markParticipantDNF(raceId, bibNumber);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.markParticipantDNF:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ajouter un passage pour un participant
   */
  async addPassing(raceId, bibNumber, passingData) {
    try {
      const result = await this.timingService.addPassing(raceId, bibNumber, passingData);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.addPassing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculer les positions pour une course
   */
  async calculatePositions(raceId, category = null) {
    try {
      const result = await this.timingService.calculatePositions(raceId, category);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.calculatePositions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les statistiques de chronométrage d'une course
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
   * Exporter les données de chronométrage
   */
  async exportTimingData(raceId, format = 'json') {
    try {
      const data = await this.timingService.exportTimingData(raceId, format);
      return { success: true, data: data };
    } catch (error) {
      logger.error('TimingController.exportTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer toutes les données de chronométrage d'une course
   */
  async deleteTimingDataByRace(raceId) {
    try {
      const result = await this.timingService.deleteTimingDataByRace(raceId);
      await this._backupTimingData(raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.deleteTimingDataByRace:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer une donnée de chronométrage spécifique
   */
  async deleteTimingData(timingId) {
    try {
      const result = await this.timingService.deleteTimingData(timingId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.deleteTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Modifier une donnée de chronométrage
   */
  async updateTimingData(timingId, updateData) {
    try {
      const result = await this.timingService.updateTimingData(timingId, updateData);
      
      // Obtenir le raceId pour la sauvegarde
      const timingData = await this.timingService.getTimingDataById(timingId);
      if (timingData && timingData.raceId) {
        await this._backupTimingData(timingData.raceId);
      }
      
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.updateTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valider les données de chronométrage d'une course
   */
  async validateTimingData(raceId) {
    try {
      const validation = await this.timingService.validateTimingData(raceId);
      return { success: true, data: validation };
    } catch (error) {
      logger.error('TimingController.validateTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Créer une nouvelle donnée de chronométrage
   */
  async createTimingData(timingData) {
    try {
      const result = await this.timingService.createTimingData(timingData);
      await this._backupTimingData(timingData.raceId);
      return { success: true, data: result };
    } catch (error) {
      logger.error('TimingController.createTimingData:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Importe des données de timing avec insertion directe en base de données
   * Méthode simplifiée qui insère directement les données telles qu'elles sont
   */
  async importTimingDataDirect(raceId, timingDataArray) {
    try {
      logger.info(`Début de l'importation directe de ${timingDataArray.length} données de timing pour la course ${raceId}`, {
        service: 'timing-controller'
      });

      // Récupérer l'instance de base de données via le service de timing
      const db = this.timingService.getDatabase();
      
      if (!db) {
        throw new Error('Base de données non disponible');
      }

      const importedData = [];
      let errors = 0;

      // Préparer la requête d'insertion
      const insertQuery = db.prepare(`
        INSERT INTO timing_data (
          raceId, participantId, participantNumber, status, position, totalTime, passings, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();

      for (const timingItem of timingDataArray) {
        try {
          // Trouver le participant par son numéro si pas d'ID fourni
          let participantId = timingItem.participantId;
          
          if (!participantId && (timingItem.participantNumber || timingItem.number)) {
            const participantQuery = db.prepare(
              'SELECT id FROM participants WHERE raceId = ? AND number = ? AND isActive = 1'
            );
            const participant = participantQuery.get(raceId, String(timingItem.participantNumber || timingItem.number));
            participantId = participant ? participant.id : null;
          }

          if (!participantId) {
            logger.warn(`Participant non trouvé pour le numéro ${timingItem.participantNumber || timingItem.number}`, {
              service: 'timing-controller',
              raceId
            });
            errors++;
            continue;
          }

          const result = insertQuery.run(
            parseInt(raceId),
            participantId,
            String(timingItem.participantNumber || timingItem.number),
            timingItem.status || 'running',
            timingItem.position || null,
            timingItem.totalTime || null,
            JSON.stringify(timingItem.passings || []),
            now,
            now
          );

          if (result.lastInsertRowid) {
            importedData.push({
              id: result.lastInsertRowid,
              raceId: parseInt(raceId),
              participantId: participantId,
              participantNumber: String(timingItem.participantNumber || timingItem.number),
              status: timingItem.status || 'running',
              position: timingItem.position || null,
              totalTime: timingItem.totalTime || null,
              passings: timingItem.passings || []
            });
          }
        } catch (itemError) {
          errors++;
          logger.warn(`Erreur lors de l'insertion directe d'une donnée de timing`, {
            service: 'timing-controller',
            raceId,
            participantNumber: timingItem.participantNumber || timingItem.number,
            error: itemError.message
          });
        }
      }

      // Sauvegarder automatiquement après importation
      await this._backupTimingData(raceId);

      logger.info(`Importation directe terminée: ${importedData.length} données importées, ${errors} erreurs`, {
        service: 'timing-controller',
        raceId
      });

      return {
        success: true,
        data: {
          imported: importedData.length,
          errors: errors,
          timingData: importedData
        }
      };

    } catch (error) {
      logger.error('Erreur lors de l\'importation directe des données de timing', {
        service: 'timing-controller',
        raceId,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Méthode helper pour sauvegarder automatiquement les données de timing
   */
  async _backupTimingData(raceId) {
    if (raceId) {
      try {
        await raceBackupService.backupRace(raceId);
      } catch (backupError) {
        logger.warn('Erreur lors de la sauvegarde JSON des données de chronométrage', {
          raceId: raceId,
          error: backupError.message
        });
      }
    }
  }
}

module.exports = TimingController;
