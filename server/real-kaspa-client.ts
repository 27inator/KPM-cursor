#!/usr/bin/env tsx

import { Kaspeak } from 'kaspeak-sdk';
import { storage } from './storage.js';

// Real Kaspa client using kaspeak-SDK
class RealKaspaClient {
  private kaspeak: Kaspeak | null = null;
  private mnemonic: string;
  private network: string;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
    this.network = 'testnet';
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Initializing Kaspa client...');
      
      this.kaspeak = new Kaspeak({
        mnemonic: this.mnemonic,
      });

      console.log('✅ Kaspa client initialized successfully');
      
      // Connect to the network
      await this.kaspeak.connect();
      console.log('✅ Connected to Kaspa testnet');
      
    } catch (error) {
      console.error('❌ Failed to connect to Kaspa network:', error);
      throw error;
    }
  }

  async getAddress(index: number = 0): Promise<string> {
    if (!this.kaspeak) {
      throw new Error('Kaspeak not connected');
    }

    try {
      const address = await this.kaspeak.getAddress(index);
      return address;
    } catch (error) {
      console.error('❌ Failed to get address:', error);
      throw error;
    }
  }

  async getBalance(address?: string): Promise<number> {
    if (!this.kaspeak) {
      throw new Error('Kaspeak not connected');
    }

    try {
      const balance = await this.kaspeak.getBalance(address);
      return balance;
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      return 0;
    }
  }

  async submitTransaction(eventData: any): Promise<{ txId: string; isReal: boolean }> {
    if (!this.kaspeak) {
      throw new Error('Kaspeak not connected');
    }

    try {
      console.log('📡 Creating transaction for event:', eventData.eventId);
      
      // Create transaction with event data
      const transaction = await this.kaspeak.createTransaction({
        to: await this.getAddress(1), // Send to second address
        amount: 100000, // 0.001 KAS in sompi
        data: JSON.stringify({
          eventId: eventData.eventId,
          eventType: eventData.eventType,
          companyId: eventData.companyId,
          timestamp: Date.now(),
          merkleRoot: eventData.merkleRoot || 'default_merkle_root'
        })
      });

      console.log('✅ Transaction created');
      
      // Submit to network
      const result = await this.kaspeak.submitTransaction(transaction);
      
      console.log('✅ Transaction submitted to real Kaspa testnet');
      console.log(`📊 Transaction ID: ${result.transactionId}`);
      
      return {
        txId: result.transactionId,
        isReal: true
      };
      
    } catch (error) {
      console.error('❌ Transaction submission failed:', error);
      throw new Error(`CRITICAL: Real transaction failed: ${error.message}`);
    }
  }

  async getTransactionStatus(txId: string): Promise<any> {
    if (!this.kaspeak) {
      throw new Error('Kaspeak not connected');
    }

    try {
      const status = await this.kaspeak.getTransactionStatus(txId);
      return status;
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      return null;
    }
  }

  async getInfo(): Promise<any> {
    if (!this.kaspeak) {
      throw new Error('Kaspeak not connected');
    }

    try {
      const info = await this.kaspeak.getInfo();
      return info;
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw error;
    }
  }
}

// Test the real Kaspa client
async function testRealKaspaClient() {
  console.log('🚀 Testing Real Kaspa Client with kaspeak-SDK');
  console.log('='.repeat(60));

  try {
    const client = new RealKaspaClient(
      process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve'
    );

    // Connect to the network
    await client.connect();

    // Get address
    const address = await client.getAddress(0);
    console.log(`💰 Address: ${address}`);

    // Get balance
    const balance = await client.getBalance();
    console.log(`💰 Balance: ${balance / 100000000} KAS`);

    // Get network info
    const info = await client.getInfo();
    console.log(`📊 Network info:`, info);

    // Submit a test transaction
    const eventData = {
      eventId: 'REAL_TEST_' + Date.now(),
      eventType: 'harvest',
      companyId: 'REAL_COMPANY_TEST',
      merkleRoot: 'test_merkle_' + Date.now()
    };

    const result = await client.submitTransaction(eventData);
    console.log(`✅ Transaction result:`, result);

    // Save to database
    await storage.createEvent({
      eventId: eventData.eventId,
      eventType: eventData.eventType as any,
      companyId: eventData.companyId,
      productId: 'REAL_PRODUCT_TEST',
      stage: 'harvest',
      data: eventData,
      txid: result.txId,
      fee: 0.001,
      status: 'confirmed',
      ts: new Date()
    });

    console.log('✅ Event saved to database');

    // Verify transaction
    const status = await client.getTransactionStatus(result.txId);
    console.log(`✅ Transaction status:`, status);

    console.log('\n🎉 SUCCESS: Real Kaspa integration working!');
    console.log('🎉 Transaction broadcast to actual blockchain');
    console.log(`🔍 View on explorer: https://explorer-tn10.kaspa.org/tx/${result.txId}`);

    return true;

  } catch (error) {
    console.error('❌ Real Kaspa client test failed:', error);
    console.log('💡 This indicates the kaspeak-SDK needs proper configuration');
    return false;
  }
}

// Export the client for use in the main application
export { RealKaspaClient };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRealKaspaClient().then(success => {
    if (success) {
      console.log('\n✅ RESULT: Real Kaspa integration successful!');
    } else {
      console.log('\n❌ RESULT: Real Kaspa integration failed');
    }
    process.exit(success ? 0 : 1);
  });
}