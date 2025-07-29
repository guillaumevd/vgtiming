import React, { useState } from 'react';
import './css/EditRace.css';

const EditRace = ({ race, onRaceUpdated, onRaceDeleted, onRaceCanceled }) => {
  const [name, setName] = useState(race.name);
  const [mode, setMode] = useState(race.mode);
  const [durationType, setDurationType] = useState(race.durationType);
  const [duration, setDuration] = useState(race.duration);
  const [minLapTime, setMinLapTime] = useState(race.minLapTime);
  const [maxLapTime, setMaxLapTime] = useState(race.maxLapTime);
  const [streakRange, setStreakRange] = useState(race.streakRange);
  const [streakStartingLap, setStreakStartingLap] = useState(race.streakStartingLap);

  const handleUpdate = async () => {
    await window.raceAPI.update({
      ...race,
      name,
      mode,
      durationType,
      duration,
      minLapTime,
      maxLapTime,
      streakRange,
      streakStartingLap,
    });
    onRaceUpdated();
  };

  const handleDelete = async () => {
    await window.raceAPI.delete(race.id);
    onRaceDeleted();
  };

  const handleCancel = () => {
    onRaceCanceled();
  };

  return (
    <div className="edit-race">
      <h3>Edit Race</h3>
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label>Mode:</label>
        <input type="number" value={mode} onChange={(e) => setMode(e.target.value)} />
      </div>
      <div>
        <label>Duration Type:</label>
        <input type="number" value={durationType} onChange={(e) => setDurationType(e.target.value)} />
      </div>
      <div>
        <label>Duration:</label>
        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      <div>
        <label>Minimum Lap Time:</label>
        <input type="number" value={minLapTime} onChange={(e) => setMinLapTime(e.target.value)} />
      </div>
      <div>
        <label>Maximum Lap Time:</label>
        <input type="number" value={maxLapTime} onChange={(e) => setMaxLapTime(e.target.value)} />
      </div>
      <div>
        <label>Streak Range:</label>
        <input type="number" value={streakRange} onChange={(e) => setStreakRange(e.target.value)} />
      </div>
      <div>
        <label>Streak Starting Lap:</label>
        <input type="number" value={streakStartingLap} onChange={(e) => setStreakStartingLap(e.target.value)} />
      </div>
      <button onClick={handleUpdate}>Update</button>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
};

export default EditRace;
