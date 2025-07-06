# Updated Project Context for Noet App Development

## Project Overview
I'm working on a React note-taking app called "Noet" located at `/Users/sgallant/sync/rygel/noet-app`. This is a **stable, fully-functional application** with comprehensive documentation and a complete development history.

## 🔥 CRITICAL: Start Here Before Any Development

**Before making ANY changes, read these essential files:**

1. **`COMPLETE_DEVELOPMENT_HISTORY.md`** - Complete journey of tag management and font size implementation. Contains every approach tried, what failed, what worked, and why. **This will save you weeks of rediscovering failed approaches!**

2. **`TECHNICAL_REFERENCE.md`** - Copy-paste ready working code for all implementations. Exact solutions for backend tag filtering, frontend UUID filtering, font family, color picker, directory handling, and testing.

3. **`DOCUMENTATION_INDEX.md`** - Complete guide to all documentation files and their purposes.

## Current Status: STABLE & READY ✅

### What's Working (Fully Tested)
- **Core App**: Login, note creation/editing, tag management, archive functionality
- **Rich Text Editor**: TipTap with color picker and font family selection
- **Backend/Frontend**: Proper port configuration (3001/3004), persistent storage
- **Tag System**: UUID filtering working across all components, proper persistence
- **Directory Handling**: Unified `simple-config.sh` solution - all scripts work from any directory
- **Comprehensive Test Suite**: Full verification of all functionality

### Major Fixes Completed
- **Tag Management**: Complete rewrite to filter UUID tags everywhere (backend & frontend)
- **Archive Functionality**: Fixed API calls and persistence
- **Directory Issues**: Created `simple-config.sh` for universal script reliability
- **Font Features**: Added working font family selection, removed problematic font size features
- **Color Picker**: Implemented comprehensive color selection component
- **Port Configuration**: Standardized frontend (3001) and backend (3004)

## 🚨 What NOT to Try (Documented Failures)

### Font Size Implementation ❌
- **DO NOT** attempt TipTap TextStyle extension with arbitrary sizes
- **DO NOT** try CSS class-based font sizing
- **DO NOT** implement inline style font sizing
- **Reason**: UI conflicts, performance issues, accessibility problems (all documented in COMPLETE_DEVELOPMENT_HISTORY.md)

### Tag Management Anti-Patterns ❌
- **DO NOT** implement complex auto-refresh logic
- **DO NOT** centralize tag loading in main app
- **DO NOT** attempt real-time WebSocket tag updates
- **Reason**: Causes infinite re-renders, prop drilling issues, unnecessary complexity

## ✅ Safe to Extend

- More predefined font families
- Additional color palette options  
- New TipTap editor extensions (formatting)
- Enhanced tag filtering options
- Additional test coverage
- New components following existing patterns

## Key Scripts & Quick Start

```bash
# Start the application
./simple-noet.sh

# Run comprehensive tests
./test-runner.sh

# Quick test specific functionality
./run-test.sh test-tag-counts.js

# Access the app
# Frontend: http://localhost:3001
# Login: demo@example.com / demo123
```

## Essential Documentation Structure

### For Development Reference
- `COMPLETE_DEVELOPMENT_HISTORY.md` - **Most important for new features**
- `TECHNICAL_REFERENCE.md` - Copy-paste ready working code
- `PROJECT_HANDOFF.md` - Complete technical overview
- `CURRENT_STATE.md` - Quick status summary

### For Quick Start
- `README.md` - Main project overview
- `README-QUICK-START.md` - 30-second startup guide
- `DOCUMENTATION_INDEX.md` - Guide to all documentation

### For Specific Technical Issues
- Check `TECHNICAL_REFERENCE.md` first for working solutions
- Review `COMPLETE_DEVELOPMENT_HISTORY.md` for context and failed approaches
- Use specific technical docs for detailed information

## Development Behavioral Guidelines

### 🔥 Critical Behaviors
1. **Always check `COMPLETE_DEVELOPMENT_HISTORY.md` before implementing similar features**
2. **Use working code from `TECHNICAL_REFERENCE.md` as starting point**
3. **Test with `./test-runner.sh` before and after changes**
4. **Use `simple-config.sh` pattern for any new scripts**
5. **Filter UUID tags everywhere (backend and frontend)**

### Documentation Pattern
- Feature Implementation → Comprehensive Testing → Update References → Test from Clean State

### Script Enhancement Pattern  
- Use `simple-config.sh` → Include Error Handling → Test from Any Directory → Update Documentation

### Problem Resolution Pattern
- Check Existing Documentation → Review Technical Reference → Test Thoroughly → Document Solution

## Key Technical Patterns Established

### Backend (server/server.js)
- UUID filtering in all tag operations
- Proper tag generation from notes
- File-based storage with error handling

### Frontend (src/)
- UUID filtering in all tag displays
- Component-local tag loading (not centralized)
- TipTap extensions with proper configuration
- Consistent error handling and loading states

### Scripts
- All source `simple-config.sh` for directory handling
- Absolute paths and error handling
- Work from any directory, properly tested

### Testing
- Comprehensive test suite with real API calls
- Backend and frontend tested separately
- Integration tests for full workflows

## Project is Production-Ready

This is not a prototype or work-in-progress. It's a **stable, tested, documented application** ready for:
- Daily use as a note-taking app
- Extension with new features
- Learning and experimentation  
- Production deployment preparation

## 💡 Pro Tips for Development

1. **Starting a new feature?** Check `COMPLETE_DEVELOPMENT_HISTORY.md` first to see if similar work was attempted
2. **Need working code?** Copy from `TECHNICAL_REFERENCE.md` - it's all tested and functional
3. **Directory issues?** Use the `simple-config.sh` pattern - it solves everything
4. **Tag-related work?** Pay special attention to UUID filtering - it's critical everywhere
5. **Testing changes?** Use `./test-runner.sh` - it's comprehensive and reliable

**The comprehensive documentation means you'll never have to start from scratch or rediscover failed approaches!** 🚀
