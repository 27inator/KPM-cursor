// Check REAL wallet balance on actual Kaspa blockchain
import fetch from 'node-fetch';

async function checkRealWalletBalance() {
  console.log('🔍 CHECKING REAL BLOCKCHAIN WALLET BALANCE');
  console.log('=' .repeat(42));
  
  const masterWallet = 'kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d';
  console.log(`📍 Wallet: ${masterWallet}`);
  
  // Method 1: Direct blockchain API call
  console.log('\n1️⃣ Checking via Kaspa blockchain API...');
  try {
    // Try the official Kaspa API for testnet
    const apiUrl = `https://api.kaspa.org/addresses/${masterWallet}/balance`;
    console.log(`API URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'KMP-System/1.0'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        if (data.balance && data.balance > 0) {
          const kasBalance = data.balance / 100000000;
          console.log(`✅ REAL BALANCE FOUND: ${kasBalance} KAS`);
          return { success: true, balance: kasBalance, source: 'API' };
        } else {
          console.log('❌ API shows zero balance');
          return { success: true, balance: 0, source: 'API' };
        }
      } catch (e) {
        console.log('❌ Invalid JSON response from API');
      }
    }
  } catch (error) {
    console.log(`❌ API check failed: ${error.message}`);
  }
  
  // Method 2: Try alternative testnet explorer
  console.log('\n2️⃣ Checking via explorer API...');
  try {
    const explorerUrl = `https://explorer.kaspa.org/api/addresses/${masterWallet}`;
    console.log(`Explorer URL: ${explorerUrl}`);
    
    const explorerResponse = await fetch(explorerUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'KMP-System/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Explorer status: ${explorerResponse.status}`);
    const explorerText = await explorerResponse.text();
    console.log(`Explorer response: ${explorerText.substring(0, 200)}...`);
    
    if (explorerResponse.ok) {
      try {
        const explorerData = JSON.parse(explorerText);
        if (explorerData.balance) {
          const kasBalance = explorerData.balance / 100000000;
          console.log(`✅ EXPLORER BALANCE: ${kasBalance} KAS`);
          return { success: true, balance: kasBalance, source: 'Explorer' };
        }
      } catch (e) {
        console.log('❌ Invalid JSON from explorer');
      }
    }
  } catch (error) {
    console.log(`❌ Explorer check failed: ${error.message}`);
  }
  
  // Method 3: Try direct node query using proper RPC
  console.log('\n3️⃣ Checking via your local Kaspa.ng node...');
  try {
    // Use the exact same connection method as your KMP app
    const nodeResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getBalanceByAddress',
        params: {
          address: masterWallet
        },
        id: 1
      }),
      timeout: 10000
    });
    
    console.log(`Node response status: ${nodeResponse.status}`);
    
    if (nodeResponse.ok) {
      const nodeData = await nodeResponse.json();
      console.log(`Node response: ${JSON.stringify(nodeData)}`);
      
      if (nodeData.result && nodeData.result.balance !== undefined) {
        const kasBalance = nodeData.result.balance / 100000000;
        console.log(`✅ NODE BALANCE: ${kasBalance} KAS`);
        return { success: true, balance: kasBalance, source: 'LocalNode' };
      }
    }
  } catch (error) {
    console.log(`❌ Node check failed: ${error.message}`);
  }
  
  // Method 4: Alternative node method
  console.log('\n4️⃣ Trying alternative node RPC method...');
  try {
    const altResponse = await fetch('http://127.0.0.1:16210', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getUtxosByAddresses',
        params: {
          addresses: [masterWallet]
        },
        id: 2
      }),
      timeout: 10000
    });
    
    if (altResponse.ok) {
      const utxoData = await altResponse.json();
      console.log(`UTXO response: ${JSON.stringify(utxoData)}`);
      
      if (utxoData.result && Array.isArray(utxoData.result) && utxoData.result.length > 0) {
        let totalBalance = 0;
        utxoData.result.forEach(utxo => {
          totalBalance += parseInt(utxo.amount);
        });
        
        const kasBalance = totalBalance / 100000000;
        console.log(`✅ UTXO BALANCE: ${kasBalance} KAS from ${utxoData.result.length} UTXOs`);
        return { success: true, balance: kasBalance, source: 'NodeUTXO' };
      } else {
        console.log('❌ No UTXOs found - wallet is empty');
        return { success: true, balance: 0, source: 'NodeUTXO' };
      }
    }
  } catch (error) {
    console.log(`❌ Alternative node check failed: ${error.message}`);
  }
  
  console.log('\n❌ ALL BALANCE CHECKS FAILED');
  console.log('Unable to determine real wallet balance from any source');
  return { success: false, balance: 0, source: 'None' };
}

// Execute real balance check
checkRealWalletBalance()
  .then(result => {
    console.log('\n📊 REAL WALLET BALANCE RESULT');
    console.log('=' .repeat(30));
    
    if (result.success && result.balance > 0) {
      console.log(`✅ CONFIRMED: ${result.balance} KAS in wallet (via ${result.source})`);
      
      if (result.balance >= 100) {
        console.log('🚀 READY: Sufficient funds for blockchain testing');
        console.log('Next: Run live transaction broadcast test');
      } else if (result.balance >= 10) {
        console.log('⚠️ LIMITED: Basic testing possible');
      } else {
        console.log('⚠️ INSUFFICIENT: Need more funding for testing');
      }
      
    } else if (result.success) {
      console.log('❌ EMPTY: Wallet has zero balance on blockchain');
      console.log('Faucet funding did not go through or is still processing');
      
    } else {
      console.log('❌ UNKNOWN: Could not determine real balance');
      console.log('Check manually: https://explorer.kaspa.org/addresses/kaspatest:8847587bcabc67f0664ef9545d33605faa2ba75d?network=testnet');
    }
    
    process.exit(0);
  })
  .catch(error => {
    console.error('Real balance check failed:', error);
    process.exit(1);
  });