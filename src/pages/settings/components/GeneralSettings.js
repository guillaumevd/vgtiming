import React, { useState, useEffect } from 'react';
import '../css/GeneralSettings.css';

// Default settings configuration
const DEFAULT_SETTINGS = {
  outputDir: '',
  displayType: 'grid',
  sortType: 'bestLap',
  refreshRate: 1000,
  theme: 'dark',
  language: 'fr',
  maxLogs: 100,
  enableNotifications: true,
  soundAlerts: false,
  minimizeToTray: true,
  startWithWindows: false
};

const DISPLAY_OPTIONS = [
  { value: 'grid', label: 'Grille' },
  { value: 'list', label: 'Liste' }
];

const SORT_OPTIONS = [
  { value: 'bestLap', label: 'Meilleur tour' },
  { value: 'lastLap', label: 'Dernier tour' },
  { value: 'totalLaps', label: 'Nombre de tours' }
];

const GeneralSettings = ({ settings, onSettingChange, onLog }) => {
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS);

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
    onLog(`Paramètre modifié: ${key} = ${value}`, 'info');
  };

  const handleRefreshRateChange = (value) => {
    const rate = Math.max(100, Math.min(5000, parseInt(value) || 1000));
    handleChange('refreshRate', rate);
  };

  const handleBrowse = () => {
    // Simuler la sélection de dossier (à implémenter plus tard)
    onLog('Sélection de dossier - À implémenter', 'warning');
  };

  return (
    <div className="general-settings-container">
      <h3 className="general-settings-title">Paramètres Généraux</h3>
      
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="outputDir" className="setting-label">
            Dossier de sauvegarde des résultats
          </label>
          <div className="input-row">
            <input
              id="outputDir"
              type="text"
              className="setting-input"
              value={localSettings.outputDir}
              onChange={(e) => handleChange('outputDir', e.target.value)}
              placeholder="C:/Users/Username/Documents/VG-Timing/Results"
            />
            <button className="browse-button" onClick={handleBrowse}>
              ...
            </button>
          </div>
          <p className="setting-description">
            Dossier où seront enregistrés les fichiers de résultats de course
          </p>
        </div>

        <div className="setting-group">
          <label htmlFor="displayType" className="setting-label">Type d'affichage</label>
          <select
            id="displayType"
            className="setting-select"
            value={localSettings.displayType}
            onChange={(e) => handleChange('displayType', e.target.value)}
          >
            {DISPLAY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="setting-description">
            Mode d'affichage des résultats dans l'interface de chronométrage
          </p>
        </div>

        <div className="setting-group">
          <label htmlFor="sortType" className="setting-label">Tri par défaut</label>
          <select
            id="sortType"
            className="setting-select"
            value={localSettings.sortType}
            onChange={(e) => handleChange('sortType', e.target.value)}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="setting-description">
            Critère de tri utilisé par défaut pour l'affichage des résultats
          </p>
        </div>

        <div className="setting-group">
          <label htmlFor="refreshRate" className="setting-label">
            Taux de rafraîchissement (ms)
          </label>
          <input
            id="refreshRate"
            type="number"
            className="setting-input"
            min="100"
            max="5000"
            step="100"
            value={localSettings.refreshRate}
            onChange={(e) => handleRefreshRateChange(e.target.value)}
          />
          <p className="setting-description">
            Fréquence de mise à jour de l'affichage en millisecondes
          </p>
        </div>

        <div className="setting-group">
          <div className="checkbox-container">
            <input
              id="enableNotifications"
              type="checkbox"
              className="setting-checkbox"
              checked={localSettings.enableNotifications}
              onChange={(e) => handleChange('enableNotifications', e.target.checked)}
            />
            <label htmlFor="enableNotifications" className="setting-label">
              Notifications système
            </label>
          </div>
          <p className="setting-description">
            Affiche des notifications pour les événements importants
          </p>
        </div>

        <div className="setting-group">
          <div className="checkbox-container">
            <input
              id="soundAlerts"
              type="checkbox"
              className="setting-checkbox"
              checked={localSettings.soundAlerts}
              onChange={(e) => handleChange('soundAlerts', e.target.checked)}
            />
            <label htmlFor="soundAlerts" className="setting-label">Alertes sonores</label>
          </div>
          <p className="setting-description">
            Joue des sons pour les événements de chronométrage
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
