/**
 * Beacon Trading Duration System
 *
 * Modern ES6 module system for duration-first trading scenario creation.
 * Provides services for product configuration, duration calculations, and UI management.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

// Main Services
export { ProductConfigService } from './services/ProductConfigService.js';
export { TradingDurationService } from './services/TradingDurationService.js';

// Utility Functions
export {
    calculateMessagesFromDuration,
    calculateFileSize,
    calculateGenerationTime,
    formatDurationDisplay,
    parseDurationString
} from './utils/durationCalculator.js';

export {
    updateFileSizeDisplay,
    updateDurationDisplay,
    updateGenerationTimeDisplay,
    updateAllocationDisplay,
    updateAllStatusDisplays,
    getCurrentUIValues
} from './utils/domUpdater.js';

// Constants and Types
export * from './types/constants.js';

// Quick Setup Function for Legacy Integration
import { TradingDurationService } from './services/TradingDurationService.js';

export const createTradingDurationManager = async (configPath) => {
    const service = new TradingDurationService();
    await service.initialize(configPath);
    return service;
};

/**
 * Example Integration:
 *
 * // Modern ES6 imports
 * import { TradingDurationService, DURATION_PRESETS } from '/src/index.js';
 *
 * // Initialize service
 * const tradingService = new TradingDurationService();
 * await tradingService.initialize();
 *
 * // Update scenario
 * await tradingService.updateTradingScenario(['ES', 'AAPL'], DURATION_PRESETS.ONE_HOUR);
 *
 * // Or quick setup for legacy code
 * const manager = await createTradingDurationManager('/src/config/products.json');
 * await manager.updateTradingScenario(['ES'], 30);
 */
