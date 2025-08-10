// Validate wallet address generation and format
async function validateWalletGeneration() {
  console.log('🔍 VALIDATING WALLET ADDRESS GENERATION');
  console.log('=' .repeat(40));
  
  const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
  console.log(`🔑 Using mnemonic: ${mnemonic}`);
  
  try {
    // Import HDPrivateKey from kaspajs (this should be the correct method)
    const kaspajs = await import('kaspajs');
    console.log('✅ Kaspajs imported successfully');
    
    // Generate HD private key from mnemonic
    const hdPrivateKey = kaspajs.HDPrivateKey.fromMnemonic(mnemonic);
    console.log('✅ HD private key generated from mnemonic');
    
    // Derive master wallet (index 0) using proper BIP44 path for Kaspa testnet
    const derivationPath = "m/44'/277'/0'/0/0";
    console.log(`📍 Derivation path: ${derivationPath}`);
    
    const masterPrivateKey = hdPrivateKey.deriveChild(derivationPath).privateKey;
    console.log('✅ Master private key derived');
    
    // Generate testnet address
    const masterAddress = masterPrivateKey.toAddress('testnet').toString();
    console.log(`📍 Generated address: ${masterAddress}`);
    
    // Check if this matches what we've been using
    const expectedAddress = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
    console.log(`🎯 Expected address: ${expectedAddress}`);
    
    if (masterAddress === expectedAddress) {
      console.log('✅ ADDRESS MATCH: Generated address matches expected');
      
      // Validate address format
      if (masterAddress.startsWith('kaspatest:') && masterAddress.length === 50) {
        console.log('✅ ADDRESS FORMAT: Correct testnet format');
        
        // Test if address is valid for explorer
        console.log('\n🔍 Testing address on explorer...');
        console.log(`Explorer URL: https://explorer.kaspa.org/addresses/${masterAddress}?network=testnet`);
        
        return { 
          valid: true, 
          address: masterAddress, 
          format: 'correct',
          explorerUrl: `https://explorer.kaspa.org/addresses/${masterAddress}?network=testnet`
        };
        
      } else {
        console.log('❌ ADDRESS FORMAT: Invalid format for testnet');
        return { valid: false, address: masterAddress, format: 'invalid' };
      }
      
    } else {
      console.log('❌ ADDRESS MISMATCH: Generated address does not match expected');
      console.log('This suggests an issue with the wallet generation process');
      
      // Generate alternative addresses with different methods
      console.log('\n🔄 Trying alternative generation methods...');
      
      // Try different derivation paths
      const altPaths = [
        "m/44'/277'/0'/0/0",  // Standard
        "m/44'/277'/0'/0'/0",  // Alternative
        "m/44'/977'/0'/0/0",   // Different coin type
      ];
      
      for (const path of altPaths) {
        try {
          const altPrivateKey = hdPrivateKey.deriveChild(path).privateKey;
          const altAddress = altPrivateKey.toAddress('testnet').toString();
          console.log(`   Path ${path}: ${altAddress}`);
          
          if (altAddress === expectedAddress) {
            console.log(`   ✅ FOUND MATCH with path: ${path}`);
            return { 
              valid: true, 
              address: altAddress, 
              format: 'correct',
              correctPath: path,
              explorerUrl: `https://explorer.kaspa.org/addresses/${altAddress}?network=testnet`
            };
          }
        } catch (error) {
          console.log(`   ❌ Path ${path} failed: ${error.message}`);
        }
      }
      
      return { 
        valid: false, 
        address: masterAddress, 
        expected: expectedAddress, 
        mismatch: true 
      };
    }
    
  } catch (error) {
    console.log(`❌ Wallet generation failed: ${error.message}`);
    
    // Try alternative approach without kaspajs
    console.log('\n🔄 Trying alternative wallet generation...');
    
    try {
      // Check if we can use kaspeak-sdk directly
      const kaspeak = await import('kaspeak-sdk');
      console.log('✅ Kaspeak SDK available');
      
      // Generate address using kaspeak
      const privateKey = kaspeak.PrivateKey.fromString('your-private-key-here'); // This would need proper implementation
      
      return { valid: false, error: 'Need proper kaspeak implementation' };
      
    } catch (kaspeakError) {
      console.log(`❌ Kaspeak approach failed: ${kaspeakError.message}`);
      return { valid: false, error: error.message };
    }
  }
}

// Validate and provide recommendations
async function runValidation() {
  const result = await validateWalletGeneration();
  
  console.log('\n📊 WALLET VALIDATION RESULT');
  console.log('=' .repeat(30));
  
  if (result.valid) {
    console.log('✅ WALLET ADDRESS IS VALID');
    console.log(`   Address: ${result.address}`);
    console.log(`   Format: ${result.format}`);
    
    if (result.correctPath) {
      console.log(`   Correct derivation path: ${result.correctPath}`);
    }
    
    console.log('\n🔍 Check wallet balance manually:');
    console.log(`   ${result.explorerUrl}`);
    
    console.log('\n💡 If explorer shows blank/empty:');
    console.log('   1. Address is valid but has never received transactions');
    console.log('   2. Faucet funding failed or is still processing');
    console.log('   3. Need to request testnet KAS from working faucet');
    
  } else {
    console.log('❌ WALLET ADDRESS ISSUE DETECTED');
    
    if (result.mismatch) {
      console.log(`   Generated: ${result.address}`);
      console.log(`   Expected: ${result.expected}`);
      console.log('   Need to fix wallet generation process');
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    console.log('\n🔧 Recommended fixes:');
    console.log('   1. Fix wallet derivation path');
    console.log('   2. Verify kaspajs installation');
    console.log('   3. Use proper testnet address generation');
  }
  
  return result;
}

runValidation()
  .then(result => {
    if (result.valid) {
      console.log('\n🎯 WALLET IS VALID - Check explorer for funding status');
    } else {
      console.log('\n⚠️ WALLET NEEDS FIXING - Address generation issue');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });