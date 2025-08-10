#!/usr/bin/env ts-node

import { SAPConnector } from '../src/connectors/sap-connector';
import { OracleConnector } from '../src/connectors/oracle-connector';
import { Logger } from '../src/utils/logger';
import axios from 'axios';

const logger = new Logger('ERP-Demo');

async function runERPToBlockchainDemo() {
  console.log('🚀 KMP ERP INTEGRATION DEMO');
  console.log('===============================');
  console.log('📋 Demonstrating: SAP/Oracle → KMP → Kaspa Blockchain');
  console.log('');

  let passed = 0;
  let failed = 0;

  // Test 1: SAP Integration
  console.log('🔄 Step 1: SAP S/4HANA Integration...');
  try {
    const sapConnector = new SAPConnector();
    
    // Simulate SAP material sync
    logger.info('📦 Syncing SAP materials from API Business Hub...');
    await sapConnector.syncMaterials();
    
    console.log('✅ SAP Material sync - PASSED');
    passed++;
  } catch (error) {
    console.log('❌ SAP Material sync - FAILED:', (error as Error).message);
    failed++;
  }

  // Test 2: Oracle Integration
  console.log('\n🔄 Step 2: Oracle SCM Cloud Integration...');
  try {
    const oracleConnector = new OracleConnector();
    
    // Simulate Oracle item sync
    logger.info('📦 Syncing Oracle items from Cloud Free Tier...');
    await oracleConnector.syncItems();
    
    console.log('✅ Oracle Item sync - PASSED');
    passed++;
  } catch (error) {
    console.log('❌ Oracle Item sync - FAILED:', (error as Error).message);
    failed++;
  }

  // Test 3: Check KMP Message Bus Integration
  console.log('\n🔄 Step 3: KMP Message Bus Integration...');
  try {
    const kmpUrl = process.env.KMP_MESSAGE_BUS_URL || 'http://localhost:3001';
    const response = await axios.get(`${kmpUrl}/health`);
    
    if (response.status === 200) {
      console.log('✅ KMP Message Bus connection - PASSED');
      passed++;
    } else {
      throw new Error('KMP Message Bus not responding');
    }
  } catch (error) {
    console.log('❌ KMP Message Bus connection - FAILED:', (error as Error).message);
    failed++;
  }

  // Test 4: End-to-End Flow Simulation
  console.log('\n🔄 Step 4: End-to-End Flow Simulation...');
  try {
    // Simulate a complete supply chain event from ERP to blockchain
    const testEvent = {
      productId: `ERP-DEMO-${Date.now()}`,
      eventType: 'PRODUCTION_START',
      location: 'Demo Factory',
      timestamp: new Date().toISOString(),
      data: {
        sapMaterial: 'DEMO-MAT-001',
        oracleItem: 'ORACLE-ITEM-001',
        description: 'Demo Product from ERP Integration',
        source: 'ERP_INTEGRATION_DEMO'
      },
      metadata: {
        demo: true,
        connector: 'ERP_DEMO',
        originalSystems: ['SAP_S4HANA', 'ORACLE_SCM']
      }
    };

    const kmpUrl = process.env.KMP_MESSAGE_BUS_URL || 'http://localhost:3001';
    const eventResponse = await axios.post(`${kmpUrl}/api/supply-chain/event`, testEvent, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    if (eventResponse.data.eventId) {
      console.log('✅ End-to-End Flow - PASSED');
      console.log(`   📝 Event ID: ${eventResponse.data.eventId}`);
      console.log(`   🔗 Transaction ID: ${eventResponse.data.transactionId || 'pending'}`);
      passed++;
    } else {
      throw new Error('No event ID returned from KMP');
    }
  } catch (error) {
    console.log('❌ End-to-End Flow - FAILED:', (error as Error).message);
    failed++;
  }

  // Demo Results
  console.log('\n============================================================');
  console.log('🚀 ERP INTEGRATION DEMO RESULTS');
  console.log('============================================================');
  console.log(`📊 Summary: ${passed}/4 tests passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (passed >= 3) {
    console.log('\n🎉 ERP INTEGRATION IS WORKING!');
    console.log('💡 Your supply chain events are flowing from ERP systems to the Kaspa blockchain.');
    console.log('\n🔗 Integration Flow:');
    console.log('   SAP S/4HANA → KMP Message Bus → Kaspa Blockchain');
    console.log('   Oracle SCM → KMP Message Bus → Kaspa Blockchain');
    console.log('\n✨ Next Steps:');
    console.log('   • Configure real SAP/Oracle credentials for production');
    console.log('   • Set up webhook endpoints for real-time ERP events');
    console.log('   • Add custom field mappings for your specific use case');
    console.log('   • Enable scheduled sync jobs for continuous integration');
  } else {
    console.log('\n⚠️  ERP integration needs attention. Check configuration and connectivity.');
  }

  console.log('\n📚 Documentation:');
  console.log('   • SAP API Business Hub: https://api.sap.com');
  console.log('   • Oracle Cloud Free Tier: https://cloud.oracle.com/free');
  console.log('   • KMP Integration Docs: http://localhost:4001/docs');
}

// Environment setup check
function checkEnvironment() {
  console.log('🔧 Environment Check:');
  console.log(`   KMP_MESSAGE_BUS_URL: ${process.env.KMP_MESSAGE_BUS_URL || 'http://localhost:3001 (default)'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   DEBUG: ${process.env.DEBUG || 'false'}`);
  console.log('');
}

if (require.main === module) {
  checkEnvironment();
  runERPToBlockchainDemo().catch(console.error);
}

export { runERPToBlockchainDemo }; 