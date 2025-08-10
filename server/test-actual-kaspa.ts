// Test the ACTUAL Kaspa packages we have installed
console.log('TESTING ACTUAL KASPA PACKAGES AVAILABLE:');
console.log('='.repeat(60));

// Test @kaspa/core-lib
try {
  const kaspaCore = await import('@kaspa/core-lib');
  console.log('✅ @kaspa/core-lib imported successfully');
  console.log('Available exports:', Object.keys(kaspaCore));
} catch (error) {
  console.log('❌ @kaspa/core-lib failed:', error.message);
}

// Test kaspa-wasm
try {
  const kaspaWasm = await import('kaspa-wasm');
  console.log('✅ kaspa-wasm imported successfully');
  console.log('Available exports:', Object.keys(kaspaWasm));
} catch (error) {
  console.log('❌ kaspa-wasm failed:', error.message);
}

// Test kaspeak-sdk
try {
  const kaspeakSdk = await import('kaspeak-sdk');
  console.log('✅ kaspeak-sdk imported successfully');
  console.log('Available exports:', Object.keys(kaspeakSdk));
} catch (error) {
  console.log('❌ kaspeak-sdk failed:', error.message);
}

console.log('='.repeat(60));
console.log('TRUTH: Which packages actually work for address generation?');