/**
 * Test Fixtures: Kibo Inventory
 *
 * Sample Kibo inventory payloads for unit testing.
 */

import type { KiboInventoryItem } from '../../src/types.js';

/**
 * Sample Kibo inventory item - In stock.
 */
export const sampleKiboInventoryInStock: KiboInventoryItem = {
  productCode: 'WIDGET-001',
  locationCode: 'WAREHOUSE-01',
  available: 100,
  allocated: 10,
  onHand: 110,
  pending: 5,
};

/**
 * Sample Kibo inventory item - Low stock.
 */
export const sampleKiboInventoryLowStock: KiboInventoryItem = {
  productCode: 'WIDGET-002',
  locationCode: 'WAREHOUSE-01',
  available: 5,
  allocated: 3,
  onHand: 8,
  pending: 0,
};

/**
 * Sample Kibo inventory item - Out of stock.
 */
export const sampleKiboInventoryOutOfStock: KiboInventoryItem = {
  productCode: 'WIDGET-003',
  locationCode: 'WAREHOUSE-01',
  available: 0,
  allocated: 0,
  onHand: 0,
  pending: 10,
};

/**
 * Sample Kibo inventory item - Different location.
 */
export const sampleKiboInventoryLocation2: KiboInventoryItem = {
  productCode: 'WIDGET-001',
  locationCode: 'WAREHOUSE-02',
  available: 50,
  allocated: 0,
  onHand: 50,
  pending: 0,
};

/**
 * Sample Kibo inventory collection.
 */
export const sampleKiboInventoryCollection = {
  items: [
    sampleKiboInventoryInStock,
    sampleKiboInventoryLowStock,
    sampleKiboInventoryOutOfStock,
  ],
  totalCount: 3,
};

/**
 * Empty Kibo inventory collection.
 */
export const emptyKiboInventoryCollection = {
  items: [],
  totalCount: 0,
};

/**
 * Creates a Kibo inventory item with custom overrides.
 */
export function createKiboInventory(
  overrides: Partial<KiboInventoryItem> = {},
): KiboInventoryItem {
  return {
    ...sampleKiboInventoryInStock,
    productCode: `PRODUCT-${Date.now()}`,
    ...overrides,
  };
}
