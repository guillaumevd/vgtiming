const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * Service de gestion des logs pour le journal d'activité de l'application
 * Centralise tous les logs qui doivent apparaître dans l'interface utilisateur
 */
class AppLogService extends EventEmitter {
  constructor() {
    super();
    this.logs = [];
    this.maxLogs = 500; // Limite pour éviter une accumulation excessive
  }

  /**
   * Ajouter un log au journal d'activité
   * @param {string} message - Message à afficher
   * @param {string} level - Niveau du log (info, success, warning, error)
   * @param {string} category - Catégorie du log (crossmgr, system, user, etc.)
   * @param {object} metadata - Métadonnées additionnelles
   */
  addLog(message, level = 'info', category = 'system', metadata = {}) {
    const logEntry = {
      id: Date.now() + Math.random(), // ID unique
      timestamp: Date.now(),
      message,
      level,
      category,
      metadata
    };

    // Ajouter au début de la liste et limiter la taille
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Émettre l'événement pour notifier l'interface
    this.emit('log_added', logEntry);

    // Logger également dans les fichiers pour debug
    logger.info('App Log:', {
      category,
      level,
      message,
      ...metadata
    });
  }

  /**
   * Obtenir tous les logs
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Effacer tous les logs
   */
  clearLogs() {
    this.logs = [];
    this.emit('logs_cleared');
    this.addLog('Journal d\'activité effacé', 'info', 'system');
  }

  /**
   * Obtenir les logs par catégorie
   */
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Obtenir les logs par niveau
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
}

module.exports = AppLogService;
