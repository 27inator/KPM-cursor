import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import MerkleTree from 'merkletreejs';
import keccak256 from 'keccak256';

export interface AnchoringMode {
  type: 'batch' | 'immediate';
  priority?: 'standard' | 'premium' | 'enterprise';
  companyId: string;
  eventId?: string;
}

// Company tiers for different service levels
export interface ServiceTier {
  name: string;
  allowsImmediate: boolean;
}

const SERVICE_TIERS: Record<string, ServiceTier> = {
  'standard': { 
    name: 'Standard', 
    allowsImmediate: true
  },
  'premium': { 
    name: 'Premium', 
    allowsImmediate: true
  },
  'enterprise': { 
    name: 'Enterprise', 
    allowsImmediate: true
  }
};

export class DualModeHandler {
  private batchedEvents: any[] = [];
  private readonly BATCH_SIZE = 50; // Default batch size
  private readonly BATCH_TIMEOUT = 300000; // 5 minutes
  private batchTimer: NodeJS.Timeout | null = null;

  async processEvent(event: any, mode: AnchoringMode): Promise<{
    success: boolean;
    anchored: boolean;
    hash?: string;
    message: string;
  }> {
    // Validate company tier and usage limits
    const validation = await this.validateUsage(mode);
    if (!validation.allowed) {
      return {
        success: false,
        anchored: false,
        message: validation.reason
      };
    }

    if (mode.type === 'immediate') {
      // Per-event immediate anchoring
      return await this.anchorEventImmediately(event, mode);
    } else {
      // Batch processing (cost-efficient)
      return await this.addToBatch(event, mode);
    }
  }

  private async anchorEventImmediately(event: any, mode: AnchoringMode): Promise<any> {
    try {
      // Create individual event hash
      const eventHash = createHash('sha256')
        .update(JSON.stringify(event))
        .digest('hex');

      // Write directly to broadcaster queue with priority flag
      const queueEntry = {
        hash: eventHash,
        type: 'immediate',
        companyId: mode.companyId,
        eventId: mode.eventId,
        timestamp: Date.now(),
        priority: mode.priority || 'standard'
      };

      await fs.appendFile('../kaspa_broadcaster/pending_roots.txt', 
        `${JSON.stringify(queueEntry)}\n`);

      return {
        success: true,
        anchored: true,
        hash: eventHash,
        message: `Event anchored immediately`
      };

    } catch (error) {
      return {
        success: false,
        anchored: false,
        message: `Failed to anchor immediately: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private async addToBatch(event: any, mode: AnchoringMode): Promise<any> {
    // Add to batch queue
    this.batchedEvents.push({
      ...event,
      companyId: mode.companyId,
      timestamp: Date.now()
    });

    // Set batch timer if not already set
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_TIMEOUT);
    }

    // Process batch if size threshold reached
    if (this.batchedEvents.length >= this.BATCH_SIZE) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
      await this.processBatch();
    }

    return {
      success: true,
      anchored: false, // Will be anchored when batch processes
      message: `Event added to batch queue (${this.batchedEvents.length}/${this.BATCH_SIZE})`
    };
  }

  private async processBatch(): Promise<void> {
    if (this.batchedEvents.length === 0) return;

    try {
      // Create Merkle tree from batched events
      const eventHashes = this.batchedEvents.map(event => 
        keccak256(JSON.stringify(event))
      );

      const merkleTree = new MerkleTree(eventHashes, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getHexRoot();

      // Write Merkle root to broadcaster queue
      const queueEntry = {
        hash: merkleRoot.slice(2), // Remove '0x' prefix
        type: 'batch',
        eventCount: this.batchedEvents.length,
        timestamp: Date.now(),
        companies: [...new Set(this.batchedEvents.map(e => e.companyId))]
      };

      await fs.appendFile('../kaspa_broadcaster/pending_roots.txt', 
        `${JSON.stringify(queueEntry)}\n`);

      console.log(`[DualMode] Processed batch of ${this.batchedEvents.length} events → Merkle root: ${merkleRoot}`);

      // Clear batch
      this.batchedEvents = [];

    } catch (error) {
      console.error('[DualMode] Batch processing error:', error);
    }
  }

  private async validateUsage(mode: AnchoringMode): Promise<{
    allowed: boolean;
    reason: string;
  }> {
    // In a real system, check database for usage limits
    // For now, allow all valid service tiers
    const tier = SERVICE_TIERS[mode.priority || 'standard'];
    
    if (mode.type === 'immediate' && !tier.allowsImmediate) {
      return {
        allowed: false,
        reason: `Immediate anchoring not available for ${tier.name} tier`
      };
    }

    return { allowed: true, reason: '' };
  }


}

export const dualModeHandler = new DualModeHandler(); 