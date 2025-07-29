import React, { useState } from 'react';

const RaceItem = ({ race, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(race.name);

  const handleSave = () => {
    onEdit({ ...race, name: editedName });
    setIsEditing(false);
  };

  return (
    <div className="race-item">
      <img src={race.cover} alt="Race cover" />
      {isEditing ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
        />
      ) : (
        <p>
          {race.id}. {race.name}
        </p>
      )}
      {isEditing ? (
        <button onClick={handleSave}>Save</button>
      ) : (
        <button onClick={() => setIsEditing(true)}>Edit</button>
      )}
      <button onClick={() => onDelete(race.id)}>Delete</button>
    </div>
  );
};

export default RaceItem;
