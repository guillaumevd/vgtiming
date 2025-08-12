import React, { useState, useEffect, useRef } from 'react';
import { showToast } from '../../../utils/notifications';
import './css/RaceDashboard.css';

const RaceDashboard = ({ race, onBack, onRaceUpdated, onManageParticipants, onGoToTiming }) => {
  const [raceData, setRaceData] = useState(race);
  const [participants, setParticipants] = useState([]);
  const [timingData, setTimingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const printRef = useRef();
  
  const handlePrint = () => {
    if (!printRef.current) {
      console.error('Aucun contenu à imprimer');
      showToast('Aucun contenu disponible pour l\'impression', 'error');
      return;
    }

    const printContent = printRef.current.cloneNode(true);
    
    // Supprimer les statistiques indésirables du contenu cloné
    const summaryStats = printContent.querySelectorAll('.results-summary, .summary-stat');
    summaryStats.forEach(element => element.remove());
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Résultats Officiels - ${raceData.name}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0;
              padding: 15mm;
              color: #2c3e50;
              line-height: 1.4;
              background: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .main-content {
              flex: 1;
            }
            
            /* En-tête avec logo */
            .print-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 3px solid #3498db;
              padding-bottom: 20px;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              gap: 20px;
            }
            
            .logo-section img {
              height: 80px;
              width: auto;
            }
            
            .company-info {
              display: flex;
              flex-direction: column;
            }
            
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #3498db;
              margin-bottom: 5px;
            }
            
            .company-tagline {
              font-size: 14px;
              color: #7f8c8d;
              margin-bottom: 10px;
            }
            
            .race-basic-info {
              font-size: 13px;
              color: #34495e;
            }
            
            .race-basic-info div {
              margin-bottom: 3px;
            }
            
            .title-section {
              text-align: right;
              flex: 1;
              margin-left: 20px;
            }
            
            .race-title {
              font-size: 28px;
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .race-subtitle {
              font-size: 16px;
              color: #7f8c8d;
              margin-bottom: 10px;
            }
            
            .race-info {
              font-size: 14px;
              color: #34495e;
            }
            
            /* Statistiques supprimées */
            
            /* Tables */
            .section-title {
              font-size: 18px;
              color: #2c3e50;
              margin: 30px 0 15px 0;
              border-left: 4px solid #3498db;
              padding-left: 10px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            th { 
              background: #3498db;
              color: white;
              font-weight: bold;
              padding: 12px 8px;
              text-align: left;
              font-size: 13px;
            }
            
            td { 
              padding: 10px 8px;
              border-bottom: 1px solid #ecf0f1;
              font-size: 12px;
            }
            
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            
            tr:hover {
              background-color: #e3f2fd;
            }
            
            /* Pied de page */
            .print-footer {
              margin-top: auto;
              padding-top: 20px;
              border-top: 2px solid #ecf0f1;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 11px;
              color: #7f8c8d;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 10mm;
              }
              .no-print { 
                display: none !important; 
              }
              .print-header {
                page-break-after: avoid;
              }
              table {
                page-break-inside: avoid;
              }
              th {
                background: #3498db !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="main-content">
            <!-- En-tête avec logo -->
            <div class="print-header">
              <div class="logo-section">
                <img src="./assets/images/logo.png" alt="VG-Timing Logo" />
                <div class="company-info">
                  <div class="company-name">VG-TIMING</div>
                  <div class="company-tagline">Système de Chronométrage Professionnel</div>
                  <div class="race-basic-info">
                    <div><strong>Course :</strong> ${raceData.name}</div>
                    <div><strong>Date :</strong> ${new Date(raceData.startTime || raceData.createdAt).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</div>
                    ${raceData.location ? `<div><strong>Lieu :</strong> ${raceData.location}</div>` : ''}
                    <div><strong>Participants :</strong> ${participants.length} inscrits</div>
                  </div>
                </div>
              </div>
              <div class="title-section">
                <h1 class="race-title">${raceData.name}</h1>
                <p class="race-subtitle">Résultats Officiels de Course</p>
                <div class="race-info">
                  <div>Document officiel généré par VG-Timing</div>
                  ${raceData.organizer ? `<div><strong>Organisateur :</strong> ${raceData.organizer}</div>` : ''}
                  ${raceData.contact ? `<div><strong>Contact :</strong> ${raceData.contact}</div>` : ''}
                </div>
              </div>
            </div>          <!-- Statistiques -->
          <!-- Stats supprimées comme demandé -->

          <!-- Liste des participants -->
          <div class="participants-section">
            <h2 class="section-title">Liste des Participants Inscrits</h2>
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Équipe/Club</th>
                  <th>Catégorie</th>
                </tr>
              </thead>
              <tbody>
                ${participants.map((participant, index) => `
                  <tr>
                    <td><strong>${participant.bibNumber || participant.number || index + 1}</strong></td>
                    <td>${participant.lastName || ''}</td>
                    <td>${participant.firstName || ''}</td>
                    <td>${participant.team || participant.club || '-'}</td>
                    <td>${participant.category || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Résultats de course -->
          <div class="results-section">
            <h2 class="section-title">Classement Final</h2>
            ${printContent.innerHTML}
          </div>
          </div>

          <!-- Pied de page -->
          <div class="print-footer">
            <div>
              <div><strong>VG-Timing</strong> - Système de Chronométrage Professionnel</div>
              <div>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</div>
            </div>
            <div>
              <div>Course: <strong>${raceData.name}</strong></div>
              ${raceData.organizer ? `<div>Organisateur: ${raceData.organizer}</div>` : ''}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  useEffect(() => {
    loadDashboardData();
  }, [race.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les participants via IPC
      const participantsResult = await window.electronAPI.invoke('participant:getByRace', race.id);
      if (participantsResult.success) {
        setParticipants(participantsResult.data || []);
      } else {
        console.error('Error loading participants:', participantsResult.error);
        setParticipants([]);
      }

      // Charger les données de chronométrage si la course est en cours ou terminée
      if (race.status === 'in_progress' || race.status === 'finished' || race.status === 'finishing') {
        try {
          const timingResult = await window.electronAPI.invoke('timing:getByRace', race.id);
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
      console.log('🔄 Changement du statut de la course vers:', newStatus);
      
      // Mettre à jour le statut via l'API IPC
      const statusResult = await window.electronAPI.invoke('race:changeStatus', race.id, newStatus);
      
      if (statusResult.success) {
        console.log('✅ Statut changé avec succès vers:', newStatus);
        
        // Récupérer les données mises à jour de la course
        const raceResult = await window.electronAPI.invoke('race:getById', race.id, false);
        
        if (raceResult.success) {
          setRaceData(raceResult.data);
          onRaceUpdated(raceResult.data);
        }
        
        showToast(`Statut changé vers "${newStatus}"`, 'success');
      } else {
        console.error('❌ Erreur lors du changement de statut:', statusResult.error);
        throw new Error(statusResult.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
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
      console.log('🔄 Remise à zéro complète de la course:', race.name);
      
      // 1. Supprimer tous les participants
      console.log('🔄 Suppression des participants...');
      for (const participant of participants) {
        const deleteResult = await window.electronAPI.invoke('participant:delete', participant.id);
        if (!deleteResult.success) {
          console.error('❌ Erreur lors de la suppression du participant:', participant.name, deleteResult.error);
          throw new Error(`Erreur lors de la suppression du participant ${participant.name}: ${deleteResult.error}`);
        }
      }
      console.log('✅ Participants supprimés');

      // 2. Réinitialiser complètement la course (données de timing + statut)
      console.log('🔄 Réinitialisation complète de la course...');
      const resetResult = await window.electronAPI.invoke('race:reset', race.id);
      if (!resetResult.success) {
        console.error('❌ Erreur lors de la réinitialisation de la course:', resetResult.error);
        throw new Error(`Erreur lors de la réinitialisation: ${resetResult.error}`);
      }
      console.log('✅ Course réinitialisée avec succès');
      
      // 3. Mettre à jour l'état local
      setRaceData({ ...raceData, status: 'ready' });
      onRaceUpdated({ ...raceData, status: 'ready' });
      
      // 4. Recharger les données
      await loadDashboardData();
      
      showToast('Course remise à zéro avec succès !', 'success');
      console.log('🎉 Course remise à zéro avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la remise à zéro:', error);
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
      console.log('🔄 Suppression de tous les participants pour la course:', race.name);
      
      // Supprimer tous les participants via l'API IPC
      for (const participant of participants) {
        const deleteResult = await window.electronAPI.invoke('participant:delete', participant.id);
        if (!deleteResult.success) {
          console.error('❌ Erreur lors de la suppression du participant:', participant.name, deleteResult.error);
          throw new Error(`Erreur lors de la suppression du participant ${participant.name}: ${deleteResult.error}`);
        }
      }
      
      console.log('✅ Tous les participants supprimés avec succès');
      
      // Recharger les données
      await loadDashboardData();
      showToast('Participants supprimés avec succès !', 'success');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des participants:', error);
      showToast(error.message || 'Erreur lors de la suppression des participants', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetTimingData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de chronométrage ? La course sera remise en statut "Prêt".')) {
      return;
    }

    setIsResetting(true);
    try {
      console.log('🔄 Réinitialisation complète de la course:', race.name);
      
      // Utiliser le service de reset complet de la course qui gère les transitions de statut
      const resetResult = await window.electronAPI.invoke('race:reset', race.id);
      
      if (resetResult.success) {
        console.log('✅ Course réinitialisée avec succès');
        
        // Mettre à jour l'état local avec le nouveau statut
        setRaceData({ ...raceData, status: 'ready' });
        onRaceUpdated({ ...raceData, status: 'ready' });
        
        // Recharger les données du dashboard
        await loadDashboardData();
        
        showToast('Données de chronométrage supprimées et course remise en état "Prêt" !', 'success');
      } else {
        console.error('❌ Erreur lors de la réinitialisation:', resetResult.error);
        showToast(resetResult.error || 'Erreur lors de la réinitialisation de la course', 'error');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation:', error);
      showToast(error.message || 'Erreur lors de la réinitialisation de la course', 'error');
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
              {raceData.status === 'finished' && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Cette course est terminée. Pour la remettre en état "Prêt", utilisez la fonction "Remise à zéro complète" ci-dessous.
                </div>
              )}
              <div className="status-buttons">
                <button
                  className={`btn-unified ${raceData.status === 'draft' ? 'btn-primary-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('draft')}
                  disabled={isUpdatingStatus || raceData.status === 'draft' || raceData.status === 'finished'}
                >
                  <i className="fas fa-edit"></i>
                  Brouillon
                </button>
                <button
                  className={`btn-unified ${raceData.status === 'ready' ? 'btn-success-unified' : 'btn-secondary-unified'}`}
                  onClick={() => handleStatusChange('ready')}
                  disabled={isUpdatingStatus || raceData.status === 'ready' || raceData.status === 'finished'}
                  title={raceData.status === 'finished' ? 'Utilisez la fonction de remise à zéro pour remettre une course terminée en état prêt' : ''}
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
                onClick={handlePrint}
              >
                <i className="fas fa-print"></i>
                Imprimer les résultats
              </button>
            )}
          </div>

          {raceData.status === 'finished' && timingData.length > 0 ? (
            // Affichage des résultats finaux
            <div className="final-results" ref={printRef}>
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
