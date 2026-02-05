/**
 * Order Transformer
 *
 * Maps between Kibo Order structures and COF Order.
 */

import type { Order, CreateSalesOrderInput } from '@cof-org/mcp';
import type { KiboOrder, KiboOrderItem } from '../../types.js';
import { KIBO_ORDER_STATUS_MAP, type KiboOrderStatus } from '../../types.js';
import { mapKiboContactToAddress, mapAddressToKiboContact, type COFAddress } from './address.js';

/**
 * COF LineItem structure (from Order schema).
 */
export interface COFLineItem {
  id?: string;
  sku: string;
  quantity: number;
  unitPrice?: number;
  unitDiscount?: number;
  totalPrice?: number;
  name?: string;
  customFields?: Array<{ name: string; value: string }>;
}

/**
 * Maps a Kibo order item to a COF line item.
 *
 * @param item - Kibo order item
 * @returns COF line item
 */
export function mapKiboOrderItemToLineItem(item: KiboOrderItem): COFLineItem {
  const sku = item.product?.variationProductCode ?? item.product?.productCode ?? '';
  const unitPrice = item.product?.price?.salePrice ?? item.product?.price?.price;
  const quantity = item.quantity ?? 1;
  const totalPrice = item.extendedTotal ?? (unitPrice ? unitPrice * quantity : undefined);

  // Map Kibo options to custom fields
  const customFields: Array<{ name: string; value: string }> = [];

  if (item.product?.options) {
    for (const option of item.product.options) {
      if (option.name && option.value !== undefined) {
        customFields.push({
          name: option.name,
          value: String(option.value),
        });
      }
    }
  }

  return {
    id: item.id,
    sku,
    quantity,
    unitPrice,
    unitDiscount: item.discountTotal,
    totalPrice,
    name: item.product?.name,
    customFields: customFields.length > 0 ? customFields : undefined,
  };
}

/**
 * Maps a Kibo order to a COF Order.
 *
 * @param kiboOrder - Kibo order from API
 * @param tenantId - Tenant ID for the COF order
 * @returns COF Order
 */
export function mapKiboOrderToCOF(kiboOrder: KiboOrder, tenantId: string): Order {
  // Map status
  const kiboStatus = (kiboOrder.status ?? 'Pending') as KiboOrderStatus;
  const cofStatus = KIBO_ORDER_STATUS_MAP[kiboStatus] ?? 'PENDING';

  // Map line items
  const lineItems: COFLineItem[] =
    kiboOrder.items?.map((item) => mapKiboOrderItemToLineItem(item)) ?? [];

  // Map addresses
  const billingAddress = mapKiboContactToAddress(kiboOrder.billingInfo?.billingContact);
  const shippingAddress = mapKiboContactToAddress(kiboOrder.fulfillmentInfo?.fulfillmentContact);

  // Map custom fields from Kibo attributes
  const customFields: Array<{ name: string; value: string }> = [];
  if (kiboOrder.attributes) {
    for (const attr of kiboOrder.attributes) {
      if (attr.fullyQualifiedName && attr.values?.[0] !== undefined) {
        customFields.push({
          name: attr.fullyQualifiedName,
          value: String(attr.values[0]),
        });
      }
    }
  }

  // Get order notes
  const orderNote = kiboOrder.notes?.map((n) => n.text).join('\n');

  // Build the COF Order
  const order: Order = {
    id: String(kiboOrder.orderNumber ?? kiboOrder.id),
    externalId: kiboOrder.externalId ?? kiboOrder.id,
    tenantId,
    createdAt: kiboOrder.auditInfo?.createDate ?? new Date().toISOString(),
    updatedAt: kiboOrder.auditInfo?.updateDate ?? new Date().toISOString(),
    status: cofStatus,
    name: `Order #${kiboOrder.orderNumber}`,
    lineItems,
    subTotalPrice: kiboOrder.subtotal,
    shippingPrice: kiboOrder.shippingTotal,
    orderTax: kiboOrder.taxTotal,
    orderDiscount: kiboOrder.discountTotal,
    totalPrice: kiboOrder.total,
    currency: kiboOrder.currencyCode,
    billingAddress,
    shippingAddress,
    shippingCode: kiboOrder.fulfillmentInfo?.shippingMethodCode,
    shippingClass: kiboOrder.fulfillmentInfo?.shippingMethodName,
    orderNote,
    customFields: customFields.length > 0 ? customFields : undefined,
  };

  return order;
}

/**
 * Kibo create order request structure.
 */
export interface KiboCreateOrderRequest {
  email?: string;
  externalId?: string;
  billingInfo?: {
    billingContact?: import('../../types.js').KiboContact;
    paymentType?: string;
  };
  fulfillmentInfo?: {
    fulfillmentContact?: import('../../types.js').KiboContact;
    shippingMethodCode?: string;
  };
  items: Array<{
    product: {
      productCode: string;
      variationProductCode?: string;
    };
    quantity: number;
    unitPrice?: {
      listAmount?: number;
    };
  }>;
  notes?: Array<{
    text: string;
  }>;
  attributes?: Array<{
    fullyQualifiedName: string;
    values: unknown[];
  }>;
}

/**
 * Maps COF CreateSalesOrderInput to Kibo create order request.
 *
 * @param input - COF create sales order input
 * @returns Kibo create order request
 */
export function mapCOFOrderInputToKibo(input: CreateSalesOrderInput): KiboCreateOrderRequest {
  const { order } = input;

  // Map line items
  const items = (order.lineItems ?? []).map((item) => ({
    product: {
      productCode: item.sku,
      variationProductCode: item.sku,
    },
    quantity: item.quantity,
    unitPrice: item.unitPrice
      ? {
          listAmount: item.unitPrice,
        }
      : undefined,
  }));

  // Map addresses
  const billingContact = mapAddressToKiboContact(
    order.billingAddress as COFAddress | undefined,
    order.customer?.email,
  );
  const fulfillmentContact = mapAddressToKiboContact(
    order.shippingAddress as COFAddress | undefined,
    order.customer?.email,
  );

  // Map notes
  const notes = order.orderNote
    ? [{ text: order.orderNote }]
    : undefined;

  // Map custom fields to Kibo attributes
  const attributes = order.customFields?.map((cf) => ({
    fullyQualifiedName: cf.name,
    values: [cf.value],
  }));

  return {
    email: order.customer?.email,
    externalId: order.externalId,
    billingInfo: billingContact
      ? {
          billingContact,
          paymentType: 'Check', // Default payment type
        }
      : undefined,
    fulfillmentInfo: fulfillmentContact
      ? {
          fulfillmentContact,
          shippingMethodCode: order.shippingCode,
        }
      : undefined,
    items,
    notes,
    attributes,
  };
}
