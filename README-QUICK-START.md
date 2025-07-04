# Noet App - Quick Start Guide

## Immediate Startup (30 seconds)

1. **Clone and setup** (if not already done):
   ```bash
   git clone https://github.com/SamGallant/noet.git
   cd noet
   npm install
   ```

2. **Start the app**:
   ```bash
   ./simple-noet.sh
   ```

3. **Access the app**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3004

4. **Login**:
   - Email: `demo@example.com`
   - Password: `demo123`

## That's it! 🎉

You now have a fully functional note-taking app with:
- Rich text editing
- Tag management
- File uploads
- Archive functionality
- Color picker
- Font family selection

## Alternative Startup Methods

### VS Code Tasks
1. Open Command Palette (Cmd+Shift+P)
2. Run "Tasks: Run Task"
3. Select "Start Backend" then "Start Frontend"

### Manual Commands
```bash
# Terminal 1: Backend
npm run backend

# Terminal 2: Frontend  
npm run dev
```

## Troubleshooting

### Port Issues
- Frontend should be on port 3001
- Backend should be on port 3004
- If ports are busy, stop other processes or restart

### Directory Issues
- All scripts now use `simple-config.sh` for directory handling
- Scripts work from any directory

### Missing Dependencies
```bash
npm install
```

## What's Working

✅ Login/authentication  
✅ Note creation and editing  
✅ Tag management (no UUID tags)  
✅ Archive functionality  
✅ File uploads  
✅ Color picker  
✅ Font family selection  
✅ Real-time counts  

## Testing

Quick test:
```bash
./simple-test.sh
```

Full test suite:
```bash
./test-runner.sh
```

## Next Steps

- Create notes and organize with tags
- Try the archive functionality
- Upload files to notes
- Experiment with text formatting and colors
- Check out the comprehensive documentation in the `.md` files

## Need Help?

All scripts and functionality have been stabilized. If you encounter issues:

1. Check that both backend and frontend are running
2. Verify you're using the correct ports (3001 for frontend, 3004 for backend)
3. Run the test suite to verify functionality
4. Check the detailed documentation files

The app is in a stable state and ready for development or daily use!
