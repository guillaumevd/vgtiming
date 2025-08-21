const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class RaceBackupService {
  constructor() {
    this.backupDirectory = null;
  }

  /**
   * Initialise le répertoire de sauvegarde
   */
  async initializeBackupDirectory() {
    if (this.backupDirectory) return;

    try {
      // Lire la configuration depuis le fichier de config
      const configPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'vg-timing', 'config.json');
      
      try {
        const configContent = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        if (config.outputDir && config.outputDir !== "C:/Users/username/Documents/") {
          this.backupDirectory = config.outputDir.replace(/\/$/, ''); // Supprimer le slash final si présent
        }
      } catch (configError) {
        logger.debug('Impossible de lire la configuration, utilisation du répertoire par défaut', {
          service: 'race-backup',
          error: configError.message
        });
      }

      // Utiliser un répertoire par défaut si pas de configuration
      if (!this.backupDirectory) {
        this.backupDirectory = path.join(require('os').homedir(), 'Documents', 'vg-timing-backups');
      }

      // Créer le répertoire s'il n'existe pas
      await fs.mkdir(this.backupDirectory, { recursive: true });
      
      logger.info(`Répertoire de sauvegarde initialisé: ${this.backupDirectory}`, {
        service: 'race-backup'
      });
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du répertoire de sauvegarde', {
        service: 'race-backup',
        error: error.message
      });
      this.backupDirectory = null;
    }
  }

  /**
   * Récupère toutes les données d'une course directement depuis la base SQLite
   */
  async getRaceDataFromDatabase(raceId) {
    try {
      const { getBackendInstance } = require('../index');
      const backend = getBackendInstance();
      
      if (!backend?.db) {
        throw new Error('Base de données non disponible');
      }

      const db = backend.db;

      // Requête pour récupérer la course
      const raceQuery = 'SELECT * FROM races WHERE id = ?';
      const race = db.prepare(raceQuery).get(raceId);
      
      if (!race) {
        throw new Error(`Course ${raceId} non trouvée`);
      }

      // Requête pour récupérer les participants
      const participantsQuery = 'SELECT * FROM participants WHERE raceId = ? AND isActive = 1 ORDER BY number ASC';
      const participants = db.prepare(participantsQuery).all(raceId);

      // Requête pour récupérer les données de timing avec noms des participants
      const timingQuery = `
        SELECT 
          td.*,
          p.name as participantName,
          p.team as participantTeam,
          p.category as participantCategory
        FROM timing_data td
        LEFT JOIN participants p ON td.participantId = p.id
        WHERE td.raceId = ?
        ORDER BY td.position IS NULL, td.position ASC
      `;
      const rawTimingData = db.prepare(timingQuery).all(raceId);

      // Parser les passings JSON et enrichir les données
      const timingData = rawTimingData.map(timing => ({
        ...timing,
        passings: timing.passings ? JSON.parse(timing.passings) : []
      }));

      // Calculer les statistiques
      const finishedParticipants = timingData.filter(t => t.status === 'finished').length;

      logger.info(`Données récupérées directement depuis SQLite pour la course ${race.name}`, {
        service: 'race-backup',
        participantsCount: participants.length,
        timingDataCount: timingData.length,
        finishedCount: finishedParticipants
      });

      return {
        race,
        participants: participants || [],
        timingData: timingData || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'VG-Timing Auto-Backup',
          version: '1.0',
          totalParticipants: participants.length,
          finishedParticipants: finishedParticipants
        }
      };

    } catch (error) {
      logger.error(`Erreur lors de la récupération des données SQLite pour la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Génère le nom de fichier pour une course
   */
  generateFileName(raceName) {
    const sanitizedName = raceName
      .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, '_') // Remplacer espaces par underscores
      .trim();
    
    return `${sanitizedName}.json`;
  }

  /**
   * Sauvegarde une course dans un fichier JSON
   * MÉTHODE UNIQUE - utilisée par toutes les opérations
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

      // Récupérer les données directement depuis SQLite
      const raceData = await this.getRaceDataFromDatabase(raceId);
      
      // Générer le nom de fichier
      const fileName = this.generateFileName(raceData.race.name);
      const filePath = path.join(this.backupDirectory, fileName);

      // Si le nom de la course a changé, supprimer l'ancien fichier
      if (oldRaceName && oldRaceName !== raceData.race.name) {
        const oldFileName = this.generateFileName(oldRaceName);
        const oldFilePath = path.join(this.backupDirectory, oldFileName);
        try {
          await fs.unlink(oldFilePath);
          logger.info(`Ancien fichier supprimé: ${oldFilePath}`, {
            service: 'race-backup'
          });
        } catch (unlinkError) {
          logger.debug('Impossible de supprimer l\'ancien fichier', {
            service: 'race-backup',
            path: oldFilePath,
            error: unlinkError.message
          });
        }
      }

      // Écrire le fichier JSON
      await fs.writeFile(filePath, JSON.stringify(raceData, null, 2), 'utf8');
      
      logger.info(`Course sauvegardée: ${filePath}`, {
        service: 'race-backup',
        raceId: raceId,
        raceName: raceData.race.name,
        participantsCount: raceData.participants.length,
        timingDataCount: raceData.timingData.length
      });

    } catch (error) {
      logger.error(`Erreur lors de la sauvegarde de la course ${raceId}`, {
        service: 'race-backup',
        error: error.message
      });
    }
  }

  /**
   * Sauvegarde une course avec données complètes (alias pour backupRace)
   */
  async backupRaceWithData(raceId, oldRaceName = null) {
    return this.backupRace(raceId, oldRaceName);
  }

  /**
   * Supprime le fichier de sauvegarde d'une course
   */
  async deleteRaceBackup(raceName) {
    try {
      await this.initializeBackupDirectory();
      
      if (!this.backupDirectory) {
        return;
      }

      const fileName = this.generateFileName(raceName);
      const filePath = path.join(this.backupDirectory, fileName);

      await fs.unlink(filePath);
      
      logger.info(`Fichier de sauvegarde supprimé: ${filePath}`, {
        service: 'race-backup',
        raceName: raceName
      });

    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Erreur lors de la suppression du fichier de sauvegarde pour ${raceName}`, {
          service: 'race-backup',
          error: error.message
        });
      }
    }
  }
}

module.exports = new RaceBackupService();
