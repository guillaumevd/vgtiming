const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion de CrossMgr
 */
class CrossMgrController {
  constructor(services) {
    this.services = services; // Garder une référence aux services
    this.crossMgrService = services.crossmgr;
    this.timingService = services.timing;
    this.setupEventListeners();
  }

  /**
   * Obtenir le service CrossMgr (pour l'IPC)
   */
  get service() {
    return this.crossMgrService;
  }

  /**
   * Configurer les écouteurs d'événements CrossMgr
   */
  setupEventListeners() {
    // Écouter les événements du service CrossMgr
    this.crossMgrService.on('listening', (data) => {
      logger.info('CrossMgr: Serveur en écoute', data);
    });

    this.crossMgrService.on('connected', (data) => {
      logger.info('CrossMgr: Client connecté', data);
    });

    this.crossMgrService.on('disconnected', () => {
      logger.info('CrossMgr: Client déconnecté');
    });

    this.crossMgrService.on('handshake_received', (data) => {
      logger.info('CrossMgr: Handshake reçu', data);
    });

    this.crossMgrService.on('handshake_confirmed', () => {
      logger.info('CrossMgr: Handshake confirmé, connexion établie');
    });

    this.crossMgrService.on('timing_data', async (data) => {
      await this.handleTimingData(data);
    });

    this.crossMgrService.on('error', (error) => {
      logger.error('CrossMgr: Erreur', { error: error.message });
    });

    this.crossMgrService.on('reconnecting', (data) => {
      logger.info('CrossMgr: Tentative de reconnexion', data);
    });
  }

  /**
   * Traiter les données de timing reçues
   */
  async handleTimingData(data) {
    try {
      logger.info('CrossMgr: Données de timing reçues', {
        bib: data.bib,
        time: data.time,
        type: data.type
      });

      // Ici, on pourrait traiter les données et les envoyer au service de timing
      // Pour l'instant, on log simplement
      
      // Exemple d'intégration future :
      // if (data.bib && data.time) {
      //   await this.timingService.recordTiming({
      //     participantNumber: data.bib,
      //     timestamp: new Date(data.time),
      //     source: 'crossmgr'
      //   });
      // }

    } catch (error) {
      logger.error('CrossMgr: Erreur traitement données timing', {
        error: error.message,
        data
      });
    }
  }

  /**
   * Démarrer la connexion CrossMgr
   */
  async startConnection() {
    try {
      const result = await this.crossMgrService.startListening();
      logger.info('CrossMgr: Connexion démarrée avec succès');
      return { success: true, data: result };
    } catch (error) {
      logger.error('CrossMgr: Erreur démarrage connexion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Arrêter la connexion CrossMgr
   */
  async stopConnection() {
    try {
      await this.crossMgrService.stopListening();
      logger.info('CrossMgr: Connexion arrêtée avec succès');
      return { success: true };
    } catch (error) {
      logger.error('CrossMgr: Erreur arrêt connexion', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir le statut de la connexion
   */
  getConnectionStatus() {
    try {
      const status = this.crossMgrService.getStatus();
      return { success: true, data: status };
    } catch (error) {
      logger.error('CrossMgr: Erreur obtention statut', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoyer un message à CrossMgr
   */
  sendMessage(message) {
    try {
      const sent = this.crossMgrService.sendMessage(message);
      return { success: sent };
    } catch (error) {
      logger.error('CrossMgr: Erreur envoi message', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Nettoyer les ressources
   */
  async cleanup() {
    try {
      await this.crossMgrService.cleanup();
      logger.info('CrossMgr: Contrôleur nettoyé');
    } catch (error) {
      logger.error('CrossMgr: Erreur nettoyage contrôleur', { error: error.message });
    }
  }
}

module.exports = CrossMgrController;
