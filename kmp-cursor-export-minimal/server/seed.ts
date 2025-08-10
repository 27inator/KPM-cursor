import { db } from "./db";
import { companies, events, walletMetrics, productTags, users } from "@shared/schema";
import bcrypt from "bcryptjs";

async function seedData() {
  console.log("Seeding database...");
  
  // Seed default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const seedUsers = [
    {
      email: "admin@kmp.example.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32"
    }
  ];
  
  await db.insert(users).values(seedUsers);
  
  // Seed companies
  const seedCompanies = [
    {
      companyId: "comp_1234567890",
      name: "FreshCorp Industries",
      hdPathIndex: 0,
      visibleFields: ["stage", "location", "timestamp"],
      commitEventTypes: ["FARM", "SHIP", "QC"],
      walletAddress: "kaspa:qz8x...3k2m",
      balance: 127.45,
      autoFundEnabled: true,
      status: "active",
    },
    {
      companyId: "comp_0987654321",
      name: "GreenFarms LLC",
      hdPathIndex: 1,
      visibleFields: ["stage", "location", "timestamp"],
      commitEventTypes: ["FARM", "SHIP", "QC"],
      walletAddress: "kaspa:qy7w...8n3p",
      balance: 89.12,
      autoFundEnabled: true,
      status: "active",
    },
    {
      companyId: "comp_5678901234",
      name: "TechLogistics Co.",
      hdPathIndex: 2,
      visibleFields: ["stage", "location", "timestamp"],
      commitEventTypes: ["SHIP", "QC"],
      walletAddress: "kaspa:qr5t...7h9k",
      balance: 12.34,
      autoFundEnabled: false,
      status: "low_balance",
    },
  ];

  await db.insert(companies).values(seedCompanies);

  // Seed product tags
  const seedProductTags = [
    {
      tagId: "TAG-001",
      productId: "PROD-001",
      productType: "Organic Apples",
      batchId: "BATCH-001",
      farmId: "FARM-GREENVALLEY-001",
      harvestDate: new Date("2024-01-15"),
      expiryDate: new Date("2024-02-15"),
      origin: "Green Valley Farm, California",
      certifications: JSON.stringify(["Organic", "Non-GMO", "Fair Trade"]),
      qrCode: "QR-001",
      nfcId: "NFC-001",
    },
    {
      tagId: "TAG-002",
      productId: "PROD-002",
      productType: "Fresh Lettuce",
      batchId: "BATCH-002",
      farmId: "FARM-SUNNY-002",
      harvestDate: new Date("2024-01-16"),
      expiryDate: new Date("2024-01-30"),
      origin: "Sunny Acres Farm, Oregon",
      certifications: JSON.stringify(["Organic", "Locally Grown"]),
      qrCode: "QR-002",
      nfcId: "NFC-002",
    },
    {
      tagId: "TAG-003",
      productId: "PROD-003",
      productType: "Organic Tomatoes",
      batchId: "BATCH-003",
      farmId: "FARM-HARVEST-003",
      harvestDate: new Date("2024-01-17"),
      expiryDate: new Date("2024-02-10"),
      origin: "Harvest Moon Farm, Washington",
      certifications: JSON.stringify(["Organic", "Sustainable"]),
      qrCode: "QR-003",
      nfcId: "NFC-003",
    },
  ];

  await db.insert(productTags).values(seedProductTags);

  // Seed recent events with proper journey tracking
  const seedEvents = [
    // TAG-001 Journey (Organic Apples)
    {
      eventId: "evt_001",
      companyId: "comp_1234567890",
      tagId: "TAG-001",
      eventType: "FARM",
      ts: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      blobCid: null,
      leafHash: "hash_001",
      merkleRoot: "root_001",
      txid: "tx_001",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_002",
      companyId: "comp_0987654321",
      tagId: "TAG-001",
      eventType: "PROCESSING",
      ts: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
      blobCid: null,
      leafHash: "hash_002",
      merkleRoot: "root_002",
      txid: "tx_002",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_003",
      companyId: "comp_5678901234",
      tagId: "TAG-001",
      eventType: "SHIP",
      ts: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      blobCid: null,
      leafHash: "hash_003",
      merkleRoot: "root_003",
      txid: "tx_003",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_004",
      companyId: "comp_1234567890",
      tagId: "TAG-001",
      eventType: "RETAIL",
      ts: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      blobCid: null,
      leafHash: "hash_004",
      merkleRoot: "root_004",
      txid: "tx_004",
      status: "confirmed",
      fee: 0.001,
    },
    
    // TAG-002 Journey (Fresh Lettuce)
    {
      eventId: "evt_005",
      companyId: "comp_0987654321",
      tagId: "TAG-002",
      eventType: "FARM",
      ts: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
      blobCid: null,
      leafHash: "hash_005",
      merkleRoot: "root_005",
      txid: "tx_005",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_006",
      companyId: "comp_5678901234",
      tagId: "TAG-002",
      eventType: "SHIP",
      ts: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      blobCid: null,
      leafHash: "hash_006",
      merkleRoot: "root_006",
      txid: "tx_006",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_007",
      companyId: "comp_1234567890",
      tagId: "TAG-002",
      eventType: "WAREHOUSE",
      ts: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
      blobCid: null,
      leafHash: "hash_007",
      merkleRoot: "root_007",
      txid: "tx_007",
      status: "confirmed",
      fee: 0.001,
    },
    
    // TAG-003 Journey (Organic Tomatoes)
    {
      eventId: "evt_008",
      companyId: "comp_1234567890",
      tagId: "TAG-003",
      eventType: "FARM",
      ts: Math.floor(Date.now() / 1000) - 86400 * 4, // 4 days ago
      blobCid: null,
      leafHash: "hash_008",
      merkleRoot: "root_008",
      txid: "tx_008",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_009",
      companyId: "comp_0987654321",
      tagId: "TAG-003",
      eventType: "PROCESSING",
      ts: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      blobCid: null,
      leafHash: "hash_009",
      merkleRoot: "root_009",
      txid: "tx_009",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_010",
      companyId: "comp_5678901234",
      tagId: "TAG-003",
      eventType: "SHIP",
      ts: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
      blobCid: null,
      leafHash: "hash_010",
      merkleRoot: "root_010",
      txid: "tx_010",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_011",
      companyId: "comp_1234567890",
      tagId: "TAG-003",
      eventType: "WAREHOUSE",
      ts: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      blobCid: null,
      leafHash: "hash_011",
      merkleRoot: "root_011",
      txid: "tx_011",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_012",
      companyId: "comp_0987654321",
      tagId: "TAG-003",
      eventType: "RETAIL",
      ts: Math.floor(Date.now() / 1000) - 3600 * 2, // 2 hours ago
      blobCid: null,
      leafHash: "hash_012",
      merkleRoot: "root_012",
      txid: "tx_012",
      status: "confirmed",
      fee: 0.001,
    },
    {
      eventId: "evt_013",
      companyId: "comp_5678901234",
      tagId: "TAG-003",
      eventType: "PURCHASE",
      ts: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
      blobCid: null,
      leafHash: "hash_013",
      merkleRoot: "root_013",
      txid: "tx_013",
      status: "confirmed",
      fee: 0.001,
    },
  ];

  await db.insert(events).values(seedEvents);

  // Seed initial wallet metrics with real blockchain data (zeros until funded)
  await db.insert(walletMetrics).values({
    masterWalletBalance: 0,
    totalFeesSpent: 0,
    totalFeesSpentUsd: 0,
    activeCompanies: 0,
    eventsToday: 0,
  });

  console.log("Database seeding completed!");
}

// Run seeding
seedData().catch(console.error);

export { seedData };