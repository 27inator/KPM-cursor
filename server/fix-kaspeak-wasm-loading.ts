// Try to fix kaspeak-SDK WASM loading by using local files instead of fetch
import fs from 'fs';
import path from 'path';

async function fixKaspeakWasmLoading() {
  console.log('🔧 FIXING KASPEAK-SDK WASM LOADING');
  console.log('=' .repeat(35));
  
  // Check what WASM files are available locally
  const wasmPaths = [
    'node_modules/kaspeak-sdk/pkg/esm/kaspa_bg.wasm',
    'node_modules/kaspeak-sdk/pkg/esm/zstd.wasm',
    'node_modules/kaspeak-sdk/pkg/cjs/kaspa_bg.wasm', 
    'node_modules/kaspeak-sdk/pkg/cjs/zstd.wasm'
  ];
  
  console.log('1️⃣ Checking local WASM files:');
  for (const wasmPath of wasmPaths) {
    const exists = fs.existsSync(wasmPath);
    const size = exists ? fs.statSync(wasmPath).size : 0;
    console.log(`   ${exists ? '✅' : '❌'} ${wasmPath} (${size} bytes)`);
  }
  
  // Try to use the CommonJS version which might work better
  console.log('\n2️⃣ Trying CommonJS version of kaspeak-SDK:');
  
  try {
    // Load the CommonJS version
    const { Kaspeak } = await import('kaspeak-sdk/pkg/cjs/index.cjs');
    
    console.log('   CommonJS import successful');
    
    // Try to create instance
    const sdk = await Kaspeak.create(1, "KMP", "testnet-10");
    
    console.log('   ✅ SDK creation successful!');
    console.log(`   Address: ${sdk.address}`);
    console.log(`   Public Key: ${sdk.publicKey}`);
    
    return {
      success: true,
      method: 'CommonJS version',
      address: sdk.address,
      publicKey: sdk.publicKey,
      sdk: sdk
    };
    
  } catch (cjsError) {
    console.log(`   ❌ CommonJS failed: ${cjsError.message}`);
  }
  
  // Try to manually load WASM and patch the module
  console.log('\n3️⃣ Attempting manual WASM loading:');
  
  try {
    const kaspaWasmPath = 'node_modules/kaspeak-sdk/pkg/esm/kaspa_bg.wasm';
    
    if (fs.existsSync(kaspaWasmPath)) {
      const wasmBuffer = fs.readFileSync(kaspaWasmPath);
      console.log(`   Loaded WASM file: ${wasmBuffer.length} bytes`);
      
      // Try to preload WebAssembly module
      const wasmModule = await WebAssembly.compile(wasmBuffer);
      console.log('   WASM compilation successful');
      
      // This might help the SDK find the module
      globalThis.__KASPA_WASM__ = wasmModule;
      
      const { Kaspeak } = await import('kaspeak-sdk');
      const sdk = await Kaspeak.create(1, "KMP", "testnet-10");
      
      console.log('   ✅ Manual WASM loading successful!');
      return {
        success: true,
        method: 'Manual WASM loading',
        address: sdk.address,
        publicKey: sdk.publicKey,
        sdk: sdk
      };
      
    } else {
      console.log('   ❌ WASM file not found');
    }
    
  } catch (wasmError) {
    console.log(`   ❌ Manual WASM loading failed: ${wasmError.message}`);
  }
  
  // Last resort: Try with different Node.js fetch polyfill
  console.log('\n4️⃣ Trying with fetch polyfill:');
  
  try {
    // Install node-fetch as a polyfill
    const nodeFetch = await import('node-fetch');
    globalThis.fetch = nodeFetch.default as any;
    
    console.log('   Applied fetch polyfill');
    
    const { Kaspeak } = await import('kaspeak-sdk');
    const sdk = await Kaspeak.create(1, "KMP", "testnet-10");
    
    console.log('   ✅ Fetch polyfill successful!');
    return {
      success: true,
      method: 'Fetch polyfill',
      address: sdk.address,
      publicKey: sdk.publicKey,
      sdk: sdk
    };
    
  } catch (polyfillError) {
    console.log(`   ❌ Fetch polyfill failed: ${polyfillError.message}`);
  }
  
  return {
    success: false,
    error: 'All WASM loading methods failed',
    recommendation: 'Use kaspeak-SDK crypto libraries directly for wallet generation'
  };
}

// Execute the fix
fixKaspeakWasmLoading().then(result => {
  console.log('\n📊 KASPEAK-SDK WASM FIX RESULT');
  console.log('=' .repeat(30));
  
  if (result.success) {
    console.log('🎉 SUCCESS: kaspeak-SDK is now working!');
    console.log(`   Method: ${result.method}`);
    console.log(`   Address: ${result.address}`);
    console.log(`   Public Key: ${result.publicKey}`);
    
    console.log('\n✅ FINAL RESULT:');
    console.log('   kaspeak-SDK can now generate valid Kaspa wallets');
    console.log('   Ready for blockchain integration');
    
  } else {
    console.log('❌ FAILED: Could not fix kaspeak-SDK WASM loading');
    console.log(`   Error: ${result.error}`);
    
    if (result.recommendation) {
      console.log(`\n💡 Recommendation: ${result.recommendation}`);
    }
  }
  
}).catch(error => {
  console.error('Fix script crashed:', error);
});