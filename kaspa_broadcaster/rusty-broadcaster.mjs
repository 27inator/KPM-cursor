import fs from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const KASPA_CLI_PATH = '../rusty-kaspa/target/release/kaspa-cli';
const PENDING_ROOTS_FILE = 'pending_roots.txt';
const ANCHORED_TXS_FILE = 'anchored_txs.json';

const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || (() => {
  console.error('❌ SECURITY ERROR: MASTER_MNEMONIC environment variable not set!');
  process.exit(1);
})();

class RustyBroadcaster {
  constructor() {
    console.log('[RustyBroadcaster] Started - using rusty-kaspa CLI for reliable transactions');
    console.log(`[RustyBroadcaster] Watching: ${PENDING_ROOTS_FILE}`);
    console.log(`[RustyBroadcaster] Output: ${ANCHORED_TXS_FILE}`);

    this.startProcessing();
  }

  async startProcessing() {
    setInterval(async () => {
      await this.processPendingRoots();
    }, 60000); // Every minute

    // Also process immediately on startup
    await this.processPendingRoots();
  }

  async processPendingRoots() {
    try {
      if (!fs.existsSync(PENDING_ROOTS_FILE)) {
        return;
      }

      const content = fs.readFileSync(PENDING_ROOTS_FILE, 'utf8').trim();
      if (!content) return;

      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const rootData = JSON.parse(line);
          console.log(`[RustyBroadcaster] Processing root: ${rootData.hash}`);

          const txId = await this.submitTransaction(rootData);

          if (txId) {
            // Log successful transaction
            const result = {
              ...rootData,
              transactionId: txId,
              timestamp: new Date().toISOString(),
              status: 'anchored'
            };

            this.logAnchoredTransaction(result);
            console.log(`[RustyBroadcaster] ✅ Transaction anchored: ${txId}`);
          }

        } catch (error) {
          console.error(`[RustyBroadcaster] Error processing root: ${error.message}`);
        }
      }

      // Clear processed roots
      fs.writeFileSync(PENDING_ROOTS_FILE, '');

    } catch (error) {
      console.error(`[RustyBroadcaster] Error in processing: ${error.message}`);
    }
  }

  async submitTransaction(rootData) {
    try {
      console.log(`[RustyBroadcaster] Creating transaction with kaspa-cli...`);

      // First, check if kaspa-cli exists
      try {
        await execAsync(`${KASPA_CLI_PATH} --help`);
      } catch (error) {
        console.error(`[RustyBroadcaster] kaspa-cli not found at ${KASPA_CLI_PATH}`);
        return null;
      }

      // Create wallet and get address
      console.log(`[RustyBroadcaster] Setting up wallet...`);

      // Use a simpler approach - create wallet and extract address
      const { stdout: createOutput } = await execAsync(
        `echo "${MASTER_MNEMONIC}" | ${KASPA_CLI_PATH} wallet import --testnet-10`
      );

      console.log(`[RustyBroadcaster] Wallet setup output: ${createOutput}`);

      // Get the wallet address
      const { stdout: addressOutput } = await execAsync(
        `${KASPA_CLI_PATH} wallet address --testnet-10`
      );

      const addressMatch = addressOutput.match(/kaspatest:[a-zA-Z0-9]+/);
      if (!addressMatch) {
        console.error(`[RustyBroadcaster] Could not extract address from: ${addressOutput}`);
        return null;
      }

      const walletAddress = addressMatch[0];
      console.log(`[RustyBroadcaster] Wallet address: ${walletAddress}`);

      // Send transaction with root hash as OP_RETURN data
      const opReturnData = rootData.hash;
      console.log(`[RustyBroadcaster] Sending transaction with OP_RETURN: ${opReturnData}`);

      // Send to self with OP_RETURN data
      const { stdout: txOutput } = await execAsync(
        `${KASPA_CLI_PATH} wallet send --testnet-10 --to ${walletAddress} --amount 0.001 --op-return ${opReturnData}`
      );

      console.log(`[RustyBroadcaster] Transaction output: ${txOutput}`);

      // Extract transaction ID
      const txIdMatch = txOutput.match(/([a-f0-9]{64})/) ||
                        txOutput.match(/Transaction ID: ([a-f0-9]+)/i);

      if (txIdMatch) {
        return txIdMatch[1];
      } else {
        console.error(`[RustyBroadcaster] Could not extract transaction ID from output`);
        return null;
      }

    } catch (error) {
      console.error(`[RustyBroadcaster] CLI transaction error: ${error.message}`);
      return null;
    }
  }

  logAnchoredTransaction(result) {
    try {
      let anchored = [];
      if (fs.existsSync(ANCHORED_TXS_FILE)) {
        const existing = fs.readFileSync(ANCHORED_TXS_FILE, 'utf8');
        if (existing.trim()) {
          anchored = JSON.parse(existing);
        }
      }

      anchored.push(result);
      fs.writeFileSync(ANCHORED_TXS_FILE, JSON.stringify(anchored, null, 2));

    } catch (error) {
      console.error(`[RustyBroadcaster] Error logging transaction: ${error.message}`);
    }
  }
}

// Start the broadcaster
new RustyBroadcaster(); 