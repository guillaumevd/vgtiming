/**
 * Utilities for time conversion and formatting in VG-Timing
 */

/**
 * Convert time string to milliseconds
 * @param {string} timeStr - Time in format "hours:minutes:seconds:millis"
 * @returns {number} Time in milliseconds
 */
export const timeToMillis = (timeStr) => {
  const [hours, minutes, seconds, millis] = timeStr.split(':').map(Number);
  return ((hours * 60 * 60) + (minutes * 60) + seconds) * 1000 + millis;
};

/**
 * Convert milliseconds to time string
 * @param {number} millis - Time in milliseconds
 * @returns {string} Time in format "hours:minutes:seconds:millis"
 */
export const millisToTime = (millis) => {
  const hours = Math.floor(millis / (60 * 60 * 1000));
  const minutes = Math.floor((millis % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((millis % (60 * 1000)) / 1000);
  const ms = millis % 1000;
  return `${hours}:${minutes}:${seconds}:${ms}`;
};

/**
 * Format time for display (human readable)
 * @param {number} millis - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatDisplayTime = (millis) => {
  const hours = Math.floor(millis / (60 * 60 * 1000));
  const minutes = Math.floor((millis % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((millis % (60 * 1000)) / 1000);
  const ms = Math.floor((millis % 1000) / 10); // Show only 2 decimal places

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }
};

/**
 * Get best lap time from an array of lap times
 * @param {number[]} lapTimes - Array of lap times in milliseconds
 * @returns {number} Best (minimum) lap time
 */
export const getBestLapTime = (lapTimes) => {
  return Math.min(...lapTimes);
};

/**
 * Get average lap time from an array of lap times
 * @param {number[]} lapTimes - Array of lap times in milliseconds
 * @returns {number} Average lap time
 */
export const getAverageLapTime = (lapTimes) => {
  if (lapTimes.length === 0) return 0;
  const total = lapTimes.reduce((sum, time) => sum + time, 0);
  return Math.round(total / lapTimes.length);
};
