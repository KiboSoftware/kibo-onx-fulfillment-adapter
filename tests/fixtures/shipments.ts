/**
 * Test Fixtures: Kibo Shipments
 *
 * Sample Kibo shipment payloads for unit testing.
 */

import type { KiboShipment, KiboContact } from '../../src/types.js';
import { sampleKiboContact } from './orders.js';

/**
 * Sample Kibo shipment - Ready status.
 */
export const sampleKiboShipmentReady: KiboShipment = {
  id: 'shipment-001',
  shipmentNumber: 500001,
  orderId: 'order-12345',
  orderNumber: 100001,
  shipmentStatus: 'Ready',
  shipmentStatusReason: 'Awaiting pickup',
  fulfillmentLocationCode: 'WAREHOUSE-01',
  shipmentType: 'Ship',
  packages: [],
  items: [
    {
      lineId: 1,
      productCode: 'WIDGET-001',
      quantity: 2,
    },
  ],
  destinationContact: sampleKiboContact,
  auditInfo: {
    createDate: '2026-02-04T11:00:00Z',
    updateDate: '2026-02-04T11:00:00Z',
  },
};

/**
 * Sample Kibo shipment - Shipped status with tracking.
 */
export const sampleKiboShipmentShipped: KiboShipment = {
  id: 'shipment-002',
  shipmentNumber: 500002,
  orderId: 'order-12345',
  orderNumber: 100001,
  shipmentStatus: 'Shipped',
  shipmentStatusReason: 'In transit',
  fulfillmentLocationCode: 'WAREHOUSE-01',
  shipmentType: 'Ship',
  packages: [
    {
      packageId: 'pkg-001',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      shippingMethodCode: 'ups-ground',
      shippingMethodName: 'UPS Ground',
    },
  ],
  items: [
    {
      lineId: 1,
      productCode: 'WIDGET-001',
      quantity: 2,
    },
  ],
  destinationContact: sampleKiboContact,
  auditInfo: {
    createDate: '2026-02-04T11:00:00Z',
    updateDate: '2026-02-04T14:00:00Z',
  },
};

/**
 * Sample Kibo shipment - Delivered status.
 */
export const sampleKiboShipmentDelivered: KiboShipment = {
  ...sampleKiboShipmentShipped,
  id: 'shipment-003',
  shipmentNumber: 500003,
  shipmentStatus: 'Delivered',
  shipmentStatusReason: 'Left at front door',
  auditInfo: {
    createDate: '2026-02-04T11:00:00Z',
    updateDate: '2026-02-04T18:00:00Z',
  },
};

/**
 * Sample Kibo shipment - Cancelled status.
 */
export const sampleKiboShipmentCancelled: KiboShipment = {
  ...sampleKiboShipmentReady,
  id: 'shipment-004',
  shipmentNumber: 500004,
  shipmentStatus: 'Cancelled',
  shipmentStatusReason: 'Order cancelled by customer',
};

/**
 * Sample Kibo shipment collection (paginated response).
 */
export const sampleKiboShipmentCollection = {
  items: [sampleKiboShipmentReady, sampleKiboShipmentShipped],
  totalCount: 2,
  pageCount: 1,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Empty Kibo shipment collection.
 */
export const emptyKiboShipmentCollection = {
  items: [],
  totalCount: 0,
  pageCount: 0,
  pageSize: 50,
  startIndex: 0,
};

/**
 * Creates a Kibo shipment with custom overrides.
 */
export function createKiboShipment(overrides: Partial<KiboShipment> = {}): KiboShipment {
  return {
    ...sampleKiboShipmentReady,
    id: `shipment-${Date.now()}`,
    shipmentNumber: Math.floor(Math.random() * 1000000),
    ...overrides,
  };
}
