import React, { useEffect, useState } from 'react';

import Timing from './components/Timing';
import { timeToMillis, millisToTime } from '../../utils/timeUtils';
import { sortData } from '../../utils/dataUtils';
import { DEMO_TIMING_DATA, SORT_TYPES } from '../../constants';

const VGTimingTracker = () => {
  const [config, setConfig] = useState(null);
  const [data, setData] = useState({});
  const [renderData, setRenderData] = useState([]);
  
  useEffect(() => {
    async function getConfigData() {
      return window.Store.get();
    }

    const fetchData = async () => {
      const fetchedConfig = await getConfigData();
      setConfig(fetchedConfig);

      // Serial port system removed - using demo data for now
      console.log('VG-Timing system ready - Serial port functionality removed');
      
      // Use demo data from constants
      setData(DEMO_TIMING_DATA);
      updateUI(fetchedConfig.main.sortType);
    };

    fetchData();
  }, []);

  const updateUI = (sortType) => {
    setRenderData(sortData(data, sortType));
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Timing config={config} renderData={renderData} millisToTime={millisToTime} />
    </div>
  );
};

export default VGTimingTracker;
