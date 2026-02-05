# Kibo Commerce Fulfillment Adapter

[![CI](https://github.com/KiboSoftware/kibo-onx-fulfillment-adapter/actions/workflows/ci.yml/badge.svg)](https://github.com/KiboSoftware/kibo-onx-fulfillment-adapter/actions/workflows/ci.yml)

A Commerce Operations Foundation (COF) adapter for Kibo Commerce, enabling seamless integration with the COF MCP Server for order fulfillment operations.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Development](#development)
- [Support](#support)

## Features

- **Order Management**: Create, update, cancel, and fulfill orders via Kibo Commerce API
- **Fulfillment Operations**: Ship orders with package tracking and carrier integration
- **Inventory Management**: Query real-time inventory levels across locations
- **Product Catalog**: Retrieve products and variants from Kibo Catalog Administration
- **Customer Data**: Access customer accounts with address and contact information
- **Returns Processing**: Create and manage return merchandise authorizations (RMAs)

## Installation

```bash
npm install @kibocommerce/cof-fulfillment-adapter
```

## Quick Start

```typescript
import { KiboFulfillmentAdapter } from '@kibocommerce/cof-fulfillment-adapter';

const adapter = new KiboFulfillmentAdapter({
  tenantId: '26507',
  siteId: '41315',
  clientId: 'your-app-key.app.mozu.com',
  sharedSecret: 'your-shared-secret',
});

// Connect to Kibo Commerce
await adapter.connect();

// Check health status
const health = await adapter.healthCheck();
console.log('Status:', health.status);

// Query orders
const orders = await adapter.getOrders({ 
  filter: { status: 'pending' },
  pageSize: 50 
});

// Create a fulfillment
const result = await adapter.fulfillOrder({
  orderId: 'ORD-123',
  shipments: [{
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    items: [{ sku: 'PROD-001', quantity: 2 }]
  }]
});
```

## Configuration

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `tenantId` | `string` | Your Kibo Commerce tenant identifier |
| `siteId` | `string` | The site ID within your tenant |
| `clientId` | `string` | Application client ID (format: `app-key.app.mozu.com`) |
| `sharedSecret` | `string` | Shared secret for authentication |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `authHost` | `string` | `'home.mozu.com'` | OAuth token endpoint host |
| `apiHost` | `string` | Auto-generated | API endpoint host |
| `apiEnv` | `string` | `'sandbox'` | Environment (`sandbox` or `production`) |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retryAttempts` | `number` | `3` | Number of retries for transient errors |
| `debugMode` | `boolean` | `false` | Enable verbose logging |

### MCP Server Configuration

```bash
ADAPTER_TYPE=npm
ADAPTER_PACKAGE=@kibocommerce/cof-fulfillment-adapter
ADAPTER_CONFIG={"tenantId":"26507","siteId":"41315","clientId":"your-app.app.mozu.com","sharedSecret":"secret"}
```

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for complete configuration details.

## API Reference

### Lifecycle Methods

| Method | Description |
|--------|-------------|
| `connect()` | Initialize SDK and authenticate with Kibo |
| `disconnect()` | Clean up API client resources |
| `healthCheck()` | Validate API connectivity |

### Action Operations

| Method | Description |
|--------|-------------|
| `createSalesOrder(input)` | Create a new order in Kibo |
| `cancelOrder(input)` | Cancel an existing order |
| `updateOrder(input)` | Update order details |
| `fulfillOrder(input)` | Ship order with tracking info |
| `createReturn(input)` | Create a return/RMA |

### Query Operations

| Method | Description |
|--------|-------------|
| `getOrders(input)` | Retrieve orders with filtering |
| `getFulfillments(input)` | List shipments for an order |
| `getReturns(input)` | Retrieve return records |
| `getInventory(input)` | Query inventory levels |
| `getProducts(input)` | Fetch catalog products |
| `getProductVariants(input)` | Get product variations |
| `getCustomers(input)` | Retrieve customer accounts |

See [docs/API.md](docs/API.md) for complete API documentation.

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run TypeScript type checking
npm run typecheck
```

## Development

### Project Structure

```
kibo-onx-fulfillment-adapter/
├── src/
│   ├── adapter.ts           # Main adapter implementation
│   ├── config.ts            # Configuration validation
│   ├── errors.ts            # Error types and handlers
│   ├── index.ts             # Module exports
│   ├── types.ts             # TypeScript type definitions
│   └── utils/
│       ├── api-client.ts    # HTTP client utilities
│       ├── type-guards.ts   # Runtime type checking
│       └── transformers/    # Data transformation utilities
│           ├── order.ts     # Order transformers
│           ├── fulfillment.ts
│           ├── inventory.ts
│           ├── product.ts
│           └── customer.ts
├── tests/
│   ├── adapter.test.ts      # Adapter unit tests
│   ├── config.test.ts       # Configuration tests
│   ├── errors.test.ts       # Error handling tests
│   └── utils/
│       └── transformers.test.ts
├── docs/
│   ├── API.md               # API documentation
│   └── CONFIGURATION.md     # Configuration guide
└── package.json
```

### Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Lint code
npm run lint
```

## Dependencies

- `@kibocommerce/rest-sdk` ^2.2530.1 - Official Kibo Commerce SDK
- `@cof-org/mcp` - Commerce Operations Foundation (peer dependency)

## Support

- [Kibo Commerce Developer Documentation](https://developer.kibocommerce.com)
- [Commerce Operations Foundation Docs](../docs/README.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

---

*This adapter is part of the Commerce Operations Foundation (COF) project.*
