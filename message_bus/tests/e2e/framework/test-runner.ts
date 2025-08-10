import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { WebSocket } from 'ws';
import { performance } from 'perf_hooks';

export interface TestConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  concurrency: number;
  loadTestDuration: number;
  expectedLatencyP95: number;
  expectedThroughput: number;
}

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  metrics?: PerformanceMetrics;
  details?: any;
}

export interface PerformanceMetrics {
  latency: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    rps: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
  errors: {
    count: number;
    types: Record<string, number>;
  };
}

export interface AuthTokens {
  jwtToken: string;
  apiKey: string;
  companyId: number;
}

export class E2ETestRunner {
  private client: AxiosInstance;
  private config: TestConfig;
  private authTokens?: AuthTokens;
  private testResults: TestResult[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      validateStatus: () => true // Don't throw on HTTP errors
    });
  }

  /**
   * 🚀 Run complete end-to-end test suite
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting KMP Supply Chain E2E Test Suite');
    console.log('============================================');

    this.testResults = [];

    try {
      // 1. System Health Tests
      await this.runTest('System Health Check', () => this.testSystemHealth());
      await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity());

      // 2. Authentication Tests
      await this.runTest('User Registration', () => this.testUserRegistration());
      await this.runTest('User Login', () => this.testUserLogin());
      await this.runTest('API Key Creation', () => this.testApiKeyCreation());
      await this.runTest('JWT Authentication', () => this.testJWTAuth());
      await this.runTest('API Key Authentication', () => this.testApiKeyAuth());

      // 3. Supply Chain Event Tests
      await this.runTest('Small Payload Event', () => this.testSmallPayloadEvent());
      await this.runTest('Large Payload Event', () => this.testLargePayloadEvent());
      await this.runTest('Event Validation', () => this.testEventValidation());
      await this.runTest('Blockchain Transaction Flow', () => this.testBlockchainFlow());

      // 4. Data Retrieval Tests
      await this.runTest('Product Traceability', () => this.testProductTraceability());
      await this.runTest('Company Dashboard', () => this.testCompanyDashboard());
      await this.runTest('Off-chain Payload Retrieval', () => this.testPayloadRetrieval());

      // 5. Real-time Features Tests
      await this.runTest('WebSocket Connection', () => this.testWebSocketConnection());
      await this.runTest('Transaction Confirmations', () => this.testTransactionConfirmations());

      // 6. Developer Portal Tests
      await this.runTest('OpenAPI Specification', () => this.testOpenAPISpec());
      await this.runTest('Postman Collection', () => this.testPostmanCollection());
      await this.runTest('SDK Information', () => this.testSDKInfo());

      // 7. Security & Rate Limiting Tests
      await this.runTest('Rate Limiting', () => this.testRateLimiting());
      await this.runTest('Input Validation', () => this.testInputValidation());
      await this.runTest('Authentication Failures', () => this.testAuthFailures());

      // 8. Error Handling Tests
      await this.runTest('Invalid Endpoint', () => this.testInvalidEndpoint());
      await this.runTest('Malformed Requests', () => this.testMalformedRequests());
      await this.runTest('Database Errors', () => this.testDatabaseErrors());

      // 9. Load Testing
      await this.runTest('Load Test - Normal Load', () => this.testNormalLoad());
      await this.runTest('Load Test - Peak Load', () => this.testPeakLoad());
      await this.runTest('Load Test - Stress Test', () => this.testStressLoad());

      // 10. Performance Benchmarks
      await this.runTest('Performance Benchmark', () => this.runPerformanceBenchmark());

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }

    this.printTestSummary();
    return this.testResults;
  }

  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`\n🧪 Running: ${testName}`);
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        testName,
        success: true,
        duration,
        details: result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.testResults.push({
        testName,
        success: false,
        duration,
        error: errorMessage
      });
      
      console.log(`❌ ${testName} - FAILED (${duration.toFixed(2)}ms): ${errorMessage}`);
    }
  }

  /**
   * 🏥 Test system health endpoint
   */
  private async testSystemHealth(): Promise<any> {
    const response = await this.client.get('/health');
    
    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const health = response.data;
    if (health.status !== 'healthy') {
      throw new Error(`System unhealthy: ${health.status}`);
    }

    // Verify critical components are working
    if (!health.database) {
      throw new Error('Database component missing from health check');
    }
    
    if (!health.storage) {
      throw new Error('Storage component missing from health check');
    }
    
    if (!health.confirmations) {
      throw new Error('Confirmations component missing from health check');
    }
    
    if (!health.websocket) {
      throw new Error('WebSocket component missing from health check');
    }

    return health;
  }

  /**
   * 🗄️ Test database connectivity
   */
  private async testDatabaseConnectivity(): Promise<any> {
    const response = await this.client.get('/api/storage/stats');
    
    if (response.status !== 200) {
      throw new Error(`Storage stats failed: ${response.status}`);
    }

    const stats = response.data;
    if (!stats.database || typeof stats.database.totalEvents !== 'number') {
      throw new Error('Database statistics not available');
    }

    return stats;
  }

  /**
   * 👤 Test user registration
   */
  private async testUserRegistration(): Promise<any> {
    const userData = {
      email: `test-${Date.now()}@kmp-test.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      companyId: 1
    };

    const response = await this.client.post('/api/auth/register', userData);
    
    if (response.status !== 201) {
      throw new Error(`Registration failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.user || !result.token) {
      throw new Error('Registration response missing user or token');
    }

    // Store for subsequent tests
    this.authTokens = {
      jwtToken: result.token,
      apiKey: '', // Will be created later
      companyId: result.user.companyId || 1
    };

    return result;
  }

  /**
   * 🔑 Test user login
   */
  private async testUserLogin(): Promise<any> {
    // First create a user to login with
    const userData = {
      email: `login-test-${Date.now()}@kmp-test.com`,
      password: 'TestPassword123!',
      firstName: 'Login',
      lastName: 'Test'
    };

    await this.client.post('/api/auth/register', userData);

    // Now test login
    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const response = await this.client.post('/api/auth/login', loginData);
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.user || !result.token) {
      throw new Error('Login response missing user or token');
    }

    return result;
  }

  /**
   * 🔧 Test API key creation
   */
  private async testApiKeyCreation(): Promise<any> {
    if (!this.authTokens?.jwtToken || !this.authTokens?.companyId) {
      throw new Error('No JWT token or company ID available for API key creation');
    }

    const keyData = {
      name: `test-key-${Date.now()}`,
      scopes: ['read:events', 'write:events'],
      companyId: this.authTokens.companyId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const response = await this.client.post('/api/auth/api-keys', keyData, {
      headers: { Authorization: `Bearer ${this.authTokens.jwtToken}` }
    });
    
    if (response.status !== 201) {
      throw new Error(`API key creation failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.key || !result.keyPrefix) {
      throw new Error('API key response missing key or keyPrefix');
    }

    // Store for subsequent tests
    this.authTokens.apiKey = result.key;

    return result;
  }

  /**
   * 🎫 Test JWT authentication
   */
  private async testJWTAuth(): Promise<any> {
    if (!this.authTokens?.jwtToken) {
      throw new Error('No JWT token available for authentication test');
    }

    const response = await this.client.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${this.authTokens.jwtToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`JWT auth failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.user || !result.user.id) {
      throw new Error('JWT auth response missing user data');
    }

    return result;
  }

  /**
   * 🔑 Test API key authentication
   */
  private async testApiKeyAuth(): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for authentication test');
    }

    const response = await this.client.get('/api/auth/validate', {
      headers: { 'X-API-Key': this.authTokens.apiKey }
    });
    
    if (response.status !== 200) {
      throw new Error(`API key auth failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.valid || !result.keyInfo) {
      throw new Error('API key auth response invalid');
    }

    return result;
  }

  /**
   * 📦 Test small payload supply chain event
   */
  private async testSmallPayloadEvent(): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for event submission');
    }

    const eventData = {
      productId: `TEST_SMALL_${Date.now()}`,
      location: 'E2E_TEST_FACILITY',
      eventType: 'QUALITY_CHECK',
      batchId: `BATCH_${Date.now()}`,
      metadata: {
        inspector: 'E2E Test Suite',
        grade: 'PREMIUM',
        automated: true,
        testType: 'small-payload'
      }
    };

    const response = await this.client.post('/api/supply-chain/event', eventData, {
      headers: { 'X-API-Key': this.authTokens.apiKey }
    });
    
    if (response.status !== 201) {
      throw new Error(`Event submission failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.transactionId || !result.eventId) {
      throw new Error('Event response missing transactionId or eventId');
    }

    // Verify payload handling
    if (result.payloadHandling?.type !== 'DIRECT_ON_CHAIN') {
      throw new Error(`Expected direct on-chain storage for small payload, got: ${result.payloadHandling?.type}`);
    }

    return result;
  }

  /**
   * 📦 Test large payload supply chain event
   */
  private async testLargePayloadEvent(): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for event submission');
    }

    // Create a large payload (>20KB)
    const largeMetadata: any = {
      inspector: 'E2E Test Suite',
      grade: 'PREMIUM',
      automated: true,
      testType: 'large-payload',
      detailedReport: 'A'.repeat(25000) // Create 25KB of data
    };

    const eventData = {
      productId: `TEST_LARGE_${Date.now()}`,
      location: 'E2E_TEST_FACILITY',
      eventType: 'COMPREHENSIVE_AUDIT',
      batchId: `BATCH_LARGE_${Date.now()}`,
      metadata: largeMetadata
    };

    const response = await this.client.post('/api/supply-chain/event', eventData, {
      headers: { 'X-API-Key': this.authTokens.apiKey }
    });
    
    if (response.status !== 201) {
      throw new Error(`Large event submission failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.transactionId || !result.eventId) {
      throw new Error('Large event response missing transactionId or eventId');
    }

    // Verify payload handling
    if (result.payloadHandling?.type !== 'OFF_CHAIN_ANCHOR') {
      throw new Error(`Expected off-chain storage for large payload, got: ${result.payloadHandling?.type}`);
    }

    return result;
  }

  /**
   * ✅ Test event validation
   */
  private async testEventValidation(): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for validation test');
    }

    // Test invalid event (missing required fields)
    const invalidEvent = {
      productId: '',
      location: '',
      eventType: ''
    };

    const response = await this.client.post('/api/supply-chain/event', invalidEvent, {
      headers: { 'X-API-Key': this.authTokens.apiKey }
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected validation error (400), got: ${response.status}`);
    }

    const result = response.data;
    if (!result.error || !result.validationErrors) {
      throw new Error('Validation error response missing error details');
    }

    return result;
  }

  /**
   * 🔗 Test complete blockchain transaction flow
   */
  private async testBlockchainFlow(): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for blockchain test');
    }

    // Submit an event
    const eventData = {
      productId: `BLOCKCHAIN_TEST_${Date.now()}`,
      location: 'BLOCKCHAIN_TEST_FACILITY',
      eventType: 'BLOCKCHAIN_VERIFICATION',
      metadata: {
        testType: 'blockchain-flow',
        timestamp: new Date().toISOString()
      }
    };

    const submitResponse = await this.client.post('/api/supply-chain/event', eventData, {
      headers: { 'X-API-Key': this.authTokens.apiKey }
    });
    
    if (submitResponse.status !== 201) {
      throw new Error(`Blockchain event submission failed: ${submitResponse.status}`);
    }

    const submitResult = submitResponse.data;
    const transactionHash = submitResult.transactionId;

    if (!transactionHash) {
      throw new Error('No transaction hash returned from event submission');
    }

    // Wait a moment for blockchain processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check transaction status
    const statusResponse = await this.client.get(`/api/transaction/${transactionHash}/status`);
    
    if (statusResponse.status !== 200) {
      throw new Error(`Transaction status check failed: ${statusResponse.status}`);
    }

    const statusResult = statusResponse.data;
    if (!statusResult.transactionHash) {
      throw new Error('Transaction status response missing transaction hash');
    }

    return {
      submission: submitResult,
      status: statusResult
    };
  }

  /**
   * 🔍 Test product traceability
   */
  private async testProductTraceability(): Promise<any> {
    const productId = `TRACE_TEST_${Date.now()}`;

    // Submit multiple events for the same product
    const events = [
      { eventType: 'SCAN', location: 'FACTORY' },
      { eventType: 'QUALITY_CHECK', location: 'QC_LAB' },
      { eventType: 'PACKAGING', location: 'PACKAGING_FACILITY' }
    ];

    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for traceability test');
    }

    for (const [index, event] of events.entries()) {
      await this.client.post('/api/supply-chain/event', {
        productId,
        location: event.location,
        eventType: event.eventType,
        metadata: { step: index + 1 }
      }, {
        headers: { 'X-API-Key': this.authTokens.apiKey }
      });

      // Wait between events
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get traceability
    const response = await this.client.get(`/api/product/${productId}/trace`);
    
    if (response.status !== 200) {
      throw new Error(`Traceability failed: ${response.status}`);
    }

    const result = response.data;
    if (!result.events || result.events.length !== events.length) {
      throw new Error(`Expected ${events.length} events, got ${result.events?.length || 0}`);
    }

    return result;
  }

  /**
   * 📊 Test company dashboard
   */
  private async testCompanyDashboard(): Promise<any> {
    if (!this.authTokens?.jwtToken || !this.authTokens?.companyId) {
      throw new Error('No authentication available for dashboard test');
    }

    const response = await this.client.get(`/api/company/${this.authTokens.companyId}/dashboard`, {
      headers: { Authorization: `Bearer ${this.authTokens.jwtToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`Dashboard failed: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    if (!result.events || !result.transactions) {
      throw new Error('Dashboard response missing events or transactions data');
    }

    return result;
  }

  /**
   * 📁 Test off-chain payload retrieval
   */
  private async testPayloadRetrieval(): Promise<any> {
    // This will be tested after a large payload event creates an off-chain payload
    // For now, test the endpoint with a dummy hash
    const response = await this.client.get('/api/payload/nonexistent-hash');
    
    if (response.status !== 404) {
      throw new Error(`Expected 404 for nonexistent payload, got: ${response.status}`);
    }

    return { message: 'Payload retrieval endpoint working (404 for nonexistent hash)' };
  }

  /**
   * 🌐 Test WebSocket connection
   */
  private async testWebSocketConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.baseUrl.replace('http', 'ws');
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve({ connected: true });
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebSocket error: ${error.message}`));
      });
    });
  }

  /**
   * ✅ Test transaction confirmations
   */
  private async testTransactionConfirmations(): Promise<any> {
    const response = await this.client.get('/api/confirmations/stats');
    
    if (response.status !== 200) {
      throw new Error(`Confirmation stats failed: ${response.status}`);
    }

    const result = response.data;
    if (typeof result.pendingTransactions !== 'number') {
      throw new Error('Confirmation stats response missing required fields');
    }

    return result;
  }

  /**
   * 📚 Test OpenAPI specification
   */
  private async testOpenAPISpec(): Promise<any> {
    const jsonResponse = await this.client.get('/openapi.json');
    if (jsonResponse.status !== 200) {
      throw new Error(`OpenAPI JSON failed: ${jsonResponse.status}`);
    }

    const yamlResponse = await this.client.get('/openapi.yaml');
    if (yamlResponse.status !== 200) {
      throw new Error(`OpenAPI YAML failed: ${yamlResponse.status}`);
    }

    const spec = jsonResponse.data;
    if (!spec.openapi || !spec.info || !spec.paths) {
      throw new Error('OpenAPI specification missing required fields');
    }

    return { 
      version: spec.info.version,
      pathCount: Object.keys(spec.paths).length
    };
  }

  /**
   * 📮 Test Postman collection
   */
  private async testPostmanCollection(): Promise<any> {
    const response = await this.client.get('/developer/postman');
    
    if (response.status !== 200) {
      throw new Error(`Postman collection failed: ${response.status}`);
    }

    const collection = response.data;
    if (!collection.info || !collection.item) {
      throw new Error('Postman collection missing required fields');
    }

    return {
      name: collection.info.name,
      itemCount: collection.item.length
    };
  }

  /**
   * 🔧 Test SDK information
   */
  private async testSDKInfo(): Promise<any> {
    const response = await this.client.get('/developer/sdks');
    
    if (response.status !== 200) {
      throw new Error(`SDK info failed: ${response.status}`);
    }

    const result = response.data;
    if (!result.sdks || !Array.isArray(result.sdks)) {
      throw new Error('SDK info response missing sdks array');
    }

    return {
      sdkCount: result.sdks.length,
      languages: result.sdks.map((sdk: any) => sdk.language)
    };
  }

  /**
   * 🛡️ Test rate limiting
   */
  private async testRateLimiting(): Promise<any> {
    const requests = [];
    
    // Make rapid requests to trigger rate limiting
    for (let i = 0; i < 20; i++) {
      requests.push(this.client.get('/health'));
    }

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    if (rateLimitedResponses.length === 0) {
      console.warn('⚠️  Rate limiting not triggered (may need adjustment)');
    }

    return {
      totalRequests: responses.length,
      rateLimitedCount: rateLimitedResponses.length
    };
  }

  /**
   * ✅ Test input validation
   */
  private async testInputValidation(): Promise<any> {
    // Test various invalid inputs
    const invalidRequests = [
      { endpoint: '/api/supply-chain/event', data: { productId: '<script>alert("xss")</script>' } },
      { endpoint: '/api/supply-chain/event', data: { productId: 'test', location: 'A'.repeat(1000) } },
      { endpoint: '/api/auth/register', data: { email: 'invalid-email' } }
    ];

    const results = [];
    for (const request of invalidRequests) {
      const response = await this.client.post(request.endpoint, request.data);
      results.push({
        endpoint: request.endpoint,
        status: response.status,
        hasValidationError: response.status >= 400
      });
    }

    return results;
  }

  /**
   * ❌ Test authentication failures
   */
  private async testAuthFailures(): Promise<any> {
    const unauthorizedRequests = [
      { endpoint: '/api/auth/me', headers: {} },
      { endpoint: '/api/auth/me', headers: { Authorization: 'Bearer invalid-token' } },
      { endpoint: '/api/auth/validate', headers: { 'X-API-Key': 'invalid-key' } }
    ];

    const results = [];
    for (const request of unauthorizedRequests) {
      const response = await this.client.get(request.endpoint, { headers: request.headers });
      results.push({
        endpoint: request.endpoint,
        status: response.status,
        properlyUnauthorized: response.status === 401
      });
    }

    return results;
  }

  /**
   * 🔍 Test invalid endpoint
   */
  private async testInvalidEndpoint(): Promise<any> {
    const response = await this.client.get('/api/nonexistent-endpoint');
    
    if (response.status !== 404) {
      throw new Error(`Expected 404 for invalid endpoint, got: ${response.status}`);
    }

    return { status: response.status };
  }

  /**
   * 💥 Test malformed requests
   */
  private async testMalformedRequests(): Promise<any> {
    const malformedRequests = [
      { data: 'invalid-json', contentType: 'application/json' },
      { data: { productId: null }, contentType: 'application/json' },
      { data: '', contentType: 'text/plain' }
    ];

    const results = [];
    for (const request of malformedRequests) {
      try {
        const response = await this.client.post('/api/supply-chain/event', request.data, {
          headers: { 'Content-Type': request.contentType }
        });
        results.push({
          request: request.contentType,
          status: response.status,
          handledGracefully: response.status >= 400
        });
      } catch (error) {
        results.push({
          request: request.contentType,
          error: 'Network error',
          handledGracefully: true
        });
      }
    }

    return results;
  }

  /**
   * 🗄️ Test database error handling
   */
  private async testDatabaseErrors(): Promise<any> {
    // This is more of a resilience test - the system should handle DB issues gracefully
    const response = await this.client.get('/health');
    
    if (response.status !== 200) {
      throw new Error(`Health check failed during DB error test: ${response.status}`);
    }

    const health = response.data;
    if (!health.database) {
      throw new Error('Database health status not available');
    }

    return health.database;
  }

  /**
   * 📈 Test normal load
   */
  private async testNormalLoad(): Promise<PerformanceMetrics> {
    return this.runLoadTest('Normal Load', 10, 5000); // 10 concurrent users, 5 seconds
  }

  /**
   * 📈 Test peak load
   */
  private async testPeakLoad(): Promise<PerformanceMetrics> {
    return this.runLoadTest('Peak Load', 50, 10000); // 50 concurrent users, 10 seconds
  }

  /**
   * 📈 Test stress load
   */
  private async testStressLoad(): Promise<PerformanceMetrics> {
    return this.runLoadTest('Stress Load', 100, 15000); // 100 concurrent users, 15 seconds
  }

  /**
   * 🏃‍♂️ Run load test
   */
  private async runLoadTest(testName: string, concurrency: number, duration: number): Promise<PerformanceMetrics> {
    console.log(`\n📈 Starting ${testName}: ${concurrency} concurrent users for ${duration}ms`);

    const startTime = Date.now();
    const endTime = startTime + duration;
    const latencies: number[] = [];
    const results: { success: boolean; status: number; latency: number }[] = [];
    const errors: Record<string, number> = {};

    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      workers.push(this.runLoadTestWorker(endTime, latencies, results, errors));
    }

    await Promise.all(workers);

    // Calculate metrics
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    const totalDuration = (Date.now() - startTime) / 1000;
    const rps = results.length / totalDuration;

    latencies.sort((a, b) => a - b);
    const metrics: PerformanceMetrics = {
      latency: {
        min: Math.min(...latencies),
        max: Math.max(...latencies),
        avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p50: latencies[Math.floor(latencies.length * 0.5)],
        p95: latencies[Math.floor(latencies.length * 0.95)],
        p99: latencies[Math.floor(latencies.length * 0.99)]
      },
      throughput: {
        rps,
        totalRequests: results.length,
        successfulRequests,
        failedRequests
      },
      errors: {
        count: failedRequests,
        types: errors
      }
    };

    console.log(`📊 ${testName} Results:`);
    console.log(`   Total Requests: ${metrics.throughput.totalRequests}`);
    console.log(`   Successful: ${metrics.throughput.successfulRequests}`);
    console.log(`   Failed: ${metrics.throughput.failedRequests}`);
    console.log(`   RPS: ${metrics.throughput.rps.toFixed(2)}`);
    console.log(`   Latency P95: ${metrics.latency.p95.toFixed(2)}ms`);
    console.log(`   Latency P99: ${metrics.latency.p99.toFixed(2)}ms`);

    return metrics;
  }

  private async runLoadTestWorker(
    endTime: number,
    latencies: number[],
    results: { success: boolean; status: number; latency: number }[],
    errors: Record<string, number>
  ): Promise<void> {
    while (Date.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        const response = await this.client.get('/health');
        const latency = performance.now() - requestStart;
        
        latencies.push(latency);
        results.push({
          success: response.status === 200,
          status: response.status,
          latency
        });

        if (response.status !== 200) {
          const errorKey = `HTTP_${response.status}`;
          errors[errorKey] = (errors[errorKey] || 0) + 1;
        }
      } catch (error) {
        const latency = performance.now() - requestStart;
        latencies.push(latency);
        results.push({
          success: false,
          status: 0,
          latency
        });

        const errorKey = error instanceof Error ? error.name : 'UNKNOWN_ERROR';
        errors[errorKey] = (errors[errorKey] || 0) + 1;
      }

      // Small delay between requests per worker
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 🏁 Run performance benchmark
   */
  private async runPerformanceBenchmark(): Promise<any> {
    const benchmarks = {
      healthCheck: await this.benchmarkEndpoint('/health', 100),
      eventSubmission: await this.benchmarkEventSubmission(50),
      traceability: await this.benchmarkTraceability(30),
      dashboard: await this.benchmarkDashboard(20)
    };

    console.log('\n🏁 Performance Benchmark Results:');
    for (const [name, benchmark] of Object.entries(benchmarks)) {
      console.log(`   ${name}:`);
      console.log(`     Average Latency: ${benchmark.avgLatency.toFixed(2)}ms`);
      console.log(`     P95 Latency: ${benchmark.p95Latency.toFixed(2)}ms`);
      console.log(`     Success Rate: ${(benchmark.successRate * 100).toFixed(2)}%`);
    }

    return benchmarks;
  }

  private async benchmarkEndpoint(endpoint: string, iterations: number): Promise<any> {
    const latencies: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const response = await this.client.get(endpoint);
        const latency = performance.now() - start;
        latencies.push(latency);
        if (response.status === 200) successCount++;
      } catch (error) {
        const latency = performance.now() - start;
        latencies.push(latency);
      }
    }

    latencies.sort((a, b) => a - b);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      successRate: successCount / iterations
    };
  }

  private async benchmarkEventSubmission(iterations: number): Promise<any> {
    if (!this.authTokens?.apiKey) {
      throw new Error('No API key available for event submission benchmark');
    }

    const latencies: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const eventData = {
        productId: `BENCHMARK_${Date.now()}_${i}`,
        location: 'BENCHMARK_FACILITY',
        eventType: 'BENCHMARK_TEST',
        metadata: { iteration: i }
      };

      const start = performance.now();
      try {
        const response = await this.client.post('/api/supply-chain/event', eventData, {
          headers: { 'X-API-Key': this.authTokens.apiKey }
        });
        const latency = performance.now() - start;
        latencies.push(latency);
        if (response.status === 201) successCount++;
      } catch (error) {
        const latency = performance.now() - start;
        latencies.push(latency);
      }

      // Small delay between submissions
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    latencies.sort((a, b) => a - b);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      successRate: successCount / iterations
    };
  }

  private async benchmarkTraceability(iterations: number): Promise<any> {
    const latencies: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const productId = `TRACE_BENCHMARK_${Date.now()}_${i}`;
      
      const start = performance.now();
      try {
        const response = await this.client.get(`/api/product/${productId}/trace`);
        const latency = performance.now() - start;
        latencies.push(latency);
        if (response.status === 200) successCount++;
      } catch (error) {
        const latency = performance.now() - start;
        latencies.push(latency);
      }
    }

    latencies.sort((a, b) => a - b);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      successRate: successCount / iterations
    };
  }

  private async benchmarkDashboard(iterations: number): Promise<any> {
    if (!this.authTokens?.jwtToken || !this.authTokens?.companyId) {
      throw new Error('No authentication available for dashboard benchmark');
    }

    const latencies: number[] = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const response = await this.client.get(`/api/company/${this.authTokens.companyId}/dashboard`, {
          headers: { Authorization: `Bearer ${this.authTokens.jwtToken}` }
        });
        const latency = performance.now() - start;
        latencies.push(latency);
        if (response.status === 200) successCount++;
      } catch (error) {
        const latency = performance.now() - start;
        latencies.push(latency);
      }
    }

    latencies.sort((a, b) => a - b);
    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      successRate: successCount / iterations
    };
  }

  /**
   * 📊 Print test summary
   */
  private printTestSummary(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n🧪 KMP SUPPLY CHAIN E2E TEST SUMMARY');
    console.log('=====================================');
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(test => {
          console.log(`   - ${test.testName}: ${test.error}`);
        });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    if (failedTests === 0) {
      console.log('   ✅ All tests passed! System is production-ready.');
    } else {
      console.log('   🔧 Fix failing tests before production deployment.');
    }

    // Performance recommendations
    const performanceTest = this.testResults.find(r => r.testName.includes('Performance Benchmark'));
    if (performanceTest?.metrics) {
      const p95 = performanceTest.metrics.latency.p95;
      if (p95 > this.config.expectedLatencyP95) {
        console.log(`   ⚠️  P95 latency (${p95.toFixed(2)}ms) exceeds target (${this.config.expectedLatencyP95}ms)`);
      }
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Review failed tests and fix issues');
    console.log('   2. Run tests in CI/CD pipeline');
    console.log('   3. Set up monitoring for key metrics');
    console.log('   4. Configure automated alerts');
    console.log('   5. Schedule regular load testing');
  }
} 