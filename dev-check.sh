#!/bin/bash

# 🚀 Quick Development Sanity Check
# Run this before making ANY changes

echo "🔍 NOET DEVELOPMENT SANITY CHECK"
echo "================================"

# Check if dev server is running
echo "📡 Checking dev server..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Dev server is running on port 3001"
else
    echo "❌ Dev server is NOT running"
    echo "💡 Run: npx vite --host"
    exit 1
fi

# Quick build test
echo "🏗️ Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    echo "💡 Run: npm run build"
    exit 1
fi

# Check for obvious React issues
echo "🔍 Checking for React issues..."
if grep -r "useEffect.*\[\]" src/ > /dev/null; then
    echo "⚠️ Found empty dependency arrays - check if correct"
fi

if grep -r "useEffect.*userId.*loadTags" src/ > /dev/null; then
    echo "⚠️ Found potential useEffect dependency issues"
fi

echo "✅ SANITY CHECK PASSED"
echo "🚀 Ready for development!"
echo ""
echo "📋 DEVELOPMENT CHECKLIST:"
echo "1. Make smallest possible change"
echo "2. Test in browser immediately"
echo "3. Check console for errors"
echo "4. Test drag & drop if UI changes"
echo "5. Run this script again after changes"
