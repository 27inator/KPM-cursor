// Test different gRPC connection protocols
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

async function testGrpcProtocols() {
  console.log('🔍 Testing Kaspa.ng gRPC Connection Protocols');
  console.log('=' .repeat(50));
  
  const grpcAddress = '127.0.0.1:16210';
  
  // Test 1: Basic connectivity
  console.log('1️⃣ Testing basic port connectivity...');
  try {
    const response = await fetch(`http://${grpcAddress}`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    console.log('✅ HTTP GET response:', response.status);
  } catch (error) {
    console.log('❌ HTTP GET failed:', error.message);
  }
  
  // Test 2: JSON-RPC over HTTP
  console.log('\n2️⃣ Testing JSON-RPC over HTTP...');
  try {
    const response = await fetch(`http://${grpcAddress}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getInfo',
        params: {},
        id: 1
      }),
      signal: AbortSignal.timeout(3000)
    });
    console.log('✅ JSON-RPC POST response:', response.status);
    const data = await response.text();
    console.log('📄 Response data:', data.substring(0, 200));
  } catch (error) {
    console.log('❌ JSON-RPC POST failed:', error.message);
  }
  
  // Test 3: gRPC reflection
  console.log('\n3️⃣ Testing gRPC reflection...');
  try {
    const client = new grpc.Client(grpcAddress, grpc.credentials.createInsecure());
    console.log('✅ gRPC client created');
    
    // Try to get service metadata
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + 5);
    
    client.waitForReady(deadline, (error) => {
      if (error) {
        console.log('❌ gRPC connection failed:', error.message);
      } else {
        console.log('✅ gRPC connection ready');
      }
      client.close();
    });
    
  } catch (error) {
    console.log('❌ gRPC reflection failed:', error.message);
  }
  
  // Test 4: Alternative ports check
  console.log('\n4️⃣ Checking alternative Kaspa ports...');
  const ports = [16110, 16210, 16310, 17110, 17210, 17310];
  
  for (const port of ports) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`, {
        method: 'GET',
        signal: AbortSignal.timeout(1000)
      });
      console.log(`✅ Port ${port}: Responding (${response.status})`);
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log(`⏱️ Port ${port}: Timeout (server may be listening)`);
      } else if (error.cause?.code === 'ECONNREFUSED') {
        console.log(`❌ Port ${port}: Connection refused`);
      } else {
        console.log(`🤔 Port ${port}: ${error.message}`);
      }
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('Your Kaspa.ng shows "gRPC Server starting on: 127.0.0.1:16210" in logs');
  console.log('But the actual connection is being refused for RPC calls');
  console.log('');
  console.log('💡 Possible solutions:');
  console.log('1. Check if Kaspa.ng gRPC requires authentication/API key');
  console.log('2. Verify if gRPC is using protobuf instead of JSON-RPC');
  console.log('3. Check if there\'s a separate JSON-RPC port enabled');
  console.log('4. Try restarting Kaspa.ng completely');
  console.log('5. Look for alternative RPC options in Kaspa.ng settings');
}

testGrpcProtocols()
  .then(() => {
    console.log('\n🔍 Protocol test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Protocol test crashed:', error);
    process.exit(1);
  });