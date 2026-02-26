#!/bin/bash
# Simple git workflow for Beacon Platform
# Usage: ./git-push.sh "commit message"

set -e

if [[ -z "$1" ]]; then
    echo "Usage: $0 \"commit message\""
    echo "Example: $0 \"Fixed navigation bug\""
    exit 1
fi

COMMIT_MSG="$1"

echo "🚀 Beacon Platform - Simple Git Push"
echo "======================================"
echo "Message: $COMMIT_MSG"
echo ""

# Function to handle one repo
push_repo() {
    local repo_path="$1"
    local repo_name="$2"
    local default_branch="$3"

    echo "📁 Processing $repo_name..."
    cd "$repo_path"

    # Check if there are any changes
    if git diff --quiet && git diff --staged --quiet; then
        echo "   ✅ No changes to commit"
        return 0
    fi

    # Add, commit, push
    git add .
    git commit -m "$COMMIT_MSG"
    git push origin "$default_branch"
    echo "   ✅ Successfully pushed to $default_branch"
}

# Push all three repos with their correct branches
push_repo "/var/www/beacon-core" "beacon-core" "main"
push_repo "/var/www/beacon-web-ui" "beacon-web-ui" "main"
push_repo "/var/www/beacon-web-api" "beacon-web-api" "master"

echo ""
echo "🎉 All repositories updated!"
echo "🌐 Changes should be live on GitHub"
