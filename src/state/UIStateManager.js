/**
 * UIStateManager - Isolated state management for UI functionality
 *
 * Handles UI state without knowing about editor or versioning internals.
 * Communicates only through EventBus events.
 */

import eventBus from "./EventBus.js";
import stateManager, { STATE_DOMAINS } from "./StateManager.js";

class UIStateManager {
  constructor() {
    this.domain = STATE_DOMAINS.UI;
    this.eventBus = eventBus.namespace("ui");
    this.debugMode = process.env.NODE_ENV === "development";

    // Set up event listeners
    this._setupEventListeners();

    if (this.debugMode) {
      console.log("🎨 UIStateManager: Initialized");
    }
  }

  /**
   * Get current UI state
   * @param {string} key - Optional specific key
   */
  getState(key = null) {
    return stateManager.getState(this.domain, key);
  }

  /**
   * Set current view
   * @param {string} view - View name
   * @param {Object} params - View parameters
   */
  async setCurrentView(view, params = {}) {
    const currentState = this.getState();

    if (currentState.currentView === view) {
      return; // No change
    }

    await stateManager.setState(
      this.domain,
      {
        currentView: view,
        currentViewParams: params,
      },
      {
        source: "UIStateManager.setCurrentView",
      }
    );

    await this.eventBus.emit("view:changed", {
      view,
      params,
      previousView: currentState.currentView,
    });

    if (this.debugMode) {
      console.log("🎨 UIStateManager: View changed", {
        from: currentState.currentView,
        to: view,
        params,
      });
    }
  }

  /**
   * Select a note
   * @param {string} noteId - Note ID
   */
  async selectNote(noteId) {
    const currentState = this.getState();

    if (currentState.selectedNoteId === noteId) {
      return; // No change
    }

    await stateManager.setState(
      this.domain,
      {
        selectedNoteId: noteId,
      },
      {
        source: "UIStateManager.selectNote",
      }
    );

    await this.eventBus.emit("note:selected", {
      noteId,
      previousNoteId: currentState.selectedNoteId,
    });

    if (this.debugMode) {
      console.log("🎨 UIStateManager: Note selected", {
        from: currentState.selectedNoteId,
        to: noteId,
      });
    }
  }

  /**
   * Set selected notes (for bulk operations)
   * @param {Set} selectedNotes - Set of selected note IDs
   */
  async setSelectedNotes(selectedNotes) {
    await stateManager.setState(
      this.domain,
      {
        selectedNotes: new Set(selectedNotes),
      },
      {
        source: "UIStateManager.setSelectedNotes",
      }
    );

    await this.eventBus.emit("notes:selection:changed", {
      selectedNotes: Array.from(selectedNotes),
      count: selectedNotes.size,
    });
  }

  /**
   * Toggle note selection
   * @param {string} noteId - Note ID
   */
  async toggleNoteSelection(noteId) {
    const currentState = this.getState();
    const selectedNotes = new Set(currentState.selectedNotes);

    if (selectedNotes.has(noteId)) {
      selectedNotes.delete(noteId);
    } else {
      selectedNotes.add(noteId);
    }

    await this.setSelectedNotes(selectedNotes);
  }

  /**
   * Clear all note selections
   */
  async clearSelection() {
    await this.setSelectedNotes(new Set());
  }

  /**
   * Set search query
   * @param {string} query - Search query
   */
  async setSearchQuery(query) {
    await stateManager.setState(
      this.domain,
      {
        searchQuery: query,
      },
      {
        source: "UIStateManager.setSearchQuery",
      }
    );

    await this.eventBus.emit("search:query:changed", { query });
  }

  /**
   * Set sort options
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order ('asc' or 'desc')
   */
  async setSortOptions(sortBy, sortOrder = "desc") {
    await stateManager.setState(
      this.domain,
      {
        sortBy,
        sortOrder,
      },
      {
        source: "UIStateManager.setSortOptions",
      }
    );

    await this.eventBus.emit("sort:changed", { sortBy, sortOrder });
  }

  /**
   * Toggle sidebar collapse
   */
  async toggleSidebar() {
    const currentState = this.getState();
    const collapsed = !currentState.sidebarCollapsed;

    await stateManager.setState(
      this.domain,
      {
        sidebarCollapsed: collapsed,
      },
      {
        source: "UIStateManager.toggleSidebar",
      }
    );

    await this.eventBus.emit("sidebar:toggled", { collapsed });
  }

  /**
   * Show modal
   * @param {string} modalId - Modal ID
   * @param {Object} modalData - Modal data
   */
  async showModal(modalId, modalData = {}) {
    const currentState = this.getState();

    await stateManager.setState(
      this.domain,
      {
        modals: {
          ...currentState.modals,
          [modalId]: {
            isOpen: true,
            data: modalData,
            timestamp: Date.now(),
          },
        },
      },
      {
        source: "UIStateManager.showModal",
      }
    );

    await this.eventBus.emit("modal:opened", { modalId, modalData });
  }

  /**
   * Hide modal
   * @param {string} modalId - Modal ID
   */
  async hideModal(modalId) {
    const currentState = this.getState();
    const modals = { ...currentState.modals };

    if (modals[modalId]) {
      modals[modalId] = { ...modals[modalId], isOpen: false };
    }

    await stateManager.setState(
      this.domain,
      {
        modals,
      },
      {
        source: "UIStateManager.hideModal",
      }
    );

    await this.eventBus.emit("modal:closed", { modalId });
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} duration - Duration in milliseconds
   */
  async showNotification(message, type = "info", duration = 5000) {
    const currentState = this.getState();
    const notification = {
      id: this._generateId(),
      message,
      type,
      timestamp: Date.now(),
      duration,
    };

    await stateManager.setState(
      this.domain,
      {
        notifications: [...currentState.notifications, notification],
      },
      {
        source: "UIStateManager.showNotification",
      }
    );

    await this.eventBus.emit("notification:added", notification);

    // Auto-hide notification after duration
    if (duration > 0) {
      setTimeout(() => {
        this.hideNotification(notification.id);
      }, duration);
    }
  }

  /**
   * Hide notification
   * @param {string} notificationId - Notification ID
   */
  async hideNotification(notificationId) {
    const currentState = this.getState();

    await stateManager.setState(
      this.domain,
      {
        notifications: currentState.notifications.filter(
          (n) => n.id !== notificationId
        ),
      },
      {
        source: "UIStateManager.hideNotification",
      }
    );

    await this.eventBus.emit("notification:removed", { notificationId });
  }

  /**
   * Set processing state
   * @param {boolean} isProcessing - Whether processing
   * @param {string} status - Processing status message
   */
  async setProcessingState(isProcessing, status = null) {
    await stateManager.setState(
      this.domain,
      {
        isProcessing,
        processingStatus: status,
      },
      {
        source: "UIStateManager.setProcessingState",
      }
    );

    await this.eventBus.emit("processing:changed", { isProcessing, status });
  }

  /**
   * Show/hide settings
   * @param {boolean} show - Whether to show settings
   */
  async toggleSettings(show = null) {
    const currentState = this.getState();
    const showSettings = show !== null ? show : !currentState.showSettings;

    await stateManager.setState(
      this.domain,
      {
        showSettings,
      },
      {
        source: "UIStateManager.toggleSettings",
      }
    );

    await this.eventBus.emit("settings:toggled", { showSettings });
  }

  /**
   * Show/hide version history
   * @param {boolean} show - Whether to show version history
   */
  async toggleVersionHistory(show = null) {
    const currentState = this.getState();
    const showVersionHistory =
      show !== null ? show : !currentState.showVersionHistory;

    await stateManager.setState(
      this.domain,
      {
        showVersionHistory,
      },
      {
        source: "UIStateManager.toggleVersionHistory",
      }
    );

    await this.eventBus.emit("version-history:toggled", { showVersionHistory });
  }

  /**
   * Show/hide tag dialog
   * @param {boolean} show - Whether to show tag dialog
   */
  async toggleTagDialog(show = null) {
    const currentState = this.getState();
    const showTagDialog = show !== null ? show : !currentState.showTagDialog;

    await stateManager.setState(
      this.domain,
      {
        showTagDialog,
      },
      {
        source: "UIStateManager.toggleTagDialog",
      }
    );

    await this.eventBus.emit("tag-dialog:toggled", { showTagDialog });
  }

  /**
   * Get UI statistics
   */
  getStatistics() {
    const state = this.getState();

    return {
      currentView: state.currentView,
      selectedNoteId: state.selectedNoteId,
      selectedNotesCount: state.selectedNotes.size,
      searchQuery: state.searchQuery,
      notificationCount: state.notifications.length,
      activeModalCount: Object.values(state.modals).filter((m) => m.isOpen)
        .length,
      isProcessing: state.isProcessing,
      sidebarCollapsed: state.sidebarCollapsed,
      showSettings: state.showSettings,
      showVersionHistory: state.showVersionHistory,
      showTagDialog: state.showTagDialog,
    };
  }

  /**
   * Subscribe to UI state changes
   * @param {Function} callback - Callback function
   * @param {Object} options - Options
   */
  subscribe(callback, options = {}) {
    return stateManager.subscribe(this.domain, callback, options);
  }

  /**
   * Reset UI state to defaults
   */
  async reset() {
    await stateManager.resetState(this.domain);
    await this.eventBus.emit("reset");
  }

  /**
   * Get filtered items based on current UI state
   * @param {Array} items - Items to filter
   * @param {Function} filterFn - Custom filter function
   */
  filterItems(items, filterFn = null) {
    const state = this.getState();
    let filtered = [...items];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply custom filter
    if (filterFn) {
      filtered = filtered.filter(filterFn);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[state.sortBy];
      const bValue = b[state.sortBy];

      if (state.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }

  // Private methods

  _setupEventListeners() {
    // Listen for external events that affect UI state

    // When notes are loaded, clear selection
    eventBus.on("notes:loaded", async () => {
      await this.clearSelection();
    });

    // When a note is deleted, update selection
    eventBus.on("note:deleted", async (data) => {
      const currentState = this.getState();

      // Remove from selection if selected
      if (currentState.selectedNotes.has(data.noteId)) {
        await this.toggleNoteSelection(data.noteId);
      }

      // Clear selected note if it was the deleted one
      if (currentState.selectedNoteId === data.noteId) {
        await this.selectNote(null);
      }
    });

    // When processing starts/stops externally
    eventBus.on("processing:started", async (data) => {
      await this.setProcessingState(true, data.status);
    });

    eventBus.on("processing:completed", async () => {
      await this.setProcessingState(false);
    });

    // When errors occur, show notifications
    eventBus.on("error:occurred", async (data) => {
      await this.showNotification(data.message, "error");
    });

    // When successes occur, show notifications
    eventBus.on("success:occurred", async (data) => {
      await this.showNotification(data.message, "success");
    });

    // When warnings occur, show notifications
    eventBus.on("warning:occurred", async (data) => {
      await this.showNotification(data.message, "warning");
    });
  }

  _generateId() {
    return `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create and export singleton instance
const uiStateManager = new UIStateManager();
export default uiStateManager;
