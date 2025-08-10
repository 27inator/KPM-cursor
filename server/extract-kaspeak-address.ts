// Extract address from working Kaspeak instance
import { Kaspeak, bytesToHex } from 'kaspeak-sdk';
import { createHash } from 'crypto';

async function extractKaspeakAddress() {
  console.log('🔐 EXTRACTING ADDRESS FROM KASPEAK INSTANCE');
  console.log('=' .repeat(42));
  
  const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
  
  try {
    // Generate proper private key
    const seed = createHash('sha512').update(mnemonic + 'kaspa').digest();
    const privateKeyBytes = seed.slice(0, 32);
    const privateKeyHex = bytesToHex(privateKeyBytes);
    
    console.log(`🔑 Private key: ${privateKeyHex.slice(0, 16)}...`);
    
    // Create Kaspeak instance (this worked before)
    console.log('📱 Creating Kaspeak instance...');
    
    const kaspeakInstance = Kaspeak.create({
      privateKey: privateKeyHex,
      prefix: 'KMP',
      networkId: 'testnet-10'
    });
    
    console.log('✅ Kaspeak instance created successfully');
    
    // Explore all properties and methods
    console.log('\n🔍 Exploring Kaspeak instance properties...');
    
    const properties = Object.getOwnPropertyNames(kaspeakInstance);
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(kaspeakInstance));
    
    console.log(`📋 Instance properties: ${properties.join(', ')}`);
    console.log(`📋 Instance methods: ${methods.join(', ')}`);
    
    // Check each property for address-like values
    console.log('\n🔍 Checking properties for address...');
    
    for (const prop of properties) {
      try {
        const value = kaspeakInstance[prop];
        if (typeof value === 'string' && value.includes('kaspa')) {
          console.log(`✅ Found address in ${prop}: ${value}`);
          
          if (value.startsWith('kaspatest:') && value.length >= 60) {
            return {
              success: true,
              address: value,
              property: prop,
              privateKey: privateKeyHex
            };
          }
        } else if (typeof value === 'string' && value.length > 40) {
          console.log(`📍 ${prop}: ${value.slice(0, 50)}...`);
        } else {
          console.log(`📍 ${prop}: ${typeof value} (${value})`);
        }
      } catch (e) {
        console.log(`📍 ${prop}: [Error accessing property]`);
      }
    }
    
    // Try calling methods that might return address
    console.log('\n🔍 Trying methods for address generation...');
    
    const addressMethods = methods.filter(m => 
      m.includes('address') || 
      m.includes('Address') || 
      m.includes('wallet') ||
      m.includes('public') ||
      m.includes('generate')
    );
    
    for (const method of addressMethods) {
      try {
        if (typeof kaspeakInstance[method] === 'function') {
          console.log(`🔄 Trying ${method}()...`);
          const result = kaspeakInstance[method]();
          
          if (typeof result === 'string' && result.includes('kaspatest:')) {
            console.log(`✅ ${method}() returned address: ${result}`);
            
            if (result.length >= 60) {
              return {
                success: true,
                address: result,
                method: method,
                privateKey: privateKeyHex
              };
            }
          } else if (result) {
            console.log(`   ${method}(): ${typeof result} - ${String(result).slice(0, 50)}`);
          }
        }
      } catch (e) {
        console.log(`   ${method}(): Error - ${e.message}`);
      }
    }
    
    // Try to access wallet/address information through other means
    console.log('\n🔍 Checking for wallet information...');
    
    // Check if there's a wallet property
    if (kaspeakInstance.wallet) {
      console.log('📍 Found wallet property');
      console.log(`   Wallet: ${JSON.stringify(kaspeakInstance.wallet, null, 2)}`);
    }
    
    // Check if we can derive address from the instance
    console.log('\n🔍 Attempting to derive address manually...');
    
    try {
      // If Kaspeak instance has the private key, we can derive the address
      const instanceData = JSON.stringify(kaspeakInstance);
      console.log(`📋 Instance data: ${instanceData.slice(0, 200)}...`);
      
      // Look for any address-like strings in the serialized data
      const addressRegex = /kaspatest:[a-z0-9]{40,}/g;
      const matches = instanceData.match(addressRegex);
      
      if (matches && matches.length > 0) {
        const address = matches[0];
        console.log(`✅ Found embedded address: ${address}`);
        
        return {
          success: true,
          address: address,
          method: 'extracted from instance data',
          privateKey: privateKeyHex
        };
      }
      
    } catch (e) {
      console.log(`❌ Manual derivation failed: ${e.message}`);
    }
    
    return { success: false, error: 'Could not extract address from Kaspeak instance' };
    
  } catch (error) {
    console.log(`❌ Kaspeak instance creation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute address extraction
extractKaspeakAddress()
  .then(result => {
    console.log('\n📊 KASPEAK ADDRESS EXTRACTION RESULT');
    console.log('=' .repeat(36));
    
    if (result.success) {
      console.log('🎉 SUCCESS: Found real Kaspa testnet address!');
      console.log(`   Address: ${result.address}`);
      console.log(`   Length: ${result.address.length} characters`);
      console.log(`   Source: ${result.property || result.method}`);
      console.log(`   Private key: ${result.privateKey.slice(0, 16)}...`);
      
      console.log('\n🎯 VALIDATION:');
      const isValidFormat = result.address.startsWith('kaspatest:') && result.address.length >= 60;
      console.log(`   ✅ Format valid: ${isValidFormat}`);
      
      if (isValidFormat) {
        console.log('\n🔍 Test this address on explorer:');
        console.log(`   https://explorer.kaspa.org/addresses/${result.address}?network=testnet`);
        console.log('   Should NOT blank out with proper address format');
        
        console.log('\n🚰 Request faucet funding:');
        console.log(`   Use address: ${result.address}`);
        console.log('   Then test real blockchain transactions');
      }
      
    } else {
      console.log('❌ FAILED: Could not extract valid address');
      console.log(`   Error: ${result.error}`);
      
      console.log('\n💡 Alternative approaches:');
      console.log('   - Use Kaspa official wallet software');
      console.log('   - Import different Kaspa library');
      console.log('   - Generate address using external tool');
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Address extraction crashed:', error);
    process.exit(1);
  });