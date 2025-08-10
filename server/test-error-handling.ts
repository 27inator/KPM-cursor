import { storage } from './storage';
import { ErrorHandler } from './services/error-handler';
import { 
  ErrorType, 
  ErrorSeverity, 
  ErrorContext 
} from './services/error-handler';

// Test script to create sample error data for demonstration
async function createSampleErrorData() {
  console.log('Creating sample error data...');

  // Create sample error logs
  const errorLogs = [
    {
      operationName: 'blockchain_transaction',
      errorType: ErrorType.BLOCKCHAIN_TRANSACTION,
      severity: ErrorSeverity.HIGH,
      errorMessage: 'INSUFFICIENT_FUNDS: Not enough KAS for transaction',
      companyId: 'comp_1234567890',
      attempts: 3,
      resolved: false,
      context: { endpoint: '/api/events', txid: 'kaspa:tx123' }
    },
    {
      operationName: 'database_query',
      errorType: ErrorType.DATABASE_OPERATION,
      severity: ErrorSeverity.MEDIUM,
      errorMessage: 'Connection timeout to PostgreSQL database',
      companyId: 'comp_0987654321',
      attempts: 2,
      resolved: true,
      context: { query: 'SELECT * FROM events WHERE companyId = ?', table: 'events' }
    },
    {
      operationName: 'external_api_call',
      errorType: ErrorType.EXTERNAL_API,
      severity: ErrorSeverity.LOW,
      errorMessage: 'Rate limit exceeded for Kaspa node API',
      companyId: 'comp_1234567890',
      attempts: 1,
      resolved: false,
      context: { endpoint: 'https://api.kaspa.org/info', method: 'GET' }
    },
    {
      operationName: 'merkle_tree_computation',
      errorType: ErrorType.BLOCKCHAIN_TRANSACTION,
      severity: ErrorSeverity.CRITICAL,
      errorMessage: 'Failed to compute Merkle root for batch commitment',
      companyId: 'comp_1234567890',
      attempts: 5,
      resolved: false,
      context: { batchSize: 100, eventIds: ['event_1', 'event_2'] }
    }
  ];

  for (const errorLog of errorLogs) {
    await storage.createErrorLog(errorLog);
  }

  // Create sample dead letter queue items
  const deadLetterItems = [
    {
      operationId: 'op_blockchain_tx_001',
      operationName: 'blockchain_transaction',
      attempts: 3,
      lastError: 'NETWORK_ERROR: Connection refused to Kaspa node',
      status: 'failed',
      payload: { eventId: 'event_123', txData: 'raw_tx_data' },
      nextRetryAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      context: {
        type: ErrorType.BLOCKCHAIN_TRANSACTION,
        severity: ErrorSeverity.HIGH,
        companyId: 'comp_1234567890',
        endpoint: '/api/events'
      }
    },
    {
      operationId: 'op_database_insert_002',
      operationName: 'database_insert',
      attempts: 2,
      lastError: 'CONSTRAINT_VIOLATION: Duplicate key value violates unique constraint',
      status: 'failed',
      payload: { table: 'events', data: { eventId: 'event_duplicate' } },
      nextRetryAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      context: {
        type: ErrorType.DATABASE_OPERATION,
        severity: ErrorSeverity.MEDIUM,
        companyId: 'comp_0987654321',
        endpoint: '/api/events'
      }
    }
  ];

  for (const item of deadLetterItems) {
    await storage.addToDeadLetterQueue(item);
  }

  // Create sample system metrics
  const systemMetrics = [
    {
      metricType: 'performance',
      metricName: 'uptime',
      value: 99.95,
      unit: '%',
      timestamp: new Date()
    },
    {
      metricType: 'performance',
      metricName: 'response_time',
      value: 145.2,
      unit: 'ms',
      timestamp: new Date()
    },
    {
      metricType: 'usage',
      metricName: 'active_connections',
      value: 42,
      unit: 'count',
      timestamp: new Date()
    },
    {
      metricType: 'usage',
      metricName: 'memory_usage',
      value: 67.8,
      unit: '%',
      timestamp: new Date()
    },
    {
      metricType: 'blockchain',
      metricName: 'transactions_per_hour',
      value: 156,
      unit: 'tx/h',
      timestamp: new Date()
    },
    {
      metricType: 'blockchain',
      metricName: 'gas_price',
      value: 0.00001,
      unit: 'KAS',
      timestamp: new Date()
    }
  ];

  for (const metric of systemMetrics) {
    await storage.createSystemMetric(metric);
  }

  console.log('Sample error data created successfully!');
  console.log(`- Created ${errorLogs.length} error logs`);
  console.log(`- Created ${deadLetterItems.length} dead letter queue items`);
  console.log(`- Created ${systemMetrics.length} system metrics`);
}

// Test error handling functionality
async function testErrorHandling() {
  console.log('\n=== Testing Error Handling Functionality ===');

  // Test 1: Blockchain transaction error
  console.log('\n1. Testing blockchain transaction error handling...');
  try {
    await ErrorHandler.handleBlockchainTransaction(
      async () => {
        throw new Error('INSUFFICIENT_FUNDS');
      },
      {
        companyId: 'comp_test',
        endpoint: '/api/test/blockchain-error',
        metadata: { testOperation: true }
      }
    );
  } catch (error) {
    console.log('✓ Blockchain error handled correctly:', error.message);
  }

  // Test 2: Database operation error
  console.log('\n2. Testing database operation error handling...');
  try {
    await ErrorHandler.handleDatabaseOperation(
      async () => {
        throw new Error('CONNECTION_TIMEOUT');
      },
      {
        companyId: 'comp_test',
        endpoint: '/api/test/database-error',
        metadata: { table: 'events', operation: 'SELECT' }
      }
    );
  } catch (error) {
    console.log('✓ Database error handled correctly:', error.message);
  }

  // Test 3: External API error
  console.log('\n3. Testing external API error handling...');
  try {
    await ErrorHandler.handleExternalAPI(
      async () => {
        throw new Error('RATE_LIMIT_EXCEEDED');
      },
      {
        companyId: 'comp_test',
        endpoint: '/api/test/external-api-error',
        metadata: { service: 'kaspa-node', method: 'GET' }
      }
    );
  } catch (error) {
    console.log('✓ External API error handled correctly:', error.message);
  }

  // Test 4: Check error handler stats
  console.log('\n4. Getting error handler statistics...');
  const stats = ErrorHandler.getStats();
  console.log('Error handler stats:', JSON.stringify(stats, null, 2));

  // Test 5: Check failed operations
  console.log('\n5. Getting failed operations...');
  const failedOps = ErrorHandler.getFailedOperations();
  console.log(`Found ${failedOps.length} failed operations`);
  failedOps.forEach((op, index) => {
    console.log(`  ${index + 1}. ${op.operation} - ${op.attempts} attempts`);
  });
}

// Main execution
async function main() {
  try {
    await createSampleErrorData();
    await testErrorHandling();
    console.log('\n=== Test completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createSampleErrorData, testErrorHandling };