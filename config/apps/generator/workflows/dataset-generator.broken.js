/**
 * BEACON HFT DATASET GENERATOR
 * Professional JavaScript Module for Dataset Generation Interface
 * 
 * Features:
 * - Market data integration with realistic trading parameters
 * - Dynamic product card management
 * - Form validation and user feedback
 * - Professional error handling
 * - Responsive slider controls
 */

(function() {
    'use strict';
    
    // Main application namespace
    window.DatasetGenerator = {
        // Application state
        productCounter: 0,
        isDemo: false,
        collapsedPanels: new Set(),
        currentConfig: null, // Track currently loaded config
        configModified: false, // Track if config has been modified
        datasetSentiment: 'neutral', // NEW: Track dataset-wide sentiment
        
        init: function() {
            try {
                console.log('🚀 Starting DatasetGenerator initialization...');
                
                this.isDemo = window.location.hostname.includes('github.io') || 
                             window.location.hostname.includes('githubusercontent.com');
                
                console.log(`🎭 Demo mode: ${this.isDemo}`);
                
                if (this.isDemo) {
                    document.body.classList.add('demo-mode');
                }
                
                this.loadInitialSymbols();
                console.log('✅ DatasetGenerator initialization complete');
                
            } catch (error) {
                console.error('❌ DatasetGenerator initialization failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },
        
        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all required DOM elements exist
                const requiredElements = [
                    'configSelect', 'numMessagesInput', 'exchangeSelect', 
                    'saveAsInput', 'generateBtn', 'productsContainer', 
                    'symbolInput', 'allocationPercentage'
                ];
                
                const missingElements = [];
                requiredElements.forEach(id => {
                    if (!document.getElementById(id)) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    console.error('❌ Missing required DOM elements:', missingElements);
                    throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
                }
                
                console.log('✅ All required DOM elements found');
                
            } catch (error) {
                console.error('❌ loadInitialSymbols failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },

        // Load available configs from Flask backend - FIXED: Don't auto-load any config
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
                // REMOVED: Don't auto-load any config - let user choose
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files - UPDATED: Don't auto-select
        populateConfigDropdown: function(configs) {
            const select = document.getElementById('configSelect');
            
            // Clear existing options except placeholder
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add config files
            configs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.name;
                option.textContent = config.name;
                select.appendChild(option);
            });
            
            // DON'T auto-select the first config - let user choose
            console.log('✅ Config dropdown populated, waiting for user selection');
        },

        // Handle config selection from dropdown
        handleConfigSelection: function() {
            const select = document.getElementById('configSelect');
            const selectedConfig = select.value;
            
            if (selectedConfig && selectedConfig !== this.currentConfig) {
                console.log(`📂 Loading config: ${selectedConfig}`);
                this.loadConfig(selectedConfig);
            }
        },

        // Create new config mode - IMPROVED: Show cancel button
        createNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch to input mode
            select.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            input.focus();
            
            newBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
            cancelBtn.style.display = 'flex';
            
            // Clear current config state
            this.currentConfig = null;
            this.configModified = false;
            this.updateConfigState();
            
            console.log('➕ Switched to new config mode');
        },

        // Handle config input key events
        handleConfigInputKey: function(event) {
            if (event.key === 'Enter') {
                this.saveCurrentConfig();
            } else if (event.key === 'Escape') {
                this.cancelNewConfig();
            }
        },

        // Handle config input blur - FIXED: Allow canceling
        handleConfigInputBlur: function() {
            // Allow user to cancel by clicking elsewhere or using escape
        },

        // Cancel new config creation - IMPROVED: Hide cancel button
        cancelNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch back to dropdown mode
            select.style.display = 'block';
            input.style.display = 'none';
            
            newBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Reset to no selection
            select.value = '';
            this.updateConfigState();
            
            console.log('❌ Cancelled new config creation');
        },

        // Validate filename for cross-platform compatibility
        validateFileName: function(fileName) {
            // Remove invalid characters: / \ : * ? " < > | $ % ^ ! ` and other special chars
            // Also remove emojis and non-ASCII characters
            const cleaned = fileName
                .replace(/[\/\\:*?"<>|$%^!`~@#&+={}[\]';,]/g, '')  // Remove invalid chars
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII (including emojis)
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .trim();
            
            // Ensure it's not empty after cleaning
            return cleaned || 'config';
        },

        // Save current configuration - FIXED: No validation required for config save
        saveCurrentConfig: async function() {
            const input = document.getElementById('configInput');
            const select = document.getElementById('configSelect');
            
            let configName = input.style.display !== 'none' ? 
                           input.value.trim() : 
                           select.value;
            
            if (!configName) {
                alert('Please enter a config name');
                return;
            }
            
            // Clean filename for cross-platform compatibility
            configName = this.validateFileName(configName);
            
            // Strip extension and add .json
            configName = configName.replace(/\.[^/.]+$/, '') + '.json';
            
            // Generate current config - SIMPLIFIED: No form validation required
            const config = this.generateCurrentConfigForSave(configName);
            
            try {
                await this.saveConfigToFlask(configName, config);
                
                // Update UI state
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                // Refresh dropdown and select the saved config
                await this.loadAvailableConfigs();
                select.value = configName;
                
                // Switch back to dropdown mode
                if (input.style.display !== 'none') {
                    this.cancelNewConfig();
                    select.value = configName;
                }
                
                console.log(`✅ Saved config: ${configName}`);
                this.showNotification(`Saved: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save config:', error);
                alert(`Failed to save config: ${error.message}`);
            }
        },

        // Generate config for saving - FIXED: Consistent exchange case handling
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value.toLowerCase(); // Ensure lowercase
            const saveAs = document.getElementById('saveAsInput').value || 'dataset';
            
            // Collect all symbol data (can be empty)
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                const bidMin = parseFloat(document.getElementById(`bidMin-${id}`).value);
                const bidMax = parseFloat(document.getElementById(`bidMax-${id}`).value);
                const askMin = parseFloat(document.getElementById(`askMin-${id}`).value);
                const askMax = parseFloat(document.getElementById(`askMax-${id}`).value);
                
                const bidQtyMin = parseInt(document.getElementById(`bidQtyMin-${id}`).value);
                const bidQtyMax = parseInt(document.getElementById(`bidQtyMax-${id}`).value);
                const askQtyMin = parseInt(document.getElementById(`askQtyMin-${id}`).value);
                const askQtyMax = parseInt(document.getElementById(`askQtyMax-${id}`).value);
                
                const spread = parseFloat(document.getElementById(`spread-${id}`).value);
                const volume = parseInt(document.getElementById(`volume-${id}`).value);
                
                const bidWeight = parseInt(document.getElementById(`bidWeight-${id}`).value);
                const askWeight = parseInt(document.getElementById(`askWeight-${id}`).value);
                const tradePercent = parseInt(document.getElementById(`tradePercent-${id}`).value);
                
                symbols.push({
                    symbol: symbol,
                    allocation: allocation,
                    bidPriceRange: { min: bidMin, max: bidMax },
                    askPriceRange: { min: askMin, max: askMax },
                    bidQuantityRange: { min: bidQtyMin, max: bidQtyMax },
                    askQuantityRange: { min: askQtyMin, max: askQtyMax },
                    spreadPercent: spread,
                    volumeM: volume,
                    // Probability distribution controls for sophisticated market simulation
                    bidWeightPercent: bidWeight,     // Distribution bias for bid prices
                    askWeightPercent: askWeight,     // Distribution bias for ask prices  
                    tradePercent: tradePercent       // Percentage of messages that are trades vs quotes
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000)
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // Missing function: Add product with market data (completion of the flow) - OPTIMIZED: Remove delays
        addProductWithMarketData: function(symbol, marketData) {
            console.log(`🏗️ addProductWithMarketData called for: ${symbol}`, marketData);
            
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                console.log(`🆔 Using product ID: ${currentId}`);
                
                // Calculate balanced percentage for new symbol
                const existingSymbols = document.querySelectorAll('.datacard').length;
                const balancedPercentage = Math.floor(100 / (existingSymbols + 1));
                
                console.log(`📊 Existing symbols: ${existingSymbols}, new percentage: ${balancedPercentage}%`);
                
                const container = document.getElementById('productsContainer');
                if (!container) {
                    console.error('❌ productsContainer not found!');
                    return;
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                // FIXED: Better range initialization with proper spread
                const priceRange = marketData.priceRange || { min: 100, max: 200 };
                const priceSpread = priceRange.max - priceRange.min;
                
                const params = {
                    priceRange: priceRange,
                    quantityRange: marketData.quantityRange || { min: 100, max: 1000 },
                    spreadPercent: marketData.spreadPercent || 0.5,
                    volumeM: marketData.volume || 25,
                    bidMin: priceRange.min + (priceSpread * 0.1),
                    bidMax: priceRange.min + (priceSpread * 0.4),
                    askMin: priceRange.min + (priceSpread * 0.6),
                    askMax: priceRange.min + (priceSpread * 0.9)
                };
                
                const cardHTML = this.generateCardHTML(
                    symbol, 
                    currentId, 
                    balancedPercentage, 
                    params
                );
                
                productCard.innerHTML = cardHTML;
                container.appendChild(productCard);
                
                // Initialize sliders immediately
                try {
                    this.initializeSliders(currentId);
                    this.rebalancePercentages();
                    this.validateForm();
                    this.markConfigModified();
                    
                    // NEW: Apply current dataset sentiment to new symbol
                    if (this.datasetSentiment && this.datasetSentiment !== 'neutral') {
                        setTimeout(() => {
                            this.applySentimentToSymbol(currentId, this.datasetSentiment);
                        }, 100); // Small delay to ensure sliders are ready
                    }
                    
                    console.log(`✅ Sliders initialized successfully`);
                } catch (error) {
                    console.error(`❌ Error initializing sliders:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
                console.log(`✅ Added ${symbol} with ${balancedPercentage}% allocation`);
                
            } catch (error) {
                console.error(`❌ Error in addProductWithMarketData:`, error);
                console.error(`❌ Stack trace:`, error.stack);
            }
        },

        // Initialize all sliders for a product card - UPDATED for new sliders including drift
        initializeSliders: function(productId) {
            this.updateRange('bid', productId);
            this.updateRange('ask', productId);
            this.updateRange('bidQty', productId);
            this.updateRange('askQty', productId);
            this.updateSingleRange('spread', productId);
            this.updateSingleRange('volume', productId);
            this.updateSingleRange('drift', productId); // NEW: Initialize drift slider
            this.updateSingleRange('bidWeight', productId);
            this.updateSingleRange('askWeight', productId);
            this.updateSingleRange('tradePercent', productId);
        },

        // NEW: Set dataset-wide sentiment - applies to ALL symbols
        setDatasetSentiment: function(sentiment) {
            this.datasetSentiment = sentiment;
            
            // Update dataset sentiment UI
            ['bearish', 'neutral', 'bullish'].forEach(s => {
                const btn = document.getElementById(`dataset${s.charAt(0).toUpperCase()}${s.slice(1)}`);
                if (btn) btn.classList.remove('active');
            });
            const activeBtn = document.getElementById(`dataset${sentiment.charAt(0).toUpperCase()}${sentiment.slice(1)}`);
            if (activeBtn) activeBtn.classList.add('active');
            
            // Update description
            const descriptions = {
                bearish: 'Market decline - higher selling pressure',
                bullish: 'Market rally - higher buying pressure', 
                neutral: 'Balanced market conditions'
            };
            const descEl = document.getElementById('sentimentDescription');
            if (descEl) descEl.textContent = descriptions[sentiment];
            
            // Apply to ALL existing symbols
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, sentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${sentiment} sentiment to ${symbolCards.length} symbols`);
        },

        // Helper function to apply sentiment to a single symbol
        applySentimentToSymbol: function(cardId, sentiment) {
            const driftSlider = document.getElementById(`drift-${cardId}`);
            const bidWeightSlider = document.getElementById(`bidWeight-${cardId}`);
            const askWeightSlider = document.getElementById(`askWeight-${cardId}`);
            
            if (driftSlider && bidWeightSlider && askWeightSlider) {
                switch(sentiment) {
                    case 'bearish':
                        driftSlider.value = -0.8;
                        bidWeightSlider.value = 30; // More sellers
                        askWeightSlider.value = 70; // Fewer buyers
                        break;
                    case 'bullish':
                        driftSlider.value = 0.8;
                        bidWeightSlider.value = 70; // More buyers
                        askWeightSlider.value = 30; // Fewer sellers
                        break;
                    case 'neutral':
                    default:
                        driftSlider.value = 0.0;
                        bidWeightSlider.value = 50; // Balanced
                        askWeightSlider.value = 50; // Balanced
                        break;
                }
                
                // Update visual displays
                this.updateSingleRange('drift', cardId);
                this.updateSingleRange('bidWeight', cardId);
                this.updateSingleRange('askWeight', cardId);
                
                // Update individual card sentiment buttons too
                ['bearish', 'neutral', 'bullish'].forEach(s => {
                    const btn = document.getElementById(`${s}-${cardId}`);
                    if (btn) btn.classList.remove('active');
                });
                const activeBtn = document.getElementById(`${sentiment}-${cardId}`);
                if (activeBtn) activeBtn.classList.add('active');
            }
        },

        // NEW: Set sentiment for individual cards (called from card buttons)
        setSentiment: function(cardId, sentiment) {
            // Apply to this specific card only
            this.applySentimentToSymbol(cardId, sentiment);
            this.markConfigModified();
        },

        // NEW: Simple dataset-wide sentiment slider that updates display only
        updateDatasetSentiment: function() {
            const slider = document.getElementById('datasetSentiment');
            const valueDisplay = document.getElementById('datasetSentimentVal');
            const description = document.getElementById('sentimentDescription');
            
            if (!slider || !valueDisplay || !description) return;
            
            const value = parseFloat(slider.value);
            
            // Update display based on slider value
            if (value < -0.25) {
                valueDisplay.textContent = 'Bearish';
                description.textContent = 'Market decline - higher selling pressure';
                this.datasetSentiment = 'bearish';
            } else if (value > 0.25) {
                valueDisplay.textContent = 'Bullish';
                description.textContent = 'Market rally - higher buying pressure';
                this.datasetSentiment = 'bullish';
            } else {
                valueDisplay.textContent = 'Neutral';
                description.textContent = 'Balanced market conditions';
                this.datasetSentiment = 'neutral';
            }
        },

        // NEW: Apply dataset sentiment as a starting template (quants can then customize)
        applyDatasetSentimentTemplate: function() {
            if (!this.datasetSentiment || this.datasetSentiment === 'neutral') return;
            
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, this.datasetSentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${this.datasetSentiment} template to ${symbolCards.length} symbols`);
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // Missing function: Add product with market data (completion of the flow) - OPTIMIZED: Remove delays
        addProductWithMarketData: function(symbol, marketData) {
            console.log(`🏗️ addProductWithMarketData called for: ${symbol}`, marketData);
            
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                console.log(`🆔 Using product ID: ${currentId}`);
                
                // Calculate balanced percentage for new symbol
                const existingSymbols = document.querySelectorAll('.datacard').length;
                const balancedPercentage = Math.floor(100 / (existingSymbols + 1));
                
                console.log(`📊 Existing symbols: ${existingSymbols}, new percentage: ${balancedPercentage}%`);
                
                const container = document.getElementById('productsContainer');
                if (!container) {
                    console.error('❌ productsContainer not found!');
                    return;
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                // FIXED: Better range initialization with proper spread
                const priceRange = marketData.priceRange || { min: 100, max: 200 };
                const priceSpread = priceRange.max - priceRange.min;
                
                const params = {
                    priceRange: priceRange,
                    quantityRange: marketData.quantityRange || { min: 100, max: 1000 },
                    spreadPercent: marketData.spreadPercent || 0.5,
                    volumeM: marketData.volume || 25,
                    bidMin: priceRange.min + (priceSpread * 0.1),
                    bidMax: priceRange.min + (priceSpread * 0.4),
                    askMin: priceRange.min + (priceSpread * 0.6),
                    askMax: priceRange.min + (priceSpread * 0.9)
                };
                
                const cardHTML = this.generateCardHTML(
                    symbol, 
                    currentId, 
                    balancedPercentage, 
                    params
                );
                
                productCard.innerHTML = cardHTML;
                container.appendChild(productCard);
                
                // Initialize sliders immediately
                try {
                    this.initializeSliders(currentId);
                    this.rebalancePercentages();
                    this.validateForm();
                    this.markConfigModified();
                    
                    // NEW: Apply current dataset sentiment to new symbol
                    if (this.datasetSentiment && this.datasetSentiment !== 'neutral') {
                        setTimeout(() => {
                            this.applySentimentToSymbol(currentId, this.datasetSentiment);
                        }, 100); // Small delay to ensure sliders are ready
                    }
                    
                    console.log(`✅ Sliders initialized successfully`);
                } catch (error) {
                    console.error(`❌ Error initializing sliders:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
                console.log(`✅ Added ${symbol} with ${balancedPercentage}% allocation`);
                
            } catch (error) {
                console.error(`❌ Error in addProductWithMarketData:`, error);
                console.error(`❌ Stack trace:`, error.stack);
            }
        },

        // Initialize all sliders for a product card - UPDATED for new sliders including drift
        initializeSliders: function(productId) {
            this.updateRange('bid', productId);
            this.updateRange('ask', productId);
            this.updateRange('bidQty', productId);
            this.updateRange('askQty', productId);
            this.updateSingleRange('spread', productId);
            this.updateSingleRange('volume', productId);
            this.updateSingleRange('drift', productId); // NEW: Initialize drift slider
            this.updateSingleRange('bidWeight', productId);
            this.updateSingleRange('askWeight', productId);
            this.updateSingleRange('tradePercent', productId);
        },

        // NEW: Set dataset-wide sentiment - applies to ALL symbols
        setDatasetSentiment: function(sentiment) {
            this.datasetSentiment = sentiment;
            
            // Update dataset sentiment UI
            ['bearish', 'neutral', 'bullish'].forEach(s => {
                const btn = document.getElementById(`dataset${s.charAt(0).toUpperCase()}${s.slice(1)}`);
                if (btn) btn.classList.remove('active');
            });
            const activeBtn = document.getElementById(`dataset${sentiment.charAt(0).toUpperCase()}${sentiment.slice(1)}`);
            if (activeBtn) activeBtn.classList.add('active');
            
            // Update description
            const descriptions = {
                bearish: 'Market decline - higher selling pressure',
                bullish: 'Market rally - higher buying pressure', 
                neutral: 'Balanced market conditions'
            };
            const descEl = document.getElementById('sentimentDescription');
            if (descEl) descEl.textContent = descriptions[sentiment];
            
            // Apply to ALL existing symbols
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, sentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${sentiment} sentiment to ${symbolCards.length} symbols`);
        },

        // Helper function to apply sentiment to a single symbol
        applySentimentToSymbol: function(cardId, sentiment) {
            const driftSlider = document.getElementById(`drift-${cardId}`);
            const bidWeightSlider = document.getElementById(`bidWeight-${cardId}`);
            const askWeightSlider = document.getElementById(`askWeight-${cardId}`);
            
            if (driftSlider && bidWeightSlider && askWeightSlider) {
                switch(sentiment) {
                    case 'bearish':
                        driftSlider.value = -0.8;
                        bidWeightSlider.value = 30; // More sellers
                        askWeightSlider.value = 70; // Fewer buyers
                        break;
                    case 'bullish':
                        driftSlider.value = 0.8;
                        bidWeightSlider.value = 70; // More buyers
                        askWeightSlider.value = 30; // Fewer sellers
                        break;
                    case 'neutral':
                    default:
                        driftSlider.value = 0.0;
                        bidWeightSlider.value = 50; // Balanced
                        askWeightSlider.value = 50; // Balanced
                        break;
                }
                
                // Update visual displays
                this.updateSingleRange('drift', cardId);
                this.updateSingleRange('bidWeight', cardId);
                this.updateSingleRange('askWeight', cardId);
                
                // Update individual card sentiment buttons too
                ['bearish', 'neutral', 'bullish'].forEach(s => {
                    const btn = document.getElementById(`${s}-${cardId}`);
                    if (btn) btn.classList.remove('active');
                });
                const activeBtn = document.getElementById(`${sentiment}-${cardId}`);
                if (activeBtn) activeBtn.classList.add('active');
            }
        },

        // NEW: Set sentiment for individual cards (called from card buttons)
        setSentiment: function(cardId, sentiment) {
            // Apply to this specific card only
            this.applySentimentToSymbol(cardId, sentiment);
            this.markConfigModified();
        },

        // NEW: Simple dataset-wide sentiment slider that updates display only
        updateDatasetSentiment: function() {
            const slider = document.getElementById('datasetSentiment');
            const valueDisplay = document.getElementById('datasetSentimentVal');
            const description = document.getElementById('sentimentDescription');
            
            if (!slider || !valueDisplay || !description) return;
            
            const value = parseFloat(slider.value);
            
            // Update display based on slider value
            if (value < -0.25) {
                valueDisplay.textContent = 'Bearish';
                description.textContent = 'Market decline - higher selling pressure';
                this.datasetSentiment = 'bearish';
            } else if (value > 0.25) {
                valueDisplay.textContent = 'Bullish';
                description.textContent = 'Market rally - higher buying pressure';
                this.datasetSentiment = 'bullish';
            } else {
                valueDisplay.textContent = 'Neutral';
                description.textContent = 'Balanced market conditions';
                this.datasetSentiment = 'neutral';
            }
        },

        // NEW: Apply dataset sentiment as a starting template (quants can then customize)
        applyDatasetSentimentTemplate: function() {
            if (!this.datasetSentiment || this.datasetSentiment === 'neutral') return;
            
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, this.datasetSentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${this.datasetSentiment} template to ${symbolCards.length} symbols`);
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // Missing function: Add product with market data (completion of the flow) - OPTIMIZED: Remove delays
        addProductWithMarketData: function(symbol, marketData) {
            console.log(`🏗️ addProductWithMarketData called for: ${symbol}`, marketData);
            
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                console.log(`🆔 Using product ID: ${currentId}`);
                
                // Calculate balanced percentage for new symbol
                const existingSymbols = document.querySelectorAll('.datacard').length;
                const balancedPercentage = Math.floor(100 / (existingSymbols + 1));
                
                console.log(`📊 Existing symbols: ${existingSymbols}, new percentage: ${balancedPercentage}%`);
                
                const container = document.getElementById('productsContainer');
                if (!container) {
                    console.error('❌ productsContainer not found!');
                    return;
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                // FIXED: Better range initialization with proper spread
                const priceRange = marketData.priceRange || { min: 100, max: 200 };
                const priceSpread = priceRange.max - priceRange.min;
                
                const params = {
                    priceRange: priceRange,
                    quantityRange: marketData.quantityRange || { min: 100, max: 1000 },
                    spreadPercent: marketData.spreadPercent || 0.5,
                    volumeM: marketData.volume || 25,
                    bidMin: priceRange.min + (priceSpread * 0.1),
                    bidMax: priceRange.min + (priceSpread * 0.4),
                    askMin: priceRange.min + (priceSpread * 0.6),
                    askMax: priceRange.min + (priceSpread * 0.9)
                };
                
                const cardHTML = this.generateCardHTML(
                    symbol, 
                    currentId, 
                    balancedPercentage, 
                    params
                );
                
                productCard.innerHTML = cardHTML;
                container.appendChild(productCard);
                
                // Initialize sliders immediately
                try {
                    this.initializeSliders(currentId);
                    this.rebalancePercentages();
                    this.validateForm();
                    this.markConfigModified();
                    
                    // NEW: Apply current dataset sentiment to new symbol
                    if (this.datasetSentiment && this.datasetSentiment !== 'neutral') {
                        setTimeout(() => {
                            this.applySentimentToSymbol(currentId, this.datasetSentiment);
                        }, 100); // Small delay to ensure sliders are ready
                    }
                    
                    console.log(`✅ Sliders initialized successfully`);
                } catch (error) {
                    console.error(`❌ Error initializing sliders:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
                console.log(`✅ Added ${symbol} with ${balancedPercentage}% allocation`);
                
            } catch (error) {
                console.error(`❌ Error in addProductWithMarketData:`, error);
                console.error(`❌ Stack trace:`, error.stack);
            }
        },

        // Update single range sliders - UPDATED to handle drift
        updateSingleRange: function(type, productId) {
            const slider = document.getElementById(`${type}-${productId}`);
            const valueDisplay = document.getElementById(`${type}Val-${productId}`);
            const track = document.getElementById(`${type}Track-${productId}`);
            
            if (!slider || !valueDisplay || !track) return;
            
            const value = parseFloat(slider.value);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            
            if (type === 'volume') {
                valueDisplay.textContent = Math.round(value) + 'M';
            } else if (type === 'spread' || type === 'drift') {
                valueDisplay.textContent = value.toFixed(2) + '%';
            } else {
                valueDisplay.textContent = value + '%';
            }
            
            const percentage = ((value - min) / (max - min)) * 100;
            track.style.left = '0%';
            track.style.width = percentage + '%';
            
            this.markConfigModified();
        },

        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all required DOM elements exist
                const requiredElements = [
                    'configSelect', 'numMessagesInput', 'exchangeSelect', 
                    'saveAsInput', 'generateBtn', 'productsContainer', 
                    'symbolInput', 'allocationPercentage'
                ];
                
                const missingElements = [];
                requiredElements.forEach(id => {
                    if (!document.getElementById(id)) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    console.error('❌ Missing required DOM elements:', missingElements);
                    throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
                }
                
                console.log('✅ All required DOM elements found');
                
            } catch (error) {
                console.error('❌ loadInitialSymbols failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },

        // Load available configs from Flask backend - FIXED: Don't auto-load any config
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
                // REMOVED: Don't auto-load any config - let user choose
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files - UPDATED: Don't auto-select
        populateConfigDropdown: function(configs) {
            const select = document.getElementById('configSelect');
            
            // Clear existing options except placeholder
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add config files
            configs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.name;
                option.textContent = config.name;
                select.appendChild(option);
            });
            
            // DON'T auto-select the first config - let user choose
            console.log('✅ Config dropdown populated, waiting for user selection');
        },

        // Handle config selection from dropdown
        handleConfigSelection: function() {
            const select = document.getElementById('configSelect');
            const selectedConfig = select.value;
            
            if (selectedConfig && selectedConfig !== this.currentConfig) {
                console.log(`📂 Loading config: ${selectedConfig}`);
                this.loadConfig(selectedConfig);
            }
        },

        // Create new config mode - IMPROVED: Show cancel button
        createNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch to input mode
            select.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            input.focus();
            
            newBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
            cancelBtn.style.display = 'flex';
            
            // Clear current config state
            this.currentConfig = null;
            this.configModified = false;
            this.updateConfigState();
            
            console.log('➕ Switched to new config mode');
        },

        // Handle config input key events
        handleConfigInputKey: function(event) {
            if (event.key === 'Enter') {
                this.saveCurrentConfig();
            } else if (event.key === 'Escape') {
                this.cancelNewConfig();
            }
        },

        // Handle config input blur - FIXED: Allow canceling
        handleConfigInputBlur: function() {
            // Allow user to cancel by clicking elsewhere or using escape
        },

        // Cancel new config creation - IMPROVED: Hide cancel button
        cancelNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch back to dropdown mode
            select.style.display = 'block';
            input.style.display = 'none';
            
            newBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Reset to no selection
            select.value = '';
            this.updateConfigState();
            
            console.log('❌ Cancelled new config creation');
        },

        // Validate filename for cross-platform compatibility
        validateFileName: function(fileName) {
            // Remove invalid characters: / \ : * ? " < > | $ % ^ ! ` and other special chars
            // Also remove emojis and non-ASCII characters
            const cleaned = fileName
                .replace(/[\/\\:*?"<>|$%^!`~@#&+={}[\]';,]/g, '')  // Remove invalid chars
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII (including emojis)
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .trim();
            
            // Ensure it's not empty after cleaning
            return cleaned || 'config';
        },

        // Save current configuration - FIXED: No validation required for config save
        saveCurrentConfig: async function() {
            const input = document.getElementById('configInput');
            const select = document.getElementById('configSelect');
            
            let configName = input.style.display !== 'none' ? 
                           input.value.trim() : 
                           select.value;
            
            if (!configName) {
                alert('Please enter a config name');
                return;
            }
            
            // Clean filename for cross-platform compatibility
            configName = this.validateFileName(configName);
            
            // Strip extension and add .json
            configName = configName.replace(/\.[^/.]+$/, '') + '.json';
            
            // Generate current config - SIMPLIFIED: No form validation required
            const config = this.generateCurrentConfigForSave(configName);
            
            try {
                await this.saveConfigToFlask(configName, config);
                
                // Update UI state
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                // Refresh dropdown and select the saved config
                await this.loadAvailableConfigs();
                select.value = configName;
                
                // Switch back to dropdown mode
                if (input.style.display !== 'none') {
                    this.cancelNewConfig();
                    select.value = configName;
                }
                
                console.log(`✅ Saved config: ${configName}`);
                this.showNotification(`Saved: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save config:', error);
                alert(`Failed to save config: ${error.message}`);
            }
        },

        // Generate config for saving - FIXED: Consistent exchange case handling
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value.toLowerCase(); // Ensure lowercase
            const saveAs = document.getElementById('saveAsInput').value || 'dataset';
            
            // Collect all symbol data (can be empty)
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                const bidMin = parseFloat(document.getElementById(`bidMin-${id}`).value);
                const bidMax = parseFloat(document.getElementById(`bidMax-${id}`).value);
                const askMin = parseFloat(document.getElementById(`askMin-${id}`).value);
                const askMax = parseFloat(document.getElementById(`askMax-${id}`).value);
                
                const bidQtyMin = parseInt(document.getElementById(`bidQtyMin-${id}`).value);
                const bidQtyMax = parseInt(document.getElementById(`bidQtyMax-${id}`).value);
                const askQtyMin = parseInt(document.getElementById(`askQtyMin-${id}`).value);
                const askQtyMax = parseInt(document.getElementById(`askQtyMax-${id}`).value);
                
                const spread = parseFloat(document.getElementById(`spread-${id}`).value);
                const volume = parseInt(document.getElementById(`volume-${id}`).value);
                
                const bidWeight = parseInt(document.getElementById(`bidWeight-${id}`).value);
                const askWeight = parseInt(document.getElementById(`askWeight-${id}`).value);
                const tradePercent = parseInt(document.getElementById(`tradePercent-${id}`).value);
                
                symbols.push({
                    symbol: symbol,
                    allocation: allocation,
                    bidPriceRange: { min: bidMin, max: bidMax },
                    askPriceRange: { min: askMin, max: askMax },
                    bidQuantityRange: { min: bidQtyMin, max: bidQtyMax },
                    askQuantityRange: { min: askQtyMin, max: askQtyMax },
                    spreadPercent: spread,
                    volumeM: volume,
                    // Probability distribution controls for sophisticated market simulation
                    bidWeightPercent: bidWeight,     // Distribution bias for bid prices
                    askWeightPercent: askWeight,     // Distribution bias for ask prices  
                    tradePercent: tradePercent       // Percentage of messages that are trades vs quotes
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000)
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // Missing function: Add product with market data (completion of the flow) - OPTIMIZED: Remove delays
        addProductWithMarketData: function(symbol, marketData) {
            console.log(`🏗️ addProductWithMarketData called for: ${symbol}`, marketData);
            
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                console.log(`🆔 Using product ID: ${currentId}`);
                
                // Calculate balanced percentage for new symbol
                const existingSymbols = document.querySelectorAll('.datacard').length;
                const balancedPercentage = Math.floor(100 / (existingSymbols + 1));
                
                console.log(`📊 Existing symbols: ${existingSymbols}, new percentage: ${balancedPercentage}%`);
                
                const container = document.getElementById('productsContainer');
                if (!container) {
                    console.error('❌ productsContainer not found!');
                    return;
                }
                
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                // FIXED: Better range initialization with proper spread
                const priceRange = marketData.priceRange || { min: 100, max: 200 };
                const priceSpread = priceRange.max - priceRange.min;
                
                const params = {
                    priceRange: priceRange,
                    quantityRange: marketData.quantityRange || { min: 100, max: 1000 },
                    spreadPercent: marketData.spreadPercent || 0.5,
                    volumeM: marketData.volume || 25,
                    bidMin: priceRange.min + (priceSpread * 0.1),
                    bidMax: priceRange.min + (priceSpread * 0.4),
                    askMin: priceRange.min + (priceSpread * 0.6),
                    askMax: priceRange.min + (priceSpread * 0.9)
                };
                
                const cardHTML = this.generateCardHTML(
                    symbol, 
                    currentId, 
                    balancedPercentage, 
                    params
                );
                
                productCard.innerHTML = cardHTML;
                container.appendChild(productCard);
                
                // Initialize sliders immediately
                try {
                    this.initializeSliders(currentId);
                    this.rebalancePercentages();
                    this.validateForm();
                    this.markConfigModified();
                    
                    // NEW: Apply current dataset sentiment to new symbol
                    if (this.datasetSentiment && this.datasetSentiment !== 'neutral') {
                        setTimeout(() => {
                            this.applySentimentToSymbol(currentId, this.datasetSentiment);
                        }, 100); // Small delay to ensure sliders are ready
                    }
                    
                    console.log(`✅ Sliders initialized successfully`);
                } catch (error) {
                    console.error(`❌ Error initializing sliders:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
                console.log(`✅ Added ${symbol} with ${balancedPercentage}% allocation`);
                
            } catch (error) {
                console.error(`❌ Error in addProductWithMarketData:`, error);
                console.error(`❌ Stack trace:`, error.stack);
            }
        },

        // Update single range sliders - UPDATED to handle drift
        updateSingleRange: function(type, productId) {
            const slider = document.getElementById(`${type}-${productId}`);
            const valueDisplay = document.getElementById(`${type}Val-${productId}`);
            const track = document.getElementById(`${type}Track-${productId}`);
            
            if (!slider || !valueDisplay || !track) return;
            
            const value = parseFloat(slider.value);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            
            if (type === 'volume') {
                valueDisplay.textContent = Math.round(value) + 'M';
            } else if (type === 'spread' || type === 'drift') {
                valueDisplay.textContent = value.toFixed(2) + '%';
            } else {
                valueDisplay.textContent = value + '%';
            }
            
            const percentage = ((value - min) / (max - min)) * 100;
            track.style.left = '0%';
            track.style.width = percentage + '%';
            
            this.markConfigModified();
        },

        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all required DOM elements exist
                const requiredElements = [
                    'configSelect', 'numMessagesInput', 'exchangeSelect', 
                    'saveAsInput', 'generateBtn', 'productsContainer', 
                    'symbolInput', 'allocationPercentage'
                ];
                
                const missingElements = [];
                requiredElements.forEach(id => {
                    if (!document.getElementById(id)) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    console.error('❌ Missing required DOM elements:', missingElements);
                    throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
                }
                
                console.log('✅ All required DOM elements found');
                
            } catch (error) {
                console.error('❌ loadInitialSymbols failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },

        // Load available configs from Flask backend - FIXED: Don't auto-load any config
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
                // REMOVED: Don't auto-load any config - let user choose
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files - UPDATED: Don't auto-select
        populateConfigDropdown: function(configs) {
            const select = document.getElementById('configSelect');
            
            // Clear existing options except placeholder
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add config files
            configs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.name;
                option.textContent = config.name;
                select.appendChild(option);
            });
            
            // DON'T auto-select the first config - let user choose
            console.log('✅ Config dropdown populated, waiting for user selection');
        },

        // Handle config selection from dropdown
        handleConfigSelection: function() {
            const select = document.getElementById('configSelect');
            const selectedConfig = select.value;
            
            if (selectedConfig && selectedConfig !== this.currentConfig) {
                console.log(`📂 Loading config: ${selectedConfig}`);
                this.loadConfig(selectedConfig);
            }
        },

        // Create new config mode - IMPROVED: Show cancel button
        createNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch to input mode
            select.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            input.focus();
            
            newBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
            cancelBtn.style.display = 'flex';
            
            // Clear current config state
            this.currentConfig = null;
            this.configModified = false;
            this.updateConfigState();
            
            console.log('➕ Switched to new config mode');
        },

        // Handle config input key events
        handleConfigInputKey: function(event) {
            if (event.key === 'Enter') {
                this.saveCurrentConfig();
            } else if (event.key === 'Escape') {
                this.cancelNewConfig();
            }
        },

        // Handle config input blur - FIXED: Allow canceling
        handleConfigInputBlur: function() {
            // Allow user to cancel by clicking elsewhere or using escape
        },

        // Cancel new config creation - IMPROVED: Hide cancel button
        cancelNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch back to dropdown mode
            select.style.display = 'block';
            input.style.display = 'none';
            
            newBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Reset to no selection
            select.value = '';
            this.updateConfigState();
            
            console.log('❌ Cancelled new config creation');
        },

        // Validate filename for cross-platform compatibility
        validateFileName: function(fileName) {
            // Remove invalid characters: / \ : * ? " < > | $ % ^ ! ` and other special chars
            // Also remove emojis and non-ASCII characters
            const cleaned = fileName
                .replace(/[\/\\:*?"<>|$%^!`~@#&+={}[\]';,]/g, '')  // Remove invalid chars
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII (including emojis)
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .trim();
            
            // Ensure it's not empty after cleaning
            return cleaned || 'config';
        },

        // Save current configuration - FIXED: No validation required for config save
        saveCurrentConfig: async function() {
            const input = document.getElementById('configInput');
            const select = document.getElementById('configSelect');
            
            let configName = input.style.display !== 'none' ? 
                           input.value.trim() : 
                           select.value;
            
            if (!configName) {
                alert('Please enter a config name');
                return;
            }
            
            // Clean filename for cross-platform compatibility
            configName = this.validateFileName(configName);
            
            // Strip extension and add .json
            configName = configName.replace(/\.[^/.]+$/, '') + '.json';
            
            // Generate current config - SIMPLIFIED: No form validation required
            const config = this.generateCurrentConfigForSave(configName);
            
            try {
                await this.saveConfigToFlask(configName, config);
                
                // Update UI state
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                // Refresh dropdown and select the saved config
                await this.loadAvailableConfigs();
                select.value = configName;
                
                // Switch back to dropdown mode
                if (input.style.display !== 'none') {
                    this.cancelNewConfig();
                    select.value = configName;
                }
                
                console.log(`✅ Saved config: ${configName}`);
                this.showNotification(`Saved: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save config:', error);
                alert(`Failed to save config: ${error.message}`);
            }
        },

        // Generate config for saving - FIXED: Consistent exchange case handling
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value.toLowerCase(); // Ensure lowercase
            const saveAs = document.getElementById('saveAsInput').value || 'dataset';
            
            // Collect all symbol data (can be empty)
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                const bidMin = parseFloat(document.getElementById(`bidMin-${id}`).value);
                const bidMax = parseFloat(document.getElementById(`bidMax-${id}`).value);
                const askMin = parseFloat(document.getElementById(`askMin-${id}`).value);
                const askMax = parseFloat(document.getElementById(`askMax-${id}`).value);
                
                const bidQtyMin = parseInt(document.getElementById(`bidQtyMin-${id}`).value);
                const bidQtyMax = parseInt(document.getElementById(`bidQtyMax-${id}`).value);
                const askQtyMin = parseInt(document.getElementById(`askQtyMin-${id}`).value);
                const askQtyMax = parseInt(document.getElementById(`askQtyMax-${id}`).value);
                
                const spread = parseFloat(document.getElementById(`spread-${id}`).value);
                const volume = parseInt(document.getElementById(`volume-${id}`).value);
                
                const bidWeight = parseInt(document.getElementById(`bidWeight-${id}`).value);
                const askWeight = parseInt(document.getElementById(`askWeight-${id}`).value);
                const tradePercent = parseInt(document.getElementById(`tradePercent-${id}`).value);
                
                symbols.push({
                    symbol: symbol,
                    allocation: allocation,
                    bidPriceRange: { min: bidMin, max: bidMax },
                    askPriceRange: { min: askMin, max: askMax },
                    bidQuantityRange: { min: bidQtyMin, max: bidQtyMax },
                    askQuantityRange: { min: askQtyMin, max: askQtyMax },
                    spreadPercent: spread,
                    volumeM: volume,
                    // Probability distribution controls for sophisticated market simulation
                    bidWeightPercent: bidWeight,     // Distribution bias for bid prices
                    askWeightPercent: askWeight,     // Distribution bias for ask prices  
                    tradePercent: tradePercent       // Percentage of messages that are trades vs quotes
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000)
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // NEW: Simple dataset-wide sentiment slider that updates display only
        updateDatasetSentiment: function() {
            const slider = document.getElementById('datasetSentiment');
            const valueDisplay = document.getElementById('datasetSentimentVal');
            const description = document.getElementById('sentimentDescription');
            
            if (!slider || !valueDisplay || !description) return;
            
            const value = parseFloat(slider.value);
            
            // Update display based on slider value
            if (value < -0.25) {
                valueDisplay.textContent = 'Bearish';
                description.textContent = 'Market decline - higher selling pressure';
                this.datasetSentiment = 'bearish';
            } else if (value > 0.25) {
                valueDisplay.textContent = 'Bullish';
                description.textContent = 'Market rally - higher buying pressure';
                this.datasetSentiment = 'bullish';
            } else {
                valueDisplay.textContent = 'Neutral';
                description.textContent = 'Balanced market conditions';
                this.datasetSentiment = 'neutral';
            }
        },

        // NEW: Apply dataset sentiment as a starting template (quants can then customize)
        applyDatasetSentimentTemplate: function() {
            if (!this.datasetSentiment || this.datasetSentiment === 'neutral') return;
            
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, this.datasetSentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${this.datasetSentiment} template to ${symbolCards.length} symbols`);
        },

        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all required DOM elements exist
                const requiredElements = [
                    'configSelect', 'numMessagesInput', 'exchangeSelect', 
                    'saveAsInput', 'generateBtn', 'productsContainer', 
                    'symbolInput', 'allocationPercentage'
                ];
                
                const missingElements = [];
                requiredElements.forEach(id => {
                    if (!document.getElementById(id)) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    console.error('❌ Missing required DOM elements:', missingElements);
                    throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
                }
                
                console.log('✅ All required DOM elements found');
                
            } catch (error) {
                console.error('❌ loadInitialSymbols failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },

        // Load available configs from Flask backend - FIXED: Don't auto-load any config
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
                // REMOVED: Don't auto-load any config - let user choose
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files - UPDATED: Don't auto-select
        populateConfigDropdown: function(configs) {
            const select = document.getElementById('configSelect');
            
            // Clear existing options except placeholder
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add config files
            configs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.name;
                option.textContent = config.name;
                select.appendChild(option);
            });
            
            // DON'T auto-select the first config - let user choose
            console.log('✅ Config dropdown populated, waiting for user selection');
        },

        // Handle config selection from dropdown
        handleConfigSelection: function() {
            const select = document.getElementById('configSelect');
            const selectedConfig = select.value;
            
            if (selectedConfig && selectedConfig !== this.currentConfig) {
                console.log(`📂 Loading config: ${selectedConfig}`);
                this.loadConfig(selectedConfig);
            }
        },

        // Create new config mode - IMPROVED: Show cancel button
        createNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch to input mode
            select.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            input.focus();
            
            newBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
            cancelBtn.style.display = 'flex';
            
            // Clear current config state
            this.currentConfig = null;
            this.configModified = false;
            this.updateConfigState();
            
            console.log('➕ Switched to new config mode');
        },

        // Handle config input key events
        handleConfigInputKey: function(event) {
            if (event.key === 'Enter') {
                this.saveCurrentConfig();
            } else if (event.key === 'Escape') {
                this.cancelNewConfig();
            }
        },

        // Handle config input blur - FIXED: Allow canceling
        handleConfigInputBlur: function() {
            // Allow user to cancel by clicking elsewhere or using escape
        },

        // Cancel new config creation - IMPROVED: Hide cancel button
        cancelNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch back to dropdown mode
            select.style.display = 'block';
            input.style.display = 'none';
            
            newBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Reset to no selection
            select.value = '';
            this.updateConfigState();
            
            console.log('❌ Cancelled new config creation');
        },

        // Validate filename for cross-platform compatibility
        validateFileName: function(fileName) {
            // Remove invalid characters: / \ : * ? " < > | $ % ^ ! ` and other special chars
            // Also remove emojis and non-ASCII characters
            const cleaned = fileName
                .replace(/[\/\\:*?"<>|$%^!`~@#&+={}[\]';,]/g, '')  // Remove invalid chars
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII (including emojis)
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .trim();
            
            // Ensure it's not empty after cleaning
            return cleaned || 'config';
        },

        // Save current configuration - FIXED: No validation required for config save
        saveCurrentConfig: async function() {
            const input = document.getElementById('configInput');
            const select = document.getElementById('configSelect');
            
            let configName = input.style.display !== 'none' ? 
                           input.value.trim() : 
                           select.value;
            
            if (!configName) {
                alert('Please enter a config name');
                return;
            }
            
            // Clean filename for cross-platform compatibility
            configName = this.validateFileName(configName);
            
            // Strip extension and add .json
            configName = configName.replace(/\.[^/.]+$/, '') + '.json';
            
            // Generate current config - SIMPLIFIED: No form validation required
            const config = this.generateCurrentConfigForSave(configName);
            
            try {
                await this.saveConfigToFlask(configName, config);
                
                // Update UI state
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                // Refresh dropdown and select the saved config
                await this.loadAvailableConfigs();
                select.value = configName;
                
                // Switch back to dropdown mode
                if (input.style.display !== 'none') {
                    this.cancelNewConfig();
                    select.value = configName;
                }
                
                console.log(`✅ Saved config: ${configName}`);
                this.showNotification(`Saved: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save config:', error);
                alert(`Failed to save config: ${error.message}`);
            }
        },

        // Generate config for saving - FIXED: Consistent exchange case handling
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value.toLowerCase(); // Ensure lowercase
            const saveAs = document.getElementById('saveAsInput').value || 'dataset';
            
            // Collect all symbol data (can be empty)
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                const bidMin = parseFloat(document.getElementById(`bidMin-${id}`).value);
                const bidMax = parseFloat(document.getElementById(`bidMax-${id}`).value);
                const askMin = parseFloat(document.getElementById(`askMin-${id}`).value);
                const askMax = parseFloat(document.getElementById(`askMax-${id}`).value);
                
                const bidQtyMin = parseInt(document.getElementById(`bidQtyMin-${id}`).value);
                const bidQtyMax = parseInt(document.getElementById(`bidQtyMax-${id}`).value);
                const askQtyMin = parseInt(document.getElementById(`askQtyMin-${id}`).value);
                const askQtyMax = parseInt(document.getElementById(`askQtyMax-${id}`).value);
                
                const spread = parseFloat(document.getElementById(`spread-${id}`).value);
                const volume = parseInt(document.getElementById(`volume-${id}`).value);
                
                const bidWeight = parseInt(document.getElementById(`bidWeight-${id}`).value);
                const askWeight = parseInt(document.getElementById(`askWeight-${id}`).value);
                const tradePercent = parseInt(document.getElementById(`tradePercent-${id}`).value);
                
                symbols.push({
                    symbol: symbol,
                    allocation: allocation,
                    bidPriceRange: { min: bidMin, max: bidMax },
                    askPriceRange: { min: askMin, max: askMax },
                    bidQuantityRange: { min: bidQtyMin, max: bidQtyMax },
                    askQuantityRange: { min: askQtyMin, max: askQtyMax },
                    spreadPercent: spread,
                    volumeM: volume,
                    // Probability distribution controls for sophisticated market simulation
                    bidWeightPercent: bidWeight,     // Distribution bias for bid prices
                    askWeightPercent: askWeight,     // Distribution bias for ask prices  
                    tradePercent: tradePercent       // Percentage of messages that are trades vs quotes
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000)
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // NEW: Simple dataset-wide sentiment slider that updates display only
        updateDatasetSentiment: function() {
            const slider = document.getElementById('datasetSentiment');
            const valueDisplay = document.getElementById('datasetSentimentVal');
            const description = document.getElementById('sentimentDescription');
            
            if (!slider || !valueDisplay || !description) return;
            
            const value = parseFloat(slider.value);
            
            // Update display based on slider value
            if (value < -0.25) {
                valueDisplay.textContent = 'Bearish';
                description.textContent = 'Market decline - higher selling pressure';
                this.datasetSentiment = 'bearish';
            } else if (value > 0.25) {
                valueDisplay.textContent = 'Bullish';
                description.textContent = 'Market rally - higher buying pressure';
                this.datasetSentiment = 'bullish';
            } else {
                valueDisplay.textContent = 'Neutral';
                description.textContent = 'Balanced market conditions';
                this.datasetSentiment = 'neutral';
            }
        },

        // NEW: Apply dataset sentiment as a starting template (quants can then customize)
        applyDatasetSentimentTemplate: function() {
            if (!this.datasetSentiment || this.datasetSentiment === 'neutral') return;
            
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, this.datasetSentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${this.datasetSentiment} template to ${symbolCards.length} symbols`);
        },

        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all required DOM elements exist
                const requiredElements = [
                    'configSelect', 'numMessagesInput', 'exchangeSelect', 
                    'saveAsInput', 'generateBtn', 'productsContainer', 
                    'symbolInput', 'allocationPercentage'
                ];
                
                const missingElements = [];
                requiredElements.forEach(id => {
                    if (!document.getElementById(id)) {
                        missingElements.push(id);
                    }
                });
                
                if (missingElements.length > 0) {
                    console.error('❌ Missing required DOM elements:', missingElements);
                    throw new Error(`Missing DOM elements: ${missingElements.join(', ')}`);
                }
                
                console.log('✅ All required DOM elements found');
                
            } catch (error) {
                console.error('❌ loadInitialSymbols failed:', error);
                console.error('Stack trace:', error.stack);
            }
        },

        // Load available configs from Flask backend - FIXED: Don't auto-load any config
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
                // REMOVED: Don't auto-load any config - let user choose
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files - UPDATED: Don't auto-select
        populateConfigDropdown: function(configs) {
            const select = document.getElementById('configSelect');
            
            // Clear existing options except placeholder
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add config files
            configs.forEach(config => {
                const option = document.createElement('option');
                option.value = config.name;
                option.textContent = config.name;
                select.appendChild(option);
            });
            
            // DON'T auto-select the first config - let user choose
            console.log('✅ Config dropdown populated, waiting for user selection');
        },

        // Handle config selection from dropdown
        handleConfigSelection: function() {
            const select = document.getElementById('configSelect');
            const selectedConfig = select.value;
            
            if (selectedConfig && selectedConfig !== this.currentConfig) {
                console.log(`📂 Loading config: ${selectedConfig}`);
                this.loadConfig(selectedConfig);
            }
        },

        // Create new config mode - IMPROVED: Show cancel button
        createNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch to input mode
            select.style.display = 'none';
            input.style.display = 'block';
            input.value = '';
            input.focus();
            
            newBtn.style.display = 'none';
            saveBtn.style.display = 'flex';
            cancelBtn.style.display = 'flex';
            
            // Clear current config state
            this.currentConfig = null;
            this.configModified = false;
            this.updateConfigState();
            
            console.log('➕ Switched to new config mode');
        },

        // Handle config input key events
        handleConfigInputKey: function(event) {
            if (event.key === 'Enter') {
                this.saveCurrentConfig();
            } else if (event.key === 'Escape') {
                this.cancelNewConfig();
            }
        },

        // Handle config input blur - FIXED: Allow canceling
        handleConfigInputBlur: function() {
            // Allow user to cancel by clicking elsewhere or using escape
        },

        // Cancel new config creation - IMPROVED: Hide cancel button
        cancelNewConfig: function() {
            const select = document.getElementById('configSelect');
            const input = document.getElementById('configInput');
            const newBtn = document.getElementById('configNewBtn');
            const saveBtn = document.getElementById('configSaveBtn');
            const cancelBtn = document.getElementById('configCancelBtn');
            
            // Switch back to dropdown mode
            select.style.display = 'block';
            input.style.display = 'none';
            
            newBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            
            // Reset to no selection
            select.value = '';
            this.updateConfigState();
            
            console.log('❌ Cancelled new config creation');
        },

        // Validate filename for cross-platform compatibility
        validateFileName: function(fileName) {
            // Remove invalid characters: / \ : * ? " < > | $ % ^ ! ` and other special chars
            // Also remove emojis and non-ASCII characters
            const cleaned = fileName
                .replace(/[\/\\:*?"<>|$%^!`~@#&+={}[\]';,]/g, '')  // Remove invalid chars
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII (including emojis)
                .replace(/\s+/g, '_')  // Replace spaces with underscores
                .trim();
            
            // Ensure it's not empty after cleaning
            return cleaned || 'config';
        },

        // Save current configuration - FIXED: No validation required for config save
        saveCurrentConfig: async function() {
            const input = document.getElementById('configInput');
            const select = document.getElementById('configSelect');
            
            let configName = input.style.display !== 'none' ? 
                           input.value.trim() : 
                           select.value;
            
            if (!configName) {
                alert('Please enter a config name');
                return;
            }
            
            // Clean filename for cross-platform compatibility
            configName = this.validateFileName(configName);
            
            // Strip extension and add .json
            configName = configName.replace(/\.[^/.]+$/, '') + '.json';
            
            // Generate current config - SIMPLIFIED: No form validation required
            const config = this.generateCurrentConfigForSave(configName);
            
            try {
                await this.saveConfigToFlask(configName, config);
                
                // Update UI state
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                // Refresh dropdown and select the saved config
                await this.loadAvailableConfigs();
                select.value = configName;
                
                // Switch back to dropdown mode
                if (input.style.display !== 'none') {
                    this.cancelNewConfig();
                    select.value = configName;
                }
                
                console.log(`✅ Saved config: ${configName}`);
                this.showNotification(`Saved: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to save config:', error);
                alert(`Failed to save config: ${error.message}`);
            }
        },

        // Generate config for saving - FIXED: Consistent exchange case handling
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value.toLowerCase(); // Ensure lowercase
            const saveAs = document.getElementById('saveAsInput').value || 'dataset';
            
            // Collect all symbol data (can be empty)
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                const bidMin = parseFloat(document.getElementById(`bidMin-${id}`).value);
                const bidMax = parseFloat(document.getElementById(`bidMax-${id}`).value);
                const askMin = parseFloat(document.getElementById(`askMin-${id}`).value);
                const askMax = parseFloat(document.getElementById(`askMax-${id}`).value);
                
                const bidQtyMin = parseInt(document.getElementById(`bidQtyMin-${id}`).value);
                const bidQtyMax = parseInt(document.getElementById(`bidQtyMax-${id}`).value);
                const askQtyMin = parseInt(document.getElementById(`askQtyMin-${id}`).value);
                const askQtyMax = parseInt(document.getElementById(`askQtyMax-${id}`).value);
                
                const spread = parseFloat(document.getElementById(`spread-${id}`).value);
                const volume = parseInt(document.getElementById(`volume-${id}`).value);
                
                const bidWeight = parseInt(document.getElementById(`bidWeight-${id}`).value);
                const askWeight = parseInt(document.getElementById(`askWeight-${id}`).value);
                const tradePercent = parseInt(document.getElementById(`tradePercent-${id}`).value);
                
                symbols.push({
                    symbol: symbol,
                    allocation: allocation,
                    bidPriceRange: { min: bidMin, max: bidMax },
                    askPriceRange: { min: askMin, max: askMax },
                    bidQuantityRange: { min: bidQtyMin, max: bidQtyMax },
                    askQuantityRange: { min: askQtyMin, max: askQtyMax },
                    spreadPercent: spread,
                    volumeM: volume,
                    // Probability distribution controls for sophisticated market simulation
                    bidWeightPercent: bidWeight,     // Distribution bias for bid prices
                    askWeightPercent: askWeight,     // Distribution bias for ask prices  
                    tradePercent: tradePercent       // Percentage of messages that are trades vs quotes
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange.toLowerCase(), // Keep consistent lowercase
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000)
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
        },

        // Load config from Flask backend
        loadConfig: async function(configName) {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs/${configName}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const config = await response.json();
                this.populateFromConfig(config);
                
                this.currentConfig = configName;
                this.configModified = false;
                this.updateConfigState();
                
                console.log(`✅ Loaded config: ${configName}`);
                this.showNotification(`Loaded: ${configName}`, 'success');
                
            } catch (error) {
                console.error('❌ Failed to load config:', error);
                alert(`Failed to load config: ${error.message}`);
            }
        },

        // Populate UI from config object - FIXED: Don't add default symbols for empty configs
        populateFromConfig: function(config) {
            console.log('🔧 Populating from config:', config);
            
            // Clear existing symbols
            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            this.productCounter = 0;
            
            // Handle different config structures from Flask
            let globalSettings, metadata;
            
            if (config.globalSettings) {
                // New structure
                globalSettings = config.globalSettings;
                metadata = config.metadata || {};
            } else {
                // Handle legacy or different structure
                globalSettings = {
                    messageCount: config.messageCount || config.totalMessages || 1000,
                    exchange: config.exchange || 'nasdaq'
                };
                metadata = config.metadata || config;
            }
            
            console.log('📊 Using globalSettings:', globalSettings);
            console.log('📋 Using metadata:', metadata);
            
            // Set global settings with fallbacks
            const numMessagesInput = document.getElementById('numMessagesInput');
            const exchangeSelect = document.getElementById('exchangeSelect');
            const saveAsInput = document.getElementById('saveAsInput');
            
            if (numMessagesInput) {
                numMessagesInput.value = globalSettings.messageCount || 1000;
            }
            
            if (exchangeSelect) {
                exchangeSelect.value = (globalSettings.exchange || 'nasdaq').toLowerCase();
            }
            
            // Set save-as field from metadata if available
            if (saveAsInput) {
                const saveAsValue = metadata.saveAsName || metadata.fileName || '';
                saveAsInput.value = saveAsValue;
            }
            
            // FIXED: Only add symbols if they exist in the config - don't add defaults
            if (config.symbols && Array.isArray(config.symbols) && config.symbols.length > 0) {
                console.log(`📦 Adding ${config.symbols.length} symbols from config`);
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('📄 Config has no symbols - starting with empty state');
                // Don't add any default symbols - respect the empty config
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Missing closing brace
        addSymbolFromConfig: function(symbolConfig) {
            try {
                this.productCounter++;
                const currentId = this.productCounter;
                
                const container = document.getElementById('productsContainer');
                const productCard = document.createElement('div');
                productCard.className = 'datacard';
                productCard.id = `product-${currentId}`;
                
                productCard.addEventListener('click', function(e) {
                    e.stopPropagation();
                });
                
                // Use config values with fallbacks
                const params = {
                    priceRange: { 
                        min: Math.min(
                            symbolConfig.bidPriceRange?.min || 100, 
                            symbolConfig.askPriceRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidPriceRange?.max || 200, 
                            symbolConfig.askPriceRange?.max || 200
                        )
                    },
                    quantityRange: {
                        min: Math.min(
                            symbolConfig.bidQuantityRange?.min || 100, 
                            symbolConfig.askQuantityRange?.min || 100
                        ),
                        max: Math.max(
                            symbolConfig.bidQuantityRange?.max || 1000, 
                            symbolConfig.askQuantityRange?.max || 1000
                        )
                    },
                    spreadPercent: symbolConfig.spreadPercent || 0.5,
                    volumeM: symbolConfig.volumeM || 25,
                    bidMin: symbolConfig.bidPriceRange?.min || 100,
                    bidMax: symbolConfig.bidPriceRange?.max || 150,
                    askMin: symbolConfig.askPriceRange?.min || 105,
                    askMax: symbolConfig.askPriceRange?.max || 155
                };
                
                productCard.innerHTML = this.generateCardHTML(
                    symbolConfig.symbol, 
                    currentId, 
                    symbolConfig.allocation || 50, 
                    params
                );
                
                container.appendChild(productCard);
                
                // OPTIMIZED: Set values immediately - no setTimeout delay
                try {
                    // Set range values with fallbacks
                    this.setInputValue(`bidMin-${currentId}`, symbolConfig.bidPriceRange?.min || params.bidMin);
                    this.setInputValue(`bidMax-${currentId}`, symbolConfig.bidPriceRange?.max || params.bidMax);
                    this.setInputValue(`askMin-${currentId}`, symbolConfig.askPriceRange?.min || params.askMin);
                    this.setInputValue(`askMax-${currentId}`, symbolConfig.askPriceRange?.max || params.askMax);
                    
                    this.setInputValue(`bidQtyMin-${currentId}`, symbolConfig.bidQuantityRange?.min || 100);
                    this.setInputValue(`bidQtyMax-${currentId}`, symbolConfig.bidQuantityRange?.max || 500);
                    this.setInputValue(`askQtyMin-${currentId}`, symbolConfig.askQuantityRange?.min || 120);
                    this.setInputValue(`askQtyMax-${currentId}`, symbolConfig.askQuantityRange?.max || 600);
                    
                    this.setInputValue(`spread-${currentId}`, symbolConfig.spreadPercent || 0.5);
                    this.setInputValue(`volume-${currentId}`, symbolConfig.volumeM || 25);
                    
                    // Set probability weights with fallbacks
                    this.setInputValue(`bidWeight-${currentId}`, symbolConfig.bidWeightPercent || 50);
                    this.setInputValue(`askWeight-${currentId}`, symbolConfig.askWeightPercent || 50);
                    this.setInputValue(`tradePercent-${currentId}`, symbolConfig.tradePercent || 30);
                    
                    // Initialize sliders to reflect loaded values - immediately
                    this.initializeSliders(currentId);
                } catch (error) {
                    console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                }
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values - MOVED to correct position
        setInputValue: function(elementId, value) {
            const element = document.getElementById(elementId);
            if (element && value !== undefined && value !== null) {
                element.value = value;
            }
        },

        // Save config to Flask backend
        saveConfigToFlask: async function(configName, config) {
            const flaskUrl = this.isDemo ? 
                'https://your-production-flask-server.com' : 
                'http://localhost:8080';  // ✅ Fixed port
            
            const response = await fetch(`${flaskUrl}/api/configs/${configName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        },

        // Update config state visual indicators
        updateConfigState: function() {
            const select = document.getElementById('configSelect');
            
            select.classList.remove('loaded', 'modified');
            
            if (this.currentConfig) {
                if (this.configModified) {
                    select.classList.add('modified');
                } else {
                    select.classList.add('loaded');
                }
            }
        },

        // Mark config as modified when changes are made
        markConfigModified: function() {
            if (this.currentConfig && !this.configModified) {
                this.configModified = true;
                this.updateConfigState();
                console.log('📝 Config marked as modified');
            }
        },

        // Show notification message
        showNotification: function(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10001;
                padding: 12px 20px; border-radius: 6px; color: white;
                font-weight: 600; font-size: 0.9rem; 
                background: ${type === 'success' ? '#00ff64' : type === 'error' ? '#dc3545' : '#00aaff'};
                color: ${type === 'success' ? '#000' : '#fff'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        // Generate card HTML template - FIXED: Start expanded, move collapse button left, use arrows
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <div class="datacard-title-controls">
                        <button class="card-expand-btn" onclick="DatasetGenerator.toggleCard(${id})" title="Expand/Collapse Details">
                            <span class="expand-indicator" id="expandIndicator-${id}">▼</span>
                        </button>
                        <h4 class="datacard-title">${symbol}</h4>
                    </div>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content expanded" id="cardContent-${id}">
                    <div class="form-row-triple">
                        <!-- BID COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Bid Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidTrack-${id}"></div>
                                        <input type="range" id="bidMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMin}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                        <input type="range" id="bidMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.bidMax}" oninput="DatasetGenerator.updateRange('bid', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidMinVal-${id}">${params.bidMin.toFixed(2)}</span>
                                        <span id="bidMaxVal-${id}">${params.bidMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Bid Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="bidQtyTrack-${id}"></div>
                                        <input type="range" id="bidQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.2)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                        <input type="range" id="bidQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.7)}" oninput="DatasetGenerator.updateRange('bidQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="bidQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.2).toLocaleString()}</span>
                                        <span id="bidQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.7).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Spread</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="spreadTrack-${id}"></div>
                                        <input type="range" id="spread-${id}" min="0.01" max="2.0" step="0.01" value="${params.spreadPercent.toFixed(2)}" oninput="DatasetGenerator.updateSingleRange('spread', ${id})">
                                    </div>
                                    <div class="single-range-value" id="spreadVal-${id}">${params.spreadPercent.toFixed(2)}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- ASK COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Ask Price</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askTrack-${id}"></div>
                                        <input type="range" id="askMin-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMin}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                        <input type="range" id="askMax-${id}" min="${Math.floor(params.priceRange.min)}" max="${Math.ceil(params.priceRange.max)}" value="${params.askMax}" oninput="DatasetGenerator.updateRange('ask', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askMinVal-${id}">${params.askMin.toFixed(2)}</span>
                                        <span id="askMaxVal-${id}">${params.askMax.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Qty</label>
                                <div class="range-slider-container">
                                    <div class="range-slider">
                                        <div class="range-track" id="askQtyTrack-${id}"></div>
                                        <input type="range" id="askQtyMin-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.min * 1.3)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                        <input type="range" id="askQtyMax-${id}" min="${params.quantityRange.min}" max="${params.quantityRange.max}" value="${Math.round(params.quantityRange.max * 0.8)}" oninput="DatasetGenerator.updateRange('askQty', ${id})">
                                    </div>
                                    <div class="range-values">
                                        <span id="askQtyMinVal-${id}">${Math.round(params.quantityRange.min * 1.3).toLocaleString()}</span>
                                        <span id="askQtyMaxVal-${id}">${Math.round(params.quantityRange.max * 0.8).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Volume</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="volumeTrack-${id}"></div>
                                        <input type="range" id="volume-${id}" min="1" max="100" step="1" value="${params.volumeM}" oninput="DatasetGenerator.updateSingleRange('volume', ${id})">
                                    </div>
                                    <div class="single-range-value" id="volumeVal-${id}">${params.volumeM}M</div>
                                </div>
                            </div>
                        </div>

                        <!-- PROBABILITY WEIGHTS COLUMN -->
                        <div class="form-column">
                            <div class="form-group">
                                <label class="form-label">Market Sentiment</label>
                                <div class="sentiment-selector">
                                    <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Price Drift %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="driftTrack-${id}"></div>
                                        <input type="range" id="drift-${id}" min="-2.0" max="2.0" step="0.1" value="0.0" oninput="DatasetGenerator.updateSingleRange('drift', ${id})">
                                    </div>
                                    <div class="single-range-value" id="driftVal-${id}">0.0%</div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Trade %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="tradePercentTrack-${id}"></div>
                                        <input type="range" id="tradePercent-${id}" min="5" max="95" step="1" value="30" oninput="DatasetGenerator.updateSingleRange('tradePercent', ${id})">
                                    </div>
                                    <div class="single-range-value" id="tradePercentVal-${id}">30%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        // Toggle individual card expand/collapse - UPDATED: Use proper arrows
        toggleCard: function(cardId) {
            const content = document.getElementById(`cardContent-${cardId}`);
            const indicator = document.getElementById(`expandIndicator-${cardId}`);
            
            if (content && indicator) {
                if (content.classList.contains('expanded')) {
                    // Collapse
                    content.classList.remove('expanded');
                    content.classList.add('collapsed');
                    indicator.textContent = '▶';  // Right arrow for collapsed
                    console.log(`📕 Collapsed card ${cardId}`);
                } else {
                    // Expand
                    content.classList.remove('collapsed');
                    content.classList.add('expanded');
                    indicator.textContent = '▼';  // Down arrow for expanded
                    console.log(`📖 Expanded card ${cardId}`);
                }
            }
        },

        // NEW: Simple dataset-wide sentiment slider that updates display only
        updateDatasetSentiment: function() {
            const slider = document.getElementById('datasetSentiment');
            const valueDisplay = document.getElementById('datasetSentimentVal');
            const description = document.getElementById('sentimentDescription');
            
            if (!slider || !valueDisplay || !description) return;
            
            const value = parseFloat(slider.value);
            
            // Update display based on slider value
            if (value < -0.25) {
                valueDisplay.textContent = 'Bearish';
                description.textContent = 'Market decline - higher selling pressure';
                this.datasetSentiment = 'bearish';
            } else if (value > 0.25) {
                valueDisplay.textContent = 'Bullish';
                description.textContent = 'Market rally - higher buying pressure';
                this.datasetSentiment = 'bullish';
            } else {
                valueDisplay.textContent = 'Neutral';
                description.textContent = 'Balanced market conditions';
                this.datasetSentiment = 'neutral';
            }
        },

        // NEW: Apply dataset sentiment as a starting template (quants can then customize)
        applyDatasetSentimentTemplate: function() {
            if (!this.datasetSentiment || this.datasetSentiment === 'neutral') return;
            
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                this.applySentimentToSymbol(id, this.datasetSentiment);
            });
            
            this.markConfigModified();
            console.log(`📈 Applied ${this.datasetSentiment} template to ${symbolCards.length} symbols`);
        },

        // Load initial symbols on page ready - ADDED: Better error handling
        loadInitialSymbols: function() {
            try {
                console.log('🔄 Dataset Generator ready - no default symbols loaded');
                this.updateAllocationDisplay();
                this.loadAvailableConfigs();
                
                // Validate all