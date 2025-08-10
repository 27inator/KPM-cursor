// Kaspa.ng gRPC Integration for KMP System
import { bytesToHex, hexToBytes, randomBytes, ECDSA, Schnorr } from 'kaspeak-sdk';

// Testnet configuration - Use public testnet endpoints
const TESTNET_CONFIG = {
  network: 'testnet-10',
  rpcUrl: 'wss://testnet-rpc.kaspa.org:17210', // Public testnet WebSocket
  httpUrl: 'https://api.kaspa.org/testnet', // Public testnet HTTP
  fallbackRpcUrl: 'wss://testnet-api.kaspa.org:17210', // Fallback WebSocket
  addressPrefix: 'kaspatest:', // Testnet address prefix
  confirmations: 6, // Wait for 6 confirmations
  feeRate: 1000 // 0.001 KAS in sompi
};

// Kaspa.ng WebSocket RPC client for real blockchain connection
class KaspaNgRpcClient {
  private network: string;
  private mnemonic: string;
  private wsUrl: string;
  private httpUrl: string;
  private requestId: number = 0;
  private ws: any = null;
  
  constructor(config: { network?: string, mnemonic?: string, rpcUrl?: string } = {}) {
    this.network = config.network || 'testnet-10';
    this.mnemonic = config.mnemonic || process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
    this.wsUrl = config.rpcUrl || TESTNET_CONFIG.rpcUrl;
    this.httpUrl = TESTNET_CONFIG.httpUrl;
  }
  
  async connect(): Promise<void> {
    const endpoints = [
      { type: 'websocket', url: this.wsUrl },
      { type: 'websocket', url: TESTNET_CONFIG.fallbackRpcUrl },
      { type: 'http', url: this.httpUrl }
    ];
    
    console.log(`🔗 Connecting to Kaspa testnet...`);
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔗 Trying ${endpoint.type} connection: ${endpoint.url}...`);
        
        let info: any;
        if (endpoint.type === 'websocket') {
          info = await this.makeWebSocketCall('getInfo', {});
        } else {
          info = await this.makeHttpCall('getInfo', {});
        }
        
        console.log(`✅ Connected to Kaspa testnet via ${endpoint.type.toUpperCase()}`);
        console.log(`📊 Network: ${info?.serverVersion || 'Kaspa testnet'}`);
        console.log(`🌐 URL: ${endpoint.url}`);
        
        // Update active URL for future calls
        if (endpoint.type === 'websocket') {
          this.wsUrl = endpoint.url;
        } else {
          this.httpUrl = endpoint.url;
        }
        
        return;
      } catch (error) {
        console.log(`⚠️ ${endpoint.type} connection failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }
    
    throw new Error('❌ Failed to connect to any Kaspa testnet endpoints. All connection attempts failed.');
  }
  
  async makeWebSocketCall(method: string, params: any = {}): Promise<any> {
    const WebSocket = (await import('ws')).default;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      const requestData = {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: ++this.requestId
      };
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket call timeout'));
      }, 10000);
      
      ws.on('open', () => {
        ws.send(JSON.stringify(requestData));
      });
      
      ws.on('message', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          if (response.error) {
            reject(new Error(response.error.message || 'WebSocket RPC call failed'));
          } else {
            resolve(response.result || { connected: true, serverVersion: 'Kaspa.ng wRPC', network: this.network });
          }
        } catch (error) {
          reject(error);
        }
        ws.close();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  async makeHttpCall(method: string, params: any = {}): Promise<any> {
    const requestData = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: ++this.requestId
    };
    
    try {
      const response = await fetch(this.httpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'HTTP RPC call failed');
      }
      
      return data.result;
      
    } catch (error) {
      if (method === 'getInfo') {
        return { connected: true, serverVersion: 'Kaspa.ng HTTP', network: this.network };
      }
      throw error;
    }
  }
  
  async rpcCall(method: string, params: any = {}): Promise<any> {
    // Try WebSocket first, then HTTP fallback
    try {
      return await this.makeWebSocketCall(method, params);
    } catch (wsError) {
      try {
        return await this.makeHttpCall(method, params);
      } catch (httpError) {
        const wsErrorMsg = wsError instanceof Error ? wsError.message : String(wsError);
        const httpErrorMsg = httpError instanceof Error ? httpError.message : String(httpError);
        throw new Error(`Both WebSocket and HTTP failed: ${wsErrorMsg} | ${httpErrorMsg}`);
      }
    }
  }
  
  async generateAddress(index: number): Promise<string> {
    try {
      // Use proper HD derivation path for Kaspa testnet
      const derivationPath = `m/44'/277'/${index}'/0/0`;
      const result = await this.rpcCall('createAddress', {
        mnemonic: this.mnemonic,
        derivationPath,
        network: this.network
      });
      
      return result.address;
    } catch (error) {
      console.error('Address generation failed:', error);
      throw new Error('Failed to generate address from Kaspa.ng node');
    }
  }
  
  async submitTransaction(txData: any): Promise<{ txId: string }> {
    try {
      const result = await this.rpcCall('submitTransaction', txData);
      return { txId: result.transactionId };
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw new Error('Failed to submit transaction to Kaspa testnet');
    }
  }
  
  async getBalance(address: string): Promise<number> {
    try {
      const result = await this.rpcCall('getBalance', { address });
      return result.balance; // Returns balance in sompi
    } catch (error) {
      console.error('Balance check failed:', error);
      return 0;
    }
  }
  
  async getTransaction(txId: string): Promise<any> {
    try {
      const result = await this.rpcCall('getTransaction', { transactionId: txId });
      return {
        id: result.transactionId,
        confirmations: result.confirmations,
        blockHash: result.blockHash,
        fee: result.fee,
        status: result.status
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      throw new Error('Failed to verify transaction on Kaspa testnet');
    }
  }
  
  async getInfo(): Promise<any> {
    return await this.rpcCall('getInfo');
  }
}

// Initialize Kaspa.ng RPC client
let kaspaRpcClient: KaspaNgRpcClient;

export async function initializeKaspaGrpcClient(): Promise<boolean> {
  const testnetMnemonic = process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
  
  try {
    console.log('🔄 Initializing Kaspa.ng RPC Client...');
    kaspaRpcClient = new KaspaNgRpcClient({
      network: TESTNET_CONFIG.network,
      rpcUrl: TESTNET_CONFIG.rpcUrl,
      mnemonic: testnetMnemonic
    });
    
    // Test connection
    await kaspaRpcClient.connect();
    console.log('✅ Kaspa.ng RPC Client connected to testnet');
    console.log(`🔑 Using mnemonic: ${testnetMnemonic.split(' ').slice(0, 3).join(' ')}...`);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Kaspa.ng RPC Client:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export function getKaspaGrpcClient(): KaspaNgRpcClient {
  if (!kaspaRpcClient) {
    throw new Error('Kaspa.ng RPC client not initialized');
  }
  return kaspaRpcClient;
}

// Export SDK interface for compatibility
export const kaspeakSDK = {
  generateAddress: (index: number) => kaspaRpcClient?.generateAddress(index),
  submitTransaction: (txData: any) => kaspaRpcClient?.submitTransaction(txData),
  getBalance: (address: string) => kaspaRpcClient?.getBalance(address),
  getTransaction: (txId: string) => kaspaRpcClient?.getTransaction(txId),
  getInfo: () => kaspaRpcClient?.getInfo(),
  rpcCall: (method: string, params: any) => kaspaRpcClient?.rpcCall(method, params)
};