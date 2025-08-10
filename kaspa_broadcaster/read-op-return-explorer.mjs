import fetch from 'node-fetch';

// Explorer API endpoints
const EXPLORERS = {
    kasFyi: {
        name: "kas.fyi",
        baseUrl: "https://api.kas.fyi",
        transactionEndpoint: (txId) => `${EXPLORERS.kasFyi.baseUrl}/transactions/${txId}`
    },
    kaspaOrg: {
        name: "explorer.kaspa.org", 
        baseUrl: "https://api.kaspa.org",
        transactionEndpoint: (txId) => `${EXPLORERS.kaspaOrg.baseUrl}/transactions/${txId}`
    }
};

// Decode OP_RETURN hex data back to JSON
function decodeOpReturnData(opReturnHex) {
    try {
        console.log('🔍 Decoding OP_RETURN data...');
        console.log(`📥 Input hex: ${opReturnHex.substring(0, 50)}...`);
        
        // Remove OP_RETURN opcode (6a) and length prefix
        if (!opReturnHex.startsWith('6a')) {
            throw new Error('Not a valid OP_RETURN script (missing 6a prefix)');
        }
        
        // Skip OP_RETURN opcode (6a) and decode length encoding
        let dataHex;
        let dataLength;
        
        if (opReturnHex.length < 6) {
            throw new Error('OP_RETURN script too short');
        }
        
        const firstByte = parseInt(opReturnHex.substring(2, 4), 16);
        
        if (firstByte <= 75) {
            // Direct length encoding (1 byte)
            dataLength = firstByte;
            dataHex = opReturnHex.substring(4);
            console.log(`📏 Direct length encoding: ${dataLength} bytes`);
        } else if (firstByte === 0x4c) {
            // OP_PUSHDATA1: next 1 byte is length
            dataLength = parseInt(opReturnHex.substring(4, 6), 16);
            dataHex = opReturnHex.substring(6);
            console.log(`📏 OP_PUSHDATA1 encoding: ${dataLength} bytes`);
        } else if (firstByte === 0x4d) {
            // OP_PUSHDATA2: next 2 bytes are length (little endian)
            const lengthBytes = opReturnHex.substring(4, 8);
            dataLength = parseInt(lengthBytes.substring(2, 4) + lengthBytes.substring(0, 2), 16);
            dataHex = opReturnHex.substring(8);
            console.log(`📏 OP_PUSHDATA2 encoding: ${dataLength} bytes`);
        } else {
            throw new Error(`Unsupported push data opcode: 0x${firstByte.toString(16)}`);
        }
        
        // Validate that we have the expected amount of data
        const expectedHexLength = dataLength * 2;
        if (dataHex.length < expectedHexLength) {
            console.log(`⚠️  Warning: Expected ${expectedHexLength} hex chars, got ${dataHex.length}`);
        }
        
        // Take only the expected amount of data
        dataHex = dataHex.substring(0, expectedHexLength);
        
        // Convert hex to buffer then to UTF-8 string
        const dataBuffer = Buffer.from(dataHex, 'hex');
        const jsonString = dataBuffer.toString('utf8');
        
        console.log(`📤 Decoded JSON: ${jsonString}`);
        
        // Parse JSON to get supply chain event
        const supplyChainEvent = JSON.parse(jsonString);
        
        console.log('✅ Successfully decoded supply chain event:');
        console.log(JSON.stringify(supplyChainEvent, null, 2));
        
        return {
            success: true,
            jsonString: jsonString,
            event: supplyChainEvent,
            originalHex: opReturnHex
        };
        
    } catch (error) {
        console.error('❌ Error decoding OP_RETURN data:', error.message);
        return {
            success: false,
            error: error.message,
            originalHex: opReturnHex
        };
    }
}

// Read transaction from explorer and extract OP_RETURN data
async function readSupplyChainEventFromExplorer(transactionId, explorerName = 'kasFyi') {
    try {
        console.log('🌐 READING SUPPLY CHAIN EVENT FROM EXPLORER');
        console.log('===========================================');
        console.log(`📋 Transaction ID: ${transactionId}`);
        console.log(`🔗 Explorer: ${explorerName}`);
        
        const explorer = EXPLORERS[explorerName];
        if (!explorer) {
            throw new Error(`Unknown explorer: ${explorerName}`);
        }
        
        const url = explorer.transactionEndpoint(transactionId);
        console.log(`📡 Fetching: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Explorer API error: ${response.status} ${response.statusText}`);
        }
        
        const transactionData = await response.json();
        console.log('✅ Transaction data retrieved from explorer');
        
        // Look for OP_RETURN outputs in the transaction
        const opReturnOutputs = [];
        
        if (transactionData.outputs) {
            for (let i = 0; i < transactionData.outputs.length; i++) {
                const output = transactionData.outputs[i];
                
                // Check if this output has OP_RETURN script (starts with 6a)
                if (output.scriptPublicKey && output.scriptPublicKey.startsWith('6a')) {
                    console.log(`🔍 Found OP_RETURN in output ${i}`);
                    
                    const decodedData = decodeOpReturnData(output.scriptPublicKey);
                    
                    if (decodedData.success) {
                        opReturnOutputs.push({
                            outputIndex: i,
                            value: output.value,
                            ...decodedData
                        });
                    }
                }
            }
        }
        
        if (opReturnOutputs.length === 0) {
            console.log('⚠️  No OP_RETURN outputs found in transaction');
            return {
                success: false,
                message: 'No OP_RETURN data found',
                transactionId: transactionId,
                explorer: explorerName
            };
        }
        
        console.log(`✅ Found ${opReturnOutputs.length} supply chain event(s) in transaction`);
        
        return {
            success: true,
            transactionId: transactionId,
            explorer: explorerName,
            timestamp: transactionData.block?.timestamp,
            blockHash: transactionData.block?.hash,
            supplyChainEvents: opReturnOutputs,
            rawTransaction: transactionData
        };
        
    } catch (error) {
        console.error('❌ Error reading from explorer:', error.message);
        return {
            success: false,
            error: error.message,
            transactionId: transactionId,
            explorer: explorerName
        };
    }
}

// Test function to verify OP_RETURN encoding/decoding round-trip
async function testOpReturnRoundTrip() {
    console.log('🧪 TESTING OP_RETURN ROUND-TRIP');
    console.log('================================');
    
    // Test with our sample events
    const testEvents = [
        {
            "event": "SCAN",
            "product": "LW001", 
            "batch": "Q1_001",
            "quality": "AAA",
            "temp": "72F"
        },
        {
            "event": "MANUFACTURING_COMPLETE",
            "product": "LUXURY_WATCH_LW001",
            "batch": "SWISS_2024_Q1_001", 
            "quality": "AAA_GRADE",
            "certifier": "SWISS_CERTIFIED"
        }
    ];
    
    for (let i = 0; i < testEvents.length; i++) {
        const event = testEvents[i];
        console.log(`\n🧪 Test ${i + 1}: ${event.event}`);
        
        // Encode to OP_RETURN hex with proper length encoding
        const jsonString = JSON.stringify(event);
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
        
        const opReturnHex = `6a${lengthHex}${dataHex}`;
        
        console.log(`📥 Original: ${jsonString}`);
        console.log(`🔧 OP_RETURN: ${opReturnHex.substring(0, 50)}...`);
        
        // Decode back from OP_RETURN hex
        const decoded = decodeOpReturnData(opReturnHex);
        
        if (decoded.success) {
            const isMatch = JSON.stringify(decoded.event) === jsonString;
            console.log(`${isMatch ? '✅' : '❌'} Round-trip ${isMatch ? 'successful' : 'failed'}`);
        } else {
            console.log('❌ Round-trip failed during decoding');
        }
    }
}

// Search for supply chain events by company address
async function searchSupplyChainEventsByCompany(companyAddress, explorerName = 'kasFyi') {
    console.log('🔍 SEARCHING SUPPLY CHAIN EVENTS BY COMPANY');
    console.log('===========================================');
    console.log(`🏢 Company: ${companyAddress}`);
    console.log(`🔗 Explorer: ${explorerName}`);
    
    // Note: This would require the explorer to have address history APIs
    // For now, we'll outline the approach
    
    console.log('📋 Implementation needed:');
    console.log('1. Get transaction history for company address');
    console.log('2. Filter transactions with OP_RETURN outputs');
    console.log('3. Decode supply chain events from each transaction');
    console.log('4. Return chronological event timeline');
    
    return {
        success: false,
        message: 'Address history search not implemented yet',
        nextSteps: [
            'Implement explorer address history API calls',
            'Add transaction filtering for OP_RETURN outputs',
            'Build supply chain event timeline reconstruction'
        ]
    };
}

// Export functions for use in other modules
export { 
    decodeOpReturnData,
    readSupplyChainEventFromExplorer, 
    testOpReturnRoundTrip,
    searchSupplyChainEventsByCompany,
    EXPLORERS
};

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🔥 TESTING OP_RETURN EXPLORER INTEGRATION');
    console.log('=========================================');
    
    // Test round-trip encoding/decoding
    await testOpReturnRoundTrip();
    
    console.log('\n📋 NEXT STEPS:');
    console.log('==============');
    console.log('1. Submit actual OP_RETURN transaction to testnet');
    console.log('2. Test reading real transaction from explorer');
    console.log('3. Integrate with company wallet system');
    console.log('4. Build full supply chain event timeline');
} 