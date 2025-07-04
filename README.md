# Noet App 📝

A React-based note-taking application with rich text editing capabilities using TipTap editor.

## Current Status (Latest Update)

✅ **STABLE VERSION** - All major issues resolved:
- Directory handling fixed with unified `simple-config.sh`
- Tag management working (UUID tags filtered out)
- Archive functionality restored
- Font family selection added
- Color picker enhanced
- Backend/frontend ports configured correctly
- All scripts work from any directory

## Quick Start

**Option 1: Use the simple startup script (recommended)**
```bash
./simple-noet.sh
```

**Option 2: Manual startup**
```bash
# Start backend (port 3004)
npm run backend

# Start frontend (port 3001) 
npm run dev
```

**Option 3: Use VS Code tasks**
- Open Command Palette (Cmd+Shift+P)
- Run "Tasks: Run Task" 
- Select "Start Backend" and "Start Frontend"

## Demo Accounts

### Demo User
- **Email**: demo@example.com
- **Password**: demo123

### Admin User
- **Email**: admin@example.com
- **Password**: admin123

## Current Working Features

✅ **Core Functionality**
- User login/authentication
- Note creation and editing with TipTap rich text editor
- Tag creation and management (filters out UUID tags)
- Note archiving/unarchiving
- File uploads and attachments
- Real-time note counts and tag counts

✅ **UI Features**
- Comprehensive color picker for text
- Font family selection (serif, sans-serif, monospace)
- Improved sidebar with proper tag counts
- Archive view toggle
- Note search and filtering

✅ **Technical**
- Persistent tag storage across server restarts
- Proper port configuration (frontend: 3001, backend: 3004)
- Unified directory handling for all scripts
- Comprehensive test suite

## Known Limitations

⚠️ **Removed for Stability**
- Font size selection (removed due to UI conflicts)
- Advanced tag refresh logic (reverted to simple approach)

## Project Structure

```
/Users/sgallant/sync/rygel/noet-app/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   ├── App-TipTap.jsx           # Main TipTap app
│   └── TipTapEditor.jsx         # Rich text editor
├── server/                       # Backend Express server
│   └── server.js                # Main server file
├── public/                       # Static assets
├── simple-config.sh             # Unified directory configuration
├── simple-noet.sh              # Simple startup script
├── test-*.js                   # Test suite
└── *.md                        # Documentation
```

## Scripts and Tools

- `./simple-noet.sh` - Start both backend and frontend
- `./simple-test.sh` - Run basic tests
- `./test-runner.sh` - Run comprehensive test suite
- `./run-test.sh [test-file]` - Run specific test
- `./noet.sh` - Advanced startup with options

## Development Environment

- **Frontend**: React + Vite (port 3001)
- **Backend**: Express.js (port 3004)
- **Editor**: TipTap with custom extensions
- **Storage**: File-based JSON storage
- **Testing**: Custom Node.js test suite

## Tech Stack

- **Frontend**: React 18, Vite, TipTap
- **Backend**: Express.js, File-based storage
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

## Recent Major Changes

1. **Directory Handling**: Created `simple-config.sh` for unified directory management
2. **Tag Management**: Fixed UUID tag filtering across frontend and backend
3. **Archive Functionality**: Restored proper archive API calls
4. **UI Enhancements**: Added comprehensive color picker and font family selection
5. **Stability**: Removed font size features and complex tag refresh logic
6. **Port Configuration**: Fixed frontend (3001) and backend (3004) ports
7. **Documentation**: Updated all docs to reflect current stable state

## Testing

Run the comprehensive test suite:
```bash
./test-runner.sh
```

Individual tests:
```bash
./run-test.sh test-tag-counts.js
./run-test.sh test-note-counts.js
```

## Development Workflow

1. **Start development environment**:
   ```bash
   ./simple-noet.sh
   ```

2. **Make changes** to frontend (`src/`) or backend (`server/`)

3. **Test changes**:
   ```bash
   ./simple-test.sh
   ```

4. **Run comprehensive tests**:
   ```bash
   ./test-runner.sh
   ```

## For New Development

Start with a stable baseline - all core functionality is working. The application is ready for new feature development or UI improvements. 

**🚨 IMPORTANT: Check these first to avoid redoing work!**
- `COMPLETE_DEVELOPMENT_HISTORY.md` - Everything we tried for tags & font size (what worked/failed)
- `TECHNICAL_REFERENCE.md` - Exact working code you can copy/paste

**Before making changes:**
- Run the test suite to ensure current functionality works
- Check the comprehensive documentation in the various `.md` files
- Use the existing `simple-config.sh` pattern for any new scripts

## Documentation Files

### 🔥 Essential References (Start Here!)
- `COMPLETE_DEVELOPMENT_HISTORY.md` - **Complete journey of all tag & font size work** - Never start from scratch!
- `TECHNICAL_REFERENCE.md` - **Copy-paste ready working code** for all implementations
- `CURRENT_STATE.md` - Quick status overview and what's working
- `PROJECT_HANDOFF.md` - Comprehensive technical handoff guide

### Specific Technical Details
- `COMPLETE_SIMPLE_SOLUTION.md` - Overview of recent fixes
- `TAG_NAME_RESOLUTION_FIX.md` - Tag management improvements
- `SIMPLE_DIRECTORY_SOLUTION.md` - Directory handling solution
- `TAGS_IMPLEMENTATION_COMPLETE.md` - Tag system details
- `UUID_TAG_AND_ARCHIVE_FIXES.md` - Recent bug fixes

## Contributing

1. Ensure all tests pass with `./test-runner.sh`
2. Test both frontend and backend functionality
3. Update documentation if adding new features
4. Follow the existing code patterns and directory structure

---

**Status**: Stable and Ready for Development ✅  
**Version**: Current (post-stability-fixes)  
**Last Updated**: January 2025
