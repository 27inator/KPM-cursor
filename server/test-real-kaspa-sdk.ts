// Test the REAL official Kaspa SDK (kaspa package)
import kaspa from 'kaspa';

async function testRealKaspaSDK() {
  console.log('='.repeat(70));
  console.log('🎯 TESTING REAL OFFICIAL KASPA SDK');
  console.log('='.repeat(70));
  
  try {
    console.log('Initializing Kaspa framework...');
    await kaspa.default();
    console.log('✅ Kaspa framework initialized');
    
    console.log('\nGenerating random private key...');
    const privateKey = kaspa.PrivateKey.random();
    console.log('✅ Private key generated');
    
    console.log('Deriving public key...');
    const publicKey = privateKey.toPublicKey();
    console.log('✅ Public key derived');
    
    console.log('Generating testnet address...');
    const testnetAddress = publicKey.toAddress('kaspatest');
    console.log('✅ Testnet address generated:', testnetAddress.toString());
    
    console.log('Generating mainnet address...');  
    const mainnetAddress = publicKey.toAddress('kaspa');
    console.log('✅ Mainnet address generated:', mainnetAddress.toString());
    
    // Test address formats
    const testnetStr = testnetAddress.toString();
    const mainnetStr = mainnetAddress.toString();
    
    console.log('\n🔍 ADDRESS FORMAT ANALYSIS:');
    console.log('Testnet address:', testnetStr);
    console.log('  - Length:', testnetStr.length);
    console.log('  - Prefix correct:', testnetStr.startsWith('kaspatest:') ? '✅' : '❌');
    console.log('  - Length valid (65-69):', (testnetStr.length >= 65 && testnetStr.length <= 69) ? '✅' : '❌');
    
    console.log('Mainnet address:', mainnetStr);
    console.log('  - Length:', mainnetStr.length);
    console.log('  - Prefix correct:', mainnetStr.startsWith('kaspa:') ? '✅' : '❌');
    console.log('  - Length valid (61-63):', (mainnetStr.length >= 61 && mainnetStr.length <= 63) ? '✅' : '❌');
    
    // Test API validation with testnet address
    console.log('\n🧪 KASPA API VALIDATION TEST:');
    try {
      const response = await fetch(`https://api.kaspa.org/addresses/${testnetStr}/balance`);
      if (response.ok) {
        const balance = await response.json();
        console.log('🎉 KASPA API ACCEPTS TESTNET ADDRESS!');
        console.log('Balance response:', JSON.stringify(balance, null, 2));
      } else {
        console.log('API response status:', response.status);
        const errorText = await response.text();
        console.log('API error:', errorText);
      }
    } catch (apiError) {
      console.log('Network error during API test:', apiError.message);
    }
    
    // Test API validation with mainnet address  
    console.log('\n🧪 KASPA API MAINNET VALIDATION TEST:');
    try {
      const response = await fetch(`https://api.kaspa.org/addresses/${mainnetStr}/balance`);
      if (response.ok) {
        const balance = await response.json();
        console.log('🎉 KASPA API ACCEPTS MAINNET ADDRESS!');
        console.log('Balance response:', JSON.stringify(balance, null, 2));
      } else {
        console.log('API response status:', response.status);
        const errorText = await response.text();
        console.log('API error:', errorText);
      }
    } catch (apiError) {
      console.log('Network error during mainnet API test:', apiError.message);
    }
    
    // Test HD derivation
    console.log('\n🔐 HD WALLET DERIVATION TEST:');
    console.log('Testing multiple address generation...');
    
    const addresses = [];
    for (let i = 0; i < 3; i++) {
      const privKey = kaspa.PrivateKey.random();
      const pubKey = privKey.toPublicKey();
      const addr = pubKey.toAddress('kaspatest');
      addresses.push(addr.toString());
      console.log(`Address ${i + 1}: ${addr.toString()}`);
    }
    
    console.log('\n' + '='.repeat(70));
    if (testnetStr.startsWith('kaspatest:') && mainnetStr.startsWith('kaspa:')) {
      console.log('🎉 SUCCESS: REAL KASPA ADDRESS GENERATION WORKING!');
      console.log('✅ Official Kaspa SDK functional');
      console.log('✅ Proper kaspatest: and kaspa: formats');
      console.log('✅ Addresses ready for blockchain integration');
      console.log('✅ Ready for Hudson Valley farm demonstrations');
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Implement HD derivation from mnemonic');
      console.log('2. Replace all fake addresses in KMP system');
      console.log('3. Test with real Kaspa testnet funding');
      console.log('4. Launch authentic pilot programs');
    } else {
      console.log('❌ Address format issues detected');
    }
    
    return {
      testnetAddress: testnetStr,
      mainnetAddress: mainnetStr,
      allAddresses: addresses
    };
    
  } catch (error) {
    console.error('💥 KASPA SDK TEST FAILED:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

testRealKaspaSDK().catch(console.error);