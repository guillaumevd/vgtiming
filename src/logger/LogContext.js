// LogContext.js

import React, { createContext, useContext, useState } from 'react';

const LogContext = createContext({
  logMessages: [],
  addLogMessage: () => {},
});

export const useLogContext = () => useContext(LogContext);

export const LogProvider = ({ children }) => {
  const [logMessages, setLogMessages] = useState([]);

  const addLogMessage = (message) => {
    setLogMessages((prevMessages) => {
      const newMessage = `${new Date().toLocaleTimeString()} ${message}`;
      const updatedMessages = [newMessage, ...prevMessages.slice(0, 4)];
      return updatedMessages;
    });
  };

  return (
    <LogContext.Provider value={{ logMessages, addLogMessage }}>
      {children}
    </LogContext.Provider>
  );
};
