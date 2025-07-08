/**
 * StateIsolationAdapter - Integration adapter for isolated state system
 *
 * Demonstrates how to integrate the new state isolation system with existing components.
 * Shows the key principle: Editor doesn't know versioning exists, and vice versa.
 */

import React, { useState, useEffect, useCallback } from "react";
import editorStateManager from "./EditorStateManager.js";
import versioningStateManager from "./VersioningStateManager.js";
import uiStateManager from "./UIStateManager.js";
import authStateManager from "./AuthStateManager.js";
import tagStateManager from "./TagStateManager.js";
import attachmentStateManager from "./AttachmentStateManager.js";
import dragDropStateManager from "./DragDropStateManager.js";
import configStateManager from "./ConfigStateManager.js";
import syncStateManager from "./SyncStateManager.js";
import errorRecoveryStateManager from "./ErrorRecoveryStateManager.js";
import eventBus from "./EventBus.js";

/**
 * Hook for using editor state with isolation
 */
export function useEditorState() {
  const [state, setState] = useState(editorStateManager.getState());

  useEffect(() => {
    const unsubscribe = editorStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    setContent: editorStateManager.setContent.bind(editorStateManager),
    setCursor: editorStateManager.setCursor.bind(editorStateManager),
    setSelection: editorStateManager.setSelection.bind(editorStateManager),
    setActiveNote: editorStateManager.setActiveNote.bind(editorStateManager),
    loadNote: editorStateManager.loadNote.bind(editorStateManager),
    markSaved: editorStateManager.markSaved.bind(editorStateManager),
    setPreviewMode: editorStateManager.setPreviewMode.bind(editorStateManager),
    setFormatSettings:
      editorStateManager.setFormatSettings.bind(editorStateManager),
    clear: editorStateManager.clear.bind(editorStateManager),
    autoSave: editorStateManager.autoSave.bind(editorStateManager),
    forceSave: editorStateManager.forceSave.bind(editorStateManager),
    getStatistics: editorStateManager.getStatistics.bind(editorStateManager),
  };
}

/**
 * Hook for using versioning state with isolation
 */
export function useVersioningState() {
  const [state, setState] = useState(versioningStateManager.getState());

  useEffect(() => {
    const unsubscribe = versioningStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    createVersion: versioningStateManager.createVersion.bind(
      versioningStateManager
    ),
    getVersions: versioningStateManager.getVersions.bind(
      versioningStateManager
    ),
    getVersion: versioningStateManager.getVersion.bind(versioningStateManager),
    enterPreviewMode: versioningStateManager.enterPreviewMode.bind(
      versioningStateManager
    ),
    exitPreviewMode: versioningStateManager.exitPreviewMode.bind(
      versioningStateManager
    ),
    restoreVersion: versioningStateManager.restoreVersion.bind(
      versioningStateManager
    ),
    deleteVersion: versioningStateManager.deleteVersion.bind(
      versioningStateManager
    ),
    setConfig: versioningStateManager.setConfig.bind(versioningStateManager),
    clearVersions: versioningStateManager.clearVersions.bind(
      versioningStateManager
    ),
    getStatistics: versioningStateManager.getStatistics.bind(
      versioningStateManager
    ),
  };
}

/**
 * Hook for using UI state with isolation
 */
export function useUIState() {
  const [state, setState] = useState(uiStateManager.getState());

  useEffect(() => {
    const unsubscribe = uiStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    setCurrentView: uiStateManager.setCurrentView.bind(uiStateManager),
    selectNote: uiStateManager.selectNote.bind(uiStateManager),
    setSelectedNotes: uiStateManager.setSelectedNotes.bind(uiStateManager),
    toggleNoteSelection:
      uiStateManager.toggleNoteSelection.bind(uiStateManager),
    clearSelection: uiStateManager.clearSelection.bind(uiStateManager),
    setSearchQuery: uiStateManager.setSearchQuery.bind(uiStateManager),
    setSortOptions: uiStateManager.setSortOptions.bind(uiStateManager),
    toggleSidebar: uiStateManager.toggleSidebar.bind(uiStateManager),
    showModal: uiStateManager.showModal.bind(uiStateManager),
    hideModal: uiStateManager.hideModal.bind(uiStateManager),
    showNotification: uiStateManager.showNotification.bind(uiStateManager),
    hideNotification: uiStateManager.hideNotification.bind(uiStateManager),
    setProcessingState: uiStateManager.setProcessingState.bind(uiStateManager),
    toggleSettings: uiStateManager.toggleSettings.bind(uiStateManager),
    toggleVersionHistory:
      uiStateManager.toggleVersionHistory.bind(uiStateManager),
    toggleTagDialog: uiStateManager.toggleTagDialog.bind(uiStateManager),
    filterItems: uiStateManager.filterItems.bind(uiStateManager),
    getStatistics: uiStateManager.getStatistics.bind(uiStateManager),
    reset: uiStateManager.reset.bind(uiStateManager),
  };
}

/**
 * Hook for using authentication state with isolation
 */
export function useAuthState() {
  const [state, setState] = useState(authStateManager.getState());

  useEffect(() => {
    const unsubscribe = authStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    login: authStateManager.login.bind(authStateManager),
    logout: authStateManager.logout.bind(authStateManager),
    updateProfile: authStateManager.updateProfile.bind(authStateManager),
    changePassword: authStateManager.changePassword.bind(authStateManager),
    updateSessionTimeout:
      authStateManager.updateSessionTimeout.bind(authStateManager),
    hasPermission: authStateManager.hasPermission.bind(authStateManager),
    getSecurityLog: authStateManager.getSecurityLog.bind(authStateManager),
    handleActivity: authStateManager.handleActivity.bind(authStateManager),
    forceSessionTimeout:
      authStateManager.forceSessionTimeout.bind(authStateManager),
  };
}

/**
 * Hook for using tag state with isolation
 */
export function useTagState() {
  const [state, setState] = useState(tagStateManager.getState());

  useEffect(() => {
    const unsubscribe = tagStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    createTag: tagStateManager.createTag.bind(tagStateManager),
    updateTag: tagStateManager.updateTag.bind(tagStateManager),
    deleteTag: tagStateManager.deleteTag.bind(tagStateManager),
    assignTagsToNote: tagStateManager.assignTagsToNote.bind(tagStateManager),
    unassignTagsFromNote:
      tagStateManager.unassignTagsFromNote.bind(tagStateManager),
    getTag: tagStateManager.getTag.bind(tagStateManager),
    getTagsByIds: tagStateManager.getTagsByIds.bind(tagStateManager),
    getTagNames: tagStateManager.getTagNames.bind(tagStateManager),
    searchTags: tagStateManager.searchTags.bind(tagStateManager),
    getTagStatistics: tagStateManager.getTagStatistics.bind(tagStateManager),
    validateTagName: tagStateManager.validateTagName.bind(tagStateManager),
    getColorSuggestions:
      tagStateManager.getColorSuggestions.bind(tagStateManager),
    filterUUIDTags: tagStateManager.filterUUIDTags.bind(tagStateManager),
  };
}

/**
 * Hook for using attachment state with isolation
 */
export function useAttachmentState() {
  const [state, setState] = useState(attachmentStateManager.getState());

  useEffect(() => {
    const unsubscribe = attachmentStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    uploadFile: attachmentStateManager.uploadFile.bind(attachmentStateManager),
    deleteAttachment: attachmentStateManager.deleteAttachment.bind(
      attachmentStateManager
    ),
    downloadAttachment: attachmentStateManager.downloadAttachment.bind(
      attachmentStateManager
    ),
    validateFile: attachmentStateManager.validateFile.bind(
      attachmentStateManager
    ),
    getAttachmentsForNote: attachmentStateManager.getAttachmentsForNote.bind(
      attachmentStateManager
    ),
    getAttachment: attachmentStateManager.getAttachment.bind(
      attachmentStateManager
    ),
    getUploadProgress: attachmentStateManager.getUploadProgress.bind(
      attachmentStateManager
    ),
    getAttachmentStatistics:
      attachmentStateManager.getAttachmentStatistics.bind(
        attachmentStateManager
      ),
    cleanupOrphanedAttachments:
      attachmentStateManager.cleanupOrphanedAttachments.bind(
        attachmentStateManager
      ),
    updateAttachmentMetadata:
      attachmentStateManager.updateAttachmentMetadata.bind(
        attachmentStateManager
      ),
  };
}

/**
 * Hook for using drag and drop state with isolation
 */
export function useDragDropState() {
  const [state, setState] = useState(dragDropStateManager.getState());

  useEffect(() => {
    const unsubscribe = dragDropStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    startDrag: dragDropStateManager.startDrag.bind(dragDropStateManager),
    endDrag: dragDropStateManager.endDrag.bind(dragDropStateManager),
    registerDropTarget:
      dragDropStateManager.registerDropTarget.bind(dragDropStateManager),
    unregisterDropTarget:
      dragDropStateManager.unregisterDropTarget.bind(dragDropStateManager),
    handleDragOver:
      dragDropStateManager.handleDragOver.bind(dragDropStateManager),
    handleDragLeave:
      dragDropStateManager.handleDragLeave.bind(dragDropStateManager),
    executeDrop: dragDropStateManager.executeDrop.bind(dragDropStateManager),
    getValidDropTargets:
      dragDropStateManager.getValidDropTargets.bind(dragDropStateManager),
    getDragHistory:
      dragDropStateManager.getDragHistory.bind(dragDropStateManager),
    getActiveDrags:
      dragDropStateManager.getActiveDrags.bind(dragDropStateManager),
    cancelAllDrags:
      dragDropStateManager.cancelAllDrags.bind(dragDropStateManager),
    registerOperationHandler:
      dragDropStateManager.registerOperationHandler.bind(dragDropStateManager),
  };
}

/**
 * Hook for using configuration state with isolation
 */
export function useConfigState() {
  const [state, setState] = useState(configStateManager.getState());

  useEffect(() => {
    const unsubscribe = configStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    get: configStateManager.get.bind(configStateManager),
    set: configStateManager.set.bind(configStateManager),
    updateMultiple: configStateManager.updateMultiple.bind(configStateManager),
    reset: configStateManager.reset.bind(configStateManager),
    validateConfig: configStateManager.validateConfig.bind(configStateManager),
    exportConfig: configStateManager.exportConfig.bind(configStateManager),
    importConfig: configStateManager.importConfig.bind(configStateManager),
    getUserSettings:
      configStateManager.getUserSettings.bind(configStateManager),
    setUserSetting: configStateManager.setUserSetting.bind(configStateManager),
    getEnvironmentConfig:
      configStateManager.getEnvironmentConfig.bind(configStateManager),
    switchEnvironment:
      configStateManager.switchEnvironment.bind(configStateManager),
    getHistory: configStateManager.getHistory.bind(configStateManager),
    getSchema: configStateManager.getSchema.bind(configStateManager),
  };
}

/**
 * Hook for using sync state with isolation
 */
export function useSyncState() {
  const [state, setState] = useState(syncStateManager.getState());

  useEffect(() => {
    const unsubscribe = syncStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    startAutoSync: syncStateManager.startAutoSync.bind(syncStateManager),
    stopAutoSync: syncStateManager.stopAutoSync.bind(syncStateManager),
    sync: syncStateManager.sync.bind(syncStateManager),
    queueForSync: syncStateManager.queueForSync.bind(syncStateManager),
    processOfflineQueue:
      syncStateManager.processOfflineQueue.bind(syncStateManager),
    resolveConflict: syncStateManager.resolveConflict.bind(syncStateManager),
    getPendingConflicts:
      syncStateManager.getPendingConflicts.bind(syncStateManager),
    getQueueStatus: syncStateManager.getQueueStatus.bind(syncStateManager),
    getSyncHistory: syncStateManager.getSyncHistory.bind(syncStateManager),
    clearSyncHistory: syncStateManager.clearSyncHistory.bind(syncStateManager),
    getConnectionStatus:
      syncStateManager.getConnectionStatus.bind(syncStateManager),
    checkConnection: syncStateManager.checkConnection.bind(syncStateManager),
    enableOfflineMode:
      syncStateManager.enableOfflineMode.bind(syncStateManager),
    disableOfflineMode:
      syncStateManager.disableOfflineMode.bind(syncStateManager),
  };
}

/**
 * Hook for using error recovery state with isolation
 */
export function useErrorRecoveryState() {
  const [state, setState] = useState(errorRecoveryStateManager.getState());

  useEffect(() => {
    const unsubscribe = errorRecoveryStateManager.subscribe(
      ({ state: newState }) => {
        setState(newState);
      },
      { immediate: true }
    );

    return unsubscribe;
  }, []);

  return {
    state,
    recordError: errorRecoveryStateManager.recordError.bind(
      errorRecoveryStateManager
    ),
    createCircuitBreaker: errorRecoveryStateManager.createCircuitBreaker.bind(
      errorRecoveryStateManager
    ),
    executeWithCircuitBreaker:
      errorRecoveryStateManager.executeWithCircuitBreaker.bind(
        errorRecoveryStateManager
      ),
    retryOperation: errorRecoveryStateManager.retryOperation.bind(
      errorRecoveryStateManager
    ),
    registerRecoveryStrategy:
      errorRecoveryStateManager.registerRecoveryStrategy.bind(
        errorRecoveryStateManager
      ),
    triggerDegradation: errorRecoveryStateManager.triggerDegradation.bind(
      errorRecoveryStateManager
    ),
    recoverFromDegradation:
      errorRecoveryStateManager.recoverFromDegradation.bind(
        errorRecoveryStateManager
      ),
    registerHealthCheck: errorRecoveryStateManager.registerHealthCheck.bind(
      errorRecoveryStateManager
    ),
    runHealthCheck: errorRecoveryStateManager.runHealthCheck.bind(
      errorRecoveryStateManager
    ),
    getSystemHealth: errorRecoveryStateManager.getSystemHealth.bind(
      errorRecoveryStateManager
    ),
    getErrorStatistics: errorRecoveryStateManager.getErrorStatistics.bind(
      errorRecoveryStateManager
    ),
    getCircuitBreakerStatus:
      errorRecoveryStateManager.getCircuitBreakerStatus.bind(
        errorRecoveryStateManager
      ),
    resetCircuitBreaker: errorRecoveryStateManager.resetCircuitBreaker.bind(
      errorRecoveryStateManager
    ),
    clearErrorHistory: errorRecoveryStateManager.clearErrorHistory.bind(
      errorRecoveryStateManager
    ),
  };
}

/**
 * Isolated Editor Component - Only knows about editor state
 */
export function IsolatedEditorComponent({
  editorComponent: EditorComponent,
  ...props
}) {
  const editorState = useEditorState();

  // Editor only handles its own concerns
  const handleContentChange = useCallback(
    async (content, markdown) => {
      await editorState.setContent(content, markdown);
    },
    [editorState]
  );

  const handleCursorChange = useCallback(
    async (cursor) => {
      await editorState.setCursor(cursor);
    },
    [editorState]
  );

  const handleSelectionChange = useCallback(
    async (selection) => {
      await editorState.setSelection(selection);
    },
    [editorState]
  );

  // Editor doesn't know about versioning - it just emits events
  useEffect(() => {
    if (editorState.state.isDirty) {
      // Emit content change event for other systems to handle
      eventBus.emit("editor:content:changed", {
        noteId: editorState.state.activeNoteId,
        content: editorState.state.content,
        markdown: editorState.state.markdown,
      });
    }
  }, [editorState.state.isDirty, editorState.state.content]);

  return (
    <div className="isolated-editor">
      <EditorComponent
        content={editorState.state.content}
        markdown={editorState.state.markdown}
        cursor={editorState.state.cursor}
        selection={editorState.state.selection}
        isDirty={editorState.state.isDirty}
        isPreviewMode={editorState.state.isPreviewMode}
        formatSettings={editorState.state.formatSettings}
        onContentChange={handleContentChange}
        onCursorChange={handleCursorChange}
        onSelectionChange={handleSelectionChange}
        onSave={editorState.forceSave}
        {...props}
      />

      {/* Editor state indicator */}
      <div className="editor-state-indicator">
        <span
          className={`status ${editorState.state.isDirty ? "dirty" : "clean"}`}
        >
          {editorState.state.isDirty ? "Unsaved" : "Saved"}
        </span>
        {editorState.state.lastSaved && (
          <span className="last-saved">
            Last saved:{" "}
            {new Date(editorState.state.lastSaved).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Isolated Versioning Component - Only knows about versioning state
 */
export function IsolatedVersioningComponent({ noteId }) {
  const versioningState = useVersioningState();
  const versions = versioningState.getVersions(noteId);

  // Versioning doesn't know about editor - it just emits events
  const handleVersionPreview = useCallback(
    async (versionId) => {
      await versioningState.enterPreviewMode(noteId, versionId);

      // Emit event for editor to handle
      const version = versioningState.getVersion(noteId, versionId);
      eventBus.emit("version:preview:content", {
        noteId,
        versionId,
        content: version.content,
        markdown: version.markdown,
      });
    },
    [versioningState, noteId]
  );

  const handleVersionRestore = useCallback(
    async (versionId) => {
      const restoredVersion = await versioningState.restoreVersion(
        noteId,
        versionId
      );

      // Emit event for editor to handle
      eventBus.emit("version:restored:content", {
        noteId,
        content: restoredVersion.content,
        markdown: restoredVersion.markdown,
      });
    },
    [versioningState, noteId]
  );

  const handleExitPreview = useCallback(async () => {
    await versioningState.exitPreviewMode();

    // Emit event for editor to handle
    eventBus.emit("version:preview:exited", { noteId });
  }, [versioningState, noteId]);

  if (!versioningState.state.isPreviewingVersion && versions.length === 0) {
    return (
      <div className="isolated-versioning empty">
        <p>No versions available for this note.</p>
      </div>
    );
  }

  return (
    <div className="isolated-versioning">
      <div className="version-header">
        <h3>Version History</h3>
        {versioningState.state.isPreviewingVersion && (
          <button onClick={handleExitPreview} className="exit-preview-btn">
            Exit Preview
          </button>
        )}
      </div>

      <div className="version-list">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`version-item ${
              versioningState.state.previewVersionId === version.id
                ? "active"
                : ""
            }`}
          >
            <div className="version-info">
              <span className="version-number">v{version.version}</span>
              <span className="version-date">
                {new Date(version.createdAt).toLocaleString()}
              </span>
              <span className="version-description">
                {version.changeDescription}
              </span>
            </div>

            <div className="version-actions">
              <button
                onClick={() => handleVersionPreview(version.id)}
                className="preview-btn"
              >
                Preview
              </button>
              <button
                onClick={() => handleVersionRestore(version.id)}
                className="restore-btn"
              >
                Restore
              </button>
              <button
                onClick={() =>
                  versioningState.deleteVersion(noteId, version.id)
                }
                className="delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Versioning state indicator */}
      <div className="versioning-state-indicator">
        <div>Total versions: {versions.length}</div>
        {versioningState.state.isPreviewingVersion && (
          <div className="preview-indicator">
            Previewing version {versioningState.state.previewVersionId}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Cross-System Communication Bridge
 *
 * This component demonstrates how systems can communicate without direct coupling.
 * It listens to events from all systems and coordinates actions.
 */
export function StateIsolationBridge() {
  useEffect(() => {
    // Bridge editor and versioning communication
    const unsubscribeEditor = eventBus.on(
      "editor:content:changed",
      async (data) => {
        // Only versioning system handles this - editor doesn't know about versioning
        console.log(
          "🌉 Bridge: Editor content changed, versioning system will handle versioning"
        );
      }
    );

    const unsubscribeVersionPreview = eventBus.on(
      "version:preview:content",
      async (data) => {
        // Only editor system handles this - versioning doesn't know about editor internals
        console.log(
          "🌉 Bridge: Version preview requested, editor system will handle display"
        );
      }
    );

    const unsubscribeVersionRestore = eventBus.on(
      "version:restored:content",
      async (data) => {
        // Only editor system handles this - versioning doesn't know about editor internals
        console.log(
          "🌉 Bridge: Version restored, editor system will handle content update"
        );
      }
    );

    // Bridge UI and other systems
    const unsubscribeNoteSelection = eventBus.on(
      "ui:note:selected",
      async (data) => {
        console.log(
          "🌉 Bridge: Note selected in UI, other systems will handle their concerns"
        );
      }
    );

    return () => {
      unsubscribeEditor();
      unsubscribeVersionPreview();
      unsubscribeVersionRestore();
      unsubscribeNoteSelection();
    };
  }, []);

  return null; // This is a communication bridge, no UI
}

/**
 * Complete Isolated App Component
 *
 * Demonstrates how to compose isolated components together.
 */
export function IsolatedNoetApp({
  editorComponent,
  sidebarComponent,
  notesListComponent,
}) {
  const uiState = useUIState();

  return (
    <div className="isolated-noet-app">
      {/* State isolation bridge for cross-system communication */}
      <StateIsolationBridge />

      {/* UI notifications */}
      <div className="notifications">
        {uiState.state.notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification ${notification.type}`}
            onClick={() => uiState.hideNotification(notification.id)}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Processing indicator */}
      {uiState.state.isProcessing && (
        <div className="processing-indicator">
          <div className="spinner" />
          <span>{uiState.state.processingStatus || "Processing..."}</span>
        </div>
      )}

      {/* Main layout */}
      <div className="app-layout">
        {/* Sidebar - isolated UI component */}
        <div
          className={`sidebar ${
            uiState.state.sidebarCollapsed ? "collapsed" : ""
          }`}
        >
          {sidebarComponent}
        </div>

        {/* Notes list - isolated UI component */}
        <div className="notes-list">{notesListComponent}</div>

        {/* Main content area */}
        <div className="main-content">
          {/* Editor - isolated editor component */}
          <IsolatedEditorComponent editorComponent={editorComponent} />

          {/* Version history - isolated versioning component */}
          {uiState.state.showVersionHistory && (
            <IsolatedVersioningComponent
              noteId={uiState.state.selectedNoteId}
            />
          )}
        </div>
      </div>

      {/* Debug panel in development */}
      {process.env.NODE_ENV === "development" && <StateDebugPanel />}
    </div>
  );
}

/**
 * Debug panel for development - shows state isolation in action
 */
function StateDebugPanel() {
  const editorState = useEditorState();
  const versioningState = useVersioningState();
  const uiState = useUIState();

  const [showDebug, setShowDebug] = useState(false);

  if (!showDebug) {
    return (
      <button className="debug-toggle" onClick={() => setShowDebug(true)}>
        Show State Debug
      </button>
    );
  }

  return (
    <div className="state-debug-panel">
      <div className="debug-header">
        <h3>State Isolation Debug Panel</h3>
        <button onClick={() => setShowDebug(false)}>×</button>
      </div>

      <div className="debug-content">
        <div className="debug-section">
          <h4>📝 Editor State (Isolated)</h4>
          <pre>{JSON.stringify(editorState.getStatistics(), null, 2)}</pre>
        </div>

        <div className="debug-section">
          <h4>📚 Versioning State (Isolated)</h4>
          <pre>{JSON.stringify(versioningState.getStatistics(), null, 2)}</pre>
        </div>

        <div className="debug-section">
          <h4>🎨 UI State (Isolated)</h4>
          <pre>{JSON.stringify(uiState.getStatistics(), null, 2)}</pre>
        </div>

        <div className="debug-section">
          <h4>📡 Event Bus</h4>
          <div>
            <p>Active Events: {eventBus.getEvents().length}</p>
            <p>Recent Events: {eventBus.getEventHistory(5).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IsolatedNoetApp;
