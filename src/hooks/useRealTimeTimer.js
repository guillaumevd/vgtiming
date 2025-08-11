import { useState, useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour gérer un chronométre en temps réel
 * @param {string} startTime - Timestamp ISO du début de course (gtTimestamp)
 * @param {boolean} isRunning - Si le chronométre doit être actif
 * @param {number} updateInterval - Intervalle de mise à jour en ms (par défaut 1000ms)
 * @returns {string} - Temps écoulé au format HH:MM:SS
 */
export const useRealTimeTimer = (startTime, isRunning = false, updateInterval = 1000) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const intervalRef = useRef(null);

  // Fonction pour calculer le temps écoulé
  const calculateElapsedTime = (startTimestamp) => {
    if (!startTimestamp) return '00:00:00';
    
    try {
      const startTime = new Date(startTimestamp);
      const currentTime = new Date();
      const elapsed = currentTime.getTime() - startTime.getTime();

      if (elapsed < 0) return '00:00:00';

      // Convertir en format HH:MM:SS
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Erreur calcul temps écoulé:', error);
      return '00:00:00';
    }
  };

  // Effet pour gérer le timer
  useEffect(() => {
    // Nettoyer l'intervalle précédent
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && startTime) {
      // Calculer immédiatement le temps initial
      setElapsedTime(calculateElapsedTime(startTime));

      // Démarrer l'intervalle pour les mises à jour
      intervalRef.current = setInterval(() => {
        setElapsedTime(calculateElapsedTime(startTime));
      }, updateInterval);
    } else {
      // Si pas en cours d'exécution, remettre à zéro ou garder la dernière valeur
      if (!startTime) {
        setElapsedTime('00:00:00');
      }
    }

    // Cleanup à la fermeture
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTime, isRunning, updateInterval]);

  // Cleanup au démontage du composant
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return elapsedTime;
};

export default useRealTimeTimer;
