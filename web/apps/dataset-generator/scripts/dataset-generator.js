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
        collapsedPanels: new Set(), // Track which panels are collapsed
        
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
            // Panel clicks should work via inline onclick in HTML
        },

        // Simple toggle function - called directly from HTML onclick
        togglePanel: function(panelType) {
            console.log(`🔄 togglePanel called for: ${panelType}`);
            
            const panel = document.querySelector(`[data-panel="${panelType}"]`);
            if (!panel) {
                console.error(`❌ Panel not found: ${panelType}`);
                return;
            }
            
            // Simple toggle
            if (panel.classList.contains('collapsed')) {
                panel.classList.remove('collapsed');
                console.log(`📖 Expanded ${panelType}`);
            } else {
                panel.classList.add('collapsed');
                console.log(`📕 Collapsed ${panelType}`);
            }
            
            // Update indicator
            const indicator = panel.querySelector('.panel-collapse-indicator');
            if (indicator) {
                indicator.textContent = panel.classList.contains('collapsed') ? '＋' : '−';
            }
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
        
        // Handle symbol input (Enter key)
        handleSymbolInput: function(event) {
            if (event.key === 'Enter') {
                const input = event.target;
                const symbol = input.value.trim().toUpperCase();
                
                if (!symbol || this.symbolExists(symbol)) return;

                // Allow any symbol to be added
                this.addProductWithSymbol(symbol);
                input.value = '';
                input.classList.remove('duplicate');
                document.getElementById('symbolError').classList.remove('show');
            }
        },
        
        // Add product with symbol data - FIXED market data lookup
        addProductWithSymbol: function(symbol) {
            let marketData;
            
            console.log(`🔍 Looking up market data for ${symbol}...`);
            console.log(`🔍 MarketDataUtils exists:`, typeof MarketDataUtils !== 'undefined');
            console.log(`🔍 window.MARKET_DATA exists:`, typeof window.MARKET_DATA !== 'undefined');
            
            // FIXED: Direct check of window.MARKET_DATA first - this was working before
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
        
        // Add product card with market data
        addProductWithMarketData: function(symbol, marketData) {
            console.log(`📊 Adding ${symbol} with market data`);
            this.productCounter++;
            
            const priceRange = marketData.priceRange || { min: 100, max: 200 };
            const quantityRange = marketData.quantityRange || { min: 100, max: 1000 };
            const spreadPercent = marketData.spreadPercent || 0.5;
            const volumeM = marketData.volume || 25;
            
            const container = document.getElementById('productsContainer');
            const productCard = document.createElement('div');
            productCard.className = 'datacard';
            productCard.id = `product-${this.productCounter}`;
            
            // Prevent datacard clicks from bubbling up to panel
            productCard.addEventListener('click', function(e) {
                e.stopPropagation();
            });
            
            const midPrice = (priceRange.min + priceRange.max) / 2;
            const bidMin = Math.round((priceRange.min + midPrice * 0.98) / 2 * 100) / 100;
            const bidMax = Math.round((midPrice + priceRange.max * 0.98) / 2 * 100) / 100;
            const askMin = Math.round((priceRange.min * 1.02 + midPrice) / 2 * 100) / 100;
            const askMax = Math.round((midPrice * 1.02 + priceRange.max) / 2 * 100) / 100;
            
            // Calculate temporary percentage for new card (will be rebalanced)
            const totalSymbols = document.querySelectorAll('.datacard').length + 1;
            const defaultPercentage = Math.round(100 / totalSymbols);
            const currentId = this.productCounter;
            
            productCard.innerHTML = this.generateCardHTML(symbol, currentId, defaultPercentage, {
                priceRange, quantityRange, spreadPercent, volumeM,
                bidMin, bidMax, askMin, askMax
            });
            
            container.appendChild(productCard);
            
            // Initialize sliders and rebalance percentages after DOM insertion
            setTimeout(() => {
                this.initializeSliders(currentId);
                // Auto-rebalance all percentages to maintain 100% total
                this.rebalancePercentages();
            }, 50);
            
            // Add entrance animation
            this.animateCardEntrance(productCard);
            
            // Validate form state
            this.validateForm();
            
            // DON'T auto-expand collapsed panels when adding symbols
            console.log(`✅ Added ${symbol} without changing panel collapse state`);
        },

        // Generate card HTML template - NEW 3-column layout with probability weights
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
        
        // Update allocation display
        updateAllocationDisplay: function() {
            const allocationDisplay = document.getElementById('allocationPercentage');
            if (!allocationDisplay) return;
            
            const total = this.validateTotalPercentage();
            
            allocationDisplay.textContent = `${total}% Allocated`;
            
            // Remove existing classes
            allocationDisplay.classList.remove('perfect', 'error');
            
            // Add appropriate class based on total
            if (total === 100 && total > 0) {  // Only perfect if we actually have symbols
                allocationDisplay.classList.add('perfect');
            } else {
                allocationDisplay.classList.add('error');
            }
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
        
        // Form validation
        validateForm: function() {
            const numMessages = document.getElementById('numMessagesInput').value.trim();
            const fileName = document.getElementById('saveAsInput').value.trim();
            const symbolCount = document.querySelectorAll('.datacard-title').length;
            const generateBtn = document.getElementById('generateBtn');
            const saveAsInput = document.getElementById('saveAsInput');
            
            const hasMessages = numMessages && parseInt(numMessages) > 0;
            const hasSymbols = symbolCount > 0;
            const hasFileName = fileName.length > 0;
            
            if (hasFileName) {
                saveAsInput.className = 'form-input save-as-filled';
            } else {
                saveAsInput.className = 'form-input save-as-empty';
            }
            
            if (hasMessages && hasSymbols && hasFileName) {
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                generateBtn.style.cursor = 'pointer';
            } else {
                generateBtn.disabled = true;
                generateBtn.style.opacity = '0.5';
                generateBtn.style.cursor = 'not-allowed';
            }
        },
        
        // Validate number of messages
        validateNumMessages: function() {
            const input = document.getElementById('numMessagesInput');
            const value = input.value.trim();
            
            if (value === '' || parseInt(value) <= 0) {
                input.className = 'form-input required-empty';
            } else {
                input.className = 'form-input required-filled';
            }
            
            this.validateForm();
        },
        
        // Toggle panel collapse/expand - enhanced logging
        togglePanel: function(panelType) {
            console.log(`🔄 togglePanel called for: ${panelType}`);
            
            const panel = document.querySelector(`[data-panel="${panelType}"]`);
            const mainPanels = document.querySelector('.main-panels');
            
            if (!panel) {
                console.error(`❌ Panel not found: ${panelType}`);
                return;
            }
            
            const isCurrentlyCollapsed = panel.classList.contains('collapsed');
            console.log(`📋 Panel ${panelType} current state: ${isCurrentlyCollapsed ? 'collapsed' : 'expanded'}`);
            
            // Toggle collapsed state
            if (isCurrentlyCollapsed) {
                panel.classList.remove('collapsed');
                this.collapsedPanels.delete(panelType);
                console.log(`📖 Expanded ${panelType} panel`);
            } else {
                panel.classList.add('collapsed');
                this.collapsedPanels.add(panelType);
                console.log(`📕 Collapsed ${panelType} panel - keeping headers visible`);
            }
            
            // Update collapse indicator
            const indicator = panel.querySelector('.panel-collapse-indicator');
            if (indicator) {
                if (panel.classList.contains('collapsed')) {
                    indicator.textContent = '＋';
                    console.log(`🔄 Changed indicator to: ＋`);
                } else {
                    indicator.textContent = '−';
                    console.log(`🔄 Changed indicator to: −`);
                }
            } else {
                console.warn('⚠️ Collapse indicator not found');
            }
            
            // Update main panels layout if both are collapsed
            if (this.collapsedPanels.has('dataset-config') && this.collapsedPanels.has('product-config')) {
                mainPanels.classList.add('both-collapsed');
                console.log('🔄 Both panels collapsed - switching to single column layout');
            } else {
                mainPanels.classList.remove('both-collapsed');
                console.log('🔄 At least one panel expanded - using two column layout');
            }
            
            // Force layout recalculation
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
                console.log('🔄 Layout recalculation triggered');
            }, 300);
        },

        // Generate dataset
        generateDataset: function() {
            const numMessages = document.getElementById('numMessagesInput').value;
            const exchange = document.getElementById('exchangeSelect').value;
            const fileName = document.getElementById('saveAsInput').value.trim();
            
            if (!numMessages || parseInt(numMessages) <= 0) {
                alert('Please enter a valid number of messages');
                return;
            }
            
            if (!fileName) {
                alert('Please enter a file name');
                return;
            }
            
            const symbolCount = document.querySelectorAll('.datacard-title').length;
            if (symbolCount === 0) {
                alert('Please add at least one symbol');
                return;
            }
            
            const symbols = Array.from(document.querySelectorAll('.datacard-title')).map(el => 
                el.textContent.trim()
            );
            
            const datasetConfig = {
                fileName: fileName,
                numMessages: parseInt(numMessages),
                exchange: exchange,
                symbols: symbols,
                timestamp: new Date().toISOString()
            };
            
            console.log('🚀 Generating dataset:', datasetConfig);
            
            // Here you would integrate with your C++ backend
            alert(`Dataset generation started!\nFile: ${fileName}\nMessages: ${numMessages}\nExchange: ${exchange}\nSymbols: ${symbols.join(', ')}`);
        }
    };
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        DatasetGenerator.init();
    });

})();
