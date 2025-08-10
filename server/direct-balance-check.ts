// Direct balance check using your local Kaspa.ng node HTTP API
async function directBalanceCheck() {
  console.log('💰 DIRECT WALLET BALANCE CHECK VIA LOCAL NODE');
  console.log('=' .repeat(45));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  const nodeUrl = 'http://127.0.0.1:16210';
  
  console.log(`📍 Wallet: ${masterWallet}`);
  console.log(`🌐 Node: ${nodeUrl}`);
  
  // Test 1: Check node info first
  console.log('\n1️⃣ Testing node connection...');
  try {
    const infoResponse = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getInfo',
        params: {},
        id: 1
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      console.log('✅ Node connection successful');
      console.log(`   Network: ${infoData.result?.network || 'testnet'}`);
      console.log(`   Synced: ${infoData.result?.isSynced ? 'Yes' : 'Syncing'}`);
      console.log(`   Block count: ${infoData.result?.blockCount || 'Unknown'}`);
    } else {
      console.log(`❌ Node connection failed: ${infoResponse.status}`);
      return { error: 'Node connection failed' };
    }
  } catch (error) {
    console.log(`❌ Node test failed: ${error.message}`);
    return { error: error.message };
  }
  
  // Test 2: Check wallet balance
  console.log('\n2️⃣ Checking wallet balance...');
  try {
    const balanceResponse = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: { address: masterWallet },
        id: 2
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (balanceResponse.ok) {
      const balanceData = await balanceResponse.json();
      console.log(`📊 Balance response: ${JSON.stringify(balanceData)}`);
      
      if (balanceData.result && balanceData.result.available !== undefined) {
        const availableBalance = parseInt(balanceData.result.available);
        const pendingBalance = parseInt(balanceData.result.pending || 0);
        const totalBalance = availableBalance + pendingBalance;
        
        const availableKAS = availableBalance / 100000000;
        const pendingKAS = pendingBalance / 100000000;
        const totalKAS = totalBalance / 100000000;
        
        console.log('\n💰 WALLET BALANCE FOUND:');
        console.log(`   Available: ${availableKAS} KAS`);
        console.log(`   Pending: ${pendingKAS} KAS`);
        console.log(`   Total: ${totalKAS} KAS`);
        
        if (totalKAS >= 2000) {
          console.log('🎉 EXCELLENT: 2000+ KAS confirmed! Ready for all testing!');
          return { success: true, balance: totalKAS, funded: true, ready: true };
        } else if (totalKAS >= 100) {
          console.log('✅ GOOD: 100+ KAS available! Ready for blockchain testing!');
          return { success: true, balance: totalKAS, funded: true, ready: true };
        } else if (totalKAS >= 10) {
          console.log('✅ SUFFICIENT: 10+ KAS available! Can test basic transactions!');
          return { success: true, balance: totalKAS, funded: true, ready: true };
        } else if (totalKAS > 0) {
          console.log('⚠️ PARTIAL: Some KAS found but may need more for testing');
          return { success: true, balance: totalKAS, funded: true, ready: false };
        } else {
          console.log('❌ No balance found');
          return { success: true, balance: 0, funded: false, ready: false };
        }
        
      } else if (balanceData.error) {
        console.log(`❌ Balance check error: ${balanceData.error.message}`);
        return { error: balanceData.error.message };
      } else {
        console.log('❌ Invalid balance response format');
        return { error: 'Invalid response format' };
      }
      
    } else {
      console.log(`❌ Balance request failed: ${balanceResponse.status}`);
      return { error: `HTTP ${balanceResponse.status}` };
    }
    
  } catch (error) {
    console.log(`❌ Balance check failed: ${error.message}`);
    return { error: error.message };
  }
  
  // Test 3: Try UTXO method as alternative
  console.log('\n3️⃣ Trying UTXO balance check...');
  try {
    const utxoResponse = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getUtxosByAddresses',
        params: { addresses: [masterWallet] },
        id: 3
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (utxoResponse.ok) {
      const utxoData = await utxoResponse.json();
      console.log(`📊 UTXO response: ${JSON.stringify(utxoData)}`);
      
      if (utxoData.result && Array.isArray(utxoData.result)) {
        if (utxoData.result.length > 0) {
          let totalBalance = 0;
          utxoData.result.forEach(utxo => {
            totalBalance += parseInt(utxo.amount || 0);
          });
          
          const kasBalance = totalBalance / 100000000;
          console.log(`🎉 UTXO BALANCE: ${kasBalance} KAS (${utxoData.result.length} UTXOs)`);
          
          if (kasBalance >= 10) {
            console.log('✅ SUFFICIENT: Ready for blockchain testing!');
            return { success: true, balance: kasBalance, funded: true, ready: true, method: 'UTXO' };
          } else {
            console.log('⚠️ PARTIAL: Some funds found');
            return { success: true, balance: kasBalance, funded: true, ready: false, method: 'UTXO' };
          }
        } else {
          console.log('❌ No UTXOs found');
          return { success: true, balance: 0, funded: false, ready: false, method: 'UTXO' };
        }
      } else {
        console.log('❌ Invalid UTXO response');
        return { error: 'Invalid UTXO response' };
      }
    } else {
      console.log(`❌ UTXO request failed: ${utxoResponse.status}`);
      return { error: `UTXO HTTP ${utxoResponse.status}` };
    }
    
  } catch (error) {
    console.log(`❌ UTXO check failed: ${error.message}`);
    return { error: error.message };
  }
}

// Run direct balance check
directBalanceCheck()
  .then(result => {
    console.log('\n📊 FINAL BALANCE CHECK RESULT');
    console.log('=' .repeat(30));
    
    if (result.ready) {
      console.log(`✅ SUCCESS: ${result.balance} KAS available`);
      console.log('🚀 READY FOR LIVE BLOCKCHAIN TESTING!');
      console.log('');
      console.log('🎯 Next steps:');
      console.log('   1. Run: tsx server/broadcast-real-testnet-transaction.ts');
      console.log('   2. Test supply chain event broadcasting');
      console.log('   3. Generate consumer QR codes with real blockchain proofs');
      console.log('   4. Deploy KMP system with live blockchain integration');
      
    } else if (result.funded) {
      console.log(`⚠️ PARTIAL: ${result.balance} KAS found`);
      console.log('May need more funding for comprehensive testing');
      
    } else if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      console.log('Check node connection and wallet address');
      
    } else {
      console.log('❌ NO FUNDS: Wallet appears empty');
      console.log('Faucet transaction may still be processing');
      console.log(`Check: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Balance check failed:', error);
    process.exit(1);
  });