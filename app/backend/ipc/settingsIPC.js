const { ipcMain } = require('electron');
const logger = require('../utils/logger');

class SettingsIPCHandler {
  constructor(controllers) {
    this.settingsController = controllers.settings;
    this.registerHandlers();
  }

  registerHandlers() {
    // Obtenir un paramètre
    ipcMain.handle('settings:get', async (event, key) => {
      logger.debug('IPC: settings:get', { key });
      return await this.settingsController.getSetting(key);
    });

    // Obtenir plusieurs paramètres
    ipcMain.handle('settings:getMultiple', async (event, keys) => {
      logger.debug('IPC: settings:getMultiple', { keys });
      return await this.settingsController.getMultipleSettings(keys);
    });

    // Obtenir tous les paramètres
    ipcMain.handle('settings:getAll', async (event) => {
      logger.debug('IPC: settings:getAll');
      return await this.settingsController.getAllSettings();
    });

    // Définir un paramètre
    ipcMain.handle('settings:set', async (event, key, value, type = null, description = null) => {
      logger.debug('IPC: settings:set', { key, value, type, description });
      return await this.settingsController.setSetting(key, value, type, description);
    });

    // Définir plusieurs paramètres
    ipcMain.handle('settings:setMultiple', async (event, settings) => {
      logger.debug('IPC: settings:setMultiple', { count: Object.keys(settings || {}).length });
      return await this.settingsController.setMultipleSettings(settings);
    });

    // Supprimer un paramètre
    ipcMain.handle('settings:delete', async (event, key) => {
      logger.debug('IPC: settings:delete', { key });
      return await this.settingsController.deleteSetting(key);
    });

    // Obtenir les paramètres d'application
    ipcMain.handle('settings:getApp', async (event) => {
      logger.debug('IPC: settings:getApp');
      return await this.settingsController.getAppSettings();
    });

    // Obtenir les paramètres de chronométrage
    ipcMain.handle('settings:getTiming', async (event) => {
      logger.debug('IPC: settings:getTiming');
      return await this.settingsController.getTimingSettings();
    });

    // Obtenir les paramètres d'affichage
    ipcMain.handle('settings:getDisplay', async (event) => {
      logger.debug('IPC: settings:getDisplay');
      return await this.settingsController.getDisplaySettings();
    });

    // Mettre à jour les paramètres d'application
    ipcMain.handle('settings:updateApp', async (event, settings) => {
      logger.debug('IPC: settings:updateApp', settings);
      return await this.settingsController.updateAppSettings(settings);
    });

    // Mettre à jour les paramètres de chronométrage
    ipcMain.handle('settings:updateTiming', async (event, settings) => {
      logger.debug('IPC: settings:updateTiming', settings);
      return await this.settingsController.updateTimingSettings(settings);
    });

    // Mettre à jour les paramètres d'affichage
    ipcMain.handle('settings:updateDisplay', async (event, settings) => {
      logger.debug('IPC: settings:updateDisplay', settings);
      return await this.settingsController.updateDisplaySettings(settings);
    });

    // Réinitialiser aux paramètres par défaut
    ipcMain.handle('settings:resetDefaults', async (event) => {
      logger.debug('IPC: settings:resetDefaults');
      return await this.settingsController.resetToDefaults();
    });

    // Exporter les paramètres
    ipcMain.handle('settings:export', async (event) => {
      logger.debug('IPC: settings:export');
      return await this.settingsController.exportSettings();
    });

    // Importer des paramètres
    ipcMain.handle('settings:import', async (event, settingsData) => {
      logger.debug('IPC: settings:import', { count: Object.keys(settingsData || {}).length });
      return await this.settingsController.importSettings(settingsData);
    });

    // Obtenir la configuration complète
    ipcMain.handle('settings:getConfiguration', async (event) => {
      logger.debug('IPC: settings:getConfiguration');
      return await this.settingsController.getAppConfiguration();
    });

    // Valider la configuration
    ipcMain.handle('settings:validateConfiguration', async (event) => {
      logger.debug('IPC: settings:validateConfiguration');
      return await this.settingsController.validateConfiguration();
    });
  }

  unregisterHandlers() {
    const handlers = [
      'settings:get', 'settings:getMultiple', 'settings:getAll', 'settings:set',
      'settings:setMultiple', 'settings:delete', 'settings:getApp',
      'settings:getTiming', 'settings:getDisplay', 'settings:updateApp',
      'settings:updateTiming', 'settings:updateDisplay', 'settings:resetDefaults',
      'settings:export', 'settings:import', 'settings:getConfiguration',
      'settings:validateConfiguration'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = SettingsIPCHandler;
