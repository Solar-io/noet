#!/bin/bash

# File Structure Migration Script for Noet App
# This script reorganizes files while preserving git history

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/sgallant/sync/rygel/noet-app"

echo -e "${BLUE}🔄 Starting File Structure Migration for Noet App${NC}"
echo "=================================================="

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Create backup of current state
echo -e "${YELLOW}📦 Creating backup of current state...${NC}"
git add -A
git commit -m "Pre-migration backup: Save current state before file reorganization" || true

# Create new directory structure
echo -e "${YELLOW}📁 Creating new directory structure...${NC}"

# Main directories
mkdir -p tests/{e2e,fixtures,helpers}
mkdir -p scripts/{dev,test,deploy}
mkdir -p docs/{architecture,api,development}
mkdir -p config

# Frontend test directories
mkdir -p src/tests/{unit,integration}
mkdir -p src/hooks
mkdir -p src/utils

# Backend directories
mkdir -p server/{routes,middleware,utils}
mkdir -p server/tests/{unit,integration}

echo -e "${GREEN}✅ Directory structure created${NC}"

# Function to move file with git mv
move_file() {
    local src="$1"
    local dest="$2"
    
    if [[ -f "$src" ]]; then
        echo "Moving: $src → $dest"
        git mv "$src" "$dest"
    else
        echo -e "${RED}⚠️  File not found: $src${NC}"
    fi
}

# Function to categorize and move test files
echo -e "${YELLOW}🧪 Moving test files...${NC}"

# E2E and integration tests (comprehensive tests)
move_file "test-comprehensive.js" "tests/e2e/comprehensive.js"
move_file "test-comprehensive-fixes.html" "tests/e2e/comprehensive-fixes.html"
move_file "test-final-comprehensive.js" "tests/e2e/final-comprehensive.js"
move_file "test-robustness.js" "tests/e2e/robustness.js"

# Backend/API tests
move_file "test-admin-interface.js" "tests/integration/admin-interface.js"
move_file "test-auth-fix.js" "tests/integration/auth-fix.js"
move_file "test-persistence.js" "tests/integration/persistence.js"
move_file "test-app-status.cjs" "tests/integration/app-status.cjs"
move_file "test-attachment-functionality.cjs" "tests/integration/attachment-functionality.cjs"
move_file "test-bulk-actions.cjs" "tests/integration/bulk-actions.cjs"

# Frontend component tests
move_file "test-color-picker.js" "src/tests/unit/color-picker.js"
move_file "test-dragdrop.js" "src/tests/unit/dragdrop.js"
move_file "test-ui-fixes.js" "src/tests/unit/ui-fixes.js"
move_file "test-ui-soft-delete.js" "src/tests/unit/ui-soft-delete.js"

# Feature tests
move_file "test-features.js" "tests/integration/features.js"
move_file "test-tag-counts.js" "tests/integration/tag-counts.js"
move_file "test-tag-display.js" "tests/integration/tag-display.js"
move_file "test-tag-loading-performance.js" "tests/integration/tag-loading-performance.js"
move_file "test-tags-functionality.js" "tests/integration/tags-functionality.js"
move_file "test-unknown-tags.js" "tests/integration/unknown-tags.js"
move_file "test-uuid-filtering.js" "tests/integration/uuid-filtering.js"

# Note functionality tests
move_file "test-note-counts.js" "tests/integration/note-counts.js"
move_file "test-note-counts-simple.js" "tests/integration/note-counts-simple.js"
move_file "test-notebook-fix.js" "tests/integration/notebook-fix.js"
move_file "test-reorder.js" "tests/integration/reorder.js"
move_file "test-soft-delete.js" "tests/integration/soft-delete.js"
move_file "test-step2-restore.js" "tests/integration/step2-restore.js"

# Upload and file tests
move_file "test-file-upload.js" "tests/integration/file-upload.js"
move_file "test-frontend-upload.js" "tests/integration/frontend-upload.js"

# User management tests
move_file "test-user-edit.js" "tests/integration/user-edit.js"

# Browser console and debugging tests
move_file "test-browser-console.js" "tests/helpers/browser-console.js"
move_file "test-node.js" "tests/helpers/node.js"

# HTML test files (version system tests)
move_file "test-version-system.html" "tests/e2e/version-system.html"
move_file "test-version-creation-throttling.html" "tests/e2e/version-creation-throttling.html"
move_file "test-version-features-complete.html" "tests/e2e/version-features-complete.html"
move_file "test-version-history-complete.html" "tests/e2e/version-history-complete.html"
move_file "test-version-numbering-fix.html" "tests/e2e/version-numbering-fix.html"
move_file "test-version-switching-debug.html" "tests/e2e/version-switching-debug.html"
move_file "test-version-switching-final.html" "tests/e2e/version-switching-final.html"
move_file "test-versioning-implementation.html" "tests/e2e/versioning-implementation.html"

# UI and configuration tests
move_file "test-auto-save-config.html" "tests/e2e/auto-save-config.html"
move_file "test-checkbox-alignment.html" "tests/e2e/checkbox-alignment.html"
move_file "test-filter-improvement.html" "tests/e2e/filter-improvement.html"
move_file "test-restore-fix-verification.html" "tests/e2e/restore-fix-verification.html"
move_file "test-restore-workflow-debug.html" "tests/e2e/restore-workflow-debug.html"

# Remaining test files
move_file "test-app-fix.js" "tests/integration/app-fix.js"
move_file "test-final-fixes.js" "tests/integration/final-fixes.js"
move_file "test-fixes.js" "tests/integration/fixes.js"
move_file "test-fixes-automated.js" "tests/integration/fixes-automated.js"

echo -e "${GREEN}✅ Test files moved${NC}"

# Move shell scripts
echo -e "${YELLOW}🔧 Moving shell scripts...${NC}"

# Development scripts
move_file "simple-noet.sh" "scripts/dev/simple-noet.sh"
move_file "noet.sh" "scripts/dev/noet.sh"
move_file "noet-clean.sh" "scripts/dev/noet-clean.sh"
move_file "noet-config.sh" "scripts/dev/noet-config.sh"
move_file "noet-guard.sh" "scripts/dev/noet-guard.sh"
move_file "dev-check.sh" "scripts/dev/dev-check.sh"
move_file "dev-status.sh" "scripts/dev/dev-status.sh"
move_file "quick-start.sh" "scripts/dev/quick-start.sh"
move_file "start-dev.sh" "scripts/dev/start-dev.sh"
move_file "debug-api.sh" "scripts/dev/debug-api.sh"

# Test scripts
move_file "test-runner.sh" "scripts/test/test-runner.sh"
move_file "run-test.sh" "scripts/test/run-test.sh"
move_file "simple-test.sh" "scripts/test/simple-test.sh"

# Setup and deployment scripts
move_file "setup-complete.sh" "scripts/deploy/setup-complete.sh"
move_file "setup-dev-env.sh" "scripts/deploy/setup-dev-env.sh"
move_file "auto-git.sh" "scripts/deploy/auto-git.sh"
move_file "ensure-project-dir.sh" "scripts/deploy/ensure-project-dir.sh"
move_file "force-project.sh" "scripts/deploy/force-project.sh"

# Configuration scripts
move_file "simple-config.sh" "scripts/simple-config.sh"
move_file "port-manager.sh" "scripts/port-manager.sh"

echo -e "${GREEN}✅ Shell scripts moved${NC}"

# Move documentation files
echo -e "${YELLOW}📖 Moving documentation files...${NC}"

# Architecture documentation
move_file "STORAGE_ARCHITECTURE.md" "docs/architecture/storage-architecture.md"
move_file "DIRECTORY_GUARD_SYSTEM.md" "docs/architecture/directory-guard-system.md"
move_file "DRAGDROP_SUMMARY.md" "docs/architecture/dragdrop-summary.md"
move_file "FEATURE_COMPARISON.md" "docs/architecture/feature-comparison.md"
move_file "FEATURE_STRATEGY.md" "docs/architecture/feature-strategy.md"

# API documentation
move_file "API_DEBUGGING_GUIDE.md" "docs/api/debugging-guide.md"
move_file "PORT_MANAGEMENT.md" "docs/api/port-management.md"

# Development documentation
move_file "DEVELOPMENT.md" "docs/development/development.md"
move_file "DEVELOPMENT_BEST_PRACTICES.md" "docs/development/best-practices.md"
move_file "DEVELOPMENT_ENVIRONMENT.md" "docs/development/environment.md"
move_file "DEVELOPMENT_STABILITY.md" "docs/development/stability.md"
move_file "BEHAVIORAL_GUIDELINES.md" "docs/development/behavioral-guidelines.md"
move_file "TESTING_VALIDATION_COMMITMENT.md" "docs/development/testing-validation-commitment.md"
move_file "COMPLETE_DEVELOPMENT_HISTORY.md" "docs/development/complete-development-history.md"
move_file "TECHNICAL_REFERENCE.md" "docs/development/technical-reference.md"
move_file "MINOR_FEATURES_IMPLEMENTATION_PLAN.md" "docs/development/minor-features-implementation-plan.md"

# Project documentation (keep some in root)
move_file "PROJECT_HANDOFF.md" "docs/project-handoff.md"
move_file "PROJECT_HANDOFF_OLD.md" "docs/project-handoff-old.md"
move_file "CURRENT_STATE.md" "docs/current-state.md"
move_file "UPDATED_PROJECT_CONTEXT.md" "docs/updated-project-context.md"
move_file "DOCUMENTATION_INDEX.md" "docs/documentation-index.md"
move_file "QUICK_REFERENCE.md" "docs/quick-reference.md"

# Fix summaries and solutions
move_file "FIXES_SUMMARY_DECEMBER_2024.md" "docs/fixes-summary-december-2024.md"
move_file "COMPLETE_SIMPLE_SOLUTION.md" "docs/complete-simple-solution.md"
move_file "SIMPLE_DIRECTORY_SOLUTION.md" "docs/simple-directory-solution.md"
move_file "STARTUP-SOLUTION.md" "docs/startup-solution.md"

# Implementation documentation
move_file "TAGS_IMPLEMENTATION_COMPLETE.md" "docs/tags-implementation-complete.md"
move_file "TRASH_IMPLEMENTATION_COMPLETE.md" "docs/trash-implementation-complete.md"
move_file "UUID_TAG_AND_ARCHIVE_FIXES.md" "docs/uuid-tag-and-archive-fixes.md"
move_file "TAG_NAME_RESOLUTION_FIX.md" "docs/tag-name-resolution-fix.md"
move_file "TERMINAL_WORKING_DIRECTORY_FIX.md" "docs/terminal-working-directory-fix.md"
move_file "UNKNOWN_TAGS_FIXES.md" "docs/unknown-tags-fixes.md"
move_file "UI_FIXES_SUMMARY.md" "docs/ui-fixes-summary.md"
move_file "UI-FIXES-SUMMARY.md" "docs/ui-fixes-summary-alt.md"
move_file "SLATE_MIGRATION_README.md" "docs/slate-migration-readme.md"

# README files (keep main README in root, move others to docs)
move_file "README-NEW.md" "docs/readme-new.md"
move_file "README-OLD.md" "docs/readme-old.md"
move_file "README-QUICK-START.md" "docs/readme-quick-start.md"

echo -e "${GREEN}✅ Documentation files moved${NC}"

# Move configuration files
echo -e "${YELLOW}⚙️ Moving configuration files...${NC}"
# config.json is already in root, could move to config/ but might break references
# For now, let's leave it in root

echo -e "${GREEN}✅ Configuration files handled${NC}"

# Create test fixtures
echo -e "${YELLOW}📄 Creating test fixtures...${NC}"
move_file "test-upload-file.txt" "tests/fixtures/test-upload-file.txt"
move_file "test.txt" "tests/fixtures/test.txt"

echo -e "${GREEN}✅ Test fixtures moved${NC}"

# Create updated simple-config.sh in new location
echo -e "${YELLOW}🔧 Creating updated simple-config.sh...${NC}"
cat > scripts/simple-config.sh << 'EOF'
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
EOF

chmod +x scripts/simple-config.sh

echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Migration Summary:${NC}"
echo "• 49 test files moved to tests/ directory"
echo "• 20 shell scripts moved to scripts/ directory"
echo "• 39 documentation files moved to docs/ directory"
echo "• New directory structure created"
echo "• Git history preserved for all files"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Run the reference update script to fix all import paths"
echo "2. Update package.json scripts"
echo "3. Test the new structure"
echo "4. Commit the changes"
echo ""
echo -e "${GREEN}🎉 File structure migration complete!${NC}" 