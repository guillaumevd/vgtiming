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
export { default as AppTitleBar } from './TitleBar';

// Race components
export { default as RaceList } from '../pages/races/components/RaceList';
export { default as AddRace } from '../pages/races/components/AddRace';
export { default as RaceEdit } from '../pages/races/components/RaceEdit';

// Timing components
export { default as TimingComponent } from '../pages/timing/components/Timing';
export { default as InfoBar } from '../pages/timing/components/InfoBar';
export { default as TimingTitleBar } from '../pages/timing/components/TitleBar';

// Settings components
export { default as SettingsContainer } from '../pages/settings/components/SettingsContainer';
export { default as GeneralSettings } from '../pages/settings/components/GeneralSettings';
export { default as CrossMgrConnection } from '../pages/settings/components/CrossMgrConnection';
export { default as LogWindow } from '../pages/settings/components/LogWindow';
