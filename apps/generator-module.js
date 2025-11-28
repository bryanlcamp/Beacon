// Market Data Generator Module - Single Source of Truth
export class MarketDataGenerator {
    constructor(containerId = 'symbolsContainer') {
        this.containerId = containerId;
        this.state = {
            symbols: new Map(),
            totalMessages: 10000,
            outputFormat: 'nsdq'
        };
        
        this.exchangeDefaults = {
            nsdq: { priceRange: [1, 500], qtyRange: [1, 1000], spreadRange: [0, 10] },
            nyse: { priceRange: [1, 500], qtyRange: [1, 1000], spreadRange: [0, 15] },
            cme: { priceRange: [1, 500], qtyRange: [1, 1000], spreadRange: [0, 8] },
            csv: { priceRange: [1, 500], qtyRange: [1, 1000], spreadRange: [0, 10] }
        };
    }

    init() {
        this.bindGlobalEvents();
        this.updateUI();
    }

    bindGlobalEvents() {
        const totalMessages = document.getElementById('totalMessages');
        const outputFormat = document.getElementById('outputFormat');
        
        totalMessages?.addEventListener('input', (e) => {
            this.state.totalMessages = parseInt(e.target.value) || 10000;
        });
        
        outputFormat?.addEventListener('change', (e) => {
            this.state.outputFormat = e.target.value;
            this.updateExchangeDefaults();
        });
    }

    addSymbol(symbolName = null) {
        // If no symbol name provided, use the old prompt method
        if (!symbolName) {
            symbolName = prompt('Enter symbol name (e.g., AAPL, MSFT):');
            if (!symbolName?.trim()) return;
        }
        
        const symbol = symbolName.trim().toUpperCase();
        
        if (this.state.symbols.has(symbol)) {
            // Don't show alert here - let the caller handle it
            return false;
        }
        
        const remaining = this.getRemainingPercentage();
        if (remaining <= 0) {
            alert('No percentage remaining. Remove symbols first.');
            return false;
        }
        
        const defaultPercentage = Math.min(20, remaining);
        const defaults = this.exchangeDefaults[this.state.outputFormat];
        
        this.state.symbols.set(symbol, {
            percentage: defaultPercentage,
            priceMin: defaults.priceRange[0],
            priceMax: Math.min(defaults.priceRange[1], 200),
            qtyMin: defaults.qtyRange[0], 
            qtyMax: Math.min(defaults.qtyRange[1], 100),
            spreadPercent: 1.0,
            priceWeight: 0.35,
            volumeM: 10.0,
            qtyWeight: 0.45
        });
        
        this.createSymbolCard(symbol);
        this.updateUI();
        return true;
    }

    removeSymbol(symbol) {
        if (!confirm(`Remove ${symbol} symbol?`)) return;
        
        this.state.symbols.delete(symbol);
        
        const card = document.querySelector(`[data-symbol="${symbol}"]`);
        card?.remove();
        
        this.updateUI();
    }

    createSymbolCard(symbol) {
        const data = this.state.symbols.get(symbol);
        const container = document.getElementById(this.containerId);
        
        const cardHTML = `
            <div class="symbol-card" data-symbol="${symbol}">
                <div class="card-header" onclick="generatorInstance.toggleCard(event, '${symbol}')">
                    <div class="symbol-header">
                        <div class="symbol-name">${symbol}</div>
                        <div class="symbol-percentage-edit percentage-tooltip">
                            <input type="number" class="percentage-input" value="${data.percentage}" min="0" max="100" step="1"
                                   onchange="generatorInstance.updateSymbolData('${symbol}', 'percentage', this.value)"
                                   onclick="event.stopPropagation()">
                            <span class="percentage-symbol">%</span>
                        </div>
                        <span class="collapse-toggle">▼</span>
                        <button class="symbol-remove-btn" onclick="event.stopPropagation(); generatorInstance.removeSymbol('${symbol}')" title="Remove Symbol">×</button>
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="symbol-grids-container">
                    <div class="price-qty-grid">
                        <div class="paired-controls">
                            <div class="grid-field">
                                <div class="detail-label">Price Range</div>
                                <div class="dual-range-container">
                                    <input type="range" class="dual-range-slider price-min" min="${this.exchangeDefaults[this.state.outputFormat].priceRange[0]}" max="${this.exchangeDefaults[this.state.outputFormat].priceRange[1]}" value="${data.priceMin}" step="0.01" oninput="generatorInstance.updateDualRange('${symbol}', 'price', this)">
                                    <input type="range" class="dual-range-slider price-max" min="${this.exchangeDefaults[this.state.outputFormat].priceRange[0]}" max="${this.exchangeDefaults[this.state.outputFormat].priceRange[1]}" value="${data.priceMax}" step="0.01" oninput="generatorInstance.updateDualRange('${symbol}', 'price', this)">
                                </div>
                                <div class="dual-range-values">
                                    <span class="min-value">${data.priceMin}</span>
                                    <span class="max-value">${data.priceMax}</span>
                                </div>
                            </div>
                            <div class="grid-field">
                                <div class="detail-label">Weight</div>
                                <input type="range" class="weight-slider" value="${data.priceWeight}" step="0.01" min="0" max="1" oninput="generatorInstance.updateSingleRange('${symbol}', 'priceWeight', this)">
                                <div class="range-display">${data.priceWeight}</div>
                            </div>
                        </div>
                        <div class="paired-controls">
                            <div class="grid-field">
                                <div class="detail-label">Qty Range</div>
                                <div class="dual-range-container">
                                    <input type="range" class="dual-range-slider qty-min" min="${this.exchangeDefaults[this.state.outputFormat].qtyRange[0]}" max="${this.exchangeDefaults[this.state.outputFormat].qtyRange[1]}" value="${data.qtyMin}" step="1" oninput="generatorInstance.updateDualRange('${symbol}', 'qty', this)">
                                    <input type="range" class="dual-range-slider qty-max" min="${this.exchangeDefaults[this.state.outputFormat].qtyRange[0]}" max="${this.exchangeDefaults[this.state.outputFormat].qtyRange[1]}" value="${data.qtyMax}" step="1" oninput="generatorInstance.updateDualRange('${symbol}', 'qty', this)">
                                </div>
                                <div class="dual-range-values">
                                    <span class="min-value">${data.qtyMin}</span>
                                    <span class="max-value">${data.qtyMax}</span>
                                </div>
                            </div>
                            <div class="grid-field">
                                <div class="detail-label">Weight</div>
                                <input type="range" class="weight-slider" value="${data.qtyWeight}" step="0.01" min="0" max="1" oninput="generatorInstance.updateSingleRange('${symbol}', 'qtyWeight', this)">
                                <div class="range-display">${data.qtyWeight}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="vertical-separator"></div>
                    
                    <div class="spread-volume-grid">
                        <div class="grid-field">
                            <div class="detail-label">Spread %</div>
                            <input type="range" class="weight-slider" value="${data.spreadPercent}" step="0.1" min="${this.exchangeDefaults[this.state.outputFormat].spreadRange[0]}" max="${this.exchangeDefaults[this.state.outputFormat].spreadRange[1]}" oninput="generatorInstance.updateSingleRange('${symbol}', 'spreadPercent', this)">
                            <div class="range-display">${data.spreadPercent}</div>
                        </div>
                        <div class="grid-field">
                            <div class="detail-label">Volume (M)</div>
                            <input type="range" class="weight-slider" value="${data.volumeM}" step="0.01" min="0" max="100" oninput="generatorInstance.updateSingleRange('${symbol}', 'volumeM', this)">
                            <div class="range-display">${data.volumeM}</div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', cardHTML);
        
        setTimeout(() => {
            const card = container.querySelector(`[data-symbol="${symbol}"]`);
            const priceMinSlider = card.querySelector('.price-min');
            const qtyMinSlider = card.querySelector('.qty-min');
            
            if (priceMinSlider) this.updateDualRange(symbol, 'price', priceMinSlider);
            if (qtyMinSlider) this.updateDualRange(symbol, 'qty', qtyMinSlider);
        }, 10);
    }

    updateSymbolData(symbol, field, value) {
        const data = this.state.symbols.get(symbol);
        if (!data) return;
        
        const numValue = parseFloat(value);
        
        if (field === 'percentage' && (numValue < 0 || numValue > 100)) {
            alert('Percentage must be between 0 and 100');
            return;
        }
        
        data[field] = numValue;
        this.updateSymbolDisplay(symbol, field, numValue);
        this.updateUI();
    }

    updateDualRange(symbol, type, slider) {
        const data = this.state.symbols.get(symbol);
        if (!data) return;
        
        const container = slider.parentElement;
        const minSlider = container.querySelector(`.${type}-min`);
        const maxSlider = container.querySelector(`.${type}-max`);
        const display = container.nextElementSibling;
        
        let minVal = parseFloat(minSlider.value);
        let maxVal = parseFloat(maxSlider.value);
        
        if (minVal > maxVal) {
            const temp = minVal;
            minVal = maxVal;
            maxVal = temp;
            minSlider.value = minVal;
            maxSlider.value = maxVal;
        }
        
        if (type === 'price') {
            data.priceMin = minVal;
            data.priceMax = maxVal;
        } else if (type === 'qty') {
            data.qtyMin = minVal;
            data.qtyMax = maxVal;
        }
        
        const minRange = parseFloat(minSlider.min);
        const maxRange = parseFloat(minSlider.max);
        const minPercent = ((minVal - minRange) / (maxRange - minRange)) * 100;
        const maxPercent = ((maxVal - minRange) / (maxRange - minRange)) * 100;
        
        if (slider === minSlider) {
            minSlider.style.zIndex = '3';
            maxSlider.style.zIndex = '2';
        } else if (slider === maxSlider) {
            minSlider.style.zIndex = '2';
            maxSlider.style.zIndex = '3';
        }
        
        const minDisplay = display.querySelector('.min-value');
        const maxDisplay = display.querySelector('.max-value');
        
        const containerWidth = 120;
        const minPosition = (minPercent / 100) * containerWidth;
        const maxPosition = (maxPercent / 100) * containerWidth;
        
        const minText = (type === 'price') ? minVal.toFixed(2) : Math.round(minVal).toString();
        const maxText = (type === 'price') ? maxVal.toFixed(2) : Math.round(maxVal).toString();
        const minTextWidth = minText.length * 7;
        const maxTextWidth = maxText.length * 7;
        const minGap = 8;
        
        const overlapDistance = (minTextWidth/2 + maxTextWidth/2 + minGap);
        const actualDistance = Math.abs(maxPosition - minPosition);
        
        if (actualDistance < overlapDistance) {
            if (minPosition < maxPosition) {
                minDisplay.style.left = `${minPosition}px`;
                minDisplay.style.top = '0px';
                maxDisplay.style.left = `${maxPosition}px`;
                maxDisplay.style.top = '14px';
            } else {
                minDisplay.style.left = `${maxPosition}px`;
                minDisplay.style.top = '14px';
                maxDisplay.style.left = `${minPosition}px`;
                maxDisplay.style.top = '0px';
            }
        } else {
            const leftBound = 0;
            const rightBound = 120;
            
            minDisplay.style.left = `${Math.max(leftBound, Math.min(rightBound, minPosition))}px`;
            minDisplay.style.top = '0px';
            maxDisplay.style.left = `${Math.max(leftBound, Math.min(rightBound, maxPosition))}px`;
            maxDisplay.style.top = '0px';
        }
        
        minDisplay.textContent = minText;
        maxDisplay.textContent = maxText;
        
        this.updateUI();
    }

    updateSingleRange(symbol, field, slider) {
        const data = this.state.symbols.get(symbol);
        if (!data) return;
        
        const value = parseFloat(slider.value);
        data[field] = value;
        
        const display = slider.nextElementSibling;
        if (field === 'spreadPercent') {
            display.textContent = value.toFixed(1);
        } else if (field === 'volumeM') {
            display.textContent = value.toFixed(2);
        } else {
            display.textContent = value.toFixed(2);
        }
        
        this.updateUI();
    }

    updateSymbolDisplay(symbol, field, value) {
        if (field === 'percentage') {
            const card = document.querySelector(`[data-symbol="${symbol}"]`);
            if (card) {
                const input = card.querySelector('.percentage-input');
                if (input) input.value = value;
            }
        }
    }

    getRemainingPercentage() {
        const total = Array.from(this.state.symbols.values())
            .reduce((sum, data) => sum + data.percentage, 0);
        return 100 - total;
    }

    updateUI() {
        this.updatePercentageStatus();
        this.updateGenerateButton();
        
        // Call external update callback if provided
        if (this.onUpdate) {
            this.onUpdate(this.exportConfiguration());
        }
    }

    updatePercentageStatus() {
        const remaining = this.getRemainingPercentage();
        const status = document.getElementById('percentageStatus');
        
        if (Math.abs(remaining) < 0.01) {
            status.textContent = '✓ 100% allocated';
            status.className = 'percentage-status status-complete';
        } else if (remaining > 0) {
            status.textContent = `${remaining.toFixed(1)}% remaining`;
            status.className = 'percentage-status status-remaining';
        } else {
            status.textContent = `${Math.abs(remaining).toFixed(1)}% over limit!`;
            status.className = 'percentage-status status-over';
        }
    }

    updateGenerateButton() {
        const generateBtn = document.getElementById('generateBtn') || document.getElementById('runBtn') || document.getElementById('generateButton');
        if (!generateBtn) return;
        
        const hasSymbols = this.state.symbols.size > 0;
        const percentageValid = Math.abs(this.getRemainingPercentage()) < 0.01;
        const isValid = hasSymbols && percentageValid;
        
        generateBtn.disabled = !isValid;
    }

    updateExchangeDefaults() {
        // Update existing symbol cards with new exchange ranges
        for (const [symbol, data] of this.state.symbols) {
            const card = document.querySelector(`[data-symbol="${symbol}"]`);
            if (card) {
                const defaults = this.exchangeDefaults[this.state.outputFormat];
            }
        }
    }

    exportConfiguration() {
        return {
            totalMessages: this.state.totalMessages,
            outputFormat: this.state.outputFormat,
            symbols: Object.fromEntries(this.state.symbols),
            timestamp: new Date().toISOString()
        };
    }

    // Set callback for when generator state updates
    setUpdateCallback(callback) {
        this.onUpdate = callback;
    }

    // Programmatic method to add symbol (for headless use)
    addSymbolProgrammatically(symbolName, percentage) {
        const symbol = symbolName.trim().toUpperCase();
        
        if (this.state.symbols.has(symbol)) {
            return false;
        }
        
        const defaults = this.exchangeDefaults[this.state.outputFormat];
        this.state.symbols.set(symbol, {
            percentage: percentage,
            priceRange: [...defaults.priceRange],
            qtyRange: [...defaults.qtyRange],
            spreadRange: [...defaults.spreadRange]
        });
        
        return true;
    }

    // Initialize without UI for programmatic use
    initWithoutUI() {
        this.state.totalMessages = 10000;
        this.state.outputFormat = 'nsdq';
    }

    // Generate market data programmatically
    generateMarketData() {
        return new Promise((resolve, reject) => {
            try {
                const data = [];
                const totalMessages = this.state.totalMessages;
                const symbols = Array.from(this.state.symbols.entries());
                
                if (symbols.length === 0) {
                    reject(new Error('No symbols configured'));
                    return;
                }
                
                for (let i = 0; i < totalMessages; i++) {
                    // Pick a random symbol based on percentage allocation
                    const randomPercent = Math.random() * 100;
                    let cumulative = 0;
                    let selectedSymbol = null;
                    
                    for (const [symbol, config] of symbols) {
                        cumulative += config.percentage;
                        if (randomPercent <= cumulative) {
                            selectedSymbol = { symbol, config };
                            break;
                        }
                    }
                    
                    if (!selectedSymbol) {
                        selectedSymbol = symbols[0]; // fallback
                    }
                    
                    const { symbol, config } = selectedSymbol;
                    
                    // Generate random data within ranges
                    const price = this.randomInRange(config.priceRange[0], config.priceRange[1]);
                    const quantity = Math.floor(this.randomInRange(config.qtyRange[0], config.qtyRange[1]));
                    const spread = this.randomInRange(config.spreadRange[0], config.spreadRange[1]);
                    
                    data.push({
                        timestamp: Date.now() + i * 100, // 100ms intervals
                        symbol: symbol,
                        price: price.toFixed(2),
                        quantity: quantity,
                        spread: spread.toFixed(4),
                        side: Math.random() < 0.5 ? 'BUY' : 'SELL'
                    });
                }
                
                resolve(data);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Utility method for random number in range
    randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Toggle card collapse state
    toggleCard(event, symbol) {
        event.stopPropagation();
        const card = document.querySelector(`[data-symbol="${symbol}"]`);
        if (card) {
            card.classList.toggle('collapsed');
        }
    }
}

// Global instance variable for HTML onclick handlers (only when used standalone)
let generatorInstance;

// Export for ES6 modules
export default MarketDataGenerator;