/**
 * Symbol Management Module
 * Handles adding and managing trading symbols/products
 */

class SymbolManager {
    constructor() {
        this.symbolInput = document.getElementById('symbolInput');
        this.addButton = document.getElementById('addSymbol');
        this.exchangeSelect = document.getElementById('exchangeSelect');
        this.container = document.getElementById('datacardContainer');
        this.emptyMessage = document.getElementById('emptyProductsMessage');

        this.init();
    }

    init() {
        console.log('🏛️ Initializing Symbol Manager...');

        if (!this.symbolInput || !this.addButton || !this.container) {
            console.warn('⚠️ Symbol Manager: Required elements not found');
            return;
        }

        this.setupEventListeners();
        this.updateButtonState();
        console.log('✅ Symbol Manager initialized');
    }

    setupEventListeners() {
        // Input validation and button state
        this.symbolInput.addEventListener('input', () => this.updateButtonState());
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
        this.addButton.disabled = !hasValue;

        if (hasValue) {
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

    addSymbol() {
        const symbol = this.symbolInput.value.trim().toUpperCase();

        if (!symbol) {
            alert('Please enter a symbol');
            return;
        }

        // Check for duplicates
        const existing = this.container.querySelector(`[data-symbol="${symbol}"]`);
        if (existing) {
            alert(`${symbol} already exists!`);
            return;
        }

        const exchange = this.exchangeSelect?.value || 'CME';
        this.createSymbolCard(symbol, exchange);
        this.clearInput();
        this.updateDisplay();

        console.log(`✅ Symbol ${symbol} added successfully`);
    }

    createSymbolCard(symbol, exchange) {
        // Use detailed datacard creation instead of dummy card
        const card = this.createDetailedDatacard(symbol, exchange);

        this.container.appendChild(card);
        return card;
    }

    createDetailedDatacard(symbol, exchange = 'CME') {
        const card = document.createElement('div');
        card.className = 'datacard';
        card.dataset.symbol = symbol;

        // Get asset-specific data from MarketDataUtils if available
        let assetData = null;
        if (window.MarketDataUtils) {
            assetData = window.MarketDataUtils.getSymbol(symbol);
            if (!assetData) {
                // Generate realistic data for unknown symbols
                assetData = window.MarketDataUtils.generateMarketData(symbol);
            }
        }

        // Get slider configuration from validation config (fallback to defaults or asset data)
        const sliderConfig = window.validationConfig?.sliderConfig || {};

        // Helper function to get slider attributes with asset-specific ranges
        function getSliderAttrs(configKey, fallbackMin = 1, fallbackMax = 100, fallbackStep = 1, fallbackDefault = 50) {
            const config = sliderConfig[configKey];

            // Use asset-specific ranges if available
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
                const baseSpread = assetData.spreadPercent || 0.02;
                return {
                    min: Math.max(0.001, baseSpread * 0.1),
                    max: baseSpread * 10,
                    step: 0.001,
                    value: Math.round(baseSpread * 1000) / 1000
                };
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

        const basePrice = getSliderAttrs('basePrice', 1, 1000, 10, 175);
        const spread = getSliderAttrs('spread', 0.1, 10, 0.1, 0.5);
        const bidPrice = getSliderAttrs('bidPrice', 1, 1000, 1, 174);
        const askPrice = getSliderAttrs('askPrice', 1, 1000, 1, 176);
        const bidQuantity = getSliderAttrs('bidQuantity', 1, 10000, 50, 250);
        const askQuantity = getSliderAttrs('askQuantity', 1, 10000, 50, 300);
        const bidWeight = getSliderAttrs('bidWeight', 0, 100, 5, 45);
        const askWeight = getSliderAttrs('askWeight', 0, 100, 5, 55);
        const volatility = getSliderAttrs('volatility', 0, 100, 5, 25);
        const trend = getSliderAttrs('trend', -50, 50, 5, 5);
        const percentage = getSliderAttrs('percentage', 0, 100, 1, 20);

        card.innerHTML = `
            <div class="datacard-header">
                <div class="datacard-symbol-info">
                    <span class="symbol-display">
                        <span class="exchange-prefix">${exchange}:</span>
                        <span class="symbol-name">${symbol}</span>
                    </span>
                </div>
                <div class="datacard-controls">
                    <input type="number" class="percentage-input" min="${percentage.min}" max="${percentage.max}" step="${percentage.step}" value="${percentage.value}" placeholder="%">
                    <button class="remove-symbol" aria-label="Remove ${symbol}">×</button>
                </div>
            </div>

            <div class="datacard-content">
                <div class="pricing-mode-toggle" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                    <span style="font-size: 0.85em; color: rgba(255,255,255,0.7);">Price Mode:</span>
                    <button class="mode-toggle-btn" style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 4px; color: #6bb6ff; font-size: 0.8em; cursor: pointer;">
                        <span class="mode-text">Spread</span>
                    </button>
                </div>

                <div class="pricing-mode-default">
                    <div class="range-control-group">
                        <div class="range-control half-width">
                            <div class="range-label">Base Price</div>
                            <div class="range-input-group">
                                <input type="range" class="range-input thin-slider" min="${basePrice.min}" max="${basePrice.max}" step="${basePrice.step}" value="${basePrice.value}">
                                <input type="number" class="range-number-input" min="${basePrice.min}" max="${basePrice.max}" step="${basePrice.step}" value="${basePrice.value}">
                            </div>
                        </div>
                        <div class="range-control half-width">
                            <div class="range-label">Spread</div>
                            <div class="range-input-group">
                                <input type="range" class="range-input thin-slider" min="${spread.min}" max="${spread.max}" step="${spread.step}" value="${spread.value}">
                                <input type="number" class="range-number-input" min="${spread.min}" max="${spread.max}" step="${spread.step}" value="${spread.value}">
                            </div>
                        </div>
                    </div>

                    <!-- Bid/Ask Weights -->
                    <div class="range-control-group">
                        <div class="range-control half-width">
                            <div class="range-label">Bid Weight</div>
                            <div class="range-input-group">
                                <input type="range" class="range-input thin-slider" min="${bidWeight.min}" max="${bidWeight.max}" step="${bidWeight.step}" value="${bidWeight.value}">
                                <input type="number" class="range-number-input" min="${bidWeight.min}" max="${bidWeight.max}" step="${bidWeight.step}" value="${bidWeight.value}">
                            </div>
                        </div>
                        <div class="range-control half-width">
                            <div class="range-label">Ask Weight</div>
                            <div class="range-input-group">
                                <input type="range" class="range-input thin-slider" min="${askWeight.min}" max="${askWeight.max}" step="${askWeight.step}" value="${askWeight.value}">
                                <input type="number" class="range-number-input" min="${askWeight.min}" max="${askWeight.max}" step="${askWeight.step}" value="${askWeight.value}">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bid/Ask Quantity -->
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label">Bid Quantity</div>
                        <div class="range-input-group">
                            <input type="range" class="range-input thin-slider" min="${bidQuantity.min}" max="${bidQuantity.max}" step="${bidQuantity.step}" value="${bidQuantity.value}">
                            <input type="number" class="range-number-input" min="${bidQuantity.min}" max="${bidQuantity.max}" step="${bidQuantity.step}" value="${bidQuantity.value}">
                        </div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label">Ask Quantity</div>
                        <div class="range-input-group">
                            <input type="range" class="range-input thin-slider" min="${askQuantity.min}" max="${askQuantity.max}" step="${askQuantity.step}" value="${askQuantity.value}">
                            <input type="number" class="range-number-input" min="${askQuantity.min}" max="${askQuantity.max}" step="${askQuantity.step}" value="${askQuantity.value}">
                        </div>
                    </div>
                </div>

                <!-- Volatility & Trend -->
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label">Volatility</div>
                        <div class="range-input-group">
                            <input type="range" class="range-input thin-slider" min="${volatility.min}" max="${volatility.max}" step="${volatility.step}" value="${volatility.value}">
                            <input type="number" class="range-number-input" min="${volatility.min}" max="${volatility.max}" step="${volatility.step}" value="${volatility.value}">
                        </div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label">Trend</div>
                        <div class="range-input-group">
                            <input type="range" class="range-input thin-slider" min="${trend.min}" max="${trend.max}" step="${trend.step}" value="${trend.value}">
                            <input type="number" class="range-number-input" min="${trend.min}" max="${trend.max}" step="${trend.step}" value="${trend.value}">
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for remove button
        const removeBtn = card.querySelector('.remove-symbol');
        removeBtn.addEventListener('click', () => {
            this.removeSymbol(symbol);
        });

        // Set up range input synchronization
        setTimeout(() => {
            const rangeInputGroups = card.querySelectorAll('.range-input-group');
            rangeInputGroups.forEach(group => {
                const slider = group.querySelector('.range-input');
                const numberInput = group.querySelector('.range-number-input');

                if (slider && numberInput) {
                    // Bidirectional sync
                    slider.addEventListener('input', () => {
                        numberInput.value = slider.value;
                    });

                    numberInput.addEventListener('input', () => {
                        const value = parseFloat(numberInput.value);
                        if (!isNaN(value)) {
                            const min = parseFloat(slider.min);
                            const max = parseFloat(slider.max);
                            const clampedValue = Math.max(min, Math.min(max, value));
                            slider.value = clampedValue;
                            numberInput.value = clampedValue;
                        }
                    });

                    numberInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            numberInput.blur();
                            numberInput.dispatchEvent(new Event('input'));
                        }
                    });
                }
            });
        }, 100);

        return card;
    }

    removeSymbol(symbol) {
        const card = this.container.querySelector(`[data-symbol="${symbol}"]`);
        if (card) {
            card.remove();
            this.updateDisplay();
            console.log(`🗑️ Symbol ${symbol} removed`);
        }
    }

    clearInput() {
        this.symbolInput.value = '';
        this.updateButtonState();
    }

    updateDisplay() {
        const hasCards = this.container.children.length > 0;

        if (hasCards) {
            this.container.style.display = 'grid';
            this.container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
            this.container.style.gap = '1em';
            if (this.emptyMessage) {
                this.emptyMessage.style.display = 'none';
            }
        } else {
            if (this.emptyMessage) {
                this.emptyMessage.style.display = 'block';
            }
        }
    }

    getSymbols() {
        const cards = this.container.querySelectorAll('.datacard[data-symbol]');
        return Array.from(cards).map(card => ({
            symbol: card.dataset.symbol,
            element: card
        }));
    }
}

// Export for global access
window.SymbolManager = SymbolManager;
