#!/bin/bash

# 🚀 Auto Git Workflow for Noet Development
# This script automatically handles git operations

echo "🔄 AUTO-GIT: Checking repository status..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Show current status
echo "📊 Current git status:"
git status --short

# Count untracked files
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
MODIFIED=$(git diff --name-only | wc -l)  
STAGED=$(git diff --cached --name-only | wc -l)

echo ""
echo "📈 Summary:"
echo "   Untracked files: $UNTRACKED"
echo "   Modified files: $MODIFIED"
echo "   Staged files: $STAGED"

# Auto-add important files
echo ""
echo "🎯 Auto-adding critical files..."

# Add all source files
git add src/ 2>/dev/null || echo "No src/ directory changes"

# Add configuration files
git add *.json *.md *.js *.sh *.yml 2>/dev/null || echo "No config files to add"

# Add documentation
git add docs/ README* *.md 2>/dev/null || echo "No documentation to add"

# Show what we're about to commit
echo ""
echo "📋 Files staged for commit:"
git diff --cached --name-only

# Ask for confirmation
echo ""
read -p "🚀 Commit these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Generate automatic commit message
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
    
    if [ $UNTRACKED -gt 0 ]; then
        COMMIT_MSG="feat: Add $UNTRACKED new files - $TIMESTAMP"
    else
        COMMIT_MSG="update: Development changes - $TIMESTAMP"
    fi
    
    echo "💾 Committing with message: $COMMIT_MSG"
    git commit -m "$COMMIT_MSG"
    
    echo "✅ Commit successful!"
    
    # Ask about pushing
    read -p "🌐 Push to GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        echo "🚀 Pushed to GitHub!"
    fi
else
    echo "❌ Commit cancelled"
fi
