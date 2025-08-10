// Test the newly discovered Kaspa testnet faucets
async function testDiscoveredFaucets() {
  console.log('🎯 TESTING NEWLY DISCOVERED KASPA TESTNET FAUCETS');
  console.log('=' .repeat(55));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`Target wallet: ${masterWallet}`);
  
  // High-priority faucets discovered from web search
  const priorityFaucets = [
    {
      name: 'KasBay Testnet Faucet',
      url: 'https://kasbay.org/services/kaspa-testnet-faucet',
      apiUrl: 'https://kasbay.org/api/faucet',
      description: 'Active service provider for Kaspa testnet funding'
    },
    {
      name: 'Zealous Swap Testnet Faucet',
      url: 'https://kasplex-testnet.zealousswap.com/faucet',
      apiUrl: 'https://kasplex-testnet.zealousswap.com/api/faucet',
      description: 'Part of Kasplex testnet ecosystem, offers multiple test tokens'
    },
    {
      name: 'GetKAS Faucet (Found Working)',
      url: 'https://getkas.com/',
      apiUrl: 'https://getkas.com/api/faucet',
      description: 'Previously detected as accessible'
    }
  ];
  
  console.log('\n1️⃣ Testing priority faucets...');
  
  for (const faucet of priorityFaucets) {
    console.log(`\n🔄 Testing ${faucet.name}...`);
    console.log(`   URL: ${faucet.url}`);
    
    try {
      // Test main website
      const response = await fetch(faucet.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const content = await response.text();
        const hasForm = content.includes('<form') || content.includes('form');
        const hasAddress = content.toLowerCase().includes('address') || content.toLowerCase().includes('wallet');
        const hasKaspa = content.toLowerCase().includes('kaspa') || content.toLowerCase().includes('kas');
        const hasTestnet = content.toLowerCase().includes('testnet') || content.toLowerCase().includes('test');
        const hasFaucet = content.toLowerCase().includes('faucet') || content.toLowerCase().includes('drip');
        
        console.log(`   ✅ Website accessible`);
        console.log(`   Has form: ${hasForm ? '✅' : '❌'}`);
        console.log(`   Has address field: ${hasAddress ? '✅' : '❌'}`);
        console.log(`   Mentions Kaspa: ${hasKaspa ? '✅' : '❌'}`);
        console.log(`   Mentions testnet: ${hasTestnet ? '✅' : '❌'}`);
        console.log(`   Is faucet: ${hasFaucet ? '✅' : '❌'}`);
        
        if (hasForm && hasAddress && (hasKaspa || hasFaucet)) {
          console.log(`   🎉 ${faucet.name} looks like a working faucet!`);
          
          // Try API endpoint
          console.log(`   🔄 Testing API endpoint...`);
          
          const apiEndpoints = [
            faucet.apiUrl,
            faucet.url + '/api/faucet',
            faucet.url + '/faucet',
            faucet.url + '/api/drip',
            faucet.url + '/.netlify/functions/faucet'
          ];
          
          for (const apiUrl of apiEndpoints) {
            try {
              const apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'KMP-Testnet-Request',
                  'Origin': faucet.url,
                  'Referer': faucet.url
                },
                body: JSON.stringify({
                  address: masterWallet,
                  amount: 1000000000, // 1 KAS
                  wallet: masterWallet,
                  kaspaAddress: masterWallet,
                  testnetAddress: masterWallet
                }),
                signal: AbortSignal.timeout(10000)
              });
              
              console.log(`      API ${apiUrl}: ${apiResponse.status} ${apiResponse.statusText}`);
              
              if (apiResponse.ok) {
                const result = await apiResponse.json();
                console.log(`      ✅ API Response: ${JSON.stringify(result).slice(0, 150)}...`);
                
                if (result.success || result.txid || result.transaction || result.hash) {
                  console.log(`      🎉 FUNDING REQUEST SUCCESSFUL!`);
                  console.log(`      TX ID: ${result.txid || result.transaction || result.hash}`);
                  
                  return {
                    success: true,
                    faucetName: faucet.name,
                    faucetUrl: faucet.url,
                    apiUrl: apiUrl,
                    txId: result.txid || result.transaction || result.hash,
                    funded: true
                  };
                }
              } else if (apiResponse.status === 400) {
                const errorText = await apiResponse.text();
                console.log(`      ⚠️ 400 Error: ${errorText.slice(0, 100)}...`);
              }
              
            } catch (apiError) {
              console.log(`      ❌ API Error: ${apiError.message}`);
            }
          }
          
        } else {
          console.log(`   ⚠️ ${faucet.name} doesn't appear to be a functional faucet`);
        }
        
      } else if (response.status === 403) {
        console.log(`   ⚠️ 403 Forbidden - ${faucet.name} has Cloudflare protection`);
      } else {
        console.log(`   ❌ ${faucet.name} not accessible: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${faucet.name} failed: ${error.message}`);
    }
  }
  
  console.log('\n2️⃣ Testing additional discovered faucets...');
  
  const additionalFaucets = [
    'https://kaspa.tools/faucet',
    'https://kaspa-faucet.com/',
    'https://freekas.com/',
    'https://tn10-faucet.kaspa.org/',
    'https://kaspatest-faucet.org/'
  ];
  
  for (const url of additionalFaucets) {
    try {
      console.log(`🔍 Quick test: ${url}...`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        console.log(`   ✅ ${url} is accessible (${response.status})`);
        
        // Quick form test
        const fullResponse = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(8000)
        });
        
        if (fullResponse.ok) {
          const content = await fullResponse.text();
          const isLikelyFaucet = content.toLowerCase().includes('faucet') && 
                                content.toLowerCase().includes('address') &&
                                (content.toLowerCase().includes('kaspa') || content.toLowerCase().includes('testnet'));
          
          if (isLikelyFaucet) {
            console.log(`   🎯 ${url} looks like a Kaspa faucet - try manual funding!`);
          }
        }
      }
    } catch (error) {
      // Silent fail for quick tests
    }
  }
  
  console.log('\n3️⃣ MANUAL FUNDING INSTRUCTIONS:');
  console.log('=' .repeat(35));
  console.log('');
  console.log('🎯 Try these faucets manually in your browser:');
  console.log('');
  
  priorityFaucets.forEach((faucet, i) => {
    console.log(`${i + 1}. ${faucet.name}`);
    console.log(`   URL: ${faucet.url}`);
    console.log(`   Steps: Visit → Enter address → Submit`);
    console.log(`   Address: ${masterWallet}`);
    console.log('');
  });
  
  console.log('4️⃣ MINING ALTERNATIVE:');
  console.log('=' .repeat(25));
  console.log('');
  console.log('🔨 CPU Mining directly to your wallet:');
  console.log(`   kaspa-miner --mining-address ${masterWallet} --testnet -t 1`);
  console.log('   This mines testnet blocks directly to your address');
  console.log('   Requires Kaspa miner software');
  console.log('');
  
  console.log('5️⃣ COMMUNITY FUNDING (MOST RELIABLE):');
  console.log('=' .repeat(40));
  console.log('');
  console.log('💬 Discord: https://discord.gg/kaspa');
  console.log('   Join #testnet channel');
  console.log('   Ask: "Need testnet KAS for supply chain blockchain project"');
  console.log(`   Share: ${masterWallet}`);
  console.log('');
  console.log('📱 Telegram: https://t.me/kaspaofficial');
  console.log('   Same message and address');
  
  console.log('\n6️⃣ VERIFICATION AFTER FUNDING:');
  console.log('=' .repeat(30));
  console.log('');
  console.log('Once funded from ANY source:');
  console.log(`✅ Explorer: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  console.log('✅ Test live broadcast: tsx server/broadcast-real-testnet-transaction.ts');
  console.log('✅ Supply chain events get real blockchain proofs');
  
  return {
    priorityFaucets: priorityFaucets,
    masterWallet: masterWallet,
    fundingOptions: ['Manual faucet', 'CPU mining', 'Discord community', 'Telegram'],
    nextSteps: 'Try priority faucets manually, then Discord if needed'
  };
}

// Execute discovered faucet testing
testDiscoveredFaucets()
  .then(result => {
    if (result.funded) {
      console.log('\n🎉 FUNDING SUCCESSFUL!');
      console.log('Check explorer for confirmation and test blockchain broadcasting');
    } else {
      console.log('\n🎯 MANUAL FUNDING REQUIRED');
      console.log('Try the priority faucets manually or use Discord community');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Faucet testing failed:', error);
    process.exit(1);
  });