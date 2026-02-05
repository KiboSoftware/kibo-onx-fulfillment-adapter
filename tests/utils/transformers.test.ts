/**
 * Unit tests for Order and Address Transformers
 *
 * TDD tests for Kibo-to-COF and COF-to-Kibo transformations.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  mapKiboContactToAddress,
  mapAddressToKiboContact,
  type COFAddress,
} from '../../src/utils/transformers/address.js';
import {
  mapKiboOrderToCOF,
  mapCOFOrderInputToKibo,
  mapKiboOrderItemToLineItem,
} from '../../src/utils/transformers/order.js';
import {
  mapKiboInventoryToCOF,
  mapKiboInventoryListToCOF,
} from '../../src/utils/transformers/inventory.js';
import {
  mapKiboProductToCOF,
  mapKiboProductListToCOF,
  mapKiboVariantToCOF,
  mapKiboVariantListToCOF,
  extractProductOptions,
} from '../../src/utils/transformers/product.js';
import type { KiboContact, KiboOrder, KiboOrderItem } from '../../src/types.js';

// ============================================================================
// Test Fixtures (inline to avoid rootDir issues)
// ============================================================================

const sampleKiboContact: KiboContact = {
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
  },
};

const sampleKiboOrderItem: KiboOrderItem = {
  id: 'item-001',
  lineId: 1,
  product: {
    productCode: 'WIDGET-001',
    name: 'Premium Widget',
    variationProductCode: 'WIDGET-001-RED',
    options: [
      {
        attributeFQN: 'tenant~color',
        name: 'Color',
        value: 'Red',
      },
    ],
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
};

const sampleKiboOrderSubmitted: KiboOrder = {
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
  shippingTotal: 5.99,
  taxTotal: 4.12,
  discountTotal: 10.0,
  total: 50.09,
  currencyCode: 'USD',
  notes: [
    {
      id: 'note-001',
      text: 'Please gift wrap',
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
    updateDate: '2026-02-04T10:35:00Z',
  },
};

// ============================================================================
// Address Transformer Tests
// ============================================================================

describe('Address Transformer', () => {
  describe('mapKiboContactToAddress', () => {
    it('should map a complete Kibo contact to COF address', () => {
      const address = mapKiboContactToAddress(sampleKiboContact);

      expect(address).toBeDefined();
      expect(address?.firstName).toBe('John');
      expect(address?.lastName).toBe('Doe');
      expect(address?.company).toBe('Acme Corp');
      expect(address?.email).toBe('john.doe@example.com');
      expect(address?.address1).toBe('123 Main Street');
      expect(address?.address2).toBe('Suite 100');
      expect(address?.city).toBe('Austin');
      expect(address?.stateOrProvince).toBe('TX');
      expect(address?.zipCodeOrPostalCode).toBe('78701');
      expect(address?.country).toBe('US');
    });

    it('should prefer mobile phone over home phone', () => {
      const contact: KiboContact = {
        phoneNumbers: {
          home: '555-111-1111',
          mobile: '555-222-2222',
        },
      };

      const address = mapKiboContactToAddress(contact);

      expect(address?.phone).toBe('555-222-2222');
    });

    it('should fall back to home phone if mobile is not available', () => {
      const contact: KiboContact = {
        phoneNumbers: {
          home: '555-111-1111',
        },
      };

      const address = mapKiboContactToAddress(contact);

      expect(address?.phone).toBe('555-111-1111');
    });

    it('should return undefined for undefined contact', () => {
      const address = mapKiboContactToAddress(undefined);
      expect(address).toBeUndefined();
    });

    it('should handle partial contact with only address', () => {
      const contact: KiboContact = {
        address: {
          address1: '456 Oak Street',
          cityOrTown: 'Dallas',
        },
      };

      const address = mapKiboContactToAddress(contact);

      expect(address?.address1).toBe('456 Oak Street');
      expect(address?.city).toBe('Dallas');
      expect(address?.firstName).toBeUndefined();
    });
  });

  describe('mapAddressToKiboContact', () => {
    it('should map a complete COF address to Kibo contact', () => {
      const cofAddress: COFAddress = {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Inc',
        email: 'jane@tech.com',
        phone: '555-999-8888',
        address1: '789 Pine Road',
        address2: 'Apt 42',
        city: 'Houston',
        stateOrProvince: 'TX',
        zipCodeOrPostalCode: '77001',
        country: 'US',
      };

      const contact = mapAddressToKiboContact(cofAddress);

      expect(contact).toBeDefined();
      expect(contact?.firstName).toBe('Jane');
      expect(contact?.lastNameOrSurname).toBe('Smith');
      expect(contact?.companyOrOrganization).toBe('Tech Inc');
      expect(contact?.email).toBe('jane@tech.com');
      expect(contact?.phoneNumbers?.home).toBe('555-999-8888');
      expect(contact?.address?.address1).toBe('789 Pine Road');
      expect(contact?.address?.cityOrTown).toBe('Houston');
    });

    it('should use email override if provided', () => {
      const cofAddress: COFAddress = {
        email: 'original@test.com',
      };

      const contact = mapAddressToKiboContact(cofAddress, 'override@test.com');

      expect(contact?.email).toBe('override@test.com');
    });

    it('should return undefined for undefined address', () => {
      const contact = mapAddressToKiboContact(undefined);
      expect(contact).toBeUndefined();
    });
  });
});

// ============================================================================
// Order Transformer Tests
// ============================================================================

describe('Order Transformer', () => {
  const testTenantId = 'tenant-123';

  describe('mapKiboOrderItemToLineItem', () => {
    it('should map a complete order item', () => {
      const lineItem = mapKiboOrderItemToLineItem(sampleKiboOrderItem);

      expect(lineItem.sku).toBe('WIDGET-001-RED');
      expect(lineItem.quantity).toBe(2);
      expect(lineItem.unitPrice).toBe(24.99);
      expect(lineItem.totalPrice).toBe(49.98);
      expect(lineItem.name).toBe('Premium Widget');
    });

    it('should fall back to productCode when variationProductCode is not present', () => {
      const item: KiboOrderItem = {
        product: {
          productCode: 'SIMPLE-PROD',
        },
        quantity: 1,
      };

      const lineItem = mapKiboOrderItemToLineItem(item);

      expect(lineItem.sku).toBe('SIMPLE-PROD');
    });

    it('should map options to custom fields', () => {
      const lineItem = mapKiboOrderItemToLineItem(sampleKiboOrderItem);

      expect(lineItem.customFields).toBeDefined();
      expect(lineItem.customFields?.length).toBe(1);
      expect(lineItem.customFields?.[0]?.name).toBe('Color');
      expect(lineItem.customFields?.[0]?.value).toBe('Red');
    });

    it('should default quantity to 1 if not specified', () => {
      const item: KiboOrderItem = {
        product: {
          productCode: 'TEST',
        },
      };

      const lineItem = mapKiboOrderItemToLineItem(item);

      expect(lineItem.quantity).toBe(1);
    });
  });

  describe('mapKiboOrderToCOF', () => {
    it('should map a complete Kibo order to COF order', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.id).toBe('100001');
      expect(order.externalId).toBe('EXT-ORD-001');
      expect(order.tenantId).toBe(testTenantId);
      expect(order.status).toBe('PROCESSING');
      expect(order.name).toBe('Order #100001');
    });

    it('should map order totals correctly', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.subTotalPrice).toBe(49.98);
      expect(order.shippingPrice).toBe(5.99);
      expect(order.orderTax).toBe(4.12);
      expect(order.orderDiscount).toBe(10.0);
      expect(order.totalPrice).toBe(50.09);
      expect(order.currency).toBe('USD');
    });

    it('should map line items', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.lineItems).toBeDefined();
      expect(order.lineItems.length).toBe(1);
      expect(order.lineItems[0]?.sku).toBe('WIDGET-001-RED');
    });

    it('should map billing address', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.billingAddress).toBeDefined();
      expect(order.billingAddress?.firstName).toBe('John');
      expect(order.billingAddress?.lastName).toBe('Doe');
    });

    it('should map shipping address', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.shippingAddress).toBeDefined();
      expect(order.shippingAddress?.city).toBe('Austin');
    });

    it('should map shipping method', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.shippingCode).toBe('fedex-ground');
      expect(order.shippingClass).toBe('FedEx Ground');
    });

    it('should map order notes', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.orderNote).toBe('Please gift wrap');
    });

    it('should map Kibo attributes to custom fields', () => {
      const order = mapKiboOrderToCOF(sampleKiboOrderSubmitted, testTenantId);

      expect(order.customFields).toBeDefined();
      expect(order.customFields?.length).toBe(1);
      expect(order.customFields?.[0]?.name).toBe('tenant~priority');
      expect(order.customFields?.[0]?.value).toBe('high');
    });

    it('should map different Kibo statuses correctly', () => {
      const pendingOrder: KiboOrder = { ...sampleKiboOrderSubmitted, status: 'Pending' };
      const completedOrder: KiboOrder = { ...sampleKiboOrderSubmitted, status: 'Completed' };
      const cancelledOrder: KiboOrder = { ...sampleKiboOrderSubmitted, status: 'Cancelled' };

      expect(mapKiboOrderToCOF(pendingOrder, testTenantId).status).toBe('PENDING');
      expect(mapKiboOrderToCOF(completedOrder, testTenantId).status).toBe('COMPLETED');
      expect(mapKiboOrderToCOF(cancelledOrder, testTenantId).status).toBe('CANCELLED');
    });
  });

  describe('mapCOFOrderInputToKibo', () => {
    it('should map basic order input', () => {
      const input = {
        order: {
          lineItems: [
            { sku: 'SKU-001', quantity: 2 },
            { sku: 'SKU-002', quantity: 1, unitPrice: 19.99 },
          ],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.items).toHaveLength(2);
      expect(request.items[0]?.product.productCode).toBe('SKU-001');
      expect(request.items[0]?.quantity).toBe(2);
      expect(request.items[1]?.unitPrice?.listAmount).toBe(19.99);
    });

    it('should map customer email', () => {
      const input = {
        order: {
          customer: {
            id: 'cust-1',
            email: 'test@example.com',
            tenantId: 'tenant-1',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.email).toBe('test@example.com');
    });

    it('should map billing address', () => {
      const input = {
        order: {
          billingAddress: {
            firstName: 'Test',
            lastName: 'User',
            address1: '123 Test St',
            city: 'TestCity',
            stateOrProvince: 'TX',
            zipCodeOrPostalCode: '12345',
            country: 'US',
          },
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.billingInfo?.billingContact?.firstName).toBe('Test');
      expect(request.billingInfo?.billingContact?.address?.address1).toBe('123 Test St');
    });

    it('should map shipping address', () => {
      const input = {
        order: {
          shippingAddress: {
            firstName: 'Ship',
            lastName: 'Here',
            address1: '456 Delivery Ave',
          },
          shippingCode: 'fedex-overnight',
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.fulfillmentInfo?.fulfillmentContact?.firstName).toBe('Ship');
      expect(request.fulfillmentInfo?.shippingMethodCode).toBe('fedex-overnight');
    });

    it('should map order notes', () => {
      const input = {
        order: {
          orderNote: 'Please handle with care',
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.notes).toHaveLength(1);
      expect(request.notes?.[0]?.text).toBe('Please handle with care');
    });

    it('should map custom fields to Kibo attributes', () => {
      const input = {
        order: {
          customFields: [
            { name: 'priority', value: 'high' },
            { name: 'source', value: 'web' },
          ],
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.attributes).toHaveLength(2);
      expect(request.attributes?.[0]?.fullyQualifiedName).toBe('priority');
      expect(request.attributes?.[0]?.values).toEqual(['high']);
    });

    it('should map external ID', () => {
      const input = {
        order: {
          externalId: 'EXT-123',
          lineItems: [{ sku: 'SKU-001', quantity: 1 }],
        },
      };

      const request = mapCOFOrderInputToKibo(input);

      expect(request.externalId).toBe('EXT-123');
    });
  });
});

// ============================================================================
// Shipment Transformer Tests (T040)
// ============================================================================

describe('Shipment Transformers', () => {
  // Import dynamically to avoid issues
  let mapKiboShipmentToCOF: typeof import('../../src/utils/transformers/shipment.js').mapKiboShipmentToCOF;
  let mapKiboShipmentStatusToCOF: typeof import('../../src/utils/transformers/shipment.js').mapKiboShipmentStatusToCOF;
  let extractTrackingNumbers: typeof import('../../src/utils/transformers/shipment.js').extractTrackingNumbers;
  let mapKiboShipmentItemsToCOF: typeof import('../../src/utils/transformers/shipment.js').mapKiboShipmentItemsToCOF;

  beforeAll(async () => {
    const shipmentModule = await import('../../src/utils/transformers/shipment.js');
    mapKiboShipmentToCOF = shipmentModule.mapKiboShipmentToCOF;
    mapKiboShipmentStatusToCOF = shipmentModule.mapKiboShipmentStatusToCOF;
    extractTrackingNumbers = shipmentModule.extractTrackingNumbers;
    mapKiboShipmentItemsToCOF = shipmentModule.mapKiboShipmentItemsToCOF;
  });

  describe('mapKiboShipmentStatusToCOF', () => {
    it('should map Ready status to PENDING', () => {
      expect(mapKiboShipmentStatusToCOF('Ready')).toBe('PENDING');
    });

    it('should map Shipped status to SHIPPED', () => {
      expect(mapKiboShipmentStatusToCOF('Shipped')).toBe('SHIPPED');
    });

    it('should map Delivered status to DELIVERED', () => {
      expect(mapKiboShipmentStatusToCOF('Delivered')).toBe('DELIVERED');
    });

    it('should map Cancelled status to CANCELLED', () => {
      expect(mapKiboShipmentStatusToCOF('Cancelled')).toBe('CANCELLED');
    });

    it('should return PENDING for unknown status', () => {
      expect(mapKiboShipmentStatusToCOF('Unknown')).toBe('PENDING');
    });

    it('should return PENDING for undefined status', () => {
      expect(mapKiboShipmentStatusToCOF(undefined)).toBe('PENDING');
    });
  });

  describe('extractTrackingNumbers', () => {
    it('should extract tracking numbers from packages', () => {
      const packages = [
        { trackingNumber: '1Z999AA10123456784', carrier: 'UPS' },
        { trackingNumber: '9405511899223456789012', carrier: 'USPS' },
      ];

      const result = extractTrackingNumbers(packages);

      expect(result).toEqual(['1Z999AA10123456784', '9405511899223456789012']);
    });

    it('should filter out packages without tracking numbers', () => {
      const packages = [
        { trackingNumber: '1Z999AA10123456784', carrier: 'UPS' },
        { carrier: 'FedEx' }, // no tracking number
      ];

      const result = extractTrackingNumbers(packages);

      expect(result).toEqual(['1Z999AA10123456784']);
    });

    it('should return empty array for empty packages', () => {
      expect(extractTrackingNumbers([])).toEqual([]);
    });

    it('should return empty array for undefined packages', () => {
      expect(extractTrackingNumbers(undefined)).toEqual([]);
    });
  });

  describe('mapKiboShipmentItemsToCOF', () => {
    it('should map shipment items to COF line items', () => {
      const items = [
        { lineId: 1, productCode: 'WIDGET-001', quantity: 2 },
        { lineId: 2, productCode: 'GADGET-002', quantity: 1 },
      ];

      const result = mapKiboShipmentItemsToCOF(items);

      expect(result).toEqual([
        { sku: 'WIDGET-001', quantity: 2 },
        { sku: 'GADGET-002', quantity: 1 },
      ]);
    });

    it('should filter out items without productCode', () => {
      const items = [
        { lineId: 1, productCode: 'WIDGET-001', quantity: 2 },
        { lineId: 2, quantity: 1 }, // missing productCode
      ];

      const result = mapKiboShipmentItemsToCOF(items);

      expect(result).toHaveLength(1);
      expect(result[0]?.sku).toBe('WIDGET-001');
    });

    it('should return empty array for empty items', () => {
      expect(mapKiboShipmentItemsToCOF([])).toEqual([]);
    });
  });

  describe('mapKiboShipmentToCOF', () => {
    const sampleKiboShipment = {
      id: 'shipment-001',
      shipmentNumber: 500001,
      orderId: 'order-12345',
      orderNumber: 100001,
      shipmentStatus: 'Shipped',
      packages: [
        {
          packageId: 'pkg-001',
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
        },
      ],
      items: [
        { lineId: 1, productCode: 'WIDGET-001', quantity: 2 },
      ],
      destinationContact: sampleKiboContact,
      auditInfo: {
        createDate: '2026-02-04T11:00:00Z',
        updateDate: '2026-02-04T14:00:00Z',
      },
    };

    it('should map a complete Kibo shipment to COF fulfillment', () => {
      const result = mapKiboShipmentToCOF(sampleKiboShipment, 'tenant-123');

      expect(result.id).toBe('shipment-001');
      expect(result.orderId).toBe('order-12345');
      expect(result.status).toBe('SHIPPED');
      expect(result.trackingNumbers).toEqual(['1Z999AA10123456784']);
      expect(result.lineItems).toHaveLength(1);
      expect(result.tenantId).toBe('tenant-123');
      expect(result.shippingCarrier).toBe('UPS');
    });

    it('should include shipping address when destination contact exists', () => {
      const result = mapKiboShipmentToCOF(sampleKiboShipment, 'tenant-123');

      expect(result.shippingAddress).toBeDefined();
      expect(result.shippingAddress?.city).toBe('Austin');
      expect(result.shippingAddress?.country).toBe('US');
    });

    it('should handle shipment without packages', () => {
      const shipmentWithoutPackages = {
        ...sampleKiboShipment,
        packages: [],
      };

      const result = mapKiboShipmentToCOF(shipmentWithoutPackages, 'tenant-123');

      expect(result.trackingNumbers).toEqual([]);
      expect(result.shippingCarrier).toBeUndefined();
    });
  });
});

// ============================================================================
// Return Transformer Tests (T040)
// ============================================================================

describe('Return Transformers', () => {
  let mapKiboReturnToCOF: typeof import('../../src/utils/transformers/return.js').mapKiboReturnToCOF;
  let mapKiboReturnStatusToCOF: typeof import('../../src/utils/transformers/return.js').mapKiboReturnStatusToCOF;
  let mapKiboReturnItemsToCOF: typeof import('../../src/utils/transformers/return.js').mapKiboReturnItemsToCOF;

  beforeAll(async () => {
    const returnModule = await import('../../src/utils/transformers/return.js');
    mapKiboReturnToCOF = returnModule.mapKiboReturnToCOF;
    mapKiboReturnStatusToCOF = returnModule.mapKiboReturnStatusToCOF;
    mapKiboReturnItemsToCOF = returnModule.mapKiboReturnItemsToCOF;
  });

  describe('mapKiboReturnStatusToCOF', () => {
    it('should map Created status to PENDING', () => {
      expect(mapKiboReturnStatusToCOF('Created')).toBe('PENDING');
    });

    it('should map Received status to RECEIVED', () => {
      expect(mapKiboReturnStatusToCOF('Received')).toBe('RECEIVED');
    });

    it('should map Processed status to PROCESSING', () => {
      expect(mapKiboReturnStatusToCOF('Processed')).toBe('PROCESSING');
    });

    it('should map Refunded status to COMPLETED', () => {
      expect(mapKiboReturnStatusToCOF('Refunded')).toBe('COMPLETED');
    });

    it('should map Cancelled status to CANCELLED', () => {
      expect(mapKiboReturnStatusToCOF('Cancelled')).toBe('CANCELLED');
    });

    it('should return PENDING for unknown status', () => {
      expect(mapKiboReturnStatusToCOF('Unknown')).toBe('PENDING');
    });
  });

  describe('mapKiboReturnItemsToCOF', () => {
    it('should map return items to COF return line items', () => {
      const items = [
        { id: 'item-1', productCode: 'WIDGET-001', quantity: 1, returnReason: 'Defective' },
        { id: 'item-2', productCode: 'GADGET-002', quantity: 2, returnReason: 'Wrong size' },
      ];

      const result = mapKiboReturnItemsToCOF(items);

      expect(result).toHaveLength(2);
      expect(result[0]?.sku).toBe('WIDGET-001');
      expect(result[0]?.quantityReturned).toBe(1);
      expect(result[0]?.returnReason).toBe('Defective');
    });

    it('should filter out items without productCode', () => {
      const items = [
        { id: 'item-1', productCode: 'WIDGET-001', quantity: 1, returnReason: 'Defective' },
        { id: 'item-2', quantity: 2, returnReason: 'Wrong size' }, // missing productCode
      ];

      const result = mapKiboReturnItemsToCOF(items);

      expect(result).toHaveLength(1);
    });

    it('should return empty array for empty items', () => {
      expect(mapKiboReturnItemsToCOF([])).toEqual([]);
    });
  });

  describe('mapKiboReturnToCOF', () => {
    const sampleKiboReturn = {
      id: 'return-001',
      returnNumber: 600001,
      originalOrderId: 'order-12345',
      status: 'Created',
      returnType: 'Refund',
      items: [
        { id: 'item-1', productCode: 'WIDGET-001', quantity: 1, returnReason: 'Defective' },
      ],
      refundAmount: 29.99,
      auditInfo: {
        createDate: '2026-02-04T11:00:00Z',
        updateDate: '2026-02-04T11:00:00Z',
      },
    };

    it('should map a complete Kibo return to COF return', () => {
      const result = mapKiboReturnToCOF(sampleKiboReturn, 'tenant-123');

      expect(result.id).toBe('return-001');
      expect(result.orderId).toBe('order-12345');
      expect(result.status).toBe('PENDING');
      expect(result.outcome).toBe('REFUND');
      expect(result.returnLineItems).toHaveLength(1);
      expect(result.tenantId).toBe('tenant-123');
      expect(result.refundAmount).toBe(29.99);
      expect(result.returnNumber).toBe('600001');
    });

    it('should set EXCHANGE outcome for Exchange type', () => {
      const exchangeReturn = {
        ...sampleKiboReturn,
        returnType: 'Exchange',
      };

      const result = mapKiboReturnToCOF(exchangeReturn, 'tenant-123');

      expect(result.outcome).toBe('EXCHANGE');
    });

    it('should set REPLACEMENT outcome for Replace type', () => {
      const replaceReturn = {
        ...sampleKiboReturn,
        returnType: 'Replace',
      };

      const result = mapKiboReturnToCOF(replaceReturn, 'tenant-123');

      expect(result.outcome).toBe('REPLACEMENT');
    });
  });
});

// ============================================================================
// Inventory Transformers (T049)
// ============================================================================

describe('Inventory Transformers', () => {
  describe('mapKiboInventoryToCOF', () => {
    const sampleKiboInventory = {
      locationName: 'Main Warehouse',
      locationCode: 'WH-001',
      tenantID: 12345,
      onHand: 100,
      available: 85,
      allocated: 10,
      pending: 5,
      partNumber: 'WIDGET-001',
      sku: 'SKU-WIDGET-001',
    };

    it('should map a complete Kibo inventory to COF InventoryItem', () => {
      const result = mapKiboInventoryToCOF(sampleKiboInventory, 'tenant-123');

      expect(result.tenantId).toBe('tenant-123');
      expect(result.locationId).toBe('WH-001');
      expect(result.sku).toBe('SKU-WIDGET-001');
      expect(result.onHand).toBe(100);
      expect(result.available).toBe(85);
      expect(result.unavailable).toBe(15); // allocated (10) + pending (5)
    });

    it('should prefer sku over partNumber', () => {
      const result = mapKiboInventoryToCOF(sampleKiboInventory, 'tenant-123');
      expect(result.sku).toBe('SKU-WIDGET-001');
    });

    it('should fall back to partNumber when sku is not present', () => {
      const inventoryWithoutSku = {
        ...sampleKiboInventory,
        sku: undefined,
      };

      const result = mapKiboInventoryToCOF(inventoryWithoutSku, 'tenant-123');
      expect(result.sku).toBe('WIDGET-001');
    });

    it('should handle missing optional fields with defaults', () => {
      const minimalInventory = {
        locationCode: 'WH-MIN',
        sku: 'SKU-MIN',
      };

      const result = mapKiboInventoryToCOF(minimalInventory, 'tenant-123');

      expect(result.onHand).toBe(0);
      expect(result.available).toBe(0);
      expect(result.unavailable).toBe(0);
    });

    it('should compute unavailable as allocated + pending', () => {
      const inventoryWithPending = {
        locationCode: 'WH-001',
        sku: 'SKU-001',
        allocated: 20,
        pending: 15,
      };

      const result = mapKiboInventoryToCOF(inventoryWithPending, 'tenant-123');

      expect(result.unavailable).toBe(35);
    });
  });

  describe('mapKiboInventoryListToCOF', () => {
    it('should map an array of Kibo inventory to COF InventoryItems', () => {
      const inventoryList = [
        { locationCode: 'WH-001', sku: 'SKU-001', available: 10, onHand: 15 },
        { locationCode: 'WH-002', sku: 'SKU-002', available: 20, onHand: 25 },
      ];

      const result = mapKiboInventoryListToCOF(inventoryList, 'tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]?.sku).toBe('SKU-001');
      expect(result[1]?.sku).toBe('SKU-002');
    });

    it('should filter out items without sku or partNumber', () => {
      const inventoryList = [
        { locationCode: 'WH-001', sku: 'SKU-001', available: 10 },
        { locationCode: 'WH-002', available: 20 }, // No SKU
        { locationCode: 'WH-003', partNumber: 'PART-003', available: 30 },
      ];

      const result = mapKiboInventoryListToCOF(inventoryList, 'tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]?.sku).toBe('SKU-001');
      expect(result[1]?.sku).toBe('PART-003');
    });

    it('should return empty array for empty input', () => {
      const result = mapKiboInventoryListToCOF([], 'tenant-123');
      expect(result).toHaveLength(0);
    });
  });
});

// ============================================================================
// Product Transformers (T055)
// ============================================================================

describe('Product Transformers', () => {
  const sampleKiboProduct = {
    productCode: 'PROD-001',
    productUsage: 'Standard',
    productSequence: 1,
    productTypeId: 1,
    isVariation: false,
    content: {
      productName: 'Premium Widget',
      productShortDescription: 'A short description',
      productFullDescription: 'A detailed full description of the product',
      productImages: [
        { imageUrl: 'https://example.com/img1.jpg' },
        { imageUrl: 'https://example.com/img2.jpg' },
      ],
    },
    price: {
      price: 99.99,
      salePrice: 79.99,
    },
    options: [
      { attributeFQN: 'color', values: [{ value: 'Red' }, { value: 'Blue' }] },
      { attributeFQN: 'size', values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }] },
    ],
    properties: [
      { attributeFQN: 'material', values: [{ value: 'Cotton' }] },
    ],
    productInCatalogs: [
      { catalogId: 1 },
      { catalogId: 2 },
    ],
    auditInfo: {
      createDate: '2026-01-01T10:00:00Z',
      updateDate: '2026-02-01T12:00:00Z',
    },
  };

  const sampleKiboVariation = {
    variationProductCode: 'PROD-001-RED-S',
    variationkey: 'red-s',
    isActive: true,
    deltaPrice: {
      value: 5.00,
      currencyCode: 'USD',
    },
    options: [
      { attributeFQN: 'color', value: 'Red' },
      { attributeFQN: 'size', value: 'S' },
    ],
  };

  describe('extractProductOptions', () => {
    it('should extract options from product options array', () => {
      const options = [
        { attributeFQN: 'color', values: [{ value: 'Red' }, { value: 'Blue' }] },
        { attributeFQN: 'size', values: [{ value: 'S' }, { value: 'M' }] },
      ];

      const result = extractProductOptions(options);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('color');
      expect(result[0]?.values).toContain('Red');
      expect(result[0]?.values).toContain('Blue');
    });

    it('should return empty array for empty options', () => {
      const result = extractProductOptions([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for undefined options', () => {
      const result = extractProductOptions(undefined);
      expect(result).toHaveLength(0);
    });
  });

  describe('mapKiboProductToCOF', () => {
    it('should map a complete Kibo product to COF Product', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.id).toBe('PROD-001');
      expect(result.tenantId).toBe('tenant-123');
      expect(result.name).toBe('Premium Widget');
      expect(result.description).toBe('A detailed full description of the product');
      expect(result.externalProductId).toBe('PROD-001');
    });

    it('should extract image URLs', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.imageURLs).toHaveLength(2);
      expect(result.imageURLs?.[0]).toBe('https://example.com/img1.jpg');
    });

    it('should map options correctly', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.options).toHaveLength(2);
      expect(result.options[0]?.name).toBe('color');
    });

    it('should map categories from productInCatalogs', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.categories).toHaveLength(2);
      expect(result.categories?.[0]).toBe('1');
    });

    it('should map custom fields from properties', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.customFields).toHaveLength(1);
      expect(result.customFields?.[0]?.name).toBe('material');
      expect(result.customFields?.[0]?.value).toBe('Cotton');
    });

    it('should use timestamps from auditInfo', () => {
      const result = mapKiboProductToCOF(sampleKiboProduct, 'tenant-123');

      expect(result.createdAt).toBe('2026-01-01T10:00:00Z');
      expect(result.updatedAt).toBe('2026-02-01T12:00:00Z');
    });
  });

  describe('mapKiboProductListToCOF', () => {
    it('should map an array of products', () => {
      const products = [
        { ...sampleKiboProduct, productCode: 'PROD-001' },
        { ...sampleKiboProduct, productCode: 'PROD-002' },
      ];

      const result = mapKiboProductListToCOF(products, 'tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('PROD-001');
      expect(result[1]?.id).toBe('PROD-002');
    });

    it('should filter out products without productCode', () => {
      const products = [
        { ...sampleKiboProduct, productCode: 'PROD-001' },
        { ...sampleKiboProduct, productCode: undefined },
      ];

      const result = mapKiboProductListToCOF(products, 'tenant-123');

      expect(result).toHaveLength(1);
    });
  });

  describe('mapKiboVariantToCOF', () => {
    it('should map a Kibo variation to COF ProductVariant', () => {
      const result = mapKiboVariantToCOF(sampleKiboVariation, 'PROD-001', 'tenant-123');

      expect(result.id).toBe('PROD-001-RED-S');
      expect(result.productId).toBe('PROD-001');
      expect(result.sku).toBe('PROD-001-RED-S');
      expect(result.tenantId).toBe('tenant-123');
    });

    it('should map delta price as variant price', () => {
      const result = mapKiboVariantToCOF(sampleKiboVariation, 'PROD-001', 'tenant-123');

      expect(result.price).toBe(5.00);
    });

    it('should map selected options', () => {
      const result = mapKiboVariantToCOF(sampleKiboVariation, 'PROD-001', 'tenant-123');

      expect(result.selectedOptions).toHaveLength(2);
      expect(result.selectedOptions?.[0]?.name).toBe('color');
      expect(result.selectedOptions?.[0]?.value).toBe('Red');
    });
  });

  describe('mapKiboVariantListToCOF', () => {
    it('should map an array of variations', () => {
      const variations = [
        { ...sampleKiboVariation, variationProductCode: 'PROD-001-RED-S' },
        { ...sampleKiboVariation, variationProductCode: 'PROD-001-BLUE-M' },
      ];

      const result = mapKiboVariantListToCOF(variations, 'PROD-001', 'tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]?.sku).toBe('PROD-001-RED-S');
      expect(result[1]?.sku).toBe('PROD-001-BLUE-M');
    });

    it('should filter out variations without variationProductCode', () => {
      const variations = [
        { ...sampleKiboVariation, variationProductCode: 'PROD-001-RED-S' },
        { ...sampleKiboVariation, variationProductCode: undefined },
      ];

      const result = mapKiboVariantListToCOF(variations, 'PROD-001', 'tenant-123');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for empty input', () => {
      const result = mapKiboVariantListToCOF([], 'PROD-001', 'tenant-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should filter options without attributeFQN', () => {
      const options = [
        { attributeFQN: 'valid', values: [{ value: 'A' }] },
        { attributeFQN: null, values: [{ value: 'B' }] },
        { attributeFQN: undefined, values: [{ value: 'C' }] },
      ];
      const result = extractProductOptions(options);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('valid');
    });

    it('should handle options with empty values array', () => {
      const options = [
        { attributeFQN: 'color', values: [] },
      ];
      const result = extractProductOptions(options);

      expect(result).toHaveLength(1);
      expect(result[0]?.values).toHaveLength(0);
    });

    it('should handle options with null values', () => {
      const options = [
        { attributeFQN: 'size', values: null },
      ];
      const result = extractProductOptions(options);

      expect(result).toHaveLength(1);
      expect(result[0]?.values).toEqual([]);
    });

    it('should filter out empty string values', () => {
      const options = [
        { attributeFQN: 'color', values: [{ value: 'Red' }, { value: '' }, { value: null }] },
      ];
      const result = extractProductOptions(options);

      expect(result[0]?.values).toEqual(['Red']);
    });

    it('should handle product without content', () => {
      const product = { productCode: 'PROD-001', content: undefined };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.name).toBe('');
      expect(result.description).toBeUndefined();
    });

    it('should use short description when full description is missing', () => {
      const product = {
        productCode: 'PROD-001',
        content: {
          productName: 'Test',
          productShortDescription: 'Short desc',
          productFullDescription: undefined,
        },
      };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.description).toBe('Short desc');
    });

    it('should handle product without productInCatalogs', () => {
      const product = { productCode: 'PROD-001', productInCatalogs: undefined };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.categories).toBeUndefined();
    });

    it('should handle product without auditInfo', () => {
      const product = { productCode: 'PROD-001', auditInfo: undefined };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle product without properties', () => {
      const product = { productCode: 'PROD-001', properties: undefined };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.customFields).toBeUndefined();
    });

    it('should filter empty custom fields from properties', () => {
      const product = {
        productCode: 'PROD-001',
        properties: [
          { attributeFQN: 'valid', values: [{ value: 'value1' }] },
          { attributeFQN: '', values: [{ value: 'value2' }] },
          { attributeFQN: 'empty-value', values: [{ value: '' }] },
        ],
      };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.customFields).toHaveLength(1);
    });

    it('should handle product without options', () => {
      const product = { productCode: 'PROD-001', options: undefined };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.options).toEqual([]);
    });

    it('should handle product with empty images array', () => {
      const product = {
        productCode: 'PROD-001',
        content: { productImages: [] },
      };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.imageURLs).toHaveLength(0);
    });

    it('should filter images without URL', () => {
      const product = {
        productCode: 'PROD-001',
        content: {
          productImages: [
            { imageUrl: 'https://img.com/1.jpg' },
            { imageUrl: '' },
            { imageUrl: null },
          ],
        },
      };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.imageURLs).toHaveLength(1);
    });

    it('should handle variation without deltaPrice', () => {
      const variation = { variationProductCode: 'VAR-001', deltaPrice: undefined };
      const result = mapKiboVariantToCOF(variation, 'PROD-001', 'tenant-123');

      expect(result.price).toBeUndefined();
    });

    it('should handle variation without options', () => {
      const variation = { variationProductCode: 'VAR-001', options: undefined };
      const result = mapKiboVariantToCOF(variation, 'PROD-001', 'tenant-123');

      expect(result.selectedOptions).toBeUndefined();
    });

    it('should filter variation options without name or value', () => {
      const variation = {
        variationProductCode: 'VAR-001',
        options: [
          { attributeFQN: 'color', value: 'Red' },
          { attributeFQN: '', value: 'Invalid' },
          { attributeFQN: 'size', value: '' },
        ],
      };
      const result = mapKiboVariantToCOF(variation, 'PROD-001', 'tenant-123');

      expect(result.selectedOptions).toHaveLength(1);
      expect(result.selectedOptions?.[0]?.name).toBe('color');
    });

    it('should use INACTIVE status for non-taxable products', () => {
      const product = { productCode: 'PROD-001', isTaxable: false };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.status).toBe('INACTIVE');
    });

    it('should use ACTIVE status when isTaxable is true', () => {
      const product = { productCode: 'PROD-001', isTaxable: true };
      const result = mapKiboProductToCOF(product, 'tenant-123');

      expect(result.status).toBe('ACTIVE');
    });
  });
});

// ============================================================================
// Customer Transformers (T061)
// ============================================================================

import {
  mapKiboCustomerToCOF,
  mapKiboCustomerListToCOF,
} from '../../src/utils/transformers/customer.js';

describe('Customer Transformers', () => {
  const sampleKiboCustomer = {
    id: 1001,
    emailAddress: 'john.doe@example.com',
    userName: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    isAnonymous: false,
    externalId: 'EXT-1001',
    contacts: [
      {
        id: 1,
        types: [{ name: 'Billing', isPrimary: true }],
        firstName: 'John',
        lastNameOrSurname: 'Doe',
        email: 'john.doe@example.com',
        companyOrOrganization: 'Acme Corp',
        address: {
          address1: '123 Main St',
          address2: 'Suite 100',
          cityOrTown: 'Springfield',
          stateOrProvince: 'IL',
          postalOrZipCode: '62701',
          countryCode: 'US',
        },
        phoneNumbers: {
          mobile: '555-1234',
          home: '555-5678',
        },
      },
    ],
    notes: [
      { content: 'VIP customer' },
      { content: 'Prefers email contact' },
    ],
    attributes: [
      { fullyQualifiedName: 'preferred-language', values: ['en'] },
      { fullyQualifiedName: 'loyalty-tier', values: ['gold'] },
    ],
    segments: [
      { id: 1, code: 'VIP', name: 'VIP Customers' },
    ],
    auditInfo: {
      createDate: '2026-01-01T10:00:00Z',
      updateDate: '2026-02-15T14:30:00Z',
    },
  };

  describe('mapKiboCustomerToCOF', () => {
    it('should map a complete Kibo customer to COF Customer', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.id).toBe('1001');
      expect(result.tenantId).toBe('tenant-123');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.externalId).toBe('EXT-1001');
    });

    it('should map customer status from isActive', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.status).toBe('active');
    });

    it('should map inactive status', () => {
      const inactiveCustomer = { ...sampleKiboCustomer, isActive: false };
      const result = mapKiboCustomerToCOF(inactiveCustomer, 'tenant-123');

      expect(result.status).toBe('inactive');
    });

    it('should map customer type from isAnonymous', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.type).toBe('registered');
    });

    it('should map guest type for anonymous customers', () => {
      const guestCustomer = { ...sampleKiboCustomer, isAnonymous: true };
      const result = mapKiboCustomerToCOF(guestCustomer, 'tenant-123');

      expect(result.type).toBe('guest');
    });

    it('should map addresses from contacts', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.addresses).toHaveLength(1);
      expect(result.addresses?.[0]?.address.address1).toBe('123 Main St');
      expect(result.addresses?.[0]?.address.city).toBe('Springfield');
    });

    it('should map phone from contacts', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.phone).toBe('555-1234');
    });

    it('should map notes as concatenated string', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.notes).toBe('VIP customer; Prefers email contact');
    });

    it('should map attributes to customFields', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.customFields).toHaveLength(2);
      expect(result.customFields?.[0]?.name).toBe('preferred-language');
      expect(result.customFields?.[0]?.value).toBe('en');
    });

    it('should map segments to tags', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.tags).toContain('VIP Customers');
    });

    it('should use timestamps from auditInfo', () => {
      const result = mapKiboCustomerToCOF(sampleKiboCustomer, 'tenant-123');

      expect(result.createdAt).toBe('2026-01-01T10:00:00Z');
      expect(result.updatedAt).toBe('2026-02-15T14:30:00Z');
    });
  });

  describe('mapKiboCustomerListToCOF', () => {
    it('should map an array of customers', () => {
      const customers = [
        { ...sampleKiboCustomer, id: 1001 },
        { ...sampleKiboCustomer, id: 1002 },
      ];

      const result = mapKiboCustomerListToCOF(customers, 'tenant-123');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1001');
      expect(result[1]?.id).toBe('1002');
    });

    it('should filter out customers without id', () => {
      const customers = [
        { ...sampleKiboCustomer, id: 1001 },
        { ...sampleKiboCustomer, id: undefined },
      ];

      const result = mapKiboCustomerListToCOF(customers, 'tenant-123');

      expect(result).toHaveLength(1);
    });

    it('should return empty array for empty input', () => {
      const result = mapKiboCustomerListToCOF([], 'tenant-123');
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle customer with no contacts', () => {
      const customer = { ...sampleKiboCustomer, contacts: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.addresses).toBeUndefined();
      expect(result.phone).toBeUndefined();
    });

    it('should handle customer with empty contacts array', () => {
      const customer = { ...sampleKiboCustomer, contacts: [] };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.addresses).toBeUndefined();
    });

    it('should handle contact without address', () => {
      const customer = {
        ...sampleKiboCustomer,
        contacts: [{ firstName: 'John', address: undefined }],
      };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      // Should filter out contacts without address
      expect(result.addresses).toHaveLength(0);
    });

    it('should handle customer with no attributes', () => {
      const customer = { ...sampleKiboCustomer, attributes: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.customFields).toBeUndefined();
    });

    it('should handle customer with empty attributes', () => {
      const customer = { ...sampleKiboCustomer, attributes: [] };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.customFields).toBeUndefined();
    });

    it('should filter attributes without values', () => {
      const customer = {
        ...sampleKiboCustomer,
        attributes: [
          { fullyQualifiedName: 'valid', values: ['value1'] },
          { fullyQualifiedName: 'no-values', values: [] },
          { fullyQualifiedName: null, values: ['value2'] },
        ],
      };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.customFields).toHaveLength(1);
      expect(result.customFields?.[0]?.name).toBe('valid');
    });

    it('should handle customer with no segments', () => {
      const customer = { ...sampleKiboCustomer, segments: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.tags).toBeUndefined();
    });

    it('should handle segment with only code (no name)', () => {
      const customer = {
        ...sampleKiboCustomer,
        segments: [{ id: 1, code: 'SEGMENT-CODE', name: undefined }],
      };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.tags).toContain('SEGMENT-CODE');
    });

    it('should use home phone when mobile is not available', () => {
      const customer = {
        ...sampleKiboCustomer,
        contacts: [{
          phoneNumbers: { home: '555-HOME', mobile: undefined },
          address: { address1: '123 St' },
        }],
      };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.phone).toBe('555-HOME');
    });

    it('should handle customer without id using empty string', () => {
      const customer = { ...sampleKiboCustomer, id: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.id).toBe('');
    });

    it('should use id as externalId when externalId is missing', () => {
      const customer = { ...sampleKiboCustomer, externalId: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.externalId).toBe('1001');
    });

    it('should handle contact without primary type', () => {
      const customer = {
        ...sampleKiboCustomer,
        contacts: [{
          types: [{ name: 'Shipping', isPrimary: false }],
          address: { address1: '456 Oak' },
        }],
      };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.addresses?.[0]?.name).toBe('Address');
    });

    it('should handle customer with no notes', () => {
      const customer = { ...sampleKiboCustomer, notes: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.notes).toBeUndefined();
    });

    it('should handle customer without auditInfo', () => {
      const customer = { ...sampleKiboCustomer, auditInfo: undefined };
      const result = mapKiboCustomerToCOF(customer, 'tenant-123');

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });
});
