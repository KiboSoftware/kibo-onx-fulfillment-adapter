# Research: Kibo SDK Integration

**Feature**: 001-kibo-adapter-impl | **Date**: 2026-02-04

## Research Tasks

### RT1: Kibo SDK Authentication Pattern ✅

**Question**: How does `@kibocommerce/rest-sdk` handle OAuth 2.0 authentication?

**Findings**:
- SDK uses `Configuration` class that wraps all auth parameters
- `APIAuthClient` handles client credentials flow automatically
- Token cached in `apiAuthMemCache` singleton
- Token auto-refreshes when expired (before API calls)

**Source**: [KiboSoftware/typescript-rest-sdk](https://github.com/KiboSoftware/typescript-rest-sdk)

**Code Pattern**:
```typescript
import { Configuration } from '@kibocommerce/rest-sdk';

const configuration = new Configuration({
  tenantId: process.env.KIBO_TENANT_ID,
  siteId: process.env.KIBO_SITE_ID,
  clientId: process.env.KIBO_CLIENT_ID,
  sharedSecret: process.env.KIBO_SHARED_SECRET,
  authHost: process.env.KIBO_AUTH_HOST || 'home.mozu.com',
});
```

---

### RT2: Kibo Order API Structure ✅

**Question**: What are the key Order API endpoints and response shapes?

**Findings**:
- `OrderApi.getOrder(orderId)` — Single order by ID
- `OrderApi.getOrders(filter?, pageSize?, startIndex?)` — Paginated list
- `OrderApi.createOrder(order)` — Create new order
- `OrderApi.updateOrder(orderId, orderDelta)` — Partial update
- `OrderApi.cancelOrder(orderId)` — Cancel order

**Response Shape**:
```typescript
interface KiboOrder {
  id: string;
  orderNumber: number;
  status: string;
  submittedDate: string;
  customerAccountId: number;
  email: string;
  fulfillmentInfo: {
    shippingMethodCode: string;
    fulfillmentContact: Contact;
  };
  items: OrderItem[];
  total: number;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
}
```

---

### RT3: Kibo Shipment/Fulfillment API ✅

**Question**: How does Kibo represent fulfillments/shipments?

**Findings**:
- Kibo calls them "Shipments" not "Fulfillments"
- Located in `@kibocommerce/rest-sdk/clients/Fulfillment`
- `ShipmentApi.getShipments(orderId)` — Get shipments for order
- `ShipmentApi.createShipment(shipment)` — Create new shipment

**Key Fields**:
```typescript
interface KiboShipment {
  id: string;
  shipmentNumber: number;
  orderId: string;
  status: 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  carrier?: string;
  items: ShipmentItem[];
  shippedDate?: string;
  deliveredDate?: string;
}
```

---

### RT4: Kibo Inventory API ✅

**Question**: How to query inventory levels?

**Findings**:
- `InventoryApi` in `@kibocommerce/rest-sdk/clients/Inventory`
- `getProductInventory(productCode)` — Single product inventory
- `getProductInventories(productCodes)` — Bulk inventory query
- Location-aware: inventory tied to fulfillment locations

**Key Fields**:
```typescript
interface KiboInventory {
  productCode: string;
  locationCode: string;
  available: number;
  allocated: number;
  onHand: number;
}
```

---

### RT5: Kibo Product API ✅

**Question**: How to fetch products and variants?

**Findings**:
- `ProductsApi` in `@kibocommerce/rest-sdk/clients/CatalogAdministration`
- `getProduct(productCode)` — Single product with variants
- `getProducts(filter?, pageSize?, startIndex?)` — Paginated list
- Variants are nested within Product as `variations` array

**Key Fields**:
```typescript
interface KiboProduct {
  productCode: string;
  productName: string;
  productType: string;
  isVariation: boolean;
  variations?: ProductVariation[];
  properties: ProductProperty[];
  price: {
    price: number;
    salePrice?: number;
  };
}
```

---

### RT6: Kibo Customer API ✅

**Question**: How to fetch customer accounts?

**Findings**:
- `CustomerAccountsApi` in `@kibocommerce/rest-sdk/clients/Customer`
- `getCustomerAccount(accountId)` — Single customer
- `getCustomerAccounts(filter?, pageSize?, startIndex?)` — Paginated list

**Key Fields**:
```typescript
interface KiboCustomer {
  id: number;
  emailAddress: string;
  firstName: string;
  lastName: string;
  phoneNumbers?: { home?: string; mobile?: string };
  addresses?: CustomerAddress[];
}
```

---

### RT7: Pagination Pattern ✅

**Question**: How does Kibo pagination work?

**Findings**:
- All list endpoints use `startIndex` + `pageSize` pattern
- Response includes `totalCount` for total items
- Default `pageSize` is typically 20, max 200
- No cursor-based pagination, purely offset-based

**Pattern**:
```typescript
const response = await api.getOrders({
  filter: 'status eq "Active"',
  pageSize: 50,
  startIndex: 0,
});
// response.items, response.totalCount
```

---

### RT8: Error Handling ✅

**Question**: What error shapes does Kibo SDK throw?

**Findings**:
- SDK throws `FetchError` for network issues
- HTTP errors include `status` and `message`
- Validation errors include `errorCode` and `items` array
- Rate limits return HTTP 429 with `Retry-After` header

**Error Shape**:
```typescript
interface KiboApiError {
  errorCode: string;
  message: string;
  items?: { name: string; message: string }[];
}
```

---

## Unresolved Questions

None — all research tasks resolved.

## Recommendations

1. **Use SDK Configuration directly** — No need for custom auth wrapper
2. **Create thin transformer layer** — Map Kibo types to COF types
3. **Implement retry logic** — Exponential backoff for 429/5xx errors
4. **Cache Configuration instance** — Reuse across API clients
