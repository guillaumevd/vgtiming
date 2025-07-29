import React, { useEffect } from 'react';
import { useLogContext } from '../../../logger/LogContext';

const Logger = () => {
  const { logMessages, addLogMessage } = useLogContext();

  useEffect(() => {
    // Add a demo message to show that logging system works
    addLogMessage('Logger initialized - Serial port system removed');
  }, [addLogMessage]);

  return (
    <div className="logger">
      <h3>Logger</h3>
      <ul>
        {logMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default Logger;
