import React, { useState, useEffect } from 'react';
import { DEFAULT_PARTICIPANT } from '../../../constants/raceConstants';
import './css/Participants.css';

const Participants = ({ race, onBack, onSave }) => {
  const [participants, setParticipants] = useState(race.participants || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [newParticipant, setNewParticipant] = useState({ ...DEFAULT_PARTICIPANT });
  const [errors, setErrors] = useState({});

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

  const handleAddParticipant = () => {
    const validationErrors = validateParticipant(newParticipant);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const participant = {
      ...newParticipant,
      id: Date.now().toString()
    };
    
    setParticipants(prev => [...prev, participant]);
    setNewParticipant({ ...DEFAULT_PARTICIPANT });
    setShowAddForm(false);
    setErrors({});
  };

  const handleEditParticipant = (participant) => {
    setEditingParticipant({ ...participant });
  };

  const handleSaveEdit = () => {
    const validationErrors = validateParticipant(editingParticipant);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setParticipants(prev => 
      prev.map(p => p.id === editingParticipant.id ? editingParticipant : p)
    );
    setEditingParticipant(null);
    setErrors({});
  };

  const handleDeleteParticipant = (participantId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce participant ?')) {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    }
  };

  const handleToggleActive = (participantId) => {
    setParticipants(prev => 
      prev.map(p => 
        p.id === participantId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const handleSaveRace = async () => {
    try {
      const updatedRace = {
        ...race,
        participants: participants
      };
      
      await window.raceAPI.update(updatedRace);
      onSave(updatedRace);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
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
              value={participant.name}
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
              value={participant.number}
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
              value={participant.category}
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
              value={participant.epcTag}
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
              value={participant.team}
              onChange={(e) => onChange({ ...participant, team: e.target.value })}
              placeholder="Nom de l'équipe"
            />
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        {isEditing ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingParticipant(null)}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
              Sauvegarder
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
              Annuler
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAddParticipant}>
              Ajouter
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="participants-container">
      <div className="card">
        <div className="card-header">
          <h2>Participants - {race.name}</h2>
          <div className="race-info">
            <span className="badge badge-primary">{race.type}</span>
            <span className="participant-count">{participants.length} participant(s)</span>
          </div>
        </div>
        
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
                  className="btn btn-primary"
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
                    className="btn btn-primary"
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
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditParticipant(participant)}
                            disabled={showAddForm || editingParticipant}
                          >
                            Modifier
                          </button>
                          <button 
                            className={`btn btn-sm ${participant.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleActive(participant.id)}
                            disabled={showAddForm || editingParticipant}
                          >
                            {participant.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
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
            <button className="btn btn-secondary" onClick={onBack}>
              ← Retour aux courses
            </button>
            <button 
              className="btn btn-success"
              onClick={handleSaveRace}
              disabled={showAddForm || editingParticipant}
            >
              Sauvegarder les participants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Participants;
