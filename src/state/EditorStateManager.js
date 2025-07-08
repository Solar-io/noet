/**
 * EditorStateManager - Isolated state management for editor functionality
 *
 * Handles editor state without knowing about versioning or other systems.
 * Communicates only through EventBus events.
 */

import eventBus from "./EventBus.js";
import stateManager, { STATE_DOMAINS } from "./StateManager.js";

class EditorStateManager {
  constructor() {
    this.domain = STATE_DOMAINS.EDITOR;
    this.eventBus = eventBus.namespace("editor");
    this.debugMode = process.env.NODE_ENV === "development";

    // Set up event listeners
    this._setupEventListeners();

    if (this.debugMode) {
      console.log("📝 EditorStateManager: Initialized");
    }
  }

  /**
   * Get current editor state
   * @param {string} key - Optional specific key
   */
  getState(key = null) {
    return stateManager.getState(this.domain, key);
  }

  /**
   * Set editor content
   * @param {*} content - Editor content (TipTap JSON or other format)
   * @param {string} markdown - Markdown representation
   * @param {Object} options - Options
   */
  async setContent(content, markdown = "", options = {}) {
    const currentState = this.getState();

    // Only update if content actually changed
    if (
      currentState.content === content &&
      currentState.markdown === markdown
    ) {
      return;
    }

    await stateManager.setState(
      this.domain,
      {
        content,
        markdown,
        isDirty: true,
        lastModified: Date.now(),
      },
      {
        source: "EditorStateManager.setContent",
        ...options,
      }
    );

    // Emit content change event
    await this.eventBus.emit("content:changed", {
      content,
      markdown,
      activeNoteId: currentState.activeNoteId,
      timestamp: Date.now(),
    });

    if (this.debugMode) {
      console.log("📝 EditorStateManager: Content updated", {
        contentLength: content?.length || 0,
        markdownLength: markdown.length,
        isDirty: true,
      });
    }
  }

  /**
   * Set cursor position
   * @param {Object} cursor - Cursor position {line, column}
   */
  async setCursor(cursor) {
    if (
      !cursor ||
      typeof cursor.line !== "number" ||
      typeof cursor.column !== "number"
    ) {
      throw new Error("EditorStateManager: Invalid cursor position");
    }

    await stateManager.setState(
      this.domain,
      {
        cursor: { line: cursor.line, column: cursor.column },
      },
      {
        source: "EditorStateManager.setCursor",
      }
    );

    await this.eventBus.emit("cursor:changed", cursor);
  }

  /**
   * Set text selection
   * @param {Object} selection - Selection information
   */
  async setSelection(selection) {
    await stateManager.setState(
      this.domain,
      {
        selection,
      },
      {
        source: "EditorStateManager.setSelection",
      }
    );

    await this.eventBus.emit("selection:changed", selection);
  }

  /**
   * Set editor instance reference
   * @param {Object} editorInstance - Editor instance
   */
  async setEditorInstance(editorInstance) {
    await stateManager.setState(
      this.domain,
      {
        editorInstance,
      },
      {
        source: "EditorStateManager.setEditorInstance",
      }
    );

    await this.eventBus.emit("instance:ready", { editorInstance });
  }

  /**
   * Set active note ID
   * @param {string} noteId - Note ID
   */
  async setActiveNote(noteId) {
    const currentState = this.getState();

    if (currentState.activeNoteId === noteId) {
      return; // No change
    }

    // Save current state if dirty
    if (currentState.isDirty && currentState.activeNoteId) {
      await this.eventBus.emit("save:requested", {
        noteId: currentState.activeNoteId,
        content: currentState.content,
        markdown: currentState.markdown,
        reason: "note_switch",
      });
    }

    await stateManager.setState(
      this.domain,
      {
        activeNoteId: noteId,
        isDirty: false,
        content: null,
        markdown: "",
        selection: null,
        cursor: { line: 0, column: 0 },
      },
      {
        source: "EditorStateManager.setActiveNote",
      }
    );

    await this.eventBus.emit("note:activated", {
      noteId,
      previousNoteId: currentState.activeNoteId,
    });

    if (this.debugMode) {
      console.log("📝 EditorStateManager: Active note changed", {
        from: currentState.activeNoteId,
        to: noteId,
      });
    }
  }

  /**
   * Load note content into editor
   * @param {string} noteId - Note ID
   * @param {*} content - Note content
   * @param {string} markdown - Markdown content
   */
  async loadNote(noteId, content, markdown = "") {
    await stateManager.setState(
      this.domain,
      {
        activeNoteId: noteId,
        content,
        markdown,
        isDirty: false,
        lastSaved: Date.now(),
        isPreviewMode: false,
      },
      {
        source: "EditorStateManager.loadNote",
      }
    );

    await this.eventBus.emit("note:loaded", {
      noteId,
      content,
      markdown,
    });

    if (this.debugMode) {
      console.log("📝 EditorStateManager: Note loaded", {
        noteId,
        contentLength: content?.length || 0,
      });
    }
  }

  /**
   * Mark content as saved
   */
  async markSaved() {
    await stateManager.setState(
      this.domain,
      {
        isDirty: false,
        lastSaved: Date.now(),
      },
      {
        source: "EditorStateManager.markSaved",
      }
    );

    await this.eventBus.emit("save:completed", {
      timestamp: Date.now(),
    });
  }

  /**
   * Set preview mode
   * @param {boolean} isPreviewMode - Whether in preview mode
   */
  async setPreviewMode(isPreviewMode) {
    await stateManager.setState(
      this.domain,
      {
        isPreviewMode,
      },
      {
        source: "EditorStateManager.setPreviewMode",
      }
    );

    await this.eventBus.emit("preview:changed", { isPreviewMode });
  }

  /**
   * Update format settings
   * @param {Object} formatSettings - Format settings
   */
  async setFormatSettings(formatSettings) {
    const currentSettings = this.getState("formatSettings");

    await stateManager.setState(
      this.domain,
      {
        formatSettings: { ...currentSettings, ...formatSettings },
      },
      {
        source: "EditorStateManager.setFormatSettings",
      }
    );

    await this.eventBus.emit("format:changed", formatSettings);
  }

  /**
   * Clear editor state
   */
  async clear() {
    await stateManager.setState(
      this.domain,
      {
        content: null,
        markdown: "",
        selection: null,
        cursor: { line: 0, column: 0 },
        isDirty: false,
        isPreviewMode: false,
        activeNoteId: null,
        lastSaved: null,
      },
      {
        source: "EditorStateManager.clear",
      }
    );

    await this.eventBus.emit("cleared");
  }

  /**
   * Get editor statistics
   */
  getStatistics() {
    const state = this.getState();
    const markdown = state.markdown || "";

    return {
      characterCount: markdown.length,
      wordCount: markdown.trim().split(/\s+/).length,
      lineCount: markdown.split("\n").length,
      isDirty: state.isDirty,
      hasContent: !!state.content,
      lastSaved: state.lastSaved,
      activeNoteId: state.activeNoteId,
    };
  }

  /**
   * Subscribe to editor state changes
   * @param {Function} callback - Callback function
   * @param {Object} options - Options
   */
  subscribe(callback, options = {}) {
    return stateManager.subscribe(this.domain, callback, options);
  }

  /**
   * Auto-save content if dirty
   */
  async autoSave() {
    const state = this.getState();

    if (state.isDirty && state.activeNoteId && state.content) {
      await this.eventBus.emit("save:requested", {
        noteId: state.activeNoteId,
        content: state.content,
        markdown: state.markdown,
        reason: "auto_save",
      });
    }
  }

  /**
   * Force save current content
   */
  async forceSave() {
    const state = this.getState();

    if (state.activeNoteId && state.content) {
      await this.eventBus.emit("save:requested", {
        noteId: state.activeNoteId,
        content: state.content,
        markdown: state.markdown,
        reason: "force_save",
      });
    }
  }

  // Private methods

  _setupEventListeners() {
    // Listen for external events that affect editor state

    // When a note is selected externally
    eventBus.on("note:selected", async (data) => {
      await this.setActiveNote(data.noteId);
    });

    // When note content is loaded externally
    eventBus.on("note:content:loaded", async (data) => {
      await this.loadNote(data.noteId, data.content, data.markdown);
    });

    // When preview mode is toggled externally
    eventBus.on("preview:toggle", async (data) => {
      await this.setPreviewMode(data.isPreviewMode);
    });

    // When editor needs to be cleared externally
    eventBus.on("editor:clear", async () => {
      await this.clear();
    });

    // When format settings are changed externally
    eventBus.on("format:update", async (data) => {
      await this.setFormatSettings(data.formatSettings);
    });

    // Listen for save confirmations
    eventBus.on("save:confirmed", async (data) => {
      if (data.noteId === this.getState("activeNoteId")) {
        await this.markSaved();
      }
    });

    // Set up auto-save timer
    this._setupAutoSave();
  }

  _setupAutoSave() {
    // Auto-save every 10 seconds if content is dirty
    setInterval(() => {
      this.autoSave();
    }, 10000);

    // Save on window beforeunload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.forceSave();
      });
    }
  }
}

// Create and export singleton instance
const editorStateManager = new EditorStateManager();
export default editorStateManager;
