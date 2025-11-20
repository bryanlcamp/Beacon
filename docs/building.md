# 🔨 Building Beacon from Source

Comprehensive guide to building the Beacon Trading System from source code.

## 🚀 Quick Build

**Recommended Method:**
```bash
python3 beacon-build.py
```

This automatically:
- ✅ Cleans previous builds
- ✅ Configures CMake with optimal settings
- ✅ Builds all components in parallel
- ✅ Shows what binaries were created

## 📋 Build Options

### **Release Build (Default)**
```bash
python3 beacon-build.py --release
```
- **Optimized for performance**
- **Small binary sizes** 
- **No debug symbols**
- **Production ready**

### **Debug Build**
```bash
python3 beacon-build.py --debug
```
- **Debug symbols included**
- **No optimizations**
- **Better for development**
- **Larger binaries**

### **Verbose Output**
```bash
python3 beacon-build.py --verbose
```
- **Detailed compilation output**
- **Useful for troubleshooting**
- **Shows all compiler commands**

## 🔧 Manual Build (Advanced)

If you need more control over the build process:

```bash
# 1. Clean (optional)
python3 scripts/beacon-clean.py

# 2. Configure CMake
cmake -B build -S . -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_STANDARD=17

# 3. Build
cmake --build build -j$(nproc)
```

## 📦 Build Requirements

### **System Dependencies**
- **CMake 3.16+** - Build system generator
- **C++17 compiler** - GCC 8+, Clang 9+, MSVC 2019+
- **Python 3.6+** - Build scripts and utilities

### **Platform Support**
- ✅ **Linux** (Ubuntu 20.04+, CentOS 8+)
- ✅ **macOS** (Big Sur 11.0+)
- ✅ **Windows** (Windows 10+, WSL2)

### **Installing Dependencies**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install build-essential cmake python3 git
```

**macOS:**
```bash
# Using Homebrew
brew install cmake python3 git

# Using Xcode Command Line Tools
xcode-select --install
```

**Windows:**
```bash
# Using vcpkg or Visual Studio 2019+
# Or use WSL2 with Ubuntu instructions
```

## 🏗️ Build Artifacts

### **Generated Binaries**
After building, binaries are located at:

```
build/src/apps/
├── generator/
│   └── generator                    # Market data generator
├── matching_engine/
│   └── matching_engine              # Core trading engine  
├── client_algorithm/
│   └── AlgoTwapProtocol            # TWAP algorithm
└── playback/
    └── playback                     # Historical data playback
```

### **Build Configuration**
- **Build Type**: Release or Debug
- **C++ Standard**: C++17
- **Compiler Flags**: Optimized for target platform
- **Parallel Jobs**: Automatic CPU detection

## 🧹 Cleaning Builds

### **Automatic Cleaning**
Build scripts automatically clean before building:
```bash
python3 beacon-build.py  # Always does clean build
```

### **Manual Cleaning**
```bash
python3 scripts/beacon-clean.py  # Clean all build artifacts
```

**What Gets Cleaned:**
- `build/` and `build-test/` directories
- Generated binaries in `bin/`
- Temporary files (`*.bin`, `temp_*.json`)
- CMake cache and generated files

## 🚀 Integration with Main Interfaces

The build system integrates seamlessly with Beacon's main interfaces:

### **Automatic Building**
```bash
python3 beacon.py          # Auto-builds if needed
python3 beacon-run.py   # Auto-builds if needed
```

### **Manual Building**
```bash
python3 beacon-build.py    # Standalone build tool
```

## 🔍 Troubleshooting Builds

### **Common Issues**

**CMake not found:**
```bash
# Install CMake
sudo apt install cmake          # Ubuntu/Debian
brew install cmake              # macOS
```

**Compiler not found:**
```bash
# Install build tools
sudo apt install build-essential  # Ubuntu/Debian
xcode-select --install             # macOS
```

**Permission errors:**
```bash
# Fix file permissions
chmod +x beacon-build.py
chmod +x scripts/beacon-clean.py
```

**Out of disk space:**
```bash
# Clean build artifacts
python3 scripts/beacon-clean.py
```

### **Build Verification**

**Check built binaries:**
```bash
ls -la build/src/apps/*/
```

**Test basic functionality:**
```bash
./build/src/apps/generator/generator --help
./build/src/apps/matching_engine/matching_engine --help
```

**Run integration test:**
```bash
python3 beacon.py  # Should work if build successful
```

## 🏃‍♂️ Fast Iteration Workflow

For active development:

```bash
# 1. Make code changes
vim src/apps/matching_engine/main.cpp

# 2. Quick rebuild 
python3 beacon-build.py --debug

# 3. Test immediately
python3 beacon.py
```

## 🚀 CI/CD Integration

The build system integrates with the CI/CD pipeline:

- **GitHub Actions** uses `scripts/ci_cd/beacon-build-all-*.py`
- **Local development** uses `beacon-build.py`
- **Both ensure clean, consistent builds**

See [CI/CD Pipeline](ci-cd.md) for automation details.

## 📊 Build Performance

### **Typical Build Times**
- **Clean Release Build**: ~2-4 minutes
- **Clean Debug Build**: ~3-5 minutes
- **Incremental Build**: N/A (always clean)

### **Optimization**
- **Parallel compilation** using all CPU cores
- **Clean builds** prevent configuration drift
- **Efficient dependency management**

## 📚 Related Documentation

- **[CI/CD Pipeline](ci-cd.md)** - Automated build and deployment
- **[Architecture](architecture.md)** - Understanding system components
- **[Getting Started](getting-started.md)** - First-time setup
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

---

*Build system updated for November 2025 - Professional Python-based toolchain*