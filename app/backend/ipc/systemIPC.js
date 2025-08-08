const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class SystemIPCHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.registerHandlers();
  }

  registerHandlers() {
    // Sélectionner un dossier
    ipcMain.handle('system:select-folder', async (event) => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          title: 'Sélectionner un dossier',
          properties: ['openDirectory', 'createDirectory'],
          buttonLabel: 'Sélectionner'
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];
          logger.info('Dossier sélectionné:', selectedPath);
          
          return {
            success: true,
            data: {
              path: selectedPath,
              name: path.basename(selectedPath)
            }
          };
        }

        return { success: false, canceled: true };
      } catch (error) {
        logger.error('Erreur lors de la sélection de dossier:', error);
        return { success: false, error: error.message };
      }
    });

    // Sélectionner un fichier
    ipcMain.handle('system:select-file', async (event, filters = []) => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow, {
          title: 'Sélectionner un fichier',
          properties: ['openFile'],
          filters: filters.length > 0 ? filters : [
            { name: 'Tous les fichiers', extensions: ['*'] }
          ]
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];
          const stats = fs.statSync(selectedPath);
          
          logger.info('Fichier sélectionné:', selectedPath);
          
          return {
            success: true,
            data: {
              path: selectedPath,
              name: path.basename(selectedPath),
              extension: path.extname(selectedPath),
              size: stats.size,
              directory: path.dirname(selectedPath)
            }
          };
        }

        return { success: false, canceled: true };
      } catch (error) {
        logger.error('Erreur lors de la sélection de fichier:', error);
        return { success: false, error: error.message };
      }
    });

    // Ouvrir un dossier dans l'explorateur
    ipcMain.handle('system:open-folder', async (event, folderPath) => {
      try {
        if (!folderPath || !fs.existsSync(folderPath)) {
          return { success: false, error: 'Le dossier n\'existe pas' };
        }

        await shell.openPath(folderPath);
        logger.info('Dossier ouvert:', folderPath);
        
        return { success: true };
      } catch (error) {
        logger.error('Erreur lors de l\'ouverture du dossier:', error);
        return { success: false, error: error.message };
      }
    });

    // Créer un dossier s'il n'existe pas
    ipcMain.handle('system:ensure-directory', async (event, dirPath) => {
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
          logger.info('Dossier créé:', dirPath);
        }
        
        return { success: true, data: { path: dirPath, created: !fs.existsSync(dirPath) } };
      } catch (error) {
        logger.error('Erreur lors de la création du dossier:', error);
        return { success: false, error: error.message };
      }
    });

    // Vérifier si un chemin existe
    ipcMain.handle('system:path-exists', async (event, pathToCheck) => {
      try {
        const exists = fs.existsSync(pathToCheck);
        const isDirectory = exists ? fs.statSync(pathToCheck).isDirectory() : false;
        
        return {
          success: true,
          data: {
            exists,
            isDirectory,
            isFile: exists && !isDirectory
          }
        };
      } catch (error) {
        logger.error('Erreur lors de la vérification du chemin:', error);
        return { success: false, error: error.message };
      }
    });
  }

  unregisterHandlers() {
    const handlers = [
      'system:select-folder',
      'system:select-file', 
      'system:open-folder',
      'system:ensure-directory',
      'system:path-exists'
    ];

    handlers.forEach(handler => {
      ipcMain.removeAllListeners(handler);
    });
  }
}

module.exports = SystemIPCHandler;
