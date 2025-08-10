#!/usr/bin/env tsx

import { db } from './db.js';
import { companies, events, purchases, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { storage } from './storage.js';
import { KaspaRPC, KaspaWalletService } from './services/kaspa.js';
import { nanoid } from 'nanoid';

console.log('🧪 KPM System Comprehensive Functionality Test');
console.log('='.repeat(60));

async function testDatabaseConnectivity() {
  console.log('\n🔍 Phase 1: Database Connectivity Test');
  console.log('─'.repeat(40));
  
  try {
    // Test basic database connection
    const companyCount = await db.select().from(companies).then(r => r.length);
    const eventCount = await db.select().from(events).then(r => r.length);
    const purchaseCount = await db.select().from(purchases).then(r => r.length);
    const userCount = await db.select().from(users).then(r => r.length);
    
    console.log(`✅ Database connected successfully`);
    console.log(`  📊 Companies: ${companyCount}`);
    console.log(`  📦 Events: ${eventCount}`);
    console.log(`  🛒 Purchases: ${purchaseCount}`);
    console.log(`  👥 Users: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testStorageInterface() {
  console.log('\n🗄️ Phase 2: Storage Interface Test');
  console.log('─'.repeat(40));
  
  try {
    // Test company creation
    const testCompany = {
      companyId: `test_${nanoid(8)}`,
      name: 'Test Company',
      hdPathIndex: 999,
      walletAddress: 'kaspatest:test123',
      balance: 100.0,
      visibleFields: ['name', 'origin'],
      commitEventTypes: ['harvest', 'process']
    };
    
    const createdCompany = await storage.createCompany(testCompany);
    console.log(`✅ Company created: ${createdCompany.companyId}`);
    
    // Test event creation
    const testEvent = {
      eventId: `test_event_${nanoid(8)}`,
      companyId: createdCompany.companyId,
      tagId: `test_tag_${nanoid(8)}`,
      eventType: 'harvest',
      ts: new Date(),
      leafHash: 'test_leaf_hash',
      merkleRoot: 'test_merkle_root',
      txid: 'test_transaction_id',
      status: 'pending' as const
    };
    
    const createdEvent = await storage.createEvent(testEvent);
    console.log(`✅ Event created: ${createdEvent.eventId}`);
    
    // Test purchase creation
    const testPurchase = {
      purchaseId: `test_purchase_${nanoid(8)}`,
      userId: `test_user_${Date.now()}`,
      eventId: createdEvent.eventId,
      tagId: createdEvent.tagId,
      productName: 'Test Product'
    };
    
    const createdPurchase = await storage.createPurchase(testPurchase);
    console.log(`✅ Purchase created: ${createdPurchase.purchaseId}`);
    
    // Cleanup test data
    await db.delete(purchases).where(eq(purchases.id, createdPurchase.id));
    await db.delete(events).where(eq(events.id, createdEvent.id));
    await db.delete(companies).where(eq(companies.id, createdCompany.id));
    console.log(`✅ Test data cleaned up`);
    
    return true;
  } catch (error) {
    console.error('❌ Storage interface test failed:', error);
    return false;
  }
}

async function testKaspaIntegration() {
  console.log('\n⛓️ Phase 3: Kaspa Integration Test');
  console.log('─'.repeat(40));
  
  try {
    const kaspaRPC = KaspaRPC.getInstance();
    
    // Test wallet generation
    const wallet = new KaspaWalletService(0);
    console.log(`✅ Wallet generated: ${wallet.address}`);
    
    // Test balance check
    const balance = await kaspaRPC.getBalance(wallet.address);
    console.log(`✅ Balance retrieved: ${balance} KAS`);
    
    // Test transaction signing
    const testTransaction = {
      eventId: 'test_event_123',
      tagId: 'test_tag_456',
      merkleRoot: 'test_merkle_root_789',
      leafHash: 'test_leaf_hash_abc'
    };
    
    const signedTx = await wallet.signTransaction(testTransaction);
    console.log(`✅ Transaction signed: ${signedTx.id}`);
    
    return true;
  } catch (error) {
    console.error('❌ Kaspa integration test failed:', error);
    return false;
  }
}

async function testSupplyChainWorkflow() {
  console.log('\n🏗️ Phase 4: Supply Chain Workflow Test');
  console.log('─'.repeat(40));
  
  try {
    // Create test company
    const company = await storage.createCompany({
      companyId: `workflow_test_${nanoid(8)}`,
      name: 'Workflow Test Company',
      hdPathIndex: 998,
      walletAddress: 'kaspatest:workflow123',
      balance: 50.0,
      visibleFields: ['name', 'origin', 'eventType'],
      commitEventTypes: ['harvest', 'process', 'package']
    });
    
    console.log(`✅ Test company created: ${company.companyId}`);
    
    // Create supply chain events
    const events = [];
    const eventTypes = ['harvest', 'process', 'package'];
    
    for (let i = 0; i < eventTypes.length; i++) {
      const event = await storage.createEvent({
        eventId: `workflow_${nanoid(8)}`,
        companyId: company.companyId,
        tagId: `workflow_tag_${nanoid(8)}`,
        eventType: eventTypes[i],
        ts: new Date(),
        leafHash: `workflow_leaf_${nanoid(16)}`,
        merkleRoot: `workflow_merkle_${nanoid(16)}`,
        txid: `workflow_tx_${nanoid(16)}`,
        status: 'submitted' as const
      });
      
      events.push(event);
      console.log(`✅ ${eventTypes[i]} event created: ${event.eventId}`);
    }
    
    // Create consumer purchase
    const purchase = await storage.createPurchase({
      purchaseId: `workflow_purchase_${nanoid(8)}`,
      userId: `workflow_user_${Date.now()}`,
      eventId: events[0].eventId,
      tagId: events[0].tagId,
      productName: 'Workflow Test Product'
    });
    
    console.log(`✅ Consumer purchase created: ${purchase.purchaseId}`);
    
    // Cleanup
    await db.delete(purchases).where(eq(purchases.id, purchase.id));
    for (const event of events) {
      await db.delete(events).where(eq(events.id, event.id));
    }
    await db.delete(companies).where(eq(companies.id, company.id));
    
    console.log(`✅ Workflow test completed and cleaned up`);
    
    return true;
  } catch (error) {
    console.error('❌ Supply chain workflow test failed:', error);
    return false;
  }
}

async function testSystemIntegration() {
  console.log('\n🔧 Phase 5: System Integration Test');
  console.log('─'.repeat(40));
  
  try {
    // Test complete end-to-end workflow
    const kaspaRPC = KaspaRPC.getInstance();
    
    // Generate wallet
    const wallet = new KaspaWalletService(997);
    
    // Create company with wallet
    const company = await storage.createCompany({
      companyId: `integration_${nanoid(8)}`,
      name: 'Integration Test Company',
      hdPathIndex: 997,
      walletAddress: wallet.address,
      balance: 75.0,
      visibleFields: ['name', 'origin', 'eventType', 'ts'],
      commitEventTypes: ['harvest', 'process', 'package', 'distribute']
    });
    
    console.log(`✅ Integrated company created: ${company.companyId}`);
    console.log(`  📍 Wallet: ${wallet.address}`);
    console.log(`  💰 Balance: ${company.balance} KAS`);
    
    // Create and sign transaction
    const eventData = {
      eventId: `integration_${nanoid(8)}`,
      companyId: company.companyId,
      tagId: `integration_tag_${nanoid(8)}`,
      eventType: 'harvest',
      ts: new Date(),
      leafHash: `integration_leaf_${nanoid(16)}`,
      merkleRoot: `integration_merkle_${nanoid(16)}`,
      txid: null,
      status: 'pending' as const
    };
    
    const event = await storage.createEvent(eventData);
    
    const signedTx = await wallet.signTransaction({
      eventId: event.eventId,
      tagId: event.tagId,
      merkleRoot: event.merkleRoot,
      leafHash: event.leafHash
    });
    
    // Update event with transaction ID
    const updatedEvent = await storage.updateEvent(event.id, {
      txid: signedTx.id,
      status: 'submitted' as const
    });
    
    console.log(`✅ Event signed and updated: ${updatedEvent.eventId}`);
    console.log(`  ⛓️ Transaction: ${signedTx.id}`);
    
    // Create consumer purchase
    const purchase = await storage.createPurchase({
      purchaseId: `integration_purchase_${nanoid(8)}`,
      userId: `integration_user_${Date.now()}`,
      eventId: event.eventId,
      tagId: event.tagId,
      productName: 'Integration Test Product'
    });
    
    console.log(`✅ Consumer purchase integrated: ${purchase.purchaseId}`);
    
    // Cleanup
    await db.delete(purchases).where(eq(purchases.id, purchase.id));
    await db.delete(events).where(eq(events.id, event.id));
    await db.delete(companies).where(eq(companies.id, company.id));
    
    console.log(`✅ Integration test completed successfully`);
    
    return true;
  } catch (error) {
    console.error('❌ System integration test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive KPM functionality tests...\n');
  
  const tests = [
    { name: 'Database Connectivity', test: testDatabaseConnectivity },
    { name: 'Storage Interface', test: testStorageInterface },
    { name: 'Kaspa Integration', test: testKaspaIntegration },
    { name: 'Supply Chain Workflow', test: testSupplyChainWorkflow },
    { name: 'System Integration', test: testSystemIntegration }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      console.error(`❌ ${name} test crashed:`, error);
      results.push({ name, passed: false });
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(60));
  
  let passedCount = 0;
  results.forEach(({ name, passed }) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${name}`);
    if (passed) passedCount++;
  });
  
  console.log(`\n🎯 Overall: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('🎉 All functionality tests passed! System is ready for real testnet transactions.');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  return passedCount === results.length;
}

// Run tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test runner crashed:', error);
  process.exit(1);
});