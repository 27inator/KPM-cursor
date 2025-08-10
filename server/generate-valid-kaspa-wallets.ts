// Generate valid Kaspa wallets using the same crypto libraries as kaspeak-SDK
import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';

// Kaspa address encoding (bech32-like)
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function polymod(values: number[]): number {
  const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = (chk & 0x1ffffff) << 5 ^ value;
    for (let i = 0; i < 5; i++) {
      chk ^= ((top >> i) & 1) ? GENERATOR[i] : 0;
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const ret = [];
  for (let p = 0; p < hrp.length; p++) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (let p = 0; p < hrp.length; p++) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return ret;
}

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const ret = [];
  for (let p = 0; p < 6; p++) {
    ret.push((mod >> 5 * (5 - p)) & 31);
  }
  return ret;
}

function bech32Encode(hrp: string, data: number[]): string {
  const combined = data.concat(createChecksum(hrp, data));
  let ret = hrp + '1';
  for (const d of combined) {
    ret += CHARSET.charAt(d);
  }
  return ret;
}

function convertBits(data: number[], fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;
  
  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) {
      return null;
    }
    acc = ((acc << fromBits) | value) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv) !== 0) {
    return null;
  }
  
  return ret;
}

function generateKaspaAddress(privateKeyBytes: Uint8Array): string {
  // Generate public key using secp256k1
  const publicKey = secp256k1.getPublicKey(privateKeyBytes, true); // compressed
  
  // Create Kaspa address hash
  const publicKeyHash = sha256(publicKey);
  const addressHash = ripemd160(publicKeyHash);
  
  // Kaspa testnet version byte
  const version = 0;
  const versionedHash = new Uint8Array([version, ...addressHash]);
  
  // Convert to 5-bit groups for bech32
  const fiveBitData = convertBits(Array.from(versionedHash), 8, 5, true);
  if (!fiveBitData) {
    throw new Error('Failed to convert address to 5-bit groups');
  }
  
  // Encode as bech32 with kaspatest prefix
  return bech32Encode('kaspatest', fiveBitData);
}

async function generateValidKaspaWallets() {
  console.log('🔐 GENERATING VALID KASPA WALLETS');
  console.log('Using same crypto libraries as kaspeak-SDK');
  console.log('=' .repeat(40));
  
  try {
    const wallets = [];
    
    // Generate deterministic private keys from our mnemonic
    const mnemonic = 'one two three four five six seven eight nine ten eleven twelve';
    const seed = sha256(new TextEncoder().encode(mnemonic));
    
    for (let i = 0; i < 4; i++) {
      console.log(`\n🔑 Generating wallet ${i}...`);
      
      // Create deterministic private key
      const indexBuffer = new Uint8Array(4);
      new DataView(indexBuffer.buffer).setUint32(0, i, false);
      const privateKeyBytes = sha256(new Uint8Array([...seed, ...indexBuffer]));
      
      // Generate Kaspa address
      const address = generateKaspaAddress(privateKeyBytes);
      const privateKeyHex = Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      console.log(`✅ Address: ${address}`);
      console.log(`   Private key: ${privateKeyHex.slice(0, 16)}...`);
      console.log(`   Length: ${address.length} characters`);
      
      wallets.push({
        index: i,
        type: i === 0 ? 'Master' : `Company ${i}`,
        address: address,
        privateKey: privateKeyHex,
        derivationMethod: 'Noble crypto libraries (same as kaspeak-SDK)'
      });
    }
    
    console.log('\n📋 Validation Results:');
    
    let allValid = true;
    for (const wallet of wallets) {
      const isTestnet = wallet.address.startsWith('kaspatest:');
      const hasValidLength = wallet.address.length >= 42; // Minimum bech32 length
      const isUnique = wallets.filter(w => w.address === wallet.address).length === 1;
      
      const valid = isTestnet && hasValidLength && isUnique;
      console.log(`${valid ? '✅' : '❌'} ${wallet.type}: ${wallet.address}`);
      
      if (!valid) allValid = false;
    }
    
    if (allValid) {
      console.log('\n🎉 SUCCESS: All wallets are valid!');
      console.log('\n📊 Final Wallets:');
      wallets.forEach(w => console.log(`   ${w.type}: ${w.address}`));
      
      console.log(`\n🔍 Test master wallet: ${wallets[0].address}`);
      console.log(`   Explorer: https://explorer.kaspa.org/addresses/${wallets[0].address}?network=testnet`);
      
      return {
        success: true,
        wallets: wallets,
        masterWallet: wallets[0].address,
        companyWallets: wallets.slice(1).map(w => w.address)
      };
    } else {
      return { success: false, error: 'Validation failed' };
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute
generateValidKaspaWallets().then(result => {
  if (result.success) {
    console.log('\n✅ WALLET GENERATION SUCCESSFUL');
    console.log(`Master: ${result.masterWallet}`);
    result.companyWallets.forEach((addr, i) => {
      console.log(`Company ${i + 1}: ${addr}`);
    });
  } else {
    console.log(`\n❌ FAILED: ${result.error}`);
    process.exit(1);
  }
});