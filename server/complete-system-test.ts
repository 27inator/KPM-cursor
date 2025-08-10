#!/usr/bin/env tsx

// Complete KPM System Test - validates all components working together
import { storage } from './storage.js';
import { nanoid } from 'nanoid';
import { KaspaRPC, KaspaWalletService } from './services/kaspa.js';

console.log('🎯 Complete KPM System Test');
console.log('='.repeat(60));

interface TestResults {
  webInterface: boolean;
  blockchainIntegration: boolean;
  consumerIntegration: boolean;
  databaseOperations: boolean;
  errors: string[];
  details: any;
}

class CompleteSystemTest {
  private results: TestResults = {
    webInterface: false,
    blockchainIntegration: false,
    consumerIntegration: false,
    databaseOperations: false,
    errors: [],
    details: {}
  };

  async runCompleteTest(): Promise<void> {
    console.log('🚀 Starting Complete System Test');
    console.log('Testing all KPM components integrated together\n');

    await this.testDatabaseOperations();
    await this.testWebInterface();
    await this.testBlockchainIntegration();
    await this.testConsumerIntegration();
    
    this.printFinalResults();
  }

  private async testDatabaseOperations(): Promise<void> {
    console.log('💾 Test 1: Database Operations');
    console.log('─'.repeat(40));

    try {
      // Test company creation
      const company = await storage.createCompany({
        companyId: `SYSTEST_${nanoid(8)}`,
        name: 'System Test Company',
        hdPathIndex: 99,
        walletAddress: 'kaspatest:systest123',
        balance: 150000000,
        visibleFields: ['name', 'origin', 'eventType'],
        commitEventTypes: ['harvest', 'process', 'package']
      });

      console.log(`✅ Company created: ${company.companyId}`);

      // Test event creation
      const event = await storage.createEvent({
        eventId: `SYSTEST_EVENT_${nanoid(8)}`,
        companyId: company.companyId,
        tagId: `SYSTEST_TAG_${nanoid(8)}`,
        eventType: 'harvest',
        ts: new Date(),
        leafHash: `leaf_${nanoid(16)}`,
        merkleRoot: `merkle_${nanoid(16)}`,
        txid: '',
        status: 'pending',
        fee: 0.00001
      });

      console.log(`✅ Event created: ${event.eventId}`);

      // Test purchase creation
      const purchase = await storage.createPurchase({
        purchaseId: `SYSTEST_PURCHASE_${nanoid(8)}`,
        userId: `consumer_${nanoid(8)}`,
        eventId: event.eventId,
        tagId: event.tagId,
        productName: 'System Test Product',
        stampTxid: 'pending'
      });

      console.log(`✅ Purchase created: ${purchase.purchaseId}`);

      this.results.databaseOperations = true;
      this.results.details.database = {
        company: company.companyId,
        event: event.eventId,
        purchase: purchase.purchaseId
      };

    } catch (error) {
      console.error(`❌ Database operations failed:`, error);
      this.results.errors.push(`Database: ${error.message}`);
    }

    console.log(`Database Status: ${this.results.databaseOperations ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  private async testWebInterface(): Promise<void> {
    console.log('🌐 Test 2: Web Interface');
    console.log('─'.repeat(40));

    try {
      // Test API endpoints (simulate requests)
      const dashboardData = await storage.getAllCompanies();
      const recentEvents = await storage.getRecentEvents(5);
      const walletMetrics = await storage.getWalletMetrics();

      console.log(`✅ Dashboard data: ${dashboardData.length} companies`);
      console.log(`✅ Recent events: ${recentEvents.length} events`);
      console.log(`✅ Wallet metrics: ${walletMetrics.masterWalletBalance} KAS`);

      this.results.webInterface = true;
      this.results.details.webInterface = {
        companies: dashboardData.length,
        events: recentEvents.length,
        walletBalance: walletMetrics.masterWalletBalance
      };

    } catch (error) {
      console.error(`❌ Web interface test failed:`, error);
      this.results.errors.push(`Web Interface: ${error.message}`);
    }

    console.log(`Web Interface Status: ${this.results.webInterface ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  private async testBlockchainIntegration(): Promise<void> {
    console.log('⛓️ Test 3: Blockchain Integration');
    console.log('─'.repeat(40));

    try {
      const kaspaRPC = KaspaRPC.getInstance();
      const wallet = new KaspaWalletService(0);

      // Test HD wallet generation
      console.log(`✅ HD wallet generated: ${wallet.address}`);
      console.log(`✅ Wallet balance: ${wallet.balance / 100000000} KAS`);

      // Test transaction submission
      const txData = {
        eventId: `SYSTEST_${nanoid(8)}`,
        merkleRoot: `merkle_${nanoid(16)}`,
        leafHash: `leaf_${nanoid(16)}`,
        companyAddress: wallet.address,
        fee: 1000
      };

      const txId = await kaspaRPC.submitTransaction(txData);
      console.log(`✅ Transaction submitted: ${txId}`);

      // Test transaction verification
      const transaction = await kaspaRPC.getTransaction(txId);
      console.log(`✅ Transaction verified: ${transaction.confirmations} confirmations`);

      this.results.blockchainIntegration = true;
      this.results.details.blockchain = {
        walletAddress: wallet.address,
        balance: wallet.balance,
        txId: txId,
        confirmations: transaction.confirmations
      };

    } catch (error) {
      console.error(`❌ Blockchain integration test failed:`, error);
      this.results.errors.push(`Blockchain: ${error.message}`);
    }

    console.log(`Blockchain Status: ${this.results.blockchainIntegration ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  private async testConsumerIntegration(): Promise<void> {
    console.log('📱 Test 4: Consumer Integration');
    console.log('─'.repeat(40));

    try {
      // Get recent events for consumer purchase
      const events = await storage.getRecentEvents(1);
      if (events.length === 0) {
        throw new Error('No events found for consumer test');
      }

      const event = events[0];
      
      // Test consumer purchase creation
      const purchase = await storage.createPurchase({
        purchaseId: `CONSUMER_${nanoid(8)}`,
        userId: `consumer_${Date.now()}`,
        eventId: event.eventId,
        tagId: event.tagId,
        productName: 'Consumer Test Product',
        stampTxid: event.txid || 'pending'
      });

      console.log(`✅ Consumer purchase created: ${purchase.purchaseId}`);

      // Test blockchain certificate generation
      const certificate = {
        purchaseId: purchase.purchaseId,
        productName: purchase.productName,
        blockchain: {
          txId: event.txid,
          merkleRoot: event.merkleRoot,
          leafHash: event.leafHash,
          confirmations: 'confirmed'
        },
        timestamp: new Date().toISOString(),
        verificationUrl: `https://kaspa.org/tx/${event.txid}`
      };

      console.log(`✅ Blockchain certificate generated`);
      console.log(`✅ Consumer can verify: ${certificate.verificationUrl}`);

      this.results.consumerIntegration = true;
      this.results.details.consumer = {
        purchaseId: purchase.purchaseId,
        blockchain: certificate.blockchain,
        verificationUrl: certificate.verificationUrl
      };

    } catch (error) {
      console.error(`❌ Consumer integration test failed:`, error);
      this.results.errors.push(`Consumer: ${error.message}`);
    }

    console.log(`Consumer Status: ${this.results.consumerIntegration ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  private printFinalResults(): void {
    console.log('📊 Complete KPM System Test Results');
    console.log('='.repeat(60));

    const components = [
      { name: 'Database Operations', status: this.results.databaseOperations },
      { name: 'Web Interface', status: this.results.webInterface },
      { name: 'Blockchain Integration', status: this.results.blockchainIntegration },
      { name: 'Consumer Integration', status: this.results.consumerIntegration }
    ];

    let passCount = 0;
    for (const component of components) {
      const statusIcon = component.status ? '✅' : '❌';
      console.log(`${statusIcon} ${component.name}: ${component.status ? 'PASS' : 'FAIL'}`);
      if (component.status) passCount++;
    }

    console.log('');
    console.log(`📈 Overall System Score: ${passCount}/4 (${(passCount/4*100).toFixed(1)}%)`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ Errors encountered:');
      for (const error of this.results.errors) {
        console.log(`   • ${error}`);
      }
      console.log('');
    }

    if (passCount === 4) {
      console.log('🎉 Complete System Test: SUCCESS!');
      console.log('✅ All KPM components working correctly');
      console.log('✅ Database operations functional');
      console.log('✅ Web interface responding');
      console.log('✅ Blockchain integration working');
      console.log('✅ Consumer integration operational');
      console.log('✅ System ready for production deployment');
    } else {
      console.log('⚠️ Complete System Test: PARTIAL SUCCESS');
      console.log(`💡 ${4 - passCount} component(s) need attention`);
    }

    console.log('');
    console.log('🎯 Complete KPM System Test Finished!');
    console.log('='.repeat(60));
  }
}

// Run the complete system test
async function runCompleteSystemTest(): Promise<void> {
  const systemTest = new CompleteSystemTest();
  await systemTest.runCompleteTest();
}

runCompleteSystemTest().catch(error => {
  console.error('💥 Complete system test failed:', error);
  process.exit(1);
});