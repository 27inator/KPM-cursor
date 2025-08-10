// Product tracking system for scanning integration
export interface ProductTag {
  id: string;
  productId: string;
  batchId: string;
  farmId: string;
  harvestDate: Date;
  expiryDate: Date;
  productType: string;
  origin: string;
  certifications: string[];
  qrCode: string;
  nfcId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanEvent {
  id: string;
  tagId: string;
  scannerType: 'QR' | 'NFC' | 'RFID' | 'BARCODE';
  scannerId: string;
  locationId: string;
  companyId: string;
  eventType: 'FARM' | 'PROCESSING' | 'WAREHOUSE' | 'TRANSPORT' | 'RETAIL' | 'CONSUMER';
  eventData: {
    temperature?: number;
    humidity?: number;
    coordinates?: { lat: number; lng: number };
    handler?: string;
    notes?: string;
    images?: string[];
  };
  timestamp: Date;
  blockchainTxId?: string;
  verified: boolean;
}

export interface ProductJourney {
  tagId: string;
  product: ProductTag;
  events: ScanEvent[];
  currentLocation: string;
  currentStatus: 'HARVESTED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETAIL' | 'CONSUMED';
  verificationStatus: 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED';
  totalEvents: number;
  lastUpdated: Date;
}

// Scanning system integration interface
export interface ScanningSystemAPI {
  // Called when scanning systems detect a product scan
  onProductScan(scanEvent: ScanEvent): Promise<void>;
  
  // Called to register a new product tag
  registerProductTag(productTag: ProductTag): Promise<void>;
  
  // Called to get product journey for display
  getProductJourney(tagId: string): Promise<ProductJourney>;
  
  // Called to verify blockchain commitment
  verifyBlockchainCommitment(txId: string): Promise<boolean>;
}

// Event types that trigger blockchain commits
export const BLOCKCHAIN_COMMIT_EVENTS = [
  'FARM',      // Initial harvest/production
  'PROCESSING', // Processing/manufacturing
  'WAREHOUSE', // Warehouse storage
  'TRANSPORT', // Transportation between locations
  'RETAIL',    // Retail store arrival
] as const;

// Mock implementation for development
export class MockScanningSystem implements ScanningSystemAPI {
  private productTags: Map<string, ProductTag> = new Map();
  private scanEvents: Map<string, ScanEvent[]> = new Map();

  async onProductScan(scanEvent: ScanEvent): Promise<void> {
    // Store scan event
    const events = this.scanEvents.get(scanEvent.tagId) || [];
    events.push(scanEvent);
    this.scanEvents.set(scanEvent.tagId, events);
    
    // If this is a blockchain commit event, trigger blockchain submission
    if (BLOCKCHAIN_COMMIT_EVENTS.includes(scanEvent.eventType)) {
      await this.commitToBlockchain(scanEvent);
    }
  }

  async registerProductTag(productTag: ProductTag): Promise<void> {
    this.productTags.set(productTag.id, productTag);
  }

  async getProductJourney(tagId: string): Promise<ProductJourney> {
    const product = this.productTags.get(tagId);
    const events = this.scanEvents.get(tagId) || [];
    
    if (!product) {
      throw new Error(`Product tag ${tagId} not found`);
    }

    const lastEvent = events[events.length - 1];
    const verifiedEvents = events.filter(e => e.verified);
    
    return {
      tagId,
      product,
      events: events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      currentLocation: lastEvent?.locationId || 'Unknown',
      currentStatus: this.determineStatus(events),
      verificationStatus: verifiedEvents.length === events.length ? 'VERIFIED' : 
                         verifiedEvents.length > 0 ? 'PARTIAL' : 'UNVERIFIED',
      totalEvents: events.length,
      lastUpdated: lastEvent?.timestamp || new Date()
    };
  }

  async verifyBlockchainCommitment(txId: string): Promise<boolean> {
    // Mock verification - in real implementation, this would check Kaspa blockchain
    return true;
  }

  private determineStatus(events: ScanEvent[]): ProductJourney['currentStatus'] {
    if (events.length === 0) return 'HARVESTED';
    
    const lastEvent = events[events.length - 1];
    switch (lastEvent.eventType) {
      case 'FARM': return 'HARVESTED';
      case 'PROCESSING': return 'PROCESSING';
      case 'WAREHOUSE':
      case 'TRANSPORT': return 'SHIPPED';
      case 'RETAIL': return 'RETAIL';
      case 'CONSUMER': return 'CONSUMED';
      default: return 'HARVESTED';
    }
  }

  private async commitToBlockchain(scanEvent: ScanEvent): Promise<void> {
    // Mock blockchain commitment
    // In real implementation, this would:
    // 1. Create merkle tree of scan data
    // 2. Submit to Kaspa blockchain
    // 3. Store transaction ID
    // 4. Update verification status
    console.log(`Committing scan event ${scanEvent.id} to blockchain`);
  }
}