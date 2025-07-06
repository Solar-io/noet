#!/bin/bash

# Noet App - Simple Test Runner
# Uses simple config approach for directory management

# Source simple config and switch to project directory
source "$(dirname "${BASH_SOURCE[0]}")/scripts/simple-config.sh"
cd "$NOET_PROJECT_PATH"

# Function to run tests safely
run_test() {
    local test_script="$1"
    
    ensure_project_directory
    
    if [[ ! -f "$test_script" ]]; then
        echo "❌ Test script not found: $test_script"
        echo "   Current directory: $(pwd)"
        echo "   Available test scripts:"
        ls -1 test-*.js 2>/dev/null || echo "   No test scripts found"
        exit 1
    fi
    
    echo "🧪 Running test: $test_script"
    echo "📁 Working directory: $(pwd)"
    echo "================================"
    
    node "$test_script"
}

# Main execution
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <test-script>"
    echo ""
    echo "Available tests:"
    ensure_project_directory
    ls -1 test-*.js 2>/dev/null | sed 's/^/  /'
    exit 1
fi

run_test "$1"
