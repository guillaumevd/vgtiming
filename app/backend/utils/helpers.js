const { v4: uuidv4 } = require('uuid');

/**
 * Génère un UUID unique
 */
function generateId() {
  return uuidv4();
}

/**
 * Formate un temps en millisecondes vers une chaîne lisible
 * @param {number} milliseconds - Temps en millisecondes
 * @param {boolean} showMillis - Afficher les millisecondes
 * @returns {string} Temps formaté (mm:ss.SSS ou hh:mm:ss.SSS)
 */
function formatTime(milliseconds, showMillis = true) {
  if (!milliseconds || milliseconds <= 0) return '-';
  
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;
  
  let formatted = '';
  
  if (hours > 0) {
    formatted = `${hours.toString().padStart(2, '0')}:`;
  }
  
  formatted += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  if (showMillis) {
    formatted += `.${millis.toString().padStart(3, '0')}`;
  }
  
  return formatted;
}

/**
 * Parse un temps formaté vers des millisecondes
 * @param {string} timeString - Temps au format mm:ss.SSS ou hh:mm:ss.SSS
 * @returns {number} Temps en millisecondes
 */
function parseTime(timeString) {
  if (!timeString || timeString === '-') return 0;
  
  const parts = timeString.split(':');
  let milliseconds = 0;
  
  if (parts.length === 3) {
    // Format hh:mm:ss.SSS
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0]) || 0;
    const millis = parseInt(secondsParts[1]?.padEnd(3, '0')) || 0;
    
    milliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
  } else if (parts.length === 2) {
    // Format mm:ss.SSS
    const minutes = parseInt(parts[0]) || 0;
    const secondsParts = parts[1].split('.');
    const seconds = parseInt(secondsParts[0]) || 0;
    const millis = parseInt(secondsParts[1]?.padEnd(3, '0')) || 0;
    
    milliseconds = minutes * 60000 + seconds * 1000 + millis;
  }
  
  return milliseconds;
}

/**
 * Calcule l'écart entre deux temps
 * @param {number} referenceTime - Temps de référence (1er) en ms
 * @param {number} currentTime - Temps actuel en ms
 * @param {number} referenceLaps - Nombre de tours de référence
 * @param {number} currentLaps - Nombre de tours actuels
 * @returns {string} Écart formaté
 */
function calculateGap(referenceTime, currentTime, referenceLaps = 0, currentLaps = 0) {
  if (!referenceTime || !currentTime) return '-';
  
  // Si différence de tours
  const lapDifference = referenceLaps - currentLaps;
  if (lapDifference > 0) {
    return lapDifference === 1 ? '-1 tour' : `-${lapDifference} tours`;
  }
  
  // Écart de temps
  const gap = currentTime - referenceTime;
  if (gap === 0) return '-';
  
  const sign = gap > 0 ? '+' : '-';
  return sign + formatTime(Math.abs(gap));
}

/**
 * Valide un numéro de participant
 * @param {string} number - Numéro à valider
 * @returns {boolean} True si valide
 */
function isValidParticipantNumber(number) {
  return /^[0-9A-Za-z]{1,10}$/.test(number);
}

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} True si valide
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Nettoie une chaîne de caractères pour l'export
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
function sanitizeForExport(str) {
  if (!str) return '';
  return str.toString().replace(/[,;"'\n\r]/g, ' ').trim();
}

/**
 * Calcule la position d'un participant
 * @param {Array} participants - Liste des participants
 * @param {string} participantId - ID du participant
 * @returns {number} Position (1-based)
 */
function calculatePosition(participants, participantId) {
  const participant = participants.find(p => p.id === participantId);
  if (!participant) return 0;
  
  // Trier par nombre de tours (desc) puis par temps total (asc)
  const sorted = participants
    .filter(p => p.totalLaps > 0) // Seulement les participants avec des tours
    .sort((a, b) => {
      if (a.totalLaps !== b.totalLaps) {
        return b.totalLaps - a.totalLaps; // Plus de tours = meilleur
      }
      return a.totalTime - b.totalTime; // Moins de temps = meilleur
    });
  
  return sorted.findIndex(p => p.id === participantId) + 1;
}

/**
 * Génère un nom de fichier sécurisé
 * @param {string} name - Nom de base
 * @param {string} extension - Extension
 * @returns {string} Nom de fichier sécurisé
 */
function generateSafeFileName(name, extension = '') {
  const safeName = name
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Supprimer caractères spéciaux
    .replace(/\s+/g, '_') // Remplacer espaces par underscores
    .substring(0, 50); // Limiter la longueur
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
  
  return `${safeName}_${timestamp}${extension}`;
}

/**
 * Convertit un objet en CSV
 * @param {Array} data - Données à convertir
 * @param {Array} headers - En-têtes des colonnes
 * @returns {string} Contenu CSV
 */
function objectToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => sanitizeForExport(row[header] || '')).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Formatte une date pour l'affichage
 * @param {Date|string} date - Date à formatter
 * @param {string} format - Format souhaité
 * @returns {string} Date formatée
 */
function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '-';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  generateId,
  formatTime,
  parseTime,
  calculateGap,
  isValidParticipantNumber,
  isValidEmail,
  sanitizeForExport,
  calculatePosition,
  generateSafeFileName,
  objectToCSV,
  formatDate,
  debounce
};
