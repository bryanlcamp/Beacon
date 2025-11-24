#!/bin/bash

# Beacon Market Data Generator Auto-Launcher
# Starts Python web server and opens browser automatically

echo "🚀 Starting Beacon Market Data Generator UI..."

# Get script directory (beacon root)
BEACON_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Beacon Root: $BEACON_ROOT"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if web launcher exists
WEB_LAUNCHER="$BEACON_ROOT/web/start_beacon_web.py"
if [ ! -f "$WEB_LAUNCHER" ]; then
    echo "❌ Web launcher not found: $WEB_LAUNCHER"
    exit 1
fi

echo "🌐 Starting web server..."

# Start the web server in background
cd "$BEACON_ROOT"
python3 web/start_beacon_web.py &
SERVER_PID=$!

# Wait for server to start
sleep 4

# Check if server is still running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Web server started successfully (PID: $SERVER_PID)"
    echo "🌐 Opening browser at http://localhost:8080"
    
    # Open browser (works on macOS, Linux, Windows)
    if command -v open &> /dev/null; then
        open http://localhost:8080  # macOS
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8080  # Linux
    elif command -v start &> /dev/null; then
        start http://localhost:8080  # Windows
    else
        echo "💡 Please open http://localhost:8080 in your browser"
    fi
    
    echo ""
    echo "============================================================"
    echo "🎯 BEACON MARKET DATA GENERATOR UI READY"
    echo "============================================================"
    echo "📱 Browser: http://localhost:8080"
    echo "🛑 Press Ctrl+C to stop the server"
    echo "💡 Keep this terminal open while using the UI"
    echo "🔧 Server PID: $SERVER_PID"
    echo "============================================================"
    
    # Function to handle cleanup
    cleanup() {
        echo ""
        echo "🛑 Shutting down web server..."
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        echo "✅ Server stopped gracefully"
        exit 0
    }
    
    # Trap Ctrl+C
    trap cleanup INT TERM
    
    # Wait for server process
    wait $SERVER_PID
    
else
    echo "❌ Web server failed to start"
    exit 1
fi