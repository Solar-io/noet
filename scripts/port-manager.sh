#!/bin/bash

# Port Management Script for NOET App
# Ensures consistent ports: Frontend=3001, Backend=3004

echo "🔧 NOET Port Management"
echo "======================="
echo "Frontend (UI): http://localhost:3001"
echo "Backend (API): http://localhost:3004"
echo ""

# Function to kill processes on specific ports
kill_ports() {
    echo "🛑 Killing processes on ports 3001 and 3004..."
    
    # Kill processes using the ports
    lsof -ti:3001 | xargs -r kill -9 2>/dev/null
    lsof -ti:3004 | xargs -r kill -9 2>/dev/null
    
    # Kill any noet-related processes
    pkill -f "node.*start.js" 2>/dev/null
    pkill -f "node.*server.js" 2>/dev/null  
    pkill -f "vite.*3001" 2>/dev/null
    
    echo "✅ Ports cleared"
}

# Function to check port status
check_ports() {
    echo "🔍 Checking port status..."
    
    if lsof -i:3001 >/dev/null 2>&1; then
        echo "❌ Port 3001 (Frontend) is in use:"
        lsof -i:3001
    else
        echo "✅ Port 3001 (Frontend) is free"
    fi
    
    if lsof -i:3004 >/dev/null 2>&1; then
        echo "❌ Port 3004 (Backend) is in use:"
        lsof -i:3004
    else
        echo "✅ Port 3004 (Backend) is free"
    fi
}

# Function to start the app
start_app() {
    echo "🚀 Starting NOET app with fixed ports..."
    cd "$(dirname "$0")"
    npm start
}

# Handle command line arguments
case "${1:-help}" in
    "check")
        check_ports
        ;;
    "kill")
        kill_ports
        ;;
    "start")
        kill_ports
        echo ""
        check_ports
        echo ""
        start_app
        ;;
    "restart")
        kill_ports
        sleep 2
        start_app
        ;;
    "help"|*)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check     - Check which processes are using ports 3001/3004"
        echo "  kill      - Kill processes using ports 3001/3004"
        echo "  start     - Kill conflicting processes and start app"
        echo "  restart   - Kill app and restart with clean ports"
        echo "  help      - Show this help message"
        echo ""
        echo "Fixed Ports:"
        echo "  Frontend: http://localhost:3001"
        echo "  Backend:  http://localhost:3004"
        ;;
esac
