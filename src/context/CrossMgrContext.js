import React, { createContext, useContext, useState, useEffect } from 'react';

// Contexte pour l'état de CrossMgr
const CrossMgrContext = createContext();

// Statuts de connexion
export const CROSSMGR_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

// Hook pour utiliser le contexte CrossMgr
export const useCrossMgr = () => {
  const context = useContext(CrossMgrContext);
  if (!context) {
    throw new Error('useCrossMgr must be used within a CrossMgrProvider');
  }
  return context;
};

// Provider pour le contexte CrossMgr
export const CrossMgrProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState(CROSSMGR_STATUS.DISCONNECTED);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Vérifier le statut de connexion au chargement uniquement
  useEffect(() => {
    checkConnectionStatus();
    
    // Écouter les événements de changement d'état automatique
    const handleCrossMgrConnected = (event, data) => {
      // Si c'est une vraie connexion établie (GT confirmé)
      if (data && data.established) {
        setConnectionStatus(CROSSMGR_STATUS.CONNECTED);
        setLastError(null);
      } else {
        // Sinon, c'est juste une connexion physique - passer en CONNECTING
        setConnectionStatus(CROSSMGR_STATUS.CONNECTING);
      }
    };

    const handleCrossMgrConnectionEstablished = (event, data) => {
      // Connexion vraiment établie via GT
      console.log('CrossMgr connection fully established (GT confirmed):', data);
      setConnectionStatus(CROSSMGR_STATUS.CONNECTED);
      setLastError(null);
      console.log('CrossMgr connection fully established:', data);
    };

    const handleCrossMgrDisconnected = (event, data) => {
      // Distinguer déconnexion client vs arrêt serveur
      if (data?.serverStopped) {
        // Serveur VG-Timing arrêté = vraiment déconnecté
        setConnectionStatus(CROSSMGR_STATUS.DISCONNECTED);
      } else {
        // Client CrossMgr déconnecté mais serveur en écoute = en attente de reconnexion
        setConnectionStatus(CROSSMGR_STATUS.CONNECTING);
      }
      setLastError(null);
      console.log('CrossMgr disconnected:', data);
    };

    const handleCrossMgrError = (event, error) => {
      setConnectionStatus(CROSSMGR_STATUS.ERROR);
      setLastError(error?.message || 'Erreur de connexion');
      console.log('CrossMgr error:', error);
    };

    const handleCrossMgrMessage = (event, messageData) => {
      // Émettre un événement personnalisé pour que les composants puissent l'écouter
      const customEvent = new CustomEvent('crossmgr-message', { detail: messageData });
      window.dispatchEvent(customEvent);
    };

    // Écouter les événements IPC depuis le backend
    if (window.electronAPI) {
      window.electronAPI.onCrossMgrConnected?.(handleCrossMgrConnected);
      window.electronAPI.onCrossMgrConnectionEstablished?.(handleCrossMgrConnectionEstablished);
      window.electronAPI.onCrossMgrDisconnected?.(handleCrossMgrDisconnected);
      window.electronAPI.onCrossMgrError?.(handleCrossMgrError);
      window.electronAPI.onCrossMgrMessage?.(handleCrossMgrMessage);
    }

    // Pas de refresh automatique - seulement au chargement initial
    
    return () => {
      // Nettoyer les listeners si ils existent
      window.electronAPI?.removeCrossMgrListeners?.();
    };
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const result = await window.electronAPI.crossmgrStatus();
      if (result.success && result.data) {
        const { isListening, isConnected } = result.data;
        const newStatus = isListening 
          ? (isConnected ? CROSSMGR_STATUS.CONNECTED : CROSSMGR_STATUS.CONNECTING)
          : CROSSMGR_STATUS.DISCONNECTED;
        setConnectionStatus(newStatus);
        setLastError(null);
      } else {
        setConnectionStatus(CROSSMGR_STATUS.ERROR);
        setLastError(result.error || 'Erreur de statut');
      }
    } catch (error) {
      setConnectionStatus(CROSSMGR_STATUS.ERROR);
      setLastError(error.message);
    }
  };

  const connect = async () => {
    setIsLoading(true);
    setLastError(null);
    setConnectionStatus(CROSSMGR_STATUS.CONNECTING);
    
    try {
      const result = await window.electronAPI.crossmgrStart();
      if (result.success) {
        // Vérifier immédiatement le statut réel
        await checkConnectionStatus();
      } else {
        setConnectionStatus(CROSSMGR_STATUS.ERROR);
        setLastError(result.error);
      }
    } catch (error) {
      setConnectionStatus(CROSSMGR_STATUS.ERROR);
      setLastError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    setIsLoading(true);
    setLastError(null);
    
    try {
      const result = await window.electronAPI.crossmgrStop();
      if (result.success) {
        setConnectionStatus(CROSSMGR_STATUS.DISCONNECTED);
      } else {
        setLastError(result.error);
      }
    } catch (error) {
      setLastError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case CROSSMGR_STATUS.CONNECTED:
        return 'Connecté à CrossMgr';
      case CROSSMGR_STATUS.CONNECTING:
        return 'En écoute (attente client)';
      case CROSSMGR_STATUS.DISCONNECTED:
        return 'Déconnecté';
      case CROSSMGR_STATUS.ERROR:
        return `Erreur: ${lastError || 'Erreur inconnue'}`;
      default:
        return 'État inconnu';
    }
  };

  const value = {
    connectionStatus,
    isLoading,
    lastError,
    connect,
    disconnect,
    checkConnectionStatus,
    getStatusText,
    isConnected: connectionStatus === CROSSMGR_STATUS.CONNECTED,
    isListening: connectionStatus === CROSSMGR_STATUS.CONNECTING || connectionStatus === CROSSMGR_STATUS.CONNECTED
  };

  return (
    <CrossMgrContext.Provider value={value}>
      {children}
    </CrossMgrContext.Provider>
  );
};

export default CrossMgrContext;
