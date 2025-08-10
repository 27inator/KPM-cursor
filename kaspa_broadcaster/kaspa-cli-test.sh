#!/bin/bash

KASPA_CLI="../rusty-kaspa/target/release/kaspa-cli"
MASTER_MNEMONIC="arrest acid fall interest comfort expire aunt combine actor tackle stove coral"
COMPANY_ADDRESS="kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd"

echo "🔍 Testing kaspa-cli direct commands..."

# Try different approaches to avoid interactive mode
echo "1. Testing wallet commands with direct mnemonic..."

# Method 1: Try setting mnemonic as environment variable
export KASPA_MNEMONIC="$MASTER_MNEMONIC"

# Method 2: Try non-interactive wallet creation
echo "2. Creating wallet from mnemonic (non-interactive)..."
echo "$MASTER_MNEMONIC" | $KASPA_CLI --testnet-10 wallet create

# Method 3: Try direct send command if wallet exists
echo "3. Attempting direct send..."
$KASPA_CLI --testnet-10 wallet send --to "$COMPANY_ADDRESS" --amount 0.01

echo "Done testing kaspa-cli approaches" 