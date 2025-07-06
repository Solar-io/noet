# API Debugging Guide

## Overview

This guide provides a systematic approach to debugging API and frontend-backend integration issues, based on proven troubleshooting methodologies that have successfully resolved complex problems in this project.

## 🔍 The 5-Step Debugging Process

### 1. **Isolate the Problem Layer**

**Determine WHERE the issue is occurring:**

```bash
# Test backend directly (bypasses frontend entirely)
curl -s "http://localhost:3004/api/user-1/notes?tag=problematic-tag" | jq 'length'

# Quick backend health check
curl -s "http://localhost:3004/api/user-1/notes" | jq 'length'
```

**Results interpretation:**

- Backend shows 0 but frontend claims success → **Frontend submission issue**
- Backend shows correct count but frontend doesn't display → **Frontend display issue**
- Both show same incorrect result → **Backend logic issue**
- Backend fails entirely → **Server/API issue**

### 2. **Compare Working vs Broken**

**Document the exact differences:**

```bash
# Compare API calls that work vs don't work
echo "=== WORKING: Individual Tag Add ==="
curl -s -X PUT "http://localhost:3004/api/user-1/notes/NOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"tags": ["new-tag"]}}' | jq

echo "=== BROKEN: Bulk Tag Add ==="
curl -s -X PUT "http://localhost:3004/api/user-1/notes/NOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["new-tag"]}' | jq
```

**Look for:**

- Different API request formats
- Different response patterns
- Different error codes
- Missing headers or authentication

### 3. **Trace the Data Flow**

**Follow the complete journey:**

```bash
# 1. Frontend logs
console.log("Sending:", requestBody);

# 2. Network tab inspection
# 3. Backend logs
echo "📥 Received request:" ${JSON.stringify(req.body)}

# 4. Database verification
curl -s "http://localhost:3004/api/user-1/notes/NOTE_ID" | jq '.tags'
```

### 4. **Verify Each Step**

**Test individual components:**

```bash
# Test each piece in isolation
./debug-api.sh test-single-note-tag-add NOTE_ID tag-name
./debug-api.sh test-bulk-note-tag-add "NOTE_ID1,NOTE_ID2" tag-name
./debug-api.sh verify-backend-state user-1
```

### 5. **Fix and Validate**

**Implement fix with verification:**

```bash
# Apply fix
# Test fix immediately
# Verify no regressions
./debug-api.sh full-test-suite
```

## ✅ Success Story: Filter Reversion Issue (December 2024)

### **Problem**:

Filter system reverted from tag-based multi-select to category-based buttons ("All Notes", "Starred", "Recent", "Archived")

### **How Our 5-Step Process Solved It**:

#### **Step 1: Isolate**

```bash
# Found the issue was in component layer, not backend
grep -r "All Notes.*Starred.*Recent" src/components/
# → NotesList.jsx had category buttons
# → ImprovedNotesList.jsx had tag-based filtering
```

#### **Step 2: Compare**

```javascript
// BROKEN: NotesList.jsx
<button onClick={() => setFilterBy("all")}>All Notes</button>
<button onClick={() => setFilterBy("starred")}>Starred</button>

// WORKING: ImprovedNotesList.jsx
<div className="tag-checkbox">
  <input type="checkbox" onChange={() => toggleTagFilter(tag.id)} />
  <span>{tag.name}</span>
</div>
<button onClick={clearTagFilters}>Clear all</button>
```

#### **Step 3: Trace**

```javascript
// Found App-TipTap.jsx was importing wrong component
import NotesList from "./components/NotesList.jsx"; // ❌ Wrong
// Should be:
import ImprovedNotesList from "./components/ImprovedNotesList.jsx"; // ✅ Correct
```

#### **Step 4: Verify**

- ✅ Created test case (`test-filter-improvement.html`)
- ✅ Verified ImprovedNotesList had all required features
- ✅ Checked component prop compatibility

#### **Step 5: Fix and Validate**

```javascript
// Applied the fix
-import NotesList from "./components/NotesList.jsx";
+import ImprovedNotesList from "./components/ImprovedNotesList.jsx";

// Updated component usage with correct props
-<NotesList selectedNotes={selectedNotes} onBulkTagAction={...} />
+<ImprovedNotesList tags={tags} notebooks={notebooks} folders={folders} />
```

### **Result**:

✅ **Multi-select tag filtering** with checkboxes  
✅ **"Clear all filters"** button working  
✅ **Visual filter badges** showing active selections  
✅ **No duplicate category buttons** from sidebar

### **Time to Resolution**: ~15 minutes (following methodology)

### **Root Cause**: Import statement pointing to wrong component

### **Key Learning**: Always verify which components are actually being used in production

## 🔧 Debug Scripts

Create these helper scripts for faster debugging:

### `debug-api.sh`

```bash
#!/bin/bash
# ... existing code ...

# Add function for filter debugging
debug_filter_components() {
    echo "=== FILTER COMPONENT ANALYSIS ==="
    echo "1. Checking which component is imported:"
    grep -n "import.*NotesList" src/App-TipTap.jsx

    echo "2. Available filter components:"
    ls -la src/components/*List*.jsx

    echo "3. Filter capabilities comparison:"
    echo "   NotesList.jsx:"
    grep -c "All Notes\|Starred\|Recent" src/components/NotesList.jsx
    echo "   ImprovedNotesList.jsx:"
    grep -c "toggleTagFilter\|clearTagFilters" src/components/ImprovedNotesList.jsx
}
```

## 📋 Component Debugging Checklist

When debugging UI component issues:

1. **Verify Imports**

   ```bash
   grep -r "import.*ComponentName" src/
   ```

2. **Check Component Props**

   ```bash
   grep -A 10 -B 2 "<ComponentName" src/
   ```

3. **Compare Available Alternatives**

   ```bash
   find src/components -name "*List*" -o -name "*Filter*"
   ```

4. **Test Component Functionality**

   ```html
   <!-- Create test-[feature].html to validate -->
   ```

5. **Validate User Requirements Met**
   ```
   □ Multi-select capability
   □ Clear all functionality
   □ Visual feedback
   □ No duplicate functionality
   ```

## 🚀 Advanced Debugging Patterns

### **Pattern 1: Component Feature Audit**

```bash
# Quick audit of component capabilities
for component in src/components/*List*.jsx; do
    echo "=== $(basename $component) ==="
    echo "Props:" $(grep -o "const.*=.*{" $component | head -1)
    echo "Features:" $(grep -c "Filter\|Select\|Clear" $component)
    echo "---"
done
```

### **Pattern 2: Rapid Component Switching Test**

```javascript
// In App component, create switchable import for A/B testing
const USE_IMPROVED_LISTS = true;
const NotesList = USE_IMPROVED_LISTS
  ? require("./components/ImprovedNotesList.jsx").default
  : require("./components/NotesList.jsx").default;
```

### **Pattern 3: Feature Compatibility Matrix**

| Component             | Multi-Select | Clear All | Visual Badges | Category Filters |
| --------------------- | ------------ | --------- | ------------- | ---------------- |
| NotesList.jsx         | ❌           | ❌        | ❌            | ✅               |
| ImprovedNotesList.jsx | ✅           | ✅        | ✅            | ❌               |

Choose component based on required features.

## 🎯 When to Use This Guide

**Use for:**

- API integration issues
- Frontend-backend data flow problems
- Component functionality reversions
- Feature implementation bugs
- State synchronization issues

**Don't use for:**

- Simple syntax errors (use linter)
- CSS styling issues (use browser dev tools)
- Performance optimization (use profiler)

---

**Remember**: The goal is systematic problem-solving. Don't skip steps even when you think you know the answer!
