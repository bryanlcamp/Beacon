/**
 * Dataset Generator - Configuration Manager
 * Handles loading, saving, and managing dataset configurations
 */

import { CONSTANTS, UTILS } from '../core/Constants.js';
import { EventEmitter } from '../core/EventEmitter.js';

export class ConfigManager extends EventEmitter {
    /**
     * Stub for onAny event forwarding
     */
    onAny(fn) {
      // No-op for now, or could forward all events if needed
    }
  constructor() {
    super();
    this.currentConfig = null;
    this.configModified = false;
    this.isDemo = UTILS.isDemoMode();
    this.availableConfigs = [];
  }

  /**
   * Initialize the configuration manager
   */
  async initialize() {
    console.log('🔧 Initializing ConfigManager...');
    
    try {
      await this.loadAvailableConfigs();
      this.bindEventListeners();
      
      this.emit(CONSTANTS.EVENTS.APP_READY, { 
        component: 'ConfigManager',
        configs: this.availableConfigs 
      });
      
      console.log('✅ ConfigManager initialized');
    } catch (error) {
      console.error('❌ ConfigManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Bind DOM event listeners
   * @private
   */
  bindEventListeners() {
    const loadBtn = document.getElementById('loadConfig');
    const saveBtn = document.getElementById('saveConfig');
    const newBtn = document.getElementById('newConfig');

    if (loadBtn) {
      loadBtn.addEventListener('click', () => this.showLoadDialog());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.showSaveDialog());
    }

    if (newBtn) {
      newBtn.addEventListener('click', () => this.createNewConfig());
    }
  }

  /**
   * Load available configurations from backend
   */
  async loadAvailableConfigs() {
    if (this.isDemo) {
      // Demo mode - use mock configs
      this.availableConfigs = [
        { name: 'Sample NASDAQ Config', lastModified: new Date() },
        { name: 'NYSE Blue Chips', lastModified: new Date() },
        { name: 'Tech Stocks Dataset', lastModified: new Date() }
      ];
      return;
    }

    try {
      const response = await fetch(CONSTANTS.API_ENDPOINTS.CONFIGS);
      if (response.ok) {
        this.availableConfigs = await response.json();
      } else {
        console.warn('Could not load configs from server');
        this.availableConfigs = [];
      }
    } catch (error) {
      console.warn('Failed to connect to config server:', error.message);
      this.availableConfigs = [];
    }
  }

  /**
   * Show load configuration dialog
   */
  showLoadDialog() {
    if (this.availableConfigs.length === 0) {
      this.emit(CONSTANTS.EVENTS.CONFIG_LOADED, {
        success: false,
        message: 'No configurations available'
      });
      return;
    }

    // Create and show modal with config list
    this.createConfigModal('load');
  }

  /**
   * Show save configuration dialog
   */
  showSaveDialog() {
    this.createConfigModal('save');
  }

  /**
   * Create new configuration
   */
  createNewConfig() {
    this.currentConfig = null;
    this.configModified = false;
    this.updateConfigState();
    
    this.emit(CONSTANTS.EVENTS.CONFIG_CREATED, {
      success: true,
      message: 'New configuration created'
    });
  }

  /**
   * Load a specific configuration
   * @param {string} configName - Name of configuration to load
   */
  async loadConfig(configName) {
    if (this.isDemo) {
      // Demo mode - return mock config
      const mockConfig = this.createMockConfig(configName);
      this.applyConfig(mockConfig);
      return;
    }

    try {
      const response = await fetch(`${CONSTANTS.API_ENDPOINTS.LOAD_CONFIG}/${configName}`);
      if (response.ok) {
        const config = await response.json();
        this.applyConfig(config);
      } else {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
    } catch (error) {
      this.emit(CONSTANTS.EVENTS.CONFIG_LOADED, {
        success: false,
        message: `Failed to load configuration: ${error.message}`
      });
    }
  }

  /**
   * Save current configuration
   * @param {string} configName - Name to save configuration as
   */
  async saveConfig(configName) {
    const config = this.generateCurrentConfig(configName);
    
    if (this.isDemo) {
      // Demo mode - simulate save
      setTimeout(() => {
        this.currentConfig = configName;
        this.configModified = false;
        this.updateConfigState();
        
        this.emit(CONSTANTS.EVENTS.CONFIG_SAVED, {
          success: true,
          message: `Configuration "${configName}" saved (demo mode)`,
          config
        });
      }, 500);
      return;
    }

    try {
      const response = await fetch(CONSTANTS.API_ENDPOINTS.SAVE_CONFIG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configName, config })
      });

      if (response.ok) {
        this.currentConfig = configName;
        this.configModified = false;
        this.updateConfigState();
        
        this.emit(CONSTANTS.EVENTS.CONFIG_SAVED, {
          success: true,
          message: `Configuration "${configName}" saved`,
          config
        });
      } else {
        throw new Error(`Failed to save config: ${response.statusText}`);
      }
    } catch (error) {
      this.emit(CONSTANTS.EVENTS.CONFIG_SAVED, {
        success: false,
        message: `Failed to save configuration: ${error.message}`
      });
    }
  }

  /**
   * Apply configuration to the UI
   * @param {object} config - Configuration object
   * @private
   */
  applyConfig(config) {
    try {
      // Set basic parameters
      const messageCountInput = document.getElementById('messageCount');
      const exchangeSelect = document.getElementById('exchangeSelect');

      if (messageCountInput && config.messageCount) {
        messageCountInput.value = config.messageCount;
        messageCountInput.dispatchEvent(new Event('input'));
      }

      if (exchangeSelect && config.exchange) {
        exchangeSelect.value = config.exchange;
        exchangeSelect.dispatchEvent(new Event('change'));
      }

      // Clear existing symbols and add config symbols
      this.emit('symbols:clear');
      
      if (config.symbols && config.symbols.length > 0) {
        config.symbols.forEach(symbolConfig => {
          this.emit('symbols:add', symbolConfig);
        });
      }

      this.currentConfig = config.name || 'Loaded Configuration';
      this.configModified = false;
      this.updateConfigState();

      this.emit(CONSTANTS.EVENTS.CONFIG_LOADED, {
        success: true,
        message: `Configuration "${config.name}" loaded`,
        config
      });

    } catch (error) {
      this.emit(CONSTANTS.EVENTS.CONFIG_LOADED, {
        success: false,
        message: `Failed to apply configuration: ${error.message}`
      });
    }
  }

  /**
   * Generate configuration object from current UI state
   * @param {string} name - Configuration name
   * @returns {object} Configuration object
   */
  generateCurrentConfig(name) {
    const messageCountInput = document.getElementById('messageCount');
    const exchangeSelect = document.getElementById('exchangeSelect');

    return {
      name,
      version: CONSTANTS.VERSION,
      created: new Date().toISOString(),
      messageCount: messageCountInput ? parseInt(messageCountInput.value) : 100000,
      exchange: exchangeSelect ? exchangeSelect.value : CONSTANTS.DEFAULT_EXCHANGE,
      symbols: this.getSymbolConfigs()
    };
  }

  /**
   * Get current symbol configurations
   * @returns {array} Array of symbol configuration objects
   * @private
   */
  getSymbolConfigs() {
    const symbols = [];
    const datacards = document.querySelectorAll('.datacard');

    datacards.forEach(card => {
      const symbolData = this.extractSymbolDataFromCard(card);
      if (symbolData) {
        symbols.push(symbolData);
      }
    });

    return symbols;
  }

  /**
   * Extract symbol data from datacard element
   * @param {HTMLElement} card - Datacard element
   * @returns {object|null} Symbol configuration
   * @private
   */
  extractSymbolDataFromCard(card) {
    try {
      const symbol = card.dataset.symbol;
      const exchange = card.dataset.exchange;
      const percentageInput = card.querySelector('.percentage-input');
      
      if (!symbol || !percentageInput) return null;

      return {
        symbol,
        exchange,
        percentage: parseFloat(percentageInput.value) || 0,
        priceRange: this.extractRangeValues(card, 'price'),
        quantityRange: this.extractRangeValues(card, 'quantity'),
        volatility: this.extractSliderValue(card, 'volatility'),
        trend: this.extractSliderValue(card, 'trend')
      };
    } catch (error) {
      console.warn('Failed to extract symbol data from card:', error);
      return null;
    }
  }

  /**
   * Extract range values from datacard
   * @param {HTMLElement} card - Datacard element
   * @param {string} type - Range type (price/quantity)
   * @returns {object} Range object with min/max
   * @private
   */
  extractRangeValues(card, type) {
    const minSlider = card.querySelector(`[data-range="${type}-min"]`);
    const maxSlider = card.querySelector(`[data-range="${type}-max"]`);
    
    return {
      min: minSlider ? parseFloat(minSlider.value) : 0,
      max: maxSlider ? parseFloat(maxSlider.value) : 100
    };
  }

  /**
   * Extract slider value from datacard
   * @param {HTMLElement} card - Datacard element
   * @param {string} type - Slider type
   * @returns {number} Slider value
   * @private
   */
  extractSliderValue(card, type) {
    const slider = card.querySelector(`[data-slider="${type}"]`);
    return slider ? parseFloat(slider.value) : 0;
  }

  /**
   * Create configuration modal dialog
   * @param {string} mode - Modal mode ('load' or 'save')
   * @private
   */
  createConfigModal(mode) {
    // Remove existing modal if present
    const existingModal = document.querySelector('.config-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay config-modal';
    modal.innerHTML = this.generateModalHTML(mode);
    
    document.body.appendChild(modal);
    
    // Bind modal events
    this.bindModalEvents(modal, mode);
    
    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);
  }

  /**
   * Generate modal HTML
   * @param {string} mode - Modal mode
   * @returns {string} Modal HTML
   * @private
   */
  generateModalHTML(mode) {
    const isLoad = mode === 'load';
    const title = isLoad ? 'Load Configuration' : 'Save Configuration';
    
    let content = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
    `;

    if (isLoad) {
      content += `
        <div class="config-list">
          ${this.availableConfigs.map(config => `
            <div class="config-item" data-config="${config.name}">
              <div class="config-name">${config.name}</div>
              <div class="config-date">${new Date(config.lastModified).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      content += `
        <div class="form-group">
          <label for="configName">Configuration Name</label>
          <input type="text" id="configName" class="form-control" placeholder="Enter configuration name..." maxlength="50">
        </div>
      `;
    }

    content += `
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn btn-primary modal-confirm" ${isLoad ? 'disabled' : ''}>${isLoad ? 'Load' : 'Save'}</button>
        </div>
      </div>
    `;

    return content;
  }

  /**
   * Bind modal event listeners
   * @param {HTMLElement} modal - Modal element
   * @param {string} mode - Modal mode
   * @private
   */
  bindModalEvents(modal, mode) {
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const confirmBtn = modal.querySelector('.modal-confirm');

    const closeModal = () => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    if (mode === 'load') {
      const configItems = modal.querySelectorAll('.config-item');
      let selectedConfig = null;

      configItems.forEach(item => {
        item.addEventListener('click', () => {
          configItems.forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          selectedConfig = item.dataset.config;
          confirmBtn.disabled = false;
        });
      });

      confirmBtn.addEventListener('click', () => {
        if (selectedConfig) {
          this.loadConfig(selectedConfig);
          closeModal();
        }
      });
    } else {
      const nameInput = modal.querySelector('#configName');
      
      nameInput.addEventListener('input', () => {
        confirmBtn.disabled = !nameInput.value.trim();
      });

      confirmBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
          this.saveConfig(name);
          closeModal();
        }
      });
    }
  }

  /**
   * Create mock configuration for demo mode
   * @param {string} name - Configuration name
   * @returns {object} Mock configuration
   * @private
   */
  createMockConfig(name) {
    const configs = {
      'Sample NASDAQ Config': {
        messageCount: 500000,
        exchange: 'NASDAQ',
        symbols: [
          { symbol: 'AAPL', percentage: 35, priceRange: { min: 150, max: 200 } },
          { symbol: 'MSFT', percentage: 30, priceRange: { min: 300, max: 350 } },
          { symbol: 'GOOGL', percentage: 35, priceRange: { min: 2500, max: 2800 } }
        ]
      },
      'NYSE Blue Chips': {
        messageCount: 750000,
        exchange: 'NYSE',
        symbols: [
          { symbol: 'JPM', percentage: 25, priceRange: { min: 140, max: 160 } },
          { symbol: 'JNJ', percentage: 25, priceRange: { min: 160, max: 180 } },
          { symbol: 'PG', percentage: 25, priceRange: { min: 140, max: 150 } },
          { symbol: 'WMT', percentage: 25, priceRange: { min: 145, max: 155 } }
        ]
      },
      'Tech Stocks Dataset': {
        messageCount: 1000000,
        exchange: 'NASDAQ',
        symbols: [
          { symbol: 'TSLA', percentage: 50, priceRange: { min: 200, max: 300 } },
          { symbol: 'NVDA', percentage: 50, priceRange: { min: 400, max: 500 } }
        ]
      }
    };

    return { name, ...configs[name] } || { name, messageCount: 100000, exchange: 'NASDAQ', symbols: [] };
  }

  /**
   * Update configuration state indicators
   */
  updateConfigState() {
    // This will be implemented when we create the UI feedback system
    this.emit('config:stateChanged', {
      currentConfig: this.currentConfig,
      modified: this.configModified
    });
  }

  /**
   * Mark configuration as modified
   */
  markAsModified() {
    this.configModified = true;
    this.updateConfigState();
  }

  /**
   * Get current configuration info
   * @returns {object} Current config info
   */
  getCurrentConfigInfo() {
    return {
      name: this.currentConfig,
      modified: this.configModified,
      hasConfig: !!this.currentConfig
    };
  }
}