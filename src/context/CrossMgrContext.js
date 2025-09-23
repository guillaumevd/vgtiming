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

  // Vérifier le statut de connexion au chargement et gérer l'auto-démarrage
  useEffect(() => {
    checkConnectionStatus();
    
    // Vérifier l'auto-démarrage après un délai pour s'assurer que l'API est prête
    const checkAutoStart = async () => {
      try {
        console.log('CrossMgr: Vérification de l\'auto-démarrage...');
        console.log('CrossMgr: VGTiming disponible?', !!window.VGTiming);
        console.log('CrossMgr: VGTiming.getSetting disponible?', !!window.VGTiming?.getSetting);
        
        if (window.VGTiming?.getSetting) {
          const result = await window.VGTiming.getSetting('crossmgrAutoStart');
          console.log('CrossMgr: Résultat getSetting crossmgrAutoStart:', result);
          
          // Le backend retourne { success: true, data: value }, pas { success: true, value: ... }
          if (result?.success && result.data === true) {
            console.log('CrossMgr: Auto-démarrage activé, lancement de la connexion...');
            await connect();
          } else {
            console.log('CrossMgr: Auto-démarrage désactivé ou erreur:', result);
          }
        } else {
          console.error('CrossMgr: API getSetting non disponible');
        }
      } catch (error) {
        console.error('CrossMgr: Erreur lors de la vérification de l\'auto-démarrage:', error);
      }
    };

    // Attendre que l'API soit prête avant de vérifier l'auto-démarrage
    if (window.VGTiming?.isReady) {
      // Attendre un peu pour s'assurer que tout est initialisé
      setTimeout(checkAutoStart, 1000);
    } else {
      const handleAPIReady = () => {
        // Attendre un peu après que l'API soit prête
        setTimeout(checkAutoStart, 1000);
        window.removeEventListener('vgtiming-ready', handleAPIReady);
      };
      window.addEventListener('vgtiming-ready', handleAPIReady);
    }
    
    // Écouter les événements de changement d'état automatique
    const handleCrossMgrConnected = (event, data) => {
      console.log('CrossMgr frontend: received connected event:', data);
      // Si c'est une vraie connexion établie (GT confirmé)
      if (data && data.established) {
        console.log('CrossMgr frontend: connection already established');
        setConnectionStatus(CROSSMGR_STATUS.CONNECTED);
        setLastError(null);
      } else {
        // Sinon, c'est juste une connexion physique - passer en CONNECTING
        console.log('CrossMgr frontend: physical connection, waiting for GT');
        setConnectionStatus(CROSSMGR_STATUS.CONNECTING);
      }
    };

    const handleCrossMgrConnectionEstablished = (event, data) => {
      // Connexion vraiment établie via GT
      console.log('CrossMgr frontend: connection fully established (GT confirmed):', data);
      setConnectionStatus(CROSSMGR_STATUS.CONNECTED);
      setLastError(null);
      
      // Aussi vérifier le statut pour s'assurer de la cohérence
      setTimeout(() => {
        checkConnectionStatus();
      }, 100);
    };

    const handleCrossMgrDisconnected = (event, data) => {
      console.log('CrossMgr frontend: received disconnected event:', data);
      // Distinguer déconnexion client vs arrêt serveur
      if (data?.serverStopped) {
        // Serveur VG-Timing arrêté = vraiment déconnecté
        console.log('CrossMgr frontend: server stopped, fully disconnected');
        setConnectionStatus(CROSSMGR_STATUS.DISCONNECTED);
      } else {
        // Client CrossMgr déconnecté mais serveur en écoute = en attente de reconnexion
        console.log('CrossMgr frontend: client disconnected, server still listening');
        setConnectionStatus(CROSSMGR_STATUS.CONNECTING);
      }
      setLastError(null);
    };

    const handleCrossMgrError = (event, error) => {
      console.log('CrossMgr frontend: received error event:', error);
      setConnectionStatus(CROSSMGR_STATUS.ERROR);
      setLastError(error?.message || 'Erreur de connexion');
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
    
    return () => {
      // Nettoyer les listeners si ils existent
      window.electronAPI?.removeCrossMgrListeners?.();
    };
  }, []);

  // Système de vérification périodique quand en CONNECTING
  useEffect(() => {
    let intervalId = null;
    
    if (connectionStatus === CROSSMGR_STATUS.CONNECTING) {
      // Vérifier le statut toutes les 10 secondes quand en attente de connexion (réduit le spam de logs)
      console.log('CrossMgr frontend: starting periodic check while CONNECTING');
      intervalId = setInterval(async () => {
        // Log moins verbeux pour éviter le spam
        await checkConnectionStatus();
      }, 10000); // 10 secondes au lieu de 2
    }
    
    return () => {
      if (intervalId) {
        console.log('CrossMgr frontend: stopping periodic check');
        clearInterval(intervalId);
      }
    };
  }, [connectionStatus]);

  const checkConnectionStatus = async () => {
    try {
      // Log supprimé pour éviter le spam - vérifie le statut en silence
      const result = await window.electronAPI.crossmgrStatus();
      if (result.success && result.data) {
        const { isListening, isConnected } = result.data;
        const newStatus = isListening 
          ? (isConnected ? CROSSMGR_STATUS.CONNECTED : CROSSMGR_STATUS.CONNECTING)
          : CROSSMGR_STATUS.DISCONNECTED;
        
        console.log(`CrossMgr frontend: status check result - listening: ${isListening}, connected: ${isConnected}, newStatus: ${newStatus}`);
        
        // Ne mettre à jour l'état que si il a vraiment changé
        setConnectionStatus(prevStatus => {
          if (prevStatus !== newStatus) {
            console.log(`CrossMgr frontend: status changed from ${prevStatus} to ${newStatus}`);
            return newStatus;
          }
          return prevStatus;
        });
        setLastError(null);
      } else {
        console.log('CrossMgr frontend: status check failed:', result.error);
        setConnectionStatus(CROSSMGR_STATUS.ERROR);
        setLastError(result.error || 'Erreur de statut');
      }
    } catch (error) {
      console.log('CrossMgr frontend: status check error:', error);
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
