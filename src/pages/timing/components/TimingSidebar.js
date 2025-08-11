import React from 'react';

const TimingSidebar = ({
  races,
  selectedRace,
  onRaceSelect,
  crossmgrStatus,
  crossmgrStatusText,
  isConnected,
  raceStatus,
  onStartRace,
  onStopRace,
  onResetRace,
  onFinishRace,
  timingStats = {
    elapsedTime: '00:00:00',
    totalLaps: 0,
    lastPassingTime: null,
    runningCount: 0,
    finishedCount: 0
  }
}) => {

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
      default: return '⚪';
    }
  };

  const getRaceStatusIcon = (status) => {
    switch (status) {
      case 'running': return '🏃';
      case 'in_progress': return '🏃';
      case 'active': return '🏃';
      case 'finishing': return '🏁';
      case 'paused': return '⏸️';
      case 'finished': return '🏁';
      case 'ready': return '⚡';
      default: return '⚪';
    }
  };

  // Condition pour activer le bouton Lancer
  const canStartRace = selectedRace && 
                       (raceStatus === 'ready' || raceStatus === 'paused') && 
                       isConnected;

  // Classes CSS pour l'animation du bouton
  const getStartButtonClasses = () => {
    let classes = "btn-action btn-start";
    if (canStartRace && raceStatus === 'ready') {
      classes += " btn-pulse"; // Animation clignotante
    }
    return classes;
  };

  return (
    <div className="timing-control-panel">
      <div className="control-panel-header">
        <h3>Contrôles</h3>
      </div>

      {/* Section Statuts */}
      <div className="control-section">
        <div className="section-title">
          <h4>📊 Statuts</h4>
        </div>
        <div className="section-content">
          <div className="status-cards">
            {/* Statut CrossMGR */}
            <div className={`status-card ${crossmgrStatus}`}>
              <div className="status-card-header">
                <div className="status-icon">
                  {getStatusIcon(crossmgrStatus)}
                </div>
                <div className="status-info">
                  <div className="status-title">CrossMGR</div>
                  <div className="status-subtitle">Système de chronométrage</div>
                </div>
              </div>
              <div className="status-card-body">
                <div className={`status-badge status-badge-${crossmgrStatus}`}>
                  {crossmgrStatusText}
                </div>
                <div className="status-details">
                  {crossmgrStatus === 'connected' && 'Prêt à recevoir des données'}
                  {crossmgrStatus === 'connecting' && 'En attente de client CrossMgr'}
                  {crossmgrStatus === 'disconnected' && 'Vérifiez la connexion réseau'}
                  {crossmgrStatus === 'error' && 'Erreur de connexion'}
                </div>
              </div>
            </div>

            {/* Statut Course */}
            <div className={`status-card race-${raceStatus}`}>
              <div className="status-card-header">
                <div className="status-icon">
                  {getRaceStatusIcon(raceStatus)}
                </div>
                <div className="status-info">
                  <div className="status-title">Course</div>
                  <div className="status-subtitle">État du chronométrage</div>
                </div>
              </div>
              <div className="status-card-body">
                <div className={`status-badge status-badge-${raceStatus}`}>
                  {raceStatus === 'running' && 'En cours'}
                  {raceStatus === 'in_progress' && 'En cours'}
                  {raceStatus === 'active' && 'En cours'}
                  {raceStatus === 'finishing' && 'En cours de finition'}
                  {raceStatus === 'paused' && 'En pause'}
                  {raceStatus === 'finished' && 'Terminée'}
                  {raceStatus === 'ready' && 'Prête'}
                </div>
                <div className="status-details">
                  {raceStatus === 'running' && 'Chronométrage en cours...'}
                  {raceStatus === 'paused' && 'Course mise en pause'}
                  {raceStatus === 'finished' && 'Course terminée'}
                  {raceStatus === 'ready' && 'Prête à démarrer'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Sélection de Course */}
      <div className="control-section">
        <div className="section-title">
          <h4>🏁 Sélection de Course</h4>
        </div>
        <div className="section-content">
          <select 
            className="race-selector"
            value={selectedRace?.id || ''}
            onChange={(e) => {
              const race = races.find(r => r.id === e.target.value);
              if (race) onRaceSelect(race);
            }}
          >
            <option value="">Sélectionner une course...</option>
            {races.map(race => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            ))}
          </select>
          
          {selectedRace && (
            <div className="selected-race-info">
              <div className="race-detail">
                <strong>{selectedRace.name}</strong>
              </div>
              <div className="race-detail">
                📅 {selectedRace.date ? new Date(selectedRace.date).toLocaleDateString('fr-FR') : 'Date non définie'}
              </div>
              <div className="race-detail">
                ⏰ {selectedRace.time || 'Heure non définie'}
              </div>
              <div className="race-detail">
                📍 {selectedRace.location || 'Lieu non défini'}
              </div>
              <div className="race-detail">
                👥 {selectedRace.participants?.length || 0} participant(s)
              </div>
              <div className="race-detail">
                🏃 {selectedRace.type || 'Type non défini'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Actions */}
      <div className="control-section">
        <div className="section-title">
          <h4>🎮 Actions</h4>
        </div>
        <div className="section-content">
          <div className="action-buttons">
            <button
              className={getStartButtonClasses()}
              onClick={onStartRace}
              disabled={!canStartRace}
              title={
                !selectedRace 
                  ? 'Sélectionnez une course'
                  : !isConnected 
                    ? 'CrossMgr doit être connecté'
                    : raceStatus === 'running' 
                      ? 'Course en cours'
                      : raceStatus === 'finished'
                        ? 'Course terminée'
                        : 'Démarrer le chronométrage'
              }
            >
              <i className="fas fa-play"></i>
              {raceStatus === 'paused' ? 'Reprendre' : 'Lancer'}
            </button>
            
            <button
              className="btn-action btn-stop"
              onClick={onStopRace}
              disabled={!selectedRace || raceStatus !== 'running'}
              title="Arrêter temporairement le chronométrage"
            >
              <i className="fas fa-pause"></i>
              Arrêter
            </button>
            
            <button
              className="btn-action btn-reset"
              onClick={onResetRace}
              disabled={!selectedRace || raceStatus === 'running'}
              title="Remettre à zéro le chronométrage"
            >
              <i className="fas fa-undo"></i>
              Reset
            </button>
            
            <button
              className="btn-action btn-finish"
              onClick={onFinishRace}
              disabled={!selectedRace || raceStatus === 'finished' || raceStatus === 'ready'}
              title="Terminer définitivement la course"
            >
              <i className="fas fa-flag-checkered"></i>
              Terminer
            </button>
          </div>

          {/* Informations supplémentaires */}
          {selectedRace && (
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tours enregistrés</span>
                <span className="info-value">{timingStats.totalLaps || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">En course</span>
                <span className="info-value">{timingStats.runningCount || 0}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Terminés</span>
                <span className="info-value">{timingStats.finishedCount || 0}</span>
              </div>
              {timingStats.lastPassingTime && (
                <div className="info-item">
                  <span className="info-label">Dernier passage</span>
                  <span className="info-value">
                    {new Date(timingStats.lastPassingTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {!isConnected && (
            <div className="connection-info">
              💡 {crossmgrStatus === 'disconnected' 
                ? 'Assurez-vous que CrossMGR est lancé et connecté au même réseau' 
                : 'En attente de connexion de CrossMgr...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimingSidebar;
