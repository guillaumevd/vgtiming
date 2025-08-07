import React, { useState } from 'react';

const TimingDisplay = ({ 
  selectedRace, 
  displayMode, 
  setDisplayMode, 
  timingData, 
  raceStatus 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  const filteredData = displayData.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.number.includes(searchQuery)
  );

  const renderListView = () => (
    <div className="timing-list-container">
      <div className="timing-list">
        {filteredData.map((participant) => (
          <div key={participant.id} className={`timing-list-item rank-${participant.position <= 3 ? participant.position : ''}`}>
            <div className="list-item-header">
              <div className="position-badge">{participant.position}</div>
              <div className="driver-info">
                <div className="driver-name">{participant.name}</div>
                <div className="driver-number">#{participant.number}</div>
              </div>
            </div>
            
            <div className="list-item-content">
              <div className="stat-group">
                <div className="stat-label">Tours</div>
                <div className="stat-value">{participant.laps}</div>
              </div>
              <div className="stat-group">
                <div className="stat-label">Meilleur Tour</div>
                <div className="stat-value best-time">{participant.bestLapTime}</div>
              </div>
              <div className="stat-group">
                <div className="stat-label">Temps Total</div>
                <div className="stat-value">{participant.totalTime}</div>
              </div>
              <div className="stat-group">
                <div className="stat-label">Écart</div>
                <div className="stat-value">{participant.gap}</div>
              </div>
            </div>
          </div>
        ))}
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
          {filteredData.map((participant) => (
            <tr key={participant.id} className={`timing-row position-${participant.position}`}>
              <td className="position-cell">
                <div className="position-wrapper">
                  <span className="position-number">{participant.position}</span>
                  {participant.position <= 3 && (
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
                  <div className="driver-name">{participant.name}</div>
                  <div className="driver-number">#{participant.number}</div>
                </div>
              </td>
              <td className="laps-cell">
                <span className="laps-count">{participant.laps}</span>
              </td>
              <td className="time-cell best-lap">{participant.bestLapTime}</td>
              <td className="time-cell">{participant.lastLapTime}</td>
              <td className="time-cell">{participant.totalTime}</td>
              <td className="gap-cell">{participant.gap}</td>
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
              {filteredData.length} participant(s) en course
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
        ) : filteredData.length === 0 ? (
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
