import React, { useState, useEffect } from 'react';
import { showToast } from '../../../utils/notifications';
import './css/RaceDashboard.css';

const RaceDashboard = ({ race, onBack, onRaceUpdated, onManageParticipants, onGoToTiming }) => {
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
      } else {
        console.error('Error loading participants:', participantsResult.error);
        setParticipants([]);
      }

      // Charger les données de chronométrage si la course est en cours ou terminée
      if (race.status === 'in_progress' || race.status === 'finished') {
        try {
          const timingResult = await window.VGTiming.getTimingDataByRace(race.id);
          if (timingResult.success) {
            setTimingData(timingResult.data || []);
          } else {
            console.error('Error loading timing data:', timingResult.error);
            setTimingData([]);
          }
        } catch (timingError) {
          console.error('Error loading timing data:', timingError);
          setTimingData([]);
        }
      } else {
        setTimingData([]);
      }

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showToast('Erreur lors du chargement des données', 'error');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      // Créer un objet propre sans les champs automatiques
      const updateData = {
        name: raceData.name,
        date: raceData.date,
        time: raceData.time,
        location: raceData.location,
        type: raceData.type,
        duration: raceData.duration,
        durationType: raceData.durationType,
        maxParticipants: raceData.maxParticipants,
        description: raceData.description,
        status: newStatus
      };
      
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
      
      // Mettre à jour le statut vers "draft"
      if (raceData.status !== 'draft') {
        await handleStatusChange('draft');
      }
    } catch (error) {
      console.error('Erreur lors de la remise à zéro:', error);
      showToast(error.message || 'Erreur lors de la remise à zéro', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetParticipants = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer tous les participants ?')) {
      return;
    }

    setIsResetting(true);
    try {
      // Supprimer tous les participants
      for (const participant of participants) {
        await window.VGTiming.deleteParticipant(participant.id);
      }
      
      // Recharger les données
      await loadDashboardData();
      showToast('Participants supprimés avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression des participants:', error);
      showToast(error.message || 'Erreur lors de la suppression des participants', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetTimingData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de chronométrage ?')) {
      return;
    }

    setIsResetting(true);
    try {
      // TODO: Supprimer les données de chronométrage quand l'API sera disponible
      showToast('Fonctionnalité en cours de développement', 'info');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      showToast(error.message || 'Erreur lors de la suppression des données', 'error');
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

  // Mappage des statuts API vers affichage français
  const getStatusDisplay = (apiStatus) => {
    const statusMap = {
      'draft': 'Brouillon',
      'ready': 'Prêt',
      'active': 'En cours',
      'paused': 'En pause',
      'finished': 'Terminé',
      'cancelled': 'Annulé'
    };
    return statusMap[apiStatus] || 'Brouillon';
  };

  const getStatusApiValue = (displayStatus) => {
    const statusMap = {
      'Brouillon': 'draft',
      'Prêt': 'ready',
      'En cours': 'active',
      'En pause': 'paused',
      'Terminé': 'finished',
      'Annulé': 'cancelled'
    };
    return statusMap[displayStatus] || 'draft';
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
          <div className={`race-status-badge ${raceData.status ? raceData.status.toLowerCase() : 'draft'}`}>
            {getStatusDisplay(raceData.status)}
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
                  className={`btn-unified ${raceData.status === 'draft' ? 'btn-primary-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('draft')}
                  disabled={isUpdatingStatus || raceData.status === 'draft'}
                >
                  <i className="fas fa-edit"></i>
                  Brouillon
                </button>
                <button
                  className={`btn-unified ${raceData.status === 'ready' ? 'btn-success-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('ready')}
                  disabled={isUpdatingStatus || raceData.status === 'ready'}
                >
                  <i className="fas fa-check"></i>
                  Prêt
                </button>
              </div>
            </div>
            
            <div className="danger-actions">
              <h3>Actions de remise à zéro</h3>
              <div className="danger-buttons">
                <button
                  className="race-button danger btn-sm"
                  onClick={handleResetParticipants}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-users"></i>
                      Participants
                    </>
                  )}
                </button>
                <button
                  className="race-button danger btn-sm"
                  onClick={handleResetTimingData}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-stopwatch"></i>
                      Données
                    </>
                  )}
                </button>
              </div>
              <p className="danger-text">
                Supprime les participants ou les données de chronométrage
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu des participants */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Participants ({participants.length})</h2>
            <button
              className="race-button success"
              onClick={() => onManageParticipants(race)}
            >
              <i className="fas fa-users"></i>
              Gérer les participants
            </button>
          </div>
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
              {participants.slice(0, 5).map((participant, index) => (
                <div key={participant.id || index} className="participant-item">
                  <div className="participant-number">#{participant.number || participant.bib || index + 1}</div>
                  <div className="participant-main">
                    <span className="participant-name">
                      {participant.name || `${participant.firstName || 'Prénom'} ${participant.lastName || 'Nom'}`}
                    </span>
                  </div>
                  <div className="participant-details">
                    <span className="participant-category">{participant.category || 'Catégorie non définie'}</span>
                    {participant.team && (
                      <span className="participant-team">{participant.team}</span>
                    )}
                    {participant.epcTag && (
                      <span className="participant-tag">Tag: {participant.epcTag}</span>
                    )}
                    <span className="participant-date">
                      Créé: {new Date(participant.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {participant.updatedAt && participant.updatedAt !== participant.createdAt && (
                      <span className="participant-updated">
                        Modifié: {new Date(participant.updatedAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    <span className={`participant-status ${participant.isActive ? 'active' : 'inactive'}`}>
                      {participant.isActive ? 'Actif' : 'Inactif'}
                    </span>
                    <span className="participant-id">ID: {participant.id.slice(-8)}</span>
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

        {/* Section chronométrage/résultats */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              {raceData.status === 'finished' ? 'Résultats finaux' : 'Chronométrage'}
            </h2>
            {raceData.status !== 'finished' && (
              <button
                className="race-button primary"
                onClick={() => onGoToTiming(race)}
              >
                <i className="fas fa-stopwatch"></i>
                Aller au chronométrage
              </button>
            )}
            {raceData.status === 'finished' && timingData.length > 0 && (
              <button
                className="race-button secondary"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i>
                Imprimer les résultats
              </button>
            )}
          </div>

          {raceData.status === 'finished' && timingData.length > 0 ? (
            // Affichage des résultats finaux
            <div className="final-results">
              <div className="results-summary">
                <div className="summary-stat">
                  <span className="stat-value">{timingData.length}</span>
                  <span className="stat-label">Participants classés</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">
                    {timingData.filter(p => p.status === 'finished').length}
                  </span>
                  <span className="stat-label">Terminés</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-value">
                    {timingData.filter(p => p.status === 'running').length}
                  </span>
                  <span className="stat-label">En cours</span>
                </div>
                {raceData.finishedAt && (
                  <div className="summary-stat">
                    <span className="stat-value">
                      {new Date(raceData.finishedAt).toLocaleTimeString('fr-FR')}
                    </span>
                    <span className="stat-label">Course terminée</span>
                  </div>
                )}
              </div>

              <div className="results-table">
                <table>
                  <thead>
                    <tr>
                      <th>Pos.</th>
                      <th>Dossard</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Tours</th>
                      <th>Temps total</th>
                      <th>Écart</th>
                      <th>Meilleur tour</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timingData
                      .sort((a, b) => (a.position || 999) - (b.position || 999))
                      .map((participant, index) => (
                      <tr key={participant.id || index} className={`result-row ${participant.status}`}>
                        <td className="position">
                          {participant.position || '-'}
                        </td>
                        <td className="bib-number">
                          {participant.bibNumber || participant.number}
                        </td>
                        <td className="participant-name">
                          {participant.participantName || participant.name}
                        </td>
                        <td className="category">
                          {participant.category || '-'}
                        </td>
                        <td className="laps">
                          {participant.laps || participant.lapCount || 0}
                        </td>
                        <td className="total-time">
                          {participant.totalTime || participant.elapsedTime || '-'}
                        </td>
                        <td className="gap">
                          {participant.gap || '-'}
                        </td>
                        <td className="best-lap">
                          {participant.bestLapTime || '-'}
                        </td>
                        <td className={`status ${participant.status || 'unknown'}`}>
                          {participant.status === 'finished' && '✓ Terminé'}
                          {participant.status === 'running' && '⏱️ En cours'}
                          {participant.status === 'dnf' && '❌ DNF'}
                          {participant.status === 'dns' && '⏸️ DNS'}
                          {!participant.status && '❓ Inconnu'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : raceData.status === 'in_progress' && timingData.length > 0 ? (
            // Affichage pendant la course
            <div className="live-timing">
              <div className="timing-stats">
                <div className="stat">
                  <span className="stat-value">{timingData.length}</span>
                  <span className="stat-label">Participants en course</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {timingData.filter(p => p.status === 'running').length}
                  </span>
                  <span className="stat-label">En cours</span>
                </div>
                <div className="stat">
                  <span className="stat-value">
                    {timingData.filter(p => p.status === 'finished').length}
                  </span>
                  <span className="stat-label">Terminés</span>
                </div>
              </div>
              <div className="go-to-timing">
                <p>Course en cours - Suivez le chronométrage en temps réel</p>
                <button
                  className="race-button primary large"
                  onClick={() => onGoToTiming(race)}
                >
                  <i className="fas fa-stopwatch"></i>
                  Voir le chronométrage en direct
                </button>
              </div>
            </div>
          ) : (
            // État vide
            <div className="empty-state">
              <i className="fas fa-stopwatch"></i>
              <p>
                {raceData.status === 'finished' 
                  ? 'Aucun résultat disponible' 
                  : 'Aucune donnée de chronométrage'
                }
              </p>
              <small>
                {raceData.status === 'finished' 
                  ? 'La course est terminée mais aucun résultat n\'a été enregistré' 
                  : 'Les données apparaîtront lors de la course'
                }
              </small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RaceDashboard;
