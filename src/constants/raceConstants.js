/**
 * Race-specific constants for VG-Timing
 */

// Race types
export const RACE_TYPES = {
  TIME_TRIAL: 'time_trial',
  ENDURANCE: 'endurance',
  LAPS: 'laps',
  SPRINT: 'sprint'
};

// Race status
export const RACE_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  RUNNING: 'running',
  PAUSED: 'paused',
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
};

// Duration types
export const DURATION_TYPES = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  LAPS: 'laps'
};

// Default race settings
export const DEFAULT_RACE = {
  name: '',
  description: '',
  type: RACE_TYPES.LAPS,
  status: RACE_STATUS.DRAFT,
  durationType: DURATION_TYPES.LAPS,
  duration: 10,
  minLapTime: 30, // seconds
  maxLapTime: 300, // seconds
  participants: [],
  createdAt: null,
  startedAt: null,
  finishedAt: null
};

// Participant structure
export const DEFAULT_PARTICIPANT = {
  id: '',
  name: '',
  epcTag: '', // EPC hex tag from CrossMGR Impinj
  number: '',
  category: '',
  team: '',
  isActive: true
};
