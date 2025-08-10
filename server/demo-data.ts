import { storage } from './storage';

export async function createDemoData() {
  try {
    // Create a sample product tag
    const sampleTag = await storage.createProductTag({
      tagId: 'TAG-123456',
      productName: 'Organic Vine Tomatoes',
      productId: 'PROD-TOMATO-001',
      batchId: 'BATCH-2024-001',
      farmId: 'FARM-CA-123',
      harvestDate: new Date('2024-01-15'),
      expiryDate: new Date('2024-01-22'),
      productType: 'vegetables',
      origin: 'California, USA',
      certifications: ['Organic', 'Non-GMO', 'Fair Trade'],
      description: 'Fresh organic vine-ripened tomatoes from sustainable California farms',
      qrCode: 'https://kmp.example.com/product/TAG-123456',
      nfcId: null
    });

    // Create sample events for the product
    const events = [
      {
        eventId: 'EVENT-001',
        eventType: 'HARVEST',
        tagId: 'TAG-123456',
        companyId: 'comp_1234567890',
        ts: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        status: 'confirmed',
        txid: 'kaspa:qr0123456789abcdef',
        fee: 0.001,
        leafHash: 'leaf123456',
        merkleRoot: 'merkle123456'
      },
      {
        eventId: 'EVENT-002',
        eventType: 'PROCESSING',
        tagId: 'TAG-123456',
        companyId: 'comp_1234567890',
        ts: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        status: 'confirmed',
        txid: 'kaspa:qr0123456789abcdef2',
        fee: 0.001,
        leafHash: 'leaf123457',
        merkleRoot: 'merkle123457'
      },
      {
        eventId: 'EVENT-003',
        eventType: 'PACKAGING',
        tagId: 'TAG-123456',
        companyId: 'comp_1234567890',
        ts: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        status: 'confirmed',
        txid: 'kaspa:qr0123456789abcdef3',
        fee: 0.001,
        leafHash: 'leaf123458',
        merkleRoot: 'merkle123458'
      },
      {
        eventId: 'EVENT-004',
        eventType: 'SHIPPING',
        tagId: 'TAG-123456',
        companyId: 'comp_1234567890',
        ts: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        status: 'confirmed',
        txid: 'kaspa:qr0123456789abcdef4',
        fee: 0.001,
        leafHash: 'leaf123459',
        merkleRoot: 'merkle123459'
      }
    ];

    for (const event of events) {
      await storage.createEvent(event);
    }

    console.log('Demo data created successfully');
    return { sampleTag, events };
  } catch (error) {
    console.error('Error creating demo data:', error);
    throw error;
  }
}