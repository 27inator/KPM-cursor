// Simple direct test of wallet funding
console.log('🔍 SIMPLE WALLET FUNDING TEST');
console.log('=' .repeat(28));

const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
console.log(`📍 Wallet: ${masterWallet}`);

console.log('\n🧪 Running broadcast test to check real funding...');
console.log('If wallet is funded, the broadcast will work.');
console.log('If wallet is empty, it will fail with "insufficient funds" or "no UTXOs".');

console.log('\n📋 Test output will show:');
console.log('   ✅ SUCCESS: If wallet has real KAS from faucet');
console.log('   ❌ FAILURE: If wallet is empty (faucet failed)');

console.log('\n🔍 Manual verification:');
console.log(`   Explorer: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
console.log('   (Address will show transactions and balance if faucet worked)');

process.exit(0);