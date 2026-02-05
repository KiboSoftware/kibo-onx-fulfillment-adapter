/**
 * Error Mapper for Kibo API Errors
 *
 * Maps Kibo API errors to standardized KiboAdapterError instances
 * with appropriate error codes for consistent error handling.
 */

import {
  KiboAdapterError,
  AdapterErrorCode,
  type AdapterErrorCodeType,
} from '../errors.js';
import { getErrorMessage, getErrorStatusCode, isObject } from './type-guards.js';

/**
 * Known Kibo error codes and their mappings.
 */
const KIBO_ERROR_CODE_MAP: Record<string, AdapterErrorCodeType> = {
  // Item/Entity not found
  ITEM_NOT_FOUND: AdapterErrorCode.NOT_FOUND,
  ORDER_NOT_FOUND: AdapterErrorCode.ORDER_NOT_FOUND,
  PRODUCT_NOT_FOUND: AdapterErrorCode.NOT_FOUND,
  CUSTOMER_NOT_FOUND: AdapterErrorCode.NOT_FOUND,
  SHIPMENT_NOT_FOUND: AdapterErrorCode.NOT_FOUND,
  LOCATION_NOT_FOUND: AdapterErrorCode.NOT_FOUND,

  // Validation errors
  VALIDATION_ERROR: AdapterErrorCode.INVALID_INPUT,
  INVALID_PARAMETER: AdapterErrorCode.INVALID_INPUT,
  MISSING_REQUIRED_FIELD: AdapterErrorCode.INVALID_INPUT,
  INVALID_FORMAT: AdapterErrorCode.INVALID_INPUT,

  // State errors
  INVALID_ORDER_STATUS: AdapterErrorCode.INVALID_STATE,
  ORDER_ALREADY_CANCELLED: AdapterErrorCode.INVALID_STATE,
  ORDER_ALREADY_FULFILLED: AdapterErrorCode.INVALID_STATE,
  INVALID_STATE_TRANSITION: AdapterErrorCode.INVALID_STATE,

  // Auth errors
  UNAUTHORIZED: AdapterErrorCode.AUTHENTICATION_FAILED,
  FORBIDDEN: AdapterErrorCode.AUTHENTICATION_FAILED,
  INVALID_CREDENTIALS: AdapterErrorCode.AUTHENTICATION_FAILED,
  TOKEN_EXPIRED: AdapterErrorCode.AUTHENTICATION_FAILED,

  // Rate limiting
  RATE_LIMIT_EXCEEDED: AdapterErrorCode.RATE_LIMITED,
  TOO_MANY_REQUESTS: AdapterErrorCode.RATE_LIMITED,

  // Timeout
  TIMEOUT: AdapterErrorCode.TIMEOUT,
  REQUEST_TIMEOUT: AdapterErrorCode.TIMEOUT,
  GATEWAY_TIMEOUT: AdapterErrorCode.TIMEOUT,
};

/**
 * Kibo API error response structure.
 */
interface KiboApiErrorResponse {
  errorCode?: string;
  message?: string;
  items?: Array<{ name?: string; message?: string }>;
  additionalErrorData?: Record<string, unknown>;
}

/**
 * Extracts error details from a Kibo API error response.
 */
function extractKiboErrorDetails(error: unknown): {
  errorCode?: string;
  message?: string;
  details?: unknown;
} {
  // Check for Axios-style error with response.data
  if (isObject(error) && 'response' in error) {
    const response = error.response;
    if (isObject(response) && 'data' in response) {
      const data = response.data;
      if (isObject(data)) {
        const kiboError = data as KiboApiErrorResponse;
        return {
          errorCode: kiboError.errorCode,
          message: kiboError.message || buildItemMessages(kiboError.items),
          details: kiboError.additionalErrorData,
        };
      }
    }
  }

  // Check for direct error object with errorCode
  if (isObject(error) && 'errorCode' in error) {
    const kiboError = error as KiboApiErrorResponse;
    return {
      errorCode: kiboError.errorCode,
      message: kiboError.message || buildItemMessages(kiboError.items),
      details: kiboError.additionalErrorData,
    };
  }

  return {};
}

/**
 * Builds a message from Kibo error items array.
 */
function buildItemMessages(items?: Array<{ name?: string; message?: string }>): string | undefined {
  if (!items || items.length === 0) {return undefined;}
  return items
    .map((item) => (item.name ? `${item.name}: ${item.message}` : item.message))
    .filter(Boolean)
    .join('; ');
}

/**
 * Maps an error code string to an AdapterErrorCode.
 */
function mapErrorCode(
  errorCode: string | undefined,
  statusCode: number | undefined,
): AdapterErrorCodeType {
  // First try to map by Kibo error code
  if (errorCode) {
    const upperCode = errorCode.toUpperCase().replace(/[^A-Z_]/g, '_');
    const mapped = KIBO_ERROR_CODE_MAP[upperCode];
    if (mapped) {return mapped;}
  }

  // Fall back to HTTP status code mapping
  if (statusCode) {
    switch (statusCode) {
      case 400:
        return AdapterErrorCode.INVALID_INPUT;
      case 401:
      case 403:
        return AdapterErrorCode.AUTHENTICATION_FAILED;
      case 404:
        return AdapterErrorCode.NOT_FOUND;
      case 409:
        return AdapterErrorCode.INVALID_STATE;
      case 429:
        return AdapterErrorCode.RATE_LIMITED;
      case 408:
      case 504:
        return AdapterErrorCode.TIMEOUT;
      default:
        if (statusCode >= 500) {return AdapterErrorCode.UPSTREAM_ERROR;}
    }
  }

  return AdapterErrorCode.UNKNOWN;
}

/**
 * Maps a Kibo API error to a KiboAdapterError.
 *
 * This function extracts error information from various error formats
 * (Axios errors, fetch errors, Kibo API errors) and creates a standardized
 * KiboAdapterError with an appropriate error code.
 *
 * @param error - The original error from the Kibo API
 * @param context - Optional context message to prepend
 * @returns A standardized KiboAdapterError
 *
 * @example
 * ```typescript
 * try {
 *   await orderApi.getOrder({ orderId: 'invalid' });
 * } catch (error) {
 *   throw mapKiboError(error, 'Failed to get order');
 * }
 * ```
 */
export function mapKiboError(error: unknown, context?: string): KiboAdapterError {
  // If already a KiboAdapterError, just return it (maybe add context)
  if (error instanceof KiboAdapterError) {
    if (context) {
      return new KiboAdapterError(
        `${context}: ${error.message}`,
        error.code,
        error.details,
        error.statusCode,
      );
    }
    return error;
  }

  // Extract error details
  const statusCode = getErrorStatusCode(error);
  const { errorCode, message: kiboMessage, details } = extractKiboErrorDetails(error);
  const fallbackMessage = getErrorMessage(error);

  // Determine the error code
  const code = mapErrorCode(errorCode, statusCode);

  // Build the message
  const message = context
    ? `${context}: ${kiboMessage || fallbackMessage}`
    : kiboMessage || fallbackMessage;

  return new KiboAdapterError(message, code, details ?? error, statusCode);
}

/**
 * Wraps an async operation with error mapping.
 *
 * @param operation - Async function to wrap
 * @param context - Error context message
 * @returns The result of the operation
 * @throws KiboAdapterError if the operation fails
 */
export async function withErrorMapping<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapKiboError(error, context);
  }
}
