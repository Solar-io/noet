#!/bin/bash
# 
# Noet Development Environment
# This script ensures we're always working from the correct directory
#

# Get the directory this script is in (the project root)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "🚀 Noet Development Environment"
echo "==============================="
echo "Project Root: $PROJECT_ROOT"
echo ""

# Always change to project directory
cd "$PROJECT_ROOT" || exit 1

# Verify we're in the right place
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Are we in the right directory?"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Load configuration
if [[ -f "config.json" ]]; then
    FRONTEND_PORT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('config.json', 'utf8')).development.frontend.port)")
    BACKEND_PORT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('config.json', 'utf8')).development.backend.port)")
else
    FRONTEND_PORT=3001
    BACKEND_PORT=3004
fi

echo "Configuration:"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo ""

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    npm run backend
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting frontend server..."
    npm run dev
}

# Function to start both
start_both() {
    echo "🚀 Starting both servers..."
    echo ""
    
    # Start backend in background
    echo "Starting backend..."
    npm run backend &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo "Starting frontend..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Setup cleanup on exit
    cleanup() {
        echo ""
        echo "🛑 Shutting down servers..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Wait for processes
    wait
}

# Function to show status
show_status() {
    echo "📊 Service Status:"
    echo "=================="
    
    # Check if backend is running
    if curl -s "http://localhost:$BACKEND_PORT/api/health" > /dev/null 2>&1; then
        echo "✅ Backend:  http://localhost:$BACKEND_PORT (running)"
    else
        echo "❌ Backend:  http://localhost:$BACKEND_PORT (not running)"
    fi
    
    # Check if frontend is running
    if curl -s "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "✅ Frontend: http://localhost:$FRONTEND_PORT (running)"
    else
        echo "❌ Frontend: http://localhost:$FRONTEND_PORT (not running)"
    fi
    
    echo ""
    echo "🔧 To start services:"
    echo "  ./noet.sh backend   # Start backend only"
    echo "  ./noet.sh frontend  # Start frontend only"  
    echo "  ./noet.sh start     # Start both services"
    echo "  ./noet.sh status    # Show this status"
}

# Parse command line arguments
case "${1:-help}" in
    "backend")
        start_backend
        ;;
    "frontend") 
        start_frontend
        ;;
    "start"|"both")
        start_both
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  backend   Start backend server only"
        echo "  frontend  Start frontend server only"
        echo "  start     Start both servers"
        echo "  status    Show service status"
        echo "  help      Show this help"
        echo ""
        show_status
        ;;
esac
