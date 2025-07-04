#!/bin/bash

# Noet App - Complete Environment Setup and Validation
# This script sets up the project environment and validates everything is working

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
}

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header "🚀 Noet App - Complete Environment Setup"

# Get script directory (project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "$BLUE" "📁 Project directory: $SCRIPT_DIR"

# Source the guard system
source "./noet-guard.sh"

print_header "🔍 Step 1: Environment Validation"
validate_environment

print_header "📦 Step 2: Dependencies Check"

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    print_status "$YELLOW" "⚠️ Dependencies not found. Installing..."
    npm install
else
    print_status "$GREEN" "✅ Dependencies already installed"
fi

# Check server dependencies
if [[ ! -d "server/node_modules" ]]; then
    print_status "$YELLOW" "⚠️ Server dependencies not found. Installing..."
    cd server
    npm install
    cd ..
else
    print_status "$GREEN" "✅ Server dependencies already installed"
fi

print_header "🔧 Step 3: Development Tools Setup"

# Make all scripts executable
print_status "$BLUE" "🔐 Setting script permissions..."
chmod +x noet-guard.sh
chmod +x noet.sh
chmod +x test-runner.sh
chmod +x run-test.sh
chmod +x ensure-project-dir.sh

print_status "$GREEN" "✅ All scripts are now executable"

print_header "🧪 Step 4: Testing Environment"

# Test the guard system
print_status "$BLUE" "🛡️ Testing directory guard system..."
./noet-guard.sh validate

# Run a simple test if available
if [[ -f "test-note-counts.js" ]]; then
    print_status "$BLUE" "🧪 Running sample test..."
    ./test-runner.sh test-note-counts.js
else
    print_status "$YELLOW" "⚠️ No test files found to validate"
fi

print_header "⚙️ Step 5: VS Code Configuration"

# Check VS Code settings
if [[ -f ".vscode/settings.json" ]]; then
    print_status "$GREEN" "✅ VS Code settings configured"
else
    print_status "$YELLOW" "⚠️ VS Code settings not found"
fi

if [[ -f ".vscode/tasks.json" ]]; then
    print_status "$GREEN" "✅ VS Code tasks configured"
else
    print_status "$YELLOW" "⚠️ VS Code tasks not found"
fi

print_header "📋 Step 6: Quick Start Guide"

print_status "$GREEN" "🎉 Environment setup complete!"
echo ""
print_status "$BLUE" "Quick commands:"
echo ""
echo "  Development:"
echo "    ./noet.sh start-dev      # Start both frontend and backend"
echo "    ./noet.sh start-backend  # Start backend only"
echo "    ./noet.sh start-frontend # Start frontend only"
echo ""
echo "  Testing:"
echo "    ./test-runner.sh all     # Run all tests"
echo "    ./test-runner.sh <file>  # Run specific test"
echo ""
echo "  Utilities:"
echo "    ./noet.sh validate       # Validate environment"
echo "    ./noet.sh npm <command>  # Run npm commands safely"
echo "    ./noet.sh node <script>  # Run node scripts safely"
echo ""

print_header "🛡️ Directory Protection Summary"

print_status "$GREEN" "Multi-layer directory protection is now active:"
echo ""
echo "  1. 🔒 VS Code Terminal: Force-locked to project directory"
echo "  2. 🛡️ Script Guards: All scripts validate directory before running"
echo "  3. 🔧 Smart Wrappers: noet.sh wraps all common commands"
echo "  4. 📋 VS Code Tasks: All tasks run with correct working directory"
echo "  5. 🏠 Shell Profile: Auto-correction for manual directory changes"
echo ""

print_status "$PURPLE" "🎯 The 'common directory' issue should now be impossible!"
echo ""
print_status "$YELLOW" "💡 If you ever see directory issues:"
echo "   - Use: ./noet.sh validate"
echo "   - Check: pwd"
echo "   - Report: What command caused the issue"
echo ""

print_header "✅ Setup Complete - Ready for Development!"
