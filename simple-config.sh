#!/bin/bash

# Simple Noet App Configuration
# Set the base path and project path

export RYGEL_BASE="/Users/sgallant/sync/rygel"
export NOET_PROJECT_PATH="$RYGEL_BASE/noet-app"

# Convenience function to switch to project directory
cd_noet() {
    cd "$NOET_PROJECT_PATH"
}
