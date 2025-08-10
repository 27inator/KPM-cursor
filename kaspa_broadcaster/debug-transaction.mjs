import pkg from 'kaspa-wasm32-sdk';
import crypto from 'crypto';
const { createTransactions, Keypair, PrivateKey, RpcClient } = pkg;

const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || (() => {
  console.error('❌ SECURITY ERROR: MASTER_MNEMONIC environment variable not set!');
  console.error('Set it with: export MASTER_MNEMONIC=\"your secure mnemonic\"');
  process.exit(1);
})();

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
const KASPA_NODE_URL = 'ws://127.0.0.1:17210';

async function debugTransaction() {
  console.log('🔍 Debug: Testing transaction creation step by step');
  
  try {
    // Step 1: Connect to Kaspa node
    console.log('\n1️⃣ Connecting to Kaspa node...');
    const rpc = new RpcClient({ url: KASPA_NODE_URL });
    await rpc.connect();
    console.log('✅ Connected successfully');
    
    // Step 2: Generate wallet
    console.log('\n2️⃣ Generating wallet from mnemonic...');
    const keypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    const address = keypair.toAddress('testnet-10').toString();
    console.log(`✅ Address: ${address}`);
    
    // Step 3: Check UTXOs
    console.log('\n3️⃣ Fetching UTXOs...');
    const { entries } = await rpc.getUtxosByAddresses([address]);
    console.log(`✅ Found ${entries?.length || 0} UTXOs`);
    
    if (!entries || entries.length === 0) {
      console.log('❌ No UTXOs available - wallet needs testnet KAS');
      console.log('💡 Solution: Send testnet KAS to:', address);
      console.log('💡 Testnet faucet: https://faucet-testnet-10.kaspa.org/');
      await rpc.disconnect();
      return;
    }
    
    console.log('UTXO details:');
    entries.forEach((utxo, i) => {
      console.log(`  UTXO ${i}: ${utxo.amount} sompi`);
    });
    
    // Step 4: Create OP_RETURN data
    console.log('\n4️⃣ Creating OP_RETURN data...');
    const testHash = 'debug123456789abcdef' + '0'.repeat(24); // 32 byte hash
    const opReturnData = Buffer.from(testHash, 'hex');
    console.log(`✅ OP_RETURN data: ${testHash}`);
    
    // Step 5: Create transaction
    console.log('\n5️⃣ Creating transaction...');
    const { transactions } = await createTransactions({
      entries,
      outputs: [],
      changeAddress: address,
      priorityFee: 1000n,
      networkId: "testnet-10",
      opReturnData
    });
    
    if (!transactions || transactions.length === 0) {
      console.log('❌ Failed to create transaction');
      await rpc.disconnect();
      return;
    }
    
    console.log(`✅ Transaction created successfully`);
    const transaction = transactions[0];
    console.log(`Transaction inputs: ${transaction.inputs.length}`);
    console.log(`Transaction outputs: ${transaction.outputs.length}`);
    
    // Step 6: Sign transaction
    console.log('\n6️⃣ Signing transaction...');
    const privateKey = keypair.privateKey;
    transaction.sign([privateKey]);
    console.log('✅ Transaction signed');
    
    // Step 7: Submit transaction
    console.log('\n7️⃣ Submitting transaction...');
    const txidResult = await rpc.submitTransaction(transaction);
    const txid = txidResult.transactionId || txidResult.id || txidResult.toString();
    
    console.log(`\n🎉 SUCCESS!`);
    console.log(`Transaction ID: ${txid}`);
    console.log(`Explorer: https://explorer-tn10.kaspa.org/txs/${txid}`);
    
    await rpc.disconnect();
    
  } catch (error) {
    console.error('\n❌ Error during transaction debug:');
    console.error('Error type:', typeof error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
  }
}

// Run the debug
debugTransaction(); 