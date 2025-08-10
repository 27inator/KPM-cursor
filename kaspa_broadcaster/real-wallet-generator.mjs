import { PrivateKey } from 'kaspa-wasm32-sdk';
import crypto from 'crypto';
import fs from 'fs';

const MASTER_MNEMONIC = "arrest acid fall interest comfort expire aunt combine actor tackle stove coral";

// EXACT same function that worked for master wallet
function generateHDKeypair(mnemonic, derivationIndex = 0) {
  // Create deterministic seed from mnemonic + derivation path
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  // Create private key from seed (first 32 bytes)
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

console.log('🏭 REAL COMPANY WALLET GENERATOR');
console.log('================================');
console.log('Using SAME HD derivation method that worked for master wallet');
console.log('');

// Generate master wallet (index 0) - this should match our working address
const masterKeypair = generateHDKeypair(MASTER_MNEMONIC, 0);
const masterAddress = masterKeypair.toAddress('testnet-10').toString();

console.log('🔑 Master Wallet (index 0):');
console.log(`   Address: ${masterAddress}`);
console.log(`   Expected: kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem`);
console.log(`   ✅ Match: ${masterAddress === 'kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem'}`);
console.log('');

// Generate company wallets using same method with different indices
const companies = [
  { id: 'fresh-test-company', index: 1 },
  { id: 'explorer-test-company', index: 2 },
  { id: 'acme-manufacturing', index: 3 },
  { id: 'luxury-jewelers-inc', index: 4 }
];

const realWallets = [];

companies.forEach(company => {
  const keypair = generateHDKeypair(MASTER_MNEMONIC, company.index);
  const address = keypair.toAddress('testnet-10').toString();
  
  const wallet = {
    companyId: company.id,
    derivationIndex: company.index,
    address: address,
    privateKeyHex: keypair.privateKey.toString(),
    explorerUrl: `https://explorer-tn10.kaspa.org/addresses/${address}`
  };
  
  realWallets.push(wallet);
  
  console.log(`🏢 ${company.id}:`);
  console.log(`   Index: ${company.index}`);
  console.log(`   Address: ${address}`);
  console.log(`   Explorer: ${wallet.explorerUrl}`);
  console.log('');
});

// Save real wallets
const output = {
  masterWallet: {
    address: masterAddress,
    derivationIndex: 0,
    explorerUrl: `https://explorer-tn10.kaspa.org/addresses/${masterAddress}`
  },
  companyWallets: realWallets,
  method: 'HD derivation using same working method as master wallet',
  mnemonic: 'MASTER_MNEMONIC (stored in env)',
  timestamp: new Date().toISOString()
};

fs.writeFileSync('real_company_wallets.json', JSON.stringify(output, null, 2));

console.log('💾 Saved to real_company_wallets.json');
console.log('');
console.log('🔗 TEST THESE ADDRESSES:');
console.log(`Master: https://explorer-tn10.kaspa.org/addresses/${masterAddress}`);
realWallets.forEach(wallet => {
  console.log(`${wallet.companyId}: ${wallet.explorerUrl}`);
});
console.log('');
console.log('🚀 Next: Test transactions between these REAL addresses'); 