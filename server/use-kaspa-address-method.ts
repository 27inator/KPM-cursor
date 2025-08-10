// Use the Address method from @kaspa/core-lib properly
import { createHash, createHmac } from 'crypto';

async function useKaspaAddressMethod() {
  console.log('🔐 USING KASPA ADDRESS METHOD');
  console.log('=' .repeat(28));
  
  const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
  
  try {
    const kaspa = await import('@kaspa/core-lib');
    console.log('✅ @kaspa/core-lib imported');
    
    // Access the Address method
    const Address = kaspa.default.Address;
    console.log(`📍 Address method type: ${typeof Address}`);
    
    if (typeof Address === 'function') {
      console.log('🔄 Trying Address constructor...');
      
      // Generate proper private key
      const seed = createHmac('sha512', 'mnemonic').update(mnemonic).digest();
      let key = seed;
      
      // HD derivation for Kaspa
      const derivationPath = [44 + 0x80000000, 277 + 0x80000000, 0 + 0x80000000, 0, 0];
      
      for (const index of derivationPath) {
        const hmac = createHmac('sha512', key.slice(32));
        const indexBuffer = Buffer.allocUnsafe(4);
        indexBuffer.writeUInt32BE(index, 0);
        hmac.update(Buffer.concat([Buffer.from([0]), key.slice(0, 32), indexBuffer]));
        key = hmac.digest();
      }
      
      const privateKey = key.slice(0, 32);
      const publicKey = createHash('sha256').update(privateKey).digest();
      
      console.log(`🔑 Generated keys for Address constructor`);
      
      // Try different ways to use Address
      const attempts = [
        // Attempt 1: Basic constructor
        () => new Address(publicKey),
        () => new Address(publicKey.toString('hex')),
        () => new Address(privateKey),
        () => new Address(privateKey.toString('hex')),
        
        // Attempt 2: With network parameter
        () => new Address(publicKey, 'testnet'),
        () => new Address(publicKey.toString('hex'), 'testnet'),
        () => new Address(privateKey, 'testnet'),
        () => new Address(privateKey.toString('hex'), 'testnet'),
        
        // Attempt 3: With options object
        () => new Address({ publicKey: publicKey, network: 'testnet' }),
        () => new Address({ privateKey: privateKey, network: 'testnet' }),
        () => new Address({ key: publicKey, network: 'testnet' }),
        () => new Address({ data: publicKey, network: 'testnet' }),
        
        // Attempt 4: Static methods
        () => Address.fromPublicKey ? Address.fromPublicKey(publicKey, 'testnet') : null,
        () => Address.fromPrivateKey ? Address.fromPrivateKey(privateKey, 'testnet') : null,
        () => Address.create ? Address.create(publicKey, 'testnet') : null,
        () => Address.generate ? Address.generate(publicKey, 'testnet') : null,
      ];
      
      for (let i = 0; i < attempts.length; i++) {
        try {
          const result = attempts[i]();
          
          if (result) {
            console.log(`✅ Attempt ${i+1} successful`);
            
            // Check if result is a string
            if (typeof result === 'string') {
              console.log(`   Direct string: ${result}`);
              
              if (result.startsWith('kaspatest:') && result.length >= 60) {
                return {
                  success: true,
                  address: result,
                  method: `Address constructor attempt ${i+1}`,
                  privateKey: privateKey.toString('hex')
                };
              }
            }
            
            // Check if result has toString method
            if (result.toString && typeof result.toString === 'function') {
              const addressString = result.toString();
              console.log(`   toString(): ${addressString}`);
              
              if (addressString.startsWith('kaspatest:') && addressString.length >= 60) {
                return {
                  success: true,
                  address: addressString,
                  method: `Address.toString() attempt ${i+1}`,
                  privateKey: privateKey.toString('hex')
                };
              }
            }
            
            // Check all properties
            if (typeof result === 'object') {
              for (const [key, value] of Object.entries(result)) {
                if (typeof value === 'string' && value.startsWith('kaspatest:') && value.length >= 60) {
                  console.log(`   Found in ${key}: ${value}`);
                  return {
                    success: true,
                    address: value,
                    method: `Address.${key} attempt ${i+1}`,
                    privateKey: privateKey.toString('hex')
                  };
                }
              }
              
              console.log(`   Object properties: ${Object.keys(result).join(', ')}`);
            }
          }
          
        } catch (attemptError) {
          // Silent continue to next attempt
        }
      }
      
      console.log('❌ All Address constructor attempts failed');
    }
    
    // Try accessing static methods or properties directly
    console.log('\n🔍 Exploring Address object structure...');
    
    if (Address) {
      const properties = Object.getOwnPropertyNames(Address);
      const methods = properties.filter(p => typeof Address[p] === 'function');
      
      console.log(`📋 Static methods: ${methods.join(', ')}`);
      
      // Try static methods
      for (const method of methods) {
        if (method.toLowerCase().includes('create') || 
            method.toLowerCase().includes('generate') ||
            method.toLowerCase().includes('from')) {
          
          try {
            console.log(`🔄 Trying Address.${method}...`);
            
            const seed = createHmac('sha512', 'kaspa').update(mnemonic).digest();
            const attempts = [
              () => Address[method](seed),
              () => Address[method](seed.toString('hex')),
              () => Address[method](mnemonic),
              () => Address[method]({ mnemonic, network: 'testnet' }),
              () => Address[method](seed, 'testnet'),
            ];
            
            for (const attempt of attempts) {
              try {
                const result = attempt();
                
                if (result) {
                  const addressStr = typeof result === 'string' ? result : result.toString();
                  console.log(`   ${method}: ${addressStr}`);
                  
                  if (addressStr.startsWith('kaspatest:') && addressStr.length >= 60) {
                    return {
                      success: true,
                      address: addressStr,
                      method: `Address.${method}`,
                      privateKey: seed.toString('hex')
                    };
                  }
                }
              } catch (e) {
                // Continue
              }
            }
            
          } catch (methodError) {
            console.log(`   ${method}: ${methodError.message}`);
          }
        }
      }
    }
    
    return { success: false, error: 'Could not generate address with kaspa core lib' };
    
  } catch (error) {
    console.log(`❌ Import failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute the method
useKaspaAddressMethod()
  .then(result => {
    console.log('\n📊 KASPA ADDRESS METHOD RESULT');
    console.log('=' .repeat(30));
    
    if (result.success) {
      console.log('🎉 SUCCESS!');
      console.log(`   Method: ${result.method}`);
      console.log(`   Address: ${result.address}`);
      console.log(`   Length: ${result.address.length} characters`);
      
      const valid = result.address.startsWith('kaspatest:') && result.address.length >= 60;
      console.log(`   Valid format: ${valid}`);
      
      if (valid) {
        console.log('\n🌐 Explorer test:');
        console.log(`   https://explorer.kaspa.org/addresses/${result.address}?network=testnet`);
        console.log('   This should NOT blank out with proper address');
        
        console.log('\n🚰 Ready for faucet funding');
        console.log('   Request testnet KAS for this address');
      }
      
    } else {
      console.log('❌ Failed to generate proper address');
      console.log(`   Error: ${result.error}`);
    }
    
    process.exit(result.success ? 0 : 1);
  });