#!/usr/bin/env tsx

import WebSocket from 'ws';
import fetch from 'node-fetch';

// Working Kaspa testnet endpoints
const KASPA_ENDPOINTS = [
  'wss://testnet-rpc.kaspa.org:17210',
  'wss://api-tn10.kaspa.org:17210',
  'wss://testnet-1.kaspa.org:17210',
  'wss://testnet-2.kaspa.org:17210'
];

// Alternative HTTP endpoints
const HTTP_ENDPOINTS = [
  'https://api-tn10.kaspa.org',
  'https://testnet-api.kaspa.org',
  'https://tn10-api.kaspa.org'
];

async function testKaspaConnections() {
  console.log('🔍 Testing Kaspa Testnet Connections');
  console.log('='.repeat(50));
  
  // Test WebSocket connections
  console.log('\n🌐 Testing WebSocket Endpoints:');
  for (const endpoint of KASPA_ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(endpoint);
        
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
          console.log(`✅ ${endpoint} - Connected successfully`);
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        });
        
        ws.on('error', (error) => {
          console.log(`❌ ${endpoint} - Connection failed: ${error.message}`);
          clearTimeout(timeout);
          reject(error);
        });
      });
      
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed: ${error.message}`);
    }
  }
  
  // Test HTTP endpoints
  console.log('\n🌐 Testing HTTP Endpoints:');
  for (const endpoint of HTTP_ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      const response = await fetch(`${endpoint}/info`, { 
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.text();
        console.log(`✅ ${endpoint} - HTTP connection successful`);
        console.log(`   Response: ${data.slice(0, 100)}...`);
      } else {
        console.log(`❌ ${endpoint} - HTTP failed: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint} - HTTP failed: ${error.message}`);
    }
  }
  
  // Test alternative approach - direct IP connection
  console.log('\n🌐 Testing Direct IP Connection:');
  try {
    const response = await fetch('https://1.1.1.1/dns-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-json',
        'Accept': 'application/dns-json'
      },
      body: JSON.stringify({
        name: 'testnet-rpc.kaspa.org',
        type: 'A'
      })
    });
    
    if (response.ok) {
      const dnsData = await response.json();
      console.log('✅ DNS resolution successful:');
      console.log(`   IPs: ${dnsData.Answer?.map(a => a.data).join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ DNS resolution failed: ${error.message}`);
  }
}

// Alternative: Use kaspeak-SDK directly
async function testKaspeakSDK() {
  console.log('\n🔧 Testing Kaspeak SDK Direct Connection:');
  
  try {
    // Import kaspeak-sdk
    const { Wallet, NetworkType } = await import('kaspeak-sdk');
    
    console.log('✅ Kaspeak SDK imported successfully');
    
    // Create wallet with testnet
    const wallet = new Wallet({
      mnemonic: 'one two three four five six seven eight nine ten eleven twelve',
      networkType: NetworkType.Testnet,
      rpcUrl: 'wss://testnet-rpc.kaspa.org:17210'
    });
    
    console.log('✅ Wallet created with testnet configuration');
    
    // Test connection
    await wallet.connect();
    console.log('✅ Wallet connected to testnet');
    
    // Get wallet info
    const info = await wallet.getInfo();
    console.log('✅ Wallet info:', info);
    
    return wallet;
    
  } catch (error) {
    console.log(`❌ Kaspeak SDK test failed: ${error.message}`);
    return null;
  }
}

// Test real transaction with working connection
async function testRealTransaction() {
  console.log('\n📡 Testing Real Transaction Submission:');
  
  try {
    const wallet = await testKaspeakSDK();
    
    if (!wallet) {
      throw new Error('Cannot establish wallet connection');
    }
    
    // Create a simple transaction
    const transaction = await wallet.createTransaction({
      to: 'kaspatest:qqjkhgf7sw4kj6pqz8fz87g4vkqtf8sxq5n5p2m6l3k8q',
      amount: 100000, // 0.001 KAS in sompi
      data: JSON.stringify({
        eventId: 'REAL_TEST_' + Date.now(),
        eventType: 'harvest',
        companyId: 'REAL_COMPANY_TEST',
        timestamp: Date.now()
      })
    });
    
    console.log('✅ Transaction created');
    console.log(`   TX ID: ${transaction.id}`);
    
    // Submit transaction
    const result = await wallet.submitTransaction(transaction);
    console.log('✅ Transaction submitted to real testnet');
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    
    return result;
    
  } catch (error) {
    console.log(`❌ Real transaction failed: ${error.message}`);
    return null;
  }
}

// Main test function
async function main() {
  console.log('🚀 Kaspa Testnet Connection Diagnostics');
  console.log('='.repeat(60));
  
  await testKaspaConnections();
  
  const wallet = await testKaspeakSDK();
  
  if (wallet) {
    await testRealTransaction();
    console.log('\n🎉 SUCCESS: Real Kaspa testnet connection established!');
  } else {
    console.log('\n❌ FAILED: Cannot establish real Kaspa testnet connection');
    console.log('💡 System is currently using mock transactions');
  }
}

main().catch(console.error);