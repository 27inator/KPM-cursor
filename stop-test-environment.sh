#!/bin/bash

# 🛑 KMP Test Environment Cleanup Script
# Stops all services and cleans up processes

echo "🛑 Stopping KMP Test Environment..."
echo "==================================="

# Function to safely kill process
safe_kill() {
    local pid=$1
    local name=$2
    
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        echo "🔄 Stopping $name (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null
        sleep 2
        
        # Force kill if still running
        if kill -0 "$pid" 2>/dev/null; then
            kill -KILL "$pid" 2>/dev/null
            echo "   ⚡ Force killed $name"
        else
            echo "   ✅ $name stopped gracefully"
        fi
    else
        echo "   ℹ️  $name was not running"
    fi
}

# Stop services using saved PIDs
if [ -f ".server.pid" ]; then
    SERVER_PID=$(cat .server.pid)
    safe_kill "$SERVER_PID" "Main Server"
    rm .server.pid
fi

if [ -f ".message_bus.pid" ]; then
    MESSAGE_BUS_PID=$(cat .message_bus.pid)
    safe_kill "$MESSAGE_BUS_PID" "Message Bus"
    rm .message_bus.pid
fi

# Kill any remaining processes on our ports
echo "🧹 Cleaning up remaining processes..."

# Kill processes by port
for port in 3000 3001; do
    PID=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$PID" ]; then
        kill -TERM $PID 2>/dev/null
        echo "   ✅ Cleaned up process on port $port"
    fi
done

# Kill any node processes that might be hanging
pkill -f "node.*3000" 2>/dev/null && echo "   ✅ Killed remaining node processes (3000)" || true
pkill -f "node.*3001" 2>/dev/null && echo "   ✅ Killed remaining node processes (3001)" || true

# Kill any Rust blockchain processes
pkill -f "kaspa_broadcaster" 2>/dev/null && echo "   ✅ Killed blockchain processes" || true

# Clean up log files
echo "📝 Cleaning up log files..."
rm -f server.log message_bus.log
echo "   ✅ Log files cleaned"

# Verify ports are free
sleep 1
for port in 3000 3001; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ⚠️  Port $port is still in use"
    else
        echo "   ✅ Port $port is free"
    fi
done

echo ""
echo "🎉 Test environment cleanup complete!"
echo "===================================="
echo "✅ All KMP services stopped"
echo "✅ Ports 3000 & 3001 freed"
echo "✅ Log files cleaned"
echo ""
echo "💡 To restart: ./start-test-environment.sh" 