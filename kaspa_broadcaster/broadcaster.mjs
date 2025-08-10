import fs from 'fs/promises';
import { existsSync } from 'fs';
import cron from 'node-cron';
import crypto from 'crypto';
import { RpcClient, PrivateKey, Keypair, createTransactions, NetworkId } from 'kaspa-wasm32-sdk';

const BUS_ROOTS_FILE = 'pending_roots.txt';
const OUTPUT_FILE = 'anchored_txs.json';
const KASPA_NODE = 'ws://127.0.0.1:17210'; // local wRPC endpoint for testnet-10

// Master wallet for funding anchoring transactions - SECURE: Use environment variable
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || (() => {
  console.error('❌ SECURITY ERROR: MASTER_MNEMONIC environment variable not set!');
  console.error('Set it with: export MASTER_MNEMONIC="your secure mnemonic"');
  process.exit(1);
})();

// Function to generate HD wallet from mnemonic (same as main server)
function generateHDKeypair(mnemonic, derivationIndex = 0) {
  // Create deterministic seed from mnemonic + derivation path
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  // Create private key from seed (first 32 bytes)
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

async function anchorPendingRoots() {
  try {
    if (!existsSync(BUS_ROOTS_FILE)) {
      console.log('[Broadcaster] No pending roots file found');
      return;
    }
    
    const raw = await fs.readFile(BUS_ROOTS_FILE, 'utf8');
    const roots = raw.split('\n').map(r => r.trim()).filter(Boolean);
    
    if (!roots.length) {
      console.log('[Broadcaster] No pending roots to anchor');
      return;
    }
    
    const root = roots[roots.length - 1]; // latest root
    console.log(`[Broadcaster] Anchoring root: ${root}`);

    // Connect to Kaspa testnet
    console.log(`[Broadcaster] Connecting to ${KASPA_NODE}...`);
    const rpc = new RpcClient({
      url: KASPA_NODE,
      encoding: "borsh",
      networkId: NetworkId.Testnet10
    });

    await rpc.connect();
    console.log(`[Broadcaster] Connected to Kaspa successfully`);

    // Create keypair from master mnemonic using HD derivation (same as main server)
    const keypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    
    // Use the specific master wallet address
    const address = "kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem";
    
    console.log(`[Broadcaster] Using master wallet address: ${address}`);
    
    // Validate address has correct testnet prefix
    if (!address.startsWith('kaspatest:')) {
      throw new Error(`Expected testnet address (kaspatest:), got: ${address}`);
    }

    console.log('[Broadcaster] ✅ Using master wallet address');
    
    // Try to get UTXOs
    let entries;
    try {
      const result = await rpc.getUtxosByAddresses({ addresses: [address] });
      entries = result.entries;
    } catch (error) {
      if (error.message.includes('--utxoindex')) {
        console.log('[Broadcaster] ⚠️  Public node lacks UTXO indexing, using alternative approach');
        // For now, create a minimal transaction without specific UTXO fetching
        // This is a workaround until we find a node with UTXO indexing
        return;
      }
      throw error;
    }
    
    if (!entries || entries.length === 0) {
      console.log('[Broadcaster] No UTXOs available for anchoring');
      return;
    }

    console.log(`[Broadcaster] Found ${entries.length} UTXOs`);

    // Create OP_RETURN transaction with the Merkle root
    const opReturnData = Buffer.from(root, 'hex');
    
        // Build transaction
    try {
      const { transactions } = await createTransactions({
        entries,
        outputs: [],
        changeAddress: address,
        priorityFee: 1000n, // 1000 sompi fee
        networkId: "testnet-10",
        opReturnData
      });

      if (!transactions || transactions.length === 0) {
        console.log('[Broadcaster] Failed to create transaction');
        return;
      }

      // Sign and submit transaction
      const transaction = transactions[0];
      const privateKey = generateHDKeypair(MASTER_MNEMONIC, 0).privateKey;
      
      // Sign the transaction
      transaction.sign([privateKey]);
      
      // Submit the transaction - try just passing the transaction directly
      const txidResult = await rpc.submitTransaction(transaction);
      const txid = txidResult.transactionId || txidResult.id || txidResult.toString();
      
            console.log(`[Broadcaster] ✅ Anchored root ${root} → TX ${txid}`);
      console.log(`[Broadcaster] Explorer: https://explorer-tn10.kaspa.org/txs/${txid}`);
      
      await rpc.disconnect();

      // Log result
      const entry = {
        root,
        txid: txid,
        timestamp: Math.floor(Date.now() / 1000),
        explorerUrl: `https://explorer-tn10.kaspa.org/txs/${txid}`
      };

      const outputData = JSON.stringify(entry) + '\n';
      await fs.appendFile(OUTPUT_FILE, outputData);

      // Clear pending roots
      await fs.writeFile(BUS_ROOTS_FILE, '');
      
    } catch (txError) {
      console.log('[Broadcaster] Transaction creation/submission error:', txError);
      
      // If the wrapped approach fails, try the original { transaction } format
      console.log('[Broadcaster] Trying alternative submission format...');
      
      try {
        const { transactions } = await createTransactions({
          entries,
          outputs: [],
          changeAddress: address,
          priorityFee: 1000n,
          networkId: "testnet-10",
          opReturnData
        });

        const transaction = transactions[0];
        const privateKey = generateHDKeypair(MASTER_MNEMONIC, 0).privateKey;
        transaction.sign([privateKey]);

        const txidResult = await rpc.submitTransaction({ transaction });
        const txid = txidResult.transactionId || txidResult.id || txidResult.toString();
        console.log(`[Broadcaster] ✅ Anchored root ${root} → TX ${txid} (alternative format)`);
        console.log(`[Broadcaster] Explorer: https://explorer-tn10.kaspa.org/txs/${txid}`);
        
        await rpc.disconnect();

        // Log result
        const entry = {
          root,
          txid: txid,
          timestamp: Math.floor(Date.now() / 1000),
          explorerUrl: `https://explorer-tn10.kaspa.org/txs/${txid}`
        };

        const outputData = JSON.stringify(entry) + '\n';
        await fs.appendFile(OUTPUT_FILE, outputData);

        // Clear pending roots
        await fs.writeFile(BUS_ROOTS_FILE, '');
        
      } catch (altError) {
        console.log('[Broadcaster] Alternative format also failed:', altError);
        await rpc.disconnect();
        return;
      }
        }

  } catch (error) {
    console.error('[Broadcaster] Error anchoring roots:', error);
  }
}

// Schedule to run every minute
cron.schedule('* * * * *', anchorPendingRoots);

console.log('[Broadcaster] Started - will anchor roots every minute');
console.log(`[Broadcaster] Watching: ${BUS_ROOTS_FILE}`);
console.log(`[Broadcaster] Output: ${OUTPUT_FILE}`);

// Run once at startup
anchorPendingRoots();