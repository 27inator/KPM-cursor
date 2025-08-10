#!/usr/bin/env ts-node

import { E2ETestRunner, TestConfig } from './e2e/framework/test-runner';

/**
 * 📈 KMP Supply Chain Load Testing Script
 * 
 * This script focuses specifically on load testing and performance benchmarks:
 * - Normal load scenarios
 * - Peak traffic simulation  
 * - Stress testing to breaking point
 * - Performance benchmark establishment
 */

async function runLoadTests() {
  console.log('📈 KMP Supply Chain - Load Testing Suite');
  console.log('=======================================');

  const baseConfig: TestConfig = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:4000',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    retries: parseInt(process.env.TEST_RETRIES || '3'),
    concurrency: parseInt(process.env.TEST_CONCURRENCY || '50'),
    loadTestDuration: parseInt(process.env.LOAD_TEST_DURATION || '60000'),
    expectedLatencyP95: parseInt(process.env.EXPECTED_LATENCY_P95 || '1000'),
    expectedThroughput: parseInt(process.env.EXPECTED_THROUGHPUT || '100')
  };

  console.log('📋 Load Test Configuration:');
  console.log(`   Target: ${baseConfig.baseUrl}`);
  console.log(`   Max Concurrency: ${baseConfig.concurrency}`);
  console.log(`   Test Duration: ${baseConfig.loadTestDuration / 1000}s`);
  console.log(`   Expected P95: ${baseConfig.expectedLatencyP95}ms`);
  console.log(`   Expected RPS: ${baseConfig.expectedThroughput}`);

  const testScenarios = [
    {
      name: 'Baseline Load Test',
      description: 'Normal traffic patterns - 10 concurrent users',
      concurrency: 10,
      duration: 30000,
      expectedRPS: 50
    },
    {
      name: 'Peak Load Test', 
      description: 'Peak traffic simulation - 50 concurrent users',
      concurrency: 50,
      duration: 60000,
      expectedRPS: baseConfig.expectedThroughput
    },
    {
      name: 'Stress Test',
      description: 'Beyond capacity - 100 concurrent users',
      concurrency: 100,
      duration: 120000,
      expectedRPS: baseConfig.expectedThroughput * 0.7 // Allow degradation
    },
    {
      name: 'Spike Test',
      description: 'Sudden traffic spike - 200 concurrent users',
      concurrency: 200,
      duration: 30000,
      expectedRPS: baseConfig.expectedThroughput * 0.5 // Expect significant degradation
    }
  ];

  const results: any[] = [];

  for (const scenario of testScenarios) {
    console.log(`\n📈 Running: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    
    const config = {
      ...baseConfig,
      concurrency: scenario.concurrency,
      loadTestDuration: scenario.duration,
      expectedThroughput: scenario.expectedRPS
    };

    const runner = new E2ETestRunner(config);
    
    try {
      // Run minimal auth setup
      console.log('🔐 Setting up authentication for load test...');
      await runner['testUserRegistration']();
      await runner['testApiKeyCreation']();
      
      // Run load tests
      console.log('🚀 Starting load test...');
      
      const loadTestResults = await Promise.all([
        runner['testNormalLoad'](),
        runner['testPeakLoad'](),
        runner['testStressLoad']()
      ]);

      // Run benchmark
      const benchmarkResults = await runner['runPerformanceBenchmark']();
      
      const scenarioResult = {
        scenario: scenario.name,
        success: true,
        loadResults: loadTestResults,
        benchmark: benchmarkResults,
        timestamp: new Date().toISOString()
      };
      
      results.push(scenarioResult);
      
      console.log(`✅ ${scenario.name} completed successfully`);
      
      // Recovery time between scenarios
      console.log('⏱️  Recovery period between tests...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
    } catch (error) {
      console.error(`❌ ${scenario.name} failed:`, error);
      results.push({
        scenario: scenario.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  // Print comprehensive load test summary
  printLoadTestSummary(results, testScenarios);
  
  // Determine exit code
  const failedTests = results.filter(r => !r.success);
  const exitCode = failedTests.length > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    console.log('\n🎉 ALL LOAD TESTS PASSED! System performance is excellent.');
  } else {
    console.log(`\n💥 ${failedTests.length} load tests failed. Performance needs improvement.`);
  }
  
  process.exit(exitCode);
}

function printLoadTestSummary(results: any[], scenarios: any[]): void {
  console.log('\n📈 LOAD TESTING SUMMARY');
  console.log('=======================');
  
  const totalScenarios = results.length;
  const passedScenarios = results.filter(r => r.success).length;
  const failedScenarios = totalScenarios - passedScenarios;
  
  console.log(`📊 Total Scenarios: ${totalScenarios}`);
  console.log(`✅ Passed: ${passedScenarios}`);
  console.log(`❌ Failed: ${failedScenarios}`);
  console.log(`📈 Performance Score: ${((passedScenarios / totalScenarios) * 100).toFixed(2)}%`);
  
  console.log('\n📊 DETAILED RESULTS:');
  results.forEach((result, index) => {
    if (result.success && result.loadResults) {
      console.log(`\n🧪 ${result.scenario}:`);
      result.loadResults.forEach((load: any, loadIndex: number) => {
        const testNames = ['Normal Load', 'Peak Load', 'Stress Load'];
        console.log(`   ${testNames[loadIndex]}:`);
        console.log(`     RPS: ${load.throughput.rps.toFixed(2)}`);
        console.log(`     P95 Latency: ${load.latency.p95.toFixed(2)}ms`);
        console.log(`     Success Rate: ${((load.throughput.successfulRequests / load.throughput.totalRequests) * 100).toFixed(2)}%`);
        console.log(`     Error Count: ${load.errors.count}`);
      });
    } else {
      console.log(`\n❌ ${result.scenario}: ${result.error || 'Failed'}`);
    }
  });
  
  console.log('\n🎯 PERFORMANCE RECOMMENDATIONS:');
  
  // Analyze results and provide recommendations
  const hasFailures = failedScenarios > 0;
  const hasHighLatency = results.some(r => 
    r.loadResults?.some((load: any) => load.latency.p95 > 2000)
  );
  const hasLowThroughput = results.some(r =>
    r.loadResults?.some((load: any) => load.throughput.rps < 50)
  );
  const hasHighErrorRate = results.some(r =>
    r.loadResults?.some((load: any) => load.errors.count / load.throughput.totalRequests > 0.1)
  );
  
  if (!hasFailures && !hasHighLatency && !hasLowThroughput && !hasHighErrorRate) {
    console.log('   ✅ Excellent performance! System handles load very well.');
    console.log('   ✅ All latency targets met');
    console.log('   ✅ Throughput is excellent');
    console.log('   ✅ Error rates are minimal');
  } else {
    if (hasFailures) {
      console.log('   🔧 Fix failing load test scenarios');
    }
    if (hasHighLatency) {
      console.log('   🔧 Optimize response times - P95 latency too high');
    }
    if (hasLowThroughput) {
      console.log('   🔧 Improve throughput - consider horizontal scaling');
    }
    if (hasHighErrorRate) {
      console.log('   🔧 Reduce error rates under load');
    }
  }
  
  console.log('\n🚀 SCALING RECOMMENDATIONS:');
  console.log('   📈 Current configuration appears suitable for:');
  
  const maxSuccessfulRPS = Math.max(...results
    .filter(r => r.success)
    .flatMap(r => r.loadResults || [])
    .map((load: any) => load.throughput.rps)
  );
  
  const estimatedUsers = Math.floor(maxSuccessfulRPS * 10); // Assume 10 requests per user session
  console.log(`     - Up to ${estimatedUsers} concurrent users`);
  console.log(`     - Peak throughput: ${maxSuccessfulRPS.toFixed(0)} RPS`);
  console.log(`     - Daily API calls: ~${(maxSuccessfulRPS * 86400).toLocaleString()}`);
  
  console.log('\n🔍 NEXT STEPS:');
  console.log('   1. Set up continuous load testing in CI/CD');
  console.log('   2. Implement performance monitoring dashboards');
  console.log('   3. Set up auto-scaling based on metrics');
  console.log('   4. Regular performance regression testing');
  console.log('   5. Chaos engineering for resilience testing');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Load test interrupted');
  process.exit(130);
});

if (require.main === module) {
  runLoadTests().catch(error => {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  });
} 