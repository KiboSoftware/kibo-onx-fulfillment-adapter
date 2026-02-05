# Feature Specification: Kibo Fulfillment Adapter Implementation

**Feature Branch**: `001-kibo-adapter-impl`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: User description: "Implement Kibo fulfillment adapter using @kibocommerce/rest-sdk to connect Kibo Commerce to the COF MCP server following the IFulfillmentAdapter interface"

## Clarifications

### Session 2026-02-04

- Q: What happens when rate limit occurs during paginated fetch? → A: Resume from last successful page after backoff

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adapter Lifecycle Management (Priority: P1)

A developer integrates the Kibo adapter with the COF MCP server. The adapter must successfully authenticate with Kibo's OAuth 2.0 API and report its health status so the server can determine if the connection is viable.

**Why this priority**: Without successful connection and authentication, no other operations are possible. This is the foundation for all adapter functionality.

**Independent Test**: Can be fully tested by calling `connect()`, `healthCheck()`, and `disconnect()` methods with valid Kibo credentials and verifying the adapter reports healthy status.

**Acceptance Scenarios**:

1. **Given** valid Kibo credentials (clientId, clientSecret, tenantId, siteId), **When** the adapter's `connect()` method is called, **Then** the adapter authenticates via OAuth 2.0 and reports `connected = true`.
2. **Given** invalid or missing Kibo credentials, **When** the adapter's `connect()` method is called, **Then** the adapter throws an `AdapterError` with code `CONNECTION_FAILED` and a descriptive message.
3. **Given** a connected adapter, **When** `healthCheck()` is called, **Then** a `HealthStatus` object is returned with status `healthy` and passing checks for `api_connection` and `authentication`.
4. **Given** a connected adapter, **When** `disconnect()` is called, **Then** resources are cleaned up and subsequent operations fail with an appropriate error.

---

### User Story 2 - Order Operations (Priority: P1)

A retailer uses the COF MCP server to create, retrieve, update, and cancel orders in Kibo Commerce. The adapter translates COF order payloads to Kibo's Order API format and returns properly typed responses.

**Why this priority**: Order operations are the core value proposition for a fulfillment adapter. Creating and managing orders is essential for any commerce integration.

**Independent Test**: Can be tested by calling `createSalesOrder()` with a valid order payload and verifying the returned order matches Kibo's created order; similarly for `getOrders()`, `updateOrder()`, and `cancelOrder()`.

**Acceptance Scenarios**:

1. **Given** a connected adapter and a valid `CreateSalesOrderInput`, **When** `createSalesOrder()` is called, **Then** an order is created in Kibo and an `OrderResult` with `success: true` and the created order is returned.
2. **Given** a connected adapter and an existing order ID, **When** `getOrders({ orderId: "123" })` is called, **Then** the order details are retrieved from Kibo and returned as an array of `Order` objects.
3. **Given** a connected adapter and a valid `UpdateOrderInput`, **When** `updateOrder()` is called, **Then** the order is updated in Kibo and the updated order is returned.
4. **Given** a connected adapter and an order eligible for cancellation, **When** `cancelOrder()` is called, **Then** the order is cancelled in Kibo and the cancelled order is returned with updated status.
5. **Given** an order that cannot be cancelled (already shipped), **When** `cancelOrder()` is called, **Then** an `AdapterError` is returned with an appropriate error code.

---

### User Story 3 - Fulfillment/Shipment Operations (Priority: P1)

A retailer marks orders as fulfilled by creating shipments in Kibo. The adapter translates fulfillment requests to Kibo's Shipment API and retrieves existing fulfillment records.

**Why this priority**: Fulfillment operations complete the order lifecycle and are essential for tracking shipped orders.

**Independent Test**: Can be tested by calling `fulfillOrder()` with a valid order and shipment details, verifying a shipment is created in Kibo; `getFulfillments()` retrieves existing shipments.

**Acceptance Scenarios**:

1. **Given** a connected adapter and a valid `FulfillOrderInput` with order ID and shipment details, **When** `fulfillOrder()` is called, **Then** a shipment is created in Kibo via the ShipmentApi and a `Fulfillment` object is returned.
2. **Given** a connected adapter and filter criteria, **When** `getFulfillments()` is called, **Then** matching shipments are retrieved from Kibo and returned as `Fulfillment[]`.
3. **Given** an order with multiple shipments, **When** `getFulfillments({ orderId: "123" })` is called, **Then** all shipments for that order are returned.

---

### User Story 4 - Inventory Operations (Priority: P2)

A retailer queries inventory levels from Kibo to check product availability. The adapter uses Kibo's Inventory API to retrieve stock levels across locations.

**Why this priority**: Inventory visibility is important for order promising but is secondary to core order/fulfillment operations.

**Independent Test**: Can be tested by calling `getInventory()` with SKU or location filters and verifying stock levels are returned from Kibo.

**Acceptance Scenarios**:

1. **Given** a connected adapter and a product SKU, **When** `getInventory({ skus: ["SKU123"] })` is called, **Then** inventory levels for that SKU are returned from Kibo's Inventory API.
2. **Given** a connected adapter and a location code, **When** `getInventory({ locationCode: "WAREHOUSE-01" })` is called, **Then** inventory at that location is returned.
3. **Given** a SKU with no inventory, **When** `getInventory()` is called, **Then** an empty inventory array or zero quantities are returned (not an error).

---

### User Story 5 - Product and Catalog Operations (Priority: P2)

A retailer retrieves product information from Kibo's catalog. The adapter queries Kibo's Catalog API to return products and product variants.

**Why this priority**: Product data supports order creation and validation but is not a primary fulfillment operation.

**Independent Test**: Can be tested by calling `getProducts()` and `getProductVariants()` with filter criteria and verifying catalog data is returned.

**Acceptance Scenarios**:

1. **Given** a connected adapter, **When** `getProducts({ productCodes: ["PROD-001"] })` is called, **Then** matching products are retrieved from Kibo's Catalog API.
2. **Given** a connected adapter and a parent product code, **When** `getProductVariants({ parentProductCode: "PROD-001" })` is called, **Then** variant SKUs are returned.
3. **Given** a non-existent product code, **When** `getProducts()` is called, **Then** an empty products array is returned (not an error).

---

### User Story 6 - Customer Operations (Priority: P3)

A retailer retrieves customer information from Kibo for order processing. The adapter queries Kibo's Customer API.

**Why this priority**: Customer data is helpful context but orders can reference customers by ID without needing full customer retrieval.

**Independent Test**: Can be tested by calling `getCustomers()` with email or customer ID filters.

**Acceptance Scenarios**:

1. **Given** a connected adapter and customer email, **When** `getCustomers({ email: "customer@example.com" })` is called, **Then** matching customer records are returned.
2. **Given** a connected adapter and customer ID, **When** `getCustomers({ customerId: "CUST-123" })` is called, **Then** the customer record is returned.

---

### Edge Cases

- What happens when Kibo API returns rate limit errors (429)?  
  → Adapter implements exponential backoff and retries up to configured `retryAttempts`.

- What happens when rate limit occurs during paginated fetch?  
  → Adapter resumes pagination from last successful page after backoff completes (preserves progress, avoids duplicates).

- How does the system handle Kibo API timeout?  
  → Adapter respects `timeout` configuration and throws `AdapterError` with code `TIMEOUT`.

- What happens when Kibo returns paginated results exceeding a single page?  
  → Adapter handles pagination transparently, fetching all pages up to reasonable limits.

- How does the system handle partial failures (e.g., some items in an order update fail)?  
  → Adapter returns error with details about which items failed.

- What happens when the OAuth token expires mid-session?  
  → The `@kibocommerce/rest-sdk` handles token refresh automatically.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Adapter MUST implement all methods of the `IFulfillmentAdapter` interface from `@cof-org/mcp`.
- **FR-002**: Adapter MUST authenticate with Kibo using OAuth 2.0 client credentials flow via the SDK's `Configuration` object.
- **FR-003**: Adapter MUST use `@kibocommerce/rest-sdk` as the primary API client (no custom HTTP calls unless SDK lacks coverage).
- **FR-004**: Adapter MUST map Kibo data types to COF types with explicit TypeScript transformations.
- **FR-005**: Adapter MUST NOT use TypeScript `any` type; all types MUST be explicit or use `unknown` with type guards.
- **FR-006**: Adapter MUST maintain 80% or greater test coverage.
- **FR-007**: Adapter MUST expose configuration via `ADAPTER_CONFIG` JSON for: `clientId`, `clientSecret`, `tenantId`, `siteId`, `timeout`, `retryAttempts`, `debugMode`.
- **FR-008**: Adapter MUST translate Kibo error codes to meaningful `AdapterError` instances with descriptive codes.
- **FR-009**: Adapter MUST handle Kibo's paginated API responses transparently for list operations.
- **FR-010**: Adapter MUST log operations at appropriate levels when `debugMode` is enabled.

### Key Entities

- **Order**: Kibo `Order` ↔ COF `Order` — maps order ID, status, line items, totals, addresses, customer reference.
- **Shipment/Fulfillment**: Kibo `ShipmentDto` ↔ COF `Fulfillment` — maps shipment number, tracking info, items, status.
- **Inventory**: Kibo inventory response ↔ COF `InventoryItem` — maps SKU, location, available/reserved quantities.
- **Product**: Kibo `Product` ↔ COF `Product` — maps product code, name, description, pricing.
- **Customer**: Kibo `CustomerAccount` ↔ COF `Customer` — maps customer ID, email, name, addresses.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 13 `IFulfillmentAdapter` methods (3 lifecycle + 4 action + 6 query) are implemented and pass unit tests.
- **SC-002**: Test coverage is 80% or higher as measured by Jest.
- **SC-003**: Integration tests pass against a Kibo sandbox environment.
- **SC-004**: Zero `any` types exist in the codebase (verified by TypeScript strict mode and linting).
- **SC-005**: Adapter successfully loads via COF MCP server with `ADAPTER_TYPE=local` configuration.
- **SC-006**: Documentation in `docs/API.md` and `docs/CONFIGURATION.md` accurately reflects implementation.
- **SC-007**: Example files in `examples/` demonstrate basic and advanced usage patterns.

## Assumptions

- Kibo sandbox environment is available for integration testing.
- The `@kibocommerce/rest-sdk` package (v2.2530.1+) provides sufficient API coverage for all required operations.
- OAuth 2.0 client credentials are obtainable from Kibo Developer Center.
- The COF MCP server's `@cof-org/mcp` package is installed and provides stable interface types.
- Kibo's API follows documented behavior for error responses and pagination.

## Out of Scope

- Returns processing (beyond basic `createReturn` placeholder).
- Real-time inventory sync or webhook handling.
- Multi-tenant support (adapter handles single tenant configuration at a time).
- Custom Kibo Arc.js extensions or embedded actions.
- Performance optimization beyond standard retry/timeout handling.
