/**
 * 🚀 KMP Supply Chain API - TypeScript SDK Example
 * 
 * This example demonstrates how to use the generated TypeScript SDK
 * to interact with the KMP Supply Chain API.
 * 
 * ⚠️ PREREQUISITE: Generate the TypeScript SDK first:
 *    npm run generate:sdks
 *    or manually: openapi-generator generate -i http://localhost:4000/openapi.json -g typescript-fetch -o ./generated-sdks/typescript-fetch
 */

// NOTE: Import will work after SDK generation
// @ts-ignore - SDK will be generated
import { DefaultApi, Configuration, SupplyChainEvent } from '@kmp/supply-chain-sdk';

class KMPSupplyChainClient {
  private api: DefaultApi;

  constructor(config: {
    baseUrl?: string;
    apiKey?: string;
    jwtToken?: string;
  }) {
    const configuration = new Configuration({
      basePath: config.baseUrl || 'http://localhost:4000',
      apiKey: config.apiKey,
      accessToken: config.jwtToken,
    });

    this.api = new DefaultApi(configuration);
  }

  /**
   * 📝 Register a new user
   */
  async registerUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyId?: number;
  }) {
    try {
      const response = await this.api.apiAuthRegisterPost({
        userRegistration: userData
      });
      
      console.log('✅ User registered successfully:', response.user);
      return response;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  /**
   * 🔑 Login user and get JWT token
   */
  async loginUser(credentials: { email: string; password: string }) {
    try {
      const response = await this.api.apiAuthLoginPost({
        userLogin: credentials
      });
      
      console.log('✅ Login successful');
      console.log('🎫 JWT Token:', response.token);
      
      // Update the API configuration with the new token
      this.updateToken(response.token);
      
      return response;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * 🔧 Create API key for programmatic access
   */
  async createApiKey(keyData: {
    name: string;
    scopes: string[];
    expiresAt?: string;
  }) {
    try {
      const response = await this.api.apiAuthApiKeysPost({
        apiKeyCreate: keyData
      });
      
      console.log('✅ API Key created successfully');
      console.log('🔑 Key:', response.key);
      console.log('🏷️ Prefix:', response.keyPrefix);
      
      return response;
    } catch (error) {
      console.error('❌ API Key creation failed:', error);
      throw error;
    }
  }

  /**
   * 📦 Submit supply chain event
   */
  async submitSupplyChainEvent(eventData: {
    productId: string;
    location: string;
    eventType: string;
    batchId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await this.api.apiSupplyChainEventPost({
        supplyChainEvent: eventData as SupplyChainEvent
      });
      
      console.log('✅ Supply chain event submitted successfully!');
      console.log('📋 Transaction ID:', response.transactionId);
      console.log('🌐 Explorer Link:', response.blockchainExplorer);
      console.log('💰 Fee Info:', response.fees);
      console.log('📊 Payload Handling:', response.payloadHandling);
      
      return response;
    } catch (error) {
      console.error('❌ Event submission failed:', error);
      throw error;
    }
  }

  /**
   * 🔍 Get product traceability
   */
  async getProductTrace(productId: string) {
    try {
      const response = await this.api.apiProductProductIdTraceGet({
        productId
      });
      
      console.log(`🔍 Traceability for product ${productId}:`);
      console.log(`📊 Total events: ${response.totalEvents}`);
      
      response.events?.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.eventType} at ${event.location} (${event.timestamp})`);
        console.log(`     Status: ${event.status}, TX: ${event.transactionHash?.substring(0, 16)}...`);
      });
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get product trace:', error);
      throw error;
    }
  }

  /**
   * 📊 Get company dashboard
   */
  async getCompanyDashboard(companyId: number, days: number = 30) {
    try {
      const response = await this.api.apiCompanyCompanyIdDashboardGet({
        companyId,
        days
      });
      
      console.log(`📊 Company ${companyId} Dashboard (${days} days):`);
      console.log('📈 Event Stats:', response.events);
      console.log('💰 Transaction Stats:', response.transactions);
      console.log('📝 Recent Events:', response.recentEvents?.length);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get dashboard:', error);
      throw error;
    }
  }

  /**
   * 🔍 Check transaction status
   */
  async getTransactionStatus(transactionHash: string) {
    try {
      const response = await this.api.apiTransactionTransactionHashStatusGet({
        transactionHash
      });
      
      console.log(`🔍 Transaction ${transactionHash.substring(0, 16)}... Status:`);
      console.log(`📊 Status: ${response.status}`);
      console.log(`✅ Confirmations: ${response.confirmations}`);
      console.log(`🏗️ Block Height: ${response.blockHeight}`);
      
      return response;
    } catch (error) {
      console.error('❌ Failed to get transaction status:', error);
      throw error;
    }
  }

  /**
   * 🔄 Update JWT token
   */
  private updateToken(token: string) {
    const configuration = new Configuration({
      basePath: this.api.configuration?.basePath,
      apiKey: this.api.configuration?.apiKey,
      accessToken: token,
    });
    
    this.api = new DefaultApi(configuration);
  }

  /**
   * 📊 Get system health
   */
  async getSystemHealth() {
    try {
      const response = await this.api.healthGet();
      
      console.log('🏥 System Health Check:');
      console.log(`📊 Status: ${response.status}`);
      console.log('🗄️ Database:', response.database);
      console.log('💾 Storage:', response.storage);
      console.log('🔗 Confirmations:', response.confirmations);
      console.log('🌐 WebSocket:', response.websocket);
      
      return response;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }
}

// 🚀 Example Usage
async function main() {
  console.log('🚀 KMP Supply Chain API - TypeScript SDK Example');
  console.log('================================================');

  // Initialize client
  const client = new KMPSupplyChainClient({
    baseUrl: 'http://localhost:4000',
    // You can use either API key or JWT token
    apiKey: 'your-api-key-here'
    // jwtToken: 'your-jwt-token-here'
  });

  try {
    // 1. Check system health
    console.log('\n🏥 Checking system health...');
    await client.getSystemHealth();

    // 2. Submit a supply chain event
    console.log('\n📦 Submitting supply chain event...');
    const eventResponse = await client.submitSupplyChainEvent({
      productId: 'TYPESCRIPT_SDK_EXAMPLE_001',
      location: 'SDK_TESTING_FACILITY',
      eventType: 'QUALITY_CHECK',
      batchId: 'BATCH_TS_001',
      metadata: {
        inspector: 'TypeScript SDK',
        grade: 'PREMIUM',
        automated: true,
        sdkVersion: '1.0.0'
      }
    });

    // 3. Get product traceability
    console.log('\n🔍 Getting product traceability...');
    await client.getProductTrace('TYPESCRIPT_SDK_EXAMPLE_001');

    // 4. Check transaction status
    if (eventResponse.transactionId) {
      console.log('\n🔍 Checking transaction status...');
      await client.getTransactionStatus(eventResponse.transactionId);
    }

    // 5. Get company dashboard (requires authentication)
    // console.log('\n📊 Getting company dashboard...');
    // await client.getCompanyDashboard(1);

    console.log('\n✅ Example completed successfully!');

  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { KMPSupplyChainClient }; 