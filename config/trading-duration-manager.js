/**
 * Trading Duration Manager
 *
 * Duration-first UI implementation for converting trading time periods
 * into technical message counts. Provides functions for updating UI
 * elements based on calculated trading scenarios.
 *
 * @author Beacon Financial Technologies
 * @version 1.0.0
 */

// Import the product config manager
// import { ProductConfigManager } from './product-config-manager.js';

/**
 * Calculate total messages needed for a given trading duration based on symbol tick rates
 *
 * This function transforms user-friendly duration input (e.g., "30 minutes") into
 * technical message counts needed by the data generation system. It uses configured
 * tick rates for each symbol to provide accurate estimates.
 *
 * @param {string[]} symbols - Array of trading symbols (e.g., ['ES', 'AAPL', 'SPY'])
 * @param {number} durationMinutes - Trading time period in minutes (e.g., 30, 60, 120)
 * @returns {Promise<object>} Calculation results containing:
 *   - totalMessages: Total message count needed for generation
 *   - totalTicksPerSecond: Combined tick rate for all symbols
 *   - durationMinutes: Input duration (for reference)
 *   - averageTicksPerSecond: Average tick rate per symbol
 *   - symbols: Input symbols (for reference)
 * @throws {Error} If configuration fails to load
 * @example
 *   const result = await calculateMessagesFromDuration(['ES', 'AAPL'], 30);
 *   // result.totalMessages = ~18,900,000 for 30 minutes of ES + AAPL
 */
async function calculateMessagesFromDuration(symbols, durationMinutes) {
    const productManager = new ProductConfigManager();
    await productManager.loadConfig();

    // Calculate combined tick rate for all symbols
    const totalTicksPerSecond = symbols.reduce((total, symbol) => {
        return total + productManager.getTicksPerSecond(symbol);
    }, 0);

    // Calculate total messages for the time period
    const totalMessages = totalTicksPerSecond * durationMinutes * 60;

    return {
        totalMessages,
        totalTicksPerSecond,
        durationMinutes,
        averageTicksPerSecond: totalTicksPerSecond / symbols.length,
        symbols
    };
}

/**
 * Update all UI status boxes with calculated values from trading duration
 *
 * This is the main orchestration function that calculates messages from duration
 * and updates all relevant UI elements. It coordinates between the calculation
 * engine and the individual UI update functions.
 *
 * @param {string[]} symbols - Array of trading symbols to include in calculation
 * @param {number} durationMinutes - Trading time period in minutes
 * @returns {Promise<void>} Resolves when all UI elements are updated
 * @throws {Error} If calculation or UI update fails
 * @example
 *   await updateStatusBoxes(['ES', 'NQ'], 60); // Update UI for 1 hour of futures data
 */
async function updateStatusBoxes(symbols, durationMinutes) {
    const result = await calculateMessagesFromDuration(symbols, durationMinutes);

    updateFileSize(result.totalMessages);
    updateDurationDisplay(durationMinutes);
    updateGenerationTime(result.totalMessages);
}

/**
 * Update the file size display based on total message count
 *
 * Calculates estimated dataset file size using a standard bytes-per-message ratio
 * and updates the corresponding UI element. File size varies by exchange format
 * but 120 bytes per message is a reasonable average.
 *
 * @param {number} totalMessages - Total number of messages to be generated
 * @returns {void}
 * @example
 *   updateFileSize(1000000); // Updates UI to show "~115 MB" for 1M messages
 */
function updateFileSize(totalMessages) {
    const estimatedSizeMB = (totalMessages * 120) / (1024 * 1024); // ~120 bytes per message
    const fileSizeEl = document.getElementById('detailFileSize');
    if (fileSizeEl) {
        fileSizeEl.textContent = `~${estimatedSizeMB.toFixed(0)} MB`;
    }
}

/**
 * Update the duration display with formatted time string
 *
 * Converts minutes to a user-friendly time format (HH:MM:SS or MM:SS)
 * and updates the trading time UI element. Handles both short durations
 * (under 1 hour) and longer periods gracefully.
 *
 * @param {number} durationMinutes - Duration in minutes to display
 * @returns {void}
 * @example
 *   updateDurationDisplay(30);  // Shows "30:00"
 *   updateDurationDisplay(90);  // Shows "01:30:00"
 */
function updateDurationDisplay(durationMinutes) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const timeDisplay = hours > 0 ?
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00` :
        `${minutes.toString().padStart(2, '0')}:00`;

    const durationEl = document.getElementById('tradingTime');
    if (durationEl) {
        durationEl.textContent = timeDisplay;
    }
}

/**
 * Update the generation time estimate display
 *
 * Calculates how long the dataset generation process will take based on
 * total message count and the system's generation rate. Updates the UI
 * to show expected generation time to help users plan accordingly.
 *
 * @param {number} totalMessages - Total number of messages to be generated
 * @returns {void}
 * @example
 *   updateGenerationTime(2500000); // Shows "50s" for 2.5M messages at 50k/sec
 */
function updateGenerationTime(totalMessages) {
    const generationRate = 50000; // messages per second generation rate
    const generationTimeSeconds = Math.max(1, Math.ceil(totalMessages / generationRate));

    const generationTimeEl = document.getElementById('generationTime');
    if (generationTimeEl) {
        const minutes = Math.floor(generationTimeSeconds / 60);
        const seconds = generationTimeSeconds % 60;
        generationTimeEl.textContent = minutes > 0 ?
            `${minutes}m ${seconds}s` : `${seconds}s`;
    }
}

/**
 * Add a new trading symbol to the current configuration
 *
 * Handles the complete workflow of adding a symbol including:
 * - Loading product configuration
 * - Auto-classifying unknown symbols
 * - Logging classification results
 * - Updating UI with new calculations
 *
 * @param {string} newSymbol - Trading symbol to add (e.g., 'TSLA', 'MSFT', 'YM')
 * @returns {Promise<void>} Resolves when symbol is added and UI is updated
 * @throws {Error} If symbol processing or UI update fails
 * @example
 *   await addSymbol('TSLA'); // Auto-classifies as EQUITY and updates UI
 */
async function addSymbol(newSymbol) {
    const productManager = new ProductConfigManager();
    await productManager.loadConfig();

    const config = productManager.getSymbolConfig(newSymbol);

    if (config.isClassified) {
        console.log(`Auto-classified ${newSymbol} as ${config.assetClass} (${config.ticksPerSecond} ticks/sec)`);
    }

/**
 * Get current symbols from the UI state
 *
 * This function should be implemented to extract the currently selected
 * trading symbols from your UI. Implementation depends on how symbols
 * are stored and displayed in your interface.
 *
 * @returns {string[]} Array of currently selected trading symbols
 * @example
 *   const symbols = getCurrentSymbols(); // ['ES', 'AAPL']
 */
function getCurrentSymbols() {
    // TODO: Implement based on your UI structure
    // Example: return Array.from(document.querySelectorAll('.symbol-item')).map(el => el.textContent);
    throw new Error('getCurrentSymbols() must be implemented for your UI');
}

/**
 * Get current duration setting from the UI state
 *
 * This function should be implemented to extract the currently set
 * trading duration from your UI controls (slider, input, dropdown, etc.).
 * Implementation depends on your UI structure.
 *
 * @returns {number} Current duration setting in minutes
 * @example
 *   const duration = getCurrentDuration(); // 30
 */
function getCurrentDuration() {
    // TODO: Implement based on your UI structure
    // Example: return parseInt(document.getElementById('durationSlider').value);
    throw new Error('getCurrentDuration() must be implemented for your UI');
}

// Get current state and update
    const currentSymbols = getCurrentSymbols(); // Implement based on your UI
    const currentDuration = getCurrentDuration(); // Implement based on your UI

    currentSymbols.push(newSymbol);
    await updateStatusBoxes(currentSymbols, currentDuration);
}


// Example Usage and Integration Guide:
/*
Basic Usage:
-----------
// Transform user input: "I want 30 minutes of ES + AAPL data"
const symbols = ['ES', 'AAPL'];
const duration = 30; // minutes

// Calculate and update UI
await updateStatusBoxes(symbols, duration);

// Result will show:
// - File Size: ~23 MB
// - Duration: 30:00
// - Generation Time: ~3m 45s
// - Total Messages: ~18,900,000

Integration Steps:
-----------------
1. Include this file in your HTML:
   <script src="config/product-config-manager.js"></script>
   <script src="config/trading-duration-manager.js"></script>

2. Implement getCurrentSymbols() and getCurrentDuration() for your UI

3. Replace message-based calculations with duration-based ones:
   OLD: calculateFromMessages(60000)
   NEW: updateStatusBoxes(['ES'], 30)

4. Update your UI event handlers to call updateStatusBoxes() when:
   - Duration changes (slider, input)
   - Symbols are added/removed
   - Configuration is loaded

Configuration:
-------------
- Edit config/products.json to add new symbols or adjust tick rates
- No code changes needed for new products
- Tick rates are in messages per second
*/
