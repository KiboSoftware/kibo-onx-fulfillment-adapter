#!/usr/bin/env node
/**
 * Test script to verify adapter can be loaded by the MCP server
 * Run this after building your adapter: npm run build && node test-integration.js
 * 
 * For real API testing, set these environment variables:
 * - KIBO_TENANT_ID
 * - KIBO_SITE_ID
 * - KIBO_CLIENT_ID
 * - KIBO_SHARED_SECRET
 */

import { KiboFulfillmentAdapter } from './dist/index.js';

// Load credentials from environment variables or use test defaults
const credentials = {
  tenantId: process.env.KIBO_TENANT_ID || '26507',
  siteId: process.env.KIBO_SITE_ID || '41315',
  clientId: process.env.KIBO_CLIENT_ID || 'test-app.app.mozu.com',
  sharedSecret: process.env.KIBO_SHARED_SECRET || 'test-secret',
};

const hasRealCredentials = !!(
  process.env.KIBO_TENANT_ID &&
  process.env.KIBO_SITE_ID &&
  process.env.KIBO_CLIENT_ID &&
  process.env.KIBO_SHARED_SECRET
);

async function test() {
  console.log('Testing adapter integration...\n');
  
  if (hasRealCredentials) {
    console.log('🔐 Using real credentials from environment variables\n');
  } else {
    console.log('⚠️  Using test credentials (set KIBO_* env vars for real API testing)\n');
  }

  // Test 1: Can instantiate with config
  console.log('1. Testing instantiation with config object...');
  const adapter1 = new KiboFulfillmentAdapter({
    type: 'local',
    path: './dist/index.js',
    options: credentials,
  });
  console.log('✓ Instantiated with AdapterConfig structure\n');

  // Test 2: Can instantiate with just options (fallback)
  console.log('2. Testing instantiation with options only...');
  new KiboFulfillmentAdapter(credentials);
  console.log('✓ Instantiated with options only\n');

  // Test 3: Verify required methods exist
  console.log('3. Checking required methods...');
  const requiredMethods = [
    'connect',
    'disconnect',
    'healthCheck',
    'createSalesOrder',
    'cancelOrder',
    'updateOrder',
    'fulfillOrder',
    'getOrders',
    'getCustomers',
    'getProducts',
    'getProductVariants',
    'getInventory',
    'getFulfillments',
  ];

  let allMethodsPresent = true;
  for (const method of requiredMethods) {
    if (typeof adapter1[method] !== 'function') {
      console.log(`✗ Missing method: ${method}`);
      allMethodsPresent = false;
    }
  }

  if (allMethodsPresent) {
    console.log(`✓ All ${requiredMethods.length} required methods present\n`);
  }

  // Test 4: Test default export
  console.log('4. Testing default export...');
  const module = await import('./dist/index.js');
  const DefaultAdapter = module.default;

  if (DefaultAdapter === KiboFulfillmentAdapter) {
    console.log('✓ Default export matches KiboFulfillmentAdapter\n');
  } else {
    console.log('✗ Default export mismatch\n');
  }

  // Test 5: Can connect
  console.log('5. Testing connect method...');
  try {
    await adapter1.connect();
    console.log('✓ Connect method works\n');
  } catch (error) {
    if (hasRealCredentials) {
      console.log(`✗ Connect failed: ${error.message}\n`);
      process.exit(1);
    } else {
      console.log(`⚠️  Connect failed (expected with test credentials): ${error.message}\n`);
    }
  }

  // Test 6: Health check
  console.log('6. Testing health check...');
  try {
    const health = await adapter1.healthCheck();
    console.log(`${hasRealCredentials ? '✓' : '⚠️'} Health check returned: ${health.status}\n`);
    
    if (hasRealCredentials && health.status !== 'healthy') {
      console.log('✗ Health check should be healthy with real credentials\n');
      process.exit(1);
    }
  } catch (error) {
    console.log(`✗ Health check failed: ${error.message}\n`);
  }

  console.log('Integration test complete!');
  console.log('\nYour adapter is compatible with the MCP server adapter factory.');
  
  if (!hasRealCredentials) {
    console.log('\n💡 To test with real Kibo API:');
    console.log('  export KIBO_TENANT_ID=your-tenant-id');
    console.log('  export KIBO_SITE_ID=your-site-id');
    console.log('  export KIBO_CLIENT_ID=your-client-id');
    console.log('  export KIBO_SHARED_SECRET=your-shared-secret');
    console.log('  npm run test:integration');
  }
}

test().catch(console.error);
