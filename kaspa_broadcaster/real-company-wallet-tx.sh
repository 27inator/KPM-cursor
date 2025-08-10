#!/bin/bash

# Real company wallet transaction using rusty-kaspa CLI
# This sends actual KAS from master wallet TO company wallet with event data

KASPA_CLI="../rusty-kaspa/target/release/kaspa-cli"
MASTER_MNEMONIC="arrest acid fall interest comfort expire aunt combine actor tackle stove coral"

# Company wallet details from our API
COMPANY_ID="fresh-test-company"
COMPANY_ADDRESS="kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd"
EVENT_HASH="2663ab17173c8e2a69646c32c3b0b5187343363a9e40c07dd5725047dc071c2b1"

echo "🏭 Company Wallet Transaction Test"
echo "=================================="
echo "Company: $COMPANY_ID"
echo "Company Address: $COMPANY_ADDRESS"
echo "Event Hash: $EVENT_HASH"
echo ""

echo "📝 Setting up master wallet..."
# Import master wallet mnemonic
echo "$MASTER_MNEMONIC" | $KASPA_CLI wallet import --testnet-10

if [ $? -ne 0 ]; then
    echo "❌ Failed to import master wallet"
    exit 1
fi

echo "💰 Checking master wallet balance..."
BALANCE_OUTPUT=$($KASPA_CLI wallet balance --testnet-10 2>&1)
echo "Balance: $BALANCE_OUTPUT"

echo "🚀 Sending transaction FROM master wallet TO company wallet..."
echo "   Amount: 0.01 KAS"
echo "   OP_RETURN: $EVENT_HASH"

# Send transaction from master wallet to company wallet with event hash as OP_RETURN
TX_OUTPUT=$($KASPA_CLI wallet send --testnet-10 \
    --to "$COMPANY_ADDRESS" \
    --amount 0.01 \
    --op-return "$EVENT_HASH" 2>&1)

echo "Transaction output:"
echo "$TX_OUTPUT"

# Extract transaction ID
TX_ID=$(echo "$TX_OUTPUT" | grep -o '[a-f0-9]\{64\}' | head -1)

if [ -n "$TX_ID" ]; then
    echo ""
    echo "🎉 SUCCESS! Master wallet → Company wallet transaction completed!"
    echo "Transaction ID: $TX_ID"
    echo "Explorer: https://explorer-tn10.kaspa.org/txs/$TX_ID"
    echo ""
    echo "📊 Transaction Details:"
    echo "   From: Master Wallet (kaspatest:qpxm5tpyg8p6z7f6hy9mtlwz2es03cqtavaldsctcdltmnz6yfz6gvurgpmem)"
    echo "   To: $COMPANY_ADDRESS"
    echo "   Amount: 0.01 KAS"
    echo "   Event Data: $EVENT_HASH"
    echo ""
    
    # Log the transaction
    echo "{
  \"type\": \"master-to-company\",
  \"companyId\": \"$COMPANY_ID\",
  \"companyAddress\": \"$COMPANY_ADDRESS\",
  \"eventHash\": \"$EVENT_HASH\",
  \"transactionId\": \"$TX_ID\",
  \"amount\": \"0.01\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
  \"explorerUrl\": \"https://explorer-tn10.kaspa.org/txs/$TX_ID\",
  \"status\": \"SUCCESS\"
}" > master_to_company_tx.json
    
    echo "✅ Transaction logged to master_to_company_tx.json"
else
    echo "❌ Failed to extract transaction ID from output"
    exit 1
fi 