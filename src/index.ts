/**
 * Main entry point for Kibo Fulfillment Adapter
 *
 * The adapter factory expects a default export of the adapter class.
 * Additional exports are optional for direct usage.
 */

// Default export for the adapter factory to load
import { KiboFulfillmentAdapter } from './adapter.js';
export default KiboFulfillmentAdapter;

// Named export for direct usage
export { KiboFulfillmentAdapter } from './adapter.js';

// Configuration types and utilities
export type { KiboAdapterOptions } from './config.js';
export { validateConfig, mergeWithDefaults, DEFAULT_CONFIG } from './config.js';

// Error types
export {
  KiboAdapterError,
  AdapterErrorCode,
  isKiboAdapterError,
  createErrorFromStatus,
} from './errors.js';
export type { AdapterErrorCodeType } from './errors.js';

// Type definitions
export * from './types.js';
