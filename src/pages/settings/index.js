import React, { useEffect } from 'react';
import SettingsContainer from './components/SettingsContainer';
import { useLogContext } from '../../logger/LogContext';

const Settings = (props) => {
  const { addLogMessage } = useLogContext();

  useEffect(() => {
    addLogMessage('Settings page accessed', 'info');
  }, []); // Pas de dépendance pour éviter la boucle

  return <SettingsContainer />;
}
 
export default Settings;
