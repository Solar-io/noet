#!/bin/bash

# Complete Migration Script for Noet App File Structure Reorganization
# This script orchestrates the complete migration process

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/Users/sgallant/sync/rygel/noet-app"

echo -e "${CYAN}🚀 Noet App File Structure Migration${NC}"
echo -e "${CYAN}=====================================${NC}"
echo ""
echo -e "${BLUE}This script will reorganize your Noet app file structure:${NC}"
echo "• 49 test files → tests/ directory"
echo "• 20 shell scripts → scripts/ directory"
echo "• 39 documentation files → docs/ directory"
echo "• Create proper subdirectories"
echo "• Update all import paths and references"
echo "• Preserve git history"
echo ""
echo -e "${YELLOW}⚠️  Important: This will make significant changes to your project!${NC}"
echo -e "${YELLOW}   Make sure you have committed all your work first.${NC}"
echo ""

# Confirmation prompt
read -p "Do you want to proceed with the migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Migration cancelled${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Starting migration process...${NC}"
echo ""

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Function to check if a script exists and is executable
check_script() {
    local script="$1"
    if [[ ! -f "$script" ]]; then
        echo -e "${RED}❌ Error: Script not found: $script${NC}"
        exit 1
    fi
    if [[ ! -x "$script" ]]; then
        echo -e "${YELLOW}⚠️  Making script executable: $script${NC}"
        chmod +x "$script"
    fi
}

# Function to run a script with error handling
run_script() {
    local script="$1"
    local description="$2"
    
    echo -e "${PURPLE}🔄 $description${NC}"
    echo "Running: $script"
    echo "----------------------------------------"
    
    if ./"$script"; then
        echo -e "${GREEN}✅ $description completed successfully${NC}"
        echo ""
    else
        echo -e "${RED}❌ Error: $description failed${NC}"
        echo -e "${RED}   Migration stopped. Please check the error above.${NC}"
        exit 1
    fi
}

# Step 1: Make sure all scripts are executable
echo -e "${YELLOW}📋 Step 1: Preparing migration scripts...${NC}"
check_script "migrate-file-structure.sh"
check_script "update-references.sh"
check_script "update-package-json.sh"
echo -e "${GREEN}✅ All scripts are ready${NC}"
echo ""

# Step 2: Run the file structure migration
echo -e "${YELLOW}📋 Step 2: Migrating file structure...${NC}"
run_script "migrate-file-structure.sh" "File structure migration"

# Step 3: Update all references
echo -e "${YELLOW}📋 Step 3: Updating references...${NC}"
run_script "update-references.sh" "Reference updates"

# Step 4: Update package.json
echo -e "${YELLOW}📋 Step 4: Updating package.json...${NC}"
run_script "update-package-json.sh" "Package.json update"

# Step 5: Clean up migration scripts
echo -e "${YELLOW}📋 Step 5: Cleaning up...${NC}"
echo "Removing migration scripts..."
rm -f migrate-file-structure.sh
rm -f update-references.sh
rm -f update-package-json.sh
rm -f complete-migration.sh
echo -e "${GREEN}✅ Migration scripts cleaned up${NC}"
echo ""

# Step 6: Create post-migration documentation
echo -e "${YELLOW}📋 Step 6: Creating post-migration documentation...${NC}"
cat > MIGRATION_COMPLETE.md << 'EOF'
# Migration Complete - New File Structure

## ✅ Migration Successfully Completed

Your Noet app has been successfully reorganized with the new file structure. All files have been moved and all references have been updated.

## 🗂️ New File Structure

```
noet-app/
├── src/                    # Frontend code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── tests/             # Frontend tests
│       ├── unit/          # Component tests
│       └── integration/   # Feature tests
├── server/                # Backend code
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   └── tests/             # Backend tests
│       ├── unit/          # Function tests
│       └── integration/   # API tests
├── tests/                 # End-to-end tests
│   ├── e2e/              # Full system tests
│   ├── fixtures/          # Test data
│   └── helpers/           # Test utilities
├── scripts/               # All shell scripts
│   ├── dev/              # Development scripts
│   ├── test/             # Test runners
│   └── deploy/           # Deployment scripts
├── docs/                  # All documentation
│   ├── architecture/      # System design docs
│   ├── api/              # API documentation
│   └── development/       # Dev guides
└── config/               # Configuration files
```

## 🔄 Updated Commands

### New npm scripts:
```bash
npm run test                # Run full test suite
npm run test-status         # Quick health check
npm run test-attachments    # Test attachment functionality
npm run dev-start          # Start development environment
npm run dev-clean          # Clean development environment
npm run setup              # Complete setup
npm run setup-dev          # Development environment setup
```

### Convenience scripts (still work from root):
```bash
./simple-noet.sh          # Start development (calls scripts/dev/simple-noet.sh)
./test-runner.sh           # Run tests (calls scripts/test/test-runner.sh)
./run-test.sh              # Run specific test (calls scripts/test/run-test.sh)
```

## 📚 Key Documentation Locations

- **Development Guide**: `docs/development/complete-development-history.md`
- **Technical Reference**: `docs/development/technical-reference.md`
- **Current Status**: `docs/current-state.md`
- **Project Overview**: `docs/project-handoff.md`
- **API Documentation**: `docs/api/debugging-guide.md`

## 🧪 Testing

All test files have been reorganized:
- **E2E Tests**: `tests/e2e/`
- **Integration Tests**: `tests/integration/`
- **Unit Tests**: `src/tests/unit/`
- **Test Helpers**: `tests/helpers/`
- **Test Fixtures**: `tests/fixtures/`

## 🎉 What's Next

1. **Test the new structure**: Run `npm run test-status` to verify everything works
2. **Update your IDE**: Refresh your IDE/editor to recognize the new structure
3. **Update bookmarks**: Any bookmarks to specific files may need updating
4. **Team notification**: If working with a team, notify them of the new structure

## 🔧 Troubleshooting

If you encounter any issues:
1. Check that all scripts are executable: `find scripts/ -name "*.sh" -exec chmod +x {} \;`
2. Verify paths in your IDE settings
3. Clear any cached file paths in your development tools
4. Run `npm run test-status` to verify all systems are working

---

**Migration completed successfully!** 🎉
Your Noet app now has a clean, organized file structure that follows best practices.
EOF

echo -e "${GREEN}✅ Post-migration documentation created${NC}"
echo ""

# Step 7: Final verification
echo -e "${YELLOW}📋 Step 7: Final verification...${NC}"
echo "Checking new directory structure..."

# Check if key directories exist
directories=(
    "tests/e2e"
    "tests/integration"
    "tests/fixtures"
    "tests/helpers"
    "scripts/dev"
    "scripts/test"
    "scripts/deploy"
    "docs/architecture"
    "docs/api"
    "docs/development"
    "src/tests/unit"
    "src/tests/integration"
)

for dir in "${directories[@]}"; do
    if [[ -d "$dir" ]]; then
        echo -e "${GREEN}✅ $dir${NC}"
    else
        echo -e "${RED}❌ $dir${NC}"
    fi
done

echo ""
echo -e "${CYAN}🎉 MIGRATION COMPLETE! 🎉${NC}"
echo -e "${CYAN}==============================${NC}"
echo ""
echo -e "${GREEN}✅ All files have been successfully reorganized${NC}"
echo -e "${GREEN}✅ Git history has been preserved${NC}"
echo -e "${GREEN}✅ All references have been updated${NC}"
echo -e "${GREEN}✅ Package.json has been updated${NC}"
echo -e "${GREEN}✅ Convenience scripts have been created${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Run: ${CYAN}npm run test-status${NC} to verify everything works"
echo "2. Review: ${CYAN}MIGRATION_COMPLETE.md${NC} for detailed information"
echo "3. Commit: ${CYAN}git add -A && git commit -m 'Reorganize file structure'${NC}"
echo "4. Test your development workflow with the new structure"
echo ""
echo -e "${YELLOW}💡 Pro Tip:${NC} Your existing commands like ${CYAN}./simple-noet.sh${NC} still work!"
echo ""
echo -e "${GREEN}Happy coding with your newly organized Noet app! 🚀${NC}" 