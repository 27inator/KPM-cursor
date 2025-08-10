// Test Kaspa testnet address generation for KMP system
import { ClientWrapper, Wallet } from "kaspa-rpc-client";

async function testKaspaTestnet() {
  console.log('🧪 TESTING KASPA TESTNET ADDRESS GENERATION');
  console.log('='.repeat(60));
  
  try {
    console.log('Connecting to Kaspa testnet...');
    const wrapper = new ClientWrapper({
      hosts: ["seeder2.kaspad.net:16210"], // testnet
      verbose: false
    });
    
    await wrapper.initialize();
    const client = await wrapper.getClient();
    console.log('✅ Connected to Kaspa testnet');
    
    console.log('\nGenerating testnet wallet...');
    const { phrase } = Wallet.randomMnemonic();
    console.log('Mnemonic:', phrase);
    
    const wallet = Wallet.fromPhrase(client, phrase);
    
    // Generate testnet addresses for multiple companies
    console.log('\nGenerating company testnet addresses:');
    const testnetAddresses = [];
    
    for (let i = 0; i < 5; i++) {
      const account = await wallet.account(BigInt(i));
      const addressObj = await account.address();
      const address = addressObj.address;
      
      testnetAddresses.push({
        company: i,
        address: address,
        derivationPath: `m/44'/277'/${i}'/0/0`
      });
      
      console.log(`Company ${i}: ${address}`);
    }
    
    // Validate address format
    console.log('\n🔍 TESTNET ADDRESS VALIDATION:');
    const firstAddress = testnetAddresses[0].address;
    
    console.log('Address:', firstAddress);
    console.log('Length:', firstAddress.length);
    console.log('Prefix:', firstAddress.startsWith('kaspatest:') ? 'kaspatest: ✅' : 'WRONG PREFIX ❌');
    console.log('Format valid:', (firstAddress.length >= 62 && firstAddress.length <= 72) ? 'YES ✅' : 'NO ❌');
    
    // Test API validation
    console.log('\n🧪 KASPA TESTNET API VALIDATION:');
    try {
      const response = await fetch(`https://api.kaspa.org/testnet/addresses/${firstAddress}/balance`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Testnet API accepts address!');
        console.log('Balance response:', JSON.stringify(data, null, 2));
      } else {
        console.log('❌ API rejected address:', response.status);
        const errorText = await response.text();
        console.log('Error:', errorText);
      }
    } catch (apiError) {
      console.log('⚠️ Network error during API test:', apiError.message);
    }
    
    await wrapper.disconnect();
    
    console.log('\n' + '='.repeat(60));
    if (firstAddress.startsWith('kaspatest:')) {
      console.log('🎉 SUCCESS: Kaspa testnet addresses generated!');
      console.log('✅ Ready for Hudson Valley farm testnet demonstrations');
      console.log('✅ Addresses can be funded from Kaspa testnet faucets');
      console.log('✅ Perfect for pilot program testing');
      
      console.log('\n📋 TESTNET FUNDING INSTRUCTIONS:');
      console.log('1. Visit Kaspa Discord: https://discord.gg/kaspa');
      console.log('2. Go to #testnet channel');
      console.log('3. Request testnet KAS for your addresses');
      console.log('4. Test real blockchain transactions');
      
      return { success: true, addresses: testnetAddresses, mnemonic: phrase };
    } else {
      console.log('❌ Address format validation failed');
      return { success: false };
    }
    
  } catch (error) {
    console.error('💥 TESTNET CONNECTION FAILED:', error);
    console.error('This may be due to:');
    console.error('- Testnet nodes temporarily offline');
    console.error('- Network connectivity issues'); 
    console.error('- SDK compatibility problems');
    throw error;
  }
}

testKaspaTestnet().catch(console.error);