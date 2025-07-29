import React, { useState } from 'react';
import RaceList from './components/RaceList';
import AddRace from './components/AddRace';
import EditRace from './components/RaceEdit';

const Race = () => {
  const [mode, setMode] = useState('list');
  const [selectedRace, setSelectedRace] = useState(null);

  const onRaceSelected = (race) => {
    setSelectedRace(race);
    setMode('edit');
  };

  const onRaceAdded = () => {
    setMode('list');
  };

  const onRaceUpdated = () => {
    setMode('list');
  };

  const onRaceDeleted = () => {
    setMode('list');
  };

  const onRaceCanceled = () => {
    setMode('list');
  };

  const renderContent = () => {
    switch (mode) {
      case 'list':
        return <RaceList onSelectRace={onRaceSelected} onSetMode={() => setMode('add')}/> ;
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
      default:
        return null;
    }
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default Race;
