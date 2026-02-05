/**
 * Jest Test Setup
 *
 * This file runs before all tests to set up the test environment
 * for the Kibo Fulfillment Adapter.
 */

import { jest } from '@jest/globals';

// Set test environment variables for Kibo adapter
process.env.NODE_ENV = 'test';
process.env.KIBO_TENANT_ID = '26507';
process.env.KIBO_SITE_ID = '41315';
process.env.KIBO_CLIENT_ID = 'test-client-id.app.mozu.com';
process.env.KIBO_SHARED_SECRET = 'test-shared-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Silence console.info for debug mode logs
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Add custom matchers for COF types
expect.extend({
  toBeValidOrder(received: unknown) {
    const pass =
      received !== null &&
      typeof received === 'object' &&
      'orderId' in received &&
      typeof (received as Record<string, unknown>).orderId === 'string' &&
      'status' in received &&
      typeof (received as Record<string, unknown>).status === 'string';

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid order`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to be a valid order with orderId and status`,
        pass: false,
      };
    }
  },

  toBeValidHealthStatus(received: unknown) {
    const pass =
      received !== null &&
      typeof received === 'object' &&
      'status' in received &&
      ['healthy', 'unhealthy', 'degraded'].includes(
        (received as Record<string, unknown>).status as string,
      ) &&
      'timestamp' in received;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid health status`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to be a valid health status with status and timestamp`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers TypeScript definitions
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidOrder(): R;
      toBeValidHealthStatus(): R;
    }
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

export {};
