#!/bin/bash

# 🧪 Full KMP System Test Runner
# Starts services, runs comprehensive tests, and cleans up

set -e  # Exit on any error

echo "🧪 KMP FULL SYSTEM TEST RUNNER"
echo "==============================="
echo ""

# Cleanup function to ensure we always stop services
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    ./stop-test-environment.sh
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Step 1: Start all services
echo "Step 1: Starting KMP services..."
./start-test-environment.sh

# Step 2: Wait for services to fully initialize
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Step 3: Run comprehensive tests
echo ""
echo "Step 2: Running comprehensive system tests..."
echo "============================================="
npx tsx test-system-comprehensive.ts

echo ""
echo "🎉 Full system test completed!"
echo "Services will be automatically stopped." 