import React, { useRef, useState } from 'react';
import { showToast } from '../../../utils/notifications';
import './css/ImportRace.css';

const ImportRace = ({ onImport, onCancel }) => {
  const fileInputRef = useRef();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const validateRaceData = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Fichier JSON invalide');
    }
    
    if (!data.race) {
      throw new Error('Données de course manquantes dans le fichier');
    }
    
    if (!data.race.name) {
      throw new Error('Nom de course manquant');
    }
    
    return true;
  };

  const handleFileProcess = async (file) => {
    setError(null);
    setImporting(true);
    
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      validateRaceData(json);
      
      showToast(`Course "${json.race.name}" prête à être importée`, 'info');
      onImport(json);
    } catch (err) {
      const errorMsg = err.message.includes('JSON') ? 
        'Fichier JSON invalide ou corrompu' : 
        err.message;
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Seuls les fichiers JSON sont acceptés');
      return;
    }
    
    await handleFileProcess(file);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
    
    if (!jsonFile) {
      setError('Veuillez déposer un fichier JSON');
      return;
    }
    
    await handleFileProcess(jsonFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="add-race-container">
      <div className="card add-race-card">
        <div className="card-header">
          <h2>
            <i className="fas fa-file-import me-2"></i>
            Importer une course
          </h2>
          <p className="import-description">
            Importez une course à partir d'un fichier JSON de sauvegarde VG-Timing
          </p>
        </div>
        
        <div className="card-body">
          <input
            type="file"
            accept="application/json,.json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          <div 
            className={`import-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="import-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <h3>Glissez-déposez votre fichier JSON ici</h3>
            <p>ou</p>
            <button
              className="race-button primary import-btn"
              disabled={importing}
            >
              <i className="fas fa-file-import"></i>
              {importing ? 'Importation...' : 'Choisir un fichier JSON'}
            </button>
            <div className="import-info">
              <small>
                <i className="fas fa-info-circle me-1"></i>
                Formats acceptés: fichiers JSON de sauvegarde VG-Timing
              </small>
            </div>
          </div>
          
          {error && (
            <div className="import-error">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
        </div>
        
        <div className="card-footer d-flex justify-content-end">
          <button 
            className="race-button secondary" 
            onClick={onCancel} 
            disabled={importing}
          >
            <i className="fas fa-times"></i>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportRace;
