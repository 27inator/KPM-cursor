#!/bin/bash

KASPA_CLI="../rusty-kaspa/target/release/kaspa-cli"
MASTER_MNEMONIC="arrest acid fall interest comfort expire aunt combine actor tackle stove coral"
COMPANY_ADDRESS="kaspatest:q44c975c89be50e8c6ec6b850d1100f8b05a5603ed2812661587ad81abd"
EVENT_HASH="2663ab17173c8e2a69646c32c3b0b5187343363a9e40c07dd5725047dc071c2b1"

echo "🚀 MASTER → COMPANY WALLET TRANSACTION"
echo "====================================="
echo "Company Address: $COMPANY_ADDRESS"
echo "Event Hash: $EVENT_HASH"
echo ""

# Try to send commands to kaspa-cli using expect or printf
echo "Attempting to send transaction using kaspa-cli..."

# Create a temporary command file
cat > /tmp/kaspa_commands.txt << EOF
wallet import --testnet-10 --from-mnemonic "$MASTER_MNEMONIC"
wallet send --testnet-10 --to "$COMPANY_ADDRESS" --amount 0.01 --op-return "$EVENT_HASH"
exit
EOF

echo "Commands to send:"
cat /tmp/kaspa_commands.txt
echo ""

# Try sending commands via stdin
echo "Sending commands to kaspa-cli..."
$KASPA_CLI < /tmp/kaspa_commands.txt

# Clean up
rm -f /tmp/kaspa_commands.txt 