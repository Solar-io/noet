#!/bin/bash

# Noet App - Working Directory Guard Script
# This script ensures all operations happen in the correct project directory

# Set the project path
export NOET_PROJECT_PATH="/Users/sgallant/sync/rygel/noet-app"

# Function to ensure we're in the right directory
ensure_project_directory() {
    local current_dir="$(pwd)"
    
    if [[ "$current_dir" != "$NOET_PROJECT_PATH" ]]; then
        echo "🚨 WARNING: Not in project directory!"
        echo "   Current: $current_dir"
        echo "   Expected: $NOET_PROJECT_PATH"
        echo "   Changing to project directory..."
        cd "$NOET_PROJECT_PATH" || {
            echo "❌ FATAL: Cannot change to project directory!"
            echo "   Please ensure $NOET_PROJECT_PATH exists"
            exit 1
        }
        echo "✅ Now in project directory: $(pwd)"
    else
        echo "✅ Already in correct project directory: $current_dir"
    fi
}

# Function to run commands safely in project directory
safe_run() {
    ensure_project_directory
    echo "🔧 Running: $*"
    "$@"
}

# Export functions for use in other scripts
export -f ensure_project_directory
export -f safe_run

# If this script is being sourced, just set up the environment
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    ensure_project_directory
    return 0
fi

# If this script is being executed directly, run the command
if [[ $# -eq 0 ]]; then
    ensure_project_directory
else
    safe_run "$@"
fi
