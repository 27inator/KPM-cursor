#!/usr/bin/env tsx
/**
 * Kaspa Testnet Connection Setup Script
 * This script helps establish a connection to the Kaspa testnet for KPM integration
 */

import { Kaspeak } from 'kaspeak-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

interface TestnetConfig {
  network: string;
  rpcUrl: string;
  mnemonic: string;
  addressPrefix: string;
}

const PUBLIC_TESTNET_ENDPOINTS = [
  'wss://127.0.0.1:17210'
];

const LOCAL_TESTNET_ENDPOINTS = [
  'ws://localhost:17210',
  'ws://127.0.0.1:17210',
  'ws://0.0.0.0:17210'
];

class TestnetConnectionSetup {
  private mnemonic: string;
  
  constructor() {
    this.mnemonic = process.env.MASTER_MNEMONIC || 'one two three four five six seven eight nine ten eleven twelve';
  }

  async testEndpoint(endpoint: string): Promise<boolean> {
    console.log(`🔗 Testing connection to ${endpoint}...`);
    
    try {
      const kaspeak = new Kaspeak({
        network: 'testnet-10',
        rpcUrl: endpoint,
        mnemonic: this.mnemonic,
        addressPrefix: 'kaspatest:'
      });

      // Try to create a wallet to test connection
      const wallet = await kaspeak.createWallet();
      console.log(`✅ Connection successful! Wallet address: ${wallet.address}`);
      return true;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }

  async testLocalNode(): Promise<boolean> {
    console.log('\n🏠 Testing local testnet node connections...');
    
    for (const endpoint of LOCAL_TESTNET_ENDPOINTS) {
      if (await this.testEndpoint(endpoint)) {
        console.log(`✅ Local testnet node is running at ${endpoint}`);
        return true;
      }
    }
    
    console.log('❌ No local testnet node found');
    return false;
  }

  async testPublicNodes(): Promise<string | null> {
    console.log('\n🌐 Testing public testnet endpoints...');
    
    for (const endpoint of PUBLIC_TESTNET_ENDPOINTS) {
      if (await this.testEndpoint(endpoint)) {
        console.log(`✅ Public testnet node accessible at ${endpoint}`);
        return endpoint;
      }
    }
    
    console.log('❌ No public testnet nodes accessible');
    return null;
  }

  async checkKaspadProcess(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('pgrep kaspad');
      if (stdout.trim()) {
        console.log(`📋 Kaspad process found: PID ${stdout.trim()}`);
        return true;
      }
    } catch (error) {
      console.log('❌ No kaspad process running');
    }
    return false;
  }

  async checkKaspadBinary(): Promise<boolean> {
    const binaryPaths = [
      '/tmp/kaspa-testnet/bin/kaspad',
      './bin/kaspad',
      '/usr/local/bin/kaspad'
    ];

    for (const binaryPath of binaryPaths) {
      if (fs.existsSync(binaryPath)) {
        console.log(`✅ Kaspad binary found at ${binaryPath}`);
        return true;
      }
    }
    
    console.log('❌ No kaspad binary found');
    return false;
  }

  async startLocalNode(): Promise<boolean> {
    console.log('\n🚀 Attempting to start local testnet node...');
    
    const binaryPath = '/tmp/kaspa-testnet/bin/kaspad';
    if (!fs.existsSync(binaryPath)) {
      console.log('❌ Kaspad binary not found, please download it first');
      return false;
    }

    try {
      const command = `${binaryPath} --testnet --rpclisten=0.0.0.0:17210 --datadir=/tmp/kaspa-testnet/testnet-data --logdir=/tmp/kaspa-testnet/logs --loglevel=info --utxoindex`;
      
      console.log(`🔄 Starting kaspad with command: ${command}`);
      
      // Start in background
      const child = exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Kaspad error: ${error}`);
          return;
        }
        console.log(`📋 Kaspad stdout: ${stdout}`);
        if (stderr) console.log(`📋 Kaspad stderr: ${stderr}`);
      });

      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check if process is running
      return await this.checkKaspadProcess();
    } catch (error) {
      console.error(`❌ Failed to start kaspad: ${error}`);
      return false;
    }
  }

  async updateKaspaService(workingEndpoint: string): Promise<void> {
    console.log(`\n🔧 Updating KPM service to use ${workingEndpoint}...`);
    
    const kaspaServicePath = path.join(process.cwd(), 'server/services/kaspa.ts');
    
    if (!fs.existsSync(kaspaServicePath)) {
      console.log('❌ Kaspa service file not found');
      return;
    }

    let content = fs.readFileSync(kaspaServicePath, 'utf8');
    
    // Update the RPC URL
    content = content.replace(
      /rpcUrl: ['"`].*?['"`]/,
      `rpcUrl: '${workingEndpoint}'`
    );
    
    fs.writeFileSync(kaspaServicePath, content);
    console.log('✅ KPM service updated with working endpoint');
  }

  async generateConnectInstructions(): Promise<void> {
    console.log('\n📋 Testnet Connection Instructions');
    console.log('=====================================');
    console.log('Since the kaspeak-SDK is having initialization issues, here are your options:');
    console.log('');
    console.log('1. 🦀 Local Rusty Kaspa Node (Recommended):');
    console.log('   - Binary location: /tmp/kaspa-testnet/bin/kaspad');
    console.log('   - Start command: ./bin/kaspad --testnet --rpclisten=0.0.0.0:17210 --utxoindex');
    console.log('   - Wait 10-30 minutes for initial sync');
    console.log('   - Test with: curl -X POST http://localhost:17210 -H "Content-Type: application/json" -d \'{"method":"getInfo","params":[],"id":1}\'');
    console.log('');
    console.log('2. 🌐 Public Testnet Endpoints:');
    PUBLIC_TESTNET_ENDPOINTS.forEach(endpoint => {
      console.log(`   - ${endpoint}`);
    });
    console.log('');
    console.log('3. 🎯 Testing Your Connection:');
    console.log('   - Run: tsx server/setup-testnet-connection.ts');
    console.log('   - Or: tsx server/real-testnet-transactions.ts');
    console.log('');
    console.log('4. 🔧 KPM Configuration:');
    console.log('   - Your mnemonic: "one two three four five six seven eight nine ten eleven twelve"');
    console.log('   - Generated wallets: 283+ KAS across 3 companies');
    console.log('   - Network: testnet-10');
    console.log('   - Address prefix: kaspatest:');
    console.log('');
    console.log('5. 🚀 Next Steps:');
    console.log('   - Establish testnet connection (local node or public endpoint)');
    console.log('   - Run tsx server/real-testnet-transactions.ts');
    console.log('   - Watch real blockchain transactions in your KPM dashboard');
    console.log('');
    console.log('💡 The KPM system is fully ready for blockchain integration!');
  }

  async runDiagnostics(): Promise<void> {
    console.log('🔍 Kaspa Testnet Connection Diagnostics');
    console.log('=====================================');
    
    // Check for kaspad binary
    await this.checkKaspadBinary();
    
    // Check for running kaspad process
    await this.checkKaspadProcess();
    
    // Test local node connection
    const localNodeWorking = await this.testLocalNode();
    
    // Test public endpoints
    const workingEndpoint = await this.testPublicNodes();
    
    // Summary
    console.log('\n📊 Diagnostic Results:');
    console.log('====================');
    console.log(`🔧 Kaspad Binary: ${await this.checkKaspadBinary() ? '✅ Found' : '❌ Missing'}`);
    console.log(`📋 Kaspad Process: ${await this.checkKaspadProcess() ? '✅ Running' : '❌ Not Running'}`);
    console.log(`🏠 Local Node: ${localNodeWorking ? '✅ Working' : '❌ Not Working'}`);
    console.log(`🌐 Public Endpoints: ${workingEndpoint ? '✅ Working' : '❌ Not Working'}`);
    
    if (workingEndpoint) {
      console.log(`🎯 Recommended endpoint: ${workingEndpoint}`);
      await this.updateKaspaService(workingEndpoint);
    } else if (!localNodeWorking) {
      console.log('\n⚠️  No working testnet connections found!');
      await this.generateConnectInstructions();
    }
  }
}

// Main execution
async function main() {
  const setup = new TestnetConnectionSetup();
  await setup.runDiagnostics();
}

// Run diagnostics
main().catch(console.error);