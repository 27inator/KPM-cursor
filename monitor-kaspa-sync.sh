#!/bin/bash

echo "🔍 KASPA NODE SYNC MONITOR"
echo "=========================="
echo "📊 Tracking testnet sync progress..."
echo "⏰ Started: $(date)"
echo ""

LOGFILE="/tmp/kaspa-logs/startup.log"
LAST_PROGRESS=""
START_TIME=$(date +%s)

while true; do
    # Check if node is still running
    if ! pgrep -f kaspad > /dev/null; then
        echo "❌ Kaspa node is not running!"
        exit 1
    fi

    # Get latest IBD progress
    CURRENT_PROGRESS=$(grep "IBD: Processed.*block headers" "$LOGFILE" | tail -1)
    
    if [[ -n "$CURRENT_PROGRESS" && "$CURRENT_PROGRESS" != "$LAST_PROGRESS" ]]; then
        TIMESTAMP=$(date '+%H:%M:%S')
        echo "[$TIMESTAMP] $CURRENT_PROGRESS"
        LAST_PROGRESS="$CURRENT_PROGRESS"
        
        # Extract percentage if available
        if [[ "$CURRENT_PROGRESS" =~ \(([0-9]+)%\) ]]; then
            PERCENT=${BASH_REMATCH[1]}
            if [[ $PERCENT -ge 99 ]]; then
                echo ""
                echo "🎉 SYNC NEARLY COMPLETE! Checking final status..."
                sleep 10
                
                # Check for completion indicators
                if grep -q "IBD finished" "$LOGFILE" || grep -q "Consensus ready" "$LOGFILE"; then
                    ELAPSED=$(($(date +%s) - START_TIME))
                    MINUTES=$((ELAPSED / 60))
                    echo "✅ KASPA NODE FULLY SYNCED!"
                    echo "⏱️  Total sync time: ${MINUTES} minutes"
                    echo "🚀 Ready for blockchain transactions!"
                    echo ""
                    echo "📋 NEXT STEPS:"
                    echo "   1. Test blockchain transactions"
                    echo "   2. Run comprehensive system tests"
                    echo "   3. Verify wallet funding works"
                    exit 0
                fi
            fi
        fi
    fi
    
    # Show periodic status even without IBD updates
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    if [[ $((ELAPSED % 60)) -eq 0 && $ELAPSED -gt 0 ]]; then
        MINUTES=$((ELAPSED / 60))
        echo "⏰ Running for ${MINUTES} minutes..."
        
        # Show latest activity
        LATEST=$(tail -3 "$LOGFILE" | grep -E "INFO|Processed" | tail -1)
        if [[ -n "$LATEST" ]]; then
            echo "   Latest: $LATEST"
        fi
        echo ""
    fi
    
    sleep 10
done 