/**
 * Dataset Generator - Event Emitter
 * Lightweight event system for component communication
 */

export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @param {object} options - Options (once, priority)
   * @returns {function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listener = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
      id: Symbol('listener')
    };

    const listeners = this.events.get(event);
    
    // Insert based on priority (higher priority first)
    let insertIndex = listeners.findIndex(l => l.priority < listener.priority);
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }

    // Return unsubscribe function
    return () => this.off(event, listener.id);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {symbol|function} identifier - Listener ID or callback function
   */
  off(event, identifier) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    
    if (typeof identifier === 'symbol') {
      // Remove by ID
      const index = listeners.findIndex(l => l.id === identifier);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    } else if (typeof identifier === 'function') {
      // Remove by callback function
      const index = listeners.findIndex(l => l.callback === identifier);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }

    // Clean up empty event arrays
    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @returns {boolean} True if event had listeners
   */
  emit(event, data) {
    if (!this.events.has(event)) return false;

    const listeners = this.events.get(event);
    const listenersToRemove = [];

    // Call all listeners
    for (const listener of listeners) {
      try {
        listener.callback(data, event);
        
        // Mark for removal if it's a once listener
        if (listener.once) {
          listenersToRemove.push(listener.id);
        }
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }

    // Remove once listeners
    listenersToRemove.forEach(id => this.off(event, id));

    return true;
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Specific event to clear, or all if omitted
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * Get all event names
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Create a promise that resolves when an event is emitted
   * @param {string} event - Event name
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that resolves with event data
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Timeout waiting for event '${event}'`));
      }, timeout);

      const listener = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(event, listener);
    });
  }

  /**
   * Create a new event emitter that forwards events to this one
   * @param {string} prefix - Prefix for forwarded events
   * @returns {EventEmitter} New event emitter
   */
  createProxy(prefix) {
    const proxy = new EventEmitter();
    
    // Forward all events with prefix
    proxy.onAny = (event, data) => {
      this.emit(`${prefix}:${event}`, data);
    };

    return proxy;
  }
}

/**
 * Global event bus for cross-component communication
 */
export const globalEventBus = new EventEmitter();