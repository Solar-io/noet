#!/bin/bash

# Noet App - Universal Directory Guard and Command Wrapper
# This script provides multiple layers of protection against running commands in wrong directories

set -euo pipefail

# Set the project path - this should be the ONLY place this path is defined
export NOET_PROJECT_PATH="/Users/sgallant/sync/rygel/noet-app"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if we're in the project directory
is_in_project_dir() {
    local current_dir="$(pwd)"
    [[ "$current_dir" == "$NOET_PROJECT_PATH" ]]
}

# Function to check if directory looks like project directory
is_project_dir() {
    local dir="$1"
    [[ -f "$dir/package.json" ]] && [[ -d "$dir/server" ]] && [[ -d "$dir/src" ]] && [[ -f "$dir/vite.config.js" ]]
}

# Function to ensure we're in the right directory
ensure_project_directory() {
    local current_dir="$(pwd)"
    
    if ! is_in_project_dir; then
        print_status "$YELLOW" "🚨 WARNING: Not in project directory!"
        print_status "$YELLOW" "   Current: $current_dir"
        print_status "$YELLOW" "   Expected: $NOET_PROJECT_PATH"
        
        # Check if expected directory exists and is valid
        if [[ ! -d "$NOET_PROJECT_PATH" ]]; then
            print_status "$RED" "❌ FATAL: Project directory does not exist: $NOET_PROJECT_PATH"
            exit 1
        fi
        
        if ! is_project_dir "$NOET_PROJECT_PATH"; then
            print_status "$RED" "❌ FATAL: Directory exists but doesn't look like a valid project: $NOET_PROJECT_PATH"
            exit 1
        fi
        
        print_status "$BLUE" "   Changing to project directory..."
        cd "$NOET_PROJECT_PATH" || {
            print_status "$RED" "❌ FATAL: Cannot change to project directory!"
            exit 1
        }
        print_status "$GREEN" "✅ Now in project directory: $(pwd)"
    else
        print_status "$GREEN" "✅ Already in correct project directory: $current_dir"
    fi
}

# Function to run commands safely in project directory
safe_run() {
    ensure_project_directory
    print_status "$BLUE" "🔧 Running: $*"
    "$@"
}

# Function to run npm commands safely
safe_npm() {
    ensure_project_directory
    print_status "$BLUE" "📦 Running npm: $*"
    npm "$@"
}

# Function to run node commands safely
safe_node() {
    ensure_project_directory
    print_status "$BLUE" "🟢 Running node: $*"
    node "$@"
}

# Function to run test scripts safely
safe_test() {
    local test_script="$1"
    ensure_project_directory
    
    if [[ ! -f "$test_script" ]]; then
        print_status "$RED" "❌ Test script not found: $test_script"
        print_status "$YELLOW" "   Current directory: $(pwd)"
        print_status "$YELLOW" "   Available test scripts:"
        ls -1 test-*.js 2>/dev/null | sed 's/^/     /' || print_status "$YELLOW" "   No test scripts found"
        exit 1
    fi
    
    print_status "$BLUE" "🧪 Running test: $test_script"
    print_status "$BLUE" "📁 Working directory: $(pwd)"
    echo "================================"
    
    node "$test_script"
}

# Function to validate environment
validate_environment() {
    print_status "$BLUE" "🔍 Validating environment..."
    ensure_project_directory
    
    print_status "$GREEN" "✅ Directory: $(pwd)"
    
    # Check for essential files
    local essential_files=("package.json" "vite.config.js" "server/server.js" "src/App.jsx")
    for file in "${essential_files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "$GREEN" "✅ Found: $file"
        else
            print_status "$RED" "❌ Missing: $file"
        fi
    done
    
    # Check for node_modules
    if [[ -d "node_modules" ]]; then
        print_status "$GREEN" "✅ Dependencies installed"
    else
        print_status "$YELLOW" "⚠️ Dependencies not installed - run: npm install"
    fi
}

# Export functions for use in other scripts
export -f ensure_project_directory
export -f safe_run
export -f safe_npm
export -f safe_node
export -f safe_test
export -f validate_environment
export -f is_in_project_dir
export -f is_project_dir

# If this script is being sourced, just set up the environment
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    ensure_project_directory
    return 0
fi

# If this script is being executed directly, handle commands
case "${1:-}" in
    "validate"|"check")
        validate_environment
        ;;
    "npm")
        shift
        safe_npm "$@"
        ;;
    "node")
        shift
        safe_node "$@"
        ;;
    "test")
        shift
        safe_test "$@"
        ;;
    "")
        ensure_project_directory
        ;;
    *)
        safe_run "$@"
        ;;
esac
