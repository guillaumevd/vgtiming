const Joi = require('joi');

/**
 * Schémas de validation pour les données
 */

// Validation pour une course
const raceSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().min(1).max(255).required(),
  date: Joi.string().isoDate().required(),
  time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: Joi.string().min(1).max(255).optional(),
  type: Joi.string().valid(
    'Route',
    'Piste',
    'Cyclo-cross',
    'VTT Cross-country',
    'VTT Enduro',
    'VTT Descente',
    'BMX Race',
    'BMX Freestyle',
    'Course à pied',
    'Trail',
    'Marathon',
    'Triathlon',
    'Autre'
  ).required(),
  duration: Joi.number().min(0).optional(),
  durationType: Joi.string().valid('Distance', 'Temps', 'Tours').optional(),
  maxParticipants: Joi.number().integer().min(1).optional(),
  description: Joi.string().max(1000).optional(),
  status: Joi.string().valid('draft', 'ready', 'active', 'paused', 'finished', 'cancelled').optional()
});

// Validation pour un participant
const participantSchema = Joi.object({
  id: Joi.string().optional(),
  raceId: Joi.string().required(),
  number: Joi.string().required(), // Toujours une string maintenant
  name: Joi.string().min(1).max(255).required(),
  category: Joi.string().allow('').optional().default('Général'),
  team: Joi.string().allow('').optional(),
  epcTag: Joi.string().allow('').optional(),
  isActive: Joi.boolean().optional().default(true)
}).unknown(false); // Rejeter les champs non définis

// Validation pour des données de chronométrage
const timingDataSchema = Joi.object({
  id: Joi.string().optional(),
  raceId: Joi.string().required(),
  participantId: Joi.string().required(),
  lapNumber: Joi.number().integer().min(1).required(),
  lapTime: Joi.number().integer().min(1).required(), // en millisecondes
  timestamp: Joi.date().optional(),
  isManual: Joi.boolean().optional()
});

// Validation pour les paramètres
const settingSchema = Joi.object({
  key: Joi.string().min(1).max(100).required(),
  value: Joi.string().required(),
  category: Joi.string().max(50).optional()
});

/**
 * Fonctions de validation
 */

function validateRace(data) {
  return raceSchema.validate(data, { abortEarly: false });
}

function validateRaceUpdate(data) {
  // Pour les mises à jour, tous les champs sont optionnels sauf l'ID
  const updateSchema = raceSchema.keys({
    name: Joi.string().min(1).max(255).optional(),
    date: Joi.string().isoDate().optional(),
    type: Joi.string().valid(
      'Route',
      'Piste',
      'Cyclo-cross',
      'VTT Cross-country',
      'VTT Enduro',
      'VTT Descente',
      'BMX Race',
      'BMX Freestyle',
      'Course à pied',
      'Trail',
      'Marathon',
      'Triathlon',
      'Autre'
    ).optional()
  });
  return updateSchema.validate(data, { abortEarly: false });
}

function validateParticipant(data) {
  return participantSchema.validate(data, { abortEarly: false });
}

function validateParticipantUpdate(data) {
  // Pour les mises à jour, tous les champs sont optionnels sauf l'ID
  const updateSchema = participantSchema.keys({
    raceId: Joi.string().optional(),
    number: Joi.string().min(1).max(10).optional(),
    name: Joi.string().min(1).max(255).optional()
  });
  return updateSchema.validate(data, { abortEarly: false });
}

function validateParticipantBatch(data) {
  const batchSchema = Joi.array().items(participantSchema).min(1);
  return batchSchema.validate(data, { abortEarly: false });
}

function validateTimingData(data) {
  return timingDataSchema.validate(data, { abortEarly: false });
}

function validateSetting(data) {
  return settingSchema.validate(data, { abortEarly: false });
}

/**
 * Validation des paramètres de pagination
 */
function validatePagination(params) {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(1000).default(50),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().optional()
  });
  
  return schema.validate(params);
}

/**
 * Validation des filtres de course
 */
function validateRaceFilters(params) {
  const schema = Joi.object({
    status: Joi.string().valid('draft', 'ready', 'active', 'paused', 'finished', 'cancelled').optional(),
    type: Joi.string().optional(),
    startDate: Joi.string().isoDate().optional(),
    endDate: Joi.string().isoDate().optional()
  });
  
  return schema.validate(params);
}

module.exports = {
  validateRace,
  validateRaceUpdate,
  validateParticipant,
  validateParticipantUpdate,
  validateParticipantBatch,
  validateTimingData,
  validateSetting,
  validatePagination,
  validateRaceFilters,
  schemas: {
    race: raceSchema,
    participant: participantSchema,
    timingData: timingDataSchema,
    setting: settingSchema
  }
};
