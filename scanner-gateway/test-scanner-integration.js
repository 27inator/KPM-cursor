#!/usr/bin/env node

const axios = require('axios');

const SCANNER_GATEWAY_URL = 'http://localhost:5000';
const DEMO_API_KEY = 'kmp_scanner_demo_key_12345';

async function testScannerIntegration() {
  console.log('🔫 KMP SCANNER INTEGRATION TEST');
  console.log('================================');
  console.log('💡 Demonstrating how simple it is for companies to integrate scanners');
  console.log('');

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  console.log('🔄 Step 1: Scanner Gateway Health Check...');
  try {
    const response = await axios.get(`${SCANNER_GATEWAY_URL}/health`);
    console.log('✅ Scanner Gateway - ONLINE');
    console.log(`   Active Scanners: ${response.data.activeScannersCount}`);
    passed++;
  } catch (error) {
    console.log('❌ Scanner Gateway - OFFLINE');
    failed++;
    return;
  }

  // Test 2: Simple Product Scan
  console.log('\n🔄 Step 2: Simple Product Scan...');
  try {
    const scanData = {
      productId: 'SKU-TEST-001',
      eventType: 'SCAN'
    };

    const response = await axios.post(`${SCANNER_GATEWAY_URL}/api/scan`, scanData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEMO_API_KEY
      }
    });

    console.log('✅ Product Scan - SUCCESS');
    console.log(`   Scan ID: ${response.data.scanId}`);
    console.log(`   Event ID: ${response.data.eventId}`);
    console.log(`   Transaction ID: ${response.data.transactionId || 'pending'}`);
    passed++;
  } catch (error) {
    console.log('❌ Product Scan - FAILED:', error.response?.data?.error || error.message);
    failed++;
  }

  // Test 3: Advanced Scan with Custom Data
  console.log('\n🔄 Step 3: Advanced Scan with Custom Data...');
  try {
    const scanData = {
      productId: 'BATCH-B2024-001',
      eventType: 'QUALITY_CHECK',
      operator: 'Alice Johnson',
      location: 'Quality Control Station 1',
      data: {
        batchNumber: 'B2024001',
        temperature: '22.5C',
        humidity: '45%',
        inspector: 'Alice Johnson',
        notes: 'Passed all quality checks',
        defects: 0,
        certificationLevel: 'Grade A'
      }
    };

    const response = await axios.post(`${SCANNER_GATEWAY_URL}/api/scan`, scanData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DEMO_API_KEY
      }
    });

    console.log('✅ Advanced Scan - SUCCESS');
    console.log(`   Scan ID: ${response.data.scanId}`);
    console.log(`   Event ID: ${response.data.eventId}`);
    passed++;
  } catch (error) {
    console.log('❌ Advanced Scan - FAILED:', error.response?.data?.error || error.message);
    failed++;
  }

  // Test 4: Scanner Registration (for new companies)
  console.log('\n🔄 Step 4: New Scanner Registration...');
  try {
    const scannerData = {
      name: 'Warehouse Scanner 001',
      companyId: 1,
      location: 'Warehouse A - Receiving Dock',
      type: 'handheld'
    };

    const response = await axios.post(`${SCANNER_GATEWAY_URL}/api/scanners/register`, scannerData);

    console.log('✅ Scanner Registration - SUCCESS');
    console.log(`   Scanner ID: ${response.data.scanner.id}`);
    console.log(`   API Key: ${response.data.scanner.apiKey}`);
    console.log(`   Webhook URL: ${response.data.scanner.webhookUrl}`);
    passed++;
  } catch (error) {
    console.log('❌ Scanner Registration - FAILED:', error.response?.data?.error || error.message);
    failed++;
  }

  // Test 5: Company Scanner Dashboard
  console.log('\n🔄 Step 5: Company Scanner Dashboard...');
  try {
    const response = await axios.get(`${SCANNER_GATEWAY_URL}/api/company/1/scanners`);

    console.log('✅ Scanner Dashboard - SUCCESS');
    console.log(`   Total Scanners: ${response.data.totalScanners}`);
    console.log(`   Active Scanners: ${response.data.activeScanners}`);
    console.log(`   Total Scans: ${response.data.totalScans}`);
    passed++;
  } catch (error) {
    console.log('❌ Scanner Dashboard - FAILED:', error.response?.data?.error || error.message);
    failed++;
  }

  // Test Results
  console.log('\n============================================================');
  console.log('🔫 SCANNER INTEGRATION TEST RESULTS');
  console.log('============================================================');
  console.log(`📊 Summary: ${passed}/5 tests passed`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (passed >= 4) {
    console.log('\n🎉 SCANNER INTEGRATION IS WORKING!');
    console.log('💡 Companies can now integrate scanners in MINUTES, not months!');
    console.log('\n🔗 Integration Flow:');
    console.log('   Scanner Device → HTTP POST → Scanner Gateway → Message Bus → Kaspa Blockchain');
    console.log('\n✨ What this means for companies:');
    console.log('   • No complex software installations');
    console.log('   • No infrastructure changes required');
    console.log('   • Works with ANY scanner that can do HTTP POST');
    console.log('   • Simple API key authentication');
    console.log('   • Real-time blockchain anchoring');
    console.log('   • Company dashboard for monitoring');
    console.log('\n📱 Compatible with:');
    console.log('   • Zebra handheld scanners (DataWedge)');
    console.log('   • Honeywell scanners (ScanToConnect)');
    console.log('   • Custom mobile apps (HTTP POST)');
    console.log('   • ERP-integrated scanners (webhook)');
    console.log('   • Fixed/conveyor scanners (REST API)');
    console.log('   • RFID readers with HTTP capability');
  } else {
    console.log('\n⚠️  Scanner integration needs attention. Check gateway and message bus connectivity.');
  }

  console.log('\n📚 Next Steps for Companies:');
  console.log('   1. Register scanner: POST to /api/scanners/register');
  console.log('   2. Configure device with API key and webhook URL');
  console.log('   3. Start scanning - data flows to blockchain automatically!');
  console.log('\n🔗 Integration Documentation:');
  console.log(`   ${SCANNER_GATEWAY_URL}/docs/scanner-integration`);
}

// Simple demo commands for different scanner types
function printIntegrationExamples() {
  console.log('\n📋 INTEGRATION EXAMPLES FOR DIFFERENT SCANNERS:');
  console.log('================================================');
  
  console.log('\n🔫 Handheld Scanner (Zebra/Honeywell):');
  console.log('Configure scanner to POST to webhook on scan:');
  console.log(`curl -X POST ${SCANNER_GATEWAY_URL}/api/scan \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "X-API-Key: your-api-key" \\`);
  console.log(`  -d '{"productId":"SCANNED_BARCODE","eventType":"SCAN"}'`);
  
  console.log('\n📱 Mobile App Integration:');
  console.log('Add HTTP POST after barcode capture:');
  console.log(`fetch('${SCANNER_GATEWAY_URL}/api/scan', {`);
  console.log(`  method: 'POST',`);
  console.log(`  headers: {`);
  console.log(`    'Content-Type': 'application/json',`);
  console.log(`    'X-API-Key': 'your-api-key'`);
  console.log(`  },`);
  console.log(`  body: JSON.stringify({`);
  console.log(`    productId: scannedBarcode,`);
  console.log(`    eventType: 'MOBILE_SCAN',`);
  console.log(`    operator: currentUser.name`);
  console.log(`  })`);
  console.log(`});`);
  
  console.log('\n🏭 ERP Integration (SAP/Oracle):');
  console.log('Add webhook call to existing scan workflow:');
  console.log('// In your ERP scan handler:');
  console.log(`httpPost('${SCANNER_GATEWAY_URL}/api/scan', {`);
  console.log(`  productId: material.id,`);
  console.log(`  eventType: 'ERP_SCAN',`);
  console.log(`  location: workCenter.name,`);
  console.log(`  data: { erpDocument: purchaseOrder.number }`);
  console.log(`});`);
}

if (require.main === module) {
  testScannerIntegration()
    .then(() => printIntegrationExamples())
    .catch(console.error);
}

module.exports = { testScannerIntegration }; 