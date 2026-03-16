// StadiumV2 - Fresh Stadium Booking System
// ==========================================

// Main Admin Page (legacy - combines builder + assignment)
export { default as StadiumAdmin } from './StadiumAdmin';

// NEW: Separated Pages for better flexibility
// ============================================
// LayoutBuilder: Admin creates/edits layouts (no ticket assignment)
// LayoutSelector: Browse and select existing layouts
// EventSeatingManager: Organizers assign tickets to layouts for events
export { LayoutBuilder, LayoutSelector, EventSeatingManager } from './pages';

// Routes Configuration
export { default as StadiumSeatingRoutes, LayoutListPage } from './routes';

// Components (reusable across all pages)
export { default as StadiumCanvas } from './components/StadiumCanvas';
export { default as StadiumBuilder } from './components/StadiumBuilder';
export { default as SeatsCanvas } from './components/SeatsCanvas';
export { default as TicketAssignment } from './components/TicketAssignment';

// Schema & Data
export * from './api/stadiumSchema';
export * from './api/sampleStadiums';
export * from './api/mockData';
export * from './api/ticketData';

// Utilities
export * from './utils/canvasHelpers';
export * from './utils/stadiumRenderer';
