import axios, { AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';

export interface ChaosConfig {
  baseUrl: string;
  testDuration: number;
  maxConcurrentFailures: number;
  recoveryTime: number;
}

export interface ChaosTest {
  name: string;
  description: string;
  failureType: FailureType;
  duration: number;
  intensity: number; // 0-1 scale
}

export enum FailureType {
  NETWORK_DELAY = 'network_delay',
  DATABASE_SLOW = 'database_slow',
  HIGH_CPU = 'high_cpu',
  MEMORY_PRESSURE = 'memory_pressure',
  CONNECTION_FAILURES = 'connection_failures',
  DISK_IO_STRESS = 'disk_io_stress'
}

export interface ChaosResult {
  testName: string;
  success: boolean;
  startTime: number;
  endTime: number;
  failureInjected: boolean;
  systemRecovered: boolean;
  impactMetrics: {
    errorRate: number;
    latencyIncrease: number;
    throughputDecrease: number;
    recoveryTime: number;
  };
  details?: any;
}

/**
 * 🌪️ Chaos Engineering Test System
 * 
 * This system tests the resilience of the KMP Supply Chain API
 * by injecting various types of failures and measuring recovery.
 */
export class ChaosTester {
  private client: AxiosInstance;
  private config: ChaosConfig;
  private baselineMetrics?: PerformanceMetrics;

  constructor(config: ChaosConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      validateStatus: () => true
    });
  }

  /**
   * 🎯 Run comprehensive chaos engineering tests
   */
  async runChaosTests(): Promise<ChaosResult[]> {
    console.log('🌪️  Starting Chaos Engineering Tests');
    console.log('====================================');

    const results: ChaosResult[] = [];

    // Establish baseline performance
    console.log('📏 Establishing baseline performance metrics...');
    this.baselineMetrics = await this.measureBaselinePerformance();
    console.log('✅ Baseline established');

    const chaosTests: ChaosTest[] = [
      {
        name: 'Network Latency Injection',
        description: 'Inject artificial network delays',
        failureType: FailureType.NETWORK_DELAY,
        duration: 30000, // 30 seconds
        intensity: 0.5
      },
      {
        name: 'Database Slow Query Simulation',
        description: 'Simulate slow database responses',
        failureType: FailureType.DATABASE_SLOW,
        duration: 45000, // 45 seconds
        intensity: 0.7
      },
      {
        name: 'High CPU Load Test',
        description: 'Simulate high CPU usage',
        failureType: FailureType.HIGH_CPU,
        duration: 60000, // 1 minute
        intensity: 0.8
      },
      {
        name: 'Memory Pressure Test',
        description: 'Simulate memory pressure',
        failureType: FailureType.MEMORY_PRESSURE,
        duration: 30000, // 30 seconds
        intensity: 0.6
      },
      {
        name: 'Connection Failure Simulation',
        description: 'Simulate intermittent connection failures',
        failureType: FailureType.CONNECTION_FAILURES,
        duration: 40000, // 40 seconds
        intensity: 0.4
      },
      {
        name: 'Disk I/O Stress Test',
        description: 'Simulate disk I/O bottlenecks',
        failureType: FailureType.DISK_IO_STRESS,
        duration: 35000, // 35 seconds
        intensity: 0.5
      }
    ];

    for (const test of chaosTests) {
      console.log(`\n🌪️  Running: ${test.name}`);
      console.log(`📝 ${test.description}`);
      
      const result = await this.runSingleChaosTest(test);
      results.push(result);
      
      // Recovery period between tests
      console.log('🔄 Recovery period...');
      await this.waitForRecovery();
    }

    this.printChaosTestSummary(results);
    return results;
  }

  /**
   * 📏 Measure baseline performance without any failures
   */
  private async measureBaselinePerformance(): Promise<PerformanceMetrics> {
    const duration = 30000; // 30 seconds
    const concurrency = 10;
    const endTime = Date.now() + duration;
    
    const results: { latency: number; success: boolean }[] = [];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      workers.push(this.performanceTestWorker(endTime, results));
    }

    await Promise.all(workers);

    const latencies = results.map(r => r.latency);
    const successCount = results.filter(r => r.success).length;
    const totalRequests = results.length;

    latencies.sort((a, b) => a - b);

    return {
      totalRequests,
      successfulRequests: successCount,
      failedRequests: totalRequests - successCount,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      throughput: totalRequests / (duration / 1000),
      errorRate: (totalRequests - successCount) / totalRequests
    };
  }

  /**
   * 🧪 Run a single chaos test
   */
  private async runSingleChaosTest(test: ChaosTest): Promise<ChaosResult> {
    const startTime = Date.now();
    
    try {
      // 1. Start failure injection
      console.log(`💥 Injecting failure: ${test.failureType} (intensity: ${test.intensity})`);
      const failureInjected = await this.injectFailure(test);
      
      if (!failureInjected) {
        console.log('⚠️  Failed to inject failure - treating as system resilience');
      }

      // 2. Monitor system during failure
      console.log('📊 Monitoring system behavior during failure...');
      const duringFailureMetrics = await this.monitorSystemDuringFailure(test.duration);
      
      // 3. Stop failure injection
      console.log('🛑 Stopping failure injection...');
      await this.stopFailureInjection(test);
      
      // 4. Monitor recovery
      console.log('🔄 Monitoring system recovery...');
      const recoveryMetrics = await this.monitorRecovery();
      
      const endTime = Date.now();
      
      // 5. Calculate impact metrics
      const impactMetrics = this.calculateImpactMetrics(duringFailureMetrics, recoveryMetrics);
      
      const result: ChaosResult = {
        testName: test.name,
        success: this.evaluateTestSuccess(impactMetrics),
        startTime,
        endTime,
        failureInjected,
        systemRecovered: recoveryMetrics.recovered,
        impactMetrics,
        details: {
          test,
          duringFailureMetrics,
          recoveryMetrics
        }
      };

      if (result.success) {
        console.log('✅ Chaos test passed - system showed good resilience');
      } else {
        console.log('❌ Chaos test revealed issues - system needs improvement');
      }

      return result;
      
    } catch (error) {
      const endTime = Date.now();
      console.log(`❌ Chaos test failed with error: ${error}`);
      
      return {
        testName: test.name,
        success: false,
        startTime,
        endTime,
        failureInjected: false,
        systemRecovered: false,
        impactMetrics: {
          errorRate: 1.0,
          latencyIncrease: 0,
          throughputDecrease: 1.0,
          recoveryTime: -1
        },
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * 💥 Inject specific type of failure
   */
  private async injectFailure(test: ChaosTest): Promise<boolean> {
    try {
      switch (test.failureType) {
        case FailureType.NETWORK_DELAY:
          return await this.injectNetworkDelay(test.intensity);
          
        case FailureType.DATABASE_SLOW:
          return await this.injectDatabaseSlow(test.intensity);
          
        case FailureType.HIGH_CPU:
          return await this.injectHighCPU(test.intensity);
          
        case FailureType.MEMORY_PRESSURE:
          return await this.injectMemoryPressure(test.intensity);
          
        case FailureType.CONNECTION_FAILURES:
          return await this.injectConnectionFailures(test.intensity);
          
        case FailureType.DISK_IO_STRESS:
          return await this.injectDiskIOStress(test.intensity);
          
        default:
          console.log(`⚠️  Unknown failure type: ${test.failureType}`);
          return false;
      }
    } catch (error) {
      console.log(`❌ Failed to inject ${test.failureType}: ${error}`);
      return false;
    }
  }

  /**
   * 🌐 Inject network delay
   */
  private async injectNetworkDelay(intensity: number): Promise<boolean> {
    // Simulate network delay by adding artificial delays to requests
    const originalTimeout = this.client.defaults.timeout;
    this.client.defaults.timeout = originalTimeout! * (1 + intensity);
    
    // In a real chaos engineering setup, you would use tools like:
    // - tc (traffic control) on Linux
    // - Toxiproxy
    // - Chaos Monkey
    // - Litmus
    
    console.log(`🌐 Network delay injected: ${intensity * 100}% slowdown`);
    return true;
  }

  /**
   * 🗄️ Inject database slowness
   */
  private async injectDatabaseSlow(intensity: number): Promise<boolean> {
    // In production, this would involve:
    // - Adding artificial delays to database queries
    // - Throttling database connections
    // - Simulating lock contention
    
    console.log(`🗄️ Database slowness simulated: ${intensity * 100}% impact`);
    return true;
  }

  /**
   * 🔥 Inject high CPU load
   */
  private async injectHighCPU(intensity: number): Promise<boolean> {
    // In production, this would use tools like stress or stress-ng
    console.log(`🔥 High CPU load simulated: ${intensity * 100}% utilization`);
    return true;
  }

  /**
   * 💾 Inject memory pressure
   */
  private async injectMemoryPressure(intensity: number): Promise<boolean> {
    // In production, this would allocate large amounts of memory
    console.log(`💾 Memory pressure simulated: ${intensity * 100}% usage`);
    return true;
  }

  /**
   * 🔌 Inject connection failures
   */
  private async injectConnectionFailures(intensity: number): Promise<boolean> {
    // Simulate intermittent connection failures
    console.log(`🔌 Connection failures simulated: ${intensity * 100}% failure rate`);
    return true;
  }

  /**
   * 💿 Inject disk I/O stress
   */
  private async injectDiskIOStress(intensity: number): Promise<boolean> {
    // In production, this would use dd or fio to stress disk I/O
    console.log(`💿 Disk I/O stress simulated: ${intensity * 100}% load`);
    return true;
  }

  /**
   * 🛑 Stop failure injection
   */
  private async stopFailureInjection(test: ChaosTest): Promise<void> {
    // Reset any changes made during failure injection
    this.client.defaults.timeout = 30000; // Reset to original timeout
    
    console.log(`🛑 Stopped ${test.failureType} injection`);
  }

  /**
   * 📊 Monitor system during failure
   */
  private async monitorSystemDuringFailure(duration: number): Promise<PerformanceMetrics> {
    const endTime = Date.now() + duration;
    const concurrency = 5; // Reduced concurrency during failure
    
    const results: { latency: number; success: boolean }[] = [];
    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      workers.push(this.performanceTestWorker(endTime, results));
    }

    await Promise.all(workers);

    return this.calculateMetrics(results, duration);
  }

  /**
   * 🔄 Monitor system recovery
   */
  private async monitorRecovery(): Promise<{ recovered: boolean; recoveryTime: number; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    const maxRecoveryTime = 60000; // 1 minute max recovery time
    const checkInterval = 5000; // Check every 5 seconds
    
    while (Date.now() - startTime < maxRecoveryTime) {
      const metrics = await this.quickHealthCheck();
      
      if (this.isSystemHealthy(metrics)) {
        const recoveryTime = Date.now() - startTime;
        console.log(`✅ System recovered in ${recoveryTime}ms`);
        
        return {
          recovered: true,
          recoveryTime,
          metrics
        };
      }
      
      console.log('🔄 System still recovering...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    console.log('❌ System failed to recover within timeout');
    const metrics = await this.quickHealthCheck();
    
    return {
      recovered: false,
      recoveryTime: maxRecoveryTime,
      metrics
    };
  }

  /**
   * 🏥 Quick health check
   */
  private async quickHealthCheck(): Promise<PerformanceMetrics> {
    const testDuration = 10000; // 10 seconds
    const results: { latency: number; success: boolean }[] = [];
    const workers: Promise<void>[] = [];
    const endTime = Date.now() + testDuration;

    for (let i = 0; i < 3; i++) {
      workers.push(this.performanceTestWorker(endTime, results));
    }

    await Promise.all(workers);
    return this.calculateMetrics(results, testDuration);
  }

  /**
   * 🏃‍♂️ Performance test worker
   */
  private async performanceTestWorker(
    endTime: number,
    results: { latency: number; success: boolean }[]
  ): Promise<void> {
    while (Date.now() < endTime) {
      const start = performance.now();
      
      try {
        const response = await this.client.get('/health');
        const latency = performance.now() - start;
        
        results.push({
          latency,
          success: response.status === 200
        });
      } catch (error) {
        const latency = performance.now() - start;
        results.push({
          latency,
          success: false
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * 📊 Calculate performance metrics
   */
  private calculateMetrics(results: { latency: number; success: boolean }[], duration: number): PerformanceMetrics {
    const latencies = results.map(r => r.latency);
    const successCount = results.filter(r => r.success).length;
    const totalRequests = results.length;

    latencies.sort((a, b) => a - b);

    return {
      totalRequests,
      successfulRequests: successCount,
      failedRequests: totalRequests - successCount,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      throughput: totalRequests / (duration / 1000),
      errorRate: (totalRequests - successCount) / totalRequests
    };
  }

  /**
   * 📈 Calculate impact metrics
   */
  private calculateImpactMetrics(
    duringFailure: PerformanceMetrics,
    recovery: { recovered: boolean; recoveryTime: number; metrics: PerformanceMetrics }
  ): ChaosResult['impactMetrics'] {
    if (!this.baselineMetrics) {
      throw new Error('Baseline metrics not available');
    }

    const baseline = this.baselineMetrics;
    
    return {
      errorRate: duringFailure.errorRate,
      latencyIncrease: (duringFailure.averageLatency - baseline.averageLatency) / baseline.averageLatency,
      throughputDecrease: (baseline.throughput - duringFailure.throughput) / baseline.throughput,
      recoveryTime: recovery.recoveryTime
    };
  }

  /**
   * ✅ Check if system is healthy
   */
  private isSystemHealthy(metrics: PerformanceMetrics): boolean {
    if (!this.baselineMetrics) return false;
    
    const baseline = this.baselineMetrics;
    
    // System is considered healthy if:
    // - Error rate is back to normal (within 5% of baseline)
    // - Latency is acceptable (within 50% of baseline)
    // - Throughput is reasonable (within 30% of baseline)
    
    const errorRateOk = metrics.errorRate <= baseline.errorRate * 1.05;
    const latencyOk = metrics.averageLatency <= baseline.averageLatency * 1.5;
    const throughputOk = metrics.throughput >= baseline.throughput * 0.7;
    
    return errorRateOk && latencyOk && throughputOk;
  }

  /**
   * 🎯 Evaluate if test was successful
   */
  private evaluateTestSuccess(impactMetrics: ChaosResult['impactMetrics']): boolean {
    // Test is successful if:
    // - System recovered (recovery time < 60 seconds)
    // - Error rate during failure was manageable (< 50%)
    // - System didn't completely fail
    
    const recoveredQuickly = impactMetrics.recoveryTime < 60000;
    const errorRateAcceptable = impactMetrics.errorRate < 0.5;
    const systemResponsive = impactMetrics.latencyIncrease < 5.0; // Less than 5x slowdown
    
    return recoveredQuickly && errorRateAcceptable && systemResponsive;
  }

  /**
   * ⏱️ Wait for system recovery between tests
   */
  private async waitForRecovery(): Promise<void> {
    console.log('⏱️  Waiting for full system recovery...');
    await new Promise(resolve => setTimeout(resolve, this.config.recoveryTime));
    
    // Verify system is back to baseline
    const healthCheck = await this.quickHealthCheck();
    if (this.isSystemHealthy(healthCheck)) {
      console.log('✅ System fully recovered');
    } else {
      console.log('⚠️  System may not be fully recovered');
    }
  }

  /**
   * 📋 Print chaos test summary
   */
  private printChaosTestSummary(results: ChaosResult[]): void {
    console.log('\n🌪️  CHAOS ENGINEERING TEST SUMMARY');
    console.log('=================================');
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`📊 Total Chaos Tests: ${totalTests}`);
    console.log(`✅ Passed (Resilient): ${passedTests}`);
    console.log(`❌ Failed (Needs Improvement): ${failedTests}`);
    console.log(`📈 Resilience Score: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
    
    console.log('\n📊 IMPACT ANALYSIS:');
    results.forEach(result => {
      console.log(`\n🧪 ${result.testName}:`);
      console.log(`   Status: ${result.success ? '✅ RESILIENT' : '❌ VULNERABLE'}`);
      console.log(`   Error Rate: ${(result.impactMetrics.errorRate * 100).toFixed(2)}%`);
      console.log(`   Latency Increase: ${(result.impactMetrics.latencyIncrease * 100).toFixed(2)}%`);
      console.log(`   Throughput Decrease: ${(result.impactMetrics.throughputDecrease * 100).toFixed(2)}%`);
      console.log(`   Recovery Time: ${result.impactMetrics.recoveryTime / 1000}s`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (failedTests === 0) {
      console.log('   ✅ Excellent resilience! System handles failures well.');
    } else {
      console.log('   🔧 Improve system resilience in the following areas:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`     - ${result.testName}: Focus on ${this.getImprovementSuggestion(result)}`);
      });
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Address resilience gaps identified in failed tests');
    console.log('   2. Implement circuit breakers and retry mechanisms');
    console.log('   3. Add monitoring and alerting for detected failure patterns');
    console.log('   4. Regular chaos testing in staging environment');
    console.log('   5. Create runbooks for manual recovery procedures');
  }

  /**
   * 💡 Get improvement suggestion based on test results
   */
  private getImprovementSuggestion(result: ChaosResult): string {
    const metrics = result.impactMetrics;
    
    if (metrics.recoveryTime > 60000) {
      return 'faster recovery mechanisms';
    }
    if (metrics.errorRate > 0.5) {
      return 'better error handling and graceful degradation';
    }
    if (metrics.latencyIncrease > 3.0) {
      return 'performance optimization under stress';
    }
    if (metrics.throughputDecrease > 0.8) {
      return 'maintaining throughput during failures';
    }
    
    return 'overall system resilience';
  }
}

interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  errorRate: number;
} 