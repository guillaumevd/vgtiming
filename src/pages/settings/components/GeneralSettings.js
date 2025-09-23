import React, { useState, useEffect } from 'react';
import '../css/GeneralSettings.css';

// Default settings configuration
const DEFAULT_SETTINGS = {
  outputDir: '',
  displayType: 'grid',
  sortType: 'bestLap',
  theme: 'dark',
  language: 'fr',
  maxLogs: 100,
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

  const handleBrowse = async () => {
    try {
      if (!window.systemAPI || !window.systemAPI.selectFolder) {
        onLog('API de sélection de dossier non disponible', 'error');
        return;
      }

      const result = await window.systemAPI.selectFolder();
      
      if (result.success && !result.canceled) {
        handleChange('outputDir', result.data.path);
        onLog(`Dossier sélectionné: ${result.data.path}`, 'success');
      } else if (!result.canceled) {
        onLog(`Erreur lors de la sélection: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      onLog(`Erreur: ${error.message}`, 'error');
    }
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
      </div>
    </div>
  );
};

export default GeneralSettings;
