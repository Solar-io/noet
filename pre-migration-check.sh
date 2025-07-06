#!/bin/bash

# Pre-Migration Safety Check for Noet App File Structure Migration
# This script ensures all safety measures are in place before migration

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

echo -e "${CYAN}🔍 Pre-Migration Safety Check${NC}"
echo -e "${CYAN}=============================${NC}"
echo ""
echo -e "${BLUE}This script will verify that all safety measures are in place before migration.${NC}"
echo ""

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Initialize safety check status
SAFETY_CHECKS_PASSED=0
TOTAL_CHECKS=6

# Function to run a safety check
run_check() {
    local check_name="$1"
    local check_function="$2"
    
    echo -e "${YELLOW}🔍 Checking: $check_name${NC}"
    
    if $check_function; then
        echo -e "${GREEN}✅ PASS: $check_name${NC}"
        ((SAFETY_CHECKS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $check_name${NC}"
    fi
    echo ""
}

# Check 1: Git repository status
check_git_status() {
    if git status --porcelain | grep -q .; then
        echo "   ⚠️  You have uncommitted changes"
        echo "   Please commit all changes before migration"
        return 1
    else
        echo "   ✅ Working directory is clean"
        return 0
    fi
}

# Check 2: Git repository exists and is healthy
check_git_repo() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        echo "   ✅ Git repository is healthy"
        return 0
    else
        echo "   ❌ Not a git repository or git is corrupted"
        return 1
    fi
}

# Check 3: Recent commits exist (backup capability)
check_recent_commits() {
    if git log --oneline -n 5 > /dev/null 2>&1; then
        echo "   ✅ Git history exists for rollback"
        echo "   Recent commits:"
        git log --oneline -n 3 | sed 's/^/      /'
        return 0
    else
        echo "   ❌ No git history found"
        return 1
    fi
}

# Check 4: Required files exist
check_required_files() {
    local missing_files=()
    local required_files=(
        "package.json"
        "src/"
        "server/"
        "simple-config.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -e "$file" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        echo "   ✅ All required files present"
        return 0
    else
        echo "   ❌ Missing required files:"
        printf '      %s\n' "${missing_files[@]}"
        return 1
    fi
}

# Check 5: Migration scripts are present and executable
check_migration_scripts() {
    local missing_scripts=()
    local migration_scripts=(
        "complete-migration.sh"
        "migrate-file-structure.sh"
        "update-references.sh"
        "update-package-json.sh"
        "rollback-migration.sh"
    )
    
    for script in "${migration_scripts[@]}"; do
        if [[ ! -f "$script" ]]; then
            missing_scripts+=("$script (missing)")
        elif [[ ! -x "$script" ]]; then
            missing_scripts+=("$script (not executable)")
        fi
    done
    
    if [[ ${#missing_scripts[@]} -eq 0 ]]; then
        echo "   ✅ All migration scripts present and executable"
        return 0
    else
        echo "   ❌ Script issues:"
        printf '      %s\n' "${missing_scripts[@]}"
        return 1
    fi
}

# Check 6: Disk space available
check_disk_space() {
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local available_mb=$((available_space / 1024))
    
    if [[ $available_mb -gt 100 ]]; then
        echo "   ✅ Sufficient disk space: ${available_mb}MB available"
        return 0
    else
        echo "   ❌ Low disk space: only ${available_mb}MB available"
        echo "   Migration requires at least 100MB free space"
        return 1
    fi
}

# Run all safety checks
echo -e "${BLUE}📋 Running safety checks...${NC}"
echo ""

run_check "Git repository health" check_git_repo
run_check "Working directory status" check_git_status
run_check "Git history for rollback" check_recent_commits
run_check "Required project files" check_required_files
run_check "Migration scripts ready" check_migration_scripts
run_check "Disk space availability" check_disk_space

# Summary
echo -e "${CYAN}📊 Safety Check Summary${NC}"
echo "=========================================="
echo -e "Checks passed: ${GREEN}$SAFETY_CHECKS_PASSED${NC}/${TOTAL_CHECKS}"
echo ""

if [[ $SAFETY_CHECKS_PASSED -eq $TOTAL_CHECKS ]]; then
    echo -e "${GREEN}🎉 ALL SAFETY CHECKS PASSED!${NC}"
    echo -e "${GREEN}✅ Your project is ready for migration${NC}"
    echo ""
    echo -e "${BLUE}📋 Recommended next steps:${NC}"
    echo "1. Create a backup branch: ${CYAN}git checkout -b pre-migration-backup && git checkout main${NC}"
    echo "2. Run the migration: ${CYAN}./complete-migration.sh${NC}"
    echo "3. If issues occur, rollback with: ${CYAN}./rollback-migration.sh${NC}"
    echo ""
    echo -e "${YELLOW}💡 Pro tip: The migration will create an automatic backup commit${NC}"
    echo ""
    
    # Ask if user wants to create backup branch now
    read -p "Do you want to create a backup branch now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${PURPLE}🔄 Creating backup branch...${NC}"
        git checkout -b pre-migration-backup
        git checkout main
        echo -e "${GREEN}✅ Backup branch 'pre-migration-backup' created${NC}"
        echo -e "${GREEN}✅ Switched back to main branch${NC}"
        echo ""
        echo -e "${CYAN}You're now ready to run: ./complete-migration.sh${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}❌ SAFETY CHECKS FAILED!${NC}"
    echo -e "${RED}   Migration cannot proceed safely${NC}"
    echo ""
    echo -e "${YELLOW}📋 Please fix the following issues:${NC}"
    
    # Re-run failed checks to show details
    check_git_repo > /dev/null 2>&1 || echo "• Fix git repository issues"
    check_git_status > /dev/null 2>&1 || echo "• Commit all changes: git add -A && git commit -m 'Pre-migration commit'"
    check_recent_commits > /dev/null 2>&1 || echo "• Ensure git repository has commit history"
    check_required_files > /dev/null 2>&1 || echo "• Ensure all required project files are present"
    check_migration_scripts > /dev/null 2>&1 || echo "• Fix migration script issues (run chmod +x *.sh)"
    check_disk_space > /dev/null 2>&1 || echo "• Free up disk space (need at least 100MB)"
    
    echo ""
    echo -e "${BLUE}Run this script again after fixing the issues.${NC}"
    exit 1
fi 