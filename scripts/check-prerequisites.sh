#!/bin/bash
# Beacon Prerequisites Checker

echo "Checking Beacon Prerequisites..."
echo "=================================="

FAILED=0

# Check OS
echo -n "OS: "
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    echo "OK - $(uname -s) $(uname -r)"
else
    echo "FAIL - Unsupported OS: $OSTYPE"
    FAILED=1
fi

# Check CMake
echo -n "CMake: "
if command -v cmake &> /dev/null; then
    VERSION=$(cmake --version | head -n1 | cut -d' ' -f3)
    if [[ $(echo "$VERSION 3.16" | awk '{print ($1 >= $2)}') == 1 ]]; then
        echo "OK - $VERSION"
    else
        echo "FAIL - $VERSION (need 3.16+)"
        FAILED=1
    fi
else
    echo "FAIL - Not installed"
    FAILED=1
fi

# Check Compiler
echo -n "Compiler: "
if command -v gcc &> /dev/null; then
    VERSION=$(gcc --version | head -n1 | awk '{print $4}')
    echo "OK - GCC $VERSION"
elif command -v clang &> /dev/null; then
    VERSION=$(clang --version | head -n1 | awk '{print $4}')
    echo "OK - Clang $VERSION"
else
    echo "FAIL - No compiler found"
    FAILED=1
fi

# Check Python
echo -n "Python: "
if command -v python3 &> /dev/null; then
    VERSION=$(python3 --version | awk '{print $2}')
    echo "OK - $VERSION"
else
    echo "FAIL - Not installed"
    FAILED=1
fi

# Check Git
echo -n "Git: "
if command -v git &> /dev/null; then
    VERSION=$(git --version | awk '{print $3}')
    echo "OK - $VERSION"
else
    echo "FAIL - Not installed"
    FAILED=1
fi

# Check Network
echo -n "Network: "
if ping -c 1 127.0.0.1 &> /dev/null; then
    echo "OK - Localhost reachable"
else
    echo "FAIL - Localhost unreachable"
    FAILED=1
fi

echo "=================================="
if [ $FAILED -eq 0 ]; then
    echo "All prerequisites met! Ready to install Beacon."
    exit 0
else
    echo "Missing prerequisites. Install missing components above."
    exit 1
fi