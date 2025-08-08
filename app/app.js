const { app, ipcMain, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater')

// Backend Integration
const { initializeBackend, cleanupBackend } = require('./backend');

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
    app.whenReady().then(async () => {
        try {
            // Initialize backend first
            console.log('Initializing VG-Timing backend...');
            await initializeBackend();
            console.log('Backend initialized successfully!');
            
            // Then create the window
            UpdateWindow.createWindow();
        } catch (error) {
            console.error('Failed to initialize backend:', error);
            // Still create window but with error state
            UpdateWindow.createWindow();
        }
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

// App lifecycle management
app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') {
        cleanupBackend().then(() => {
            app.quit();
        });
    }
});

app.on('before-quit', async (event) => {
    event.preventDefault();
    try {
        await cleanupBackend();
        app.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        app.exit(1);
    }
});
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

//------------------------------------
