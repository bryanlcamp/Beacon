'use strict';

// ============================================================================
// BEACON AUTHOR - CORE APPLICATION ARCHITECTURE
// ============================================================================

/**
 * Main Application State
 * Centralized state management for the entire Author application
 */
const BeaconAuthor = {
    // Application configuration
    config: {
        IS_DEMO_MODE: true,
        version: '2.0.0'
    },

    // Application state
    state: {
        productPercentages: new Map(),
        hasUnsavedChanges: false,
        currentFileName: '',
        validationConfig: null
    },

    // Module registry
    modules: {}
};

// Expose BeaconAuthor globally for debugging
window.BeaconAuthor = BeaconAuthor;
