#!/bin/bash

# Noet App Development - Git Workflow Helper
# This script helps maintain proper version control during development

echo "🚀 Noet App - Git Status Check"
echo "================================"

# Check if there are any changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected:"
    git status --short
    echo ""
    
    read -p "💬 Enter commit message (or press Enter to skip): " commit_msg
    
    if [ -n "$commit_msg" ]; then
        git add .
        git commit -m "$commit_msg"
        echo "✅ Changes committed!"
        
        # Show recent commits
        echo ""
        echo "📊 Recent commits:"
        git log --oneline -5
    else
        echo "⏭️  Skipping commit"
    fi
else
    echo "✅ No changes to commit"
    echo ""
    echo "📊 Recent commits:"
    git log --oneline -5
fi

echo ""
echo "🔧 Development server status:"
if pgrep -f "vite" > /dev/null; then
    echo "✅ Development server is running on http://localhost:3000"
else
    echo "❌ Development server is not running"
    echo "Run: npm run dev"
fi
