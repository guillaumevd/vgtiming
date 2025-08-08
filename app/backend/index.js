const path = require('path');
const { app } = require('electron');

// Utilitaires
const DatabaseManager = require('./utils/database');
const logger = require('./utils/logger');

// Modèles, Services, Controllers
const { ModelFactory } = require('./models');
const { ServiceFactory } = require('./services');
const { ControllerFactory } = require('./controllers');
const { IPCManager } = require('./ipc');

class BackendManager {
  constructor(mainWindow = null) {
    this.isInitialized = false;
    this.mainWindow = mainWindow;
    this.database = null;
    this.models = null;
    this.services = null;
    this.controllers = null;
    this.ipcManager = null;
  }

  /**
   * Initialiser le backend complet
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('Backend déjà initialisé');
        return;
      }

      logger.info('Initialisation du backend...');

      // 1. Initialiser la base de données
      await this.initializeDatabase();

      // 2. Initialiser les modèles
      this.initializeModels();

      // 3. Initialiser les services
      this.initializeServices();

      // 4. Initialiser les controllers
      this.initializeControllers();

      // 5. Initialiser les gestionnaires IPC
      this.initializeIPC();

      this.isInitialized = true;
      logger.info('Backend initialisé avec succès');

      return {
        success: true,
        message: 'Backend initialisé avec succès'
      };
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du backend:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Initialiser la base de données
   */
  async initializeDatabase() {
    try {
      this.database = new DatabaseManager();
      this.database.initialize();
      
      // Exécuter les migrations
      const migrationsPath = path.join(__dirname, 'database', 'migrations');
      this.database.runMigrations(migrationsPath);
      
      logger.info('Base de données initialisée avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation de la base de données:', error);
      throw error;
    }
  }

  /**
   * Initialiser les modèles
   */
  initializeModels() {
    try {
      this.models = new ModelFactory(this.database.getDatabase()).getAllModels();
      logger.info('Modèles initialisés');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des modèles:', error);
      throw error;
    }
  }

  /**
   * Initialiser les services
   */
  initializeServices() {
    try {
      this.services = new ServiceFactory(this.models).getAllServices();
      logger.info('Services initialisés');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des services:', error);
      throw error;
    }
  }

  /**
   * Initialiser les controllers
   */
  initializeControllers() {
    try {
      this.controllers = new ControllerFactory(this.services).getAllControllers();
      logger.info('Controllers initialisés');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des controllers:', error);
      throw error;
    }
  }

  /**
   * Définir la fenêtre principale pour les dialogues système
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
    // Mettre à jour le handler système si déjà initialisé
    if (this.ipcManager && this.ipcManager.handlers && this.ipcManager.handlers.system) {
      this.ipcManager.handlers.system.mainWindow = mainWindow;
    }
  }

  /**
   * Initialiser les gestionnaires IPC
   */
  initializeIPC() {
    try {
      this.ipcManager = new IPCManager(this.controllers, this.mainWindow);
      this.ipcManager.initialize();
      logger.info('Gestionnaires IPC initialisés');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation des gestionnaires IPC:', error);
      throw error;
    }
  }

  /**
   * Obtenir le chemin de la base de données
   */
  getDatabasePath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'vgtiming.db');
  }

  /**
   * Nettoyer le backend
   */
  async cleanup() {
    try {
      logger.info('Nettoyage du backend...');

      // Nettoyer les gestionnaires IPC
      if (this.ipcManager) {
        this.ipcManager.cleanup();
        this.ipcManager = null;
      }

      // Fermer la base de données
      if (this.database) {
        await this.database.close();
        this.database = null;
      }

      // Réinitialiser les références
      this.controllers = null;
      this.services = null;
      this.models = null;
      this.isInitialized = false;

      logger.info('Backend nettoyé avec succès');
    } catch (error) {
      logger.error('Erreur lors du nettoyage du backend:', error);
    }
  }

  /**
   * Redémarrer le backend
   */
  async restart() {
    try {
      logger.info('Redémarrage du backend...');
      await this.cleanup();
      await this.initialize();
      logger.info('Backend redémarré avec succès');
    } catch (error) {
      logger.error('Erreur lors du redémarrage du backend:', error);
      throw error;
    }
  }

  /**
   * Vérifier l'état du backend
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      database: this.database ? this.database.isReady() : false,
      ipc: this.ipcManager ? this.ipcManager.isReady() : false,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtenir les statistiques du backend
   */
  async getStats() {
    if (!this.isInitialized) {
      return { error: 'Backend non initialisé' };
    }

    try {
      const dbStats = this.database.getStats();
      
      // Obtenir les stats depuis les services
      const raceStats = await this.services.race.getAllRaces({ limit: 1 });
      const settingsStats = await this.services.settings.getAllSettings();

      return {
        database: dbStats,
        races: raceStats.length,
        settings: Object.keys(settingsStats).length,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      return { error: error.message };
    }
  }

  /**
   * Créer une sauvegarde de la base de données
   */
  async createBackup(backupPath = null) {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    try {
      const backup = await this.database.backup(backupPath);
      logger.info(`Sauvegarde créée: ${backup.path}`);
      return backup;
    } catch (error) {
      logger.error('Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Restaurer depuis une sauvegarde
   */
  async restoreBackup(backupPath) {
    if (!this.database) {
      throw new Error('Base de données non initialisée');
    }

    try {
      await this.database.restore(backupPath);
      logger.info(`Base de données restaurée depuis: ${backupPath}`);
      
      // Redémarrer le backend pour recharger les données
      await this.restart();
      
      return { success: true, message: 'Sauvegarde restaurée avec succès' };
    } catch (error) {
      logger.error('Erreur lors de la restauration:', error);
      throw error;
    }
  }

  /**
   * Obtenir les services (pour utilisation externe)
   */
  getServices() {
    if (!this.isInitialized) {
      throw new Error('Backend non initialisé');
    }
    return this.services;
  }

  /**
   * Obtenir les controllers (pour utilisation externe)
   */
  getControllers() {
    if (!this.isInitialized) {
      throw new Error('Backend non initialisé');
    }
    return this.controllers;
  }

  /**
   * Obtenir la base de données (pour utilisation externe)
   */
  getDatabase() {
    if (!this.isInitialized) {
      throw new Error('Backend non initialisé');
    }
    return this.database;
  }
}

// Instance singleton
let backendInstance = null;

/**
 * Obtenir l'instance du backend
 */
function getBackendInstance(mainWindow = null) {
  if (!backendInstance) {
    backendInstance = new BackendManager(mainWindow);
  }
  return backendInstance;
}

/**
 * Initialiser le backend
 */
async function initializeBackend(mainWindow = null) {
  const backend = getBackendInstance(mainWindow);
  return await backend.initialize();
}

/**
 * Définir la fenêtre principale
 */
function setMainWindow(mainWindow) {
  const backend = getBackendInstance();
  backend.setMainWindow(mainWindow);
}
/**
 * Nettoyer le backend
 */
async function cleanupBackend() {
  if (backendInstance) {
    await backendInstance.cleanup();
    backendInstance = null;
  }
}

module.exports = {
  BackendManager,
  getBackendInstance,
  initializeBackend,
  setMainWindow,
  cleanupBackend
};
