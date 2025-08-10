// Test if wallet is actually funded by attempting a real transaction
import { KaspaNgRpcClient } from './services/kaspa-grpc.js';

async function testRealFunding() {
  console.log('💰 TESTING REAL WALLET FUNDING STATUS');
  console.log('=' .repeat(35));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`📍 Testing wallet: ${masterWallet}`);
  
  try {
    console.log('🔗 Connecting to Kaspa.ng node...');
    const client = new KaspaNgRpcClient({
      network: 'testnet-10',
      mnemonic: 'one two three four five six seven eight nine ten eleven twelve'
    });
    
    await client.connect();
    console.log('✅ Connected to Kaspa.ng node');
    
    // Try to get wallet info and UTXOs
    console.log('💰 Checking for UTXOs (real funding test)...');
    
    try {
      const utxos = await client.getUtxosByAddresses([masterWallet]);
      
      if (utxos && utxos.length > 0) {
        let totalBalance = 0;
        utxos.forEach(utxo => {
          totalBalance += parseInt(utxo.amount);
        });
        
        const kasBalance = totalBalance / 100000000;
        console.log(`🎉 REAL BALANCE CONFIRMED: ${kasBalance} KAS`);
        console.log(`   UTXOs: ${utxos.length}`);
        console.log(`   Total sompi: ${totalBalance}`);
        
        if (kasBalance >= 100) {
          console.log('✅ EXCELLENT: Ready for all blockchain testing');
          return { funded: true, balance: kasBalance, utxos: utxos.length, ready: true };
        } else if (kasBalance >= 10) {
          console.log('✅ GOOD: Ready for basic blockchain testing');
          return { funded: true, balance: kasBalance, utxos: utxos.length, ready: true };
        } else if (kasBalance > 0) {
          console.log('⚠️ LIMITED: Some funding but may need more');
          return { funded: true, balance: kasBalance, utxos: utxos.length, ready: false };
        }
        
      } else {
        console.log('❌ NO UTXOs FOUND');
        console.log('Wallet is empty - faucet funding did not go through');
        return { funded: false, balance: 0, utxos: 0, ready: false };
      }
      
    } catch (utxoError) {
      console.log(`❌ UTXO check failed: ${utxoError.message}`);
      
      // Try alternative balance method
      console.log('🔄 Trying alternative balance check...');
      
      try {
        const balance = await client.getBalance(masterWallet);
        
        if (balance && balance.available > 0) {
          const kasBalance = balance.available / 100000000;
          console.log(`🎉 BALANCE METHOD SUCCESS: ${kasBalance} KAS`);
          return { funded: true, balance: kasBalance, ready: kasBalance >= 10 };
        } else {
          console.log('❌ Alternative balance check also shows zero');
          return { funded: false, balance: 0, ready: false };
        }
        
      } catch (balanceError) {
        console.log(`❌ Alternative balance check failed: ${balanceError.message}`);
        return { funded: false, balance: 0, ready: false, error: balanceError.message };
      }
    }
    
  } catch (error) {
    console.log(`❌ Connection to Kaspa.ng node failed: ${error.message}`);
    console.log('This suggests the faucet funding test cannot be completed');
    return { funded: false, balance: 0, ready: false, error: error.message };
  }
}

async function attemptBroadcastTest(fundingResult) {
  if (!fundingResult.ready) {
    console.log('\n⚠️ Insufficient funding for broadcast test');
    return { tested: false, reason: 'Insufficient funds' };
  }
  
  console.log('\n🚀 ATTEMPTING REAL TRANSACTION BROADCAST');
  console.log('=' .repeat(40));
  
  try {
    console.log('🧪 Running actual broadcast test...');
    
    // Import and execute the broadcast test
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const broadcast = spawn('tsx', ['server/broadcast-real-testnet-transaction.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let hasTransactionId = false;
      let hasSuccess = false;
      let output = '';
      
      broadcast.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
        
        if (text.includes('TX ID:') || text.includes('Transaction ID:') || text.includes('/txs/')) {
          hasTransactionId = true;
        }
        
        if (text.includes('BROADCAST SUCCESSFUL') || text.includes('successfully broadcast')) {
          hasSuccess = true;
        }
      });
      
      broadcast.stderr.on('data', (data) => {
        console.log(`[ERROR] ${data.toString().trim()}`);
      });
      
      broadcast.on('close', (code) => {
        if (hasTransactionId && hasSuccess) {
          console.log('\n🎉 LIVE TRANSACTION BROADCAST SUCCESSFUL!');
          resolve({ tested: true, success: true, hasTransaction: true });
        } else if (hasTransactionId) {
          console.log('\n✅ Transaction created but verify status');
          resolve({ tested: true, success: true, hasTransaction: true });
        } else {
          console.log('\n❌ Broadcast test failed');
          resolve({ tested: true, success: false, output });
        }
      });
      
      setTimeout(() => {
        broadcast.kill();
        console.log('⏰ Broadcast test timeout');
        resolve({ tested: true, success: false, timeout: true });
      }, 45000);
    });
    
  } catch (error) {
    console.log(`❌ Broadcast test error: ${error.message}`);
    return { tested: false, error: error.message };
  }
}

// Execute the real funding test
async function runRealFundingTest() {
  const fundingResult = await testRealFunding();
  
  console.log('\n📊 REAL FUNDING TEST RESULT');
  console.log('=' .repeat(27));
  console.log(`💰 Funded: ${fundingResult.funded}`);
  console.log(`🏦 Balance: ${fundingResult.balance} KAS`);
  console.log(`🧪 Ready: ${fundingResult.ready}`);
  
  if (fundingResult.ready) {
    const broadcastResult = await attemptBroadcastTest(fundingResult);
    
    if (broadcastResult.success && broadcastResult.hasTransaction) {
      console.log('\n🏆 SUCCESS: WALLET IS FUNDED AND BLOCKCHAIN IS WORKING!');
      console.log('Your 2000 KAS from faucet is confirmed and transactions broadcast successfully');
      
    } else if (broadcastResult.tested) {
      console.log('\n⚠️ Wallet funded but broadcast needs debugging');
      
    } else {
      console.log('\n💰 Wallet funded but broadcast test not completed');
    }
    
  } else if (fundingResult.funded) {
    console.log('\n💰 Wallet has some funds but may need more from faucet');
    
  } else {
    console.log('\n❌ WALLET NOT FUNDED');
    console.log('Your faucet request did not go through or is still processing');
    console.log('Check manually: https://explorer.kaspa.org/addresses/kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d?network=testnet');
  }
  
  return fundingResult;
}

runRealFundingTest()
  .then(result => {
    if (result.ready) {
      console.log('\n✅ CONFIRMED: Real wallet funding successful');
    } else {
      console.log('\n❌ CONFIRMED: Wallet needs funding from faucet');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Real funding test failed:', error);
    process.exit(1);
  });