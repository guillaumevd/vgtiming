const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
  },
  once: (channel, func) => {
    ipcRenderer.once(channel, (event, ...args) => func(event, ...args));
  },
  invoke: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  },
});

contextBridge.exposeInMainWorld('Store', {
  get: async (key) => await ipcRenderer.invoke('store-get', key),
  set: async (key, value) => await ipcRenderer.invoke('store-set', key, value),
  has: async (key) => await ipcRenderer.invoke('store-has', key),
  delete: async (key) => await ipcRenderer.invoke('store-delete', key),
  clear: async () => await ipcRenderer.invoke('store-clear'),
});

contextBridge.exposeInMainWorld('raceAPI', {
  get: async () => await ipcRenderer.invoke('getRaces'),
  add: async (race) => await ipcRenderer.invoke('addRace', race),
  update: async (race) => await ipcRenderer.invoke('updateRace', race),
  delete: async (raceId) => await ipcRenderer.invoke('deleteRace', raceId),
});

contextBridge.exposeInMainWorld('electronAPI', {
  fetch: async (url) => await ipcRenderer.invoke('fetch', url),
  invoke: async (channel, ...args) => await ipcRenderer.invoke(channel, ...args),
  // CrossMgr API
  crossmgrStart: async () => await ipcRenderer.invoke('crossmgr:start'),
  crossmgrStop: async () => await ipcRenderer.invoke('crossmgr:stop'),
  crossmgrStatus: async () => await ipcRenderer.invoke('crossmgr:status'),
  crossmgrSend: async (message) => await ipcRenderer.invoke('crossmgr:send', message),
  
  // CrossMgr Event Listeners
  onCrossMgrConnected: (callback) => {
    ipcRenderer.on('crossmgr:connected', callback);
  },
  onCrossMgrConnectionEstablished: (callback) => {
    ipcRenderer.on('crossmgr:connection_established', callback);
  },
  onCrossMgrDisconnected: (callback) => {
    ipcRenderer.on('crossmgr:disconnected', callback);  
  },
  onCrossMgrError: (callback) => {
    ipcRenderer.on('crossmgr:error', callback);
  },
  onCrossMgrMessage: (callback) => {
    ipcRenderer.on('crossmgr:message', callback);
  },
  removeCrossMgrListeners: () => {
    ipcRenderer.removeAllListeners('crossmgr:connected');
    ipcRenderer.removeAllListeners('crossmgr:connection_established');
    ipcRenderer.removeAllListeners('crossmgr:disconnected');
    ipcRenderer.removeAllListeners('crossmgr:error');
    ipcRenderer.removeAllListeners('crossmgr:message');
  }
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});

contextBridge.exposeInMainWorld('systemAPI', {
  selectFolder: () => ipcRenderer.invoke('system:select-folder'),
  selectFile: (filters) => ipcRenderer.invoke('system:select-file', filters),
  openFolder: (path) => ipcRenderer.invoke('system:open-folder', path),
});

// API pour les logs d'application - Version simplifiée
contextBridge.exposeInMainWorld('appLogAPI', {
  // Event listeners pour recevoir les logs directement du backend
  onLogAdd: (callback) => {
    ipcRenderer.on('app-log:add', (event, logData) => {
      callback(event, logData);
    });
  },
  removeLogListeners: () => {
    ipcRenderer.removeAllListeners('app-log:add');
  }
});
