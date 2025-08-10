// Check if we're actually in a deployed environment and fix kaspeak-SDK detection
console.log('🔍 CHECKING DEPLOYMENT ENVIRONMENT');
console.log('=' .repeat(35));

console.log('Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`);
console.log(`REPL_DEPLOYMENT: ${process.env.REPL_DEPLOYMENT}`);
console.log(`REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN}`);
console.log(`REPL_SLUG: ${process.env.REPL_SLUG}`);
console.log(`REPL_OWNER: ${process.env.REPL_OWNER}`);

// Check if we can determine deployment status
const deploymentChecks = {
  nodeEnv: process.env.NODE_ENV === 'production',
  replitDeployment: process.env.REPLIT_DEPLOYMENT === '1',
  replDeployment: process.env.REPL_DEPLOYMENT === '1',
  hasDevDomain: !!process.env.REPLIT_DEV_DOMAIN,
  portCheck: process.env.PORT !== '5000', // Production uses different port
};

console.log('\nDeployment Status Checks:');
Object.entries(deploymentChecks).forEach(([key, value]) => {
  console.log(`${key}: ${value ? 'YES' : 'NO'}`);
});

const isDeployed = Object.values(deploymentChecks).some(Boolean);
console.log(`\nOverall Deployed Status: ${isDeployed ? 'DEPLOYED' : 'DEVELOPMENT'}`);

// Test kaspeak-SDK in current environment
console.log('\n🧪 Testing kaspeak-SDK in current environment:');

async function testKaspeakSDK() {
  try {
    const { Kaspeak } = await import('kaspeak-sdk');
    console.log('✅ kaspeak-SDK import successful');
    
    const sdk = await Promise.race([
      Kaspeak.create(1, "KMP", "testnet-10"),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000)
      )
    ]);
    
    console.log('✅ kaspeak-SDK initialization successful!');
    console.log(`Address: ${(sdk as any).address}`);
    console.log(`Public Key: ${(sdk as any).publicKey}`);
    
    return {
      success: true,
      address: (sdk as any).address,
      publicKey: (sdk as any).publicKey
    };
    
  } catch (error) {
    console.log(`❌ kaspeak-SDK failed: ${error.message}`);
    
    if (error.message.includes('fetch failed') || error.message.includes('not implemented')) {
      console.log('   This is the development environment fetch restriction');
      return { success: false, reason: 'development_fetch_restriction' };
    }
    
    return { success: false, reason: 'other_error', error: error.message };
  }
}

testKaspeakSDK().then(result => {
  console.log('\n📊 FINAL RESULT:');
  
  if (result.success) {
    console.log('🎉 SUCCESS: kaspeak-SDK is working in this environment!');
    console.log(`Master Address: ${result.address}`);
    console.log('Ready for real blockchain operations');
  } else if (result.reason === 'development_fetch_restriction') {
    console.log('⚠️  DEVELOPMENT MODE: kaspeak-SDK blocked by fetch restrictions');
    console.log('Need to properly detect and handle deployment environment');
  } else {
    console.log('❌ ERROR: kaspeak-SDK failed for other reasons');
    console.log(`Error: ${result.error}`);
  }
});