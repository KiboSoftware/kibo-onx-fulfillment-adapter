/**
 * Test Fixtures: Kibo Products
 *
 * Sample Kibo product payloads for unit testing.
 */

import type { KiboProduct, KiboProductVariation } from '../../src/types.js';

/**
 * Sample Kibo product variation.
 */
export const sampleKiboProductVariation: KiboProductVariation = {
  productCode: 'WIDGET-001',
  variationProductCode: 'WIDGET-001-RED-SM',
  isActive: true,
  price: {
    price: 29.99,
    salePrice: 24.99,
  },
  options: [
    {
      attributeFQN: 'tenant~color',
      value: 'Red',
    },
    {
      attributeFQN: 'tenant~size',
      value: 'Small',
    },
  ],
  inventoryInfo: {
    onlineEnabled: true,
    onlineSoftStockAvailable: 50,
  },
};

/**
 * Sample Kibo product variation - Blue Large.
 */
export const sampleKiboProductVariation2: KiboProductVariation = {
  productCode: 'WIDGET-001',
  variationProductCode: 'WIDGET-001-BLUE-LG',
  isActive: true,
  price: {
    price: 34.99,
    salePrice: undefined,
  },
  options: [
    {
      attributeFQN: 'tenant~color',
      value: 'Blue',
    },
    {
      attributeFQN: 'tenant~size',
      value: 'Large',
    },
  ],
  inventoryInfo: {
    onlineEnabled: true,
    onlineSoftStockAvailable: 25,
  },
};

/**
 * Sample Kibo product - Configurable with variations.
 */
export const sampleKiboProductConfigurable: KiboProduct = {
  productCode: 'WIDGET-001',
  productSequence: 1,
  productName: 'Premium Widget',
  productType: 'Configurable',
  productTypeId: 1,
  isVariation: false,
  productUsage: 'Standard',
  content: {
    productName: 'Premium Widget',
    productShortDescription: 'A high-quality configurable widget',
    productFullDescription:
      'This premium widget comes in multiple colors and sizes. Perfect for all your widget needs.',
  },
  price: {
    price: 29.99,
    salePrice: 24.99,
    isoCurrencyCode: 'USD',
  },
  isActive: true,
  isRecurring: false,
  isTaxable: true,
  inventoryInfo: {
    manageStock: true,
    onlineEnabled: true,
    onlineSoftStockAvailable: 75,
  },
  variations: [sampleKiboProductVariation, sampleKiboProductVariation2],
  auditInfo: {
    createDate: '2025-01-01T00:00:00Z',
    updateDate: '2026-02-04T10:00:00Z',
  },
};

/**
 * Sample Kibo product - Simple (no variations).
 */
export const sampleKiboProductSimple: KiboProduct = {
  productCode: 'GADGET-001',
  productSequence: 2,
  productName: 'Standard Gadget',
  productType: 'Simple',
  productTypeId: 2,
  isVariation: false,
  productUsage: 'Standard',
  content: {
    productName: 'Standard Gadget',
    productShortDescription: 'A reliable standard gadget',
    productFullDescription: 'This gadget does exactly what you need. No frills, just quality.',
  },
  price: {
    price: 19.99,
    isoCurrencyCode: 'USD',
  },
  isActive: true,
  isRecurring: false,
  isTaxable: true,
  inventoryInfo: {
    manageStock: true,
    onlineEnabled: true,
    onlineSoftStockAvailable: 200,
  },
  variations: [],
  auditInfo: {
    createDate: '2025-06-01T00:00:00Z',
    updateDate: '2026-01-15T09:00:00Z',
  },
};

/**
 * Sample Kibo product - Inactive.
 */
export const sampleKiboProductInactive: KiboProduct = {
  ...sampleKiboProductSimple,
  productCode: 'LEGACY-001',
  productName: 'Legacy Product',
  isActive: false,
};

/**
 * Sample Kibo product collection (paginated response).
 */
export const sampleKiboProductCollection = {
  items: [sampleKiboProductConfigurable, sampleKiboProductSimple],
  totalCount: 2,
  pageCount: 1,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Empty Kibo product collection.
 */
export const emptyKiboProductCollection = {
  items: [],
  totalCount: 0,
  pageCount: 0,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Creates a Kibo product with custom overrides.
 */
export function createKiboProduct(overrides: Partial<KiboProduct> = {}): KiboProduct {
  return {
    ...sampleKiboProductSimple,
    productCode: `PRODUCT-${Date.now()}`,
    ...overrides,
  };
}

/**
 * Creates a Kibo product variation with custom overrides.
 */
export function createKiboProductVariation(
  overrides: Partial<KiboProductVariation> = {},
): KiboProductVariation {
  return {
    ...sampleKiboProductVariation,
    variationProductCode: `VAR-${Date.now()}`,
    ...overrides,
  };
}
