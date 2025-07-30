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

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await window.Store.get() || {};
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await window.Store.set(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const addLog = (message, level = LOG_LEVELS.INFO) => {
    const newLog = {
      id: Date.now(),
      timestamp: Date.now(),
      message,
      level
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Limite à 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Journal d\'activité effacé', LOG_LEVELS.INFO);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Paramètres</h1>
      </div>
      
      <div className="settings-content">
        <div className="settings-section">
          <GeneralSettings 
            settings={settings} 
            onSettingChange={updateSetting}
            onLog={addLog}
          />
        </div>
        
        <div className="settings-section">
          <CrossMgrConnection 
            settings={settings} 
            onSettingChange={updateSetting}
            onLog={addLog}
          />
        </div>
        
        <LogWindow 
          logs={logs} 
          onClearLogs={clearLogs}
        />
      </div>
    </div>
  );
};

export default SettingsContainer;
