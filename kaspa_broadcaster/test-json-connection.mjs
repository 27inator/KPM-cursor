import pkg from 'kaspa-wasm32-sdk';
const { RpcClient, Resolver } = pkg;

async function testJSONConnection() {
    try {
        console.log('🔌 Testing Kaspa JSON WebSocket connection...');
        console.log('Node: ws://127.0.0.1:18210 (JSON wRPC)');
        
        const resolver = new Resolver({
            urls: ['ws://127.0.0.1:18210']
        });

        console.log('📡 Creating RPC client...');
        const rpc = new RpcClient({
            resolver,
            networkId: 'testnet-10'
        });

        console.log('🔗 Connecting...');
        await rpc.connect();
        console.log('✅ Connected successfully!');

        console.log('🏥 Testing getInfo...');
        const info = await rpc.getInfo();
        console.log('✅ Node info:', info);

        await rpc.disconnect();
        return true;
    } catch (error) {
        console.error('❌ JSON connection error:', error.message);
        return false;
    }
}

async function testBorshConnection() {
    try {
        console.log('\n🔌 Testing Kaspa Borsh WebSocket connection...');
        console.log('Node: ws://127.0.0.1:17210 (Borsh wRPC)');
        
        const resolver = new Resolver({
            urls: ['ws://127.0.0.1:17210']
        });

        const rpc = new RpcClient({
            resolver,
            networkId: 'testnet-10'
        });

        console.log('🔗 Connecting...');
        
        // Set a timeout to prevent hanging
        const connectPromise = rpc.connect();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('✅ Connected successfully!');

        const info = await rpc.getInfo();
        console.log('✅ Node info:', info);

        await rpc.disconnect();
        return true;
    } catch (error) {
        console.error('❌ Borsh connection error:', error.message);
        return false;
    }
}

// Test both connections
console.log('🧪 KASPA WEBSOCKET CONNECTION TESTS');
console.log('====================================');

(async () => {
    const jsonSuccess = await testJSONConnection();
    const borshSuccess = await testBorshConnection();
    
    console.log('\n📊 CONNECTION TEST RESULTS:');
    console.log('============================');
    console.log(`JSON wRPC (18210): ${jsonSuccess ? '✅ Working' : '❌ Failed'}`);
    console.log(`Borsh wRPC (17210): ${borshSuccess ? '✅ Working' : '❌ Failed'}`);
    
    if (jsonSuccess || borshSuccess) {
        console.log('\n🎉 At least one connection works!');
        console.log('We can proceed with OP_RETURN transactions!');
    } else {
        console.log('\n❌ Both connections failed!');
        console.log('Need to check Kaspa node configuration...');
    }
})().catch(console.error); 