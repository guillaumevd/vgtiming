import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './css/Home.css';

const Home = () => {
  const [stats, setStats] = useState({
    totalRaces: 0,
    activeRaces: 0,
    totalParticipants: 0,
    lastActivity: null
  });

  const [systemStatus, setSystemStatus] = useState({
    crossmgr: 'disconnected',
    database: 'connected',
    timing: 'ready'
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    loadDashboardData();
    loadRecentActivities();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les statistiques des courses
      const races = await window.raceAPI.get() || [];
      const activeRaces = races.filter(race => race.status === 'active' || race.status === 'en cours');
      const totalParticipants = races.reduce((sum, race) => sum + (race.participants?.length || 0), 0);

      setStats({
        totalRaces: races.length,
        activeRaces: activeRaces.length,
        totalParticipants,
        lastActivity: races.length > 0 ? new Date(races[0].createdAt || Date.now()) : null
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const loadRecentActivities = () => {
    // Simuler des activités récentes (à remplacer par de vraies données)
    setRecentActivities([
      { time: '14:30', message: 'Application démarrée', type: 'info' },
      { time: '14:25', message: 'Paramètres de configuration mis à jour', type: 'success' },
      { time: '14:20', message: 'Nouvelle course créée', type: 'info' },
      { time: '14:15', message: 'Connexion CrossMgr testée', type: 'warning' }
    ]);
  };

  const getStatusText = (status) => {
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
          Version 0.0.4 - Prêt pour le chronométrage
        </div>
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
              <span className="stat-value">0</span>
              <span className="stat-label">En cours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Ready</span>
              <span className="stat-label">Status</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">1000ms</span>
              <span className="stat-label">Refresh</span>
            </div>
          </div>
        </div>

        {/* Actualités */}
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">📰</div>
            <h3 className="card-title">Actualités</h3>
          </div>
          <p className="card-description">
            Dernières informations et mises à jour
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">0</span>
              <span className="stat-label">Nouvelles</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Sync</span>
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
            <h3 className="card-title">Configuration</h3>
          </div>
          <p className="card-description">
            Paramètres système et préférences utilisateur
          </p>
          <div className="card-stats">
            <div className="stat-item">
              <span className="stat-value">Dark</span>
              <span className="stat-label">Thème</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">FR</span>
              <span className="stat-label">Langue</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">✓</span>
              <span className="stat-label">Sync</span>
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
              <div className={`status-indicator ${systemStatus.crossmgr === 'connected' ? 'status-connected' : 'status-disconnected'}`}></div>
              <div className="status-label">CrossMgr</div>
              <div className="status-value">{getStatusText(systemStatus.crossmgr)}</div>
            </div>
            <div className="status-item">
              <div className={`status-indicator ${systemStatus.database === 'connected' ? 'status-connected' : 'status-disconnected'}`}></div>
              <div className="status-label">Base de données</div>
              <div className="status-value">{getStatusText(systemStatus.database)}</div>
            </div>
            <div className="status-item">
              <div className={`status-indicator ${systemStatus.timing === 'ready' ? 'status-connected' : 'status-disconnected'}`}></div>
              <div className="status-label">Chronométrage</div>
              <div className="status-value">{getStatusText(systemStatus.timing)}</div>
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
