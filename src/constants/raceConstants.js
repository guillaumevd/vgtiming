/**
 * Race-specific constants for VG-Timing
 */

// Race types
export const RACE_TYPES = {
  ROAD_RACE: 'Route',
  TRACK: 'Piste',
  CYCLO_CROSS: 'Cyclo-cross',
  VTT_CROSS_COUNTRY: 'VTT Cross-country',
  VTT_ENDURO: 'VTT Enduro',
  VTT_DESCENT: 'VTT Descente',
  BMX_RACE: 'BMX Race',
  BMX_FREESTYLE: 'BMX Freestyle',
  RUNNING: 'Course à pied',
  TRAIL: 'Trail',
  MARATHON: 'Marathon',
  TRIATHLON: 'Triathlon',
  OTHER: 'Autre'
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
