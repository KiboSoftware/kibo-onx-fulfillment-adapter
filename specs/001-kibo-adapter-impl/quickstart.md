# Quickstart: Kibo Fulfillment Adapter

**Feature**: 001-kibo-adapter-impl | **Date**: 2026-02-04

## Prerequisites

1. **Kibo Developer Account** with API access
2. **Application credentials** from Kibo Developer Center:
   - Client ID (Application Key)
   - Shared Secret
3. **Tenant and Site IDs** for your Kibo instance
4. **Node.js 20+** with ES modules support

---

## Installation

```bash
# Install the adapter package
npm install kibo-fulfillment-adapter

# Or if using from local development
npm install file:./kibo-onx-fulfillment-adapter
```

---

## Configuration

Create a configuration object with your Kibo credentials:

```typescript
import { KiboFulfillmentAdapter } from 'kibo-fulfillment-adapter';
import type { KiboAdapterOptions } from 'kibo-fulfillment-adapter';

const options: KiboAdapterOptions = {
  // Required credentials
  tenantId: process.env.KIBO_TENANT_ID!,
  siteId: process.env.KIBO_SITE_ID!,
  clientId: process.env.KIBO_CLIENT_ID!,
  sharedSecret: process.env.KIBO_SHARED_SECRET!,

  // Optional settings
  authHost: 'home.mozu.com',  // Default auth host
  apiHost: undefined,          // Auto-detected from tenantId
  timeout: 30000,              // Request timeout in ms
  retries: 3,                  // Retry attempts for transient failures
};
```

### Environment Variables

```bash
# .env file
KIBO_TENANT_ID=26507
KIBO_SITE_ID=41315
KIBO_CLIENT_ID=YOUR_APP_KEY.1.0.0
KIBO_SHARED_SECRET=your-shared-secret-here
KIBO_AUTH_HOST=home.mozu.com  # Optional
```

---

## Basic Usage

### Initialize and Connect

```typescript
import { KiboFulfillmentAdapter } from 'kibo-fulfillment-adapter';

const adapter = new KiboFulfillmentAdapter({
  tenantId: process.env.KIBO_TENANT_ID!,
  siteId: process.env.KIBO_SITE_ID!,
  clientId: process.env.KIBO_CLIENT_ID!,
  sharedSecret: process.env.KIBO_SHARED_SECRET!,
});

// Connect to Kibo (validates credentials)
await adapter.connect();

// Verify connection
const health = await adapter.healthCheck();
console.log('Connected:', health.healthy, 'Latency:', health.latencyMs, 'ms');
```

### Fetch Orders

```typescript
// Get all orders
const orders = await adapter.getOrders();
console.log('Orders:', orders.length);

// Get orders with filter
const activeOrders = await adapter.getOrders({
  status: 'PROCESSING',
  fromDate: new Date('2024-01-01'),
});
```

### Create an Order

```typescript
const newOrder = await adapter.createSalesOrder({
  externalId: 'EXT-12345',
  customer: {
    id: '1001',
    email: 'customer@example.com',
  },
  shippingAddress: {
    name: 'John Doe',
    line1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
  },
  items: [
    {
      sku: 'WIDGET-001',
      quantity: 2,
      price: 29.99,
    },
  ],
});

console.log('Created order:', newOrder.id);
```

### Fulfill an Order

```typescript
const fulfillment = await adapter.fulfillOrder(order.id, {
  items: [
    { sku: 'WIDGET-001', quantity: 2 },
  ],
  carrier: 'UPS',
  trackingNumber: '1Z999AA10123456784',
});

console.log('Shipment created:', fulfillment.id);
```

### Query Inventory

```typescript
const inventory = await adapter.getInventory({
  skus: ['WIDGET-001', 'WIDGET-002'],
  locationIds: ['WAREHOUSE-01'],
});

for (const item of inventory) {
  console.log(`${item.sku}: ${item.available} available`);
}
```

### Disconnect

```typescript
// Clean up when done
await adapter.disconnect();
```

---

## Error Handling

```typescript
import { AdapterError } from 'kibo-fulfillment-adapter';

try {
  await adapter.getOrders({ status: 'INVALID' });
} catch (error) {
  if (error instanceof AdapterError) {
    switch (error.code) {
      case 'AUTHENTICATION_FAILED':
        console.error('Check your Kibo credentials');
        break;
      case 'RATE_LIMITED':
        console.error('Too many requests, retry after backoff');
        break;
      case 'UPSTREAM_ERROR':
        console.error('Kibo API error:', error.message);
        break;
      default:
        console.error('Adapter error:', error.code, error.message);
    }
  } else {
    throw error;
  }
}
```

---

## Integration with COF MCP Server

```typescript
import { createMCPServer } from '@cof-org/mcp';
import { KiboFulfillmentAdapter } from 'kibo-fulfillment-adapter';

const adapter = new KiboFulfillmentAdapter({
  tenantId: process.env.KIBO_TENANT_ID!,
  siteId: process.env.KIBO_SITE_ID!,
  clientId: process.env.KIBO_CLIENT_ID!,
  sharedSecret: process.env.KIBO_SHARED_SECRET!,
});

const server = createMCPServer({
  adapter,
  serverName: 'kibo-fulfillment',
});

await server.start();
```

---

## Testing

Run the test suite:

```bash
# Unit tests
npm test

# Integration tests (requires Kibo sandbox credentials)
KIBO_TENANT_ID=... KIBO_SITE_ID=... npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Next Steps

- See [API.md](../../docs/API.md) for full method documentation
- See [CONFIGURATION.md](../../docs/CONFIGURATION.md) for advanced options
- See [examples/](../../examples/) for more usage patterns
