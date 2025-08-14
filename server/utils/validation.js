const { ValidationError } = require('../middleware/errorHandler');

// Common validation functions
const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
};

const validateString = (value, fieldName, minLength = 0, maxLength = Infinity) => {
  validateRequired(value, fieldName);
  
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }
  
  const trimmedValue = value.trim();
  
  if (trimmedValue.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
  }
  
  if (trimmedValue.length > maxLength) {
    throw new ValidationError(`${fieldName} must be less than ${maxLength} characters`, fieldName);
  }
  
  return trimmedValue;
};

const validatePrompt = (prompt) => {
  return validateString(prompt, 'prompt', 10, 500);
};

const validateNarrationText = (text) => {
  return validateString(text, 'text', 10, 5000);
};

// Sanitization functions
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially harmful characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

const sanitizePrompt = (prompt) => {
  const sanitized = sanitizeInput(prompt);
  
  // Additional prompt-specific sanitization
  return sanitized
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 500); // Ensure max length
};

module.exports = {
  validateRequired,
  validateString,
  validatePrompt,
  validateNarrationText,
  sanitizeInput,
  sanitizePrompt
};