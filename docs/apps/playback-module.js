// Core Playback Module - Single Source of Truth
export class PlaybackCore {
    constructor(config = {}) {
        this.state = {
            currentData: null,
            isPlaying: false,
            isPaused: false,
            speed: 1,
            loopMode: false,
            progress: 0,
            algorithm: null,
            matchingEngine: null
        };
        
        this.progressInterval = null;
        this.showFileSelector = config.showFileSelector || false;
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        const speedSlider = document.getElementById('playbackSpeed');
        const loopCheckbox = document.getElementById('loopMode');
        
        speedSlider?.addEventListener('input', (e) => {
            this.updateSpeed(e.target.value);
        });
        
        loopCheckbox?.addEventListener('change', (e) => {
            this.updateLoopMode(e.target.checked);
        });
    }

    updateSpeed(speed) {
        this.state.speed = parseInt(speed);
        const display = document.getElementById('speedValue');
        if (display) {
            display.textContent = speed;
        }
    }

    updateLoopMode(enabled) {
        this.state.loopMode = enabled;
    }

    setDataSource(dataInfo) {
        this.state.currentData = dataInfo;
        this.updateDataSourceDisplay(dataInfo);
        this.updatePlayButton(!!dataInfo);
        
        if (this.onDataSourceChange) {
            this.onDataSourceChange(dataInfo);
        }
    }

    updateDataSourceDisplay(dataInfo) {
        const display = document.getElementById('dataSourceDisplay');
        const sourceText = display?.querySelector('.source-text');
        const sourceDetails = document.getElementById('sourceDetails');
        
        if (dataInfo && sourceText && sourceDetails) {
            if (dataInfo.filename) {
                // File-based data
                sourceText.textContent = `File: ${dataInfo.filename}`;
                sourceDetails.textContent = `${dataInfo.size || 'Unknown size'}`;
            } else {
                // Generated data
                sourceText.textContent = `Generated dataset ready`;
                sourceDetails.textContent = `${dataInfo.symbols.length} symbols, ${dataInfo.totalMessages} messages, ${dataInfo.outputFormat.toUpperCase()} format`;
            }
        } else if (sourceText && sourceDetails) {
            sourceText.textContent = this.showFileSelector ? 'Select a file...' : 'No data source available';
            sourceDetails.textContent = '';
        }
    }

    updatePlayButton(enabled) {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.disabled = !enabled;
        }
    }

    play() {
        if (!this.state.currentData) {
            alert('No data source selected');
            return;
        }

        this.state.isPlaying = true;
        this.state.isPaused = false;
        
        this.updateTransportButtons();
        this.updateProgressText('Playing data...');
        
        this.startProgress();
        this.emitEvent('playback.started', this.state.currentData);
    }

    pause() {
        this.state.isPaused = true;
        this.state.isPlaying = false;
        
        this.updateTransportButtons();
        this.updateProgressText('Paused');
        
        this.stopProgress();
    }

    stop() {
        this.state.isPlaying = false;
        this.state.isPaused = false;
        this.state.progress = 0;
        
        this.updateTransportButtons();
        this.updateProgressText('Ready');
        this.updateProgressBar(0);
        
        this.stopProgress();
    }

    updateTransportButtons() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (playBtn) playBtn.disabled = this.state.isPlaying || !this.state.currentData;
        if (pauseBtn) pauseBtn.disabled = !this.state.isPlaying;
        if (stopBtn) stopBtn.disabled = !this.state.isPlaying && !this.state.isPaused;
    }

    updateProgressText(text) {
        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.textContent = text;
        }
    }

    updateProgressBar(percentage) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    startProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.progressInterval = setInterval(() => {
            this.state.progress += (2 * this.state.speed);
            this.updateProgressBar(this.state.progress);
            
            if (this.state.progress >= 100) {
                if (this.state.loopMode) {
                    this.state.progress = 0;
                    this.updateProgressText('Looping...');
                } else {
                    this.stop();
                }
            }
        }, 100);
    }

    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    updateUI() {
        this.updateTransportButtons();
        this.updateProgressText('Ready');
        this.updateProgressBar(0);
    }

    // Get current playback state
    getState() {
        return {
            ...this.state,
            timestamp: new Date().toISOString()
        };
    }

    // Set callback for playback events
    setEventCallback(callback) {
        this.onEvent = callback;
    }

    // Emit events to parent
    emitEvent(event, data) {
        if (this.onEvent) {
            this.onEvent(event, data);
        }
    }
}

// Mock file system for development
export class MockFileSystem {
    static getGeneratedFiles() {
        return [
            {
                name: 'AAPL_20250125_10k.csv',
                size: '2.3MB',
                symbols: ['AAPL'],
                messages: 10000,
                format: 'csv',
                timestamp: '2025-01-25T10:30:00Z'
            },
            {
                name: 'MSFT_GOOGL_15k.csv', 
                size: '3.1MB',
                symbols: ['MSFT', 'GOOGL'],
                messages: 15000,
                format: 'csv',
                timestamp: '2025-01-25T11:15:00Z'
            },
            {
                name: 'SPY_QQQ_25k.bin',
                size: '4.7MB', 
                symbols: ['SPY', 'QQQ'],
                messages: 25000,
                format: 'nsdq',
                timestamp: '2025-01-25T12:00:00Z'
            }
        ];
    }

    static refreshFiles() {
        // Simulate file system refresh
        return this.getGeneratedFiles();
    }
}

// File Wrapper - Adds File Selection UI
export class PlaybackWithFileSelector extends PlaybackCore {
    constructor() {
        super({ showFileSelector: true });
        this.availableFiles = [];
    }

    init() {
        super.init();
        this.createFileSelector();
        this.refreshFiles();
    }

    createFileSelector() {
        const container = document.getElementById('playbackFileContainer');
        if (!container) return;

        const selectorHTML = `
            <div class="file-selection">
                <label class="field-label">Generated Data Files</label>
                <div class="file-input-group">
                    <select id="playbackFileSelect" class="form-input">
                        <option value="">Select a file...</option>
                    </select>
                    <button class="btn btn-secondary" onclick="playbackInstance.refreshFiles()">Refresh</button>
                    <button class="btn btn-secondary" onclick="playbackInstance.openFile()">Browse...</button>
                </div>
            </div>
        `;
        
        container.innerHTML = selectorHTML;
        
        const select = document.getElementById('playbackFileSelect');
        select.addEventListener('change', (e) => {
            this.selectFile(e.target.value);
        });
    }

    refreshFiles() {
        this.availableFiles = MockFileSystem.getGeneratedFiles();
        this.updateFileList();
    }

    updateFileList() {
        const select = document.getElementById('playbackFileSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Select a file...</option>';
        
        this.availableFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = `${file.name} (${file.size})`;
            select.appendChild(option);
        });
    }

    selectFile(filename) {
        const file = this.availableFiles.find(f => f.name === filename);
        if (file) {
            const dataInfo = {
                filename: file.name,
                size: file.size,
                symbols: file.symbols,
                totalMessages: file.messages,
                outputFormat: file.format
            };
            this.setDataSource(dataInfo);
        } else {
            this.setDataSource(null);
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.bin,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const dataInfo = {
                    filename: file.name,
                    size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
                    symbols: ['Unknown'],
                    totalMessages: 'Unknown',
                    outputFormat: file.name.split('.').pop()
                };
                this.setDataSource(dataInfo);
            }
        };
        input.click();
    }
}

// Integrated Trading System - Playback + Algorithm + Matching Engine
export class TradingSystemController extends PlaybackCore {
    constructor() {
        super({ showFileSelector: false });
        this.algorithm = new ClientAlgorithm();
        this.matchingEngine = new MatchingEngine();
    }

    init() {
        super.init();
        this.algorithm.init();
        this.matchingEngine.init();
        this.connectComponents();
    }

    connectComponents() {
        // Playback → Algorithm
        this.setEventCallback((event, data) => {
            if (event === 'playback.tick') {
                this.algorithm.processMarketData(data);
            }
        });

        // Algorithm → Matching Engine
        this.algorithm.setOrderCallback((order) => {
            this.matchingEngine.submitOrder(order);
        });

        // Matching Engine → UI Updates
        this.matchingEngine.setFillCallback((fill) => {
            this.updateTradingDisplay(fill);
        });
    }

    updateTradingDisplay(fill) {
        // Update P&L, positions, etc.
    }
}

// Placeholder classes for future implementation
class ClientAlgorithm {
    init() {}
    processMarketData(data) {}
    setOrderCallback(callback) { this.onOrder = callback; }
}

class MatchingEngine {
    init() {}
    submitOrder(order) {}
    setFillCallback(callback) { this.onFill = callback; }
}

// Global instances for HTML onclick handlers
let playbackInstance;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Default to core playback, can be overridden
        playbackInstance = new PlaybackCore();
        playbackInstance.init();
    });
} else {
    playbackInstance = new PlaybackCore();
    playbackInstance.init();
}

export default PlaybackCore;