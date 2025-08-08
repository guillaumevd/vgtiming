const logger = require('../utils/logger');

class SettingsService {
  constructor(models) {
    this.settingsModel = models.settings;
  }

  /**
   * Obtenir un paramètre
   */
  async getSetting(key) {
    try {
      const value = this.settingsModel.get(key);
      return value;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du paramètre ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir plusieurs paramètres
   */
  async getMultipleSettings(keys) {
    try {
      const settings = this.settingsModel.getMultiple(keys);
      return settings;
    } catch (error) {
      logger.error('Erreur lors de la récupération de plusieurs paramètres:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les paramètres
   */
  async getAllSettings() {
    try {
      const settings = this.settingsModel.getAll();
      return settings;
    } catch (error) {
      logger.error('Erreur lors de la récupération de tous les paramètres:', error);
      throw error;
    }
  }

  /**
   * Définir un paramètre
   */
  async setSetting(key, value, type = null, description = null) {
    try {
      const success = this.settingsModel.set(key, value, type, description);
      if (success) {
        logger.info(`Paramètre mis à jour: ${key} = ${value}`);
      }
      return success;
    } catch (error) {
      logger.error(`Erreur lors de la définition du paramètre ${key}:`, error);
      throw error;
    }
  }

  /**
   * Définir plusieurs paramètres
   */
  async setMultipleSettings(settings) {
    try {
      const success = this.settingsModel.setMultiple(settings);
      if (success) {
        const keys = Object.keys(settings);
        logger.info(`${keys.length} paramètres mis à jour: ${keys.join(', ')}`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur lors de la définition de plusieurs paramètres:', error);
      throw error;
    }
  }

  /**
   * Supprimer un paramètre
   */
  async deleteSetting(key) {
    try {
      const success = this.settingsModel.delete(key);
      if (success) {
        logger.info(`Paramètre supprimé: ${key}`);
      }
      return success;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du paramètre ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres de l'application
   */
  async getAppSettings() {
    try {
      return this.settingsModel.getAppSettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres d\'application:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres de chronométrage
   */
  async getTimingSettings() {
    try {
      return this.settingsModel.getTimingSettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres de chronométrage:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres d'affichage
   */
  async getDisplaySettings() {
    try {
      return this.settingsModel.getDisplaySettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres d\'affichage:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres d'export
   */
  async getExportSettings() {
    try {
      return this.settingsModel.getExportSettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres d\'export:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres de sauvegarde
   */
  async getBackupSettings() {
    try {
      return this.settingsModel.getBackupSettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres de sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres de logging
   */
  async getLoggingSettings() {
    try {
      return this.settingsModel.getLoggingSettings();
    } catch (error) {
      logger.error('Erreur lors de la récupération des paramètres de logging:', error);
      throw error;
    }
  }

  /**
   * Réinitialiser aux paramètres par défaut
   */
  async resetToDefaults() {
    try {
      const count = this.settingsModel.resetToDefaults();
      logger.info(`Paramètres réinitialisés: ${count} paramètres par défaut restaurés`);
      return count;
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation des paramètres:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un paramètre existe
   */
  async hasSetting(key) {
    try {
      return this.settingsModel.has(key);
    } catch (error) {
      logger.error(`Erreur lors de la vérification du paramètre ${key}:`, error);
      return false;
    }
  }

  /**
   * Exporter tous les paramètres
   */
  async exportSettings() {
    try {
      const settings = this.settingsModel.export();
      logger.info(`Paramètres exportés: ${Object.keys(settings).length} paramètres`);
      return settings;
    } catch (error) {
      logger.error('Erreur lors de l\'export des paramètres:', error);
      throw error;
    }
  }

  /**
   * Importer des paramètres
   */
  async importSettings(settingsData) {
    try {
      const success = this.settingsModel.import(settingsData);
      if (success) {
        logger.info(`Paramètres importés: ${Object.keys(settingsData).length} paramètres`);
      }
      return success;
    } catch (error) {
      logger.error('Erreur lors de l\'import des paramètres:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres d'application
   */
  async updateAppSettings(settings) {
    try {
      const appSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        appSettings[`app.${key}`] = value;
      });

      return await this.setMultipleSettings(appSettings);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres d\'application:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres de chronométrage
   */
  async updateTimingSettings(settings) {
    try {
      const timingSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        timingSettings[`timing.${key}`] = value;
      });

      return await this.setMultipleSettings(timingSettings);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres de chronométrage:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres d'affichage
   */
  async updateDisplaySettings(settings) {
    try {
      const displaySettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        displaySettings[`display.${key}`] = value;
      });

      return await this.setMultipleSettings(displaySettings);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres d\'affichage:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres d'export
   */
  async updateExportSettings(settings) {
    try {
      const exportSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        exportSettings[`export.${key}`] = value;
      });

      return await this.setMultipleSettings(exportSettings);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres d\'export:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres de sauvegarde
   */
  async updateBackupSettings(settings) {
    try {
      const backupSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        backupSettings[`backup.${key}`] = value;
      });

      return await this.setMultipleSettings(backupSettings);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres de sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les paramètres de logging
   */
  async updateLoggingSettings(settings) {
    try {
      const loggingSettings = {};
      Object.entries(settings).forEach(([key, value]) => {
        loggingSettings[`logging.${key}`] = value;
      });

      const success = await this.setMultipleSettings(loggingSettings);
      
      // Reconfigurer le logger si le niveau de log a changé
      if (settings.level && success) {
        logger.level = settings.level;
        logger.info(`Niveau de logging mis à jour: ${settings.level}`);
      }

      return success;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des paramètres de logging:', error);
      throw error;
    }
  }

  /**
   * Obtenir la configuration complète de l'application
   */
  async getAppConfiguration() {
    try {
      const allSettings = await this.getAllSettings();
      
      return {
        app: this.extractSettingsByPrefix(allSettings, 'app.'),
        timing: this.extractSettingsByPrefix(allSettings, 'timing.'),
        display: this.extractSettingsByPrefix(allSettings, 'display.'),
        export: this.extractSettingsByPrefix(allSettings, 'export.'),
        backup: this.extractSettingsByPrefix(allSettings, 'backup.'),
        logging: this.extractSettingsByPrefix(allSettings, 'logging.')
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération de la configuration complète:', error);
      throw error;
    }
  }

  /**
   * Extraire les paramètres par préfixe
   */
  extractSettingsByPrefix(allSettings, prefix) {
    const result = {};
    Object.entries(allSettings).forEach(([key, setting]) => {
      if (key.startsWith(prefix)) {
        const shortKey = key.substring(prefix.length);
        result[shortKey] = setting.value;
      }
    });
    return result;
  }

  /**
   * Valider la configuration
   */
  async validateConfiguration() {
    try {
      const config = await this.getAppConfiguration();
      const errors = [];

      // Validation des paramètres critiques
      if (!config.app.name) {
        errors.push('Le nom de l\'application est requis');
      }

      if (!config.app.version) {
        errors.push('La version de l\'application est requise');
      }

      if (!['fr', 'en'].includes(config.display.language)) {
        errors.push('Langue non supportée');
      }

      if (!['dark', 'light'].includes(config.display.theme)) {
        errors.push('Thème non supporté');
      }

      if (!['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
        errors.push('Niveau de logging invalide');
      }

      if (config.backup.backupInterval < 60) {
        errors.push('L\'intervalle de sauvegarde doit être d\'au moins 60 secondes');
      }

      return {
        valid: errors.length === 0,
        errors,
        config
      };
    } catch (error) {
      logger.error('Erreur lors de la validation de la configuration:', error);
      return {
        valid: false,
        errors: ['Erreur lors de la validation de la configuration'],
        config: null
      };
    }
  }
}

module.exports = SettingsService;
