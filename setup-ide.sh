#!/bin/bash

# Beacon Platform VS Code Setup Script
# Optimized for Remote SSH Development

echo "🚀 Setting up Beacon Platform IDE..."
echo ""

# Check if in correct directory
if [[ ! -d ".vscode" ]]; then
    echo "❌ Error: Not in beacon-web directory"
    echo "Please run from /var/www/html"
    exit 1
fi

echo "📂 Current directory: $(pwd)"
echo "✅ VS Code configuration found"
echo ""

# Show GitHub CLI status
echo "🔐 GitHub CLI Status:"
gh auth status 2>/dev/null || echo "⚠️  GitHub CLI needs authentication"
echo ""

# Launch VS Code with workspace
echo "🎯 Launching VS Code with Beacon Platform workspace..."
echo ""
echo "🔧 What this sets up:"
echo "   • Beacon-specific editor settings (4-space HTML/CSS, 2-space JS)"
echo "   • File associations (*.settings.exchange as JSON)"
echo "   • GitHub Issues integration"
echo "   • Auto-save and formatting"
echo "   • Dual-repository workspace"
echo ""

echo "🚀 Starting VS Code..."
echo ""
echo "📋 After VS Code opens:"
echo "   1. Look for GitHub icon in Activity Bar (left sidebar)"
echo "   2. If missing: Ctrl+Shift+P → 'GitHub: Sign In'"
echo "   3. Authenticate GitHub Extension (separate from CLI)"
echo "   4. GitHub Issues panel should appear with your organized queries"
echo ""

# Open workspace
code beacon-platform.code-workspace

echo "✅ VS Code launched with Beacon Platform workspace"
echo ""
echo "🎯 Quick Commands:"
echo "   • Create issue: ./create-issue.sh web css medium 'Bug title'"
echo "   • View issues: gh issue list --repo bryanlcamp/beacon-web"
echo "   • Test local server: python3 -m http.server 8080"
echo ""
echo "💡 Tip: Use Ctrl+Shift+P → 'Tasks: Run Task' for quick actions"
