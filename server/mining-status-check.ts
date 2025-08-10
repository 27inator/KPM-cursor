// Check mining status and wallet balance
async function checkMiningStatus() {
  console.log('📊 CHECKING MINING STATUS & WALLET BALANCE');
  console.log('=' .repeat(45));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`Checking wallet: ${masterWallet}`);
  
  console.log('\n1️⃣ Explorer Balance Check:');
  console.log('=' .repeat(25));
  
  try {
    // Try multiple explorer APIs
    const explorerUrls = [
      `https://api.kaspa.org/addresses/${masterWallet}/balance?network=testnet`,
      `https://explorer.kaspa.org/api/addresses/${masterWallet}?network=testnet`,
      `https://kaspa.aspectron.org/api/addresses/${masterWallet}/balance`
    ];
    
    for (const url of explorerUrls) {
      try {
        console.log(`🔍 Checking ${url}...`);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'KMP-Mining-Status-Check',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ Response: ${JSON.stringify(data).slice(0, 200)}...`);
          
          // Check for balance indicators
          if (data.balance || data.confirmedBalance || data.total) {
            const balance = data.balance || data.confirmedBalance || data.total;
            if (balance > 0) {
              console.log(`   🎉 BALANCE FOUND: ${balance} sompi`);
              console.log(`   💰 KAS Amount: ${balance / 100000000} KAS`);
              return { funded: true, balance: balance, source: url };
            }
          }
          
          if (data.error && data.error.includes('not found')) {
            console.log('   📝 Address not found (normal for unfunded addresses)');
          }
        } else if (response.status === 400) {
          console.log('   📝 400 Bad Request (address exists but no transactions yet)');
        }
        
      } catch (error) {
        console.log(`   ❌ ${url} failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Explorer checks failed: ${error.message}`);
  }
  
  console.log('\n2️⃣ Node Balance Check:');
  console.log('=' .repeat(20));
  
  try {
    console.log('🔍 Checking via local Kaspa.ng node...');
    
    const nodeResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalance',
        params: [masterWallet],
        id: 1
      }),
      signal: AbortSignal.timeout(5000)
    });
    
    if (nodeResponse.ok) {
      const nodeData = await nodeResponse.json();
      console.log(`   Node response: ${JSON.stringify(nodeData)}`);
      
      if (nodeData.result && nodeData.result.available) {
        const balance = nodeData.result.available;
        console.log(`   🎉 NODE BALANCE: ${balance} sompi (${balance / 100000000} KAS)`);
        return { funded: true, balance: balance, source: 'local node' };
      }
    } else {
      console.log(`   ⚠️ Node response: ${nodeResponse.status}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Node check failed: ${error.message}`);
  }
  
  console.log('\n3️⃣ Mining Process Check:');
  console.log('=' .repeat(25));
  
  try {
    const { execSync } = require('child_process');
    
    console.log('🔍 Checking for running kaspa-miner processes...');
    
    const processes = execSync('ps aux | grep kaspa-miner | grep -v grep', { encoding: 'utf8' });
    
    if (processes.trim()) {
      console.log('✅ Mining process found:');
      console.log(`   ${processes.trim()}`);
    } else {
      console.log('❌ No mining process running');
      console.log('   Start mining with: ./kaspa-miner --testnet --mining-address ' + masterWallet + ' -s pool.kaspa.org -p 16210 -t 1');
    }
    
  } catch (error) {
    console.log('❌ No mining processes found');
  }
  
  console.log('\n4️⃣ Current Status Summary:');
  console.log('=' .repeat(30));
  console.log('');
  console.log('📍 Wallet Address:');
  console.log(`   ${masterWallet}`);
  console.log('');
  console.log('🔗 Explorer Links:');
  console.log(`   https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  console.log(`   (Will show transactions and balance once funded)`);
  console.log('');
  console.log('⛏️ Mining Options:');
  console.log('   1. CPU Mining: ~/kaspa-miner --testnet --mining-address ' + masterWallet + ' -s pool.kaspa.org -p 16210 -t 1');
  console.log('   2. Discord Funding: https://discord.gg/kaspa (#testnet channel)');
  console.log('   3. Manual Faucets: Try Cloudflare-protected faucets in browser');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('   - If no balance: Continue mining or get Discord funding');
  console.log('   - If balance found: Test blockchain broadcasting with tsx server/broadcast-real-testnet-transaction.ts');
  console.log('   - Once funded: KMP system fully operational with live blockchain proofs');
  
  return {
    funded: false,
    explorerChecked: true,
    nodeChecked: true,
    miningProcessChecked: true,
    recommendedAction: 'Continue mining or Discord funding'
  };
}

// Execute mining status check
checkMiningStatus()
  .then(result => {
    if (result.funded) {
      console.log('\n🎉 WALLET FUNDED - READY FOR BLOCKCHAIN TESTING!');
      console.log('Run: tsx server/broadcast-real-testnet-transaction.ts');
    } else {
      console.log('\n⛏️ WALLET NOT YET FUNDED - CONTINUE MINING OR GET DISCORD FUNDING');
      console.log('Mining may take time to find blocks on testnet');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Status check failed:', error);
    process.exit(1);
  });