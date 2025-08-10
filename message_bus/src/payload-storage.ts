import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface PayloadStorageResult {
  contentHash: string;
  storageType: 'local' | 'ipfs' | 's3';
  storageUri: string;
  originalSize: number;
  compressedSize?: number;
}

export interface OnChainAnchor {
  contentHash: string;
  storageUri: string;
  timestamp: string;
  eventType: string;
  metadata: {
    originalSize: number;
    storageType: string;
    chunked?: boolean;
    chunkCount?: number;
  };
}

export class PayloadStorageService {
  private readonly localStoragePath: string;
  private readonly maxOnChainSize: number = 20 * 1024; // 20KB safe limit
  private readonly chunkSize: number = 15 * 1024; // 15KB chunks for safety

  constructor(storagePath: string = './storage/payloads') {
    this.localStoragePath = storagePath;
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.localStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Store payload and return hash + metadata for on-chain anchoring
   */
  async storePayload(data: any, eventType: string): Promise<PayloadStorageResult> {
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const originalSize = Buffer.byteLength(jsonData, 'utf8');
    
    // Calculate content hash (SHA-256)
    const contentHash = crypto
      .createHash('sha256')
      .update(jsonData, 'utf8')
      .digest('hex');

    console.log(`📦 [PayloadStorage] Processing ${originalSize} bytes (${(originalSize/1024).toFixed(1)}KB)`);

    // Store in local filesystem (TODO: Add S3/IPFS support)
    const filename = `${contentHash}.json`;
    const filePath = path.join(this.localStoragePath, filename);
    
    try {
      await fs.writeFile(filePath, jsonData, 'utf8');
      
      const storageUri = `file://${filePath}`;
      
      console.log(`✅ [PayloadStorage] Stored as ${filename}`);
      console.log(`🔗 [PayloadStorage] Content hash: ${contentHash}`);
      
      return {
        contentHash,
        storageType: 'local',
        storageUri,
        originalSize
      };
      
    } catch (error) {
      console.error('Failed to store payload:', error);
      throw new Error(`Payload storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve payload by content hash
   */
  async retrievePayload(contentHash: string): Promise<any> {
    const filename = `${contentHash}.json`;
    const filePath = path.join(this.localStoragePath, filename);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Payload retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create on-chain anchor data (small payload with hash)
   */
  createOnChainAnchor(
    storageResult: PayloadStorageResult,
    eventType: string,
    additionalMetadata: any = {}
  ): OnChainAnchor {
    
    const anchor: OnChainAnchor = {
      contentHash: storageResult.contentHash,
      storageUri: storageResult.storageUri,
      timestamp: new Date().toISOString(),
      eventType,
      metadata: {
        originalSize: storageResult.originalSize,
        storageType: storageResult.storageType,
        ...additionalMetadata
      }
    };

    const anchorSize = JSON.stringify(anchor).length;
    console.log(`⚓ [PayloadStorage] On-chain anchor: ${anchorSize} bytes (${(anchorSize/1024).toFixed(2)}KB)`);
    
    if (anchorSize > this.maxOnChainSize) {
      console.warn(`⚠️ [PayloadStorage] Anchor size ${anchorSize} exceeds safe limit ${this.maxOnChainSize}`);
    }
    
    return anchor;
  }

  /**
   * Process large payload with automatic chunking
   */
  async processLargePayload(data: any, eventType: string): Promise<{
    onChainAnchor: OnChainAnchor;
    storageResult: PayloadStorageResult;
  }> {
    
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const dataSize = Buffer.byteLength(jsonData, 'utf8');
    
    console.log(`🔍 [PayloadStorage] Processing payload: ${dataSize} bytes`);
    
    if (dataSize <= this.maxOnChainSize) {
      console.log(`✅ [PayloadStorage] Small payload - storing on-chain directly`);
      // Small enough - no off-chain storage needed
      throw new Error('Use direct on-chain storage for small payloads');
    }
    
    console.log(`📦 [PayloadStorage] Large payload detected - using off-chain storage`);
    
    // Store off-chain
    const storageResult = await this.storePayload(data, eventType);
    
    // Create minimal on-chain anchor
    const onChainAnchor = this.createOnChainAnchor(storageResult, eventType, {
      processingMode: 'off-chain-storage',
      size_category: dataSize > 100 * 1024 ? 'large' : 'medium'
    });
    
    return {
      onChainAnchor,
      storageResult
    };
  }

  /**
   * Verify payload integrity
   */
  async verifyPayload(contentHash: string): Promise<boolean> {
    try {
      const payload = await this.retrievePayload(contentHash);
      const jsonData = JSON.stringify(payload, null, 2);
      
      const calculatedHash = crypto
        .createHash('sha256')
        .update(jsonData, 'utf8')
        .digest('hex');
        
      return calculatedHash === contentHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    avgSize: number;
  }> {
    try {
      const files = await fs.readdir(this.localStoragePath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        return { totalFiles: 0, totalSize: 0, avgSize: 0 };
      }
      
      let totalSize = 0;
      for (const file of jsonFiles) {
        const filePath = path.join(this.localStoragePath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        totalFiles: jsonFiles.length,
        totalSize,
        avgSize: Math.round(totalSize / jsonFiles.length)
      };
      
    } catch (error) {
      return { totalFiles: 0, totalSize: 0, avgSize: 0 };
    }
  }
}

export default PayloadStorageService; 