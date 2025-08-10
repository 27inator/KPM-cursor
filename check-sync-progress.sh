#!/bin/bash

echo "🔍 Kaspa Node Sync Status"
echo "========================="

# Check if node is running
if ! pgrep -f kaspad > /dev/null; then
    echo "❌ Kaspa node is not running"
    exit 1
fi

echo "✅ Node is running (PID: $(pgrep -f kaspad))"
echo ""

# Get the latest sync info from logs
echo "📊 Latest Sync Progress:"
echo "------------------------"

# Show last few IBD progress lines
grep "IBD: Processed" /tmp/kaspa-logs/rusty-kaspa.log | tail -3

echo ""
echo "📈 Recent Activity (last 20 lines):"
echo "------------------------------------"
tail -5 /tmp/kaspa-logs/rusty-kaspa.log

echo ""
echo "💡 To monitor continuously: watch -n 10 ./check-sync-progress.sh"
echo "🛑 To stop the node: pkill -f kaspad" 