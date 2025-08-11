import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCrossMgr } from '../../context/CrossMgrContext';
import { getCachedLatestRelease } from '../../services/githubService';
import './css/Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    totalRaces: 0,
    activeRaces: 0,
    totalParticipants: 0,
    totalTimingData: 0,
    lastActivity: null
  });

  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    timing: 'ready',
    api: 'connecting'
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releaseInfo, setReleaseInfo] = useState(null);

  // Utiliser le contexte CrossMgr pour le statut
  const { connectionStatus, getStatusText: getCrossMgrStatusText, isConnected } = useCrossMgr();

  useEffect(() => {
    loadDashboardData();
    loadRecentActivities();
    loadReleaseInfo();
    
    // Auto-refresh supprimé pour éviter le spam de logs
    // Les données peuvent être rafraîchies manuellement si nécessaire
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!window.VGTiming || !window.VGTiming.isReady) {
        const handleAPIReady = async (event) => {
          if (event.detail.ready) {
            window.removeEventListener('vgtiming-ready', handleAPIReady);
            await loadDashboardData();
          }
        };
        window.addEventListener('vgtiming-ready', handleAPIReady);
        setSystemStatus(prev => ({ ...prev, api: 'waiting' }));
        return;
      }

      setSystemStatus(prev => ({ ...prev, api: 'connected' }));
      
      // Charger toutes les courses
      const racesResult = await window.VGTiming.getAllRaces();
      const races = racesResult.success ? racesResult.data : [];
      
      // Calculer les statistiques des courses
      const activeRaces = races.filter(race => 
        race.status === 'active' || race.status === 'finishing' || race.status === 'ready' || race.status === 'paused'
      );
      
      // Charger tous les participants
      let totalParticipants = 0;
      let totalTimingData = 0;
      
      for (const race of races) {
        try {
          const participantsResult = await window.VGTiming.getParticipantsByRace(race.id);
          if (participantsResult.success) {
            totalParticipants += participantsResult.data.length;
          }
          
          // Essayer de charger les données de chronométrage (si disponible)
          try {
            const timingResult = await window.VGTiming.getTimingByRace?.(race.id);
            if (timingResult && timingResult.success) {
              totalTimingData += timingResult.data.length;
            }
          } catch (e) {
            // Ignorer si la méthode n'existe pas encore
          }
        } catch (error) {
          console.warn('Erreur lors du chargement des participants pour la course:', race.id);
        }
      }

      // Trouver la dernière activité
      let lastActivity = null;
      if (races.length > 0) {
        const sortedRaces = races.sort((a, b) => 
          new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );
        lastActivity = new Date(sortedRaces[0].updatedAt || sortedRaces[0].createdAt);
      }

      setStats({
        totalRaces: races.length,
        activeRaces: activeRaces.length,
        totalParticipants,
        totalTimingData,
        lastActivity
      });

      setSystemStatus(prev => ({ 
        ...prev, 
        database: 'connected',
        timing: totalTimingData > 0 ? 'active' : 'ready'
      }));
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setSystemStatus(prev => ({ ...prev, api: 'error', database: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const activities = [];
      const now = new Date();
      
      // Ajouter l'activité de démarrage de l'application
      activities.push({
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        message: 'Application VG-Timing démarrée',
        type: 'info'
      });
      
      // Charger les activités récentes depuis la base de données
      if (window.VGTiming && window.VGTiming.isReady) {
        const racesResult = await window.VGTiming.getAllRaces();
        if (racesResult.success) {
          const recentRaces = racesResult.data
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 3);
            
          recentRaces.forEach(race => {
            const raceTime = new Date(race.updatedAt || race.createdAt);
            activities.push({
              time: raceTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              message: `Course "${race.name}" ${race.updatedAt ? 'mise à jour' : 'créée'}`,
              type: race.status === 'active' ? 'success' : 'info'
            });
          });
        }
      }
      
      // Ajouter le statut de la base de données
      activities.push({
        time: new Date(now.getTime() - 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        message: 'Base de données connectée',
        type: 'success'
      });

      setRecentActivities(activities.slice(0, 4));
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setRecentActivities([
        {
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          message: 'Erreur de connexion aux données',
          type: 'error'
        }
      ]);
    }
  };

  const loadReleaseInfo = async () => {
    try {
      const release = await getCachedLatestRelease();
      setReleaseInfo(release);
    } catch (error) {
      console.warn('Erreur lors du chargement des informations de release:', error);
      // Utiliser les informations par défaut en cas d'erreur
      setReleaseInfo({
        version: 'v0.0.4',
        name: 'Version locale',
        publishedAt: new Date(),
        isLocal: true
      });
    }
  };

  const getSystemStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Connecté';
      case 'disconnected': return 'Déconnecté';
      case 'ready': return 'Prêt';
      default: return 'Inconnu';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Aucune';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Tableau de Bord</h1>
      </div>

      {/* Section de bienvenue */}
      <div className="welcome-section">
        <h2 className="welcome-title">
          🏁 Bienvenue dans VG-Timing
        </h2>
        <p className="welcome-description">
          Votre solution complète de chronométrage professionnel. Gérez vos courses, 
          chronométrez en temps réel et analysez les performances avec une interface moderne et intuitive.
        </p>
        <div className="version-info">
          <span>📦</span>
          {releaseInfo ? (
            <>
              Version {releaseInfo.version} - {releaseInfo.name}
              <span style={{ marginLeft: '2rem', opacity: 0.8 }}>
                Dernière activité: {releaseInfo.publishedAt.toLocaleDateString('fr-FR')} à {releaseInfo.publishedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : (
            <>
              Version 0.0.4 - Chargement...
              {stats.lastActivity && (
                <span style={{ marginLeft: '2rem', opacity: 0.8 }}>
                  Dernière activité: {stats.lastActivity.toLocaleDateString('fr-FR')} à {stats.lastActivity.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </>
          )}
        </div>
        {loading && (
          <div style={{ color: '#63b3ed', marginTop: '1rem', fontSize: '0.9rem' }}>
            <span>🔄</span> Chargement des données...
          </div>
        )}
      </div>

      {/* Grille des cartes principales */}
      <div className="dashboard-grid">
        {/* Statistiques des courses */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">🏁</div>
            <h3 className="card-title">Courses</h3>
          </div>
          <p className="card-description">
            Gestion complète de vos épreuves sportives et participants
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.totalRaces}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.activeRaces}</span>
              <span className="stat-label">Actives</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalParticipants}</span>
              <span className="stat-label">Participants</span>
            </div>
          </div>
        </div>

        {/* Chronométrage */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">⏱️</div>
            <h3 className="card-title">Chronométrage</h3>
          </div>
          <p className="card-description">
            Interface temps réel pour le suivi des performances
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.activeRaces}</span>
              <span className="stat-label">En cours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStatus.timing === 'active' ? 'Active' : 'Ready'}</span>
              <span className="stat-label">Status</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalTimingData}</span>
              <span className="stat-label">Données</span>
            </div>
          </div>
        </div>

        {/* Actualités */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">📰</div>
            <h3 className="card-title">Activité</h3>
          </div>
          <p className="card-description">
            Dernières activités et événements du système
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{recentActivities.length}</span>
              <span className="stat-label">Événements</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStatus.api === 'connected' ? 'Sync' : 'Offline'}</span>
              <span className="stat-label">Status</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Auto</span>
              <span className="stat-label">Mode</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">⚙️</div>
            <h3 className="card-title">Système</h3>
          </div>
          <p className="card-description">
            État des connexions et configuration système
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">{systemStatus.database === 'connected' ? '✓' : '✗'}</span>
              <span className="stat-label">Base</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{isConnected ? '✓' : '✗'}</span>
              <span className="stat-label">CrossMgr</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{systemStatus.api === 'connected' ? '✓' : '✗'}</span>
              <span className="stat-label">API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <h3>
          🚀 Actions Rapides
        </h3>
        <div className="actions-grid">
          <Link to="/races" className="action-button">
            <span className="action-icon">🏁</span>
            Nouvelle Course
          </Link>
          <Link to="/timing" className="action-button">
            <span className="action-icon">⏱️</span>
            Démarrer Chrono
          </Link>
          <Link to="/settings" className="action-button">
            <span className="action-icon">⚙️</span>
            Configuration
          </Link>
          <Link to="/news" className="action-button">
            <span className="action-icon">📰</span>
            Actualités
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* État du système */}
        <div className="status-bar">
          <h3>
            📊 État du Système
          </h3>
          <div className="status-grid">
            <div className="status-item">
              <div className={`home-status-pill ${isConnected ? 'home-status-connected' : 'home-status-disconnected'}`}></div>
              <div className="status-label">CrossMgr</div>
              <div className="status-value">{getCrossMgrStatusText()}</div>
            </div>
            <div className="status-item">
              <div className={`home-status-pill ${systemStatus.database === 'connected' ? 'home-status-connected' : 'home-status-disconnected'}`}></div>
              <div className="status-label">Base de données</div>
              <div className="status-value">{getSystemStatusText(systemStatus.database)}</div>
            </div>
            <div className="status-item">
              <div className={`home-status-pill ${systemStatus.timing === 'ready' ? 'home-status-connected' : 'home-status-disconnected'}`}></div>
              <div className="status-label">Chronométrage</div>
              <div className="status-value">{getSystemStatusText(systemStatus.timing)}</div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="recent-activity">
          <h3>
            🕐 Activité Récente
          </h3>
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-time">{activity.time}</div>
                <div className="activity-type"></div>
                <div className="activity-message">{activity.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
