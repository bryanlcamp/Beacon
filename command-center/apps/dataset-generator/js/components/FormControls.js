/**
 * Dataset Generator - Form Controls Component
 * Handles all form interactions, validation, and UI feedback
 */

import { CONSTANTS, UTILS } from '../core/Constants.js';
import { EventEmitter } from '../core/EventEmitter.js';
import { ValidationEngine } from '../core/ValidationEngine.js';

export class FormControls extends EventEmitter {
    /**
     * Stub for onAny event forwarding
     */
    onAny(fn) {
      // No-op for now, or could forward all events if needed
    }
  constructor() {
    super();
    this.validationEngine = new ValidationEngine();
    this.formState = new Map();
    this.spinnerState = {
      isSpinning: false,
      direction: 1,
      position: 0,
      element: null
    };
  }

  /**
   * Initialize form controls
   */
  initialize() {
    console.log('📋 Initializing FormControls...');
    
    this.setupFormElements();
    this.bindEventListeners();
    this.setupValidationRules();
    this.initializeSpinner();
    
    this.emit(CONSTANTS.EVENTS.APP_READY, { 
      component: 'FormControls' 
    });
    
    console.log('✅ FormControls initialized');
  }

  /**
   * Setup form elements and their initial state
   * @private
   */
  setupFormElements() {
    // Message count input
    const messageCountInput = document.getElementById('messageCount');
    if (messageCountInput) {
      this.formState.set('messageCount', {
        element: messageCountInput,
        defaultValue: CONSTANTS.DEFAULT_MESSAGE_COUNT,
        validator: 'messageCount'
      });
    }

    // Exchange select
    const exchangeSelect = document.getElementById('exchangeSelect');
    if (exchangeSelect) {
      this.formState.set('exchangeSelect', {
        element: exchangeSelect,
        defaultValue: CONSTANTS.DEFAULT_EXCHANGE,
        validator: 'exchange'
      });
      this.populateExchangeSelect(exchangeSelect);
    }

    // Symbol input
    const symbolInput = document.getElementById('symbolInput');
    if (symbolInput) {
      this.formState.set('symbolInput', {
        element: symbolInput,
        defaultValue: '',
        validator: 'symbol'
      });
    }

    // Generation controls
    const generateBtn = document.getElementById('generateDataset');
    if (generateBtn) {
      this.formState.set('generateBtn', {
        element: generateBtn,
        defaultState: 'ready'
      });
    }
  }

  /**
   * Bind event listeners for form controls
   * @private
   */
  bindEventListeners() {
    // Message count validation
    const messageCountInput = this.getElement('messageCount');
    if (messageCountInput) {
      messageCountInput.addEventListener('input', (e) => {
        this.validateField('messageCount', e.target.value);
        this.emit('config:modified');
      });

      messageCountInput.addEventListener('blur', (e) => {
        this.formatMessageCount(e.target);
      });
    }

    // Exchange selection
    const exchangeSelect = this.getElement('exchangeSelect');
    if (exchangeSelect) {
      exchangeSelect.addEventListener('change', (e) => {
        this.handleExchangeChange(e.target.value);
        this.emit('config:modified');
      });
    }

    // Generate button
    const generateBtn = this.getElement('generateBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.handleGenerateDataset();
      });
    }

    // Listen for external events
    this.on(CONSTANTS.EVENTS.SYMBOL_ADDED, () => this.updateGenerateButtonState());
    this.on(CONSTANTS.EVENTS.SYMBOL_REMOVED, () => this.updateGenerateButtonState());
    this.on(CONSTANTS.EVENTS.SYMBOLS_CLEARED, () => this.updateGenerateButtonState());
  }

  /**
   * Setup validation rules for form fields
   * @private
   */
  setupValidationRules() {
    // Message count validation
    this.validationEngine.addRule('messageCount', (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 1000 && num <= 10000000;
    }, 'Message count must be between 1,000 and 10,000,000');

    // Exchange validation
    this.validationEngine.addRule('exchange', (value) => {
      return value && typeof value === 'string' && value.length > 0;
    }, 'Please select an exchange');

    // Symbol validation (inherited from SymbolManager)
    this.validationEngine.addRule('symbol', (value) => {
      if (!value || typeof value !== 'string') return false;
      return /^[A-Z0-9]{1,6}$/.test(value.toUpperCase());
    }, 'Symbol must be 1-6 alphanumeric characters');
  }

  /**
   * Initialize the loading spinner
   * @private
   */
  initializeSpinner() {
    const messageCountGroup = document.querySelector('.message-count-group');
    if (!messageCountGroup) return;

    // Create spinner element
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <svg viewBox="0 0 50 50" class="spinner-svg">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
          <animate attributeName="stroke-array" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
        </circle>
      </svg>
    `;

    messageCountGroup.appendChild(spinner);
    this.spinnerState.element = spinner;
  }

  /**
   * Populate exchange select dropdown
   * @param {HTMLSelectElement} select - Exchange select element
   * @private
   */
  populateExchangeSelect(select) {
    const exchanges = [
      { code: 'NASDAQ', name: 'NASDAQ' },
      { code: 'NYSE', name: 'New York Stock Exchange' },
      { code: 'LSE', name: 'London Stock Exchange' },
      { code: 'TSE', name: 'Tokyo Stock Exchange' },
      { code: 'HKEX', name: 'Hong Kong Exchange' }
    ];

    // Clear existing options except the first (placeholder)
    const placeholder = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (placeholder) {
      select.appendChild(placeholder);
    }

    // Add exchange options
    exchanges.forEach(exchange => {
      const option = document.createElement('option');
      option.value = exchange.code;
      option.textContent = exchange.name;
      select.appendChild(option);
    });

    // Set default value
    select.value = CONSTANTS.DEFAULT_EXCHANGE;
  }

  /**
   * Validate a form field
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @returns {boolean} Validation result
   */
  validateField(fieldName, value) {
    const fieldState = this.formState.get(fieldName);
    if (!fieldState || !fieldState.validator) return true;

    const isValid = this.validationEngine.validate(fieldState.validator, value);
    const element = fieldState.element;

    if (element) {
      element.classList.toggle('error', !isValid);
      
      // Show/hide error message
      this.updateFieldErrorMessage(element, isValid, fieldState.validator);
    }

    return isValid;
  }

  /**
   * Update field error message display
   * @param {HTMLElement} element - Form element
   * @param {boolean} isValid - Validation result
   * @param {string} validatorName - Validator name for error message
   * @private
   */
  updateFieldErrorMessage(element, isValid, validatorName) {
    const errorContainer = element.parentNode.querySelector('.field-error');
    
    if (isValid) {
      if (errorContainer) {
        errorContainer.remove();
      }
    } else {
      if (!errorContainer) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = this.validationEngine.getErrorMessage(validatorName);
        element.parentNode.appendChild(errorDiv);
      }
    }
  }

  /**
   * Format message count input with commas
   * @param {HTMLInputElement} input - Message count input
   */
  formatMessageCount(input) {
    const value = parseInt(input.value.replace(/,/g, ''));
    if (!isNaN(value)) {
      input.value = value.toLocaleString();
    }
  }

  /**
   * Handle exchange selection change
   * @param {string} exchangeCode - Selected exchange code
   */
  handleExchangeChange(exchangeCode) {
    console.log(`📊 Exchange changed to: ${exchangeCode}`);
    
    // Show loading state
    this.showSpinner();

    // Emit exchange change event
    this.emit(CONSTANTS.EVENTS.EXCHANGE_CHANGED, { 
      exchange: exchangeCode,
      timestamp: new Date()
    });

    // Hide spinner after short delay (simulating load)
    setTimeout(() => {
      this.hideSpinner();
    }, 800);
  }

  /**
   * Handle dataset generation
   */
  async handleGenerateDataset() {
    console.log('🔄 Starting dataset generation...');
    
    // Validate all fields
    if (!this.validateAllFields()) {
      this.showError('Please fix validation errors before generating');
      return;
    }

    // Check if symbols exist
    if (this.getSymbolCount() === 0) {
      this.showError('Please add at least one symbol before generating');
      return;
    }

    // Check percentage total
    const totalPercentage = this.getTotalPercentage();
    if (Math.abs(totalPercentage - 100) > 0.1) {
      this.showError('Symbol percentages must total 100%');
      return;
    }

    try {
      // Set generating state
      this.setGenerateButtonState('generating');
      
      // Gather generation parameters
      const params = this.gatherGenerationParameters();
      
      // Emit generation start event
      this.emit(CONSTANTS.EVENTS.GENERATION_STARTED, params);
      
      // Start generation process (this will be handled by the main app)
      await this.performGeneration(params);
      
    } catch (error) {
      console.error('❌ Generation failed:', error);
      this.showError(`Generation failed: ${error.message}`);
      this.setGenerateButtonState('error');
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean} Overall validation result
   */
  validateAllFields() {
    let allValid = true;

    for (const [fieldName, fieldState] of this.formState) {
      if (fieldState.validator && fieldState.element) {
        const isValid = this.validateField(fieldName, fieldState.element.value);
        if (!isValid) allValid = false;
      }
    }

    return allValid;
  }

  /**
   * Gather generation parameters from form
   * @returns {object} Generation parameters
   */
  gatherGenerationParameters() {
    const messageCountInput = this.getElement('messageCount');
    const exchangeSelect = this.getElement('exchangeSelect');

    return {
      messageCount: parseInt((messageCountInput?.value || '0').replace(/,/g, '')),
      exchange: exchangeSelect?.value || CONSTANTS.DEFAULT_EXCHANGE,
      symbols: this.getSymbolData(),
      timestamp: new Date(),
      version: CONSTANTS.VERSION
    };
  }

  /**
   * Perform the actual generation process
   * @param {object} params - Generation parameters
   */
  async performGeneration(params) {
    const isDemo = UTILS.isDemoMode();
    
    if (isDemo) {
      // Demo mode - simulate generation
      await this.simulateGeneration(params);
    } else {
      // Real mode - call backend API
      await this.callGenerationAPI(params);
    }
  }

  /**
   * Simulate generation for demo mode
   * @param {object} params - Generation parameters
   */
  async simulateGeneration(params) {
    const steps = [
      'Validating symbols...',
      'Connecting to market data...',
      'Generating price movements...',
      'Creating order book data...',
      'Writing dataset file...',
      'Finalizing output...'
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const progress = ((i + 1) / steps.length) * 100;
      
      this.emit(CONSTANTS.EVENTS.GENERATION_PROGRESS, {
        step,
        progress,
        message: step
      });

      // Wait for simulation delay
      await this.delay(500 + Math.random() * 1000);
    }

    // Complete generation
    this.emit(CONSTANTS.EVENTS.GENERATION_COMPLETED, {
      success: true,
      message: 'Dataset generated successfully (demo mode)',
      params,
      outputFile: `demo-dataset-${Date.now()}.bin`
    });

    this.setGenerateButtonState('success');
  }

  /**
   * Call backend generation API
   * @param {object} params - Generation parameters
   */
  async callGenerationAPI(params) {
    try {
      const response = await fetch(CONSTANTS.API_ENDPOINTS.GENERATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.emit(CONSTANTS.EVENTS.GENERATION_COMPLETED, {
        success: true,
        message: 'Dataset generated successfully',
        params,
        result
      });

      this.setGenerateButtonState('success');

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update generate button state based on symbols
   */
  updateGenerateButtonState() {
    const symbolCount = this.getSymbolCount();
    const totalPercentage = this.getTotalPercentage();
    const generateBtn = this.getElement('generateBtn');

    if (!generateBtn) return;

    const isReady = symbolCount > 0 && Math.abs(totalPercentage - 100) <= 0.1;
    generateBtn.disabled = !isReady;

    // Update button text and state
    if (symbolCount === 0) {
      this.setGenerateButtonState('no-symbols');
    } else if (Math.abs(totalPercentage - 100) > 0.1) {
      this.setGenerateButtonState('invalid-percentage');
    } else {
      this.setGenerateButtonState('ready');
    }
  }

  /**
   * Set generate button state
   * @param {string} state - Button state (ready, generating, success, error, etc.)
   */
  setGenerateButtonState(state) {
    const generateBtn = this.getElement('generateBtn');
    if (!generateBtn) return;

    // Remove all state classes
    generateBtn.className = generateBtn.className.replace(/\bstate-\w+/g, '');
    generateBtn.classList.add(`state-${state}`);

    const stateConfig = {
      'ready': {
        text: 'Generate Dataset',
        disabled: false,
        spinner: false
      },
      'no-symbols': {
        text: 'Add Symbols First',
        disabled: true,
        spinner: false
      },
      'invalid-percentage': {
        text: 'Fix Percentages (Total: ' + this.getTotalPercentage().toFixed(1) + '%)',
        disabled: true,
        spinner: false
      },
      'generating': {
        text: 'Generating...',
        disabled: true,
        spinner: true
      },
      'success': {
        text: 'Generated Successfully!',
        disabled: false,
        spinner: false
      },
      'error': {
        text: 'Generation Failed - Retry',
        disabled: false,
        spinner: false
      }
    };

    const config = stateConfig[state] || stateConfig['ready'];
    
    generateBtn.textContent = config.text;
    generateBtn.disabled = config.disabled;

    if (config.spinner) {
      this.showSpinner();
    } else {
      this.hideSpinner();
    }

    // Auto-reset success/error states
    if (state === 'success' || state === 'error') {
      setTimeout(() => {
        this.updateGenerateButtonState();
      }, 3000);
    }
  }

  /**
   * Show loading spinner
   */
  showSpinner() {
    if (this.spinnerState.element) {
      this.spinnerState.element.classList.add('active');
      this.spinnerState.isSpinning = true;
    }
  }

  /**
   * Hide loading spinner
   */
  hideSpinner() {
    if (this.spinnerState.element) {
      this.spinnerState.element.classList.remove('active');
      this.spinnerState.isSpinning = false;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.emit(CONSTANTS.EVENTS.ERROR_OCCURRED, {
      type: 'form',
      message,
      timestamp: new Date()
    });
  }

  /**
   * Get form element by name
   * @param {string} name - Element name
   * @returns {HTMLElement|null} Element or null
   */
  getElement(name) {
    const fieldState = this.formState.get(name);
    return fieldState ? fieldState.element : null;
  }

  /**
   * Get symbol count (to be implemented by main app)
   * @returns {number} Symbol count
   */
  getSymbolCount() {
    // This will be overridden by the main app
    return 0;
  }

  /**
   * Get total percentage (to be implemented by main app)
   * @returns {number} Total percentage
   */
  getTotalPercentage() {
    // This will be overridden by the main app
    return 0;
  }

  /**
   * Get symbol data (to be implemented by main app)
   * @returns {Array} Symbol data array
   */
  getSymbolData() {
    // This will be overridden by the main app
    return [];
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset form to initial state
   */
  reset() {
    for (const [fieldName, fieldState] of this.formState) {
      if (fieldState.element && fieldState.defaultValue !== undefined) {
        fieldState.element.value = fieldState.defaultValue;
        fieldState.element.classList.remove('error');
      }
    }

    this.setGenerateButtonState('ready');
    this.hideSpinner();
  }

  /**
   * Get form validation state
   * @returns {object} Validation state object
   */
  getValidationState() {
    const state = {};

    for (const [fieldName, fieldState] of this.formState) {
      if (fieldState.validator && fieldState.element) {
        state[fieldName] = this.validationEngine.validate(
          fieldState.validator, 
          fieldState.element.value
        );
      }
    }

    return state;
  }
}