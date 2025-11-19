#!/bin/bash
#
# Beacon Playback System - Simple Shell Interface
# Provides quick access to playback functionality with automatic file discovery
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  Beacon Playback System"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Usage:"
    echo "  $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  run [file] [config]     - Run playback with optional file and config"
    echo "  test                    - Run playback test suite"
    echo "  list                    - List available data files and configs"
    echo "  build                   - Build playback system"
    echo "  clean                   - Clean build artifacts"
    echo ""
    echo "Examples:"
    echo "  $0 run                              # Interactive file selection"
    echo "  $0 run output.itch                 # Use specific data file"  
    echo "  $0 run data.bin burst_mode.json    # Use specific file and config"
    echo "  $0 test                             # Run test suite"
    echo "  $0 list                             # Show available files"
    echo ""
}

build_playback() {
    echo -e "${BLUE}Building playback system...${NC}"
    cd "$BASE_DIR"
    
    if [ ! -d "build" ]; then
        echo "Creating build directory..."
        mkdir -p build
        cd build
        cmake ..
    else
        cd build
    fi
    
    echo "Building playback target..."
    cmake --build . --target playback -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Playback build complete${NC}"
        return 0
    else
        echo -e "${RED}✗ Build failed${NC}"
        return 1
    fi
}

list_files() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  Available Files"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    
    # Look for data files
    echo "Data files:"
    found_data=false
    for dir in "$BASE_DIR/data" "$BASE_DIR/src/apps/generator" "$BASE_DIR"; do
        if [ -d "$dir" ]; then
            for ext in bin itch dat; do
                if ls "$dir"/*.$ext 2>/dev/null | head -5 | while read -r file; do
                    if [ -f "$file" ]; then
                        size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
                        size_mb=$(( size / 1024 / 1024 ))
                        messages=$(( size / 33 ))
                        echo "  $(basename "$file") (${size_mb}MB, ~${messages} messages)"
                        found_data=true
                    fi
                done; then
                    found_data=true
                fi
            done
        fi
    done
    
    if [ "$found_data" = false ]; then
        echo "  (No data files found - run generator first)"
    fi
    
    echo ""
    echo "Configuration files:"
    if [ -d "$BASE_DIR/config/playback" ]; then
        for config in "$BASE_DIR/config/playback"/*.json; do
            if [ -f "$config" ]; then
                echo "  $(basename "$config")"
            fi
        done
        
        echo ""
        echo "Authority configs:"
        for config in "$BASE_DIR/config/playback/authorities"/*.json; do
            if [ -f "$config" ]; then
                echo "  authorities/$(basename "$config")"
            fi
        done
    else
        echo "  (No config directory found)"
    fi
    echo ""
}

run_playback() {
    local data_file="$1"
    local config_file="$2"
    
    # Check if playback is built
    if [ ! -f "$BASE_DIR/build/src/apps/playback/playback" ]; then
        echo -e "${YELLOW}Playback not built. Building now...${NC}"
        if ! build_playback; then
            exit 1
        fi
    fi
    
    echo -e "${BLUE}Starting playback system...${NC}"
    exec python3 "$SCRIPT_DIR/beacon-playback-run.py" "$data_file" "$config_file"
}

run_tests() {
    # Check if playback is built
    if [ ! -f "$BASE_DIR/build/src/apps/playback/playback" ]; then
        echo -e "${YELLOW}Playback not built. Building now...${NC}"
        if ! build_playback; then
            exit 1
        fi
    fi
    
    echo -e "${BLUE}Running playback test suite...${NC}"
    exec python3 "$SCRIPT_DIR/beacon-playback-test.py"
}

clean_build() {
    echo -e "${BLUE}Cleaning build artifacts...${NC}"
    cd "$BASE_DIR"
    
    if [ -d "build/src/apps/playback" ]; then
        echo "Removing playback build artifacts..."
        rm -rf build/src/apps/playback
    fi
    
    echo -e "${GREEN}✓ Clean complete${NC}"
}

# Main script logic
case "${1:-}" in
    "run")
        run_playback "$2" "$3"
        ;;
    "test")
        run_tests
        ;;
    "list")
        list_files
        ;;
    "build")
        build_playback
        ;;
    "clean")
        clean_build
        ;;
    "help"|"-h"|"--help"|"")
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        print_usage
        exit 1
        ;;
esac