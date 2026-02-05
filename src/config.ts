/**
 * Kibo Adapter Configuration
 *
 * Configuration options for connecting to Kibo Commerce API.
 * Uses @kibocommerce/rest-sdk Configuration class internally.
 */

/**
 * Configuration options for the Kibo Fulfillment Adapter.
 *
 * These credentials are obtained from the Kibo Developer Center:
 * - clientId: Application Key from your Kibo app
 * - sharedSecret: Shared Secret from your Kibo app
 * - tenantId: Your Kibo tenant ID (numeric)
 * - siteId: Your Kibo site ID (numeric)
 */
export interface KiboAdapterOptions {
  /** Kibo tenant ID (numeric string or number) */
  tenantId: string | number;

  /** Kibo site ID (numeric string or number) */
  siteId: string | number;

  /** Kibo application client ID (Application Key) */
  clientId: string;

  /** Kibo application shared secret */
  sharedSecret: string;

  /** Kibo authentication host (default: 'home.mozu.com') */
  authHost?: string;

  /** Kibo API host (auto-detected if not provided) */
  apiHost?: string;

  /** Kibo API environment (e.g., 'sandbox', 'production') */
  apiEnv?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Number of retry attempts for transient failures (default: 3) */
  retries?: number;

  /** Enable debug logging (default: false) */
  debugMode?: boolean;

  /** Default page size for paginated requests (default: 50) */
  pageSize?: number;
}

/**
 * Default configuration values for the Kibo adapter.
 */
export const DEFAULT_CONFIG: Required<
  Pick<KiboAdapterOptions, 'authHost' | 'timeout' | 'retries' | 'debugMode' | 'pageSize'>
> = {
  authHost: 'home.mozu.com',
  timeout: 30000,
  retries: 3,
  debugMode: false,
  pageSize: 50,
};

/**
 * Validates that required configuration options are present.
 *
 * @param options - Configuration options to validate
 * @throws Error if required options are missing
 */
export function validateConfig(options: KiboAdapterOptions): void {
  const required: (keyof KiboAdapterOptions)[] = [
    'tenantId',
    'siteId',
    'clientId',
    'sharedSecret',
  ];

  const missing = required.filter((key) => {
    const value = options[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required Kibo configuration: ${missing.join(', ')}. ` +
        'Ensure tenantId, siteId, clientId, and sharedSecret are provided.',
    );
  }
}

/**
 * Merges user options with defaults.
 *
 * @param options - User-provided configuration options
 * @returns Complete configuration with defaults applied
 */
export function mergeWithDefaults(
  options: KiboAdapterOptions,
): KiboAdapterOptions & typeof DEFAULT_CONFIG {
  return {
    ...DEFAULT_CONFIG,
    ...options,
  };
}
