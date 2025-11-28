/**
 * StadiumBuilder - Folder-Style Hierarchical Stadium Layout Editor
 * 
 * REFACTORED: This file now re-exports from the modular StadiumBuilder folder.
 * 
 * The StadiumBuilder has been split into:
 * - ./StadiumBuilder/index.jsx - Main component
 * - ./StadiumBuilder/FolderItem.jsx - Reusable folder card component
 * - ./StadiumBuilder/StandEditPanel.jsx - Stand geometry editor
 * - ./StadiumBuilder/RowEditPanel.jsx - Row/seats editor
 * - ./StadiumBuilder/useStadiumData.js - Custom hook for CRUD operations
 * - ./StadiumBuilder/constants.js - Shared constants & utilities
 * 
 * Schema: Stadium -> Stands -> Tiers -> Sections -> Rows -> Seats
 */

export { default } from './StadiumBuilder/index';

// Also export sub-components for advanced use cases
export { default as FolderItem } from './StadiumBuilder/FolderItem';
export { default as StandEditPanel } from './StadiumBuilder/StandEditPanel';
export { default as RowEditPanel } from './StadiumBuilder/RowEditPanel';
export { useStadiumData } from './StadiumBuilder/useStadiumData';
export * from './StadiumBuilder/constants';
