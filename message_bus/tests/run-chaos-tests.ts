#!/usr/bin/env ts-node

import { ChaosTester, ChaosConfig } from './chaos/chaos-tester';

/**
 * 🌪️ KMP Supply Chain Chaos Engineering Test Runner
 * 
 * This script runs chaos engineering tests to verify system resilience:
 * - Network failure simulation
 * - Database stress testing
 * - Resource exhaustion tests
 * - Recovery time measurement
 */

async function runChaosTests() {
  console.log('🌪️  KMP Supply Chain - Chaos Engineering Tests');
  console.log('==============================================');

  const config: ChaosConfig = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:4000',
    testDuration: parseInt(process.env.CHAOS_TEST_DURATION || '300000'), // 5 minutes
    maxConcurrentFailures: parseInt(process.env.MAX_CONCURRENT_FAILURES || '3'),
    recoveryTime: parseInt(process.env.RECOVERY_TIME || '30000') // 30 seconds
  };

  console.log('📋 Chaos Testing Configuration:');
  console.log(`   Target: ${config.baseUrl}`);
  console.log(`   Test Duration: ${config.testDuration / 1000}s`);
  console.log(`   Max Concurrent Failures: ${config.maxConcurrentFailures}`);
  console.log(`   Recovery Time: ${config.recoveryTime / 1000}s`);

  const tester = new ChaosTester(config);

  try {
    console.log('\n⚠️  WARNING: Chaos tests will deliberately inject failures');
    console.log('   Ensure this is running against a test environment only!');
    console.log('   Tests will start in 10 seconds...');
    
    // Safety delay
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    const results = await tester.runChaosTests();
    
    const failedTests = results.filter(r => !r.success);
    const exitCode = failedTests.length > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('\n🎉 ALL CHAOS TESTS PASSED! System is highly resilient.');
    } else {
      console.log(`\n💥 ${failedTests.length} chaos tests revealed vulnerabilities.`);
    }
    
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Chaos testing failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Chaos testing interrupted');
  process.exit(130);
});

if (require.main === module) {
  runChaosTests().catch(error => {
    console.error('❌ Chaos testing execution failed:', error);
    process.exit(1);
  });
} 