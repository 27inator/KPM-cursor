import crypto from 'crypto';
import pkg from 'kaspa-wasm32-sdk';
const { RpcClient, PrivateKey, createTransactions, submitTransaction, NetworkId } = pkg;

// Configuration - using your exact wallet details
const COMPANY_MNEMONIC = "source tell gauge nature fatal mother glare pill raccoon kiwi acoustic parrot";
const COMPANY_ADDRESS = "kaspatest:qqnv524mtnrn27qmftuvswz9meh6txtq00zyza0jlst8p4nq5kgkwpcnh4x78";
const MASTER_ADDRESS = "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem";
const KASPA_NODE = 'ws://127.0.0.1:17210'; // your local node

// Supply chain data (80 bytes)
const SUPPLY_CHAIN_EVENT = {
  "event": "SCAN",
  "product": "LW001",
  "batch": "Q1_001",
  "quality": "AAA",
  "temp": "72F"
};

// Working HMAC key generation (from broadcaster.mjs)
function generateHDKeypair(mnemonic, derivationIndex = 0) {
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

async function testCompanyToMasterPayment() {
  try {
    console.log('🚀 TESTING COMPANY → MASTER PAYMENT');
    console.log('==================================');
    console.log('Supply chain data:', JSON.stringify(SUPPLY_CHAIN_EVENT));
    console.log('Data size:', JSON.stringify(SUPPLY_CHAIN_EVENT).length, 'bytes');
    console.log('Company address:', COMPANY_ADDRESS);
    console.log('Master address:', MASTER_ADDRESS);
    console.log('');

    // Generate company keypair for signing
    console.log('🔑 Generating company keypair...');
    const companyKeypair = generateHDKeypair(COMPANY_MNEMONIC, 0);
    
    // Check what address this generates
    const generatedAddress = companyKeypair.toAddress('testnet-10');
    console.log('Generated address:', generatedAddress.toString());
    console.log('Expected address: ', COMPANY_ADDRESS);
    console.log('Addresses match:  ', generatedAddress.toString() === COMPANY_ADDRESS);
    
    if (generatedAddress.toString() !== COMPANY_ADDRESS) {
      console.log('⚠️  Address mismatch, but continuing with provided funded address...');
    }

    // Connect to your local Kaspa node
    console.log('🔌 Connecting to local Kaspa node...');
    const rpc = new RpcClient({ resolver: { urls: [KASPA_NODE] }, networkId: 'testnet-10' });
    await rpc.connect();
    console.log('✅ Connected!');

    // Get UTXOs for the funded company address
    console.log('💰 Getting UTXOs for company address...');
    const utxos = await rpc.getUtxosByAddresses({ addresses: [COMPANY_ADDRESS] });
    
    if (!utxos.entries || utxos.entries.length === 0) {
      throw new Error('No UTXOs found for company address');
    }

    console.log(`✅ Found ${utxos.entries.length} UTXOs`);
    
    // Calculate balance
    let totalBalance = 0n;
    for (const utxo of utxos.entries) {
      totalBalance += BigInt(utxo.amount);
    }
    console.log(`💰 Balance: ${Number(totalBalance) / 100000000} KAS`);

    // Create simple payment transaction: Company → Master
    console.log('📝 Creating transaction...');
    
    const sendAmount = 100000n; // 0.001 KAS
    const fee = 1000n; // 0.00001 KAS
    const changeAmount = totalBalance - sendAmount - fee;

    const outputs = [
      {
        scriptPublicKey: rpc.address(MASTER_ADDRESS).scriptPublicKey,
        amount: sendAmount
      },
      {
        scriptPublicKey: rpc.address(COMPANY_ADDRESS).scriptPublicKey,
        amount: changeAmount
      }
    ];

    const { transactions } = await createTransactions({
      priorityFee: 0n,
      entries: utxos.entries,
      outputs,
      changeAddress: COMPANY_ADDRESS,
      networkId: 'testnet-10'
    });

    if (!transactions || transactions.length === 0) {
      throw new Error('Failed to create transaction');
    }

    const transaction = transactions[0];
    console.log('✅ Transaction created');

    // Sign transaction
    console.log('🔐 Signing transaction...');
    transaction.sign([companyKeypair]);
    console.log('✅ Transaction signed');

    // Submit transaction
    console.log('📡 Submitting transaction...');
    await submitTransaction({ rpc, transaction });
    
    console.log('🎉 SUCCESS! COMPANY → MASTER TRANSACTION SUBMITTED!');
    console.log('==================================================');
    console.log('📋 Transaction ID:', transaction.id());
    console.log('🌐 Explorer: https://explorer-tn10.kaspa.org/txs/' + transaction.id());
    console.log('💰 Amount:', Number(sendAmount) / 100000000, 'KAS');
    console.log('📦 Supply chain data (conceptual):', JSON.stringify(SUPPLY_CHAIN_EVENT));
    console.log('');
    console.log('✅ VITAL PLUMBING WORKING!');
    console.log('🔧 Next: Add OP_RETURN data embedding to this working transaction');

    await rpc.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testCompanyToMasterPayment().catch(console.error);
} 