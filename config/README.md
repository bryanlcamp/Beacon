# 📁 Configuration Directory

Clear, organized configuration management for Beacon Trading System.

## 🎯 Usage Guide

### **For Simple Interface Users** 
You don't need this directory! Use `beacon-config.json` in the root:

```bash
python3 beacon.py  # Uses beacon-config.json automatically
```

### **For Advanced Users**
Use the system configurations for full control:

```bash
# Use main system config
python3 beacon-run.py -i config/system/startBeacon.json

# Use exchange-specific configs
python3 beacon-run.py -i config/system/startBeaconCME.json
python3 beacon-run.py -i config/system/startBeaconNYSE.json
python3 beacon-run.py -i config/system/startBeaconNasdaq.json
```

## 🔧 Configuration Types

### **System Configs** (`config/system/`)
Complete trading system configurations with all components coordinated:
- Multiple algorithms running simultaneously
- Exchange-specific protocol settings  
- Advanced risk management rules
- Performance optimization settings

### **Templates** (`config/templates/`)
Individual component configuration examples for:
- Building custom system configs
- Understanding component options
- Development and testing
- Integration with external systems

## 📝 Creating Custom Configurations

### **Start from a System Config**
```bash
# Copy and modify existing system config
cp config/system/startBeacon.json config/system/my_custom_config.json
# Edit my_custom_config.json
python3 beacon-unified.py -i config/system/my_custom_config.json
```

### **Build from Templates**
```bash
# Use individual component templates as reference
ls config/templates/algorithm/     # See algorithm options
ls config/templates/generator/     # See data generation options
```

## 🎯 Best Practices

### **Simple Users**
- Stick with `beacon.py` and `beacon-config.json`
- Only use system configs when you need advanced features

### **Advanced Users**  
- Start with existing system configs in `config/system/`
- Modify gradually rather than building from scratch
- Test thoroughly with small trades first

### **Developers**
- Use templates in `config/templates/` as reference
- Document any new configuration options
- Maintain backward compatibility

---

## 🔗 Related Documentation

- **[Getting Started](../docs/getting-started.md)** - Simple interface tutorial
- **[Advanced Usage](../docs/advanced-usage.md)** - System configurations explained
- **[Configuration Reference](../docs/configuration.md)** - All settings documented

---

**[← Back to Main README](../README.md)**