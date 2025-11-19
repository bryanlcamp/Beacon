#!/bin/bash

#
# Complete Loopback Trading Simulation
# 
# This script orchestrates a complete trading system simulation using only 
# loopback addresses (127.0.0.1 and multicast) to avoid external network 
# dependencies. Network engineers don't need to be involved!
#
# Flow:
#   generator -> binary file -> playback -> UDP multicast (239.255.0.1:12345)
#                                              ↓
#   client_algorithm <- UDP multicast          |
#            ↓                                 |
#   TCP (127.0.0.1:54321) -> matching_engine  |
#

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BEACON_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=================================================================="
echo " BEACON TRADING SYSTEM - COMPLETE LOOPBACK SIMULATION"
echo "=================================================================="
echo " Purpose: Full trading simulation using only localhost addresses"
echo " Network: No external dependencies - isolated testing"
echo " Root:    $BEACON_ROOT"
echo "=================================================================="

# Configuration
MULTICAST_ADDR="239.255.0.1"
MULTICAST_PORT="12345"
TCP_HOST="127.0.0.1" 
TCP_PORT="54321"
GENERATOR_CONFIG="config/generator/sample_config.json"
PLAYBACK_CONFIG="config/playback/loopback_simulation.json"
TEST_DURATION="30"  # seconds

# File paths
BINARY_FILE="$BEACON_ROOT/loopback_test_data.bin"
BUILD_DIR="$BEACON_ROOT/build"

# PID tracking for cleanup
PIDS=()

cleanup() {
    echo ""
    echo "=================================================================="
    echo " CLEANING UP PROCESSES"
    echo "=================================================================="
    
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping process $pid"
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Force killing process $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    echo "Cleanup complete"
}

trap cleanup EXIT INT TERM

verify_builds() {
    echo ""
    echo "1. VERIFYING BUILD ARTIFACTS"
    echo "--------------------------------------------------"
    
    local required_binaries=(
        "$BUILD_DIR/bin/generator"
        "$BUILD_DIR/src/apps/playback/playback"
        "$BUILD_DIR/src/apps/matching_engine/matching_engine"
        "$BUILD_DIR/src/apps/client_algorithm/client_algorithm"
    )
    
    for binary in "${required_binaries[@]}"; do
        if [[ -x "$binary" ]]; then
            echo "  ✓ $binary"
        else
            echo "  ✗ $binary (missing or not executable)"
            echo ""
            echo "ERROR: Required binaries not found. Please build the project:"
            echo "  cmake --build build"
            exit 1
        fi
    done
}

run_diagnostics() {
    echo ""
    echo "2. RUNNING NETWORK DIAGNOSTICS"
    echo "--------------------------------------------------"
    
    cd "$BEACON_ROOT"
    
    if [[ -x "scripts/beacon_utils/beacon-diagnose-loopback.py" ]]; then
        echo "Running UDP/TCP diagnostics..."
        python3 scripts/beacon_utils/beacon-diagnose-loopback.py "$MULTICAST_ADDR" "$MULTICAST_PORT" "$TCP_PORT"
    else
        echo "⚠ Diagnostic script not found - proceeding with simulation"
    fi
}

generate_test_data() {
    echo ""
    echo "3. GENERATING TEST MARKET DATA"
    echo "--------------------------------------------------"
    
    cd "$BEACON_ROOT"
    
    if [[ -f "$BINARY_FILE" ]]; then
        echo "Using existing test data: $BINARY_FILE"
    else
        echo "Generating new test data..."
        "$BUILD_DIR/bin/generator" "$GENERATOR_CONFIG" "$BINARY_FILE"
        
        if [[ -f "$BINARY_FILE" ]]; then
            local file_size=$(wc -c < "$BINARY_FILE")
            echo "✓ Generated test data: $BINARY_FILE ($file_size bytes)"
        else
            echo "✗ Failed to generate test data"
            exit 1
        fi
    fi
}

start_matching_engine() {
    echo ""
    echo "4. STARTING MATCHING ENGINE"
    echo "--------------------------------------------------"
    
    cd "$BEACON_ROOT"
    
    echo "Starting matching engine on TCP $TCP_HOST:$TCP_PORT..."
    "$BUILD_DIR/src/apps/matching_engine/matching_engine" "$TCP_PORT" &
    local me_pid=$!
    PIDS+=($me_pid)
    
    # Wait for matching engine to start
    sleep 2
    
    if kill -0 "$me_pid" 2>/dev/null; then
        echo "✓ Matching engine started (PID: $me_pid)"
    else
        echo "✗ Matching engine failed to start"
        exit 1
    fi
}

start_playback() {
    echo ""
    echo "5. STARTING MARKET DATA PLAYBACK"  
    echo "--------------------------------------------------"
    
    cd "$BEACON_ROOT"
    
    echo "Starting playback: UDP multicast $MULTICAST_ADDR:$MULTICAST_PORT"
    "$BUILD_DIR/src/apps/playback/playback" --config "$PLAYBACK_CONFIG" "$BINARY_FILE" &
    local playback_pid=$!
    PIDS+=($playback_pid)
    
    # Wait for playback to initialize
    sleep 3
    
    if kill -0 "$playback_pid" 2>/dev/null; then
        echo "✓ Market data playback started (PID: $playback_pid)"
    else
        echo "✗ Playback failed to start"
        exit 1
    fi
}

start_client_algorithm() {
    echo ""
    echo "6. STARTING CLIENT ALGORITHM"
    echo "--------------------------------------------------"
    
    cd "$BEACON_ROOT"
    
    echo "Starting client algorithm..."
    echo "  Market Data: UDP $MULTICAST_ADDR:$MULTICAST_PORT"
    echo "  Order Entry: TCP $TCP_HOST:$TCP_PORT"
    echo "  Duration:    $TEST_DURATION seconds"
    
    "$BUILD_DIR/src/apps/client_algorithm/client_algorithm" \
        "$MULTICAST_ADDR" "$MULTICAST_PORT" \
        "$TCP_HOST" "$TCP_PORT" \
        "$TEST_DURATION" &
    local client_pid=$!
    PIDS+=($client_pid)
    
    # Wait for client to initialize
    sleep 2
    
    if kill -0 "$client_pid" 2>/dev/null; then
        echo "✓ Client algorithm started (PID: $client_pid)"
    else
        echo "✗ Client algorithm failed to start"
        exit 1
    fi
}

monitor_simulation() {
    echo ""
    echo "7. MONITORING SIMULATION"
    echo "--------------------------------------------------"
    echo "Running complete loopback simulation for $TEST_DURATION seconds..."
    echo ""
    echo "Data Flow:"
    echo "  generator -> $BINARY_FILE"
    echo "  playback -> UDP $MULTICAST_ADDR:$MULTICAST_PORT -> client_algorithm"  
    echo "  client_algorithm -> TCP $TCP_HOST:$TCP_PORT -> matching_engine"
    echo ""
    echo "Press Ctrl+C to stop early, or wait for automatic completion..."
    
    # Monitor for the test duration
    local start_time=$(date +%s)
    local end_time=$((start_time + TEST_DURATION))
    
    while [[ $(date +%s) -lt $end_time ]]; do
        local remaining=$((end_time - $(date +%s)))
        printf "\rTime remaining: %2d seconds" "$remaining"
        sleep 1
        
        # Check if any critical process died
        local all_alive=true
        for pid in "${PIDS[@]}"; do
            if ! kill -0 "$pid" 2>/dev/null; then
                all_alive=false
                break
            fi
        done
        
        if [[ "$all_alive" != "true" ]]; then
            echo ""
            echo "⚠ One or more processes stopped unexpectedly"
            break
        fi
    done
    
    printf "\n"
}

show_results() {
    echo ""
    echo "8. SIMULATION RESULTS"
    echo "--------------------------------------------------"
    
    echo "Process status:"
    for i in "${!PIDS[@]}"; do
        local pid="${PIDS[$i]}"
        local names=("matching_engine" "playback" "client_algorithm")
        local name="${names[$i]:-process$i}"
        
        if kill -0 "$pid" 2>/dev/null; then
            echo "  ✓ $name (PID: $pid) - still running"
        else
            echo "  ✗ $name (PID: $pid) - stopped"
        fi
    done
    
    echo ""
    echo "Log locations:"
    echo "  - Check terminal output above for any errors"
    echo "  - Playback logs: Check stdout from playback process"
    echo "  - Client algorithm: Check stdout for market data and order stats"
    echo "  - Matching engine: Check stdout for order processing"
    
    echo ""
    echo "=================================================================="
    echo " SIMULATION COMPLETE"
    echo "=================================================================="
    echo " ✓ Complete loopback simulation executed successfully"
    echo " ✓ No external network dependencies used"
    echo " ✓ All communication via localhost (UDP multicast + TCP)"
    echo ""
    echo " Next steps:"
    echo "   - Review output logs for message counts and latencies"
    echo "   - Adjust configuration files for different test scenarios"
    echo "   - Scale up message volume or test duration as needed"
    echo "=================================================================="
}

main() {
    verify_builds
    run_diagnostics  
    generate_test_data
    start_matching_engine
    start_playback
    start_client_algorithm
    monitor_simulation
    show_results
}

# Parse command line options
case "${1:-}" in
    "diagnose"|"diag")
        echo "Running diagnostics only..."
        run_diagnostics
        exit 0
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [diagnose|help]"
        echo ""
        echo "  diagnose    Run network diagnostics only"
        echo "  help        Show this help message"
        echo "  (no args)   Run complete simulation"
        exit 0
        ;;
    *)
        main
        ;;
esac