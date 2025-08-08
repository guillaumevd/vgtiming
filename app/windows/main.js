const electron = require("electron");
const path = require("path");
const os = require("os");
const { setMainWindow } = require("../backend");

let mainWindow = undefined;

const isDev = process.env.NODE_ENV === 'dev';

let preloadFile;
if (isDev) {
    preloadFile = path.join(__dirname, 'preload.js');
} else {
    preloadFile = path.join(electron.app.getAppPath(), 'app', 'windows', 'preload.js');
}

function getWindow() {
    return mainWindow;
}

function destroyWindow() {
    if (!mainWindow) return;
    mainWindow.close();
    mainWindow = undefined;
}

function createWindow() {
    destroyWindow();
    mainWindow = new electron.BrowserWindow({
        title: "VG-Timing",
        width: 1280,
        height: 720,
        minWidth: 980,
        minHeight: 552,
        resizable: true,
        frame: false,
        titleBarStyle: 'hidden',
        icon: path.join(electron.app.getAppPath(), 'build', 'assets', 'images', 'icon') + `.${os.platform() === "win32" ? "ico" : "png"}`,
        show: false,
        webPreferences: {
            preload: preloadFile,
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            webSecurity: true
        },
    });
    
    // Ouvrir DevTools seulement en développement et sur demande
    if (isDev) {
        // Ouvrir DevTools avec F12
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F12') {
                mainWindow.webContents.toggleDevTools();
            }
        });
    }

    // Configuration CSP sécurisée
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': ["default-src 'self' 'unsafe-inline'; connect-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';"]
            }
        });
    });

    electron.Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);
    if (isDev) {
        mainWindow.loadURL(`http://localhost:3000`);
    } else {
        mainWindow.loadFile(path.join(electron.app.getAppPath(), 'build', 'index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            // Définir la fenêtre principale dans le backend pour les dialogues
            setMainWindow(mainWindow);
        }
    });

    // Gestionnaires des contrôles de fenêtre
    electron.ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });

    electron.ipcMain.on('window-maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    electron.ipcMain.on('window-close', () => {
        if (mainWindow) mainWindow.close();
    });

    electron.ipcMain.handle('window-is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
    });
}

module.exports = {
    getWindow,
    createWindow,
    destroyWindow,
};