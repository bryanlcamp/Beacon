/**
 * @fileoverview Base component class for professional UI components
 * Provides lifecycle management, event handling, and state management
 */

import { EventEmitter } from './EventEmitter.js';

/**
 * Base component class for all UI components
 * Provides professional lifecycle management and state handling
 */
export class Component extends EventEmitter {
    /**
     * @param {Object} options - Component configuration
     * @param {HTMLElement} [options.element] - DOM element to attach to
     * @param {Object} [options.initialState] - Initial component state
     * @param {string} [options.componentName] - Component name for debugging
     */
    constructor(options = {}) {
        super();
        
        /** @type {string} */
        this.componentName = options.componentName || this.constructor.name;
        
        /** @type {HTMLElement|null} */
        this.element = options.element || null;
        
        /** @type {Object} */
        this.state = { ...options.initialState } || {};
        
        /** @type {boolean} */
        this.isInitialized = false;
        
        /** @type {boolean} */
        this.isDestroyed = false;
        
        /** @type {AbortController} */
        this.abortController = new AbortController();
        
        // Set up debug mode if enabled globally
        if (window.beaconApp?.config?.debugMode) {
            this.setDebugMode(true);
        }
        
        // Bind methods to maintain 'this' context
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the component
     * Must be implemented by subclasses
     * @abstract
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isDestroyed) {
            throw new Error(`Cannot initialize destroyed component: ${this.componentName}`);
        }
        
        if (this.isInitialized) {
            console.warn(`Component ${this.componentName} is already initialized`);
            return;
        }

        this.emit('beforeInit');
        
        // Set up global event listeners with cleanup support
        this.setupGlobalEventListeners();
        
        this.isInitialized = true;
        this.emit('init');
        
        console.log(`✅ Component ${this.componentName} initialized`);
    }

    /**
     * Render the component
     * Must be implemented by subclasses
     * @abstract
     * @returns {HTMLElement}
     */
    render() {
        throw new Error(`Component ${this.componentName} must implement render() method`);
    }

    /**
     * Update component state with change detection
     * @param {Object|Function} updates - State updates or updater function
     * @returns {boolean} Whether state actually changed
     */
    setState(updates) {
        if (this.isDestroyed) {
            console.warn(`Cannot update state of destroyed component: ${this.componentName}`);
            return false;
        }

        const prevState = { ...this.state };
        
        if (typeof updates === 'function') {
            this.state = { ...this.state, ...updates(this.state) };
        } else {
            this.state = { ...this.state, ...updates };
        }

        // Check if state actually changed
        const hasChanged = JSON.stringify(prevState) !== JSON.stringify(this.state);
        
        if (hasChanged) {
            this.emit('stateChange', {
                previousState: prevState,
                currentState: this.state,
                updates
            });
            
            // Trigger re-render if component supports it
            if (typeof this.onStateChange === 'function') {
                this.onStateChange(prevState, this.state);
            }
        }

        return hasChanged;
    }

    /**
     * Get current component state
     * @returns {Object} Current state (immutable copy)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Set up global event listeners with automatic cleanup
     * @private
     */
    setupGlobalEventListeners() {
        const signal = this.abortController.signal;
        
        // Window resize handling
        window.addEventListener('resize', this.handleResize, { signal });
        
        // Visibility change handling (for performance optimization)
        document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });
        
        // Global error handling for this component
        window.addEventListener('error', (event) => {
            this.emit('globalError', event);
        }, { signal });
    }

    /**
     * Handle window resize
     * @protected
     * @param {Event} event - Resize event
     */
    handleResize(event) {
        this.emit('resize', event);
    }

    /**
     * Handle visibility change (page focus/blur)
     * @protected
     * @param {Event} event - Visibility change event
     */
    handleVisibilityChange(event) {
        const isVisible = !document.hidden;
        this.emit('visibilityChange', { isVisible, event });
        
        // Pause/resume component based on visibility for performance
        if (isVisible && typeof this.onResume === 'function') {
            this.onResume();
        } else if (!isVisible && typeof this.onPause === 'function') {
            this.onPause();
        }
    }

    /**
     * Add event listener to component's DOM element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} [options] - Event options
     */
    addEventListener(event, handler, options = {}) {
        if (!this.element) {
            console.warn(`Cannot add event listener: ${this.componentName} has no DOM element`);
            return;
        }

        // Add signal for automatic cleanup
        const listenerOptions = {
            ...options,
            signal: this.abortController.signal
        };

        this.element.addEventListener(event, handler, listenerOptions);
    }

    /**
     * Find element within component
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} Found element
     */
    querySelector(selector) {
        if (!this.element) {
            return null;
        }
        return this.element.querySelector(selector);
    }

    /**
     * Find all elements within component
     * @param {string} selector - CSS selector
     * @returns {NodeList} Found elements
     */
    querySelectorAll(selector) {
        if (!this.element) {
            return [];
        }
        return this.element.querySelectorAll(selector);
    }

    /**
     * Show component
     */
    show() {
        if (this.element) {
            this.element.style.display = '';
            this.element.setAttribute('aria-hidden', 'false');
        }
        this.emit('show');
    }

    /**
     * Hide component
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.element.setAttribute('aria-hidden', 'true');
        }
        this.emit('hide');
    }

    /**
     * Destroy the component with proper cleanup
     */
    destroy() {
        if (this.isDestroyed) {
            return;
        }

        this.emit('beforeDestroy');

        // Cancel all ongoing operations
        this.abortController.abort();
        
        // Remove DOM element
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        // Clear all event listeners
        this.removeAllListeners();
        
        // Clear state
        this.state = {};
        
        // Mark as destroyed
        this.isDestroyed = true;
        this.isInitialized = false;
        
        this.emit('destroy');
        
        console.log(`🧹 Component ${this.componentName} destroyed`);
    }

    /**
     * Check if component is in a valid state for operations
     * @returns {boolean} Whether component is ready
     */
    isReady() {
        return this.isInitialized && !this.isDestroyed && this.element !== null;
    }

    /**
     * Get component information for debugging
     * @returns {Object} Component debug info
     */
    getDebugInfo() {
        return {
            componentName: this.componentName,
            isInitialized: this.isInitialized,
            isDestroyed: this.isDestroyed,
            hasElement: !!this.element,
            state: this.getState(),
            eventNames: this.getEventNames(),
            listenerCounts: this.getEventNames().reduce((counts, event) => {
                counts[event] = this.listenerCount(event);
                return counts;
            }, {})
        };
    }
}
