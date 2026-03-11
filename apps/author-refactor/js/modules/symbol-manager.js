/**
 * Symbol Management Module
 * Handles adding and managing trading symbols/products
 */

class SymbolManager {
    constructor() {
        this.symbolInput = document.getElementById('symbolInput');
        this.addButton = document.getElementById('addSymbol');
        this.exchangeSelect = document.getElementById('exchangeSelect');
        // Don't get container during initialization - get it when needed
        this.container = null;
        this.emptyMessage = document.getElementById('emptyProductsMessage');

        this.init();
    }

    getContainer() {
        // Get container when needed, in case components loaded after initialization
        if (!this.container) {
            this.container = document.getElementById('datacardContainer');
        }
        return this.container;
    }

    init() {

        if (!this.symbolInput || !this.addButton) {
            console.warn('Symbol Manager: Required form elements not found');
            return;
        }

        this.setupEventListeners();
        this.updateButtonState();
    }

    setupEventListeners() {
        // Input validation and button state
        this.symbolInput.addEventListener('input', () => this.updateButtonState());

        // Prevent invalid characters from ever being entered
        this.symbolInput.addEventListener('beforeinput', (e) => {
            // Allow deletions (deleteContentBackward, deleteContentForward, etc.)
            if (e.inputType && e.inputType.startsWith('delete')) return;
            // Allow history undo/redo
            if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') return;

            // Check the data being inserted (typed or pasted)
            if (e.data && /[^a-zA-Z/.]/.test(e.data)) {
                e.preventDefault();
            }
        });

        this.symbolInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.addButton.disabled) {
                e.preventDefault();
                this.addSymbol();
            }
        });

        // Add button click
        this.addButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.addSymbol();
        });
    }

    updateButtonState() {
        const hasValue = this.symbolInput.value.trim().length > 0;
        const symbol = this.symbolInput.value.trim().toUpperCase();
        const isDuplicate = hasValue && this.isSymbolDuplicate(symbol);

        this.addButton.disabled = !hasValue || isDuplicate;

        // Style the input based on duplicate state
        if (isDuplicate) {
            this.symbolInput.style.cssText = `
                color: #ff4444 !important;
                font-weight: bold !important;
                font-style: italic !important;
            `;
        } else {
            this.symbolInput.style.cssText = '';
        }

        if (hasValue && !isDuplicate) {
            this.addButton.style.cssText = `
                opacity: 1 !important;
                background: #6bb6ff !important;
                cursor: pointer !important;
                color: white !important;
                font-weight: bold !important;
            `;
        } else {
            this.addButton.style.cssText = `
                opacity: 0.5 !important;
                background: rgba(107, 182, 255, 0.3) !important;
                color: rgba(255,255,255,0.5) !important;
                font-weight: bold !important;
            `;
        }
    }

    isSymbolDuplicate(symbol) {
        const container = this.getContainer();
        if (!container) return false;
        return !!container.querySelector(`[data-symbol="${CSS.escape(symbol)}"]`);
    }

    addSymbol() {
        const symbol = this.symbolInput.value.trim().toUpperCase();

        if (!symbol) {
            console.warn('Please enter a symbol');
            return;
        }

        // Check for duplicates
        const container = this.getContainer();
        if (!container) return false;
        const existing = container.querySelector(`[data-symbol="${symbol}"]`);
        if (existing) {
            console.warn(`${symbol} already exists!`);
            return;
        }

        const exchange = this.exchangeSelect?.value || 'CME';
        this.createSymbolCard(symbol, exchange);
        this.clearInput();
        this.updateDisplay();

        // Dispatch symbolAdded so global allocation % updates
        document.dispatchEvent(new CustomEvent('symbolAdded', { detail: { symbol } }));
    }

    createSymbolCard(symbol, exchange) {
        // Use detailed datacard creation instead of dummy card
        const card = this.createDetailedDatacard(symbol, exchange);

        if (!card || !(card instanceof Node)) {
            console.error('createDetailedDatacard did not return a valid Node:', card);
            return null;
        }

        const container = this.getContainer();

        if (!container) {
            console.error('datacardContainer not found! Components might not be loaded yet.');
            return null;
        }

        container.appendChild(card);
        return card;
    }

    // Modular Template Functions
    createDatacardHeaderTemplate(symbol, exchange, percentage) {
        return `
            <div class="datacard-header">
                <div class="datacard-symbol-info">
                    <span class="symbol-display">
                        <span class="exchange-prefix">${exchange}:</span>
                        <span class="symbol-name">${symbol}</span>
                    </span>
                </div>
                <div class="datacard-allocation-center" onclick="this.querySelector('.percentage-input-hidden').focus()">
                    <div class="allocation-percentage-display">${percentage.value}%</div>
                    <input type="number" class="percentage-input-hidden" min="${percentage.min}" max="${percentage.max}" step="${percentage.step}" value="${percentage.value}">
                </div>
                <div class="datacard-controls">
                    <button class="collapse-button" aria-label="Collapse ${symbol}">▼</button>
                    <button class="red-remove-button" aria-label="Remove ${symbol}">×</button>
                </div>
            </div>
        `;
    }

    createPricingModeTemplate() {
        return `
            <div class="pricing-mode-container">
                <span class="pricing-mode-label">Price Mode:</span>
                <button class="pricing-mode-toggle-button">
                    <span class="mode-text">Spread</span>
                </button>
            </div>
        `;
    }

    createRangeControlTemplate(label, sliderAttrs, idOverride = null, symbolSuffix = '') {
        const baseId = idOverride || (label.toLowerCase().replace(/[^a-z0-9]/g, '') + symbolSuffix);

        // Determine the unit/suffix for the value display
        let valueUnit = '';
        if (label.includes('%') || label === 'Spread' || label === 'Vol' || label === 'Volatility' || label === 'Vol %' || label.includes('Weight')) {
            valueUnit = '%';
        } else if (label.includes('Price')) {
            valueUnit = '$';
        }

        // Special handling for Volatility and Trend controls with micro-periods
        if (label === 'Volatility' || label === 'Vol %' || label === 'Trend' || label === 'Trend %') {
            const dataType = (label === 'Trend' || label === 'Trend %') ? 'trend' : 'volatility';
            return `
                <div class="range-control half-width">
                    <div class="range-label">${label}</div>
                    <div class="range-input-group">
                        <input type="range" id="${baseId}" class="range-input" min="${sliderAttrs.min}" max="${sliderAttrs.max}" step="${sliderAttrs.step}" value="${sliderAttrs.value}">
                        <span class="periods-indicator disabled" data-type="${dataType}" onclick="togglePeriodsDropdown(this)" title="Add specific times of volatility." style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); z-index: 3;">0</span>
                        <input type="number" class="range-number-input" min="${sliderAttrs.min}" max="${sliderAttrs.max}" step="${sliderAttrs.step}" value="${sliderAttrs.value}" title="Volatility Spikes.">
                    </div>
                </div>
            `;
        }

        // Regular controls - simple datacard structure
        return `
            <div class="range-control half-width">
                <div class="range-label">${label}</div>
                <div class="range-input-group">
                    <input type="range" id="${baseId}" class="range-input" min="${sliderAttrs.min}" max="${sliderAttrs.max}" step="${sliderAttrs.step}" value="${sliderAttrs.value}">
                    <input type="number" class="range-number-input" min="${sliderAttrs.min}" max="${sliderAttrs.max}" step="${sliderAttrs.step}" value="${sliderAttrs.value}">
                </div>
            </div>
        `;
    }

    createRangeControlGroupTemplate(control1Label, control1Attrs, control1Id = null, control2Label, control2Attrs, control2Id = null, symbolSuffix = '') {
        const template1 = this.createRangeControlTemplate(control1Label, control1Attrs, control1Id, symbolSuffix);
        const template2 = this.createRangeControlTemplate(control2Label, control2Attrs, control2Id, symbolSuffix);
        return `
            <div class="range-control-group">
                ${template1}
                ${template2}
            </div>
        `;
    }

    // Brief orange flash on an input to signal value was clamped
    flashClampWarning(element) {
        element.style.setProperty('background-color', 'rgba(255, 165, 88, 0.35)', 'important');
        element.style.setProperty('border-color', 'rgba(255, 165, 88, 0.8)', 'important');
        element.style.setProperty('transition', 'none', 'important');
        // Force reflow so the instant color is painted before the transition
        void element.offsetWidth;
        element.style.setProperty('transition', 'background-color 0.6s ease, border-color 0.6s ease', 'important');
        element.style.setProperty('background-color', 'transparent', 'important');
        element.style.setProperty('border-color', 'transparent', 'important');
        // Clean up inline styles after transition completes
        setTimeout(() => {
            element.style.removeProperty('background-color');
            element.style.removeProperty('border-color');
            element.style.removeProperty('transition');
        }, 650);
    }

    // Helper method to get appropriate tick size for crossed market protection
    getMinimumSpread(symbol, exchange) {
        // Try to get symbol-specific configuration
        if (window.productConfigManager && typeof window.productConfigManager.getSymbolConfig === 'function') {
            try {
                const config = window.productConfigManager.getSymbolConfig(symbol);
                if (config && config.tickSize) {
                    return config.tickSize;
                }
            } catch (e) {
                // Fallback to exchange-based defaults
            }
        }

        // Exchange-specific defaults based on typical tick sizes
        const exchangeDefaults = {
            'CME': 0.25,      // CME futures typically use quarter-point ticks
            'NASDAQ': 0.01,   // NASDAQ stocks use penny increments
            'NYSE': 0.01      // NYSE stocks use penny increments
        };

        return exchangeDefaults[exchange] || 0.01; // Default to penny if unknown
    }

    // Business Logic Methods
    getAssetDataForSymbol(symbol) {
        let assetData = null;
        if (window.MarketDataUtils) {
            assetData = window.MarketDataUtils.getSymbol(symbol);
            if (!assetData) {
                assetData = window.MarketDataUtils.generateMarketData(symbol);
            }
        }
        return assetData;
    }

    getSliderConfigurationSet(symbol, assetData) {
        const sliderConfig = window.validationConfig?.sliderConfig || {};

        // Parse a range string like "0-4" or "-100-100" into {min, max}
        function parseRange(rangeStr, defaultMin, defaultMax) {
            if (!rangeStr) return { min: defaultMin, max: defaultMax };
            // Match optional negative number, dash, then second number
            const match = rangeStr.match(/^(-?\d+\.?\d*)-(\d+\.?\d*)$/);
            if (match) {
                return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
            }
            return { min: defaultMin, max: defaultMax };
        }

        // Read a range config from products.json for the given symbol
        function getProductRange(configField, decimalField, defaultMin, defaultMax, defaultDecimals) {
            let min = defaultMin, max = defaultMax;
            let step = 1 / Math.pow(10, defaultDecimals);
            if (window.productConfigManager) {
                try {
                    const prodConfig = window.productConfigManager.getSymbolConfig(symbol);
                    if (prodConfig && prodConfig[configField]) {
                        const parsed = parseRange(prodConfig[configField], defaultMin, defaultMax);
                        min = parsed.min;
                        max = parsed.max;
                    }
                    if (prodConfig && prodConfig[decimalField]) {
                        const decimals = parseInt(prodConfig[decimalField], 10);
                        if (!isNaN(decimals)) step = 1 / Math.pow(10, decimals);
                    }
                } catch (e) { /* use defaults */ }
            }
            const defaultValue = Math.round((min + max) / 2 * 1000) / 1000;
            return { min, max, step, value: defaultValue };
        }

        function getSliderAttrs(configKey, fallbackMin = 1, fallbackMax = 100, fallbackStep = 1, fallbackDefault = 50) {
            const config = sliderConfig[configKey];

            if (assetData && configKey === 'basePrice') {
                const range = assetData.priceRange;
                return {
                    min: range.min,
                    max: range.max,
                    step: Math.max(0.01, (range.max - range.min) / 1000),
                    value: Math.round((range.min + range.max) / 2 * 100) / 100
                };
            }
            if (assetData && configKey === 'askQuantity') {
                const range = assetData.quantityRange;
                return {
                    min: range.min,
                    max: range.max,
                    step: Math.max(1, Math.round((range.max - range.min) / 100)),
                    value: Math.round((range.min + range.max) / 2)
                };
            }
            if (assetData && configKey === 'bidQuantity') {
                const range = assetData.quantityRange;
                return {
                    min: range.min,
                    max: range.max,
                    step: Math.max(1, Math.round((range.max - range.min) / 100)),
                    value: Math.round((range.min + range.max) / 2)
                };
            }
            if (assetData && configKey === 'spread') {
                return getProductRange('spreadRange', 'spreadRangeDecimalIncrement', 0, 2, 3);
            }
            if (configKey === 'volatility') {
                return getProductRange('volRange', 'volRangeDecimalIncrement', 0, 100, 0);
            }
            if (configKey === 'trend') {
                return getProductRange('trendRange', 'trendRangeDecimalIncrement', -100, 100, 0);
            }

            if (config) {
                return {
                    min: config.min,
                    max: config.max,
                    step: config.step,
                    value: config.default
                };
            }
            return {
                min: fallbackMin,
                max: fallbackMax,
                step: fallbackStep,
                value: fallbackDefault
            };
        }

        return {
            basePrice: getSliderAttrs('basePrice', 1, 1000, 10, 175),
            spread: getSliderAttrs('spread', 0.1, 10, 0.1, 0.5),
            bidPrice: getSliderAttrs('bidPrice', 1, 1000, 1, 174),
            askPrice: getSliderAttrs('askPrice', 1, 1000, 1, 176),
            bidQuantity: getSliderAttrs('bidQuantity', 1, 10000, 50, 250),
            askQuantity: getSliderAttrs('askQuantity', 1, 10000, 50, 300),
            bidWeight: getSliderAttrs('bidWeight', 0, 100, 5, 45),
            askWeight: getSliderAttrs('askWeight', 0, 100, 5, 55),
            volatility: getSliderAttrs('volatility', 0, 100, 5, 25),
            trend: getSliderAttrs('trend', -50, 50, 5, 5),
            percentage: getSliderAttrs('percentage', 0, 100, 1, 20)
        };
    }

    applyAllocationColor(element, value) {
        element.classList.remove('under-allocated', 'approaching-target', 'perfectly-allocated', 'over-allocated');
        if (value >= 100) {
            element.classList.add(value === 100 ? 'perfectly-allocated' : 'over-allocated');
        } else if (value >= 80) {
            element.classList.add('approaching-target');
        } else {
            element.classList.add('under-allocated');
        }
    }

    setupDatacardEventListeners(card, symbol) {
        const removeBtn = card.querySelector('.red-remove-button');
        removeBtn.addEventListener('click', () => {
            this.removeSymbol(symbol);
        });

        // Collapse/expand toggle
        const collapseBtn = card.querySelector('.collapse-button');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => {
                const isCollapsed = card.classList.toggle('collapsed');
                collapseBtn.textContent = isCollapsed ? '▶' : '▼';
            });
        }

        // Setup percentage allocation editing
        const allocationCenter = card.querySelector('.datacard-allocation-center');
        const percentageInput = card.querySelector('.percentage-input-hidden');
        const percentageDisplay = card.querySelector('.allocation-percentage-display');

        if (allocationCenter && percentageInput && percentageDisplay) {
            // Handle input changes for percentage
            percentageInput.addEventListener('input', () => {
                let value = parseFloat(percentageInput.value);
                if (isNaN(value) || value < 0) value = 0;
                if (value > 100) value = 100;

                percentageInput.value = value;
                percentageDisplay.textContent = value + '%';
                this.applyAllocationColor(percentageDisplay, value);
                document.dispatchEvent(new CustomEvent('allocationChanged'));
            });

            // Handle input blur to finalize changes
            percentageInput.addEventListener('blur', () => {
                let value = parseFloat(percentageInput.value);
                if (isNaN(value) || value < 0) value = 0;
                if (value > 100) value = 100;

                // Round to 1 decimal place for cleaner display
                value = Math.round(value * 10) / 10;
                percentageInput.value = value;
                percentageDisplay.textContent = value + '%';
                this.applyAllocationColor(percentageDisplay, value);
                document.dispatchEvent(new CustomEvent('allocationChanged'));
            });

            // Handle Enter key to commit changes
            percentageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    percentageInput.blur();
                }
                if (e.key === 'Escape') {
                    // Revert to original value
                    const originalValue = percentageDisplay.textContent.replace('%', '');
                    percentageInput.value = originalValue;
                    percentageInput.blur();
                }
            });
        }

        // Setup price mode button
        const priceModeButton = card.querySelector('.pricing-mode-toggle-button');
        if (priceModeButton) {
            priceModeButton.addEventListener('click', () => {
                const modeText = priceModeButton.querySelector('.mode-text');
                const defaultMode = card.querySelector('.pricing-mode-default');
                const advancedMode = card.querySelector('.pricing-mode-advanced');

                if (modeText && defaultMode && advancedMode) {
                    const currentMode = modeText.textContent;
                    const isSpreadMode = currentMode === 'Spread';

                    if (isSpreadMode) {
                        // Switch to Direct mode
                        defaultMode.style.display = 'none';
                        advancedMode.style.display = 'block';
                        modeText.textContent = 'Direct';
                        priceModeButton.style.background = 'rgba(255,165,88,0.1)';
                        priceModeButton.style.borderColor = 'rgba(255,165,88,0.3)';
                        priceModeButton.style.color = '#ffa558';
                    } else {
                        // Switch to Spread mode
                        advancedMode.style.display = 'none';
                        defaultMode.style.display = 'block';
                        modeText.textContent = 'Spread';
                        priceModeButton.style.background = 'rgba(107,182,255,0.1)';
                        priceModeButton.style.borderColor = 'rgba(107,182,255,0.3)';
                        priceModeButton.style.color = '#6bb6ff';
                    }
                }
            });
        }

        setTimeout(() => {
            const rangeInputGroups = card.querySelectorAll('.range-input-group');
            rangeInputGroups.forEach(group => {
                const slider = group.querySelector('.range-input');
                const numberInput = group.querySelector('.range-number-input');

                if (slider && numberInput) {
                    slider.addEventListener('input', () => {
                        let sliderValue = parseFloat(slider.value);
                        let wasClamped = false;

                        // Prevent crossed markets for slider input too
                        const labelElement = group.closest('.range-control').querySelector('.range-label');
                        if (labelElement) {
                            const label = labelElement.textContent.trim();

                            if (label === 'Bid Price') {
                                const askControls = Array.from(card.querySelectorAll('.range-label'))
                                    .filter(label => label.textContent.trim() === 'Ask Price');

                                if (askControls.length > 0) {
                                    const askSlider = askControls[0].closest('.range-control').querySelector('.range-input');
                                    if (askSlider) {
                                        const askValue = parseFloat(askSlider.value);
                                        if (!isNaN(askValue) && sliderValue >= askValue) {
                                            const symbolElement = card.querySelector('.symbol');
                                            const symbol = symbolElement ? symbolElement.textContent.trim() : null;
                                            const minSpread = this.getMinimumSpread(symbol);
                                            sliderValue = Math.max(parseFloat(slider.min), askValue - minSpread);
                                            slider.value = sliderValue;
                                            wasClamped = true;
                                        }
                                    }
                                }
                            } else if (label === 'Ask Price') {
                                const bidControls = Array.from(card.querySelectorAll('.range-label'))
                                    .filter(label => label.textContent.trim() === 'Bid Price');

                                if (bidControls.length > 0) {
                                    const bidSlider = bidControls[0].closest('.range-control').querySelector('.range-input');
                                    if (bidSlider) {
                                        const bidValue = parseFloat(bidSlider.value);
                                        if (!isNaN(bidValue) && sliderValue <= bidValue) {
                                            const symbolElement = card.querySelector('.symbol');
                                            const symbol = symbolElement ? symbolElement.textContent.trim() : null;
                                            const minSpread = this.getMinimumSpread(symbol);
                                            sliderValue = Math.min(parseFloat(slider.max), bidValue + minSpread);
                                            slider.value = sliderValue;
                                            wasClamped = true;
                                        }
                                    }
                                }
                            }
                        }

                        numberInput.value = sliderValue;
                        if (wasClamped) this.flashClampWarning(numberInput);
                    });

                    numberInput.addEventListener('input', () => {
                        // Only filter out non-numeric characters, don't sync with slider yet
                        let value = numberInput.value.replace(/[^0-9.-]/g, '');

                        // Ensure only one decimal point and one negative sign at the start
                        const parts = value.split('.');
                        if (parts.length > 2) {
                            value = parts[0] + '.' + parts.slice(1).join('');
                        }

                        // Update the input value if it was cleaned
                        if (value !== numberInput.value) {
                            numberInput.value = value;
                        }
                    });

                    // Sync with slider only when user finishes editing
                    numberInput.addEventListener('blur', () => {
                        const numValue = parseFloat(numberInput.value);
                        if (!isNaN(numValue)) {
                            const min = parseFloat(slider.min);
                            const max = parseFloat(slider.max);
                            let clampedValue = Math.max(min, Math.min(max, numValue));

                            // Prevent crossed markets: bid price should not exceed ask price
                            const labelElement = group.closest('.range-control').querySelector('.range-label');
                            if (labelElement) {
                                const label = labelElement.textContent.trim();

                                if (label === 'Bid Price') {
                                    const askControls = Array.from(card.querySelectorAll('.range-label'))
                                        .filter(label => label.textContent.trim() === 'Ask Price');

                                    if (askControls.length > 0) {
                                        const askInput = askControls[0].closest('.range-control').querySelector('.range-number-input');
                                        if (askInput) {
                                            const askValue = parseFloat(askInput.value);
                                            if (!isNaN(askValue) && clampedValue >= askValue) {
                                                const symbolElement = card.querySelector('.symbol');
                                                const symbol = symbolElement ? symbolElement.textContent.trim() : null;
                                                const minSpread = this.getMinimumSpread(symbol);
                                                clampedValue = Math.max(min, askValue - minSpread);
                                            }
                                        }
                                    }
                                } else if (label === 'Ask Price') {
                                    const bidControls = Array.from(card.querySelectorAll('.range-label'))
                                        .filter(label => label.textContent.trim() === 'Bid Price');

                                    if (bidControls.length > 0) {
                                        const bidInput = bidControls[0].closest('.range-control').querySelector('.range-number-input');
                                        if (bidInput) {
                                            const bidValue = parseFloat(bidInput.value);
                                            if (!isNaN(bidValue) && clampedValue <= bidValue) {
                                                const symbolElement = card.querySelector('.symbol');
                                                const symbol = symbolElement ? symbolElement.textContent.trim() : null;
                                                const minSpread = this.getMinimumSpread(symbol);
                                                clampedValue = Math.min(max, bidValue + minSpread);
                                            }
                                        }
                                    }
                                }
                            }

                            const wasClamped = clampedValue !== numValue;
                            slider.value = clampedValue;
                            numberInput.value = clampedValue;
                            if (wasClamped) this.flashClampWarning(numberInput);
                        }
                    });

                    numberInput.addEventListener('keydown', (e) => {
                        // Allow special keys: backspace, delete, tab, escape, enter, arrow keys
                        if ([8, 9, 27, 13, 37, 38, 39, 40, 46].includes(e.keyCode) ||
                            // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.ctrlKey === true && [65, 67, 86, 88].includes(e.keyCode))) {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                numberInput.blur(); // This will trigger the blur event which handles syncing
                            }
                            return;
                        }
                        // Allow decimal point (only if not already present)
                        if (e.key === '.' && !numberInput.value.includes('.')) {
                            return;
                        }
                        // Allow minus sign (only at the beginning)
                        if (e.key === '-' && numberInput.selectionStart === 0 && !numberInput.value.includes('-')) {
                            return;
                        }
                        // Allow digits 0-9
                        if (e.key >= '0' && e.key <= '9') {
                            return;
                        }
                        // Prevent all other keys
                        e.preventDefault();
                    });
                }
            });
        }, 0);
    }

    createGlobalControlsContent() {
        // Use GLOBAL as symbol and null as assetData for default configurations
        const sliderConfigs = this.getSliderConfigurationSet('GLOBAL', null);

        // Match exact datacard layout (minus header, price mode, base price)
        // Spread % alone (base price removed)
        const spreadControl = `
            <div class="range-control-group">
                ${this.createRangeControlTemplate('Spread %', sliderConfigs.spread, 'globalSpread', '')}
            </div>
        `;

        // Same groups as datacard
        const bidAskWeights = this.createRangeControlGroupTemplate(
            'Bid Wt %', sliderConfigs.bidWeight, 'globalBidWeight',
            'Ask Wt %', sliderConfigs.askWeight, 'globalAskWeight', ''
        );

        const bidAskQty = this.createRangeControlGroupTemplate(
            'Bid Qty', sliderConfigs.bidQuantity, 'globalBidQty',
            'Ask Qty', sliderConfigs.askQuantity, 'globalAskQty', ''
        );

        const volTrend = this.createRangeControlGroupTemplate(
            'Vol %', sliderConfigs.volatility, 'globalVolatility',
            'Trend %', sliderConfigs.trend, 'globalTrend', ''
        );

        // Wrap in datacard-content to match datacard inner structure
        return `
            <div class="datacard-content">
                ${spreadControl}
                ${bidAskWeights}
                ${bidAskQty}
                ${volTrend}
            </div>
        `;
    }

    createDetailedDatacard(symbol, exchange = 'CME') {
        try {
            const card = document.createElement('div');
            card.className = 'datacard';
            card.dataset.symbol = symbol;

            const assetData = this.getAssetDataForSymbol(symbol);
            const sliderConfigs = this.getSliderConfigurationSet(symbol, assetData);

            // Generate unique suffix for this symbol to avoid ID conflicts
            const symbolSuffix = '_' + symbol.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

            const headerTemplate = this.createDatacardHeaderTemplate(symbol, exchange, sliderConfigs.percentage);
            const pricingModeTemplate = this.createPricingModeTemplate();
            const group1 = this.createRangeControlGroupTemplate('Base Price', sliderConfigs.basePrice, null, 'Spread %', sliderConfigs.spread, null, symbolSuffix);
            const directPriceGroup = this.createRangeControlGroupTemplate('Bid Price', sliderConfigs.bidPrice, null, 'Ask Price', sliderConfigs.askPrice, null, symbolSuffix);
            const group2 = this.createRangeControlGroupTemplate('Bid Wt %', sliderConfigs.bidWeight, null, 'Ask Wt %', sliderConfigs.askWeight, null, symbolSuffix);
            const group3 = this.createRangeControlGroupTemplate('Bid Qty', sliderConfigs.bidQuantity, null, 'Ask Qty', sliderConfigs.askQuantity, null, symbolSuffix);
            const group4 = this.createRangeControlGroupTemplate('Vol %', sliderConfigs.volatility, null, 'Trend %', sliderConfigs.trend, null, symbolSuffix);

            card.innerHTML = `
                ${headerTemplate}

                <div class="datacard-content">
                    ${pricingModeTemplate}

                    <div class="pricing-mode-default">
                        ${group1}
                        ${group2}
                    </div>

                    <div class="pricing-mode-advanced" style="display: none;">
                        ${directPriceGroup}
                        ${group2}
                    </div>

                    ${group3}
                    ${group4}

                    <!-- Volatility Micro Periods Dropdown -->
                    <div class="periods-dropdown" data-type="volatility" style="display: none; position: relative; background: rgba(16,22,36,0.95); border: 1px solid rgba(107,182,255,0.3); border-radius: 6px; margin-top: 8px; max-height: 200px; overflow-y: auto;">
                        <div class="dropdown-header" style="padding: 8px; border-bottom: 1px solid rgba(107,182,255,0.2); display: flex; justify-content: space-between; align-items: center;">
                            <span class="dropdown-title" style="font-size: 0.85em; color: #6bb6ff;">Volatility Periods</span>
                            <button onclick="addMicroPeriod(this)" style="background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">+</button>
                        </div>
                        <div class="dropdown-content" style="padding: 8px;"></div>
                    </div>

                    <!-- Trend Micro Periods Dropdown -->
                    <div class="periods-dropdown" data-type="trend" style="display: none; position: relative; background: rgba(16,22,36,0.95); border: 1px solid rgba(107,182,255,0.3); border-radius: 6px; margin-top: 8px; max-height: 200px; overflow-y: auto;">
                        <div class="dropdown-header" style="padding: 8px; border-bottom: 1px solid rgba(107,182,255,0.2); display: flex; justify-content: space-between; align-items: center;">
                            <span class="dropdown-title" style="font-size: 0.85em; color: #6bb6ff;">Trend Periods</span>
                            <button onclick="addMicroPeriod(this)" style="background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">+</button>
                        </div>
                        <div class="dropdown-content" style="padding: 8px;"></div>
                    </div>
                </div>
            `;

            this.setupDatacardEventListeners(card, symbol);

            // Apply initial allocation color
            const display = card.querySelector('.allocation-percentage-display');
            if (display) {
                this.applyAllocationColor(display, sliderConfigs.percentage.value);
            }

            return card;
        } catch (error) {
            console.error('Error creating datacard:', error);
            return null;
        }
    }

    removeSymbol(symbol) {
        const container = this.getContainer();
        if (!container) return;
        const card = container.querySelector(`[data-symbol="${symbol}"]`);
        if (card) {
            card.remove();
            this.updateDisplay();
            document.dispatchEvent(new CustomEvent('symbolRemoved', { detail: { symbol } }));
        }
    }

    // Micro-periods functionality
    togglePeriodsDropdown(indicator) {
        const datacard = indicator.closest('.datacard');
        const type = indicator.getAttribute('data-type');

        // The dropdown might be in the datacard OR already appended to body
        let dropdown = datacard.querySelector(`.periods-dropdown[data-type="${type}"]`)
            || document.body.querySelector(`.periods-dropdown[data-owner="${datacard.dataset.symbol}"][data-type="${type}"]`);
        if (!dropdown) return;

        // Close all other dropdowns
        document.querySelectorAll('.periods-dropdown').forEach(d => {
            if (d !== dropdown) {
                d.style.cssText = 'display: none;';
                // Return to original datacard if it was moved to body
                if (d._originalParent && d.parentElement === document.body) {
                    d._originalParent.appendChild(d);
                }
            }
        });
        // Deactivate all other indicators
        document.querySelectorAll('.periods-indicator').forEach(ind => {
            if (ind !== indicator) {
                ind.classList.remove('active');
            }
        });

        const isHidden = dropdown.style.display === 'none' || !dropdown.style.display || dropdown.offsetParent === null;

        if (isHidden) {
            // Remember original parent so we can return the dropdown later
            if (!dropdown._originalParent) {
                dropdown._originalParent = dropdown.parentElement;
            }

            // Move to document.body to escape ALL overflow/transform clipping
            document.body.appendChild(dropdown);
            dropdown.setAttribute('data-owner', datacard.dataset.symbol);
            dropdown._datacard = datacard;

            const rect = indicator.getBoundingClientRect();
            const dcRect = datacard.getBoundingClientRect();
            dropdown.style.cssText = `
                display: block;
                position: fixed;
                z-index: 9999;
                left: ${dcRect.left}px;
                top: ${rect.bottom + 6}px;
                width: ${dcRect.width}px;
                max-height: 300px;
                overflow-y: auto;
                margin: 0;
                background: rgba(16,22,36,0.98);
                border: 1px solid rgba(107,182,255,0.3);
                border-radius: 6px;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                padding: 0;
            `;

            // Ensure inner .dropdown-content is visible (CSS sets display:none)
            const innerContent = dropdown.querySelector('.dropdown-content');
            if (innerContent) innerContent.style.display = 'block';

            indicator.classList.add('active');

            // Close on outside click
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== indicator) {
                    dropdown.style.cssText = 'display: none;';
                    if (dropdown._originalParent) {
                        dropdown._originalParent.appendChild(dropdown);
                    }
                    indicator.classList.remove('active');
                    document.removeEventListener('mousedown', closeHandler);
                }
            };
            setTimeout(() => document.addEventListener('mousedown', closeHandler), 0);
        } else {
            dropdown.style.cssText = 'display: none;';
            if (dropdown._originalParent) {
                dropdown._originalParent.appendChild(dropdown);
            }
            indicator.classList.remove('active');
        }
    }

    addMicroPeriod(button) {
        const dropdown = button.closest('.periods-dropdown');
        const content = dropdown.querySelector('.dropdown-content');
        const type = dropdown.getAttribute('data-type');

        const isVolatility = type === 'volatility';
        const minVal = isVolatility ? 0 : -50;
        const maxVal = isVolatility ? 100 : 50;

        // Find a non-overlapping default timestamp
        const defaultTime = this.findNextAvailableTime(dropdown, '08:30:00', 1, 'sec');
        if (!defaultTime) {
            this.showPeriodError(dropdown, 'No available time slot found. Delete an existing period first.');
            return;
        }

        const periodRow = document.createElement('div');
        periodRow.className = 'micro-period';
        periodRow.dataset.timestamp = defaultTime;
        periodRow.dataset.duration = '1';
        periodRow.dataset.durationUnit = 'sec';
        periodRow.dataset.value = '0.50';
        periodRow.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 4px; padding: 4px 6px; background: rgba(107,182,255,0.05); border-radius: 4px; flex-wrap: nowrap; justify-content: space-between;';

        periodRow.innerHTML = `
            <input type="text" class="period-time-input" value="${defaultTime}" maxlength="8" placeholder="HH:MM:SS"
                style="width: 58px; font-size: 10px; padding: 2px 3px; background: rgba(16,22,36,0.8); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #d97841; font-family: 'SF Mono','Monaco',monospace; text-align: center; flex-shrink: 0;">
            <input type="number" class="period-value-input" min="${minVal}" max="${maxVal}" step="0.01" value="0.50"
                style="width: 42px; font-size: 10px; padding: 2px 3px; background: rgba(16,22,36,0.8); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; text-align: right; flex-shrink: 0;">
            <span style="color: rgba(255,255,255,0.4); font-size: 9px; flex-shrink: 0; margin: 0 2px;">%</span>
            <input type="number" class="period-duration-input" min="1" step="1" value="1"
                style="width: 32px; font-size: 10px; padding: 2px 3px; background: rgba(16,22,36,0.8); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #fff; text-align: right; flex-shrink: 0;">
            <select class="period-duration-unit"
                style="font-size: 9px; padding: 1px 2px; background: rgba(16,22,36,0.8); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; cursor: pointer; flex-shrink: 0;">
                <option value="us">μs</option>
                <option value="ms">ms</option>
                <option value="sec" selected>sec</option>
                <option value="min">min</option>
            </select>
            <button class="remove-micro-period" onclick="removeMicroPeriod(this)"
                style="background: rgba(255,71,87,0.8); color: white; border: none; width: 16px; height: 16px; cursor: pointer; border-radius: 3px; font-size: 10px; flex-shrink: 0; line-height: 1; margin-left: auto;">×</button>
        `;

        content.appendChild(periodRow);
        this.setupPeriodRowListeners(periodRow, dropdown);
        this.updatePeriodsCount(dropdown);
        this.showSaveToast(dropdown, 'Period added', true);
    }

    setupPeriodRowListeners(row, dropdown) {
        const timeInput = row.querySelector('.period-time-input');
        const valueInput = row.querySelector('.period-value-input');
        const durationInput = row.querySelector('.period-duration-input');
        const unitSelect = row.querySelector('.period-duration-unit');

        // Real-time keystroke filtering: only digits and colons allowed
        timeInput.addEventListener('keydown', (e) => {
            if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) return;
            if (e.key === 'Enter') return;
            if (e.key === ':') return; // allow colons
            if (/^\d$/.test(e.key)) return; // allow digits
            e.preventDefault(); // block everything else
        });

        // Auto-format on blur: clean up to HH:MM:SS
        timeInput.addEventListener('blur', () => {
            const formatted = this.formatTimeValue(timeInput.value);
            if (!formatted) {
                timeInput.style.borderColor = '#ff4757';
                timeInput.value = row.dataset.timestamp; // revert
                return;
            }
            // Check overlap before accepting
            if (this.wouldOverlap(dropdown, row, formatted, parseFloat(durationInput.value), unitSelect.value)) {
                this.showPeriodError(dropdown, `Time ${formatted} with that duration overlaps an existing period.`);
                timeInput.style.borderColor = '#ff4757';
                timeInput.value = row.dataset.timestamp; // revert
                return;
            }
            timeInput.style.borderColor = 'rgba(107,182,255,0.3)';
            timeInput.value = formatted;
            row.dataset.timestamp = formatted;
            this.clearPeriodError(dropdown);
        });

        // Value input: clamp to range
        valueInput.addEventListener('blur', () => {
            let val = parseFloat(valueInput.value);
            const min = parseFloat(valueInput.min);
            const max = parseFloat(valueInput.max);
            if (isNaN(val)) val = 0.50;
            val = Math.max(min, Math.min(max, val));
            val = Math.round(val * 100) / 100;
            valueInput.value = val.toFixed(2);
            row.dataset.value = val.toFixed(2);
        });

        // Duration input + unit: check overlap on change
        const checkDurationOverlap = () => {
            const dur = parseFloat(durationInput.value);
            if (isNaN(dur) || dur <= 0) {
                durationInput.style.borderColor = '#ff4757';
                return;
            }
            if (this.wouldOverlap(dropdown, row, row.dataset.timestamp, dur, unitSelect.value)) {
                this.showPeriodError(dropdown, 'Duration causes overlap with an existing period.');
                durationInput.style.borderColor = '#ff4757';
                durationInput.value = row.dataset.duration; // revert
                unitSelect.value = row.dataset.durationUnit; // revert
                return;
            }
            durationInput.style.borderColor = 'rgba(107,182,255,0.3)';
            row.dataset.duration = dur;
            row.dataset.durationUnit = unitSelect.value;
            this.clearPeriodError(dropdown);
        };

        durationInput.addEventListener('blur', checkDurationOverlap);
        unitSelect.addEventListener('change', checkDurationOverlap);

        // Enter key: commit changes and show gentle feedback
        const commitOnEnter = (e) => {
            if (e.key === 'Enter') {
                e.target.blur(); // triggers validation via blur handler
                // Check if anything reverted (error) or succeeded
                const hasError = row.querySelector('input[style*="#ff4757"]');
                this.showSaveToast(dropdown, hasError ? 'Not saved — check inputs' : 'Saved', !hasError);
            }
        };
        timeInput.addEventListener('keydown', commitOnEnter);
        valueInput.addEventListener('keydown', commitOnEnter);
        durationInput.addEventListener('keydown', commitOnEnter);
    }

    showSaveToast(dropdown, message, success) {
        let toast = document.querySelector('.period-save-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'period-save-toast';
            document.body.appendChild(toast);
        }
        const dcRect = dropdown.getBoundingClientRect();
        toast.style.cssText = `
            position: fixed;
            left: ${dcRect.left + dcRect.width / 2}px;
            top: ${dcRect.bottom + 6}px;
            transform: translateX(-50%);
            font-size: 10px;
            padding: 3px 12px;
            border-radius: 3px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            white-space: nowrap;
            z-index: 10001;
            background: ${success ? 'rgba(107,182,255,0.9)' : 'rgba(255,71,87,0.9)'};
            color: #fff;
        `;
        toast.textContent = message;
        // Force reflow then fade in
        toast.offsetHeight;
        toast.style.opacity = '1';
        clearTimeout(toast._fadeTimer);
        toast._fadeTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1200);
    }

    // Convert duration to seconds for overlap comparison
    durationToSeconds(value, unit) {
        const v = parseFloat(value);
        switch (unit) {
            case 'us':  return v / 1_000_000;
            case 'ms':  return v / 1_000;
            case 'sec': return v;
            case 'min': return v * 60;
            default:    return v;
        }
    }

    // Parse HH:MM:SS to total seconds from midnight
    parseTimeToSeconds(timeStr) {
        const m = timeStr.match(/^(\d{2}):(\d{2}):(\d{2})$/);
        if (!m) return NaN;
        return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
    }

    // Auto-format raw digit string (e.g. "083" -> "08:3", "0830" -> "08:30", "083000" -> "08:30:00")
    formatRawTimeDigits(digits) {
        let s = digits.replace(/\D/g, '').slice(0, 6);
        if (s.length <= 2) return s;
        if (s.length <= 4) return s.slice(0, 2) + ':' + s.slice(2);
        return s.slice(0, 2) + ':' + s.slice(2, 4) + ':' + s.slice(4);
    }

    // Format/validate a time string to HH:MM:SS
    formatTimeValue(raw) {
        const trimmed = raw.trim();
        const m = trimmed.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
        if (!m) return null;
        const h = parseInt(m[1]), min = parseInt(m[2]), s = parseInt(m[3]);
        if (h > 23 || min > 59 || s > 59) return null;
        return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    // Check if a proposed period (for a given row) would overlap any other period in the dropdown
    wouldOverlap(dropdown, currentRow, timestamp, duration, unit) {
        const startSec = this.parseTimeToSeconds(timestamp);
        if (isNaN(startSec)) return true;
        const durSec = this.durationToSeconds(duration, unit);
        const endSec = startSec + durSec;

        const rows = dropdown.querySelectorAll('.micro-period');
        for (const row of rows) {
            if (row === currentRow) continue;
            const rowStart = this.parseTimeToSeconds(row.dataset.timestamp);
            const rowDur = this.durationToSeconds(parseFloat(row.dataset.duration), row.dataset.durationUnit);
            const rowEnd = rowStart + rowDur;
            // Overlap: ranges [startSec, endSec) and [rowStart, rowEnd) intersect
            if (startSec < rowEnd && rowStart < endSec) {
                return true;
            }
        }
        return false;
    }

    // Find next available time slot starting from a preferred time
    findNextAvailableTime(dropdown, preferredTime, duration, unit) {
        const durSec = this.durationToSeconds(duration, unit);
        let candidateSec = this.parseTimeToSeconds(preferredTime);
        if (isNaN(candidateSec)) candidateSec = 30600; // 08:30:00

        // Collect existing ranges
        const rows = dropdown.querySelectorAll('.micro-period');
        const ranges = [];
        for (const row of rows) {
            const s = this.parseTimeToSeconds(row.dataset.timestamp);
            const d = this.durationToSeconds(parseFloat(row.dataset.duration), row.dataset.durationUnit);
            ranges.push({ start: s, end: s + d });
        }
        ranges.sort((a, b) => a.start - b.start);

        // Try the preferred time first, then scan after each existing range
        const maxTime = 86400; // 24:00:00
        const candidates = [candidateSec, ...ranges.map(r => r.end)];
        for (const start of candidates) {
            const end = start + durSec;
            if (end > maxTime) continue;
            const overlaps = ranges.some(r => start < r.end && r.start < end);
            if (!overlaps) {
                const h = Math.floor(start / 3600);
                const m = Math.floor((start % 3600) / 60);
                const s = Math.floor(start % 60);
                return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
            }
        }
        return null;
    }

    showPeriodError(dropdown, msg) {
        let errEl = dropdown.querySelector('.period-error-msg');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'period-error-msg';
            errEl.style.cssText = 'color: #ff4757; font-size: 10px; padding: 4px 8px; text-align: center;';
            dropdown.appendChild(errEl);
        }
        errEl.textContent = msg;
        errEl.style.display = 'block';
        clearTimeout(errEl._hideTimer);
        errEl._hideTimer = setTimeout(() => { errEl.style.display = 'none'; }, 3000);
    }

    clearPeriodError(dropdown) {
        const errEl = dropdown.querySelector('.period-error-msg');
        if (errEl) errEl.style.display = 'none';
    }

    removeMicroPeriod(button) {
        const dropdown = button.closest('.periods-dropdown');
        button.closest('.micro-period').remove();
        this.updatePeriodsCount(dropdown);
    }

    updatePeriodsCount(dropdown) {
        const datacard = dropdown._datacard || dropdown.closest('.datacard');
        if (!datacard) return;
        const type = dropdown.getAttribute('data-type');
        const indicator = datacard.querySelector(`.periods-indicator[data-type="${type}"]`);
        const periods = dropdown.querySelectorAll('.micro-period');

        if (indicator) {
            indicator.textContent = periods.length;
            if (periods.length === 0) {
                indicator.classList.add('disabled');
            } else {
                indicator.classList.remove('disabled');
            }
        }
    }

    clearInput() {
        this.symbolInput.value = '';
        this.updateButtonState();
    }

    updateDisplay() {
        const container = this.getContainer();
        if (!container) return;

        const hasCards = container.children.length > 0;

        // Lock/unlock exchange selector based on whether cards exist
        this.updateExchangeLock(hasCards);

        if (hasCards) {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
            container.style.gap = '1em';
            if (this.emptyMessage) {
                this.emptyMessage.style.display = 'none';
            }
        } else {
            if (this.emptyMessage) {
                this.emptyMessage.style.display = 'block';
            }
        }
    }

    updateExchangeLock(hasCards) {
        if (!this.exchangeSelect) return;

        if (hasCards) {
            this.exchangeSelect.disabled = true;
            this.exchangeSelect.style.cssText = `
                opacity: 0.5 !important;
                cursor: not-allowed !important;
            `;
        } else {
            this.exchangeSelect.disabled = false;
            this.exchangeSelect.style.cssText = '';
        }
    }

    getSymbols() {
        const container = this.getContainer();
        if (!container) return;

        const cards = container.querySelectorAll('.datacard[data-symbol]');
        return Array.from(cards).map(card => ({
            symbol: card.dataset.symbol,
            element: card
        }));
    }
}

// Export for global access
window.SymbolManager = SymbolManager;

// Make micro-periods functions globally available for onclick handlers
window.togglePeriodsDropdown = function(indicator) {
    console.log('togglePeriodsDropdown called with:', indicator);
    if (window.symbolManager) {
        window.symbolManager.togglePeriodsDropdown(indicator);
    } else {
        console.error('window.symbolManager not available');
    }
};

window.addMicroPeriod = function(button) {
    if (window.symbolManager) {
        window.symbolManager.addMicroPeriod(button);
    }
};

window.removeMicroPeriod = function(button) {
    if (window.symbolManager) {
        window.symbolManager.removeMicroPeriod(button);
    }
};
