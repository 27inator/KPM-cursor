#!/usr/bin/env tsx
/**
 * Direct Kaspa RPC Implementation
 * Bypass kaspeak-SDK and connect directly to your testnet node
 */

import WebSocket from 'ws';
import { createHash } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DirectKaspaRPC {
  private rpcUrl: string;
  private ws: WebSocket | null = null;
  private requestId = 1;
  private pendingRequests = new Map<number, { resolve: Function, reject: Function }>();

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  async connect(): Promise<boolean> {
    try {
      const wsUrl = this.rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
      console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        this.ws!.on('open', () => {
          console.log('✅ WebSocket connection established');
          resolve(true);
        });

        this.ws!.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            const request = this.pendingRequests.get(response.id);
            
            if (request) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                request.reject(new Error(response.error.message));
              } else {
                request.resolve(response.result);
              }
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        });

        this.ws!.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        this.ws!.on('close', () => {
          console.log('WebSocket connection closed');
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  }

  async rpcCall(method: string, params: any = []): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const id = this.requestId++;
    const request = {
      id,
      method,
      params,
      jsonrpc: '2.0'
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.ws!.send(JSON.stringify(request));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async getInfo(): Promise<any> {
    return this.rpcCall('getInfo');
  }

  async getBalance(address: string): Promise<number> {
    try {
      const result = await this.rpcCall('getBalancesByAddresses', [address]);
      return result.balances?.[0]?.balance || 0;
    } catch (error) {
      console.warn(`Failed to get balance for ${address}:`, error);
      return 0;
    }
  }

  async submitTransaction(tx: any): Promise<string> {
    const result = await this.rpcCall('submitTransaction', [tx]);
    return result.transactionId;
  }

  async getTransaction(txId: string): Promise<any> {
    return this.rpcCall('getTransaction', [txId]);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// HD Wallet derivation functions
class HDWalletGenerator {
  private mnemonic: string;
  
  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
  }

  // Generate address from mnemonic and derivation path
  generateAddress(index: number): string {
    // For testing, generate consistent testnet addresses
    // In production, use proper HD wallet derivation
    const hash = createHash('sha256').update(`${this.mnemonic}_${index}`).digest('hex');
    return `kaspatest:${hash.substring(0, 10)}`;
  }

  // Generate private key for signing (mock implementation)
  generatePrivateKey(index: number): string {
    const hash = createHash('sha256').update(`${this.mnemonic}_private_${index}`).digest('hex');
    return hash;
  }
}

// Test your localtunnel connection
async function testLocaltunnelConnection() {
  console.log('🌐 Testing Direct Kaspa RPC Connection');
  console.log('=====================================');
  
  const rpcUrl = 'https://late-llamas-fetch.loca.lt';
  const rpc = new DirectKaspaRPC(rpcUrl);
  
  try {
    console.log(`📡 Connecting to: ${rpcUrl}`);
    const connected = await rpc.connect();
    
    if (connected) {
      console.log('✅ Connection successful!');
      
      // Test getInfo
      try {
        console.log('\n🔍 Testing getInfo...');
        const info = await rpc.getInfo();
        console.log('✅ Node info:', JSON.stringify(info, null, 2));
      } catch (error) {
        console.log('❌ getInfo failed:', error.message);
      }

      // Test wallet generation
      console.log('\n🔑 Testing HD wallet generation...');
      const wallet = new HDWalletGenerator('one two three four five six seven eight nine ten eleven twelve');
      
      for (let i = 0; i < 3; i++) {
        const address = wallet.generateAddress(i);
        console.log(`Company ${i + 1}: ${address}`);
        
        try {
          const balance = await rpc.getBalance(address);
          console.log(`  Balance: ${balance} sompi`);
        } catch (error) {
          console.log(`  Balance check failed: ${error.message}`);
        }
      }
      
    } else {
      console.log('❌ Connection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    rpc.disconnect();
  }
}

// Alternative: Test with curl to check node endpoints
async function testWithCurl() {
  console.log('\n🔧 Testing with curl commands...');
  
  const testCommands = [
    'curl -X POST https://late-llamas-fetch.loca.lt -H "Content-Type: application/json" -d \'{"method":"getInfo","params":[],"id":1}\' --connect-timeout 10 --max-time 30',
    'curl -X POST https://late-llamas-fetch.loca.lt/rpc -H "Content-Type: application/json" -d \'{"method":"getInfo","params":[],"id":1}\' --connect-timeout 10 --max-time 30',
    'curl -X POST https://late-llamas-fetch.loca.lt/v1/info -H "Content-Type: application/json" -d \'{"method":"getInfo","params":[],"id":1}\' --connect-timeout 10 --max-time 30'
  ];
  
  for (const command of testCommands) {
    try {
      console.log(`\n📡 Testing: ${command.split(' ')[2]}`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stdout) {
        console.log('✅ Response:', stdout);
      } else if (stderr) {
        console.log('⚠️  stderr:', stderr);
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

// Main test function
async function main() {
  console.log('🚀 Direct Kaspa RPC Test Suite');
  console.log('===============================');
  
  // Test 1: Direct WebSocket connection
  await testLocaltunnelConnection();
  
  // Test 2: Alternative curl tests
  await testWithCurl();
  
  console.log('\n📊 Summary');
  console.log('===========');
  console.log('If any tests succeeded, your node is accessible.');
  console.log('The kaspeak-SDK issue can be bypassed using direct RPC calls.');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Implement direct RPC in KMP system');
  console.log('2. Replace kaspeak-SDK with custom implementation');
  console.log('3. Test real blockchain transactions');
}

main().catch(console.error);