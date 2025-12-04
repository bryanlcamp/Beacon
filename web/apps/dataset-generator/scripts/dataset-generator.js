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
        
        // Initialize application
        init: function() {
            this.isDemo = window.location.hostname.includes('github.io') || 
                         window.location.hostname.includes('githubusercontent.com');
            
            if (this.isDemo) {
                document.body.classList.add('demo-mode');
            }
            
            this.loadInitialSymbols();
        },
        
        // Load initial symbols on page ready
        loadInitialSymbols: function() {
            console.log('🔄 Dataset Generator ready - no default symbols loaded');
            this.updateAllocationDisplay();
            this.loadAvailableConfigs();
        },

        // Load available configs from Flask backend
        loadAvailableConfigs: async function() {
            try {
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';  // ✅ Fixed port
                
                const response = await fetch(`${flaskUrl}/api/configs`);
                if (!response.ok) {
                    console.warn('Could not load configs from Flask server');
                    return;
                }
                
                const configs = await response.json();
                this.populateConfigDropdown(configs);
                console.log('✅ Loaded available configs:', configs);
                
            } catch (error) {
                console.warn('Could not connect to Flask server for configs:', error.message);
            }
        },

        // Populate config dropdown with available files
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

        // Generate config for saving - NO validation required
        generateCurrentConfigForSave: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value || '1000';
            const exchange = document.getElementById('exchangeSelect').value;
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
                    bidWeightPercent: bidWeight,
                    askWeightPercent: askWeight,
                    tradePercent: tradePercent
                });
            });
            
            return {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toUpperCase(),
                    saveAsName: saveAs
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange,
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

        // Populate UI from config object - FIXED: Handle different config structures
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
            
            // Add symbols if they exist
            if (config.symbols && Array.isArray(config.symbols)) {
                config.symbols.forEach(symbolConfig => {
                    this.addSymbolFromConfig(symbolConfig);
                });
            } else {
                console.log('⚠️ No symbols found in config');
            }
            
            // Update form state
            this.validateNumMessages();
            this.validateForm();
            this.updateAllocationDisplay();
        },

        // Add symbol from config object - FIXED: Better error handling
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
                
                // Set all the values from config with error handling
                setTimeout(() => {
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
                        
                        // Initialize sliders to reflect loaded values
                        this.initializeSliders(currentId);
                    } catch (error) {
                        console.error(`❌ Error setting slider values for ${symbolConfig.symbol}:`, error);
                    }
                }, 50);
                
                this.animateCardEntrance(productCard);
                
            } catch (error) {
                console.error(`❌ Error adding symbol from config:`, error);
            }
        },

        // Helper function to safely set input values
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

        // Generate card HTML template - FIXED: Individual allocation display in header
        generateCardHTML: function(symbol, id, percentage, params) {
            return `
                <div class="datacard-header">
                    <h4 class="datacard-title">${symbol}</h4>
                    <div class="datacard-controls">
                        <input type="number" class="percentage-spinner" id="percentage-${id}" 
                               value="${percentage}" min="1" max="100" 
                               onchange="DatasetGenerator.updatePercentage(${id})" 
                               oninput="DatasetGenerator.updatePercentage(${id})">
                        <span class="percentage-label">%</span>
                        <span class="allocation-percentage" id="cardAllocation-${id}">${percentage}%</span>
                        <button class="remove-btn" onclick="DatasetGenerator.removeProduct('product-${id}')" title="Remove Product">×</button>
                    </div>
                </div>
                
                <div class="datacard-content">
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
                                <label class="form-label">Bid Weight %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="bidWeightTrack-${id}"></div>
                                        <input type="range" id="bidWeight-${id}" min="10" max="90" step="1" value="50" oninput="DatasetGenerator.updateSingleRange('bidWeight', ${id})">
                                    </div>
                                    <div class="single-range-value" id="bidWeightVal-${id}">50%</div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Ask Weight %</label>
                                <div class="single-range-container">
                                    <div class="single-range">
                                        <div class="single-range-track" id="askWeightTrack-${id}"></div>
                                        <input type="range" id="askWeight-${id}" min="10" max="90" step="1" value="50" oninput="DatasetGenerator.updateSingleRange('askWeight', ${id})">
                                    </div>
                                    <div class="single-range-value" id="askWeightVal-${id}">50%</div>
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
        
        // Initialize all sliders for a product card - UPDATED for new sliders
        initializeSliders: function(productId) {
            this.updateRange('bid', productId);
            this.updateRange('ask', productId);
            this.updateRange('bidQty', productId);
            this.updateRange('askQty', productId);
            this.updateSingleRange('spread', productId);
            this.updateSingleRange('volume', productId);
            // Initialize new probability weight sliders
            this.updateSingleRange('bidWeight', productId);
            this.updateSingleRange('askWeight', productId);
            this.updateSingleRange('tradePercent', productId);
        },
        
        // Update dual range sliders
        updateRange: function(type, productId) {
            const minSlider = document.getElementById(`${type}Min-${productId}`);
            const maxSlider = document.getElementById(`${type}Max-${productId}`);
            const minVal = document.getElementById(`${type}MinVal-${productId}`);
            const maxVal = document.getElementById(`${type}MaxVal-${productId}`);
            const track = document.getElementById(`${type}Track-${productId}`);
            
            if (!minSlider || !maxSlider || !minVal || !maxVal || !track) return;
            
            let minValue = parseInt(minSlider.value);
            let maxValue = parseInt(maxSlider.value);
            
            if (minValue > maxValue) {
                if (event && event.target === minSlider) {
                    maxValue = minValue;
                    maxSlider.value = maxValue;
                } else {
                    minValue = maxValue;
                    minSlider.value = minValue;
                }
            }
            
            if (type.includes('Price') || type === 'bid' || type === 'ask') {
                minVal.textContent = minValue.toFixed(2);
                maxVal.textContent = maxValue.toFixed(2);
            } else {
                minVal.textContent = minValue.toLocaleString();
                maxVal.textContent = maxValue.toLocaleString();
            }
            
            const min = parseInt(minSlider.min);
            const max = parseInt(minSlider.max);
            const left = ((minValue - min) / (max - min)) * 100;
            const right = ((maxValue - min) / (max - min)) * 100;
            
            track.style.left = left + '%';
            track.style.width = (right - left) + '%';
            
            this.markConfigModified(); // Mark as modified when changing ranges
        },
        
        // Update single range sliders
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
            } else if (type === 'spread') {
                valueDisplay.textContent = value.toFixed(2) + '%';
            } else {
                valueDisplay.textContent = value + '%';
            }
            
            const percentage = ((value - min) / (max - min)) * 100;
            track.style.left = '0%';
            track.style.width = percentage + '%';
            
            this.markConfigModified(); // Mark as modified when changing single ranges
        },
        
        // Update percentage spinner
        updatePercentage: function(productId) {
            const spinner = document.getElementById(`percentage-${productId}`);
            let value = parseInt(spinner.value);
            
            if (value < 1) {
                value = 1;
                spinner.value = 1;
            }
            if (value > 100) {
                value = 100;
                spinner.value = 100;
            }
            
            this.updateAllocationDisplay();
            this.markConfigModified(); // Mark as modified when changing percentages
        },
        
        // Rebalance all percentages to always equal 100%
        rebalancePercentages: function() {
            const spinners = document.querySelectorAll('.percentage-spinner');
            const totalSymbols = spinners.length;
            
            if (totalSymbols === 0) {
                // If no symbols left, reset allocation display
                const allocationDisplay = document.getElementById('allocationPercentage');
                if (allocationDisplay) {
                    allocationDisplay.textContent = '0% Allocated';
                    allocationDisplay.classList.remove('perfect', 'error');
                    allocationDisplay.classList.add('error');
                }
                return;
            }
            
            // Distribute 100% evenly across all symbols
            const basePercentage = Math.floor(100 / totalSymbols);
            const remainder = 100 % totalSymbols;
            
            spinners.forEach((spinner, index) => {
                // Give remainder to first symbols to ensure exact 100% total
                const percentage = basePercentage + (index < remainder ? 1 : 0);
                spinner.value = percentage;
            });
            
            // Always update allocation display after rebalancing
            this.updateAllocationDisplay();
            
            console.log(`🔄 Auto-rebalanced ${totalSymbols} symbols to 100% allocation`);
        },
        
        // Update allocation display - FIXED: Update both global and individual card displays
        updateAllocationDisplay: function() {
            const allocationDisplay = document.getElementById('allocationPercentage');
            const total = this.validateTotalPercentage();
            
            // Update global allocation display
            if (allocationDisplay) {
                allocationDisplay.textContent = `${total}% Allocated`;
                allocationDisplay.classList.remove('perfect', 'error');
                
                if (total === 100 && total > 0) {
                    allocationDisplay.classList.add('perfect');
                } else {
                    allocationDisplay.classList.add('error');
                }
            }
            
            // Update individual card allocation displays
            const symbolCards = document.querySelectorAll('.datacard');
            symbolCards.forEach(card => {
                const id = card.id.replace('product-', '');
                const cardAllocationDisplay = document.getElementById(`cardAllocation-${id}`);
                const spinner = document.getElementById(`percentage-${id}`);
                
                if (cardAllocationDisplay && spinner) {
                    const cardPercentage = parseInt(spinner.value);
                    cardAllocationDisplay.textContent = `${cardPercentage}%`;
                    
                    // Remove existing classes
                    cardAllocationDisplay.classList.remove('perfect', 'error');
                    
                    // Add color based on total allocation state
                    if (total === 100 && total > 0) {
                        cardAllocationDisplay.classList.add('perfect');
                    } else {
                        cardAllocationDisplay.classList.add('error');
                    }
                }
            });
        },

        // Validate total percentage
        validateTotalPercentage: function() {
            const spinners = document.querySelectorAll('.percentage-spinner');
            
            // If no symbols exist, return 0
            if (spinners.length === 0) {
                return 0;
            }
            
            const total = Array.from(spinners).reduce((sum, spinner) => {
                return sum + parseInt(spinner.value || 0);
            }, 0);
            
            return total;
        },
        
        // Remove product card
        removeProduct: function(productId) {
            const productCard = document.getElementById(productId);
            if (productCard) {
                productCard.style.transition = 'all 0.3s ease';
                productCard.style.opacity = '0';
                productCard.style.transform = 'translateY(-20px)';
                
                setTimeout(() => {
                    productCard.remove();
                    this.rebalancePercentages();
                    this.validateForm();
                    this.markConfigModified(); // Mark as modified when removing symbols
                }, 300);
            }
        },

        // Animate card entrance
        animateCardEntrance: function(card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 10);
        },

        // Generate current configuration object
        generateCurrentConfig: function(fileName) {
            const numMessages = document.getElementById('numMessagesInput').value;
            const exchange = document.getElementById('exchangeSelect').value;
            
            if (!numMessages || parseInt(numMessages) <= 0) {
                alert('Please enter a valid number of messages');
                return null;
            }
            
            const symbolCount = document.querySelectorAll('.datacard-title').length;
            if (symbolCount === 0) {
                alert('Please add at least one symbol');
                return null;
            }
            
            // Collect all symbol data with sophisticated probability parameters
            const symbols = [];
            const symbolCards = document.querySelectorAll('.datacard');
            
            symbolCards.forEach((card) => {
                const id = card.id.replace('product-', '');
                const symbol = card.querySelector('.datacard-title').textContent.trim();
                const allocation = parseInt(card.querySelector(`#percentage-${id}`).value);
                
                // Extract all the sophisticated parameters
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
                
                // The sophisticated probability weights that quants want
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
            
            // Generate the complete dataset configuration JSON
            const datasetConfig = {
                metadata: {
                    fileName: fileName.replace('.json', ''),
                    generatedAt: new Date().toISOString(),
                    generator: "Beacon HFT Dataset Generator v1.0",
                    totalMessages: parseInt(numMessages),
                    exchange: exchange.toUpperCase()
                },
                globalSettings: {
                    messageCount: parseInt(numMessages),
                    exchange: exchange,
                    timestampStart: Date.now(),
                    randomSeed: Math.floor(Math.random() * 1000000) // For reproducible datasets
                },
                symbols: symbols,
                validation: {
                    totalAllocation: symbols.reduce((sum, s) => sum + s.allocation, 0),
                    symbolCount: symbols.length
                }
            };
            
            return datasetConfig;
        },

        // Check if symbol already exists
        symbolExists: function(symbol) {
            const existingTitles = document.querySelectorAll('.datacard-title');
            return Array.from(existingTitles).some(title => 
                title.textContent.trim().toUpperCase() === symbol.toUpperCase()
            );
        },
        
        // Validate symbol input as user types
        validateSymbolInput: function(event) {
            const input = event.target;
            const symbol = input.value.trim().toUpperCase();
            const errorMsg = document.getElementById('symbolError');
            
            if (!symbol) {
                input.classList.remove('duplicate');
                errorMsg.classList.remove('show');
                return;
            }

            if (this.symbolExists(symbol)) {
                input.classList.add('duplicate');
                errorMsg.textContent = 'Symbol already exists';
                errorMsg.style.color = '#dc3545';
                errorMsg.classList.add('show');
                return;
            }

            // Allow any symbol - remove market data validation
            input.classList.remove('duplicate');
            errorMsg.classList.remove('show');
        },
        
        // Handle symbol input (Enter key) - ENHANCED for button-less design
        handleSymbolInput: function(event) {
            if (event.key === 'Enter') {
                const input = event.target;
                const symbol = input.value.trim().toUpperCase();
                
                if (!symbol || this.symbolExists(symbol)) return;

                // Add the symbol
                this.addProductWithSymbol(symbol);
                
                // Clear input and remove any error styling
                input.value = '';
                input.classList.remove('duplicate');
                input.style.fontStyle = 'italic'; // Restore italic placeholder style
                document.getElementById('symbolError').classList.remove('show');
                
                console.log(`✅ Added symbol ${symbol} via Enter key`);
            }
        },
        
        // Add product with symbol data
        addProductWithSymbol: function(symbol) {
            let marketData;
            
            console.log(`🔍 Looking up market data for ${symbol}...`);
            console.log(`🔍 MarketDataUtils exists:`, typeof MarketDataUtils !== 'undefined');
            console.log(`🔍 window.MARKET_DATA exists:`, typeof window.MARKET_DATA !== 'undefined');
            
            // Direct check of window.MARKET_DATA first
            if (window.MARKET_DATA && window.MARKET_DATA[symbol.toUpperCase()]) {
                const bundled = window.MARKET_DATA[symbol.toUpperCase()];
                console.log(`✅ Found market data for ${symbol} directly:`, bundled);
                marketData = {
                    symbol,
                    priceRange: bundled.priceRange,
                    quantityRange: bundled.quantityRange,
                    spreadPercent: bundled.spreadPercent,
                    volume: bundled.simulationProfile ? 
                           Math.round(bundled.simulationProfile.avgDailyVolume / 1000000) : 25
                };
            } else {
                console.log(`⚠️ No direct market data found for ${symbol} in window.MARKET_DATA`);
                console.log(`🔍 Available symbols in MARKET_DATA:`, window.MARKET_DATA ? Object.keys(window.MARKET_DATA) : 'MARKET_DATA not available');
            }
            
            // Use generic defaults for any symbol not found in market data
            if (!marketData) {
                console.log(`📦 Using generic defaults for ${symbol}`);
                marketData = {
                    symbol,
                    priceRange: { min: 100, max: 200 },
                    quantityRange: { min: 100, max: 1000 },
                    spreadPercent: 0.5,
                    volume: 25
                };
            }
            
            this.addProductWithMarketData(symbol, marketData);
        },

        // Missing function: Toggle panel collapse/expand
        togglePanel: function(panelType) {
            const panel = document.querySelector(`[data-panel="${panelType}"]`);
            const indicator = panel.querySelector('.panel-collapse-indicator');
            
            if (this.collapsedPanels.has(panelType)) {
                // Expand panel
                panel.classList.remove('collapsed');
                indicator.textContent = '−';
                this.collapsedPanels.delete(panelType);
                console.log(`📖 Expanded ${panelType} panel`);
            } else {
                // Collapse panel
                panel.classList.add('collapsed');
                indicator.textContent = '+';
                this.collapsedPanels.add(panelType);
                console.log(`📕 Collapsed ${panelType} panel`);
            }
        },

        // Missing function: Validate number of messages
        validateNumMessages: function() {
            const input = document.getElementById('numMessagesInput');
            const value = parseInt(input.value);
            
            if (!value || value <= 0) {
                input.classList.remove('required-filled');
                input.classList.add('required-empty');
            } else {
                input.classList.remove('required-empty');
                input.classList.add('required-filled');
            }
            
            this.validateForm();
            this.markConfigModified();
        },

        // Missing function: Overall form validation
        validateForm: function() {
            const numMessages = document.getElementById('numMessagesInput').value;
            const saveAs = document.getElementById('saveAsInput').value;
            const generateBtn = document.getElementById('generateBtn');
            const symbolCount = document.querySelectorAll('.datacard').length;
            
            // Save As validation
            const saveAsInput = document.getElementById('saveAsInput');
            if (!saveAs.trim()) {
                saveAsInput.classList.remove('save-as-filled');
                saveAsInput.classList.add('save-as-empty');
            } else {
                saveAsInput.classList.remove('save-as-empty');
                saveAsInput.classList.add('save-as-filled');
            }
            
            // Enable generate button if all conditions met
            const isValid = numMessages && parseInt(numMessages) > 0 && 
                          saveAs.trim() && symbolCount > 0;
            
            generateBtn.disabled = !isValid;
            
            if (isValid) {
                generateBtn.style.opacity = '1';
                generateBtn.style.cursor = 'pointer';
            } else {
                generateBtn.style.opacity = '0.5';
                generateBtn.style.cursor = 'not-allowed';
            }
        },

        // Missing function: Generate dataset (final step)
        generateDataset: async function() {
            const saveAs = document.getElementById('saveAsInput').value.trim();
            
            if (!saveAs) {
                alert('Please enter a "Save As" name for the dataset');
                return;
            }
            
            // Generate the complete configuration
            const config = this.generateCurrentConfig(saveAs);
            if (!config) return;
            
            try {
                // Send to Flask for C++ generation
                const flaskUrl = this.isDemo ? 
                    'https://your-production-flask-server.com' : 
                    'http://localhost:8080';
                
                const response = await fetch(`${flaskUrl}/api/generate-config`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fileName: saveAs,
                        config: config
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                console.log('🚀 Dataset generation initiated:', result);
                this.showNotification(`Dataset "${saveAs}" ready for generation!`, 'success');
                
                // In demo mode, just show success - FIXED: Missing opening parenthesis
                if (this.isDemo) {
                    alert(`Demo: Dataset "${saveAs}" would be generated with ${config.symbols.length} symbols and ${config.globalSettings.messageCount} messages.`);
                } else {
                    alert(`Configuration created: ${result.filePath}\n\nNext: Run your C++ generator with this config file.`);
                }
                
            } catch (error) {
                console.error('❌ Dataset generation failed:', error);
                alert(`Failed to generate dataset: ${error.message}`);
            }
        },

        // Missing function: Add product with market data (completion of the flow)
        addProductWithMarketData: function(symbol, marketData) {
            this.productCounter++;
            const currentId = this.productCounter;
            
            // Calculate balanced percentage for new symbol
            const existingSymbols = document.querySelectorAll('.datacard').length;
            const balancedPercentage = Math.floor(100 / (existingSymbols + 1));
            
            const container = document.getElementById('productsContainer');
            const productCard = document.createElement('div');
            productCard.className = 'datacard';
            productCard.id = `product-${currentId}`;
            
            // Generate the 3-column card with all sliders
            productCard.innerHTML = this.generateCardHTML(
                symbol, 
                currentId, 
                balancedPercentage, 
                marketData
            );
            
            container.appendChild(productCard);
            
            // Initialize all sliders for the new card
            setTimeout(() => {
                this.initializeSliders(currentId);
                this.rebalancePercentages(); // Auto-balance all symbols
                this.validateForm(); // Check if generate button should be enabled
                this.markConfigModified(); // Mark as modified
            }, 50);
            
            this.animateCardEntrance(productCard);
            
            console.log(`✅ Added ${symbol} with ${balancedPercentage}% allocation`);
        },

        // Missing function: Add symbol from input field (+ button click)
        addSymbolFromInput: function() {
            const input = document.getElementById('symbolInput');
            const symbol = input.value.trim().toUpperCase();
            
            if (!symbol) {
                alert('Please enter a symbol');
                input.focus();
                return;
            }
            
            if (this.symbolExists(symbol)) {
                alert('Symbol already exists');
                input.focus();
                return;
            }
            
            // Add the symbol
            this.addProductWithSymbol(symbol);
            
            // Clear input and remove any error styling
            input.value = '';
            input.classList.remove('duplicate');
            document.getElementById('symbolError').classList.remove('show');
            
            console.log(`✅ Added symbol ${symbol} via + button`);
        },

    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        DatasetGenerator.init();
    });

})();
