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
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});
