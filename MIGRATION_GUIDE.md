# File Structure Migration Guide

## 🎯 Overview

This guide provides complete instructions for reorganizing your Noet app file structure following modern best practices. The migration will move 49 test files, 20 shell scripts, and 39 documentation files to their appropriate directories while preserving git history.

## 📋 Pre-Migration Checklist

Before starting the migration, ensure you have:

- [ ] **Committed all changes**: `git add -A && git commit -m "Pre-migration commit"`
- [ ] **Backup your work**: Consider creating a branch: `git checkout -b pre-migration-backup`
- [ ] **Closed your IDE**: Close VS Code or other editors to avoid conflicts
- [ ] **Stopped running processes**: Stop any development servers or tests
- [ ] **Verified git status**: Run `git status` to ensure clean working directory

## 🗂️ New File Structure

After migration, your project will have this structure:

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

## 🚀 Migration Process

### Step 1: Run the Migration

Execute the main migration script:

```bash
./complete-migration.sh
```

This script will:

1. ✅ Prepare migration scripts
2. 🗂️ Migrate file structure with `git mv` (preserves history)
3. 🔄 Update all references and import paths
4. 📦 Update package.json scripts
5. 🧹 Clean up migration scripts
6. 📚 Create post-migration documentation
7. ✅ Verify the new structure

### Step 2: Verify Migration

After migration, verify everything works:

```bash
# Quick health check
npm run test-status

# Test attachment functionality
npm run test-attachments

# Run full test suite
npm run test
```

### Step 3: Commit Changes

```bash
git add -A
git commit -m "Reorganize file structure: Move tests, scripts, and docs to organized directories"
```

## 📝 What Changes

### Files Moved

#### Test Files → `tests/`

- **E2E Tests**: `tests/e2e/` (comprehensive tests, version system tests)
- **Integration Tests**: `tests/integration/` (API tests, feature tests)
- **Unit Tests**: `src/tests/unit/` (component tests)
- **Test Helpers**: `tests/helpers/` (utility functions)
- **Test Fixtures**: `tests/fixtures/` (test data files)

#### Shell Scripts → `scripts/`

- **Development Scripts**: `scripts/dev/` (simple-noet.sh, noet.sh, debug tools)
- **Test Scripts**: `scripts/test/` (test-runner.sh, run-test.sh)
- **Deployment Scripts**: `scripts/deploy/` (setup scripts, auto-git.sh)

#### Documentation → `docs/`

- **Architecture**: `docs/architecture/` (system design, features)
- **API Documentation**: `docs/api/` (debugging guide, port management)
- **Development**: `docs/development/` (dev history, best practices)
- **Project Docs**: `docs/` (handoff, current state, quick reference)

### References Updated

All references are automatically updated:

- Import paths in JavaScript/TypeScript files
- Script references in package.json
- Documentation links in markdown files
- HTML file references
- VS Code configuration

### New Commands

#### npm Scripts

```bash
npm run test                # Run full test suite
npm run test-status         # Quick health check
npm run test-attachments    # Test attachment functionality
npm run dev-start          # Start development environment
npm run dev-clean          # Clean development environment
npm run setup              # Complete setup
npm run setup-dev          # Development environment setup
```

#### Convenience Scripts (still work from root)

```bash
./simple-noet.sh          # Start development
./test-runner.sh           # Run tests
./run-test.sh              # Run specific test
```

## 🔧 Troubleshooting

### Common Issues

#### Scripts Not Executable

```bash
find scripts/ -name "*.sh" -exec chmod +x {} \;
```

#### IDE Not Recognizing New Structure

1. Restart your IDE/editor
2. Refresh file explorer
3. Clear any cached paths

#### Import Errors

Check that all references were updated:

```bash
grep -r "test-.*\.js" . --exclude-dir=node_modules --exclude-dir=.git
```

#### Missing Files

If any files seem missing, check the appropriate directory:

- Tests: `tests/` subdirectories
- Scripts: `scripts/` subdirectories
- Documentation: `docs/` subdirectories

### Recovery

If you need to revert:

```bash
git checkout pre-migration-backup
```

## 🎉 Benefits of New Structure

### Organization

- **Clear separation** of concerns
- **Easy navigation** to find specific files
- **Consistent structure** following industry standards

### Development

- **Improved IDE experience** with better file organization
- **Easier onboarding** for new team members
- **Better testing structure** with clear test categories

### Maintenance

- **Easier to find** and update specific types of files
- **Better documentation organization** by topic
- **Cleaner root directory** with less clutter

## 📚 Key Documentation Locations

After migration, find important docs here:

- **Complete Development History**: `docs/development/complete-development-history.md`
- **Technical Reference**: `docs/development/technical-reference.md`
- **Current State**: `docs/current-state.md`
- **Project Handoff**: `docs/project-handoff.md`
- **API Debugging**: `docs/api/debugging-guide.md`
- **Best Practices**: `docs/development/best-practices.md`

## 🔄 Team Workflow

If working with a team:

1. **Coordinate migration** - ensure all team members are aware
2. **Merge all pending PRs** before migration
3. **Run migration on main branch**
4. **Update team** on new structure and commands
5. **Update CI/CD** if needed to use new script paths

## 💡 Pro Tips

- **Use the convenience scripts** - they still work from root
- **Update your IDE settings** to recognize the new structure
- **Bookmark key documentation** in the new `docs/` structure
- **Test everything** after migration with `npm run test-status`

---

**Ready to migrate?** Run `./complete-migration.sh` to start the process!

Your Noet app will have a clean, organized structure that follows modern best practices. 🚀
