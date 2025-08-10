import pkg from 'kaspa-wasm32-sdk';
const { RpcClient, Resolver } = pkg;

async function testConnection() {
    try {
        console.log('🔌 Testing Kaspa WebSocket connection...');
        console.log('Node: ws://127.0.0.1:17210');
        
        const resolver = new Resolver({
            urls: ['ws://127.0.0.1:17210']
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

        console.log('🔌 Disconnecting...');
        await rpc.disconnect();
        console.log('✅ Disconnected successfully!');

        return true;
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

// Run the test
console.log('🧪 KASPA WEBSOCKET CONNECTION TEST');
console.log('===================================');
testConnection().then(success => {
    if (success) {
        console.log('\n🎉 CONNECTION TEST PASSED!');
        console.log('Ready to submit OP_RETURN transactions!');
    } else {
        console.log('\n❌ CONNECTION TEST FAILED!');
        console.log('Need to debug WebSocket connection...');
    }
}).catch(console.error); 