#!/usr/bin/env ts-node

import { E2ETestRunner, TestConfig } from './e2e/framework/test-runner';

/**
 * 🧪 KMP Supply Chain E2E Test Execution Script
 * 
 * This script runs comprehensive end-to-end tests including:
 * - Full API testing
 * - Authentication flows
 * - Blockchain transaction verification
 * - Load testing and performance benchmarks
 * - Error handling and edge cases
 */

async function main() {
  console.log('🚀 KMP Supply Chain - End-to-End Test Suite');
  console.log('==========================================');

  const config: TestConfig = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:4000',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    retries: parseInt(process.env.TEST_RETRIES || '3'),
    concurrency: parseInt(process.env.TEST_CONCURRENCY || '10'),
    loadTestDuration: parseInt(process.env.LOAD_TEST_DURATION || '10000'),
    expectedLatencyP95: parseInt(process.env.EXPECTED_LATENCY_P95 || '1000'),
    expectedThroughput: parseInt(process.env.EXPECTED_THROUGHPUT || '100')
  };

  console.log('📋 Test Configuration:');
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Timeout: ${config.timeout}ms`);
  console.log(`   Concurrency: ${config.concurrency}`);
  console.log(`   Load Test Duration: ${config.loadTestDuration}ms`);
  console.log(`   Expected P95 Latency: ${config.expectedLatencyP95}ms`);
  console.log(`   Expected Throughput: ${config.expectedThroughput} RPS`);

  const runner = new E2ETestRunner(config);

  try {
    const results = await runner.runAllTests();
    
    const failedTests = results.filter(r => !r.success);
    const exitCode = failedTests.length > 0 ? 1 : 0;
    
    if (exitCode === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System ready for production.');
    } else {
      console.log(`\n💥 ${failedTests.length} tests failed. Check logs above.`);
    }
    
    process.exit(exitCode);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated');
  process.exit(143);
});

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
} 