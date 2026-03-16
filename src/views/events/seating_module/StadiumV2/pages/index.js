/**
 * Pages Index - Export all page-level components
 * 
 * These are the main route components:
 * - LayoutBuilder: Admin creates/edits layouts (no ticket assignment)
 * - LayoutSelector: Browse and select existing layouts
 * - EventSeatingManager: Organizers assign tickets to layouts for events
 */

export { default as LayoutBuilder } from './LayoutBuilder';
export { default as LayoutSelector } from './LayoutSelector';
export { default as EventSeatingManager } from './EventSeatingManager';
