import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';
import { RpcClient, PrivateKey, Keypair, createTransactions, NetworkId } from 'kaspa-wasm32-sdk';

const BUS_ROOTS_FILE = 'pending_roots.txt';
const OUTPUT_FILE = 'anchored_txs.json';
const KASPA_NODE = 'ws://127.0.0.1:17210';

// Master wallet for funding anchoring transactions
const MASTER_MNEMONIC = "arrest acid fall interest comfort expire aunt combine actor tackle stove coral";

function generateHDKeypair(mnemonic, derivationIndex = 0) {
  const seed = crypto.createHmac('sha256', mnemonic)
    .update(`m/44'/277'/${derivationIndex}'/0/0`)
    .digest();
  
  const privateKeyBytes = seed.slice(0, 32);
  const privateKeyHex = privateKeyBytes.toString('hex');
  
  return new PrivateKey(privateKeyHex).toKeypair();
}

async function testBroadcast() {
  try {
    console.log('🚀 Testing Manual Broadcast to Kaspa Testnet\n');
    
    if (!existsSync(BUS_ROOTS_FILE)) {
      console.log('❌ No pending roots file found');
      return;
    }
    
    const raw = await fs.readFile(BUS_ROOTS_FILE, 'utf8');
    const roots = raw.split('\n').map(r => r.trim()).filter(Boolean);
    
    if (!roots.length) {
      console.log('❌ No pending roots to anchor');
      return;
    }
    
    console.log(`📋 Found ${roots.length} pending events to broadcast`);
    
    // Take the first pending root for testing
    const rootData = JSON.parse(roots[0]);
    console.log(`📧 Testing with root: ${rootData.hash}`);
    console.log(`🏢 Company: ${rootData.companyId}`);
    console.log(`⭐ Type: ${rootData.type}`);
    
    // Connect to Kaspa testnet
    console.log(`🔗 Connecting to Kaspa node: ${KASPA_NODE}`);
    const rpc = new RpcClient({
      url: KASPA_NODE,
      encoding: "borsh",
      networkId: NetworkId.Testnet
    });
    
    console.log('⏳ Establishing connection...');
    await rpc.connect();
    console.log('✅ Connected to Kaspa testnet node!');
    
    // Generate keypair for transaction
    const keypair = generateHDKeypair(MASTER_MNEMONIC, 0);
    const address = keypair.toAddress(NetworkId.Testnet).toString();
    console.log(`💳 Using address: ${address}`);
    
    // Check balance
    const { entries } = await rpc.getUtxosByAddresses({ addresses: [address] });
    const balance = entries.reduce((sum, utxo) => sum + parseInt(utxo.utxoEntry.amount), 0);
    console.log(`💰 Current balance: ${balance / 1e8} KAS`);
    
    if (balance === 0) {
      console.log('❌ No balance available for transactions');
      console.log('💡 Need to fund this address with KAS for broadcasting');
      await rpc.disconnect();
      return;
    }
    
    // Create transaction with the root hash as OP_RETURN data
    const rootHashBuffer = Buffer.from(rootData.hash, 'hex');
    
    const { transactions } = await createTransactions({
      priorityEntries: entries,
      outputs: [],
      changeAddress: address,
      priorityFee: 0n,
    });
    
    // Add OP_RETURN output with our root hash
    if (transactions.length > 0) {
      transactions[0].outputs.push({
        value: 0n,
        scriptPublicKey: {
          version: 0,
          script: Buffer.concat([Buffer.from([0x6a, rootHashBuffer.length]), rootHashBuffer])
        }
      });
    }
    
    // Sign and submit
    transactions.forEach(tx => tx.sign([keypair], false));
    
    const txId = await rpc.submitTransaction({ transaction: transactions[0] });
    console.log(`🎉 Transaction broadcasted successfully!`);
    console.log(`📧 Transaction ID: ${txId}`);
    
    const explorerUrl = `https://explorer-tn10.kaspa.org/txs/${txId}`;
    console.log(`🌐 Explorer URL: ${explorerUrl}`);
    
    // Save to anchored transactions
    const anchoredData = {
      root: rootData.hash,
      txid: txId,
      timestamp: Math.floor(Date.now() / 1000),
      explorerUrl: explorerUrl
    };
    
    await fs.appendFile(OUTPUT_FILE, JSON.stringify(anchoredData) + '\n');
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    
    await rpc.disconnect();
    console.log('✨ Broadcast test completed successfully!');
    
  } catch (error) {
    console.error('❌ Broadcast test failed:', error.message);
  }
}

testBroadcast(); 