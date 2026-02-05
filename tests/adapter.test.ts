/**
 * Unit tests for Kibo Fulfillment Adapter
 *
 * TDD tests for KiboFulfillmentAdapter following the task plan.
 * Tests lifecycle methods: connect(), disconnect(), healthCheck()
 */

import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import type { KiboAdapterOptions } from '../src/config.js';
import type { HealthStatus, AdapterConfig } from '@cof-org/mcp';

// ============================================================================
// Mock Setup - Must be done before importing the adapter
// ============================================================================

// Define types for mock responses
interface MockOrdersResponse {
  items: unknown[];
  totalCount: number;
}

interface MockKiboOrder {
  id?: string;
  orderNumber?: number;
  status?: string;
  items?: unknown[];
  total?: number;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

// Define types for mock shipment responses
interface MockShipmentDto {
  id?: string;
  shipmentNumber?: number;
  orderId?: string;
  orderNumber?: number;
  shipmentStatus?: string;
  packages?: Array<{
    packageId?: string;
    trackingNumber?: string;
    carrier?: string;
  }>;
  items?: Array<{
    lineId?: number;
    productCode?: string;
    quantity?: number;
  }>;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

interface MockShipmentsResponse {
  embedded?: { shipments?: MockShipmentDto[] };
  page?: { totalElements?: number };
}

// Define types for mock return responses
interface MockKiboReturn {
  id?: string;
  returnNumber?: number;
  originalOrderId?: string;
  status?: string;
  returnType?: string;
  items?: Array<{
    id?: string;
    productCode?: string;
    quantity?: number;
    returnReason?: string;
  }>;
  refundAmount?: number;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

interface MockReturnsResponse {
  items?: MockKiboReturn[];
  totalCount?: number;
}

// Define types for mock inventory responses
interface MockInventoryResponse {
  locationName?: string;
  locationCode?: string;
  tenantID?: number;
  onHand?: number;
  available?: number;
  allocated?: number;
  pending?: number;
  partNumber?: string;
  sku?: string;
}

// Define types for mock product responses
interface MockKiboProduct {
  productCode?: string;
  productUsage?: string;
  content?: {
    productName?: string;
    productShortDescription?: string;
    productFullDescription?: string;
    productImages?: Array<{ imageUrl?: string }>;
  };
  price?: {
    price?: number;
    salePrice?: number;
  };
  options?: Array<{
    attributeFQN?: string;
    values?: Array<{ value?: string }>;
  }>;
  productInCatalogs?: Array<{ catalogId?: number }>;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

interface MockProductsResponse {
  items?: MockKiboProduct[];
  totalCount?: number;
}

interface MockProductVariation {
  variationProductCode?: string;
  isActive?: boolean;
  deltaPrice?: {
    value?: number;
    currencyCode?: string;
  };
  options?: Array<{
    attributeFQN?: string;
    value?: string;
  }>;
}

interface MockVariationsResponse {
  items?: MockProductVariation[];
  totalCount?: number;
}

// Define types for mock customer responses
interface MockKiboCustomer {
  id?: number;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isAnonymous?: boolean;
  externalId?: string;
  contacts?: Array<{
    address?: {
      address1?: string;
      cityOrTown?: string;
      stateOrProvince?: string;
      postalOrZipCode?: string;
      countryCode?: string;
    };
    phoneNumbers?: {
      mobile?: string;
      home?: string;
    };
  }>;
  auditInfo?: {
    createDate?: string;
    updateDate?: string;
  };
}

interface MockCustomersResponse {
  items?: MockKiboCustomer[];
  totalCount?: number;
}

// Mock the Kibo REST SDK
const mockGetOrders = jest.fn<() => Promise<MockOrdersResponse>>();
const mockCreateOrder = jest.fn<() => Promise<MockKiboOrder>>();
const mockCancelOrder = jest.fn<() => Promise<MockKiboOrder>>();
const mockUpdateOrder = jest.fn<() => Promise<MockKiboOrder>>();
const mockCreatePackageShipments = jest.fn<() => Promise<Array<{ packageId?: string; trackingNumber?: string }>>>();
const mockGetShipment = jest.fn<() => Promise<MockShipmentDto>>();

// ReturnApi mocks
const mockCreateReturn = jest.fn<() => Promise<MockKiboReturn>>();
const mockGetReturns = jest.fn<() => Promise<MockReturnsResponse>>();

// ShipmentApi mocks
const mockGetShipments = jest.fn<() => Promise<MockShipmentsResponse>>();

// InventoryApi mocks
const mockPostQueryInventory = jest.fn<() => Promise<MockInventoryResponse[]>>();

// ProductsApi mocks
const mockGetProducts = jest.fn<() => Promise<MockProductsResponse>>();
const mockGetProduct = jest.fn<() => Promise<MockKiboProduct>>();
const mockGetProductVariations = jest.fn<() => Promise<MockVariationsResponse>>();

// CustomerAccountApi mocks
const mockGetAccounts = jest.fn<() => Promise<MockCustomersResponse>>();
const mockGetAccount = jest.fn<() => Promise<MockKiboCustomer>>();

const mockOrderApiInstance = {
  getOrders: mockGetOrders,
  createOrder: mockCreateOrder,
  cancelOrder: mockCancelOrder,
  updateOrder: mockUpdateOrder,
  createPackageShipments: mockCreatePackageShipments,
  getShipment: mockGetShipment,
};

const mockReturnApiInstance = {
  createReturn: mockCreateReturn,
  getReturns: mockGetReturns,
};

const mockShipmentApiInstance = {
  getShipments: mockGetShipments,
};

const mockInventoryApiInstance = {
  postQueryInventory: mockPostQueryInventory,
};

const mockProductsApiInstance = {
  getProducts: mockGetProducts,
  getProduct: mockGetProduct,
};

const mockProductVariationsApiInstance = {
  getProductVariations: mockGetProductVariations,
};

const mockCustomerAccountApiInstance = {
  getAccounts: mockGetAccounts,
  getAccount: mockGetAccount,
};

const MockOrderApi = jest.fn(() => mockOrderApiInstance);
const MockReturnApi = jest.fn(() => mockReturnApiInstance);
const MockShipmentApi = jest.fn(() => mockShipmentApiInstance);
const MockInventoryApi = jest.fn(() => mockInventoryApiInstance);
const MockProductsApi = jest.fn(() => mockProductsApiInstance);
const MockProductVariationsApi = jest.fn(() => mockProductVariationsApiInstance);
const MockCustomerAccountApi = jest.fn(() => mockCustomerAccountApiInstance);
const MockConfiguration = jest.fn();

jest.unstable_mockModule('@kibocommerce/rest-sdk/clients/Commerce', () => ({
  OrderApi: MockOrderApi,
  ReturnApi: MockReturnApi,
}));

jest.unstable_mockModule('@kibocommerce/rest-sdk/clients/Fulfillment', () => ({
  ShipmentApi: MockShipmentApi,
}));

jest.unstable_mockModule('@kibocommerce/rest-sdk/clients/Inventory', () => ({
  InventoryApi: MockInventoryApi,
}));

jest.unstable_mockModule('@kibocommerce/rest-sdk/clients/CatalogAdministration', () => ({
  ProductsApi: MockProductsApi,
  ProductVariationsApi: MockProductVariationsApi,
}));

jest.unstable_mockModule('@kibocommerce/rest-sdk/clients/Customer', () => ({
  CustomerAccountApi: MockCustomerAccountApi,
}));

jest.unstable_mockModule('@kibocommerce/rest-sdk', () => ({
  Configuration: MockConfiguration,
}));

// Dynamically import the adapter AFTER mocks are set up
let KiboFulfillmentAdapter: typeof import('../src/adapter.js').KiboFulfillmentAdapter;
let KiboAdapterError: typeof import('../src/errors.js').KiboAdapterError;
let AdapterErrorCode: typeof import('../src/errors.js').AdapterErrorCode;
let isKiboAdapterError: typeof import('../src/errors.js').isKiboAdapterError;

beforeAll(async () => {
  const adapterModule = await import('../src/adapter.js');
  const errorsModule = await import('../src/errors.js');

  KiboFulfillmentAdapter = adapterModule.KiboFulfillmentAdapter;
  KiboAdapterError = errorsModule.KiboAdapterError;
  AdapterErrorCode = errorsModule.AdapterErrorCode;
  isKiboAdapterError = errorsModule.isKiboAdapterError;
});

// ============================================================================
// Test Configuration
// ============================================================================

const validConfig: KiboAdapterOptions = {
  tenantId: '26507',
  siteId: '41315',
  clientId: 'test-client-id.app.mozu.com',
  sharedSecret: 'test-shared-secret-12345',
  debugMode: false,
};

// ============================================================================
// Lifecycle Tests (User Story 1: T016-T019)
// ============================================================================

describe('KiboFulfillmentAdapter', () => {
  let adapter: InstanceType<typeof KiboFulfillmentAdapter>;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    MockConfiguration.mockClear();
    MockOrderApi.mockClear();
    MockReturnApi.mockClear();
    MockShipmentApi.mockClear();
    MockInventoryApi.mockClear();
    MockProductsApi.mockClear();
    MockProductVariationsApi.mockClear();
    MockCustomerAccountApi.mockClear();
    mockGetOrders.mockReset();
    mockCreateOrder.mockReset();
    mockCancelOrder.mockReset();
    mockUpdateOrder.mockReset();
    mockCreatePackageShipments.mockReset();
    mockGetShipment.mockReset();
    mockCreateReturn.mockReset();
    mockGetReturns.mockReset();
    mockGetShipments.mockReset();
    mockPostQueryInventory.mockReset();
    mockGetProducts.mockReset();
    mockGetProduct.mockReset();
    mockGetProductVariations.mockReset();
    mockGetAccounts.mockReset();
    mockGetAccount.mockReset();
  });

  afterEach(async () => {
    // Cleanup adapter if it exists
    if (adapter) {
      try {
        await adapter.disconnect();
      } catch {
        // Ignore disconnect errors in cleanup
      }
    }
  });

  describe('constructor', () => {
    it('should create adapter instance with valid config', () => {
      expect(() => {
        adapter = new KiboFulfillmentAdapter(validConfig);
      }).not.toThrow();
    });

    it('should throw error for missing tenantId', () => {
      const config = { ...validConfig, tenantId: '' };
      expect(() => new KiboFulfillmentAdapter(config)).toThrow(
        /Missing required Kibo configuration.*tenantId/,
      );
    });

    it('should throw error for missing siteId', () => {
      const config = { ...validConfig, siteId: '' };
      expect(() => new KiboFulfillmentAdapter(config)).toThrow(
        /Missing required Kibo configuration.*siteId/,
      );
    });

    it('should throw error for missing clientId', () => {
      const config = { ...validConfig, clientId: '' };
      expect(() => new KiboFulfillmentAdapter(config)).toThrow(
        /Missing required Kibo configuration.*clientId/,
      );
    });

    it('should throw error for missing sharedSecret', () => {
      const config = { ...validConfig, sharedSecret: '' };
      expect(() => new KiboFulfillmentAdapter(config)).toThrow(
        /Missing required Kibo configuration.*sharedSecret/,
      );
    });

    it('should accept numeric tenantId and siteId', () => {
      expect(() => {
        adapter = new KiboFulfillmentAdapter({
          ...validConfig,
          tenantId: 26507,
          siteId: 41315,
        });
      }).not.toThrow();
    });
  });

  // T016: Unit test for connect() success
  describe('connect', () => {
    beforeEach(() => {
      adapter = new KiboFulfillmentAdapter(validConfig);
    });

    it('should connect successfully when Kibo API is reachable', async () => {
      // Mock successful order fetch (validates connection)
      mockGetOrders.mockResolvedValue({
        items: [],
        totalCount: 0,
      });

      await expect(adapter.connect()).resolves.not.toThrow();

      // Verify Configuration was created with correct params
      expect(MockConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: '26507',
          siteId: '41315',
          clientId: 'test-client-id.app.mozu.com',
          sharedSecret: 'test-shared-secret-12345',
        }),
      );

      // Verify OrderApi was instantiated
      expect(MockOrderApi).toHaveBeenCalled();
    });

    it('should not reconnect if already connected', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });

      await adapter.connect();
      await adapter.connect(); // Second call should be no-op

      // Configuration should only be created once
      expect(MockConfiguration).toHaveBeenCalledTimes(1);
    });

    // T017: Unit test for connect() failure (invalid credentials)
    it('should throw KiboAdapterError when authentication fails', async () => {
      const authError = new Error('Unauthorized: Invalid credentials');
      (authError as unknown as { statusCode: number }).statusCode = 401;
      mockGetOrders.mockRejectedValue(authError);

      await expect(adapter.connect()).rejects.toThrow(KiboAdapterError);

      try {
        await adapter.connect();
      } catch (error) {
        if (isKiboAdapterError(error)) {
          expect(error.code).toBe(AdapterErrorCode.CONNECTION_FAILED);
          expect(error.message).toContain('Failed to connect to Kibo Commerce');
        }
      }
    });

    it('should throw KiboAdapterError when network fails', async () => {
      mockGetOrders.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(adapter.connect()).rejects.toThrow(KiboAdapterError);
    });

    it('should clear state after connection failure', async () => {
      mockGetOrders.mockRejectedValue(new Error('Connection refused'));

      try {
        await adapter.connect();
      } catch {
        // Expected to throw
      }

      // healthCheck should report unhealthy after failed connect
      const health = await adapter.healthCheck();
      expect(health.status).toBe('unhealthy');
    });
  });

  // T019: Unit test for disconnect()
  describe('disconnect', () => {
    beforeEach(() => {
      adapter = new KiboFulfillmentAdapter(validConfig);
    });

    it('should disconnect successfully', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();

      await expect(adapter.disconnect()).resolves.not.toThrow();
    });

    it('should be safe to call disconnect when not connected', async () => {
      // Should not throw when disconnecting without first connecting
      await expect(adapter.disconnect()).resolves.not.toThrow();
    });

    it('should allow reconnection after disconnect', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });

      await adapter.connect();
      await adapter.disconnect();

      // Reset mock for second connection
      MockConfiguration.mockClear();
      MockOrderApi.mockClear();

      await adapter.connect();

      expect(MockConfiguration).toHaveBeenCalledTimes(1);
      expect(MockOrderApi).toHaveBeenCalledTimes(1);
    });
  });

  // T018: Unit test for healthCheck()
  describe('healthCheck', () => {
    beforeEach(() => {
      adapter = new KiboFulfillmentAdapter(validConfig);
    });

    it('should return unhealthy status when not connected', async () => {
      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.checks).toBeDefined();
      expect(health.checks).toHaveLength(1);
      expect(health.checks?.[0]?.name).toBe('connection');
      expect(health.checks?.[0]?.status).toBe('fail');
      expect(health.checks?.[0]?.message).toContain('Not connected');
    });

    it('should return healthy status when connected and API responds', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();

      const health = await adapter.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.timestamp).toBeDefined();
      expect(health.checks).toBeDefined();
      expect(health.checks?.length).toBeGreaterThanOrEqual(2);

      const apiCheck = health.checks?.find((c: { name: string }) => c.name === 'api_connection');
      expect(apiCheck?.status).toBe('pass');

      const authCheck = health.checks?.find((c: { name: string }) => c.name === 'authentication');
      expect(authCheck?.status).toBe('pass');
    });

    it('should return unhealthy status when connected but API fails', async () => {
      mockGetOrders.mockResolvedValueOnce({ items: [], totalCount: 0 }); // For connect
      await adapter.connect();

      mockGetOrders.mockRejectedValueOnce(new Error('Service unavailable')); // For healthCheck

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.checks?.[0]?.status).toBe('fail');
      expect(health.checks?.[0]?.message).toContain('Health check failed');
    });

    it('should include latency information in healthy response', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();

      const health = await adapter.healthCheck();

      expect(health.status).toBe('healthy');
      const apiCheck = health.checks?.find((c: { name: string }) => c.name === 'api_connection');
      expect(apiCheck?.duration).toBeDefined();
      expect(typeof apiCheck?.duration).toBe('number');
    });

    it('should include tenant and site info in details', async () => {
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();

      const health: HealthStatus = await adapter.healthCheck();

      expect(health.details).toBeDefined();
      expect(health.details?.tenantId).toBe('26507');
      expect(health.details?.siteId).toBe('41315');
    });
  });

  // Optional lifecycle methods
  describe('optional lifecycle methods', () => {
    beforeEach(() => {
      adapter = new KiboFulfillmentAdapter(validConfig);
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
    });

    it('should support initialize() with new config', async () => {
      const newConfig: KiboAdapterOptions = {
        tenantId: '99999',
        siteId: '41315',
        clientId: 'test-client-id.app.mozu.com',
        sharedSecret: 'test-shared-secret-12345',
        debugMode: true,
      };

      // AdapterConfig expects options property
      await adapter.initialize?.({ options: newConfig } as unknown as AdapterConfig);

      // Connect with new config
      await adapter.connect();

      expect(MockConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: '99999',
        }),
      );
    });

    it('should support cleanup() to fully disconnect', async () => {
      await adapter.connect();
      await adapter.cleanup?.();

      const health = await adapter.healthCheck();
      expect(health.status).toBe('unhealthy');
    });

    it('should support checkHealth() as alias for healthCheck()', async () => {
      await adapter.connect();

      const health1 = await adapter.healthCheck();
      const health2 = await adapter.checkHealth?.();

      expect(health1.status).toBe(health2?.status);
    });

    it('should return capabilities via getCapabilities()', async () => {
      const capabilities = await adapter.getCapabilities?.();

      expect(capabilities).toBeDefined();
      expect(capabilities?.supportsOrderCapture).toBe(true);
      expect(capabilities?.supportsShipping).toBe(true);
    });
  });

  // ==========================================================================
  // Order Methods (User Story 2: T024-T028)
  // ==========================================================================

  describe('Order Methods', () => {
    const mockKiboOrder: MockKiboOrder = {
      id: 'kibo-order-123',
      orderNumber: 12345,
      status: 'Accepted',
      items: [
        {
          id: 'item-1',
          quantity: 2,
          product: {
            productCode: 'TEST-SKU',
            name: 'Test Product',
            price: { price: 29.99 },
          },
        },
      ],
      total: 59.98,
      auditInfo: {
        createDate: '2024-01-01T00:00:00Z',
        updateDate: '2024-01-01T00:00:00Z',
      },
    };

    beforeEach(async () => {
      adapter = new KiboFulfillmentAdapter(validConfig);
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();
    });

    describe('createSalesOrder', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          order: {
            lineItems: [{ sku: 'TEST-SKU', quantity: 1 }],
          },
        };

        await expect(adapter.createSalesOrder(input)).rejects.toThrow(
          /not connected/i,
        );
      });

      it('should create an order successfully', async () => {
        mockCreateOrder.mockResolvedValue(mockKiboOrder);

        const input = {
          order: {
            lineItems: [{ sku: 'TEST-SKU', quantity: 2 }],
          },
        };

        const result = await adapter.createSalesOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order).toBeDefined();
          expect(result.order.id).toBe('12345');
        }
        expect(mockCreateOrder).toHaveBeenCalledTimes(1);
      });

      it('should throw KiboAdapterError on API failure', async () => {
        mockCreateOrder.mockRejectedValue(new Error('API Error'));

        const input = {
          order: {
            lineItems: [{ sku: 'TEST-SKU', quantity: 1 }],
          },
        };

        await expect(adapter.createSalesOrder(input)).rejects.toThrow(
          /Failed to create order/i,
        );
      });
    });

    describe('getOrders', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        await expect(adapter.getOrders({})).rejects.toThrow(/not connected/i);
      });

      it('should return orders successfully', async () => {
        mockGetOrders.mockResolvedValue({
          items: [mockKiboOrder],
          totalCount: 1,
        });

        const result = await adapter.getOrders({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.orders).toHaveLength(1);
          expect(result.orders[0]!.id).toBe('12345');
        }
      });

      it('should return empty array when no orders', async () => {
        mockGetOrders.mockResolvedValue({
          items: [],
          totalCount: 0,
        });

        const result = await adapter.getOrders({});

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.orders).toHaveLength(0);
        }
      });

      it('should apply status filters', async () => {
        mockGetOrders.mockResolvedValue({
          items: [mockKiboOrder],
          totalCount: 1,
        });

        await adapter.getOrders({ statuses: ['Accepted', 'Shipped'] });

        expect(mockGetOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            filter: expect.stringContaining('status'),
          }),
        );
      });
    });

    describe('updateOrder', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          id: 'order-123',
          updates: {},
        };

        await expect(adapter.updateOrder(input)).rejects.toThrow(/not connected/i);
      });

      it('should update an order successfully', async () => {
        mockUpdateOrder.mockResolvedValue({ ...mockKiboOrder, status: 'Updated' });

        const input = {
          id: 'kibo-order-123',
          updates: { status: 'Updated' },
        };

        const result = await adapter.updateOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order).toBeDefined();
        }
        expect(mockUpdateOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: 'kibo-order-123',
          }),
        );
      });
    });

    describe('cancelOrder', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          orderId: 'order-123',
        };

        await expect(adapter.cancelOrder(input)).rejects.toThrow(/not connected/i);
      });

      it('should cancel an order successfully', async () => {
        mockCancelOrder.mockResolvedValue({ ...mockKiboOrder, status: 'Cancelled' });

        const input = {
          orderId: 'kibo-order-123',
          reason: 'Customer request',
        };

        const result = await adapter.cancelOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.order).toBeDefined();
        }
        expect(mockCancelOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: 'kibo-order-123',
            commerceRuntimeCanceledReason: expect.objectContaining({
              reasonCode: 'Customer request',
            }),
          }),
        );
      });

      it('should throw on cancel API failure', async () => {
        mockCancelOrder.mockRejectedValue(new Error('Cancel failed'));

        const input = {
          orderId: 'order-123',
        };

        await expect(adapter.cancelOrder(input)).rejects.toThrow(
          /Failed to cancel order/i,
        );
      });
    });
  });

  // ==========================================================================
  // Fulfillment Methods Tests (User Story 3: T036-T039)
  // ==========================================================================

  describe('Fulfillment Methods', () => {
    // Sample mock data for fulfillments
    const mockKiboShipment: MockShipmentDto = {
      id: 'shipment-001',
      shipmentNumber: 500001,
      orderId: 'order-12345',
      orderNumber: 100001,
      shipmentStatus: 'Shipped',
      packages: [
        {
          packageId: 'pkg-001',
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
        },
      ],
      items: [
        {
          lineId: 1,
          productCode: 'WIDGET-001',
          quantity: 2,
        },
      ],
      auditInfo: {
        createDate: '2026-02-04T11:00:00Z',
        updateDate: '2026-02-04T14:00:00Z',
      },
    };

    const mockKiboReturn: MockKiboReturn = {
      id: 'return-001',
      returnNumber: 600001,
      originalOrderId: 'order-12345',
      status: 'Created',
      returnType: 'Refund',
      items: [
        {
          id: 'item-001',
          productCode: 'WIDGET-001',
          quantity: 1,
          returnReason: 'Defective',
        },
      ],
      refundAmount: 29.99,
      auditInfo: {
        createDate: '2026-02-04T11:00:00Z',
        updateDate: '2026-02-04T11:00:00Z',
      },
    };

    beforeEach(async () => {
      // Setup: Connect the adapter before each test
      adapter = new KiboFulfillmentAdapter(validConfig);
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();
    });

    describe('fulfillOrder (T036)', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          orderId: 'order-12345',
          lineItems: [{ sku: 'WIDGET-001', quantity: 2 }],
          trackingNumbers: ['1Z999AA10123456784'],
        };

        await expect(adapter.fulfillOrder(input)).rejects.toThrow(/not connected/i);
      });

      it('should fulfill an order successfully', async () => {
        mockGetShipments.mockResolvedValue({
          embedded: { shipments: [mockKiboShipment] },
          page: { totalElements: 1 },
        });

        const input = {
          orderId: 'order-12345',
          lineItems: [{ sku: 'WIDGET-001', quantity: 2 }],
          trackingNumbers: ['1Z999AA10123456784'],
        };

        const result = await adapter.fulfillOrder(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.fulfillment).toBeDefined();
          expect(result.fulfillment.orderId).toBe('order-12345');
          expect(result.fulfillment.trackingNumbers).toContain('1Z999AA10123456784');
        }
      });
    });

    describe('getFulfillments (T037)', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          orderIds: ['order-12345'],
        };

        await expect(adapter.getFulfillments(input)).rejects.toThrow(/not connected/i);
      });

      it('should get fulfillments by orderId', async () => {
        mockGetShipments.mockResolvedValue({
          embedded: { shipments: [mockKiboShipment] },
          page: { totalElements: 1 },
        });

        const input = {
          orderIds: ['order-12345'],
        };

        const result = await adapter.getFulfillments(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.fulfillments).toHaveLength(1);
          expect(result.fulfillments[0]?.orderId).toBe('order-12345');
        }
      });

      it('should return empty array when no fulfillments found', async () => {
        mockGetShipments.mockResolvedValue({
          embedded: { shipments: [] },
          page: { totalElements: 0 },
        });

        const input = {
          orderIds: ['nonexistent-order'],
        };

        const result = await adapter.getFulfillments(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.fulfillments).toHaveLength(0);
        }
      });
    });

    describe('createReturn (T038)', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          return: {
            orderId: 'order-12345',
            outcome: 'REFUND',
            returnLineItems: [
              {
                orderLineItemId: 'item-001',
                sku: 'WIDGET-001',
                quantityReturned: 1,
                returnReason: 'defective',
              },
            ],
          },
        };

        await expect(adapter.createReturn(input)).rejects.toThrow(/not connected/i);
      });

      it('should create a return successfully', async () => {
        mockCreateReturn.mockResolvedValue(mockKiboReturn);

        const input = {
          return: {
            orderId: 'order-12345',
            outcome: 'REFUND',
            returnLineItems: [
              {
                orderLineItemId: 'item-001',
                sku: 'WIDGET-001',
                quantityReturned: 1,
                returnReason: 'defective',
              },
            ],
          },
        };

        const result = await adapter.createReturn(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.return).toBeDefined();
          expect(result.return.orderId).toBe('order-12345');
        }
      });
    });

    describe('getReturns (T039)', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          orderIds: ['order-12345'],
        };

        await expect(adapter.getReturns(input)).rejects.toThrow(/not connected/i);
      });

      it('should get returns by orderId', async () => {
        mockGetReturns.mockResolvedValue({
          items: [mockKiboReturn],
          totalCount: 1,
        });

        const input = {
          orderIds: ['order-12345'],
        };

        const result = await adapter.getReturns(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.returns).toHaveLength(1);
          expect(result.returns[0]?.orderId).toBe('order-12345');
        }
      });

      it('should return empty array when no returns found', async () => {
        mockGetReturns.mockResolvedValue({
          items: [],
          totalCount: 0,
        });

        const input = {
          orderIds: ['nonexistent-order'],
        };

        const result = await adapter.getReturns(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.returns).toHaveLength(0);
        }
      });
    });
  });

  // ==========================================================================
  // Inventory Methods (User Story 4: T046-T051)
  // ==========================================================================

  describe('Inventory Methods', () => {
    const mockKiboInventory: MockInventoryResponse = {
      locationName: 'Main Warehouse',
      locationCode: 'WH-001',
      tenantID: 26507,
      onHand: 100,
      available: 85,
      allocated: 10,
      pending: 5,
      partNumber: 'WIDGET-001',
      sku: 'SKU-WIDGET-001',
    };

    beforeEach(async () => {
      adapter = new KiboFulfillmentAdapter(validConfig);
      mockGetOrders.mockResolvedValue({ items: [], totalCount: 0 });
      await adapter.connect();
    });

    describe('getInventory (T046-T048)', () => {
      it('should throw not connected error when not connected', async () => {
        await adapter.disconnect();

        const input = {
          skus: ['SKU-001'],
        };

        await expect(adapter.getInventory(input)).rejects.toThrow(/not connected/i);
      });

      it('should get inventory by SKU', async () => {
        mockPostQueryInventory.mockResolvedValue([mockKiboInventory]);

        const input = {
          skus: ['SKU-WIDGET-001'],
        };

        const result = await adapter.getInventory(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.inventory).toHaveLength(1);
          expect(result.inventory[0]?.sku).toBe('SKU-WIDGET-001');
          expect(result.inventory[0]?.available).toBe(85);
          expect(result.inventory[0]?.onHand).toBe(100);
          expect(result.inventory[0]?.unavailable).toBe(15); // allocated + pending
          expect(result.inventory[0]?.locationId).toBe('WH-001');
        }
      });

      it('should get inventory by location', async () => {
        mockPostQueryInventory.mockResolvedValue([mockKiboInventory]);

        const input = {
          skus: ['SKU-WIDGET-001'],
          locationIds: ['WH-001'],
        };

        const result = await adapter.getInventory(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.inventory).toHaveLength(1);
          expect(result.inventory[0]?.locationId).toBe('WH-001');
        }
      });

      it('should return empty array when no inventory found', async () => {
        mockPostQueryInventory.mockResolvedValue([]);

        const input = {
          skus: ['NONEXISTENT-SKU'],
        };

        const result = await adapter.getInventory(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.inventory).toHaveLength(0);
        }
      });

      it('should handle multiple SKUs', async () => {
        const multiInventory = [
          { ...mockKiboInventory, sku: 'SKU-001' },
          { ...mockKiboInventory, sku: 'SKU-002', locationCode: 'WH-002' },
        ];
        mockPostQueryInventory.mockResolvedValue(multiInventory);

        const input = {
          skus: ['SKU-001', 'SKU-002'],
        };

        const result = await adapter.getInventory(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.inventory).toHaveLength(2);
        }
      });
    });
  });

  // ============================================================================
  // Product Methods (User Story 5: T052-T058)
  // ============================================================================

  describe('Product Methods', () => {
    const mockKiboProduct: MockKiboProduct = {
      productCode: 'PROD-001',
      productUsage: 'Standard',
      content: {
        productName: 'Test Widget',
        productShortDescription: 'A test widget',
        productFullDescription: 'A full description of the test widget',
        productImages: [{ imageUrl: 'https://example.com/img.jpg' }],
      },
      price: {
        price: 29.99,
        salePrice: 24.99,
      },
      options: [
        { attributeFQN: 'color', values: [{ value: 'Red' }, { value: 'Blue' }] },
      ],
      productInCatalogs: [{ catalogId: 1 }],
      auditInfo: {
        createDate: '2026-01-01T10:00:00Z',
        updateDate: '2026-01-15T12:00:00Z',
      },
    };

    const mockKiboVariation: MockProductVariation = {
      variationProductCode: 'PROD-001-RED',
      isActive: true,
      deltaPrice: {
        value: 5.00,
        currencyCode: 'USD',
      },
      options: [
        { attributeFQN: 'color', value: 'Red' },
      ],
    };

    beforeEach(async () => {
      adapter = new KiboFulfillmentAdapter(validConfig);
      await adapter.connect();
    });

    describe('getProducts', () => {
      it('should fetch products with filter', async () => {
        mockGetProducts.mockResolvedValue({
          items: [mockKiboProduct],
          totalCount: 1,
        });

        const input = {
          skus: ['PROD-001'],
        };

        const result = await adapter.getProducts(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.products).toHaveLength(1);
          expect(result.products[0]?.id).toBe('PROD-001');
          expect(result.products[0]?.name).toBe('Test Widget');
        }
      });

      it('should handle empty product results', async () => {
        mockGetProducts.mockResolvedValue({
          items: [],
          totalCount: 0,
        });

        const input = {};

        const result = await adapter.getProducts(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.products).toHaveLength(0);
        }
      });

      it('should pass pagination parameters', async () => {
        mockGetProducts.mockResolvedValue({
          items: [mockKiboProduct],
          totalCount: 100,
        });

        const input = {
          pageSize: 10,
          skip: 20,
        };

        const result = await adapter.getProducts(input);

        expect(result.success).toBe(true);
        expect(mockGetProducts).toHaveBeenCalled();
      });

      it('should handle API errors gracefully', async () => {
        mockGetProducts.mockRejectedValue(new Error('Product API Error'));

        const input = {};

        await expect(adapter.getProducts(input)).rejects.toThrow('Product API Error');
      });
    });

    describe('getProductVariants', () => {
      it('should fetch product variants by productId', async () => {
        mockGetProductVariations.mockResolvedValue({
          items: [mockKiboVariation],
          totalCount: 1,
        });

        const input = {
          productIds: ['PROD-001'],
        };

        const result = await adapter.getProductVariants(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.productVariants).toHaveLength(1);
          expect(result.productVariants[0]?.sku).toBe('PROD-001-RED');
          expect(result.productVariants[0]?.productId).toBe('PROD-001');
        }
      });

      it('should handle product with no variants', async () => {
        mockGetProductVariations.mockResolvedValue({
          items: [],
          totalCount: 0,
        });

        const input = {
          productIds: ['SIMPLE-PROD'],
        };

        const result = await adapter.getProductVariants(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.productVariants).toHaveLength(0);
        }
      });

      it('should map selected options correctly', async () => {
        mockGetProductVariations.mockResolvedValue({
          items: [mockKiboVariation],
          totalCount: 1,
        });

        const input = {
          productIds: ['PROD-001'],
        };

        const result = await adapter.getProductVariants(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.productVariants[0]?.selectedOptions).toHaveLength(1);
          expect(result.productVariants[0]?.selectedOptions?.[0]?.name).toBe('color');
          expect(result.productVariants[0]?.selectedOptions?.[0]?.value).toBe('Red');
        }
      });

      it('should handle API errors gracefully', async () => {
        mockGetProductVariations.mockRejectedValue(new Error('Variations API Error'));

        const input = {
          productIds: ['PROD-001'],
        };

        await expect(adapter.getProductVariants(input)).rejects.toThrow('Variations API Error');
      });
    });
  });

  // ============================================================================
  // Customer Methods (User Story 6: T059-T063)
  // ============================================================================

  describe('Customer Methods', () => {
    const mockKiboCustomer: MockKiboCustomer = {
      id: 1001,
      emailAddress: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
      isAnonymous: false,
      externalId: 'EXT-1001',
      contacts: [
        {
          address: {
            address1: '123 Main St',
            cityOrTown: 'Springfield',
            stateOrProvince: 'IL',
            postalOrZipCode: '62701',
            countryCode: 'US',
          },
          phoneNumbers: {
            mobile: '555-1234',
          },
        },
      ],
      auditInfo: {
        createDate: '2026-01-01T10:00:00Z',
        updateDate: '2026-01-15T12:00:00Z',
      },
    };

    beforeEach(async () => {
      adapter = new KiboFulfillmentAdapter(validConfig);
      await adapter.connect();
    });

    describe('getCustomers', () => {
      it('should fetch customers by email', async () => {
        mockGetAccounts.mockResolvedValue({
          items: [mockKiboCustomer],
          totalCount: 1,
        });

        const input = {
          emails: ['john.doe@example.com'],
        };

        const result = await adapter.getCustomers(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.customers).toHaveLength(1);
          expect(result.customers[0]?.id).toBe('1001');
          expect(result.customers[0]?.email).toBe('john.doe@example.com');
        }
      });

      it('should fetch customers by customerId', async () => {
        mockGetAccounts.mockResolvedValue({
          items: [mockKiboCustomer],
          totalCount: 1,
        });

        const input = {
          ids: ['1001'],
        };

        const result = await adapter.getCustomers(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.customers).toHaveLength(1);
          expect(result.customers[0]?.firstName).toBe('John');
          expect(result.customers[0]?.lastName).toBe('Doe');
        }
      });

      it('should handle empty customer results', async () => {
        mockGetAccounts.mockResolvedValue({
          items: [],
          totalCount: 0,
        });

        const input = {};

        const result = await adapter.getCustomers(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.customers).toHaveLength(0);
        }
      });

      it('should handle API errors gracefully', async () => {
        mockGetAccounts.mockRejectedValue(new Error('Customer API Error'));

        const input = {};

        await expect(adapter.getCustomers(input)).rejects.toThrow('Customer API Error');
      });
    });
  });
});
