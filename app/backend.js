// Re-export des fonctions du backend
const { 
  initializeBackend, 
  getBackendInstance, 
  setMainWindow, 
  cleanupBackend 
} = require('./backend/index');

module.exports = {
  initializeBackend,
  getBackendInstance,
  setMainWindow,
  cleanupBackend
};
