/**
 * Dataset Generator - Validation Engine
 * Centralized validation logic with detailed error reporting
 */

import { CONSTANTS, UTILS } from './Constants.js';
import { EventEmitter } from './EventEmitter.js';

export class ValidationEngine extends EventEmitter {
  constructor() {
    super();
    this.rules = new Map();
    this.registerDefaultRules();
  }

  /**
   * Register default validation rules
   * @private
   */
  registerDefaultRules() {
    // Message Count Validation
    this.addRule('messageCount', {
      required: true,
      type: 'number',
      min: CONSTANTS.MESSAGE_COUNT.MIN,
      max: CONSTANTS.MESSAGE_COUNT.MAX,
      message: 'Message count must be a positive number'
    });

    // Symbol Validation
    this.addRule('symbol', {
      required: true,
      type: 'string',
      pattern: CONSTANTS.SYMBOL_INPUT.PATTERN,
      maxLength: CONSTANTS.SYMBOL_INPUT.MAX_LENGTH,
      transform: value => value.toUpperCase().trim(),
      message: 'Symbol must contain only letters, numbers, and hyphens'
    });

    // Exchange Validation
    this.addRule('exchange', {
      required: true,
      type: 'string',
      enum: Object.values(CONSTANTS.EXCHANGES),
      message: 'Please select a valid exchange'
    });

    // Percentage Validation
    this.addRule('percentage', {
      required: true,
      type: 'number',
      min: CONSTANTS.PERCENTAGE.MIN,
      max: CONSTANTS.PERCENTAGE.MAX,
      precision: CONSTANTS.PERCENTAGE.PRECISION,
      message: 'Percentage must be between 1% and 100%'
    });

    // Price Range Validation
    this.addRule('priceRange', {
      type: 'object',
      properties: {
        min: {
          type: 'number',
          min: CONSTANTS.DATACARD_PARAMS.PRICE_RANGE.MIN,
          max: CONSTANTS.DATACARD_PARAMS.PRICE_RANGE.MAX
        },
        max: {
          type: 'number',
          min: CONSTANTS.DATACARD_PARAMS.PRICE_RANGE.MIN,
          max: CONSTANTS.DATACARD_PARAMS.PRICE_RANGE.MAX
        }
      },
      custom: (value) => {
        if (value.min >= value.max) {
          return 'Minimum price must be less than maximum price';
        }
        return null;
      }
    });

    // Quantity Range Validation
    this.addRule('quantityRange', {
      type: 'object',
      properties: {
        min: {
          type: 'number',
          min: CONSTANTS.DATACARD_PARAMS.QUANTITY_RANGE.MIN,
          max: CONSTANTS.DATACARD_PARAMS.QUANTITY_RANGE.MAX
        },
        max: {
          type: 'number',
          min: CONSTANTS.DATACARD_PARAMS.QUANTITY_RANGE.MIN,
          max: CONSTANTS.DATACARD_PARAMS.QUANTITY_RANGE.MAX
        }
      },
      custom: (value) => {
        if (value.min >= value.max) {
          return 'Minimum quantity must be less than maximum quantity';
        }
        return null;
      }
    });
  }

  /**
   * Add a validation rule
   * @param {string} field - Field name
   * @param {object} rule - Validation rule
   */
  addRule(field, rule) {
    this.rules.set(field, rule);
  }

  /**
   * Validate a single field
   * @param {string} field - Field name
   * @param {*} value - Value to validate
   * @param {object} context - Additional context for validation
   * @returns {object} Validation result
   */
  validateField(field, value, context = {}) {
    const rule = this.rules.get(field);
    if (!rule) {
      return { isValid: true, value };
    }

    const result = {
      field,
      isValid: true,
      value,
      errors: [],
      warnings: []
    };

    try {
      // Transform value if transformer provided
      if (rule.transform && typeof rule.transform === 'function') {
        result.value = rule.transform(value);
        value = result.value;
      }

      // Required check
      if (rule.required && this.isEmpty(value)) {
        result.isValid = false;
        result.errors.push(rule.message || `${field} is required`);
        return result;
      }

      // Skip further validation if empty and not required
      if (this.isEmpty(value) && !rule.required) {
        return result;
      }

      // Type validation
      if (rule.type && !this.validateType(value, rule.type)) {
        result.isValid = false;
        result.errors.push(`${field} must be of type ${rule.type}`);
        return result;
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        result.isValid = false;
        result.errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        result.isValid = false;
        result.errors.push(rule.message || `${field} format is invalid`);
      }

      // Length validations
      if (rule.minLength && value.length < rule.minLength) {
        result.isValid = false;
        result.errors.push(`${field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        result.isValid = false;
        result.errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }

      // Numeric validations
      if (rule.min !== undefined && value < rule.min) {
        result.isValid = false;
        result.errors.push(`${field} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        result.isValid = false;
        result.errors.push(`${field} must be no more than ${rule.max}`);
      }

      // Precision validation
      if (rule.precision !== undefined) {
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > rule.precision) {
          result.warnings.push(`${field} will be rounded to ${rule.precision} decimal places`);
          result.value = parseFloat(value.toFixed(rule.precision));
        }
      }

      // Object property validation
      if (rule.type === 'object' && rule.properties) {
        for (const [prop, propRule] of Object.entries(rule.properties)) {
          if (value[prop] !== undefined) {
            const propResult = this.validateField(prop, value[prop], context);
            if (!propResult.isValid) {
              result.isValid = false;
              result.errors.push(...propResult.errors);
            }
            result.warnings.push(...propResult.warnings);
          }
        }
      }

      // Custom validation
      if (rule.custom && typeof rule.custom === 'function') {
        const customResult = rule.custom(value, context);
        if (customResult) {
          result.isValid = false;
          result.errors.push(customResult);
        }
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error.message}`);
    }

    // Emit validation events
    this.emit(CONSTANTS.EVENTS.VALIDATION_SUCCESS, result);
    if (!result.isValid) {
      this.emit(CONSTANTS.EVENTS.VALIDATION_ERROR, result);
    }

    return result;
  }

  /**
   * Validate multiple fields
   * @param {object} data - Data object to validate
   * @param {string[]} fields - Fields to validate
   * @param {object} context - Additional context
   * @returns {object} Complete validation result
   */
  validate(data, fields = null, context = {}) {
    const fieldsToValidate = fields || Array.from(this.rules.keys());
    const results = {};
    let isValid = true;
    const allErrors = [];
    const allWarnings = [];

    for (const field of fieldsToValidate) {
      const value = this.getNestedValue(data, field);
      const result = this.validateField(field, value, { ...context, data });
      
      results[field] = result;
      
      if (!result.isValid) {
        isValid = false;
        allErrors.push(...result.errors);
      }
      
      allWarnings.push(...result.warnings);
    }

    return {
      isValid,
      results,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validate symbol uniqueness
   * @param {string} symbol - Symbol to validate
   * @param {string[]} existingSymbols - Array of existing symbols
   * @returns {object} Validation result
   */
  validateSymbolUniqueness(symbol, existingSymbols) {
    const isUnique = !existingSymbols.some(existing => 
      existing.toUpperCase() === symbol.toUpperCase()
    );

    return {
      isValid: isUnique,
      field: 'symbol',
      value: symbol,
      errors: isUnique ? [] : [CONSTANTS.ERROR_MESSAGES.SYMBOL_EXISTS],
      warnings: []
    };
  }

  /**
   * Validate percentage allocation totals
   * @param {number[]} percentages - Array of percentage values
   * @returns {object} Validation result
   */
  validateAllocationTotals(percentages) {
    const total = percentages.reduce((sum, pct) => sum + pct, 0);
    const isValid = Math.abs(total - 100) < 0.1; // Allow small floating point errors

    return {
      isValid,
      field: 'allocation',
      value: total,
      errors: isValid ? [] : [CONSTANTS.ERROR_MESSAGES.ALLOCATION_INVALID],
      warnings: [],
      total
    };
  }

  /**
   * Check if value is empty
   * @private
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  /**
   * Validate type
   * @private
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean} True if type matches
   */
  validateType(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Get nested object value
   * @private
   * @param {object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}