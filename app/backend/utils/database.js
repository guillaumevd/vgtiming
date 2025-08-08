const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('./logger');

/**
 * Gestionnaire de base de données SQLite
 */
class DatabaseManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.dbPath = null;
  }

  /**
   * Initialiser la base de données
   */
  initialize() {
    try {
      // Déterminer le chemin de la base de données
      const userDataPath = app ? app.getPath('userData') : './data';
      const dbDir = path.join(userDataPath, 'vg-timing');
      
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.dbPath = path.join(dbDir, 'vgtiming.db');
      
      // Créer/ouvrir la base de données
      this.db = new Database(this.dbPath);
      
      // Configuration pour de meilleures performances
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = MEMORY');
      
      // Activer les clés étrangères
      this.db.pragma('foreign_keys = ON');
      
      this.isInitialized = true;
      logger.info(`Base de données initialisée: ${this.dbPath}`);
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Obtenir l'instance de la base de données
   */
  getDatabase() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Base de données non initialisée');
    }
    return this.db;
  }

  /**
   * Vérifier si la base de données est initialisée
   */
  isReady() {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Exécuter les migrations de base de données
   */
  runMigrations(migrationsPath) {
    try {
      if (!this.isReady()) {
        throw new Error('Base de données non initialisée');
      }

      // Créer la table des migrations si elle n'existe pas
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Obtenir la liste des migrations déjà exécutées
      const executedMigrations = this.db.prepare(`
        SELECT name FROM migrations ORDER BY id
      `).all().map(row => row.name);

      // Lire les fichiers de migration
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.js'))
        .sort();

      let executedCount = 0;

      for (const migrationFile of migrationFiles) {
        const migrationName = path.basename(migrationFile, '.js');
        
        if (executedMigrations.includes(migrationName)) {
          logger.debug(`Migration déjà exécutée: ${migrationName}`);
          continue;
        }

        logger.info(`Exécution de la migration: ${migrationName}`);
        
        // Charger et exécuter la migration JavaScript
        const migrationPath = path.join(migrationsPath, migrationFile);
        
        // Utiliser une transaction
        const transaction = this.db.transaction(() => {
          // Clear require cache and load migration
          delete require.cache[require.resolve(migrationPath)];
          const migration = require(migrationPath);
          
          if (typeof migration.up === 'function') {
            migration.up(this.db);
          } else {
            throw new Error(`Migration ${migrationName} ne contient pas de fonction 'up'`);
          }
          
          // Marquer comme exécutée
          this.db.prepare(`
            INSERT INTO migrations (name) VALUES (?)
          `).run(migrationName);
        });

        transaction();
        executedCount++;
        
        logger.info(`Migration exécutée avec succès: ${migrationName}`);
      }

      if (executedCount > 0) {
        logger.info(`${executedCount} migrations exécutées avec succès`);
      } else {
        logger.info('Aucune nouvelle migration à exécuter');
      }

      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'exécution des migrations:', error);
      throw error;
    }
  }

  /**
   * Créer une sauvegarde de la base de données
   */
  createBackup(backupPath = null) {
    try {
      if (!this.isReady()) {
        throw new Error('Base de données non initialisée');
      }

      if (!backupPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.dirname(this.dbPath);
        backupPath = path.join(backupDir, `vgtiming_backup_${timestamp}.db`);
      }

      // Créer le dossier de sauvegarde si nécessaire
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Créer la sauvegarde
      this.db.backup(backupPath);
      
      logger.info(`Sauvegarde créée: ${backupPath}`);
      return backupPath;
    } catch (error) {
      logger.error('Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Restaurer une sauvegarde
   */
  restoreBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Fichier de sauvegarde non trouvé');
      }

      // Fermer la base de données actuelle
      if (this.db) {
        this.db.close();
      }

      // Copier la sauvegarde
      fs.copyFileSync(backupPath, this.dbPath);

      // Rouvrir la base de données
      this.initialize();

      logger.info(`Sauvegarde restaurée depuis: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la restauration de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Obtenir des informations sur la base de données
   */
  getInfo() {
    try {
      if (!this.isReady()) {
        return null;
      }

      const stats = fs.statSync(this.dbPath);
      const pragma = {
        journal_mode: this.db.pragma('journal_mode', { simple: true }),
        synchronous: this.db.pragma('synchronous', { simple: true }),
        cache_size: this.db.pragma('cache_size', { simple: true }),
        foreign_keys: this.db.pragma('foreign_keys', { simple: true })
      };

      return {
        path: this.dbPath,
        size: stats.size,
        modified: stats.mtime,
        pragma
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des informations de la base de données:', error);
      return null;
    }
  }

  /**
   * Optimiser la base de données
   */
  optimize() {
    try {
      if (!this.isReady()) {
        throw new Error('Base de données non initialisée');
      }

      logger.info('Optimisation de la base de données...');
      
      // Analyser les tables
      this.db.exec('ANALYZE');
      
      // Compacter la base de données
      this.db.exec('VACUUM');
      
      logger.info('Optimisation terminée');
      return true;
    } catch (error) {
      logger.error('Erreur lors de l\'optimisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'intégrité de la base de données
   */
  checkIntegrity() {
    try {
      if (!this.isReady()) {
        throw new Error('Base de données non initialisée');
      }

      const result = this.db.prepare('PRAGMA integrity_check').get();
      const isOk = result.integrity_check === 'ok';
      
      if (isOk) {
        logger.info('Vérification d\'intégrité: OK');
      } else {
        logger.warn('Problème d\'intégrité détecté:', result);
      }

      return isOk;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'intégrité:', error);
      throw error;
    }
  }

  /**
   * Fermer la base de données
   */
  close() {
    try {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      
      this.isInitialized = false;
      logger.info('Base de données fermée');
    } catch (error) {
      logger.error('Erreur lors de la fermeture de la base de données:', error);
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getUsageStats() {
    try {
      if (!this.isReady()) {
        return null;
      }

      // Obtenir les informations sur les tables
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();

      const stats = {
        tables: {},
        totalRows: 0,
        databaseSize: 0
      };

      // Compter les enregistrements par table
      for (const table of tables) {
        const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        stats.tables[table.name] = count.count;
        stats.totalRows += count.count;
      }

      // Taille du fichier
      if (fs.existsSync(this.dbPath)) {
        stats.databaseSize = fs.statSync(this.dbPath).size;
      }

      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }
}

module.exports = DatabaseManager;
