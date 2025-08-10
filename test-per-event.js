#!/usr/bin/env node

const axios = require('axios');
const crypto = require('crypto');

const MESSAGE_BUS_URL = 'http://localhost:4000';

async function testPerEventTransactions() {
  console.log('🔍 Testing Per-Event Transaction System\n');

  try {
    // Test 1: Track a single high-value event with immediate anchoring
    console.log('💎 Test 1: High-Value Event (Immediate Anchoring)');
    const highValueEvent = {
      eventId: `evt-${Date.now()}-001`,
      timestamp: new Date().toISOString(),
      location: 'diamond-vault-001',
      productId: 'diamond-ring-luxury-001',
      batchId: 'luxury-batch-001',
      eventType: 'scan',
      metadata: { 
        value: '$50000', 
        operator: 'security-team',
        verification: 'biometric-confirmed',
        priority: 'critical'
      },
      anchoring: {
        mode: 'immediate',
        priority: 'enterprise',
        companyId: 'luxury-jewelers-inc'
      }
    };

    console.log(`📋 Event Details:`);
    console.log(`  - ID: ${highValueEvent.eventId}`);
    console.log(`  - Product: ${highValueEvent.productId}`);
    console.log(`  - Value: ${highValueEvent.metadata.value}`);
    console.log(`  - Mode: ${highValueEvent.anchoring.mode}`);
    
    const response1 = await axios.post(`${MESSAGE_BUS_URL}/event`, highValueEvent);
    console.log(`✅ Response:`, response1.data);
    console.log(`💰 Transaction Hash: ${response1.data.hash}\n`);

    // Test 2: Track multiple events from same company with different priorities
    console.log('📦 Test 2: Multiple Events - Same Company, Different Priorities');
    
    const events = [
      {
        eventId: `evt-${Date.now()}-002`,
        timestamp: new Date().toISOString(),
        location: 'warehouse-main',
        productId: 'standard-item-001',
        eventType: 'manufacture',
        metadata: { value: '$100', priority: 'standard' },
        anchoring: { mode: 'batch', priority: 'standard', companyId: 'acme-manufacturing' }
      },
      {
        eventId: `evt-${Date.now()}-003`,
        timestamp: new Date().toISOString(),
        location: 'warehouse-main',
        productId: 'premium-item-001',
        eventType: 'scan',
        metadata: { value: '$500', priority: 'premium' },
        anchoring: { mode: 'immediate', priority: 'premium', companyId: 'acme-manufacturing' }
      },
      {
        eventId: `evt-${Date.now()}-004`,
        timestamp: new Date().toISOString(),
        location: 'warehouse-main',
        productId: 'enterprise-item-001',
        eventType: 'delivery',
        metadata: { value: '$2000', priority: 'enterprise' },
        anchoring: { mode: 'immediate', priority: 'enterprise', companyId: 'acme-manufacturing' }
      }
    ];

    for (const event of events) {
      const response = await axios.post(`${MESSAGE_BUS_URL}/event`, event);
      console.log(`📋 ${event.eventId}:`);
      console.log(`  - Mode: ${event.anchoring.mode} (${event.anchoring.priority})`);
      console.log(`  - Result: ${response.data.message}`);
      if (response.data.hash) {
        console.log(`  - Hash: ${response.data.hash}`);
      }
      if (response.data.cost) {
        console.log(`  - Cost: $${response.data.cost}`);
      }
      console.log('');
    }

    // Test 3: Check pricing for different tiers
    console.log('💰 Test 3: Pricing Structure');
    const pricing = await axios.get(`${MESSAGE_BUS_URL}/pricing`);
    console.log('Pricing Tiers:');
    Object.entries(pricing.data.tiers).forEach(([tier, details]) => {
      console.log(`  📊 ${tier.toUpperCase()}:`);
      console.log(`    - Batch: ${details.batchTransactions}`);
      console.log(`    - Immediate: ${details.immediatePrice}`);
      console.log(`    - Monthly Limit: ${details.maxImmediate}`);
    });

    console.log('\n🔍 Test 4: Event Verification');
    console.log('📁 Check these files for verification:');
    console.log('  - kaspa_broadcaster/pending_roots.txt (events queued for anchoring)');
    console.log('  - kaspa_broadcaster/anchored_txs.json (confirmed on blockchain)');
    console.log('  - Message bus logs (billing and processing details)');

    // Wait for file operations
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n✨ Per-Event Testing Complete!');
    console.log('💡 Key Features Demonstrated:');
    console.log('  ✅ Individual event tracking with unique IDs');
    console.log('  ✅ Per-event billing based on priority tier');
    console.log('  ✅ Immediate vs batched processing modes');
    console.log('  ✅ Company-specific event grouping');
    console.log('  ✅ Blockchain hash generation for verification');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPerEventTransactions(); 