#!/usr/bin/env tsx
/**
 * Direct RPC Connection Test
 * Test your local testnet node directly without kaspeak-SDK
 */

// Use built-in fetch (Node.js 18+) or create a simple test

const TESTNET_RPC_URL = 'https://late-llamas-fetch.loca.lt';

async function testDirectRPC() {
  console.log('🔗 Direct RPC Connection Test');
  console.log('=============================');
  console.log(`📡 Testing: ${TESTNET_RPC_URL}`);
  console.log('');

  // Test 1: Basic connectivity
  try {
    console.log('1. Testing basic connectivity...');
    const response = await fetch(TESTNET_RPC_URL, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log(`✅ HTTP Status: ${response.status}`);
    console.log(`✅ Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
  } catch (error) {
    console.log(`❌ Basic connectivity failed: ${error.message}`);
  }

  // Test 2: RPC getInfo call
  try {
    console.log('\n2. Testing RPC getInfo call...');
    const response = await fetch(TESTNET_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        method: 'getInfo',
        params: [],
        id: 1
      })
    });

    const data = await response.json();
    console.log(`✅ RPC Response: ${JSON.stringify(data, null, 2)}`);
    
    if (data.result) {
      console.log(`🌐 Network: ${data.result.network}`);
      console.log(`📊 Block Count: ${data.result.blockCount}`);
      console.log(`🔄 Sync Status: ${data.result.isSynced ? 'Synced' : 'Syncing'}`);
    }
  } catch (error) {
    console.log(`❌ RPC call failed: ${error.message}`);
  }

  // Test 3: Test WebSocket connection (if supported)
  try {
    console.log('\n3. Testing WebSocket connection...');
    const wsUrl = TESTNET_RPC_URL.replace('https://', 'wss://');
    console.log(`📡 WebSocket URL: ${wsUrl}`);
    
    // Simple WebSocket test
    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      ws.send(JSON.stringify({
        method: 'getInfo',
        params: [],
        id: 1
      }));
    });
    
    ws.on('message', (data) => {
      console.log(`✅ WebSocket response: ${data}`);
      ws.close();
    });
    
    ws.on('error', (error) => {
      console.log(`❌ WebSocket error: ${error.message}`);
    });
    
    // Wait for WebSocket test
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.log(`❌ WebSocket test failed: ${error.message}`);
  }

  // Test 4: Test specific endpoints
  const endpoints = [
    '/rpc',
    '/ws',
    '/v1/info',
    '/api/info'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n4. Testing endpoint: ${endpoint}`);
      const response = await fetch(`${TESTNET_RPC_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'getInfo',
          params: [],
          id: 1
        })
      });

      const data = await response.json();
      console.log(`✅ ${endpoint}: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.log(`❌ ${endpoint} failed: ${error.message}`);
    }
  }

  console.log('\n📊 Test Summary');
  console.log('================');
  console.log('If any tests above succeeded, your testnet node is working correctly.');
  console.log('The kaspeak-SDK issue is likely a Node.js compatibility problem, not a network issue.');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Use direct RPC calls instead of kaspeak-SDK');
  console.log('2. Implement custom transaction signing');
  console.log('3. Create wrapper functions for KPM integration');
}

testDirectRPC().catch(console.error);