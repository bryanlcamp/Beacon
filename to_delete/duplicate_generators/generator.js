/**
 * Generator-specific controller
 * Uses centralized validation engine
 */

import { UIController } from '../modules/ui-controller.js';
import { DatasetValidationEngine } from '../modules/dataset-validation.js';

export class GeneratorController extends UIController {
    constructor() {
        super('generator-container');
        
        // THE centralized validation engine
        this.validationEngine = new DatasetValidationEngine();
        this.validationEngine.registerRules();
        
        this.initializeControls();
        
        // Initial validation
        this.onStateChange();
    }

    /**
     * Initialize generator-specific controls
     */
    initializeControls() {
        this.setupMessageCountInput();
        this.setupOutputFormatSelect();
        this.setupAddSymbolButton();
        this.setupActionButtons();
    }

    /**
     * THE state change handler - called whenever anything changes
     * This triggers the centralized validation and UI updates
     */
    onStateChange() {
        const results = this.validationEngine.validateAll();
        this.updateUI(results);
        
        console.log('Validation results:', results);
    }

    /**
     * Set up total messages input 
     */
    setupMessageCountInput() {
        const input = document.getElementById('totalMessages');
        if (!input) return;

        // Update state on change
        this.addEventListener(input, 'input', () => {
            const value = parseInt(input.value) || 0;
            this.validationEngine.updateState({ totalMessages: value });
            this.onStateChange();
        });

        // Initialize state
        const initialValue = parseInt(input.value) || 10000;
        this.validationEngine.updateState({ totalMessages: initialValue });
    }

    /**
     * Set up output format select
     */
    setupOutputFormatSelect() {
        const select = document.getElementById('outputFormat');
        if (!select) return;

        this.addEventListener(select, 'change', () => {
            this.validationEngine.updateState({ outputFormat: select.value });
            this.onStateChange();
        });

        // Initialize state
        this.validationEngine.updateState({ outputFormat: select.value });
    }

    /**
     * Set up add symbol button with percentage validation
     */
    setupAddSymbolButton() {
        const button = document.getElementById('addSymbolBtn');
        if (!button) {
            console.warn('Add symbol button not found');
            return;
        }

        console.log('Setting up add symbol button:', button);

        this.addEventListener(button, 'click', () => {
            this.addSymbol();
        });

        // Update button state based on percentage remaining
        this.updateAddSymbolButton();
    }

    /**
     * Set up save and run buttons
     */
    setupActionButtons() {
        const saveBtn = document.getElementById('saveDatasetBtn');
        const runBtn = document.getElementById('runDatasetBtn');

        if (saveBtn) {
            this.addEventListener(saveBtn, 'click', () => {
                this.saveConfiguration();
            });
        }

        if (runBtn) {
            this.addEventListener(runBtn, 'click', () => {
                this.runGenerator();
            });
        }

        this.updateActionButtons();
    }

    /**
     * Set up real-time percentage tracking
     */
    setupPercentageTracking() {
        const indicator = document.getElementById('percentageRemaining');
        if (!indicator) {
            console.warn('Percentage remaining indicator not found in HTML');
            return;
        }

        console.log('Setting up percentage tracking with indicator:', indicator);
        this.updatePercentageDisplay();
    }

    /**
     * Add a new symbol with smart percentage defaulting
     */
    addSymbol(symbol = '', percentage = null) {
        if (!symbol) {
            symbol = this.promptForSymbol();
            if (!symbol) return;
        }

        try {
            // Calculate smart default percentage
            if (percentage === null) {
                percentage = this.validationEngine.calculateSmartPercentage();
            }

            console.log(`Adding symbol ${symbol} with ${percentage}% allocation`);

            // Add to validation engine state
            this.validationEngine.addSymbol(symbol, percentage);

            // Create DOM element
            const panel = this.createSymbolPanel(symbol, percentage);
            const container = document.getElementById('symbolsContainer');
            if (container) {
                container.appendChild(panel);
            }

            // Trigger UI update
            this.onStateChange();

        } catch (error) {
            alert(error.message);
        }
    }



    /**
     * Create symbol panel DOM element
     */
    createSymbolPanel(symbol, percentage) {
        const panel = this.createElement('div', {
            className: 'symbol-card',
            dataset: { symbol: symbol.toUpperCase() }
        });

        // Create panel content
        panel.innerHTML = `
            <button class="symbol-remove-btn" title="Remove Symbol">×</button>
            <div class="symbol-name">${symbol.toUpperCase()}</div>
            <div class="symbol-controls">
                <div class="percentage-input-group">
                    <input type="number" class="percentage-input" value="${percentage}" min="0" max="100" step="0.1">
                    <span class="percentage-symbol">%</span>
                </div>
            </div>
        `;

        // Set up remove button
        const removeBtn = panel.querySelector('.symbol-remove-btn');
        this.addEventListener(removeBtn, 'click', () => {
            this.removeSymbol(symbol.toUpperCase());
        });

        // Set up percentage input validation
        const percentageInput = panel.querySelector('.percentage-input');
        validator.registerInput(percentageInput, {
            type: 'percentage',
            min: 0,
            max: 100,
            required: true,
            customValidator: (value) => {
                const num = parseFloat(value);
                if (num < 0) return 'Percentage cannot be negative';
                if (num > 100) return 'Percentage cannot exceed 100%';
                return true;
            }
        });

        // Update percentage tracking on input  
        this.addEventListener(percentageInput, 'input', () => {
            const newPercentage = parseFloat(percentageInput.value) || 0;
            try {
                this.validationEngine.updateSymbolPercentage(symbol, newPercentage);
                this.onStateChange();
            } catch (error) {
                console.error('Error updating symbol percentage:', error);
            }
        });

        return panel;
    }

    /**
     * THE UI update function - single place where UI changes happen
     */
    updateUI(validationResults) {
        const { isValid, errors, derivedState, fieldErrors } = validationResults;
        
        // Update percentage remaining indicator
        this.updatePercentageIndicator(derivedState);
        
        // Update button states
        this.updateButtonStates(derivedState);
        
        // Update field error states  
        this.updateFieldErrors(fieldErrors);
        
        // Update global error display
        this.updateErrorDisplay(errors);
    }

    /**
     * Update percentage remaining indicator
     */
    updatePercentageIndicator(derivedState) {
        const indicator = document.getElementById('percentageRemaining');
        if (!indicator) return;

        const { remainingPercentage, percentageTotal } = derivedState;

        if (Math.abs(percentageTotal - 100) < 0.01) {
            indicator.textContent = '✓ 100% allocated';
            indicator.style.color = '#00ff64';
        } else if (remainingPercentage > 0) {
            indicator.textContent = `${remainingPercentage.toFixed(1)}% remaining`;
            indicator.style.color = 'rgba(255, 255, 255, 0.7)';
        } else {
            indicator.textContent = `${Math.abs(remainingPercentage).toFixed(1)}% over limit!`;
            indicator.style.color = '#ff4444';
        }
    }

    /**
     * Update all button states based on validation
     */
    updateButtonStates(derivedState) {
        const { canAddSymbol, canSave, canRun } = derivedState;
        
        // Add Symbol button
        const addBtn = document.getElementById('addSymbolBtn');
        if (addBtn) {
            if (canAddSymbol) {
                this.enable(addBtn);
            } else {
                this.disable(addBtn);
            }
        }
        
        // Save button
        const saveBtn = document.getElementById('saveDatasetBtn');
        if (saveBtn) {
            if (canSave) {
                this.enable(saveBtn);
            } else {
                this.disable(saveBtn);
            }
        }
        
        // Run button
        const runBtn = document.getElementById('runDatasetBtn');
        if (runBtn) {
            if (canRun) {
                this.enable(runBtn);
            } else {
                this.disable(runBtn);
            }
        }
    }

    /**
     * Update field-specific error states
     */
    updateFieldErrors(fieldErrors) {
        // Total Messages field
        const totalMessagesInput = document.getElementById('totalMessages');
        if (totalMessagesInput) {
            if (fieldErrors.has('totalMessages')) {
                totalMessagesInput.style.borderColor = '#ff4444';
                totalMessagesInput.title = fieldErrors.get('totalMessages');
            } else {
                totalMessagesInput.style.borderColor = '';
                totalMessagesInput.title = '';
            }
        }
    }

    /**
     * Update global error display
     */
    updateErrorDisplay(errors) {
        if (errors.length > 0) {
            console.warn('Validation errors:', errors);
        }
    }

    /**
     * Remove symbol from configuration
     */
    removeSymbol(symbol) {
        if (confirm(`Remove ${symbol} symbol?`)) {
            // Remove from validation engine state
            this.validationEngine.removeSymbol(symbol);
            
            // Remove DOM element
            const panel = document.querySelector(`[data-symbol="${symbol.toUpperCase()}"]`);
            if (panel) {
                panel.remove();
            }
            
            // Trigger UI update
            this.onStateChange();
        }
    }



    /**
     * Prompt user for symbol name
     */
    promptForSymbol() {
        const symbol = prompt('Enter symbol (e.g., AAPL, MSFT):');
        if (!symbol) return null;
        
        // Basic symbol validation
        const cleaned = symbol.toUpperCase().trim();
        if (!/^[A-Z]{1,5}$/.test(cleaned)) {
            alert('Invalid symbol. Please use 1-5 letters only.');
            return null;
        }
        
        return cleaned;
    }

    /**
     * Save configuration (using centralized validation)
     */
    saveConfiguration() {
        try {
            const config = this.validationEngine.exportConfig();
            console.log('Saving configuration:', config);
            // TODO: Implement backend save
            alert('Configuration saved successfully!');
        } catch (error) {
            alert(`Cannot save: ${error.message}`);
        }
    }

    /**
     * Run generator (using centralized validation)
     */
    runGenerator() {
        try {
            const config = this.validationEngine.exportConfig();
            console.log('Running generator with config:', config);
            // TODO: Implement backend execution
            alert('Generator started successfully!');
        } catch (error) {
            alert(`Cannot run generator: ${error.message}`);
        }
    }
}