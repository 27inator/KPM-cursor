#!/usr/bin/env tsx

/**
 * Debug Kaspeak SDK Initialization
 * Let's isolate the exact issue with kaspeak-sdk
 */

console.log('🔍 Debugging Kaspeak SDK Initialization');
console.log('======================================');

// Test 1: Node.js environment checks
console.log('📊 Environment Check:');
console.log(`  Node.js version: ${process.version}`);
console.log(`  String.prototype.padEnd: ${typeof String.prototype.padEnd}`);
console.log(`  Environment: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`  Module type: ES module`);
console.log('');

// Test 2: Minimal SDK import
console.log('📦 Testing SDK Import:');
try {
  const kaspeak = await import('kaspeak-sdk');
  console.log('✅ SDK imported successfully');
  console.log(`  Available exports: ${Object.keys(kaspeak)}`);
  console.log(`  Kaspeak constructor: ${typeof kaspeak.Kaspeak}`);
} catch (error) {
  console.error('❌ SDK import failed:', error);
  process.exit(1);
}

// Test 3: Basic SDK initialization with minimal config
console.log('🔧 Testing Basic SDK Initialization:');
try {
  const { Kaspeak } = await import('kaspeak-sdk');
  
  // Test with minimal config first
  console.log('  Attempting minimal initialization...');
  const sdk = new Kaspeak();
  console.log('✅ Basic initialization successful');
  
} catch (error) {
  console.error('❌ Basic initialization failed:', error);
  console.error('  Error stack:', error.stack);
  
  // Check if it's specifically the padEnd issue
  if (error.message.includes('padEnd')) {
    console.log('');
    console.log('🔍 Investigating padEnd issue...');
    
    // Test what object is missing padEnd
    console.log('  Checking global objects...');
    console.log(`  String.prototype.padEnd: ${typeof String.prototype.padEnd}`);
    console.log(`  Array.prototype.padEnd: ${typeof Array.prototype.padEnd}`);
    console.log(`  Buffer.prototype.padEnd: ${typeof Buffer.prototype.padEnd}`);
    
    // Test padEnd on various types
    try {
      console.log('  Testing padEnd on string:', 'test'.padEnd(10, '0'));
      console.log('  Testing padEnd on number string:', '123'.padEnd(10, '0'));
    } catch (e) {
      console.error('  padEnd test failed:', e);
    }
  }
}

// Test 4: Try with different configurations
console.log('🌐 Testing Different Configurations:');

const testConfigs = [
  { name: 'Default', config: {} },
  { name: 'Testnet only', config: { network: 'testnet' } },
  { name: 'Testnet-10', config: { network: 'testnet-10' } },
  { name: 'With mnemonic', config: { mnemonic: 'one two three four five six seven eight nine ten eleven twelve' } },
  { name: 'With network and mnemonic', config: { network: 'testnet', mnemonic: 'one two three four five six seven eight nine ten eleven twelve' } }
];

for (const test of testConfigs) {
  try {
    console.log(`  Testing ${test.name}...`);
    const { Kaspeak } = await import('kaspeak-sdk');
    const sdk = new Kaspeak(test.config);
    console.log(`  ✅ ${test.name}: Success`);
  } catch (error) {
    console.log(`  ❌ ${test.name}: ${error.message}`);
  }
}

// Test 5: Check SDK version and compatibility
console.log('📋 SDK Information:');
try {
  const fs = await import('fs');
  const packageInfo = JSON.parse(fs.readFileSync('./node_modules/kaspeak-sdk/package.json', 'utf8'));
  console.log(`  Version: ${packageInfo.version}`);
  console.log(`  Description: ${packageInfo.description}`);
  console.log(`  Dependencies: ${JSON.stringify(packageInfo.dependencies || {}, null, 2)}`);
  console.log(`  Main: ${packageInfo.main}`);
  console.log(`  Module: ${packageInfo.module}`);
} catch (error) {
  console.log('  ❌ Could not read package info');
}

// Test 6: Alternative import methods
console.log('🔄 Testing Alternative Import Methods:');
try {
  console.log('  Testing dynamic import...');
  const kaspeakDynamic = await import('kaspeak-sdk');
  console.log('  ✅ Dynamic import successful');
  console.log(`  Available: ${Object.keys(kaspeakDynamic)}`);
} catch (error) {
  console.log(`  ❌ Dynamic import failed: ${error.message}`);
}

console.log('');
console.log('🎯 Diagnosis Complete');
console.log('====================');
console.log('The debug output above should reveal the exact issue with kaspeak-sdk.');
console.log('Please check the specific error messages and configuration that works.');