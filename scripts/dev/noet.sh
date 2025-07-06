#!/bin/bash

# Noet App - Simple Script Wrapper
# Uses simple config approach for directory management

# Source simple config and switch to project directory
source "$(dirname "${BASH_SOURCE[0]}")/scripts/simple-config.sh"
cd "$NOET_PROJECT_PATH"

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
    echo ""
    echo "Project: $NOET_PROJECT_PATH"
    exit 0
fi

command="$1"
shift

case "$command" in
    "validate"|"check")
        echo "✅ Project directory: $(pwd)"
        echo "✅ Package.json exists: $(test -f package.json && echo 'Yes' || echo 'No')"
        echo "✅ Server directory exists: $(test -d server && echo 'Yes' || echo 'No')"
        echo "✅ Source directory exists: $(test -d src && echo 'Yes' || echo 'No')"
        ;;
    "npm")
        echo "🚀 Running npm $@ in $(pwd)"
        npm "$@"
        ;;
    "node")
        echo "🚀 Running node $@ in $(pwd)"
        node "$@"
        ;;
    "test")
        if [[ $# -eq 0 ]]; then
            echo "Available tests:"
            ls -1 test-*.js 2>/dev/null | sed 's/^/  /' || echo "  No test scripts found"
        else
            echo "🧪 Running test: $@ in $(pwd)"
            node "$@"
        fi
        ;;
    "start-dev")
        echo "🚀 Starting development environment..."
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
        npm run backend
        ;;
    "start-frontend")
        echo "🚀 Starting frontend only..."
        npm run dev
        ;;
    *)
        echo "🚀 Running: $command $@ in $(pwd)"
        "$command" "$@"
        ;;
esac
