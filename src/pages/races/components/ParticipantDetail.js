import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import './css/ParticipantDetail.css';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

const ParticipantDetail = ({ race, participant, onBack }) => {
  const [timingData, setTimingData] = useState(participant.timingData || null);
  const [passagesData, setPassagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    loadDetailedTimingData();
    
    // Nettoyer le graphique lors du démontage du composant
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [participant]);

  useEffect(() => {
    // Créer le graphique quand les données sont disponibles et le canvas est prêt
    const timer = setTimeout(() => {
      if (passagesData.length > 1 && chartRef.current) {
        createChart();
      }
    }, 100); // Petit délai pour s'assurer que le DOM est prêt

    return () => clearTimeout(timer);
  }, [passagesData]);

  const loadDetailedTimingData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les données de timing détaillées pour ce participant
      const timingResult = await window.electronAPI.invoke('timing:getByRace', race.id, { participantId: participant.id });
      
      if (timingResult.success && timingResult.data) {
        // Trouver les données spécifiques à ce participant
        const participantData = timingResult.data.find(td => 
          td.participantId === participant.id || 
          td.participantName === participant.participantName ||
          td.participantName === participant.name ||
          td.bibNumber === participant.bibNumber ||
          td.bibNumber === participant.number
        );
        
        if (participantData) {
          setTimingData(participantData);
          
          // Si il y a des passages dans les données, les extraire
          if (participantData.passings && Array.isArray(participantData.passings)) {
            setPassagesData(participantData.passings);
          } else {
            setPassagesData([]);
          }
        } else {
          setPassagesData([]);
        }
      } else {
        setPassagesData([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données détaillées:', error);
      setPassagesData([]);
    } finally {
      setLoading(false);
    }
  };

  const createChart = () => {
    if (!chartRef.current || passagesData.length < 2) {
      return;
    }

    // Détruire le graphique existant s'il y en a un
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    try {
      const ctx = chartRef.current.getContext('2d');
      
      // Préparer les données pour le graphique
      const labels = passagesData.map((_, index) => `Tour ${index + 1}`);
      const lapTimes = passagesData.map(passage => {
        // Convertir le temps de tour en secondes pour le graphique
        return parseLapTime(passage.lapTime);
      }).filter(time => time > 0); // Filtrer les temps invalides

      if (lapTimes.length === 0) {
        return;
      }

      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels.slice(0, lapTimes.length), // Ajuster les labels aux données valides
          datasets: [{
            label: 'Temps de tour (secondes)',
            data: lapTimes,
            borderColor: '#63b3ed',
            backgroundColor: 'rgba(99, 179, 237, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#63b3ed',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              labels: {
                color: '#e2e8f0'
              }
            },
            tooltip: {
              backgroundColor: '#2d3748',
              titleColor: '#e2e8f0',
              bodyColor: '#e2e8f0',
              borderColor: '#4a5568',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const seconds = context.parsed.y;
                  const hours = Math.floor(seconds / 3600);
                  const minutes = Math.floor((seconds % 3600) / 60);
                  const remainingSeconds = (seconds % 60).toFixed(1);
                  
                  if (hours > 0) {
                    return `Temps: ${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.padStart(4, '0')}`;
                  } else {
                    return `Temps: ${minutes}:${remainingSeconds.padStart(4, '0')}`;
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                color: '#4a5568'
              },
              ticks: {
                color: '#a0aec0',
                callback: function(value) {
                  const hours = Math.floor(value / 3600);
                  const minutes = Math.floor((value % 3600) / 60);
                  const seconds = (value % 60).toFixed(0);
                  
                  if (hours > 0) {
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.padStart(2, '0')}`;
                  } else {
                    return `${minutes}:${seconds.padStart(2, '0')}`;
                  }
                }
              }
            },
            x: {
              grid: {
                color: '#4a5568'
              },
              ticks: {
                color: '#a0aec0'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  };

  const calculateBestLap = () => {
    const validLaps = passagesData
      .map(passage => ({
        time: parseLapTime(passage.lapTime),
        lapTime: passage.lapTime,
        originalPassage: passage
      }))
      .filter(lap => lap.time > 0);
    
    if (validLaps.length === 0) return '-';
    
    const fastestLap = validLaps.reduce((fastest, current) => {
      return current.time < fastest.time ? current : fastest;
    });
    
    return formatDuration(fastestLap.lapTime);
  };

  const parseLapTime = (lapTimeString) => {
    if (!lapTimeString || lapTimeString === 'N/A' || lapTimeString === '-') return 0;
    
    // Si c'est déjà un nombre (millisecondes)
    if (typeof lapTimeString === 'number') {
      return lapTimeString / 1000; // Convertir en secondes pour le graphique
    }
    
    // Format MM:SS.mm du backend
    if (typeof lapTimeString === 'string' && lapTimeString.includes(':')) {
      const parts = lapTimeString.split(':');
      if (parts.length >= 2) {
        const minutes = parseFloat(parts[0]) || 0;
        const secondsAndMs = parseFloat(parts[1]) || 0;
        const totalSeconds = minutes * 60 + secondsAndMs;
        return totalSeconds;
      }
    }
    
    // Format HH:MM:SS.mmm 
    if (typeof lapTimeString === 'string' && lapTimeString.split(':').length === 3) {
      const parts = lapTimeString.split(':');
      const hours = parseFloat(parts[0]) || 0;
      const minutes = parseFloat(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDuration = (timeValue) => {
    if (!timeValue || timeValue === 'N/A' || timeValue === '-') return '-';
    
    // Si c'est déjà une chaîne formatée du backend (MM:SS.mm), la retourner
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      return timeValue;
    }
    
    // Si c'est un nombre de millisecondes (du backend)
    if (typeof timeValue === 'number' && timeValue > 1000) {
      const totalSeconds = timeValue / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = (totalSeconds % 60);
      
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
      } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
      }
    }
    
    // Si c'est un nombre de secondes (pour les calculs internes)
    if (typeof timeValue === 'number' && timeValue <= 1000 && timeValue > 0) {
      const hours = Math.floor(timeValue / 3600);
      const minutes = Math.floor((timeValue % 3600) / 60);
      const seconds = (timeValue % 60);
      
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
      } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`;
      }
    }
    
    return timeValue.toString();
  };

  const getPositionSuffix = (position) => {
    if (!position) return '';
    if (position === 1) return 'er';
    return 'ème';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'finished': return 'Terminé';
      case 'running': return 'En cours';
      case 'dnf': return 'Abandon (DNF)';
      case 'dns': return 'Non parti (DNS)';
      default: return 'Statut inconnu';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'finished': return 'finished';
      case 'running': return 'running';
      case 'dnf': return 'dnf';
      case 'dns': return 'dns';
      default: return 'unknown';
    }
  };

  if (loading) {
    return (
      <div className="race-dashboard-container">
        <div className="dashboard-header">
          <h1>Chargement...</h1>
          <button 
            className="btn-unified btn-secondary-unified back-button"
            onClick={onBack}
          >
            <i className="fas fa-arrow-left"></i>
            Retour
          </button>
        </div>
        <div className="loading-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="race-dashboard-container">
      {/* Header avec titre à gauche et bouton retour à droite */}
      <div className="dashboard-header">
        <h1>Détails du participant</h1>
        <button 
          className="btn-unified btn-secondary-unified back-button"
          onClick={onBack}
        >
          <i className="fas fa-arrow-left"></i>
          Retour aux résultats
        </button>
      </div>

      <div className="dashboard-content">
        {/* Informations principales du participant */}
        <div className="dashboard-section">
          <div className="info-grid">
            <div className="info-card" style={{gridColumn: 'span 2'}}>
              <div className="participant-number-large">
                #{participant.bibNumber || participant.number}
              </div>
              <h2 style={{margin: '0 0 1rem', fontSize: '2rem', textAlign: 'center'}}>
                {participant.participantName || participant.name || `${participant.firstName || ''} ${participant.lastName || ''}`.trim()}
              </h2>
              
              <div className="participant-meta-badges">
                <span className="badge badge-category">{participant.category || 'Catégorie non définie'}</span>
                {participant.team && (
                  <span className="badge badge-team">{participant.team}</span>
                )}
                {timingData && (
                  <span className={`badge badge-status ${getStatusClass(timingData.status)}`}>
                    {getStatusText(timingData.status)}
                  </span>
                )}
              </div>

              {timingData && timingData.position && (
                <div className="position-display">
                  <div className="position-number">{timingData.position}</div>
                  <div className="position-text">{timingData.position}{getPositionSuffix(timingData.position)} position</div>
                </div>
              )}
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="info-details">
                <h3>Temps total</h3>
                <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.25rem', fontWeight: 'bold'}}>
                  {timingData ? formatDuration(timingData.totalTime || timingData.elapsedTime) : '-'}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-play"></i>
              </div>
              <div className="info-details">
                <h3>Heure de départ</h3>
                <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                  {timingData ? formatTime(timingData.startTime) : '-'}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-stop"></i>
              </div>
              <div className="info-details">
                <h3>Heure d'arrivée</h3>
                <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                  {timingData ? formatTime(timingData.finishTime) : '-'}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-flag"></i>
              </div>
              <div className="info-details">
                <h3>Nombre de tours</h3>
                <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#63b3ed'}}>
                  {timingData ? (timingData.laps || timingData.lapCount || passagesData.length || 0) : 0}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <div className="info-details">
                <h3>Meilleur tour</h3>
                <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                  {calculateBestLap()}
                </p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="info-details">
                <h3>Écart au premier</h3>
                <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                  {participant.position === 1 ? '0:00.0' : (timingData ? (timingData.gap || '-') : '-')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Données de chronométrage côte à côte */}
        {passagesData.length > 0 && (
          <div className="dashboard-section">
            <h2>Analyse des temps de tour</h2>
            <div className="timing-data-section">
              {/* Liste des temps à gauche */}
              <div className="timing-list">
                <h3>
                  <i className="fas fa-list"></i>
                  Détail des tours ({passagesData.length})
                </h3>
                <div style={{maxHeight: '320px', overflowY: 'auto'}}>
                  {passagesData.map((passage, index) => (
                    <div key={passage.id || index} className="timing-item">
                      <div className="timing-item-info">
                        <div className="timing-item-lap">Tour {index + 1}</div>
                        <div className="timing-item-time">{formatTime(passage.time || passage.passingTime)}</div>
                        {passage.checkpoint && (
                          <div className="timing-item-duration">{passage.checkpoint}</div>
                        )}
                      </div>
                      <div className="timing-item-values">
                        <div className="timing-item-lap-time">
                          {formatDuration(passage.lapTime)}
                        </div>
                        <div className="timing-item-total">
                          Cumulé: {formatDuration(passage.elapsedTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphique à droite */}
              <div className="participant-detail-chart">
                <h3>
                  <i className="fas fa-chart-line"></i>
                  Évolution des temps de tour
                </h3>
                <div className="chart-container">
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques complémentaires */}
        {passagesData.length > 1 && (
          <div className="dashboard-section">
            <h2>Statistiques détaillées</h2>
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-tachometer-alt"></i>
                </div>
                <div className="info-details">
                  <h3>Temps de tour moyen</h3>
                  <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                    {(() => {
                      const validTimes = passagesData
                        .map(passage => parseLapTime(passage.lapTime))
                        .filter(time => time > 0);
                      
                      if (validTimes.length === 0) return '-';
                      
                      const avgTime = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
                      return formatDuration(avgTime);
                    })()}
                  </p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-bolt"></i>
                </div>
                <div className="info-details">
                  <h3>Tour le plus rapide</h3>
                  <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                    {calculateBestLap()}
                  </p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="info-details">
                  <h3>Tour le plus lent</h3>
                  <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                    {(() => {
                      const validLaps = passagesData
                        .map(passage => ({
                          time: parseLapTime(passage.lapTime),
                          lapTime: passage.lapTime
                        }))
                        .filter(lap => lap.time > 0);
                      
                      if (validLaps.length === 0) return '-';
                      
                      const slowestLap = validLaps.reduce((slowest, current) => {
                        return current.time > slowest.time ? current : slowest;
                      });
                      
                      return formatDuration(slowestLap.lapTime);
                    })()}
                  </p>
                </div>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="info-details">
                  <h3>Écart max/min</h3>
                  <p style={{fontFamily: 'Courier New, monospace', fontSize: '1.1rem'}}>
                    {(() => {
                      const times = passagesData.map(p => parseLapTime(p.lapTime)).filter(t => t > 0);
                      if (times.length === 0) return '-';
                      const max = Math.max(...times);
                      const min = Math.min(...times);
                      const diff = max - min;
                      return formatDuration(diff);
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informations supplémentaires */}
        {participant.notes && (
          <div className="dashboard-section">
            <h2>Remarques</h2>
            <div className="info-card">
              <p>{participant.notes}</p>
            </div>
          </div>
        )}

        {!timingData && (
          <div className="dashboard-section">
            <div className="empty-state">
              <i className="fas fa-stopwatch"></i>
              <p>Aucune donnée de chronométrage disponible pour ce participant</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantDetail;