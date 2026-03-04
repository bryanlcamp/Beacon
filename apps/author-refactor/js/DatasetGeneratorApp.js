/**
 * Dataset Generator Application
 * Main application controller that orchestrates all components
 */

import { CONSTANTS, UTILS } from './core/Constants.js';
import { EventEmitter } from './core/EventEmitter.js';
import { ValidationEngine } from './core/ValidationEngine.js';

// Managers
import { ConfigManager } from './managers/ConfigManager.js';
import { SymbolManager } from './managers/SymbolManager.js';

// Components
import { FormControls } from './components/FormControls.js';
import { NotificationSystem } from './components/NotificationSystem.js';

/**
 * Main Dataset Generator Application
 */
export class DatasetGeneratorApp extends EventEmitter {
  constructor() {
    super();
    
    // Application state
    this.isInitialized = false;
    this.isDemoMode = UTILS.isDemoMode();
    this.appVersion = CONSTANTS.VERSION;
    
    // Component instances
    this.configManager = new ConfigManager();
    this.symbolManager = new SymbolManager();
    this.formControls = new FormControls();
    this.notificationSystem = new NotificationSystem();
    
    // Initialization tracking
    this.initializationSteps = [];
    this.readyComponents = new Set();
    
    console.log(`🚀 Dataset Generator App v${this.appVersion} ${this.isDemoMode ? '(Demo Mode)' : ''}`);
  }

  /**
   * Initialize the application
   */
  async initialize() {
    console.log('🔧 Initializing Dataset Generator Application...');
    
    try {
      // Setup global error handling
      this.setupGlobalErrorHandling();
      
      // Initialize notification system first
      this.notificationSystem.initialize();
      
      // Setup component communication
      this.setupComponentCommunication();
      
      // Initialize all components
      await this.initializeComponents();
      
      // Setup application-level event handlers
      this.setupApplicationEvents();
      
      // Bind DOM events
      this.bindDOMEvents();
      
      // Final initialization
      this.finalizeInitialization();
      
      console.log('✅ Dataset Generator Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Initialize all components in sequence
   * @private
   */
  async initializeComponents() {
    const components = [
      { name: 'FormControls', instance: this.formControls },
      { name: 'ConfigManager', instance: this.configManager },
      { name: 'SymbolManager', instance: this.symbolManager }
    ];

    for (const component of components) {
      try {
        console.log(`Initializing ${component.name}...`);
        await component.instance.initialize();
        this.readyComponents.add(component.name);
      } catch (error) {
        console.error(`Failed to initialize ${component.name}:`, error);
        throw new Error(`${component.name} initialization failed: ${error.message}`);
      }
    }
  }

  /**
   * Setup communication between components
   * @private
   */
  setupComponentCommunication() {
    // Forward events from components to application
    const components = [
      this.configManager,
      this.symbolManager,
      this.formControls,
      this.notificationSystem
    ];

    components.forEach(component => {
      // Only call onAny if it exists
      if (typeof component.onAny === 'function') {
        component.onAny((eventName, ...args) => {
          this.emit(eventName, ...args);
        });
      }
        // Listen for component ready events
        if (typeof component.on === 'function') {
          component.on(CONSTANTS.EVENTS.APP_READY, (data) => {
            this.readyComponents.add(data.component);
            this.checkAllComponentsReady();
          });
        }
      });

    // Setup cross-component communication
    this.setupCrossComponentEvents();
  }

  /**
   * Setup cross-component event handlers
   * @private
   */
  setupCrossComponentEvents() {
    // Forward form control methods to symbol manager
    this.formControls.getSymbolCount = () => this.symbolManager.getSymbolCount();
    this.formControls.getTotalPercentage = () => this.symbolManager.getTotalPercentage();
    this.formControls.getSymbolData = () => this.symbolManager.getAllSymbolData();

    // Forward symbol events to form controls
    this.symbolManager.on(CONSTANTS.EVENTS.SYMBOL_ADDED, () => {
      this.formControls.updateGenerateButtonState();
    });

    this.symbolManager.on(CONSTANTS.EVENTS.SYMBOL_REMOVED, () => {
      this.formControls.updateGenerateButtonState();
    });

    this.symbolManager.on(CONSTANTS.EVENTS.SYMBOLS_CLEARED, () => {
      this.formControls.updateGenerateButtonState();
    });

    // Configuration change events
    this.symbolManager.on('config:modified', () => {
      this.configManager.markAsModified();
    });

    this.formControls.on('config:modified', () => {
      this.configManager.markAsModified();
    });

    // Generation events
    this.formControls.on(CONSTANTS.EVENTS.GENERATION_STARTED, (params) => {
      this.handleGenerationStarted(params);
    });

    this.formControls.on(CONSTANTS.EVENTS.GENERATION_PROGRESS, (data) => {
      this.handleGenerationProgress(data);
    });

    this.formControls.on(CONSTANTS.EVENTS.GENERATION_COMPLETED, (data) => {
      this.handleGenerationCompleted(data);
    });
  }

  /**
   * Setup application-level event handlers
   * @private
   */
  setupApplicationEvents() {
    // Handle window events
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppHidden();
      } else {
        this.handleAppVisible();
      }
    });
  }

  /**
   * Bind DOM event handlers
   * @private
   */
  bindDOMEvents() {
    // Handle demo mode banner (if present)
    if (this.isDemoMode) {
      this.showDemoModeBanner();
    }

    // Handle panel resizing (if needed)
    this.setupPanelResize();

    // Handle help system
    this.setupHelpSystem();
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + S: Save configuration
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.configManager.showSaveDialog();
    }

    // Ctrl/Cmd + O: Load configuration
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
      event.preventDefault();
      this.configManager.showLoadDialog();
    }

    // Ctrl/Cmd + N: New configuration
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      this.configManager.createNewConfig();
    }

    // Ctrl/Cmd + Enter: Generate dataset
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      const generateBtn = document.getElementById('generateDataset');
      if (generateBtn && !generateBtn.disabled) {
        this.formControls.handleGenerateDataset();
      }
    }

    // Delete: Clear all symbols (when no input focused)
    if (event.key === 'Delete' && !event.target.matches('input, textarea, select')) {
      event.preventDefault();
      this.symbolManager.clearAllSymbols();
    }

    // F1: Show help
    if (event.key === 'F1') {
      event.preventDefault();
      this.showHelp();
    }

    // Escape: Close modals/notifications
    if (event.key === 'Escape') {
      this.handleEscapeKey();
    }
  }

  /**
   * Handle generation started
   * @param {object} params - Generation parameters
   */
  handleGenerationStarted(params) {
    console.log('🔄 Generation started with parameters:', params);
    
    // Disable form controls during generation
    this.setFormEnabled(false);
    
    // Show generation status
    this.showGenerationStatus();
  }

  /**
   * Handle generation progress
   * @param {object} data - Progress data
   */
  handleGenerationProgress(data) {
    console.log(`📊 Generation progress: ${data.progress.toFixed(1)}% - ${data.message}`);
    
    // Update progress indicators
    this.updateGenerationProgress(data);
  }

  /**
   * Handle generation completed
   * @param {object} data - Completion data
   */
  handleGenerationCompleted(data) {
    console.log('✅ Generation completed:', data);
    
    // Re-enable form controls
    this.setFormEnabled(true);
    
    // Hide generation status
    this.hideGenerationStatus();
    
    if (data.success) {
      // Show download link or success message
      this.showGenerationSuccess(data);
    } else {
      // Handle generation error
      this.showGenerationError(data);
    }
  }

  /**
   * Show demo mode banner
   * @private
   */
  showDemoModeBanner() {
    let banner = document.getElementById('demoBanner');
    
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'demoBanner';
      banner.className = 'demo-banner';
      banner.innerHTML = `
        <div class="demo-content">
          <span class="demo-icon">🎭</span>
          <span class="demo-text">Demo Mode - Data and functionality are simulated</span>
          <button class="demo-close" aria-label="Close banner">&times;</button>
        </div>
      `;
      
      // Insert at top of main content
      const mainContent = document.querySelector('main') || document.body;
      mainContent.insertBefore(banner, mainContent.firstChild);
      
      // Bind close event
      const closeBtn = banner.querySelector('.demo-close');
      closeBtn.addEventListener('click', () => {
        banner.style.display = 'none';
      });
    }
  }

  /**
   * Setup panel resize functionality
   * @private
   */
  setupPanelResize() {
    const panels = document.querySelectorAll('.panel');
    
    panels.forEach(panel => {
      // Add resize handles if needed
      this.makeResizable(panel);
    });
  }

  /**
   * Make panel resizable
   * @param {HTMLElement} panel - Panel element
   * @private
   */
  makeResizable(panel) {
    // This would implement panel resizing functionality
    // For now, we'll use CSS-based responsive design
  }

  /**
   * Setup help system
   * @private
   */
  setupHelpSystem() {
    // Add help tooltips and interactive help
    const helpElements = document.querySelectorAll('[data-help]');
    
    helpElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        this.showTooltip(e.target, e.target.dataset.help);
      });
      
      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  /**
   * Show tooltip
   * @param {HTMLElement} element - Target element
   * @param {string} text - Tooltip text
   */
  showTooltip(element, text) {
    // Create tooltip element
    let tooltip = document.getElementById('appTooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'appTooltip';
      tooltip.className = 'app-tooltip';
      document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
    tooltip.style.top = `${rect.bottom + 5}px`;
    tooltip.style.transform = 'translateX(-50%)';
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    const tooltip = document.getElementById('appTooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  /**
   * Show help dialog
   */
  showHelp() {
    // Create help modal
    const helpModal = document.createElement('div');
    helpModal.className = 'modal-overlay help-modal';
    helpModal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Dataset Generator Help</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="help-content">
            <h4>Getting Started</h4>
            <ol>
              <li>Select an exchange from the dropdown</li>
              <li>Enter symbol names and click "Add Symbol" or press Enter</li>
              <li>Adjust percentages and parameters for each symbol</li>
              <li>Set the total message count</li>
              <li>Click "Generate Dataset" to create your data file</li>
            </ol>
            
            <h4>Keyboard Shortcuts</h4>
            <ul>
              <li><kbd>Ctrl/Cmd + S</kbd> - Save configuration</li>
              <li><kbd>Ctrl/Cmd + O</kbd> - Load configuration</li>
              <li><kbd>Ctrl/Cmd + N</kbd> - New configuration</li>
              <li><kbd>Ctrl/Cmd + Enter</kbd> - Generate dataset</li>
              <li><kbd>Delete</kbd> - Clear all symbols</li>
              <li><kbd>F1</kbd> - Show this help</li>
              <li><kbd>Escape</kbd> - Close dialogs</li>
            </ul>
            
            <h4>Tips</h4>
            <ul>
              <li>Symbol percentages must total 100%</li>
              <li>Use the AUTO scaling feature to distribute percentages evenly</li>
              <li>Hover over controls for additional help</li>
              <li>Configurations are automatically saved as you work</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary modal-close">Got It</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // Show modal
    setTimeout(() => helpModal.classList.add('active'), 10);
    
    // Bind close events
    const closeBtns = helpModal.querySelectorAll('.modal-close');
    const closeModal = () => {
      helpModal.classList.remove('active');
      setTimeout(() => helpModal.remove(), 300);
    };
    
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) closeModal();
    });
  }

  /**
   * Handle escape key
   */
  handleEscapeKey() {
    // Close modals
    const modals = document.querySelectorAll('.modal-overlay.active');
    modals.forEach(modal => {
      modal.querySelector('.modal-close')?.click();
    });
    
    // Clear notifications
    this.notificationSystem.clearByType('info');
  }

  /**
   * Set form controls enabled state
   * @param {boolean} enabled - Whether forms should be enabled
   */
  setFormEnabled(enabled) {
    const formElements = document.querySelectorAll('input, select, button');
    formElements.forEach(element => {
      if (enabled) {
        element.removeAttribute('disabled');
      } else {
        // Don't disable the generate button during generation (it shows status)
        if (element.id !== 'generateDataset') {
          element.setAttribute('disabled', 'disabled');
        }
      }
    });
  }

  /**
   * Show generation status overlay
   */
  showGenerationStatus() {
    let overlay = document.getElementById('generationOverlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'generationOverlay';
      overlay.className = 'generation-overlay';
      overlay.innerHTML = `
        <div class="generation-status">
          <div class="generation-spinner"></div>
          <div class="generation-message">Preparing generation...</div>
          <div class="generation-progress">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
    }
    
    overlay.classList.add('active');
  }

  /**
   * Update generation progress
   * @param {object} data - Progress data
   */
  updateGenerationProgress(data) {
    const overlay = document.getElementById('generationOverlay');
    if (!overlay) return;
    
    const messageEl = overlay.querySelector('.generation-message');
    const progressFill = overlay.querySelector('.progress-fill');
    const progressText = overlay.querySelector('.progress-text');
    
    if (messageEl) messageEl.textContent = data.message || data.step;
    if (progressFill) progressFill.style.width = `${data.progress}%`;
    if (progressText) progressText.textContent = `${Math.round(data.progress)}%`;
  }

  /**
   * Hide generation status overlay
   */
  hideGenerationStatus() {
    const overlay = document.getElementById('generationOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }

  /**
   * Show generation success message
   * @param {object} data - Success data
   */
  showGenerationSuccess(data) {
    const actions = [];
    
    if (data.result && data.result.downloadUrl) {
      actions.push({
        id: 'download',
        label: 'Download File',
        handler: () => {
          window.open(data.result.downloadUrl, '_blank');
        }
      });
    }
    
    this.notificationSystem.showNotificationWithActions(
      data.message || 'Dataset generated successfully!',
      actions,
      { type: 'success', duration: 10000 }
    );
  }

  /**
   * Show generation error message
   * @param {object} data - Error data
   */
  showGenerationError(data) {
    this.notificationSystem.showError(
      data.message || 'Dataset generation failed',
      { duration: 10000 }
    );
  }

  /**
   * Check if all components are ready
   * @private
   */
  checkAllComponentsReady() {
    const requiredComponents = ['FormControls', 'ConfigManager', 'SymbolManager', 'NotificationSystem'];
    const allReady = requiredComponents.every(comp => this.readyComponents.has(comp));
    
    if (allReady && !this.isInitialized) {
      this.finalizeInitialization();
    }
  }

  /**
   * Finalize application initialization
   * @private
   */
  finalizeInitialization() {
    this.isInitialized = true;
    
    // Show app ready state
    document.body.classList.add('app-ready');
    
    // Emit app ready event
    this.emit(CONSTANTS.EVENTS.APP_READY, {
      version: this.appVersion,
      demoMode: this.isDemoMode,
      timestamp: new Date()
    });
    
    // Show welcome message
    if (this.isDemoMode) {
      setTimeout(() => {
        this.notificationSystem.showInfo(
          'Welcome to Dataset Generator Demo! Add some symbols to get started.',
          { duration: 5000 }
        );
      }, 1000);
    }
  }

  /**
   * Handle application hidden state
   */
  handleAppHidden() {
    console.log('📱 App hidden');
    // Pause any ongoing operations if needed
  }

  /**
   * Handle application visible state
   */
  handleAppVisible() {
    console.log('📱 App visible');
    // Resume operations if needed
  }

  /**
   * Check for unsaved changes
   * @returns {boolean} Whether there are unsaved changes
   */
  hasUnsavedChanges() {
    const configInfo = this.configManager.getCurrentConfigInfo();
    return configInfo.modified || (this.symbolManager.getSymbolCount() > 0 && !configInfo.hasConfig);
  }

  /**
   * Setup global error handling
   * @private
   */
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleGlobalError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleGlobalError(event.reason);
      event.preventDefault();
    });
  }

  /**
   * Handle global application errors
   * @param {Error} error - Error object
   */
  handleGlobalError(error) {
    if (this.notificationSystem) {
      this.notificationSystem.showError(
        `Application Error: ${error.message}`,
        { duration: 10000 }
      );
    }
  }

  /**
   * Handle initialization errors
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    document.body.classList.add('app-error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h2>Application Error</h2>
        <p>Failed to initialize the Dataset Generator application:</p>
        <pre>${error.message}</pre>
        <button onclick="location.reload()" class="btn btn-primary">Reload Application</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  /**
   * Get application status
   * @returns {object} Application status
   */
  getStatus() {
    return {
      version: this.appVersion,
      initialized: this.isInitialized,
      demoMode: this.isDemoMode,
      readyComponents: Array.from(this.readyComponents),
      symbolCount: this.symbolManager ? this.symbolManager.getSymbolCount() : 0,
      hasUnsavedChanges: this.hasUnsavedChanges()
    };
  }

  /**
   * Cleanup and destroy application
   */
  destroy() {
    console.log('🧹 Destroying Dataset Generator Application...');
    
    // Clear all events
    this.removeAllListeners();
    
    // Cleanup components
    if (this.notificationSystem) {
      this.notificationSystem.clearAll();
    }
    
    // Remove global event listeners
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Clear application state
    this.isInitialized = false;
    this.readyComponents.clear();
    
    console.log('✅ Application destroyed');
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new DatasetGeneratorApp();
    await app.initialize();
    
    // Make app globally available for debugging
    window.datasetGeneratorApp = app;
    
  } catch (error) {
    console.error('Failed to start Dataset Generator Application:', error);
  }
});