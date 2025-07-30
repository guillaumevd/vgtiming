import React from "react";
import { NavLink } from "react-router-dom";

// All the svg files
import Home from "../assets/svg/home-solid.svg";
import Timing from "../assets/svg/timing.svg";
import Races from "../assets/svg/races.svg";
import Settings from "../assets/svg/settings.svg";
import News from "../assets/svg/news.svg";
import styled from "styled-components";

const Container = styled.div`
  position: fixed;
  top: 28px;
  left: 0;
  width: 4.5rem;
  height: calc(100vh - 28px);
  background: linear-gradient(180deg, #1a202c 0%, #2d3748 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 2px solid #4a5568;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const LogoWrapper = styled.div`
  padding: 1.5rem 0 1rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #4a5568;
  margin-bottom: 1rem;
`;

const Logo = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const SlickBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding-top: 1rem;
  padding-bottom: 4rem;
`;

const Tooltip = styled.span`
  display: none;
  opacity: 0;
  background: linear-gradient(135deg, #2d3748, #4a5568);
  color: #e2e8f0;
  text-align: center;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  position: absolute;
  top: 50%;
  left: calc(100% + 10px);
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  border: 1px solid #4a5568;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
    border-width: 6px;
    border-style: solid;
    border-color: transparent #2d3748 transparent transparent;
  }
`;

const Item = styled(NavLink)`
  text-decoration: none;
  color: #e2e8f0;
  width: 100%;
  padding: 1.2rem 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  &:hover {
    background: rgba(99, 179, 237, 0.1);
    transform: translateX(2px);
    box-shadow: inset 0 0 15px rgba(99, 179, 237, 0.2);
    
    ${Tooltip} {
      display: block;
      opacity: 1;
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(99, 179, 237, 0.2), rgba(99, 179, 237, 0.1));
    border-left: 6px solid #63b3ed;
    border-radius: 12px;
    transform: translateX(0);
    box-shadow: inset 0 0 20px rgba(99, 179, 237, 0.3);
  }

  &.active img,
  &:hover img {
    filter: brightness(0) saturate(100%) invert(73%) sepia(25%) saturate(986%) hue-rotate(180deg) brightness(98%) contrast(87%);
    transform: scale(1.1);
  }

  img {
    width: 1.6rem;
    height: 1.6rem;
    filter: invert(92%) sepia(4%) saturate(1033%) hue-rotate(169deg) brightness(78%) contrast(85%);
    transition: all 0.3s ease;
  }
`;

const SettingsWrapper = styled.div`
  position: absolute;
  bottom: 1.5rem;
  width: 100%;
  display: flex;
  justify-content: center;
  
  &::before {
    content: "";
    position: absolute;
    top: -1rem;
    left: 0.5rem;
    right: 0.5rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, #4a5568, transparent);
  }
`;

const Sidebar = (props) => {
  return (
    <Container>
      <LogoWrapper>
        <Logo src="/assets/images/icon.png" alt="VG Timing" />
      </LogoWrapper>
      <SlickBar>
        <Item exact="true" to="/">
          <img src={Home} alt="Home" />
          <Tooltip>Home</Tooltip>
        </Item>
        <Item to="/timing">
          <img src={Timing} alt="Timing" />
          <Tooltip>Timing</Tooltip>
        </Item>
        <Item to="/races">
          <img src={Races} alt="Races" />
          <Tooltip>Races</Tooltip>
        </Item>
        <Item to="/news">
          <img src={News} alt="News" />
          <Tooltip>News</Tooltip>
        </Item>
      </SlickBar>
      <SettingsWrapper>
        <Item to="/settings">
          <img src={Settings} alt="Settings" />
          <Tooltip>Settings</Tooltip>
        </Item>
      </SettingsWrapper>
    </Container>
  );
};

export default Sidebar;
