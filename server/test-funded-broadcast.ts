// Test if wallet is funded by attempting actual broadcast
async function testFundedBroadcast() {
  console.log('🎯 TESTING IF WALLET IS FUNDED WITH REAL BROADCAST');
  console.log('=' .repeat(50));
  
  console.log('🔄 Importing Kaspa client...');
  
  try {
    // Import the kaspa client
    const kaspaGrpc = await import('./kaspa-grpc.js');
    const client = await kaspaGrpc.getKaspaClient();
    
    console.log('✅ Kaspa client connected');
    
    // Generate wallets
    console.log('🔑 Generating HD wallets...');
    const { HDPrivateKey } = await import('kaspajs');
    const hdPrivateKey = HDPrivateKey.fromMnemonic('one two three four five six seven eight nine ten eleven twelve');
    
    // Master wallet (index 0)
    const masterPrivateKey = hdPrivateKey.deriveChild("m/44'/277'/0'/0/0").privateKey;
    const masterAddress = masterPrivateKey.toAddress('testnet').toString();
    
    console.log(`📍 Master wallet: ${masterAddress}`);
    
    // Check if this matches our expected address
    const expectedAddress = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
    
    if (masterAddress === expectedAddress) {
      console.log('✅ Address matches expected master wallet');
    } else {
      console.log(`⚠️ Address mismatch: expected ${expectedAddress}, got ${masterAddress}`);
    }
    
    // Test getting UTXOs for this address
    console.log('💰 Checking for UTXOs (balance check)...');
    
    try {
      const utxos = await client.getUtxosByAddresses([masterAddress]);
      
      if (utxos && utxos.length > 0) {
        let totalBalance = 0;
        utxos.forEach(utxo => {
          totalBalance += parseInt(utxo.amount);
        });
        
        const kasBalance = totalBalance / 100000000;
        console.log(`🎉 BALANCE FOUND: ${kasBalance} KAS (${utxos.length} UTXOs)`);
        
        if (kasBalance >= 2000) {
          console.log('✅ CONFIRMED: 2000+ KAS available for testing!');
          
          // Attempt actual transaction broadcast
          return await attemptRealBroadcast(client, masterPrivateKey, masterAddress, totalBalance);
          
        } else if (kasBalance >= 1) {
          console.log(`⚠️ PARTIAL FUNDING: ${kasBalance} KAS available`);
          console.log('This is enough for testing, attempting broadcast...');
          
          return await attemptRealBroadcast(client, masterPrivateKey, masterAddress, totalBalance);
          
        } else {
          console.log('❌ Insufficient balance for testing');
          return { funded: false, balance: kasBalance };
        }
        
      } else {
        console.log('❌ No UTXOs found - wallet not funded yet');
        return { funded: false, balance: 0 };
      }
      
    } catch (error) {
      console.log(`❌ UTXO check failed: ${error.message}`);
      return { funded: false, balance: 0, error: error.message };
    }
    
  } catch (error) {
    console.log(`❌ Test setup failed: ${error.message}`);
    return { funded: false, balance: 0, error: error.message };
  }
}

async function attemptRealBroadcast(client, privateKey, fromAddress, availableBalance) {
  console.log('\n🚀 ATTEMPTING REAL BLOCKCHAIN BROADCAST');
  console.log('=' .repeat(40));
  
  try {
    // Create a small test transaction (0.01 KAS)
    const testAmount = 1000000; // 0.01 KAS in sompi
    const fee = 1000; // Standard fee
    
    if (availableBalance < testAmount + fee) {
      console.log(`⚠️ Insufficient funds: need ${(testAmount + fee) / 100000000} KAS, have ${availableBalance / 100000000} KAS`);
      return { success: false, message: 'Insufficient funds' };
    }
    
    // Generate destination address (company 1)
    const { HDPrivateKey } = await import('kaspajs');
    const hdPrivateKey = HDPrivateKey.fromMnemonic('one two three four five six seven eight nine ten eleven twelve');
    const destPrivateKey = hdPrivateKey.deriveChild("m/44'/277'/1'/0/0").privateKey;
    const destAddress = destPrivateKey.toAddress('testnet').toString();
    
    console.log(`📤 From: ${fromAddress}`);
    console.log(`📥 To: ${destAddress}`);
    console.log(`💰 Amount: ${testAmount / 100000000} KAS`);
    console.log(`⛽ Fee: ${fee / 100000000} KAS`);
    
    // Get UTXOs for transaction
    const utxos = await client.getUtxosByAddresses([fromAddress]);
    
    if (!utxos || utxos.length === 0) {
      throw new Error('No UTXOs available');
    }
    
    console.log(`📊 Using ${utxos.length} UTXOs for transaction`);
    
    // Create transaction
    const { Transaction, createTransactionInput, createTransactionOutput } = await import('kaspajs');
    
    const transaction = new Transaction();
    
    // Add inputs
    let inputTotal = 0;
    for (const utxo of utxos) {
      if (inputTotal >= testAmount + fee) break;
      
      const input = createTransactionInput({
        previousOutpoint: {
          transactionId: utxo.transactionId,
          index: utxo.index
        },
        sequence: 0,
        sigOpCount: 1
      });
      
      transaction.addInput(input);
      inputTotal += parseInt(utxo.amount);
    }
    
    // Add outputs
    const destOutput = createTransactionOutput({
      value: testAmount,
      scriptPublicKey: destAddress
    });
    transaction.addOutput(destOutput);
    
    // Add change output if needed
    const change = inputTotal - testAmount - fee;
    if (change > 0) {
      const changeOutput = createTransactionOutput({
        value: change,
        scriptPublicKey: fromAddress
      });
      transaction.addOutput(changeOutput);
    }
    
    // Sign transaction
    console.log('✍️ Signing transaction...');
    
    for (let i = 0; i < transaction.inputs.length; i++) {
      const signature = privateKey.signTransaction(transaction, i);
      transaction.inputs[i].signatureScript = signature;
    }
    
    console.log('📡 Broadcasting to Kaspa testnet...');
    
    // Submit transaction
    const result = await client.submitTransaction(transaction);
    
    console.log('🎉 TRANSACTION BROADCAST SUCCESSFUL!');
    console.log(`   TX ID: ${result.transactionId}`);
    console.log(`   Explorer: https://explorer.kaspa.org/txs/${result.transactionId}?network=testnet`);
    
    return {
      success: true,
      transactionId: result.transactionId,
      amount: testAmount / 100000000,
      from: fromAddress,
      to: destAddress
    };
    
  } catch (error) {
    console.log(`❌ Broadcast failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Execute test
testFundedBroadcast()
  .then(result => {
    if (result.funded && result.success) {
      console.log('\n🏆 LIVE BLOCKCHAIN INTEGRATION CONFIRMED!');
      console.log('Your KMP system is now fully operational with real Kaspa transactions!');
    } else if (result.funded) {
      console.log('\n💰 Wallet funded but broadcast needs debugging');
    } else {
      console.log('\n⏳ Wallet not yet funded - check faucet status');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });