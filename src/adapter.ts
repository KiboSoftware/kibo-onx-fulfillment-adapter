/**
 * Kibo Fulfillment Adapter Implementation
 *
 * Implements IFulfillmentAdapter using @kibocommerce/rest-sdk.
 * Maps Kibo Commerce API to COF types.
 */

import { Configuration } from '@kibocommerce/rest-sdk';
import { OrderApi, ReturnApi } from '@kibocommerce/rest-sdk/clients/Commerce';
import { ShipmentApi } from '@kibocommerce/rest-sdk/clients/Fulfillment';
import { InventoryApi } from '@kibocommerce/rest-sdk/clients/Inventory';
import {
  ProductsApi,
  ProductVariationsApi,
} from '@kibocommerce/rest-sdk/clients/CatalogAdministration';
import { CustomerAccountApi } from '@kibocommerce/rest-sdk/clients/Customer';
import type {
  IFulfillmentAdapter,
  AdapterConfig,
  AdapterCapabilities,
  HealthStatus,
  OrderResult,
  ReturnResult,
  FulfillmentToolResult,
  Order,
  Fulfillment,
  Return,
  InventoryItem,
  Product,
  ProductVariant,
  Customer,
  CreateSalesOrderInput,
  CreateReturnInput,
  CancelOrderInput,
  UpdateOrderInput,
  FulfillOrderInput,
  GetOrdersInput,
  GetInventoryInput,
  GetProductsInput,
  GetProductVariantsInput,
  GetCustomersInput,
  GetFulfillmentsInput,
  GetReturnsInput,
} from '@cof-org/mcp';

import type { KiboAdapterOptions } from './config.js';
import { validateConfig, mergeWithDefaults, DEFAULT_CONFIG } from './config.js';
import { KiboAdapterError, AdapterErrorCode } from './errors.js';
import { withErrorMapping } from './utils/error-mapper.js';
import { getErrorMessage } from './utils/type-guards.js';
import { mapKiboOrderToCOF, mapCOFOrderInputToKibo } from './utils/transformers/order.js';
import { mapKiboShipmentToCOF } from './utils/transformers/shipment.js';
import { mapKiboReturnToCOF } from './utils/transformers/return.js';
import { mapKiboInventoryListToCOF } from './utils/transformers/inventory.js';
import {
  mapKiboProductListToCOF,
  mapKiboVariantListToCOF,
} from './utils/transformers/product.js';
import { mapKiboCustomerListToCOF } from './utils/transformers/customer.js';
import type { KiboOrder, KiboShipment, KiboReturn } from './types.js';

// ============================================================================
// Kibo API Client Types
// ============================================================================

/**
 * Collection of Kibo API clients used by the adapter.
 */
interface KiboApiClients {
  orderApi: OrderApi;
  returnApi: ReturnApi;
  shipmentApi: ShipmentApi;
  inventoryApi: InventoryApi;
  productsApi: ProductsApi;
  productVariationsApi: ProductVariationsApi;
  customerAccountApi: CustomerAccountApi;
}

// ============================================================================
// KiboFulfillmentAdapter Class
// ============================================================================

/**
 * Kibo Commerce fulfillment adapter.
 *
 * Implements the IFulfillmentAdapter interface to bridge COF MCP server
 * to Kibo Commerce APIs using the official @kibocommerce/rest-sdk.
 *
 * @example
 * ```typescript
 * const adapter = new KiboFulfillmentAdapter({
 *   tenantId: '26507',
 *   siteId: '41315',
 *   clientId: 'YOUR_APP_KEY',
 *   sharedSecret: 'your-shared-secret',
 * });
 *
 * await adapter.connect();
 * const health = await adapter.healthCheck();
 * console.log('Connected:', health.status);
 * ```
 */
export class KiboFulfillmentAdapter implements IFulfillmentAdapter {
  private _options: KiboAdapterOptions & typeof DEFAULT_CONFIG;
  private _configuration: Configuration | null = null;
  private _clients: KiboApiClients | null = null;
  private _connected = false;

  /**
   * Creates a new Kibo Fulfillment Adapter instance.
   *
   * @param config - Adapter configuration (from COF MCP server or direct options)
   */
  constructor(config: AdapterConfig | KiboAdapterOptions) {
    // Handle both AdapterConfig (from MCP server) and direct options
    const options = this.extractOptions(config);
    validateConfig(options);
    this._options = mergeWithDefaults(options);
  }

  // ==========================================================================
  // Lifecycle Methods (User Story 1)
  // ==========================================================================

  /**
   * Optional initialization hook called by MCP server.
   */
  async initialize?(config: AdapterConfig): Promise<void> {
    const options = this.extractOptions(config);
    validateConfig(options);
    this._options = mergeWithDefaults(options);
  }

  /**
   * Connects to Kibo Commerce API.
   *
   * Initializes the SDK Configuration with OAuth credentials and
   * creates API client instances. Validates connectivity by making
   * a lightweight API call.
   *
   * @throws KiboAdapterError if connection fails
   */
  async connect(): Promise<void> {
    if (this._connected) {
      return; // Already connected
    }

    try {
      // Create SDK Configuration with OAuth credentials
      this._configuration = new Configuration({
        tenantId: String(this._options.tenantId),
        siteId: String(this._options.siteId),
        clientId: this._options.clientId,
        sharedSecret: this._options.sharedSecret,
        authHost: this._options.authHost,
        apiHost: this._options.apiHost,
        apiEnv: this._options.apiEnv,
      });

      // Initialize API clients
      this._clients = {
        orderApi: new OrderApi(this._configuration),
        returnApi: new ReturnApi(this._configuration),
        shipmentApi: new ShipmentApi(this._configuration),
        inventoryApi: new InventoryApi(this._configuration),
        productsApi: new ProductsApi(this._configuration),
        productVariationsApi: new ProductVariationsApi(this._configuration),
        customerAccountApi: new CustomerAccountApi(this._configuration),
      };

      // Validate connection by making a lightweight API call
      // The SDK will automatically handle OAuth token exchange
      await this.validateConnection();

      this._connected = true;

      if (this._options.debugMode) {
        console.info('[KiboAdapter] Successfully connected to Kibo Commerce');
      }
    } catch (error: unknown) {
      this._connected = false;
      this._configuration = null;
      this._clients = null;

      throw new KiboAdapterError(
        `Failed to connect to Kibo Commerce: ${getErrorMessage(error)}`,
        AdapterErrorCode.CONNECTION_FAILED,
        error,
      );
    }
  }

  /**
   * Disconnects from Kibo Commerce API.
   *
   * Clears cached API clients and configuration.
   */
  async disconnect(): Promise<void> {
    this._connected = false;
    this._clients = null;
    // Note: Configuration is kept to allow reconnection

    if (this._options.debugMode) {
      console.info('[KiboAdapter] Disconnected from Kibo Commerce');
    }
  }

  /**
   * Optional cleanup hook called by MCP server.
   */
  async cleanup?(): Promise<void> {
    await this.disconnect();
    this._configuration = null;
  }

  /**
   * Checks the health of the Kibo Commerce connection.
   *
   * @returns Health status with connection and authentication checks
   */
  async healthCheck(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();

    if (!this._connected || !this._clients) {
      return {
        status: 'unhealthy',
        timestamp,
        checks: [
          {
            name: 'connection',
            status: 'fail',
            message: 'Not connected to Kibo Commerce',
          },
        ],
      };
    }

    try {
      const startTime = Date.now();

      // Make a lightweight API call to verify connectivity
      await this.validateConnection();

      const latencyMs = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp,
        checks: [
          {
            name: 'api_connection',
            status: 'pass',
            message: 'Kibo Commerce API is reachable',
            duration: latencyMs,
          },
          {
            name: 'authentication',
            status: 'pass',
            message: 'OAuth authentication successful',
          },
        ],
        version: '1.0.0',
        details: {
          tenantId: this._options.tenantId,
          siteId: this._options.siteId,
          latencyMs,
        },
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        timestamp,
        checks: [
          {
            name: 'api_connection',
            status: 'fail',
            message: `Health check failed: ${getErrorMessage(error)}`,
          },
        ],
      };
    }
  }

  /**
   * Alias for healthCheck (COF compatibility).
   */
  async checkHealth?(): Promise<HealthStatus> {
    return this.healthCheck();
  }

  /**
   * Returns adapter capabilities.
   */
  async getCapabilities?(): Promise<AdapterCapabilities> {
    return {
      supportsOrderCapture: true,
      supportsShipping: true,
      supportsCustomFields: true,
      maxBatchSize: this._options.pageSize,
    };
  }

  /**
   * Updates adapter configuration.
   */
  async updateConfig?(config: AdapterConfig): Promise<void> {
    const options = this.extractOptions(config);
    validateConfig(options);
    this._options = mergeWithDefaults(options);

    // Reconnect with new configuration if currently connected
    if (this._connected) {
      await this.disconnect();
      await this.connect();
    }
  }

  // ==========================================================================
  // Order Methods (User Story 2)
  // ==========================================================================

  /**
   * Creates a new sales order in Kibo Commerce.
   *
   * @param input - COF create sales order input
   * @returns Order result with created order or error
   */
  async createSalesOrder(input: CreateSalesOrderInput): Promise<OrderResult> {
    this.ensureConnected();

    try {
      // Map COF input to Kibo order format
      const kiboOrderRequest = mapCOFOrderInputToKibo(input);

      // Create order via Kibo API
      // Using unknown cast because Kibo SDK types don't match our simplified request structure
      const kiboOrder = await withErrorMapping(
        async () => {
          return await this._clients!.orderApi.createOrder({
            order: kiboOrderRequest as unknown as Record<string, unknown>,
          });
        },
        'Failed to create order',
      );

      // Map Kibo order to COF order
      const cofOrder = mapKiboOrderToCOF(
        kiboOrder as unknown as KiboOrder,
        String(this._options.tenantId),
      );

      return {
        success: true,
        order: cofOrder,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to create order: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Cancels an existing order in Kibo Commerce.
   *
   * @param input - COF cancel order input (requires orderId)
   * @returns Order result with cancelled order or error
   */
  async cancelOrder(input: CancelOrderInput): Promise<OrderResult> {
    this.ensureConnected();

    try {
      const { orderId, reason } = input;

      // Cancel order via Kibo API
      const kiboOrder = await withErrorMapping(
        async () => {
          return await this._clients!.orderApi.cancelOrder({
            orderId,
            commerceRuntimeCanceledReason: reason
              ? { reasonCode: reason, description: reason }
              : undefined,
          });
        },
        'Failed to cancel order',
      );

      // Map Kibo order to COF order
      const cofOrder = mapKiboOrderToCOF(
        kiboOrder as unknown as KiboOrder,
        String(this._options.tenantId),
      );

      return {
        success: true,
        order: cofOrder,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to cancel order: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Updates an existing order in Kibo Commerce.
   *
   * @param input - COF update order input (requires id and updates)
   * @returns Order result with updated order or error
   */
  async updateOrder(input: UpdateOrderInput): Promise<OrderResult> {
    this.ensureConnected();

    try {
      const { id: orderId, updates } = input;

      // Update order via Kibo API
      // Using unknown cast because Kibo SDK types don't match our simplified request structure
      const kiboOrder = await withErrorMapping(
        async () => {
          return await this._clients!.orderApi.updateOrder({
            orderId,
            order: updates as unknown as Record<string, unknown>,
          });
        },
        'Failed to update order',
      );

      // Map Kibo order to COF order
      const cofOrder = mapKiboOrderToCOF(
        kiboOrder as unknown as KiboOrder,
        String(this._options.tenantId),
      );

      return {
        success: true,
        order: cofOrder,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to update order: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieves orders from Kibo Commerce with optional filters.
   *
   * @param input - COF get orders input with optional filters
   * @returns Fulfillment result with orders array or error
   */
  async getOrders(input: GetOrdersInput): Promise<FulfillmentToolResult<{ orders: Order[] }>> {
    this.ensureConnected();

    try {
      // Map COF pagination to Kibo pagination
      const startIndex = input.skip ?? 0;
      const pageSize = input.pageSize ?? this._options.pageSize;

      // Build filter string from input filters
      const filterParts: string[] = [];

      // Handle statuses array filter
      if (input.statuses && input.statuses.length > 0) {
        const statusFilters = input.statuses.map((s) => `status eq '${s}'`).join(' or ');
        filterParts.push(`(${statusFilters})`);
      }

      // Handle ids array filter
      if (input.ids && input.ids.length > 0) {
        const idFilters = input.ids.map((id) => `id eq '${id}'`).join(' or ');
        filterParts.push(`(${idFilters})`);
      }

      // Handle externalIds array filter
      if (input.externalIds && input.externalIds.length > 0) {
        const extIdFilters = input.externalIds.map((id) => `externalId eq '${id}'`).join(' or ');
        filterParts.push(`(${extIdFilters})`);
      }

      // Handle date range filters
      if (input.createdAtMin) {
        filterParts.push(`createDate ge ${input.createdAtMin}`);
      }
      if (input.createdAtMax) {
        filterParts.push(`createDate le ${input.createdAtMax}`);
      }
      if (input.updatedAtMin) {
        filterParts.push(`updateDate ge ${input.updatedAtMin}`);
      }
      if (input.updatedAtMax) {
        filterParts.push(`updateDate le ${input.updatedAtMax}`);
      }

      const filter = filterParts.length > 0 ? filterParts.join(' and ') : undefined;

      // Fetch orders from Kibo API
      const response = await withErrorMapping(
        async () => {
          return await this._clients!.orderApi.getOrders({
            startIndex,
            pageSize,
            filter,
          });
        },
        'Failed to get orders',
      );

      const kiboOrders = (response.items ?? []) as unknown as KiboOrder[];

      // Map Kibo orders to COF orders
      const orders = kiboOrders.map((kiboOrder) =>
        mapKiboOrderToCOF(kiboOrder, String(this._options.tenantId)),
      );

      return {
        success: true,
        orders,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to get orders: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  // ==========================================================================
  // Fulfillment Methods (User Story 3)
  // ==========================================================================

  /**
   * Fulfills an order by creating/retrieving shipment information.
   *
   * In Kibo, shipments are created through the order fulfillment workflow.
   * This method retrieves shipments for the specified order after fulfillment
   * actions have been performed, or looks up existing shipments.
   *
   * @param input - COF fulfill order input (requires orderId, lineItems, trackingNumbers)
   * @returns Fulfillment result with created/found fulfillment or error
   */
  async fulfillOrder(
    input: FulfillOrderInput,
  ): Promise<FulfillmentToolResult<{ fulfillment: Fulfillment }>> {
    this.ensureConnected();

    try {
      const { orderId } = input;

      // Query shipments for this order
      // Note: In Kibo, shipments are typically created through the fulfillment workflow,
      // and we query for them after they've been created
      const response = await withErrorMapping(
        async () => {
          return await this._clients!.shipmentApi.getShipments({
            request: {
              filter: `orderId eq '${orderId}'`,
            },
          });
        },
        'Failed to get shipments for order',
      );

      // Get the first (or most recent) shipment for this order
      // Note: Kibo Fulfillment API uses embedded.shipments structure
      const embedded = response.embedded as { shipments?: unknown[] } | undefined;
      const kiboShipments = (embedded?.shipments ?? []) as KiboShipment[];

      if (kiboShipments.length === 0) {
        // No shipment found - return a pending fulfillment based on input
        return {
          success: true,
          fulfillment: {
            id: `pending-${orderId}`,
            orderId,
            status: 'PENDING',
            trackingNumbers: input.trackingNumbers,
            lineItems: input.lineItems,
            tenantId: String(this._options.tenantId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }

      // Map the first shipment to COF format
      const fulfillment = mapKiboShipmentToCOF(
        kiboShipments[0]!,
        String(this._options.tenantId),
      );

      return {
        success: true,
        fulfillment,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to fulfill order: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieves fulfillment records from Kibo Commerce.
   *
   * @param input - COF get fulfillments input with optional filters
   * @returns Fulfillment result with array of fulfillments or error
   */
  async getFulfillments(
    input: GetFulfillmentsInput,
  ): Promise<FulfillmentToolResult<{ fulfillments: Fulfillment[] }>> {
    this.ensureConnected();

    try {
      // Build filter from input
      const filterParts: string[] = [];

      if (input.orderIds && input.orderIds.length > 0) {
        const orderFilters = input.orderIds.map((id) => `orderId eq '${id}'`).join(' or ');
        filterParts.push(`(${orderFilters})`);
      }

      if (input.ids && input.ids.length > 0) {
        const idFilters = input.ids.map((id) => `id eq '${id}'`).join(' or ');
        filterParts.push(`(${idFilters})`);
      }

      const filter = filterParts.length > 0 ? filterParts.join(' and ') : undefined;

      // Query shipments from Kibo Fulfillment API
      const response = await withErrorMapping(
        async () => {
          return await this._clients!.shipmentApi.getShipments({
            request: {
              filter,
            },
          });
        },
        'Failed to get fulfillments',
      );

      // Note: Kibo Fulfillment API uses embedded.shipments structure
      const embedded = response.embedded as { shipments?: unknown[] } | undefined;
      const kiboShipments = (embedded?.shipments ?? []) as KiboShipment[];

      // Map Kibo shipments to COF fulfillments
      const fulfillments = kiboShipments.map((shipment) =>
        mapKiboShipmentToCOF(shipment, String(this._options.tenantId)),
      );

      return {
        success: true,
        fulfillments,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to get fulfillments: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Creates a return in Kibo Commerce.
   *
   * @param input - COF create return input
   * @returns Return result with created return or error
   */
  async createReturn(input: CreateReturnInput): Promise<ReturnResult> {
    this.ensureConnected();

    try {
      const returnData = input.return;

      // Map COF return items to Kibo format
      const kiboItems = returnData.returnLineItems.map((item) => ({
        productCode: item.sku,
        quantity: item.quantityReturned,
        returnReason: item.returnReason,
      }));

      // Create return via Kibo API
      const kiboReturn = await withErrorMapping(
        async () => {
          return await this._clients!.returnApi.createReturn({
            _return: {
              originalOrderId: returnData.orderId,
              returnType: returnData.outcome === 'EXCHANGE' ? 'Exchange' : 'Refund',
              items: kiboItems,
            } as unknown as Record<string, unknown>,
          });
        },
        'Failed to create return',
      );

      // Map Kibo return to COF return
      const cofReturn = mapKiboReturnToCOF(
        kiboReturn as unknown as KiboReturn,
        String(this._options.tenantId),
      );

      return {
        success: true,
        return: cofReturn,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to create return: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  /**
   * Retrieves returns from Kibo Commerce.
   *
   * @param input - COF get returns input with optional filters
   * @returns Fulfillment result with array of returns or error
   */
  async getReturns(
    input: GetReturnsInput,
  ): Promise<FulfillmentToolResult<{ returns: Return[] }>> {
    this.ensureConnected();

    try {
      // Build filter from input
      const filterParts: string[] = [];

      if (input.orderIds && input.orderIds.length > 0) {
        const orderFilters = input.orderIds.map((id) => `originalOrderId eq '${id}'`).join(' or ');
        filterParts.push(`(${orderFilters})`);
      }

      if (input.ids && input.ids.length > 0) {
        const idFilters = input.ids.map((id) => `id eq '${id}'`).join(' or ');
        filterParts.push(`(${idFilters})`);
      }

      if (input.statuses && input.statuses.length > 0) {
        const statusFilters = input.statuses.map((s) => `status eq '${s}'`).join(' or ');
        filterParts.push(`(${statusFilters})`);
      }

      const filter = filterParts.length > 0 ? filterParts.join(' and ') : undefined;

      // Query returns from Kibo Commerce API
      const response = await withErrorMapping(
        async () => {
          return await this._clients!.returnApi.getReturns({
            filter,
            startIndex: input.skip ?? 0,
            pageSize: input.pageSize ?? this._options.pageSize,
          });
        },
        'Failed to get returns',
      );

      const kiboReturns = (response.items ?? []) as unknown as KiboReturn[];

      // Map Kibo returns to COF returns
      const returns = kiboReturns.map((kiboReturn) =>
        mapKiboReturnToCOF(kiboReturn, String(this._options.tenantId)),
      );

      return {
        success: true,
        returns,
      };
    } catch (error: unknown) {
      if (error instanceof KiboAdapterError) {
        throw error;
      }
      throw new KiboAdapterError(
        `Failed to get returns: ${getErrorMessage(error)}`,
        AdapterErrorCode.UPSTREAM_ERROR,
        error,
      );
    }
  }

  // ==========================================================================
  // Inventory Methods (User Story 4)
  // ==========================================================================

  /**
   * Gets inventory levels for the specified SKUs and optional location filters.
   *
   * @param input - Filter parameters including SKUs and optional locationIds
   * @returns Inventory items matching the filter criteria
   */
  async getInventory(
    input: GetInventoryInput,
  ): Promise<FulfillmentToolResult<{ inventory: InventoryItem[] }>> {
    this.ensureConnected();

    return withErrorMapping(async () => {
      const clients = this._clients;
      if (!clients) {
        throw new KiboAdapterError(
          'API clients not initialized',
          AdapterErrorCode.CONNECTION_FAILED,
        );
      }

      // Build inventory request with product codes (SKUs)
      // Use 'ALL' type to get all inventory for the specified items
      const inventoryRequest = {
        type: 'ALL' as const,
        items: input.skus.map((sku) => ({ sku })),
        ...(input.locationIds && input.locationIds.length > 0
          ? { locationCodes: input.locationIds }
          : {}),
      };

      // Query inventory using postQueryInventory
      const inventoryResponse = await clients.inventoryApi.postQueryInventory({
        xVolTenant: Number(this._options.tenantId),
        xVolSite: Number(this._options.siteId),
        inventoryRequest,
      });

      // Map Kibo inventory to COF InventoryItem format
      const inventory = mapKiboInventoryListToCOF(
        inventoryResponse ?? [],
        String(this._options.tenantId),
      );

      return {
        success: true as const,
        inventory,
      };
    }, 'Failed to get inventory');
  }

  // ==========================================================================
  // Product Methods (User Story 5)
  // ==========================================================================

  async getProducts(
    input: GetProductsInput,
  ): Promise<FulfillmentToolResult<{ products: Product[] }>> {
    this.ensureConnected();

    return withErrorMapping(async () => {
      const clients = this._clients;
      if (!clients) {
        throw new KiboAdapterError(
          'API clients not initialized',
          AdapterErrorCode.CONNECTION_FAILED,
        );
      }

      const tenantId = String(this._options.tenantId);

      // Build filter from input - use skus if provided
      const filter =
        input.skus && input.skus.length > 0
          ? `productCode eq ${input.skus[0]}`
          : undefined;

      // Fetch products from Kibo
      const response = await clients.productsApi.getProducts({
        filter,
        pageSize: input.pageSize ?? 25,
        startIndex: input.skip ?? 0,
      });

      // Map to COF format
      const kiboProducts = response.items ?? [];
      const products = mapKiboProductListToCOF(kiboProducts, tenantId);

      return {
        success: true as const,
        products,
      };
    }, 'Failed to get products');
  }

  async getProductVariants(
    input: GetProductVariantsInput,
  ): Promise<FulfillmentToolResult<{ productVariants: ProductVariant[] }>> {
    this.ensureConnected();

    return withErrorMapping(async () => {
      const clients = this._clients;
      if (!clients) {
        throw new KiboAdapterError(
          'API clients not initialized',
          AdapterErrorCode.CONNECTION_FAILED,
        );
      }

      const tenantId = String(this._options.tenantId);
      // Use first productId from productIds array
      const productId = input.productIds?.[0] ?? '';

      // Fetch product variations from Kibo
      const response = await clients.productVariationsApi.getProductVariations({
        productCode: productId,
      });

      // Map to COF format
      const kiboVariations = response.items ?? [];
      const productVariants = mapKiboVariantListToCOF(kiboVariations, productId, tenantId);

      return {
        success: true as const,
        productVariants,
      };
    }, 'Failed to get product variants');
  }

  // ==========================================================================
  // Customer Methods (User Story 6)
  // ==========================================================================

  async getCustomers(
    input: GetCustomersInput,
  ): Promise<FulfillmentToolResult<{ customers: Customer[] }>> {
    this.ensureConnected();

    return withErrorMapping(async () => {
      const clients = this._clients;
      if (!clients) {
        throw new KiboAdapterError(
          'API clients not initialized',
          AdapterErrorCode.CONNECTION_FAILED,
        );
      }

      const tenantId = String(this._options.tenantId);

      // Build filter from input
      let filter: string | undefined;
      if (input.emails && input.emails.length > 0) {
        filter = `emailAddress eq ${input.emails[0]}`;
      } else if (input.ids && input.ids.length > 0) {
        filter = `id eq ${input.ids[0]}`;
      }

      // Fetch customers from Kibo
      const response = await clients.customerAccountApi.getAccounts({
        filter,
        pageSize: input.pageSize ?? 25,
        startIndex: input.skip ?? 0,
      });

      // Map to COF format
      const kiboCustomers = response.items ?? [];
      const customers = mapKiboCustomerListToCOF(kiboCustomers, tenantId);

      return {
        success: true as const,
        customers,
      };
    }, 'Failed to get customers');
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Extracts KiboAdapterOptions from AdapterConfig or direct options.
   */
  private extractOptions(config: AdapterConfig | KiboAdapterOptions): KiboAdapterOptions {
    if ('options' in config && config.options) {
      // AdapterConfig.options contains the Kibo-specific credentials
      return config.options as unknown as KiboAdapterOptions;
    }
    return config as KiboAdapterOptions;
  }

  /**
   * Validates the connection by making a lightweight API call.
   */
  private async validateConnection(): Promise<void> {
    if (!this._clients?.orderApi) {
      throw new Error('Order API client not initialized');
    }

    // Make a minimal API call to validate connectivity and auth
    // Using a filtered getOrders with limit 1 is lightweight
    await withErrorMapping(
      async () => {
        await this._clients!.orderApi.getOrders({
          pageSize: 1,
          startIndex: 0,
        });
      },
      'Connection validation failed',
    );
  }

  /**
   * Ensures the adapter is connected before making API calls.
   */
  private ensureConnected(): void {
    if (!this._connected || !this._clients) {
      throw new KiboAdapterError(
        'Adapter is not connected. Call connect() first.',
        AdapterErrorCode.CONNECTION_FAILED,
      );
    }
  }

}
