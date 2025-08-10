// Comprehensive search and test of all available Kaspa testnet faucets
async function comprehensiveFaucetSearch() {
  console.log('🔍 COMPREHENSIVE KASPA TESTNET FAUCET SEARCH');
  console.log('=' .repeat(50));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`Target wallet: ${masterWallet}`);
  
  // Known faucet URLs to test
  const faucetUrls = [
    'https://faucet.kaspa.org/',
    'https://kaspa-faucet.netlify.app/',
    'https://faucet-tn10.kaspanet.io/',
    'https://kaspa.faucetpay.io/',
    'https://testnet-faucet.kaspa.org/',
    'https://faucet.kaspanet.org/',
    'https://kaspa-testnet-faucet.herokuapp.com/',
    'https://kaspa-faucet.vercel.app/',
    'https://testnet.kaspa.network/faucet',
    'https://kaspad-testnet-faucet.fly.dev/',
    'https://kaspa-tn10-faucet.netlify.app/'
  ];
  
  console.log('\n1️⃣ Testing faucet accessibility...');
  
  const workingFaucets = [];
  const failedFaucets = [];
  
  for (const url of faucetUrls) {
    try {
      console.log(`\n🔄 Testing ${url}...`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br'
        },
        signal: AbortSignal.timeout(15000)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const content = await response.text();
        const hasForm = content.includes('<form') || content.includes('form');
        const hasAddress = content.toLowerCase().includes('address');
        const hasKaspa = content.toLowerCase().includes('kaspa');
        const hasTestnet = content.toLowerCase().includes('testnet');
        
        console.log(`   ✅ Accessible: ${url}`);
        console.log(`   Has form: ${hasForm ? '✅' : '❌'}`);
        console.log(`   Has address field: ${hasAddress ? '✅' : '❌'}`);
        console.log(`   Mentions Kaspa: ${hasKaspa ? '✅' : '❌'}`);
        console.log(`   Mentions testnet: ${hasTestnet ? '✅' : '❌'}`);
        
        if (hasForm && hasAddress && hasKaspa) {
          workingFaucets.push({
            url,
            status: response.status,
            hasForm,
            hasAddress,
            content: content.slice(0, 200)
          });
          console.log(`   🎉 POTENTIAL WORKING FAUCET!`);
        }
        
      } else if (response.status === 403) {
        console.log(`   ⚠️ 403 Forbidden - May have Cloudflare protection`);
        failedFaucets.push({ url, status: response.status, reason: 'Cloudflare protected' });
      } else if (response.status === 404) {
        console.log(`   ❌ 404 Not Found - Faucet doesn't exist`);
        failedFaucets.push({ url, status: response.status, reason: 'Not found' });
      } else {
        console.log(`   ⚠️ ${response.status} - May be temporarily down`);
        failedFaucets.push({ url, status: response.status, reason: 'Server error' });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failedFaucets.push({ url, status: 'error', reason: error.message });
    }
  }
  
  console.log('\n2️⃣ Testing API endpoints for working faucets...');
  
  for (const faucet of workingFaucets) {
    console.log(`\n🔄 Testing API for ${faucet.url}...`);
    
    const apiEndpoints = [
      '/api/faucet',
      '/api/drip',
      '/api/claim',
      '/faucet',
      '/drip',
      '/claim',
      '/.netlify/functions/faucet',
      '/api/request'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const apiUrl = new URL(endpoint, faucet.url).toString();
        
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
            kaspaAddress: masterWallet
          }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (apiResponse.ok) {
          const result = await apiResponse.json();
          console.log(`   ✅ API working: ${apiUrl}`);
          console.log(`   Response: ${JSON.stringify(result)}`);
          
          if (result.success || result.txid || result.transaction || result.hash) {
            console.log(`   🎉 FUNDING REQUEST SUCCESSFUL!`);
            console.log(`   TX ID: ${result.txid || result.transaction || result.hash}`);
            return {
              success: true,
              faucetUrl: faucet.url,
              apiUrl: apiUrl,
              txId: result.txid || result.transaction || result.hash,
              funded: true
            };
          }
        } else {
          console.log(`   ⚠️ ${apiResponse.status}: ${apiResponse.statusText}`);
        }
        
      } catch (apiError) {
        // Silent fail for API tests
      }
    }
  }
  
  console.log('\n3️⃣ Alternative faucet discovery...');
  
  // Try some community-known faucets
  const communityFaucets = [
    'https://kaspa-faucet.com/',
    'https://freekas.com/',
    'https://getkas.com/',
    'https://kaspa.tools/faucet',
    'https://tn10-faucet.kaspa.org/',
    'https://kaspatest-faucet.org/',
    'https://testnet.faucet.kaspa.network/'
  ];
  
  for (const url of communityFaucets) {
    try {
      console.log(`🔍 Checking ${url}...`);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        console.log(`   ✅ ${url} is accessible`);
        workingFaucets.push({ url, status: response.status });
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  console.log('\n4️⃣ RESULTS SUMMARY:');
  console.log('=' .repeat(25));
  
  console.log(`\n✅ Working faucets found: ${workingFaucets.length}`);
  workingFaucets.forEach(faucet => {
    console.log(`   • ${faucet.url} (Status: ${faucet.status})`);
  });
  
  console.log(`\n❌ Failed faucets: ${failedFaucets.length}`);
  failedFaucets.forEach(faucet => {
    console.log(`   • ${faucet.url} (${faucet.reason})`);
  });
  
  if (workingFaucets.length > 0) {
    console.log('\n🎯 MANUAL FUNDING INSTRUCTIONS:');
    console.log('Try these working faucets manually:');
    
    workingFaucets.forEach((faucet, i) => {
      console.log(`\n${i + 1}. ${faucet.url}`);
      console.log(`   - Visit the URL`);
      console.log(`   - Enter address: ${masterWallet}`);
      console.log(`   - Complete any captcha`);
      console.log(`   - Submit request`);
    });
  } else {
    console.log('\n⚠️ No working faucets found - use Discord community funding');
  }
  
  console.log('\n5️⃣ VERIFICATION AFTER FUNDING:');
  console.log('Once funded from any source:');
  console.log(`   Check: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  console.log(`   Test: tsx server/broadcast-real-testnet-transaction.ts`);
  
  return {
    workingFaucets: workingFaucets,
    failedFaucets: failedFaucets,
    totalTested: faucetUrls.length + communityFaucets.length,
    masterWallet: masterWallet
  };
}

// Execute comprehensive faucet search
comprehensiveFaucetSearch()
  .then(result => {
    console.log('\n🎯 FAUCET SEARCH COMPLETE');
    if (result.workingFaucets.length > 0) {
      console.log(`Found ${result.workingFaucets.length} working faucets - try manual funding`);
    } else {
      console.log('No working faucets found - use Discord community for funding');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Search failed:', error);
    process.exit(1);
  });