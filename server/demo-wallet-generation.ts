#!/usr/bin/env tsx

/**
 * HD Wallet Generation Demo for KMP
 * 
 * This demonstrates how your MASTER_MNEMONIC generates unique company wallets
 */

import { KaspaWalletService } from './services/kaspa';

console.log('🔑 KMP HD Wallet Generation Demo');
console.log('================================');

const masterMnemonic = process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

console.log(`📝 Master Mnemonic: ${masterMnemonic.split(' ').slice(0, 3).join(' ')}...`);
console.log(`🌐 Network: Kaspa Testnet-10`);
console.log(`📊 BIP44 Coin Type: 277 (Kaspa)`);
console.log('');

console.log('🏢 Company Wallet Generation:');
console.log('────────────────────────────');

// Generate wallets for 5 companies
for (let i = 0; i < 5; i++) {
  const wallet = new KaspaWalletService(i);
  const derivationPath = `m/44'/277'/${i}'/0/0`;
  
  console.log(`Company ${i + 1}:`);
  console.log(`  HD Path: ${derivationPath}`);
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Balance: ${wallet.balance.toFixed(8)} KAS`);
  console.log('');
}

console.log('✅ Key Benefits:');
console.log('  • Each company gets a unique, deterministic wallet');
console.log('  • All wallets derived from single master mnemonic');
console.log('  • Addresses are reproducible and secure');
console.log('  • No need to store individual private keys');
console.log('  • Testnet addresses use kaspatest: prefix');
console.log('');

console.log('🔐 Security Features:');
console.log('  • Master mnemonic stored as environment variable');
console.log('  • HD derivation follows BIP44 standard');
console.log('  • Each company index generates unique wallet');
console.log('  • Private keys never exposed in application');
console.log('  • Testnet environment for safe testing');
console.log('');

console.log('🔗 Ready for Kaspa Testnet Integration!');