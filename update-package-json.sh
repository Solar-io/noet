#!/bin/bash

# Package.json Update Script for Noet App File Structure Migration
# This script updates package.json with new file paths after migration

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/sgallant/sync/rygel/noet-app"

echo -e "${BLUE}🔄 Updating package.json for New File Structure${NC}"
echo "==================================================="

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Backup current package.json
cp package.json package.json.backup
echo -e "${YELLOW}📦 Created backup: package.json.backup${NC}"

# Update package.json with new structure
echo -e "${YELLOW}📝 Updating package.json scripts...${NC}"

# Create temporary file for updated package.json
cat > package.json.tmp << 'EOF'
{
  "name": "noet-app",
  "version": "1.0.0-beta",
  "type": "module",
  "description": "A modern note-taking app with TipTap editor",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "node start.js",
    "start-old": "node startup.js",
    "health": "node healthcheck.js",
    "backend": "node server/server.js",
    "frontend": "vite",
    "clean": "node scripts/clean.js",
    "test": "scripts/test/test-runner.sh",
    "test-comprehensive": "node tests/e2e/comprehensive.js",
    "test-watch": "nodemon tests/integration/features.js",
    "test-quick": "scripts/test/simple-test.sh",
    "test-status": "node tests/integration/app-status.cjs",
    "test-attachments": "node tests/integration/attachment-functionality.cjs",
    "dev-start": "scripts/dev/simple-noet.sh",
    "dev-clean": "scripts/dev/noet-clean.sh",
    "dev-guard": "scripts/dev/noet-guard.sh",
    "dev-debug": "scripts/dev/debug-api.sh",
    "setup": "scripts/deploy/setup-complete.sh",
    "setup-dev": "scripts/deploy/setup-dev-env.sh",
    "quick-start": "scripts/dev/quick-start.sh"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/SamGallant/noet.git"
  },
  "bugs": {
    "url": "https://github.com/SamGallant/noet/issues"
  },
  "homepage": "https://github.com/SamGallant/noet#readme",
  "keywords": [
    "notes",
    "editor",
    "react",
    "tiptap",
    "note-taking",
    "rich-text"
  ],
  "author": "Sam Gallant",
  "license": "MIT",
  "dependencies": {
    "@tiptap/extension-blockquote": "^2.23.0",
    "@tiptap/extension-bullet-list": "^2.23.0",
    "@tiptap/extension-code-block": "^2.23.0",
    "@tiptap/extension-color": "^2.23.0",
    "@tiptap/extension-font-family": "^2.23.0",
    "@tiptap/extension-heading": "^2.23.0",
    "@tiptap/extension-highlight": "^2.23.0",
    "@tiptap/extension-horizontal-rule": "^2.23.0",
    "@tiptap/extension-image": "^2.23.0",
    "@tiptap/extension-link": "^2.23.0",
    "@tiptap/extension-list-item": "^2.23.0",
    "@tiptap/extension-ordered-list": "^2.23.0",
    "@tiptap/extension-strike": "^2.23.0",
    "@tiptap/extension-subscript": "^2.23.0",
    "@tiptap/extension-superscript": "^2.23.0",
    "@tiptap/extension-task-item": "^2.23.0",
    "@tiptap/extension-task-list": "^2.23.0",
    "@tiptap/extension-text-style": "^2.23.0",
    "@tiptap/pm": "^2.23.0",
    "@tiptap/react": "^2.23.0",
    "@tiptap/starter-kit": "^2.23.0",
    "axios": "^1.10.0",
    "jszip": "^3.10.1",
    "lucide-react": "^0.263.1",
    "mammoth": "^1.9.1",
    "react": "^18.2.0",
    "react-color": "^2.19.3",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "react-dom": "^18.2.0",
    "react-icons": "^5.5.0",
    "slate": "^0.94.1",
    "slate-history": "^0.93.0",
    "slate-react": "^0.98.4",
    "turndown": "^7.2.0",
    "turndown-plugin-gfm": "^1.0.2",
    "uuid": "^11.1.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "form-data": "^4.0.3",
    "jsdom": "^26.1.0",
    "node-fetch": "^3.3.2",
    "postcss": "^8.4.27",
    "puppeteer": "^24.11.2",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOF

# Replace the original package.json
mv package.json.tmp package.json

echo -e "${GREEN}✅ package.json updated successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Updated Scripts:${NC}"
echo "• test → scripts/test/test-runner.sh"
echo "• test-comprehensive → tests/e2e/comprehensive.js"
echo "• test-quick → scripts/test/simple-test.sh"
echo "• test-status → tests/integration/app-status.cjs"
echo "• test-attachments → tests/integration/attachment-functionality.cjs"
echo "• dev-start → scripts/dev/simple-noet.sh"
echo "• dev-clean → scripts/dev/noet-clean.sh"
echo "• dev-guard → scripts/dev/noet-guard.sh"
echo "• dev-debug → scripts/dev/debug-api.sh"
echo "• setup → scripts/deploy/setup-complete.sh"
echo "• setup-dev → scripts/deploy/setup-dev-env.sh"
echo "• quick-start → scripts/dev/quick-start.sh"
echo ""
echo -e "${YELLOW}💡 New Scripts Available:${NC}"
echo "• npm run test-status (quick health check)"
echo "• npm run test-attachments (attachment testing)"
echo "• npm run dev-start (start development)"
echo "• npm run dev-clean (clean development environment)"
echo "• npm run dev-debug (debug API issues)"
echo "• npm run setup (complete setup)"
echo "• npm run setup-dev (development environment setup)"
echo ""
echo -e "${GREEN}🎉 package.json update complete!${NC}" 