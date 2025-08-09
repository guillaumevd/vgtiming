const RaceController = require('./raceController');
const ParticipantController = require('./participantController');
const TimingController = require('./timingController');
const SettingsController = require('./settingsController');
const CrossMgrController = require('./crossmgrController');

/**
 * Factory pour créer les instances des controllers avec les services
 */
class ControllerFactory {
  constructor(services) {
    this.services = services;
    this._controllers = {};
  }

  /**
   * Obtenir une instance du controller Race
   */
  getRaceController() {
    if (!this._controllers.race) {
      this._controllers.race = new RaceController(this.services);
    }
    return this._controllers.race;
  }

  /**
   * Obtenir une instance du controller Participant
   */
  getParticipantController() {
    if (!this._controllers.participant) {
      this._controllers.participant = new ParticipantController(this.services);
    }
    return this._controllers.participant;
  }

  /**
   * Obtenir une instance du controller Timing
   */
  getTimingController() {
    if (!this._controllers.timing) {
      this._controllers.timing = new TimingController(this.services);
    }
    return this._controllers.timing;
  }

  /**
   * Obtenir une instance du controller Settings
   */
  getSettingsController() {
    if (!this._controllers.settings) {
      this._controllers.settings = new SettingsController(this.services);
    }
    return this._controllers.settings;
  }

  /**
   * Obtenir une instance du controller CrossMgr
   */
  getCrossMgrController() {
    if (!this._controllers.crossmgr) {
      this._controllers.crossmgr = new CrossMgrController(this.services);
    }
    return this._controllers.crossmgr;
  }

  /**
   * Obtenir tous les controllers
   */
  getAllControllers() {
    return {
      race: this.getRaceController(),
      participant: this.getParticipantController(),
      timing: this.getTimingController(),
      settings: this.getSettingsController(),
      crossmgr: this.getCrossMgrController()
    };
  }

  /**
   * Réinitialiser le cache des controllers
   */
  resetControllers() {
    this._controllers = {};
  }
}

module.exports = {
  RaceController,
  ParticipantController,
  TimingController,
  SettingsController,
  CrossMgrController,
  ControllerFactory
};
