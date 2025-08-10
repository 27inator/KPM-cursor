// Debug script to test Vercel deployment issues
import { Kaspeak } from 'kaspeak-sdk';

async function debugVercelDeployment() {
  console.log('🔍 DEBUGGING VERCEL DEPLOYMENT');
  console.log('===============================');
  
  console.log('1️⃣ Environment Variables Check:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'Missing'}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Present' : 'Missing'}`);
  console.log(`   MASTER_MNEMONIC: ${process.env.MASTER_MNEMONIC ? 'Present' : 'Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  
  console.log('\n2️⃣ Testing Database Connection:');
  try {
    // Test basic connection
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      console.log('   ✅ DATABASE_URL is configured');
      // Add basic connection test if needed
    } else {
      console.log('   ❌ DATABASE_URL is missing');
    }
  } catch (dbError) {
    console.log(`   ❌ Database error: ${dbError.message}`);
  }
  
  console.log('\n3️⃣ Testing kaspeak-SDK in Vercel:');
  try {
    console.log('   Attempting kaspeak-SDK initialization...');
    
    const startTime = Date.now();
    const sdk = await Promise.race([
      Kaspeak.create(1, "KMP", "testnet-10"),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SDK timeout after 30 seconds')), 30000)
      )
    ]);
    
    const endTime = Date.now();
    console.log(`   ✅ SUCCESS: kaspeak-SDK initialized in ${endTime - startTime}ms`);
    console.log(`   Address: ${(sdk as any).address}`);
    console.log(`   Public Key: ${(sdk as any).publicKey}`);
    
    return {
      success: true,
      environment: 'Vercel Production',
      initTime: endTime - startTime,
      address: (sdk as any).address,
      fetchRestrictions: false
    };
    
  } catch (sdkError) {
    console.log(`   ❌ kaspeak-SDK failed: ${sdkError.message}`);
    
    if (sdkError.message.includes('fetch failed')) {
      console.log('   Issue: fetch restrictions still exist');
      return {
        success: false,
        error: 'Fetch restrictions in Vercel',
        recommendation: 'Check Vercel Node.js version'
      };
    } else if (sdkError.message.includes('timeout')) {
      console.log('   Issue: SDK initialization timeout');
      return {
        success: false,
        error: 'SDK timeout',
        recommendation: 'Network or WASM loading issue'
      };
    } else {
      console.log(`   Issue: ${sdkError.message}`);
      return {
        success: false,
        error: sdkError.message,
        recommendation: 'Unknown SDK error'
      };
    }
  }
}

// Execute debug if running directly
if (require.main === module) {
  debugVercelDeployment().then(result => {
    console.log('\n📊 VERCEL DEPLOYMENT DEBUG RESULT');
    console.log('==================================');
    
    if (result.success) {
      console.log('🎉 kaspeak-SDK is working in Vercel!');
      console.log(`   Environment: ${result.environment}`);
      console.log(`   Init Time: ${result.initTime}ms`);
      console.log(`   Master Address: ${result.address}`);
      console.log('   ✅ Ready for real blockchain operations');
      
    } else {
      console.log('❌ kaspeak-SDK still not working');
      console.log(`   Error: ${result.error}`);
      console.log(`   Recommendation: ${result.recommendation}`);
    }
    
  }).catch(error => {
    console.error('Debug script crashed:', error);
  });
}

export { debugVercelDeployment };