// Direct check of wallet on Kaspa testnet explorer
async function checkExplorerDirectly() {
  const wallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  
  console.log('Checking wallet directly on Kaspa testnet explorer...');
  console.log(`Wallet: ${wallet}`);
  
  // Try multiple testnet APIs
  const apis = [
    'https://tn10api.kaspad.net',
    'https://api.kaspa.org',
    'https://kaspa-testnet-api.netlify.app',
    'https://testnet-api.kaspa.network'
  ];
  
  for (const api of apis) {
    try {
      console.log(`\nTrying ${api}...`);
      
      const response = await fetch(`${api}/addresses/${wallet}/balance`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'KMP-Wallet-Check/1.0'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`Response: ${text}`);
        
        try {
          const data = JSON.parse(text);
          if (data.balance !== undefined) {
            const kasBalance = data.balance / 100000000;
            console.log(`BALANCE FOUND: ${kasBalance} KAS`);
            
            if (kasBalance > 0) {
              return { success: true, balance: kasBalance, api };
            }
          }
        } catch (e) {
          console.log('Non-JSON response');
        }
      }
      
    } catch (error) {
      console.log(`Failed: ${error.message}`);
    }
  }
  
  return { success: false, balance: 0 };
}

checkExplorerDirectly()
  .then(result => {
    if (result.success) {
      console.log(`\nCONFIRMED: ${result.balance} KAS in wallet`);
    } else {
      console.log('\nWallet appears empty or APIs unavailable');
      console.log('Manual check: https://explorer.kaspa.org/addresses/kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d?network=testnet');
    }
    process.exit(0);
  });