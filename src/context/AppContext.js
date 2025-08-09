import React, { createContext, useContext, useState, useEffect } from 'react';

// Contexte pour gérer l'état global de l'application
const AppContext = createContext();

// Hook pour utiliser le contexte
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Provider du contexte
export const AppProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);

  // Configurer les listeners pour les nouveaux logs depuis le backend
  useEffect(() => {
    // Ajouter un log de test au démarrage
    const initLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: '🚀 Journal d\'activité initialisé',
      category: 'system',
      metadata: {}
    };
    setLogs([initLog]);
    
    // Écouter les événements de logs depuis Electron
    const handleAppLog = (event, logData) => {
      const newLog = {
        timestamp: logData.timestamp || new Date().toISOString(),
        level: logData.level || 'info',
        message: logData.message,
        category: logData.category || 'general',
        metadata: logData.metadata || {}
      };
      
      // Ajouter le log en tête et limiter à 100 entrées
      setLogs(prev => [newLog, ...prev].slice(0, 100));
    };

    // Enregistrer le listener avec la bonne API
    if (window.appLogAPI?.onLogAdd) {
      window.appLogAPI.onLogAdd(handleAppLog);
    }

    return () => {
      // Nettoyer les listeners si nécessaire
      if (window.appLogAPI?.removeLogListeners) {
        window.appLogAPI.removeLogListeners();
      }
    };
  }, []);

  // Fonction pour ajouter un log manuellement (depuis les composants)
  const addLog = (message, level = 'info', category = 'general', metadata = {}) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      category,
      metadata
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  // Fonction pour vider les logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <AppContext.Provider value={{
      logs,
      addLog,
      clearLogs
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;