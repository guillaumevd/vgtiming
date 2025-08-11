import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import RaceList from './components/RaceList';
import AddRace from './components/AddRace';
import EditRace from './components/RaceEdit';
import Participants from './components/Participants';
import RaceDashboard from './components/RaceDashboard';

const Race = () => {
  const [mode, setMode] = useState('list'); // 'list', 'add', 'edit', 'participants', 'dashboard'
  const [selectedRace, setSelectedRace] = useState(null);
  const navigate = useNavigate();

  const onRaceSelected = (race) => {
    setSelectedRace(race);
    setMode('edit');
  };

  const onManageParticipants = (race) => {
    setSelectedRace(race);
    setMode('participants');
  };

  const onViewResults = (race) => {
    setSelectedRace(race);
    setMode('results');
  };

  const onViewDashboard = (race) => {
    setSelectedRace(race);
    setMode('dashboard');
  };

  const onGoToTiming = (race) => {
    console.log('Navigation vers chronométrage pour la course:', race.name);
    navigate(ROUTES.TIMING);
  };

  const onRaceAdded = () => {
    setMode('list');
  };

  const onRaceUpdated = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onRaceDeleted = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onRaceCanceled = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onBackToList = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onParticipantsSaved = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const renderContent = () => {
    switch (mode) {
      case 'list':
        return (
          <RaceList 
            onSelectRace={onRaceSelected} 
            onManageParticipants={onManageParticipants}
            onViewDashboard={onViewDashboard}
            onSetMode={() => setMode('add')}
          />
        );
      case 'add':
        return <AddRace onRaceAdded={onRaceAdded} onCancel={onRaceCanceled} />;
      case 'edit':
        return (
          <EditRace
            race={selectedRace}
            onRaceUpdated={onRaceUpdated}
            onRaceDeleted={onRaceDeleted}
            onRaceCanceled={onRaceCanceled}
          />
        );
      case 'participants':
        return (
          <Participants
            race={selectedRace}
            onBack={onBackToList}
            onSave={onParticipantsSaved}
          />
        );
      case 'dashboard':
        return (
          <RaceDashboard
            race={selectedRace}
            onBack={onBackToList}
            onRaceUpdated={(updatedRace) => {
              setSelectedRace(updatedRace);
              // Optionellement, on peut rester sur le dashboard après mise à jour
            }}
            onManageParticipants={onManageParticipants}
            onGoToTiming={onGoToTiming}
          />
        );
      default:
        return <RaceList onSelectRace={onRaceSelected} onSetMode={() => setMode('add')}/>;
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-12 d-flex flex-column h-100">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Race;
