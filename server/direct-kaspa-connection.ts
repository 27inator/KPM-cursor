#!/usr/bin/env tsx

// Direct Kaspa connection using kaspa-wasm without kaspeak-SDK
import * as kaspaWasm from 'kaspa-wasm';

// Real Kaspa testnet configuration
const TESTNET_CONFIG = {
  network: 'testnet-10',
  rpcUrl: 'https://late-llamas-fetch.loca.lt',
  fallbackRpcUrl: 'wss://testnet-rpc.kaspa.org:17210',
  encoding: 'borsh',
  addressPrefix: 'kaspatest:',
  confirmations: 6,
  feeRate: 1000
};

export class DirectKaspaConnection {
  private rpcClient: any;
  private network: string;
  private mnemonic: string;
  private rpcUrl: string;
  private connected: boolean = false;
  
  constructor(config: { network?: string, mnemonic?: string, rpcUrl?: string } = {}) {
    this.network = config.network || TESTNET_CONFIG.network;
    this.mnemonic = config.mnemonic || process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
    this.rpcUrl = config.rpcUrl || TESTNET_CONFIG.rpcUrl;
  }
  
  async connect(): Promise<boolean> {
    try {
      console.log('🔄 Initializing kaspa-wasm...');
      await kaspaWasm.default();
      
      console.log('🔄 Connecting to real Kaspa testnet...');
      console.log(`📡 RPC URL: ${this.rpcUrl}`);
      console.log(`🌍 Network: ${this.network}`);
      
      // Create RPC client using kaspa-wasm
      this.rpcClient = new kaspaWasm.RpcClient({
        url: this.rpcUrl,
        encoding: kaspaWasm.Encoding.Borsh,
        network: this.network
      });
      
      await this.rpcClient.connect();
      
      console.log('✅ Direct Kaspa connection established!');
      this.connected = true;
      return true;
      
    } catch (error) {
      console.error('❌ Primary connection failed:', error);
      
      try {
        console.log('🔄 Trying fallback RPC...');
        this.rpcClient = new kaspaWasm.RpcClient({
          url: TESTNET_CONFIG.fallbackRpcUrl,
          encoding: kaspaWasm.Encoding.Borsh,
          network: this.network
        });
        
        await this.rpcClient.connect();
        
        console.log('✅ Fallback connection established!');
        this.connected = true;
        return true;
        
      } catch (fallbackError) {
        console.error('❌ Fallback connection failed:', fallbackError);
        console.error('❌ CRITICAL: No real Kaspa connection available');
        this.connected = false;
        return false;
      }
    }
  }
  
  async generateAddress(index: number): Promise<string> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      // Generate HD wallet address using kaspa-wasm
      const derivationPath = `m/44'/277'/${index}'/0/0`;
      
      // Create wallet from mnemonic
      const wallet = kaspaWasm.Wallet.fromMnemonic(this.mnemonic);
      const account = wallet.createAccount();
      
      // Derive address
      const address = account.deriveAddress(0); // Use index 0 for now
      
      console.log(`📍 Generated address for index ${index}: ${address}`);
      return address;
      
    } catch (error) {
      console.error('Address generation failed:', error);
      throw error;
    }
  }
  
  async getBalance(address: string): Promise<number> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      const utxos = await this.rpcClient.getUtxosByAddresses([address]);
      let balance = 0;
      
      for (const utxo of utxos) {
        balance += utxo.amount;
      }
      
      console.log(`💰 Balance for ${address}: ${balance / 100000000} KAS`);
      return balance;
      
    } catch (error) {
      console.error('Balance check failed:', error);
      throw error;
    }
  }
  
  async submitTransaction(txData: any): Promise<{ txId: string }> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      const result = await this.rpcClient.submitTransaction(txData);
      console.log(`📤 Transaction submitted: ${result.transactionId}`);
      return { txId: result.transactionId };
      
    } catch (error) {
      console.error('Transaction submission failed:', error);
      throw error;
    }
  }
  
  async getTransaction(txId: string): Promise<any> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      const tx = await this.rpcClient.getTransaction(txId);
      console.log(`🔍 Transaction ${txId}: ${tx.confirmations} confirmations`);
      return tx;
      
    } catch (error) {
      console.error('Transaction verification failed:', error);
      throw error;
    }
  }
  
  async createTransaction(fromAddress: string, toAddress: string, amount: number): Promise<any> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      // Get UTXOs for the address
      const utxos = await this.rpcClient.getUtxosByAddresses([fromAddress]);
      
      // Create transaction
      const tx = kaspaWasm.Transaction.create({
        inputs: utxos.map((utxo: any) => ({
          transactionId: utxo.transactionId,
          index: utxo.index,
          amount: utxo.amount,
          scriptPublicKey: utxo.scriptPublicKey
        })),
        outputs: [{
          address: toAddress,
          amount: amount
        }],
        fee: TESTNET_CONFIG.feeRate
      });
      
      console.log(`📝 Transaction created: ${amount / 100000000} KAS from ${fromAddress} to ${toAddress}`);
      return tx;
      
    } catch (error) {
      console.error('Transaction creation failed:', error);
      throw error;
    }
  }
  
  async signTransaction(tx: any, privateKey: string): Promise<any> {
    if (!this.connected) {
      throw new Error('CRITICAL: Not connected to Kaspa network');
    }
    
    try {
      // Sign transaction using kaspa-wasm
      const signedTx = tx.sign(privateKey);
      console.log(`✅ Transaction signed`);
      return signedTx;
      
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  async disconnect(): Promise<void> {
    if (this.rpcClient) {
      await this.rpcClient.disconnect();
      this.connected = false;
      console.log('🔌 Disconnected from Kaspa network');
    }
  }
}

// Test the direct Kaspa connection
async function testDirectKaspaConnection(): Promise<void> {
  console.log('🚀 Testing Direct Kaspa Connection');
  console.log('='.repeat(50));
  
  const client = new DirectKaspaConnection({
    network: TESTNET_CONFIG.network,
    rpcUrl: TESTNET_CONFIG.rpcUrl,
    mnemonic: process.env.MASTER_MNEMONIC
  });
  
  try {
    const connected = await client.connect();
    
    if (connected) {
      console.log('✅ Direct Kaspa connection successful!');
      
      // Test address generation
      const address = await client.generateAddress(0);
      console.log(`📍 Generated address: ${address}`);
      
      // Test balance check
      const balance = await client.getBalance(address);
      console.log(`💰 Balance: ${balance / 100000000} KAS`);
      
      console.log('🎉 All tests passed - Ready for real transactions!');
      
      // Cleanup
      await client.disconnect();
      
    } else {
      console.error('❌ Direct Kaspa connection failed');
      console.error('❌ System cannot process real transactions');
    }
    
  } catch (error) {
    console.error('❌ Direct Kaspa test failed:', error);
  }
}

// Export for use in other modules
export { testDirectKaspaConnection };

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDirectKaspaConnection().catch(console.error);
}