# Tasks: Kibo Fulfillment Adapter Implementation

**Input**: Design documents from `/specs/001-kibo-adapter-impl/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: TDD is NON-NEGOTIABLE per constitution. Tests are written FIRST and must FAIL before implementation.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US6)
- Paths use single project structure: `src/`, `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and configuration for Kibo adapter

- [x] T001 Verify `@kibocommerce/rest-sdk` ^2.2530.1 installed in package.json
- [x] T002 [P] Create `src/config.ts` with `KiboAdapterOptions` interface (tenantId, siteId, clientId, sharedSecret, authHost, timeout, retries)
- [x] T003 [P] Create `src/errors.ts` with `AdapterError` class and `AdapterErrorCode` type
- [x] T004 [P] Create test fixtures directory structure `tests/fixtures/`
- [x] T005 [P] Update `src/index.ts` to export `KiboFulfillmentAdapter`, `KiboAdapterOptions`, `AdapterError`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create `src/types.ts` with Kibo-to-COF type definitions (KiboOrderStatus, KiboShipmentStatus, etc.)
- [x] T007 [P] Create `src/utils/type-guards.ts` with runtime type guards for Kibo API responses
- [x] T008 [P] Create `src/utils/pagination.ts` with `fetchAllPages<T>()` helper function
- [x] T009 [P] Create `src/utils/error-mapper.ts` with `mapKiboError()` function for error code translation
- [x] T010 Create base `KiboFulfillmentAdapter` class skeleton in `src/adapter.ts` implementing `IFulfillmentAdapter`
- [x] T011 [P] Create `tests/fixtures/orders.ts` with sample Kibo order payloads
- [x] T012 [P] Create `tests/fixtures/shipments.ts` with sample Kibo shipment payloads
- [x] T013 [P] Create `tests/fixtures/inventory.ts` with sample Kibo inventory payloads
- [x] T014 [P] Create `tests/fixtures/products.ts` with sample Kibo product payloads
- [x] T015 [P] Create `tests/fixtures/customers.ts` with sample Kibo customer payloads

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Adapter Lifecycle Management (Priority: P1) 🎯 MVP

**Goal**: Developer can connect to Kibo, verify health, and disconnect cleanly

**Independent Test**: Call `connect()`, `healthCheck()`, and `disconnect()` with valid Kibo credentials and verify healthy status

### Tests for User Story 1 ⚠️ TDD — Write FIRST, Ensure FAIL

- [x] T016 [P] [US1] Unit test for `connect()` success case in `tests/adapter.test.ts`
- [x] T017 [P] [US1] Unit test for `connect()` failure (invalid credentials) in `tests/adapter.test.ts`
- [x] T018 [P] [US1] Unit test for `healthCheck()` in `tests/adapter.test.ts`
- [x] T019 [P] [US1] Unit test for `disconnect()` in `tests/adapter.test.ts`

### Implementation for User Story 1

- [x] T020 [US1] Implement `connect()` method in `src/adapter.ts` — initialize SDK `Configuration`, create API clients
- [x] T021 [US1] Implement `healthCheck()` method in `src/adapter.ts` — call lightweight Kibo endpoint, measure latency
- [x] T022 [US1] Implement `disconnect()` method in `src/adapter.ts` — clear API client instances
- [x] T023 [US1] Add connection state tracking (`_connected`, `_config`, `_clients`) to adapter class

**Checkpoint**: User Story 1 complete — adapter can connect, report health, and disconnect

---

## Phase 4: User Story 2 — Order Operations (Priority: P1)

**Goal**: Retailer can create, retrieve, update, and cancel orders in Kibo via COF

**Independent Test**: Call `createSalesOrder()`, `getOrders()`, `updateOrder()`, `cancelOrder()` and verify Kibo order operations

### Tests for User Story 2 ⚠️ TDD — Write FIRST, Ensure FAIL

- [x] T024 [P] [US2] Unit test for `createSalesOrder()` success in `tests/adapter.test.ts`
- [x] T025 [P] [US2] Unit test for `getOrders()` with filters in `tests/adapter.test.ts`
- [x] T026 [P] [US2] Unit test for `updateOrder()` success in `tests/adapter.test.ts`
- [x] T027 [P] [US2] Unit test for `cancelOrder()` success in `tests/adapter.test.ts`
- [x] T028 [P] [US2] Unit test for `cancelOrder()` API failure error in `tests/adapter.test.ts`
- [x] T029 [P] [US2] Unit test for order transformer in `tests/utils/transformers.test.ts`

### Implementation for User Story 2

- [x] T030 [P] [US2] Create `src/utils/transformers/order.ts` with `mapKiboOrderToCOF()` and `mapCOFOrderToKibo()`
- [x] T031 [P] [US2] Create `src/utils/transformers/address.ts` with `mapKiboAddress()` and `mapAddressToContact()`
- [x] T032 [US2] Implement `createSalesOrder()` in `src/adapter.ts` — use `OrderApi.createOrder()`
- [x] T033 [US2] Implement `getOrders()` in `src/adapter.ts` — use `OrderApi.getOrders()` with filter mapping and pagination
- [x] T034 [US2] Implement `updateOrder()` in `src/adapter.ts` — use `OrderApi.updateOrder()`
- [x] T035 [US2] Implement `cancelOrder()` in `src/adapter.ts` — use `OrderApi.cancelOrder()`

**Checkpoint**: User Story 2 complete — full order CRUD operations working

---

## Phase 5: User Story 3 — Fulfillment/Shipment Operations (Priority: P1)

**Goal**: Retailer can create shipments and retrieve fulfillment records

**Independent Test**: Call `fulfillOrder()` and `getFulfillments()` and verify shipment operations

### Tests for User Story 3 ⚠️ TDD — Write FIRST, Ensure FAIL

- [X] T036 [P] [US3] Unit test for `fulfillOrder()` success in `tests/adapter.test.ts`
- [X] T037 [P] [US3] Unit test for `getFulfillments()` by orderId in `tests/adapter.test.ts`
- [X] T038 [P] [US3] Unit test for `createReturn()` in `tests/adapter.test.ts`
- [X] T039 [P] [US3] Unit test for `getReturns()` in `tests/adapter.test.ts`
- [X] T040 [P] [US3] Unit test for shipment transformer in `tests/utils/transformers.test.ts`

### Implementation for User Story 3

- [X] T041 [P] [US3] Create `src/utils/transformers/shipment.ts` with `mapKiboShipmentToCOF()` and `mapFulfillmentItemToKibo()`
- [X] T042 [US3] Implement `fulfillOrder()` in `src/adapter.ts` — use `ShipmentApi.createShipment()`
- [X] T043 [US3] Implement `getFulfillments()` in `src/adapter.ts` — use `ShipmentApi.getShipments()` with filter
- [X] T044 [US3] Implement `createReturn()` in `src/adapter.ts` — use `ReturnApi.createReturn()`
- [X] T045 [US3] Implement `getReturns()` in `src/adapter.ts` — use `ReturnApi.getReturns()`

**Checkpoint**: User Story 3 complete — fulfillment operations working

---

## Phase 6: User Story 4 — Inventory Operations (Priority: P2)

**Goal**: Retailer can query inventory levels from Kibo

**Independent Test**: Call `getInventory()` with SKU/location filters and verify stock levels

### Tests for User Story 4 ⚠️ TDD — Write FIRST, Ensure FAIL

- [X] T046 [P] [US4] Unit test for `getInventory()` by SKU in `tests/adapter.test.ts`
- [X] T047 [P] [US4] Unit test for `getInventory()` by location in `tests/adapter.test.ts`
- [X] T048 [P] [US4] Unit test for `getInventory()` empty result in `tests/adapter.test.ts`
- [X] T049 [P] [US4] Unit test for inventory transformer in `tests/utils/transformers.test.ts`

### Implementation for User Story 4

- [X] T050 [P] [US4] Create `src/utils/transformers/inventory.ts` with `mapKiboInventoryToCOF()`
- [X] T051 [US4] Implement `getInventory()` in `src/adapter.ts` — use `InventoryApi.getProductInventories()`

**Checkpoint**: User Story 4 complete — inventory queries working

---

## Phase 7: User Story 5 — Product and Catalog Operations (Priority: P2)

**Goal**: Retailer can retrieve products and variants from Kibo catalog

**Independent Test**: Call `getProducts()` and `getProductVariants()` and verify catalog data

### Tests for User Story 5 ⚠️ TDD — Write FIRST, Ensure FAIL

- [X] T052 [P] [US5] Unit test for `getProducts()` with filter in `tests/adapter.test.ts`
- [X] T053 [P] [US5] Unit test for `getProductVariants()` in `tests/adapter.test.ts`
- [X] T054 [P] [US5] Unit test for `getProducts()` empty result in `tests/adapter.test.ts`
- [X] T055 [P] [US5] Unit test for product transformer in `tests/utils/transformers.test.ts`

### Implementation for User Story 5

- [X] T056 [P] [US5] Create `src/utils/transformers/product.ts` with `mapKiboProductToCOF()` and `mapKiboVariantToCOF()`
- [X] T057 [US5] Implement `getProducts()` in `src/adapter.ts` — use `ProductsApi.getProducts()`
- [X] T058 [US5] Implement `getProductVariants()` in `src/adapter.ts` — use `ProductsApi.getProduct()` to extract variants

**Checkpoint**: User Story 5 complete — product queries working

---

## Phase 8: User Story 6 — Customer Operations (Priority: P3)

**Goal**: Retailer can retrieve customer information from Kibo

**Independent Test**: Call `getCustomers()` with email/ID filters and verify customer data

### Tests for User Story 6 ⚠️ TDD — Write FIRST, Ensure FAIL

- [X] T059 [P] [US6] Unit test for `getCustomers()` by email in `tests/adapter.test.ts`
- [X] T060 [P] [US6] Unit test for `getCustomers()` by customerId in `tests/adapter.test.ts`
- [X] T061 [P] [US6] Unit test for customer transformer in `tests/utils/transformers.test.ts`

### Implementation for User Story 6

- [X] T062 [P] [US6] Create `src/utils/transformers/customer.ts` with `mapKiboCustomerToCOF()`
- [X] T063 [US6] Implement `getCustomers()` in `src/adapter.ts` — use `CustomerAccountsApi.getCustomerAccounts()`

**Checkpoint**: User Story 6 complete — customer queries working

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, examples, and final validation

- [X] T064 [P] Update `docs/API.md` with all implemented method signatures
- [X] T065 [P] Update `docs/CONFIGURATION.md` with `KiboAdapterOptions` documentation
- [X] T066 [P] Update `examples/basic-usage.ts` with working Kibo connection example
- [X] T067 [P] Update `examples/advanced-config.ts` with retry and timeout configuration
- [ ] T068 [P] Create `tests/integration/kibo-sandbox.test.ts` for sandbox integration tests (optional, requires credentials)
- [X] T069 Run `npm run test:coverage` and verify 80%+ coverage
- [X] T070 Run `npx tsc --noEmit` and verify zero type errors (no `any`)
- [ ] T071 Run quickstart.md validation — ensure all code samples work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational completion
  - P1 stories (US1, US2, US3) should complete before P2/P3
  - Within same priority, stories can run in parallel
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Priority | Dependencies | Can Parallel With |
|-------|----------|--------------|-------------------|
| US1: Lifecycle | P1 | Phase 2 only | — (do first) |
| US2: Orders | P1 | US1 (needs connect) | US3 (after US1) |
| US3: Fulfillments | P1 | US1 (needs connect) | US2 (after US1) |
| US4: Inventory | P2 | US1 (needs connect) | US5, US6 |
| US5: Products | P2 | US1 (needs connect) | US4, US6 |
| US6: Customers | P3 | US1 (needs connect) | US4, US5 |

### Within Each User Story (TDD Flow)

1. ⚠️ Tests FIRST — write all tests, ensure they FAIL
2. Transformers — create entity mapping functions
3. Adapter methods — implement interface methods
4. Verify tests PASS

### Parallel Opportunities

```bash
# Phase 1 — all setup tasks in parallel:
T002, T003, T004, T005

# Phase 2 — all foundational in parallel:
T007, T008, T009, T011, T012, T013, T014, T015

# Phase 3 (US1) — all tests in parallel:
T016, T017, T018, T019

# After US1 complete — US2 and US3 tests in parallel:
T024-T029, T036-T040

# P2 stories (US4, US5) — can run in parallel:
Phase 6 and Phase 7 simultaneously

# Polish — all docs in parallel:
T064, T065, T066, T067
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Lifecycle)
4. **STOP and VALIDATE**: Test `connect()`, `healthCheck()`, `disconnect()`
5. Complete Phase 4: User Story 2 (Orders)
6. Complete Phase 5: User Story 3 (Fulfillments)
7. **DEPLOY MVP**: Core adapter with orders + fulfillments

### Incremental Delivery

| Increment | User Stories | Capability |
|-----------|--------------|------------|
| MVP | US1 + US2 + US3 | Connect, Orders, Fulfillments |
| +Inventory | US4 | Stock level queries |
| +Catalog | US5 | Product queries |
| +Customers | US6 | Customer queries |

### Coverage Milestones

- After Phase 2: ~20% (foundational code)
- After US1-3: ~60% (P1 stories)
- After US4-5: ~75% (P2 stories)
- After US6: ~80% (target met)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- TDD is NON-NEGOTIABLE per constitution — tests written FIRST
- Type safety is NON-NEGOTIABLE — no `any` types allowed
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
