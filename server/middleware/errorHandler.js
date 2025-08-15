// Custom error classes
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.status = 400;
  }
}

class APIError extends Error {
  constructor(message, status = 500, service = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.service = service;
  }
}

class RateLimitError extends Error {
  constructor(message, retryAfter = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.status = 429;
    this.retryAfter = retryAfter;
  }
}

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error logging utility
const logError = (error, req = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  };
  
  if (req) {
    logData.request = {
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }
  
  console.error('🚨 Error:', JSON.stringify(logData, null, 2));
};

module.exports = {
  ValidationError,
  APIError,
  RateLimitError,
  asyncHandler,
  logError
};