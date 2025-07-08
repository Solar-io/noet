# Complete State Isolation System

This directory contains a comprehensive state isolation system for the Noet application implementing **enterprise-grade state management with complete domain isolation**. The core principle: **Each system only knows about its own concerns and communicates through events**.

## Architecture Overview

The state isolation system consists of **11 isolated domains** with enterprise-level features:

1. **EventBus** - Centralized event system with priority handling, namespacing, and debugging
2. **StateManager** - Main state management with domain isolation, validation, and history
3. **StateValidator** - Comprehensive validation system with custom rules and sanitization
4. **11 Domain-Specific Managers** - Completely isolated systems for each application concern
5. **React Integration** - Easy-to-use hooks and components with perfect isolation

## Complete Domain Architecture

```
🏗️ State Domains (11 Isolated Systems):
├── 📝 EDITOR           - Content, cursor, selection, formatting
├── 📚 VERSIONING       - Version history, preview, restoration
├── 🎨 UI               - Views, selections, modals, notifications
├── 💾 DATA             - Notes, tags, notebooks, sync status
├── 🔐 AUTH             - Authentication, sessions, permissions
├── 🏷️  TAGS            - Tag management, metadata, relationships
├── 📎 ATTACHMENTS      - File uploads, validation, metadata
├── 🔄 DRAGDROP         - Drag & drop operations, validation
├── ⚙️  CONFIG          - Settings, preferences, environment
├── 🔁 SYNC             - Online/offline, sync queues, conflicts
└── 🚨 ERROR_RECOVERY   - Error handling, circuit breakers, resilience
```

## Complete File Structure

### Core System

- `EventBus.js` - Event communication with priority, namespacing, debugging
- `StateManager.js` - Main state manager with 11-domain isolation
- `StateValidator.js` - Validation with custom rules and sanitization

### Original Domain Managers

- `EditorStateManager.js` - Content editing with auto-save and format settings
- `VersioningStateManager.js` - Version control with throttling and preview
- `UIStateManager.js` - Interface state with filtering and statistics

### Authentication & Session

- `AuthStateManager.js` - Complete authentication with session timeout, 2FA, security logging

### Content Management

- `TagStateManager.js` - Tag creation, assignment, filtering, UUID tag handling
- `AttachmentStateManager.js` - File uploads, validation, progress tracking, cleanup

### User Interactions

- `DragDropStateManager.js` - Drag & drop with validation, visual feedback, operation handlers

### System Management

- `ConfigStateManager.js` - Settings with validation, export/import, user preferences
- `SyncStateManager.js` - Online/offline sync with conflict resolution, queue management
- `ErrorRecoveryStateManager.js` - Error handling with circuit breakers, graceful degradation

### React Integration

- `StateIsolationAdapter.jsx` - 11 React hooks with perfect isolation + demo components

## Key Principles

### 🔒 Perfect State Isolation

- Each domain handles only its specific concerns
- Zero direct dependencies between domains
- State changes validated before application
- Complete audit trail of all operations

### 📡 Event-Driven Architecture

- All communication through EventBus only
- Namespaced events with priority handling
- Asynchronous processing prevents blocking
- Event history for debugging

### ✅ Enterprise Validation

- Custom validation rules per domain
- Automatic input sanitization
- Type checking and range validation
- Comprehensive error messages

### 🛡️ Production-Ready Features

- Circuit breakers for resilience
- Graceful degradation modes
- Health monitoring and recovery
- Performance benchmarking

## Domain Details

### 📝 Editor State Management

```javascript
const editor = useEditorState();

// Editor only knows about content editing
await editor.setContent(content, markdown);
await editor.setCursor({ line: 10, column: 5 });
await editor.setSelection({ start: 0, end: 100 });
await editor.autoSave(); // Automatic background saving

// Editor emits events for other systems to handle
// ✅ editor:content:changed → versioning creates version
// ✅ editor:save:completed → sync queues for upload
```

### 🔐 Authentication & Session Management

```javascript
const auth = useAuthState();

// Complete authentication system
await auth.login({ email, password, otp });
await auth.updateSessionTimeout(30 * 60 * 1000); // 30 minutes
await auth.changePassword({ currentPassword, newPassword });

// Security features
const securityLog = auth.getSecurityLog(50);
const hasAdminAccess = auth.hasPermission("admin");

// Automatic session timeout and activity monitoring
auth.handleActivity(); // Called on user interaction
```

### 🏷️ Tag Management System

```javascript
const tags = useTagState();

// Advanced tag operations
const tag = await tags.createTag({
  name: "Important",
  color: "#ff0000",
  description: "High priority items",
});

await tags.assignTagsToNote(noteId, [tag.id]);
const tagNames = tags.getTagNames(tagIds); // Handles UUID filtering
const suggestions = tags.getColorSuggestions(); // Smart color recommendations

// Statistics and validation
const stats = tags.getTagStatistics();
const validation = tags.validateTagName("New Tag");
```

### 📎 Attachment Handling

```javascript
const attachments = useAttachmentState();

// File upload with validation and progress
const result = await attachments.uploadFile(file, noteId, userId, {
  maxRetries: 3,
  progressCallback: (progress) => console.log(`${progress}%`),
});

// Validation before upload
const validation = await attachments.validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
}

// Metadata and cleanup
await attachments.updateAttachmentMetadata(attachmentId, {
  description: "Important document",
});
await attachments.cleanupOrphanedAttachments(validNoteIds);
```

### 🔄 Drag & Drop Operations

```javascript
const dragDrop = useDragDropState();

// Register drop targets with validation
await dragDrop.registerDropTarget(
  "notebook-1",
  {
    type: "notebook",
    accepts: ["note", "folder"],
    rejects: ["tag"],
  },
  async ({ drag, target, position, effect }) => {
    // Handle drop operation
    return { assigned: true, notebook: target.data.id };
  }
);

// Start drag with data
const { dragId } = await dragDrop.startDrag(
  {
    type: "note",
    id: "note-123",
    title: "My Note",
  },
  "notes-list"
);

// Built-in operation handlers for common scenarios
// ✅ note-to-notebook → assigns note to notebook
// ✅ note-to-tag → adds tag to note
// ✅ note-to-note → reorders notes
```

### ⚙️ Configuration Management

```javascript
const config = useConfigState();

// Hierarchical configuration with validation
await config.set("editor.fontSize", 16, userId);
await config.updateMultiple(
  {
    "ui.theme": "dark",
    "editor.autoSave": true,
    "security.sessionTimeout": 3600,
  },
  userId
);

// User-specific settings
await config.setUserSetting(userId, "preferences.sidebarWidth", 300);
const userPrefs = config.getUserSettings(userId);

// Environment switching
await config.switchEnvironment("production", userId);

// Export/import with validation
const exported = await config.exportConfig({ format: "json" });
await config.importConfig(configData, { merge: true }, userId);
```

### 🔁 Sync & Offline Management

```javascript
const sync = useSyncState();

// Automatic sync with conflict resolution
await sync.startAutoSync({ interval: 30000 }); // 30 seconds
await sync.sync({ force: true });

// Offline queue management
await sync.queueForSync(item, "create");
await sync.processOfflineQueue(); // When connection restored

// Conflict resolution
const conflicts = sync.getPendingConflicts();
await sync.resolveConflict(conflict, "merge"); // local, remote, merge, manual

// Connection monitoring
const status = sync.getConnectionStatus();
// { isOnline: true, connectionQuality: "excellent", responseTime: 45 }
```

### 🚨 Error Recovery & Resilience

```javascript
const errorRecovery = useErrorRecoveryState();

// Circuit breaker protection
const result = await errorRecovery.executeWithCircuitBreaker(
  "database",
  async () => await saveNote(note),
  () => "Fallback: Saved locally" // Fallback when circuit open
);

// Retry with exponential backoff
const saved = await errorRecovery.retryOperation(
  async () => await uploadFile(file),
  { maxRetries: 3, baseDelay: 1000, backoffFactor: 2 }
);

// Graceful degradation
await errorRecovery.triggerDegradation("reduced", "High error rate detected");
// Automatically disables non-essential features

// Health monitoring
const health = await errorRecovery.getSystemHealth();
// { overallHealth: "healthy", criticalFailures: 0, healthResults: {...} }

// Error recording with recovery
await errorRecovery.recordError(error, {
  component: "fileUpload",
  operation: "upload",
  severity: "medium",
});
```

## React Integration Examples

### Complete Isolated Component

```javascript
import {
  useEditorState,
  useVersioningState,
  useTagState,
  useAttachmentState,
  useConfigState,
} from "./StateIsolationAdapter.jsx";

function CompleteNoteEditor({ noteId }) {
  const editor = useEditorState();
  const versioning = useVersioningState();
  const tags = useTagState();
  const attachments = useAttachmentState();
  const config = useConfigState();

  // Each system only knows its own concerns
  const fontSize = config.get("editor.fontSize", 14);
  const noteAttachments = attachments.getAttachmentsForNote(noteId);
  const versions = versioning.getVersions(noteId);
  const noteTags = tags.getTagsByIds(editor.state.tagIds || []);

  // Systems communicate only through events
  useEffect(() => {
    if (editor.state.isDirty) {
      // Auto-save triggers multiple isolated operations:
      // ✅ versioning hears "content:changed" → creates version
      // ✅ sync hears "content:changed" → queues for sync
      // ✅ UI hears "content:changed" → shows dirty indicator
    }
  }, [editor.state.isDirty]);

  return (
    <div style={{ fontSize }}>
      <textarea
        value={editor.state.markdown}
        onChange={(e) => editor.setContent(null, e.target.value)}
      />

      {/* Each component uses only its domain */}
      <TagList tags={noteTags} />
      <AttachmentList attachments={noteAttachments} />
      <VersionHistory versions={versions} />
    </div>
  );
}
```

## Advanced Features

### Event Bus with Enterprise Features

```javascript
import eventBus from "./EventBus.js";

// Priority events (0 = highest priority)
await eventBus.emit("critical:system:shutdown", data, { priority: 0 });

// Namespaced events
await eventBus.emit("auth:user:login", data);
await eventBus.emit("editor:content:changed", data);

// Event history and debugging
const recentEvents = eventBus.getEventHistory(100);
const activeListeners = eventBus.getEvents();

// Performance monitoring
const stats = eventBus.getStatistics();
// { totalEvents: 1543, averageProcessingTime: 2.3 }
```

### State Validation System

```javascript
import { validateState, createValidator } from "./StateValidator.js";

// Built-in validators
const validation = await validateState("editor", newState);
if (!validation.isValid) {
  console.error("Validation failed:", validation.errors);
}

// Custom validators
const customValidator = createValidator({
  rules: {
    fontSize: { type: "number", min: 8, max: 72 },
    theme: { type: "string", enum: ["light", "dark"] },
  },
});
```

### Performance Benchmarking

```javascript
// Automatic performance tracking in all state managers
const editorStats = editor.getStatistics();
// {
//   totalOperations: 1247,
//   averageOperationTime: 1.2,
//   slowOperations: [
//     { operation: "setContent", duration: 156, threshold: 100 }
//   ]
// }
```

## Error Handling & Resilience

### Circuit Breaker Pattern

```javascript
// Automatic circuit breakers for critical operations
const result = await errorRecovery.executeWithCircuitBreaker(
  "fileSystem",
  () => saveFile(data),
  () => "Saved to memory cache" // Fallback
);
// ✅ If file system fails 5 times → circuit opens → uses fallback
// ✅ After 60 seconds → circuit goes half-open → tries again
// ✅ If 3 successes → circuit closes → normal operation
```

### Graceful Degradation

```javascript
// Automatic degradation based on error thresholds
// When 5 critical errors occur in 5 minutes:
// ✅ "minimal" → Disables animations, auto-save
// ✅ "reduced" → Disables version history, attachments
// ✅ "emergency" → Minimal functionality only

await errorRecovery.recoverFromDegradation("System health restored");
// ✅ Re-enables all features in reverse order
```

### Health Monitoring

```javascript
// Register health checks for all systems
errorRecovery.registerHealthCheck(
  "database",
  async () => {
    const result = await testDatabaseConnection();
    if (result.responseTime > 5000) throw new Error("Database slow");
    return result;
  },
  { critical: true, interval: 30000 }
);

// Automatic system health monitoring
const health = await errorRecovery.getSystemHealth();
// Runs all health checks and determines overall system status
```

## Configuration Management

### Hierarchical Settings

```javascript
// Multi-level configuration with validation
await config.set("editor.fontSize", 16); // App level
await config.setUserSetting(userId, "fontSize", 14); // User override
await config.set("environments.production.debug", false); // Environment

// Smart configuration merging
const currentConfig = config.getEnvironmentConfig("production");
// Merges: defaults → environment → user preferences
```

### Settings Export/Import

```javascript
// Export with security filtering
const backup = await config.exportConfig({
  includeUserSettings: true,
  includeSecrets: false, // Automatic secret removal
  format: "json",
});

// Import with validation
await config.importConfig(backupData, {
  merge: true, // Merge with existing
  validateOnly: false, // Apply changes
  overwriteExisting: false,
});
```

## Testing & Debugging

### Isolated Testing

```javascript
// Each domain can be tested completely independently
import editorStateManager from "./EditorStateManager.js";

describe("EditorStateManager", () => {
  it("should handle content changes", async () => {
    await editorStateManager.setContent("new content", "# New Content");
    const state = editorStateManager.getState();
    expect(state.isDirty).toBe(true);
    expect(state.content).toBe("new content");
  });

  // No need to mock versioning, UI, or other systems!
  // Editor is completely isolated
});
```

### Debug Tools

```javascript
// Development mode debugging
if (process.env.NODE_ENV === "development") {
  // Automatic logging of all state changes
  // Event bus activity monitoring
  // Performance warnings for slow operations
  // State validation warnings
}

// State snapshots for debugging
const snapshot = stateManager.getSnapshot();
console.log("Complete app state:", snapshot);

// Event history analysis
const events = eventBus.getEventHistory(50);
console.log("Recent events:", events);
```

## Migration Guide

### From Coupled to Isolated

**Before (Tightly Coupled):**

```javascript
function NoteEditor({ noteService, versionService, tagService }) {
  const handleSave = async () => {
    const saved = await noteService.save(content);
    await versionService.createVersion(saved.id, content);
    await tagService.updateNoteTags(saved.id, tags);
    updateUI({ saved: true });
  };
}
```

**After (Perfectly Isolated):**

```javascript
function NoteEditor() {
  const editor = useEditorState();

  const handleSave = async () => {
    // Editor only handles editor concerns
    await editor.forceSave();

    // Other systems automatically respond to events:
    // ✅ versioning hears "editor:saved" → creates version
    // ✅ tags hears "editor:saved" → updates tag associations
    // ✅ UI hears "editor:saved" → shows success message
    // ✅ sync hears "editor:saved" → queues for upload
  };
}
```

## Performance Considerations

### Optimizations

- **State Updates**: Validated but optimized for production
- **Event Processing**: Asynchronous with priority queuing
- **Memory Management**: Automatic cleanup and size limits
- **Caching**: Smart caching in attachment and config systems

### Benchmarking

- All operations >100ms are automatically flagged
- Performance statistics available for each domain
- Memory usage monitoring with leak detection
- Event processing time tracking

## Production Deployment

### Environment Configuration

```javascript
// Production optimizations
await config.switchEnvironment("production");
// ✅ Disables debug logging
// ✅ Enables performance mode
// ✅ Reduces state history size
// ✅ Optimizes event processing
```

### Health Monitoring

```javascript
// Production health checks
const systemHealth = await errorRecovery.getSystemHealth();
if (systemHealth.overallHealth !== "healthy") {
  await errorRecovery.triggerDegradation("minimal", "Health check failed");
}
```

### Error Recovery

```javascript
// Automatic error recovery in production
errorRecovery.registerRecoveryStrategy("NetworkError", async (error) => {
  await sync.enableOfflineMode();
  return { success: true, resolution: "Enabled offline mode" };
});
```

## Future Enhancements

### Planned Features

- **Real-time Collaboration** - EventBus integration with WebSockets
- **State Persistence** - Automatic state saving/loading
- **Undo/Redo System** - Using state history for undo functionality
- **Performance Analytics** - Advanced monitoring and alerting
- **State Migrations** - Automatic schema migration system

### Extension Points

- Custom validation rules for new domains
- Additional recovery strategies for error handling
- New operation handlers for drag & drop
- Custom health checks for domain-specific monitoring

This state isolation system provides enterprise-grade state management with complete domain separation, making your Noet application maintainable, testable, and scalable.
