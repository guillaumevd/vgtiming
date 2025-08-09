import React, { useState, useEffect } from 'react';
import GeneralSettings from './GeneralSettings';
import CrossMgrConnection from './CrossMgrConnection';
import LogWindow from './LogWindow';
import '../css/SettingsContainer.css';

// Log levels constants
const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error', 
  SUCCESS: 'success'
};

const SettingsContainer = () => {
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    // Vérifier si l'API est déjà prête
    if (window.VGTiming && window.VGTiming.isReady) {
      setApiReady(true);
      loadSettings();
      setupLogListeners(); // Ajouter ici aussi
    } else {
      // Écouter l'événement de l'API prête
      const handleAPIReady = async (event) => {
        if (event.detail.ready) {
          setApiReady(true);
          window.removeEventListener('vgtiming-ready', handleAPIReady);
          await loadSettings();
          setupLogListeners(); // Ajouter ici
        }
      };
      window.addEventListener('vgtiming-ready', handleAPIReady);

      return () => {
        window.removeEventListener('vgtiming-ready', handleAPIReady);
        // Nettoyer les listeners de logs
        if (window.appLogAPI) {
          window.appLogAPI.removeLogListeners();
        }
      };
    }
  }, []);

  // Configurer les listeners pour les nouveaux logs - Version simplifiée
  const setupLogListeners = () => {
    if (!window.appLogAPI) return;

    window.appLogAPI.onLogAdd((event, logData) => {
      // Convertir le format du backend vers le format local
      const newLog = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        message: logData.message,
        level: logData.level
      };
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    });
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      if (!window.VGTiming || !window.VGTiming.isReady) {
        addLog('Backend non disponible', LOG_LEVELS.ERROR);
        return;
      }

      // Charger tous les paramètres depuis le backend
      const result = await window.VGTiming.getAllSettings();
      if (result.success) {
        const settingsObj = {};
        
        // result.data est déjà un objet avec les clés comme paramètres
        if (Array.isArray(result.data)) {
          // Si c'est un tableau (pour compatibilité future)
          result.data.forEach(setting => {
            settingsObj[setting.key] = setting.value;
          });
        } else if (typeof result.data === 'object' && result.data !== null) {
          // Si c'est un objet (format actuel)
          Object.keys(result.data).forEach(key => {
            settingsObj[key] = result.data[key].value;
          });
        }
        
        setSettings(settingsObj);
        addLog('Paramètres chargés depuis la base de données', LOG_LEVELS.SUCCESS);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des paramètres');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      addLog(`Erreur lors du chargement des paramètres: ${error.message}`, LOG_LEVELS.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      if (!window.VGTiming || !window.VGTiming.isReady) {
        addLog('Backend non disponible pour sauvegarder les paramètres', LOG_LEVELS.ERROR);
        return;
      }

      // Sauvegarder dans le backend
      const result = await window.VGTiming.setSetting(key, value);
      if (result.success) {
        setSettings(prev => ({ ...prev, [key]: value }));
        addLog(`Paramètre "${key}" mis à jour`, LOG_LEVELS.SUCCESS);
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde du paramètre');
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      addLog(`Erreur lors de la sauvegarde du paramètre "${key}": ${error.message}`, LOG_LEVELS.ERROR);
    }
  };

  const addLog = (message, level = LOG_LEVELS.INFO) => {
    // Version simplifiée - ajout local uniquement
    const newLog = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      message,
      level
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Journal d\'activité effacé', LOG_LEVELS.INFO);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Paramètres</h1>
        {!apiReady && (
          <div className="api-status warning">
            ⚠️ Backend en cours de chargement...
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des paramètres...</p>
        </div>
      ) : (
        <div className="settings-content">
          <div className="settings-section">
            <GeneralSettings 
              settings={settings} 
              onSettingChange={updateSetting}
              onLog={addLog}
              disabled={!apiReady}
            />
          </div>
          
          <div className="settings-section">
            <CrossMgrConnection 
              settings={settings} 
              onSettingChange={updateSetting}
              onLog={addLog}
              disabled={!apiReady}
            />
          </div>
          
          <LogWindow 
            logs={logs} 
            onClearLogs={clearLogs}
          />
        </div>
      )}
    </div>
  );
};

export default SettingsContainer;
