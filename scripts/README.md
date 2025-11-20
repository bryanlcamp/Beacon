# Scripts Directory - Organized Structure

**Clean, scalable organization for all Beacon automation scripts.**

## 📁 Directory Structure

```
scripts/
├── build/           # 🔨 Build and compilation scripts
├── run/             # 🚀 Runtime and execution scripts  
├── utils/           # 🔧 Utilities and diagnostic tools
├── git/             # 📝 Git workflow automation (professional commit tools)
├── ci_cd/           # 🏗️  CI/CD orchestration scripts
└── README.md        # This overview
```

## 🎯 Quick Reference

### Building
```bash
# Build debug/release
python3 scripts/build/beacon-build-debug.py
python3 scripts/build/beacon-build-release.py

# Clean builds
python3 scripts/build/beacon-clean.py
```

### Running System
```bash
# Main system orchestration
python3 scripts/run/beacon-run.py

# Demos and testing
python3 scripts/run/beacon-demo-system.py
python3 scripts/run/beacon-run-tests.py
```

### Git Workflow
```bash
# Safe commit with build verification
python3 scripts/git/simple-commit.py --add --push "feat: your message"

# Interactive commit
python3 scripts/git/interactive-commit.py
```

### Utilities
```bash
# System diagnostics
python3 scripts/utils/beacon-diagnose-loopback.py
python3 scripts/utils/beacon-test-udp.py

# Process management
python3 scripts/utils/beacon-kill.py
```

## 🎓 Organization Benefits

✅ **Scalable** - Easy to find and add new scripts  
✅ **Professional** - Clear separation of concerns  
✅ **Maintainable** - Logical grouping by function  
✅ **Self-documenting** - Directory names explain purpose  

## 🔧 Development Guidelines

When adding scripts:
1. **Choose correct directory** based on primary function
2. **Follow naming**: `beacon-[function]-[variant].py` 
3. **Run from project root** for consistent paths
4. **Include `--help`** for self-documentation

---

*This organized structure demonstrates enterprise-level project management and scales beautifully as the codebase grows.*