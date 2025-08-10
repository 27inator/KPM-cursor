import { generateHDTestnetWallet, KaspaWASMWallet } from './kaspa-wasm-wallet';

const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || "one two three four five six seven eight nine ten eleven twelve";

// Real Kaspa wallet interface using kaspa-wasm SDK
class Wallet {
  constructor(
    public address: string, 
    public derivationPath: string,
    public privateKey?: string
  ) {}
  
  static async fromMnemonic(mnemonic: string, options: { derivationPath: string }): Promise<Wallet> {
    try {
      // Extract HD path index from derivation path
      const pathIndex = parseInt(options.derivationPath.split('/')[3].replace("'", "")) || 0;
      
      // Use kaspa-wasm SDK to generate real testnet wallet
      const walletInfo = await generateHDTestnetWallet(mnemonic, pathIndex);
      
      console.log(`✅ Generated real Kaspa testnet address for path ${options.derivationPath}: ${walletInfo.address}`);
      
      return new Wallet(walletInfo.address, options.derivationPath, walletInfo.privateKey);
      
    } catch (error: any) {
      console.error(`❌ Failed to generate real Kaspa testnet address for ${options.derivationPath}:`, error);
      throw new Error(`Real Kaspa testnet address generation failed: ${error.message}`);
    }
  }
}

export async function getCompanyWallet(hdPathIndex: number): Promise<Wallet> {
  const derivationPath = `m/44'/277'/${hdPathIndex}'/0/0`;
  return await Wallet.fromMnemonic(MASTER_MNEMONIC, { derivationPath });
}

export async function getMasterWallet(): Promise<Wallet> {
  return await Wallet.fromMnemonic(MASTER_MNEMONIC, { derivationPath: "m/44'/277'/0'/0/0" });
}

export { Wallet };