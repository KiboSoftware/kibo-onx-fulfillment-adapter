/**
 * Test Fixtures: Kibo Orders
 *
 * Sample Kibo order payloads for unit testing.
 */

import type { KiboOrder, KiboOrderItem, KiboContact } from '../../src/types.js';

/**
 * Sample Kibo contact (shipping/billing address).
 */
export const sampleKiboContact: KiboContact = {
  id: 1001,
  email: 'john.doe@example.com',
  firstName: 'John',
  lastNameOrSurname: 'Doe',
  companyOrOrganization: 'Acme Corp',
  phoneNumbers: {
    home: '555-123-4567',
    mobile: '555-987-6543',
  },
  address: {
    address1: '123 Main Street',
    address2: 'Suite 100',
    cityOrTown: 'Austin',
    stateOrProvince: 'TX',
    postalOrZipCode: '78701',
    countryCode: 'US',
    addressType: 'Residential',
    isValidated: true,
  },
};

/**
 * Sample Kibo order item.
 */
export const sampleKiboOrderItem: KiboOrderItem = {
  id: 'item-001',
  lineId: 1,
  product: {
    productCode: 'WIDGET-001',
    name: 'Premium Widget',
    description: 'A high-quality widget',
    imageUrl: 'https://example.com/images/widget.jpg',
    variationProductCode: 'WIDGET-001-RED',
    options: [
      {
        attributeFQN: 'tenant~color',
        name: 'Color',
        value: 'Red',
      },
    ],
    properties: [],
    price: {
      price: 29.99,
      salePrice: 24.99,
    },
  },
  quantity: 2,
  subtotal: 49.98,
  extendedTotal: 49.98,
  taxTotal: 4.12,
  discountTotal: 10.0,
  fulfillmentLocationCode: 'WAREHOUSE-01',
  fulfillmentMethod: 'Ship',
};

/**
 * Sample Kibo order - Submitted status.
 */
export const sampleKiboOrderSubmitted: KiboOrder = {
  id: 'order-12345',
  orderNumber: 100001,
  externalId: 'EXT-ORD-001',
  status: 'Submitted',
  submittedDate: '2026-02-04T10:30:00Z',
  email: 'john.doe@example.com',
  customerAccountId: 5001,
  billingInfo: {
    billingContact: sampleKiboContact,
    paymentType: 'CreditCard',
  },
  fulfillmentInfo: {
    fulfillmentContact: sampleKiboContact,
    shippingMethodCode: 'fedex-ground',
    shippingMethodName: 'FedEx Ground',
  },
  items: [sampleKiboOrderItem],
  subtotal: 49.98,
  shippingSubTotal: 5.99,
  shippingTotal: 5.99,
  handlingSubTotal: 0,
  handlingTotal: 0,
  taxTotal: 4.12,
  discountTotal: 10.0,
  total: 50.09,
  currencyCode: 'USD',
  notes: [
    {
      id: 'note-001',
      text: 'Please gift wrap',
      auditInfo: {
        createDate: '2026-02-04T10:30:00Z',
        createBy: 'customer',
      },
    },
  ],
  attributes: [
    {
      fullyQualifiedName: 'tenant~priority',
      values: ['high'],
    },
  ],
  auditInfo: {
    createDate: '2026-02-04T10:30:00Z',
    createBy: 'system',
    updateDate: '2026-02-04T10:35:00Z',
    updateBy: 'system',
  },
};

/**
 * Sample Kibo order - Processing status.
 */
export const sampleKiboOrderProcessing: KiboOrder = {
  ...sampleKiboOrderSubmitted,
  id: 'order-12346',
  orderNumber: 100002,
  status: 'Processing',
  acceptedDate: '2026-02-04T11:00:00Z',
};

/**
 * Sample Kibo order - Completed status.
 */
export const sampleKiboOrderCompleted: KiboOrder = {
  ...sampleKiboOrderSubmitted,
  id: 'order-12347',
  orderNumber: 100003,
  status: 'Completed',
  closedDate: '2026-02-04T15:00:00Z',
};

/**
 * Sample Kibo order - Cancelled status.
 */
export const sampleKiboOrderCancelled: KiboOrder = {
  ...sampleKiboOrderSubmitted,
  id: 'order-12348',
  orderNumber: 100004,
  status: 'Cancelled',
  cancelledDate: '2026-02-04T12:00:00Z',
};

/**
 * Sample Kibo order collection (paginated response).
 */
export const sampleKiboOrderCollection = {
  items: [sampleKiboOrderSubmitted, sampleKiboOrderProcessing],
  totalCount: 2,
  pageCount: 1,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Empty Kibo order collection.
 */
export const emptyKiboOrderCollection = {
  items: [],
  totalCount: 0,
  pageCount: 0,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Creates a Kibo order with custom overrides.
 */
export function createKiboOrder(overrides: Partial<KiboOrder> = {}): KiboOrder {
  return {
    ...sampleKiboOrderSubmitted,
    id: `order-${Date.now()}`,
    orderNumber: Math.floor(Math.random() * 1000000),
    ...overrides,
  };
}
