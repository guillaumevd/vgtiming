import React, { useState, useEffect } from 'react';
import { useCrossMgr } from '../../context/CrossMgrContext';
import { useRealTimeTimer } from '../../hooks/useRealTimeTimer';
import TimingDisplay from './components/TimingDisplay';
import TimingSidebar from './components/TimingSidebar';
import './css/Timing.css';

const Timing = () => {
  const [selectedRace, setSelectedRace] = useState(null);
  const [races, setRaces] = useState([]);
  const [displayMode, setDisplayMode] = useState('list'); // 'list' ou 'grid'
  const [timingData, setTimingData] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [raceStatus, setRaceStatus] = useState('ready');
  const [loading, setLoading] = useState(true);
  const [timingStats, setTimingStats] = useState({
    elapsedTime: '00:00:00',
    totalLaps: 0,
    lastPassingTime: null,
    runningCount: 0,
    finishedCount: 0
  });
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [settings, setSettings] = useState({
    displayType: 'list',
    sortType: 'bestLap'
  });

  // Utiliser le contexte CrossMgr au lieu de l'état local
  const { connectionStatus, getStatusText, isConnected } = useCrossMgr();

  // Déterminer si la course est active pour le chronométre
  const isRaceActive = selectedRace && ['in_progress', 'finishing', 'paused'].includes(raceStatus);
  
  // Utiliser le hook de chronométre en temps réel
  const realTimeElapsed = useRealTimeTimer(
    timingStats.gtTimestamp, 
    isRaceActive,
    1000 // Mise à jour chaque seconde
  );

  // Déterminer le temps à afficher (temps réel si course active, sinon dernier temps connu)
  const displayElapsedTime = isRaceActive ? realTimeElapsed : (timingStats.elapsedTime || '00:00:00');

  // Surveiller les changements de statut pour maintenir localStorage à jour
  useEffect(() => {
    if (selectedRace) {
      if (['in_progress', 'active', 'finishing', 'paused'].includes(selectedRace.status)) {
        localStorage.setItem('vg-timing-active-race', selectedRace.id);
        console.log('💾 Course mise à jour dans localStorage:', selectedRace.name, 'Status:', selectedRace.status);
      } else {
        localStorage.removeItem('vg-timing-active-race');
        console.log('🗑️ Course supprimée de localStorage (plus en cours):', selectedRace.name, 'Status:', selectedRace.status);
      }
    }
  }, [selectedRace?.status, selectedRace?.id]);

  useEffect(() => {
    const initializeTiming = async () => {
      // Attendre que l'API soit prête
      if (!window.VGTiming || !window.VGTiming.isReady) {
        const handleAPIReady = async (event) => {
          if (event.detail.ready) {
            window.removeEventListener('vgtiming-ready', handleAPIReady);
            await loadSettings();
            await loadRaces();
          }
        };
        window.addEventListener('vgtiming-ready', handleAPIReady);
        return;
      }
      
      await loadSettings();
      await loadRaces();
    };

    // Ajouter les listeners d'événements CrossMgr pour actualisation
    const setupCrossMgrListeners = () => {
      console.log('🔧 Configuration des listeners CrossMgr...');
      console.log('🔧 window.electronAPI disponible:', !!window.electronAPI);
      
      if (window.electronAPI) {
        console.log('🔧 Nettoyage des anciens listeners avant configuration...');
        // Nettoyer d'abord les anciens listeners pour éviter les doublons
        if (window.electronAPI.removeCrossMgrListeners) {
          window.electronAPI.removeCrossMgrListeners();
        }
        
        console.log('🔧 Configuration listener onCrossMgrMessage...');
        
        // Test de ping pour vérifier que les listeners fonctionnent
        console.log('🏓 Test ping - listener configuré à:', new Date().toLocaleTimeString());
        
        // Actualiser lors des messages de timing CrossMgr (passages de participants)
        window.electronAPI.onCrossMgrMessage((event, data) => {
          try {
            console.log('📡 LISTENER FONCTIONNE ! Message CrossMgr reçu dans timing/index.js:', data);
            console.log('📡 Timestamp événement:', new Date().toLocaleTimeString());
            console.log('📡 Type de données reçues:', typeof data, 'Contenu:', JSON.stringify(data, null, 2));
            
            // SIGNAL DE DIAGNOSTIC - Envoyer un signal au backend pour confirmer la réception
            if (window.electronAPI && window.electronAPI.invoke) {
              window.electronAPI.invoke('debug:frontend-received-crossmgr', { timestamp: new Date().toISOString(), data: data });
            }
            
            // Vérifier si c'est un passage de participant
            if (data && (data.epcTag || data.passingTime)) {
            console.log('🏃 Passage de participant détecté!');
            console.log('🏃 EPC Tag:', data.epcTag);
            console.log('🏃 Temps de passage:', data.passingTime);
            
            console.log('🔄 Lancement actualisation dans 500ms...');
            
            // Petite pause pour laisser le backend traiter le passage
            setTimeout(() => {
              console.log('🔄 Exécution de refreshTimingData (complet avec stats)...');
              // Utiliser la fonction existante qui met à jour TOUTES les données (timing + statistiques)
              refreshTimingData();
            }, 500);
          } else {
            console.log('📡 Message CrossMgr (pas un passage):', data);
          }
          } catch (error) {
            console.error('❌ ERREUR dans le listener CrossMgr:', error);
            console.error('❌ Stack trace:', error.stack);
          }
        });

        console.log('🔧 Configuration listener onCrossMgrConnectionEstablished...');
        
        // Actualiser lors des connexions/déconnexions
        window.electronAPI.onCrossMgrConnectionEstablished(() => {
          console.log('🔗 CrossMgr connecté, actualisation des données');
          refreshTimingData();
        });

        // Écouter aussi les événements personnalisés CrossMgr  
        window.addEventListener('crossmgr-message', (event) => {
          console.log('🎯 Événement crossmgr-message reçu:', event.detail);
          const data = event.detail;
          if (data && (data.epcTag || data.passingTime)) {
            console.log('🏃 Passage via événement personnalisé, actualisation');
            setTimeout(() => {
              console.log('🔄 Déclenchement refreshTimingData à cause d\'un passage');
              refreshTimingData();
            }, 500);
          } else {
            console.log('⚠️ Données événement crossmgr-message manquantes:', data);
          }
        });

        // Écouter les événements de fin automatique de course
        window.electronAPI.onRaceAutoFinished?.((event, data) => {
          console.log('🏁 Course terminée automatiquement:', data);
          
          // Afficher une notification
          console.log(`🏁 Course "${data.raceName}" terminée automatiquement: ${data.reason}`);
          
          // Mettre à jour l'état local
          setRaceStatus('finished');
          if (selectedRace && selectedRace.id === data.raceId) {
            setSelectedRace({...selectedRace, status: 'finished'});
          }
          
          // Arrêter le rafraîchissement temps réel
          stopTimingRefresh();
          
          // TODO: Naviguer automatiquement vers le dashboard des résultats
          // navigate(`/races/dashboard/${data.raceId}`)
          
          // Pour l'instant, afficher une alerte
          alert(`🏁 Course terminée automatiquement!\n\nCourse: ${data.raceName}\nRaison: ${data.reason}\n\nVous serez bientôt redirigé vers les résultats.`);
        });
        
        console.log('✅ Listeners CrossMgr configurés avec succès');
      } else {
        console.error('❌ window.electronAPI non disponible, impossible de configurer les listeners');
      }
    };

    initializeTiming();
    setupCrossMgrListeners();

    // Cleanup lors du démontage du composant
    return () => {
      console.log('🧹 Nettoyage composant Timing - suppression listeners');
      stopTimingRefresh();
      
      // Vérifier si on doit garder la course sauvegardée
      // On la garde seulement si elle est encore en cours
      if (selectedRace && !['in_progress', 'active', 'finishing', 'paused'].includes(selectedRace.status)) {
        localStorage.removeItem('vg-timing-active-race');
        console.log('🧹 Course supprimée de localStorage lors du nettoyage (plus en cours)');
      }
      
      // Nettoyer les listeners IPC
      if (window.electronAPI && window.electronAPI.removeCrossMgrListeners) {
        window.electronAPI.removeCrossMgrListeners();
      }
      
      // Nettoyer les événements personnalisés
      window.removeEventListener('crossmgr-message', () => {});
    };
  }, []);

  const loadSettings = async () => {
    try {
      if (!window.VGTiming || !window.VGTiming.isReady) return;

      // Charger les paramètres depuis la base de données
      const settingsResult = await window.VGTiming.getAllSettings();
      if (settingsResult.success) {
        const loadedSettings = {};
        
        if (typeof settingsResult.data === 'object' && settingsResult.data !== null) {
          Object.keys(settingsResult.data).forEach(key => {
            loadedSettings[key] = settingsResult.data[key].value;
          });
        }

        // Mettre à jour les paramètres avec les valeurs par défaut si nécessaire
        const timingSettings = {
          displayType: loadedSettings.displayType || 'list',
          sortType: loadedSettings.sortType || 'bestLap'
        };

        setSettings(timingSettings);
        
        // Appliquer le mode d'affichage depuis les paramètres
        setDisplayMode(timingSettings.displayType);
        
        console.log('Paramètres timing chargés:', timingSettings);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres timing:', error);
    }
  };

  const loadRaces = async () => {
    try {
      setLoading(true);
      const result = await window.VGTiming.getAllRaces({ status: ['active', 'ready', 'paused', 'finishing', 'in_progress'] });
      
      if (result.success) {
        const availableRaces = result.data || [];
        setRaces(availableRaces);
        
        // Vérifier s'il y a une course sauvegardée en cours
        const savedRaceId = localStorage.getItem('vg-timing-active-race');
        let raceToSelect = null;
        
        if (savedRaceId) {
          // Chercher la course sauvegardée dans les courses disponibles
          const savedRace = availableRaces.find(race => race.id === savedRaceId);
          if (savedRace && ['in_progress', 'active', 'finishing', 'paused'].includes(savedRace.status)) {
            console.log('🔄 Course en cours restaurée:', savedRace.name, 'Status:', savedRace.status);
            raceToSelect = savedRace;
          } else {
            // La course sauvegardée n'est plus en cours, supprimer de localStorage
            localStorage.removeItem('vg-timing-active-race');
          }
        }
        
        // Si pas de course sauvegardée, auto-select first active race or first race
        if (!raceToSelect) {
          const activeRace = availableRaces.find(race => ['in_progress', 'active'].includes(race.status));
          raceToSelect = activeRace || availableRaces[0];
        }
        
        if (raceToSelect) {
          await selectRace(raceToSelect);
        }
      } else {
        console.error('Error loading races:', result.error);
      }
    } catch (error) {
      console.error('Error loading races:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectRace = async (race) => {
    try {
      setSelectedRace(race);
      setRaceStatus(race.status || 'ready');
      
      // Sauvegarder la course si elle est en cours
      if (['in_progress', 'active', 'finishing', 'paused'].includes(race.status)) {
        localStorage.setItem('vg-timing-active-race', race.id);
        console.log('💾 Course en cours sauvegardée:', race.name, 'Status:', race.status);
      } else {
        // Si la course n'est pas en cours, supprimer de localStorage
        localStorage.removeItem('vg-timing-active-race');
      }
      
      // Charger les participants de la course
      const participantsResult = await window.VGTiming.getParticipantsByRace(race.id);
      if (participantsResult.success) {
        setParticipants(participantsResult.data || []);
      }
      
      // Charger les données de chronométrage
      const timingResult = await window.VGTiming.getTimingDataByRace(race.id);
      if (timingResult.success) {
        setTimingData(timingResult.data || []);
      }
      
      // Charger les statistiques de timing (incluant GT timestamp pour le chronométre)
      console.log('📊 Chargement des stats pour la course sélectionnée:', race.name);
      const statsResult = await window.electronAPI.invoke('timing:getStats', race.id);
      if (statsResult.success) {
        setTimingStats(statsResult.data);
        console.log('📊 Stats chargées:', statsResult.data);
        console.log('⏱️ GT Timestamp récupéré:', statsResult.data.gtTimestamp);
      } else {
        console.error('❌ Erreur lors du chargement des stats:', statsResult.error);
      }
      
      // Si la course est en cours, démarrer le rafraîchissement temps réel
      if (['in_progress', 'active', 'finishing'].includes(race.status)) {
        console.log('🔄 Démarrage du rafraîchissement temps réel pour course en cours');
        startTimingRefresh();
      }
      
    } catch (error) {
      console.error('Error selecting race:', error);
    }
  };

  const handleRaceSelect = (race) => {
    selectRace(race);
  };

  const handleStartRace = async () => {
    if (!selectedRace) return;
    
    try {
      console.log('🚀 Démarrage de la course:', selectedRace.name);
      
      // Utiliser la méthode unifiée qui gère tout le processus
      const result = await window.VGTiming.startRaceWithTiming(selectedRace.id);
      
      if (!result.success) {
        console.error('❌ Erreur démarrage course complète:', result.error);
        return;
      }
      
      console.log('✅ Course démarrée avec succès:', result.data);
      
      // Récupérer immédiatement le statut à jour depuis le backend
      const currentRaceResult = await window.VGTiming.getRaceById(selectedRace.id);
      if (currentRaceResult.success) {
        const updatedRace = currentRaceResult.data;
        setRaceStatus(updatedRace.status);
        setSelectedRace({...selectedRace, status: updatedRace.status});
        console.log('✅ Statut mis à jour:', updatedRace.status);
      } else {
        // Fallback si on n'arrive pas à récupérer la course
        setRaceStatus('in_progress');
        setSelectedRace({...selectedRace, status: 'in_progress'});
      }
      
      // Démarrer le rafraîchissement temps réel
      startTimingRefresh();
      
      console.log('🏁 Course démarrée avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur lors du démarrage de la course:', error);
    }
  };

  const handleStopRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Arrêter le rafraîchissement temps réel
      stopTimingRefresh();
      
      // Changer le statut de la course à "paused"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'paused');
      
      if (result.success) {
        setRaceStatus('paused');
        setSelectedRace(result.data);
        console.log('Course en pause:', selectedRace.name);
      } else {
        console.error('Error pausing race:', result.error);
      }
    } catch (error) {
      console.error('Error pausing race:', error);
    }
  };

  const handleResetRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Arrêter le rafraîchissement temps réel
      stopTimingRefresh();
      
      console.log('🔄 Début de la réinitialisation de la course:', selectedRace.name);
      
      // Réinitialiser complètement la course (données de timing + statut) via l'API IPC
      const resetResult = await window.electronAPI.invoke('race:reset', selectedRace.id);
      
      if (resetResult.success) {
        console.log('✅ Course réinitialisée avec succès (timing + statut)');
        
        // Mettre à jour l'état local
        setRaceStatus('ready');
        setSelectedRace({ ...selectedRace, status: 'ready' });
        setTimingData([]);
        
        // Réinitialiser les statistiques
        setTimingStats({
          elapsedTime: '00:00:00',
          totalLaps: 0,
          lastPassingTime: null,
          runningCount: 0,
          finishedCount: 0,
          raceStarted: false,
          gtTimestamp: null
        });
        
        // Recharger les courses pour mettre à jour la sidebar
        await loadRaces();
        
        console.log('🎉 Course remise à zéro avec succès:', selectedRace.name);
      } else {
        console.error('❌ Erreur lors de la réinitialisation:', resetResult.error);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réinitialisation de la course:', error);
    }
  };

  const handleFinishRace = async () => {
    if (!selectedRace) return;
    
    try {
      // Arrêter le rafraîchissement temps réel
      stopTimingRefresh();
      
      // Changer le statut de la course à "finished"
      const result = await window.VGTiming.changeRaceStatus(selectedRace.id, 'finished');
      
      if (result.success) {
        setRaceStatus('finished');
        setSelectedRace(result.data);
        console.log('Course terminée:', selectedRace.name);
        
        // TODO: Naviguer automatiquement vers le dashboard des résultats
        // navigate(`/races/dashboard/${selectedRace.id}`)
      } else {
        console.error('Error finishing race:', result.error);
      }
    } catch (error) {
      console.error('Error finishing race:', error);
    }
  };

  // Fonctions de gestion du rafraîchissement temps réel
  const startTimingRefresh = () => {
    // Plus besoin d'interval automatique - actualisation basée sur les événements CrossMgr
    console.log('📊 Rafraîchissement timing activé (basé sur événements CrossMgr)');
    
    // Actualisation initiale
    refreshTimingData();
  };

  const stopTimingRefresh = () => {
    // Plus d'interval à arrêter - les listeners restent actifs
    console.log('⏹️ Rafraîchissement timing désactivé');
  };

  const refreshTimingData = async () => {
    try {
      // Récupérer dynamiquement la course active au lieu d'utiliser selectedRace (évite les problèmes de closure)
      const racesResult = await window.electronAPI.invoke('race:getAll', { status: ['active', 'in_progress', 'finishing', 'finished'] });
      if (!racesResult.success || !racesResult.data || racesResult.data.length === 0) {
        console.log('❌ refreshTimingData: Pas de course active trouvée');
        return;
      }
      
      const currentRace = racesResult.data[0]; // Prendre la première course active
      console.log('🔄 Rafraîchissement des données timing pour course:', currentRace.id, currentRace.name, 'status:', currentRace.status);
      
      await refreshStatsAndData(currentRace);
    } catch (error) {
      console.error('❌ Erreur dans refreshTimingData:', error);
    }
  };

  // Fonction séparée pour mettre à jour les statistiques (hors chronométre)
  const refreshStatsAndData = async (currentRace) => {
    try {
      // Charger les statistiques de chronométrage via IPC
      console.log('📊 Appel timing:getStats avec ID:', currentRace.id);
      const statsResult = await window.electronAPI.invoke('timing:getStats', currentRace.id);
      if (statsResult.success) {
        // Mettre à jour toutes les stats, le chronométre temps réel prendra le dessus sur elapsedTime de toute façon
        setTimingStats(statsResult.data);
        console.log('📊 Stats timing récupérées:', statsResult.data);
        console.log('⏱️ GT Timestamp pour chronométre:', statsResult.data.gtTimestamp);
      } else {
        console.error('❌ Erreur lors de la récupération des stats:', statsResult.error);
      }
      
      // Charger les données de chronométrage mises à jour via IPC
      console.log('🔍 Appel timing:getByRace via IPC avec ID:', currentRace.id);
      const timingResult = await window.electronAPI.invoke('timing:getByRace', currentRace.id);
      console.log('📥 Réponse timing:getByRace via IPC:', timingResult);
      
      if (timingResult.success) {
        console.log('⏱️ Données timing récupérées:', timingResult.data);
        console.log('📋 Nombre de participants avec données:', timingResult.data?.length || 0);
        
        // Vérifier les positions et écarts
        if (timingResult.data && timingResult.data.length > 0) {
          timingResult.data.forEach((participant, index) => {
            console.log(`👤 ${participant.participantName || participant.name} (#${participant.bibNumber || participant.number}):`, {
              position: participant.position,
              laps: participant.laps || participant.lapCount,
              gap: participant.gap,
              status: participant.status
            });
          });
        }
        
        setTimingData(timingResult.data || []);
        console.log('✅ TimingData mis à jour dans l\'état:', timingResult.data?.length || 0, 'participants');
        
        // Mettre à jour selectedRace si nécessaire
        console.log('🔍 Comparaison selectedRace:', {
          selectedRaceExists: !!selectedRace,
          selectedRaceId: selectedRace?.id,
          selectedRaceStatus: selectedRace?.status,
          currentRaceId: currentRace.id,
          currentRaceStatus: currentRace.status,
          needsUpdate: !selectedRace || selectedRace.id !== currentRace.id || selectedRace.status !== currentRace.status
        });
        
        if (!selectedRace || selectedRace.id !== currentRace.id || selectedRace.status !== currentRace.status) {
          console.log('🔄 Mise à jour de la course sélectionnée:', currentRace.name, 'status:', currentRace.status);
          setSelectedRace(currentRace);
          setRaceStatus(currentRace.status); // AJOUT : Mettre à jour le statut pour l'affichage
          console.log('✅ Course sélectionnée mise à jour avec succès');
        } else {
          console.log('⚡ Pas besoin de mettre à jour selectedRace');
        }
        
        // Toujours mettre à jour raceStatus même si selectedRace ne change pas (au cas où seul le statut change)
        if (raceStatus !== currentRace.status) {
          console.log('🔄 Mise à jour du statut d\'affichage:', raceStatus, '->', currentRace.status);
          setRaceStatus(currentRace.status);
        }
        
      } else {
        console.error('❌ Erreur lors de la récupération des données timing:', timingResult.error);
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement timing:', error);
    }
  };

  // Nettoyer l'intervalle au démontage du composant
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const handleDisplayModeChange = async (newMode) => {
    setDisplayMode(newMode);
    
    // Sauvegarder la préférence dans la base de données
    try {
      if (window.VGTiming && window.VGTiming.isReady) {
        await window.VGTiming.setSetting('displayType', newMode);
        setSettings(prev => ({ ...prev, displayType: newMode }));
        console.log('Préférence d\'affichage sauvegardée:', newMode);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence:', error);
    }
  };

  return (
    <div className="timing-container">
      <div className="timing-header">
        <h1>Chronométrage</h1>
        <div className="timing-status">
          <span className={`status-badge status-${raceStatus}`}>
            {raceStatus === 'active' && 'En cours'}
            {raceStatus === 'in_progress' && 'En cours'}
            {raceStatus === 'finishing' && 'En cours de finition'}
            {raceStatus === 'paused' && 'En pause'}
            {raceStatus === 'finished' && 'Terminé'}
            {raceStatus === 'ready' && 'Prêt'}
            {raceStatus === 'draft' && 'Brouillon'}
          </span>
          {selectedRace && (
            <>
              <span className="race-name">{selectedRace.name}</span>
              {(raceStatus === 'in_progress' || raceStatus === 'active' || raceStatus === 'finishing' || raceStatus === 'paused') && (
                <span className="elapsed-time">⏱️ {displayElapsedTime}</span>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="timing-loading">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement des courses...</p>
        </div>
      ) : (
        <div className="timing-content">
          <div className="timing-main">
            <TimingDisplay 
              selectedRace={selectedRace}
              displayMode={displayMode}
              setDisplayMode={handleDisplayModeChange}
              timingData={timingData}
              participants={participants}
              raceStatus={raceStatus}
              settings={settings}
            />
          </div>
          
          <div className="timing-sidebar">
            <TimingSidebar
              races={races}
              selectedRace={selectedRace}
              onRaceSelect={handleRaceSelect}
              crossmgrStatus={connectionStatus}
              crossmgrStatusText={getStatusText()}
              isConnected={isConnected}
              raceStatus={raceStatus}
              onStartRace={handleStartRace}
              onStopRace={handleStopRace}
              onResetRace={handleResetRace}
              onFinishRace={handleFinishRace}
              participantCount={participants.length}
              timingStats={timingStats}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Timing;
