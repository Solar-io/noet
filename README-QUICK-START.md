# 🚀 noet-app - Quick Start Guide

## Problem Solved: No More Directory Confusion!

This setup ensures you **never have to worry about being in the wrong directory again**.

## 🎯 Quick Start (Choose One)

### Option 1: VS Code Workspace (Recommended)

```bash
# Open the workspace file in VS Code
code noet-app.code-workspace
```

Then use `Ctrl+Shift+P` → "Tasks: Run Task" → "Start Both Servers"

### Option 2: Command Line (Any Directory)

```bash
# From anywhere, run:
./quick-start.sh
# or
npm run quick-start
```

### Option 3: Manual Start

```bash
# Navigate to project (if needed)
cd /Users/sgallant/sync/rygel/noet-app

# Start both servers
npm start
```

## 🔧 Configuration

All ports and URLs are defined in `config.json`:

```json
{
  "development": {
    "frontend": { "port": 3001, "host": "localhost" },
    "backend": { "port": 3004, "host": "localhost" }
  }
}
```

## 📍 Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3004/api/health
- **Login**: demo@example.com / demo123

## 🛠️ Developer Experience Features

### ✅ Automatic Directory Handling

- VS Code workspace sets correct working directory
- Scripts automatically navigate to project root
- No more "wrong directory" errors

### ✅ Port Auto-Discovery

- Frontend automatically finds backend URL
- Fallback to alternative ports if busy
- Clear error messages with suggested fixes

### ✅ Consistent Configuration

- Single source of truth in `config.json`
- Both frontend and backend use same config
- Easy to change ports for different environments

### ✅ VS Code Integration

- Workspace file with proper settings
- Integrated terminal starts in correct directory
- Tasks for starting servers
- Recommended extensions

## 🐛 Troubleshooting

### "Cannot GET /" Error

- **Cause**: Frontend not running or wrong URL
- **Fix**: Check http://localhost:3001 (not 3003)

### "Port in use" Error

- **Cause**: Previous servers still running
- **Fix**: Scripts automatically find alternative ports

### "Cannot find module" Error

- **Cause**: Dependencies not installed
- **Fix**: `npm install` (auto-run by quick-start.sh)

### Wrong Directory Error

- **Cause**: Terminal opened in wrong folder
- **Fix**: Use the VS Code workspace or quick-start.sh

## 📂 Project Structure

```
noet-app/
├── config.json                 # Single source of truth for ports/URLs
├── noet-app.code-workspace     # VS Code workspace configuration
├── quick-start.sh              # Directory-aware startup script
├── start.js                    # Node.js startup with auto-navigation
├── .vscode/
│   └── settings.json           # VS Code terminal settings
├── src/                        # Frontend React app
├── server/                     # Backend Express server
└── public/                     # Static assets
```

## 🚀 Next Steps

1. **Open the workspace**: `code noet-app.code-workspace`
2. **Start developing**: Use VS Code tasks or `npm start`
3. **No more directory issues**: Everything is configured automatically!

---

**🎉 Problem Solved**: You'll never start in the wrong directory again!
