/**
 * Type guard utilities for safe type checking
 *
 * Provides runtime type validation for Kibo API responses
 * to ensure type safety without using `any`.
 */

import type {
  KiboOrder,
  KiboShipment,
  KiboCustomerAccount,
  KiboProduct,
  KiboInventoryItem,
  KiboReturn,
  KiboPaginatedCollection,
} from '../types.js';

// ============================================================================
// Generic Type Guards
// ============================================================================

/**
 * Check if an unknown error is an Error instance.
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Check if error has a response property (Axios-like errors).
 */
export function isAxiosError(
  error: unknown,
): error is { response?: { data?: unknown; status?: number }; message?: string } {
  return typeof error === 'object' && error !== null && 'response' in error;
}

/**
 * Check if error is a fetch error with status code.
 */
export function isFetchError(
  error: unknown,
): error is { status?: number; statusText?: string; message?: string } {
  return typeof error === 'object' && error !== null && ('status' in error || 'statusText' in error);
}

/**
 * Get error message safely from unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Unknown error occurred';
}

/**
 * Get HTTP status code from error if available.
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }
  if (isFetchError(error) && error.status) {
    return error.status;
  }
  return undefined;
}

// ============================================================================
// Object Type Guards
// ============================================================================

/**
 * Check if value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a number (including numeric strings for IDs).
 */
export function isNumericId(value: unknown): value is string | number {
  if (typeof value === 'number') {return !isNaN(value);}
  if (typeof value === 'string') {return /^\d+$/.test(value);}
  return false;
}

// ============================================================================
// Kibo Response Type Guards
// ============================================================================

/**
 * Check if response is a Kibo Order.
 */
export function isKiboOrder(value: unknown): value is KiboOrder {
  if (!isObject(value)) {return false;}
  // Orders have orderNumber or id
  return 'orderNumber' in value || ('id' in value && 'items' in value);
}

/**
 * Check if response is a Kibo Shipment.
 */
export function isKiboShipment(value: unknown): value is KiboShipment {
  if (!isObject(value)) {return false;}
  return 'shipmentNumber' in value || ('shipmentStatus' in value && 'orderId' in value);
}

/**
 * Check if response is a Kibo Customer Account.
 */
export function isKiboCustomerAccount(value: unknown): value is KiboCustomerAccount {
  if (!isObject(value)) {return false;}
  return 'emailAddress' in value || ('id' in value && 'firstName' in value);
}

/**
 * Check if response is a Kibo Product.
 */
export function isKiboProduct(value: unknown): value is KiboProduct {
  if (!isObject(value)) {return false;}
  return 'productCode' in value || 'productName' in value;
}

/**
 * Check if response is a Kibo Inventory Item.
 */
export function isKiboInventoryItem(value: unknown): value is KiboInventoryItem {
  if (!isObject(value)) {return false;}
  return 'productCode' in value && ('available' in value || 'onHand' in value);
}

/**
 * Check if response is a Kibo Return.
 */
export function isKiboReturn(value: unknown): value is KiboReturn {
  if (!isObject(value)) {return false;}
  return 'returnNumber' in value || ('originalOrderId' in value && 'items' in value);
}

/**
 * Check if response is a Kibo paginated collection.
 */
export function isKiboPaginatedCollection<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T,
): value is KiboPaginatedCollection<T> {
  if (!isObject(value)) {return false;}
  if (!('items' in value)) {return false;}

  const items = value.items;
  if (!Array.isArray(items)) {return false;}

  // If an item guard is provided, validate first item
  if (itemGuard && items.length > 0) {
    return itemGuard(items[0]);
  }

  return true;
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a value is defined (not null or undefined).
 * Throws if the value is null or undefined.
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined',
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is a non-empty string.
 */
export function assertNonEmptyString(
  value: unknown,
  message = 'Value is not a non-empty string',
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new Error(message);
  }
}