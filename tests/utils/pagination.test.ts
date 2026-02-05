/**
 * Unit tests for Pagination Utilities
 *
 * Tests for fetchAllPages, fetchPage, and createPaginationParams.
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  fetchAllPages,
  fetchPage,
  createPaginationParams,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_ITEMS_LIMIT,
} from '../../src/utils/pagination.js';
import type { KiboPaginatedCollection } from '../../src/types.js';
import { KiboAdapterError, AdapterErrorCode } from '../../src/errors.js';

// ============================================================================
// fetchAllPages Tests
// ============================================================================

describe('fetchAllPages', () => {
  describe('basic pagination', () => {
    it('should fetch single page when items fit', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({
          items: [{ id: 1 }, { id: 2 }, { id: 3 }],
          totalCount: 3,
        });

      const result = await fetchAllPages(mockFetcher);

      expect(result).toHaveLength(3);
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(mockFetcher).toHaveBeenCalledWith(0, DEFAULT_PAGE_SIZE);
    });

    it('should fetch multiple pages when needed', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }, { id: 2 }],
          totalCount: 5,
        })
        .mockResolvedValueOnce({
          items: [{ id: 3 }, { id: 4 }],
          totalCount: 5,
        })
        .mockResolvedValueOnce({
          items: [{ id: 5 }],
          totalCount: 5,
        });

      const result = await fetchAllPages(mockFetcher, { pageSize: 2 });

      expect(result).toHaveLength(5);
      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
      expect(mockFetcher).toHaveBeenCalledTimes(3);
    });

    it('should handle empty results', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({
          items: [],
          totalCount: 0,
        });

      const result = await fetchAllPages(mockFetcher);

      expect(result).toHaveLength(0);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined items in response', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({
          items: undefined,
          totalCount: 0,
        });

      const result = await fetchAllPages(mockFetcher);

      expect(result).toHaveLength(0);
    });

    it('should handle undefined totalCount in response', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({
          items: [{ id: 1 }, { id: 2 }],
        });

      const result = await fetchAllPages(mockFetcher);

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('page size handling', () => {
    it('should use default page size', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({ items: [], totalCount: 0 });

      await fetchAllPages(mockFetcher);

      expect(mockFetcher).toHaveBeenCalledWith(0, DEFAULT_PAGE_SIZE);
    });

    it('should respect custom page size', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({ items: [], totalCount: 0 });

      await fetchAllPages(mockFetcher, { pageSize: 25 });

      expect(mockFetcher).toHaveBeenCalledWith(0, 25);
    });

    it('should cap page size at MAX_PAGE_SIZE', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({ items: [], totalCount: 0 });

      await fetchAllPages(mockFetcher, { pageSize: 500 });

      expect(mockFetcher).toHaveBeenCalledWith(0, MAX_PAGE_SIZE);
    });

    it('should enforce minimum page size of 1', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({ items: [], totalCount: 0 });

      await fetchAllPages(mockFetcher, { pageSize: 0 });

      expect(mockFetcher).toHaveBeenCalledWith(0, 1);
    });

    it('should handle negative page size', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValue({ items: [], totalCount: 0 });

      await fetchAllPages(mockFetcher, { pageSize: -10 });

      expect(mockFetcher).toHaveBeenCalledWith(0, 1);
    });
  });

  describe('maxItems limit', () => {
    it('should stop fetching when maxItems is reached', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }, { id: 2 }],
          totalCount: 100,
        })
        .mockResolvedValueOnce({
          items: [{ id: 3 }, { id: 4 }],
          totalCount: 100,
        });

      const result = await fetchAllPages(mockFetcher, { pageSize: 2, maxItems: 3 });

      expect(result.length).toBeLessThanOrEqual(4);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should use default maxItems limit', async () => {
      expect(MAX_ITEMS_LIMIT).toBe(10000);
    });
  });

  describe('progress callback', () => {
    it('should call onProgress for each page', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }, { id: 2 }],
          totalCount: 4,
        })
        .mockResolvedValueOnce({
          items: [{ id: 3 }, { id: 4 }],
          totalCount: 4,
        });

      const onProgress = jest.fn();

      await fetchAllPages(mockFetcher, { pageSize: 2, onProgress });

      expect(onProgress).toHaveBeenCalledTimes(2);
      expect(onProgress).toHaveBeenNthCalledWith(1, 2, 4);
      expect(onProgress).toHaveBeenNthCalledWith(2, 4, 4);
    });
  });

  describe('rate limit handling', () => {
    it('should retry on rate limit with backoff', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({
          items: [{ id: 1 }],
          totalCount: 1,
        });

      const result = await fetchAllPages(mockFetcher, { 
        retryOnRateLimit: true,
        initialBackoffMs: 1, // Use minimal delay for testing
        maxRetries: 3,
      });

      expect(result).toEqual([{ id: 1 }]);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries on rate limit', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValue({ response: { status: 429 } });

      await expect(
        fetchAllPages(mockFetcher, {
          retryOnRateLimit: true,
          maxRetries: 2,
          initialBackoffMs: 1, // Use minimal delay for testing
        })
      ).rejects.toThrow(KiboAdapterError);

      // 1 initial + 2 retries = 3 calls
      expect(mockFetcher).toHaveBeenCalledTimes(3);
    });

    it('should not retry on rate limit when disabled', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValue({ response: { status: 429 } });

      await expect(
        fetchAllPages(mockFetcher, { retryOnRateLimit: false })
      ).rejects.toThrow(KiboAdapterError);

      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should throw KiboAdapterError on non-rate-limit errors', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValue(new Error('Network error'));

      await expect(fetchAllPages(mockFetcher)).rejects.toThrow(KiboAdapterError);
    });

    it('should include context in error', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }],
          totalCount: 10,
        })
        .mockRejectedValueOnce(new Error('Server error'));

      try {
        await fetchAllPages(mockFetcher, { pageSize: 1 });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(KiboAdapterError);
        const kiboError = error as KiboAdapterError;
        expect(kiboError.details).toHaveProperty('startIndex', 1);
        expect(kiboError.details).toHaveProperty('fetchedSoFar', 1);
      }
    });

    it('should set RATE_LIMITED code for 429 errors', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValue({ response: { status: 429 } });

      try {
        await fetchAllPages(mockFetcher, { retryOnRateLimit: false });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(KiboAdapterError);
        expect((error as KiboAdapterError).code).toBe(AdapterErrorCode.RATE_LIMITED);
      }
    });

    it('should set UPSTREAM_ERROR code for non-429 errors', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockRejectedValue({ response: { status: 500 } });

      try {
        await fetchAllPages(mockFetcher);
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(KiboAdapterError);
        expect((error as KiboAdapterError).code).toBe(AdapterErrorCode.UPSTREAM_ERROR);
      }
    });
  });

  describe('stop condition', () => {
    it('should stop when items are fewer than page size', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }, { id: 2 }],
          totalCount: 5,
        })
        .mockResolvedValueOnce({
          items: [{ id: 3 }],
          totalCount: 5,
        });

      const result = await fetchAllPages(mockFetcher, { pageSize: 2 });

      expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });

    it('should stop when empty page is returned', async () => {
      const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
        .mockResolvedValueOnce({
          items: [{ id: 1 }],
          totalCount: 5,
        })
        .mockResolvedValueOnce({
          items: [],
          totalCount: 5,
        });

      const result = await fetchAllPages(mockFetcher, { pageSize: 1 });

      expect(result).toEqual([{ id: 1 }]);
      expect(mockFetcher).toHaveBeenCalledTimes(2);
    });
  });
});

// ============================================================================
// fetchPage Tests
// ============================================================================

describe('fetchPage', () => {
  it('should fetch a single page with default options', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({
        items: [{ id: 1 }, { id: 2 }],
        totalCount: 10,
      });

    const result = await fetchPage(mockFetcher);

    expect(result.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.totalCount).toBe(10);
    expect(result.hasMore).toBe(true);
    expect(mockFetcher).toHaveBeenCalledWith(0, DEFAULT_PAGE_SIZE);
  });

  it('should respect custom startIndex and pageSize', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({
        items: [{ id: 3 }, { id: 4 }],
        totalCount: 10,
      });

    const result = await fetchPage(mockFetcher, { startIndex: 2, pageSize: 2 });

    expect(mockFetcher).toHaveBeenCalledWith(2, 2);
    expect(result.items).toEqual([{ id: 3 }, { id: 4 }]);
  });

  it('should set hasMore to false when at end', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({
        items: [{ id: 9 }, { id: 10 }],
        totalCount: 10,
      });

    const result = await fetchPage(mockFetcher, { startIndex: 8, pageSize: 2 });

    expect(result.hasMore).toBe(false);
  });

  it('should handle undefined items', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({
        items: undefined,
        totalCount: 0,
      });

    const result = await fetchPage(mockFetcher);

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('should handle undefined totalCount', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({
        items: [{ id: 1 }],
      });

    const result = await fetchPage(mockFetcher);

    expect(result.totalCount).toBe(1);
    expect(result.hasMore).toBe(false);
  });

  it('should cap page size at MAX_PAGE_SIZE', async () => {
    const mockFetcher = jest.fn<() => Promise<KiboPaginatedCollection<{ id: number }>>>()
      .mockResolvedValue({ items: [], totalCount: 0 });

    await fetchPage(mockFetcher, { pageSize: 500 });

    expect(mockFetcher).toHaveBeenCalledWith(0, MAX_PAGE_SIZE);
  });
});

// ============================================================================
// createPaginationParams Tests
// ============================================================================

describe('createPaginationParams', () => {
  it('should return default values when no options provided', () => {
    const params = createPaginationParams();

    expect(params.startIndex).toBe(0);
    expect(params.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should use provided startIndex', () => {
    const params = createPaginationParams({ startIndex: 10 });

    expect(params.startIndex).toBe(10);
  });

  it('should use provided pageSize', () => {
    const params = createPaginationParams({ pageSize: 25 });

    expect(params.pageSize).toBe(25);
  });

  it('should enforce minimum startIndex of 0', () => {
    const params = createPaginationParams({ startIndex: -5 });

    expect(params.startIndex).toBe(0);
  });

  it('should enforce minimum pageSize of 1', () => {
    const params = createPaginationParams({ pageSize: 0 });

    expect(params.pageSize).toBe(1);
  });

  it('should cap pageSize at MAX_PAGE_SIZE', () => {
    const params = createPaginationParams({ pageSize: 1000 });

    expect(params.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('should handle negative pageSize', () => {
    const params = createPaginationParams({ pageSize: -10 });

    expect(params.pageSize).toBe(1);
  });

  it('should handle both options together', () => {
    const params = createPaginationParams({ startIndex: 20, pageSize: 30 });

    expect(params.startIndex).toBe(20);
    expect(params.pageSize).toBe(30);
  });
});

// ============================================================================
// Constants Tests
// ============================================================================

describe('Pagination Constants', () => {
  it('should have correct DEFAULT_PAGE_SIZE', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('should have correct MAX_PAGE_SIZE', () => {
    expect(MAX_PAGE_SIZE).toBe(200);
  });

  it('should have correct MAX_ITEMS_LIMIT', () => {
    expect(MAX_ITEMS_LIMIT).toBe(10000);
  });
});
