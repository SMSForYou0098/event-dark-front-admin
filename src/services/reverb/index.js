// ============================================
// FILE: src/services/reverb/index.js
// Reverb Service - Main Export File
// Centralized exports for all Reverb functionality
// ============================================

// Export Echo instance
export { default as echo } from './echo';
export { default } from './echo';

// Export React hooks
export { useReverb, useMultipleChannels, useEventSeats } from './useReverb';

// Export examples (optional, for reference)
export { default as SampleReverbExample } from './examples/SampleReverb';
