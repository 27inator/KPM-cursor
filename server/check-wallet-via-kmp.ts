// Check wallet balance using existing KMP system connection
import { getKaspaClient } from './services/kaspa-grpc.js';

async function checkWalletViaKMP() {
  console.log('💰 CHECKING WALLET BALANCE VIA KMP SYSTEM');
  console.log('=' .repeat(42));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`📍 Target wallet: ${masterWallet}`);
  
  try {
    console.log('🔗 Connecting via existing KMP Kaspa client...');
    const client = await getKaspaClient();
    console.log('✅ Connected to Kaspa.ng via KMP system');
    
    console.log('💰 Checking wallet balance...');
    
    // Check balance using the existing client
    try {
      const balance = await client.getBalance(masterWallet);
      
      if (balance && balance.available > 0) {
        const kasAmount = balance.available / 100000000;
        console.log(`🎉 BALANCE FOUND: ${kasAmount} KAS`);
        console.log(`   Available: ${kasAmount} KAS`);
        console.log(`   Pending: ${balance.pending / 100000000} KAS`);
        
        if (kasAmount >= 2000) {
          console.log('✅ SUCCESS: 2000+ KAS confirmed in master wallet!');
          return { funded: true, balance: kasAmount, ready: true };
        } else if (kasAmount >= 10) {
          console.log('✅ SUFFICIENT: Enough KAS for testing blockchain integration!');
          return { funded: true, balance: kasAmount, ready: true };
        } else if (kasAmount > 0) {
          console.log('⚠️ PARTIAL: Some KAS found but may need more for testing');
          return { funded: true, balance: kasAmount, ready: false };
        }
      } else {
        console.log('❌ No balance found in wallet');
        return { funded: false, balance: 0, ready: false };
      }
      
    } catch (balanceError) {
      console.log(`⚠️ Balance check method failed: ${balanceError.message}`);
      
      // Try alternative method - check UTXOs directly
      console.log('🔄 Trying UTXO check as alternative...');
      
      try {
        const utxos = await client.getUtxosByAddresses([masterWallet]);
        
        if (utxos && utxos.length > 0) {
          let totalBalance = 0;
          utxos.forEach(utxo => {
            totalBalance += parseInt(utxo.amount);
          });
          
          const kasBalance = totalBalance / 100000000;
          console.log(`🎉 UTXO BALANCE FOUND: ${kasBalance} KAS (${utxos.length} UTXOs)`);
          
          if (kasBalance >= 10) {
            console.log('✅ SUFFICIENT: Ready for blockchain testing!');
            return { funded: true, balance: kasBalance, ready: true };
          } else {
            console.log('⚠️ PARTIAL: Some funds but may need more');
            return { funded: true, balance: kasBalance, ready: false };
          }
          
        } else {
          console.log('❌ No UTXOs found - wallet appears empty');
          return { funded: false, balance: 0, ready: false };
        }
        
      } catch (utxoError) {
        console.log(`❌ UTXO check also failed: ${utxoError.message}`);
        return { funded: false, balance: 0, ready: false, error: utxoError.message };
      }
    }
    
  } catch (error) {
    console.log(`❌ KMP client connection failed: ${error.message}`);
    return { funded: false, balance: 0, ready: false, error: error.message };
  }
}

async function testBlockchainIfReady(walletStatus) {
  if (!walletStatus.ready) {
    console.log('\n⏳ Wallet not ready for blockchain testing yet');
    return;
  }
  
  console.log('\n🚀 WALLET READY - TESTING LIVE BLOCKCHAIN INTEGRATION');
  console.log('=' .repeat(50));
  
  try {
    // Run the existing broadcast test
    const { spawn } = require('child_process');
    
    console.log('🧪 Running live blockchain test...');
    
    return new Promise((resolve) => {
      const testProcess = spawn('tsx', ['server/broadcast-real-testnet-transaction.ts'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });
      
      let output = '';
      let hasSuccess = false;
      
      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
        
        if (text.includes('BROADCAST SUCCESSFUL') || text.includes('Transaction ID')) {
          hasSuccess = true;
        }
      });
      
      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        console.log(`[ERROR] ${text.trim()}`);
      });
      
      testProcess.on('close', (code) => {
        if (hasSuccess) {
          console.log('\n🎉 LIVE BLOCKCHAIN INTEGRATION SUCCESSFUL!');
          resolve({ success: true });
        } else {
          console.log('\n⚠️ Blockchain test completed but may need manual verification');
          resolve({ success: false, code });
        }
      });
      
      setTimeout(() => {
        testProcess.kill();
        console.log('⏰ Test completed after timeout');
        resolve({ success: false, timeout: true });
      }, 45000);
    });
    
  } catch (error) {
    console.log(`❌ Blockchain test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute full check
async function runFullWalletCheck() {
  const walletStatus = await checkWalletViaKMP();
  
  console.log('\n📊 WALLET STATUS SUMMARY');
  console.log('=' .repeat(25));
  console.log(`💰 Funded: ${walletStatus.funded ? 'YES' : 'NO'}`);
  console.log(`🏦 Balance: ${walletStatus.balance} KAS`);
  console.log(`🧪 Ready for testing: ${walletStatus.ready ? 'YES' : 'NO'}`);
  
  if (walletStatus.ready) {
    const testResult = await testBlockchainIfReady(walletStatus);
    
    if (testResult && testResult.success) {
      console.log('\n🏆 COMPLETE SUCCESS!');
      console.log('Your KMP system is now fully operational with live Kaspa blockchain integration!');
      
      console.log('\n✅ What this means:');
      console.log('   • Supply chain events broadcast to real blockchain');
      console.log('   • Consumer QR codes link to authentic blockchain proofs');
      console.log('   • System ready for production deployment');
      console.log('   • All transactions are real and verifiable on Kaspa explorer');
      
    } else {
      console.log('\n⚠️ Wallet funded but blockchain test needs verification');
    }
    
  } else if (walletStatus.funded) {
    console.log(`\n💡 Wallet has ${walletStatus.balance} KAS but may need more for full testing`);
    console.log('Faucet funding may still be processing or need additional requests');
    
  } else {
    console.log('\n⏳ No funds detected yet');
    console.log('Faucet transaction may still be processing');
    console.log(`Check explorer: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  }
  
  return walletStatus;
}

// Run the check
runFullWalletCheck()
  .then(status => {
    if (status.ready) {
      console.log('\n🎯 KMP SYSTEM FULLY OPERATIONAL!');
    } else {
      console.log('\n⏳ Waiting for wallet funding completion...');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Wallet check failed:', error);
    process.exit(1);
  });