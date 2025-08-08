import React, { useState } from 'react';

const TimingDisplay = ({ 
  selectedRace, 
  displayMode, 
  setDisplayMode, 
  timingData, 
  raceStatus,
  settings = {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState(settings.sortType || 'bestLap');
  
  // Demo data for development
  const demoData = [
    {
      id: 1,
      position: 1,
      number: '001',
      name: 'Jean Dupont',
      laps: 12,
      bestLapTime: '1:23.456',
      lastLapTime: '1:24.789',
      totalTime: '17:32.123',
      gap: '-'
    },
    {
      id: 2,
      position: 2,
      number: '042',
      name: 'Marie Martin',
      laps: 12,
      bestLapTime: '1:24.123',
      lastLapTime: '1:25.456',
      totalTime: '17:35.789',
      gap: '+3.666'
    },
    {
      id: 3,
      position: 3,
      number: '017',
      name: 'Pierre Bernard',
      laps: 11,
      bestLapTime: '1:25.789',
      lastLapTime: '1:26.123',
      totalTime: '16:42.456',
      gap: '-1 tour'
    }
  ];

  const displayData = timingData.length > 0 ? timingData : demoData;
  
  const filteredData = displayData.filter(participant => {
    const name = participant.name || participant.participantName || '';
    const number = participant.number || participant.bibNumber || '';
    
    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           number.toString().includes(searchQuery);
  });

  // Fonction de tri
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortType) {
      case 'bestLap':
        const aTime = a.bestLapTime || '99:99.999';
        const bTime = b.bestLapTime || '99:99.999';
        return aTime.localeCompare(bTime);
      case 'lastLap':
        const aLastTime = a.lastLapTime || '99:99.999';
        const bLastTime = b.lastLapTime || '99:99.999';
        return aLastTime.localeCompare(bLastTime);
      case 'totalLaps':
        const aLaps = a.laps || 0;
        const bLaps = b.laps || 0;
        return bLaps - aLaps; // Ordre décroissant pour les tours
      case 'position':
      default:
        const aPos = a.position || 999;
        const bPos = b.position || 999;
        return aPos - bPos;
    }
  });

  const handleSortChange = async (newSortType) => {
    setSortType(newSortType);
    
    // Sauvegarder la préférence dans la base de données
    try {
      if (window.VGTiming && window.VGTiming.isReady) {
        await window.VGTiming.setSetting('sortType', newSortType);
        console.log('Préférence de tri sauvegardée:', newSortType);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du tri:', error);
    }
  };

  const renderListView = () => (
    <div className="timing-list-container">
      <div className="timing-list">
        {sortedData.map((participant) => {
          const name = participant.name || participant.participantName || 'Participant inconnu';
          const number = participant.number || participant.bibNumber || 'N/A';
          const position = participant.position || participant.rank || 'N/A';
          const laps = participant.laps || participant.lapCount || 0;
          const bestLapTime = participant.bestLapTime || participant.bestTime || 'N/A';
          const totalTime = participant.totalTime || 'N/A';
          const gap = participant.gap || 'N/A';
          
          return (
            <div key={participant.id || participant.participantId || Math.random()} className={`timing-list-item rank-${position <= 3 ? position : ''}`}>
              <div className="list-item-header">
                <div className="position-badge">{position}</div>
                <div className="driver-info">
                  <div className="driver-name">{name}</div>
                  <div className="driver-number">#{number}</div>
                </div>
              </div>
              
              <div className="list-item-content">
                <div className="stat-group">
                  <div className="stat-label">Tours</div>
                  <div className="stat-value">{laps}</div>
                </div>
                <div className="stat-group">
                  <div className="stat-label">Meilleur Tour</div>
                  <div className="stat-value best-time">{bestLapTime}</div>
                </div>
                <div className="stat-group">
                  <div className="stat-label">Temps Total</div>
                  <div className="stat-value">{totalTime}</div>
                </div>
                <div className="stat-group">
                  <div className="stat-label">Écart</div>
                  <div className="stat-value">{gap}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="timing-grid-container">
      <table className="timing-grid">
        <thead>
          <tr>
            <th className="sortable">Pos</th>
            <th className="sortable">Pilote</th>
            <th className="sortable">Tours</th>
            <th className="sortable">Meilleur Tour</th>
            <th className="sortable">Dernier Tour</th>
            <th className="sortable">Temps Total</th>
            <th>Écart</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((participant) => (
            <tr key={participant.id} className={`timing-row position-${participant.position || 'unknown'}`}>
              <td className="position-cell">
                <div className="position-wrapper">
                  <span className="position-number">{participant.position || '-'}</span>
                  {participant.position && participant.position <= 3 && (
                    <span className="podium-indicator">
                      {participant.position === 1 && '🥇'}
                      {participant.position === 2 && '🥈'}
                      {participant.position === 3 && '🥉'}
                    </span>
                  )}
                </div>
              </td>
              <td className="driver-cell">
                <div className="driver-info">
                  <div className="driver-name">{participant.name || 'Pilote inconnu'}</div>
                  <div className="driver-number">#{participant.number || '?'}</div>
                </div>
              </td>
              <td className="laps-cell">
                <span className="laps-count">{participant.laps || 0}</span>
              </td>
              <td className="time-cell best-lap">{participant.bestLapTime || '-'}</td>
              <td className="time-cell">{participant.lastLapTime || '-'}</td>
              <td className="time-cell">{participant.totalTime || '-'}</td>
              <td className="gap-cell">{participant.gap || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderNoData = () => (
    <div className="no-data-message">
      <div className="no-data-icon">⏱️</div>
      <p>Aucune donnée de chronométrage</p>
      <span>
        {!selectedRace 
          ? 'Sélectionnez une course pour commencer'
          : raceStatus === 'ready' 
            ? 'Lancez la course pour voir les temps'
            : 'En attente des données CrossMGR...'
        }
      </span>
    </div>
  );

  return (
    <div className="timing-display">
      <div className="timing-display-header">
        <div className="header-left">
          <h2>
            {selectedRace ? selectedRace.name : 'Aucune course sélectionnée'}
          </h2>
          {selectedRace && (
            <div className="participants-count">
              {sortedData.length} participant(s) en course
            </div>
          )}
        </div>
        
        <div className="header-controls">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher pilote..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="sort-controls">
            <label className="sort-label">Trier par:</label>
            <select 
              className="sort-select"
              value={sortType}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="position">Position</option>
              <option value="bestLap">Meilleur tour</option>
              <option value="lastLap">Dernier tour</option>
              <option value="totalLaps">Nombre de tours</option>
            </select>
          </div>
          
          <div className="display-controls">
            <button
              className={`btn-display-type ${displayMode === 'list' ? 'active' : ''}`}
              onClick={() => setDisplayMode('list')}
            >
              <i className="fas fa-list"></i>
              Liste
            </button>
            <button
              className={`btn-display-type ${displayMode === 'grid' ? 'active' : ''}`}
              onClick={() => setDisplayMode('grid')}
            >
              <i className="fas fa-table"></i>
              Grille
            </button>
          </div>
        </div>
      </div>

      <div className="timing-display-content">
        {!selectedRace || (timingData.length === 0 && raceStatus === 'ready') ? (
          renderNoData()
        ) : sortedData.length === 0 ? (
          <div className="no-results-message">
            <p>Aucun résultat trouvé pour "{searchQuery}"</p>
            <button 
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              Effacer la recherche
            </button>
          </div>
        ) : displayMode === 'list' ? (
          renderListView()
        ) : (
          renderGridView()
        )}
      </div>
    </div>
  );
};

export default TimingDisplay;
