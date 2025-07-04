#!/bin/bash

# Noet App - Universal Shell Initialization
# This script ensures ALL shell sessions start in the project directory

# Define the project path
export NOET_PROJECT_PATH="/Users/sgallant/sync/rygel/noet-app"

# Function to force directory correction
force_project_directory() {
    local current_dir="$(pwd)"
    
    if [[ "$current_dir" != "$NOET_PROJECT_PATH" ]]; then
        echo "🚨 [NOET] Wrong directory detected: $current_dir"
        echo "🔧 [NOET] Forcing correction to: $NOET_PROJECT_PATH"
        
        if [[ -d "$NOET_PROJECT_PATH" ]]; then
            cd "$NOET_PROJECT_PATH" || {
                echo "❌ [NOET] FATAL: Cannot access project directory!"
                echo "❌ [NOET] Check if $NOET_PROJECT_PATH exists"
                exit 1
            }
            echo "✅ [NOET] Corrected to project directory: $(pwd)"
        else
            echo "❌ [NOET] Project directory does not exist: $NOET_PROJECT_PATH"
            exit 1
        fi
    else
        echo "✅ [NOET] Already in correct directory: $current_dir"
    fi
}

# Apply correction immediately
force_project_directory

# Source the project-specific bashrc if it exists
if [[ -f "$NOET_PROJECT_PATH/.bashrc" ]]; then
    source "$NOET_PROJECT_PATH/.bashrc"
fi
