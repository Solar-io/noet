# Minor Features Implementation Plan

## 🎯 Feature Overview

Four minor but impactful features to enhance the Noet app user experience:

1. **Note Count on Notebooks** - Display number of notes in each notebook (but not folders)
2. **Font Size Adjustment** - User preference for editor font size
3. **Highlighter Colors** - Default and customizable highlight colors for text
4. **Tag Color Customization** - Ability to change tag colors with color picker

## 📋 Implementation Strategy

### 1. Note Count on Notebooks

**Current State**: Notebooks display without note counts
**Target**: Show "(5)" next to notebook name indicating note count

**Implementation Plan**:
- Modify backend to include note count in notebook data
- Update ImprovedSidebar.jsx to display counts
- Ensure counts update when notes are added/removed
- Only show counts on notebooks, not folders

**Files to Modify**:
- `server/server.js` - Add note counting to notebook endpoints
- `src/components/ImprovedSidebar.jsx` - Display note counts
- Test script to verify counts update correctly

### 2. Font Size Adjustment

**Current State**: Fixed font size in editor
**Target**: User setting for small/medium/large font sizes

**Implementation Plan**:
- Add font size setting to user preferences
- Create font size selector in settings panel
- Apply font size to Slate editor and preview
- Persist setting in localStorage or user profile

**Files to Modify**:
- `src/App.jsx` - Add font size state and settings UI
- `src/components/NoteEditor.jsx` - Apply font size to editor
- CSS classes for different font sizes

### 3. Highlighter Colors

**Current State**: Basic text formatting without highlighting
**Target**: Highlighter tool with default and custom colors

**Implementation Plan**:
- Add highlighter button to editor toolbar
- Implement highlight mark in Slate.js
- Create color picker for highlight color selection
- Default yellow highlight with custom color options

**Files to Modify**:
- `src/App.jsx` - Add highlighter functionality to editor
- Add highlight rendering components
- Color picker component (based on provided example)

### 4. Tag Color Customization

**Current State**: Tags have fixed colors
**Target**: Click tag to open color picker and change color

**Implementation Plan**:
- Add color picker to TagManager component
- Update tag display to show custom colors
- Persist tag colors in backend
- Smooth color transitions

**Files to Modify**:
- `src/components/TagManager.jsx` - Add color picker functionality
- Backend tag endpoints to store colors
- Tag display components

## 🧪 Testing Strategy

Each feature will have dedicated test scripts:

1. `test-note-counts.js` - Verify notebook counts update correctly
2. `test-font-sizes.js` - Test font size changes across different notes
3. `test-highlighter.js` - Test highlighting and color selection
4. `test-tag-colors.js` - Test tag color changes and persistence

## 📚 Documentation Updates

- Update README.md with new features
- Add troubleshooting sections
- Include usage examples
- Update QUICK_REFERENCE.md

## 🚀 Implementation Order

1. **Note Count** (Easiest, immediate value)
2. **Tag Colors** (Builds on existing TagManager)  
3. **Font Size** (Settings infrastructure)
4. **Highlighter** (Most complex, editor modifications)

Each feature will be implemented, tested, and documented before moving to the next.
