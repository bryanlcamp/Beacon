#!/bin/bash
# Beacon Platform - Minimal Workspace Setup
# Opens only: Solution Explorer + Chat + Bug List + Terminal

echo "🏠 Setting up minimal Beacon workspace..."

# Small delay to let the workspace fully load
sleep 2

# Open GitHub Issues view (Bug List)
echo "📋 Opening GitHub Issues view..."
if command -v code >/dev/null 2>&1; then
    code --command "workbench.view.extension.github-issues" 2>/dev/null || true
    sleep 1
    # Open GitHub Copilot Chat
    echo "💬 Opening Copilot Chat..."
    code --command "workbench.panel.chat.view.copilot.focus" 2>/dev/null || true
    sleep 1
    # Open Terminal
    echo "⌨️ Opening Terminal..."
    code --command "workbench.action.terminal.focus" 2>/dev/null || true
fi

echo "✅ Minimal workspace ready!"
echo "🌐 Solution Explorer | 💬 Chat | 📋 Bug List | ⌨️ Terminal"
