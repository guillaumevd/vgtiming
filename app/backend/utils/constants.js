/**
 * Constantes de l'application
 */

// Types de courses
const RACE_TYPES = {
  ROAD_RACE: 'Route',
  TRACK: 'Piste',
  CYCLOCROSS: 'Cyclo-cross',
  MTB_XC: 'VTT Cross-country',
  MTB_ENDURO: 'VTT Enduro',
  MTB_DOWNHILL: 'VTT Descente',
  BMX_RACE: 'BMX Race',
  BMX_FREESTYLE: 'BMX Freestyle',
  RUNNING: 'Course à pied',
  TRAIL: 'Trail',
  MARATHON: 'Marathon',
  TRIATHLON: 'Triathlon',
  OTHER: 'Autre'
};

// Types de durée
const DURATION_TYPES = {
  TIME: 'Temps',
  LAPS: 'Tours',
  DISTANCE: 'Distance'
};

// Statuts de course
const RACE_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  IN_PROGRESS: 'in_progress', // Ajout de IN_PROGRESS
  ACTIVE: 'active',
  FINISHING: 'finishing', // Course en cours de finition - permet aux participants de terminer leur tour
  PAUSED: 'paused',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed' // Ajout de COMPLETED aussi utilisé dans le code
};

// Statuts de chronométrage
const TIMING_STATUS = {
  REGISTERED: 'registered',  // Participant inscrit mais pas encore démarré
  STARTED: 'started',        // Participant a démarré
  RUNNING: 'running',        // Participant en cours de course
  FINISHED: 'finished',      // Participant a terminé
  DNF: 'dnf',               // Did Not Finish
  DNS: 'dns',               // Did Not Start
  DSQ: 'dsq'                // Disqualifié
};

// Catégories de paramètres
const SETTING_CATEGORIES = {
  GENERAL: 'general',
  TIMING: 'timing',
  EXPORT: 'export',
  DISPLAY: 'display',
  CROSSMGR: 'crossmgr'
};

// Paramètres par défaut
const DEFAULT_SETTINGS = {
  // Général
  'app.language': { value: 'fr', category: SETTING_CATEGORIES.GENERAL },
  'app.theme': { value: 'dark', category: SETTING_CATEGORIES.GENERAL },
  'app.autoBackup': { value: 'true', category: SETTING_CATEGORIES.GENERAL },
  'app.backupInterval': { value: '24', category: SETTING_CATEGORIES.GENERAL }, // heures
  
  // Chronométrage
  'timing.defaultDisplayMode': { value: 'list', category: SETTING_CATEGORIES.TIMING },
  'timing.autoRefreshInterval': { value: '1000', category: SETTING_CATEGORIES.TIMING }, // ms
  'timing.showMilliseconds': { value: 'true', category: SETTING_CATEGORIES.TIMING },
  'timing.manualTimingEnabled': { value: 'true', category: SETTING_CATEGORIES.TIMING },
  
  // Export
  'export.defaultFormat': { value: 'csv', category: SETTING_CATEGORIES.EXPORT },
  'export.includeHeaders': { value: 'true', category: SETTING_CATEGORIES.EXPORT },
  'export.dateFormat': { value: 'DD/MM/YYYY', category: SETTING_CATEGORIES.EXPORT },
  'export.timeFormat': { value: 'HH:mm:ss.SSS', category: SETTING_CATEGORIES.EXPORT },
  
  // Affichage
  'display.participantsPerPage': { value: '50', category: SETTING_CATEGORIES.DISPLAY },
  'display.showPodiumHighlight': { value: 'true', category: SETTING_CATEGORIES.DISPLAY },
  'display.animateUpdates': { value: 'true', category: SETTING_CATEGORIES.DISPLAY },
  
  // CrossMGR (pour plus tard)
  'crossmgr.host': { value: 'localhost', category: SETTING_CATEGORIES.CROSSMGR },
  'crossmgr.port': { value: '53135', category: SETTING_CATEGORIES.CROSSMGR },
  'crossmgr.autoConnect': { value: 'false', category: SETTING_CATEGORIES.CROSSMGR }
};

// Messages d'erreur
const ERROR_MESSAGES = {
  // Base de données
  DB_NOT_INITIALIZED: 'Base de données non initialisée',
  DB_OPERATION_FAILED: 'Opération de base de données échouée',
  
  // Validation
  VALIDATION_FAILED: 'Données invalides',
  REQUIRED_FIELD_MISSING: 'Champ requis manquant',
  
  // Courses
  RACE_NOT_FOUND: 'Course non trouvée',
  RACE_ALREADY_STARTED: 'Course déjà démarrée',
  RACE_NOT_READY: 'Course non prête',
  RACE_FINISHED: 'Course terminée',
  
  // Participants
  PARTICIPANT_NOT_FOUND: 'Participant non trouvé',
  PARTICIPANT_NUMBER_EXISTS: 'Numéro de participant déjà utilisé',
  PARTICIPANT_TAG_EXISTS: 'Tag EPC déjà utilisé',
  
  // Chronométrage
  TIMING_DATA_NOT_FOUND: 'Donnée de chronométrage non trouvée',
  INVALID_LAP_TIME: 'Temps de tour invalide',
  LAP_ALREADY_EXISTS: 'Tour déjà enregistré',
  
  // Général
  INTERNAL_SERVER_ERROR: 'Erreur interne du serveur',
  PERMISSION_DENIED: 'Permission refusée',
  RESOURCE_NOT_FOUND: 'Ressource non trouvée'
};

// Messages de succès
const SUCCESS_MESSAGES = {
  RACE_CREATED: 'Course créée avec succès',
  RACE_UPDATED: 'Course mise à jour avec succès',
  RACE_DELETED: 'Course supprimée avec succès',
  RACE_STARTED: 'Course démarrée avec succès',
  RACE_STOPPED: 'Course arrêtée avec succès',
  RACE_FINISHED: 'Course terminée avec succès',
  RACE_RESET: 'Course remise à zéro avec succès',
  
  PARTICIPANT_CREATED: 'Participant ajouté avec succès',
  PARTICIPANT_UPDATED: 'Participant mis à jour avec succès',
  PARTICIPANT_DELETED: 'Participant supprimé avec succès',
  
  TIMING_DATA_CREATED: 'Données de chronométrage ajoutées avec succès',
  TIMING_DATA_UPDATED: 'Données de chronométrage mises à jour avec succès',
  TIMING_DATA_DELETED: 'Données de chronométrage supprimées avec succès',
  
  SETTINGS_UPDATED: 'Paramètres mis à jour avec succès',
  
  BACKUP_CREATED: 'Sauvegarde créée avec succès',
  BACKUP_RESTORED: 'Sauvegarde restaurée avec succès'
};

module.exports = {
  RACE_TYPES,
  DURATION_TYPES,
  RACE_STATUS,
  TIMING_STATUS,
  SETTING_CATEGORIES,
  DEFAULT_SETTINGS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
