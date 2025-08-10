/**
 * 🔗 BLOCKCHAIN CONFIRMATION TRACKING SERVICE
 * Real-time monitoring of transaction confirmations on Kaspa blockchain
 */

import { db } from '../database/connection';
import { blockchainTransactions } from '../database/schema';
import { eq, and, or, isNull, lt } from 'drizzle-orm';
import { spawn } from 'child_process';
import path from 'path';
import { webSocketService } from './websocket-service'; // NEW: WebSocket integration

// 📊 Configuration
const CONFIRMATION_POLL_INTERVAL = 30000; // 30 seconds
const MAX_CONFIRMATION_CHECKS = 100; // Stop checking after 100 attempts
const KASPA_REQUIRED_CONFIRMATIONS = 1; // Kaspa is fast - 1 confirmation is usually enough
const RUST_SUBMITTER_PATH = path.join(process.cwd(), '..', 'kaspa_broadcaster');

// 🔍 Transaction Status Interface
interface TransactionStatus {
  transactionHash: string;
  blockHeight?: number;
  blockHash?: string;
  confirmationCount: number;
  isConfirmed: boolean;
  isRejected: boolean;
  error?: string;
}

// 📡 Kaspa Node Interface
interface KaspaTransactionInfo {
  block_hash?: string;
  block_time?: number;
  confirmations?: number;
  is_in_mempool?: boolean;
  is_confirmed?: boolean;
}

export class BlockchainConfirmationService {
  private isRunning = false;
  private pollTimer: NodeJS.Timeout | null = null;

  /**
   * 🚀 Start the confirmation tracking service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚡ [ConfirmationService] Already running');
      return;
    }

    this.isRunning = true;
    console.log('🔗 [ConfirmationService] Starting blockchain confirmation tracking...');
    
    // Start polling immediately
    await this.checkPendingTransactions();
    
    // Set up recurring polls
    this.pollTimer = setInterval(async () => {
      try {
        await this.checkPendingTransactions();
      } catch (error) {
        console.error('❌ [ConfirmationService] Poll error:', error);
      }
    }, CONFIRMATION_POLL_INTERVAL);

    console.log(`✅ [ConfirmationService] Started with ${CONFIRMATION_POLL_INTERVAL/1000}s intervals`);
  }

  /**
   * 🛑 Stop the confirmation tracking service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    console.log('🛑 [ConfirmationService] Stopped');
  }

  /**
   * 🔍 Check all pending transactions for confirmation status
   */
  private async checkPendingTransactions(): Promise<void> {
    try {
      // Get all transactions that need checking
      const pendingTransactions = await db
        .select()
        .from(blockchainTransactions)
        .where(
          and(
            or(
              eq(blockchainTransactions.status, 'submitted'),
              eq(blockchainTransactions.status, 'pending')
            ),
            lt(blockchainTransactions.retryCount, MAX_CONFIRMATION_CHECKS)
          )
        )
        .limit(50); // Process in batches

      if (pendingTransactions.length === 0) {
        console.log('💤 [ConfirmationService] No pending transactions to check');
        return;
      }

      console.log(`🔍 [ConfirmationService] Checking ${pendingTransactions.length} pending transactions...`);

      // Check each transaction
      for (const transaction of pendingTransactions) {
        try {
          await this.checkSingleTransaction(transaction);
        } catch (error) {
          console.error(`❌ [ConfirmationService] Error checking transaction ${transaction.transactionHash}:`, error);
          
          // Increment retry count
          await db
            .update(blockchainTransactions)
            .set({
              retryCount: transaction.retryCount + 1,
              lastCheckedAt: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            })
            .where(eq(blockchainTransactions.id, transaction.id));
        }
      }
    } catch (error) {
      console.error('💥 [ConfirmationService] Critical error in checkPendingTransactions:', error);
    }
  }

  /**
   * 🎯 Check confirmation status for a single transaction
   */
  private async checkSingleTransaction(transaction: any): Promise<void> {
    console.log(`🔗 [ConfirmationService] Checking transaction: ${transaction.transactionHash}`);

    // Query Kaspa node for transaction status
    const status = await this.queryKaspaNode(transaction.transactionHash);
    
    // Update database based on status
    await this.updateTransactionStatus(transaction, status);
  }

  /**
   * 🌐 Query Kaspa node via our Rust submitter for transaction status
   */
  private async queryKaspaNode(transactionHash: string): Promise<TransactionStatus> {
    return new Promise((resolve, reject) => {
      // Use our existing Rust submitter to query transaction status
      const rustProcess = spawn('cargo', ['run', '--', '--query-transaction', transactionHash], {
        cwd: RUST_SUBMITTER_PATH,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      rustProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      rustProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      rustProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Parse the Rust output for transaction status
            const status = this.parseRustTransactionOutput(stdout, transactionHash);
            resolve(status);
          } catch (error) {
            reject(new Error(`Failed to parse transaction status: ${error}`));
          }
        } else {
          reject(new Error(`Rust query failed (code ${code}): ${stderr}`));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        rustProcess.kill();
        reject(new Error('Transaction query timeout'));
      }, 30000);
    });
  }

  /**
   * 📝 Parse Rust submitter output for transaction status
   */
  private parseRustTransactionOutput(output: string, transactionHash: string): TransactionStatus {
    try {
      // Look for transaction status indicators in the output
      const lines = output.split('\n');
      
      let blockHeight: number | undefined;
      let blockHash: string | undefined;
      let confirmationCount = 0;
      let isConfirmed = false;
      let isRejected = false;

      for (const line of lines) {
        // Parse block height
        const blockHeightMatch = line.match(/Block Height:\s*(\d+)/i);
        if (blockHeightMatch) {
          blockHeight = parseInt(blockHeightMatch[1]);
        }

        // Parse block hash
        const blockHashMatch = line.match(/Block Hash:\s*([a-f0-9]+)/i);
        if (blockHashMatch) {
          blockHash = blockHashMatch[1];
        }

        // Parse confirmation count
        const confirmationsMatch = line.match(/Confirmations:\s*(\d+)/i);
        if (confirmationsMatch) {
          confirmationCount = parseInt(confirmationsMatch[1]);
        }

        // Check if confirmed
        if (line.includes('CONFIRMED') || line.includes('✅') || confirmationCount >= KASPA_REQUIRED_CONFIRMATIONS) {
          isConfirmed = true;
        }

        // Check if rejected/failed
        if (line.includes('REJECTED') || line.includes('FAILED') || line.includes('❌')) {
          isRejected = true;
        }
      }

      return {
        transactionHash,
        blockHeight,
        blockHash,
        confirmationCount,
        isConfirmed,
        isRejected
      };
    } catch (error) {
      throw new Error(`Failed to parse transaction output: ${error}`);
    }
  }

  /**
   * 💾 Update transaction status in database
   */
  private async updateTransactionStatus(transaction: any, status: TransactionStatus): Promise<void> {
    const updateData: any = {
      lastCheckedAt: new Date(),
      confirmationCount: status.confirmationCount,
      retryCount: transaction.retryCount + 1
    };

    // Update status based on confirmation
    if (status.isConfirmed) {
      updateData.status = 'confirmed';
      updateData.confirmedAt = new Date();
      updateData.blockHeight = status.blockHeight;
      updateData.blockHash = status.blockHash;
      
      console.log(`✅ [ConfirmationService] Transaction CONFIRMED: ${transaction.transactionHash}`);
      
      // 🔄 Emit WebSocket event for real-time UI updates
      webSocketService.emitTransactionConfirmation({
        type: 'transaction_confirmed',
        transactionHash: transaction.transactionHash,
        companyId: transaction.companyId,
        eventId: transaction.eventId,
        blockHeight: status.blockHeight,
        confirmationCount: status.confirmationCount,
        timestamp: new Date().toISOString()
      });
      
    } else if (status.isRejected) {
      updateData.status = 'failed';
      updateData.errorMessage = 'Transaction rejected by network';
      
      console.log(`❌ [ConfirmationService] Transaction REJECTED: ${transaction.transactionHash}`);
      
      // 🔄 Emit WebSocket event for real-time UI updates
      webSocketService.emitTransactionConfirmation({
        type: 'transaction_failed',
        transactionHash: transaction.transactionHash,
        companyId: transaction.companyId,
        eventId: transaction.eventId,
        blockHeight: status.blockHeight,
        confirmationCount: status.confirmationCount,
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Still pending
      updateData.status = 'pending';
      console.log(`⏳ [ConfirmationService] Transaction still pending: ${transaction.transactionHash} (${status.confirmationCount} confirmations)`);
      
      // 🔄 Emit WebSocket event for pending status updates
      webSocketService.emitTransactionConfirmation({
        type: 'transaction_pending',
        transactionHash: transaction.transactionHash,
        companyId: transaction.companyId,
        eventId: transaction.eventId,
        blockHeight: status.blockHeight,
        confirmationCount: status.confirmationCount,
        timestamp: new Date().toISOString()
      });
    }

    // Update the database
    await db
      .update(blockchainTransactions)
      .set(updateData)
      .where(eq(blockchainTransactions.id, transaction.id));
  }

  /**
   * 🔥 Manual check for a specific transaction (for immediate feedback)
   */
  async checkTransactionNow(transactionHash: string): Promise<TransactionStatus | null> {
    try {
      const transaction = await db
        .select()
        .from(blockchainTransactions)
        .where(eq(blockchainTransactions.transactionHash, transactionHash))
        .limit(1);

      if (transaction.length === 0) {
        return null;
      }

      await this.checkSingleTransaction(transaction[0]);
      
      // Return updated status
      return await this.queryKaspaNode(transactionHash);
    } catch (error) {
      console.error(`❌ [ConfirmationService] Manual check failed for ${transactionHash}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Get confirmation statistics
   */
  async getConfirmationStats(): Promise<any> {
    const stats = await db
      .select()
      .from(blockchainTransactions);

    const total = stats.length;
    const confirmed = stats.filter(t => t.status === 'confirmed').length;
    const pending = stats.filter(t => t.status === 'pending' || t.status === 'submitted').length;
    const failed = stats.filter(t => t.status === 'failed').length;

    return {
      total,
      confirmed,
      pending,
      failed,
      confirmationRate: total > 0 ? (confirmed / total) * 100 : 0
    };
  }
}

// 🌟 Export singleton instance
export const confirmationService = new BlockchainConfirmationService(); 