# Author App Flask Server - Troubleshooting Guide

## Overview

The Author app requires a Flask API server for file operations (saving/loading configurations). The server provides endpoints for:

- `/api/config-files` - List available .json config files
- `/api/health` - Server health check
- Future endpoints for save/load/validate operations

**Server Location**: `/var/www/beacon-web-api/web-server-api/flask-app/app.py`
**Expected Port**: 5000
**Config Directory**: `/var/www/beacon-core/config/` (referenced in Flask app)

## 1. Check if Flask Server is Running

```bash
# Check if anything is running on port 5000
sudo netstat -tlnp | grep :5000
# OR
sudo ss -tlnp | grep :5000

# Test server health (if running)
curl http://localhost:5000/api/health
```

**Expected Response** (if working):
```json
{
  "status": "healthy",
  "timestamp": "2026-02-25T20:58:00.000000",
  "outbound_dir": true,
  "inbound_dir": true
}
```

## 2. How to Start the Flask Server Manually

**WORKING SOLUTION** (use existing venv):
```bash
# Navigate to Flask app directory
cd /var/www/beacon-web-api/web-server-api/flask-app

# Start using existing virtual environment (WORKING METHOD)
/var/www/admin.beaconhft.com/venv/bin/python3 app.py
```

**Alternative methods** (if venv doesn't work):
```bash
# Install dependencies globally (not recommended)
pip3 install -r requirements.txt
python3 app.py

# Create new virtual environment (if needed)
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
python3 app.py
```

## 3. Common Issues and Solutions

### Issue: "ModuleNotFoundError: No module named 'flask'"

**Cause**: Flask not installed
**Solution**:
```bash
cd /var/www/beacon-web-api/web-server-api/flask-app
pip3 install -r requirements.txt
```

### Issue: "Port 5000 already in use"

**Cause**: Another service using port 5000
**Solution**:
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill process if needed (replace PID)
sudo kill [PID]

# Or edit app.py to use different port
# Change: app.run(debug=True, host='0.0.0.0', port=5000)
# To:     app.run(debug=True, host='0.0.0.0', port=5001)
```

### Issue: "Config directory not found"

**Cause**: `/var/www/beacon-core/config/` doesn't exist
**Solution**:
```bash
# Create config directory
mkdir -p /var/www/beacon-core/config/author

# Verify path in Flask app matches your structure
# Edit app.py line ~134 if needed
```

### Issue: Server starts but config files don't load

**Test the endpoint**:
```bash
curl http://localhost:5000/api/config-files
```

**Expected Response**:
```json
{
  "success": true,
  "config_files": [...],
  "count": 0
}
```

## 4. Development vs Production Setup

### Development (Manual Start)
- Run `python3 app.py` in terminal
- Server runs in foreground with debug mode
- Stops when terminal closes

### Production (Gunicorn)
- Install: `pip3 install gunicorn`
- Start: `gunicorn -w 2 -b 127.0.0.1:5000 app:app --daemon`
- Runs in background, survives terminal disconnection

## 5. Integration with Author Frontend

The Author app expects these endpoints:

1. **GET /api/config-files** - Lists .json files (✅ Already implemented)
2. **GET /api/config-files/{filename}** - Load specific config (❌ Need to add)
3. **POST /api/config-files** - Save new config (❌ Need to add)
4. **POST /api/config-files/{filename}/validate** - Validate config (❌ Need to add)

## 6. Next Steps for Author Implementation

1. ✅ Start Flask server manually
2. ❌ Add missing config file endpoints
3. ❌ Add config validation logic
4. ❌ Add invalid file renaming (.json.invalid)
5. ❌ Connect frontend dropdown to /api/config-files

## Quick Start Command

**COPY/PASTE THIS** (guaranteed to work):
```bash
cd /var/www/beacon-web-api/web-server-api/flask-app && /var/www/admin.beaconhft.com/venv/bin/python3 app.py
```

**What this does**:
1. Changes to Flask app directory
2. Uses existing working virtual environment
3. Starts Flask server on port 5000
4. Server runs in foreground (Ctrl+C to stop)

**You'll see**:
- "Running on all addresses (0.0.0.0)"
- "Running on http://127.0.0.1:5000"
- "WARNING: This is a development server" (IGNORE this warning)

## Virtual Environment Explained (for C++ developers)

Think of virtual environments like isolated compiler toolchains:
- **Global Python** = system compiler (affects everything)
- **Virtual environment** = project-specific compiler (isolated dependencies)
- **Why use venv** = same as why you have project-specific makefiles

**Key files**:
- `/var/www/admin.beaconhft.com/venv/` = working virtual environment
- `requirements.txt` = like a dependency list in CMakeLists.txt
- `app.py` = main executable (like your main.cpp)

---
*This document should be moved to proper location once Author app is fully implemented.*
