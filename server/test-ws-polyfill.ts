#!/usr/bin/env tsx

/**
 * Test different WebSocket polyfills for Kaspeak SDK
 */

console.log('🔧 Testing Different WebSocket Polyfills');
console.log('=======================================');

// Test 1: Try with ws library
console.log('1. Testing with ws library...');
try {
  const WebSocket = await import('ws');
  globalThis.WebSocket = WebSocket.default;
  
  const { Kaspeak } = await import('kaspeak-sdk');
  const sdk = new Kaspeak();
  console.log('✅ ws library polyfill worked!');
} catch (error) {
  console.log(`❌ ws library failed: ${error.message}`);
}

// Test 2: Try with different WebSocket setup
console.log('\n2. Testing with websocket library (different approach)...');
try {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  
  // Clear previous polyfill
  delete globalThis.WebSocket;
  
  const websocket = require('websocket');
  globalThis.WebSocket = websocket.w3cwebsocket;
  
  console.log('WebSocket polyfill set:', typeof globalThis.WebSocket);
  
  const { Kaspeak } = await import('kaspeak-sdk');
  const sdk = new Kaspeak();
  console.log('✅ websocket library polyfill worked!');
} catch (error) {
  console.log(`❌ websocket library failed: ${error.message}`);
}

// Test 3: Try the official kaspeak example approach
console.log('\n3. Testing official kaspeak example approach...');
try {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  
  // Clear previous polyfill
  delete globalThis.WebSocket;
  
  // Use the exact same approach as kaspeak examples
  globalThis.WebSocket = require("websocket").w3cwebsocket;
  
  const { Kaspeak } = await import('kaspeak-sdk');
  const sdk = new Kaspeak();
  console.log('✅ Official example approach worked!');
} catch (error) {
  console.log(`❌ Official example approach failed: ${error.message}`);
}

// Test 4: Check if the issue is with the configuration
console.log('\n4. Testing with explicit network configuration...');
try {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  
  // Clear previous polyfill
  delete globalThis.WebSocket;
  
  globalThis.WebSocket = require("websocket").w3cwebsocket;
  
  const { Kaspeak } = await import('kaspeak-sdk');
  
  // Try with explicit testnet configuration
  const sdk = new Kaspeak({
    network: 'testnet',
    rpcUrl: 'wss://testnet-rpc.kaspa.org:17210'
  });
  
  console.log('✅ Explicit testnet configuration worked!');
} catch (error) {
  console.log(`❌ Explicit testnet configuration failed: ${error.message}`);
}

console.log('\n🎯 WebSocket Polyfill Test Complete');
console.log('====================================');
console.log('If any approach succeeded, we can use that configuration.');
console.log('Otherwise, the issue might be deeper in the SDK or kaspa-wasm.');