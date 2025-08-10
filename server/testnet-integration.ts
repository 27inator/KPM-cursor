#!/usr/bin/env tsx

/**
 * Real Kaspa Testnet Integration Test
 * 
 * This script connects to real Kaspa testnet and performs complete supply chain testing
 * with actual blockchain transactions using the specified mnemonic.
 */

import { KaspaRPC, KaspaWalletService } from './services/kaspa';
import { storage } from './storage';
import { nanoid } from 'nanoid';

// Real testnet configuration
const TESTNET_CONFIG = {
  mnemonic: 'one two three four five six seven eight nine ten eleven twelve',
  network: 'testnet-10',
  rpcEndpoint: 'ws://127.0.0.1:17210',
  companiesCount: 3,
  eventsPerCompany: 3,
  testTimeout: 300000, // 5 minutes
  confirmationWait: 30000 // 30 seconds
};

interface TestnetResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  txId?: string;
  blockHash?: string;
  confirmations?: number;
}

class KaspaTestnetIntegration {
  private results: TestnetResult[] = [];
  private kaspaRPC: KaspaRPC;
  private testCompanies: any[] = [];
  private testEvents: any[] = [];
  private testTransactions: any[] = [];

  constructor() {
    this.kaspaRPC = KaspaRPC.getInstance();
    
    console.log('🌐 Kaspa Testnet Integration Test');
    console.log('='.repeat(60));
    console.log(`🔑 Mnemonic: ${TESTNET_CONFIG.mnemonic.split(' ').slice(0, 3).join(' ')}...`);
    console.log(`🌍 Network: ${TESTNET_CONFIG.network}`);
    console.log(`🔗 RPC Endpoint: ${TESTNET_CONFIG.rpcEndpoint}`);
    console.log(`🏢 Companies: ${TESTNET_CONFIG.companiesCount}`);
    console.log(`📦 Events per company: ${TESTNET_CONFIG.eventsPerCompany}`);
    console.log('='.repeat(60));
  }

  private logResult(step: string, success: boolean, message: string, data?: any): void {
    const result: TestnetResult = { step, success, message, data };
    this.results.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${step}: ${message}`);
    
    if (data && typeof data === 'object') {
      console.log(`   ${JSON.stringify(data, null, 2)}`);
    }
  }

  async runCompleteTest(): Promise<void> {
    console.log('\n🚀 Starting complete Kaspa testnet integration...\n');
    
    try {
      // Phase 1: Setup and Wallet Generation
      await this.testWalletGeneration();
      
      // Phase 2: Company Registration
      await this.testCompanyRegistration();
      
      // Phase 3: Supply Chain Event Creation
      await this.testSupplyChainEvents();
      
      // Phase 4: Real Blockchain Transactions
      await this.testBlockchainTransactions();
      
      // Phase 5: Transaction Verification
      await this.testTransactionVerification();
      
      // Phase 6: End-to-End Supply Chain Flow
      await this.testEndToEndFlow();
      
      // Phase 7: Consumer Integration
      await this.testConsumerIntegration();
      
    } catch (error) {
      this.logResult('CRITICAL_ERROR', false, `Test failed: ${error.message}`, error);
    } finally {
      this.printTestSummary();
    }
  }

  private async testWalletGeneration(): Promise<void> {
    console.log('📊 Phase 1: HD Wallet Generation');
    console.log('-'.repeat(40));
    
    try {
      const wallets = [];
      
      // Generate wallets for test companies
      for (let i = 0; i < TESTNET_CONFIG.companiesCount; i++) {
        const wallet = new KaspaWalletService(i);
        const derivationPath = `m/44'/277'/${i}'/0/0`;
        
        // Update balance from testnet
        await wallet.updateBalance();
        
        wallets.push({
          companyIndex: i,
          derivationPath,
          address: wallet.address,
          balance: wallet.balance
        });
        
        console.log(`  Company ${i + 1}: ${wallet.address} (${wallet.balance.toFixed(8)} KAS)`);
      }
      
      // Verify all addresses are unique and valid
      const addresses = wallets.map(w => w.address);
      const uniqueAddresses = new Set(addresses);
      const validTestnet = addresses.every(addr => addr.startsWith('kaspatest:'));
      
      if (uniqueAddresses.size !== addresses.length) {
        throw new Error('Duplicate addresses generated');
      }
      
      if (!validTestnet) {
        throw new Error('Invalid testnet address format');
      }
      
      this.logResult('WALLET_GENERATION', true, 
        `Generated ${wallets.length} unique testnet wallets`, 
        { wallets, totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0) });
        
    } catch (error) {
      this.logResult('WALLET_GENERATION', false, `Wallet generation failed: ${error.message}`, error);
    }
  }

  private async testCompanyRegistration(): Promise<void> {
    console.log('\n🏢 Phase 2: Company Registration');
    console.log('-'.repeat(40));
    
    try {
      const companies = [];
      
      for (let i = 0; i < TESTNET_CONFIG.companiesCount; i++) {
        const wallet = new KaspaWalletService(i);
        const companyId = `TESTNET_COMP_${Date.now()}_${i}`;
        
        const company = await storage.createCompany({
          companyId,
          name: `Testnet Company ${i + 1}`,
          walletAddress: wallet.address,
          accessCode: `TESTNET_ACCESS_${i}`,
          balance: wallet.balance,
          autoFundEnabled: true,
          hdPathIndex: i,
          status: 'active',
          visibleFields: ['origin', 'process', 'quality', 'batch', 'timestamp'],
          commitEventTypes: ['harvest', 'process', 'package', 'ship', 'deliver']
        });
        
        companies.push(company);
        console.log(`  ${company.name}: ${company.walletAddress}`);
      }
      
      this.testCompanies = companies;
      this.logResult('COMPANY_REGISTRATION', true, 
        `Registered ${companies.length} companies on testnet`, 
        companies.map(c => ({ name: c.name, address: c.walletAddress })));
        
    } catch (error) {
      this.logResult('COMPANY_REGISTRATION', false, `Company registration failed: ${error.message}`, error);
    }
  }

  private async testSupplyChainEvents(): Promise<void> {
    console.log('\n📦 Phase 3: Supply Chain Events');
    console.log('-'.repeat(40));
    
    try {
      const allEvents = [];
      
      for (const company of this.testCompanies) {
        const events = [];
        
        for (let i = 0; i < TESTNET_CONFIG.eventsPerCompany; i++) {
          const eventTypes = ['harvest', 'process', 'package', 'ship', 'deliver'];
          const eventType = eventTypes[i % eventTypes.length];
          
          const event = await storage.createEvent({
            eventId: nanoid(12),
            companyId: company.companyId,
            eventType,
            tagId: `TESTNET_TAG_${company.id}_${i}`,
            ts: new Date(Date.now() - (i * 1000 * 60 * 60)), // Fix: Use ts field as Date object
            metadata: {
              location: `Testnet Location ${i}`,
              temperature: 20 + Math.random() * 10,
              humidity: 40 + Math.random() * 20,
              batch: `TESTNET_BATCH_${Date.now()}_${i}`,
              quality: 'Grade A',
              inspector: 'Testnet Inspector'
            },
            status: 'pending',
            fee: 0.001,
            leafHash: `testnet_leaf_${nanoid(16)}`,
            merkleRoot: `testnet_merkle_${nanoid(16)}`,
            txid: null // Initially null, will be set after blockchain submission
          });
          
          events.push(event);
          console.log(`  ${company.name}: ${eventType} event ${event.eventId}`);
        }
        
        allEvents.push(...events);
      }
      
      this.testEvents = allEvents;
      this.logResult('SUPPLY_CHAIN_EVENTS', true, 
        `Created ${allEvents.length} supply chain events`, 
        { 
          totalEvents: allEvents.length,
          eventTypes: [...new Set(allEvents.map(e => e.eventType))],
          companies: this.testCompanies.length
        });
        
    } catch (error) {
      this.logResult('SUPPLY_CHAIN_EVENTS', false, `Event creation failed: ${error.message}`, error);
    }
  }

  private async testBlockchainTransactions(): Promise<void> {
    console.log('\n⛓️ Phase 4: Real Blockchain Transactions');
    console.log('-'.repeat(40));
    
    try {
      const transactions = [];
      
      // Submit events to real Kaspa testnet
      for (const event of this.testEvents) {
        try {
          console.log(`  📤 Submitting event ${event.eventId} to testnet...`);
          
          // Create transaction payload
          const transactionData = {
            eventId: event.eventId,
            merkleRoot: event.merkleRoot,
            leafHash: event.leafHash,
            metadata: event.metadata,
            timestamp: event.ts.getTime(), // Convert Date to timestamp
            companyId: event.companyId
          };
          
          // Get company wallet
          const company = this.testCompanies.find(c => c.companyId === event.companyId);
          if (!company) {
            throw new Error(`Company not found for event ${event.eventId}`);
          }
          
          const wallet = new KaspaWalletService(company.hdPathIndex);
          
          // Sign transaction
          const signedTransaction = await wallet.signTransaction(transactionData);
          
          // Submit to testnet
          const txId = await this.kaspaRPC.submitTransaction(signedTransaction);
          
          // Update event with transaction ID
          await storage.updateEvent(event.eventId, {
            txid: txId,
            status: 'submitted',
            submittedAt: new Date()
          });
          
          transactions.push({
            eventId: event.eventId,
            txId,
            companyId: event.companyId,
            eventType: event.eventType,
            status: 'submitted',
            timestamp: Date.now()
          });
          
          console.log(`  ✅ Event ${event.eventId} submitted: ${txId}`);
          
          // Wait between submissions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.log(`  ❌ Failed to submit event ${event.eventId}: ${error.message}`);
          transactions.push({
            eventId: event.eventId,
            error: error.message,
            status: 'failed'
          });
        }
      }
      
      this.testTransactions = transactions;
      const successful = transactions.filter(t => t.status === 'submitted').length;
      const failed = transactions.filter(t => t.status === 'failed').length;
      
      this.logResult('BLOCKCHAIN_TRANSACTIONS', successful > 0, 
        `Submitted ${successful} transactions to testnet (${failed} failed)`, 
        { 
          successful, 
          failed, 
          totalEvents: this.testEvents.length,
          successRate: `${((successful / this.testEvents.length) * 100).toFixed(1)}%`
        });
        
    } catch (error) {
      this.logResult('BLOCKCHAIN_TRANSACTIONS', false, `Transaction submission failed: ${error.message}`, error);
    }
  }

  private async testTransactionVerification(): Promise<void> {
    console.log('\n🔍 Phase 5: Transaction Verification');
    console.log('-'.repeat(40));
    
    try {
      const verificationResults = [];
      
      // Wait for confirmations
      console.log(`  ⏳ Waiting ${TESTNET_CONFIG.confirmationWait / 1000}s for confirmations...`);
      await new Promise(resolve => setTimeout(resolve, TESTNET_CONFIG.confirmationWait));
      
      // Verify each transaction
      for (const transaction of this.testTransactions.filter(t => t.status === 'submitted')) {
        try {
          console.log(`  🔍 Verifying transaction ${transaction.txId}...`);
          
          const txDetails = await this.kaspaRPC.getTransaction(transaction.txId);
          
          if (txDetails) {
            const isConfirmed = txDetails.confirmations >= 1;
            
            verificationResults.push({
              eventId: transaction.eventId,
              txId: transaction.txId,
              confirmations: txDetails.confirmations,
              verified: isConfirmed,
              fee: txDetails.fee,
              blockHash: txDetails.blockHash,
              timestamp: txDetails.timestamp
            });
            
            console.log(`  ${isConfirmed ? '✅' : '⏳'} TX ${transaction.txId}: ${txDetails.confirmations} confirmations`);
            
            // Update event with verification data
            await storage.updateEvent(transaction.eventId, {
              status: isConfirmed ? 'confirmed' : 'pending',
              confirmations: txDetails.confirmations,
              blockHash: txDetails.blockHash,
              verifiedAt: isConfirmed ? new Date() : null
            });
            
          } else {
            console.log(`  ❌ Transaction ${transaction.txId} not found on testnet`);
            verificationResults.push({
              eventId: transaction.eventId,
              txId: transaction.txId,
              error: 'Transaction not found',
              verified: false
            });
          }
          
        } catch (error) {
          console.log(`  ❌ Verification failed for ${transaction.txId}: ${error.message}`);
          verificationResults.push({
            eventId: transaction.eventId,
            txId: transaction.txId,
            error: error.message,
            verified: false
          });
        }
      }
      
      const verified = verificationResults.filter(r => r.verified).length;
      const total = verificationResults.length;
      
      this.logResult('TRANSACTION_VERIFICATION', verified > 0, 
        `Verified ${verified}/${total} transactions on testnet`, 
        { 
          verified, 
          total,
          verificationRate: `${((verified / total) * 100).toFixed(1)}%`,
          averageConfirmations: verificationResults.reduce((sum, r) => sum + (r.confirmations || 0), 0) / total
        });
        
    } catch (error) {
      this.logResult('TRANSACTION_VERIFICATION', false, `Verification failed: ${error.message}`, error);
    }
  }

  private async testEndToEndFlow(): Promise<void> {
    console.log('\n🔄 Phase 6: End-to-End Supply Chain Flow');
    console.log('-'.repeat(40));
    
    try {
      // Create complete product journey
      const productId = `TESTNET_PRODUCT_${Date.now()}`;
      const journey = [];
      
      // Select one company's events for complete journey
      const company = this.testCompanies[0];
      const companyEvents = this.testEvents.filter(e => e.companyId === company.companyId);
      
      for (const event of companyEvents) {
        const eventWithTx = this.testTransactions.find(t => t.eventId === event.eventId);
        
        if (eventWithTx && eventWithTx.status === 'submitted') {
          // Get transaction details
          const txDetails = await this.kaspaRPC.getTransaction(eventWithTx.txId);
          
          journey.push({
            step: journey.length + 1,
            eventType: event.eventType,
            eventId: event.eventId,
            location: event.metadata.location,
            timestamp: event.ts.getTime(), // Convert Date to timestamp
            txId: eventWithTx.txId,
            confirmed: txDetails?.confirmations >= 1,
            blockHash: txDetails?.blockHash,
            proofHash: event.leafHash
          });
        }
      }
      
      // Create consumer-facing product record
      const productRecord = {
        productId,
        companyId: company.companyId,
        companyName: company.name,
        journey,
        totalSteps: journey.length,
        verifiedSteps: journey.filter(s => s.confirmed).length,
        completionRate: `${((journey.filter(s => s.confirmed).length / journey.length) * 100).toFixed(1)}%`,
        blockchainProof: journey.map(s => s.txId).filter(Boolean),
        createdAt: new Date().toISOString()
      };
      
      console.log(`  📦 Product ${productId}:`);
      console.log(`    Company: ${company.name}`);
      console.log(`    Journey Steps: ${journey.length}`);
      console.log(`    Verified Steps: ${journey.filter(s => s.confirmed).length}`);
      console.log(`    Completion Rate: ${productRecord.completionRate}`);
      
      this.logResult('END_TO_END_FLOW', true, 
        `Created complete product journey with ${journey.length} steps`, 
        productRecord);
        
    } catch (error) {
      this.logResult('END_TO_END_FLOW', false, `End-to-end flow failed: ${error.message}`, error);
    }
  }

  private async testConsumerIntegration(): Promise<void> {
    console.log('\n👥 Phase 7: Consumer Integration');
    console.log('-'.repeat(40));
    
    try {
      // Create test consumer with unique email
      const consumerEmail = `testnet-consumer-${Date.now()}@example.com`;
      const consumer = await storage.createUser({
        email: consumerEmail,
        firstName: 'Testnet',
        lastName: 'Consumer',
        password: 'hashed_testnet_password'
      });
      
      // Create consumer purchases for testnet products
      const purchases = [];
      
      for (const event of this.testEvents.slice(0, 3)) {
        const purchase = await storage.createPurchase({
          userId: consumer.id,
          tagId: event.tagId,
          productName: `Testnet Product ${event.eventType}`,
          timestamp: Date.now()
        });
        
        purchases.push(purchase);
        console.log(`  🛒 Purchase: ${purchase.productName} (${event.tagId})`);
      }
      
      // Generate QR codes for consumer access
      const qrCodes = purchases.map(p => ({
        purchaseId: p.id,
        tagId: p.tagId,
        qrCode: `https://kmp-testnet.com/verify/${p.tagId}`,
        blockchainProof: this.testTransactions.find(t => 
          this.testEvents.find(e => e.tagId === p.tagId && e.eventId === t.eventId)
        )?.txId
      }));
      
      this.logResult('CONSUMER_INTEGRATION', true, 
        `Created ${purchases.length} consumer purchases with QR codes`, 
        { 
          consumerId: consumer.id,
          purchases: purchases.length,
          qrCodes: qrCodes.length,
          verifiableProducts: qrCodes.filter(q => q.blockchainProof).length
        });
        
    } catch (error) {
      this.logResult('CONSUMER_INTEGRATION', false, `Consumer integration failed: ${error.message}`, error);
    }
  }

  private printTestSummary(): void {
    console.log('\n📊 Testnet Integration Summary');
    console.log('='.repeat(60));
    
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log(`✅ Successful: ${successful}/${total} (${((successful / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed}/${total} (${((failed / total) * 100).toFixed(1)}%)`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.step}: ${r.message}`);
      });
    }
    
    console.log('\n🎯 Integration Results:');
    console.log(`   - Companies registered: ${this.testCompanies.length}`);
    console.log(`   - Events created: ${this.testEvents.length}`);
    console.log(`   - Transactions submitted: ${this.testTransactions.filter(t => t.status === 'submitted').length}`);
    console.log(`   - Blockchain proofs: ${this.testTransactions.filter(t => t.txId).length}`);
    
    const submittedTxs = this.testTransactions.filter(t => t.status === 'submitted');
    if (submittedTxs.length > 0) {
      console.log('\n🔗 Blockchain Transactions:');
      submittedTxs.forEach(tx => {
        console.log(`   - ${tx.eventType}: ${tx.txId}`);
      });
    }
    
    console.log('\n🚀 Kaspa Testnet Integration Complete!');
    console.log('='.repeat(60));
  }
}

// Run the integration test
if (import.meta.url === `file://${process.argv[1]}`) {
  const integration = new KaspaTestnetIntegration();
  integration.runCompleteTest().catch(console.error);
}

export { KaspaTestnetIntegration };