// Try the direct KasBay faucet URL found in their service page
async function tryKasBayDirectFaucet() {
  console.log('🎯 TESTING KASBAY DIRECT FAUCET URL');
  console.log('=' .repeat(40));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  const directFaucetUrl = 'https://faucet-testnet.kaspanet.io/';
  
  console.log(`Target wallet: ${masterWallet}`);
  console.log(`Direct faucet URL: ${directFaucetUrl}`);
  
  try {
    console.log('\n1️⃣ Testing direct KasBay faucet URL...');
    
    const response = await fetch(directFaucetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const content = await response.text();
      
      console.log('✅ Direct faucet is accessible!');
      console.log(`Content preview: ${content.slice(0, 300)}...`);
      
      const hasForm = content.includes('<form') || content.includes('form');
      const hasInput = content.includes('<input') || content.includes('input');
      const hasAddress = content.toLowerCase().includes('address');
      const hasSubmit = content.includes('submit') || content.includes('Submit') || content.includes('claim') || content.includes('Claim');
      
      console.log(`Has form: ${hasForm ? '✅' : '❌'}`);
      console.log(`Has input: ${hasInput ? '✅' : '❌'}`);
      console.log(`Has address field: ${hasAddress ? '✅' : '❌'}`);
      console.log(`Has submit button: ${hasSubmit ? '✅' : '❌'}`);
      
      if (hasForm && hasInput) {
        console.log('\n2️⃣ This appears to be a functional faucet!');
        console.log('Trying API endpoints...');
        
        const apiEndpoints = [
          '/api/faucet',
          '/faucet',
          '/claim',
          '/drip',
          '/request'
        ];
        
        for (const endpoint of apiEndpoints) {
          try {
            const apiUrl = new URL(endpoint, directFaucetUrl).toString();
            console.log(`🔄 Testing ${apiUrl}...`);
            
            const apiResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'KMP-Testnet-Faucet-Request',
                'Origin': directFaucetUrl,
                'Referer': directFaucetUrl
              },
              body: JSON.stringify({
                address: masterWallet,
                amount: 1000000000, // 1 KAS in sompi
                wallet: masterWallet,
                kaspaAddress: masterWallet
              }),
              signal: AbortSignal.timeout(10000)
            });
            
            console.log(`   Status: ${apiResponse.status} ${apiResponse.statusText}`);
            
            if (apiResponse.ok) {
              const result = await apiResponse.json();
              console.log(`   ✅ API Success: ${JSON.stringify(result)}`);
              
              if (result.success || result.txid || result.transaction || result.hash || result.txId) {
                console.log('\n🎉 FUNDING REQUEST SUCCESSFUL!');
                console.log(`Transaction ID: ${result.txid || result.transaction || result.hash || result.txId}`);
                console.log(`Faucet: ${directFaucetUrl}`);
                
                return {
                  success: true,
                  faucetUrl: directFaucetUrl,
                  apiUrl: apiUrl,
                  txId: result.txid || result.transaction || result.hash || result.txId,
                  funded: true
                };
              } else if (result.error) {
                console.log(`   ⚠️ Faucet error: ${result.error}`);
                if (result.error.includes('already claimed') || result.error.includes('cooldown')) {
                  console.log('   (This means the faucet is working, but has usage limits)');
                }
              }
            } else {
              const errorText = await apiResponse.text();
              console.log(`   ⚠️ ${apiResponse.status}: ${errorText.slice(0, 100)}...`);
            }
            
          } catch (apiError) {
            console.log(`   ❌ ${endpoint}: ${apiError.message}`);
          }
        }
        
        console.log('\n3️⃣ Manual usage instructions:');
        console.log(`1. Visit: ${directFaucetUrl}`);
        console.log(`2. Enter address: ${masterWallet}`);
        console.log('3. Complete any captcha or verification');
        console.log('4. Click submit/claim button');
        console.log('5. Wait for transaction confirmation');
        
      } else {
        console.log('⚠️ Faucet structure unclear - manual interaction required');
      }
      
    } else if (response.status === 403) {
      console.log('❌ 403 Forbidden - Cloudflare protection active');
      console.log('Try accessing manually in browser with captcha completion');
    } else {
      console.log(`❌ Faucet not accessible: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Direct faucet test failed: ${error.message}`);
  }
  
  console.log('\n4️⃣ ALTERNATIVE APPROACHES:');
  console.log('=' .repeat(30));
  
  console.log('\n🌐 Manual Browser Testing:');
  console.log(`1. Visit: ${directFaucetUrl}`);
  console.log(`2. If Cloudflare protected, complete verification`);
  console.log(`3. Enter address: ${masterWallet}`);
  console.log('4. Submit request');
  
  console.log('\n💬 Community Support (Most Reliable):');
  console.log('Discord: https://discord.gg/kaspa (#testnet channel)');
  console.log('Message: "Need testnet KAS for blockchain supply chain project"');
  console.log(`Address: ${masterWallet}`);
  
  console.log('\n⛏️ CPU Mining Option:');
  console.log(`kaspa-miner --mining-address ${masterWallet} --testnet -t 1`);
  console.log('Requires Kaspa miner software installation');
  
  console.log('\n5️⃣ VERIFICATION AFTER FUNDING:');
  console.log('=' .repeat(30));
  console.log('');
  console.log('Once funded from any source:');
  console.log(`✅ Check explorer: https://explorer.kaspa.org/addresses/${masterWallet}?network=testnet`);
  console.log('✅ Test broadcast: tsx server/broadcast-real-testnet-transaction.ts');
  console.log('✅ Enable live supply chain blockchain proofs');
  
  return {
    directFaucetUrl: directFaucetUrl,
    masterWallet: masterWallet,
    manualRequired: true,
    alternativeOptions: ['Discord community', 'CPU mining', 'Manual browser'],
    nextSteps: 'Try manual browser access or Discord community funding'
  };
}

// Execute direct faucet test
tryKasBayDirectFaucet()
  .then(result => {
    if (result.funded) {
      console.log('\n🎉 FUNDING SUCCESSFUL!');
      console.log('Verify on explorer and test blockchain broadcasting');
    } else {
      console.log('\n🎯 MANUAL FUNDING APPROACHES AVAILABLE');
      console.log('Try direct browser access or Discord community for fastest results');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Direct faucet test failed:', error);
    process.exit(1);
  });