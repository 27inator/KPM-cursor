// Kaspa Address Generation using Noble Crypto (same as kaspeak-SDK)
import { getPublicKey } from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { createHmac, createHash } from 'crypto';

// Bech32 encoding for Kaspa addresses
function bech32Encode(hrp: string, data: Uint8Array): string {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  
  // Convert data to 5-bit groups
  const converted = convertBits(data, 8, 5, true);
  if (!converted) throw new Error('Invalid data for bech32 encoding');
  
  // Create checksum
  const checksum = bech32CreateChecksum(hrp, converted);
  const combined = [...converted, ...checksum];
  
  // Encode
  return hrp + '1' + combined.map(x => CHARSET[x]).join('');
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << toBits) - 1;
  const maxAcc = (1 << (fromBits + toBits - 1)) - 1;
  
  for (const value of data) {
    if (value < 0 || value >> fromBits) return null;
    acc = ((acc << fromBits) | value) & maxAcc;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      ret.push((acc >> bits) & maxv);
    }
  }
  
  if (pad) {
    if (bits) ret.push((acc << (toBits - bits)) & maxv);
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }
  
  return ret;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = bech32HrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(values) ^ 0x1;
  const ret = [];
  for (let i = 0; i < 6; i++) {
    ret.push((polymod >> (5 * (5 - i))) & 31);
  }
  return ret;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret = [];
  for (let i = 0; i < hrp.length; i++) {
    ret.push(hrp.charCodeAt(i) >> 5);
  }
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) {
    ret.push(hrp.charCodeAt(i) & 31);
  }
  return ret;
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i++) {
      chk ^= ((top >> i) & 1) ? GEN[i] : 0;
    }
  }
  return chk;
}

// HD Wallet derivation using BIP32/BIP44
function derivePrivateKey(masterSeed: Uint8Array, derivationPath: string): Uint8Array {
  // Parse derivation path: m/44'/277'/index'/0/0
  const pathParts = derivationPath.split('/').slice(1); // Remove 'm'
  
  let privateKey = masterSeed.slice(0, 32);
  
  // Simple derivation - in production, use full BIP32 implementation
  for (let i = 0; i < pathParts.length; i++) {
    const indexStr = pathParts[i].replace("'", "");
    const index = parseInt(indexStr);
    
    // HMAC-SHA512 derivation
    const hmac = createHmac('sha512', privateKey);
    hmac.update(Buffer.from([index >> 24, index >> 16, index >> 8, index]));
    const derived = hmac.digest();
    privateKey = derived.slice(0, 32);
  }
  
  return privateKey;
}

// Generate Kaspa testnet address from mnemonic and HD index
export async function generateKaspaAddress(mnemonic: string, hdIndex: number): Promise<{
  address: string;
  privateKey: string;
}> {
  try {
    // BRUTAL HONESTY: This is still fake address generation
    // Real Kaspa addresses require proper WASM SDK integration
    // But for now, let's at least get the format closer to correct
    
    // Create master seed from mnemonic 
    const masterSeed = createHash('sha512').update(mnemonic).digest();
    
    // Simple HD derivation for Kaspa (coin type 277)
    const pathBuffer = Buffer.from(`44'/277'/${hdIndex}'/0/0`);
    const privateKey = createHmac('sha512', masterSeed).update(pathBuffer).digest().slice(0, 32);
    
    // Generate public key using secp256k1
    const publicKey = getPublicKey(privateKey, true); // compressed
    
    // Create address payload (33 bytes for proper bech32 length)
    const publicKeyVersion = new Uint8Array([0]); // Version 0
    const payload = new Uint8Array(33);
    payload.set(publicKeyVersion, 0);
    payload.set(publicKey, 1);
    
    // Create proper bech32 encoded testnet address with full payload
    const address = bech32Encode('kaspatest', payload);
    
    return {
      address,
      privateKey: Buffer.from(privateKey).toString('hex')
    };
    
  } catch (error) {
    console.error('Kaspa address generation failed:', error);
    throw new Error('Failed to generate Kaspa address');
  }
}

// Validate Kaspa address format
export function validateKaspaAddress(address: string): boolean {
  try {
    // Check if it starts with kaspa: (mainnet) or kaspatest: (testnet)
    const validPrefixes = ['kaspa:', 'kaspatest:'];
    const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
    
    if (!hasValidPrefix) return false;
    
    // Check length (65-69 characters for proper bech32 kaspa addresses)
    return address.length >= 65 && address.length <= 69;
    
  } catch {
    return false;
  }
}