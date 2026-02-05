/**
 * Shipment/Fulfillment Transformers
 *
 * Maps between Kibo Shipment structures and COF Fulfillment types.
 * Used by the adapter to transform API responses and requests.
 */

import type { Fulfillment } from '@cof-org/mcp';
import type { KiboShipment, KiboShipmentStatus, COFFulfillmentStatus } from '../../types.js';
import { KIBO_SHIPMENT_STATUS_MAP } from '../../types.js';
import { mapKiboContactToAddress } from './address.js';

// ============================================================================
// Kibo Shipment → COF Fulfillment
// ============================================================================

/**
 * Maps a Kibo shipment status to COF fulfillment status.
 *
 * @param kiboStatus - Kibo shipment status string
 * @returns COF fulfillment status
 */
export function mapKiboShipmentStatusToCOF(kiboStatus?: string): COFFulfillmentStatus {
  if (!kiboStatus) {
    return 'PENDING';
  }

  const mapped = KIBO_SHIPMENT_STATUS_MAP[kiboStatus as KiboShipmentStatus];
  return mapped ?? 'PENDING';
}

/**
 * Extracts tracking numbers from Kibo shipment packages.
 *
 * @param packages - Array of Kibo packages
 * @returns Array of tracking number strings
 */
export function extractTrackingNumbers(
  packages?: Array<{
    packageId?: string;
    trackingNumber?: string;
    carrier?: string;
    shippingMethodCode?: string;
    shippingMethodName?: string;
  }>,
): string[] {
  if (!packages || packages.length === 0) {
    return [];
  }

  return packages
    .map((pkg) => pkg.trackingNumber)
    .filter((tracking): tracking is string => !!tracking);
}

/**
 * Extracts the primary carrier from Kibo shipment packages.
 *
 * @param packages - Array of Kibo packages
 * @returns Primary carrier string or undefined
 */
export function extractPrimaryCarrier(
  packages?: Array<{
    packageId?: string;
    trackingNumber?: string;
    carrier?: string;
    shippingMethodCode?: string;
    shippingMethodName?: string;
  }>,
): string | undefined {
  if (!packages || packages.length === 0) {
    return undefined;
  }

  // Return the carrier from the first package with a carrier
  const pkgWithCarrier = packages.find((pkg) => !!pkg.carrier);
  return pkgWithCarrier?.carrier;
}

/**
 * Maps Kibo shipment items to COF fulfillment line items.
 *
 * @param items - Kibo shipment items
 * @returns COF line items array
 */
export function mapKiboShipmentItemsToCOF(
  items?: Array<{
    lineId?: number;
    productCode?: string;
    quantity?: number;
  }>,
): Array<{ sku: string; quantity: number }> {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .filter((item) => !!item.productCode && typeof item.quantity === 'number')
    .map((item) => ({
      sku: item.productCode!,
      quantity: item.quantity!,
    }));
}

/**
 * Maps a Kibo Shipment to a COF Fulfillment.
 *
 * Transforms the full Kibo shipment structure to COF fulfillment format,
 * including tracking numbers, carrier info, line items, and shipping address.
 *
 * @param kiboShipment - Kibo shipment response
 * @param tenantId - Kibo tenant ID for COF tenantId field
 * @returns COF Fulfillment object
 */
export function mapKiboShipmentToCOF(
  kiboShipment: KiboShipment,
  tenantId: string,
): Fulfillment {
  const trackingNumbers = extractTrackingNumbers(kiboShipment.packages);
  const carrier = extractPrimaryCarrier(kiboShipment.packages);
  const lineItems = mapKiboShipmentItemsToCOF(kiboShipment.items);
  const status = mapKiboShipmentStatusToCOF(kiboShipment.shipmentStatus);

  // Map destination contact to shipping address
  const shippingAddress = kiboShipment.destinationContact
    ? mapKiboContactToAddress(kiboShipment.destinationContact)
    : undefined;

  return {
    id: kiboShipment.id ?? '',
    orderId: kiboShipment.orderId ?? '',
    status,
    trackingNumbers,
    lineItems,
    tenantId,
    createdAt: kiboShipment.auditInfo?.createDate ?? new Date().toISOString(),
    updatedAt: kiboShipment.auditInfo?.updateDate ?? new Date().toISOString(),
    // Optional fields
    ...(shippingAddress && { shippingAddress }),
    ...(carrier && { shippingCarrier: carrier }),
    ...(kiboShipment.fulfillmentLocationCode && {
      locationId: kiboShipment.fulfillmentLocationCode,
    }),
  };
}

// ============================================================================
// COF Fulfillment Input → Kibo Shipment Request
// ============================================================================

/**
 * Maps COF fulfillment line items to Kibo shipment item format.
 *
 * @param lineItems - COF line items
 * @returns Kibo shipment items array
 */
export function mapCOFLineItemsToKibo(
  lineItems: Array<{ sku: string; quantity: number }>,
): Array<{ productCode: string; quantity: number }> {
  return lineItems.map((item) => ({
    productCode: item.sku,
    quantity: item.quantity,
  }));
}

/**
 * Maps COF tracking numbers to Kibo package format.
 *
 * @param trackingNumbers - Array of tracking numbers
 * @param carrier - Optional carrier name
 * @returns Kibo packages array
 */
export function mapTrackingNumbersToPackages(
  trackingNumbers: string[],
  carrier?: string,
): Array<{ trackingNumber: string; carrier?: string }> {
  return trackingNumbers.map((trackingNumber) => ({
    trackingNumber,
    ...(carrier && { carrier }),
  }));
}
