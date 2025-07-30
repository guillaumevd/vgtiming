import React, { useRef, useEffect } from 'react';
import '../css/LogWindow.css';

// Log level constants
const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
};

const LogWindow = ({ logs, onClearLogs }) => {
  const logContentRef = useRef(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContentRef.current) {
      logContentRef.current.scrollTop = logContentRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR');
  };

  const renderLogEntry = (log, index) => (
    <div key={index} className={`log-entry ${log.level}`}>
      <span className="log-timestamp">
        {formatTimestamp(log.timestamp)}
      </span>
      {log.message}
    </div>
  );

  return (
    <div className="log-window-container">
      <div className="log-header">
        <h3 className="log-title">Journal d'activité</h3>
        <button 
          className="clear-button"
          onClick={onClearLogs}
          disabled={logs.length === 0}
        >
          Effacer
        </button>
      </div>
      
      <div className="log-content" ref={logContentRef}>
        {logs.length === 0 ? (
          <div className="empty-log">
            Aucune activité enregistrée
          </div>
        ) : (
          logs.map(renderLogEntry)
        )}
      </div>
    </div>
  );
};

export default LogWindow;
