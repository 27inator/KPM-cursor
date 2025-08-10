# Manual Company Wallet Creation

## Step 1: Start kaspa-cli
```bash
cd kaspa_broadcaster
../rusty-kaspa/target/release/kaspa-cli
```

## Step 2: Create wallet
At the `$` prompt, type:
```
wallet create --testnet-10
```

## Step 3: Fill prompts
1. **Default account title:** `sample-company-1`
2. **Phishing hint:** Just press Enter (skip)
3. **Enter wallet encryption password:** `CompanyPass123!`
4. **Re-enter wallet encryption password:** `CompanyPass123!`

## Step 4: Save the mnemonic
kaspa-cli will display a mnemonic phrase - copy it exactly!

## Step 5: Get the address
At the `$` prompt, type:
```
wallet address --testnet-10
```

Copy the kaspatest: address that appears.

## Step 6: Exit and save info
Type `exit` and save:
- Company name: sample-company-1  
- Address: [the kaspatest address]
- Mnemonic: [the 12-word phrase]
- Password: CompanyPass123!

## Step 7: Test transaction
We'll then test sending from master wallet to this company wallet! 