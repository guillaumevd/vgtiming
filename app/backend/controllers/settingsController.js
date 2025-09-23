const logger = require('../utils/logger');

class SettingsController {
  constructor(services) {
    this.settingsService = services.settings;
  }

  /**
   * Obtenir un paramètre
   */
  async getSetting(key) {
    try {
      const value = await this.settingsService.getSetting(key);
      logger.debug(`getSetting(${key}) returned:`, value);
      return { success: true, data: value };
    } catch (error) {
      logger.error('SettingsController.getSetting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir plusieurs paramètres
   */
  async getMultipleSettings(keys) {
    try {
      const settings = await this.settingsService.getMultipleSettings(keys);
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.getMultipleSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir tous les paramètres
   */
  async getAllSettings() {
    try {
      const settings = await this.settingsService.getAllSettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.getAllSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Définir un paramètre
   */
  async setSetting(key, value, type = null, description = null) {
    try {
      const result = await this.settingsService.setSetting(key, value, type, description);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.setSetting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Définir plusieurs paramètres
   */
  async setMultipleSettings(settings) {
    try {
      const result = await this.settingsService.setMultipleSettings(settings);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.setMultipleSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Supprimer un paramètre
   */
  async deleteSetting(key) {
    try {
      const result = await this.settingsService.deleteSetting(key);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.deleteSetting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les paramètres de l'application
   */
  async getAppSettings() {
    try {
      const settings = await this.settingsService.getAppSettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.getAppSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les paramètres de chronométrage
   */
  async getTimingSettings() {
    try {
      const settings = await this.settingsService.getTimingSettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.getTimingSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir les paramètres d'affichage
   */
  async getDisplaySettings() {
    try {
      const settings = await this.settingsService.getDisplaySettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.getDisplaySettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour les paramètres d'application
   */
  async updateAppSettings(settings) {
    try {
      const result = await this.settingsService.updateAppSettings(settings);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.updateAppSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour les paramètres de chronométrage
   */
  async updateTimingSettings(settings) {
    try {
      const result = await this.settingsService.updateTimingSettings(settings);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.updateTimingSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mettre à jour les paramètres d'affichage
   */
  async updateDisplaySettings(settings) {
    try {
      const result = await this.settingsService.updateDisplaySettings(settings);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.updateDisplaySettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  async resetToDefaults() {
    try {
      const result = await this.settingsService.resetToDefaults();
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.resetToDefaults:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporter les paramètres
   */
  async exportSettings() {
    try {
      const settings = await this.settingsService.exportSettings();
      return { success: true, data: settings };
    } catch (error) {
      logger.error('SettingsController.exportSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Importer des paramètres
   */
  async importSettings(settingsData) {
    try {
      const result = await this.settingsService.importSettings(settingsData);
      return { success: true, data: result };
    } catch (error) {
      logger.error('SettingsController.importSettings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir la configuration complète
   */
  async getAppConfiguration() {
    try {
      const config = await this.settingsService.getAppConfiguration();
      return { success: true, data: config };
    } catch (error) {
      logger.error('SettingsController.getAppConfiguration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Valider la configuration
   */
  async validateConfiguration() {
    try {
      const validation = await this.settingsService.validateConfiguration();
      return { success: true, data: validation };
    } catch (error) {
      logger.error('SettingsController.validateConfiguration:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SettingsController;
