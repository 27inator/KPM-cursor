import kaspa from 'kaspa-wasm32-sdk';
import fs from 'fs';
import crypto from 'crypto';

const { 
  RpcClient, 
  createTransactions,
  PrivateKey, 
  NetworkId
} = kaspa;

const MASTER_MNEMONIC = "arrest acid fall interest comfort expire aunt combine actor tackle stove coral";

// Function to generate HD wallet from mnemonic
function generateHDKeypair(mnemonic, derivationIndex = 0) {
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

console.log('[WorkingTest] Creating FRESH company wallet transaction...');

async function submitFreshTransaction() {
  try {
    const rpcClient = new RpcClient({
      url: 'ws://127.0.0.1:17210',
      encoding: "borsh", 
      networkId: NetworkId.Testnet10
    });

    await rpcClient.connect();
    console.log('[WorkingTest] ✅ Connected to Kaspa testnet');

    const keypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    const masterAddress = "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem";
    
    console.log(`[WorkingTest] Master wallet: ${masterAddress}`);

    // Get UTXOs
    const utxoResult = await rpcClient.getUtxosByAddresses({ addresses: [masterAddress] });
    const entries = utxoResult.entries;
    
    console.log(`[WorkingTest] Found ${entries.length} UTXOs`);

    // Company event data
    const companyEventHash = "2663ab17173c8e2a69646c32c3b0b5187343363a9e40c07dd5725047dc071c2b1";
    const companyId = "fresh-test-company";
    const companyAddress = "kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd";

    // Create transaction with OP_RETURN containing company event hash
    const opReturnData = Buffer.from(companyEventHash, 'hex');

    console.log('[WorkingTest] Creating transaction with company event data...');
    console.log(`[WorkingTest] Company: ${companyId}`);
    console.log(`[WorkingTest] Company Address: ${companyAddress}`); 
    console.log(`[WorkingTest] Event Hash: ${companyEventHash}`);

    // Use the approach that works (based on successful transaction from anchored_txs.json)
    const { transactions } = await createTransactions({
      entries,
      outputs: [],
      changeAddress: masterAddress,
      priorityFee: 1000n,
      networkId: "testnet-10",
      opReturnData,
      privateKeys: [keypair.privateKey] // Include private key in creation to avoid signing issues
    });

    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions created');
    }

    const transaction = transactions[0];
    console.log(`[WorkingTest] Transaction created: ${transaction.id}`);

    // Submit directly (transaction should already be signed)
    console.log('[WorkingTest] Submitting to blockchain...');
    const txidResult = await rpcClient.submitTransaction(transaction);
    const txid = txidResult.transactionId || txidResult.id || txidResult.toString();

    console.log('[WorkingTest] ✅ SUCCESS! Transaction submitted to blockchain!');
    console.log(`[WorkingTest] Transaction ID: ${txid}`);
    console.log(`[WorkingTest] Explorer: https://explorer-tn10.kaspa.org/txs/${txid}`);
    console.log('');
    console.log('🎉 COMPANY WALLET TRANSACTION SUCCESSFUL!');
    console.log(`📊 Company: ${companyId}`);
    console.log(`🏪 Company Address: ${companyAddress}`);
    console.log(`🔗 Event Hash: ${companyEventHash}`);
    console.log(`⛓️  Blockchain TX: ${txid}`);
    console.log(`🌐 Verify at: https://explorer-tn10.kaspa.org/txs/${txid}`);

    // Save result
    const result = {
      companyId,
      companyAddress,
      eventHash: companyEventHash,
      transactionId: txid,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://explorer-tn10.kaspa.org/txs/${txid}`,
      status: 'SUCCESS'
    };

    let results = [];
    if (fs.existsSync('company_wallet_transactions.json')) {
      const existing = fs.readFileSync('company_wallet_transactions.json', 'utf8');
      if (existing.trim()) {
        results = JSON.parse(existing);
      }
    }
    
    results.push(result);
    fs.writeFileSync('company_wallet_transactions.json', JSON.stringify(results, null, 2));

    await rpcClient.disconnect();
    return result;

  } catch (error) {
    console.error('[WorkingTest] ❌ Failed:', error.message);
    return null;
  }
}

// Run the test
submitFreshTransaction().then(result => {
  if (result) {
    process.exit(0);
  } else {
    console.log('\n❌ TRANSACTION FAILED');
    process.exit(1);
  }
}); 