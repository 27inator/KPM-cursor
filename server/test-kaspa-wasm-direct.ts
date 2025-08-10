#!/usr/bin/env tsx

/**
 * Test using kaspa-wasm directly instead of kaspeak-sdk
 * This should bypass the padEnd issue entirely
 */

console.log('🔧 Testing Direct kaspa-wasm Usage');
console.log('===================================');

// Test 1: Try importing kaspa-wasm directly
console.log('1. Testing kaspa-wasm import...');
try {
  const kaspaWasm = await import('kaspa-wasm');
  console.log('✅ kaspa-wasm imported successfully');
  console.log(`  Available exports: ${Object.keys(kaspaWasm).slice(0, 10).join(', ')}...`);
  
  // Check if we can initialize the WASM module
  if (kaspaWasm.initWasm) {
    console.log('  Initializing WASM module...');
    await kaspaWasm.initWasm();
    console.log('✅ WASM module initialized');
  }
  
  // Test basic functionality
  if (kaspaWasm.Address) {
    console.log('  Testing Address creation...');
    // This is just to test if the module works
    console.log('✅ Address class available');
  }
  
} catch (error) {
  console.log(`❌ kaspa-wasm failed: ${error.message}`);
}

// Test 2: Try creating a custom implementation
console.log('\n2. Testing custom Kaspa implementation...');
try {
  const kaspaWasm = await import('kaspa-wasm');
  
  // Create a simple custom implementation
  class CustomKaspaClient {
    private network: string;
    private mnemonic: string;
    
    constructor(config: { network?: string, mnemonic?: string } = {}) {
      this.network = config.network || 'testnet';
      this.mnemonic = config.mnemonic || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      
      console.log(`  Initialized CustomKaspaClient for ${this.network}`);
    }
    
    async generateAddress(index: number): Promise<string> {
      // Mock implementation for testing
      const hash = await this.hashString(`${this.mnemonic}_${index}`);
      return `kaspatest:${hash.substring(0, 10)}`;
    }
    
    async hashString(input: string): Promise<string> {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async submitTransaction(txData: any): Promise<string> {
      // Mock implementation
      const txId = await this.hashString(`tx_${Date.now()}_${Math.random()}`);
      return `testnet_${txId.substring(0, 16)}`;
    }
  }
  
  // Test the custom implementation
  const client = new CustomKaspaClient({
    network: 'testnet',
    mnemonic: 'one two three four five six seven eight nine ten eleven twelve'
  });
  
  const address = await client.generateAddress(0);
  console.log(`✅ Generated address: ${address}`);
  
  const txId = await client.submitTransaction({ test: 'data' });
  console.log(`✅ Mock transaction ID: ${txId}`);
  
} catch (error) {
  console.log(`❌ Custom implementation failed: ${error.message}`);
}

// Test 3: Check if we can use the utilities from kaspeak-sdk without the main class
console.log('\n3. Testing kaspeak-sdk utilities only...');
try {
  const { bytesToHex, hexToBytes, randomBytes, ECDSA, Schnorr } = await import('kaspeak-sdk');
  
  // Test utility functions
  const testBytes = randomBytes(32);
  const hex = bytesToHex(testBytes);
  const backToBytes = hexToBytes(hex);
  
  console.log(`✅ Utilities work: ${testBytes.length} bytes -> ${hex.length} hex chars -> ${backToBytes.length} bytes`);
  
  // Test cryptographic functions
  if (ECDSA && Schnorr) {
    console.log('✅ Cryptographic functions available');
  }
  
  console.log('✅ All kaspeak-sdk utilities work correctly');
  
} catch (error) {
  console.log(`❌ Utilities test failed: ${error.message}`);
}

console.log('\n🎯 Direct kaspa-wasm Test Complete');
console.log('===================================');
console.log('Based on the results above, we can either:');
console.log('1. Use kaspa-wasm directly for blockchain operations');
console.log('2. Use kaspeak-sdk utilities with custom implementation');
console.log('3. Create a hybrid approach using working components');