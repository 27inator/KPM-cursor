// Start Kaspa testnet mining to master wallet
import { spawn } from 'child_process';

async function startTestnetMining() {
  console.log('⛏️ STARTING KASPA TESTNET MINING');
  console.log('=' .repeat(40));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`Mining to: ${masterWallet}`);
  
  console.log('\n1️⃣ Checking miner availability...');
  
  // Check if miner exists
  const { execSync } = require('child_process');
  
  try {
    const minerPath = '/home/runner/kaspa-miner';
    const minerCheck = execSync(`ls -la ${minerPath}`, { encoding: 'utf8' });
    console.log('✅ Kaspa miner found');
    console.log(`   ${minerCheck.trim()}`);
  } catch (error) {
    console.log('❌ Kaspa miner not found - need to download');
    return { success: false, error: 'Miner not available' };
  }
  
  console.log('\n2️⃣ Testing node connectivity...');
  
  try {
    const nodeResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getInfo',
        params: [],
        id: 1
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (nodeResponse.ok) {
      const nodeData = await nodeResponse.json();
      console.log('✅ Local Kaspa.ng node connected');
      console.log(`   Network: ${nodeData.result?.network || 'testnet-10'}`);
      console.log(`   Synced: ${nodeData.result?.isSynced ? 'Yes' : 'Syncing...'}`);
      
      // Use local node
      console.log('\n3️⃣ Starting mining with local node...');
      return startMiningProcess(masterWallet, '127.0.0.1:16210', 'Local Kaspa.ng');
    }
  } catch (error) {
    console.log('⚠️ Local node not accessible, using public pool');
  }
  
  console.log('\n3️⃣ Starting mining with public pool...');
  return startMiningProcess(masterWallet, 'pool.kaspa.org:16210', 'Public Pool');
}

function startMiningProcess(address: string, nodeAddress: string, nodeType: string): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(`⛏️ Mining configuration:`);
    console.log(`   Address: ${address}`);
    console.log(`   Node: ${nodeAddress} (${nodeType})`);
    console.log(`   Threads: 1 CPU thread`);
    console.log(`   Network: Testnet`);
    
    const minerArgs = [
      '--testnet',
      '--mining-address', address,
      '-s', nodeAddress.split(':')[0],
      '-p', nodeAddress.split(':')[1] || '16210',
      '-t', '1',
      '--debug'
    ];
    
    console.log(`\n🚀 Starting miner with command:`);
    console.log(`   ~/kaspa-miner ${minerArgs.join(' ')}`);
    
    const miner = spawn('/home/runner/kaspa-miner', minerArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });
    
    let connectionEstablished = false;
    let miningStarted = false;
    let blockFound = false;
    
    miner.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[MINER] ${output.trim()}`);
      
      // Track mining progress
      if (output.includes('Connected') || output.includes('connected')) {
        connectionEstablished = true;
        console.log('✅ Miner connected to node');
      }
      
      if (output.includes('Mining') || output.includes('mining') || output.includes('Hashrate')) {
        if (!miningStarted) {
          miningStarted = true;
          console.log('✅ Mining started successfully');
        }
      }
      
      if (output.includes('Block found') || output.includes('Share accepted') || output.includes('Solution found')) {
        blockFound = true;
        console.log('🎉 BLOCK FOUND! Check explorer for confirmation');
        console.log(`   https://explorer.kaspa.org/addresses/${address}?network=testnet`);
      }
    });
    
    miner.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(`[MINER ERROR] ${error.trim()}`);
    });
    
    miner.on('error', (error) => {
      console.log(`❌ Miner process error: ${error.message}`);
      reject({ success: false, error: error.message });
    });
    
    miner.on('exit', (code) => {
      console.log(`⛏️ Miner exited with code: ${code}`);
      resolve({
        success: code === 0,
        connectionEstablished,
        miningStarted,
        blockFound,
        exitCode: code
      });
    });
    
    // Let it run for 30 seconds then check status
    setTimeout(() => {
      console.log('\n📊 Mining Status Check (30 seconds):');
      console.log(`   Connected: ${connectionEstablished ? '✅' : '❌'}`);
      console.log(`   Mining: ${miningStarted ? '✅' : '❌'}`);
      console.log(`   Block found: ${blockFound ? '✅' : '❌'}`);
      
      if (connectionEstablished && miningStarted) {
        console.log('\n🎯 Mining is operational!');
        console.log('   Monitor progress in logs above');
        console.log(`   Check explorer: https://explorer.kaspa.org/addresses/${address}?network=testnet`);
        console.log('   (Address appears after first block is mined)');
        
        // Let it continue mining
        console.log('\n⛏️ Continuing to mine... Press Ctrl+C to stop');
      } else {
        console.log('\n⚠️ Mining may have issues - check logs above');
      }
      
      resolve({
        success: true,
        connectionEstablished,
        miningStarted,
        blockFound,
        status: 'running'
      });
    }, 30000);
  });
}

// Execute mining startup
startTestnetMining()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 TESTNET MINING INITIATED');
      console.log('Monitor logs for block discoveries and check explorer for balance updates');
    } else {
      console.log('\n❌ Mining startup failed');
      console.log('Try Discord community funding as alternative');
    }
  })
  .catch(error => {
    console.error('Mining setup error:', error);
    console.log('Discord community funding recommended as alternative');
  });