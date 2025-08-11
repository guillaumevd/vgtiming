const { validateTimingData, validateTimingUpdate } = require('../utils/validation');
const { formatTime, parseTimeString, exportToCSV } = require('../utils/helpers');
const logger = require('../utils/logger');
const { TIMING_STATUS, RACE_STATUS } = require('../utils/constants');

class TimingService {
  constructor(models, crossmgrService = null) {
    this.timingDataModel = models.timingData;
    this.participantModel = models.participant;
    this.raceModel = models.race;
    this.activeTimers = new Map(); // Pour gérer les timers actifs
    this.crossmgrService = crossmgrService;
    this.raceStartTimes = new Map(); // Map<raceId, gtTimestamp> pour stocker les temps GT
    
    // Écouter les événements CrossMgr si disponible
    if (this.crossmgrService) {
      this.crossmgrService.on('participant_passing', (data) => {
        this.handleParticipantPassing(data);
      });
      
      this.crossmgrService.on('gt_sent', (data) => {
        this.handleGTSent(data);
      });
    }
  }

  /**
   * Définir le service CrossMgr après l'initialisation
   */
  setCrossMgrService(crossmgrService) {
    this.crossmgrService = crossmgrService;
    
    // Configurer les listeners
    if (this.crossmgrService) {
      this.crossmgrService.on('participant_passing', (data) => {
        this.handleParticipantPassing(data);
      });
      
      this.crossmgrService.on('gt_sent', (data) => {
        this.handleGTSent(data);
      });
    }
  }

  /**
   * Gérer l'envoi d'un GT (Get Time) - marquer le temps de départ de la course
   */
  handleGTSent(data) {
    try {
      // Le GT est envoyé au démarrage d'une course, nous devons déterminer quelle course
      // Pour l'instant, on stocke juste le timestamp pour la course active
      logger.info('GT envoyé à CrossMgr', { timestamp: data.timestamp, purpose: data.purpose });
      
      // TODO: Association plus précise avec la course active
      // Pour l'instant, on peut utiliser la dernière course démarrée
    } catch (error) {
      logger.error('Erreur lors de la gestion du GT envoyé:', error);
    }
  }

  /**
   * Gérer un passage de participant détecté par CrossMgr
   */
  async handleParticipantPassing(data) {
    try {
      const { epcTag, passingTime, fullMessage } = data;
      
      logger.info(`Passage participant détecté - EPC: ${epcTag}`, { passingTime });
      
      // Trouver le participant par EPC tag dans toutes les courses actives
      const participant = this.participantModel.findByEpcTag(epcTag);
      
      if (!participant) {
        logger.warn(`Aucun participant trouvé avec l'EPC tag: ${epcTag}`);
        return;
      }
      
      logger.info(`Participant trouvé pour EPC ${epcTag}:`, { 
        name: participant.name, 
        number: participant.number, 
        raceId: participant.raceId 
      });
      
      // Vérifier que la course est en cours ou en cours de finition
      const race = this.raceModel.findById(participant.raceId);
      logger.debug(`Vérification statut course pour EPC ${epcTag}: race=${race?.name}, status="${race?.status}"`);
      
      const acceptedStatuses = ['in_progress', 'active', 'finishing'];
      if (!race || !acceptedStatuses.includes(race.status)) {
        logger.warn(`Course non active pour le participant EPC ${epcTag}:`, { 
          raceId: participant.raceId, 
          raceStatus: race?.status,
          acceptedStatuses: acceptedStatuses
        });
        return;
      }
      
      // Enregistrer le passage
      await this.addParticipantPassing(participant.raceId, participant.number, {
        passingTime,
        epcTag,
        source: 'crossmgr',
        rawMessage: fullMessage
      });
      
    } catch (error) {
      logger.error('Erreur lors du traitement du passage participant:', error);
    }
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

      if (race.status !== RACE_STATUS.READY && 
          race.status !== RACE_STATUS.DRAFT && 
          race.status !== RACE_STATUS.IN_PROGRESS) {
        throw new Error('La course doit être en statut "ready", "draft" ou "in_progress" pour initialiser le chronométrage');
      }

      // Envoyer GT à CrossMgr pour obtenir le temps de référence
      if (this.crossmgrService) {
        const gtResult = this.crossmgrService.sendGetTime();
        if (gtResult.success) {
          // Stocker le temps de départ de la course
          this.raceStartTimes.set(raceId, gtResult.timestamp);
          logger.info(`GT envoyé pour la course ${race.name} - Temps de référence: ${gtResult.timestamp}`);
        } else {
          logger.warn(`Impossible d'envoyer GT à CrossMgr: ${gtResult.error}`);
        }
      }

      const timings = this.timingDataModel.initializeRaceTimings(raceId);
      
      logger.info(`Chronométrage initialisé pour ${timings.length} participants de la course ${race.name}`);
      return {
        timings,
        gtSent: this.crossmgrService ? true : false,
        gtTimestamp: this.raceStartTimes.get(raceId),
        raceId
      };
    } catch (error) {
      logger.error(`Erreur lors de l'initialisation du chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir toutes les données de chronométrage d'une course avec statistiques
   */
  async getTimingDataByRace(raceId, options = {}) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      // Calculer les positions d'abord
      this.timingDataModel.calculatePositions(raceId);

      const rawTimingData = this.timingDataModel.findByRace(raceId, options);
      
      // Enrichir les données avec les statistiques de tours
      const enrichedData = rawTimingData.map(timing => {
        const passings = this.parsePassings(timing.passings);
        
        // Calculer les statistiques
        const lapCount = passings.length;
        let bestLapTime = null;
        let lastLapTime = null;
        let totalTime = null;
        let elapsedTimeMs = 0;
        
        if (passings.length > 0) {
          // Trouver le meilleur temps au tour
          const lapTimes = passings
            .filter(p => p.lapTime != null)
            .map(p => p.lapTime);
            
          if (lapTimes.length > 0) {
            const bestTime = Math.min(...lapTimes);
            bestLapTime = this.formatTimeFromMs(bestTime);
          }
          
          // Dernier temps au tour
          const lastPassing = passings[passings.length - 1];
          if (lastPassing.lapTime != null) {
            lastLapTime = this.formatTimeFromMs(lastPassing.lapTime);
          }
          
          // Temps total écoulé
          if (lastPassing.elapsedTime != null) {
            elapsedTimeMs = lastPassing.elapsedTime;
            totalTime = this.formatTimeFromMs(lastPassing.elapsedTime);
          }
        }
        
        return {
          ...timing,
          // Ajouter les statistiques pour le frontend
          laps: lapCount,
          lapCount: lapCount,
          bestLapTime: bestLapTime || 'N/A',
          bestTime: bestLapTime || 'N/A',
          lastLapTime: lastLapTime || 'N/A', 
          totalTime: totalTime || 'N/A',
          name: timing.participantName,
          number: timing.bibNumber,
          elapsedTimeMs: elapsedTimeMs
        };
      });

      // Calculer les écarts après avoir toutes les données enrichies
      const leader = enrichedData.find(p => p.position === 1);
      const leaderLaps = leader ? leader.laps : 0;
      const leaderTimeMs = leader ? leader.elapsedTimeMs : 0;

      enrichedData.forEach(participant => {
        if (participant.position === 1) {
          participant.gap = '-'; // Leader
        } else if (participant.laps < leaderLaps) {
          const lapDiff = leaderLaps - participant.laps;
          participant.gap = lapDiff === 1 ? '-1 tour' : `-${lapDiff} tours`;
        } else if (participant.laps === leaderLaps && leaderTimeMs > 0 && participant.elapsedTimeMs > 0) {
          const timeDiff = participant.elapsedTimeMs - leaderTimeMs;
          participant.gap = '+' + this.formatTimeFromMs(timeDiff);
        } else {
          participant.gap = 'N/A';
        }
      });

      return enrichedData;
    } catch (error) {
      logger.error(`Erreur lors de la récupération des données de chronométrage pour la course ${raceId}:`, error);
      throw error;
    }
  }
  
  /**
   * Fonction utilitaire pour parser les passings de façon sécurisée
   */
  parsePassings(passingsData) {
    try {
      // Si c'est déjà un array, le retourner tel quel
      if (Array.isArray(passingsData)) {
        return passingsData;
      }
      
      // Si pas de données, retourner array vide
      if (!passingsData) {
        return [];
      }
      
      // Si c'est une string, essayer de parser le JSON
      if (typeof passingsData === 'string') {
        if (passingsData.trim() === '') {
          return [];
        }
        return JSON.parse(passingsData);
      }
      
      // Si c'est un objet (cas probablement), essayer de le traiter
      if (typeof passingsData === 'object') {
        // Déjà un objet parsed, assumer que c'est un array
        return Array.isArray(passingsData) ? passingsData : [passingsData];
      }
      
      return [];
    } catch (error) {
      logger.warn(`Erreur parsing passings dans getTimingDataByRace:`, { 
        data: passingsData, 
        dataType: typeof passingsData,
        error: error.message 
      });
      return [];
    }
  }

  /**
   * Formater un temps en millisecondes en format MM:SS.mmm
   */
  formatTimeFromMs(milliseconds) {
    if (!milliseconds || milliseconds <= 0) return 'N/A';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10); // 2 décimales
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
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
   * Ajouter un passage pour un participant (générique)
   */
  async addPassing(raceId, bibNumber, passingData) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      // Empêcher les participants déjà terminés d'enregistrer de nouveaux passages
      if (timingData.status === TIMING_STATUS.FINISHED) {
        logger.warn(`🚫 Tentative de passage pour ${timingData.participantName} (#${bibNumber}) qui est déjà terminé - Passage ignoré`);
        return timingData; // Retourner les données existantes sans modification
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
   * Ajouter un passage pour un participant depuis CrossMgr
   */
  async addParticipantPassing(raceId, bibNumber, passingData) {
    try {
      const timingData = this.timingDataModel.findByBibNumber(raceId, bibNumber);
      if (!timingData) {
        throw new Error(`Aucun participant trouvé avec le numéro ${bibNumber}`);
      }

      // Empêcher les participants déjà terminés d'enregistrer de nouveaux passages
      if (timingData.status === TIMING_STATUS.FINISHED) {
        logger.warn(`🚫 Tentative de passage pour ${timingData.participantName} (#${bibNumber}) qui est déjà terminé - Passage ignoré`);
        return timingData; // Retourner les données existantes sans modification
      }

      // Calculer les temps depuis le GT de départ
      const gtTimestamp = this.raceStartTimes.get(raceId);
      let elapsedTime = null;
      let lapTime = null;

      // Fonction utilitaire pour parser les passings de façon sécurisée
      const parsePassings = (passingsData) => {
        try {
          // Si c'est déjà un tableau, le retourner directement
          if (Array.isArray(passingsData)) {
            return passingsData;
          }
          
          // Si c'est null ou undefined, retourner tableau vide
          if (!passingsData) {
            return [];
          }
          
          // Si c'est une chaîne, tenter de la parser
          if (typeof passingsData === 'string') {
            if (passingsData.trim() === '') {
              return [];
            }
            return JSON.parse(passingsData);
          }
          
          // Pour tout autre type, retourner tableau vide
          return [];
        } catch (error) {
          logger.warn(`Erreur parsing passings, utilisation d'un tableau vide:`, { data: passingsData, error: error.message });
          return [];
        }
      };

      if (gtTimestamp && passingData.passingTime) {
        const startTime = new Date(gtTimestamp);
        const currentTime = new Date(passingData.passingTime);
        elapsedTime = currentTime.getTime() - startTime.getTime(); // en millisecondes

        // Calculer le temps au tour (depuis le passage précédent)
        const passings = parsePassings(timingData.passings);
        if (passings.length > 0) {
          const lastPassing = passings[passings.length - 1];
          const lastTime = new Date(lastPassing.time);
          lapTime = currentTime.getTime() - lastTime.getTime();
        } else {
          // Premier passage = temps écoulé depuis le départ
          lapTime = elapsedTime;
        }
      }

      const passing = {
        checkpoint: `Tour ${parsePassings(timingData.passings).length + 1}`,
        time: passingData.passingTime,
        source: 'crossmgr',
        epcTag: passingData.epcTag,
        rawMessage: passingData.rawMessage,
        elapsedTime: elapsedTime, // Temps depuis GT
        lapTime: lapTime, // Temps au tour
        ...passingData
      };

      // Si c'est le premier passage, marquer le participant comme "running" AVANT d'ajouter le passage
      const currentPassings = parsePassings(timingData.passings);
      const isFirstPassing = currentPassings.length === 0;
      
      if (isFirstPassing) {
        this.timingDataModel.startTiming(timingData.id, passingData.passingTime);
        logger.info(`Premier passage détecté pour ${timingData.participantName} (#${bibNumber}) - Statut: RUNNING`);
      }

      const updatedTiming = this.timingDataModel.addPassing(timingData.id, passing);

      // Vérifier si ce participant a terminé ses tours requis (pour courses en Tours)
      await this.checkParticipantFinished(raceId, timingData.id, updatedTiming);

      // Pour les courses en temps, vérifier si le participant doit être marqué comme terminé
      await this.checkTimeBasedParticipantFinished(raceId, timingData.id, updatedTiming);

      // Recalculer les positions après chaque passage
      await this.calculatePositions(raceId, timingData.category);
      
      // Vérifier les conditions de fin de course après chaque passage
      setTimeout(() => {
        this.checkRaceFinishConditions(raceId).catch(error => {
          logger.error(`Erreur lors de la vérification de fin de course ${raceId}:`, error);
        });
      }, 1000); // Petit délai pour laisser le temps aux calculs de positions
      
      logger.info(`Passage CrossMgr enregistré pour ${timingData.participantName} (#${bibNumber}) - Temps écoulé: ${elapsedTime ? (elapsedTime/1000).toFixed(1) + 's' : 'N/A'}`);
      return updatedTiming;
    } catch (error) {
      logger.error(`Erreur lors de l'ajout du passage CrossMgr pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier si un participant a terminé ses tours requis
   */
  async checkParticipantFinished(raceId, participantId, timingData) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        logger.warn(`checkParticipantFinished: Course ${raceId} non trouvée`);
        return;
      }

      // Seulement pour les courses en tours
      if (race.durationType !== 'Tours') {
        logger.debug(`checkParticipantFinished: Course ${race.name} n'est pas en mode Tours (${race.durationType})`);
        return;
      }

      const passings = this.parsePassings(timingData.passings);
      const lapCount = passings.length;
      
      logger.debug(`checkParticipantFinished: ${timingData.participantName} a ${lapCount}/${race.duration} tours (statut: ${timingData.status}, course: ${race.status})`);

      // Si le participant a atteint le nombre de tours requis
      if (lapCount >= race.duration) {
        // Marquer le participant comme terminé seulement s'il n'est pas déjà terminé
        if (timingData.status !== TIMING_STATUS.FINISHED) {
          logger.info(`🏁 Marquage ${timingData.participantName} comme terminé (${lapCount} tours atteints)`);
          const finishedTiming = this.timingDataModel.finishTiming(participantId, passings[passings.length - 1].time);
          
          if (finishedTiming) {
            logger.info(`🏁 Participant ${timingData.participantName} a terminé ses ${race.duration} tours (statut course: ${race.status})`);
            
            // Vérifier si tous les participants ont terminé (pour toutes les courses actives ou en finition)
            if (race.status === RACE_STATUS.IN_PROGRESS || race.status === RACE_STATUS.FINISHING) {
              setTimeout(async () => {
                const allFinished = await this.checkAllParticipantsFinished(raceId);
                if (allFinished) {
                  logger.info(`🏁 Tous les participants ont terminé - Fin automatique de la course`);
                  await this.autoFinishRace(raceId, race.finishReason || 'Tous les participants ont terminé');
                } else {
                  logger.debug(`⏳ Attente que les autres participants terminent leur tour`);
                }
              }, 1000); // Petit délai pour laisser le temps aux calculs
            }
            
          } else {
            logger.error(`❌ Erreur lors du marquage comme terminé pour ${timingData.participantName}`);
          }
        } else {
          logger.debug(`⚡ ${timingData.participantName} est déjà marqué comme terminé`);
        }
      } else {
        logger.debug(`⏱️ ${timingData.participantName} n'a pas encore terminé (${lapCount}/${race.duration} tours)`);
      }
      
    } catch (error) {
      logger.warn(`Erreur lors de la vérification de fin pour le participant ${participantId}:`, error);
    }
  }

  /**
   * Vérifier si un participant d'une course en temps doit être marqué comme terminé
   */
  async checkTimeBasedParticipantFinished(raceId, participantId, timingData) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        return;
      }

      // Seulement pour les courses en temps
      if (race.durationType !== 'Temps') {
        return;
      }

      // Obtenir le temps de départ de la course
      const raceStartTime = this.raceStartTimes.get(raceId);
      if (!raceStartTime) {
        return;
      }

      const now = new Date();
      const startTimeDate = new Date(raceStartTime);
      const elapsedTimeMinutes = Math.floor((now.getTime() - startTimeDate.getTime()) / (1000 * 60));

      // Si le temps de course est écoulé et que la course est en mode "finishing"
      if (elapsedTimeMinutes >= race.duration && race.status === RACE_STATUS.FINISHING) {
        // Marquer le participant comme terminé s'il n'est pas déjà terminé
        if (timingData.status === TIMING_STATUS.RUNNING) {
          logger.info(`🕒 Marquage ${timingData.participantName} comme terminé (temps écoulé: ${elapsedTimeMinutes}/${race.duration} min)`);
          
          const passings = this.parsePassings(timingData.passings);
          const lastPassingTime = passings.length > 0 ? passings[passings.length - 1].time : new Date().toISOString();
          
          const finishedTiming = this.timingDataModel.finishTiming(participantId, lastPassingTime);
          
          if (finishedTiming) {
            logger.info(`🏁 Participant ${timingData.participantName} terminé (course en temps)`);
            
            // Vérifier si tous les participants ont terminé
            setTimeout(async () => {
              const allFinished = await this.checkAllParticipantsFinished(raceId);
              if (allFinished) {
                logger.info(`🏁 Tous les participants ont terminé - Fin automatique de la course`);
                await this.autoFinishRace(raceId, race.finishReason || 'Temps écoulé et tous les participants terminés');
              } else {
                logger.debug(`⏳ Attente que les autres participants terminent leur tour`);
              }
            }, 1000);
          } else {
            logger.error(`❌ Erreur lors du marquage comme terminé pour ${timingData.participantName}`);
          }
        } else {
          logger.debug(`⚡ ${timingData.participantName} est déjà marqué comme terminé (status: ${timingData.status})`);
        }
      } else {
        logger.debug(`⏱️ Course en temps - ${timingData.participantName}: ${elapsedTimeMinutes}/${race.duration} min (statut course: ${race.status})`);
      }
      
    } catch (error) {
      logger.warn(`Erreur lors de la vérification de fin pour le participant en temps ${participantId}:`, error);
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

      logger.debug(`📊 getTimingStats - Course: ${race.name}, Statut: ${race.status}`);

      const stats = this.timingDataModel.getRaceStats(raceId);
      logger.debug(`📊 Stats de base:`, stats);
      
      // Enrichir les statistiques pour le frontend
      const gtTimestamp = this.raceStartTimes.get(raceId);
      logger.debug(`📊 GT Timestamp: ${gtTimestamp}, Race Status: ${race.status}`);
      
      let elapsedTime = '00:00:00';
      
      if (gtTimestamp && (race.status === RACE_STATUS.IN_PROGRESS || race.status === RACE_STATUS.FINISHING || race.status === RACE_STATUS.PAUSED)) {
        const startTime = new Date(gtTimestamp);
        const currentTime = new Date();
        const elapsed = currentTime.getTime() - startTime.getTime();
        
        // Convertir en format HH:MM:SS
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        elapsedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        logger.debug(`📊 Temps écoulé calculé: ${elapsedTime} (${elapsed}ms)`);
      } else {
        logger.debug(`📊 Pas de calcul de temps écoulé - GT: ${!!gtTimestamp}, Status compatible: ${race.status === RACE_STATUS.IN_PROGRESS || race.status === RACE_STATUS.FINISHING || race.status === RACE_STATUS.PAUSED}`);
      }

      // Obtenir les participants en course et terminés
      const runningParticipants = this.timingDataModel.findByRace(raceId, { status: TIMING_STATUS.RUNNING });
      const finishedParticipants = this.timingDataModel.findByRace(raceId, { status: TIMING_STATUS.FINISHED });
      
      logger.debug(`📊 Participants - En course: ${runningParticipants.length}, Terminés: ${finishedParticipants.length}`);
      
      // Calculer le nombre total de tours/passages
      let totalLaps = 0;
      const allTimings = this.timingDataModel.findByRace(raceId);
      logger.debug(`📊 Total participants dans la course: ${allTimings.length}`);
      
      allTimings.forEach(timing => {
        try {
          // Debug: Afficher les passings bruts
          logger.debug(`📊 DEBUG - ${timing.participantName} passings bruts:`, { 
            passingsType: typeof timing.passings,
            passingsValue: timing.passings,
            status: timing.status 
          });
          
          // Utiliser la fonction de parsing sécurisée
          const passings = this.parsePassings(timing.passings);
          totalLaps += passings.length;
          logger.debug(`📊 ${timing.participantName}: ${passings.length} passages (status: ${timing.status})`);
        } catch (error) {
          // Ignorer les erreurs et continuer
          logger.warn(`Erreur parsing passings pour timing ${timing.id}: ${error.message}`);
        }
      });
      
      logger.debug(`📊 Total tours calculé: ${totalLaps}`);

      // Dernier passage
      let lastPassingTime = null;
      allTimings.forEach(timing => {
        try {
          const passings = this.parsePassings(timing.passings);
          passings.forEach(passing => {
            if (passing.time && (!lastPassingTime || new Date(passing.time) > new Date(lastPassingTime))) {
              lastPassingTime = passing.time;
            }
          });
        } catch (error) {
          // Ignorer les erreurs
          logger.warn(`Erreur parsing passings pour timing ${timing.id}: ${error.message}`);
        }
      });

      const enrichedStats = {
        ...stats,
        elapsedTime,
        totalLaps,
        lastPassingTime,
        runningCount: runningParticipants.length,
        finishedCount: finishedParticipants.length,
        raceStatus: race.status,
        gtTimestamp,
        raceStarted: race.status === RACE_STATUS.IN_PROGRESS || race.status === RACE_STATUS.FINISHING || race.status === RACE_STATUS.PAUSED
      };

      return enrichedStats;
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
        logger.warn(`Aucun participant en attente de démarrage pour la course ${race.name} - Démarrage à vide autorisé`);
        return {
          raceId,
          startTime: startTime || new Date().toISOString(),
          participantCount: 0,
          message: 'Course démarrée sans participants'
        };
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
      if (!timingData) {
        return null;
      }

      const currentTime = new Date();

      if (timingData.status === TIMING_STATUS.RUNNING && timingData.startTime) {
        const startTime = new Date(timingData.startTime);
        const elapsedTime = currentTime.getTime() - startTime.getTime();

        return {
          status: TIMING_STATUS.RUNNING,
          elapsedTime: this.formatTimeFromMs(elapsedTime),
          elapsedTimeMs: elapsedTime,
          startTime: timingData.startTime,
          participant: {
            name: timingData.participantName,
            bibNumber: timingData.bibNumber,
            category: timingData.category
          }
        };
      }
    } catch (error) {
      logger.error(`Erreur lors de la récupération du temps courant pour le dossard ${bibNumber} dans la course ${raceId}:`, error);
      return null;
    }
  }

  /**
   * Vérifier si une course doit être automatiquement terminée
   */
  async checkRaceFinishConditions(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        return { shouldFinish: false };
      }
      
      // Permettre la vérification pour les courses 'in_progress' et 'finishing'
      if (race.status !== RACE_STATUS.IN_PROGRESS && race.status !== RACE_STATUS.FINISHING) {
        return { shouldFinish: false };
      }

      logger.debug(`Vérification conditions fin de course pour: ${race.name}`);

      // Obtenir le temps de départ de la course (GT)
      const raceStartTime = this.raceStartTimes.get(raceId);
      if (!raceStartTime) {
        logger.debug(`Pas de temps de départ GT pour la course ${raceId}`);
        return { shouldFinish: false };
      }

      const now = new Date();
      // Convertir raceStartTime en Date s'il s'agit d'une chaîne ou d'un timestamp
      const startTimeDate = new Date(raceStartTime);
      const elapsedTimeMs = now.getTime() - startTimeDate.getTime();
      const elapsedTimeMinutes = elapsedTimeMs / (1000 * 60); // Ne pas utiliser floor pour la précision

      logger.debug(`Course ${race.name}: temps écoulé = ${elapsedTimeMinutes.toFixed(2)} min, durée prévue = ${race.duration} ${race.durationType}`);

      let shouldFinish = false;
      let reason = '';

      // Vérification selon le type de durée
      if (race.durationType === 'Temps' && race.duration) {
        // Course en temps : vérifier si le temps est écoulé
        if (elapsedTimeMinutes >= race.duration) {
          shouldFinish = true;
          reason = `Temps de course écoulé (${race.duration} minutes)`;
        }
      } else if (race.durationType === 'Tours' && race.duration) {
        // Course en nombre de tours : vérifier si un participant a terminé le nombre requis
        const timingData = this.timingDataModel.findByRace(raceId);
        
        let maxLaps = 0;
        timingData.forEach(participant => {
          try {
            const passings = this.parsePassings(participant.passings);
            const lapCount = passings.length;
            if (lapCount > maxLaps) {
              maxLaps = lapCount;
            }
          } catch (e) {
            logger.warn(`Erreur parsing passings pour participant ${participant.id}:`, e);
          }
        });

        logger.debug(`Tours maximum atteint: ${maxLaps}/${race.duration}`);
        
        if (maxLaps >= race.duration) {
          shouldFinish = true;
          reason = `Nombre de tours atteint (${race.duration} tours)`;
        }
      }

      if (shouldFinish) {
        logger.info(`🏁 Condition de fin de course remplie: ${reason}`);
        
        // Phase 1 : Marquer la course comme en cours de finition
        await this.startFinishingRace(raceId, reason);
        
        return { 
          shouldFinish: false, // Ne pas terminer immédiatement
          finishing: true,
          reason,
          raceId,
          raceName: race.name
        };
      }

      // Si la course est en phase de finition, vérifier si tous les participants ont terminé
      if (race.status === 'finishing') {
        const allFinished = await this.checkAllParticipantsFinished(raceId);
        if (allFinished) {
          logger.info(`🏁 Tous les participants ont terminé leur tour - Fin définitive de la course`);
          
          // Phase 2 : Terminer définitivement la course
          await this.autoFinishRace(raceId, race.finishReason || 'Tous les participants ont terminé');
          
          return { 
            shouldFinish: true, 
            reason: race.finishReason || 'Tous les participants ont terminé',
            raceId,
            raceName: race.name
          };
        }
      }

      return { shouldFinish: false };
      
    } catch (error) {
      logger.error(`Erreur lors de la vérification des conditions de fin de course ${raceId}:`, error);
      return { shouldFinish: false, error: error.message };
    }
  }

  /**
   * Marquer une course comme en cours de finition (permet aux participants de finir leur tour)
   */
  async startFinishingRace(raceId, reason) {
    try {
      logger.info(`🏁 Début de la phase de finition: ${reason}`);
      
      // Changer le statut de la course à "finishing"
      const updatedRace = this.raceModel.update(raceId, { 
        status: 'finishing',
        finishingStartedAt: new Date().toISOString(),
        finishReason: reason
      });

      if (!updatedRace) {
        throw new Error('Impossible de mettre à jour le statut de la course');
      }

      logger.info(`Course ${updatedRace.name} est maintenant en phase de finition`);
      return updatedRace;
      
    } catch (error) {
      logger.error(`Erreur lors du début de finition de course ${raceId}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier si tous les participants ont terminé leur tour en cours
   */
  async checkAllParticipantsFinished(raceId) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        return false;
      }

      // Permettre la vérification pour les courses 'in_progress' et 'finishing'
      if (race.status !== RACE_STATUS.IN_PROGRESS && race.status !== RACE_STATUS.FINISHING) {
        return false;
      }

      const timingData = this.timingDataModel.findByRace(raceId);
      logger.debug(`Vérification fin de tous les participants pour ${race.name}: ${timingData.length} participants`);
      
      // Pour les courses en tours : vérifier que tous sont terminés, DNF ou DNS
      if (race.durationType === 'Tours') {
        const participantStatuses = timingData.map(participant => {
          const passings = this.parsePassings(participant.passings);
          const status = {
            name: participant.participantName,
            status: participant.status,
            laps: passings.length,
            required: race.duration
          };
          logger.debug(`Participant ${participant.participantName}: statut=${participant.status}, tours=${passings.length}/${race.duration}`);
          return status;
        });
        
        const allFinished = timingData.every(participant => {
          // Un participant est considéré comme "fini" s'il est marqué comme finished, dnf, ou dns
          const isFinished = [TIMING_STATUS.FINISHED, TIMING_STATUS.DNF, TIMING_STATUS.DNS].includes(participant.status);
          return isFinished;
        });
        
        logger.debug(`Tous les participants terminés ? ${allFinished}`);
        return allFinished;
      }
      
      // Pour les courses en temps : vérifier que tous les participants en course ont terminé leur tour
      // ou sont DNF/DNS
      if (race.durationType === 'Temps') {
        const allFinished = timingData.every(participant => {
          // Si le participant est DNF ou DNS, on le considère comme terminé
          if (participant.status === TIMING_STATUS.DNF || participant.status === TIMING_STATUS.DNS || participant.status === TIMING_STATUS.FINISHED) {
            return true;
          }
          
          // Si le participant est encore en train de courir (status = running), 
          // on considère qu'il n'a pas terminé
          if (participant.status === TIMING_STATUS.RUNNING) {
            logger.debug(`Participant ${participant.participantName} encore en course (status: running)`);
            return false;
          }
          
          // Sinon (registered, etc.), on considère comme terminé
          return true;
        });
        
        logger.debug(`Tous les participants terminés (course en temps) ? ${allFinished}`);
        return allFinished;
      }
      
      return false;
      
    } catch (error) {
      logger.error(`Erreur lors de la vérification des participants terminés ${raceId}:`, error);
      return false;
    }
  }

  /**
   * Terminer automatiquement une course
   */
  async autoFinishRace(raceId, reason) {
    try {
      const race = this.raceModel.findById(raceId);
      if (!race) {
        throw new Error('Course non trouvée');
      }

      logger.info(`🏁 Fin automatique de la course: ${race.name} - Raison: ${reason}`);

      // Calculer les positions finales
      await this.calculatePositions(raceId);

      // Marquer tous les participants encore en course comme terminés
      const runningParticipants = this.timingDataModel.findByRace(raceId, { status: TIMING_STATUS.RUNNING });
      runningParticipants.forEach(participant => {
        this.timingDataModel.finishTiming(participant.id, new Date().toISOString());
        logger.debug(`Participant ${participant.participantName} (#${participant.bibNumber}) marqué comme terminé automatiquement`);
      });

      // Recalculer les positions finales après marquage des terminés
      await this.calculatePositions(raceId);

      // Changer le statut de la course
      const updatedRace = this.raceModel.update(raceId, { 
        status: 'finished',
        finishedAt: new Date().toISOString(),
        finishReason: reason
      });

      logger.info(`✅ Course terminée automatiquement: ${race.name}`);

      // Émettre un événement pour notifier le frontend
      if (this.crossmgrService && this.crossmgrService.mainWindow && !this.crossmgrService.mainWindow.isDestroyed()) {
        this.crossmgrService.mainWindow.webContents.send('race:auto_finished', {
          raceId,
          raceName: race.name,
          reason,
          finishedAt: new Date().toISOString()
        });
        logger.debug('Événement race:auto_finished envoyé au frontend');
      }

      return updatedRace;
      
    } catch (error) {
      logger.error(`Erreur lors de la fin automatique de course ${raceId}:`, error);
      throw error;
    }
  }
}

module.exports = TimingService;








