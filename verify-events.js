#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function verifyEvents() {
  console.log('🔍 Event Verification & Tracking System\n');

  try {
    // Read pending events
    console.log('📋 PENDING EVENTS (Queued for Blockchain Anchoring):');
    const pendingData = await fs.readFile('kaspa_broadcaster/pending_roots.txt', 'utf8');
    const pendingEvents = pendingData.trim().split('\n').filter(line => line);
    
    let immediateCount = 0;
    let batchCount = 0;
    const companiesTracked = new Set();

    pendingEvents.forEach((line, index) => {
      const event = JSON.parse(line);
      console.log(`  ${index + 1}. ${event.type.toUpperCase()} Event:`);
      console.log(`     📧 Hash: ${event.hash.substring(0, 16)}...`);
      
      if (event.type === 'immediate') {
        console.log(`     🏢 Company: ${event.companyId}`);
        console.log(`     🆔 Event ID: ${event.eventId}`);
        console.log(`     ⭐ Priority: ${event.priority}`);
        immediateCount++;
        companiesTracked.add(event.companyId);
      } else if (event.type === 'batch') {
        console.log(`     📦 Event Count: ${event.eventCount}`);
        console.log(`     🏢 Companies: ${event.companies.join(', ')}`);
        batchCount++;
        event.companies.forEach(company => companiesTracked.add(company));
      }
      
      const date = new Date(event.timestamp);
      console.log(`     ⏰ Queued: ${date.toLocaleTimeString()}`);
      console.log('');
    });

    // Read anchored transactions
    console.log('⚓ ANCHORED TRANSACTIONS (Confirmed on Blockchain):');
    try {
      const anchoredData = await fs.readFile('kaspa_broadcaster/anchored_txs.json', 'utf8');
      const anchoredEvents = anchoredData.trim().split('\n').filter(line => line);
      
      if (anchoredEvents.length === 0) {
        console.log('  📭 No events anchored yet (broadcaster runs every minute)');
      } else {
        anchoredEvents.forEach((line, index) => {
          const tx = JSON.parse(line);
          console.log(`  ${index + 1}. ✅ Anchored Transaction:`);
          console.log(`     📧 Root Hash: ${tx.root}`);
          console.log(`     🔗 Transaction ID: ${tx.txid}`);
          console.log(`     🌐 Explorer: ${tx.explorerUrl}`);
          console.log(`     ⏰ Anchored: ${new Date(tx.timestamp * 1000).toLocaleString()}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log('  📭 No anchored transactions file found');
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`  📥 Pending Events: ${pendingEvents.length}`);
    console.log(`    - Immediate: ${immediateCount}`);
    console.log(`    - Batches: ${batchCount}`);
    console.log(`  🏢 Companies Tracked: ${companiesTracked.size}`);
    console.log(`    - ${Array.from(companiesTracked).join(', ')}`);
    
    console.log('\n💡 VERIFICATION METHODS:');
    console.log('  1. 📋 Event Hash → Unique identifier for each event/batch');
    console.log('  2. 🔗 Transaction ID → Kaspa blockchain verification');
    console.log('  3. 🌐 Explorer URL → Visual blockchain confirmation');
    console.log('  4. ⏰ Timestamps → Processing timeline tracking');
    console.log('  5. 🏢 Company ID → Per-company event attribution');

    console.log('\n🔄 NEXT STEPS:');
    console.log('  - Broadcaster will process pending events within 60 seconds');
    console.log('  - Each anchored event gets a permanent blockchain record');
    console.log('  - Explorer URLs provide public verification');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyEvents(); 