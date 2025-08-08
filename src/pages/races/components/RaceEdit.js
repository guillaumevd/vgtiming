import React, { useState } from 'react';
import { RACE_TYPES, DURATION_TYPES } from '../../../constants/raceConstants';
import { showToast } from '../../../utils/notifications';
import './css/EditRace.css';
import './css/SharedForm.css';

const EditRace = ({ race, onRaceUpdated, onRaceDeleted, onRaceCanceled }) => {
  const [formData, setFormData] = useState({
    name: race.name || '',
    date: race.date || '',
    time: race.time || '',
    location: race.location || '',
    type: race.type || RACE_TYPES.ROAD_RACE,
    duration: race.duration || '',
    durationType: race.durationType || DURATION_TYPES.TIME,
    maxParticipants: race.maxParticipants || '',
    description: race.description || ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la course est obligatoire';
    }

    if (!formData.date) {
      newErrors.date = 'La date est obligatoire';
    }

    if (!formData.time) {
      newErrors.time = 'L\'heure est obligatoire';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est obligatoire';
    }

    if (!formData.duration) {
      newErrors.duration = 'La durée est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time, // ✅ time au lieu de startTime
        location: formData.location?.trim() || null,
        type: formData.type, // ✅ type au lieu de category
        duration: formData.duration ? parseFloat(formData.duration) : null, // ✅ duration au lieu de distance
        durationType: formData.durationType, // ✅ Ajouter durationType
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        description: formData.description?.trim() || null
      };

      // Mettre à jour la course via le nouveau backend
      const result = await window.VGTiming.updateRace(race.id, updateData);
      
      if (result.success) {
        showToast('Course mise à jour avec succès !', 'success');
        onRaceUpdated(result.data);
      } else {
        throw new Error(result.error || 'Erreur lors de la mise à jour de la course');
      }
    } catch (error) {
      console.error('Error updating race:', error);
      showToast(error.message || 'Erreur lors de la mise à jour de la course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette course ? Cette action est irréversible.')) {
      return;
    }

    setIsDeleting(true);

    try {
      // Supprimer la course via le nouveau backend
      const result = await window.VGTiming.deleteRace(race.id);
      
      if (result.success) {
        showToast('Course supprimée avec succès !', 'success');
        onRaceDeleted(race.id);
      } else {
        throw new Error(result.error || 'Erreur lors de la suppression de la course');
      }
    } catch (error) {
      console.error('Error deleting race:', error);
      showToast(error.message || 'Erreur lors de la suppression de la course', 'error');
      showToast('Erreur lors de la suppression de la course', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="edit-race-container">
      <div className="race-list-header">
        <h1>Modifier la Course</h1>
        <button 
          type="button" 
          className="btn-unified btn-outline-secondary-unified"
          onClick={onRaceCanceled}
        >
          <i className="fas fa-times"></i>
          Annuler
        </button>
      </div>
      
      <div className="content-wrapper">
        <div className="card-body">
        <form onSubmit={handleUpdate}>
          <div className="row">
            {/* Nom de la course */}
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label required">
                Nom de la course
              </label>
              <input
                type="text"
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ex: Marathon de Paris"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              {/* Type de course */}
              <div className="col-md-6 mb-3">
                <label htmlFor="type" className="form-label">Type de course</label>
                <select
                  className="form-select"
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  {Object.entries(RACE_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              {/* Date */}
              <div className="col-md-4 mb-3">
                <label htmlFor="date" className="form-label required">Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
                {errors.date && <div className="invalid-feedback">{errors.date}</div>}
              </div>

              {/* Heure */}
              <div className="col-md-4 mb-3">
                <label htmlFor="time" className="form-label required">Heure</label>
                <input
                  type="time"
                  className={`form-control ${errors.time ? 'is-invalid' : ''}`}
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                />
                {errors.time && <div className="invalid-feedback">{errors.time}</div>}
              </div>

              {/* Participants max */}
              <div className="col-md-4 mb-3">
                <label htmlFor="maxParticipants" className="form-label">
                  Participants max
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="maxParticipants"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Illimité"
                />
              </div>
            </div>

            <div className="row">
              {/* Lieu */}
              <div className="col-md-12 mb-3">
                <label htmlFor="location" className="form-label required">Lieu</label>
                <input
                  type="text"
                  className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Ex: Parc de la Villette, Paris"
                />
                {errors.location && <div className="invalid-feedback">{errors.location}</div>}
              </div>
            </div>

            <div className="row">
              {/* Durée */}
              <div className="col-md-6 mb-3">
                <label htmlFor="duration" className="form-label required">Durée</label>
                <div className="input-group">
                  <input
                    type="number"
                    className={`form-control ${errors.duration ? 'is-invalid' : ''}`}
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    step="0.1"
                  />
                  <select
                    className="form-select"
                    name="durationType"
                    value={formData.durationType}
                    onChange={handleInputChange}
                    style={{ maxWidth: '120px' }}
                  >
                    {Object.entries(DURATION_TYPES).map(([key, value]) => (
                      <option key={key} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                {errors.duration && <div className="invalid-feedback">{errors.duration}</div>}
              </div>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Description optionnelle de la course..."
              />
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-unified btn-danger-unified"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Suppression...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash"></i>
                    Supprimer
                  </>
                )}
              </button>
              
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn-unified btn-secondary-unified"
                  onClick={onRaceCanceled}
                  disabled={isSubmitting || isDeleting}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="btn-unified btn-primary-unified"
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Mise à jour...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Mettre à jour
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRace;
