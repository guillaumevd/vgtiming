const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.isInitialized = false;
  }

  /**
   * Initialise la base de données
   */
  async initialize() {
    try {
      // Déterminer le chemin de la base de données
      const userDataPath = app.getPath('userData');
      const dbDirectory = path.join(userDataPath, 'database');
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(dbDirectory)) {
        fs.mkdirSync(dbDirectory, { recursive: true });
      }

      this.dbPath = path.join(dbDirectory, 'vgtiming.db');
      
      // Créer/ouvrir la base de données
      this.db = new Database(this.dbPath);
      
      // Configurer SQLite pour de meilleures performances
      this.db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA cache_size = 1000000;
        PRAGMA temp_store = memory;
        PRAGMA mmap_size = 268435456;
      `);

      // Exécuter les migrations
      await this.runMigrations();
      
      // Exécuter les seeders
      await this.runSeeders();

      this.isInitialized = true;
      logger.info(`Base de données initialisée: ${this.dbPath}`);
      
      return this.db;
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Exécute les migrations de base de données
   */
  async runMigrations() {
    try {
      // Créer la table de migration
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const migrationsDir = path.join(__dirname, 'migrations');
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.js'))
        .sort();

      for (const file of migrationFiles) {
        const migrationName = path.basename(file, '.js');
        
        // Vérifier si la migration a déjà été exécutée
        const existingMigration = this.db.prepare(
          'SELECT name FROM migrations WHERE name = ?'
        ).get(migrationName);

        if (!existingMigration) {
          logger.info(`Exécution de la migration: ${migrationName}`);
          const migration = require(path.join(migrationsDir, file));
          
          // Exécuter la migration dans une transaction
          const transaction = this.db.transaction(() => {
            migration.up(this.db);
            this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migrationName);
          });
          
          transaction();
          logger.info(`Migration terminée: ${migrationName}`);
        }
      }
    } catch (error) {
      logger.error('Erreur lors de l\'exécution des migrations:', error);
      throw error;
    }
  }

  /**
   * Exécute les seeders
   */
  async runSeeders() {
    try {
      const seedersDir = path.join(__dirname, 'seeders');
      if (!fs.existsSync(seedersDir)) return;

      const seederFiles = fs.readdirSync(seedersDir)
        .filter(file => file.endsWith('.js'))
        .sort();

      for (const file of seederFiles) {
        const seederName = path.basename(file, '.js');
        logger.info(`Exécution du seeder: ${seederName}`);
        
        const seeder = require(path.join(seedersDir, file));
        await seeder.run(this.db);
        
        logger.info(`Seeder terminé: ${seederName}`);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'exécution des seeders:', error);
      throw error;
    }
  }

  /**
   * Retourne l'instance de la base de données
   */
  getDatabase() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Base de données non initialisée');
    }
    return this.db;
  }

  /**
   * Ferme la connexion à la base de données
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('Connexion à la base de données fermée');
    }
  }

  /**
   * Crée une sauvegarde de la base de données
   */
  backup(backupPath) {
    try {
      if (!this.db) throw new Error('Base de données non initialisée');
      
      this.db.backup(backupPath);
      logger.info(`Sauvegarde créée: ${backupPath}`);
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde:', error);
      return false;
    }
  }

  /**
   * Restaure la base de données depuis une sauvegarde
   */
  restore(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Fichier de sauvegarde introuvable');
      }

      // Fermer la connexion actuelle
      if (this.db) {
        this.db.close();
      }

      // Copier le fichier de sauvegarde
      fs.copyFileSync(backupPath, this.dbPath);
      
      // Réinitialiser la base de données
      this.initialize();
      
      logger.info(`Base de données restaurée depuis: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la restauration:', error);
      return false;
    }
  }
}

// Instance singleton
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
