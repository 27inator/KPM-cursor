// PRODUCTION: Real Kaspa address generation using kaspa-rpc-client
import { ClientWrapper, Wallet } from "kaspa-rpc-client";

interface KaspaWalletInfo {
  mnemonic: string;
  addresses: Array<{
    account: number;
    address: string;
    derivationPath: string;
  }>;
  masterAddress: string;
}

class RealKaspaAddressGenerator {
  private wrapper: ClientWrapper | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Use testnet for development and testing
      this.wrapper = new ClientWrapper({
        hosts: ["seeder2.kaspad.net:16210"], // testnet
        verbose: false
      });

      await this.wrapper.initialize();
      this.isInitialized = true;
      console.log('✅ Real Kaspa testnet connection established');
    } catch (testnetError) {
      console.log('⚠️ Primary testnet failed, trying alternative testnet endpoints...');
      
      // Try alternative testnet endpoints
      const testnetHosts = [
        "testnet-1.kaspad.net:16210",
        "testnet-2.kaspad.net:16210"
      ];
      
      for (const host of testnetHosts) {
        try {
          this.wrapper = new ClientWrapper({
            hosts: [host],
            verbose: false
          });

          await this.wrapper.initialize();
          this.isInitialized = true;
          console.log(`✅ Real Kaspa testnet connection established via ${host}`);
          return;
        } catch (altError) {
          console.log(`⚠️ Alternative testnet ${host} failed`);
        }
      }
      
      console.error('❌ All Kaspa testnet connections failed');
      throw new Error(`Kaspa testnet connection failed: ${testnetError.message}`);
    }
  }

  async generateMasterWallet(): Promise<KaspaWalletInfo> {
    await this.initialize();
    
    if (!this.wrapper) {
      throw new Error('Kaspa client not initialized');
    }

    const client = await this.wrapper.getClient();
    
    // Generate new mnemonic or use existing from env
    let masterMnemonic = process.env.MASTER_MNEMONIC;
    if (!masterMnemonic) {
      const mnemonicData = Wallet.randomMnemonic();
      masterMnemonic = mnemonicData.phrase;
      console.log('🔐 Generated new mnemonic (should be saved to MASTER_MNEMONIC env variable)');
    } else {
      console.log('🔐 Using existing mnemonic from environment');
    }

    console.log('🔐 Creating master wallet from mnemonic...');
    const wallet = Wallet.fromPhrase(client, masterMnemonic);
    
    // Generate multiple company accounts (0-4)
    const addresses = [];
    for (let i = 0; i < 5; i++) {
      const account = await wallet.account(BigInt(i));
      const addressObj = await account.address();
      const address = addressObj.address;
      
      addresses.push({
        account: i,
        address: address,
        derivationPath: `m/44'/277'/${i}'/0/0`
      });
      
      console.log(`Generated account ${i}: ${address}`);
    }

    const masterAccount = await wallet.account(BigInt(0));
    const masterAddressObj = await masterAccount.address();
    const masterAddress = masterAddressObj.address;

    console.log('✅ Master wallet created with real Kaspa addresses');
    
    return {
      mnemonic: masterMnemonic,
      addresses: addresses,
      masterAddress: masterAddress
    };
  }

  async generateCompanyWallet(companyIndex: number, masterMnemonic?: string): Promise<string> {
    await this.initialize();
    
    if (!this.wrapper) {
      throw new Error('Kaspa client not initialized');
    }

    const client = await this.wrapper.getClient();
    
    // Use master mnemonic from env or provided
    const mnemonic = masterMnemonic || process.env.MASTER_MNEMONIC;
    if (!mnemonic) {
      throw new Error('Master mnemonic not found in environment');
    }

    const wallet = Wallet.fromPhrase(client, mnemonic);
    const account = await wallet.account(BigInt(companyIndex));
    const addressObj = await account.address();
    
    console.log(`✅ Generated company ${companyIndex} address: ${addressObj.address}`);
    
    return addressObj.address;
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      // Test against Kaspa testnet API - addresses should start with kaspatest:
      if (address.startsWith('kaspatest:')) {
        const response = await fetch(`https://api.kaspa.org/testnet/addresses/${address}/balance`);
        return response.ok;
      } else if (address.startsWith('kaspa:')) {
        // For mainnet addresses (if generated accidentally)
        const response = await fetch(`https://api.kaspa.org/addresses/${address}/balance`);
        return response.ok;
      }
      return false;
    } catch (error) {
      console.error('Address validation failed:', error);
      return false;
    }
  }

  async getBalance(address: string): Promise<number> {
    try {
      let apiUrl: string;
      if (address.startsWith('kaspatest:')) {
        apiUrl = `https://api.kaspa.org/testnet/addresses/${address}/balance`;
      } else {
        apiUrl = `https://api.kaspa.org/addresses/${address}/balance`;
      }
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        return data.balance || 0;
      }
      return 0;
    } catch (error) {
      console.error('Balance fetch failed:', error);
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    if (this.wrapper) {
      await this.wrapper.disconnect();
      this.wrapper = null;
      this.isInitialized = false;
    }
  }
}

// Singleton instance
const realKaspaGenerator = new RealKaspaAddressGenerator();

// Export functions for KMP system
export async function generateRealKaspaWallets(): Promise<KaspaWalletInfo> {
  return await realKaspaGenerator.generateMasterWallet();
}

export async function generateCompanyAddress(companyIndex: number): Promise<string> {
  return await realKaspaGenerator.generateCompanyWallet(companyIndex);
}

export async function validateKaspaAddress(address: string): Promise<boolean> {
  return await realKaspaGenerator.validateAddress(address);
}

export async function getKaspaBalance(address: string): Promise<number> {
  return await realKaspaGenerator.getBalance(address);
}

export async function disconnectKaspa(): Promise<void> {
  await realKaspaGenerator.disconnect();
}

// Test function for verification
export async function testRealAddressGeneration(): Promise<void> {
  console.log('🧪 Testing real Kaspa address generation...');
  
  const walletInfo = await generateRealKaspaWallets();
  
  console.log('Master wallet info:');
  console.log('- Mnemonic:', walletInfo.mnemonic);
  console.log('- Master address:', walletInfo.masterAddress);
  console.log('- Company addresses:');
  
  for (const addr of walletInfo.addresses) {
    console.log(`  Company ${addr.account}: ${addr.address}`);
    
    // Validate each address
    const isValid = await validateKaspaAddress(addr.address);
    console.log(`  ✅ Address validation: ${isValid ? 'PASS' : 'FAIL'}`);
  }
  
  await disconnectKaspa();
  console.log('✅ Real address generation test completed');
}

export { RealKaspaAddressGenerator };