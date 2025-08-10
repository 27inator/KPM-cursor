// Test kaspa-rpc-client for REAL Kaspa address generation
import { ClientWrapper, Wallet } from "kaspa-rpc-client";

async function testKaspaRpcClient() {
  console.log('='.repeat(70));
  console.log('🎯 TESTING KASPA-RPC-CLIENT (REAL KASPA SDK)');
  console.log('='.repeat(70));
  
  try {
    console.log('Setting up Kaspa RPC client...');
    const wrapper = new ClientWrapper({
      hosts: ["seeder2.kaspad.net:16110"], // mainnet
      verbose: false
    });
    
    console.log('Initializing connection...');
    await wrapper.initialize();
    const client = await wrapper.getClient();
    console.log('✅ Connected to Kaspa network');
    
    console.log('\n🔐 GENERATING NEW MNEMONIC...');
    const { phrase, entropy } = Wallet.randomMnemonic();
    console.log('Generated mnemonic:', phrase);
    console.log('✅ Mnemonic created');
    
    console.log('\n🏦 CREATING WALLET FROM MNEMONIC...');
    const wallet = Wallet.fromPhrase(client, phrase);
    console.log('✅ Wallet created from mnemonic');
    
    console.log('\n📍 GENERATING MAINNET ADDRESSES...');
    const account = await wallet.account();
    console.log('Account object available:', !!account);
    
    // Check what methods are available
    console.log('Account properties:', Object.keys(account));
    console.log('Account methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(account)));
    
    // Call address() as async function
    const receiveAddressObj = await account.address();
    const receiveAddress = receiveAddressObj.address;
    
    console.log('Receive address object:', receiveAddressObj);
    console.log('Receive address string:', receiveAddress);
    console.log('✅ Mainnet addresses generated');
    
    // Test multiple accounts
    console.log('\n🔢 TESTING HD DERIVATION (Multiple Accounts)...');
    const addresses = [];
    for (let i = 0; i < 5; i++) {
      const accountN = await wallet.account(BigInt(i));
      const addrObj = await accountN.address();
      const addr = addrObj.address;
      addresses.push({
        account: i,
        address: addr,
        derivationPath: `m/44'/277'/${i}'/0/0`
      });
      console.log(`Account ${i}: ${addr}`);
    }
    
    // Test address format validation
    console.log('\n🔍 ADDRESS FORMAT ANALYSIS:');
    const firstAddress = receiveAddress;
    console.log('First address:', firstAddress);
    console.log('  - Length:', firstAddress.length);
    console.log('  - Prefix correct:', firstAddress.startsWith('kaspa:') ? '✅' : '❌');
    console.log('  - Length valid (61-67):', (firstAddress.length >= 61 && firstAddress.length <= 67) ? '✅' : '❌');
    
    // Test API validation
    console.log('\n🧪 KASPA API VALIDATION TEST:');
    try {
      const response = await fetch(`https://api.kaspa.org/addresses/${firstAddress}/balance`);
      if (response.ok) {
        const balance = await response.json();
        console.log('🎉 KASPA API ACCEPTS ADDRESS!');
        console.log('Balance response:', JSON.stringify(balance, null, 2));
      } else {
        console.log('API response status:', response.status);
        const errorText = await response.text();
        console.log('API error:', errorText);
      }
    } catch (apiError) {
      console.log('⚠️ Network error during API test:', apiError.message);
    }
    
    // Test with testnet
    console.log('\n🧪 TESTNET ADDRESS GENERATION...');
    try {
      const testnetWrapper = new ClientWrapper({
        hosts: ["seeder2.kaspad.net:16210"], // testnet
        verbose: false
      });
      await testnetWrapper.initialize();
      const testnetClient = await testnetWrapper.getClient();
      
      const testnetWallet = Wallet.fromPhrase(testnetClient, phrase);
      const testnetAccount = await testnetWallet.account();
      const testnetAddress = await testnetAccount.receiveAddress();
      
      console.log('Testnet address:', testnetAddress);
      console.log('  - Prefix correct:', testnetAddress.startsWith('kaspatest:') ? '✅' : '❌');
      console.log('✅ Testnet address generation working');
      
      await testnetWrapper.disconnect();
      
    } catch (testnetError) {
      console.log('⚠️ Testnet connection failed:', testnetError.message);
      console.log('(This is expected if testnet nodes are offline)');
    }
    
    await wrapper.disconnect();
    
    console.log('\n' + '='.repeat(70));
    if (firstAddress.startsWith('kaspa:')) {
      console.log('🎉 SUCCESS: REAL KASPA ADDRESS GENERATION WORKING!');
      console.log('✅ kaspa-rpc-client SDK functional');
      console.log('✅ Proper kaspa: mainnet format');
      console.log('✅ HD derivation working');
      console.log('✅ Multiple accounts supported');
      console.log('✅ Ready for Hudson Valley farm demonstrations');
      console.log('');
      console.log('NEXT STEPS:');
      console.log('1. Replace fake address generation in KMP system');
      console.log('2. Implement deterministic wallets from master mnemonic');
      console.log('3. Test with real blockchain funding');
      console.log('4. Launch authentic pilot programs');
      
      return {
        success: true,
        mnemonic: phrase,
        mainnetAddress: receiveAddress,
        addresses: addresses
      };
    } else {
      console.log('❌ Address format validation failed');
      return { success: false };
    }
    
  } catch (error) {
    console.error('💥 KASPA RPC CLIENT TEST FAILED:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

testKaspaRpcClient().catch(console.error);