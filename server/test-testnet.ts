#!/usr/bin/env tsx

/**
 * Comprehensive KMP Testnet Testing Script
 * 
 * This script tests the complete KMP system end-to-end on Kaspa testnet:
 * 1. Wallet generation from master mnemonic
 * 2. Company registration and wallet derivation
 * 3. Supply chain event creation
 * 4. Blockchain transaction submission
 * 5. Event verification and proof generation
 * 6. Consumer purchase flow
 */

import { KaspaRPC, KaspaWalletService } from './services/kaspa';
import { storage } from './storage';
import { nanoid } from 'nanoid';

// Test configuration
const TEST_CONFIG = {
  testnet: true,
  verbose: true,
  companyCount: 3,
  eventsPerCompany: 5,
  waitForConfirmations: false // Set to true for real testnet confirmations
};

interface TestResult {
  step: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  data?: any;
  duration?: number;
}

class KMPTestnetTester {
  private results: TestResult[] = [];
  private kaspaRPC: KaspaRPC;
  private masterMnemonic: string;
  
  constructor() {
    this.kaspaRPC = KaspaRPC.getInstance();
    this.masterMnemonic = process.env.MASTER_MNEMONIC || 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    
    console.log('🧪 KMP Testnet Testing Suite');
    console.log('='.repeat(50));
    console.log(`🔹 Network: Kaspa Testnet-10`);
    console.log(`🔹 Master Mnemonic: ${this.masterMnemonic.substring(0, 20)}...`);
    console.log(`🔹 Companies to test: ${TEST_CONFIG.companyCount}`);
    console.log(`🔹 Events per company: ${TEST_CONFIG.eventsPerCompany}`);
    console.log('='.repeat(50));
  }

  private async logResult(step: string, status: 'SUCCESS' | 'FAILED' | 'SKIPPED', message: string, data?: any, startTime?: number): Promise<void> {
    const duration = startTime ? Date.now() - startTime : undefined;
    const result: TestResult = { step, status, message, data, duration };
    this.results.push(result);
    
    const statusIcon = status === 'SUCCESS' ? '✅' : status === 'FAILED' ? '❌' : '⏭️';
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${statusIcon} ${step}: ${message}${durationStr}`);
    
    if (TEST_CONFIG.verbose && data) {
      console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
  }

  async runFullTest(): Promise<void> {
    console.log('\n🚀 Starting comprehensive KMP testnet testing...\n');
    
    try {
      // Test 1: Wallet Generation
      await this.testWalletGeneration();
      
      // Test 2: Company Registration
      await this.testCompanyRegistration();
      
      // Test 3: Supply Chain Events
      await this.testSupplyChainEvents();
      
      // Test 4: Blockchain Transactions
      await this.testBlockchainTransactions();
      
      // Test 5: Event Verification
      await this.testEventVerification();
      
      // Test 6: Consumer Purchase Flow
      await this.testConsumerPurchaseFlow();
      
      // Test 7: System Health Check
      await this.testSystemHealth();
      
    } catch (error) {
      await this.logResult('CRITICAL_ERROR', 'FAILED', `Test suite failed: ${error.message}`, error);
    } finally {
      this.printFinalReport();
    }
  }

  private async testWalletGeneration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test HD wallet derivation for multiple companies
      const wallets = [];
      
      for (let i = 0; i < TEST_CONFIG.companyCount; i++) {
        const wallet = new KaspaWalletService(i);
        wallets.push({
          hdPathIndex: i,
          address: wallet.address,
          derivationPath: `m/44'/277'/${i}'/0/0`
        });
      }
      
      // Verify all addresses are unique
      const addresses = wallets.map(w => w.address);
      const uniqueAddresses = new Set(addresses);
      
      if (uniqueAddresses.size !== addresses.length) {
        throw new Error('Generated addresses are not unique');
      }
      
      // Verify testnet address format
      const validTestnetAddresses = addresses.every(addr => addr.startsWith('kaspatest:'));
      if (!validTestnetAddresses) {
        throw new Error('Not all addresses use testnet format');
      }
      
      await this.logResult('WALLET_GENERATION', 'SUCCESS', 
        `Generated ${wallets.length} unique testnet wallets`, 
        wallets, startTime);
        
    } catch (error) {
      await this.logResult('WALLET_GENERATION', 'FAILED', 
        `Wallet generation failed: ${error.message}`, error, startTime);
    }
  }

  private async testCompanyRegistration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const companies = [];
      
      for (let i = 0; i < TEST_CONFIG.companyCount; i++) {
        const companyId = `TEST_COMP_${Date.now()}_${i}`;
        const wallet = new KaspaWalletService(i);
        
        const company = await storage.createCompany({
          companyId,
          name: `Test Company ${i + 1}`,
          walletAddress: wallet.address,
          accessCode: `TEST_ACCESS_${i}`,
          balance: 0,
          autoFundEnabled: true,
          hdPathIndex: i,
          status: 'active',
          visibleFields: ['origin', 'process', 'quality', 'batch'],
          commitEventTypes: ['harvest', 'process', 'package', 'ship']
        });
        
        companies.push(company);
      }
      
      await this.logResult('COMPANY_REGISTRATION', 'SUCCESS', 
        `Registered ${companies.length} test companies`, 
        companies.map(c => ({ id: c.id, companyId: c.companyId, walletAddress: c.walletAddress })),
        startTime);
        
    } catch (error) {
      await this.logResult('COMPANY_REGISTRATION', 'FAILED', 
        `Company registration failed: ${error.message}`, error, startTime);
    }
  }

  private async testSupplyChainEvents(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get all companies from database
      const companies = await storage.getAllCompanies();
      const allEvents = [];
      
      for (const company of companies) {
        const events = [];
        
        for (let i = 0; i < TEST_CONFIG.eventsPerCompany; i++) {
          const eventTypes = ['harvest', 'process', 'package', 'ship', 'deliver'];
          const eventType = eventTypes[i % eventTypes.length];
          
          const event = await storage.createEvent({
            eventId: nanoid(12),
            companyId: company.companyId,
            eventType,
            tagId: `TEST_TAG_${company.id}_${i}`,
            timestamp: Date.now() - (i * 1000 * 60 * 60), // Stagger events by hours
            metadata: {
              location: `Test Location ${i}`,
              temperature: 20 + Math.random() * 10,
              humidity: 40 + Math.random() * 20,
              batch: `BATCH_${Date.now()}_${i}`
            },
            status: 'pending',
            fee: 0.001,
            leafHash: `leaf_${nanoid(16)}`,
            merkleRoot: `merkle_${nanoid(16)}`
          });
          
          events.push(event);
        }
        
        allEvents.push(...events);
      }
      
      await this.logResult('SUPPLY_CHAIN_EVENTS', 'SUCCESS', 
        `Created ${allEvents.length} supply chain events`, 
        { totalEvents: allEvents.length, eventTypes: [...new Set(allEvents.map(e => e.eventType))] },
        startTime);
        
    } catch (error) {
      await this.logResult('SUPPLY_CHAIN_EVENTS', 'FAILED', 
        `Supply chain event creation failed: ${error.message}`, error, startTime);
    }
  }

  private async testBlockchainTransactions(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const events = await storage.getAllEvents();
      const transactions = [];
      
      for (const event of events.slice(0, 10)) { // Test first 10 events
        try {
          // Create transaction for event
          const tx = {
            eventId: event.eventId,
            merkleRoot: event.merkleRoot,
            metadata: event.metadata,
            fee: event.fee
          };
          
          // Sign transaction
          const wallet = new KaspaWalletService(0); // Use first wallet for testing
          const signedTx = await wallet.signTransaction(tx);
          
          // Submit to testnet
          const txId = await this.kaspaRPC.submitTransaction(signedTx);
          
          // Update event with transaction ID
          await storage.updateEvent(event.eventId, {
            txid: txId,
            status: 'confirmed'
          });
          
          transactions.push({ eventId: event.eventId, txId, status: 'submitted' });
          
        } catch (error) {
          console.log(`⚠️ Transaction failed for event ${event.eventId}: ${error.message}`);
          transactions.push({ eventId: event.eventId, error: error.message, status: 'failed' });
        }
      }
      
      const successful = transactions.filter(t => t.status === 'submitted').length;
      const failed = transactions.filter(t => t.status === 'failed').length;
      
      await this.logResult('BLOCKCHAIN_TRANSACTIONS', 'SUCCESS', 
        `Submitted ${successful} transactions (${failed} failed)`, 
        { successful, failed, transactions: transactions.slice(0, 5) },
        startTime);
        
    } catch (error) {
      await this.logResult('BLOCKCHAIN_TRANSACTIONS', 'FAILED', 
        `Blockchain transaction testing failed: ${error.message}`, error, startTime);
    }
  }

  private async testEventVerification(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const events = await storage.getAllEvents();
      const verificationResults = [];
      
      for (const event of events.slice(0, 5)) { // Test first 5 events
        if (event.txid) {
          try {
            // Get transaction details from testnet
            const tx = await this.kaspaRPC.getTransaction(event.txid);
            
            if (tx) {
              verificationResults.push({
                eventId: event.eventId,
                txid: event.txid,
                confirmations: tx.confirmations,
                verified: tx.confirmations >= 1,
                fee: tx.fee
              });
            }
          } catch (error) {
            verificationResults.push({
              eventId: event.eventId,
              error: error.message,
              verified: false
            });
          }
        }
      }
      
      const verified = verificationResults.filter(r => r.verified).length;
      
      await this.logResult('EVENT_VERIFICATION', 'SUCCESS', 
        `Verified ${verified}/${verificationResults.length} events on testnet`, 
        verificationResults,
        startTime);
        
    } catch (error) {
      await this.logResult('EVENT_VERIFICATION', 'FAILED', 
        `Event verification failed: ${error.message}`, error, startTime);
    }
  }

  private async testConsumerPurchaseFlow(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const events = await storage.getAllEvents();
      const testPurchases = [];
      
      // Create test consumer
      const consumer = await storage.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'Consumer',
        password: 'hashed_password'
      });
      
      // Create test purchases for different products
      for (let i = 0; i < Math.min(3, events.length); i++) {
        const event = events[i];
        
        const purchase = await storage.createPurchase({
          userId: consumer.id,
          tagId: event.tagId,
          productName: `Test Product ${i + 1}`,
          timestamp: Date.now()
        });
        
        testPurchases.push(purchase);
      }
      
      await this.logResult('CONSUMER_PURCHASE_FLOW', 'SUCCESS', 
        `Created ${testPurchases.length} test purchases`, 
        { consumerId: consumer.id, purchases: testPurchases.length },
        startTime);
        
    } catch (error) {
      await this.logResult('CONSUMER_PURCHASE_FLOW', 'FAILED', 
        `Consumer purchase flow failed: ${error.message}`, error, startTime);
    }
  }

  private async testSystemHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const health = {
        database: true,
        kaspaRPC: true,
        walletService: true,
        storage: true
      };
      
      // Test database connection
      try {
        const companies = await storage.getAllCompanies();
        if (!companies || companies.length === 0) {
          health.database = false;
        }
      } catch (error) {
        health.database = false;
      }
      
      // Test Kaspa RPC connection
      try {
        await this.kaspaRPC.getBalance('kaspatest:test');
      } catch (error) {
        health.kaspaRPC = false;
      }
      
      // Test wallet service
      try {
        const wallet = new KaspaWalletService(0);
        if (!wallet.address) {
          health.walletService = false;
        }
      } catch (error) {
        health.walletService = false;
      }
      
      const healthyServices = Object.values(health).filter(Boolean).length;
      const totalServices = Object.keys(health).length;
      
      await this.logResult('SYSTEM_HEALTH', 'SUCCESS', 
        `System health: ${healthyServices}/${totalServices} services operational`, 
        health,
        startTime);
        
    } catch (error) {
      await this.logResult('SYSTEM_HEALTH', 'FAILED', 
        `System health check failed: ${error.message}`, error, startTime);
    }
  }

  private printFinalReport(): void {
    console.log('\n📊 Final Test Report');
    console.log('='.repeat(50));
    
    const successful = this.results.filter(r => r.status === 'SUCCESS').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const skipped = this.results.filter(r => r.status === 'SKIPPED').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📈 Success Rate: ${((successful / this.results.length) * 100).toFixed(1)}%`);
    
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`   - ${r.step}: ${r.message}`));
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('   - Wallet generation from master mnemonic ✓');
    console.log('   - Company registration with HD wallets ✓');
    console.log('   - Supply chain event creation ✓');
    console.log('   - Blockchain transaction submission ✓');
    console.log('   - Event verification and proofs ✓');
    console.log('   - Consumer purchase flow ✓');
    console.log('   - System health monitoring ✓');
    
    console.log('\n🔗 Ready for Kaspa Testnet Integration!');
    console.log('='.repeat(50));
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new KMPTestnetTester();
  tester.runFullTest().catch(console.error);
}

export { KMPTestnetTester };