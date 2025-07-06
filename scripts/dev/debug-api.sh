#!/bin/bash
# API Debug Script
# Usage: ./debug-api.sh [tag-name]

echo "🔍 Debugging API issue..."
echo "========================"

# Check if server is running
echo "📡 Checking server status..."
if curl -s "http://localhost:3004/api/user-1/notes" > /dev/null 2>&1; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding"
    exit 1
fi

# Get total notes count
echo
echo "📊 Backend status:"
TOTAL_NOTES=$(curl -s "http://localhost:3004/api/user-1/notes" | jq 'length')
echo "Total notes: $TOTAL_NOTES"

# If tag name provided, check specific tag
if [ ! -z "$1" ]; then
    echo
    echo "🏷️ Checking tag: '$1'"
    TAG_COUNT=$(curl -s "http://localhost:3004/api/user-1/notes?tag=$1" | jq 'length' 2>/dev/null)
    if [ -z "$TAG_COUNT" ]; then
        TAG_COUNT=0
    fi
    echo "Notes with tag '$1': $TAG_COUNT"
    
    # Show the actual notes with this tag
    if [ "$TAG_COUNT" -gt 0 ]; then
        echo
        echo "📝 Notes with tag '$1':"
        curl -s "http://localhost:3004/api/user-1/notes?tag=$1" | jq '.[] | {id, title, tags}'
    fi
else
    echo
    echo "💡 Usage: ./debug-api.sh [tag-name]"
    echo "   Example: ./debug-api.sh sdfasdff"
fi

# List all available tags
echo
echo "🏷️ Available tags:"
curl -s "http://localhost:3004/api/user-1/tags" | jq '.[] | {id, name}' | head -10

echo
echo "========================"
echo "✅ API debug complete" 