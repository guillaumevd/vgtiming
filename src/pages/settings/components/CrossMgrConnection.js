import React, { useState, useEffect } from 'react';
import '../css/CrossMgrConnection.css';

// Connection status constants
const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected'
};

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
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS.DISCONNECTED);

  useEffect(() => {
    // Charger les paramètres existants
    setLocalSettings(prev => ({
      ...prev,
      ...settings
    }));
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    onSettingChange(key, value);
    onLog(`Paramètre CrossMgr modifié: ${key} = ${value}`, 'info');
  };

  const handleConnect = () => {
    setConnectionStatus(CONNECTION_STATUS.CONNECTING);
    onLog(`Tentative de connexion à CrossMgr sur ${localSettings.crossmgrHost}:${localSettings.crossmgrPort}`, 'info');
    
    // Simulation de connexion (à remplacer par la vraie logique plus tard)
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% de chance de succès pour la démo
      if (success) {
        setConnectionStatus(CONNECTION_STATUS.CONNECTED);
        onLog('Connexion à CrossMgr établie avec succès', 'success');
      } else {
        setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
        onLog('Échec de la connexion à CrossMgr', 'error');
      }
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnectionStatus(CONNECTION_STATUS.DISCONNECTED);
    onLog('Déconnexion de CrossMgr', 'info');
  };

  const handleTest = () => {
    onLog('Test de connexion CrossMgr - À implémenter', 'warning');
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case CONNECTION_STATUS.CONNECTED: return 'Connecté à CrossMgr';
      case CONNECTION_STATUS.CONNECTING: return 'Connexion en cours...';
      case CONNECTION_STATUS.DISCONNECTED: return 'Déconnecté';
      default: return 'État inconnu';
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
          disabled={connectionStatus === CONNECTION_STATUS.CONNECTING || connectionStatus === CONNECTION_STATUS.CONNECTED}
        >
          {connectionStatus === CONNECTION_STATUS.CONNECTING ? 'Connexion...' : 'Connecter'}
        </button>
        
        <button 
          className="crossmgr-button disconnect-button"
          onClick={handleDisconnect}
          disabled={connectionStatus === CONNECTION_STATUS.DISCONNECTED}
        >
          Déconnecter
        </button>
        
        <button 
          className="crossmgr-button test-button"
          onClick={handleTest}
        >
          Tester
        </button>
      </div>
    </div>
  );
};

export default CrossMgrConnection;
