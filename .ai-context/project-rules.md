# NOET APP - AI Development Rules

## 🚨 CRITICAL PATTERNS - NEVER VIOLATE

### State Management
- **ALL state defined in App-TipTap.jsx ONLY**
- **NEVER add useState in child components**
- **Pass state down as props, callbacks up**
- **NO duplicate state declarations**

### API Patterns
- **USE: `configService.getApiUrl()` for base URL**
- **USE: Direct fetch() calls**
- **NEVER: NoteStorageService (removed)**
- **Pattern: `${configService.getApiUrl()}/api/${userId}/endpoint`**

### Component Hierarchy
```
App-TipTap.jsx (state owner)
├── TipTapEditor.jsx (receives props)
├── ImprovedSidebar.jsx (receives props)
└── ImprovedNotesList.jsx (receives props)
```

### File Dependencies
- **TipTapEditor.jsx**: Uses configService, NO storage services
- **All components**: Receive state via props from App-TipTap.jsx
- **Backend**: server/server.js with file-based storage

## 🔄 DEVELOPMENT WORKFLOW

### Before Making Changes
1. Create feature branch: `git checkout -b fix-[specific-issue]`
2. Commit current state: `git commit -m "Checkpoint before changes"`
3. Identify ONE specific change
4. Read existing code context
5. Confirm change scope with user

### Making Changes
1. **One file at a time**
2. **One function/feature at a time**
3. **Test immediately after each change**
4. **Commit successful changes before next change**

### Testing Strategy
- Run relevant test script after each change
- Available tests: test-file-upload.js, test-soft-delete.js, test-comprehensive.js
- Create new test scripts for new features

## 🏗️ CURRENT ARCHITECTURE

### Frontend (http://localhost:3001)
- React + Vite
- TipTap editor
- Tailwind CSS
- ES modules ("type": "module")

### Backend (http://localhost:3004)
- Node.js + Express
- File-based storage in server/data/
- Soft delete implemented (deleted: true/false)

### Authentication
- Simple demo: demo@example.com / demo123
- User ID: "demo-user"

## 📋 KNOWN WORKING PATTERNS

### API Call Pattern
```javascript
const response = await fetch(`${configService.getApiUrl()}/api/${userId}/notes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### File Upload Pattern
```javascript
const form = new FormData();
form.append('file', blob, filename);
const response = await fetch(`${configService.getApiUrl()}/api/${userId}/notes/${noteId}/attachments`, {
  method: 'POST',
  body: form
});
```

### Error Handling Pattern
```javascript
if (!response.ok) {
  throw new Error(`API call failed: ${response.status} ${response.statusText}`);
}
```

## 🚫 ANTI-PATTERNS (DO NOT DO)

- Creating service classes (NoteStorageService removed)
- Adding useState to child components
- Hardcoding URLs instead of using configService
- Making multiple unrelated changes in one commit
- Skipping tests after changes
- Working on multiple issues simultaneously

## 📍 CURRENT STATUS

### ✅ COMPLETED
- File upload functionality working
- Basic drag-and-drop implemented
- Backend soft delete endpoints created
- Error recovery service implemented
- Test scripts for file upload

### 🔄 IN PROGRESS
- Soft delete frontend UI integration
- Filter menu cleanup
- Tag color changes
- Drag-drop sorting persistence

### 🚨 IMMEDIATE PRIORITIES
1. Soft delete UI (trash icon, restore button)
2. Server restart to activate soft delete backend
3. Frontend filtering for trash view
4. Remove redundant filter options

## 🧪 TESTING CHECKLIST

Before considering any change complete:
- [ ] Relevant test script passes
- [ ] No console errors in browser
- [ ] No breaking changes to existing functionality
- [ ] Git commit with descriptive message
- [ ] Documentation updated if patterns changed
