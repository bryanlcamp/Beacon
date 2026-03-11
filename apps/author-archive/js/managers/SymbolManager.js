/**
 * Dataset Generator - Symbol Manager
 * Handles symbol validation, datacards creation, and symbol data management
 */

import { CONSTANTS, UTILS } from '../core/Constants.js';
import { EventEmitter } from '../core/EventEmitter.js';
import { ValidationEngine } from '../core/ValidationEngine.js';

export class SymbolManager extends EventEmitter {
    /**
     * Stub for onAny event forwarding
     */
    onAny(fn) {
      // No-op for now, or could forward all events if needed
    }
  constructor() {
    super();
    this.symbols = new Map(); // symbol -> datacard info
    this.validationEngine = new ValidationEngine();
    this.isDemo = UTILS.isDemoMode();
    this.exchanges = new Map();
    this.symbolCache = new Map(); // Cache for symbol lookups
  }

  /**
   * Initialize the symbol manager
   */
  async initialize() {
    console.log('📊 Initializing SymbolManager...');
    
    try {
      await this.loadExchangeData();
      this.bindEventListeners();
      this.setupValidationRules();
      
      this.emit(CONSTANTS.EVENTS.APP_READY, { 
        component: 'SymbolManager',
        exchanges: Array.from(this.exchanges.keys())
      });
      
      console.log('✅ SymbolManager initialized');
    } catch (error) {
      console.error('❌ SymbolManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Bind DOM event listeners
   * @private
   */
  bindEventListeners() {
    // Symbol input controls
    const symbolInput = document.getElementById('symbolInput');
    const addSymbolBtn = document.getElementById('addSymbol');
    const clearAllBtn = document.getElementById('clearAll');

    if (symbolInput) {
      symbolInput.addEventListener('input', (e) => this.handleSymbolInput(e));
      symbolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addSymbol();
        }
      });
    }

    if (addSymbolBtn) {
      addSymbolBtn.addEventListener('click', () => this.addSymbol());
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllSymbols());
    }

    // Listen for external events
    this.on('symbols:clear', () => this.clearAllSymbols());
    this.on('symbols:add', (symbolConfig) => this.addSymbolFromConfig(symbolConfig));
  }

  /**
   * Setup validation rules for symbols
   * @private
   */
  setupValidationRules() {
    // Symbol format validation
    this.validationEngine.addRule('symbol', (value) => {
      if (!value || typeof value !== 'string') return false;
      return /^[A-Z0-9]{1,6}$/.test(value.toUpperCase());
    }, 'Symbol must be 1-6 alphanumeric characters');

    // Percentage validation
    this.validationEngine.addRule('percentage', (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, 'Percentage must be between 0 and 100');

    // Price range validation
    this.validationEngine.addRule('priceRange', (range) => {
      if (!range || typeof range !== 'object') return false;
      const min = parseFloat(range.min);
      const max = parseFloat(range.max);
      return !isNaN(min) && !isNaN(max) && min >= 0 && max > min;
    }, 'Price range must have valid min < max values');
  }

  /**
   * Load exchange data and symbols
   */
  async loadExchangeData() {
    if (this.isDemo) {
      // Demo mode - use mock exchange data
      this.exchanges.set('NASDAQ', {
        name: 'NASDAQ',
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX']
      });
      this.exchanges.set('NYSE', {
        name: 'NYSE',
        symbols: ['JPM', 'JNJ', 'PG', 'WMT', 'V', 'HD', 'UNH', 'BAC']
      });
      this.exchanges.set('LSE', {
        name: 'London Stock Exchange',
        symbols: ['VODL', 'BARCL', 'RYAL', 'BPTSL', 'SHELR']
      });
      return;
    }

    try {
      const response = await fetch(CONSTANTS.API_ENDPOINTS.EXCHANGES);
      if (response.ok) {
        const exchangeData = await response.json();
        exchangeData.forEach(exchange => {
          this.exchanges.set(exchange.code, exchange);
        });
      } else {
        console.warn('Could not load exchange data from server');
        this.loadDefaultExchanges();
      }
    } catch (error) {
      console.warn('Failed to connect to exchange server:', error.message);
      this.loadDefaultExchanges();
    }
  }

  /**
   * Load default exchange data as fallback
   * @private
   */
  loadDefaultExchanges() {
    this.exchanges.set('NASDAQ', { name: 'NASDAQ', symbols: [] });
    this.exchanges.set('NYSE', { name: 'NYSE', symbols: [] });
  }

  /**
   * Handle symbol input changes
   * @param {Event} event - Input event
   */
  handleSymbolInput(event) {
    const input = event.target;
    const value = input.value.toUpperCase();
    
    // Update input value to uppercase
    if (input.value !== value) {
      input.value = value;
    }

    // Validate symbol format
    const isValid = this.validationEngine.validate('symbol', value);
    
    // Update input state
    input.classList.toggle('error', value.length > 0 && !isValid);
    
    // Enable/disable add button
    const addBtn = document.getElementById('addSymbol');
    if (addBtn) {
      addBtn.disabled = !isValid || this.symbols.has(value);
    }
  }

  /**
   * Add a symbol to the dataset
   * @param {string} symbolOverride - Optional symbol to add (for external calls)
   */
  async addSymbol(symbolOverride = null) {
    const symbolInput = document.getElementById('symbolInput');
    const exchangeSelect = document.getElementById('exchangeSelect');
    
    const symbol = (symbolOverride || (symbolInput ? symbolInput.value : '')).toUpperCase();
    const exchange = exchangeSelect ? exchangeSelect.value : CONSTANTS.DEFAULT_EXCHANGE;

    // Validate symbol
    if (!this.validationEngine.validate('symbol', symbol)) {
      this.showError('Invalid symbol format');
      return false;
    }

    // Check for duplicates
    if (this.symbols.has(symbol)) {
      this.showError(`Symbol ${symbol} already added`);
      return false;
    }

    try {
      // Validate symbol exists on exchange
      const isValidSymbol = await this.validateSymbolOnExchange(symbol, exchange);
      if (!isValidSymbol && !this.isDemo) {
        this.showError(`Symbol ${symbol} not found on ${exchange}`);
        return false;
      }

      // Create datacard
      const datacard = this.createDatacard(symbol, exchange);
      this.addDatacardToDOM(datacard);

      // Store symbol info
      this.symbols.set(symbol, {
        exchange,
        element: datacard,
        percentage: 0,
        created: new Date()
      });

      // Clear input and update UI
      if (symbolInput) {
        symbolInput.value = '';
        symbolInput.dispatchEvent(new Event('input'));
      }

      // Update percentage auto-scaling
      this.updatePercentageScaling();

      // Emit events
      this.emit(CONSTANTS.EVENTS.SYMBOL_ADDED, { symbol, exchange });
      this.emit('config:modified');

      console.log(`✅ Added symbol: ${symbol} (${exchange})`);
      return true;

    } catch (error) {
      this.showError(`Failed to add symbol: ${error.message}`);
      return false;
    }
  }

  /**
   * Add symbol from configuration object
   * @param {object} symbolConfig - Symbol configuration
   */
  addSymbolFromConfig(symbolConfig) {
    if (!symbolConfig || !symbolConfig.symbol) return;
    
    const symbol = symbolConfig.symbol.toUpperCase();
    const exchange = symbolConfig.exchange || CONSTANTS.DEFAULT_EXCHANGE;

    // Add symbol first
    if (this.addSymbol(symbol)) {
      // Apply configuration
      setTimeout(() => {
        this.applySymbolConfiguration(symbol, symbolConfig);
      }, 100);
    }
  }

  /**
   * Apply configuration to an existing symbol
   * @param {string} symbol - Symbol to configure
   * @param {object} config - Configuration object
   */
  applySymbolConfiguration(symbol, config) {
    const symbolData = this.symbols.get(symbol);
    if (!symbolData || !symbolData.element) return;

    const card = symbolData.element;

    try {
      // Set percentage
      if (config.percentage !== undefined) {
        const percentInput = card.querySelector('.percentage-input');
        if (percentInput) {
          percentInput.value = config.percentage;
          percentInput.dispatchEvent(new Event('input'));
        }
      }

      // Set price range
      if (config.priceRange) {
        this.setRangeValues(card, 'price', config.priceRange);
      }

      // Set quantity range
      if (config.quantityRange) {
        this.setRangeValues(card, 'quantity', config.quantityRange);
      }

      // Set sliders
      if (config.volatility !== undefined) {
        this.setSliderValue(card, 'volatility', config.volatility);
      }

      if (config.trend !== undefined) {
        this.setSliderValue(card, 'trend', config.trend);
      }

    } catch (error) {
      console.warn(`Failed to apply config to ${symbol}:`, error);
    }
  }

  /**
   * Set range slider values
   * @param {HTMLElement} card - Datacard element
   * @param {string} type - Range type (price/quantity)
   * @param {object} range - Range object with min/max
   * @private
   */
  setRangeValues(card, type, range) {
    const minSlider = card.querySelector(`[data-range="${type}-min"]`);
    const maxSlider = card.querySelector(`[data-range="${type}-max"]`);
    
    if (minSlider && range.min !== undefined) {
      minSlider.value = range.min;
      minSlider.dispatchEvent(new Event('input'));
    }
    
    if (maxSlider && range.max !== undefined) {
      maxSlider.value = range.max;
      maxSlider.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Set slider value
   * @param {HTMLElement} card - Datacard element
   * @param {string} type - Slider type
   * @param {number} value - Slider value
   * @private
   */
  setSliderValue(card, type, value) {
    const slider = card.querySelector(`[data-slider="${type}"]`);
    if (slider && value !== undefined) {
      slider.value = value;
      slider.dispatchEvent(new Event('input'));
    }
  }

  /**
   * Remove a symbol
   * @param {string} symbol - Symbol to remove
   */
  removeSymbol(symbol) {
    const symbolData = this.symbols.get(symbol);
    if (!symbolData) return;

    // Remove from DOM
    if (symbolData.element && symbolData.element.parentNode) {
      symbolData.element.remove();
    }

    // Remove from map
    this.symbols.delete(symbol);

    // Update percentage scaling
    this.updatePercentageScaling();

    // Emit events
    this.emit(CONSTANTS.EVENTS.SYMBOL_REMOVED, { symbol });
    this.emit('config:modified');

    console.log(`❌ Removed symbol: ${symbol}`);
  }

  /**
   * Clear all symbols
   */
  clearAllSymbols() {
    // Remove all datacards
    const datacardContainer = document.getElementById('datacardContainer');
    if (datacardContainer) {
      datacardContainer.innerHTML = '';
    }

    // Clear symbols map
    this.symbols.clear();

    // Emit events
    this.emit(CONSTANTS.EVENTS.SYMBOLS_CLEARED);
    this.emit('config:modified');

    console.log('🧹 Cleared all symbols');
  }

  /**
   * Create datacard element for a symbol
   * @param {string} symbol - Symbol name
   * @param {string} exchange - Exchange name
   * @returns {HTMLElement} Datacard element
   */
  createDatacard(symbol, exchange) {
    const card = document.createElement('div');
    card.className = 'datacard';
    card.dataset.symbol = symbol;
    card.dataset.exchange = exchange;

    card.innerHTML = `
      <div class="datacard-header">
        <div class="symbol-info">
          <span class="symbol-name">${symbol}</span>
          <span class="exchange-badge">${exchange}</span>
        </div>
        <button class="remove-symbol" aria-label="Remove ${symbol}" title="Remove Symbol">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="datacard-body">
        <!-- Percentage Control -->
        <div class="control-group">
          <label class="control-label">
            Percentage
            <span class="percentage-display">0%</span>
          </label>
          <div class="percentage-control">
            <input type="number" class="percentage-input" min="0" max="100" step="0.1" value="0">
            <div class="adorner-container">
              <span class="adorner auto-scale">AUTO</span>
            </div>
          </div>
        </div>

        <!-- Price Range -->
        <div class="control-group">
          <label class="control-label">Price Range</label>
          <div class="range-control">
            <div class="range-inputs">
              <input type="range" class="range-slider" data-range="price-min" min="1" max="1000" value="50">
              <input type="range" class="range-slider" data-range="price-max" min="1" max="1000" value="150">
            </div>
            <div class="range-display">
              <span class="range-text">$<span class="min-value">50</span> - $<span class="max-value">150</span></span>
            </div>
          </div>
        </div>

        <!-- Quantity Range -->
        <div class="control-group">
          <label class="control-label">Quantity Range</label>
          <div class="range-control">
            <div class="range-inputs">
              <input type="range" class="range-slider" data-range="quantity-min" min="1" max="10000" value="100">
              <input type="range" class="range-slider" data-range="quantity-max" min="1" max="10000" value="1000">
            </div>
            <div class="range-display">
              <span class="range-text"><span class="min-value">100</span> - <span class="max-value">1,000</span></span>
            </div>
          </div>
        </div>

        <!-- Volatility -->
        <div class="control-group">
          <label class="control-label">Volatility <span class="value-display">50%</span></label>
          <input type="range" class="control-slider" data-slider="volatility" min="0" max="100" value="50">
        </div>

        <!-- Trend -->
        <div class="control-group">
          <label class="control-label">Trend <span class="value-display">Neutral</span></label>
          <input type="range" class="control-slider" data-slider="trend" min="-50" max="50" value="0">
        </div>
      </div>
    `;

    // Bind datacard events
    this.bindDatacardEvents(card, symbol);

    return card;
  }

  /**
   * Bind event listeners for a datacard
   * @param {HTMLElement} card - Datacard element
   * @param {string} symbol - Symbol name
   * @private
   */
  bindDatacardEvents(card, symbol) {
    // Remove button
    const removeBtn = card.querySelector('.remove-symbol');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => this.removeSymbol(symbol));
    }

    // Percentage input
    const percentageInput = card.querySelector('.percentage-input');
    if (percentageInput) {
      percentageInput.addEventListener('input', (e) => {
        this.handlePercentageChange(symbol, e.target.value);
      });
    }

    // Range sliders
    const rangeSliders = card.querySelectorAll('[data-range]');
    rangeSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        this.handleRangeChange(card, e.target);
      });
    });

    // Control sliders
    const controlSliders = card.querySelectorAll('[data-slider]');
    controlSliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        this.handleSliderChange(card, e.target);
      });
    });
  }

  /**
   * Handle percentage input change
   * @param {string} symbol - Symbol name
   * @param {string} value - New percentage value
   */
  handlePercentageChange(symbol, value) {
    const symbolData = this.symbols.get(symbol);
    if (!symbolData) return;

    const percentage = parseFloat(value) || 0;
    symbolData.percentage = percentage;

    // Update display
    const card = symbolData.element;
    const display = card.querySelector('.percentage-display');
    if (display) {
      display.textContent = `${percentage.toFixed(1)}%`;
    }

    // Check if auto-scaling is needed
    this.checkAutoScaling();

    this.emit('config:modified');
  }

  /**
   * Handle range slider change
   * @param {HTMLElement} card - Datacard element
   * @param {HTMLElement} slider - Range slider element
   */
  handleRangeChange(card, slider) {
    const rangeType = slider.dataset.range;
    const [type, position] = rangeType.split('-');
    
    const minSlider = card.querySelector(`[data-range="${type}-min"]`);
    const maxSlider = card.querySelector(`[data-range="${type}-max"]`);
    const display = card.querySelector(`[data-range="${type}-min"]`).closest('.range-control').querySelector('.range-display');
    
    if (!minSlider || !maxSlider || !display) return;

    const minValue = parseFloat(minSlider.value);
    const maxValue = parseFloat(maxSlider.value);

    // Ensure min <= max
    if (position === 'min' && minValue > maxValue) {
      maxSlider.value = minValue;
    } else if (position === 'max' && maxValue < minValue) {
      minSlider.value = maxValue;
    }

    // Update display
    const finalMin = parseFloat(minSlider.value);
    const finalMax = parseFloat(maxSlider.value);
    
    const minText = type === 'price' ? `$${finalMin}` : finalMin.toLocaleString();
    const maxText = type === 'price' ? `$${finalMax}` : finalMax.toLocaleString();
    
    const rangeText = display.querySelector('.range-text');
    if (rangeText) {
      rangeText.innerHTML = `${minText} - ${maxText}`;
    }

    this.emit('config:modified');
  }

  /**
   * Handle control slider change
   * @param {HTMLElement} card - Datacard element
   * @param {HTMLElement} slider - Control slider element
   */
  handleSliderChange(card, slider) {
    const sliderType = slider.dataset.slider;
    const value = parseFloat(slider.value);
    
    const display = slider.closest('.control-group').querySelector('.value-display');
    if (!display) return;

    let displayText = '';
    
    switch (sliderType) {
      case 'volatility':
        displayText = `${value}%`;
        break;
      case 'trend':
        if (value === 0) displayText = 'Neutral';
        else if (value > 0) displayText = `Bullish +${value}%`;
        else displayText = `Bearish ${value}%`;
        break;
      default:
        displayText = value.toString();
    }
    
    display.textContent = displayText;
    this.emit('config:modified');
  }

  /**
   * Add datacard to DOM
   * @param {HTMLElement} datacard - Datacard element to add
   */
  addDatacardToDOM(datacard) {
    const container = document.getElementById('datacardContainer');
    if (!container) {
      console.error('Datacard container not found');
      return;
    }

    container.appendChild(datacard);

    // Animate in
    requestAnimationFrame(() => {
      datacard.classList.add('visible');
    });
  }

  /**
   * Update percentage auto-scaling
   */
  updatePercentageScaling() {
    const symbolCount = this.symbols.size;
    if (symbolCount === 0) return;

    const evenPercentage = (100 / symbolCount).toFixed(1);
    
    // Check if all percentages are 0 or if auto-scaling is needed
    let needsAutoScale = false;
    let totalPercentage = 0;

    for (const [symbol, data] of this.symbols) {
      totalPercentage += data.percentage || 0;
      if (data.percentage === 0) needsAutoScale = true;
    }

    // If total is very close to 100 or all are 0, enable auto-scaling
    if (needsAutoScale || Math.abs(totalPercentage - 100) > 0.1) {
      this.applyAutoScaling(evenPercentage);
    }
  }

  /**
   * Apply auto-scaling to all symbols
   * @param {string} evenPercentage - Even percentage to apply
   */
  applyAutoScaling(evenPercentage) {
    for (const [symbol, data] of this.symbols) {
      const card = data.element;
      const input = card.querySelector('.percentage-input');
      const display = card.querySelector('.percentage-display');
      const adorner = card.querySelector('.adorner');

      if (input && display) {
        input.value = evenPercentage;
        display.textContent = `${evenPercentage}%`;
        data.percentage = parseFloat(evenPercentage);
        
        // Show auto adorner briefly
        if (adorner) {
          adorner.classList.add('active');
          setTimeout(() => adorner.classList.remove('active'), 2000);
        }
      }
    }
  }

  /**
   * Check if auto-scaling should be triggered
   */
  checkAutoScaling() {
    const total = Array.from(this.symbols.values())
      .reduce((sum, data) => sum + (data.percentage || 0), 0);
    
    // If total exceeds 100%, normalize
    if (total > 100) {
      this.normalizePercentages();
    }
  }

  /**
   * Normalize percentages to total 100%
   */
  normalizePercentages() {
    const total = Array.from(this.symbols.values())
      .reduce((sum, data) => sum + (data.percentage || 0), 0);
    
    if (total <= 0) return;

    const normalizer = 100 / total;

    for (const [symbol, data] of this.symbols) {
      const normalizedPercentage = (data.percentage * normalizer).toFixed(1);
      const card = data.element;
      const input = card.querySelector('.percentage-input');
      const display = card.querySelector('.percentage-display');

      if (input && display) {
        input.value = normalizedPercentage;
        display.textContent = `${normalizedPercentage}%`;
        data.percentage = parseFloat(normalizedPercentage);
      }
    }
  }

  /**
   * Validate symbol exists on exchange
   * @param {string} symbol - Symbol to validate
   * @param {string} exchange - Exchange to check
   * @returns {Promise<boolean>} Whether symbol is valid
   */
  async validateSymbolOnExchange(symbol, exchange) {
    // Check cache first
    const cacheKey = `${symbol}:${exchange}`;
    if (this.symbolCache.has(cacheKey)) {
      return this.symbolCache.get(cacheKey);
    }

    if (this.isDemo) {
      // Demo mode - check against mock data
      const exchangeData = this.exchanges.get(exchange);
      const isValid = exchangeData && exchangeData.symbols.includes(symbol);
      this.symbolCache.set(cacheKey, isValid);
      return isValid;
    }

    try {
      const response = await fetch(`${CONSTANTS.API_ENDPOINTS.VALIDATE_SYMBOL}?symbol=${symbol}&exchange=${exchange}`);
      const isValid = response.ok && (await response.json()).valid;
      this.symbolCache.set(cacheKey, isValid);
      return isValid;
    } catch (error) {
      console.warn('Symbol validation failed:', error);
      // Return true in case of network issues (fail open)
      return true;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.emit(CONSTANTS.EVENTS.ERROR_OCCURRED, {
      type: 'symbol',
      message,
      timestamp: new Date()
    });
  }

  /**
   * Get all symbol data
   * @returns {Array} Array of symbol data objects
   */
  getAllSymbolData() {
    return Array.from(this.symbols.entries()).map(([symbol, data]) => ({
      symbol,
      exchange: data.exchange,
      percentage: data.percentage,
      created: data.created
    }));
  }

  /**
   * Get total percentage allocated
   * @returns {number} Total percentage
   */
  getTotalPercentage() {
    return Array.from(this.symbols.values())
      .reduce((sum, data) => sum + (data.percentage || 0), 0);
  }

  /**
   * Get symbol count
   * @returns {number} Number of symbols
   */
  getSymbolCount() {
    return this.symbols.size;
  }

  /**
   * Check if symbol exists
   * @param {string} symbol - Symbol to check
   * @returns {boolean} Whether symbol exists
   */
  hasSymbol(symbol) {
    return this.symbols.has(symbol.toUpperCase());
  }
}