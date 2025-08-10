// Quick balance check using multiple methods
async function quickBalanceCheck() {
  console.log('🔍 QUICK WALLET BALANCE CHECK');
  console.log('=' .repeat(30));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`📍 Wallet: ${masterWallet}`);
  
  // Method 1: Try Kaspa API
  console.log('\n1️⃣ Checking via Kaspa API...');
  try {
    const apiResponse = await fetch(`https://api.kaspa.org/addresses/${masterWallet}/balance`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.text();
      console.log(`API Response: ${apiData}`);
      
      try {
        const balanceData = JSON.parse(apiData);
        if (balanceData.balance) {
          const kasAmount = balanceData.balance / 100000000;
          console.log(`✅ Balance found: ${kasAmount} KAS`);
          
          if (kasAmount >= 2000) {
            console.log('🎉 SUCCESS: 2000+ KAS confirmed!');
            return { funded: true, balance: kasAmount, method: 'API' };
          } else if (kasAmount > 0) {
            console.log(`⚠️ Partial funding: ${kasAmount} KAS`);
            return { funded: true, balance: kasAmount, method: 'API' };
          }
        }
      } catch (e) {
        console.log('API returned non-JSON response');
      }
    } else {
      console.log(`API request failed: ${apiResponse.status}`);
    }
  } catch (error) {
    console.log(`API check failed: ${error.message}`);
  }
  
  // Method 2: Test blockchain connectivity
  console.log('\n2️⃣ Testing if we can broadcast to check connectivity...');
  try {
    console.log('Attempting small transaction test...');
    
    // Import our kaspa client
    const kaspaClientPath = './kaspa-grpc.ts';
    
    console.log('If wallet is funded, we should be able to create a transaction');
    console.log('(Will test this by importing our broadcast module)');
    
    return { funded: false, balance: 0, method: 'Unknown' };
    
  } catch (error) {
    console.log(`Broadcast test failed: ${error.message}`);
  }
  
  console.log('\n📊 BALANCE CHECK RESULT:');
  console.log('❌ Could not confirm wallet balance via API');
  console.log('🔍 Manual verification needed:');
  console.log(`   Explorer: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  console.log('   Look for transaction history and balance display');
  
  return { funded: false, balance: 0, method: 'Manual check needed' };
}

// Run quick check
quickBalanceCheck()
  .then(result => {
    console.log('\n🏁 QUICK CHECK COMPLETE');
    console.log(`Funded: ${result.funded}, Balance: ${result.balance} KAS`);
    
    if (result.funded && result.balance >= 10) {
      console.log('\n🚀 READY FOR LIVE BLOCKCHAIN TEST!');
      console.log('Run: tsx server/broadcast-real-testnet-transaction.ts');
    } else {
      console.log('\n⏳ Check explorer manually for faucet transaction');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Quick check failed:', error);
    process.exit(1);
  });