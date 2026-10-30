'use strict';

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details);
  }
}

module.exports = { ApiError };