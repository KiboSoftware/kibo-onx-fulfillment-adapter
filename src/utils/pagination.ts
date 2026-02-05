/**
 * Pagination Utilities for Kibo API
 *
 * Kibo APIs use offset-based pagination with startIndex and pageSize.
 * These utilities handle fetching all pages transparently.
 */

import type { KiboPaginatedCollection, PaginationOptions } from '../types.js';
import { KiboAdapterError, AdapterErrorCode } from '../errors.js';
import { getErrorMessage, getErrorStatusCode } from './type-guards.js';

/**
 * Default page size for paginated requests.
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum page size allowed by Kibo API.
 */
export const MAX_PAGE_SIZE = 200;

/**
 * Maximum number of items to fetch in a single operation (safety limit).
 */
export const MAX_ITEMS_LIMIT = 10000;

/**
 * Fetcher function type for paginated requests.
 */
export type PageFetcher<T> = (
  startIndex: number,
  pageSize: number,
) => Promise<KiboPaginatedCollection<T>>;

/**
 * Options for fetchAllPages function.
 */
export interface FetchAllPagesOptions {
  /** Page size for each request (default: 50, max: 200) */
  pageSize?: number;

  /** Maximum total items to fetch (default: 10000) */
  maxItems?: number;

  /** Callback for progress updates */
  onProgress?: (fetched: number, total: number) => void;

  /** Whether to continue on rate limit (with backoff) */
  retryOnRateLimit?: boolean;

  /** Maximum retry attempts for rate limits */
  maxRetries?: number;

  /** Initial backoff delay in ms for rate limits */
  initialBackoffMs?: number;
}

/**
 * Fetches all pages from a paginated Kibo API endpoint.
 *
 * This function handles pagination transparently, fetching all pages
 * and combining the results into a single array.
 *
 * @param fetcher - Function that fetches a single page
 * @param options - Pagination options
 * @returns All items across all pages
 *
 * @example
 * ```typescript
 * const allOrders = await fetchAllPages(
 *   (startIndex, pageSize) => orderApi.getOrders({ startIndex, pageSize }),
 *   { pageSize: 50 }
 * );
 * ```
 */
export async function fetchAllPages<T>(
  fetcher: PageFetcher<T>,
  options: FetchAllPagesOptions = {},
): Promise<T[]> {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    maxItems = MAX_ITEMS_LIMIT,
    onProgress,
    retryOnRateLimit = true,
    maxRetries = 3,
    initialBackoffMs = 1000,
  } = options;

  // Validate page size
  const effectivePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const allItems: T[] = [];
  let startIndex = 0;
  let totalCount = Infinity;
  let retryCount = 0;

  while (startIndex < totalCount && allItems.length < maxItems) {
    try {
      const response = await fetcher(startIndex, effectivePageSize);

      // Extract items and total count
      const items = response.items ?? [];
      totalCount = response.totalCount ?? items.length;

      // Add items to result
      allItems.push(...items);

      // Report progress if callback provided
      if (onProgress) {
        onProgress(allItems.length, totalCount);
      }

      // Move to next page
      startIndex += effectivePageSize;

      // Reset retry count on success
      retryCount = 0;

      // Check if we've reached the end
      if (items.length === 0 || items.length < effectivePageSize) {
        break;
      }
    } catch (error: unknown) {
      const statusCode = getErrorStatusCode(error);

      // Handle rate limiting with exponential backoff
      if (statusCode === 429 && retryOnRateLimit && retryCount < maxRetries) {
        retryCount++;
        const backoffMs = initialBackoffMs * Math.pow(2, retryCount - 1);
        await delay(backoffMs);
        continue;
      }

      // Re-throw other errors
      throw new KiboAdapterError(
        `Pagination failed at index ${startIndex}: ${getErrorMessage(error)}`,
        statusCode === 429 ? AdapterErrorCode.RATE_LIMITED : AdapterErrorCode.UPSTREAM_ERROR,
        { startIndex, fetchedSoFar: allItems.length, originalError: error },
        statusCode,
      );
    }
  }

  return allItems;
}

/**
 * Fetches a single page from a paginated endpoint.
 *
 * @param fetcher - Function that fetches a single page
 * @param options - Pagination options (startIndex, pageSize)
 * @returns Page result with items and pagination metadata
 */
export async function fetchPage<T>(
  fetcher: PageFetcher<T>,
  options: PaginationOptions = {},
): Promise<{ items: T[]; totalCount: number; hasMore: boolean }> {
  const { startIndex = 0, pageSize = DEFAULT_PAGE_SIZE } = options;
  const effectivePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const response = await fetcher(startIndex, effectivePageSize);

  const items = response.items ?? [];
  const totalCount = response.totalCount ?? items.length;
  const hasMore = startIndex + items.length < totalCount;

  return { items, totalCount, hasMore };
}

/**
 * Creates pagination parameters for a Kibo API request.
 *
 * @param options - Pagination options
 * @returns Object with startIndex and pageSize
 */
export function createPaginationParams(
  options: PaginationOptions = {},
): { startIndex: number; pageSize: number } {
  const { startIndex = 0, pageSize = DEFAULT_PAGE_SIZE } = options;

  return {
    startIndex: Math.max(0, startIndex),
    pageSize: Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE),
  };
}

/**
 * Delay utility for backoff.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
