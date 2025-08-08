const winston = require('winston');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Fonction pour obtenir le répertoire des logs
function getLogDirectory() {
  try {
    const { app } = require('electron');
    if (app && app.getPath) {
      return path.join(app.getPath('userData'), 'logs');
    }
  } catch (error) {
    // En cas d'erreur (ex: hors contexte Electron), utiliser un répertoire temporaire
  }
  return path.join(os.tmpdir(), 'vg-timing-logs');
}

// Créer le répertoire des logs
const logDirectory = getLogDirectory();
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'dev' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'vg-timing-backend' },
  transports: [
    // Fichier d'erreurs
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Fichier général
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En développement, aussi logger dans la console
if (process.env.NODE_ENV === 'dev') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
