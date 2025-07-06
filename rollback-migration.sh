#!/bin/bash

# Rollback Script for Noet App File Structure Migration
# This script safely rolls back the migration if needed

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

echo -e "${RED}🔄 Noet App Migration Rollback${NC}"
echo -e "${RED}==============================${NC}"
echo ""
echo -e "${YELLOW}⚠️  This will undo the file structure migration!${NC}"
echo -e "${YELLOW}   All files will be moved back to their original locations.${NC}"
echo ""

# Ensure we're in the right directory
cd "$PROJECT_DIR" || exit 1

# Check current git status
echo -e "${BLUE}📋 Checking current git status...${NC}"
git status --porcelain

if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes.${NC}"
    echo -e "${YELLOW}   Please commit or stash them before rollback.${NC}"
    echo ""
    read -p "Do you want to commit them now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add -A
        git commit -m "Pre-rollback commit: Save current state"
        echo -e "${GREEN}✅ Changes committed${NC}"
    else
        echo -e "${RED}❌ Rollback cancelled. Please handle uncommitted changes first.${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📋 Available rollback options:${NC}"
echo ""

# Option 1: Check for backup branch
if git show-ref --verify --quiet refs/heads/pre-migration-backup; then
    echo -e "${GREEN}✅ Option 1: Backup branch 'pre-migration-backup' found${NC}"
    echo "   This is the safest option - restores to pre-migration state"
    HAS_BACKUP_BRANCH=true
else
    echo -e "${YELLOW}❌ Option 1: No backup branch found${NC}"
    HAS_BACKUP_BRANCH=false
fi

# Option 2: Check for pre-migration backup commit
BACKUP_COMMIT=$(git log --oneline --grep="Pre-migration backup" -n 1 | cut -d' ' -f1)
if [[ -n "$BACKUP_COMMIT" ]]; then
    echo -e "${GREEN}✅ Option 2: Pre-migration backup commit found: $BACKUP_COMMIT${NC}"
    echo "   This restores to the automatic backup created during migration"
    HAS_BACKUP_COMMIT=true
else
    echo -e "${YELLOW}❌ Option 2: No pre-migration backup commit found${NC}"
    HAS_BACKUP_COMMIT=false
fi

# Option 3: Manual file reversal
echo -e "${YELLOW}⚠️  Option 3: Manual file reversal (advanced)${NC}"
echo "   Manually move files back - only if other options fail"

echo ""

if [[ "$HAS_BACKUP_BRANCH" == false && "$HAS_BACKUP_COMMIT" == false ]]; then
    echo -e "${RED}❌ Error: No safe rollback options available!${NC}"
    echo -e "${RED}   No backup branch or pre-migration commit found.${NC}"
    echo -e "${RED}   Migration rollback cannot proceed safely.${NC}"
    exit 1
fi

echo -e "${CYAN}Which rollback option do you want to use?${NC}"
if [[ "$HAS_BACKUP_BRANCH" == true ]]; then
    echo "1) Use backup branch (RECOMMENDED - safest option)"
fi
if [[ "$HAS_BACKUP_COMMIT" == true ]]; then
    echo "2) Use pre-migration commit (restores to automatic backup)"
fi
echo "3) Cancel rollback"
echo ""

read -p "Enter your choice (1-3): " -n 1 -r
echo
echo ""

case $REPLY in
    1)
        if [[ "$HAS_BACKUP_BRANCH" == true ]]; then
            echo -e "${PURPLE}🔄 Rolling back using backup branch...${NC}"
            echo "----------------------------------------"
            
            # Get current branch name
            CURRENT_BRANCH=$(git branch --show-current)
            
            echo "Current branch: $CURRENT_BRANCH"
            echo "Switching to backup branch..."
            
            # Switch to backup branch
            git checkout pre-migration-backup
            
            # Delete the current branch (usually main)
            if [[ "$CURRENT_BRANCH" != "pre-migration-backup" ]]; then
                echo "Deleting migrated branch: $CURRENT_BRANCH"
                git branch -D "$CURRENT_BRANCH"
                
                # Recreate the branch from backup
                echo "Recreating branch from backup: $CURRENT_BRANCH"
                git checkout -b "$CURRENT_BRANCH"
            fi
            
            # Clean up backup branch
            echo "Cleaning up backup branch..."
            git branch -d pre-migration-backup
            
            echo -e "${GREEN}✅ Rollback completed using backup branch!${NC}"
        else
            echo -e "${RED}❌ Backup branch not available${NC}"
            exit 1
        fi
        ;;
    2)
        if [[ "$HAS_BACKUP_COMMIT" == true ]]; then
            echo -e "${PURPLE}🔄 Rolling back using pre-migration commit...${NC}"
            echo "----------------------------------------"
            
            echo "Backup commit: $BACKUP_COMMIT"
            echo "Resetting to pre-migration state..."
            
            # Reset to backup commit
            git reset --hard "$BACKUP_COMMIT"
            
            echo -e "${GREEN}✅ Rollback completed using backup commit!${NC}"
        else
            echo -e "${RED}❌ Backup commit not available${NC}"
            exit 1
        fi
        ;;
    3)
        echo -e "${YELLOW}❌ Rollback cancelled${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Rollback cancelled.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}🎉 ROLLBACK COMPLETE! 🎉${NC}"
echo -e "${CYAN}=============================${NC}"
echo ""
echo -e "${GREEN}✅ File structure has been restored to pre-migration state${NC}"
echo -e "${GREEN}✅ All files are back in their original locations${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Verify files are in expected locations"
echo "2. Test that your development workflow works"
echo "3. Review what went wrong with the migration (if applicable)"
echo ""
echo -e "${YELLOW}💡 Note:${NC} Migration scripts are still available if you want to try again later"
echo ""
echo -e "${GREEN}Your Noet app has been successfully rolled back! 🔄${NC}" 