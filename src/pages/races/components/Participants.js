import React, { useState, useEffect } from 'react';
import { DEFAULT_PARTICIPANT } from '../../../constants/raceConstants';
import { showToast } from '../../../utils/notifications';
import './css/Participants.css';

const Participants = ({ race, onBack, onSave }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [newParticipant, setNewParticipant] = useState({ ...DEFAULT_PARTICIPANT });
  const [errors, setErrors] = useState({});

  // Charger les participants de la course
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoading(true);
        
        if (!window.VGTiming || !window.VGTiming.isReady) {
          const handleAPIReady = async (event) => {
            if (event.detail.ready) {
              window.removeEventListener('vgtiming-ready', handleAPIReady);
              await fetchParticipants();
            }
          };
          window.addEventListener('vgtiming-ready', handleAPIReady);
          return;
        }
        
        await fetchParticipants();
      } catch (error) {
        console.error('Erreur lors du chargement des participants:', error);
        showToast('Erreur lors du chargement des participants', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchParticipants = async () => {
      const result = await window.VGTiming.getParticipantsByRace(race.id);
      if (result.success) {
        setParticipants(result.data || []);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des participants');
      }
    };

    loadParticipants();
  }, [race.id]);

  const validateParticipant = (participant) => {
    const newErrors = {};
    
    if (!participant.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!participant.number.toString().trim()) {
      newErrors.number = 'Le numéro est obligatoire';
    }
    
    // Check for duplicate numbers
    const duplicateNumber = participants.find(p => 
      p.id !== participant.id && p.number.toString() === participant.number.toString()
    );
    if (duplicateNumber) {
      newErrors.number = 'Ce numéro est déjà utilisé';
    }
    
    // Check for duplicate EPC tags if provided
    if (participant.epcTag && participant.epcTag.trim()) {
      const duplicateEpc = participants.find(p => 
        p.id !== participant.id && p.epcTag === participant.epcTag
      );
      if (duplicateEpc) {
        newErrors.epcTag = 'Ce tag EPC est déjà utilisé';
      }
      
      // Validate EPC format (hexadecimal)
      const epcRegex = /^[0-9A-Fa-f]+$/;
      if (!epcRegex.test(participant.epcTag)) {
        newErrors.epcTag = 'Le tag EPC doit être en format hexadécimal';
      }
    }
    
    return newErrors;
  };

  const handleAddParticipant = async () => {
    const validationErrors = validateParticipant(newParticipant);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      const participantData = {
        raceId: race.id,
        name: newParticipant.name.trim(),
        number: String(newParticipant.number), // S'assurer que c'est une string
        epcTag: newParticipant.epcTag?.trim() || '',
        team: newParticipant.team?.trim() || '',
        category: newParticipant.category || 'Général',
        isActive: Boolean(newParticipant.isActive !== undefined ? newParticipant.isActive : true)
      };

      const result = await window.VGTiming.createParticipant(participantData);
      
      if (result.success) {
        setParticipants(prev => [...prev, result.data]);
        setNewParticipant({ ...DEFAULT_PARTICIPANT });
        setShowAddForm(false);
        setErrors({});
        showToast('Participant ajouté avec succès !', 'success');
      } else {
        throw new Error(result.error || 'Erreur lors de l\'ajout du participant');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du participant:', error);
      showToast(error.message || 'Erreur lors de l\'ajout du participant', 'error');
    }
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant({ 
      ...participant,
      epcTag: participant.epcTag || '', // Convertir null en string vide
      team: participant.team || '',     // Convertir null en string vide
      category: participant.category || 'Général'
    });
  };

  const handleSaveEdit = async () => {
    const validationErrors = validateParticipant(editingParticipant);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      const updateData = {
        name: editingParticipant.name.trim(),
        number: String(editingParticipant.number), // S'assurer que c'est une string
        epcTag: editingParticipant.epcTag?.trim() || '',
        team: editingParticipant.team?.trim() || '',
        category: editingParticipant.category || 'Général',
        isActive: Boolean(editingParticipant.isActive !== undefined ? editingParticipant.isActive : true)
      };

      const result = await window.VGTiming.updateParticipant(editingParticipant.id, updateData);
      
      if (result.success) {
        setParticipants(prev => 
          prev.map(p => p.id === editingParticipant.id ? result.data : p)
        );
        setEditingParticipant(null);
        setErrors({});
        showToast('Participant mis à jour avec succès !', 'success');
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour du participant');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du participant:', error);
      showToast(error.message || 'Erreur lors de la mise à jour du participant', 'error');
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      return;
    }

    try {
      const result = await window.VGTiming.deleteParticipant(participantId);
      
      if (result.success) {
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        showToast('Participant supprimé avec succès !', 'success');
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression du participant');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du participant:', error);
      showToast(error.message || 'Erreur lors de la suppression du participant', 'error');
    }
  };

  const handleToggleActive = async (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;

    try {
      const updateData = {
        isActive: Boolean(!participant.isActive)
      };

      const result = await window.VGTiming.updateParticipant(participantId, updateData);
      
      if (result.success) {
        setParticipants(prev => 
          prev.map(p => p.id === participantId ? result.data : p)
        );
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showToast(error.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleSaveAndBack = () => {
    // Les participants sont maintenant sauvegardés individuellement
    // Nous renvoyons simplement à la liste des courses
    onSave(race);
  };

  const ParticipantForm = ({ participant, onChange, isEditing = false }) => (
    <div className="participant-form">
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={participant.name || ''}
              onChange={(e) => onChange({ ...participant, name: e.target.value })}
              placeholder="Nom du participant"
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="form-group">
            <label>Numéro *</label>
            <input
              type="text"
              className={`form-control ${errors.number ? 'is-invalid' : ''}`}
              value={participant.number || ''}
              onChange={(e) => onChange({ ...participant, number: e.target.value })}
              placeholder="N°"
            />
            {errors.number && <div className="invalid-feedback">{errors.number}</div>}
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="form-group">
            <label>Catégorie</label>
            <input
              type="text"
              className="form-control"
              value={participant.category || ''}
              onChange={(e) => onChange({ ...participant, category: e.target.value })}
              placeholder="Ex: Senior"
            />
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="form-group">
            <label>Tag EPC (CrossMGR)</label>
            <input
              type="text"
              className={`form-control ${errors.epcTag ? 'is-invalid' : ''}`}
              value={participant.epcTag || ''}
              onChange={(e) => onChange({ ...participant, epcTag: e.target.value.toUpperCase() })}
              placeholder="Ex: E200001234567890"
              style={{ fontFamily: 'monospace' }}
            />
            {errors.epcTag && <div className="invalid-feedback">{errors.epcTag}</div>}
            <small className="form-text text-muted">Format hexadécimal (sera automatiquement en majuscules)</small>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="form-group">
            <label>Équipe</label>
            <input
              type="text"
              className="form-control"
              value={participant.team || ''}
              onChange={(e) => onChange({ ...participant, team: e.target.value })}
              placeholder="Nom de l'équipe"
            />
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        {isEditing ? (
          <>
            <button type="button" className="btn-unified btn-secondary-unified" onClick={() => setEditingParticipant(null)}>
              Annuler
            </button>
            <button type="button" className="btn-unified btn-primary-unified" onClick={handleSaveEdit}>
              Sauvegarder
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-unified btn-secondary-unified" onClick={() => setShowAddForm(false)}>
              Annuler
            </button>
            <button type="button" className="btn-unified btn-primary-unified" onClick={handleAddParticipant}>
              Ajouter
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="participants-container">
      <div className="race-list-header">
        <h1>Participants - {race.name}</h1>
        <div className="race-info">
          <span className="badge badge-primary">{race.category || race.type}</span>
          <span className="participant-count">{participants.length} participant(s)</span>
        </div>
      </div>
      
      {loading ? (
        <div className="empty-state">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <h3>Chargement des participants...</h3>
        </div>
      ) : (
        <div className="content-wrapper">
          <div className="card-body">
        {/* Add participant form */}
        {showAddForm && (
          <div className="add-participant-section">
            <h4>Ajouter un participant</h4>
            <ParticipantForm 
                participant={newParticipant}
                onChange={setNewParticipant}
              />
            </div>
          )}
          
          {/* Edit participant form */}
          {editingParticipant && (
            <div className="edit-participant-section">
              <h4>Modifier le participant</h4>
              <ParticipantForm 
                participant={editingParticipant}
                onChange={setEditingParticipant}
                isEditing={true}
              />
            </div>
          )}
          
          {/* Participants list */}
          <div className="participants-list">
            <div className="list-header">
              <h4>Liste des participants</h4>
              {!showAddForm && !editingParticipant && (
                <button 
                  className="btn-unified btn-primary-unified"
                  onClick={() => setShowAddForm(true)}
                >
                  + Ajouter un participant
                </button>
              )}
            </div>
            
            {participants.length === 0 ? (
              <div className="empty-state">
                <p>Aucun participant ajouté pour cette course.</p>
                {!showAddForm && (
                  <button 
                    className="btn-unified btn-primary-unified"
                    onClick={() => setShowAddForm(true)}
                  >
                    Ajouter le premier participant
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Nom</th>
                      <th>Catégorie</th>
                      <th>Équipe</th>
                      <th>Tag EPC</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(participant => (
                      <tr key={participant.id} className={!participant.isActive ? 'inactive' : ''}>
                        <td className="participant-number">#{participant.number}</td>
                        <td className="participant-name">{participant.name}</td>
                        <td>{participant.category || '-'}</td>
                        <td>{participant.team || '-'}</td>
                        <td className="epc-tag">{participant.epcTag || '-'}</td>
                        <td>
                          <span className={`status-badge ${participant.isActive ? 'active' : 'inactive'}`}>
                            {participant.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className="btn-unified-sm btn-primary-unified-sm"
                            onClick={() => handleEditParticipant(participant)}
                            disabled={showAddForm || editingParticipant}
                          >
                            Modifier
                          </button>
                          <button 
                            className={`btn-unified-sm ${participant.isActive ? 'btn-warning-unified-sm' : 'btn-success-unified-sm'}`}
                            onClick={() => handleToggleActive(participant.id)}
                            disabled={showAddForm || editingParticipant}
                          >
                            {participant.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          <button 
                            className="btn-unified-sm btn-danger-unified-sm"
                            onClick={() => handleDeleteParticipant(participant.id)}
                            disabled={showAddForm || editingParticipant}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div className="card-footer">
          <div className="footer-actions">
            <button className="btn-unified btn-secondary-unified" onClick={onBack}>
              ← Retour aux courses
            </button>
            <button 
              className="btn-unified btn-success-unified"
              onClick={handleSaveAndBack}
              disabled={showAddForm || editingParticipant}
            >
              ✓ Terminé
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default Participants;
