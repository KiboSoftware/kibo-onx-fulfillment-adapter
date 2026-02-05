/**
 * Product Transformers
 *
 * Transform Kibo Commerce product responses to COF Product and ProductVariant format.
 */

import type { Product, ProductVariant } from '@cof-org/mcp';
import type { CatalogAdminsProduct, ProductVariation } from '@kibocommerce/rest-sdk/clients/CatalogAdministration';

/**
 * Extracts product options from Kibo product options array.
 *
 * @param options - Kibo product options
 * @returns Array of product options with name and values
 */
export function extractProductOptions(
  options: Array<{ attributeFQN?: string | null; values?: Array<{ value?: unknown }> | null }> | null | undefined,
): Array<{ name: string; values: string[] }> {
  if (!options || options.length === 0) {
    return [];
  }

  return options
    .filter((opt) => opt.attributeFQN)
    .map((opt) => ({
      name: opt.attributeFQN ?? '',
      values: opt.values?.map((v) => String(v.value ?? '')).filter(Boolean) ?? [],
    }));
}

/**
 * Maps a Kibo CatalogAdminsProduct to COF Product format.
 *
 * @param kiboProduct - Kibo product object
 * @param tenantId - Tenant ID to include in the result
 * @returns COF Product
 */
export function mapKiboProductToCOF(
  kiboProduct: CatalogAdminsProduct,
  tenantId: string,
): Product {
  const now = new Date().toISOString();
  const productContent = kiboProduct.content;
  const description = productContent?.productFullDescription ?? productContent?.productShortDescription;
  
  return {
    id: kiboProduct.productCode ?? '',
    tenantId,
    name: productContent?.productName ?? '',
    description: description ?? undefined,
    handle: kiboProduct.productCode ?? undefined,
    status: kiboProduct.isTaxable === false ? 'INACTIVE' : 'ACTIVE', // Using isTaxable as proxy since isActive doesn't exist
    vendor: undefined,
    categories: kiboProduct.productInCatalogs?.map((c) => c.catalogId?.toString() ?? '').filter(Boolean),
    options: extractProductOptions(kiboProduct.options ?? null),
    imageURLs: productContent?.productImages?.map((img) => img.imageUrl ?? '').filter(Boolean),
    externalProductId: kiboProduct.productCode ?? undefined,
    createdAt: kiboProduct.auditInfo?.createDate ?? now,
    updatedAt: kiboProduct.auditInfo?.updateDate ?? now,
    customFields: kiboProduct.properties?.map((prop) => ({
      name: prop.attributeFQN ?? '',
      value: prop.values?.[0]?.value?.toString() ?? '',
    })).filter((f) => f.name && f.value),
  };
}

/**
 * Maps a Kibo ProductVariation to COF ProductVariant format.
 *
 * @param variation - Kibo product variation object
 * @param parentProductCode - Parent product code
 * @param tenantId - Tenant ID to include in the result
 * @returns COF ProductVariant
 */
export function mapKiboVariantToCOF(
  variation: ProductVariation,
  parentProductCode: string,
  tenantId: string,
): ProductVariant {
  const now = new Date().toISOString();
  
  return {
    id: variation.variationProductCode ?? '',
    tenantId,
    productId: parentProductCode,
    sku: variation.variationProductCode ?? '',
    title: variation.variationProductCode ?? undefined,
    price: variation.deltaPrice?.value ?? undefined,
    currency: undefined, // Kibo doesn't include currency in variation
    selectedOptions: variation.options?.map((opt: { attributeFQN?: string | null; value?: unknown }) => ({
      name: opt.attributeFQN ?? '',
      value: String(opt.value ?? ''),
    })).filter((o: { name: string; value: string }) => o.name && o.value),
    createdAt: now,
    updatedAt: now,
    externalProductId: parentProductCode,
    customFields: undefined,
  };
}

/**
 * Maps an array of Kibo CatalogAdminsProduct objects to COF Product array.
 *
 * @param kiboProducts - Array of Kibo products
 * @param tenantId - Tenant ID to include in results
 * @returns Array of COF Products
 */
export function mapKiboProductListToCOF(
  kiboProducts: CatalogAdminsProduct[],
  tenantId: string,
): Product[] {
  return kiboProducts
    .filter((p) => p.productCode) // Filter out products without code
    .map((p) => mapKiboProductToCOF(p, tenantId));
}

/**
 * Maps an array of Kibo ProductVariation objects to COF ProductVariant array.
 *
 * @param variations - Array of Kibo product variations
 * @param parentProductCode - Parent product code
 * @param tenantId - Tenant ID to include in results
 * @returns Array of COF ProductVariants
 */
export function mapKiboVariantListToCOF(
  variations: ProductVariation[],
  parentProductCode: string,
  tenantId: string,
): ProductVariant[] {
  return variations
    .filter((v) => v.variationProductCode) // Filter out variations without code
    .map((v) => mapKiboVariantToCOF(v, parentProductCode, tenantId));
}
