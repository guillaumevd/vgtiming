const { validateTimingData, validateTimingUpdate } = require('../utils/validation');
const { formatTime, parseTimeString, exportToCSV } = require('../utils/helpers');
const logger = require('../utils/logger');
const { TIMING_STATUS, RACE_STATUS } = require('../utils/constants');

class TimingService {
  constructor(models) {
    this.timingDataModel = models.timingData;
    this.participantModel = models.participant;
    this.raceModel = models.race;
    this.activeTimers = new Map(); // Pour gérer les timers actifs
  }

  /**
   * Initialiser les données de chronométrage pour une course
   */
  async initializeRaceTiming(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      if (race.status !== RACE_STATUS.READY && race.status !== RACE_STATUS.DRAFT) {
        throw new Error('La course doit être en statut "ready" ou "draft" pour initialiser le chronométrage');
      }

      const timings = this.timingDataModel.initializeRaceTimings(raceId);
      
      logger.info(`Chronométrage initialisé pour ${timings.length} participants de la course ${race.name}`);
      return timings;
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les données de chronométrage d'une course
   */
  async getTimingDataByRace(raceId, options = {}) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const timingData = this.timingDataModel.findByRace(raceId, options);
      return timingData;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données de chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les données de chronométrage d'un participant
   */
  async getTimingDataById(timingId) {
    try {
      const timingData = this.timingDataModel.findById(timingId);
      if (!timingData) {
        throw new Error('Données de chronométrage non trouvées');
      }

      return timingData;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données de chronométrage ${timingId}:`, error);
      throw error;
    }
  }

  /**
   * Démarrer le chronométrage d'un participant
   */
  async startParticipantTiming(raceId, bibNumber, startTime = null) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      if (race.status !== RACE_STATUS.IN_PROGRESS) {
        throw new Error('La course doit être en cours pour démarrer le chronométrage');
      }

      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      if (timingData.status === TIMING_STATUS.RUNNING) {
        throw new Error('Le chronométrage est déjà en cours pour ce participant');
      }

      const updatedTiming = this.timingDataModel.startTiming(timingData.id, startTime);
      
      logger.info(`Chronométrage démarré pour ${timingData.participantName} (#${bibNumber}) dans la course ${race.name}`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors du démarrage du chronométrage pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Terminer le chronométrage d'un participant
   */
  async finishParticipantTiming(raceId, bibNumber, finishTime = null) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      if (timingData.status !== TIMING_STATUS.RUNNING) {
        throw new Error('Le chronométrage n\'est pas en cours pour ce participant');
      }

      const updatedTiming = this.timingDataModel.finishTiming(timingData.id, finishTime);
      
      // Recalculer les positions si nécessaire
      if (updatedTiming) {
        await this.calculatePositions(raceId, updatedTiming.category);
      }

      logger.info(`Chronométrage terminé pour ${timingData.participantName} (#${bibNumber}) dans la course ${race.name} - Temps: ${formatTime(updatedTiming.totalTime)}`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors de la fin du chronométrage pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Marquer un participant comme DNS (Did Not Start)
   */
  async markParticipantDNS(raceId, bibNumber) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      const updatedTiming = this.timingDataModel.markDNS(timingData.id);
      
      logger.info(`Participant ${timingData.participantName} (#${bibNumber}) marqué comme DNS`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors du marquage DNS pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Marquer un participant comme DNF (Did Not Finish)
   */
  async markParticipantDNF(raceId, bibNumber) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      if (timingData.status !== TIMING_STATUS.RUNNING) {
        throw new Error('Le participant doit être en course pour être marqué DNF');
      }

      const updatedTiming = this.timingDataModel.markDNF(timingData.id);
      
      logger.info(`Participant ${timingData.participantName} (#${bibNumber}) marqué comme DNF`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors du marquage DNF pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Ajouter un passage intermédiaire
   */
  async addPassing(raceId, bibNumber, passingData) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      const passing = {
        checkpoint: passingData.checkpoint || 'Intermédiaire',
        time: passingData.time || new Date().toISOString(),
        ...passingData
      };

      const updatedTiming = this.timingDataModel.addPassing(timingData.id, passing);
      
      logger.info(`Passage ajouté pour ${timingData.participantName} (#${bibNumber}) - ${passing.checkpoint}`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout d'un passage pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Calculer les positions d'une course
   */
  async calculatePositions(raceId, category = null) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const updatedCount = this.timingDataModel.calculatePositions(raceId, category);
      
      const categoryText = category ? ` pour la catégorie ${category}` : '';
      logger.info(`Positions recalculées pour ${updatedCount} participants${categoryText} de la course ${race.name}`);
      
      return updatedCount;
    } catch (error) {
      logger.error(`Erreur lors du calcul des positions pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le classement d'une course
   */
  async getRanking(raceId, category = null) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const ranking = this.timingDataModel.getRanking(raceId, category);
      return ranking;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du classement pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de chronométrage d'une course
   */
  async getTimingStats(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const stats = this.timingDataModel.getRaceStats(raceId);
      return stats;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques de chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Démarrer tous les participants en même temps (départ en masse)
   */
  async startMassTiming(raceId, startTime = null) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      if (race.status !== RACE_STATUS.IN_PROGRESS) {
        throw new Error('La course doit être en cours pour démarrer le chronométrage de masse');
      }

      const timingData = this.timingDataModel.findByRace(raceId, {
        status: TIMING_STATUS.REGISTERED
      });

      if (timingData.length === 0) {
        throw new Error('Aucun participant en attente de démarrage');
      }

      const start = startTime || new Date().toISOString();
      const updatedTimings = [];

      for (const timing of timingData) {
        const updated = this.timingDataModel.startTiming(timing.id, start);
        if (updated) {
          updatedTimings.push(updated);
        }
      }

      logger.info(`Démarrage de masse pour ${updatedTimings.length} participants de la course ${race.name}`);
      return updatedTimings;
    } catch (error) {
      logger.error(`Erreur lors du démarrage de masse pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les participants en cours de course
   */
  async getRunningParticipants(raceId) {
    try {
      return this.timingDataModel.findByRace(raceId, {
        status: TIMING_STATUS.RUNNING,
        orderBy: 'startTime',
        order: 'ASC'
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des participants en course pour ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les participants terminés
   */
  async getFinishedParticipants(raceId) {
    try {
      return this.timingDataModel.findByRace(raceId, {
        status: TIMING_STATUS.FINISHED,
        orderBy: 'position',
        order: 'ASC'
      });
    } catch (error) {
      logger.error(`Erreur lors de la récupération des participants terminés pour ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Exporter les résultats de chronométrage
   */
  async exportTimingResults(raceId, options = {}) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      const timingData = this.timingDataModel.findByRace(raceId, {
        orderBy: options.orderBy || 'position',
        order: options.order || 'ASC'
      });

      if (timingData.length === 0) {
        throw new Error('Aucune donnée de chronométrage à exporter');
      }

      // Préparer les données pour l'export
      const exportData = timingData.map(timing => ({
        position: timing.position || '',
        number: timing.bibNumber,
        name: timing.participantName,
        team: timing.participantTeam || '',
        category: timing.category || timing.participantCategory || '',
        status: timing.status,
        startTime: timing.startTime ? new Date(timing.startTime).toLocaleTimeString() : '',
        finishTime: timing.finishTime ? new Date(timing.finishTime).toLocaleTimeString() : '',
        totalTime: timing.totalTime ? formatTime(timing.totalTime) : '',
        notes: timing.notes || ''
      }));

      const columns = [
        { key: 'position', header: 'Position' },
        { key: 'number', header: 'Numéro' },
        { key: 'name', header: 'Nom' },
        { key: 'team', header: 'Équipe' },
        { key: 'category', header: 'Catégorie' },
        { key: 'status', header: 'Statut' },
        { key: 'startTime', header: 'Heure de départ' },
        { key: 'finishTime', header: 'Heure d\'arrivée' },
        { key: 'totalTime', header: 'Temps total' },
        { key: 'notes', header: 'Notes' }
      ];

      const csvData = exportToCSV(exportData, columns);
      
      logger.info(`Résultats de chronométrage exportés pour ${timingData.length} participants de la course ${race.name}`);
      return {
        filename: `resultats_${race.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`,
        data: csvData,
        count: timingData.length
      };
    } catch (error) {
      logger.error(`Erreur lors de l'export des résultats pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Réinitialiser le chronométrage d'un participant
   */
  async resetParticipantTiming(raceId, bibNumber) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      const resetData = {
        startTime: null,
        finishTime: null,
        totalTime: null,
        status: TIMING_STATUS.REGISTERED,
        position: null,
        passings: [],
        notes: null
      };

      const updatedTiming = this.timingDataModel.update(timingData.id, resetData);
      
      logger.info(`Chronométrage réinitialisé pour ${timingData.participantName} (#${bibNumber})`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation du chronométrage pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Réinitialiser tout le chronométrage d'une course
   */
  async resetRaceTiming(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      if (race.status === RACE_STATUS.IN_PROGRESS) {
        throw new Error('Impossible de réinitialiser le chronométrage d\'une course en cours');
      }

      const deletedCount = this.timingDataModel.deleteByRace(raceId);
      const newTimings = this.timingDataModel.initializeRaceTimings(raceId);
      
      logger.info(`Chronométrage réinitialisé pour la course ${race.name} - ${deletedCount} données supprimées, ${newTimings.length} nouvelles données créées`);
      return newTimings;
    } catch (error) {
      logger.error(`Erreur lors de la réinitialisation du chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les temps intermédiaires d'un participant
   */
  async getParticipantPassings(raceId, bibNumber) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      return timingData.passings || [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération des passages pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le temps en cours d'un participant
   */
  async getParticipantCurrentTime(raceId, bibNumber) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData || !timingData.startTime) {
        return null;
      }

      const startTime = new Date(timingData.startTime).getTime();
      
      if (timingData.finishTime) {
        // Participant terminé
        return {
          status: 'finished',
          totalTime: timingData.totalTime,
          formattedTime: formatTime(timingData.totalTime)
        };
      } else if (timingData.status === TIMING_STATUS.RUNNING) {
        // Participant en cours
        const currentTime = Date.now() - startTime;
        return {
          status: 'running',
          currentTime,
          formattedTime: formatTime(currentTime)
        };
      } else {
        return {
          status: timingData.status,
          totalTime: null,
          formattedTime: '--:--:--'
        };
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du temps courant pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      return null;
    }
  }
}

module.exports = TimingService;
