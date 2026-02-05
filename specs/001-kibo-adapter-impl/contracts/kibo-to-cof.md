# API Contracts: Kibo to COF Mapping

**Feature**: 001-kibo-adapter-impl | **Date**: 2026-02-04

## Interface Contract: IFulfillmentAdapter

The adapter must implement all methods defined in `IFulfillmentAdapter` from `@cof-org/mcp`.

---

## Lifecycle Methods

### `connect(): Promise<void>`

**Kibo Implementation**:
1. Validate `KiboAdapterOptions` configuration
2. Initialize `Configuration` with OAuth credentials
3. Create API client instances (`OrderApi`, `ShipmentApi`, etc.)
4. Call health check endpoint to verify connectivity

**Errors**:
- `AUTHENTICATION_FAILED` — Invalid credentials
- `CONNECTION_FAILED` — Network/DNS failure

---

### `disconnect(): Promise<void>`

**Kibo Implementation**:
1. Clear cached API client instances
2. Clear any pending retries/timers
3. No explicit session to close (stateless REST)

**Errors**: None expected

---

### `healthCheck(): Promise<HealthCheckResult>`

**Kibo Implementation**:
1. Call a lightweight Kibo endpoint (e.g., tenant info)
2. Measure response time
3. Return health status

**Response**:
```typescript
interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  message?: string;
}
```

---

## Order Methods

### `createSalesOrder(order: Order): Promise<Order>`

**Kibo Endpoint**: `POST /commerce/orders`  
**Kibo Client**: `OrderApi.createOrder()`

**Request Mapping**:
```typescript
const kiboOrder = {
  externalId: order.externalId,
  customerAccountId: parseInt(order.customer.id, 10),
  email: order.customer.email,
  fulfillmentInfo: {
    fulfillmentContact: mapAddressToContact(order.shippingAddress),
  },
  items: order.items.map(mapOrderItemToKibo),
};
```

**Response Mapping**: `mapKiboOrderToCOF(response)`

**Errors**:
- `INVALID_INPUT` — Validation failed
- `UPSTREAM_ERROR` — Kibo API error

---

### `getOrders(filter?: OrderFilter): Promise<Order[]>`

**Kibo Endpoint**: `GET /commerce/orders`  
**Kibo Client**: `OrderApi.getOrders()`

**Filter Mapping**:
```typescript
const kiboFilter = buildKiboFilter({
  status: filter?.status,         // → status eq '{value}'
  customerId: filter?.customerId, // → customerAccountId eq {value}
  fromDate: filter?.fromDate,     // → submittedDate ge {value}
  toDate: filter?.toDate,         // → submittedDate le {value}
});
```

**Pagination**: Uses `pageSize` and `startIndex` with automatic page fetching

---

### `updateOrder(orderId: string, updates: OrderUpdate): Promise<Order>`

**Kibo Endpoint**: `PUT /commerce/orders/{orderId}`  
**Kibo Client**: `OrderApi.updateOrder()`

**Allowed Updates**:
- Shipping address
- Order items (quantity changes)
- Metadata/attributes

**Errors**:
- `ORDER_NOT_FOUND` — Order doesn't exist
- `INVALID_STATE` — Order already fulfilled/cancelled

---

### `cancelOrder(orderId: string, reason?: string): Promise<Order>`

**Kibo Endpoint**: `POST /commerce/orders/{orderId}/cancel`  
**Kibo Client**: `OrderApi.cancelOrder()`

**Request**:
```typescript
await orderApi.cancelOrder({ orderId, reason });
```

**Errors**:
- `ORDER_NOT_FOUND` — Order doesn't exist
- `INVALID_STATE` — Order already cancelled/fulfilled

---

## Fulfillment Methods

### `fulfillOrder(orderId: string, fulfillment: FulfillmentRequest): Promise<Fulfillment>`

**Kibo Endpoint**: `POST /commerce/fulfillment/shipments`  
**Kibo Client**: `ShipmentApi.createShipment()`

**Request Mapping**:
```typescript
const kiboShipment = {
  orderId,
  items: fulfillment.items.map(mapFulfillmentItemToKibo),
  packages: [{
    trackingNumber: fulfillment.trackingNumber,
    carrierCode: fulfillment.carrier,
  }],
};
```

---

### `getFulfillments(orderId: string): Promise<Fulfillment[]>`

**Kibo Endpoint**: `GET /commerce/fulfillment/shipments?filter=orderId eq '{orderId}'`  
**Kibo Client**: `ShipmentApi.getShipments()`

---

### `createReturn(returnRequest: ReturnRequest): Promise<Return>`

**Kibo Endpoint**: `POST /commerce/returns`  
**Kibo Client**: `ReturnApi.createReturn()`

---

### `getReturns(orderId: string): Promise<Return[]>`

**Kibo Endpoint**: `GET /commerce/returns?filter=originalOrderId eq '{orderId}'`  
**Kibo Client**: `ReturnApi.getReturns()`

---

## Inventory Methods

### `getInventory(filter?: InventoryFilter): Promise<InventoryItem[]>`

**Kibo Endpoint**: `POST /commerce/inventory/products`  
**Kibo Client**: `InventoryApi.getProductInventories()`

**Request**:
```typescript
const request = {
  productCodes: filter?.skus,
  locationCodes: filter?.locationIds,
};
```

---

## Product Methods

### `getProducts(filter?: ProductFilter): Promise<Product[]>`

**Kibo Endpoint**: `GET /commerce/catalog/admin/products`  
**Kibo Client**: `ProductsApi.getProducts()`

---

### `getProductVariants(productId: string): Promise<ProductVariant[]>`

**Kibo Endpoint**: `GET /commerce/catalog/admin/products/{productCode}`  
**Kibo Client**: `ProductsApi.getProduct()`

**Response**: Extract `variations[]` array from product

---

## Customer Methods

### `getCustomers(filter?: CustomerFilter): Promise<Customer[]>`

**Kibo Endpoint**: `GET /commerce/customer/accounts`  
**Kibo Client**: `CustomerAccountsApi.getCustomerAccounts()`

---

## Error Handling Contract

All methods must wrap Kibo errors in `AdapterError`:

```typescript
class AdapterError extends Error {
  constructor(
    public code: AdapterErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

type AdapterErrorCode =
  | 'AUTHENTICATION_FAILED'
  | 'CONNECTION_FAILED'
  | 'ORDER_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR';
```
