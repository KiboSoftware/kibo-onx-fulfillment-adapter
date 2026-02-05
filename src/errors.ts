/**
 * Kibo Adapter Error Types
 *
 * Custom error classes for the Kibo fulfillment adapter.
 * Maps Kibo API errors to standardized adapter error codes.
 */

/**
 * Error codes used by the Kibo adapter.
 * These codes provide semantic meaning for error handling.
 */
export const AdapterErrorCode = {
  /** Authentication or authorization failed */
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',

  /** Failed to establish connection to Kibo */
  CONNECTION_FAILED: 'CONNECTION_FAILED',

  /** Requested order was not found */
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',

  /** Requested entity was not found */
  NOT_FOUND: 'NOT_FOUND',

  /** Invalid input provided to the operation */
  INVALID_INPUT: 'INVALID_INPUT',

  /** Operation not allowed in current state */
  INVALID_STATE: 'INVALID_STATE',

  /** Rate limit exceeded */
  RATE_LIMITED: 'RATE_LIMITED',

  /** Request timed out */
  TIMEOUT: 'TIMEOUT',

  /** Error from upstream Kibo API */
  UPSTREAM_ERROR: 'UPSTREAM_ERROR',

  /** Unknown or unexpected error */
  UNKNOWN: 'UNKNOWN',
} as const;

export type AdapterErrorCodeType = (typeof AdapterErrorCode)[keyof typeof AdapterErrorCode];

/**
 * Custom error class for Kibo adapter errors.
 * Extends the standard Error with an error code and optional details.
 */
export class KiboAdapterError extends Error {
  public readonly code: AdapterErrorCodeType;
  public readonly details?: unknown;
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: AdapterErrorCodeType,
    details?: unknown,
    statusCode?: number,
  ) {
    super(message);
    this.name = 'KiboAdapterError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where error was thrown (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KiboAdapterError);
    }
  }

  /**
   * Creates a JSON-serializable representation of the error.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Type guard to check if an error is a KiboAdapterError.
 *
 * @param error - The error to check
 * @returns true if the error is a KiboAdapterError
 */
export function isKiboAdapterError(error: unknown): error is KiboAdapterError {
  return error instanceof KiboAdapterError;
}

/**
 * Creates a KiboAdapterError from an HTTP status code and message.
 *
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param details - Optional error details
 * @returns KiboAdapterError with appropriate error code
 */
export function createErrorFromStatus(
  statusCode: number,
  message: string,
  details?: unknown,
): KiboAdapterError {
  let code: AdapterErrorCodeType;

  switch (statusCode) {
    case 400:
      code = AdapterErrorCode.INVALID_INPUT;
      break;
    case 401:
    case 403:
      code = AdapterErrorCode.AUTHENTICATION_FAILED;
      break;
    case 404:
      code = AdapterErrorCode.NOT_FOUND;
      break;
    case 409:
      code = AdapterErrorCode.INVALID_STATE;
      break;
    case 429:
      code = AdapterErrorCode.RATE_LIMITED;
      break;
    case 408:
    case 504:
      code = AdapterErrorCode.TIMEOUT;
      break;
    default:
      code = statusCode >= 500 ? AdapterErrorCode.UPSTREAM_ERROR : AdapterErrorCode.UNKNOWN;
  }

  return new KiboAdapterError(message, code, details, statusCode);
}
