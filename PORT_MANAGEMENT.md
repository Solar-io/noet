# Noet - Port Management & Health Monitoring

This project now includes robust port management and health monitoring to prevent service conflicts.

## Quick Start

### 🚀 Start Everything (Recommended)

```bash
npm run start
```

This will:

- Clean up any existing processes
- Start the backend server
- Wait for backend to be healthy
- Start the frontend server
- Show you the URLs for both services

### 🏥 Health Check

```bash
npm run health
```

This will check:

- Port availability
- Running processes
- Backend health
- File system access
- Dependencies
- Configuration files

### 🧹 Clean Up Processes

```bash
npm run clean
```

Kills any processes running on ports 3001, 3002, or 3003.

## Individual Services

### Backend Only

```bash
npm run backend
```

### Frontend Only

```bash
npm run frontend
```

## Port Configuration

Ports are managed through `config.json`:

```json
{
  "development": {
    "frontend": { "port": 3001, "host": "localhost" },
    "backend": { "port": 3003, "host": "localhost" }
  },
  "production": {
    "frontend": { "port": 3000, "host": "0.0.0.0" },
    "backend": { "port": 3001, "host": "0.0.0.0" }
  }
}
```

You can override ports with environment variables:

```bash
FRONTEND_PORT=4001 BACKEND_PORT=4003 npm run start
```

## Common Issues & Solutions

### ❌ Port Already in Use

The system will automatically find alternative ports if the configured ones are busy.

### ❌ Backend Not Responding

Run `npm run health` to diagnose the issue. Common causes:

- Backend process not started
- Port conflicts
- File permission issues

### ❌ File Upload Fails

Check:

1. Backend is running (`npm run health`)
2. Notes directory is writable
3. No port conflicts

### ❌ "Cannot find module" Errors

Install dependencies:

```bash
npm install
```

## Architecture

- **Frontend**: React + Vite (port 3001)
- **Backend**: Express + Node.js (port 3003)
- **Configuration**: Centralized in `config.json`
- **Health Monitoring**: Automated checks for all services
- **Port Management**: Automatic conflict resolution

## Development Workflow

1. **Start development**: `npm run start`
2. **Check health**: `npm run health` (if issues)
3. **Clean restart**: `npm run clean` then `npm run start`

The system is designed to be resilient and self-healing. If you encounter issues, the health check will help diagnose and the startup script will attempt to resolve common problems automatically.

## Files Added

- `config.json` - Centralized configuration
- `server/portManager.js` - Port management utility
- `src/configService.js` - Frontend configuration service
- `healthcheck.js` - Comprehensive health monitoring
- `startup.js` - Automated startup with conflict resolution
- Updated `package.json` with new scripts
- Updated `vite.config.js` for dynamic port configuration

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `FRONTEND_PORT` - Override frontend port
- `BACKEND_PORT` - Override backend port
- `FRONTEND_HOST` - Override frontend host
- `BACKEND_HOST` - Override backend host
- `VITE_PORT` - Vite dev server port
- `VITE_HOST` - Vite dev server host
