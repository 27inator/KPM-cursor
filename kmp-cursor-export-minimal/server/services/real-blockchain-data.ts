// Service to fetch real blockchain data from Kaspa testnet
import { KaspaWASMWallet, generateHDTestnetWallet } from './kaspa-wasm-wallet';
import { getMasterWallet, getCompanyWallet } from './wallet';

const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || "one two three four five six seven eight nine ten eleven twelve";

export interface RealWalletMetrics {
  masterWalletBalance: number;
  totalFeesSpent: number;
  totalFeesSpentUsd: number;
  activeCompanies: number;
  eventsToday: number;
}

export interface CompanyWalletInfo {
  address: string;
  balance: number;
  unconfirmedBalance: number;
  transactionCount: number;
}

export class RealBlockchainDataService {
  private kaspaWallet: KaspaWASMWallet;
  
  constructor() {
    this.kaspaWallet = new KaspaWASMWallet('testnet-10');
  }

  async getRealWalletMetrics(): Promise<RealWalletMetrics> {
    try {
      // Get master wallet balance
      const masterWallet = await getMasterWallet();
      const masterBalance = await this.kaspaWallet.getBalance(masterWallet.address);
      
      // Get company wallet balances for active companies
      const companyBalances = await this.getCompanyWalletBalances(3); // Check first 3 companies
      const totalCompanyBalance = companyBalances.reduce((sum, wallet) => sum + wallet.balance, 0);
      
      // Calculate real fees spent (difference from expected testnet balance)
      // Note: In testnet, wallets start with 0 balance, fees would be funded separately
      const totalFeesSpent = 0; // Will be calculated from actual transactions
      
      // Count active companies (those with events or balance)
      const activeCompanies = companyBalances.filter(wallet => wallet.balance > 0 || wallet.transactionCount > 0).length;
      
      return {
        masterWalletBalance: masterBalance.balance,
        totalFeesSpent: totalFeesSpent,
        totalFeesSpentUsd: totalFeesSpent * 0.05, // Mock KAS to USD rate for testnet
        activeCompanies: activeCompanies,
        eventsToday: 0 // Will be calculated from real events
      };
      
    } catch (error: any) {
      console.error('Failed to get real wallet metrics:', error);
      // Return zeros instead of mock data when blockchain unavailable
      return {
        masterWalletBalance: 0,
        totalFeesSpent: 0,
        totalFeesSpentUsd: 0,
        activeCompanies: 0,
        eventsToday: 0
      };
    }
  }

  async getCompanyWalletBalances(maxCompanies: number = 10): Promise<CompanyWalletInfo[]> {
    const walletInfo: CompanyWalletInfo[] = [];
    
    for (let i = 0; i < maxCompanies; i++) {
      try {
        const companyWallet = await getCompanyWallet(i);
        const balance = await this.kaspaWallet.getBalance(companyWallet.address);
        
        walletInfo.push({
          address: companyWallet.address,
          balance: balance.balance,
          unconfirmedBalance: balance.unconfirmedBalance || 0,
          transactionCount: 0 // Would need to query blockchain for tx count
        });
        
      } catch (error: any) {
        console.error(`Failed to get company ${i} wallet balance:`, error);
        // Continue with other wallets even if one fails
      }
    }
    
    return walletInfo;
  }

  async getMasterWalletInfo(): Promise<{ address: string; balance: number; network: string }> {
    try {
      const masterWallet = await getMasterWallet();
      const balance = await this.kaspaWallet.getBalance(masterWallet.address);
      
      return {
        address: masterWallet.address,
        balance: balance.balance,
        network: 'kaspa-testnet-10'
      };
    } catch (error: any) {
      console.error('Failed to get master wallet info:', error);
      throw error;
    }
  }

  async getNetworkInfo(): Promise<{ 
    network: string; 
    prefix: string; 
    explorer: string; 
    connected: boolean;
    apiEndpoint: string;
  }> {
    const networkInfo = this.kaspaWallet.getNetworkInfo();
    
    // Test API connectivity
    let connected = false;
    let apiEndpoint = '';
    
    try {
      // Try to get a balance to test connectivity
      const testWallet = await generateHDTestnetWallet(MASTER_MNEMONIC, 0);
      await this.kaspaWallet.getBalance(testWallet.address);
      connected = true;
      apiEndpoint = 'https://api.kaspa.org/testnet';
    } catch (error: any) {
      console.error('Network connectivity test failed:', error);
    }
    
    return {
      network: networkInfo.network,
      prefix: networkInfo.prefix,
      explorer: networkInfo.explorer,
      connected: connected,
      apiEndpoint: apiEndpoint
    };
  }

  // Calculate real system metrics based on actual blockchain data
  async getRealSystemMetrics(): Promise<{
    addressesGenerated: number;
    transactionsProcessed: number;
    networkUptime: number;
    averageConfirmationTime: number;
  }> {
    try {
      const companyWallets = await this.getCompanyWalletBalances(10);
      const networkInfo = await this.getNetworkInfo();
      
      return {
        addressesGenerated: companyWallets.length + 1, // Companies + master
        transactionsProcessed: companyWallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0),
        networkUptime: networkInfo.connected ? 1.0 : 0.0,
        averageConfirmationTime: networkInfo.connected ? 2.5 : 0 // Kaspa average block time
      };
    } catch (error: any) {
      console.error('Failed to get real system metrics:', error);
      return {
        addressesGenerated: 0,
        transactionsProcessed: 0,
        networkUptime: 0,
        averageConfirmationTime: 0
      };
    }
  }
}

// Export singleton instance
export const realBlockchainData = new RealBlockchainDataService();