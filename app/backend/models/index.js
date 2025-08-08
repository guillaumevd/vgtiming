const Race = require('./Race');
const Participant = require('./Participant');
const TimingData = require('./TimingData');
const Settings = require('./Settings');

/**
 * Factory pour créer les instances des modèles avec la base de données
 */
class ModelFactory {
  constructor(database) {
    this.database = database;
    this._models = {};
  }

  /**
   * Obtenir une instance du modèle Race
   */
  getRace() {
    if (!this._models.race) {
      this._models.race = new Race(this.database);
    }
    return this._models.race;
  }

  /**
   * Obtenir une instance du modèle Participant
   */
  getParticipant() {
    if (!this._models.participant) {
      this._models.participant = new Participant(this.database);
    }
    return this._models.participant;
  }

  /**
   * Obtenir une instance du modèle TimingData
   */
  getTimingData() {
    if (!this._models.timingData) {
      this._models.timingData = new TimingData(this.database);
    }
    return this._models.timingData;
  }

  /**
   * Obtenir une instance du modèle Settings
   */
  getSettings() {
    if (!this._models.settings) {
      this._models.settings = new Settings(this.database);
    }
    return this._models.settings;
  }

  /**
   * Obtenir tous les modèles
   */
  getAllModels() {
    return {
      race: this.getRace(),
      participant: this.getParticipant(),
      timingData: this.getTimingData(),
      settings: this.getSettings()
    };
  }
}

module.exports = {
  Race,
  Participant,
  TimingData,
  Settings,
  ModelFactory
};
