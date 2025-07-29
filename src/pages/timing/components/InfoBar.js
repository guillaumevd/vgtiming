import React from 'react';

const InfoBar = ({ displayed, total }) => {
  if (!displayed) return null;
  return <h2 id="totalTours">{total}</h2>;
};

export default InfoBar;
