const RaceIPCHandler = require('./raceIPC');
const ParticipantIPCHandler = require('./participantIPC');
const TimingIPCHandler = require('./timingIPC');
const SettingsIPCHandler = require('./settingsIPC');
const AppIPCHandler = require('./appIPC');
const SystemIPCHandler = require('./systemIPC');
const logger = require('../utils/logger');

class IPCManager {
  constructor(controllers, mainWindow = null) {
    this.controllers = controllers;
    this.mainWindow = mainWindow;
    this.handlers = {};
    this.isInitialized = false;
  }

  /**
   * Initialiser tous les gestionnaires IPC
   */
  initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('IPC Manager déjà initialisé');
        return;
      }

      // Créer les gestionnaires
      this.handlers = {
        race: new RaceIPCHandler(this.controllers),
        participant: new ParticipantIPCHandler(this.controllers),
        timing: new TimingIPCHandler(this.controllers),
        settings: new SettingsIPCHandler(this.controllers),
        app: new AppIPCHandler(), // Pas besoin de controllers pour les fonctions app
        system: new SystemIPCHandler(this.mainWindow) // Besoin de mainWindow pour les dialogues
      };

      this.isInitialized = true;
      logger.info('IPC Manager initialisé avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation du IPC Manager:', error);
      throw error;
    }
  }

  /**
   * Nettoyer tous les gestionnaires IPC
   */
  cleanup() {
    try {
      if (!this.isInitialized) {
        return;
      }

      // Désinscrire tous les handlers
      Object.values(this.handlers).forEach(handler => {
        if (handler.unregisterHandlers) {
          handler.unregisterHandlers();
        }
      });

      this.handlers = {};
      this.isInitialized = false;
      logger.info('IPC Manager nettoyé avec succès');
    } catch (error) {
      logger.error('Erreur lors du nettoyage du IPC Manager:', error);
    }
  }

  /**
   * Obtenir un gestionnaire spécifique
   */
  getHandler(name) {
    return this.handlers[name];
  }

  /**
   * Vérifier si le manager est initialisé
   */
  isReady() {
    return this.isInitialized;
  }
}

module.exports = {
  IPCManager,
  RaceIPCHandler,
  ParticipantIPCHandler,
  TimingIPCHandler,
  SettingsIPCHandler,
  AppIPCHandler,
  SystemIPCHandler
};
