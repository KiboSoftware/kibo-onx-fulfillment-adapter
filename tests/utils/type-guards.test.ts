/**
 * Unit tests for Type Guards
 *
 * Tests for runtime type validation utilities.
 */

import { describe, it, expect } from '@jest/globals';
import {
  isError,
  isAxiosError,
  isFetchError,
  getErrorMessage,
  getErrorStatusCode,
  isObject,
  isNonEmptyString,
  isNumericId,
  isKiboOrder,
  isKiboShipment,
  isKiboCustomerAccount,
  isKiboProduct,
  isKiboInventoryItem,
  isKiboReturn,
  isKiboPaginatedCollection,
  assertDefined,
  assertNonEmptyString,
} from '../../src/utils/type-guards.js';

// ============================================================================
// Error Type Guards Tests
// ============================================================================

describe('Error Type Guards', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('type error'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('error string')).toBe(false);
      expect(isError({ message: 'error' })).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('isAxiosError', () => {
    it('should return true for axios-like errors', () => {
      const axiosError = { response: { status: 404, data: {} } };
      expect(isAxiosError(axiosError)).toBe(true);
    });

    it('should return true for objects with response property', () => {
      expect(isAxiosError({ response: undefined })).toBe(true);
    });

    it('should return false for non-axios errors', () => {
      expect(isAxiosError(new Error('test'))).toBe(false);
      expect(isAxiosError(null)).toBe(false);
      expect(isAxiosError('string')).toBe(false);
    });
  });

  describe('isFetchError', () => {
    it('should return true for fetch-like errors', () => {
      expect(isFetchError({ status: 500 })).toBe(true);
      expect(isFetchError({ statusText: 'Internal Server Error' })).toBe(true);
    });

    it('should return false for non-fetch errors', () => {
      expect(isFetchError(new Error('test'))).toBe(false);
      expect(isFetchError(null)).toBe(false);
      expect(isFetchError({})).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('test message'))).toBe('test message');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should extract message from object', () => {
      expect(getErrorMessage({ message: 'object error' })).toBe('object error');
    });

    it('should return default for unknown types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
    });
  });

  describe('getErrorStatusCode', () => {
    it('should extract status from axios-like error', () => {
      const axiosError = { response: { status: 404 } };
      expect(getErrorStatusCode(axiosError)).toBe(404);
    });

    it('should extract status from fetch-like error', () => {
      const fetchError = { status: 500 };
      expect(getErrorStatusCode(fetchError)).toBe(500);
    });

    it('should return undefined for errors without status', () => {
      expect(getErrorStatusCode(new Error('test'))).toBeUndefined();
      expect(getErrorStatusCode(null)).toBeUndefined();
      expect(getErrorStatusCode({ response: {} })).toBeUndefined();
    });
  });
});

// ============================================================================
// Object Type Guards Tests
// ============================================================================

describe('Object Type Guards', () => {
  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  hello  ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe('isNumericId', () => {
    it('should return true for numbers', () => {
      expect(isNumericId(123)).toBe(true);
      expect(isNumericId(0)).toBe(true);
    });

    it('should return true for numeric strings', () => {
      expect(isNumericId('123')).toBe(true);
      expect(isNumericId('0')).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumericId(NaN)).toBe(false);
    });

    it('should return false for non-numeric strings', () => {
      expect(isNumericId('abc')).toBe(false);
      expect(isNumericId('12a3')).toBe(false);
    });

    it('should return false for non-numeric types', () => {
      expect(isNumericId(null)).toBe(false);
      expect(isNumericId({})).toBe(false);
    });
  });
});

// ============================================================================
// Kibo Response Type Guards Tests
// ============================================================================

describe('Kibo Response Type Guards', () => {
  describe('isKiboOrder', () => {
    it('should return true for order with orderNumber', () => {
      expect(isKiboOrder({ orderNumber: 12345 })).toBe(true);
    });

    it('should return true for order with id and items', () => {
      expect(isKiboOrder({ id: 'order-1', items: [] })).toBe(true);
    });

    it('should return false for non-orders', () => {
      expect(isKiboOrder({ id: 'only-id' })).toBe(false);
      expect(isKiboOrder(null)).toBe(false);
      expect(isKiboOrder('string')).toBe(false);
    });
  });

  describe('isKiboShipment', () => {
    it('should return true for shipment with shipmentNumber', () => {
      expect(isKiboShipment({ shipmentNumber: 100 })).toBe(true);
    });

    it('should return true for shipment with shipmentStatus and orderId', () => {
      expect(isKiboShipment({ shipmentStatus: 'Ready', orderId: 'ord-1' })).toBe(true);
    });

    it('should return false for non-shipments', () => {
      expect(isKiboShipment({ orderId: 'only-orderId' })).toBe(false);
      expect(isKiboShipment(null)).toBe(false);
    });
  });

  describe('isKiboCustomerAccount', () => {
    it('should return true for customer with emailAddress', () => {
      expect(isKiboCustomerAccount({ emailAddress: 'test@example.com' })).toBe(true);
    });

    it('should return true for customer with id and firstName', () => {
      expect(isKiboCustomerAccount({ id: 1, firstName: 'John' })).toBe(true);
    });

    it('should return false for non-customers', () => {
      expect(isKiboCustomerAccount({ name: 'only-name' })).toBe(false);
      expect(isKiboCustomerAccount(null)).toBe(false);
    });
  });

  describe('isKiboProduct', () => {
    it('should return true for product with productCode', () => {
      expect(isKiboProduct({ productCode: 'PROD-001' })).toBe(true);
    });

    it('should return true for product with productName', () => {
      expect(isKiboProduct({ productName: 'Test Product' })).toBe(true);
    });

    it('should return false for non-products', () => {
      expect(isKiboProduct({ sku: 'sku-only' })).toBe(false);
      expect(isKiboProduct(null)).toBe(false);
    });
  });

  describe('isKiboInventoryItem', () => {
    it('should return true for inventory with productCode and available', () => {
      expect(isKiboInventoryItem({ productCode: 'PROD-001', available: 10 })).toBe(true);
    });

    it('should return true for inventory with productCode and onHand', () => {
      expect(isKiboInventoryItem({ productCode: 'PROD-001', onHand: 5 })).toBe(true);
    });

    it('should return false for non-inventory items', () => {
      expect(isKiboInventoryItem({ productCode: 'PROD-001' })).toBe(false);
      expect(isKiboInventoryItem({ available: 10 })).toBe(false);
    });
  });

  describe('isKiboReturn', () => {
    it('should return true for return with returnNumber', () => {
      expect(isKiboReturn({ returnNumber: 500 })).toBe(true);
    });

    it('should return true for return with originalOrderId and items', () => {
      expect(isKiboReturn({ originalOrderId: 'ord-1', items: [] })).toBe(true);
    });

    it('should return false for non-returns', () => {
      expect(isKiboReturn({ originalOrderId: 'ord-1' })).toBe(false);
      expect(isKiboReturn(null)).toBe(false);
    });
  });

  describe('isKiboPaginatedCollection', () => {
    it('should return true for collection with items array', () => {
      expect(isKiboPaginatedCollection({ items: [] })).toBe(true);
      expect(isKiboPaginatedCollection({ items: [1, 2, 3] })).toBe(true);
    });

    it('should validate items with guard if provided', () => {
      const isOrder = (item: unknown): item is { orderNumber: number } =>
        typeof item === 'object' && item !== null && 'orderNumber' in item;

      expect(
        isKiboPaginatedCollection({ items: [{ orderNumber: 1 }] }, isOrder),
      ).toBe(true);

      expect(
        isKiboPaginatedCollection({ items: [{ notOrder: true }] }, isOrder),
      ).toBe(false);
    });

    it('should return false for non-collections', () => {
      expect(isKiboPaginatedCollection({ items: 'not-array' })).toBe(false);
      expect(isKiboPaginatedCollection({ data: [] })).toBe(false);
      expect(isKiboPaginatedCollection(null)).toBe(false);
    });
  });
});

// ============================================================================
// Assertion Helpers Tests
// ============================================================================

describe('Assertion Helpers', () => {
  describe('assertDefined', () => {
    it('should not throw for defined values', () => {
      expect(() => assertDefined('value')).not.toThrow();
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
      expect(() => assertDefined('')).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => assertDefined(null)).toThrow('Value is null or undefined');
    });

    it('should throw for undefined', () => {
      expect(() => assertDefined(undefined)).toThrow('Value is null or undefined');
    });

    it('should use custom message', () => {
      expect(() => assertDefined(null, 'Custom message')).toThrow('Custom message');
    });
  });

  describe('assertNonEmptyString', () => {
    it('should not throw for non-empty strings', () => {
      expect(() => assertNonEmptyString('hello')).not.toThrow();
    });

    it('should throw for empty strings', () => {
      expect(() => assertNonEmptyString('')).toThrow('Value is not a non-empty string');
    });

    it('should throw for whitespace-only strings', () => {
      expect(() => assertNonEmptyString('   ')).toThrow('Value is not a non-empty string');
    });

    it('should throw for non-strings', () => {
      expect(() => assertNonEmptyString(123)).toThrow('Value is not a non-empty string');
    });

    it('should use custom message', () => {
      expect(() => assertNonEmptyString('', 'Custom message')).toThrow('Custom message');
    });
  });
});
