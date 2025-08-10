// Connect miner to local Kaspa.ng node and start mining
async function startMiningWithLocalNode() {
  console.log('🚀 CONNECTING MINER TO LOCAL KASPA.NG NODE');
  console.log('=' .repeat(40));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  
  console.log('📋 Detected from your KMP app logs:');
  console.log('   ✅ Kaspa.ng HTTP RPC connected successfully');
  console.log('   🌐 Network: Kaspa.ng HTTP');
  console.log('   🔗 HTTP URL: http://127.0.0.1:16210');
  console.log('   🔑 Mnemonic configured: one two three...');
  console.log('');
  
  console.log('⛏️ Mining Configuration:');
  console.log(`   Wallet: ${masterWallet}`);
  console.log('   Node: 127.0.0.1 (your local Kaspa.ng)');
  console.log('   Ports to try: 16110 (gRPC), 16210 (HTTP)');
  console.log('   Network: testnet');
  console.log('   Threads: 1 CPU');
  console.log('');
  
  // Test different port configurations
  const portConfigs = [
    { port: 16110, type: 'gRPC (default miner port)' },
    { port: 16210, type: 'HTTP (KMP app connected port)' }
  ];
  
  console.log('🔍 Testing miner connection configurations:');
  
  for (const config of portConfigs) {
    console.log(`\n📡 Testing port ${config.port} (${config.type}):`);
    
    try {
      const { spawn } = require('child_process');
      
      console.log(`   Command: ./kaspa-miner --testnet --mining-address ${masterWallet} -s 127.0.0.1 -p ${config.port} -t 1`);
      
      // Test connection for 15 seconds
      const testMiner = spawn('/home/runner/kaspa-miner', [
        '--testnet',
        '--mining-address', masterWallet,
        '-s', '127.0.0.1',
        '-p', config.port.toString(),
        '-t', '1'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let connected = false;
      let error = '';
      
      testMiner.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`   [MINER] ${output.trim()}`);
        
        if (output.includes('Connected') || output.includes('Mining') || output.includes('Hashrate')) {
          connected = true;
        }
      });
      
      testMiner.stderr.on('data', (data) => {
        error = data.toString();
        console.log(`   [ERROR] ${error.trim()}`);
      });
      
      // Wait for connection test
      await new Promise((resolve) => {
        setTimeout(() => {
          testMiner.kill();
          resolve(null);
        }, 15000);
      });
      
      if (connected) {
        console.log(`   ✅ SUCCESS: Port ${config.port} works!`);
        
        // Start actual mining on working port
        console.log(`\n🚀 Starting continuous mining on port ${config.port}:`);
        
        const { execSync } = require('child_process');
        execSync(`cd /home/runner && nohup ./kaspa-miner --testnet --mining-address ${masterWallet} -s 127.0.0.1 -p ${config.port} -t 1 --mine-when-not-synced > mining.log 2>&1 &`);
        
        console.log('   ✅ Mining started in background');
        console.log('   📋 Monitor with: tail -f ~/mining.log');
        console.log('   🔍 Check wallet: https://explorer.kaspa.org/addresses/' + masterWallet + '?network=testnet');
        
        return { success: true, port: config.port, type: config.type };
        
      } else {
        console.log(`   ❌ Port ${config.port} connection failed`);
        if (error) {
          console.log(`   Error: ${error.trim()}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n⚠️ Miner connection troubleshooting:');
  console.log('   1. Verify Kaspa.ng node is fully synced');
  console.log('   2. Check if gRPC port 16110 is enabled');
  console.log('   3. Try mining without --testnet flag');
  console.log('   4. Alternative: Discord funding https://discord.gg/kaspa');
  
  return { success: false, message: 'No working port found' };
}

// Start local node mining
startMiningWithLocalNode()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 LOCAL NODE MINING ACTIVE!');
      console.log('Mining with your synced Kaspa.ng node for optimal performance');
    } else {
      console.log('\n⚠️ Mining connection issues - try Discord funding as alternative');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Mining setup failed:', error);
    process.exit(1);
  });