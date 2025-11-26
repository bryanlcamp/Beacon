/**
 * Beacon Application State Management
 * Immutable state with observables for reactive UI updates
 * Zero dependencies, pure JavaScript architecture
 */

export class ApplicationState {
    constructor(initialState = {}) {
        this._state = Object.freeze({ ...initialState });
        this._observers = new Set();
        this._middleware = [];
    }

    /**
     * Get current state (immutable)
     */
    getState() {
        return this._state;
    }

    /**
     * Update state (creates new immutable state)
     */
    setState(updates) {
        const previousState = this._state;
        
        // Apply middleware (for logging, validation, etc.)
        let processedUpdates = updates;
        for (const middleware of this._middleware) {
            processedUpdates = middleware(previousState, processedUpdates);
        }
        
        // Create new immutable state
        const newState = Object.freeze({
            ...previousState,
            ...processedUpdates,
            _lastUpdated: Date.now()
        });
        
        // Only update if state actually changed
        if (this._hasStateChanged(previousState, newState)) {
            this._state = newState;
            this._notifyObservers(previousState, newState);
        }
        
        return this._state;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(observer) {
        this._observers.add(observer);
        
        // Return unsubscribe function
        return () => {
            this._observers.delete(observer);
        };
    }

    /**
     * Add middleware for state updates
     */
    use(middleware) {
        this._middleware.push(middleware);
    }

    /**
     * Check if state has actually changed
     */
    _hasStateChanged(prev, next) {
        if (prev === next) return false;
        
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        
        if (prevKeys.length !== nextKeys.length) return true;
        
        for (const key of prevKeys) {
            if (prev[key] !== next[key]) return true;
        }
        
        return false;
    }

    /**
     * Notify all observers of state change
     */
    _notifyObservers(previousState, newState) {
        for (const observer of this._observers) {
            try {
                observer(newState, previousState);
            } catch (error) {
                console.error('Observer error:', error);
            }
        }
    }
}

/**
 * Validation middleware - validates state before updates
 */
export function createValidationMiddleware(validators) {
    return (previousState, updates) => {
        const newState = { ...previousState, ...updates };
        
        for (const [field, validator] of Object.entries(validators)) {
            if (field in newState) {
                const result = validator(newState[field], newState);
                if (result !== true) {
                    throw new Error(`Validation failed for ${field}: ${result}`);
                }
            }
        }
        
        return updates;
    };
}

/**
 * Logging middleware - logs all state changes
 */
export function createLoggingMiddleware(options = {}) {
    const { enabled = true, logLevel = 'info' } = options;
    
    return (previousState, updates) => {
        if (enabled && console[logLevel]) {
            console[logLevel]('State Update:', {
                previous: previousState,
                updates: updates,
                timestamp: new Date().toISOString()
            });
        }
        return updates;
    };
}