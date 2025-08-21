const fs = require('fs').promises;
const path = require('path');
const { getSettings } = require('../models/Settings');
const { getRaceById } = require('../models/Race');
const { getParticipantsByRaceId } = require('../models/Participant');
const { getTimingDataByRaceId } = require('../models/TimingData');
const logger = require('../utils/logger');

class RaceBackupService {
  constructor() {
    this.backupDirectory = null;
  }

  /**
   * Initialise le répertoire de sauvegarde depuis les paramètres
   */
  async initializeBackupDirectory() {
    try {
      // Obtenir l'instance du backend pour accéder aux modèles initialisés
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend || !backend.models || !backend.models.settings) {
        logger.debug('Modèles non encore initialisés pour la sauvegarde', {
          service: 'race-backup'
        });
        return;
      }
      
      // Obtenir le répertoire de sauvegarde depuis les paramètres
      const backupDirectory = backend.models.settings.get('outputDir');
      
      if (backupDirectory) {
        this.backupDirectory = backupDirectory;
        
        // Créer le dossier s'il n'existe pas
        await this.ensureDirectoryExists(this.backupDirectory);
        
        logger.info(`Répertoire de sauvegarde initialisé: ${this.backupDirectory}`, {
          service: 'race-backup'
        });
      } else {
        logger.debug('Aucun répertoire de sauvegarde défini dans les paramètres', {
          service: 'race-backup'
        });
      }
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du répertoire de sauvegarde', {
        service: 'race-backup',
        error: error.message
      });
    }
  }

  /**
   * S'assure que le répertoire existe
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        logger.info(`Répertoire créé: ${dirPath}`, { service: 'race-backup' });
      } else {
        throw error;
      }
    }
  }

  /**
   * Génère le nom de fichier pour une course
   */
  generateFilename(raceName) {
    // Nettoyer le nom pour un nom de fichier valide
    const cleanName = raceName
      .replace(/[<>:"/\\|?*]/g, '_') // Remplacer les caractères interdits
      .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
      .trim();
    
    return `${cleanName}.json`;
  }

  /**
   * Génère le chemin complet du fichier de sauvegarde
   */
  getBackupFilePath(raceName) {
    if (!this.backupDirectory) {
      throw new Error('Répertoire de sauvegarde non initialisé');
    }
    
    const filename = this.generateFilename(raceName);
    return path.join(this.backupDirectory, filename);
  }

  /**
   * Collecte toutes les données d'une course
   */
  async collectRaceData(raceId) {
    try {
      // Obtenir l'instance du backend pour accéder aux services
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend || !backend.services) {
        throw new Error('Services du backend non disponibles');
      }

      // Utiliser les services pour récupérer les données
      const raceResult = await backend.services.race.getRaceById(raceId);
      if (!raceResult.success || !raceResult.data) {
        throw new Error(`Course introuvable: ${raceId}`);
      }

      const participantsResult = await backend.services.participant.getParticipantsByRaceId(raceId);
      const timingData = await this.getTimingDataByRaceIdDirect(raceId);

      return {
        race: raceResult.data,
        participants: (participantsResult.success ? participantsResult.data : []) || [],
        timingData: timingData || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'VG-Timing Auto-Backup',
          version: '1.0',
          totalParticipants: (participantsResult.success ? participantsResult.data?.length : 0) || 0,
          finishedParticipants: timingData ? timingData.filter(t => t.status === 'finished').length : 0
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la collecte des données pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Sauvegarde une course dans un fichier JSON avec les données passées directement
   */
  async backupRaceWithData(raceData, oldRaceName = null) {
    try {
      await this.initializeBackupDirectory();
      
      if (!this.backupDirectory) {
        logger.debug('Sauvegarde ignorée: aucun répertoire de sauvegarde configuré', {
          service: 'race-backup',
          raceId: raceData.id
        });
        return;
      }

      // Collecter les participants et données de timing
      const participantsResult = await this.getParticipantsByRaceIdDirect(raceData.id);
      const timingResult = await this.getTimingDataByRaceId(raceData.id);

      const fullRaceData = {
        race: raceData,
        participants: participantsResult || [],
        timingData: timingResult || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'VG-Timing Auto-Backup',
          version: '1.0',
          totalParticipants: (participantsResult?.length) || 0,
          finishedParticipants: (timingResult?.filter(t => t.finishTime)?.length) || 0
        }
      };

      const currentFilePath = this.getBackupFilePath(raceData.name);
      
      // Si le nom de la course a changé, supprimer l'ancien fichier
      if (oldRaceName && oldRaceName !== raceData.name) {
        await this.deleteRaceBackup(oldRaceName);
      }

      // Écrire le nouveau fichier
      const jsonData = JSON.stringify(fullRaceData, null, 2);
      await fs.writeFile(currentFilePath, jsonData, 'utf8');

      logger.info(`Course sauvegardée: ${currentFilePath}`, {
        service: 'race-backup',
        raceId: raceData.id,
        raceName: raceData.name
      });

    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de la course ${raceData.id}`, {
        service: 'race-backup',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Récupère les participants par ID de course (version directe via modèle)
   */
  async getParticipantsByRaceIdDirect(raceId) {
    try {
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend?.models?.participant) {
        logger.debug('Modèle participant non disponible', { service: 'race-backup' });
        return [];
      }

      logger.debug(`Tentative de récupération des participants (modèle) pour la course ${raceId}`, { service: 'race-backup' });
      const participants = backend.models.participant.findByRace(raceId);
      logger.debug(`Résultat récupération participants (modèle):`, { service: 'race-backup', count: participants?.length || 0 });
      
      return participants || [];
    } catch (error) {
      logger.debug(`Impossible de récupérer les participants (modèle) pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
      return [];
    }
  }

  /**
   * Récupère les données de timing par ID de course - méthode directe via modèle
   */
  async getTimingDataByRaceIdDirect(raceId) {
    try {
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      logger.debug(`Tentative de récupération des données de timing (modèle) pour la course ${raceId}`, {
        service: 'race-backup',
        backendAvailable: !!backend,
        modelsAvailable: !!backend?.models,
        timingDataModelAvailable: !!backend?.models?.timingData
      });
      
      if (!backend?.models?.timingData) {
        logger.warn(`Modèle TimingData non disponible pour la course ${raceId}`, {
          service: 'race-backup'
        });
        return [];
      }

      // Accès direct au modèle TimingData
      const timingData = backend.models.timingData.findByRace(raceId);
      
      logger.debug(`Données de timing récupérées pour la course ${raceId}`, {
        service: 'race-backup',
        count: timingData ? timingData.length : 0,
        data: timingData ? timingData.map(t => ({
          id: t.id,
          participantName: t.participantName,
          bibNumber: t.bibNumber,
          status: t.status,
          passingsCount: t.passings ? t.passings.length : 0
        })) : []
      });
      
      return timingData || [];
    } catch (error) {
      logger.error(`Erreur lors de la récupération directe des données de timing pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message,
        stack: error.stack
      });
      return [];
    }
  }

  /**
   * Récupère les données de timing par ID de course
   */
  async getTimingDataByRaceId(raceId) {
    try {
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend?.services?.timing) {
        return [];
      }

      const result = await backend.services.timing.getTimingDataByRace(raceId);
      return result.success ? result.data : [];
    } catch (error) {
      logger.debug(`Impossible de récupérer les données de timing pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
      return [];
    }
  }
  /**
   * Sauvegarde une course dans un fichier JSON en récupérant les données par ID
   * Version robuste qui accède directement aux modèles
   */
  async backupRace(raceId, oldRaceName = null) {
    try {
      await this.initializeBackupDirectory();
      
      if (!this.backupDirectory) {
        logger.debug('Sauvegarde ignorée: aucun répertoire de sauvegarde configuré', {
          service: 'race-backup',
          raceId: raceId
        });
        return;
      }

      // Récupérer la course directement via le modèle (plus fiable)
      const raceData = await this.getRaceByIdDirect(raceId);
      if (!raceData) {
        throw new Error(`Course introuvable: ${raceId}`);
      }

      // Utiliser la méthode backupRaceWithData avec les données récupérées
      await this.backupRaceWithData(raceData, oldRaceName);

    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Récupère une course directement via le modèle (évite les problèmes de services)
   */
  async getRaceByIdDirect(raceId) {
    try {
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend?.models?.race) {
        logger.debug('Modèle race non disponible', { service: 'race-backup' });
        return null;
      }

      // Accès direct au modèle, pas au service
      const race = backend.models.race.findById(raceId);
      return race;
    } catch (error) {
      logger.debug(`Impossible de récupérer la course ${raceId} via le modèle`, {
        service: 'race-backup',
        error: error.message
      });
      return null;
    }
  }

  /**
   * Supprime le fichier de sauvegarde d'une course
   */
  async deleteRaceBackup(raceName) {
    try {
      if (!this.backupDirectory) {
        return;
      }

      const filePath = this.getBackupFilePath(raceName);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        
        logger.info(`Fichier de sauvegarde supprimé: ${filePath}`, {
          service: 'race-backup'
        });
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // Le fichier n'existe pas, ce n'est pas une erreur
      }
    } catch (error) {
      logger.error(`Erreur lors de la suppression du fichier de sauvegarde pour ${raceName}`, {
        service: 'race-backup',
        error: error.message
      });
    }
  }

  /**
   * Met à jour la sauvegarde d'une course avec les nouvelles données de chronométrage
   */
  async updateTimingData(raceId) {
    try {
      // Utiliser la même méthode que pour la sauvegarde complète
      await this.backupRace(raceId);
    } catch (error) {
      logger.error(`Erreur lors de la mise à jour des données de chronométrage pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
    }
  }
}

// Instance singleton
const raceBackupService = new RaceBackupService();

module.exports = raceBackupService;
