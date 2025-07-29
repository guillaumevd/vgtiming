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
  width: 3.5rem;
  height: 100vh;
  background-color: #1d1d1d;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SlickBar = styled.ul`
  list-style: none;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Item = styled(NavLink)`
  text-decoration: none;
  color: var(--white);
  width: 100%;
  padding: 1rem 0;
  display: flex;
  justify-content: center;
  position: relative;

  &.active img,
  &:hover img {
    filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(93deg)
      brightness(103%) contrast(103%);
  }

  img {
    width: 1.2rem;
    height: auto;
    filter: invert(92%) sepia(4%) saturate(1033%) hue-rotate(169deg)
      brightness(78%) contrast(85%);
  }
`;

const Tooltip = styled.span`
  display: none;
  background-color: #1d1d1d;
  color: white;
  text-align: center;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  position: absolute;
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: bold;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: -4px;
    transform: translateY(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: transparent transparent transparent #1d1d1d;
  }
`;

const SettingsWrapper = styled.div`
  position: absolute;
  bottom: 1rem;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Sidebar = (props) => {
  return (
    <Container>
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
