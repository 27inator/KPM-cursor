#!/usr/bin/env ts-node

/**
 * 🧪 DATABASE CONNECTION TEST
 * 
 * Let's test our magical filing cabinet!
 */

import { testConnection, getDatabaseStats } from './src/database/connection';

async function testOurDatabase() {
  console.log('🧪 TESTING OUR MAGICAL FILING CABINET');
  console.log('=====================================');
  
  // Test basic connection
  console.log('\n🔌 Testing database connection...');
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('❌ Database connection failed! Check if PostgreSQL is running.');
    process.exit(1);
  }
  
  // Get database statistics
  console.log('\n📊 Getting database statistics...');
  const stats = await getDatabaseStats();
  
  if (stats.success && stats.stats) {
    console.log('✅ Database stats retrieved successfully!');
    console.log('📋 Current data:');
    console.log(`   👥 Companies: ${stats.stats.total_companies}`);
    console.log(`   📦 Events: ${stats.stats.total_events}`);
    console.log(`   💾 Payloads: ${stats.stats.total_payloads}`);
    console.log(`   💰 Transactions: ${stats.stats.total_transactions}`);
  } else {
    console.log('❌ Failed to get database stats:', stats.error);
  }
  
  console.log('\n🎉 Database test complete!');
  console.log('✅ Our magical filing cabinet is ready to use!');
  
  process.exit(0);
}

// Run the test
testOurDatabase().catch(console.error); 