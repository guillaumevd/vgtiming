import React, { useState, useEffect } from 'react';
import TimingDisplay from './components/TimingDisplay';
import TimingSidebar from './components/TimingSidebar';
import './css/Timing.css';

const Timing = () => {
  const [selectedRace, setSelectedRace] = useState(null);
  const [races, setRaces] = useState([]);
  const [displayMode, setDisplayMode] = useState('list'); // 'list' ou 'grid'
  const [timingData, setTimingData] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [crossmgrStatus, setCrossmgrStatus] = useState('disconnected');
  const [raceStatus, setRaceStatus] = useState('ready');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    displayType: 'list',
    sortType: 'bestLap',
    refreshRate: 1000
  });

  useEffect(() => {
    const initializeTiming = async () => {
      // Attendre que l'API soit prête
      if (!window.VGTiming || !window.VGTiming.isReady) {
        const handleAPIReady = async (event) => {
          if (event.detail.ready) {
            window.removeEventListener('vgtiming-ready', handleAPIReady);
            await loadSettings();
            await loadRaces();
          }
        };
        window.addEventListener('vgtiming-ready', handleAPIReady);
        return;
      }
      
      await loadSettings();
      await loadRaces();
    };

    initializeTiming();
  }, []);

  const loadSettings = async () => {
    try {
      if (!window.VGTiming || !window.VGTiming.isReady) return;

      // Charger les paramètres depuis la base de données
      const settingsResult = await window.VGTiming.getAllSettings();
      if (settingsResult.success) {
        const loadedSettings = {};
        
        if (typeof settingsResult.data === 'object' && settingsResult.data !== null) {
          Object.keys(settingsResult.data).forEach(key => {
            loadedSettings[key] = settingsResult.data[key].value;
          });
        }

        // Mettre à jour les paramètres avec les valeurs par défaut si nécessaire
        const timingSettings = {
          displayType: loadedSettings.displayType || 'list',
          sortType: loadedSettings.sortType || 'bestLap', 
          refreshRate: loadedSettings.refreshRate || 1000
        };

        setSettings(timingSettings);
        
        // Appliquer le mode d'affichage depuis les paramètres
        setDisplayMode(timingSettings.displayType);
        
        console.log('Paramètres timing chargés:', timingSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres timing:', error);
    }
  };

  const loadRaces = async () => {
    try {
      setLoading(true);
      const result = await window.VGTiming.getAllRaces({ status: ['active', 'ready', 'paused'] });
      
      if (result.success) {
        const availableRaces = result.data || [];
        setRaces(availableRaces);
        
        // Auto-select first active race or first race
        const activeRace = availableRaces.find(race => race.status === 'active');
        const raceToSelect = activeRace || availableRaces[0];
        if (raceToSelect) {
          await selectRace(raceToSelect);
        }
      } else {
        console.error('Error loading races:', result.error);
      }
    } catch (error) {
      console.error('Error loading races:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRace = async (race) => {
    try {
      setSelectedRace(race);
      setRaceStatus(race.status || 'ready');
      
      // Charger les participants de la course
      const participantsResult = await window.VGTiming.getParticipantsByRace(race.id);
      if (participantsResult.success) {
        setParticipants(participantsResult.data || []);
      }
      
      // Charger les données de chronométrage
      const timingResult = await window.VGTiming.getTimingDataByRace(race.id);
      if (timingResult.success) {
        setTimingData(timingResult.data || []);
      }
    } catch (error) {
      console.error('Error selecting race:', error);
    }
  };

  const handleRaceSelect = (race) => {
    selectRace(race);
  };

  const handleStartRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Changer le statut de la course à "active"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'active');
      
      if (result.success) {
        setRaceStatus('active');
        setSelectedRace(result.data);
        
        // TODO: Démarrer le chronométrage de masse si nécessaire
        console.log('Race started:', selectedRace.name);
      } else {
        console.error('Error starting race:', result.error);
      }
    } catch (error) {
      console.error('Error starting race:', error);
    }
  };

  const handleStopRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Changer le statut de la course à "paused"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'paused');
      
      if (result.success) {
        setRaceStatus('paused');
        setSelectedRace(result.data);
        console.log('Race paused:', selectedRace.name);
      } else {
        console.error('Error pausing race:', result.error);
      }
    } catch (error) {
      console.error('Error pausing race:', error);
    }
  };

  const handleResetRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Remettre le statut de la course à "ready"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'ready');
      
      if (result.success) {
        setRaceStatus('ready');
        setSelectedRace(result.data);
        setTimingData([]);
        console.log('Race reset:', selectedRace.name);
      } else {
        console.error('Error resetting race:', result.error);
      }
    } catch (error) {
      console.error('Error resetting race:', error);
    }
  };

  const handleFinishRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Changer le statut de la course à "finished"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'finished');
      
      if (result.success) {
        setRaceStatus('finished');
        setSelectedRace(result.data);
        console.log('Race finished:', selectedRace.name);
      } else {
        console.error('Error finishing race:', result.error);
      }
    } catch (error) {
      console.error('Error finishing race:', error);
    }
  };

  const handleDisplayModeChange = async (newMode) => {
    setDisplayMode(newMode);
    
    // Sauvegarder la préférence dans la base de données
    try {
      if (window.VGTiming && window.VGTiming.isReady) {
        await window.VGTiming.setSetting('displayType', newMode);
        setSettings(prev => ({ ...prev, displayType: newMode }));
        console.log('Préférence d\'affichage sauvegardée:', newMode);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence:', error);
    }
  };

  return (
    <div className="timing-container">
      <div className="timing-header">
        <h1>Chronométrage</h1>
        <div className="timing-status">
          <span className={`status-badge status-${raceStatus}`}>
            {raceStatus === 'active' && 'En cours'}
            {raceStatus === 'paused' && 'En pause'}
            {raceStatus === 'finished' && 'Terminé'}
            {raceStatus === 'ready' && 'Prêt'}
            {raceStatus === 'draft' && 'Brouillon'}
          </span>
          {selectedRace && (
            <span className="race-name">{selectedRace.name}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="timing-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement des courses...</p>
        </div>
      ) : (
        <div className="timing-content">
          <div className="timing-main">
            <TimingDisplay 
              selectedRace={selectedRace}
              displayMode={displayMode}
              setDisplayMode={handleDisplayModeChange}
              timingData={timingData}
              participants={participants}
              raceStatus={raceStatus}
              settings={settings}
            />
          </div>
          
          <div className="timing-sidebar">
            <TimingSidebar
              races={races}
              selectedRace={selectedRace}
              onRaceSelect={handleRaceSelect}
              crossmgrStatus={crossmgrStatus}
              raceStatus={raceStatus}
              onStartRace={handleStartRace}
              onStopRace={handleStopRace}
              onResetRace={handleResetRace}
              onFinishRace={handleFinishRace}
              participantCount={participants.length}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Timing;
