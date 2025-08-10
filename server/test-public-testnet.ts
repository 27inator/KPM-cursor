#!/usr/bin/env tsx

/**
 * Test Public Kaspa Testnet Connection
 * 
 * This tests connecting to public Kaspa testnet nodes instead of running a local node
 */

import { Kaspeak } from 'kaspeak-sdk';

console.log('🌐 Testing Public Kaspa Testnet Connection');
console.log('='.repeat(50));

const PUBLIC_TESTNET_ENDPOINTS = [
  'wss://testnet-rpc.kaspa.org:17210',
  'wss://testnet-1.kaspa.org:17210',
  'wss://testnet-2.kaspa.org:17210'
];

async function testPublicTestnetConnection() {
  const mnemonic = process.env.MASTER_MNEMONIC;
  
  if (!mnemonic) {
    console.error('❌ MASTER_MNEMONIC not found in environment');
    return;
  }
  
  console.log(`🔑 Using mnemonic: ${mnemonic.split(' ').slice(0, 3).join(' ')}...`);
  console.log('');

  for (const endpoint of PUBLIC_TESTNET_ENDPOINTS) {
    console.log(`🔗 Testing connection to ${endpoint}...`);
    
    try {
      const kaspeakSDK = new Kaspeak({
        network: 'testnet-10',
        rpcUrl: endpoint,
        mnemonic: mnemonic,
        addressPrefix: 'kaspatest:'
      });
      
      console.log('✅ Kaspeak SDK initialized successfully!');
      
      // Test wallet generation
      const testWallet = kaspeakSDK.generateWallet(0);
      console.log(`📱 Generated wallet: ${testWallet.address}`);
      
      // Test balance check
      const balance = await kaspeakSDK.getBalance(testWallet.address);
      console.log(`💰 Balance: ${(balance / 100000000).toFixed(8)} KAS`);
      
      console.log(`✅ ${endpoint} connection successful!`);
      console.log('');
      
      // If we get here, update the main kaspa service
      console.log('🔄 This endpoint can be used in server/services/kaspa.ts');
      console.log(`rpcUrl: "${endpoint}"`);
      console.log('');
      
      return endpoint;
      
    } catch (error) {
      console.error(`❌ Failed to connect to ${endpoint}:`, error.message);
      console.log('');
    }
  }
  
  console.log('❌ All public testnet endpoints failed');
  console.log('💡 You may need to run a local testnet node instead');
  console.log('📋 Run: tsx server/setup-testnet-node.ts for instructions');
}

testPublicTestnetConnection().catch(console.error);