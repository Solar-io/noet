#!/bin/bash

# Noet App - Simple Script Wrapper
# Source config and run commands in the project directory

# Source the simple configuration
source "$(dirname "${BASH_SOURCE[0]}")/simple-config.sh"

# Always work from the project directory
cd "$NOET_PROJECT_PATH"

# Main execution
if [[ $# -eq 0 ]]; then
    echo "Noet App - Simple Script Wrapper"
    echo "Working in: $(pwd)"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  npm <args>  - Run npm commands"
    echo "  node <file> - Run node scripts"
    echo "  test <file> - Run test scripts"
    echo "  start-dev   - Start development environment"
    echo "  backend     - Start backend server"
    echo "  frontend    - Start frontend dev server"
    exit 0
fi

case "$1" in
    npm)
        shift
        npm "$@"
        ;;
    node)
        shift
        node "$@"
        ;;
    test)
        shift
        if [[ -f "$1" ]]; then
            node "$1"
        else
            echo "Test file not found: $1"
            exit 1
        fi
        ;;
    start-dev)
        echo "Starting development environment..."
        npm run backend &
        npm run dev
        ;;
    backend)
        npm run backend
        ;;
    frontend)
        npm run dev
        ;;
    *)
        echo "Running: $*"
        "$@"
        ;;
esac
