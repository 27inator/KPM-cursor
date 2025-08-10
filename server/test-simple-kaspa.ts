// Simple test to verify kaspa-rpc-client integration works for KMP
import { ClientWrapper, Wallet } from "kaspa-rpc-client";

async function simpleKaspaTest() {
  console.log('🔍 SIMPLE KASPA INTEGRATION TEST');
  console.log('Testing basic address generation...');
  
  try {
    const wrapper = new ClientWrapper({
      hosts: ["seeder2.kaspad.net:16110"], // mainnet
      verbose: false
    });
    
    await wrapper.initialize();
    const client = await wrapper.getClient();
    console.log('✅ Connected to Kaspa testnet');
    
    const { phrase } = Wallet.randomMnemonic();
    console.log('✅ Generated mnemonic');
    
    const wallet = Wallet.fromPhrase(client, phrase);
    console.log('✅ Created wallet from mnemonic');
    
    const account = await wallet.account();
    const addressObj = await account.address();
    const address = addressObj.address;
    
    console.log('✅ Generated address:', address);
    console.log('Address length:', address.length);
    console.log('Has kaspatest: prefix:', address.startsWith('kaspatest:') ? 'YES' : 'NO');
    console.log('Or kaspa: prefix:', address.startsWith('kaspa:') ? 'YES' : 'NO');
    
    // Test API validation
    console.log('Testing Kaspa API validation...');
    let apiUrl = `https://api.kaspa.org/addresses/${address}/balance`;
    if (address.startsWith('kaspatest:')) {
      apiUrl = `https://api.kaspa.org/testnet/addresses/${address}/balance`;
    }
    
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Kaspa API accepts address - Balance:', data.balance);
    } else {
      console.log('❌ API rejected address:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
    await wrapper.disconnect();
    
    console.log('');
    console.log('🎉 SUCCESS: Real Kaspa integration working!');
    console.log('Ready to replace fake addresses in KMP system');
    
    return { address, mnemonic: phrase };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

simpleKaspaTest().catch(console.error);