import React, { useState, useEffect } from 'react';
import { RACE_TYPES, DURATION_TYPES } from '../../../constants/raceConstants';
import { showToast } from '../../../utils/notifications';
import './css/AddRace.css';
import './css/SharedForm.css';

const AddRace = ({ onRaceAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    type: RACE_TYPES.ROAD_RACE,
    duration: '',
    durationType: DURATION_TYPES.TIME,
    maxParticipants: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    // Vérifier si l'API est déjà prête
    if (window.VGTiming && window.VGTiming.isReady) {
      setApiReady(true);
    }

    // Écouter l'événement de l'API prête
    const handleAPIReady = (event) => {
      setApiReady(event.detail.ready);
      console.log('AddRace: API ready', event.detail);
    };

    window.addEventListener('vgtiming-ready', handleAPIReady);

    return () => {
      window.removeEventListener('vgtiming-ready', handleAPIReady);
    };
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Vérifier que l'API est disponible
      if (!window.VGTiming) {
        throw new Error('API VG-Timing non disponible. Veuillez recharger la page.');
      }

      // Attendre que l'API soit prête si nécessaire
      if (!window.VGTiming.isReady) {
        let retries = 0;
        const maxRetries = 10;
        
        while (!window.VGTiming.isReady && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (!window.VGTiming.isReady) {
          throw new Error('API VG-Timing non prête. Mode: ' + (window.VGTiming.isElectronContext ? 'Electron' : 'Web'));
        }
      }

      const raceData = {
        name: formData.name.trim(),
        date: formData.date,
        time: formData.time, // ✅ time au lieu de startTime
        location: formData.location?.trim() || null,
        type: formData.type, // ✅ type au lieu de category
        duration: formData.duration ? parseFloat(formData.duration) : null, // ✅ duration est OK
        durationType: formData.durationType, // ✅ Ajouter durationType
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        description: formData.description?.trim() || null,
        status: 'draft'
      };

      // Créer la course via le nouveau backend
      const result = await window.VGTiming.createRace(raceData);
      
      if (result.success) {
        showToast('Course créée avec succès !', 'success');
        onRaceAdded(result.data);
      } else {
        throw new Error(result.error || 'Erreur lors de la création de la course');
      }
    } catch (error) {
      console.error('Error adding race:', error);
      showToast(error.message || 'Erreur lors de la création de la course', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-race-container">
      <div className="race-list-header">
        <h1>Nouvelle Course</h1>
        <button 
          type="button" 
          className="btn-unified btn-outline-secondary-unified"
          onClick={onCancel}
        >
          <i className="fas fa-times"></i>
          Annuler
        </button>
      </div>
      
      <div className="content-wrapper">
        <div className="card-body">
        <form onSubmit={handleSubmit}>
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
            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn-unified btn-secondary-unified"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="btn-unified btn-primary-unified"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Créer la course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRace;
