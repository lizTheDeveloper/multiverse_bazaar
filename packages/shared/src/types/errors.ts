/**
 * Error handling types for the Multiverse Bazaar API
 */

export interface ErrorDetails {
  [key: string]: unknown;
}

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Base error class for all API errors
 */
export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly details?: ErrorDetails;

  constructor(message: string, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error to JSON format
   */
  toJSON(): {
    code: string;
    message: string;
    statusCode: number;
    details?: ErrorDetails;
  } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(resource: string, details?: ErrorDetails) {
    super(`${resource} not found`, details);
  }
}

/**
 * 400 Validation Error
 */
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly fieldErrors?: FieldError[];

  constructor(message: string, fieldErrors?: FieldError[], details?: ErrorDetails) {
    super(message, details);
    this.fieldErrors = fieldErrors;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      ...(this.fieldErrors && { fieldErrors: this.fieldErrors }),
    };
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends BaseError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string = 'Authentication required', details?: ErrorDetails) {
    super(message, details);
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends BaseError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message: string = 'Access forbidden', details?: ErrorDetails) {
    super(message, details);
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends BaseError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(message: string, details?: ErrorDetails) {
    super(message, details);
  }
}

/**
 * 429 Rate Limit Error
 */
export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, details?: ErrorDetails) {
    super(message, details);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    const base = super.toJSON();
    return {
      ...base,
      ...(this.retryAfter && { retryAfter: this.retryAfter }),
    };
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalError extends BaseError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor(message: string = 'An internal error occurred', details?: ErrorDetails) {
    super(message, details);
  }
}

/**
 * Type guard to check if an error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Converts any error to a BaseError
 */
export function toBaseError(error: unknown): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, { originalError: error.name });
  }

  return new InternalError('An unknown error occurred', {
    error: String(error)
  });
}
