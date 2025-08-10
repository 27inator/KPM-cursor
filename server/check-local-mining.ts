// Check local node mining status and connection
async function checkLocalMining() {
  console.log('⛏️ CHECKING LOCAL KASPA.NG NODE MINING STATUS');
  console.log('=' .repeat(45));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  
  console.log('\n1️⃣ Local Node Connection Test:');
  console.log('=' .repeat(32));
  
  try {
    console.log('🔄 Testing connection to local Kaspa.ng node (127.0.0.1:16210)...');
    
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
      console.log('✅ Local Kaspa.ng node is accessible');
      console.log(`   Network: ${nodeData.result?.network || 'testnet-10'}`);
      console.log(`   Is synced: ${nodeData.result?.isSynced ? 'Yes' : 'Syncing...'}`);
      console.log(`   Connected peers: ${nodeData.result?.connectedPeerCount || 'Unknown'}`);
      console.log(`   Block count: ${nodeData.result?.blockCount || 'Unknown'}`);
      
      if (nodeData.result?.isSynced) {
        console.log('🎯 Node is fully synced - excellent for mining!');
      } else {
        console.log('⏳ Node is syncing - mining will start once synced');
      }
      
      return { nodeConnected: true, synced: nodeData.result?.isSynced };
      
    } else {
      console.log(`❌ Node response error: ${nodeResponse.status} ${nodeResponse.statusText}`);
      return { nodeConnected: false };
    }
    
  } catch (error) {
    console.log(`❌ Local node connection failed: ${error.message}`);
    console.log('   Make sure your Kaspa.ng node is running on 127.0.0.1:16210');
    return { nodeConnected: false };
  }
}

async function checkMiningProcess() {
  console.log('\n2️⃣ Mining Process Status:');
  console.log('=' .repeat(25));
  
  try {
    const { execSync } = require('child_process');
    
    const processes = execSync('ps aux | grep kaspa-miner | grep -v grep', { encoding: 'utf8' });
    
    if (processes.trim()) {
      console.log('✅ Mining process is running:');
      processes.trim().split('\n').forEach(line => {
        console.log(`   ${line}`);
      });
      
      // Check mining logs
      try {
        const logs = execSync('tail -10 ~/mining.log 2>/dev/null', { encoding: 'utf8' });
        console.log('\n📋 Recent mining logs:');
        logs.trim().split('\n').forEach(line => {
          console.log(`   ${line}`);
        });
        
        // Look for success indicators
        if (logs.includes('Connected') || logs.includes('Mining') || logs.includes('Hashrate')) {
          console.log('\n✅ Miner appears to be working correctly');
        } else if (logs.includes('Error') || logs.includes('Failed')) {
          console.log('\n⚠️ Miner may have connection issues');
        }
        
      } catch (error) {
        console.log('\n📝 Mining log not yet available');
      }
      
      return { miningActive: true };
      
    } else {
      console.log('❌ No mining process found');
      console.log('   Start mining with: ./start-mining.sh');
      return { miningActive: false };
    }
    
  } catch (error) {
    console.log('❌ Could not check mining process');
    return { miningActive: false };
  }
}

async function checkWalletBalance() {
  console.log('\n3️⃣ Wallet Balance Check:');
  console.log('=' .repeat(25));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  
  // Check via local node first
  try {
    console.log('🔍 Checking balance via local node...');
    
    const balanceResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: { address: masterWallet },
        id: 1
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log(`   Node balance response: ${JSON.stringify(balanceData)}`);
      
      if (balanceData.result && balanceData.result.available > 0) {
        const balance = balanceData.result.available;
        console.log(`   🎉 BALANCE FOUND: ${balance} sompi (${balance / 100000000} KAS)`);
        return { funded: true, balance: balance };
      } else {
        console.log('   📝 No balance found yet (normal for new mining)');
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Local balance check failed: ${error.message}`);
  }
  
  // Also check explorer as backup
  console.log('🔍 Checking explorer as backup...');
  console.log(`   ${masterWallet}`);
  console.log(`   https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  
  return { funded: false };
}

// Execute all checks
async function runAllChecks() {
  const nodeStatus = await checkLocalMining();
  const miningStatus = await checkMiningProcess();
  const balanceStatus = await checkWalletBalance();
  
  console.log('\n4️⃣ Overall Status Summary:');
  console.log('=' .repeat(30));
  console.log('');
  console.log(`🌐 Local node: ${nodeStatus.nodeConnected ? '✅ Connected' : '❌ Not available'}`);
  console.log(`🔄 Node synced: ${nodeStatus.synced ? '✅ Fully synced' : '⏳ Syncing'}`);
  console.log(`⛏️ Mining process: ${miningStatus.miningActive ? '✅ Running' : '❌ Not running'}`);
  console.log(`💰 Wallet funded: ${balanceStatus.funded ? '✅ Has balance' : '❌ No funds yet'}`);
  
  console.log('\n🎯 Next Steps:');
  if (!nodeStatus.nodeConnected) {
    console.log('   1. Start your Kaspa.ng node: kaspad --testnet');
    console.log('   2. Wait for node to be accessible on 127.0.0.1:16210');
  } else if (!nodeStatus.synced) {
    console.log('   1. Wait for node to finish syncing');
    console.log('   2. Mining will be more effective once synced');
  } else if (!miningStatus.miningActive) {
    console.log('   1. Start mining: ./start-mining.sh');
    console.log('   2. Monitor progress: tail -f ~/mining.log');
  } else if (!balanceStatus.funded) {
    console.log('   1. Continue mining - blocks will be found over time');
    console.log('   2. Monitor logs: tail -f ~/mining.log');
    console.log('   3. Alternative: Discord funding https://discord.gg/kaspa');
  } else {
    console.log('   🎉 READY! Test blockchain: tsx server/broadcast-real-testnet-transaction.ts');
  }
  
  return {
    nodeConnected: nodeStatus.nodeConnected,
    synced: nodeStatus.synced,
    miningActive: miningStatus.miningActive,
    funded: balanceStatus.funded,
    readyForTesting: nodeStatus.nodeConnected && miningStatus.miningActive
  };
}

runAllChecks()
  .then(status => {
    if (status.readyForTesting) {
      console.log('\n🚀 LOCAL MINING SETUP IS OPERATIONAL!');
    } else {
      console.log('\n⏳ Setup in progress - follow next steps above');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Status check failed:', error);
    process.exit(1);
  });