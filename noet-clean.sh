#!/bin/bash

# Noet App - Smart Script Wrapper
# This wrapper ensures ALL scripts run from the correct directory

# Get the directory of this script (should be project root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source the comprehensive guard
source "$SCRIPT_DIR/noet-guard.sh"

# Main execution
if [[ $# -eq 0 ]]; then
    echo "Noet App - Smart Script Wrapper"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  validate    - Validate project environment"
    echo "  npm <args>  - Run npm commands safely"
    echo "  node <file> - Run node scripts safely"
    echo "  test <file> - Run test scripts safely"
    echo "  start-dev   - Start development environment"
    echo "  start-backend - Start backend only"
    echo "  start-frontend - Start frontend only"
    echo ""
    echo "Examples:"
    echo "  $0 validate"
    echo "  $0 npm install"
    echo "  $0 test test-note-counts.js"
    echo "  $0 start-dev"
    exit 0
fi

command="$1"
shift

case "$command" in
    "validate"|"check")
        validate_environment
        ;;
    "npm")
        safe_npm "$@"
        ;;
    "node")
        safe_node "$@"
        ;;
    "test")
        if [[ $# -eq 0 ]]; then
            echo "Available tests:"
            ensure_project_directory
            ls -1 test-*.js 2>/dev/null | sed 's/^/  /' || echo "  No test scripts found"
        else
            safe_test "$@"
        fi
        ;;
    "start-dev")
        echo "🚀 Starting development environment..."
        ensure_project_directory
        echo "📋 Starting both backend and frontend..."
        echo "   Backend: npm run backend"
        echo "   Frontend: npm run dev"
        echo ""
        npm run backend &
        sleep 2
        npm run dev
        ;;
    "start-backend")
        echo "🚀 Starting backend only..."
        safe_npm run backend
        ;;
    "start-frontend")
        echo "🚀 Starting frontend only..."
        safe_npm run dev
        ;;
    *)
        safe_run "$command" "$@"
        ;;
esac
