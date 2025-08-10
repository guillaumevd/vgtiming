import React, { useEffect, useState } from 'react';
import './css/RaceList.css';

const RaceList = ({ onSelectRace, onManageParticipants, onViewDashboard, onSetMode}) => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Attendre que l'API soit prête
        if (!window.VGTiming || !window.VGTiming.isReady) {
          // Écouter l'événement de l'API prête
          const handleAPIReady = async (event) => {
            if (event.detail.ready) {
              window.removeEventListener('vgtiming-ready', handleAPIReady);
              await loadRaces();
            }
          };
          window.addEventListener('vgtiming-ready', handleAPIReady);
          return;
        }
        
        await loadRaces();
      } catch (err) {
        console.error('Erreur lors du chargement des courses:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadRaces = async () => {
      const result = await window.VGTiming.getAllRaces();
      if (result.success) {
        setRaces(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des courses');
      }
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

  const handleCardClick = (race, e) => {
    // Si le clic n'est pas sur un bouton, aller au tableau de bord
    if (!e.target.closest('.race-actions button')) {
      onViewDashboard(race);
    }
  };

  const handleAddClick = () => {
    onSetMode('add');
  };

  return (
    <div className="race-list-container">
      <div className="race-list-header">
        <h1>Gestion des Courses</h1>
        <button className="race-button primary add-race-btn" onClick={handleAddClick}>
          <i className="fas fa-plus"></i>
          Nouvelle Course
        </button>
      </div>
      
      {loading ? (
        <div className="empty-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <h3>Chargement des courses...</h3>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-icon text-danger">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button className="btn-unified btn-secondary-unified" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i>
            Réessayer
          </button>
        </div>
      ) : races.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-flag-checkered"></i>
          </div>
          <h3>Aucune course trouvée</h3>
          <p>Commencez par créer votre première course</p>
          <button className="race-button primary" onClick={handleAddClick}>
            <i className="fas fa-plus"></i>
            Créer une course
          </button>
        </div>
      ) : (
        <div className="races-grid">
          {races.map((race) => (
            <div 
              key={race.id} 
              className="race-card clickable"
              onClick={(e) => handleCardClick(race, e)}
            >
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
                    <span>{race.participantCount || 0} participants</span>
                  </div>
                </div>
              </div>
              
              <div className="race-actions">
                <button 
                  className="race-button secondary"
                  onClick={(e) => handleRaceClick(race, e)}
                  title="Modifier la course"
                >
                  <i className="fas fa-edit"></i>
                  Modifier
                </button>
                <button 
                  className="race-button success"
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
