# Configuration Guide

This guide explains configuration options for the Kibo Fulfillment Adapter and how they map to the MCP server environment variables.

## MCP Server Environment

Set these in the MCP server `.env` (or Process Env) to load your adapter:

```
ADAPTER_TYPE=npm            # or local
ADAPTER_PACKAGE=@kibocommerce/cof-fulfillment-adapter  # when using npm
ADAPTER_EXPORT=KiboFulfillmentAdapter                      # optional, defaults to default export
# For local development
# ADAPTER_TYPE=local
# ADAPTER_PATH=/absolute/path/to/kibo-onx-fulfillment-adapter/dist/index.js

# Adapter-specific options (JSON string passed to adapter constructor)
ADAPTER_CONFIG={
  "tenantId": "26507",
  "siteId": "41315",
  "clientId": "your-app-key.app.mozu.com",
  "sharedSecret": "your-shared-secret",
  "authHost": "home.mozu.com",
  "apiHost": "t26507.tp.mozu.com",
  "apiEnv": "sandbox",
  "timeout": 30000,
  "retryAttempts": 3,
  "debugMode": false
}
```

## KiboAdapterOptions Reference

### Required Options

| Option | Type | Description |
| ------ | ---- | ----------- |
| `tenantId` | `string` | Your Kibo Commerce tenant identifier |
| `siteId` | `string` | The site ID within your tenant |
| `clientId` | `string` | Application client ID (format: `app-key.app.mozu.com`) |
| `sharedSecret` | `string` | Shared secret for authentication |

### Optional Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `authHost` | `string` | `'home.mozu.com'` | OAuth token endpoint host |
| `apiHost` | `string` | `'t{tenantId}.tp.mozu.com'` | API endpoint host |
| `apiEnv` | `string` | `'sandbox'` | Environment (`'sandbox'` or `'production'`) |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retryAttempts` | `number` | `3` | Number of retries for transient errors |
| `debugMode` | `boolean` | `false` | Enable verbose logging |

### Environment Variables

You can also configure the adapter using environment variables:

```bash
KIBO_TENANT_ID=26507
KIBO_SITE_ID=41315
KIBO_CLIENT_ID=your-app-key.app.mozu.com
KIBO_SHARED_SECRET=your-shared-secret
KIBO_AUTH_HOST=home.mozu.com
KIBO_API_HOST=t26507.tp.mozu.com
KIBO_API_ENV=sandbox
KIBO_TIMEOUT=30000
KIBO_RETRY_ATTEMPTS=3
KIBO_DEBUG_MODE=false
```

## Exporting Your Adapter

The package exports the adapter class as both default and named exports from `src/index.ts`:

```ts
export { KiboFulfillmentAdapter as default } from './adapter.js';
export { KiboFulfillmentAdapter } from './adapter.js';
export type { KiboAdapterOptions } from './types.js';
```

This lets the MCP server load it via dynamic import:
- NPM: `import(pkg)[exportName || 'default']`
- Local: `import(filePath)[exportName || 'default']`

## Deployment Notes

- Do not commit secrets. Use environment variables or a secrets manager.
- Provide a `.env.example` with the variables your adapter needs.
- Document any required scopes, IP allowlists, or network prerequisites.
- Ensure your Kibo application has the required API scopes for orders, shipments, inventory, products, and customers.

## Obtaining Kibo Credentials

1. Log in to Kibo Dev Center (https://developer.kibocommerce.com)
2. Navigate to your application settings
3. Copy the Client ID and generate a Shared Secret
4. Note your Tenant ID and Site ID from the Kibo Admin Console

