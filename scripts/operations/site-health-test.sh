#!/bin/bash
# Beacon Platform - Site Health Testing Script
# Usage: ./site-health-test.sh [component]

set -e

COMPONENT=${1:-"all"}
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_DIR="/tmp/beacon-tests/$TIMESTAMP"
mkdir -p "$LOG_DIR"

echo "🎯 Beacon Platform Testing Suite"
echo "================================="
echo "Component: $COMPONENT"
echo "Timestamp: $TIMESTAMP"
echo "Logs: $LOG_DIR"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test Web Interface
test_web() {
    log_test "Testing Web Interface..."

    # Check if nginx is running
    if systemctl is-active --quiet nginx; then
        log_pass "Nginx service is running"
    else
        log_fail "Nginx service is not running"
        return 1
    fi

    # Test local response
    if curl -s -f localhost/ > /dev/null; then
        log_pass "Web server responds to requests"
    else
        log_fail "Web server not responding"
        return 1
    fi

    # Check critical files exist
    REQUIRED_FILES=(
        "/var/www/html/index.html"
        "/var/www/html/assets/css/beacon-main.css"
        "/var/www/html/assets/images/icons/dataset.svg"
        "/var/www/html/assets/images/icons/playback.svg"
        "/var/www/html/assets/images/icons/puzzle.svg"
        "/var/www/html/assets/images/icons/match.svg"
    )

    for file in "${REQUIRED_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            log_pass "Found: $(basename "$file")"
        else
            log_fail "Missing: $file"
        fi
    done

    # Test page load performance
    LOAD_TIME=$(curl -o /dev/null -s -w '%{time_total}' localhost/)
    if (( $(echo "$LOAD_TIME < 2.0" | bc -l) )); then
        log_pass "Page load time: ${LOAD_TIME}s (< 2s target)"
    else
        log_warn "Page load time: ${LOAD_TIME}s (slower than 2s target)"
    fi
}

# Test Beacon Core Components
test_core() {
    log_test "Testing Beacon Core..."

    if [[ -d "/var/www/html/beacon-core" ]]; then
        log_pass "Beacon Core directory found"

        # Check if core can be built
        cd /var/www/html/beacon-core
        if [[ -f "beacon-build.py" ]]; then
            log_pass "Build script found"

            # Try a dry-run build check
            if python3 beacon-build.py --help > /dev/null 2>&1; then
                log_pass "Build script is executable"
            else
                log_warn "Build script may have issues"
            fi
        else
            log_fail "Build script not found"
        fi

        # Check for required directories
        CORE_DIRS=("src" "include" "libs" "config")
        for dir in "${CORE_DIRS[@]}"; do
            if [[ -d "$dir" ]]; then
                log_pass "Core directory: $dir"
            else
                log_fail "Missing core directory: $dir"
            fi
        done

        cd - > /dev/null
    else
        log_fail "Beacon Core directory not found"
    fi
}

# Test Application Structure
test_apps() {
    log_test "Testing Application Structure..."

    APP_DIRS=("apps/author" "apps/pulse" "apps/strategy" "apps/match")
    for app in "${APP_DIRS[@]}"; do
        if [[ -d "/var/www/html/$app" ]]; then
            log_pass "App directory: $app"
        else
            log_warn "App directory not found: $app"
        fi
    done

    # Check documentation
    if [[ -d "/var/www/html/wiki" ]]; then
        log_pass "Documentation directory found"

        DOC_FILES=("wiki/index.html" "wiki/system-overview.html")
        for doc in "${DOC_FILES[@]}"; do
            if [[ -f "/var/www/html/$doc" ]]; then
                log_pass "Documentation: $(basename "$doc")"
            else
                log_warn "Missing documentation: $doc"
            fi
        done
    else
        log_warn "Documentation directory not found"
    fi
}

# Test System Resources
test_system() {
    log_test "Testing System Resources..."

    # Check disk space
    DISK_USAGE=$(df /var/www/html | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -lt 90 ]]; then
        log_pass "Disk usage: ${DISK_USAGE}% (healthy)"
    else
        log_warn "Disk usage: ${DISK_USAGE}% (getting full)"
    fi

    # Check memory
    MEM_AVAILABLE=$(free | grep '^Mem:' | awk '{print int($7/1024)}')
    if [[ $MEM_AVAILABLE -gt 512 ]]; then
        log_pass "Available memory: ${MEM_AVAILABLE}MB (sufficient)"
    else
        log_warn "Available memory: ${MEM_AVAILABLE}MB (may be low)"
    fi

    # Check CPU load
    CPU_LOAD=$(uptime | awk -F'[a-z]:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$CPU_LOAD < 2.0" | bc -l) )); then
        log_pass "CPU load: $CPU_LOAD (normal)"
    else
        log_warn "CPU load: $CPU_LOAD (elevated)"
    fi
}

# Performance Micro-benchmark
test_performance() {
    log_test "Testing Performance..."

    # Simple latency test
    echo "Measuring request latency (10 samples)..."
    LATENCIES=()
    for i in {1..10}; do
        LATENCY=$(curl -o /dev/null -s -w '%{time_total}' localhost/)
        LATENCIES+=("$LATENCY")
        echo "  Sample $i: ${LATENCY}s"
    done

    # Calculate average (basic - for proper stats would use more sophisticated tools)
    TOTAL=0
    for lat in "${LATENCIES[@]}"; do
        TOTAL=$(echo "$TOTAL + $lat" | bc -l)
    done
    AVG=$(echo "scale=3; $TOTAL / 10" | bc -l)
    log_pass "Average latency: ${AVG}s"

    # Test concurrent requests
    echo "Testing concurrent load (5 simultaneous requests)..."
    for i in {1..5}; do
        curl -s localhost/ > /dev/null &
    done
    wait
    log_pass "Concurrent request test completed"
}

# Generate test report
generate_report() {
    cat > "$LOG_DIR/test_report.txt" << EOF
Beacon Platform Test Report
==========================
Date: $(date)
Component: $COMPONENT
Tester: $(whoami)
Server: $(hostname)

Test Results:
- Web Interface: $(test_web > /dev/null 2>&1 && echo "PASS" || echo "FAIL")
- Beacon Core: $(test_core > /dev/null 2>&1 && echo "PASS" || echo "FAIL")
- Applications: $(test_apps > /dev/null 2>&1 && echo "PASS" || echo "FAIL")
- System Resources: $(test_system > /dev/null 2>&1 && echo "PASS" || echo "FAIL")

System Information:
- OS: $(lsb_release -d | cut -f2-)
- Kernel: $(uname -r)
- Uptime: $(uptime -p)
- Load: $(uptime | awk -F'[a-z]:' '{print $2}')

Recommendations:
- Regular monitoring of system resources
- Automated testing integration recommended
- Consider load testing for production readiness

EOF

    log_pass "Test report generated: $LOG_DIR/test_report.txt"
}

# Main execution
main() {
    case $COMPONENT in
        "web"|"website")
            test_web
            ;;
        "core"|"beacon-core")
            test_core
            ;;
        "apps"|"applications")
            test_apps
            ;;
        "system"|"resources")
            test_system
            ;;
        "performance"|"perf")
            test_performance
            ;;
        "all"|*)
            test_web
            echo ""
            test_core
            echo ""
            test_apps
            echo ""
            test_system
            echo ""
            test_performance
            echo ""
            ;;
    esac

    generate_report

    echo ""
    echo "🎯 Testing Complete!"
    echo "📊 Full report: $LOG_DIR/test_report.txt"
    echo ""
    echo "Quick commands:"
    echo "  ./site-health-test.sh web       # Test web interface only"
    echo "  ./site-health-test.sh core      # Test beacon core only"
    echo "  ./site-health-test.sh perf      # Run performance tests"
    echo "  ./site-health-test.sh all       # Run all tests (default)"
}

# Install bc if not available (for floating point arithmetic)
if ! command -v bc &> /dev/null; then
    log_warn "Installing 'bc' for calculations..."
    apt-get update -qq && apt-get install -y bc
fi

main "$@"
