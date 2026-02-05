# API Documentation

## Kibo Fulfillment Adapter Reference

This document describes how the Kibo Fulfillment Adapter maps to the interfaces exposed by `@cof-org/mcp`.

## Initialization

```typescript
import { KiboFulfillmentAdapter } from '@kibocommerce/cof-fulfillment-adapter';

const adapter = new KiboFulfillmentAdapter({
  tenantId: '26507',
  siteId: '41315',
  clientId: 'your-app-key.app.mozu.com',
  sharedSecret: 'your-shared-secret',
  timeout: 30000,
  retryAttempts: 3,
  debugMode: false,
});
```

Configuration options correspond to the `KiboAdapterOptions` type in `src/config.ts`.

## Lifecycle Methods

| Method | Purpose | Kibo SDK Usage |
| ------ | ------- | -------------- |
| `connect()` | Initialize SDK Configuration and create API clients | `Configuration`, `OrderApi`, etc. |
| `disconnect()` | Clean up API client instances | Clears `_clients` and `_configuration` |
| `healthCheck()` | Validate API connectivity and return `HealthStatus` | Lightweight `getOrders` call |

## Action Operations

| Method | Input | Kibo SDK Method |
| ------ | ----- | --------------- |
| `createSalesOrder(input)` | `CreateSalesOrderInput` | `OrderApi.createOrder()` |
| `cancelOrder(input)` | `CancelOrderInput` | `OrderApi.cancelOrder()` |
| `updateOrder(input)` | `UpdateOrderInput` | `OrderApi.updateOrder()` |
| `fulfillOrder(input)` | `FulfillOrderInput` | `OrderApi.createPackageShipments()` |
| `createReturn(input)` | `CreateReturnInput` | `ReturnApi.createReturn()` |

## Query Operations

| Method | Description | Kibo SDK Method |
| ------ | ----------- | --------------- |
| `getOrders(input)` | Returns orders matching filter | `OrderApi.getOrders()` |
| `getFulfillments(input)` | Lists shipments for an order | `ShipmentApi.getShipments()` |
| `getReturns(input)` | Returns RMA records | `ReturnApi.getReturns()` |
| `getInventory(input)` | Reports stock levels | `InventoryApi.postQueryInventory()` |
| `getProducts(input)` | Returns catalog products | `ProductsApi.getProducts()` |
| `getProductVariants(input)` | Fetches product variations | `ProductVariationsApi.getProductVariations()` |
| `getCustomers(input)` | Retrieves customer accounts | `CustomerAccountApi.getAccounts()` |

## Error Handling

The adapter uses `KiboAdapterError` with `AdapterErrorCode` enum:

```typescript
import { KiboAdapterError, isKiboAdapterError } from './errors.js';

try {
  const result = await adapter.createSalesOrder(input);
} catch (error) {
  if (isKiboAdapterError(error)) {
    console.error('Kibo Error:', error.code, error.message);
  }
}
```

### Error Codes

| Code | Description |
| ---- | ----------- |
| `INVALID_CONFIG` | Configuration validation failed |
| `CONNECTION_FAILED` | Failed to connect to Kibo API |
| `AUTHENTICATION_FAILED` | Invalid credentials or token |
| `ORDER_NOT_FOUND` | Order ID does not exist |
| `VALIDATION_ERROR` | Request payload validation failed |
| `RATE_LIMITED` | API rate limit exceeded |

## Required Dependencies

- `@kibocommerce/rest-sdk` ^2.2530.1
- `@cof-org/mcp` (peer dependency)

For complete implementation details, review `src/adapter.ts`.
