// Import modules
import { SymbolManager } from './modules/symbol-manager.js';
import { ConfigManager } from './modules/config-manager.js';
import { FormValidator } from './modules/form-validator.js';
import { UIController } from './modules/ui-controller.js';

/**
 * BEACON HFT DATASET GENERATOR - Small Clean Coordinator
 * Uses existing modules for clean architecture
 */

class DatasetGenerator {
    constructor() {
        console.log('🚀 Initializing DatasetGenerator...');
        
        // Initialize modules
        this.symbolManager = new SymbolManager();
        this.configManager = new ConfigManager(false);
        this.formValidator = new FormValidator();
        this.uiController = new UIController();
        
        console.log('✅ DatasetGenerator modules initialized');
        
        // Initialize exchange state
        this.initializeExchangeState();
        
        console.log('✅ DatasetGenerator fully initialized');
    }

    initializeExchangeState() {
        // Ensure exchange is unlocked on startup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.symbolManager.initializeExchangeState();
                console.log('🔓 Exchange unlocked on DOM ready');
            });
        } else {
            this.symbolManager.initializeExchangeState();
            console.log('🔓 Exchange unlocked immediately');
        }
    }

    // Symbol methods that HTML calls
    validateSymbolInput(event) {
        console.log(`🎯 DatasetGenerator.validateSymbolInput called with: "${event.target.value}"`);
        this.symbolManager.validateSymbolInput(event);
    }

    handleSymbolInput(event) {
        console.log(`🎯 DatasetGenerator.handleSymbolInput: key="${event.key}", value="${event.target.value}"`);
        this.symbolManager.handleSymbolInput(event);
    }

    // Form methods that HTML calls
    handleNumMessagesInput(event) {
        console.log(`🎯 handleNumMessagesInput: value="${event.target.value}"`);
        this.formValidator.validateNumMessages();
        this.uiController.updateInputStyling(event.target);
    }

    validateNumMessages() {
        this.formValidator.validateNumMessages();
    }

    validateSaveAs(event) {
        this.formValidator.validateForm();
        this.uiController.updateInputStyling(event.target);
    }

    handleAnyInput(event) {
        this.formValidator.validateForm();
        this.uiController.updateInputStyling(event.target);
    }

    // UI methods that HTML calls
    removeProduct(cardId) {
        console.log(`🗑️ Removing product: ${cardId}`);
        this.symbolManager.removeProduct(cardId);
        this.symbolManager.smartRebalancePercentages();
        this.uiController.updateAllocationDisplay();
    }

    updatePercentage(productId) {
        this.symbolManager.smartRebalancePercentages();
        this.uiController.updateAllocationDisplay();
    }

    updateRange(type, productId) {
        this.uiController.updateRange(type, productId);
    }

    updateSingleRange(type, productId) {
        this.uiController.updateSingleRange(type, productId);
    }

    toggleCard(cardId) {
        this.uiController.toggleCard(cardId);
    }

    togglePanel(panelId) {
        this.uiController.togglePanel(panelId);
    }

    // Placeholder methods
    handleConfigSelection() {
        console.log('Config selection handler called');
    }

    createNewConfig() {
        console.log('Create new config called');
    }

    saveCurrentConfig() {
        console.log('Save current config called');
    }

    cancelNewConfig() {
        console.log('Cancel new config called');
    }

    handleConfigInputKey(event) {
        console.log('Config input key handler:', event.key);
    }

    handleConfigInputBlur() {
        console.log('Config input blur handler');
    }

    generateDataset() {
        console.log('🎯 Generate dataset clicked');
        
        // Validate form first
        const numMessages = document.getElementById('numMessagesInput').value;
        const saveAs = document.getElementById('saveAsInput').value;
        const symbols = document.querySelectorAll('.datacard');
        
        if (!numMessages || parseInt(numMessages) <= 0) {
            this.uiController.showNotification('Please enter a valid number of messages', 'error');
            return;
        }
        
        if (!saveAs || saveAs.trim().length === 0) {
            this.uiController.showNotification('Please enter a save name', 'error');
            return;
        }
        
        if (symbols.length === 0) {
            this.uiController.showNotification('Please add at least one product', 'error');
            return;
        }
        
        console.log('Dataset generation would start here');
        this.uiController.showNotification('Dataset generation started', 'success');
    }
}

// Make it global immediately - no DOM ready bullshit
window.DatasetGenerator = new DatasetGenerator();
