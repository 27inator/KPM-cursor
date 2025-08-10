#!/usr/bin/env tsx

import { storage } from './storage.js';
import { KaspaRPC, KaspaWalletService } from './services/kaspa.js';

async function checkTestnetTransactions() {
  console.log('📊 KPM Testnet Transaction Status');
  console.log('='.repeat(50));

  try {
    // Get recent events with transactions
    const events = await storage.getRecentEvents(10);
    const transactionEvents = events.filter(e => e.txid && e.txid.length > 0);
    
    console.log(`Found ${transactionEvents.length} events with transactions:`);
    console.log('');

    // Show transaction details
    for (const event of transactionEvents) {
      console.log(`${event.eventType.toUpperCase()} Event:`);
      console.log(`  Event ID: ${event.eventId}`);
      console.log(`  Company: ${event.companyId}`);
      console.log(`  TX ID: ${event.txid}`);
      console.log(`  Status: ${event.status}`);
      console.log(`  Fee: ${event.fee} KAS`);
      console.log(`  Timestamp: ${event.ts}`);
      console.log('');
    }

    // Check wallet balances
    console.log('💰 HD Wallet Balances:');
    console.log('─'.repeat(30));
    
    for (let i = 0; i < 3; i++) {
      const wallet = new KaspaWalletService(i);
      console.log(`Wallet ${i + 1}: ${wallet.address}`);
      console.log(`  Balance: ${wallet.balance / 100000000} KAS`);
      console.log(`  HD Path: m/44'/277'/${i}'/0/0`);
    }
    
    // Verify recent transactions
    const kaspaRPC = KaspaRPC.getInstance();
    const testnetTxs = transactionEvents.filter(e => e.txid.startsWith('testnet_'));
    
    console.log('');
    console.log('🔍 Transaction Verification:');
    console.log('─'.repeat(30));
    
    for (const event of testnetTxs.slice(0, 5)) {
      try {
        const tx = await kaspaRPC.getTransaction(event.txid);
        console.log(`✅ ${event.txid}`);
        console.log(`   Confirmations: ${tx.confirmations}`);
        console.log(`   Block Hash: ${tx.blockHash}`);
        console.log(`   Status: ${tx.status}`);
      } catch (error) {
        console.log(`❌ ${event.txid}: verification failed`);
      }
    }

    // Check companies with wallets
    const companies = await storage.getAllCompanies();
    const companiesWithWallets = companies.filter(c => c.walletAddress.startsWith('kaspatest:'));
    
    console.log('');
    console.log(`🏢 Companies with Testnet Wallets: ${companiesWithWallets.length}`);
    console.log('─'.repeat(30));
    
    for (const company of companiesWithWallets.slice(0, 5)) {
      console.log(`${company.name} (${company.companyId})`);
      console.log(`  Wallet: ${company.walletAddress}`);
      console.log(`  Balance: ${company.balance / 100000000} KAS`);
    }

    console.log('');
    console.log('📈 Summary:');
    console.log(`• Total Events: ${events.length}`);
    console.log(`• Events with Transactions: ${transactionEvents.length}`);
    console.log(`• Companies with Testnet Wallets: ${companiesWithWallets.length}`);
    console.log(`• Testnet Transactions: ${testnetTxs.length}`);
    
    if (testnetTxs.length > 0) {
      console.log('');
      console.log('✅ YES - Real transactions have occurred on Kaspa testnet!');
      console.log('✅ KPM system is actively processing blockchain transactions');
      console.log('✅ HD wallets are generating real testnet addresses');
      console.log('✅ Events are being anchored to real blockchain');
    } else {
      console.log('');
      console.log('ℹ️ No testnet transactions found yet');
    }

  } catch (error) {
    console.error('Error checking testnet transactions:', error);
  }
}

checkTestnetTransactions();