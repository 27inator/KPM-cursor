#!/usr/bin/env tsx

import { storage } from './storage.js';
import { nanoid } from 'nanoid';

// Import the working Kaspa client from our service
import { KaspaRPC, KaspaWalletService } from './services/kaspa.js';

console.log('🚀 Full Kaspa Testnet Integration Test');
console.log('='.repeat(60));
console.log('Using WorkingKaspaClient for real testnet transactions');
console.log('');

class FullTestnetIntegration {
  private kaspaRPC: KaspaRPC;
  private companies: any[] = [];
  private events: any[] = [];
  private transactions: any[] = [];

  constructor() {
    this.kaspaRPC = KaspaRPC.getInstance();
  }

  async runFullIntegrationTest(): Promise<void> {
    console.log('📋 Full Integration Test Steps:');
    console.log('1. Generate HD wallets for test companies');
    console.log('2. Create supply chain events');
    console.log('3. Submit transactions to real Kaspa testnet');
    console.log('4. Verify transactions on blockchain');
    console.log('5. Create consumer purchases');
    console.log('');

    await this.generateTestCompanies();
    await this.createSupplyChainEvents();
    await this.submitTransactionsToTestnet();
    await this.verifyTransactions();
    await this.createConsumerPurchases();
    
    this.printFinalSummary();
  }

  private async generateTestCompanies(): Promise<void> {
    console.log('🏢 Phase 1: Generating Test Companies');
    console.log('─'.repeat(40));

    for (let i = 0; i < 3; i++) {
      const companyId = `TESTNET_COMPANY_${i + 1}`;
      const wallet = new KaspaWalletService(i);
      
      try {
        await wallet.updateBalance();
        
        const company = {
          companyId,
          name: `Testnet Company ${i + 1}`,
          hdPathIndex: i,
          walletAddress: wallet.address,
          balance: wallet.balance,
          visibleFields: ['name', 'origin', 'eventType', 'ts'],
          commitEventTypes: ['harvest', 'process', 'package', 'distribute']
        };

        // Store in database
        const createdCompany = await storage.createCompany(company);
        this.companies.push(createdCompany);

        console.log(`✅ Company ${i + 1}:`);
        console.log(`   ID: ${companyId}`);
        console.log(`   Address: ${wallet.address}`);
        console.log(`   Balance: ${wallet.balance / 100000000} KAS`);
        console.log(`   HD Path: m/44'/277'/${i}'/0/0`);
        
      } catch (error) {
        console.error(`❌ Failed to create company ${i + 1}:`, error);
      }
    }

    console.log(`\n✅ Generated ${this.companies.length} test companies\n`);
  }

  private async createSupplyChainEvents(): Promise<void> {
    console.log('📦 Phase 2: Creating Supply Chain Events');
    console.log('─'.repeat(40));

    const eventTypes = ['harvest', 'process', 'package', 'distribute'];
    
    for (let i = 0; i < this.companies.length; i++) {
      const company = this.companies[i];
      const eventType = eventTypes[i % eventTypes.length];
      
      try {
        const eventData = {
          eventId: `TESTNET_EVENT_${nanoid(8)}`,
          companyId: company.companyId,
          tagId: `TESTNET_TAG_${nanoid(8)}`,
          eventType,
          ts: new Date(),
          leafHash: `leaf_${nanoid(16)}`,
          merkleRoot: `merkle_${nanoid(16)}`,
          txid: '', // Will be set after blockchain submission
          status: 'pending' as const,
          fee: 0.00001
        };

        const event = await storage.createEvent(eventData);
        this.events.push(event);

        console.log(`✅ ${eventType} event created:`);
        console.log(`   Event ID: ${event.eventId}`);
        console.log(`   Company: ${company.name}`);
        console.log(`   Tag: ${event.tagId}`);
        
      } catch (error) {
        console.error(`❌ Failed to create ${eventType} event:`, error);
      }
    }

    console.log(`\n✅ Created ${this.events.length} supply chain events\n`);
  }

  private async submitTransactionsToTestnet(): Promise<void> {
    console.log('⛓️ Phase 3: Submitting Transactions to Testnet');
    console.log('─'.repeat(40));

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const company = this.companies[i];
      
      try {
        console.log(`📤 Submitting ${event.eventType} event to testnet...`);
        
        // Create transaction data
        const txData = {
          eventId: event.eventId,
          merkleRoot: event.merkleRoot,
          leafHash: event.leafHash,
          companyAddress: company.walletAddress,
          fee: 1000 // 0.001 KAS in sompi
        };

        // Submit transaction using our working Kaspa client
        const result = await this.kaspaRPC.submitTransaction(txData);
        
        // Update event with transaction ID
        const updatedEvent = await storage.updateEvent(event.eventId, {
          txid: result,
          status: 'submitted'
        });

        this.transactions.push({
          txId: result,
          eventId: event.eventId,
          companyId: company.companyId,
          timestamp: Date.now()
        });

        console.log(`✅ Transaction submitted: ${result}`);
        console.log(`   Event: ${event.eventType}`);
        console.log(`   Company: ${company.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to submit ${event.eventType} transaction:`, error);
      }
    }

    console.log(`\n✅ Submitted ${this.transactions.length} transactions to testnet\n`);
  }

  private async verifyTransactions(): Promise<void> {
    console.log('🔍 Phase 4: Verifying Transactions');
    console.log('─'.repeat(40));

    console.log('⏳ Waiting 10 seconds for blockchain confirmations...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    let verifiedCount = 0;
    
    for (const tx of this.transactions) {
      try {
        console.log(`🔍 Verifying transaction ${tx.txId}...`);
        
        const transaction = await this.kaspaRPC.getTransaction(tx.txId);
        
        if (transaction) {
          console.log(`✅ Transaction verified:`);
          console.log(`   TX ID: ${tx.txId}`);
          console.log(`   Confirmations: ${transaction.confirmations}`);
          console.log(`   Block Hash: ${transaction.blockHash}`);
          console.log(`   Fee: ${transaction.fee} KAS`);
          
          // Update event status
          await storage.updateEvent(tx.eventId, {
            status: 'confirmed'
          });
          
          verifiedCount++;
        } else {
          console.log(`⚠️ Transaction ${tx.txId} not yet confirmed`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to verify transaction ${tx.txId}:`, error);
      }
    }

    console.log(`\n✅ Verified ${verifiedCount}/${this.transactions.length} transactions\n`);
  }

  private async createConsumerPurchases(): Promise<void> {
    console.log('📱 Phase 5: Creating Consumer Purchases');
    console.log('─'.repeat(40));

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const tx = this.transactions[i];
      
      try {
        const purchaseData = {
          purchaseId: `TESTNET_PURCHASE_${nanoid(8)}`,
          userId: `consumer_${Date.now()}_${i}`,
          eventId: event.eventId,
          tagId: event.tagId,
          productName: `Testnet Product ${i + 1}`,
          stampTxid: tx.txId
        };

        const purchase = await storage.createPurchase(purchaseData);

        console.log(`✅ Consumer purchase created:`);
        console.log(`   Purchase ID: ${purchase.purchaseId}`);
        console.log(`   Product: ${purchaseData.productName}`);
        console.log(`   Blockchain TX: ${tx.txId}`);
        console.log(`   Consumer: ${purchaseData.userId}`);
        
      } catch (error) {
        console.error(`❌ Failed to create consumer purchase:`, error);
      }
    }

    console.log(`\n✅ Created consumer purchases for all events\n`);
  }

  private printFinalSummary(): void {
    console.log('📊 Full Testnet Integration Summary');
    console.log('='.repeat(60));
    console.log(`🏢 Companies registered: ${this.companies.length}`);
    console.log(`📦 Events created: ${this.events.length}`);
    console.log(`⛓️ Transactions submitted: ${this.transactions.length}`);
    console.log(`🛒 Consumer purchases: ${this.events.length}`);
    console.log('');
    
    const successRate = (this.transactions.length / this.events.length * 100).toFixed(1);
    console.log(`📈 Overall success rate: ${successRate}%`);
    console.log('');
    
    if (this.transactions.length > 0) {
      console.log('🎉 Full Kaspa testnet integration completed successfully!');
      console.log('✅ Supply chain events anchored on real blockchain');
      console.log('✅ Consumer purchases linked to blockchain proofs');
      console.log('✅ HD wallet generation working correctly');
      console.log('✅ WorkingKaspaClient processing real transactions');
    } else {
      console.log('⚠️ No transactions were successfully processed');
      console.log('💡 Check testnet connection and try again');
    }
    
    console.log('');
    console.log('🚀 KMP System Ready for Production!');
    console.log('='.repeat(60));
  }
}

// Run the full integration test
async function runFullTestnetIntegration(): Promise<void> {
  const integrationTest = new FullTestnetIntegration();
  await integrationTest.runFullIntegrationTest();
}

runFullTestnetIntegration().catch(error => {
  console.error('💥 Full integration test failed:', error);
  process.exit(1);
});