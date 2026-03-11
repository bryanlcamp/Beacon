/**
 * Dataset Generator - Application Constants
 * Centralized configuration and constants
 */

export const CONSTANTS = {
  // Application Config
  APP_NAME: 'Dataset Generator',
  VERSION: '1.0.0',
  
  // Form Validation
  MESSAGE_COUNT: {
    MIN: 1000, // Updated to enforce minimum from config
    MAX: 999999999,
    INCREMENT: 500,
    DEFAULT_PLACEHOLDER: 'Msg Cnt',
    RED_ADORNER_THRESHOLD: 1000 // Show red adorner below this value
  },
  
  SYMBOL_INPUT: {
    MAX_LENGTH: 10,
    PATTERN: /^[A-Za-z0-9\-]+$/,
    DEFAULT_PLACEHOLDER: 'Enter a Symbol'
  },
  
  PERCENTAGE: {
    MIN: 1,
    MAX: 100,
    PRECISION: 1
  },
  
  // Exchanges
  EXCHANGES: {
    NASDAQ: 'NASDAQ',
    NYSE: 'NYSE',
    CME: 'CME'
  },
  
  DEFAULT_EXCHANGE: 'NASDAQ',
  
  // Adorner States
  ADORNERS: {
    RED: 'red',
    GREEN: 'green',
    BLUE: 'blue'
  },
  
  // Animation Durations
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    JIGGLE: 500
  },
  
  // DataCard Parameters
  DATACARD_PARAMS: {
    PRICE_RANGE: {
      MIN: 0.01,
      MAX: 1000,
      DEFAULT_MIN: 50,
      DEFAULT_MAX: 150
    },
    QUANTITY_RANGE: {
      MIN: 1,
      MAX: 10000,
      DEFAULT_MIN: 100,
      DEFAULT_MAX: 1000
    },
    VOLATILITY: {
      MIN: 0.1,
      MAX: 2.0,
      DEFAULT: 0.5,
      STEP: 0.1
    },
    TREND: {
      MIN: -1.0,
      MAX: 1.0,
      DEFAULT: 0.0,
      STEP: 0.1
    }
  },
  
  // Notification Types
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  
  // Backend Endpoints
  API_ENDPOINTS: {
    GENERATE: '/api/generate',
    CONFIGS: '/api/configs',
    SAVE_CONFIG: '/api/config/save',
    LOAD_CONFIG: '/api/config/load'
  },
  
  // Demo Mode Detection
  DEMO_HOSTS: [
    'github.io',
    'githubusercontent.com'
  ],
  
  // CSS Classes
  CSS_CLASSES: {
    DEMO_MODE: 'demo-mode',
    JIGGLE: 'jiggle',
    LOADING: 'loading',
    COLLAPSED: 'collapsed',
    HAS_VALUE: 'has-value',
    PLACEHOLDER_TEXT: 'placeholder-text',
    USER_TEXT: 'user-text'
  },
  
  // Event Names
  EVENTS: {
    // App Events
    APP_READY: 'app:ready',
    DEMO_MODE_DETECTED: 'app:demoMode',
    
    // Symbol Events
    SYMBOL_ADDED: 'symbol:added',
    SYMBOL_REMOVED: 'symbol:removed',
    SYMBOL_UPDATED: 'symbol:updated',
    ALLOCATION_CHANGED: 'allocation:changed',
    
    // Config Events
    CONFIG_LOADED: 'config:loaded',
    CONFIG_SAVED: 'config:saved',
    CONFIG_CREATED: 'config:created',
    
    // Validation Events
    VALIDATION_SUCCESS: 'validation:success',
    VALIDATION_ERROR: 'validation:error',
    
    // Form Events
    ADORNER_CHANGED: 'adorner:changed',
    INPUT_CHANGED: 'input:changed',
    
    // DataCard Events
    DATACARD_COLLAPSED: 'datacard:collapsed',
    DATACARD_EXPANDED: 'datacard:expanded'
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    INVALID_SYMBOL: 'Symbol can only contain letters, numbers, and hyphens',
    SYMBOL_EXISTS: 'Symbol already exists in the dataset',
    SYMBOL_REQUIRED: 'Please enter a symbol',
    MESSAGE_COUNT_REQUIRED: 'Message count is required',
    MESSAGE_COUNT_MIN: 'Message count must be at least 1',
    EXCHANGE_REQUIRED: 'Please select an exchange',
    NO_SYMBOLS: 'Please add at least one symbol',
    ALLOCATION_INVALID: 'Total allocation must equal 100%',
    GENERATION_FAILED: 'Dataset generation failed',
    CONFIG_SAVE_FAILED: 'Failed to save configuration',
    CONFIG_LOAD_FAILED: 'Failed to load configuration'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    SYMBOL_ADDED: 'Symbol added successfully',
    SYMBOL_REMOVED: 'Symbol removed',
    CONFIG_SAVED: 'Configuration saved',
    CONFIG_LOADED: 'Configuration loaded',
    DATASET_GENERATED: 'Dataset generated successfully'
  }
};

// Utility functions for constants
export const UTILS = {
  // Check if running in demo mode
  isDemoMode() {
    const hostname = window.location.hostname.toLowerCase();
    return CONSTANTS.DEMO_HOSTS.some(host => hostname.includes(host));
  },
  
  // Format percentage with proper precision
  formatPercentage(value, precision = CONSTANTS.PERCENTAGE.PRECISION) {
    return parseFloat(value).toFixed(precision);
  },
  
  // Validate symbol format
  isValidSymbol(symbol) {
    return CONSTANTS.SYMBOL_INPUT.PATTERN.test(symbol) && 
           symbol.length <= CONSTANTS.SYMBOL_INPUT.MAX_LENGTH;
  },
  
  // Generate unique ID
  generateId() {
    return `dg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Debounce function
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Clamp value between min and max
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
};