import React, { useState, useEffect } from 'react';
import TimingDisplay from './components/TimingDisplay';
import TimingSidebar from './components/TimingSidebar';
import './css/Timing.css';

const Timing = () => {
  const [selectedRace, setSelectedRace] = useState(null);
  const [races, setRaces] = useState([]);
  const [displayMode, setDisplayMode] = useState('list'); // 'list' ou 'grid'
  const [timingData, setTimingData] = useState([]);
  const [crossmgrStatus, setCrossmgrStatus] = useState('disconnected');
  const [raceStatus, setRaceStatus] = useState('ready');

  useEffect(() => {
    loadRaces();
    // TODO: Setup CrossMGR connection and timing data fetching
  }, []);

  const loadRaces = async () => {
    try {
      const fetchedRaces = await window.raceAPI.get() || [];
      setRaces(fetchedRaces);
      
      // Auto-select first active race or first race
      const activeRace = fetchedRaces.find(race => race.status === 'active' || race.status === 'en cours');
      const raceToSelect = activeRace || fetchedRaces[0];
      if (raceToSelect) {
        setSelectedRace(raceToSelect);
      }
    } catch (error) {
      console.error('Error loading races:', error);
    }
  };

  const handleRaceSelect = (race) => {
    setSelectedRace(race);
    // TODO: Load timing data for selected race
  };

  const handleStartRace = () => {
    if (selectedRace) {
      // TODO: Start race timing
      setRaceStatus('running');
      console.log('Starting race:', selectedRace.name);
    }
  };

  const handleStopRace = () => {
    if (selectedRace) {
      // TODO: Stop race timing
      setRaceStatus('paused');
      console.log('Stopping race:', selectedRace.name);
    }
  };

  const handleResetRace = () => {
    if (selectedRace) {
      // TODO: Reset race timing
      setRaceStatus('ready');
      setTimingData([]);
      console.log('Resetting race:', selectedRace.name);
    }
  };

  const handleFinishRace = () => {
    if (selectedRace) {
      // TODO: Finish race
      setRaceStatus('finished');
      console.log('Finishing race:', selectedRace.name);
    }
  };

  return (
    <div className="timing-container">
      <div className="timing-header">
        <h1>Chronométrage</h1>
        <div className="timing-status">
          <span className={`status-badge status-${raceStatus}`}>
            {raceStatus === 'running' && 'En cours'}
            {raceStatus === 'paused' && 'En pause'}
            {raceStatus === 'finished' && 'Terminé'}
            {raceStatus === 'ready' && 'Prêt'}
          </span>
          {selectedRace && (
            <span className="race-name">{selectedRace.name}</span>
          )}
        </div>
      </div>

      <div className="timing-content">
        <div className="timing-main">
          <TimingDisplay 
            selectedRace={selectedRace}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            timingData={timingData}
            raceStatus={raceStatus}
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
          />
        </div>
      </div>
    </div>
  );
};

export default Timing;
