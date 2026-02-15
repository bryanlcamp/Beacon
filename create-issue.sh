#!/bin/bash

# Quick Issue Creator for Beacon Platform
# Usage: ./create-issue.sh <repo> <component> <severity> <title>

REPO=$1
COMPONENT=$2  
SEVERITY=$3
TITLE="$4"

if [ -z "$REPO" ] || [ -z "$COMPONENT" ] || [ -z "$SEVERITY" ] || [ -z "$TITLE" ]; then
    echo "🚨 Usage: ./create-issue.sh <repo> <component> <severity> <title>"
    echo ""
    echo "📋 Available options:"
    echo "   repo: web, core"
    echo "   component: iconbar, css, js, flask-api, c++, build-system, documentation"  
    echo "   severity: critical, high, medium, low"
    echo ""
    echo "💡 Example: ./create-issue.sh web css medium 'Sidebar positioning broken'"
    exit 1
fi

# Map short repo names to full names
case $REPO in
    web) FULL_REPO="bryanlcamp/beacon-web" ;;
    core) FULL_REPO="bryanlcamp/beacon-core" ;;
    *) echo "❌ Invalid repo. Use 'web' or 'core'"; exit 1 ;;
esac

# Create the issue with labels
echo "🎯 Creating issue in $FULL_REPO..."
echo "   Title: $TITLE"
echo "   Component: $COMPONENT" 
echo "   Severity: $SEVERITY"

gh issue create \
    --repo "$FULL_REPO" \
    --title "$TITLE" \
    --body "**Component**: $COMPONENT  
**Severity**: $SEVERITY  
**Repository**: $REPO  

## Description
[Add description here]

## Steps to Reproduce
1. [First step]
2. [Second step]  
3. [Third step]

## Expected Behavior
[What should happen]

## Actual Behavior  
[What actually happens]

## Additional Context
[Any other context about the problem]

---
*Created via quick-issue script*" \
    --label "component:$COMPONENT" \
    --label "severity:$SEVERITY" \
    --label "type:bug" \
    --label "status:needs-triage" \
    --assignee "bryanlcamp"

echo "✅ Issue created successfully!"