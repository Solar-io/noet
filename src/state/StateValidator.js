/**
 * StateValidator - Comprehensive state validation system
 *
 * Provides validation for state updates to ensure data integrity
 * and prevent invalid states from being applied.
 */

/**
 * Validate a state object against a validator schema
 * @param {Object} state - State object to validate
 * @param {Object} validator - Validator schema
 * @returns {Object} Validation result
 */
export async function validateState(state, validator) {
  const errors = [];
  const warnings = [];

  try {
    // Check required fields
    for (const [key, rules] of Object.entries(validator.schema)) {
      if (rules.required && (state[key] === undefined || state[key] === null)) {
        errors.push(`Required field "${key}" is missing`);
        continue;
      }

      // Skip validation for optional missing fields
      if (state[key] === undefined || state[key] === null) {
        continue;
      }

      // Type validation
      const typeError = validateType(state[key], rules.type, key);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Value validation
      const valueErrors = validateValue(state[key], rules, key);
      errors.push(...valueErrors);

      // Custom validation
      if (rules.validate) {
        try {
          const customResult = await rules.validate(state[key], state);
          if (customResult !== true) {
            errors.push(
              `Custom validation failed for "${key}": ${customResult}`
            );
          }
        } catch (error) {
          errors.push(`Custom validation error for "${key}": ${error.message}`);
        }
      }
    }

    // Check for unknown fields
    for (const key of Object.keys(state)) {
      if (!validator.schema[key]) {
        warnings.push(`Unknown field "${key}" in state`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error.message}`],
      warnings: [],
    };
  }
}

/**
 * Create a validator from a schema definition
 * @param {Object} schema - Schema definition
 * @returns {Object} Validator object
 */
export function createValidator(schema) {
  return {
    schema,
    validate: (state) => validateState(state, { schema }),
  };
}

/**
 * Validate the type of a value
 * @param {*} value - Value to validate
 * @param {string} expectedType - Expected type
 * @param {string} fieldName - Field name for error messages
 * @returns {string|null} Error message or null if valid
 */
function validateType(value, expectedType, fieldName) {
  if (expectedType === "any") return null;

  switch (expectedType) {
    case "string":
      return typeof value !== "string"
        ? `Field "${fieldName}" must be a string`
        : null;

    case "number":
      return typeof value !== "number" || isNaN(value)
        ? `Field "${fieldName}" must be a number`
        : null;

    case "boolean":
      return typeof value !== "boolean"
        ? `Field "${fieldName}" must be a boolean`
        : null;

    case "array":
      return !Array.isArray(value)
        ? `Field "${fieldName}" must be an array`
        : null;

    case "object":
      return typeof value !== "object" || value === null || Array.isArray(value)
        ? `Field "${fieldName}" must be an object`
        : null;

    case "function":
      return typeof value !== "function"
        ? `Field "${fieldName}" must be a function`
        : null;

    default:
      return `Unknown type "${expectedType}" for field "${fieldName}"`;
  }
}

/**
 * Validate the value against rules
 * @param {*} value - Value to validate
 * @param {Object} rules - Validation rules
 * @param {string} fieldName - Field name for error messages
 * @returns {Array} Array of error messages
 */
function validateValue(value, rules, fieldName) {
  const errors = [];

  // Min/Max validation for numbers
  if (typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`Field "${fieldName}" must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`Field "${fieldName}" must be at most ${rules.max}`);
    }
  }

  // Min/Max length validation for strings and arrays
  if (typeof value === "string" || Array.isArray(value)) {
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(
        `Field "${fieldName}" must have at least ${rules.minLength} characters/items`
      );
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(
        `Field "${fieldName}" must have at most ${rules.maxLength} characters/items`
      );
    }
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(
      `Field "${fieldName}" must be one of: ${rules.enum.join(", ")}`
    );
  }

  // Pattern validation for strings
  if (typeof value === "string" && rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(value)) {
      errors.push(`Field "${fieldName}" does not match required pattern`);
    }
  }

  // Properties validation for objects
  if (typeof value === "object" && value !== null && rules.properties) {
    for (const [propKey, propRules] of Object.entries(rules.properties)) {
      if (
        propRules.required &&
        (value[propKey] === undefined || value[propKey] === null)
      ) {
        errors.push(
          `Property "${propKey}" is required in field "${fieldName}"`
        );
        continue;
      }

      if (value[propKey] !== undefined && value[propKey] !== null) {
        const typeError = validateType(
          value[propKey],
          propRules.type,
          `${fieldName}.${propKey}`
        );
        if (typeError) {
          errors.push(typeError);
        } else {
          const valueErrors = validateValue(
            value[propKey],
            propRules,
            `${fieldName}.${propKey}`
          );
          errors.push(...valueErrors);
        }
      }
    }
  }

  // Array items validation
  if (Array.isArray(value) && rules.items) {
    value.forEach((item, index) => {
      const typeError = validateType(
        item,
        rules.items.type,
        `${fieldName}[${index}]`
      );
      if (typeError) {
        errors.push(typeError);
      } else {
        const valueErrors = validateValue(
          item,
          rules.items,
          `${fieldName}[${index}]`
        );
        errors.push(...valueErrors);
      }
    });
  }

  return errors;
}

/**
 * Pre-built validators for common patterns
 */
export const VALIDATORS = {
  // ID validation
  ID: {
    type: "string",
    pattern: "^[a-zA-Z0-9_-]+$",
    minLength: 1,
    maxLength: 100,
  },

  // UUID validation
  UUID: {
    type: "string",
    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
  },

  // Email validation
  EMAIL: {
    type: "string",
    pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
    maxLength: 254,
  },

  // URL validation
  URL: {
    type: "string",
    pattern: "^https?:\\/\\/[^\\s]+$",
    maxLength: 2048,
  },

  // Timestamp validation
  TIMESTAMP: {
    type: "number",
    min: 0,
    max: 9999999999999, // Max reasonable timestamp
  },

  // Note content validation
  NOTE_CONTENT: {
    type: "string",
    maxLength: 10000000, // 10MB limit
  },

  // Tag name validation
  TAG_NAME: {
    type: "string",
    pattern: "^[a-zA-Z0-9_-]+$",
    minLength: 1,
    maxLength: 50,
  },

  // Notebook/Folder name validation
  NAME: {
    type: "string",
    minLength: 1,
    maxLength: 100,
  },

  // Color validation (hex colors)
  COLOR: {
    type: "string",
    pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
  },

  // File path validation
  FILE_PATH: {
    type: "string",
    pattern: '^[^<>:"|?*\\x00-\\x1f]+$',
    maxLength: 260,
  },

  // Permission validation
  PERMISSION: {
    type: "string",
    enum: ["read", "write", "delete", "admin"],
  },

  // View type validation
  VIEW_TYPE: {
    type: "string",
    enum: ["all", "starred", "recent", "archived", "trash", "search"],
  },

  // Sort validation
  SORT_BY: {
    type: "string",
    enum: ["title", "created", "updated", "size"],
  },

  SORT_ORDER: {
    type: "string",
    enum: ["asc", "desc"],
  },
};

/**
 * Create a composite validator that combines multiple validators
 * @param {Array} validators - Array of validators to combine
 * @returns {Function} Combined validator function
 */
export function createCompositeValidator(validators) {
  return async (state) => {
    const allErrors = [];
    const allWarnings = [];

    for (const validator of validators) {
      const result = await validator.validate(state);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  };
}

/**
 * Create a conditional validator
 * @param {Function} condition - Condition function
 * @param {Object} validator - Validator to apply when condition is true
 * @returns {Function} Conditional validator function
 */
export function createConditionalValidator(condition, validator) {
  return async (state) => {
    if (await condition(state)) {
      return validator.validate(state);
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  };
}

/**
 * Sanitize state by removing invalid fields
 * @param {Object} state - State to sanitize
 * @param {Object} validator - Validator schema
 * @returns {Object} Sanitized state
 */
export function sanitizeState(state, validator) {
  const sanitized = {};

  for (const [key, rules] of Object.entries(validator.schema)) {
    if (state[key] !== undefined && state[key] !== null) {
      sanitized[key] = sanitizeValue(state[key], rules);
    } else if (rules.default !== undefined) {
      sanitized[key] = JSON.parse(JSON.stringify(rules.default));
    }
  }

  return sanitized;
}

/**
 * Sanitize a single value
 * @param {*} value - Value to sanitize
 * @param {Object} rules - Validation rules
 * @returns {*} Sanitized value
 */
function sanitizeValue(value, rules) {
  // String sanitization
  if (typeof value === "string") {
    // Trim whitespace
    value = value.trim();

    // Apply max length
    if (rules.maxLength && value.length > rules.maxLength) {
      value = value.substring(0, rules.maxLength);
    }

    // Remove invalid characters for IDs
    if (rules.pattern === "^[a-zA-Z0-9_-]+$") {
      value = value.replace(/[^a-zA-Z0-9_-]/g, "");
    }
  }

  // Number sanitization
  if (typeof value === "number") {
    // Apply min/max bounds
    if (rules.min !== undefined && value < rules.min) {
      value = rules.min;
    }
    if (rules.max !== undefined && value > rules.max) {
      value = rules.max;
    }
  }

  // Array sanitization
  if (Array.isArray(value)) {
    // Apply max length
    if (rules.maxLength && value.length > rules.maxLength) {
      value = value.slice(0, rules.maxLength);
    }

    // Sanitize items
    if (rules.items) {
      value = value.map((item) => sanitizeValue(item, rules.items));
    }
  }

  return value;
}

/**
 * Create a state schema builder for easier validator creation
 */
export class StateSchemaBuilder {
  constructor() {
    this.schema = {};
  }

  field(name, type, options = {}) {
    this.schema[name] = {
      type,
      ...options,
    };
    return this;
  }

  required(name, type, options = {}) {
    return this.field(name, type, { ...options, required: true });
  }

  optional(name, type, options = {}) {
    return this.field(name, type, { ...options, required: false });
  }

  build() {
    return createValidator(this.schema);
  }
}

/**
 * Create a new schema builder
 * @returns {StateSchemaBuilder} Schema builder instance
 */
export function createSchema() {
  return new StateSchemaBuilder();
}
