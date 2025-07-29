/**
 * Centralized component exports for VG-Timing
 */

// Main pages
export { default as Home } from '../pages/home';
export { default as Timing } from '../pages/timing';
export { default as Races } from '../pages/races';
export { default as News } from '../pages/news';
export { default as Settings } from '../pages/settings';

// Layout components
export { default as Sidebar } from '../Sidebar';

// Race components
export { default as RaceList } from '../pages/races/components/RaceList';
export { default as AddRace } from '../pages/races/components/AddRace';
export { default as RaceEdit } from '../pages/races/components/RaceEdit';
export { default as RaceItem } from '../pages/races/components/RaceItem';

// Timing components
export { default as TimingComponent } from '../pages/timing/components/Timing';
export { default as InfoBar } from '../pages/timing/components/InfoBar';
export { default as TitleBar } from '../pages/timing/components/TitleBar';

// Settings components
export { default as Config } from '../pages/settings/components/config';
export { default as Logger } from '../pages/settings/components/logger';
