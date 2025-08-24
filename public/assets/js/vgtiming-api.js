/**
 * API Frontend pour communiquer avec le backend VG-Timing
 * Compatible mode Electron et mode web development
 */
class VGTimingAPI {
  constructor() {
    this.isReady = false;
    this.isElectronContext = false;
    this.init();
  }

  async init() {
    try {
      // Vérifier si nous sommes dans un contexte Electron
      this.isElectronContext = typeof window !== 'undefined' && window.electronAPI;
      console.log('🔍 VG-Timing API: Détection du contexte...', {
        windowExists: typeof window !== 'undefined',
        electronAPIExists: !!(window && window.electronAPI),
        isElectronContext: this.isElectronContext
      });
      
      if (this.isElectronContext) {
        const result = await window.electronAPI.invoke('app:ping');
        this.isReady = result.success && result.data.backend;
        console.log('✅ VG-Timing API initialized (Electron):', this.isReady, result);
      } else {
        // Mode web development - simuler l'API
        console.warn('🌐 VG-Timing API: Mode web development détecté. Fonctionnalités simulées.');
        this.isReady = true;
        console.log('✅ VG-Timing API initialized (Web Simulation):', this.isReady);
      }
      
      // Émettre un événement personnalisé quand l'API est prête
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('vgtiming-ready', { 
          detail: { isReady: this.isReady, isElectronContext: this.isElectronContext } 
        });
        window.dispatchEvent(event);
        console.log('📢 VG-Timing API: Événement vgtiming-ready émis');
      }
    } catch (error) {
      console.error('❌ Failed to initialize VG-Timing API:', error);
      this.isReady = false;
      
      // Émettre l'événement même en cas d'erreur
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('vgtiming-ready', { 
          detail: { isReady: false, error: error.message } 
        });
        window.dispatchEvent(event);
      }
    }
  }

  // Fonction helper pour simuler des réponses en mode web
  simulateResponse(data, success = true) {
    return Promise.resolve({
      success,
      data,
      error: success ? null : 'Mode développement web - fonctionnalité non disponible'
    });
  }

  // ===== RACES =====
  
  async getAllRaces(options = {}) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      // Simuler des courses pour le développement web
      return this.simulateResponse([
        {
          id: '1',
          name: 'Course Test 1',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          category: 'Course',
          status: 'draft',
          participantCount: 25
        },
        {
          id: '2', 
          name: 'Course Test 2',
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          category: 'Trail',
          status: 'active',
          participantCount: 18
        }
      ]);
    }
    
    return await window.electronAPI.invoke('race:getAll', options);
  }

  async getRaceById(raceId, includeStats = false) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({
        id: raceId,
        name: `Course ${raceId}`,
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        category: 'Course',
        status: 'draft'
      });
    }
    
    return await window.electronAPI.invoke('race:getById', raceId, includeStats);
  }

  async createRace(raceData) {
    console.log('🏁 VG-Timing API: createRace called', {
      isReady: this.isReady,
      isElectronContext: this.isElectronContext,
      raceData: raceData
    });
    
    if (!this.isReady) {
      console.error('❌ API not ready for createRace');
      return { success: false, error: 'API not ready' };
    }
    
    if (!this.isElectronContext) {
      const newRace = {
        id: Date.now().toString(),
        ...raceData,
        status: 'draft',
        createdAt: new Date().toISOString(),
        participantCount: 0
      };
      console.log('🌐 Mode web dev - Course simulée créée:', newRace);
      return this.simulateResponse(newRace);
    }
    
    console.log('⚡ Calling Electron API: race:create');
    return await window.electronAPI.invoke('race:create', raceData);
  }

  async updateRace(raceId, updateData) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Course simulée mise à jour:', raceId, updateData);
      return this.simulateResponse({ id: raceId, ...updateData });
    }
    
    return await window.electronAPI.invoke('race:update', raceId, updateData);
  }

  async deleteRace(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Course simulée supprimée:', raceId);
      return this.simulateResponse(true);
    }
    
    return await window.electronAPI.invoke('race:delete', raceId);
  }

  async changeRaceStatus(raceId, newStatus) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Statut course changé:', raceId, newStatus);
      return this.simulateResponse({ id: raceId, status: newStatus });
    }
    
    return await window.electronAPI.invoke('race:changeStatus', raceId, newStatus);
  }

  // ===== PARTICIPANTS =====

  async getParticipantsByRace(raceId, options = {}) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse([
        {
          id: '1',
          raceId: raceId,
          number: 101,
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          team: 'Team A',
          category: 'Senior'
        },
        {
          id: '2',
          raceId: raceId,
          number: 102,
          name: 'Marie Martin',
          email: 'marie.martin@email.com',
          team: 'Team B', 
          category: 'Senior'
        }
      ]);
    }
    
    return await window.electronAPI.invoke('participant:getByRace', raceId, options);
  }

  async createParticipant(participantData) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      const newParticipant = {
        id: Date.now().toString(),
        ...participantData,
        createdAt: new Date().toISOString()
      };
      console.log('Mode web dev - Participant simulé créé:', newParticipant);
      return this.simulateResponse(newParticipant);
    }
    
    return await window.electronAPI.invoke('participant:create', participantData);
  }

  async updateParticipant(participantId, updateData) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Participant simulé mis à jour:', participantId, updateData);
      return this.simulateResponse({ id: participantId, ...updateData });
    }
    
    return await window.electronAPI.invoke('participant:update', participantId, updateData);
  }

  async deleteParticipant(participantId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Participant simulé supprimé:', participantId);
      return this.simulateResponse(true);
    }
    
    return await window.electronAPI.invoke('participant:delete', participantId);
  }

  // ===== TIMING =====

  async getTimingDataByRace(raceId, options = {}) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse([
        {
          id: '1',
          raceId: raceId,
          participantId: '1',
          startTime: new Date().toISOString(),
          finishTime: null,
          status: 'started'
        }
      ]);
    }
    
    return await window.electronAPI.invoke('timing:getByRace', raceId, options);
  }

  async initializeRaceTiming(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Initialisation timing simulée pour course:', raceId);
      return this.simulateResponse({ 
        raceId, 
        initialized: true, 
        startTime: new Date().toISOString(),
        gtSent: true,
        status: 'initialized'
      });
    }
    
    return await window.electronAPI.invoke('timing:initialize', raceId);
  }

  async startRaceWithTiming(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Démarrage course complet simulé pour course:', raceId);
      return this.simulateResponse({ 
        raceId, 
        race: { status: 'in_progress' },
        timing: { initialized: true, gtSent: true },
        massStart: { started: true },
        status: 'running'
      });
    }
    
    return await window.electronAPI.invoke('timing:startRace', raceId);
  }

  async startMassTiming(raceId, startTime = null) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Démarrage masse simulé pour course:', raceId);
      return this.simulateResponse({ 
        raceId, 
        startTime: startTime || new Date().toISOString(),
        status: 'running',
        gtSent: true
      });
    }
    
    return await window.electronAPI.invoke('timing:startMass', raceId, startTime);
  }

  async getTimingStats(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({ 
        raceId,
        totalParticipants: 25,
        runningCount: 15,
        finishedCount: 8,
        dnsCount: 2,
        elapsedTime: '01:23:45',
        lastPassingTime: new Date().toISOString()
      });
    }
    
    return await window.electronAPI.invoke('timing:getStats', raceId);
  }

  async getRunningParticipants(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse([
        {
          id: '1',
          bibNumber: '101',
          firstName: 'John',
          lastName: 'Doe',
          startTime: new Date(Date.now() - 3600000).toISOString(),
          currentLap: 2,
          status: 'running'
        }
      ]);
    }
    
    return await window.electronAPI.invoke('timing:getRunning', raceId);
  }

  async checkRaceFinishConditions(raceId) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({ 
        shouldFinish: false,
        reason: null,
        raceId,
        raceName: 'Course Test'
      });
    }
    
    return await window.electronAPI.invoke('timing:checkFinishConditions', raceId);
  }

  async autoFinishRace(raceId, reason) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Fin automatique simulée pour course:', raceId, reason);
      return this.simulateResponse({ 
        raceId, 
        raceName: 'Course Test',
        status: 'finished',
        finishedAt: new Date().toISOString(),
        finishReason: reason
      });
    }
    
    return await window.electronAPI.invoke('timing:autoFinish', raceId, reason);
  }

  async importTimingData(raceId, timingDataArray) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Importation timing simulée pour course:', raceId, 'avec', timingDataArray.length, 'données');
      return this.simulateResponse({ 
        raceId, 
        imported: timingDataArray.length,
        data: timingDataArray.map((item, index) => ({ ...item, id: `timing-${index}` }))
      });
    }
    
    return await window.electronAPI.invoke('timing:import', raceId, timingDataArray);
  }

  async importTimingDataDirect(raceId, timingDataArray) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Importation timing directe simulée pour course:', raceId, 'avec', timingDataArray.length, 'données');
      return this.simulateResponse({ 
        raceId, 
        imported: timingDataArray.length,
        data: timingDataArray.map((item, index) => ({ ...item, id: `timing-direct-${index}` }))
      });
    }
    
    return await window.electronAPI.invoke('timing:importDirect', raceId, timingDataArray);
  }

  async updateRaceStatus(raceId, status) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Mise à jour statut simulée pour course:', raceId, 'vers', status);
      return this.simulateResponse({ 
        raceId, 
        status: status,
        updatedAt: new Date().toISOString()
      });
    }
    
    return await window.electronAPI.invoke('race:updateStatus', raceId, status);
  }

  // ===== SETTINGS =====

  async getSetting(key) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({ key: key, value: 'test_value', type: 'string' });
    }
    
    return await window.electronAPI.invoke('settings:get', key);
  }

  async setSetting(key, value, type = null, description = null) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Paramètre simulé défini:', key, value);
      return this.simulateResponse({ key: key, value: value, type: type || 'string' });
    }
    
    return await window.electronAPI.invoke('settings:set', key, value, type, description);
  }

  // ===== APP UTILITIES =====

  async getBackendStatus() {
    if (!this.isElectronContext) {
      return this.simulateResponse({
        backend: true,
        database: true,
        models: true,
        services: true,
        mode: 'development'
      });
    }
    
    return await window.electronAPI.invoke('app:getBackendStatus');
  }

  async getAppStats() {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({
        races: 2,
        participants: 50,
        timingRecords: 125,
        uptime: 60000
      });
    }
    
    return await window.electronAPI.invoke('app:getStats');
  }

  // ===== UTILITY METHODS =====

  formatTime(milliseconds) {
    if (!milliseconds || milliseconds <= 0) return '--:--:--';
    
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  parseTime(timeString) {
    if (!timeString || timeString === '--:--:--') return 0;
    
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // ===== SETTINGS =====

  async getSettings(key = null) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      return this.simulateResponse({
        theme: 'dark',
        language: 'fr',
        autoSave: true
      });
    }
    
    if (key) {
      return await window.electronAPI.invoke('settings:get', key);
    }
    return await window.electronAPI.invoke('settings:getAll');
  }

  async getAllSettings() {
    return await this.getSettings();
  }

  async setSetting(key, value, type = null, description = null) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Setting saved:', key, value);
      return this.simulateResponse({ key, value });
    }
    
    return await window.electronAPI.invoke('settings:set', key, value, type, description);
  }

  async setSettings(settings) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Settings saved:', settings);
      return this.simulateResponse(settings);
    }
    
    return await window.electronAPI.invoke('settings:setMultiple', settings);
  }

  async deleteSetting(key) {
    if (!this.isReady) return { success: false, error: 'API not ready' };
    
    if (!this.isElectronContext) {
      console.log('Mode web dev - Setting deleted:', key);
      return this.simulateResponse({ deleted: key });
    }
    
    return await window.electronAPI.invoke('settings:delete', key);
  }
}

// Export global instance
window.VGTiming = new VGTimingAPI();

// Notification when ready
document.addEventListener('DOMContentLoaded', async () => {
  await window.VGTiming.init();
  console.log('VG-Timing API ready:', window.VGTiming.isReady);
  console.log('Electron context:', window.VGTiming.isElectronContext);
  
  // Dispatch custom event for components
  window.dispatchEvent(new CustomEvent('vgtiming-ready', {
    detail: { 
      ready: window.VGTiming.isReady,
      electronContext: window.VGTiming.isElectronContext
    }
  }));
});