const { default: Store } = require('electron-store');

const defaultConfig = {
  outputDir: 'C:/Users/username/Documents/',
  main: {
    displayType: 'grid',
    sortType: 'bestLap',
  },
  list: {
    format: '${person}: ${totalLaps} laps (Last Lap: ${lastLap}, Best: ${bestLap})',
  },
  grid: {
    name: 'Name',
    totalLaps: 'Total',
    lastLap: 'Last Lap',
    bestLap: 'Best Lap',
  },
  names: {
    default: 'P',
    persons: {}
  },
  tracks: {}
};

const schema = {
  main: {
    type: 'object',
    properties: {
      displayType: {
        type: 'string',
        enum: ['grid', 'list'], // authorized values for display type
        default: defaultConfig.main.displayType,
      },
      sortType: {
        type: 'string',
        enum: ['bestLap', 'lastLap'], // authorized values for sort type
        default: defaultConfig.main.sortType,
      },
    },
  },
  names: {
    type: 'object',
    properties: {
      default: {
        type: 'string',
        default: defaultConfig.names.default,
      },
      persons: {
        type: 'object',
        default: defaultConfig.names.persons,
      },
    },
  },
};


const store = new Store({
  defaults: defaultConfig,
  schema: schema
});

module.exports = {
  store: store,
  schema: schema,
};