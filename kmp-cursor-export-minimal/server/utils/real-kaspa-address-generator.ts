// REAL Kaspa address generation using official Kaspa SDK
import kaspa from 'kaspa';

const {
  PrivateKey,
  PublicKey,
  createAddress,
  NetworkType,
  Mnemonic
} = kaspa;

// Initialize console panic hook for proper error reporting
kaspa.initConsolePanicHook();

export async function generateRealKaspaAddress(mnemonic: string, hdIndex: number): Promise<{
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath: string;
}> {
  try {
    // Create mnemonic instance
    const mnemonicInstance = new Mnemonic(mnemonic);
    
    // Generate seed from mnemonic
    const seed = mnemonicInstance.toSeed();
    
    // Create HD wallet master key
    const masterKey = PrivateKey.fromSeed(seed);
    
    // Derive key using BIP44 path: m/44'/277'/hdIndex'/0/0
    const derivationPath = `m/44'/277'/${hdIndex}'/0/0`;
    const derivedKey = masterKey.deriveChild(derivationPath);
    
    // Get public key
    const publicKey = derivedKey.toPublicKey();
    
    // Create testnet address
    const address = createAddress(publicKey, NetworkType.Testnet);
    
    return {
      address: address.toString(),
      privateKey: derivedKey.toString(),
      publicKey: publicKey.toString(),
      derivationPath
    };
    
  } catch (error) {
    console.error('REAL Kaspa address generation failed:', error);
    throw new Error(`REAL Kaspa SDK failed: ${error.message}`);
  }
}

// Test function for verification
export async function testRealKaspaAddresses() {
  console.log('='.repeat(60));
  console.log('TESTING REAL KASPA SDK ADDRESS GENERATION');
  console.log('='.repeat(60));
  
  const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
  
  try {
    const master = await generateRealKaspaAddress(mnemonic, 0);
    const company1 = await generateRealKaspaAddress(mnemonic, 1);
    const company2 = await generateRealKaspaAddress(mnemonic, 2);
    
    console.log('MASTER WALLET:');
    console.log('  Address:', master.address);
    console.log('  Length:', master.address.length);
    console.log('  Valid Format:', master.address.startsWith('kaspatest:'));
    console.log('  Derivation:', master.derivationPath);
    console.log('');
    
    console.log('COMPANY 1 WALLET:');
    console.log('  Address:', company1.address);
    console.log('  Length:', company1.address.length);
    console.log('  Valid Format:', company1.address.startsWith('kaspatest:'));
    console.log('');
    
    console.log('COMPANY 2 WALLET:');
    console.log('  Address:', company2.address);
    console.log('  Length:', company2.address.length);
    console.log('  Valid Format:', company2.address.startsWith('kaspatest:'));
    console.log('');
    
    // Test API validation
    console.log('TESTING API VALIDATION:');
    const response = await fetch(`https://api.kaspa.org/addresses/${master.address}/balance`);
    if (response.ok) {
      console.log('✅ MASTER ADDRESS VALIDATED BY KASPA API');
    } else {
      console.log('❌ API rejection:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ REAL KASPA SDK FAILED:', error.message);
    console.error('This means we cannot generate authentic addresses for Hudson Valley demos');
  }
}