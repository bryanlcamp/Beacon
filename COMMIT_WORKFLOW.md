# Beacon Git Workflow

## Professional Commit Tools

### Quick Reference

- **simple-commit.py** - Fast commits with warnings
- **beacon-git-commit.py** - Full professional workflow  
- **interactive-commit.py** - Multi-line message support

### Issue Linking Examples

```bash
# Auto-close issue when merged
python3 simple-commit.py "fix: Resolve memory leak (fixes #123)"

# Reference without closing  
python3 simple-commit.py "feat: Add new API endpoint (refs #456)"

# Cross-repository reference
python3 simple-commit.py "chore: Update dependency (closes org/repo#789)"
```

### Bypass Types (No Issue Required)

- `docs:` - Documentation updates
- `chore:` - Maintenance tasks  
- `style:` - Code formatting
- `refactor:` - Code restructuring without feature changes

## Professional Benefits

✅ **Traceability** - Every change links to business requirement  
✅ **Auto-close** - Issues update automatically on merge  
✅ **Audit Trail** - Complete change history with context  
✅ **Release Notes** - Generate from closed issues  