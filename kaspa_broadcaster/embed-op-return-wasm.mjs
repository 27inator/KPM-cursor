import pkg from 'kaspa-wasm32-sdk';
const { PrivateKey, Address, Transaction, TransactionOutput, ScriptPublicKey, createTransactions, submitTransaction } = pkg;
import fs from 'fs';

// Load consumer-readable events
const consumerEvents = JSON.parse(fs.readFileSync('./consumer-readable-events.json', 'utf8'));

// Configuration
const KASPA_NODE_URL = "127.0.0.1:17210";
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || "arrest acid fall interest comfort expire aunt combine actor tackle stove coral";
const COMPANY_MNEMONIC = "indoor insane twist mechanic baby other top settle drama exotic rapid life";

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

// Create OP_RETURN output with consumer-readable supply chain data
function createOpReturnOutput(eventData) {
    console.log('🔗 Creating OP_RETURN output...');
    
    // Convert event data to JSON string then to hex
    const jsonString = JSON.stringify(eventData);
    const dataHex = Buffer.from(jsonString, 'utf8').toString('hex');
    
    console.log(`📦 Event: ${jsonString}`);
    console.log(`📏 Size: ${jsonString.length} bytes`);
    console.log(`💰 Estimated cost: ~${jsonString.length * 0.00001} KAS`);
    
    // Create OP_RETURN script: OP_RETURN <data>
    // OP_RETURN opcode is 0x6a in Kaspa (same as Bitcoin)
    const opReturnScript = `6a${dataHex.length.toString(16).padStart(2, '0')}${dataHex}`;
    
    console.log(`🔧 OP_RETURN script: ${opReturnScript.substring(0, 50)}...`);
    
    return {
        value: 0n, // Zero value for OP_RETURN output
        scriptPublicKey: opReturnScript
    };
}

async function embedSupplyChainEvent(eventIndex = 0, useCompact = true) {
    try {
        console.log('🔗 EMBEDDING CONSUMER-READABLE SUPPLY CHAIN EVENT');
        console.log('================================================');

        // Select event data
        const events = useCompact ? consumerEvents.compactEvents : consumerEvents.consumerReadableEvents;
        const event = events[eventIndex];
        
        if (!event) {
            throw new Error(`Event index ${eventIndex} not found`);
        }

        console.log('📦 Selected event:', JSON.stringify(event, null, 2));

        // Generate keypairs
        const companyKeypair = await generateHDKeypair(COMPANY_MNEMONIC, 0);
        const masterKeypair = await generateHDKeypair(MASTER_MNEMONIC, 0);

        const companyAddress = companyKeypair.toAddress('testnet-10');
        const masterAddress = masterKeypair.toAddress('testnet-10');

        console.log('🏢 Company Address:', companyAddress.toString());
        console.log('🏛️ Master Address:', masterAddress.toString());

        // Create transaction outputs
        const outputs = [
            // OP_RETURN output with supply chain event data (primary output)
            createOpReturnOutput(event)
            // Note: In real implementation, would also need payment outputs
        ];

        console.log('\n📝 Transaction structure:');
        console.log('  1. OP_RETURN: Supply chain event data');
        console.log('  (Real tx would also need payment inputs/outputs)');

        // For now, just create and log the transaction structure
        // Full transaction creation would require UTXO inputs
        const transactionPlan = {
            inputs: [], // Would need company wallet UTXOs
            outputs: outputs.map(output => ({
                ...output,
                value: output.value ? output.value.toString() : "0" // Convert BigInt to string
            })),
            event: event,
            from: companyAddress.toString(),
            to: masterAddress.toString(),
            timestamp: new Date().toISOString(),
            estimated_cost: JSON.stringify(event).length * 0.00001,
            eventSize: JSON.stringify(event).length,
            opReturnHex: outputs[0].scriptPublicKey
        };

        // Save the embedding plan for testing
        const filename = `op_return_embedding_${useCompact ? 'compact' : 'full'}_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(transactionPlan, null, 2));
        
        console.log(`\n💾 OP_RETURN embedding plan saved to: ${filename}`);
        
        console.log('\n🔍 NEXT STEPS:');
        console.log('==============');
        console.log('1. Test with kaspa-cli OP_RETURN support');
        console.log('2. Get company wallet UTXOs for full transaction');
        console.log('3. Submit actual OP_RETURN transaction');
        console.log('4. Verify data in kas.fyi explorer');

        return transactionPlan;

    } catch (error) {
        console.error('❌ Error embedding supply chain event:', error);
        throw error;
    }
}

// Test function to compare event sizes
async function compareEventSizes() {
    console.log('📊 COMPARING EVENT SIZES');
    console.log('========================');
    
    for (let i = 0; i < Math.min(3, consumerEvents.compactEvents.length); i++) {
        console.log(`\n🧪 Event ${i + 1}:`);
        
        // Compact version
        const compact = consumerEvents.compactEvents[i];
        const compactJson = JSON.stringify(compact);
        console.log(`  Compact: ${compactJson}`);
        console.log(`  Size: ${compactJson.length} bytes`);
        console.log(`  Cost: ~${compactJson.length * 0.00001} KAS`);
        
        // Full version
        if (consumerEvents.consumerReadableEvents[i]) {
            const full = consumerEvents.consumerReadableEvents[i];
            const fullJson = JSON.stringify(full);
            console.log(`  Full: ${fullJson.substring(0, 80)}...`);
            console.log(`  Size: ${fullJson.length} bytes`);
            console.log(`  Cost: ~${fullJson.length * 0.00001} KAS`);
        }
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔥 TESTING CONSUMER-READABLE OP_RETURN EMBEDDING');
    console.log('================================================');
    
    // Compare sizes first
    await compareEventSizes();
    
    console.log('\n🚀 Testing compact event embedding...');
    await embedSupplyChainEvent(0, true).catch(console.error);
    
    console.log('\n🚀 Testing full event embedding...');
    await embedSupplyChainEvent(0, false).catch(console.error);
}

export { embedSupplyChainEvent, createOpReturnOutput }; 