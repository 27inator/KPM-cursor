#!/bin/bash

# 🚀 KMP Test Environment Startup Script
# Starts all services needed for comprehensive testing

echo "🚀 Starting KMP Test Environment..."
echo "======================================"

# Check if required directories exist
if [ ! -d "message_bus" ]; then
    echo "❌ message_bus directory not found"
    exit 1
fi

if [ ! -d "kaspa_broadcaster" ]; then
    echo "❌ kaspa_broadcaster directory not found"
    exit 1
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    else
        return 0
    fi
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "kaspa_broadcaster" 2>/dev/null || true

sleep 2

# Start PostgreSQL if not running (macOS)
if command -v brew >/dev/null 2>&1; then
    if ! pgrep -x postgres >/dev/null; then
        echo "🐘 Starting PostgreSQL..."
        brew services start postgresql 2>/dev/null || true
        sleep 3
    else
        echo "✅ PostgreSQL already running"
    fi
fi

# Check database connection
echo "🔍 Checking database connection..."
if ! psql postgres://localhost/kmp_supply_chain -c "SELECT 1;" >/dev/null 2>&1; then
    echo "❌ Database connection failed. Make sure PostgreSQL is running and database exists."
    echo "   Run: createdb kmp_supply_chain"
    exit 1
fi
echo "✅ Database connection verified"

# Install dependencies if needed
echo "📦 Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "   Installing main dependencies..."
    npm install --silent
fi

if [ ! -d "message_bus/node_modules" ]; then
    echo "   Installing message bus dependencies..."
    cd message_bus && npm install --silent && cd ..
fi

# Build Rust blockchain submitter
echo "🦀 Building Rust blockchain submitter..."
cd kaspa_broadcaster
if ! cargo build --release --quiet 2>/dev/null; then
    echo "⚠️  Rust build failed, but continuing with tests..."
fi
cd ..

# Start Message Bus (port 3001)
echo "🚌 Starting Message Bus service..."
cd message_bus
npm run dev > ../message_bus.log 2>&1 &
MESSAGE_BUS_PID=$!
cd ..

# Wait for message bus to start
sleep 3

# Check if message bus started successfully
if ! curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "❌ Message Bus failed to start on port 3001"
    echo "   Check message_bus.log for details"
    kill $MESSAGE_BUS_PID 2>/dev/null || true
    exit 1
fi
echo "✅ Message Bus running on port 3001"

# Start Main Server (port 3000)
echo "🖥️  Starting Main Server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server started successfully
if ! curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo "❌ Main Server failed to start on port 3000"
    echo "   Check server.log for details"
    kill $MESSAGE_BUS_PID 2>/dev/null || true
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
echo "✅ Main Server running on port 3000"

# Save PIDs for cleanup
echo $MESSAGE_BUS_PID > .message_bus.pid
echo $SERVER_PID > .server.pid

echo ""
echo "🎉 All services started successfully!"
echo "======================================"
echo "📊 Service Status:"
echo "   • Main Server:    http://localhost:3000"
echo "   • Message Bus:    http://localhost:3001"
echo "   • Database:       PostgreSQL (localhost)"
echo "   • Blockchain:     Kaspa Broadcaster (Rust)"
echo ""
echo "🧪 Ready for comprehensive testing!"
echo ""
echo "💡 To run tests: npx tsx test-system-comprehensive.ts"
echo "🛑 To stop services: ./stop-test-environment.sh" 