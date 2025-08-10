import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

export interface RustSubmissionResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  output: string;
}

export interface SupplyChainEvent {
  eventType: string;
  productId: string;
  batchId?: string;
  location: string;
  timestamp: string;
  metadata: any;
}

export class KaspaRustBridge {
  private readonly rustExecutablePath: string;

  constructor() {
    // Path to our Rust submitter executable 
    this.rustExecutablePath = path.join(__dirname, '../../kaspa_broadcaster');
    console.log(`🦀 Kaspa Rust Bridge initialized with intelligent payload handling`);
    console.log(`📁 Rust submitter path: ${this.rustExecutablePath}`);
  }

  /**
   * Submit a supply chain event using the Rust submitter
   * Now handles both direct payloads and off-chain content hash anchors
   */
  async submitSupplyChainEvent(
    companyMnemonic: string,
    event: SupplyChainEvent
  ): Promise<RustSubmissionResult> {
    
    console.log(`🦀 [RustBridge] Submitting supply chain event via Rust...`);
    console.log(`📦 Event Type: ${event.eventType}`);
    console.log(`🏭 Product: ${event.productId}`);
    
    // Intelligent payload preparation
    let eventData: string;
    let payloadType: string;
    
    // Check if this is a content hash anchor (off-chain storage)
    if (event.metadata?.payloadInfo?.offChain) {
      console.log(`🔗 [RustBridge] Using off-chain content hash anchor`);
      
      // Create minimal on-chain reference
      eventData = JSON.stringify({
        type: 'CONTENT_HASH_ANCHOR',
        contentHash: event.metadata.payloadInfo.contentHash,
        originalSize: event.metadata.payloadInfo.originalSize,
        storageUri: event.metadata.payloadInfo.storageUri,
        productId: event.productId,
        location: event.location,
        timestamp: event.timestamp,
        anchor_metadata: {
          offChainStorage: true,
          retrievalEndpoint: `/api/payload/${event.metadata.payloadInfo.contentHash}`
        }
      });
      
      payloadType = 'OFF_CHAIN_ANCHOR';
      
    } else {
      console.log(`📝 [RustBridge] Using direct on-chain payload`);
      
      // Direct on-chain storage
      eventData = JSON.stringify({
        productId: event.productId,
        batchId: event.batchId,
        location: event.location,
        timestamp: event.timestamp,
        metadata: event.metadata
      });
      
      payloadType = 'DIRECT_ON_CHAIN';
    }
    
    const finalPayloadSize = Buffer.byteLength(eventData, 'utf8');
    console.log(`📏 [RustBridge] Final payload size: ${finalPayloadSize} bytes (${(finalPayloadSize/1024).toFixed(2)}KB)`);
    
    // Verify payload size is within limits
    if (finalPayloadSize > 20 * 1024) {
      console.warn(`⚠️ [RustBridge] Payload size ${finalPayloadSize} bytes exceeds 20KB safe limit`);
    }

    const args = [
      'run', '--',
      '--supply-chain',
      companyMnemonic,
      eventData,
      `${event.eventType}_${payloadType}`
    ];

    const result = await this.executeRustCommand(args, `Supply Chain Event (${payloadType})`);
    
    if (result.success) {
      console.log(`✅ [RustBridge] ${payloadType} submission successful!`);
      console.log(`📋 Transaction: ${result.transactionId}`);
    } else {
      console.error(`❌ [RustBridge] ${payloadType} submission failed: ${result.error}`);
    }
    
    return result;
  }

  /**
   * Submit a funding transaction using the Rust submitter
   */
  async submitFundingTransaction(
    amountKas: number,
    recipientAddress: string
  ): Promise<RustSubmissionResult> {
    
    console.log(`🦀 [RustBridge] Submitting funding transaction via Rust...`);
    console.log(`💰 Amount: ${amountKas} KAS`);
    console.log(`🎯 Recipient: ${recipientAddress}`);

    const args = [
      'run', '--',
      '--funding',
      amountKas.toString(),
      recipientAddress
    ];

    return this.executeRustCommand(args, 'Funding Transaction');
  }

  /**
   * Execute the Rust submitter with given arguments
   */
  private async executeRustCommand(
    args: string[],
    operationType: string
  ): Promise<RustSubmissionResult> {
    
    return new Promise((resolve) => {
      console.log(`🚀 [RustBridge] Executing: cargo ${args.join(' ')}`);
      
      const startTime = Date.now();
      const process = spawn('cargo', args, {
        cwd: this.rustExecutablePath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let transactionId: string | undefined;

      process.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        
        // Log output with timestamp for debugging
        const timestamp = new Date().toISOString().substr(11, 8);
        console.log(`🦀 [${timestamp}]: ${output.trim()}`);
        
        // Extract transaction ID from Rust output (structured JSON format)
        if (output.includes('TRANSACTION_RESULT_START')) {
          const jsonStartIndex = output.indexOf('{');
          const jsonEndIndex = output.lastIndexOf('}') + 1;
          if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            try {
              const jsonStr = output.substring(jsonStartIndex, jsonEndIndex);
              const result = JSON.parse(jsonStr);
              if (result.transactionId) {
                transactionId = result.transactionId;
                console.log(`🔗 [RustBridge] Extracted transaction ID: ${transactionId}`);
              }
            } catch (parseError) {
              console.warn(`⚠️ [RustBridge] Failed to parse transaction result JSON: ${parseError}`);
            }
          }
        }
        
        // Fallback: Extract transaction ID from legacy format
        const txIdMatch = output.match(/Transaction ID: ([a-f0-9]{64})/);
        if (txIdMatch && !transactionId) {
          transactionId = txIdMatch[1];
        }
      });

      process.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        
        // Only log actual errors, not warnings
        if (output.includes('error:') || output.includes('Error:')) {
          console.error(`🦀 [Rust Error]: ${output.trim()}`);
        }
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        if (success) {
          console.log(`✅ [RustBridge] ${operationType} completed successfully in ${duration}ms!`);
          console.log(`📋 Transaction ID: ${transactionId || 'N/A'}`);
          resolve({
            success: true,
            transactionId,
            output: stdout
          });
        } else {
          console.error(`❌ [RustBridge] ${operationType} failed with code ${code} after ${duration}ms`);
          resolve({
            success: false,
            error: `Process exited with code ${code}: ${stderr}`,
            output: stdout + stderr
          });
        }
      });

      process.on('error', (error) => {
        console.error(`🚨 [RustBridge] Process error:`, error);
        resolve({
          success: false,
          error: `Process error: ${error.message}`,
          output: stderr
        });
      });

      // Add timeout for long-running operations (increased for large payload processing)
      const timeout = setTimeout(() => {
        console.warn(`⏰ [RustBridge] ${operationType} taking longer than expected...`);
      }, 60000); // 60 second warning for large payload processing

      // Kill process if it takes too long (prevent hanging)
      const killTimeout = setTimeout(() => {
        console.error(`🚨 [RustBridge] ${operationType} timed out after 2 minutes, killing process`);
        process.kill('SIGTERM');
        resolve({
          success: false,
          error: `Operation timed out after 2 minutes`,
          output: stdout + stderr
        });
      }, 120000); // 2 minute hard timeout

      process.on('close', () => {
        clearTimeout(timeout);
        clearTimeout(killTimeout);
      });
    });
  }

  /**
   * Test connection to verify Rust submitter is working
   */
  async testConnection(): Promise<boolean> {
    console.log(`🧪 [RustBridge] Testing Rust submitter connection...`);
    
    const testResult = await this.executeRustCommand(['run', '--', '--help'], 'Connection Test');
    
    if (testResult.success) {
      console.log(`✅ [RustBridge] Rust submitter is ready and operational!`);
      return true;
    } else {
      console.error(`❌ [RustBridge] Rust submitter not available:`, testResult.error);
      return false;
    }
  }

  /**
   * Get bridge performance stats
   */
  getStats(): {
    bridgeType: string;
    features: string[];
    payloadHandling: string[];
  } {
    return {
      bridgeType: 'intelligent-rust-bridge',
      features: [
        'automatic-fee-calculation',
        'robust-error-handling', 
        'dual-mode-anchoring',
        'intelligent-payload-routing'
      ],
      payloadHandling: [
        'direct-on-chain-storage',
        'off-chain-content-hash-anchoring',
        'automatic-size-detection',
        'payload-verification'
      ]
    };
  }
}

export default KaspaRustBridge; 