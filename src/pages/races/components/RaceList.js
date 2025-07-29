import React, { useEffect, useState } from 'react';
import './css/RaceList.css';

const RaceList = ({ onSelectRace, onSetMode}) => {
  const [races, setRaces] = useState([]);

  useEffect(() => {
    const fetchRaces = async () => {
      const fetchedRaces = await window.raceAPI.get();
      setRaces(fetchedRaces);
    };
    fetchRaces();
  }, []);

  const handleRaceClick = (race) => {
    onSelectRace(race);
  };

  const handleAddClick = () => {
    onSetMode('add');
  };

  return (
    <div>
      <h1 className="my-3">Races</h1>
      <div className="race-list row">
        {races.map((race) => (
          <div
            key={race.id}
            className="race-item"
            onClick={() => handleRaceClick(race)}
          >
            <img src={race.cover} alt={race.name} className="race-cover" />
            <h4>{race.name}</h4>
          </div>
        ))}
      </div>
      <button className="add-race-button" onClick={() => handleAddClick()}>
        Add Race
      </button>
    </div>
  );
};

export default RaceList;
