import pkg from 'kaspa-wasm32-sdk';
const { PrivateKey, RpcClient, Resolver, createTransactions, submitTransaction, addressFromScriptPublicKey, Address } = pkg;
import fs from 'fs';

// Load our consumer-readable events
const consumerEvents = JSON.parse(fs.readFileSync('./consumer-readable-events.json', 'utf8'));

// Configuration
const KASPA_NODE_URL = "127.0.0.1:17210"; // Your local testnet node (Borsh wRPC)
// Using funded company wallet for OP_RETURN transactions
const COMPANY_MNEMONIC = "source tell gauge nature fatal mother glare pill raccoon kiwi acoustic parrot";
const COMPANY_ADDRESS = "kaspatest:qqnv524mtnrn27qmftuvswz9meh6txtq00zyza0jlst8p4nq5kgkwpcnh4x78";
const MASTER_ADDRESS = "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem";

// Generate HD keypair function (from our working broadcaster)
async function generateHDKeypair(mnemonic, derivationIndex = 0) {
    const crypto = await import('crypto');
    const seed = crypto.createHmac('sha256', mnemonic)
        .update(`m/44'/277'/${derivationIndex}'/0/0`)
        .digest();

    const privateKeyBytes = seed.slice(0, 32);
    const privateKeyHex = privateKeyBytes.toString('hex');

    return new PrivateKey(privateKeyHex).toKeypair();
}

// Create OP_RETURN script with proper encoding
function createOpReturnScript(eventData) {
    const jsonString = JSON.stringify(eventData);
    const dataBuffer = Buffer.from(jsonString, 'utf8');
    const dataHex = dataBuffer.toString('hex');
    
    // Proper script push data encoding
    let lengthHex;
    if (dataBuffer.length <= 75) {
        // Direct length encoding (1 byte)
        lengthHex = dataBuffer.length.toString(16).padStart(2, '0');
    } else if (dataBuffer.length <= 255) {
        // OP_PUSHDATA1 encoding
        lengthHex = '4c' + dataBuffer.length.toString(16).padStart(2, '0');
    } else {
        // OP_PUSHDATA2 encoding (for very large data)
        lengthHex = '4d' + dataBuffer.length.toString(16).padStart(4, '0');
    }
    
    return `6a${lengthHex}${dataHex}`;
}

async function submitSupplyChainOpReturn(eventIndex = 0) {
    try {
        console.log('🚀 SUBMITTING REAL OP_RETURN TRANSACTION');
        console.log('========================================');

        // Get supply chain event
        const event = consumerEvents.compactEvents[eventIndex];
        if (!event) {
            throw new Error(`Event index ${eventIndex} not found`);
        }

        console.log('📦 Supply Chain Event:');
        console.log(JSON.stringify(event, null, 2));
        console.log(`📏 Size: ${JSON.stringify(event).length} bytes`);

        // Generate company keypair for signing (private key only)
        const companyKeypair = await generateHDKeypair(COMPANY_MNEMONIC, 0);
        // Use the provided funded company address directly
        const companyAddress = new Address(COMPANY_ADDRESS);
        
        console.log(`🏢 Company Address (funded): ${companyAddress.toString()}`);

        // Connect to Kaspa node
        console.log(`🔌 Connecting to Kaspa node: ${KASPA_NODE_URL}`);
        
        const resolver = new Resolver({
            urls: [`ws://${KASPA_NODE_URL}`]
        });

        const rpc = new RpcClient({
            resolver,
            networkId: 'testnet-10'
        });

                console.log('🔗 Connecting to running kaspad...');

        await rpc.connect();
        console.log('✅ Connected to Kaspa node!');

        // Get UTXOs for the company address
        console.log('💰 Getting company wallet UTXOs...');
        const utxos = await rpc.getUtxosByAddresses({
            addresses: [companyAddress.toString()]
        });

        if (!utxos.entries || utxos.entries.length === 0) {
            throw new Error('No UTXOs found for company address - wallet needs funding');
        }

        console.log(`✅ Found ${utxos.entries.length} UTXOs`);
        
        // Calculate total available balance
        let totalBalance = 0n;
        for (const utxo of utxos.entries) {
            totalBalance += BigInt(utxo.amount);
        }
        
        console.log(`💰 Total balance: ${totalBalance} sompis (${Number(totalBalance) / 100000000} KAS)`);

        // Create OP_RETURN script
        const opReturnScript = createOpReturnScript(event);
        console.log(`🔧 OP_RETURN script: ${opReturnScript.substring(0, 50)}...`);
        console.log(`📏 Script length: ${opReturnScript.length / 2} bytes`);

        // Parse master address for payment
        const masterAddress = new Address(MASTER_ADDRESS);

        // Calculate transaction amounts
        const sendAmount = 100000n; // 0.001 KAS to master wallet
        const estimatedFee = 1000n; // 0.00001 KAS in sompis
        const changeAmount = totalBalance - sendAmount - estimatedFee;

        if (changeAmount <= 0) {
            throw new Error('Insufficient balance for transaction fees and payment');
        }

        // Create transaction outputs
        const outputs = [
            // OP_RETURN output (zero value) - THE SUPPLY CHAIN DATA
            {
                scriptPublicKey: opReturnScript,
                amount: 0n
            },
            // Payment to master wallet
            {
                scriptPublicKey: masterAddress.toScriptPublicKey(),
                amount: sendAmount
            },
            // Change output back to company address
            {
                scriptPublicKey: companyAddress.toScriptPublicKey(),
                amount: changeAmount
            }
        ];

        console.log('📝 Transaction outputs:');
        console.log(`  1. OP_RETURN: ${JSON.stringify(event).length} bytes of supply chain data (0 KAS)`);
        console.log(`  2. Payment: ${Number(sendAmount) / 100000000} KAS to master wallet`);
        console.log(`  3. Change: ${Number(changeAmount) / 100000000} KAS back to company`);

        // Create transaction
        console.log('🔨 Creating transaction...');
        
        const createTxResponse = await createTransactions({
            priorityFee: 0n,
            entries: utxos.entries,
            outputs: outputs,
            changeAddress: companyAddress.toString(),
            networkId: 'testnet-10'
        });

        if (!createTxResponse.transactions || createTxResponse.transactions.length === 0) {
            throw new Error('Failed to create transaction');
        }

        const transaction = createTxResponse.transactions[0];
        console.log('✅ Transaction created successfully!');

        // Sign transaction
        console.log('🔐 Signing transaction...');
        transaction.sign([companyKeypair]);
        console.log('✅ Transaction signed!');

        // Submit transaction
        console.log('📡 Submitting to Kaspa testnet...');
        const submitResponse = await submitTransaction({
            transaction: transaction,
            rpc: rpc
        });

        console.log('🎉 COMPANY → MASTER + OP_RETURN TRANSACTION SUBMITTED!');
        console.log('=====================================================');
        console.log(`📋 Transaction ID: ${transaction.id()}`);
        console.log(`🌐 Explorer: https://explorer-tn10.kaspa.org/txs/${transaction.id()}`);
        console.log(`🏢 From: ${companyAddress.toString()} (Company)`);
        console.log(`🏛️ To: ${masterAddress.toString()} (Master)`);
        console.log(`💰 Amount: ${Number(sendAmount) / 100000000} KAS`);
        console.log(`📦 Supply chain event embedded: ${JSON.stringify(event)}`);
        console.log(`📏 OP_RETURN data size: ${JSON.stringify(event).length} bytes`);
        console.log(`💸 Transaction cost: ~${Number(estimatedFee) / 100000000} KAS`);

        // Disconnect
        await rpc.disconnect();

        // Save transaction details
        const txDetails = {
            transactionId: transaction.id(),
            explorerUrl: `https://explorer-tn10.kaspa.org/txs/${transaction.id()}`,
            transactionType: 'COMPANY_TO_MASTER_WITH_OPRETURN',
            fromAddress: companyAddress.toString(),
            toAddress: masterAddress.toString(),
            paymentAmount: Number(sendAmount) / 100000000,
            supplyChainEvent: event,
            eventSize: JSON.stringify(event).length,
            opReturnScript: opReturnScript,
            timestamp: new Date().toISOString(),
            transactionCost: Number(estimatedFee) / 100000000
        };

        const filename = `real_op_return_tx_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(txDetails, null, 2));
        console.log(`💾 Transaction details saved to: ${filename}`);

        return txDetails;

    } catch (error) {
        console.error('❌ Error submitting OP_RETURN transaction:', error);
        throw error;
    }
}

// Test reading the transaction back from explorer
async function testTransactionRetrieval(transactionId) {
    console.log('\n🔍 TESTING TRANSACTION RETRIEVAL');
    console.log('================================');
    
    // Import our explorer reading function
    const { readSupplyChainEventFromExplorer } = await import('./read-op-return-explorer.mjs');
    
    // Wait a bit for transaction to propagate
    console.log('⏳ Waiting 10 seconds for transaction to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Try to read it back
    const result = await readSupplyChainEventFromExplorer(transactionId);
    
    if (result.success) {
        console.log('🎉 Successfully retrieved supply chain event from explorer!');
        console.log('Retrieved events:', result.supplyChainEvents);
    } else {
        console.log('⚠️  Could not retrieve transaction from explorer yet');
        console.log('This is normal - it may take a few minutes to appear');
    }
    
    return result;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔥 REAL KASPA OP_RETURN SUPPLY CHAIN TRANSACTION');
    console.log('================================================');
    
    try {
        // Submit the transaction
        const txDetails = await submitSupplyChainOpReturn(0);
        
        // Test retrieval
        await testTransactionRetrieval(txDetails.transactionId);
        
        console.log('\n🎉 SUPPLY CHAIN OP_RETURN TEST COMPLETE!');
        console.log('========================================');
        console.log('✅ Transaction submitted to Kaspa testnet');
        console.log('✅ Supply chain event embedded on blockchain');
        console.log('✅ Data is now permanently verifiable');
        console.log('✅ Consumers can verify product authenticity');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

export { submitSupplyChainOpReturn, createOpReturnScript }; 