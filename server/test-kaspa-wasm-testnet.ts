// Test Kaspa WASM SDK for proper testnet address generation
import { initConsolePanicHook, Address, NetworkId, createAddress } from "kaspa-wasm";

async function testKaspaWASMTestnet() {
  console.log('🧪 TESTING KASPA WASM SDK - TESTNET ADDRESS GENERATION');
  console.log('=========================================================');
  
  try {
    // Initialize panic hook
    await initConsolePanicHook();
    console.log('✅ Kaspa WASM initialized');
    
    // Test different networks
    console.log('\n1. Testing NetworkId options:');
    
    // Test testnet network
    console.log('Creating testnet NetworkId...');
    const testnetId = new NetworkId('testnet-10');
    console.log('Testnet NetworkId:', testnetId.toString());
    
    // Test mainnet network  
    const mainnetId = new NetworkId('mainnet');
    console.log('Mainnet NetworkId:', mainnetId.toString());
    
    console.log('\n2. Testing Address generation with different networks:');
    
    // Generate a sample address with testnet
    console.log('Attempting address creation with testnet...');
    
    // We need to understand how Address constructor works
    // Let's check what parameters it accepts
    console.log('Address constructor test...');
    
    // Try creating from existing address string to understand format
    try {
      const testnetAddress = 'kaspatest:qzjcjy6emyjjayp44tqzdaflqja54ckxkqrcvwfejqyhgpkq8ukj6hmdrrqa2';
      const parsedAddress = new Address(testnetAddress);
      console.log('✅ Successfully parsed testnet address:', parsedAddress.toString());
      console.log('Address version:', parsedAddress.version);
      console.log('Payload length:', parsedAddress.payload.length);
    } catch (e) {
      console.log('❌ Failed to parse testnet address:', e.message);
    }
    
    try {
      const mainnetAddress = 'kaspa:qrrzeucwfetuty3qserqydw4z4ax9unxd23zwp7tndvg7cs3ls8dvwldeayv5';
      const parsedMainnet = new Address(mainnetAddress);
      console.log('✅ Successfully parsed mainnet address:', parsedMainnet.toString());
    } catch (e) {
      console.log('❌ Failed to parse mainnet address:', e.message);
    }
    
  } catch (error) {
    console.error('💥 KASPA WASM FAILED:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n=========================================================');
  console.log('Test completed - checking if WASM SDK supports testnet addressing');
}

testKaspaWASMTestnet().catch(console.error);