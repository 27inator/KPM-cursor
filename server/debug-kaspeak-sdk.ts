// Debug kaspeak-SDK initialization issues in Replit environment
import { Kaspeak } from 'kaspeak-sdk';

async function debugKaspeakSDK() {
  console.log('🔧 DEBUGGING KASPEAK-SDK INITIALIZATION');
  console.log('=' .repeat(45));
  
  console.log('1️⃣ Environment Check:');
  console.log(`   Node version: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  console.log(`   ENV: ${process.env.NODE_ENV}`);
  
  console.log('\n2️⃣ Network connectivity check:');
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    console.log(`   External network: ${response.ok ? 'OK' : 'FAILED'}`);
  } catch (error) {
    console.log(`   External network: FAILED - ${error.message}`);
  }
  
  console.log('\n3️⃣ Trying kaspeak-SDK with verbose logging:');
  
  try {
    // Enable any debug logging if available
    if (typeof process !== 'undefined' && process.env) {
      process.env.DEBUG = '*';
    }
    
    console.log('   Creating Kaspeak instance...');
    
    // Try different configuration options
    const configs = [
      { privateKey: 1, prefix: "TEST", networkId: "testnet-10" },
      { privateKey: 2, prefix: "KMP", networkId: "testnet-11" },
    ];
    
    for (const config of configs) {
      try {
        console.log(`   Trying config: ${JSON.stringify(config)}`);
        
        const sdk = await Promise.race([
          Kaspeak.create(config.privateKey, config.prefix, config.networkId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
          )
        ]);
        
        console.log(`   ✅ SUCCESS with config: ${JSON.stringify(config)}`);
        console.log(`   Address: ${(sdk as any).address}`);
        console.log(`   Public Key: ${(sdk as any).publicKey}`);
        
        return {
          success: true,
          config: config,
          address: (sdk as any).address,
          publicKey: (sdk as any).publicKey,
          sdk: sdk
        };
        
      } catch (configError) {
        console.log(`   ❌ FAILED with config: ${JSON.stringify(config)}`);
        console.log(`      Error: ${configError.message}`);
        
        // Log more details about the error
        if (configError.stack) {
          const lines = configError.stack.split('\n').slice(0, 5);
          lines.forEach(line => console.log(`      ${line}`));
        }
      }
    }
    
    return { success: false, error: 'All configurations failed' };
    
  } catch (error) {
    console.log(`   ❌ General SDK error: ${error.message}`);
    
    if (error.stack) {
      console.log('\n4️⃣ Full error stack:');
      error.stack.split('\n').slice(0, 10).forEach(line => {
        console.log(`   ${line}`);
      });
    }
    
    return { success: false, error: error.message, stack: error.stack };
  }
}

// Run the debug
debugKaspeakSDK().then(result => {
  console.log('\n📊 KASPEAK-SDK DEBUG RESULT');
  console.log('=' .repeat(28));
  
  if (result.success) {
    console.log('🎉 SUCCESS: kaspeak-SDK is working!');
    console.log(`   Config: ${JSON.stringify(result.config)}`);
    console.log(`   Address: ${result.address}`);
    console.log(`   Ready for blockchain operations`);
  } else {
    console.log('❌ FAILED: kaspeak-SDK initialization failed');
    console.log(`   Error: ${result.error}`);
    
    console.log('\n💡 Possible solutions:');
    console.log('   1. Network restrictions in Replit environment');
    console.log('   2. WASM module loading issues');
    console.log('   3. Missing dependencies or version conflicts');
    console.log('   4. Node.js version compatibility');
    
    console.log('\n🔍 Next steps:');
    console.log('   - Check if we can download WASM files manually');
    console.log('   - Try alternative SDK initialization methods');
    console.log('   - Use SDK crypto libraries directly');
  }
}).catch(crashError => {
  console.error('Debug script crashed:', crashError);
});