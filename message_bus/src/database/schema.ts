import { pgTable, serial, text, timestamp, integer, boolean, jsonb, varchar, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 🏢 COMPANIES TABLE - Who owns what wallets
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  walletAddress: text('wallet_address').notNull().unique(),
  mnemonic: text('mnemonic').notNull(), // encrypted in production
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// 👥 USERS TABLE - Authentication and user management
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: text('role').default('user').notNull(), // 'admin', 'user', 'viewer'
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 🔗 COMPANY USERS RELATIONSHIP - Which users belong to which companies
export const companyUsers = pgTable('company_users', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  role: text('role').default('member').notNull(), // 'owner', 'admin', 'member', 'viewer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 🔑 API KEYS TABLE - For programmatic access
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(), // SHA-256 hash of the actual key
  keyPrefix: text('key_prefix').notNull(), // First 8 chars for identification
  companyId: integer('company_id').references(() => companies.id).notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  scopes: jsonb('scopes').notNull(), // ['read:events', 'write:events', 'read:analytics']
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 🎫 USER SESSIONS TABLE - Track active JWT sessions
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 hash of JWT
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

// 📋 SUPPLY CHAIN EVENTS TABLE - Every single event that happens
export const supplyChainEvents = pgTable('supply_chain_events', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull(),
  batchId: text('batch_id'),
  location: text('location').notNull(),
  eventType: text('event_type').notNull(),
  
  // Company relationship
  companyId: integer('company_id').references(() => companies.id).notNull(),
  
  // User who created the event
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  
  // Blockchain data
  transactionHash: text('transaction_hash').unique(),
  blockHeight: bigint('block_height', { mode: 'number' }),
  
  // Payload information
  payloadSize: integer('payload_size').notNull(),
  isOffChain: boolean('is_off_chain').default(false).notNull(),
  contentHash: text('content_hash'), // For off-chain payloads
  
  // Event data
  metadata: jsonb('metadata').notNull(),
  
  // PEA authenticity (optional)
  peaDeviceId: text('pea_device_id'),
  signatureB64: text('signature_b64'),
  publicKeyB64: text('public_key_b64'),
  payloadSha256: text('payload_sha256'),
  
  // Timestamps
  eventTimestamp: timestamp('event_timestamp').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  
  // Status tracking
  status: text('status').default('pending').notNull(), // pending, confirmed, failed
});

// 📦 PAYLOAD STORAGE TABLE - Track where large files are stored
export const payloadStorage = pgTable('payload_storage', {
  id: serial('id').primaryKey(),
  contentHash: text('content_hash').notNull().unique(),
  originalSize: integer('original_size').notNull(),
  compressedSize: integer('compressed_size'),
  storageType: text('storage_type').notNull(), // 'local', 'ipfs', 's3'
  storageUri: text('storage_uri').notNull(),
  
  // Company and user tracking
  companyId: integer('company_id').references(() => companies.id).notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id),
  
  // Content verification
  isVerified: boolean('is_verified').default(false).notNull(),
  lastVerifiedAt: timestamp('last_verified_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),
  
  // Cleanup info
  retentionPolicy: text('retention_policy').default('1year').notNull(),
  expiresAt: timestamp('expires_at'),
});

// 💰 BLOCKCHAIN TRANSACTIONS TABLE - Complete audit trail
export const blockchainTransactions = pgTable('blockchain_transactions', {
  id: serial('id').primaryKey(),
  transactionHash: text('transaction_hash').notNull().unique(),
  
  // Transaction details
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').notNull(),
  amount: bigint('amount', { mode: 'bigint' }).notNull(), // in sompis
  fee: bigint('fee', { mode: 'bigint' }).notNull(), // in sompis
  
  // Block information - Enhanced for real-time tracking
  blockHeight: bigint('block_height', { mode: 'number' }),
  blockHash: text('block_hash'),
  transactionIndex: integer('transaction_index'), // Position in block
  
  // Confirmation tracking - NEW FIELDS
  confirmationCount: integer('confirmation_count').default(0).notNull(),
  requiredConfirmations: integer('required_confirmations').default(1).notNull(),
  lastCheckedAt: timestamp('last_checked_at'), // Last poll time
  networkFee: bigint('network_fee', { mode: 'bigint' }), // Actual fee paid (vs estimated)
  
  // Company relationship
  companyId: integer('company_id').references(() => companies.id).notNull(),
  
  // User who initiated the transaction
  initiatedByUserId: integer('initiated_by_user_id').references(() => users.id),
  
  // Event relationship (optional - funding transactions won't have events)
  eventId: integer('event_id').references(() => supplyChainEvents.id),
  
  // Transaction type
  transactionType: text('transaction_type').notNull(), // 'supply_chain_event', 'funding', 'fee_payment'
  
  // Payload info
  payloadSize: integer('payload_size'),
  payloadHash: text('payload_hash'),
  
  // Status and timestamps - Enhanced
  status: text('status').default('submitted').notNull(), // submitted, pending, confirmed, failed, rejected
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
  
  // Error handling
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0).notNull(),
});

// 📟 DEVICES TABLE - Registered PEA devices
export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  deviceId: text('device_id').notNull().unique(),
  publicKeyB64: text('public_key_b64').notNull(),
  companyId: integer('company_id').references(() => companies.id),
  metadata: jsonb('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 💓 DEVICE HEARTBEATS - Last known health signals
export const deviceHeartbeats = pgTable('device_heartbeats', {
  id: serial('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  queueSize: integer('queue_size'),
  version: text('version'),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  // NEW: total queued bytes
  queueBytes: bigint('queue_bytes', { mode: 'number' }),
});

// 🔁 DEVICE NONCES - Recent nonces for replay protection
export const deviceNonces = pgTable('device_nonces', {
  id: serial('id').primaryKey(),
  deviceId: text('device_id').notNull(),
  nonce: varchar('nonce', { length: 128 }).notNull().unique(),
  issuedAtMs: bigint('issued_at_ms', { mode: 'number' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 🔗 RELATIONSHIPS - Tell the database how tables connect

export const companiesRelations = relations(companies, ({ many }) => ({
  events: many(supplyChainEvents),
  transactions: many(blockchainTransactions),
  companyUsers: many(companyUsers),
  apiKeys: many(apiKeys),
  payloadStorage: many(payloadStorage),
}));

export const usersRelations = relations(users, ({ many }) => ({
  companyUsers: many(companyUsers),
  apiKeys: many(apiKeys),
  sessions: many(userSessions),
  createdEvents: many(supplyChainEvents),
  initiatedTransactions: many(blockchainTransactions),
  createdPayloads: many(payloadStorage),
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  company: one(companies, {
    fields: [apiKeys.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const supplyChainEventsRelations = relations(supplyChainEvents, ({ one }) => ({
  company: one(companies, {
    fields: [supplyChainEvents.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [supplyChainEvents.createdByUserId],
    references: [users.id],
  }),
  transaction: one(blockchainTransactions, {
    fields: [supplyChainEvents.transactionHash],
    references: [blockchainTransactions.transactionHash],
  }),
}));

export const payloadStorageRelations = relations(payloadStorage, ({ one }) => ({
  company: one(companies, {
    fields: [payloadStorage.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [payloadStorage.createdByUserId],
    references: [users.id],
  }),
}));

export const blockchainTransactionsRelations = relations(blockchainTransactions, ({ one }) => ({
  company: one(companies, {
    fields: [blockchainTransactions.companyId],
    references: [companies.id],
  }),
  initiatedByUser: one(users, {
    fields: [blockchainTransactions.initiatedByUserId],
    references: [users.id],
  }),
  event: one(supplyChainEvents, {
    fields: [blockchainTransactions.eventId],
    references: [supplyChainEvents.id],
  }),
}));

// Export all table types for TypeScript
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type CompanyUser = typeof companyUsers.$inferSelect;
export type NewCompanyUser = typeof companyUsers.$inferInsert;

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type SupplyChainEvent = typeof supplyChainEvents.$inferSelect;
export type NewSupplyChainEvent = typeof supplyChainEvents.$inferInsert;

export type PayloadStorage = typeof payloadStorage.$inferSelect;
export type NewPayloadStorage = typeof payloadStorage.$inferInsert;

export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type NewBlockchainTransaction = typeof blockchainTransactions.$inferInsert;

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type DeviceHeartbeat = typeof deviceHeartbeats.$inferSelect;
export type NewDeviceHeartbeat = typeof deviceHeartbeats.$inferInsert;
export type DeviceNonce = typeof deviceNonces.$inferSelect;
export type NewDeviceNonce = typeof deviceNonces.$inferInsert; 