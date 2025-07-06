#!/bin/bash

# Noet App - Global Configuration
# This file defines the absolute paths and settings for the entire project
# Source this file in any script that needs to know project locations

# CRITICAL: This is the single source of truth for project location
export NOET_PROJECT_ROOT="/Users/sgallant/sync/rygel/noet-app"

# Derived paths
export NOET_SERVER_DIR="$NOET_PROJECT_ROOT/server"
export NOET_SRC_DIR="$NOET_PROJECT_ROOT/src"
export NOET_NOTES_DIR="$NOET_PROJECT_ROOT/notes"
export NOET_CONFIG_FILE="$NOET_PROJECT_ROOT/config.json"

# Configuration
export NOET_FRONTEND_PORT=3001
export NOET_BACKEND_PORT=3004

# Function to ensure we're in the project directory
noet_cd_project() {
    local current_dir="$(pwd)"
    if [[ "$current_dir" != "$NOET_PROJECT_ROOT" ]]; then
        echo "🔧 Switching from $current_dir to $NOET_PROJECT_ROOT"
        cd "$NOET_PROJECT_ROOT" || {
            echo "❌ FATAL: Cannot access project directory: $NOET_PROJECT_ROOT"
            exit 1
        }
    fi
}

# Function to run commands safely in project directory
noet_run() {
    noet_cd_project
    echo "🚀 Running in $(pwd): $*"
    "$@"
}

# Function to validate project structure
noet_validate() {
    if [[ ! -d "$NOET_PROJECT_ROOT" ]]; then
        echo "❌ Project root does not exist: $NOET_PROJECT_ROOT"
        return 1
    fi
    
    if [[ ! -f "$NOET_PROJECT_ROOT/package.json" ]]; then
        echo "❌ Not a valid project: missing package.json"
        return 1
    fi
    
    echo "✅ Project validated: $NOET_PROJECT_ROOT"
    return 0
}

# Auto-correct if sourced from wrong directory
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    noet_cd_project
fi
