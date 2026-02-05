/**
 * Inventory Transformers
 *
 * Transform Kibo Commerce inventory responses to COF InventoryItem format.
 */

import type { InventoryItem } from '@cof-org/mcp';
import type { InventoryResponse } from '@kibocommerce/rest-sdk/clients/Inventory';

/**
 * Maps a Kibo InventoryResponse to COF InventoryItem format.
 *
 * @param kiboInventory - Kibo inventory response object
 * @param tenantId - Tenant ID to include in the result
 * @returns COF InventoryItem
 */
export function mapKiboInventoryToCOF(
  kiboInventory: InventoryResponse,
  tenantId: string,
): InventoryItem {
  return {
    tenantId,
    locationId: kiboInventory.locationCode ?? '',
    sku: kiboInventory.sku ?? kiboInventory.partNumber ?? '',
    onHand: kiboInventory.onHand ?? 0,
    available: kiboInventory.available ?? 0,
    // COF uses 'unavailable' which we compute as allocated + pending
    unavailable: (kiboInventory.allocated ?? 0) + (kiboInventory.pending ?? 0),
  };
}

/**
 * Maps an array of Kibo InventoryResponse objects to COF InventoryItem array.
 *
 * @param kiboInventoryList - Array of Kibo inventory responses
 * @param tenantId - Tenant ID to include in results
 * @returns Array of COF InventoryItems
 */
export function mapKiboInventoryListToCOF(
  kiboInventoryList: InventoryResponse[],
  tenantId: string,
): InventoryItem[] {
  return kiboInventoryList
    .filter((inv) => inv.sku || inv.partNumber) // Filter out items without SKU
    .map((inv) => mapKiboInventoryToCOF(inv, tenantId));
}
