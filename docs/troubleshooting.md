# 🚨 Troubleshooting Guide

Common issues and solutions for Beacon Trading System.

## 🚀 Quick Fixes

### ❌ **"Port 9002 permission denied (-13 error)"**

**Problem**: Matching engine can't bind to port 9002

**Solutions**:
```bash
# Check what's using the port
sudo lsof -i :9002

# Kill any processes using the port  
sudo kill <PID>

# Or try a different port in beacon-config.json
"order_entry_port": 9003
```

### ❌ **"Build failed" or missing binaries**

**Problem**: System needs to be compiled

**Solutions**:
```bash
# Manual build
cmake -B build -S .
cmake --build build

# Or let beacon-simple.py auto-build
python3 beacon-simple.py  # It will build automatically
```

### ❌ **"Config file not found" or corrupted**

**Problem**: beacon-config.json is missing or invalid

**Solutions**:
```bash
# Restore default config
python3 beacon-reset-config.py

# Or delete and run again
rm beacon-config.json
python3 beacon-simple.py  # Creates new config
```

## 🔧 Common Issues

### Component Startup Problems

#### **Algorithm fails to connect**
```
[ERROR] [ALGORITHM] Failed: Connection refused
```
**Cause**: Matching engine not ready or port blocked
**Fix**: 
- Check matching engine started successfully
- Verify port 9002 is available
- Increase startup delays in config

#### **Data generation fails**
```
[ERROR] [GENERATOR] Failed: Permission denied
```
**Cause**: Can't write market_data.bin file
**Fix**:
- Check write permissions in current directory
- Ensure sufficient disk space

#### **Matching engine crashes immediately**
```
[ERROR] [MATCH-ENG] Exited with code -13
```
**Cause**: Port permission or binding issue
**Fix**:
- Use different port in config
- Check firewall settings
- Run `sudo lsof -i :9002`

### Configuration Issues

#### **Invalid JSON syntax**
```
[ERROR] [CONFIG] Config error: Expecting ',' delimiter
```
**Fix**: Check JSON syntax in beacon-config.json
- Missing commas between fields
- Extra commas at end of objects
- Unmatched quotes or brackets

#### **Missing required fields**
```
[ERROR] [CONFIG] Missing required field: symbol
```
**Fix**: Ensure all required fields are present:
- `symbol`, `side`, `shares`, `price`

#### **Invalid values**
```  
[ERROR] [CONFIG] shares must be positive
```
**Fix**: Check value ranges:
- `shares` > 0
- `price` > 0
- `time_window_minutes` >= 1
- `slice_count` >= 1

### Performance Issues

#### **Slow startup times**
**Cause**: Build system or large data generation
**Fix**:
- Pre-build system: `cmake --build build`  
- Reduce `message_count` in config
- Use SSD storage for faster I/O

#### **Algorithm completes too quickly**
**Cause**: TWAP slices executing faster than expected
**Fix**:
- Increase `time_window_minutes`
- Increase `slice_count` for smaller orders
- Check algorithm implementation

## 🛠️ Debugging Steps

### 1. **Check System Status**
```bash
# Verify all binaries exist
ls -la build/src/apps/*/
ls -la build/src/apps/*/*

# Check required files
ls -la beacon-config.json
ls -la temp_*.json
```

### 2. **Test Components Individually**

**Test Matching Engine**:
```bash
./build/src/apps/matching_engine/matching_engine --help
./build/src/apps/matching_engine/matching_engine --config temp_matching_engine.json
```

**Test Algorithm**:
```bash  
./build/src/apps/client_algorithm/AlgoTwapProtocol --help
./build/src/apps/client_algorithm/AlgoTwapProtocol --config temp_algorithm.json --symbol AAPL --side B --shares 100 --price 150.0
```

**Test Generator**:
```bash
./build/src/apps/generator/generator --help
```

### 3. **Check Network Connectivity**

**Port availability**:
```bash
# Check if ports are free
lsof -i :8002  # Market data port
lsof -i :9002  # Order entry port
```

**Network loopback**:
```bash
# Test UDP
nc -u -l 8002 &  # Listen on UDP 8002
echo "test" | nc -u 127.0.0.1 8002

# Test TCP  
nc -l 9002 &     # Listen on TCP 9002
echo "test" | nc 127.0.0.1 9002
```

## 📊 Log Analysis

### **Understanding Log Levels**
- `[INFO   ]` - Normal operation
- `[SUCCESS]` - Component ready/completed
- `[WARNING]` - Non-critical issues  
- `[ERROR  ]` - Problems requiring attention

### **Key Log Patterns**

**Successful startup**:
```
[SUCCESS] [BUILD    ] ✅ All required binaries ready!
[SUCCESS] [GENERATOR] Data generation complete  
[SUCCESS] [MATCH-ENG] Ready on port 9002 (PID: 12345)
[SUCCESS] [ALGORITHM] Connected to matching engine (PID: 12346)
[SUCCESS] [SYSTEM   ] 🎉 All components started!
```

**Port binding issue**:
```
[INFO   ] [MATCH-ENG] Starting on port 9002
[ERROR  ] [MATCH-ENG] Exited with code -13: Permission denied
[ERROR  ] [SYSTEM   ] 🚨 Port 9002 permission issue
```

**Build problems**:
```
[WARNING] [BUILD    ] ✗ matching_engine binary missing
[INFO   ] [BUILD    ] 🔨 Building missing components
[ERROR  ] [BUILD    ] Build failed: ...
```

## 🔄 Reset Procedures

### **Complete System Reset**
```bash
# Clean build
rm -rf build/
cmake -B build -S .
cmake --build build

# Reset config
python3 beacon-reset-config.py

# Clean temporary files
rm -f temp_*.json market_data.bin trade_report.log
```

### **Soft Reset** 
```bash
# Just reset config and temp files
python3 beacon-reset-config.py
rm -f temp_*.json market_data.bin trade_report.log
```

## 🆘 Getting Help

### **Enable Debug Mode**
Add to beacon-config.json:
```json
"debug_mode": true,
"verbose_logging": true
```

### **Collect Debug Information**
```bash
# System info
uname -a
python3 --version  
cmake --version

# Beacon status
ls -la beacon-simple.py beacon-config.json
ls -la build/src/apps/*/

# Process info
ps aux | grep -E "(generator|matching|algorithm)"
lsof -i :8002
lsof -i :9002
```

### **Report Issues**
Include this information:
- Operating system and version
- Python version 
- Complete error message and logs
- Contents of beacon-config.json
- Output of debug commands above

---

## 🔗 Related Documentation

- **[Configuration Reference](configuration.md)** - All settings explained  
- **[Getting Started](getting-started.md)** - Step-by-step tutorial
- **[Architecture Guide](architecture.md)** - How components interact
- **[FAQ](faq.md)** - Frequently asked questions

---

**[← Back to Documentation Hub](index.md)**