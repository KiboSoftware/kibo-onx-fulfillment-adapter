# Implementation Plan: Kibo Fulfillment Adapter

**Branch**: `001-kibo-adapter-impl` | **Date**: 2026-02-04 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-kibo-adapter-impl/spec.md`

## Summary

Implement a Kibo Commerce fulfillment adapter that bridges the `@kibocommerce/rest-sdk` to the COF MCP server's `IFulfillmentAdapter` interface. The adapter will authenticate via OAuth 2.0 using the SDK's `Configuration` class, map Kibo Commerce entities (Orders, Shipments, Inventory, Products, Customers) to COF types, and handle Kibo-specific behaviors like pagination and error codes.

## Technical Context

**Language/Version**: TypeScript 5.3+ with strict mode (`"strict": true`)  
**Primary Dependencies**:
  - `@kibocommerce/rest-sdk` ^2.2530.1 — Kibo API client with OAuth 2.0 handling
  - `@cof-org/mcp` (local) — COF interface contracts and types
  - `axios` ^1.6.0 — Supplementary HTTP client (if SDK gaps exist)

**Storage**: N/A — Stateless adapter, no persistence required  
**Testing**: Jest 29+ with `ts-jest`, `--experimental-vm-modules` for ESM support  
**Target Platform**: Node.js 20+ with ES modules (`"type": "module"`)  
**Project Type**: Single library project  
**Performance Goals**: <500ms p95 for single-entity operations  
**Constraints**: 80% test coverage minimum, zero `any` types  
**Scale/Scope**: Single-tenant adapter, 13 interface methods

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. TDD — NON-NEGOTIABLE | ✅ PASS | Test structure defined, TDD workflow planned |
| II. Type Safety — NON-NEGOTIABLE | ✅ PASS | Kibo SDK types + COF types, no `any` |
| III. Simplicity First | ✅ PASS | Direct SDK usage, no abstraction layers |
| IV. Kibo Integration Standards | ✅ PASS | Using official `@kibocommerce/rest-sdk` |
| V. Documentation Alignment | ✅ PASS | docs/API.md and docs/CONFIGURATION.md updates planned |

**All gates pass.** Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-kibo-adapter-impl/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API mappings)
│   └── kibo-to-cof.md   # Entity mapping contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── adapter.ts           # Main KiboFulfillmentAdapter class
├── index.ts             # Module exports
├── types.ts             # Kibo-specific type definitions
├── config.ts            # KiboAdapterOptions interface
└── utils/
    ├── api-client.ts    # SDK wrapper utilities (if needed)
    ├── type-guards.ts   # Runtime type validation
    └── transformers/    # Entity transformation functions
        ├── order.ts     # Kibo Order ↔ COF Order
        ├── shipment.ts  # Kibo Shipment ↔ COF Fulfillment
        ├── inventory.ts # Kibo Inventory ↔ COF InventoryItem
        ├── product.ts   # Kibo Product ↔ COF Product
        └── customer.ts  # Kibo Customer ↔ COF Customer

tests/
├── adapter.test.ts      # Main adapter unit tests
├── setup.ts             # Jest test setup
├── fixtures/            # Test data fixtures
│   ├── orders.ts
│   ├── shipments.ts
│   ├── inventory.ts
│   ├── products.ts
│   └── customers.ts
├── integration/         # Integration tests (requires sandbox)
│   └── kibo-sandbox.test.ts
└── utils/
    └── transformers.test.ts

docs/
├── API.md               # Updated method signatures
└── CONFIGURATION.md     # Kibo-specific config options

examples/
├── basic-usage.ts       # Simple connect/query example
└── advanced-config.ts   # Full configuration example
```

**Structure Decision**: Single project structure. The adapter is a focused library with clear boundaries—no frontend, no backend separation needed.

## Complexity Tracking

> No complexity violations. All patterns align with Simplicity First principle.

---

## Phase 0: Research Findings

### R1: Kibo SDK Configuration Pattern

**Decision**: Use `Configuration` class with `clientId`, `sharedSecret`, `tenantId`, `siteId`  
**Rationale**: SDK handles OAuth 2.0 token exchange automatically via `APIAuthClient`  
**Alternatives considered**: Manual OAuth implementation — rejected because SDK provides tested pattern

```typescript
import { Configuration } from '@kibocommerce/rest-sdk';

const config = new Configuration({
  tenantId: '26507',
  siteId: '41315',
  clientId: 'APP_KEY.1.0.0',
  sharedSecret: 'your-secret',
  authHost: 'home.mozu.com',  // or custom auth host
});
```

### R2: Kibo API Clients Required

**Decision**: Use these SDK API clients for adapter methods:

| COF Method | Kibo API Client | SDK Import |
|------------|-----------------|------------|
| `createSalesOrder` | `OrderApi` | `@kibocommerce/rest-sdk/clients/Commerce` |
| `getOrders` | `OrderApi` | `@kibocommerce/rest-sdk/clients/Commerce` |
| `updateOrder` | `OrderApi` | `@kibocommerce/rest-sdk/clients/Commerce` |
| `cancelOrder` | `OrderApi` | `@kibocommerce/rest-sdk/clients/Commerce` |
| `fulfillOrder` | `ShipmentApi` | `@kibocommerce/rest-sdk/clients/Fulfillment` |
| `getFulfillments` | `ShipmentApi` | `@kibocommerce/rest-sdk/clients/Fulfillment` |
| `getInventory` | `InventoryApi` | `@kibocommerce/rest-sdk/clients/Inventory` |
| `getProducts` | `ProductsApi` | `@kibocommerce/rest-sdk/clients/CatalogAdministration` |
| `getProductVariants` | `ProductsApi` | `@kibocommerce/rest-sdk/clients/CatalogAdministration` |
| `getCustomers` | `CustomerAccountsApi` | `@kibocommerce/rest-sdk/clients/Customer` |

### R3: Authentication Flow

**Decision**: SDK's `Configuration` handles OAuth automatically  
**Rationale**: The `APIAuthClient` in the SDK:
  1. Exchanges `clientId` + `sharedSecret` for access token
  2. Caches token in memory (`apiAuthMemCache`)
  3. Refreshes token automatically when expired

**Configuration parameters**:
- `clientId`: Application Key from Kibo Developer Center
- `sharedSecret`: Shared Secret from Kibo Developer Center  
- `tenantId`: Tenant ID (numeric)
- `siteId`: Site ID (numeric)
- `authHost`: Authentication host (default: `home.mozu.com`)

### R4: Pagination Strategy

**Decision**: Implement cursor-based pagination with resumable backoff  
**Rationale**: Kibo APIs return `startIndex`, `pageSize`, `totalCount` pattern

```typescript
async function fetchAllPages<T>(
  fetcher: (startIndex: number) => Promise<{ items: T[]; totalCount: number }>,
  pageSize = 50
): Promise<T[]> {
  const allItems: T[] = [];
  let startIndex = 0;
  let totalCount = Infinity;

  while (startIndex < totalCount) {
    const response = await fetcher(startIndex);
    allItems.push(...response.items);
    totalCount = response.totalCount;
    startIndex += pageSize;
  }

  return allItems;
}
```

### R5: Error Code Mapping

**Decision**: Map Kibo error codes to `AdapterError` codes

| Kibo Error | AdapterError Code | Description |
|------------|-------------------|-------------|
| `ITEM_NOT_FOUND` | `ORDER_NOT_FOUND` | Order/entity doesn't exist |
| `VALIDATION_ERROR` | `INVALID_INPUT` | Request validation failed |
| `LOCATION_NOT_FOUND` | `LOCATION_NOT_FOUND` | Invalid location code |
| HTTP 401/403 | `AUTHENTICATION_FAILED` | OAuth token invalid |
| HTTP 429 | `RATE_LIMITED` | Rate limit exceeded |
| HTTP 5xx | `UPSTREAM_ERROR` | Kibo API error |

---

## Phase 1: Design Artifacts

See companion documents:
- [data-model.md](data-model.md) — Entity mappings Kibo ↔ COF
- [quickstart.md](quickstart.md) — Developer onboarding guide
- [contracts/kibo-to-cof.md](contracts/kibo-to-cof.md) — Detailed field mappings

---

## Constitution Re-Check (Post-Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TDD | ✅ PASS | Test files structured, fixtures planned |
| II. Type Safety | ✅ PASS | All Kibo SDK types mapped to COF types |
| III. Simplicity First | ✅ PASS | Direct SDK usage, simple transformers |
| IV. Kibo Integration Standards | ✅ PASS | SDK patterns followed |
| V. Documentation Alignment | ✅ PASS | docs/ updates included in structure |

**Design approved.** Ready for Phase 2 task generation via `/speckit.tasks`.
