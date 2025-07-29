const { ipcMain } = require('electron');
const { store } = require('./store.js');

ipcMain.handle('getRaces', async () => {
  const races = store.get('races', []);
  return races;
});

ipcMain.handle('addRace', async (event, race) => {
  const races = store.get('races', []);
  races.push(race);
  store.set('races', races);
});

ipcMain.handle('updateRace', async (event, updatedRace) => {
  const races = store.get('races', []);
  const raceIndex = races.findIndex((race) => race.id === updatedRace.id);
  
  if (raceIndex !== -1) {
    races[raceIndex] = updatedRace;
    store.set('races', races);
    return true;
  } else {
    return false;
  }
});

ipcMain.handle('deleteRace', async (event, raceId) => {
  const races = store.get('races', []);
  const newRaces = races.filter((race) => race.id !== raceId);

  store.set('races', newRaces);
  return true;
});
