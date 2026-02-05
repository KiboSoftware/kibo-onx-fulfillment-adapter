/**
 * Advanced Configuration Example for Kibo Fulfillment Adapter
 *
 * This example demonstrates advanced configuration options and operations.
 */

import { KiboFulfillmentAdapter } from '../src/adapter.js';
import { isKiboAdapterError } from '../src/errors.js';

async function main(): Promise<void> {
  // Initialize with all configuration options
  const adapter = new KiboFulfillmentAdapter({
    // Required credentials
    tenantId: process.env.KIBO_TENANT_ID ?? '26507',
    siteId: process.env.KIBO_SITE_ID ?? '41315',
    clientId: process.env.KIBO_CLIENT_ID ?? 'your-app.app.mozu.com',
    sharedSecret: process.env.KIBO_SHARED_SECRET ?? 'your-secret',

    // Optional: Custom hosts for different environments
    authHost: process.env.KIBO_AUTH_HOST ?? 'home.mozu.com',
    apiHost: process.env.KIBO_API_HOST,
    apiEnv: 'sandbox',

    // Optional: Performance tuning
    timeout: 60000,
    retryAttempts: 5,
    debugMode: true,
  });

  try {
    await adapter.connect();

    // Example: Fulfill an order with package shipments
    const fulfillResult = await adapter.fulfillOrder({
      orderId: 'ORD-12345',
      shipments: [
        {
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
          shippingMethod: 'Ground',
          items: [
            { sku: 'PROD-001', quantity: 2 },
            { sku: 'PROD-002', quantity: 1 },
          ],
        },
      ],
    });

    if (fulfillResult.success) {
      console.log('Order fulfilled:', fulfillResult.data?.fulfillment?.id);
    }

    // Example: Create a return
    const returnResult = await adapter.createReturn({
      orderId: 'ORD-12345',
      returnItems: [
        {
          sku: 'PROD-001',
          quantity: 1,
          reason: 'Defective',
        },
      ],
    });

    if (returnResult.success) {
      console.log('Return created:', returnResult.data?.returnRecord?.id);
    }

    // Example: Query products with variants
    const productsResult = await adapter.getProducts({
      skus: ['PROD-001'],
      pageSize: 10,
    });

    if (productsResult.success && productsResult.data) {
      for (const product of productsResult.data.products) {
        console.log(`Product: ${product.name} (${product.sku})`);

        // Get variants for each product
        const variantsResult = await adapter.getProductVariants({
          productIds: [product.id],
        });

        if (variantsResult.success && variantsResult.data) {
          console.log(`  Variants: ${variantsResult.data.productVariants.length}`);
        }
      }
    }

    // Example: Query customers
    const customersResult = await adapter.getCustomers({
      filter: { email: 'customer@example.com' },
      pageSize: 10,
    });

    if (customersResult.success && customersResult.data) {
      console.log(`Found ${customersResult.data.customers.length} customers`);
    }

    await adapter.disconnect();
  } catch (error) {
    // Handle Kibo-specific errors
    if (isKiboAdapterError(error)) {
      console.error(`Kibo Error [${error.code}]: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    await adapter.disconnect();
    process.exit(1);
  }
}

main().catch(console.error);

