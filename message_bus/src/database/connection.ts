import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// 🔧 DATABASE CONFIGURATION
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/kmp_supply_chain_dev';

// 🔌 CREATE CONNECTION TO OUR MAGICAL FILING CABINET
const sql = postgres(DATABASE_URL, {
  max: 20, // Maximum 20 connections at once
  idle_timeout: 30, // Close idle connections after 30 seconds
  connect_timeout: 10, // Give up connecting after 10 seconds
});

// 🪄 CREATE OUR MAGIC WAND (Drizzle ORM)
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' // Log SQL in development
});

// Expose raw SQL client for specialized queries
export const sqlClient = sql;

// 🧪 TEST CONNECTION FUNCTION
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 🧹 GRACEFUL SHUTDOWN
export async function closeConnection() {
  await sql.end();
  console.log('🔌 Database connection closed');
}

// 🔍 DATABASE HEALTH CHECK
export async function getDatabaseStats() {
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM companies) as total_companies,
        (SELECT COUNT(*) FROM supply_chain_events) as total_events,
        (SELECT COUNT(*) FROM payload_storage) as total_payloads,
        (SELECT COUNT(*) FROM blockchain_transactions) as total_transactions
    `;
    
    return {
      success: true,
      stats: stats[0],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    };
  }
}

// 🧱 Ensure PEA-related tables exist
export async function ensureProvisioningTables() {
  await sql`CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    device_id TEXT UNIQUE NOT NULL,
    public_key_b64 TEXT NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registered_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id)`;
  await sql`CREATE TABLE IF NOT EXISTS device_heartbeats (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    queue_size INTEGER,
    version TEXT,
    received_at TIMESTAMP NOT NULL DEFAULT now(),
    queue_bytes BIGINT
  )`;
  // Backfill for existing installations
  await sql`ALTER TABLE device_heartbeats ADD COLUMN IF NOT EXISTS queue_bytes BIGINT`;
  await sql`CREATE INDEX IF NOT EXISTS idx_device_heartbeats_device_id ON device_heartbeats(device_id)`;
  await sql`CREATE TABLE IF NOT EXISTS device_nonces (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    nonce VARCHAR(128) UNIQUE NOT NULL,
    issued_at_ms BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  )`;

  // Add PEA authenticity columns to supply_chain_events if missing
  await sql`ALTER TABLE supply_chain_events ADD COLUMN IF NOT EXISTS pea_device_id TEXT`;
  await sql`ALTER TABLE supply_chain_events ADD COLUMN IF NOT EXISTS signature_b64 TEXT`;
  await sql`ALTER TABLE supply_chain_events ADD COLUMN IF NOT EXISTS public_key_b64 TEXT`;
  await sql`ALTER TABLE supply_chain_events ADD COLUMN IF NOT EXISTS payload_sha256 TEXT`;
}

// Export types for TypeScript magic ✨
export type Database = typeof db;
export { schema }; 