const RaceService = require('./raceService');
const ParticipantService = require('./participantService');
const TimingService = require('./timingService');
const SettingsService = require('./settingsService');
const CrossMgrService = require('./crossmgrService');
const AppLogService = require('./appLogService');
const raceBackupService = require('./raceBackupService');

/**
 * Factory pour créer les instances des services avec les modèles
 */
class ServiceFactory {
  constructor(models, mainWindow = null) {
    this.models = models;
    this.mainWindow = mainWindow;
    this._services = {};
  }

  /**
   * Définir la fenêtre principale
   */
  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
    // Mettre à jour le service CrossMgr s'il existe déjà
    if (this._services.crossmgr) {
      this._services.crossmgr.setMainWindow(mainWindow);
    }
  }

  /**
   * Obtenir une instance du service Race
   */
  getRaceService() {
    if (!this._services.race) {
      this._services.race = new RaceService(this.models);
    }
    return this._services.race;
  }

  /**
   * Obtenir une instance du service Participant
   */
  getParticipantService() {
    if (!this._services.participant) {
      this._services.participant = new ParticipantService(this.models);
    }
    return this._services.participant;
  }

  /**
   * Obtenir une instance du service Timing
   */
  getTimingService() {
    if (!this._services.timing) {
      // Créer le TimingService avec référence au CrossMgrService
      this._services.timing = new TimingService(this.models, this.getCrossMgrService());
    }
    return this._services.timing;
  }

  /**
   * Obtenir une instance du service Settings
   */
  getSettingsService() {
    if (!this._services.settings) {
      this._services.settings = new SettingsService(this.models);
    }
    return this._services.settings;
  }

  /**
   * Obtenir une instance du service CrossMgr
   */
  getCrossMgrService() {
    if (!this._services.crossmgr) {
      this._services.crossmgr = new CrossMgrService(this.mainWindow, this.getSettingsService());
    }
    return this._services.crossmgr;
  }

  /**
   * Obtenir une instance du service de logs d'application
   */
  getAppLogService() {
    if (!this._services.appLog) {
      this._services.appLog = new AppLogService();
    }
    return this._services.appLog;
  }

  /**
   * Obtenir tous les services
   */
  getAllServices() {
    return {
      race: this.getRaceService(),
      participant: this.getParticipantService(),
      timing: this.getTimingService(),
      settings: this.getSettingsService(),
      crossmgr: this.getCrossMgrService(),
      appLog: this.getAppLogService()
    };
  }

  /**
   * Réinitialiser le cache des services
   */
  resetServices() {
    this._services = {};
  }
}

module.exports = {
  RaceService,
  ParticipantService,
  TimingService,
  SettingsService,
  CrossMgrService,
  AppLogService,
  ServiceFactory
};
