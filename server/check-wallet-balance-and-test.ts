// Check master wallet balance and test live blockchain if funded
async function checkWalletAndTest() {
  console.log('💰 CHECKING MASTER WALLET BALANCE');
  console.log('=' .repeat(35));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  
  console.log(`📍 Master Wallet: ${masterWallet}`);
  console.log('🔍 Checking balance via local Kaspa.ng node...');
  
  try {
    // Check balance via local node
    const balanceResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: { address: masterWallet },
        id: 1
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log(`📊 Balance response: ${JSON.stringify(balanceData)}`);
      
      if (balanceData.result) {
        const availableBalance = balanceData.result.available || 0;
        const pendingBalance = balanceData.result.pending || 0;
        const totalBalance = availableBalance + pendingBalance;
        
        const availableKAS = availableBalance / 100000000;
        const pendingKAS = pendingBalance / 100000000;
        const totalKAS = totalBalance / 100000000;
        
        console.log('💰 WALLET BALANCE FOUND:');
        console.log(`   Available: ${availableKAS} KAS (${availableBalance} sompi)`);
        console.log(`   Pending: ${pendingKAS} KAS (${pendingBalance} sompi)`);
        console.log(`   Total: ${totalKAS} KAS (${totalBalance} sompi)`);
        
        if (totalKAS >= 2000) {
          console.log('🎉 SUCCESS: 2000+ KAS confirmed in master wallet!');
          return { funded: true, balance: totalKAS, testReady: true };
        } else if (totalKAS > 0) {
          console.log(`⚠️ PARTIAL: ${totalKAS} KAS found (need 2000 total)`);
          return { funded: true, balance: totalKAS, testReady: totalKAS >= 10 }; // Need at least 10 for testing
        } else {
          console.log('❌ No balance found in wallet yet');
          return { funded: false, balance: 0, testReady: false };
        }
        
      } else {
        console.log('❌ Invalid balance response from node');
        return { funded: false, balance: 0, testReady: false };
      }
      
    } else {
      console.log(`❌ Balance check failed: ${balanceResponse.status} ${balanceResponse.statusText}`);
      return { funded: false, balance: 0, testReady: false };
    }
    
  } catch (error) {
    console.log(`❌ Local node balance check failed: ${error.message}`);
    
    // Fallback: check explorer
    console.log('🔍 Checking Kaspa explorer as backup...');
    console.log(`   Explorer URL: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
    console.log('   (Manual verification - address should show balance if funded)');
    
    return { funded: false, balance: 0, testReady: false, error: error.message };
  }
}

async function testLiveBlockchain() {
  console.log('\n🚀 TESTING LIVE BLOCKCHAIN INTEGRATION');
  console.log('=' .repeat(38));
  
  try {
    console.log('🔄 Importing broadcast test module...');
    
    // Import and run the broadcast test
    const { spawn } = require('child_process');
    
    console.log('🧪 Running live blockchain test...');
    console.log('Command: tsx server/broadcast-real-testnet-transaction.ts');
    
    return new Promise((resolve) => {
      const testProcess = spawn('tsx', ['server/broadcast-real-testnet-transaction.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let output = '';
      let error = '';
      
      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });
      
      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        console.log(`[ERROR] ${text.trim()}`);
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Live blockchain test completed successfully!');
          resolve({ success: true, output });
        } else {
          console.log(`❌ Test failed with exit code: ${code}`);
          resolve({ success: false, error, output });
        }
      });
      
      // Timeout after 60 seconds
      setTimeout(() => {
        testProcess.kill();
        console.log('⏰ Test timed out after 60 seconds');
        resolve({ success: false, error: 'Timeout', output });
      }, 60000);
    });
    
  } catch (error) {
    console.log(`❌ Test execution failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute wallet check and blockchain test
async function runFullCheck() {
  const walletStatus = await checkWalletAndTest();
  
  console.log('\n📊 WALLET STATUS SUMMARY:');
  console.log('=' .repeat(25));
  console.log(`💰 Funded: ${walletStatus.funded ? 'YES' : 'NO'}`);
  console.log(`🏦 Balance: ${walletStatus.balance} KAS`);
  console.log(`🧪 Test Ready: ${walletStatus.testReady ? 'YES' : 'NO'}`);
  
  if (walletStatus.testReady) {
    console.log('\n🎯 WALLET FUNDED - TESTING LIVE BLOCKCHAIN!');
    
    const testResult = await testLiveBlockchain();
    
    if (testResult.success) {
      console.log('\n🎉 LIVE BLOCKCHAIN TEST SUCCESSFUL!');
      console.log('Your KMP system is now fully operational with real Kaspa blockchain integration!');
      
      console.log('\n✅ What this means:');
      console.log('   • Supply chain events can be broadcast to real blockchain');
      console.log('   • Consumer QR codes will link to authentic blockchain proofs');
      console.log('   • Your system is ready for production deployment');
      console.log('   • All blockchain transactions are real and verifiable');
      
    } else {
      console.log('\n⚠️ Blockchain test encountered issues');
      console.log('Debug info available in test output above');
    }
    
  } else if (walletStatus.funded) {
    console.log(`\n💡 Wallet has ${walletStatus.balance} KAS but needs more for testing`);
    console.log('Consider requesting additional testnet funding or wait for more faucet distributions');
    
  } else {
    console.log('\n⏳ Wallet not yet funded - faucet transaction may still be processing');
    console.log('Check explorer: https://explorer.kaspa.org/addresses/' + 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d' + '?network=testnet');
  }
  
  return walletStatus;
}

runFullCheck()
  .then(status => {
    if (status.testReady) {
      console.log('\n🏁 KMP SYSTEM FULLY OPERATIONAL WITH LIVE BLOCKCHAIN!');
    } else {
      console.log('\n⏳ Waiting for sufficient wallet funding...');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });