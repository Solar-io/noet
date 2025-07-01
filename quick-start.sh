#!/bin/bash

# Quick start script for noet-app
# Works from any directory and automatically navigates to the correct path

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Find the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$SCRIPT_DIR"

echo -e "${BLUE}🚀 noet-app Quick Start${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "$PROJECT_DIR/package.json" ]]; then
    echo -e "${RED}❌ Error: Cannot find package.json in $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Please run this script from the noet-app directory${NC}"
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR"
echo -e "${GREEN}📁 Working directory: $(pwd)${NC}"

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check config
if [[ ! -f "config.json" ]]; then
    echo -e "${RED}❌ config.json not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies ready${NC}"
echo ""

# Show configuration
echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "${BLUE}=================${NC}"
cat config.json | grep -A 10 "development" | head -8
echo ""

# Start the application
echo -e "${GREEN}🚀 Starting noet-app...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Run the start script
node start.js
