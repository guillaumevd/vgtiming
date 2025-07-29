import React, { useState } from 'react';
import './css/AddRace.css';

const AddRace = ({ onCancel, onRaceAdded }) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('');
  const [durationType, setDurationType] = useState('');
  const [duration, setDuration] = useState('');
  const [minLapTime, setMinLapTime] = useState('');
  const [maxLapTime, setMaxLapTime] = useState('');
  const [streakRange, setStreakRange] = useState('');
  const [streakStartingLap, setStreakStartingLap] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newRace = {
      id: Date.now(),
      name,
      mode: parseInt(mode),
      durationType: parseInt(durationType),
      duration: parseInt(duration),
      minLapTime: parseInt(minLapTime),
      maxLapTime: parseInt(maxLapTime),
      streakRange: parseInt(streakRange),
      streakStartingLap: parseInt(streakStartingLap),
      cover: 'https://via.placeholder.com/150', // Replace this with the actual cover image URL
    };

    await window.raceAPI.add(newRace);
    onRaceAdded(newRace);
  };

  return (
    <form className="add-race" onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      <label>Mode:</label>
      <input type="number" value={mode} onChange={(e) => setMode(e.target.value)} />
      <label>Duration Type:</label>
      <input type="number" value={durationType} onChange={(e) => setDurationType(e.target.value)} />
      <label>Duration:</label>
      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
      <label>Minimum Lap Time:</label>
      <input type="number" value={minLapTime} onChange={(e) => setMinLapTime(e.target.value)} />
      <label>Maximum Lap Time:</label>
      <input type="number" value={maxLapTime} onChange={(e) => setMaxLapTime(e.target.value)} />
      <label>Streak Range:</label>
      <input type="number" value={streakRange} onChange={(e) => setStreakRange(e.target.value)} />
      <label>Streak Starting Lap:</label>
      <input type="number" value={streakStartingLap} onChange={(e) => setStreakStartingLap(e.target.value)} />

      <button type="submit">Add Race</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
};

export default AddRace;
