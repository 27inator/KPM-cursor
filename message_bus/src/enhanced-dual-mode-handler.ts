import fs from 'fs/promises';
import crypto from 'crypto';
import CompanyWalletManager, { SignedSupplyChainEvent } from './company-wallet-manager';

// Enhanced dual-mode handler with company wallet integration
export interface CompanySignedEvent {
  // Original event data
  eventId: string;
  timestamp: string;
  location: string;
  productId: string;
  batchId?: string;
  eventType: string;
  metadata: any;
  
  // Company wallet integration
  companyId: string;
  companySignature: string;
  companyAddress: string;
  dataHash: string;
  
  // Anchoring mode
  anchoring: {
    mode: 'immediate' | 'batch';
    priority: 'standard' | 'premium' | 'enterprise';
    companyId: string;
  };
}

export interface AnchoringTransaction {
  // Company signatures
  companyEvents: SignedSupplyChainEvent[];
  
  // Master wallet coordination
  masterWalletAddress: string;
  masterSignature: string;
  
  // Blockchain anchoring
  merkleRoot: string;
  transactionHash?: string;
  blockchainTimestamp?: string;

}

class EnhancedDualModeHandler {
  private companyWalletManager: CompanyWalletManager;
  private masterMnemonic: string;
  private masterWalletAddress: string;
  private batchedEvents: SignedSupplyChainEvent[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor(masterMnemonic: string, masterWalletAddress: string) {
    this.masterMnemonic = masterMnemonic;
    this.masterWalletAddress = masterWalletAddress;
    this.companyWalletManager = new CompanyWalletManager(masterMnemonic);
    
    // Start batch processing timer
    this.startBatchTimer();
  }

  /**
   * Process a supply chain event with company wallet signing
   */
  async processSupplyChainEvent(event: any): Promise<{
    success: boolean;
    anchored: boolean;
    hash?: string;
    companyAddress?: string;
    transactionId?: string;
    message: string;
  }> {
    try {
      // Step 1: Company signs their event with their unique mnemonic
      const signedEvent = await this.companyWalletManager.signSupplyChainEvent(event, event.anchoring.companyId);
      
      console.log(`[EnhancedDualMode] Company ${event.anchoring.companyId} signed event with their unique wallet: ${event.eventId}`);
      console.log(`[EnhancedDualMode] Company address: ${signedEvent.companyAddress}`);
      
      // Step 2: Verify company signature  
      const isValid = await this.companyWalletManager.verifyEventSignature(signedEvent);
      if (!isValid) {
        return {
          success: false,
          anchored: false,
          message: 'Company signature verification failed'
        };
      }

      // Step 3: Determine anchoring mode
      if (event.anchoring.mode === 'immediate') {
        return await this.processImmediateAnchoring(signedEvent);
      } else {
        return await this.processBatchAnchoring(signedEvent);
      }
      
    } catch (error) {
      console.error('[EnhancedDualMode] Error processing event:', error);
      return {
        success: false,
        anchored: false,
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process immediate anchoring with company signature
   */
  private async processImmediateAnchoring(signedEvent: SignedSupplyChainEvent): Promise<any> {
    // Create anchoring transaction with company signature
    const anchoringTx: AnchoringTransaction = {
      companyEvents: [signedEvent],
      masterWalletAddress: this.masterWalletAddress,
      masterSignature: this.signWithMasterWallet([signedEvent]),
      merkleRoot: this.calculateMerkleRoot([signedEvent])
    };

    // Write to pending roots for blockchain broadcaster
    await this.writeToPendingRoots({
      hash: anchoringTx.merkleRoot,
      type: 'immediate',
      companyId: signedEvent.companyId,
      companyAddress: signedEvent.companyAddress,
      eventId: signedEvent.eventId,
      timestamp: Date.now(),
      priority: 'premium',
      anchoringTransaction: anchoringTx
    });

    console.log(`[EnhancedDualMode] Immediate anchoring queued for ${signedEvent.companyId}`);
    console.log(`[EnhancedDualMode] Company can verify: ${signedEvent.companyAddress} signed ${signedEvent.dataHash}`);

    return {
      success: true,
      anchored: true,
      hash: anchoringTx.merkleRoot,
      companyAddress: signedEvent.companyAddress,
      transactionId: `immediate-${signedEvent.eventId}`,
      message: `Event anchored immediately. Company ${signedEvent.companyId} signature verified.`
    };
  }

  /**
   * Process batch anchoring with multiple company signatures
   */
  private async processBatchAnchoring(signedEvent: SignedSupplyChainEvent): Promise<any> {
    this.batchedEvents.push(signedEvent);
    
    console.log(`[EnhancedDualMode] Added to batch: ${signedEvent.companyId} event ${signedEvent.eventId}`);
    console.log(`[EnhancedDualMode] Batch progress: ${this.batchedEvents.length}/${this.BATCH_SIZE}`);

    // Check if batch is ready
    if (this.batchedEvents.length >= this.BATCH_SIZE) {
      await this.processBatch();
    }

    return {
      success: true,
      anchored: false,
      companyAddress: signedEvent.companyAddress,
      message: `Event signed by company and added to batch (${this.batchedEvents.length}/${this.BATCH_SIZE})`
    };
  }

  /**
   * Process a batch of company-signed events
   */
  private async processBatch(): Promise<void> {
    if (this.batchedEvents.length === 0) return;

    const batch = [...this.batchedEvents];
    this.batchedEvents = []; // Clear batch

    // Group by company for summary
    const companySummary = new Map<string, { address: string; events: number }>();
    
    batch.forEach(event => {
      const existing = companySummary.get(event.companyId) || { address: event.companyAddress, events: 0 };
      existing.events += 1;
      companySummary.set(event.companyId, existing);
    });

    // Create anchoring transaction with all company signatures
    const anchoringTx: AnchoringTransaction = {
      companyEvents: batch,
      masterWalletAddress: this.masterWalletAddress,
      masterSignature: this.signWithMasterWallet(batch),
      merkleRoot: this.calculateMerkleRoot(batch)
    };

    // Write batch to pending roots
    await this.writeToPendingRoots({
      hash: anchoringTx.merkleRoot,
      type: 'batch',
      companyId: 'multi-company',
      eventId: `batch-${Date.now()}`,
      timestamp: Date.now(),
      priority: 'standard',
      anchoringTransaction: anchoringTx,
      batchSize: batch.length
    });

    console.log(`[EnhancedDualMode] Batch processed: ${batch.length} events from ${companySummary.size} companies`);
    console.log(`[EnhancedDualMode] Company signatures preserved in anchoring transaction`);
    
    // Log company summary 
    companySummary.forEach((data, companyId) => {
      console.log(`[EnhancedDualMode] ${companyId} (${data.address}): ${data.events} events processed`);
    });
  }

  /**
   * Get company wallet address
   */
  async getCompanyAddress(companyId: string): Promise<string> {
    return await this.companyWalletManager.getCompanyAddress(companyId);
  }

  /**
   * Get company's unique mnemonic (for potential self-custody)
   */
  async getCompanyMnemonic(companyId: string): Promise<string> {
    return await this.companyWalletManager.getCompanyMnemonic(companyId);
  }

  /**
   * Verify a company's signature
   */
  verifyCompanySignature(signedEvent: SignedSupplyChainEvent): boolean {
    return this.companyWalletManager.verifyEventSignature(signedEvent);
  }

  /**
   * Get all company wallets for admin/audit purposes
   */
  getAllCompanyWallets() {
    return this.companyWalletManager.getAllCompanyWallets();
  }

  private calculateMerkleRoot(events: SignedSupplyChainEvent[]): string {
    if (events.length === 0) return crypto.createHash('sha256').update('empty').digest('hex');
    if (events.length === 1) return events[0].dataHash;
    
    // Simple merkle root calculation
    const hashes = events.map(e => e.dataHash);
    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        newHashes.push(combined);
      }
      hashes.splice(0, hashes.length, ...newHashes);
    }
    return hashes[0];
  }

  private signWithMasterWallet(events: SignedSupplyChainEvent[]): string {
    // Master wallet signs the collective company signatures
    const dataToSign = events.map(e => `${e.companyId}:${e.dataHash}:${e.companySignature}`).join('|');
    return crypto.createHmac('sha256', this.masterMnemonic)
      .update(dataToSign)
      .digest('hex');
  }

  private async writeToPendingRoots(data: any): Promise<void> {
    const pendingFile = '../kaspa_broadcaster/pending_roots.txt';
    try {
      await fs.appendFile(pendingFile, JSON.stringify(data) + '\n');
    } catch (error) {
      console.error('[EnhancedDualMode] Failed to write pending root:', error);
    }
  }

  private startBatchTimer(): void {
    setInterval(async () => {
      if (this.batchedEvents.length > 0) {
        console.log(`[EnhancedDualMode] Batch timeout triggered: processing ${this.batchedEvents.length} events`);
        await this.processBatch();
      }
    }, this.BATCH_TIMEOUT);
  }
}

export default EnhancedDualModeHandler; 