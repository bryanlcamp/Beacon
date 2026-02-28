// =============================================================================
// BEACON AUTHOR - DATACARD FACTORY MODULE
// =============================================================================

export const DatacardFactory = {

    // Default slider configurations
    getSliderDefaults() {
        return {
            basePrice: { min: 1, max: 1000, step: 10, value: 175 },
            spread: { min: 0.1, max: 10, step: 0.1, value: 0.5 },
            bidPrice: { min: 1, max: 1000, step: 1, value: 174 },
            askPrice: { min: 1, max: 1000, step: 1, value: 176 },
            bidQuantity: { min: 1, max: 10000, step: 50, value: 250 },
            askQuantity: { min: 1, max: 10000, step: 50, value: 300 },
            bidWeight: { min: 0, max: 100, step: 5, value: 45 },
            askWeight: { min: 0, max: 100, step: 5, value: 55 },
            volatility: { min: 0, max: 100, step: 5, value: 25 },
            trend: { min: -50, max: 50, step: 5, value: 5 },
            percentage: { min: 0, max: 100, step: 1, value: 20 }
        };
    },

    // Get slider attributes with config fallback
    getSliderAttrs(configKey, fallbackMin = 1, fallbackMax = 100, fallbackStep = 1, fallbackDefault = 20) {
        const sliderConfig = window.validationConfig?.sliderConfig || {};
        const config = sliderConfig[configKey];

        if (config) {
            return {
                min: config.min,
                max: config.max,
                step: config.step,
                value: config.default
            };
        }

        // Use defaults from getSliderDefaults()
        const defaults = this.getSliderDefaults();
        return defaults[configKey] || {
            min: fallbackMin,
            max: fallbackMax,
            step: fallbackStep,
            value: fallbackDefault
        };
    },

    // Create detailed datacard with all microstructure controls
    createDetailedDatacard(symbol) {
        const exchange = document.getElementById('exchangeSelect')?.value || 'CME';
        const card = document.createElement('div');
        card.className = 'datacard';
        card.dataset.symbol = symbol;

        const basePrice = this.getSliderAttrs('basePrice', 1, 1000, 10, 175);
        const spread = this.getSliderAttrs('spread', 0.1, 10, 0.1, 0.5);
        const bidPrice = this.getSliderAttrs('bidPrice', 1, 1000, 1, 174);
        const askPrice = this.getSliderAttrs('askPrice', 1, 1000, 1, 176);
        const bidQuantity = this.getSliderAttrs('bidQuantity', 1, 10000, 50, 250);
        const askQuantity = this.getSliderAttrs('askQuantity', 1, 10000, 50, 300);
        const bidWeight = this.getSliderAttrs('bidWeight', 0, 100, 5, 45);
        const askWeight = this.getSliderAttrs('askWeight', 0, 100, 5, 55);
        const volatility = this.getSliderAttrs('volatility', 0, 100, 5, 25);
        const trend = this.getSliderAttrs('trend', -50, 50, 5, 5);
        const percentage = this.getSliderAttrs('percentage', 0, 100, 1, 20);

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
                <!-- Pricing Mode Toggle -->
                <div class="pricing-mode-toggle" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                    <span style="font-size: 0.85em; color: rgba(255,255,255,0.7);">Price Mode:</span>
                    <button class="mode-toggle-btn" onclick="togglePricingMode(this)" style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 4px; color: #6bb6ff; font-size: 0.8em; cursor: pointer;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M2 12h20"></path>
                        </svg>
                        <span class="mode-text">Spread</span>
                    </button>
                </div>

                <!-- Default: Spread-based controls -->
                <div class="pricing-mode-default">
                    <!-- Base Price & Spread -->
                    <div class="range-control-group">
                        <div class="range-control half-width">
                            <div class="range-label">Base Price</div>
                            <!-- <div class="range-input-group"> -->
                                <input type="range" class="range-input" min="${basePrice.min}" max="${basePrice.max}" step="${basePrice.step}" value="${basePrice.value}">
                                <!-- <input type="number" class="range-number-input" min="${basePrice.min}" max="${basePrice.max}" step="${basePrice.step}" value="${basePrice.value}"> -->
                            <!-- </div> -->
                            <div class="range-value">$<span class="value">${basePrice.value}</span></div>
                        </div>
                        <div class="range-control half-width">
                            <div class="range-label">Spread</div>
                            <!-- <div class="range-input-group"> -->
                                <input type="range" class="range-input" min="${spread.min}" max="${spread.max}" step="${spread.step}" value="${spread.value}">
                                <!-- <input type="number" class="range-number-input" min="${spread.min}" max="${spread.max}" step="${spread.step}" value="${spread.value}"> -->
                            <!-- </div> -->
                            <div class="range-value"><span class="value">${spread.value}</span>%</div>
                        </div>
                    </div>

                    <!-- Bid/Ask Weights -->
                    <div class="range-control-group">
                        <div class="range-control half-width">
                            <div class="range-label">Bid Weight</div>
                            <input type="range" class="range-input" min="${bidWeight.min}" max="${bidWeight.max}" step="${bidWeight.step}" value="${bidWeight.value}">
                            <div class="range-value"><span class="value">${bidWeight.value}</span>%</div>
                        </div>
                        <div class="range-control half-width">
                            <div class="range-label">Ask Weight</div>
                            <input type="range" class="range-input" min="${askWeight.min}" max="${askWeight.max}" step="${askWeight.step}" value="${askWeight.value}">
                            <div class="range-value"><span class="value">${askWeight.value}</span>%</div>
                        </div>
                    </div>
                </div>

                <!-- Advanced: Independent Price Controls (Hidden by default) -->
                <div class="pricing-mode-advanced" style="display: none;">
                    <!-- Bid/Ask Price -->
                    <div class="range-control-group">
                        <div class="range-control half-width">
                            <div class="range-label">Bid Price</div>
                            <input type="range" class="range-input" min="${bidPrice.min}" max="${bidPrice.max}" step="${bidPrice.step}" value="${bidPrice.value}">
                            <div class="range-value">$<span class="value">${bidPrice.value}</span></div>
                        </div>
                        <div class="range-control half-width">
                            <div class="range-label">Ask Price</div>
                            <input type="range" class="range-input" min="${askPrice.min}" max="${askPrice.max}" step="${askPrice.step}" value="${askPrice.value}">
                            <div class="range-value">$<span class="value">${askPrice.value}</span></div>
                        </div>
                    </div>
                </div>

                <!-- Bid/Ask Quantity -->
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label">Bid Quantity</div>
                        <!-- <div class="range-input-group"> -->
                            <input type="range" class="range-input" min="${bidQuantity.min}" max="${bidQuantity.max}" step="${bidQuantity.step}" value="${bidQuantity.value}">
                            <!-- <input type="number" class="range-number-input" min="${bidQuantity.min}" max="${bidQuantity.max}" step="${bidQuantity.step}" value="${bidQuantity.value}"> -->
                        <!-- </div> -->
                        <div class="range-value"><span class="value">${bidQuantity.value}</span></div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label">Ask Quantity</div>
                        <!-- <div class="range-input-group"> -->
                            <input type="range" class="range-input" min="${askQuantity.min}" max="${askQuantity.max}" step="${askQuantity.step}" value="${askQuantity.value}">
                            <!-- <input type="number" class="range-number-input" min="${askQuantity.min}" max="${askQuantity.max}" step="${askQuantity.step}" value="${askQuantity.value}"> -->
                        <!-- </div> -->
                        <div class="range-value"><span class="value">${askQuantity.value}</span></div>
                    </div>
                </div>

                <!-- Volatility & Trend with Micro Buttons -->
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Volatility</span>
                            <button class="periods-indicator" data-type="volatility" onclick="togglePeriodsDropdown(this)" style="background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; width: 20px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">0</button>
                        </div>
                        <input type="range" class="range-input" min="${volatility.min}" max="${volatility.max}" step="${volatility.step}" value="${volatility.value}">
                        <div class="range-value"><span class="value">${volatility.value}</span>%</div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Trend</span>
                            <button class="periods-indicator" data-type="trend" onclick="togglePeriodsDropdown(this)" style="background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; width: 20px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">0</button>
                        </div>
                        <input type="range" class="range-input" min="${trend.min}" max="${trend.max}" step="${trend.step}" value="${trend.value}">
                        <div class="range-value"><span class="value">${trend.value}</span> (Neutral)</div>
                    </div>
                </div>

                <!-- Micro Periods Dropdown -->
                <div class="periods-dropdown" style="display: none; position: relative; background: rgba(16,22,36,0.95); border: 1px solid rgba(107,182,255,0.3); border-radius: 6px; margin-top: 8px; max-height: 200px; overflow-y: auto;">
                    <div class="dropdown-header" style="padding: 8px; border-bottom: 1px solid rgba(107,182,255,0.2); display: flex; justify-content: space-between; align-items: center;">
                        <span class="dropdown-title" style="font-size: 0.85em; color: #6bb6ff;">Micro Periods</span>
                        <button onclick="addMicroPeriod(this)" style="background: rgba(107,182,255,0.1); border: 1px solid rgba(107,182,255,0.3); border-radius: 3px; color: #6bb6ff; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">+</button>
                    </div>
                    <div class="dropdown-content" style="padding: 8px;"></div>
                </div>
            </div>
        `;

        // Add event listeners for range inputs
        this.attachDatacardEvents(card);

        return card;
    },

    // Create simple datacard (fallback)
    createSimpleDatacard(symbol, exchange = 'CME') {
        const card = document.createElement('div');
        card.className = 'datacard';
        card.dataset.symbol = symbol;

        card.innerHTML = `
            <div class="datacard-header">
                <div class="datacard-symbol-info">
                    <span class="symbol-display">
                        <span class="exchange-prefix">${exchange}:</span>
                        <span class="symbol-name">${symbol}</span>
                    </span>
                </div>
                <div class="datacard-controls">
                    <input type="number" class="percentage-input" min="0" max="100" value="20" placeholder="%">
                    <button class="remove-symbol" onclick="removeDatacard(this)">×</button>
                </div>
            </div>
            <div class="datacard-content">
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label">Base Price</div>
                        <input type="range" class="range-input" min="1" max="1000" step="10" value="175">
                        <div class="range-value">$<span class="value">175</span></div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label">Spread</div>
                        <input type="range" class="range-input" min="0.1" max="10" step="0.1" value="0.5">
                        <div class="range-value"><span class="value">0.5</span>%</div>
                    </div>
                </div>
                <div class="range-control-group">
                    <div class="range-control half-width">
                        <div class="range-label">Volatility</div>
                        <input type="range" class="range-input" min="0" max="100" step="5" value="25">
                        <div class="range-value"><span class="value">25</span>%</div>
                    </div>
                    <div class="range-control half-width">
                        <div class="range-label">Trend</div>
                        <input type="range" class="range-input" min="-50" max="50" step="5" value="5">
                        <div class="range-value"><span class="value">5</span> (Neutral)</div>
                    </div>
                </div>
            </div>
        `;

        this.attachDatacardEvents(card);
        return card;
    },

    // Attach event listeners to datacard elements
    attachDatacardEvents(card) {
        // Remove button functionality
        const removeBtn = card.querySelector('.remove-symbol');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                card.remove();
                // Update allocation display if function exists
                if (typeof window.updateAllocationDisplay === 'function') {
                    window.updateAllocationDisplay();
                }
            });
        }

        // Range slider updates
        const ranges = card.querySelectorAll('.range-input');
        ranges.forEach(range => {
            range.addEventListener('input', (e) => {
                const parent = e.target.closest('.range-control');
                if (parent) {
                    const valueDisplay = parent.querySelector('.range-value');
                    const value = e.target.value;

                    if (valueDisplay) {
                        const valueSpan = valueDisplay.querySelector('.value');
                        if (valueSpan) {
                            valueSpan.textContent = value;

                            // Special handling for trend labels
                            if (e.target.min === '-50' && e.target.max === '50') {
                                const trendValue = parseInt(value);
                                const description = trendValue === 0 ? 'Neutral' : trendValue > 0 ? 'Bullish' : 'Bearish';
                                valueDisplay.innerHTML = `<span class="value">${value}</span> (${description})`;
                            }
                        }
                    }
                }
            });
        });
    }
};

// Make available globally for compatibility
if (typeof window !== 'undefined') {
    window.DatacardFactory = DatacardFactory;
    window.createDetailedDatacard = DatacardFactory.createDetailedDatacard.bind(DatacardFactory);
    window.createDatacard = DatacardFactory.createSimpleDatacard.bind(DatacardFactory);
}
