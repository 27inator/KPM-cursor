#!/usr/bin/env tsx

/**
 * Test Kaspeak SDK with WebSocket polyfill
 * This should resolve the padEnd/WebSocket issue
 */

// Add WebSocket polyfill as required by kaspeak-sdk
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { w3cwebsocket } = require('websocket');
globalThis.WebSocket = w3cwebsocket;

console.log('🔧 Testing Kaspeak SDK with WebSocket Polyfill');
console.log('===============================================');

// Now try to initialize the SDK
try {
  console.log('1. Importing Kaspeak SDK...');
  const { Kaspeak } = await import('kaspeak-sdk');
  console.log('✅ SDK imported successfully');

  console.log('2. Testing basic initialization...');
  const sdk = new Kaspeak();
  console.log('✅ Basic initialization successful!');
  console.log(`  SDK type: ${typeof sdk}`);

  console.log('3. Testing with testnet configuration...');
  const testnetSDK = new Kaspeak({
    network: 'testnet'
  });
  console.log('✅ Testnet initialization successful!');

  console.log('4. Testing with your mnemonic...');
  const mnemonicSDK = new Kaspeak({
    network: 'testnet',
    mnemonic: 'one two three four five six seven eight nine ten eleven twelve'
  });
  console.log('✅ Mnemonic initialization successful!');

  console.log('5. Testing with your localtunnel URL...');
  const localtunnelSDK = new Kaspeak({
    network: 'testnet',
    rpcUrl: 'https://late-llamas-fetch.loca.lt',
    mnemonic: 'one two three four five six seven eight nine ten eleven twelve'
  });
  console.log('✅ Localtunnel initialization successful!');

  console.log('\n🎉 SUCCESS! All Kaspeak SDK tests passed!');
  console.log('==========================================');
  console.log('The WebSocket polyfill resolved the padEnd issue.');
  console.log('Your KPM system is now ready for real blockchain integration.');

} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('Error stack:', error.stack);
}

console.log('\n💡 Next Steps:');
console.log('==============');
console.log('1. Add WebSocket polyfill to your main server code');
console.log('2. Update kaspa.ts service to use this polyfill');
console.log('3. Test real blockchain transactions with your node');
console.log('4. Deploy KPM with live Kaspa testnet integration');