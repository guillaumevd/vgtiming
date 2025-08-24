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

      // Créer la course avec le statut original
      const raceResult = await window.VGTiming.createRace({
        name: raceData.race.name,
        date: raceData.race.date,
        time: raceData.race.time,
        location: raceData.race.location,
        type: raceData.race.type,
        duration: raceData.race.duration,
        durationType: raceData.race.durationType,
        maxParticipants: raceData.race.maxParticipants,
        description: raceData.race.description,
        status: raceData.race.status || 'draft' // Préserver le statut original
      });

      if (!raceResult.success) {
        throw new Error(raceResult.error || 'Erreur lors de la création de la course');
      }

      const newRaceId = raceResult.data.id;
      let participantsCount = 0;
      let participantsErrors = 0;
      let timingImported = 0;

      // Ajouter les participants si présents
      if (raceData.participants && raceData.participants.length > 0) {
        console.log(`Importation de ${raceData.participants.length} participants...`);
        
        for (const participant of raceData.participants) {
          try {
            const participantResult = await window.VGTiming.createParticipant({
              raceId: newRaceId,
              name: participant.name,
              number: String(participant.number), // Convertir en string
              team: participant.team || '',
              category: participant.category || 'Général',
              epcTag: participant.epcTag || ''
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

      // Importer les données de timing directement dans la base de données
      if (raceData.timingData && raceData.timingData.length > 0) {
        console.log(`Importation directe de ${raceData.timingData.length} données de timing...`);
        
        try {
          // Utiliser une méthode directe d'insertion en base
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
      if (raceData.race.status === 'finished' && timingImported > 0) {
        successMessage += `\n• Statut de la course préservé : Terminée`;
      }

      // Notification de succès
      if (typeof showToast === 'function') {
        showToast(successMessage, participantsErrors > 0 ? 'warning' : 'success');
      }

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
