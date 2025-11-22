#!/bin/bash
# Beacon Market Data Configuration - Installer for Independent Traders

set -e  # Exit on any error

echo "🚀 Beacon Market Data Configuration - Installer"
echo "================================================"
echo ""

# Check Python version
echo "🐍 Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    echo "   ✅ Python $PYTHON_VERSION found"
    
    # Check if version is 3.7+
    if python3 -c "import sys; exit(0 if sys.version_info >= (3, 7) else 1)"; then
        echo "   ✅ Python version compatible"
    else
        echo "   ❌ Python 3.7+ required, found $PYTHON_VERSION"
        exit 1
    fi
else
    echo "   ❌ Python 3 not found"
    echo "   Please install Python 3.7+ first"
    exit 1
fi

# Install Python dependencies
echo ""
echo "📦 Installing dependencies..."
if python3 -c "import flask" 2>/dev/null; then
    echo "   ✅ Flask already installed"
else
    echo "   📥 Installing Flask..."
    python3 -m pip install flask --user
    echo "   ✅ Flask installed"
fi

# Check Beacon build
echo ""
echo "🔧 Checking Beacon generator..."
if [ -f "../build/bin/generator" ]; then
    echo "   ✅ Generator executable found"
else
    echo "   ⚠️  Generator not found - building..."
    
    # Check if CMake is available
    if command -v cmake &> /dev/null; then
        echo "   🔨 Building Beacon generator..."
        
        # Create build directory if it doesn't exist
        mkdir -p ../build
        
        # Configure and build from beacon root
        cd ..
        cmake -B build -S . -DCMAKE_BUILD_TYPE=Release
        cmake --build build --target generator
        cd web
        
        if [ -f "../build/bin/generator" ]; then
            echo "   ✅ Generator built successfully"
        else
            echo "   ❌ Failed to build generator"
            echo "   Please check CMake configuration and try again"
            exit 1
        fi
    else
        echo "   ❌ CMake not found"
        echo "   Please install CMake to build the generator"
        exit 1
    fi
fi

# Create config directory
echo ""
echo "📁 Setting up configuration directories..."
mkdir -p ../config
echo "   ✅ Configuration directory ready"

# Make scripts executable
chmod +x start_beacon_web.py
chmod +x beacon_web_server.py

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "🌐 Start Beacon:"
echo "   ./start_beacon_web.py"
echo ""
echo "🔗 Then open your browser to:"
echo "   http://localhost:8080"
echo ""
echo "📖 For help, see:"
echo "   TRADER_README.md"
echo ""
echo "✨ Happy Trading!"