/**
 * @fileoverview Professional event system for component communication
 * Provides type-safe event handling with proper error management
 */

/**
 * Professional event emitter for component communication
 * Provides a clean pub/sub system for decoupled architecture
 */
export class EventEmitter {
    constructor() {
        /** @private @type {Map<string, Function[]>} */
        this.listeners = new Map();
        
        /** @private @type {boolean} */
        this.debugMode = false;
    }

    /**
     * Enable debug logging for event system
     * @param {boolean} enabled - Whether to enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }
        
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        if (this.debugMode) {
            console.log(`📡 EventEmitter: Subscribed to "${event}"`);
        }

        // Return unsubscribe function for convenience
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler function to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) {
            return;
        }

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        
        if (index > -1) {
            callbacks.splice(index, 1);
            
            // Clean up empty listener arrays
            if (callbacks.length === 0) {
                this.listeners.delete(event);
            }
            
            if (this.debugMode) {
                console.log(`📡 EventEmitter: Unsubscribed from "${event}"`);
            }
        }
    }

    /**
     * Subscribe to an event that will only fire once
     * @param {string} event - Event name
     * @param {Function} callback - Event handler function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            callback(...args);
        };
        
        return this.on(event, onceWrapper);
    }

    /**
     * Emit an event to all subscribers
     * @param {string} event - Event name
     * @param {...any} args - Arguments to pass to event handlers
     */
    emit(event, ...args) {
        if (!this.listeners.has(event)) {
            if (this.debugMode) {
                console.log(`📡 EventEmitter: No listeners for "${event}"`);
            }
            return;
        }

        const callbacks = this.listeners.get(event);
        
        if (this.debugMode) {
            console.log(`📡 EventEmitter: Emitting "${event}" to ${callbacks.length} listeners`);
        }

        // Execute callbacks with proper error handling
        callbacks.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`❌ Error in event listener for "${event}":`, error);
                
                // Emit error event for global error handling
                if (event !== 'error') {
                    this.emit('error', {
                        originalEvent: event,
                        error,
                        callback
                    });
                }
            }
        });
    }

    /**
     * Get all event names that have listeners
     * @returns {string[]} Array of event names
     */
    getEventNames() {
        return Array.from(this.listeners.keys());
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const callbacks = this.listeners.get(event);
        return callbacks ? callbacks.length : 0;
    }

    /**
     * Remove all listeners for all events
     */
    removeAllListeners() {
        const eventNames = this.getEventNames();
        this.listeners.clear();
        
        if (this.debugMode) {
            console.log(`📡 EventEmitter: Removed all listeners for events: ${eventNames.join(', ')}`);
        }
    }

    /**
     * Create a namespaced event emitter
     * Useful for component-specific events
     * @param {string} namespace - Namespace prefix
     * @returns {EventEmitter} Namespaced event emitter
     */
    namespace(namespace) {
        const namespacedEmitter = {
            on: (event, callback) => this.on(`${namespace}:${event}`, callback),
            off: (event, callback) => this.off(`${namespace}:${event}`, callback),
            once: (event, callback) => this.once(`${namespace}:${event}`, callback),
            emit: (event, ...args) => this.emit(`${namespace}:${event}`, ...args)
        };
        
        return namespacedEmitter;
    }
}
