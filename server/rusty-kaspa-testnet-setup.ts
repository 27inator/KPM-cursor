#!/usr/bin/env tsx

/**
 * Rusty Kaspa Testnet Node Setup for KPM
 * 
 * This script sets up and configures a Rusty Kaspa testnet node for real blockchain transactions
 * using the latest v0.17.1 release from https://github.com/kaspanet/rusty-kaspa
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🦀 Rusty Kaspa Testnet Node Setup');
console.log('='.repeat(50));

const RUSTY_KASPA_VERSION = 'v0.17.1';
const DOWNLOAD_URL = `https://github.com/kaspanet/rusty-kaspa/releases/download/${RUSTY_KASPA_VERSION}/rusty-kaspa-${RUSTY_KASPA_VERSION}-linux-gnu-amd64.zip`;

async function setupRustyKaspaTestnet() {
  console.log(`📦 Setting up Rusty Kaspa ${RUSTY_KASPA_VERSION} for testnet...`);
  console.log('');

  // Create directories
  const setupDir = '/tmp/rusty-kaspa-setup';
  const dataDir = path.join(setupDir, 'testnet-data');
  const logsDir = path.join(setupDir, 'logs');
  
  try {
    if (!fs.existsSync(setupDir)) {
      fs.mkdirSync(setupDir, { recursive: true });
    }
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    console.log('✅ Created setup directories');
  } catch (error) {
    console.error('❌ Failed to create directories:', error);
    return;
  }

  // Download instructions
  console.log('📥 Download Instructions:');
  console.log('─'.repeat(25));
  console.log(`1. Download: ${DOWNLOAD_URL}`);
  console.log(`2. Extract to: ${setupDir}`);
  console.log('3. Run the setup commands below');
  console.log('');

  // Create setup script
  const setupScript = `#!/bin/bash
# Rusty Kaspa Testnet Setup Script

echo "🦀 Setting up Rusty Kaspa Testnet Node..."

# Download and extract
cd ${setupDir}
curl -L -o rusty-kaspa.zip "${DOWNLOAD_URL}"
unzip -o rusty-kaspa.zip

# Make kaspad executable
chmod +x rusty-kaspa-${RUSTY_KASPA_VERSION}-linux-gnu-amd64/kaspad

# Start testnet node
echo "🚀 Starting Kaspa testnet node..."
./rusty-kaspa-${RUSTY_KASPA_VERSION}-linux-gnu-amd64/kaspad \\
  --testnet \\
  --rpclisten=0.0.0.0:17210 \\
  --rpclisten-borsh=0.0.0.0:17210 \\
  --rpclisten-json=0.0.0.0:18210 \\
  --datadir=${dataDir} \\
  --logdir=${logsDir} \\
  --loglevel=info \\
  --enable-rpc-submissions \\
  --enable-mainnet-rpc \\
  > ${logsDir}/kaspad.log 2>&1 &

KASPAD_PID=$!
echo "📋 Kaspad started with PID: $KASPAD_PID"
echo $KASPAD_PID > ${setupDir}/kaspad.pid

# Wait for startup
echo "⏳ Waiting for kaspad to start..."
sleep 10

# Check if running
if ps -p $KASPAD_PID > /dev/null; then
    echo "✅ Kaspad is running successfully!"
    echo "📊 Logs: tail -f ${logsDir}/kaspad.log"
    echo "🔍 Process: kill $KASPAD_PID"
else
    echo "❌ Kaspad failed to start"
    echo "📋 Check logs: cat ${logsDir}/kaspad.log"
fi
`;

  const scriptPath = path.join(setupDir, 'setup-testnet.sh');
  fs.writeFileSync(scriptPath, setupScript);
  
  try {
    execSync(`chmod +x ${scriptPath}`);
    console.log(`✅ Setup script created: ${scriptPath}`);
  } catch (error) {
    console.error('❌ Failed to create setup script:', error);
  }

  console.log('');
  console.log('🔧 Manual Setup Commands:');
  console.log('─'.repeat(25));
  console.log(`cd ${setupDir}`);
  console.log(`curl -L -o rusty-kaspa.zip "${DOWNLOAD_URL}"`);
  console.log(`unzip -o rusty-kaspa.zip`);
  console.log(`chmod +x rusty-kaspa-${RUSTY_KASPA_VERSION}-linux-gnu-amd64/kaspad`);
  console.log('');
  console.log('🚀 Start Testnet Node:');
  console.log('─'.repeat(20));
  console.log(`./rusty-kaspa-${RUSTY_KASPA_VERSION}-linux-gnu-amd64/kaspad \\`);
  console.log('  --testnet \\');
  console.log('  --rpclisten=0.0.0.0:17210 \\');
  console.log('  --rpclisten-borsh=0.0.0.0:17210 \\');
  console.log('  --rpclisten-json=0.0.0.0:18210 \\');
  console.log(`  --datadir=${dataDir} \\`);
  console.log(`  --logdir=${logsDir} \\`);
  console.log('  --loglevel=info \\');
  console.log('  --enable-rpc-submissions \\');
  console.log('  --enable-mainnet-rpc');
  console.log('');

  console.log('📊 Monitoring Commands:');
  console.log('─'.repeat(20));
  console.log(`# Check if running: ps aux | grep kaspad`);
  console.log(`# View logs: tail -f ${logsDir}/kaspad.log`);
  console.log(`# Test RPC: curl -X POST http://localhost:17210 -d '{"method":"getInfo","params":[],"id":1}'`);
  console.log(`# Stop node: kill $(cat ${setupDir}/kaspad.pid)`);
  console.log('');

  console.log('🔗 KPM Integration:');
  console.log('─'.repeat(17));
  console.log('Once your testnet node is running and synced:');
  console.log('1. tsx server/real-testnet-transactions.ts');
  console.log('2. Watch real KPM blockchain transactions!');
  console.log('');

  console.log('⚡ Rusty Kaspa Advantages:');
  console.log('─'.repeat(25));
  console.log('• Written in Rust (faster, more efficient)');
  console.log('• Better memory usage than Go implementation');
  console.log('• Improved RPC performance');
  console.log('• More stable testnet connections');
  console.log('• Better WebSocket support for kaspeak-SDK');
  console.log('');

  console.log('🎯 Expected Results:');
  console.log('─'.repeat(18));
  console.log('After setup, your KPM system will:');
  console.log('✅ Connect to real Kaspa testnet');
  console.log('✅ Submit actual blockchain transactions');
  console.log('✅ Use your funded testnet wallets');
  console.log('✅ Provide real confirmations and block hashes');
  console.log('✅ Enable consumer verification of supply chain events');
  console.log('');

  console.log('📁 Files Created:');
  console.log('─'.repeat(15));
  console.log(`Setup script: ${scriptPath}`);
  console.log(`Data directory: ${dataDir}`);
  console.log(`Logs directory: ${logsDir}`);
  console.log('');

  console.log('🚀 Your KPM system is ready for real testnet integration!');
  console.log('='.repeat(50));
}

setupRustyKaspaTestnet().catch(console.error);