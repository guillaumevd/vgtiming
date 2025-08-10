import React, { useState, useEffect } from 'react';
import { showToast } from '../../../utils/notifications';
import './css/RaceDashboard.css';

const RaceDashboard = ({ race, onBack, onRaceUpdated }) => {
  const [raceData, setRaceData] = useState(race);
  const [participants, setParticipants] = useState([]);
  const [timingData, setTimingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [race.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les participants
      const participantsResult = await window.VGTiming.getParticipantsByRace(race.id);
      if (participantsResult.success) {
        setParticipants(participantsResult.data || []);
      }

      // TODO: Charger les données de chronométrage quand l'API sera disponible
      // const timingResult = await window.VGTiming.getTimingDataByRace(race.id);
      setTimingData([]);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updateData = { ...raceData, status: newStatus };
      const result = await window.VGTiming.updateRace(race.id, updateData);
      
      if (result.success) {
        setRaceData(result.data);
        onRaceUpdated(result.data);
        showToast(`Statut changé vers "${newStatus}"`, 'success');
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      showToast(error.message || 'Erreur lors du changement de statut', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir remettre à zéro cette course ? Cela supprimera tous les participants et les données de chronométrage.')) {
      return;
    }

    setIsResetting(true);
    try {
      // Supprimer tous les participants
      for (const participant of participants) {
        await window.VGTiming.deleteParticipant(participant.id);
      }

      // TODO: Supprimer les données de chronométrage quand l'API sera disponible
      
      // Recharger les données
      await loadDashboardData();
      showToast('Course remise à zéro avec succès !', 'success');
      
      // Mettre à jour le statut vers "Brouillon"
      if (raceData.status !== 'Brouillon') {
        await handleStatusChange('Brouillon');
      }
    } catch (error) {
      console.error('Erreur lors de la remise à zéro:', error);
      showToast(error.message || 'Erreur lors de la remise à zéro', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.slice(0, 5) : 'Non définie';
  };

  return (
    <div className="race-dashboard-container">
      <div className="dashboard-header">
        <button 
          className="btn-unified btn-secondary-unified back-button"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left"></i>
          Retour
        </button>
        <h1>{raceData.name}</h1>
        <div className="status-actions">
          <div className={`race-status-badge ${raceData.status ? raceData.status.toLowerCase() : 'brouillon'}`}>
            {raceData.status || 'Brouillon'}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Informations de la course */}
        <div className="dashboard-section">
          <h2>Informations de la course</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="info-details">
                <h3>Date</h3>
                <p>{raceData.date ? formatDate(raceData.date) : 'Non définie'}</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="info-details">
                <h3>Heure de départ</h3>
                <p>{formatTime(raceData.time)}</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="info-details">
                <h3>Lieu</h3>
                <p>{raceData.location || 'Non défini'}</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="info-details">
                <h3>Participants</h3>
                <p>{participants.length} inscrits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions de gestion */}
        <div className="dashboard-section">
          <h2>Gestion de la course</h2>
          <div className="management-actions">
            <div className="status-management">
              <h3>Statut de la course</h3>
              <div className="status-buttons">
                <button
                  className={`btn-unified ${raceData.status === 'Brouillon' ? 'btn-primary-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('Brouillon')}
                  disabled={isUpdatingStatus || raceData.status === 'Brouillon'}
                >
                  <i className="fas fa-edit"></i>
                  Brouillon
                </button>
                <button
                  className={`btn-unified ${raceData.status === 'Prêt' ? 'btn-success-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('Prêt')}
                  disabled={isUpdatingStatus || raceData.status === 'Prêt'}
                >
                  <i className="fas fa-check"></i>
                  Prêt
                </button>
              </div>
            </div>
            
            <div className="danger-actions">
              <h3>Actions de remise à zéro</h3>
              <button
                className="btn-unified btn-danger-unified"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Remise à zéro...
                  </>
                ) : (
                  <>
                    <i className="fas fa-undo"></i>
                    Remettre à zéro
                  </>
                )}
              </button>
              <p className="danger-text">
                Supprime tous les participants et données de chronométrage
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu des participants */}
        <div className="dashboard-section">
          <h2>Participants ({participants.length})</h2>
          {loading ? (
            <div className="loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : participants.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <p>Aucun participant inscrit</p>
            </div>
          ) : (
            <div className="participants-preview">
              {participants.slice(0, 5).map((participant) => (
                <div key={participant.id} className="participant-item">
                  <div className="participant-number">#{participant.bib}</div>
                  <div className="participant-info">
                    <span className="participant-name">{participant.firstName} {participant.lastName}</span>
                    <span className="participant-category">{participant.category}</span>
                  </div>
                </div>
              ))}
              {participants.length > 5 && (
                <div className="participants-more">
                  +{participants.length - 5} autres participants
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section chronométrage (future) */}
        <div className="dashboard-section">
          <h2>Chronométrage</h2>
          <div className="empty-state">
            <i className="fas fa-stopwatch"></i>
            <p>Aucune donnée de chronométrage</p>
            <small>Les données apparaîtront lors de la course</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceDashboard;
