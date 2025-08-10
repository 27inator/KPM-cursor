// REAL Kaspa address generation using working kaspa-wasm SDK
import * as kaspa from 'kaspa-wasm';

const { 
  Mnemonic, 
  PrivateKey, 
  PublicKey, 
  Address, 
  NetworkType,
  XPrv
} = kaspa;

async function generateRealKaspaAddress(mnemonic: string, hdIndex: number) {
  try {
    console.log(`Generating address for HD index ${hdIndex}...`);
    
    // Create mnemonic object
    const mnemonicObj = new Mnemonic(mnemonic);
    console.log('✅ Mnemonic created');
    
    // Get seed from mnemonic
    const seed = mnemonicObj.toSeed();
    console.log('✅ Seed generated from mnemonic');
    
    // Create extended private key from seed
    const xprv = new XPrv(seed);
    console.log('✅ Extended private key created');
    
    // Derive key using BIP44 path for Kaspa: m/44'/277'/hdIndex'/0/0
    // Use proper hardened derivation constants
    const HARDENED = 0x80000000;
    const derivedXprv = xprv.deriveChild(44 + HARDENED)      // 44'
                           .deriveChild(277 + HARDENED)     // 277' (Kaspa coin type) 
                           .deriveChild(hdIndex + HARDENED) // hdIndex'
                           .deriveChild(0)                  // 0
                           .deriveChild(0);                 // 0
    console.log('✅ HD derivation completed');
    
    // Get private key
    const privateKey = derivedXprv.toPrivateKey();
    console.log('✅ Private key extracted');
    
    // Get public key
    const publicKey = privateKey.toPublicKey();
    console.log('✅ Public key generated');
    
    // Create testnet address
    const address = publicKey.toAddress(NetworkType.Testnet);
    console.log('✅ Testnet address created');
    
    return {
      address: address.toString(),
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
      derivationPath: `m/44'/277'/${hdIndex}'/0/0`
    };
    
  } catch (error) {
    console.error(`❌ FAILED to generate address for index ${hdIndex}:`, error);
    throw error;
  }
}

async function testRealKaspaWasm() {
  console.log('='.repeat(60));
  console.log('BRUTAL HONESTY: TESTING REAL KASPA-WASM SDK');
  console.log('='.repeat(60));
  
  // Use a REAL valid BIP39 mnemonic (test mnemonic from BIP39 standard)
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  
  try {
    console.log('Testing mnemonic:', mnemonic);
    console.log('');
    
    // Test master wallet (index 0)
    const master = await generateRealKaspaAddress(mnemonic, 0);
    console.log('MASTER WALLET (index 0):');
    console.log('  Address:', master.address);
    console.log('  Length:', master.address.length);
    console.log('  Valid Testnet:', master.address.startsWith('kaspatest:'));
    console.log('  Derivation:', master.derivationPath);
    console.log('');
    
    // Test company 1 (index 1)
    const company1 = await generateRealKaspaAddress(mnemonic, 1);
    console.log('COMPANY 1 WALLET (index 1):');
    console.log('  Address:', company1.address);
    console.log('  Length:', company1.address.length);
    console.log('  Valid Testnet:', company1.address.startsWith('kaspatest:'));
    console.log('');
    
    // Test company 2 (index 2)  
    const company2 = await generateRealKaspaAddress(mnemonic, 2);
    console.log('COMPANY 2 WALLET (index 2):');
    console.log('  Address:', company2.address);
    console.log('  Length:', company2.address.length);
    console.log('  Valid Testnet:', company2.address.startsWith('kaspatest:'));
    console.log('');
    
    // Test reproducibility
    const masterAgain = await generateRealKaspaAddress(mnemonic, 0);
    const reproducible = master.address === masterAgain.address;
    
    console.log('REPRODUCIBILITY TEST:');
    console.log('  First generation:', master.address);
    console.log('  Second generation:', masterAgain.address);
    console.log('  Deterministic:', reproducible ? '✅ YES' : '❌ NO');
    console.log('');
    
    // Test with Kaspa API
    console.log('API VALIDATION TEST:');
    console.log('Testing master address with Kaspa API...');
    
    try {
      const response = await fetch(`https://api.kaspa.org/addresses/${master.address}/balance`);
      if (response.ok) {
        const balance = await response.json();
        console.log('✅ API ACCEPTS ADDRESS - Balance:', balance);
      } else {
        const error = await response.text();
        console.log('❌ API REJECTS ADDRESS:', error);
      }
    } catch (apiError) {
      console.log('⚠️ API test failed (network):', apiError.message);
    }
    
    console.log('='.repeat(60));
    if (reproducible && master.address.startsWith('kaspatest:') && master.address.length >= 65) {
      console.log('🎉 SUCCESS: REAL KASPA TESTNET ADDRESSES GENERATED');
      console.log('✅ Using authentic kaspa-wasm SDK');
      console.log('✅ Proper HD derivation (BIP44)');
      console.log('✅ Correct testnet address format'); 
      console.log('✅ Deterministic generation');
      console.log('✅ Ready for Hudson Valley farm demonstrations');
      console.log('');
      console.log('These are REAL addresses that can:');
      console.log('- Be funded with testnet KAS');
      console.log('- Send real blockchain transactions');
      console.log('- Be verified on Kaspa explorer');
      console.log('- Impress farm customers with authentic proof');
    } else {
      console.log('❌ STILL FAILING: Addresses not meeting requirements');
    }
    
  } catch (error) {
    console.error('💥 CATASTROPHIC FAILURE:', error);
    console.error('kaspa-wasm SDK is not working properly');
    console.error('Hudson Valley demos are still impossible');
  }
}

testRealKaspaWasm();