// Test different Kaspa testnet address formats to find the correct one
async function testAddressFormats() {
  console.log('🔍 TESTING KASPA TESTNET ADDRESS FORMATS');
  console.log('=' .repeat(38));
  
  // Test if we can generate a proper testnet address that works with explorer
  const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
  
  console.log('📋 Known working testnet address examples:');
  console.log('   kaspatest:qrxf48dggrxvshwlkuwdflnsgrmag0j0zves6n6zzxd8y8wv2r9et5acg8sqm');
  console.log('   kaspatest:qqeqqeqq...'); // Standard format
  
  console.log('\n🎯 Our current address:');
  console.log('   kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d');
  console.log('   Length: 50 characters (may be too short)');
  
  console.log('\n📏 Format analysis:');
  console.log('   Standard testnet: kaspatest: + 61-63 characters');
  console.log('   Our address: kaspatest: + 40 characters');
  console.log('   ❌ Our address appears to be too short');
  
  try {
    // Try to generate proper format address
    console.log('\n🔄 Attempting proper address generation...');
    
    // Check available methods
    const kaspajs = await import('kaspajs');
    
    // Generate with proper encoding
    const hdPrivateKey = kaspajs.HDPrivateKey.fromMnemonic(mnemonic);
    const masterPrivateKey = hdPrivateKey.deriveChild("m/44'/277'/0'/0/0").privateKey;
    
    // Try different address generation methods
    const methods = [
      { name: 'Standard testnet', method: () => masterPrivateKey.toAddress('testnet') },
      { name: 'Testnet with encoding', method: () => masterPrivateKey.toAddress('testnet', 'base58') },
      { name: 'Alternative testnet', method: () => masterPrivateKey.toAddress('kaspatest') }
    ];
    
    for (const { name, method } of methods) {
      try {
        const address = method().toString();
        console.log(`   ${name}: ${address} (length: ${address.length})`);
        
        // Check if this looks like a proper testnet address
        if (address.startsWith('kaspatest:') && address.length > 60) {
          console.log(`   ✅ ${name} looks correct - proper length and format`);
          
          // Test this address on explorer
          const explorerUrl = `https://explorer.kaspa.org/addresses/${address}?network=testnet`;
          console.log(`   🔍 Test on explorer: ${explorerUrl}`);
          
          return { 
            success: true, 
            correctAddress: address, 
            method: name,
            explorerUrl 
          };
        }
      } catch (error) {
        console.log(`   ❌ ${name} failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ Could not generate proper testnet address format');
    return { success: false, error: 'Address generation failed' };
    
  } catch (error) {
    console.log(`❌ Address testing failed: ${error.message}`);
    
    console.log('\n💡 MANUAL SOLUTION:');
    console.log('   1. Your current address format may be invalid');
    console.log('   2. Generate new testnet address with proper tool');
    console.log('   3. Use Kaspa wallet software to create testnet address');
    console.log('   4. Update KMP system with correct address');
    
    return { success: false, error: error.message };
  }
}

// Test and provide solution
testAddressFormats()
  .then(result => {
    console.log('\n📊 ADDRESS FORMAT TEST RESULT');
    console.log('=' .repeat(32));
    
    if (result.success) {
      console.log('✅ FOUND PROPER TESTNET ADDRESS FORMAT');
      console.log(`   Correct address: ${result.correctAddress}`);
      console.log(`   Method: ${result.method}`);
      console.log(`   Check on explorer: ${result.explorerUrl}`);
      
      console.log('\n🔧 NEXT STEPS:');
      console.log('   1. Update KMP system to use the correct address');
      console.log('   2. Request faucet funding for the correct address');
      console.log('   3. Test blockchain integration with proper address');
      
    } else {
      console.log('❌ ADDRESS FORMAT ISSUE CONFIRMED');
      console.log('   Current address format is likely invalid');
      
      console.log('\n🔧 SOLUTIONS:');
      console.log('   1. Use Kaspa official wallet to generate testnet address');
      console.log('   2. Update mnemonic or derivation method');
      console.log('   3. Verify kaspajs version and configuration');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Address format test failed:', error);
    process.exit(1);
  });