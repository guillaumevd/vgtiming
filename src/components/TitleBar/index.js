import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const TitleBarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 28px;
  background: #0f1419;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 9999;
  -webkit-app-region: drag;
`;

const TitleText = styled.div`
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
`;

const WindowControls = styled.div`
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button`
  width: 28px;
  height: 20px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  border-radius: 3px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.close:hover {
    background: #e53e3e;
    color: white;
  }

  &.maximize:hover {
    background: rgba(99, 179, 237, 0.2);
  }

  &.minimize:hover {
    background: rgba(255, 193, 7, 0.2);
  }
`;

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Vérifier l'état initial de la fenêtre
    if (window.windowControls) {
      window.windowControls.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    if (window.windowControls) {
      window.windowControls.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.windowControls) {
      window.windowControls.maximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.windowControls) {
      window.windowControls.close();
    }
  };

  return (
    <TitleBarContainer>
      <TitleText>VG-Timing</TitleText>
      <WindowControls>
        <ControlButton className="minimize" onClick={handleMinimize} title="Minimiser">
          &#8212;
        </ControlButton>
        <ControlButton className="maximize" onClick={handleMaximize} title={isMaximized ? "Restaurer" : "Maximiser"}>
          {isMaximized ? "◱" : "☐"}
        </ControlButton>
        <ControlButton className="close" onClick={handleClose} title="Fermer">
          ✕
        </ControlButton>
      </WindowControls>
    </TitleBarContainer>
  );
};

export default TitleBar;
