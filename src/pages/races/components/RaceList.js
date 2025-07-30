import React, { useEffect, useState } from 'react';
import './css/RaceList.css';

const RaceList = ({ onSelectRace, onManageParticipants, onSetMode}) => {
  const [races, setRaces] = useState([]);

  useEffect(() => {
    const fetchRaces = async () => {
      const fetchedRaces = await window.raceAPI.get();
      setRaces(fetchedRaces);
    };
    fetchRaces();
  }, []);

  const handleRaceClick = (race, e) => {
    e.stopPropagation();
    onSelectRace(race);
  };

  const handleParticipantsClick = (race, e) => {
    e.stopPropagation();
    onManageParticipants(race);
  };

  const handleAddClick = () => {
    onSetMode('add');
  };

  return (
    <div className="race-list-container">
      <div className="race-list-header">
        <h1>Gestion des Courses</h1>
        <button className="btn-unified btn-primary-unified add-race-btn" onClick={handleAddClick}>
          <i className="fas fa-plus"></i>
          Nouvelle Course
        </button>
      </div>
      
      {races.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-flag-checkered"></i>
          </div>
          <h3>Aucune course trouvée</h3>
          <p>Commencez par créer votre première course</p>
          <button className="btn-unified btn-primary-unified" onClick={handleAddClick}>
            <i className="fas fa-plus"></i>
            Créer une course
          </button>
        </div>
      ) : (
        <div className="races-grid">
          {races.map((race) => (
            <div key={race.id} className="race-card">
              <div className="race-card-header">
                <h3 className="race-name">{race.name}</h3>
                <span className={`race-status ${race.status ? race.status.toLowerCase() : 'draft'}`}>
                  {race.status || 'Brouillon'}
                </span>
              </div>
              
              <div className="race-details">
                <div className="race-info">
                  <div className="info-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{race.date ? new Date(race.date).toLocaleDateString('fr-FR') : 'Date non définie'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <span>{race.startTime || 'Heure non définie'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{race.location || 'Lieu non défini'}</span>
                  </div>
                  <div className="info-item">
                    <i className="fas fa-users"></i>
                    <span>{race.participants ? race.participants.length : 0} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="race-actions">
                <button 
                  className="btn-unified btn-secondary-unified"
                  onClick={(e) => handleRaceClick(race, e)}
                  title="Modifier la course"
                >
                  <i className="fas fa-edit"></i>
                  Modifier
                </button>
                <button 
                  className="btn-unified btn-success-unified"
                  onClick={(e) => handleParticipantsClick(race, e)}
                  title="Gérer les participants"
                >
                  <i className="fas fa-users"></i>
                  Participants
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RaceList;
