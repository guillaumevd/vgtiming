import React from 'react';

const TitleBar = ({ displayed, title }) => {
  if (!displayed) return null;
  return <h1 id="title">{title}</h1>;
};

export default TitleBar;
