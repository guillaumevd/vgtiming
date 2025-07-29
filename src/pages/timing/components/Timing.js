import React from 'react';

const Timing = ({ config, renderData, millisToTime }) => {

  const renderList = () => {
    return (
      <ul id="listeTours">
        {renderData.map(([person, { totalLaps, lastLaps }]) => {
          const validLastLaps = lastLaps.filter(lap => !isNaN(lap) && isFinite(lap));
          const bestLap = validLastLaps.length > 0 ? Math.min(...validLastLaps) : "-";
          const lastLap = validLastLaps.length > 0 ? validLastLaps[validLastLaps.length - 1] : "-";

          const tourText = config.list.format
            .replace(/\${(\w+)}/g, (_, key) => {
              if (key === "person") {
                return config.names.persons[person] || `${config.names.default} ${person}`;
              } else if (key === "totalLaps") {
                return totalLaps;
              } else if (key === "bestLap") {
                return bestLap !== "-" ? millisToTime(bestLap) : "-";
              } else if (key === "lastLap") {
                return lastLap !== "-" ? millisToTime(lastLap) : "-";
              } else {
                return "";
              }
            });

          return <li key={person}>{tourText}</li>;
        })}
      </ul>
    );
  };

  const renderGrid = () => {
    return (
      <table id="listeToursTable">
        <thead>
          <tr>
            {[config.grid.name, config.grid.totalLaps, config.grid.lastLap, config.grid.bestLap].map((text, index) => (
              <th key={index}>{text}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderData.map(([person, { totalLaps, lastLaps }]) => {
            const validLastLaps = lastLaps.filter(lap => !isNaN(lap) && isFinite(lap));
            const bestLap = validLastLaps.length > 0 ? Math.min(...validLastLaps) : "-";
            const lastLap = validLastLaps.length > 0 ? validLastLaps[validLastLaps.length - 1] : "-";

            return (
              <tr key={person}>
                <td>{config.names.persons[person] || `${config.names.default} ${person}`}</td>
                <td>{totalLaps}</td>
                <td>{lastLap !== "-" ? millisToTime(lastLap) : "-"}</td>
                <td>{bestLap !== "-" ? millisToTime(bestLap) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div id="listeToursContainer">
      {config.main.displayType === "list" && renderList()}
      {config.main.displayType === "grid" && renderGrid()}
    </div>
  );
};

export default Timing;
