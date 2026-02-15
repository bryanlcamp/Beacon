#!/bin/bash

# GitHub Labels Setup Script for Beacon Platform
# Creates consistent labels across beacon-web and beacon-core repositories

# Repository list
REPOS=("bryanlcamp/beacon-web" "bryanlcamp/beacon-core")

echo "🚀 Setting up GitHub labels for Beacon Platform repositories..."

# Function to create label
create_label() {
    local repo=$1
    local name=$2
    local color=$3
    local description=$4
    
    echo "  Creating label: $name in $repo"
    gh label create "$name" --repo "$repo" --color "$color" --description "$description" 2>/dev/null || \
    echo "    Label $name already exists or error creating"
}

# Create labels for each repository
for repo in "${REPOS[@]}"; do
    echo ""
    echo "📋 Setting up labels for $repo"
    
    # Component Labels
    echo "  🔧 Component labels..."
    create_label "$repo" "component:iconbar" "FF6B35" "Icon bar related issues"
    create_label "$repo" "component:css" "4ECDC4" "CSS styling and layout issues"
    create_label "$repo" "component:js" "F7DC6F" "JavaScript functionality issues"
    create_label "$repo" "component:flask-api" "3498DB" "Flask API backend issues"
    create_label "$repo" "component:c++" "8E44AD" "C++ backend code issues"
    create_label "$repo" "component:build-system" "E74C3C" "Build system and compilation issues"
    create_label "$repo" "component:documentation" "95A5A6" "Documentation and README issues"
    
    # Severity Labels
    echo "  ⚠️ Severity labels..."
    create_label "$repo" "severity:critical" "C0392B" "Site breaking, blocks development"
    create_label "$repo" "severity:high" "E67E22" "Major functionality broken"
    create_label "$repo" "severity:medium" "F39C12" "Minor functionality issues"
    create_label "$repo" "severity:low" "27AE60" "Cosmetic or nice-to-have improvements"
    
    # Type Labels
    echo "  📝 Type labels..."
    create_label "$repo" "type:bug" "E74C3C" "Something isn't working"
    create_label "$repo" "type:feature" "3498DB" "New feature or enhancement"
    create_label "$repo" "type:performance" "9B59B6" "Performance improvement needed"
    create_label "$repo" "type:cosmetic" "BDC3C7" "UI/UX improvements"
    
    # Repository Labels (for cross-repo reference)
    echo "  🔗 Repository labels..."
    create_label "$repo" "repo:beacon-web" "1ABC9C" "Related to beacon-web repository"
    create_label "$repo" "repo:beacon-core" "2C3E50" "Related to beacon-core repository"  
    create_label "$repo" "repo:both" "34495E" "Affects both repositories"
    
    # Status Labels
    echo "  📊 Status labels..."
    create_label "$repo" "status:needs-triage" "F1C40F" "Needs review and prioritization"
    create_label "$repo" "status:blocked" "E91E63" "Blocked by external dependency"
    create_label "$repo" "status:ready" "2ECC71" "Ready for implementation"
done

echo ""
echo "✅ GitHub Labels setup complete!"
echo ""
echo "📋 Labels created:"
echo "   🔧 Components: iconbar, css, js, flask-api, c++, build-system, documentation"
echo "   ⚠️ Severity: critical, high, medium, low"  
echo "   📝 Types: bug, feature, performance, cosmetic"
echo "   🔗 Repository: beacon-web, beacon-core, both"
echo "   📊 Status: needs-triage, blocked, ready"
echo ""
echo "🎯 Next steps:"
echo "   1. Test creating an issue with: gh issue create --repo bryanlcamp/beacon-web"
echo "   2. Install VS Code GitHub extension for easy issue creation"
echo "   3. Set up issue templates (optional)"