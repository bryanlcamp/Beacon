/**
 * Trading Constants and Type Definitions
 *
 * Centralized constants and type information for the trading duration system
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

// Asset Classes
export const ASSET_CLASSES = {
    FUTURES: 'FUTURES',
    EQUITY: 'EQUITY'
};

// Supported Exchanges
export const EXCHANGES = {
    CME: 'CME',
    NYSE: 'NYSE',
    NASDAQ: 'NASDAQ'
};

// Default Configuration Values
export const DEFAULTS = {
    BYTES_PER_MESSAGE: 120,
    GENERATION_RATE_PER_SECOND: 50000,
    FALLBACK_TICKS_PER_SECOND: 2000,
    MAX_REASONABLE_DURATION_MINUTES: 1440 // 24 hours
};

// UI Element IDs
export const UI_ELEMENTS = {
    FILE_SIZE: 'detailFileSize',
    TRADING_TIME: 'tradingTime',
    GENERATION_TIME: 'generationTime',
    ALLOCATION_STATUS: 'allocationStatus',
    ALLOCATION_STATUS_BOX: 'allocationStatusBox'
};

// Allocation Status Colors
export const ALLOCATION_COLORS = {
    PERFECT: {
        background: 'rgba(107, 182, 65, 0.1)',
        border: 'rgba(107, 182, 65, 0.3)',
        text: '#6bb641'
    },
    OVER: {
        background: 'rgba(255, 88, 88, 0.1)',
        border: 'rgba(255, 88, 88, 0.3)',
        text: '#ff5858'
    },
    CLOSE: {
        background: 'rgba(255, 145, 77, 0.1)',
        border: 'rgba(255, 145, 77, 0.3)',
        text: '#ff914d'
    },
    UNDER: {
        background: 'rgba(255, 88, 88, 0.1)',
        border: 'rgba(255, 88, 88, 0.3)',
        text: '#ff5858'
    }
};

// Common Duration Presets (in minutes)
export const DURATION_PRESETS = {
    QUICK_TEST: 15,
    THIRTY_MINUTES: 30,
    ONE_HOUR: 60,
    TWO_HOURS: 120,
    HALF_DAY: 240,
    FULL_DAY: 480
};

// Validation Rules
export const VALIDATION = {
    MIN_SYMBOLS: 1,
    MAX_SYMBOLS: 10,
    MIN_DURATION_MINUTES: 1,
    MAX_DURATION_MINUTES: 1440,
    WARNING_DURATION_MINUTES: 240 // Warn above 4 hours
};
