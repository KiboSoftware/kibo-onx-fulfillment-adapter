/**
 * Basic Usage Example for Kibo Fulfillment Adapter
 *
 * This example demonstrates basic operations with the adapter.
 */

import { KiboFulfillmentAdapter } from '../src/adapter.js';

async function main(): Promise<void> {
  // Initialize the adapter with Kibo credentials
  const adapter = new KiboFulfillmentAdapter({
    tenantId: process.env.KIBO_TENANT_ID ?? '26507',
    siteId: process.env.KIBO_SITE_ID ?? '41315',
    clientId: process.env.KIBO_CLIENT_ID ?? 'your-app.app.mozu.com',
    sharedSecret: process.env.KIBO_SHARED_SECRET ?? 'your-secret',
    timeout: 30000,
    debugMode: true,
  });

  try {
    // 1. Connect to Kibo Commerce
    console.log('Connecting to Kibo Commerce...');
    await adapter.connect();
    console.log('✓ Connected successfully\n');

    // 2. Check health status
    console.log('Checking health status...');
    const health = await adapter.healthCheck();
    console.log('Health Status:', health.status);
    console.log('');

    // 3. Query orders
    console.log('Fetching orders...');
    const ordersResult = await adapter.getOrders({
      filter: { status: 'pending' },
      pageSize: 10,
    });

    if (ordersResult.success && ordersResult.data) {
      console.log(`Found ${ordersResult.data.orders.length} orders`);
      ordersResult.data.orders.forEach((order) => {
        console.log(`  - Order ${order.id}: ${order.status}`);
      });
    }
    console.log('');

    // 4. Create a new order
    console.log('Creating a new order...');
    const orderResult = await adapter.createSalesOrder({
      externalOrderId: 'EXT-' + Date.now(),
      customer: {
        id: 'CUST-001',
        email: 'customer@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      lineItems: [
        {
          sku: 'PROD-001',
          name: 'Sample Product',
          quantity: 2,
          unitPrice: 29.99,
        },
      ],
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'US',
      },
      shippingMethod: 'standard',
    });

    if (orderResult.success && orderResult.data) {
      console.log(`✓ Order created: ${orderResult.data.order.id}`);
    } else {
      console.log(`✗ Failed to create order: ${orderResult.error?.message}`);
    }
    console.log('');

    // 5. Check inventory
    console.log('Checking inventory levels...');
    const inventoryResult = await adapter.getInventory({
      skus: ['PROD-001', 'PROD-002'],
    });

    if (inventoryResult.success && inventoryResult.data) {
      inventoryResult.data.inventory.forEach((item) => {
        console.log(`  - ${item.sku}: ${item.availableQuantity} available`);
      });
    }
    console.log('');

    // 6. Disconnect
    console.log('Disconnecting...');
    await adapter.disconnect();
    console.log('✓ Disconnected successfully');
  } catch (error) {
    console.error('Error:', error);
    await adapter.disconnect();
    process.exit(1);
  }
}

main().catch(console.error);
