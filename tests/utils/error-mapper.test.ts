/**
 * Unit tests for Error Mapper
 *
 * Tests for Kibo API error to KiboAdapterError mapping.
 */

import { describe, it, expect } from '@jest/globals';
import { mapKiboError, withErrorMapping } from '../../src/utils/error-mapper.js';
import { KiboAdapterError, AdapterErrorCode, isKiboAdapterError } from '../../src/errors.js';

// ============================================================================
// mapKiboError Tests
// ============================================================================

describe('mapKiboError', () => {
  describe('existing KiboAdapterError handling', () => {
    it('should return the same error if already a KiboAdapterError', () => {
      const originalError = new KiboAdapterError(
        'Original error',
        AdapterErrorCode.NOT_FOUND,
        { id: 123 },
        404,
      );

      const mapped = mapKiboError(originalError);

      expect(mapped).toBe(originalError);
      expect(mapped.code).toBe(AdapterErrorCode.NOT_FOUND);
    });

    it('should add context to existing KiboAdapterError if provided', () => {
      const originalError = new KiboAdapterError(
        'Original error',
        AdapterErrorCode.NOT_FOUND,
        undefined,
        404,
      );

      const mapped = mapKiboError(originalError, 'Context message');

      expect(mapped).not.toBe(originalError);
      expect(mapped.message).toBe('Context message: Original error');
      expect(mapped.code).toBe(AdapterErrorCode.NOT_FOUND);
    });
  });

  describe('Kibo error code mapping', () => {
    it('should map ITEM_NOT_FOUND to NOT_FOUND', () => {
      const error = { errorCode: 'ITEM_NOT_FOUND', message: 'Item not found' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.NOT_FOUND);
      expect(mapped.message).toBe('Item not found');
    });

    it('should map ORDER_NOT_FOUND to ORDER_NOT_FOUND', () => {
      const error = { errorCode: 'ORDER_NOT_FOUND', message: 'Order not found' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.ORDER_NOT_FOUND);
    });

    it('should map VALIDATION_ERROR to INVALID_INPUT', () => {
      const error = { errorCode: 'VALIDATION_ERROR', message: 'Invalid data' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.INVALID_INPUT);
    });

    it('should map INVALID_ORDER_STATUS to INVALID_STATE', () => {
      const error = { errorCode: 'INVALID_ORDER_STATUS', message: 'Cannot transition' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.INVALID_STATE);
    });

    it('should map UNAUTHORIZED to AUTHENTICATION_FAILED', () => {
      const error = { errorCode: 'UNAUTHORIZED', message: 'Not authenticated' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.AUTHENTICATION_FAILED);
    });

    it('should map RATE_LIMIT_EXCEEDED to RATE_LIMITED', () => {
      const error = { errorCode: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.RATE_LIMITED);
    });

    it('should map TIMEOUT to TIMEOUT', () => {
      const error = { errorCode: 'TIMEOUT', message: 'Request timed out' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.TIMEOUT);
    });
  });

  describe('HTTP status code mapping', () => {
    it('should map 400 status to INVALID_INPUT', () => {
      const error = { status: 400, message: 'Bad request' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.INVALID_INPUT);
      expect(mapped.statusCode).toBe(400);
    });

    it('should map 401 status to AUTHENTICATION_FAILED', () => {
      const error = { status: 401, message: 'Unauthorized' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.AUTHENTICATION_FAILED);
    });

    it('should map 403 status to AUTHENTICATION_FAILED', () => {
      const error = { status: 403, message: 'Forbidden' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.AUTHENTICATION_FAILED);
    });

    it('should map 404 status to NOT_FOUND', () => {
      const error = { status: 404, message: 'Not found' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.NOT_FOUND);
    });

    it('should map 409 status to INVALID_STATE', () => {
      const error = { status: 409, message: 'Conflict' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.INVALID_STATE);
    });

    it('should map 429 status to RATE_LIMITED', () => {
      const error = { status: 429, message: 'Rate limited' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.RATE_LIMITED);
    });

    it('should map 408 status to TIMEOUT', () => {
      const error = { status: 408, message: 'Request timeout' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.TIMEOUT);
    });

    it('should map 504 status to TIMEOUT', () => {
      const error = { status: 504, message: 'Gateway timeout' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.TIMEOUT);
    });

    it('should map 500+ status to UPSTREAM_ERROR', () => {
      const error = { status: 500, message: 'Internal server error' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.UPSTREAM_ERROR);
    });
  });

  describe('Axios error response handling', () => {
    it('should extract error from Axios-style response', () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            errorCode: 'ORDER_NOT_FOUND',
            message: 'Order 12345 not found',
            additionalErrorData: { orderId: '12345' },
          },
        },
      };

      const mapped = mapKiboError(axiosError);

      expect(mapped.code).toBe(AdapterErrorCode.ORDER_NOT_FOUND);
      expect(mapped.message).toBe('Order 12345 not found');
      expect(mapped.statusCode).toBe(404);
      expect(mapped.details).toEqual({ orderId: '12345' });
    });
  });

  describe('error items array handling', () => {
    it('should build message from items array', () => {
      const error = {
        errorCode: 'VALIDATION_ERROR',
        items: [
          { name: 'email', message: 'Invalid email format' },
          { name: 'quantity', message: 'Must be positive' },
        ],
      };

      const mapped = mapKiboError(error);

      expect(mapped.message).toBe('email: Invalid email format; quantity: Must be positive');
    });

    it('should handle items without names', () => {
      const error = {
        errorCode: 'VALIDATION_ERROR',
        items: [{ message: 'Something went wrong' }],
      };

      const mapped = mapKiboError(error);

      expect(mapped.message).toBe('Something went wrong');
    });
  });

  describe('context message handling', () => {
    it('should prepend context to error message', () => {
      const error = new Error('Original message');

      const mapped = mapKiboError(error, 'Failed to get order');

      expect(mapped.message).toBe('Failed to get order: Original message');
    });
  });

  describe('unknown error handling', () => {
    it('should map unknown errors to UNKNOWN code', () => {
      const error = { unknownField: 'unknown' };

      const mapped = mapKiboError(error);

      expect(mapped.code).toBe(AdapterErrorCode.UNKNOWN);
    });

    it('should handle string errors', () => {
      const mapped = mapKiboError('String error');

      expect(mapped.message).toBe('String error');
      expect(mapped.code).toBe(AdapterErrorCode.UNKNOWN);
    });

    it('should handle null error', () => {
      const mapped = mapKiboError(null);

      expect(mapped.message).toBe('Unknown error occurred');
      expect(mapped.code).toBe(AdapterErrorCode.UNKNOWN);
    });
  });
});

// ============================================================================
// withErrorMapping Tests
// ============================================================================

describe('withErrorMapping', () => {
  it('should return result on success', async () => {
    const operation = async () => ({ data: 'success' });

    const result = await withErrorMapping(operation, 'Operation context');

    expect(result).toEqual({ data: 'success' });
  });

  it('should throw KiboAdapterError on failure', async () => {
    const operation = async () => {
      throw new Error('Operation failed');
    };

    await expect(withErrorMapping(operation, 'Get order')).rejects.toThrow(
      KiboAdapterError,
    );
  });

  it('should include context in error message', async () => {
    const operation = async () => {
      throw new Error('Network error');
    };

    try {
      await withErrorMapping(operation, 'Get order');
    } catch (error) {
      if (isKiboAdapterError(error)) {
        expect(error.message).toBe('Get order: Network error');
      }
    }
  });

  it('should map error codes correctly', async () => {
    const operation = async () => {
      throw { errorCode: 'ORDER_NOT_FOUND', message: 'Not found' };
    };

    try {
      await withErrorMapping(operation, 'Fetch order');
    } catch (error) {
      if (isKiboAdapterError(error)) {
        expect(error.code).toBe(AdapterErrorCode.ORDER_NOT_FOUND);
      }
    }
  });
});
