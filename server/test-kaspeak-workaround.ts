#!/usr/bin/env tsx

/**
 * Test Kaspeak SDK Workaround
 * Try to initialize SDK with environment variables and polyfills
 */

// Add polyfills if needed
if (typeof globalThis.padEnd === 'undefined') {
  globalThis.padEnd = String.prototype.padEnd;
}

// Set up environment variables that might be missing
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🔧 Testing Kaspeak SDK Workaround');
console.log('=================================');

// Test 1: Check if kaspa-wasm is available
console.log('1. Testing kaspa-wasm dependency...');
try {
  const kaspaWasm = await import('kaspa-wasm');
  console.log('✅ kaspa-wasm imported successfully');
  console.log(`  Available: ${Object.keys(kaspaWasm)}`);
} catch (error) {
  console.log(`❌ kaspa-wasm failed: ${error.message}`);
  console.log('  This might be the root cause of the padEnd issue');
}

// Test 2: Try importing individual components
console.log('\n2. Testing individual SDK components...');
try {
  const { bytesToHex, hexToBytes, randomBytes } = await import('kaspeak-sdk');
  console.log('✅ Utility functions imported successfully');
  
  // Test utility functions
  const testBytes = randomBytes(32);
  const hexString = bytesToHex(testBytes);
  const backToBytes = hexToBytes(hexString);
  console.log(`  Random bytes test: ${testBytes.length} bytes -> ${hexString.length} hex chars -> ${backToBytes.length} bytes`);
} catch (error) {
  console.log(`❌ Utility functions failed: ${error.message}`);
}

// Test 3: Try with different initialization approaches
console.log('\n3. Testing different initialization approaches...');

const testApproaches = [
  {
    name: 'Empty object config',
    config: {},
    setup: () => {}
  },
  {
    name: 'Null config',
    config: null,
    setup: () => {}
  },
  {
    name: 'Undefined config',
    config: undefined,
    setup: () => {}
  },
  {
    name: 'With network only',
    config: { network: 'testnet' },
    setup: () => {}
  },
  {
    name: 'With polyfills',
    config: {},
    setup: () => {
      // Add potential missing polyfills
      if (typeof global !== 'undefined') {
        global.padEnd = String.prototype.padEnd;
      }
      if (typeof window !== 'undefined') {
        window.padEnd = String.prototype.padEnd;
      }
    }
  }
];

for (const approach of testApproaches) {
  try {
    console.log(`  Testing: ${approach.name}`);
    
    // Run setup
    approach.setup();
    
    const { Kaspeak } = await import('kaspeak-sdk');
    const sdk = new Kaspeak(approach.config);
    
    console.log(`  ✅ ${approach.name}: SUCCESS!`);
    console.log(`    SDK type: ${typeof sdk}`);
    console.log(`    SDK methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(sdk))}`);
    
    // If successful, try a simple operation
    try {
      // Test if SDK has basic methods
      console.log(`    Available methods: ${Object.getOwnPropertyNames(sdk)}`);
    } catch (methodError) {
      console.log(`    Method test failed: ${methodError.message}`);
    }
    
    break; // Stop at first success
    
  } catch (error) {
    console.log(`  ❌ ${approach.name}: ${error.message}`);
  }
}

// Test 4: Check if the issue is WebAssembly related
console.log('\n4. Testing WebAssembly support...');
try {
  if (typeof WebAssembly === 'undefined') {
    console.log('❌ WebAssembly not supported in this environment');
  } else {
    console.log('✅ WebAssembly supported');
    
    // Test a simple WebAssembly operation
    const wasmCode = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
    const wasmModule = await WebAssembly.compile(wasmCode);
    console.log('✅ WebAssembly compilation test passed');
  }
} catch (error) {
  console.log(`❌ WebAssembly test failed: ${error.message}`);
}

console.log('\n🎯 Workaround Test Complete');
console.log('============================');
console.log('If any approach succeeded, we can use that configuration.');
console.log('If all failed, the issue is likely in the kaspa-wasm dependency.');