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
npm install @kibocommerce/onx-fulfillment-adapter
```

## Quick Start

```typescript
import { KiboFulfillmentAdapter } from '@kibocommerce/onx-fulfillment-adapter';

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
ADAPTER_PACKAGE=@kibocommerce/onx-fulfillment-adapter
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

# Run integration tests (with test credentials)
npm run test:integration

# Run integration tests with real API credentials
export KIBO_TENANT_ID=your-tenant-id
export KIBO_SITE_ID=your-site-id
export KIBO_CLIENT_ID=your-client-id
export KIBO_SHARED_SECRET=your-shared-secret
npm run test:integration

# Or use .env file for local development
cp .env.example .env
# Edit .env with your credentials
npm run test:integration
```

**Note:** Integration tests will use test credentials by default and skip real API calls. Set environment variables to test against actual Kibo API.

## Testing with MCP Inspector

To test your adapter interactively with the MCP Inspector tool:

### Prerequisites
```bash
# Install MCP SDK (if not already installed)
npm install --save-dev @modelcontextprotocol/sdk

# Install AI Toolkit extension in VS Code (optional but recommended)
```

### Using AI Toolkit

AI Toolkit has built-in support for testing adapters:

1. **Open AI Toolkit** in VS Code (sidebar icon)
2. **Go to Agent Inspector** tab
3. **Add your adapter** with these settings:
   - **Type:** Local
   - **Path:** `./dist/index.js` (relative to workspace)
   - **Config:**
     ```json
     {
       "tenantId": "your-tenant-id",
       "siteId": "your-site-id",
       "clientId": "your-client-id",
       "sharedSecret": "your-shared-secret"
     }
     ```
4. **Start the inspector** and test adapter methods interactively

### Using Command Line Inspector

```bash
# Build your adapter first
npm run build

# Run with npx (uses .env file automatically)
npx @modelcontextprotocol/inspector node -r dotenv/config dist/index.js

# Or set env vars directly
KIBO_TENANT_ID=xxx KIBO_SITE_ID=xxx npx @modelcontextprotocol/inspector node dist/index.js
```

The inspector opens a web UI where you can:
- View available adapter methods
- Test methods with custom parameters
- See real-time request/response data
- Debug connection issues

### HTTP Server for Testing

To test with AI Toolkit Agent Inspector, wrap your adapter in an HTTP server:

1. **Create `src/server.ts`** - see [server.ts example](https://gist.github.com/example)
2. **Add scripts to package.json**:
   ```json
   "server": "npm run build && node -r dotenv/config dist/server.js"
   ```
3. **Run the server**: `npm run server`
4. **Test endpoints** with AI Toolkit or curl:
   ```bash
   curl http://localhost:8087/health
   curl -X POST http://localhost:8087/orders -H "Content-Type: application/json" -d '{"pageSize":5}'
   ```

### VS Code Debugging

Press **F5** or use **Run > Start Debugging** to:
- Launch the HTTP server with debugger attached
- Set breakpoints in your TypeScript code
- Inspect variables and step through code
- Test with AI Toolkit Agent Inspector on port 8087

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
