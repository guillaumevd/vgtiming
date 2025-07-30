/**
 * Application constants for VG-Timing
 */

// Re-export race constants
export * from './raceConstants';

// Sort types
export const SORT_TYPES = {
  TOTAL_LAPS: 'totalLaps',
  BEST_LAP: 'bestLap',
  LAST_LAP: 'lastLap'
};

// Application routes
export const ROUTES = {
  HOME: '/',
  TIMING: '/timing',
  RACES: '/races',
  NEWS: '/news',
  SETTINGS: '/settings'
};

// API endpoints
export const API_ENDPOINTS = {
  MANIFEST: 'https://test.vg-timing.com/manifest.json'
};

// Application info
export const APP_INFO = {
  NAME: 'VG-Timing',
  VERSION: '0.0.10',
  DESCRIPTION: 'VG-Timing - Application de chronométrage professionnel'
};

// Default configuration
export const DEFAULT_CONFIG = {
  main: {
    sortType: SORT_TYPES.BEST_LAP,
    autoSave: true,
    refreshRate: 1000
  },
  display: {
    format: '${person}: ${totalLaps} laps (Last Lap: ${lastLap}, Best: ${bestLap})',
    showMilliseconds: true,
    theme: 'dark'
  },
  columns: {
    totalLaps: 'Total',
    lastLap: 'Last Lap',
    bestLap: 'Best Lap',
    position: 'Position'
  }
};

// Demo data for development
export const DEMO_TIMING_DATA = {
  1: { 
    totalLaps: 5, 
    lastLaps: [120000, 118000, 119000, 117000, 116000],
    driver: 'Pilote #1'
  },
  2: { 
    totalLaps: 4, 
    lastLaps: [125000, 122000, 121000, 120000],
    driver: 'Pilote #2'
  },
  3: { 
    totalLaps: 6, 
    lastLaps: [115000, 114000, 113000, 116000, 115500, 114200],
    driver: 'Pilote #3'
  }
};
