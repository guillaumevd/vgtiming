import React, { useState, useEffect } from 'react';
import { useCrossMgr, CROSSMGR_STATUS } from '../../../context/CrossMgrContext';
import '../css/CrossMgrConnection.css';

// Connection status constants - utiliser ceux du contexte
const CONNECTION_STATUS = CROSSMGR_STATUS;

// Default CrossMgr settings
const DEFAULT_CROSSMGR_SETTINGS = {
  crossmgrHost: 'localhost',
  crossmgrPort: 53135,
  crossmgrAutoConnect: false,
  crossmgrTimeout: 5000,
  crossmgrRetryInterval: 3000,
  crossmgrMaxRetries: 5
};

const CrossMgrConnection = ({ settings, onSettingChange, onLog }) => {
  const [localSettings, setLocalSettings] = useState(DEFAULT_CROSSMGR_SETTINGS);
  
  // Utiliser le contexte CrossMgr au lieu de l'état local
  const {
    connectionStatus,
    isLoading,
    lastError,
    connect,
    disconnect,
    getStatusText,
    checkConnectionStatus
  } = useCrossMgr();

  useEffect(() => {
    // Charger les paramètres existants
    setLocalSettings(prev => ({
      ...prev,
      ...settings
    }));
  }, [settings]);

  // Surveiller les changements de statut pour loguer automatiquement
  useEffect(() => {
    // Messages supprimés - le backend gère déjà les logs via le service CrossMgr
    // Évite les doublons dans le journal d'activité
  }, [connectionStatus, lastError, isLoading]);

  // Écouter les messages de communication CrossMgr
  useEffect(() => {
    const handleCrossMgrMessage = (event) => {
      const messageData = event.detail;
      let logType = 'info';
      let logMessage = '';

      // Fonction pour vérifier si un message contient déjà un emoji
      const hasEmoji = (text) => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text);

      // Si le message contient déjà un emoji, on l'utilise tel quel SANS MODIFICATION
      if (hasEmoji(messageData.message)) {
        logMessage = messageData.message;
        logType = messageData.type === 'disconnection' ? 'warning' : 
                 messageData.type === 'connection' || messageData.type === 'connection_established' ? 'success' : 'info';
      } else {
        // Sinon on ajoute un emoji selon le type
        switch (messageData.type) {
          case 'connection':
            logType = 'success';
            logMessage = `📡 ${messageData.message}`;
            break;
          case 'handshake':
            logType = 'success';
            logMessage = `🤝 ${messageData.message}`;
            break;
          case 'handshake_response':
            logType = 'info';
            logMessage = `📤 ${messageData.message}`;
            break;
          case 'timing':
            logType = 'info';
            logMessage = `⏱️ ${messageData.message}`;
            break;
          case 'timing_response':
            logType = 'info';
            logMessage = `📤 ${messageData.message}`;
            break;
          case 'data':
            logType = 'success';
            logMessage = `📊 ${messageData.message}`;
            break;
          case 'data_response':
            logType = 'info';
            logMessage = `📤 ${messageData.message}`;
            break;
          case 'disconnection':
            logType = 'warning';
            logMessage = `📴 ${messageData.message}`;
            break;
          default:
            logType = 'info';
            logMessage = `💬 ${messageData.message}`;
            break;
        }
      }

      onLog(logMessage, logType);
    };

    // Écouter les événements de messages CrossMgr
    window.addEventListener('crossmgr-message', handleCrossMgrMessage);

    return () => {
      window.removeEventListener('crossmgr-message', handleCrossMgrMessage);
    };
  }, [onLog]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    onSettingChange(key, value);
    onLog(`Paramètre CrossMgr modifié: ${key} = ${value}`, 'info');
  };

  const handleConnect = async () => {
    onLog(`Démarrage du serveur CrossMgr sur ${localSettings.crossmgrHost}:${localSettings.crossmgrPort}`, 'info');
    
    try {
      await connect();
      // Le statut sera automatiquement mis à jour par le contexte
      // après réception du handshake GT
    } catch (error) {
      // L'erreur sera automatiquement loggée par l'effet useEffect
    }
  };

  const handleDisconnect = async () => {
    // Messages supprimés - le backend gère déjà les logs via le service CrossMgr
    
    try {
      await disconnect();
      // Log supprimé - géré par le backend
    } catch (error) {
      onLog(`Erreur lors de la déconnexion: ${error.message}`, 'error');
    }
  };

  return (
    <div className="crossmgr-container">
      <h3 className="crossmgr-title">Connexion CrossMgr</h3>
      
      <div className="status-container">
        <div className={`status-indicator ${connectionStatus}`}>
          <div className={`status-dot ${connectionStatus}`} />
          <span className={`status-text ${connectionStatus}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="crossmgr-settings-grid">
        <div className="crossmgr-setting-group">
          <label htmlFor="crossmgrHost" className="crossmgr-label">Adresse du serveur</label>
          <input
            id="crossmgrHost"
            type="text"
            className="crossmgr-input"
            value={localSettings.crossmgrHost}
            onChange={(e) => handleChange('crossmgrHost', e.target.value)}
            placeholder="localhost"
          />
          <p className="crossmgr-description">
            Adresse IP ou nom d'hôte du serveur CrossMgr
          </p>
        </div>

        <div className="crossmgr-setting-group">
          <label htmlFor="crossmgrPort" className="crossmgr-label">Port</label>
          <input
            id="crossmgrPort"
            type="number"
            className="crossmgr-input"
            min="1"
            max="65535"
            value={localSettings.crossmgrPort}
            onChange={(e) => handleChange('crossmgrPort', parseInt(e.target.value))}
          />
          <p className="crossmgr-description">
            Port de connexion au serveur CrossMgr (par défaut: 53135)
          </p>
        </div>

        <div className="crossmgr-setting-group">
          <label htmlFor="crossmgrTimeout" className="crossmgr-label">Timeout (ms)</label>
          <input
            id="crossmgrTimeout"
            type="number"
            className="crossmgr-input"
            min="1000"
            max="30000"
            step="1000"
            value={localSettings.crossmgrTimeout}
            onChange={(e) => handleChange('crossmgrTimeout', parseInt(e.target.value))}
          />
          <p className="crossmgr-description">
            Délai d'attente pour les connexions
          </p>
        </div>

        <div className="crossmgr-setting-group">
          <label htmlFor="crossmgrRetryInterval" className="crossmgr-label">
            Intervalle de reconnexion (ms)
          </label>
          <input
            id="crossmgrRetryInterval"
            type="number"
            className="crossmgr-input"
            min="1000"
            max="60000"
            step="1000"
            value={localSettings.crossmgrRetryInterval}
            onChange={(e) => handleChange('crossmgrRetryInterval', parseInt(e.target.value))}
          />
          <p className="crossmgr-description">
            Délai entre les tentatives de reconnexion automatique
          </p>
        </div>

        <div className="crossmgr-setting-group">
          <label htmlFor="crossmgrMaxRetries" className="crossmgr-label">
            Nombre maximum de tentatives
          </label>
          <input
            id="crossmgrMaxRetries"
            type="number"
            className="crossmgr-input"
            min="1"
            max="20"
            value={localSettings.crossmgrMaxRetries}
            onChange={(e) => handleChange('crossmgrMaxRetries', parseInt(e.target.value))}
          />
          <p className="crossmgr-description">
            Nombre de tentatives de reconnexion avant d'abandonner
          </p>
        </div>
      </div>

      <div className="button-group">
        <button 
          className="crossmgr-button connect-button"
          onClick={handleConnect}
          disabled={isLoading || connectionStatus === CONNECTION_STATUS.CONNECTED}
        >
          {connectionStatus === CONNECTION_STATUS.CONNECTING ? 'Démarrage...' : 'Démarrer le serveur'}
        </button>
        
        <button 
          className="crossmgr-button disconnect-button"
          onClick={handleDisconnect}
          disabled={isLoading || connectionStatus === CONNECTION_STATUS.DISCONNECTED}
        >
          {isLoading && connectionStatus === CONNECTION_STATUS.CONNECTED ? 'Arrêt...' : 'Arrêter le serveur'}
        </button>
      </div>
    </div>
  );
};

export default CrossMgrConnection;
