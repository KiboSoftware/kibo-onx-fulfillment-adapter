/**
 * Unit tests for Error Classes
 *
 * Tests for KiboAdapterError and related error utilities.
 */

import { describe, it, expect } from '@jest/globals';
import {
  KiboAdapterError,
  AdapterErrorCode,
  isKiboAdapterError,
  createErrorFromStatus,
} from '../src/errors.js';

// ============================================================================
// KiboAdapterError Tests
// ============================================================================

describe('KiboAdapterError', () => {
  describe('constructor', () => {
    it('should create error with message and code', () => {
      const error = new KiboAdapterError('Test error', AdapterErrorCode.NOT_FOUND);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(AdapterErrorCode.NOT_FOUND);
      expect(error.name).toBe('KiboAdapterError');
    });

    it('should create error with all properties', () => {
      const details = { orderId: '12345' };
      const error = new KiboAdapterError(
        'Order not found',
        AdapterErrorCode.ORDER_NOT_FOUND,
        details,
        404,
      );

      expect(error.message).toBe('Order not found');
      expect(error.code).toBe(AdapterErrorCode.ORDER_NOT_FOUND);
      expect(error.details).toBe(details);
      expect(error.statusCode).toBe(404);
    });

    it('should be an instance of Error', () => {
      const error = new KiboAdapterError('Test', AdapterErrorCode.UNKNOWN);

      expect(error instanceof Error).toBe(true);
      expect(error instanceof KiboAdapterError).toBe(true);
    });

    it('should have a stack trace', () => {
      const error = new KiboAdapterError('Test', AdapterErrorCode.UNKNOWN);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('KiboAdapterError');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const error = new KiboAdapterError(
        'Test error',
        AdapterErrorCode.INVALID_INPUT,
        { field: 'email' },
        400,
      );

      const json = error.toJSON();

      expect(json.name).toBe('KiboAdapterError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe(AdapterErrorCode.INVALID_INPUT);
      expect(json.statusCode).toBe(400);
      expect(json.details).toEqual({ field: 'email' });
    });

    it('should handle undefined optional properties', () => {
      const error = new KiboAdapterError('Test', AdapterErrorCode.UNKNOWN);

      const json = error.toJSON();

      expect(json.statusCode).toBeUndefined();
      expect(json.details).toBeUndefined();
    });
  });
});

// ============================================================================
// AdapterErrorCode Tests
// ============================================================================

describe('AdapterErrorCode', () => {
  it('should have all expected error codes', () => {
    expect(AdapterErrorCode.AUTHENTICATION_FAILED).toBe('AUTHENTICATION_FAILED');
    expect(AdapterErrorCode.CONNECTION_FAILED).toBe('CONNECTION_FAILED');
    expect(AdapterErrorCode.ORDER_NOT_FOUND).toBe('ORDER_NOT_FOUND');
    expect(AdapterErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(AdapterErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
    expect(AdapterErrorCode.INVALID_STATE).toBe('INVALID_STATE');
    expect(AdapterErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(AdapterErrorCode.TIMEOUT).toBe('TIMEOUT');
    expect(AdapterErrorCode.UPSTREAM_ERROR).toBe('UPSTREAM_ERROR');
    expect(AdapterErrorCode.UNKNOWN).toBe('UNKNOWN');
  });
});

// ============================================================================
// isKiboAdapterError Tests
// ============================================================================

describe('isKiboAdapterError', () => {
  it('should return true for KiboAdapterError instances', () => {
    const error = new KiboAdapterError('Test', AdapterErrorCode.UNKNOWN);

    expect(isKiboAdapterError(error)).toBe(true);
  });

  it('should return false for regular Error instances', () => {
    const error = new Error('Test');

    expect(isKiboAdapterError(error)).toBe(false);
  });

  it('should return false for non-error values', () => {
    expect(isKiboAdapterError(null)).toBe(false);
    expect(isKiboAdapterError(undefined)).toBe(false);
    expect(isKiboAdapterError('string')).toBe(false);
    expect(isKiboAdapterError({ message: 'error' })).toBe(false);
  });
});

// ============================================================================
// createErrorFromStatus Tests
// ============================================================================

describe('createErrorFromStatus', () => {
  it('should create INVALID_INPUT error for 400 status', () => {
    const error = createErrorFromStatus(400, 'Bad request');

    expect(error.code).toBe(AdapterErrorCode.INVALID_INPUT);
    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
  });

  it('should create AUTHENTICATION_FAILED error for 401 status', () => {
    const error = createErrorFromStatus(401, 'Unauthorized');

    expect(error.code).toBe(AdapterErrorCode.AUTHENTICATION_FAILED);
    expect(error.statusCode).toBe(401);
  });

  it('should create AUTHENTICATION_FAILED error for 403 status', () => {
    const error = createErrorFromStatus(403, 'Forbidden');

    expect(error.code).toBe(AdapterErrorCode.AUTHENTICATION_FAILED);
    expect(error.statusCode).toBe(403);
  });

  it('should create NOT_FOUND error for 404 status', () => {
    const error = createErrorFromStatus(404, 'Not found');

    expect(error.code).toBe(AdapterErrorCode.NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it('should create INVALID_STATE error for 409 status', () => {
    const error = createErrorFromStatus(409, 'Conflict');

    expect(error.code).toBe(AdapterErrorCode.INVALID_STATE);
    expect(error.statusCode).toBe(409);
  });

  it('should create RATE_LIMITED error for 429 status', () => {
    const error = createErrorFromStatus(429, 'Too many requests');

    expect(error.code).toBe(AdapterErrorCode.RATE_LIMITED);
    expect(error.statusCode).toBe(429);
  });

  it('should create TIMEOUT error for 408 status', () => {
    const error = createErrorFromStatus(408, 'Request timeout');

    expect(error.code).toBe(AdapterErrorCode.TIMEOUT);
    expect(error.statusCode).toBe(408);
  });

  it('should create TIMEOUT error for 504 status', () => {
    const error = createErrorFromStatus(504, 'Gateway timeout');

    expect(error.code).toBe(AdapterErrorCode.TIMEOUT);
    expect(error.statusCode).toBe(504);
  });

  it('should create UPSTREAM_ERROR error for 500 status', () => {
    const error = createErrorFromStatus(500, 'Internal server error');

    expect(error.code).toBe(AdapterErrorCode.UPSTREAM_ERROR);
    expect(error.statusCode).toBe(500);
  });

  it('should create UPSTREAM_ERROR error for 502 status', () => {
    const error = createErrorFromStatus(502, 'Bad gateway');

    expect(error.code).toBe(AdapterErrorCode.UPSTREAM_ERROR);
  });

  it('should create UPSTREAM_ERROR error for 503 status', () => {
    const error = createErrorFromStatus(503, 'Service unavailable');

    expect(error.code).toBe(AdapterErrorCode.UPSTREAM_ERROR);
  });

  it('should create UNKNOWN error for unrecognized status', () => {
    const error = createErrorFromStatus(418, "I'm a teapot");

    expect(error.code).toBe(AdapterErrorCode.UNKNOWN);
    expect(error.statusCode).toBe(418);
  });

  it('should include details in error', () => {
    const details = { extra: 'info' };
    const error = createErrorFromStatus(400, 'Bad request', details);

    expect(error.details).toBe(details);
  });
});
