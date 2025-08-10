// Test real Kaspa SDK address generation
import { testRealKaspaAddresses } from './utils/real-kaspa-address-generator.js';

async function main() {
  await testRealKaspaAddresses();
}

main().catch(console.error);