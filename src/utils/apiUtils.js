/**
 * API utilities for VG-Timing
 */

import { API_ENDPOINTS } from '../constants';

/**
 * Fetch manifest data from server
 * @returns {Promise<Object|null>} Manifest data or null if failed
 */
export const fetchManifest = async () => {
  try {
    const response = await window.electronAPI.fetch(API_ENDPOINTS.MANIFEST);
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to fetch manifest:', error);
    return null;
  }
};

/**
 * Get configuration data from storage
 * @returns {Promise<Object>} Configuration object
 */
export const getConfigData = async () => {
  try {
    return await window.Store.get();
  } catch (error) {
    console.error('Failed to get config data:', error);
    return {};
  }
};

/**
 * Save configuration data to storage
 * @param {Object} config - Configuration object to save
 * @returns {Promise<boolean>} Success status
 */
export const saveConfigData = async (config) => {
  try {
    await window.Store.set('config', config);
    return true;
  } catch (error) {
    console.error('Failed to save config data:', error);
    return false;
  }
};
