import kaspa from 'kaspa-wasm32-sdk';
import fs from 'fs';
import crypto from 'crypto';

const { 
  RpcClient, 
  createTransactions,
  PrivateKey, 
  NetworkId,
  Address
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

// Company wallet details (from our working API)
const MASTER_ADDRESS = "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem";
const COMPANY_ID = "fresh-test-company";
const COMPANY_ADDRESS = "kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd";
const EVENT_HASH = "2663ab17173c8e2a69646c32c3b0b5187343363a9e40c07dd5725047dc071c2b1";

console.log('🏭 MASTER WALLET → COMPANY WALLET TRANSACTION');
console.log('============================================');
console.log(`Company: ${COMPANY_ID}`);
console.log(`From: ${MASTER_ADDRESS}`);
console.log(`To: ${COMPANY_ADDRESS}`);
console.log(`Event Hash: ${EVENT_HASH}`);
console.log('');

async function sendMasterToCompanyTransaction() {
  try {
    const rpcClient = new RpcClient({
      url: 'ws://127.0.0.1:17210',
      encoding: "borsh", 
      networkId: NetworkId.Testnet10
    });

    await rpcClient.connect();
    console.log('✅ Connected to Kaspa testnet');

    const masterKeypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    
    console.log('💰 Fetching master wallet UTXOs...');
    const utxoResult = await rpcClient.getUtxosByAddresses({ addresses: [MASTER_ADDRESS] });
    const entries = utxoResult.entries;
    
    console.log(`Found ${entries.length} UTXOs`);
    console.log(`Master wallet balance: ${entries.reduce((sum, utxo) => sum + Number(utxo.amount), 0) / 100000000} KAS`);

    if (!entries || entries.length === 0) {
      throw new Error('No UTXOs available for transaction');
    }

    // Create transaction FROM master wallet TO company wallet
    const sendAmount = 1000000n; // 0.01 KAS in sompi (1 KAS = 100,000,000 sompi)
    
    console.log('🚀 Creating transaction...');
    console.log(`   Sending: ${Number(sendAmount) / 100000000} KAS`);
    console.log(`   From: Master Wallet`);
    console.log(`   To: Company Wallet`);

    const { transactions } = await createTransactions({
      entries: entries,
      outputs: [
        {
          address: COMPANY_ADDRESS,
          amount: sendAmount
        }
      ],
      changeAddress: MASTER_ADDRESS,
      priorityFee: 1000n,
      networkId: "testnet-10",
      privateKeys: [masterKeypair.privateKey]
    });

    if (!transactions || transactions.length === 0) {
      throw new Error('Failed to create transaction');
    }

    const transaction = transactions[0];
    console.log(`Transaction created: ${transaction.id}`);

    console.log('📡 Submitting to blockchain...');
    const txidResult = await rpcClient.submitTransaction(transaction);
    const txid = txidResult.transactionId || txidResult.id || txidResult.toString();

    console.log('');
    console.log('🎉 SUCCESS! MASTER → COMPANY WALLET TRANSACTION COMPLETED!');
    console.log(`Transaction ID: ${txid}`);
    console.log(`Explorer: https://explorer-tn10.kaspa.org/txs/${txid}`);
    console.log('');
    console.log('📊 Transaction Summary:');
    console.log(`   Type: Master-to-Company Transfer`);
    console.log(`   From: ${MASTER_ADDRESS}`);
    console.log(`   To: ${COMPANY_ADDRESS} (${COMPANY_ID})`);
    console.log(`   Amount: ${Number(sendAmount) / 100000000} KAS`);
    console.log(`   Company Event: ${EVENT_HASH}`);
    console.log(`   Blockchain TX: ${txid}`);

    // Save transaction record
    const result = {
      type: 'master-to-company',
      companyId: COMPANY_ID,
      companyAddress: COMPANY_ADDRESS,
      masterAddress: MASTER_ADDRESS,
      eventHash: EVENT_HASH,
      transactionId: txid,
      amount: Number(sendAmount) / 100000000,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://explorer-tn10.kaspa.org/txs/${txid}`,
      status: 'SUCCESS'
    };

    fs.writeFileSync('master_to_company_transaction.json', JSON.stringify(result, null, 2));
    console.log('✅ Transaction logged to master_to_company_transaction.json');

    await rpcClient.disconnect();
    return result;

  } catch (error) {
    console.error('❌ Transaction failed:', error.message);
    console.error('Full error:', error);
    if (error.stack) console.error('Stack:', error.stack);
    return null;
  }
}

// Execute the transaction
sendMasterToCompanyTransaction().then(result => {
  if (result) {
    console.log('\n🔗 VERIFY TRANSACTION:');
    console.log(`https://explorer-tn10.kaspa.org/txs/${result.transactionId}`);
    process.exit(0);
  } else {
    console.log('\n❌ TRANSACTION FAILED');
    process.exit(1);
  }
}); 