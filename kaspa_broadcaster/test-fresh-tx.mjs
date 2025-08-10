import kaspa from 'kaspa-wasm32-sdk';
import fs from 'fs';
import crypto from 'crypto';

const { 
  RpcClient, 
  Resolver, 
  createTransactions,
  PrivateKey, 
  Keypair,
  ScriptBuilder,
  opcodes,
  NetworkId
} = kaspa;

const MASTER_MNEMONIC = "arrest acid fall interest comfort expire aunt combine actor tackle stove coral";

// Function to generate HD wallet from mnemonic (same as main server)
function generateHDKeypair(mnemonic, derivationIndex = 0) {
  // Create deterministic seed from mnemonic + derivation path
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  // Create private key from seed (first 32 bytes)
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

// Test data representing a company signed event
const testEventData = {
  hash: "2663ab17173c8e2a69646c32c3b0b5187343363a9e40c07dd5725047dc071c2b1",
  companyId: "fresh-test-company", 
  companyAddress: "kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd",
  eventId: "FRESH-TEST-MANUAL",
  masterWalletAddress: "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem"
};

console.log('[TestFreshTx] Testing fresh company wallet transaction...');
console.log(`[TestFreshTx] Company: ${testEventData.companyId}`);
console.log(`[TestFreshTx] Company Address: ${testEventData.companyAddress}`);
console.log(`[TestFreshTx] Event Hash: ${testEventData.hash}`);

async function submitTestTransaction() {
  try {
    console.log('[TestFreshTx] Connecting to Kaspa testnet...');
    
    const rpcClient = new RpcClient({
      url: 'ws://127.0.0.1:17210',
      encoding: "borsh",
      networkId: NetworkId.Testnet10
    });

    await rpcClient.connect();
    console.log('[TestFreshTx] ✅ Connected to Kaspa testnet');

    // Generate master wallet keypair using HD derivation (same as broadcaster)
    const keypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    const masterAddress = testEventData.masterWalletAddress; // Use the known master address
    
    console.log(`[TestFreshTx] Master wallet: ${masterAddress}`);

    // Get UTXOs
    console.log('[TestFreshTx] Fetching UTXOs...');
    const utxoResult = await rpcClient.getUtxosByAddresses({ addresses: [masterAddress] });
    const entries = utxoResult.entries;
    
    console.log(`[TestFreshTx] Found ${entries.length} UTXOs`);
    
    if (!entries || entries.length === 0) {
      throw new Error('No UTXOs available for transaction');
    }

    // Create OP_RETURN data with event hash
    const opReturnData = Buffer.from(testEventData.hash, 'hex');

    console.log('[TestFreshTx] Creating transaction...');
    
    // Create and sign transaction using the exact same approach as broadcaster.mjs
    const txResult = await createTransactions({
      entries: entries,
      outputs: [],
      changeAddress: masterAddress,  
      priorityFee: 1000n, // Same as broadcaster
      networkId: "testnet-10",
      opReturnData
    });

    console.log('[TestFreshTx] Transaction created successfully');
    
    if (!txResult.transactions || txResult.transactions.length === 0) {
      throw new Error('No transactions created');
    }

    const transaction = txResult.transactions[0];
    console.log(`[TestFreshTx] Transaction ID: ${transaction.id}`);

    // Sign the transaction (same as broadcaster)
    const privateKey = keypair.privateKey;
    transaction.sign([privateKey]);

    // Submit transaction - try just passing the transaction directly
    console.log('[TestFreshTx] Submitting to blockchain...');
    const txidResult = await rpcClient.submitTransaction(transaction);
    const txid = txidResult.transactionId || txidResult.id || txidResult.toString();
    
    console.log('[TestFreshTx] ✅ Transaction submitted successfully!');
    console.log(`[TestFreshTx] Transaction ID: ${txid}`);
    console.log(`[TestFreshTx] Explorer URL: https://explorer-tn10.kaspa.org/txs/${txid}`);

    // Log the successful transaction
    const result = {
      companyId: testEventData.companyId,
      companyAddress: testEventData.companyAddress,
      eventHash: testEventData.hash,
      transactionId: txid,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://explorer-tn10.kaspa.org/txs/${txid}`,
      status: 'success'
    };

    // Append to results file
    let results = [];
    if (fs.existsSync('fresh_transactions.json')) {
      const existing = fs.readFileSync('fresh_transactions.json', 'utf8');
      if (existing.trim()) {
        results = JSON.parse(existing);
      }
    }
    
    results.push(result);
    fs.writeFileSync('fresh_transactions.json', JSON.stringify(results, null, 2));

    await rpcClient.disconnect();
    
    return result;
    
  } catch (error) {
    console.error('[TestFreshTx] ❌ Transaction failed:', error.message);
    console.error(error);
    return null;
  }
}

// Run the test
submitTestTransaction().then(result => {
  if (result) {
    console.log('\n🎉 SUCCESS: Fresh company wallet transaction completed!');
    console.log(`Company: ${result.companyId}`);
    console.log(`Transaction: ${result.transactionId}`);
    console.log(`Explorer: ${result.explorerUrl}`);
  } else {
    console.log('\n❌ FAILED: Could not complete transaction');
    process.exit(1);
  }
}); 