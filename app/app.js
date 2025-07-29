const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater')
const ElectronStore = require('electron-store');
require('./raceApi.js');

//DISABLE UPDATER AUTO DOWNLOAD
autoUpdater.autoDownload = false;

//WINDOWS
const UpdateWindow = require("./windows/update");
const MainWindow = require("./windows/main");
//-------------------------------------------------

//VERIFICATIONS
const isDev = process.env.NODE_ENV === 'dev';
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        UpdateWindow.createWindow();
    });
}
//-------------------------------------------------


//CONTEXT INTER PROCESS COMMUNICATION


//windows management
ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-show', () => MainWindow.getWindow().show())
ipcMain.on('main-window-hide', () => MainWindow.getWindow().hide())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools())
ipcMain.on('main-window-minimize', () => MainWindow.getWindow().minimize())
ipcMain.on('main-window-maximize', () => { if (MainWindow.getWindow().isMaximized()) { MainWindow.getWindow().unmaximize(); } else { MainWindow.getWindow().maximize(); } })
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
//------------------------------------


//update system process

ipcMain.handle('update-app', () => {
    return new Promise(async(resolve, reject) => {
        autoUpdater.checkForUpdates().then(() => {
            resolve();
        }).catch(error => {
            resolve({
                error: true,
                message: error
            })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});

ipcMain.on('start-update', () => {
    autoUpdater.downloadUpdate();
})

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})

//------------------------------------

ipcMain.handle("fetch", async (event, url) => {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(error);
    return "";
  }
});

// Store handlers
const { store } = require('./store.js');

ipcMain.handle("store-get", (event, key) => {
  return store.get(key);
});

ipcMain.handle("store-set", (event, key, value) => {
  return store.set(key, value);
});

ipcMain.handle("store-has", (event, key) => {
  return store.has(key);
});

ipcMain.handle("store-delete", (event, key) => {
  return store.delete(key);
});

ipcMain.handle("store-clear", (event) => {
  return store.clear();
});
