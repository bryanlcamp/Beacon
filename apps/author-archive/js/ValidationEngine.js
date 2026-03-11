// ValidationEngine.js
// Provides validation utilities for Dataset Generator App

const INVALID_SYMBOL_CHARS = /[^A-Za-z0-9_.-]/;

class ValidationEngine {
  /**
   * Validate a field based on rules
   * @param {Object} rules - Validation rules
   * @param {*} value - Value to validate
   * @param {Object} [context] - Optional context for cross-field validation
   * @returns {boolean}
   */
  validate(rules, value, context = {}) {
    if (!rules) return true;
    // Numeric message count > 1
    if (rules.type === 'messageCount') {
      if (typeof value !== 'number' || isNaN(value) || value < 2) return false;
    }
    // Symbol uniqueness
    if (rules.type === 'symbol') {
      if (!value || typeof value !== 'string') return false;
      if (INVALID_SYMBOL_CHARS.test(value)) return false;
      if (context.symbols && context.symbols.includes(value)) return false;
    }
    // Exchange selection
    if (rules.type === 'exchange') {
      if (context.selectedSymbol && context.selectedExchange !== rules.exchange) return false;
    }
    // Required field
    if (rules.required && (value === undefined || value === null || value === '')) return false;
    // Min value
    if (rules.min !== undefined && value < rules.min) return false;
    // Max value
    if (rules.max !== undefined && value > rules.max) return false;
    // Pattern
    if (rules.pattern && !rules.pattern.test(value)) return false;
    // Custom validator
    if (typeof rules.custom === 'function' && !rules.custom(value, context)) return false;
    return true;
  }

  /**
   * Check if generate button should be enabled
   * @param {Object} state - App state
   * @returns {boolean}
   */
  canGenerate(state) {
    // Must have at least one symbol
    if (!state.symbols || state.symbols.length === 0) return false;
    // Message count must be > 1
    if (typeof state.messageCount !== 'number' || state.messageCount < 2) return false;
    return true;
  }
}

export default new ValidationEngine();
