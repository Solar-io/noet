#!/bin/bash

# Reference Update Script for Noet App File Structure Migration
# This script updates all references to moved files

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/sgallant/sync/rygel/noet-app"

echo -e "${BLUE}🔄 Starting Reference Updates for Noet App Migration${NC}"
echo "=========================================================="

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Function to update references in a file
update_file_references() {
    local file="$1"
    local backup_file="${file}.backup"
    
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}⚠️  File not found: $file${NC}"
        return
    fi
    
    echo "Updating references in: $file"
    
    # Create backup
    cp "$file" "$backup_file"
    
    # Update shell script references
    sed -i '' \
        -e 's|./simple-noet\.sh|./scripts/dev/simple-noet.sh|g' \
        -e 's|./noet\.sh|./scripts/dev/noet.sh|g' \
        -e 's|./test-runner\.sh|./scripts/test/test-runner.sh|g' \
        -e 's|./run-test\.sh|./scripts/test/run-test.sh|g' \
        -e 's|./simple-test\.sh|./scripts/test/simple-test.sh|g' \
        -e 's|./simple-config\.sh|./scripts/simple-config.sh|g' \
        -e 's|simple-config\.sh|scripts/simple-config.sh|g' \
        -e 's|source simple-config\.sh|source scripts/simple-config.sh|g' \
        -e 's|\. simple-config\.sh|. scripts/simple-config.sh|g' \
        "$file"
    
    # Update test file references
    sed -i '' \
        -e 's|test-app-status\.cjs|tests/integration/app-status.cjs|g' \
        -e 's|test-attachment-functionality\.cjs|tests/integration/attachment-functionality.cjs|g' \
        -e 's|test-bulk-actions\.cjs|tests/integration/bulk-actions.cjs|g' \
        -e 's|test-tag-counts\.js|tests/integration/tag-counts.js|g' \
        -e 's|test-note-counts\.js|tests/integration/note-counts.js|g' \
        -e 's|test-comprehensive\.js|tests/e2e/comprehensive.js|g' \
        -e 's|test-robustness\.js|tests/e2e/robustness.js|g' \
        "$file"
    
    # Update documentation references
    sed -i '' \
        -e 's|COMPLETE_DEVELOPMENT_HISTORY\.md|docs/development/complete-development-history.md|g' \
        -e 's|TECHNICAL_REFERENCE\.md|docs/development/technical-reference.md|g' \
        -e 's|CURRENT_STATE\.md|docs/current-state.md|g' \
        -e 's|PROJECT_HANDOFF\.md|docs/project-handoff.md|g' \
        -e 's|DOCUMENTATION_INDEX\.md|docs/documentation-index.md|g' \
        -e 's|BEHAVIORAL_GUIDELINES\.md|docs/development/behavioral-guidelines.md|g' \
        -e 's|DEVELOPMENT_BEST_PRACTICES\.md|docs/development/best-practices.md|g' \
        -e 's|API_DEBUGGING_GUIDE\.md|docs/api/debugging-guide.md|g' \
        -e 's|README-QUICK-START\.md|docs/readme-quick-start.md|g' \
        "$file"
    
    # Check if file was actually modified
    if ! diff -q "$file" "$backup_file" > /dev/null 2>&1; then
        echo "  ✅ References updated"
    else
        echo "  ➖ No changes needed"
        rm "$backup_file"
    fi
}

# Function to update package.json scripts
update_package_json() {
    local file="package.json"
    
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}⚠️  package.json not found${NC}"
        return
    fi
    
    echo "Updating package.json scripts..."
    
    # Create backup
    cp "$file" "${file}.backup"
    
    # Update script references in package.json
    sed -i '' \
        -e 's|"test": ".*test-runner\.sh"|"test": "scripts/test/test-runner.sh"|g' \
        -e 's|"dev": ".*simple-noet\.sh"|"dev": "scripts/dev/simple-noet.sh"|g' \
        -e 's|"start": ".*simple-noet\.sh"|"start": "scripts/dev/simple-noet.sh"|g' \
        "$file"
    
    echo "  ✅ package.json updated"
}

# Function to update all moved scripts with new simple-config.sh path
update_moved_scripts() {
    echo -e "${YELLOW}🔧 Updating moved scripts...${NC}"
    
    # Update scripts in scripts/ directory
    find scripts/ -name "*.sh" -type f | while read -r script; do
        if [[ -f "$script" ]]; then
            echo "Updating script: $script"
            sed -i '' \
                -e 's|source simple-config\.sh|source scripts/simple-config.sh|g' \
                -e 's|\. simple-config\.sh|. scripts/simple-config.sh|g' \
                -e 's|simple-config\.sh|scripts/simple-config.sh|g' \
                "$script"
        fi
    done
    
    echo "  ✅ Moved scripts updated"
}

# Function to update test files with new paths
update_test_files() {
    echo -e "${YELLOW}🧪 Updating test files...${NC}"
    
    # Update test files in tests/ directory
    find tests/ -name "*.js" -o -name "*.cjs" -o -name "*.html" | while read -r test_file; do
        if [[ -f "$test_file" ]]; then
            echo "Updating test file: $test_file"
            # Update relative paths in test files
            sed -i '' \
                -e 's|../test-|./|g' \
                -e 's|require("../test-|require("./|g' \
                -e 's|import.*from.*"../test-|import from "./|g' \
                "$test_file"
        fi
    done
    
    echo "  ✅ Test files updated"
}

# Function to create new root-level convenience scripts
create_convenience_scripts() {
    echo -e "${YELLOW}📜 Creating convenience scripts...${NC}"
    
    # Create new simple-noet.sh in root that calls the moved version
    cat > simple-noet.sh << 'EOF'
#!/bin/bash
# Convenience script that calls the moved version
source scripts/simple-config.sh
cd_project
exec scripts/dev/simple-noet.sh "$@"
EOF
    chmod +x simple-noet.sh
    
    # Create new test-runner.sh in root that calls the moved version
    cat > test-runner.sh << 'EOF'
#!/bin/bash
# Convenience script that calls the moved version
source scripts/simple-config.sh
cd_project
exec scripts/test/test-runner.sh "$@"
EOF
    chmod +x test-runner.sh
    
    # Create new run-test.sh in root that calls the moved version
    cat > run-test.sh << 'EOF'
#!/bin/bash
# Convenience script that calls the moved version
source scripts/simple-config.sh
cd_project
exec scripts/test/run-test.sh "$@"
EOF
    chmod +x run-test.sh
    
    echo "  ✅ Convenience scripts created"
}

# Function to update VS Code configuration
update_vscode_config() {
    echo -e "${YELLOW}🎨 Updating VS Code configuration...${NC}"
    
    if [[ -f ".vscode/tasks.json" ]]; then
        echo "Updating .vscode/tasks.json..."
        sed -i '' \
            -e 's|"command": "./simple-noet\.sh"|"command": "./scripts/dev/simple-noet.sh"|g' \
            -e 's|"command": "./test-runner\.sh"|"command": "./scripts/test/test-runner.sh"|g' \
            -e 's|"command": "./run-test\.sh"|"command": "./scripts/test/run-test.sh"|g' \
            ".vscode/tasks.json"
        echo "  ✅ VS Code tasks updated"
    fi
}

# Function to update HTML test files
update_html_files() {
    echo -e "${YELLOW}🌐 Updating HTML files...${NC}"
    
    find public/ -name "*.html" | while read -r html_file; do
        if [[ -f "$html_file" ]]; then
            echo "Updating HTML file: $html_file"
            # Update script references in HTML files
            sed -i '' \
                -e 's|src="test-|src="../tests/integration/|g' \
                -e 's|href="test-|href="../tests/integration/|g' \
                "$html_file"
        fi
    done
    
    echo "  ✅ HTML files updated"
}

# Start the update process
echo -e "${YELLOW}📝 Updating file references...${NC}"

# Update main configuration and documentation files
update_file_references "README.md"
update_file_references "vite.config.js"
update_file_references "index.html"

# Update package.json
update_package_json

# Update moved scripts
update_moved_scripts

# Update test files
update_test_files

# Create convenience scripts
create_convenience_scripts

# Update VS Code configuration
update_vscode_config

# Update HTML files
update_html_files

# Update any remaining files that might reference the old paths
echo -e "${YELLOW}🔍 Searching for remaining references...${NC}"

# Find files that might still have old references
files_to_check=$(find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | grep -v node_modules | grep -v .git | grep -v backup)

for file in $files_to_check; do
    if [[ -f "$file" ]]; then
        # Check for any remaining test- references that might need updating
        if grep -q "test-.*\.js\|test-.*\.cjs\|test-.*\.html" "$file" 2>/dev/null; then
            echo "  ⚠️  Found potential old reference in: $file"
            echo "    $(grep -n "test-.*\.js\|test-.*\.cjs\|test-.*\.html" "$file" | head -3)"
        fi
    fi
done

echo -e "${GREEN}✅ Reference updates completed!${NC}"
echo ""
echo -e "${BLUE}📋 Update Summary:${NC}"
echo "• Main configuration files updated"
echo "• package.json scripts updated"
echo "• Moved scripts updated with new paths"
echo "• Test files updated"
echo "• Convenience scripts created in root"
echo "• VS Code configuration updated"
echo "• HTML files updated"
echo ""
echo -e "${YELLOW}⚠️  Manual checks needed:${NC}"
echo "• Review any files flagged above for remaining old references"
echo "• Test that all scripts work from the new locations"
echo "• Verify that all imports and paths are correct"
echo ""
echo -e "${GREEN}🎉 Reference updates complete!${NC}" 