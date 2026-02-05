/**
 * Return Transformers
 *
 * Maps between Kibo Return structures and COF Return types.
 * Used by the adapter to transform API responses and requests.
 */

import type { Return, ReturnLineItem } from '@cof-org/mcp';
import type { KiboReturn, KiboReturnStatus, COFReturnStatus } from '../../types.js';
import { KIBO_RETURN_STATUS_MAP } from '../../types.js';

// ============================================================================
// Kibo Return → COF Return
// ============================================================================

/**
 * Maps a Kibo return status to COF return status.
 *
 * @param kiboStatus - Kibo return status string
 * @returns COF return status
 */
export function mapKiboReturnStatusToCOF(kiboStatus?: string): COFReturnStatus {
  if (!kiboStatus) {
    return 'PENDING';
  }

  const mapped = KIBO_RETURN_STATUS_MAP[kiboStatus as KiboReturnStatus];
  return mapped ?? 'PENDING';
}

/**
 * Maps Kibo return items to COF return line items.
 *
 * @param items - Kibo return items
 * @returns COF return line items array
 */
export function mapKiboReturnItemsToCOF(
  items?: Array<{
    id?: string;
    productCode?: string;
    quantity?: number;
    returnReason?: string;
  }>,
): ReturnLineItem[] {
  if (!items || items.length === 0) {
    return [];
  }

  return items
    .filter((item) => !!item.productCode && typeof item.quantity === 'number')
    .map((item) => ({
      orderLineItemId: item.id ?? '',
      sku: item.productCode!,
      quantityReturned: item.quantity!,
      returnReason: item.returnReason ?? 'no_reason_provided',
    }));
}

/**
 * Maps a Kibo Return to a COF Return.
 *
 * Transforms the full Kibo return structure to COF return format,
 * including return items, status, and refund information.
 *
 * @param kiboReturn - Kibo return response
 * @param tenantId - Kibo tenant ID for COF tenantId field
 * @returns COF Return object
 */
export function mapKiboReturnToCOF(kiboReturn: KiboReturn, tenantId: string): Return {
  const returnLineItems = mapKiboReturnItemsToCOF(kiboReturn.items);
  const status = mapKiboReturnStatusToCOF(kiboReturn.status);

  // Determine outcome based on return type and status
  const outcome = determineReturnOutcome(kiboReturn.returnType, kiboReturn.status);

  return {
    id: kiboReturn.id ?? '',
    orderId: kiboReturn.originalOrderId ?? '',
    outcome,
    returnLineItems,
    status,
    tenantId,
    createdAt: kiboReturn.auditInfo?.createDate ?? new Date().toISOString(),
    updatedAt: kiboReturn.auditInfo?.updateDate ?? new Date().toISOString(),
    // Optional fields
    ...(kiboReturn.returnNumber && { returnNumber: String(kiboReturn.returnNumber) }),
    ...(kiboReturn.refundAmount !== undefined && { refundAmount: kiboReturn.refundAmount }),
  };
}

/**
 * Determines the return outcome based on return type and status.
 *
 * @param returnType - Kibo return type
 * @param status - Kibo return status
 * @returns COF outcome string
 */
function determineReturnOutcome(returnType?: string, status?: string): string {
  // Return types in Kibo: Refund, Exchange, Replace
  if (returnType === 'Exchange') {
    return 'EXCHANGE';
  }
  if (returnType === 'Replace') {
    return 'REPLACEMENT';
  }

  // Default to REFUND for Refund type or unknown types
  if (status === 'Refunded') {
    return 'REFUND';
  }

  return 'REFUND';
}

// ============================================================================
// COF Return Input → Kibo Return Request
// ============================================================================

/**
 * Maps COF return line items to Kibo return item format.
 *
 * @param returnLineItems - COF return line items
 * @returns Kibo return items array
 */
export function mapCOFReturnItemsToKibo(
  returnLineItems: ReturnLineItem[],
): Array<{
  productCode: string;
  quantity: number;
  returnReason?: string;
}> {
  return returnLineItems.map((item) => ({
    productCode: item.sku,
    quantity: item.quantityReturned,
    returnReason: item.returnReason,
  }));
}
