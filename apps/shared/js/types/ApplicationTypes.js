/**
 * @fileoverview TypeScript-style interfaces for Beacon HFT Platform
 * Provides type safety and documentation for all data structures
 * @author Beacon Development Team
 * @version 1.0.0
 */

/**
 * Symbol configuration for market data generation
 * @typedef {Object} SymbolConfig
 * @property {string} symbol - Trading symbol (e.g., "AAPL", "MSFT")
 * @property {number} percentage - Percentage of total messages (0-100)
 * @property {PriceRange} priceRange - Price range configuration
 * @property {QuantityRange} quantityRange - Quantity range configuration
 * @property {number} spreadPercentage - Bid-ask spread percentage
 * @property {number} tradeProbability - Probability of generating trade vs order
 * @property {number} createdAt - Timestamp when symbol was added
 * @property {number} lastModified - Timestamp when symbol was last modified
 */

/**
 * Price range configuration with weighting
 * @typedef {Object} PriceRange
 * @property {number} min - Minimum price
 * @property {number} max - Maximum price  
 * @property {number} weight - Distribution weight (0.1-2.0)
 */

/**
 * Quantity range configuration with weighting
 * @typedef {Object} QuantityRange
 * @property {number} min - Minimum quantity
 * @property {number} max - Maximum quantity
 * @property {number} weight - Distribution weight (0.1-2.0)
 */

/**
 * Application configuration
 * @typedef {Object} AppConfig
 * @property {string} appName - Application name
 * @property {string} friendlyName - User-friendly display name
 * @property {string} version - Application version
 * @property {NavigationItem[]} navigation - Navigation configuration
 * @property {boolean} debugMode - Enable debug logging
 */

/**
 * Navigation item configuration
 * @typedef {Object} NavigationItem
 * @property {string} name - Display name
 * @property {string} href - URL path
 * @property {boolean} current - Whether this is the current page
 * @property {string} [icon] - Optional icon class
 */

/**
 * Component lifecycle interface
 * @typedef {Object} Component
 * @property {Function} init - Initialize component
 * @property {Function} render - Render component to DOM
 * @property {Function} destroy - Clean up component
 * @property {Function} [update] - Update component state
 */

/**
 * Event system interface
 * @typedef {Object} EventEmitter
 * @property {Function} on - Subscribe to event
 * @property {Function} off - Unsubscribe from event  
 * @property {Function} emit - Emit event
 * @property {Function} once - Subscribe to event once
 */

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 * @property {string[]} [warnings] - Array of warning messages
 */

// Export types for IDE support (JSDoc + modern editors provide IntelliSense)
export const Types = {
    SymbolConfig: /** @type {SymbolConfig} */ ({}),
    PriceRange: /** @type {PriceRange} */ ({}),
    QuantityRange: /** @type {QuantityRange} */ ({}),
    AppConfig: /** @type {AppConfig} */ ({}),
    NavigationItem: /** @type {NavigationItem} */ ({}),
    Component: /** @type {Component} */ ({}),
    EventEmitter: /** @type {EventEmitter} */ ({}),
    ValidationResult: /** @type {ValidationResult} */ ({})
};
