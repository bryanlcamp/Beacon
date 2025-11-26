/**
 * Beacon Validation System
 * Composable, reusable validation rules with immutable state
 * Built for scalability and testability
 */

/**
 * Base validator class
 */
export class Validator {
    constructor(message = 'Validation failed') {
        this.message = message;
    }

    /**
     * Validate value - returns true if valid, error message if invalid
     */
    validate(value, context = {}) {
        throw new Error('validate() method must be implemented by subclass');
    }

    /**
     * Combine with other validators using AND logic
     */
    and(otherValidator) {
        return new CompositeValidator([this, otherValidator], 'and');
    }

    /**
     * Combine with other validators using OR logic
     */
    or(otherValidator) {
        return new CompositeValidator([this, otherValidator], 'or');
    }
}

/**
 * Required field validator
 */
export class RequiredValidator extends Validator {
    constructor(message = 'This field is required') {
        super(message);
    }

    validate(value) {
        if (value === null || value === undefined || value === '') {
            return this.message;
        }
        return true;
    }
}

/**
 * Number range validator
 */
export class NumberRangeValidator extends Validator {
    constructor(min, max, message = null) {
        super(message || `Value must be between ${min} and ${max}`);
        this.min = min;
        this.max = max;
    }

    validate(value) {
        const num = Number(value);
        if (isNaN(num)) {
            return 'Must be a valid number';
        }
        if (num < this.min || num > this.max) {
            return this.message;
        }
        return true;
    }
}

/**
 * Pattern validator (regex)
 */
export class PatternValidator extends Validator {
    constructor(pattern, message = 'Invalid format') {
        super(message);
        this.pattern = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    }

    validate(value) {
        if (!this.pattern.test(String(value))) {
            return this.message;
        }
        return true;
    }
}

/**
 * Custom function validator
 */
export class CustomValidator extends Validator {
    constructor(validatorFn, message = 'Validation failed') {
        super(message);
        this.validatorFn = validatorFn;
    }

    validate(value, context) {
        const result = this.validatorFn(value, context);
        return result === true ? true : (result || this.message);
    }
}

/**
 * Composite validator (combines multiple validators)
 */
export class CompositeValidator extends Validator {
    constructor(validators, logic = 'and') {
        super();
        this.validators = validators;
        this.logic = logic; // 'and' or 'or'
    }

    validate(value, context) {
        const results = this.validators.map(v => v.validate(value, context));
        
        if (this.logic === 'and') {
            // All must pass
            const failures = results.filter(r => r !== true);
            return failures.length === 0 ? true : failures[0];
        } else {
            // At least one must pass
            const successes = results.filter(r => r === true);
            return successes.length > 0 ? true : results[0];
        }
    }
}

/**
 * Validation schema for complex objects
 */
export class ValidationSchema {
    constructor(rules = {}) {
        this.rules = new Map(Object.entries(rules));
    }

    /**
     * Add validation rule for a field
     */
    addRule(fieldName, validator) {
        this.rules.set(fieldName, validator);
        return this;
    }

    /**
     * Validate an object against the schema
     */
    validate(obj) {
        const errors = new Map();
        let isValid = true;

        for (const [fieldName, validator] of this.rules) {
            const value = obj[fieldName];
            const result = validator.validate(value, obj);
            
            if (result !== true) {
                errors.set(fieldName, result);
                isValid = false;
            }
        }

        return {
            isValid,
            errors: Object.fromEntries(errors),
            errorMap: errors
        };
    }
}

// Pre-built common validators
export const validators = {
    required: () => new RequiredValidator(),
    
    number: (min = -Infinity, max = Infinity) => 
        new NumberRangeValidator(min, max),
        
    pattern: (regex, message) => 
        new PatternValidator(regex, message),
        
    symbol: () => new PatternValidator(
        /^[A-Z]{1,5}$/, 
        'Symbol must be 1-5 uppercase letters'
    ),
    
    percentage: () => new NumberRangeValidator(
        0, 100, 
        'Percentage must be between 0 and 100'
    ),
    
    custom: (fn, message) => 
        new CustomValidator(fn, message)
};