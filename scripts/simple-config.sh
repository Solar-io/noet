#!/bin/bash
# Simple configuration script for Noet App
# This script sets up the project directory path for all other scripts

# Detect the project directory
if [[ -f "package.json" ]] && grep -q "noet-app" package.json; then
    export NOET_PROJECT_PATH="$(pwd)"
elif [[ -f "../package.json" ]] && grep -q "noet-app" ../package.json; then
    export NOET_PROJECT_PATH="$(cd .. && pwd)"
elif [[ -f "../../package.json" ]] && grep -q "noet-app" ../../package.json; then
    export NOET_PROJECT_PATH="$(cd ../.. && pwd)"
else
    export NOET_PROJECT_PATH="/Users/sgallant/sync/rygel/noet-app"
fi

# Ensure the project directory exists
if [[ ! -d "$NOET_PROJECT_PATH" ]]; then
    echo "Error: Project directory not found at $NOET_PROJECT_PATH"
    exit 1
fi

# Function to change to project directory
cd_project() {
    cd "$NOET_PROJECT_PATH" || exit 1
}
