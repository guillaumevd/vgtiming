import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { showToast } from '../../utils/notifications';
import RaceList from './components/RaceList';
import AddRace from './components/AddRace';
import EditRace from './components/RaceEdit';
import Participants from './components/Participants';
import RaceDashboard from './components/RaceDashboard';
import ImportRace from './components/ImportRace';

const Race = () => {
  const [mode, setMode] = useState('list'); // 'list', 'add', 'edit', 'participants', 'dashboard', 'import'
  const [selectedRace, setSelectedRace] = useState(null);
  const navigate = useNavigate();

  const onRaceSelected = (race) => {
    setSelectedRace(race);
    setMode('edit');
  };

  const onManageParticipants = (race) => {
    setSelectedRace(race);
    setMode('participants');
  };

  const onViewResults = (race) => {
    setSelectedRace(race);
    setMode('results');
  };

  const onViewDashboard = (race) => {
    setSelectedRace(race);
    setMode('dashboard');
  };

  const onGoToTiming = (race) => {
    console.log('Navigation vers chronométrage pour la course:', race.name);
    navigate(ROUTES.TIMING);
  };

  const onRaceAdded = () => {
    setMode('list');
  };

  const onRaceUpdated = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onRaceDeleted = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onRaceCanceled = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onBackToList = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onParticipantsSaved = () => {
    setMode('list');
    setSelectedRace(null);
  };

  const onImportRace = async (raceData) => {
    try {
      if (!window.VGTiming || !window.VGTiming.isReady) {
        throw new Error('API non disponible');
      }

      console.log('Données à importer:', raceData);

      // Créer la course avec toutes les données originales
      const raceResult = await window.VGTiming.createRace({
        id: raceData.race.id, // Conserver l'ID original
        name: raceData.race.name,
        date: raceData.race.date,
        time: raceData.race.time,
        location: raceData.race.location,
        type: raceData.race.type,
        duration: raceData.race.duration,
        durationType: raceData.race.durationType,
        maxParticipants: raceData.race.maxParticipants,
        description: raceData.race.description,
        status: 'draft', // Créer en draft puis mettre à jour après
        createdAt: raceData.race.createdAt, // Conserver la date originale
        updatedAt: raceData.race.updatedAt  // Conserver la date originale
      });

      if (!raceResult.success) {
        throw new Error(raceResult.error || 'Erreur lors de la création de la course');
      }

      const newRaceId = raceData.race.id; // Utiliser l'ID original depuis le JSON
      let participantsCount = 0;
      let participantsErrors = 0;
      let timingImported = 0;

      console.log(`Course créée avec ID: ${newRaceId}`);

      // Ajouter les participants si présents
      if (raceData.participants && raceData.participants.length > 0) {
        console.log(`Importation de ${raceData.participants.length} participants...`);
        
        for (const participant of raceData.participants) {
          try {
            // Convertir isActive au bon format (de 1/0 vers true/false si nécessaire)
            const isActive = participant.isActive === 1 ? true : 
                            participant.isActive === 0 ? false : 
                            Boolean(participant.isActive);
            
            const participantResult = await window.VGTiming.createParticipant({
              id: participant.id, // Conserver l'ID original du participant
              raceId: newRaceId, // Utiliser l'ID original de la course du JSON
              name: participant.name,
              number: String(participant.number), // Convertir en string
              team: participant.team || '',
              category: participant.category || 'Général',
              epcTag: participant.epcTag || '',
              isActive: isActive, // Utiliser la valeur convertie
              createdAt: participant.createdAt, // Conserver la date originale
              updatedAt: participant.updatedAt  // Conserver la date originale
            });
            
            if (participantResult.success) {
              participantsCount++;
              console.log(`✓ Participant importé: ${participant.name} (#${participant.number})`);
            } else {
              participantsErrors++;
              console.warn(`✗ Erreur participant ${participant.name}:`, participantResult.error);
            }
          } catch (participantError) {
            participantsErrors++;
            console.warn(`✗ Erreur lors de l'ajout du participant ${participant.name}:`, participantError);
          }
        }
      }

      // Importer les données de timing directement AVANT les transitions de statut
      if (raceData.timingData && raceData.timingData.length > 0) {
        console.log(`Importation directe de ${raceData.timingData.length} données de timing...`);
        
        try {
          // Utiliser la méthode directe d'insertion en base
          const timingImportResult = await window.VGTiming.importTimingDataDirect(newRaceId, raceData.timingData);
          if (timingImportResult.success) {
            timingImported = timingImportResult.data.imported || raceData.timingData.length;
            console.log(`✓ ${timingImported} données de timing importées directement`);
          } else {
            console.warn('✗ Erreur lors de l\'importation directe des données de timing:', timingImportResult.error);
          }
        } catch (timingError) {
          console.warn('✗ Erreur lors de l\'importation directe des données de timing:', timingError);
        }
      }

      // Mettre à jour le statut de la course avec le statut original après l'importation des données
      if (raceData.race.status && raceData.race.status !== 'draft') {
        console.log(`Mise à jour du statut de la course vers: ${raceData.race.status}`);
        try {
          // Si le statut final est 'finished', suivre la chaîne de transitions autorisées
          if (raceData.race.status === 'finished') {
            console.log('Transition vers finished: draft → ready → in_progress → finished');
            
            // Vérifier que l'API est disponible
            if (!window.VGTiming || typeof window.VGTiming.updateRaceStatus !== 'function') {
              console.error('❌ API VGTiming non disponible ou méthode updateRaceStatus manquante');
              throw new Error('API VGTiming non disponible');
            }
            
            // 1. draft → ready
            console.log('🔄 Passage en ready...');
            const readyResult = await window.VGTiming.updateRaceStatus(newRaceId, 'ready');
            if (!readyResult.success) {
              console.warn('✗ Erreur lors du passage en ready:', readyResult.error);
            } else {
              console.log('✓ Statut ready appliqué');
              
              // 2. ready → in_progress
              console.log('🔄 Passage en in_progress...');
              const inProgressResult = await window.VGTiming.updateRaceStatus(newRaceId, 'in_progress');
              if (!inProgressResult.success) {
                console.warn('✗ Erreur lors du passage en in_progress:', inProgressResult.error);
              } else {
                console.log('✓ Statut in_progress appliqué');
                
                // 3. in_progress → finished
                console.log('🔄 Passage en finished...');
                const finishedResult = await window.VGTiming.updateRaceStatus(newRaceId, 'finished');
                if (finishedResult.success) {
                  console.log(`✓ Statut final appliqué: ${raceData.race.status}`);
                } else {
                  console.warn('✗ Erreur lors du passage en finished:', finishedResult.error);
                }
              }
            }
          } else {
            // Pour les autres statuts, essayer la transition directe d'abord
            console.log(`🔄 Tentative de transition directe vers: ${raceData.race.status}`);
            const statusResult = await window.VGTiming.updateRaceStatus(newRaceId, raceData.race.status);
            if (statusResult.success) {
              console.log(`✓ Statut de la course mis à jour: ${raceData.race.status}`);
            } else {
              console.warn('✗ Erreur lors de la mise à jour du statut:', statusResult.error);
            }
          }
        } catch (statusError) {
          console.warn('✗ Erreur lors de la mise à jour du statut:', statusError.message || statusError);
        }
      }

      // Créer un message détaillé
      let successMessage = `Course "${raceData.race.name}" importée avec succès`;
      if (participantsCount > 0) {
        successMessage += `\n• ${participantsCount} participant(s) importé(s)`;
      }
      if (participantsErrors > 0) {
        successMessage += `\n• ${participantsErrors} erreur(s) lors de l'importation des participants`;
      }
      if (timingImported > 0) {
        successMessage += `\n• ${timingImported} donnée(s) de chronométrage importée(s)`;
      }
      if (raceData.race.status) {
        successMessage += `\n• Statut de la course : ${raceData.race.status}`;
      }

      // Notification de succès
      if (typeof showToast === 'function') {
        showToast(successMessage, participantsErrors > 0 ? 'warning' : 'success');
      }

      console.log('✅ Importation terminée avec succès');
      setMode('list');
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      
      // Notification d'erreur
      if (typeof showToast === 'function') {
        showToast(`Erreur lors de l'importation: ${error.message}`, 'error');
      }
      
      // Ne pas changer de mode en cas d'erreur pour que l'utilisateur puisse réessayer
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'list':
        return (
          <RaceList 
            onSelectRace={onRaceSelected} 
            onManageParticipants={onManageParticipants}
            onViewDashboard={onViewDashboard}
            onSetMode={setMode}
          />
        );
      case 'add':
        return <AddRace onRaceAdded={onRaceAdded} onCancel={onRaceCanceled} />;
      case 'import':
        return <ImportRace onImport={onImportRace} onCancel={onRaceCanceled} />;
      case 'edit':
        return (
          <EditRace
            race={selectedRace}
            onRaceUpdated={onRaceUpdated}
            onRaceDeleted={onRaceDeleted}
            onRaceCanceled={onRaceCanceled}
          />
        );
      case 'participants':
        return (
          <Participants
            race={selectedRace}
            onBack={onBackToList}
            onSave={onParticipantsSaved}
          />
        );
      case 'dashboard':
        return (
          <RaceDashboard
            race={selectedRace}
            onBack={onBackToList}
            onRaceUpdated={(updatedRace) => {
              setSelectedRace(updatedRace);
              // Optionellement, on peut rester sur le dashboard après mise à jour
            }}
            onManageParticipants={onManageParticipants}
            onGoToTiming={onGoToTiming}
          />
        );
      default:
        return <RaceList onSelectRace={onRaceSelected} onSetMode={setMode}/>;
    }
  };

  return (
    <div className="container-fluid h-100">
      <div className="row h-100">
        <div className="col-12 d-flex flex-column h-100">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Race;
