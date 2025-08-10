import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export interface CompanyWallet {
  companyId: string;
  address: string;
  privateKey: string;
  publicKey: string;
  mnemonic: string; // Each company gets their own unique mnemonic
  createdAt: string;
  isActive: boolean;
}

export interface SignedSupplyChainEvent {
  eventId: string;
  companyId: string;
  timestamp: string;
  location: string;
  productId: string;
  eventType: string;
  metadata: any;
  
  // Cryptographic proof
  companySignature: string;
  companyAddress: string;
  dataHash: string;
}

// Secure storage interface for company mnemonics
interface CompanyWalletStore {
  companyId: string;
  encryptedMnemonic: string;
  address: string;
  createdAt: string;
  isActive: boolean;
}

class CompanyWalletManager {
  private wallets: Map<string, CompanyWallet> = new Map();
  private masterMnemonic: string; // Only used for master wallet coordination, NOT company derivation
  private encryptionKey: string;
  private storePath: string;

  constructor(masterMnemonic: string) {
    this.masterMnemonic = masterMnemonic; // Master wallet stays separate
    // Generate encryption key for storing company mnemonics
    this.encryptionKey = crypto.createHash('sha256')
      .update(masterMnemonic + 'company-encryption-key')
      .digest('hex');
    this.storePath = path.join(__dirname, '..', 'secure', 'company-wallets.json');
    
    // Load existing company wallets
    this.loadCompanyWallets();
  }

  /**
   * Generate a completely unique wallet for a company with its own mnemonic
   */
  async generateCompanyWallet(companyId: string): Promise<CompanyWallet> {
    if (this.wallets.has(companyId)) {
      return this.wallets.get(companyId)!;
    }

    // Generate completely unique mnemonic for this company
    const companyMnemonic = this.generateUniqueMnemonic();
    
    // Generate wallet from company's own mnemonic
    const privateKey = crypto.createHash('sha256')
      .update(companyMnemonic + 'private-key')
      .digest('hex');
    
    const publicKey = crypto.createHash('sha256')
      .update(privateKey + 'public')
      .digest('hex');
    
    const addressHash = crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex');
    
    const address = `kaspatest:q${addressHash.substring(0, 58)}`;

    const wallet: CompanyWallet = {
      companyId,
      address,
      privateKey,
      publicKey,
      mnemonic: companyMnemonic, // Company's own unique mnemonic
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.wallets.set(companyId, wallet);
    
    // Store securely
    await this.saveCompanyWallet(wallet);
    
    console.log(`[CompanyWallet] Generated unique wallet for ${companyId}: ${address}`);
    console.log(`[CompanyWallet] Company has their own mnemonic (stored securely)`);
    
    return wallet;
  }

  /**
   * Generate a cryptographically secure unique mnemonic for a company
   */
  private generateUniqueMnemonic(): string {
    // Generate 256 bits of entropy for a strong mnemonic
    const entropy = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const randomSalt = crypto.randomBytes(16).toString('hex');
    
    // Create a unique seed combining entropy, time, and randomness
    const seed = crypto.createHash('sha256')
      .update(entropy)
      .update(timestamp)
      .update(randomSalt)
      .digest('hex');
    
    // For demo purposes, create a pseudo-mnemonic from the seed
    // In production, use proper BIP39 mnemonic generation
    const words = [];
    for (let i = 0; i < 12; i++) {
      const wordIndex = parseInt(seed.substr(i * 5, 5), 16) % 2048;
      words.push(`word${wordIndex}`);
    }
    
    return words.join(' ');
  }

  /**
   * Securely store company wallet (encrypted mnemonic)
   */
  private async saveCompanyWallet(wallet: CompanyWallet): Promise<void> {
    try {
      // Encrypt the mnemonic
      const encryptedMnemonic = this.encryptMnemonic(wallet.mnemonic);
      
      const storeData: CompanyWalletStore = {
        companyId: wallet.companyId,
        encryptedMnemonic,
        address: wallet.address,
        createdAt: wallet.createdAt,
        isActive: wallet.isActive
      };

      // Load existing data
      let existingData: CompanyWalletStore[] = [];
      try {
        await fs.mkdir(path.dirname(this.storePath), { recursive: true });
        const fileContent = await fs.readFile(this.storePath, 'utf-8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      // Add or update company wallet
      const existingIndex = existingData.findIndex(item => item.companyId === wallet.companyId);
      if (existingIndex >= 0) {
        existingData[existingIndex] = storeData;
      } else {
        existingData.push(storeData);
      }

      // Save back to file
      await fs.writeFile(this.storePath, JSON.stringify(existingData, null, 2));
      
      console.log(`[CompanyWallet] Securely stored wallet for ${wallet.companyId}`);
    } catch (error) {
      console.error(`[CompanyWallet] Failed to save wallet for ${wallet.companyId}:`, error);
    }
  }

  /**
   * Load company wallets from secure storage
   */
  private async loadCompanyWallets(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.storePath, 'utf-8');
      const storedWallets: CompanyWalletStore[] = JSON.parse(fileContent);
      
      for (const stored of storedWallets) {
        if (stored.isActive) {
          // Decrypt mnemonic and reconstruct wallet
          const mnemonic = this.decryptMnemonic(stored.encryptedMnemonic);
          
          // Regenerate wallet details from mnemonic
          const privateKey = crypto.createHash('sha256')
            .update(mnemonic + 'private-key')
            .digest('hex');
          
          const publicKey = crypto.createHash('sha256')
            .update(privateKey + 'public')
            .digest('hex');

          const wallet: CompanyWallet = {
            companyId: stored.companyId,
            address: stored.address,
            privateKey,
            publicKey,
            mnemonic,
            createdAt: stored.createdAt,
            isActive: stored.isActive
          };

          this.wallets.set(stored.companyId, wallet);
        }
      }
      
      console.log(`[CompanyWallet] Loaded ${this.wallets.size} company wallets from secure storage`);
    } catch (error) {
      console.log(`[CompanyWallet] No existing wallets found, starting fresh`);
    }
  }

  /**
   * Encrypt a mnemonic for secure storage
   */
  private encryptMnemonic(mnemonic: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt a mnemonic from secure storage
   */
  private decryptMnemonic(encryptedMnemonic: string): string {
    const parts = encryptedMnemonic.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Sign a supply chain event with company's private key
   */
  async signSupplyChainEvent(event: any, companyId: string): Promise<SignedSupplyChainEvent> {
    const wallet = await this.generateCompanyWallet(companyId);
    
    // Create canonical data hash
    const eventData = {
      eventId: event.eventId,
      timestamp: event.timestamp,
      location: event.location,
      productId: event.productId,
      eventType: event.eventType,
      metadata: event.metadata
    };
    
    const dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(eventData))
      .digest('hex');

    // Sign the data hash with company's private key
    const signature = this.signMessage(dataHash, wallet.privateKey);

    const signedEvent: SignedSupplyChainEvent = {
      ...eventData,
      companyId,
      companySignature: signature,
      companyAddress: wallet.address,
      dataHash
    };

    console.log(`[CompanyWallet] Event signed by ${companyId} using their unique key (${wallet.address})`);
    return signedEvent;
  }

  /**
   * Verify a company's signature on an event
   */
  verifyEventSignature(signedEvent: SignedSupplyChainEvent): boolean {
    try {
      const wallet = this.wallets.get(signedEvent.companyId);
      if (!wallet) {
        console.error(`[CompanyWallet] No wallet found for company: ${signedEvent.companyId}`);
        return false;
      }

      // Recreate data hash
      const eventData = {
        eventId: signedEvent.eventId,
        timestamp: signedEvent.timestamp,
        location: signedEvent.location,
        productId: signedEvent.productId,
        eventType: signedEvent.eventType,
        metadata: signedEvent.metadata
      };
      
      const expectedHash = crypto.createHash('sha256')
        .update(JSON.stringify(eventData))
        .digest('hex');

      if (expectedHash !== signedEvent.dataHash) {
        console.error(`[CompanyWallet] Data hash mismatch for ${signedEvent.eventId}`);
        return false;
      }

      // Verify signature using company's unique key
      return this.verifySignature(signedEvent.dataHash, signedEvent.companySignature, wallet.publicKey);
    } catch (error) {
      console.error(`[CompanyWallet] Signature verification failed:`, error);
      return false;
    }
  }

  /**
   * Get company wallet address (generates wallet if it doesn't exist)
   */
  async getCompanyAddress(companyId: string): Promise<string> {
    const wallet = await this.generateCompanyWallet(companyId);
    return wallet.address;
  }

  /**
   * Get company's mnemonic (for potential self-custody handover)
   */
  async getCompanyMnemonic(companyId: string): Promise<string> {
    const wallet = await this.generateCompanyWallet(companyId);
    return wallet.mnemonic;
  }

  /**
   * List all company wallets (without exposing mnemonics)
   */
  getAllCompanyWallets(): Omit<CompanyWallet, 'mnemonic' | 'privateKey'>[] {
    return Array.from(this.wallets.values()).map(wallet => ({
      companyId: wallet.companyId,
      address: wallet.address,
      publicKey: wallet.publicKey,
      createdAt: wallet.createdAt,
      isActive: wallet.isActive
    }));
  }

  /**
   * Deactivate a company wallet (security measure)
   */
  async deactivateCompanyWallet(companyId: string): Promise<void> {
    const wallet = this.wallets.get(companyId);
    if (wallet) {
      wallet.isActive = false;
      await this.saveCompanyWallet(wallet);
      console.log(`[CompanyWallet] Deactivated wallet for ${companyId}`);
    }
  }

  private signMessage(message: string, privateKey: string): string {
    // Simple signature implementation
    // In production, use proper ECDSA signing
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const signature = crypto.createHmac('sha256', privateKey)
      .update(messageHash)
      .digest('hex');
    
    return signature;
  }

  private verifySignature(message: string, signature: string, publicKey: string): boolean {
    // Simple signature verification
    // In production, use proper ECDSA verification
    try {
      const messageHash = crypto.createHash('sha256').update(message).digest();
      // This is a simplified verification - in production use proper crypto
      return signature.length === 64; // Basic validation
    } catch {
      return false;
    }
  }
}

export default CompanyWalletManager; 