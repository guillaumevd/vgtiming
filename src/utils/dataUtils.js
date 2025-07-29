/**
 * Data sorting utilities for VG-Timing
 */

import { getBestLapTime } from './timeUtils';

/**
 * Sort racing data by different criteria
 * @param {Object} data - Racing data object
 * @param {string} sortType - Type of sorting ('totalLaps', 'bestLap', 'lastLap')
 * @returns {Array} Sorted array of [id, data] entries
 */
export const sortData = (data, sortType) => {
  switch (sortType) {
    case 'totalLaps':
      return Object.entries(data).sort((a, b) => b[1].totalLaps - a[1].totalLaps);
    
    case 'bestLap':
      return Object.entries(data).sort((a, b) => {
        const bestA = getBestLapTime(a[1].lastLaps);
        const bestB = getBestLapTime(b[1].lastLaps);
        return bestA - bestB;
      });
    
    case 'lastLap':
      return Object.entries(data).sort((a, b) => {
        const lastA = a[1].lastLaps[a[1].lastLaps.length - 1] || Infinity;
        const lastB = b[1].lastLaps[b[1].lastLaps.length - 1] || Infinity;
        return lastA - lastB;
      });
    
    default:
      return Object.entries(data);
  }
};

/**
 * Filter data based on criteria
 * @param {Object} data - Racing data object
 * @param {Object} filters - Filter criteria
 * @returns {Object} Filtered data
 */
export const filterData = (data, filters = {}) => {
  const { minLaps = 0, maxLaps = Infinity } = filters;
  
  return Object.fromEntries(
    Object.entries(data).filter(([id, raceData]) => {
      return raceData.totalLaps >= minLaps && raceData.totalLaps <= maxLaps;
    })
  );
};
