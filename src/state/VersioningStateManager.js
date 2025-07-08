/**
 * VersioningStateManager - Isolated state management for versioning functionality
 *
 * Handles versioning state without knowing about editor internals.
 * Communicates only through EventBus events.
 */

import eventBus from "./EventBus.js";
import stateManager, { STATE_DOMAINS } from "./StateManager.js";

class VersioningStateManager {
  constructor() {
    this.domain = STATE_DOMAINS.VERSIONING;
    this.eventBus = eventBus.namespace("versioning");
    this.debugMode = process.env.NODE_ENV === "development";

    // Set up event listeners
    this._setupEventListeners();

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Initialized");
    }
  }

  /**
   * Get current versioning state
   * @param {string} key - Optional specific key
   */
  getState(key = null) {
    return stateManager.getState(this.domain, key);
  }

  /**
   * Create a new version for a note
   * @param {string} noteId - Note ID
   * @param {*} content - Note content
   * @param {string} markdown - Markdown content
   * @param {Object} metadata - Version metadata
   */
  async createVersion(noteId, content, markdown, metadata = {}) {
    const currentState = this.getState();
    const noteVersions = currentState.versions[noteId] || [];

    // Check if auto-versioning is enabled
    if (!currentState.autoVersioning) {
      if (this.debugMode) {
        console.log(
          "📚 VersioningStateManager: Auto-versioning disabled, skipping version creation"
        );
      }
      return null;
    }

    // Create version object
    const version = {
      id: this._generateVersionId(),
      version: noteVersions.length + 1,
      content,
      markdown,
      metadata: {
        title: metadata.title || "Untitled",
        tags: metadata.tags || [],
        notebook: metadata.notebook || null,
        folder: metadata.folder || null,
        ...metadata,
      },
      createdAt: Date.now(),
      size: markdown.length,
      changeDescription: this._generateChangeDescription(
        noteVersions,
        markdown
      ),
      checksum: this._calculateChecksum(content, markdown),
    };

    // Add version to the list
    const updatedVersions = [...noteVersions, version];

    // Apply max versions limit
    if (updatedVersions.length > currentState.maxVersions) {
      const versionsToRemove = updatedVersions.splice(
        0,
        updatedVersions.length - currentState.maxVersions
      );

      // Emit event for removed versions
      await this.eventBus.emit("versions:removed", {
        noteId,
        removedVersions: versionsToRemove,
      });
    }

    // Update state
    await stateManager.setState(
      this.domain,
      {
        versions: {
          ...currentState.versions,
          [noteId]: updatedVersions,
        },
        versionHistory: [
          ...currentState.versionHistory,
          {
            noteId,
            versionId: version.id,
            action: "created",
            timestamp: Date.now(),
          },
        ].slice(-100), // Keep last 100 history entries
        lastVersionedNoteId: noteId,
      },
      {
        source: "VersioningStateManager.createVersion",
      }
    );

    // Emit version created event
    await this.eventBus.emit("version:created", {
      noteId,
      version,
      versionCount: updatedVersions.length,
    });

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Version created", {
        noteId,
        versionId: version.id,
        versionNumber: version.version,
        size: version.size,
      });
    }

    return version;
  }

  /**
   * Get versions for a note
   * @param {string} noteId - Note ID
   */
  getVersions(noteId) {
    const currentState = this.getState();
    return currentState.versions[noteId] || [];
  }

  /**
   * Get a specific version
   * @param {string} noteId - Note ID
   * @param {string} versionId - Version ID
   */
  getVersion(noteId, versionId) {
    const versions = this.getVersions(noteId);
    return versions.find((v) => v.id === versionId);
  }

  /**
   * Enter version preview mode
   * @param {string} noteId - Note ID
   * @param {string} versionId - Version ID
   */
  async enterPreviewMode(noteId, versionId) {
    const version = this.getVersion(noteId, versionId);
    if (!version) {
      throw new Error(
        `VersioningStateManager: Version ${versionId} not found for note ${noteId}`
      );
    }

    await stateManager.setState(
      this.domain,
      {
        isPreviewingVersion: true,
        previewVersionId: versionId,
        activeVersionId: versionId,
      },
      {
        source: "VersioningStateManager.enterPreviewMode",
      }
    );

    // Emit preview mode event
    await this.eventBus.emit("preview:entered", {
      noteId,
      versionId,
      version,
    });

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Entered preview mode", {
        noteId,
        versionId,
        versionNumber: version.version,
      });
    }
  }

  /**
   * Exit version preview mode
   */
  async exitPreviewMode() {
    const currentState = this.getState();

    if (!currentState.isPreviewingVersion) {
      return; // Already not in preview mode
    }

    await stateManager.setState(
      this.domain,
      {
        isPreviewingVersion: false,
        previewVersionId: null,
        activeVersionId: null,
      },
      {
        source: "VersioningStateManager.exitPreviewMode",
      }
    );

    // Emit preview mode exit event
    await this.eventBus.emit("preview:exited", {
      previousVersionId: currentState.previewVersionId,
    });

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Exited preview mode");
    }
  }

  /**
   * Restore a version as the current version
   * @param {string} noteId - Note ID
   * @param {string} versionId - Version ID
   */
  async restoreVersion(noteId, versionId) {
    const version = this.getVersion(noteId, versionId);
    if (!version) {
      throw new Error(
        `VersioningStateManager: Version ${versionId} not found for note ${noteId}`
      );
    }

    // Exit preview mode first
    await this.exitPreviewMode();

    // Create a new version with the restored content
    const restoredVersion = await this.createVersion(
      noteId,
      version.content,
      version.markdown,
      {
        ...version.metadata,
        restoredFrom: versionId,
        restoredAt: Date.now(),
      }
    );

    // Emit restore event
    await this.eventBus.emit("version:restored", {
      noteId,
      originalVersionId: versionId,
      newVersionId: restoredVersion.id,
      restoredVersion,
    });

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Version restored", {
        noteId,
        from: versionId,
        to: restoredVersion.id,
      });
    }

    return restoredVersion;
  }

  /**
   * Delete a version
   * @param {string} noteId - Note ID
   * @param {string} versionId - Version ID
   */
  async deleteVersion(noteId, versionId) {
    const currentState = this.getState();
    const versions = currentState.versions[noteId] || [];

    const versionIndex = versions.findIndex((v) => v.id === versionId);
    if (versionIndex === -1) {
      throw new Error(
        `VersioningStateManager: Version ${versionId} not found for note ${noteId}`
      );
    }

    const deletedVersion = versions[versionIndex];
    const updatedVersions = versions.filter((v) => v.id !== versionId);

    // Update state
    await stateManager.setState(
      this.domain,
      {
        versions: {
          ...currentState.versions,
          [noteId]: updatedVersions,
        },
        versionHistory: [
          ...currentState.versionHistory,
          {
            noteId,
            versionId,
            action: "deleted",
            timestamp: Date.now(),
          },
        ].slice(-100),
      },
      {
        source: "VersioningStateManager.deleteVersion",
      }
    );

    // Exit preview mode if we were previewing the deleted version
    if (currentState.previewVersionId === versionId) {
      await this.exitPreviewMode();
    }

    // Emit version deleted event
    await this.eventBus.emit("version:deleted", {
      noteId,
      versionId,
      deletedVersion,
      remainingCount: updatedVersions.length,
    });

    if (this.debugMode) {
      console.log("📚 VersioningStateManager: Version deleted", {
        noteId,
        versionId,
        remainingVersions: updatedVersions.length,
      });
    }
  }

  /**
   * Set versioning configuration
   * @param {Object} config - Configuration object
   */
  async setConfig(config) {
    const currentState = this.getState();

    await stateManager.setState(
      this.domain,
      {
        maxVersions: config.maxVersions || currentState.maxVersions,
        autoVersioning:
          config.autoVersioning !== undefined
            ? config.autoVersioning
            : currentState.autoVersioning,
      },
      {
        source: "VersioningStateManager.setConfig",
      }
    );

    await this.eventBus.emit("config:updated", config);
  }

  /**
   * Get versioning statistics
   */
  getStatistics() {
    const currentState = this.getState();
    const versions = currentState.versions;

    let totalVersions = 0;
    let totalSize = 0;
    const noteStats = {};

    for (const [noteId, noteVersions] of Object.entries(versions)) {
      totalVersions += noteVersions.length;
      const noteSize = noteVersions.reduce((sum, v) => sum + v.size, 0);
      totalSize += noteSize;

      noteStats[noteId] = {
        versionCount: noteVersions.length,
        totalSize: noteSize,
        latestVersion: noteVersions[noteVersions.length - 1],
      };
    }

    return {
      totalVersions,
      totalSize,
      noteCount: Object.keys(versions).length,
      averageVersionsPerNote:
        totalVersions / Math.max(Object.keys(versions).length, 1),
      isPreviewingVersion: currentState.isPreviewingVersion,
      previewVersionId: currentState.previewVersionId,
      autoVersioning: currentState.autoVersioning,
      maxVersions: currentState.maxVersions,
      noteStats,
    };
  }

  /**
   * Subscribe to versioning state changes
   * @param {Function} callback - Callback function
   * @param {Object} options - Options
   */
  subscribe(callback, options = {}) {
    return stateManager.subscribe(this.domain, callback, options);
  }

  /**
   * Clear all versions for a note
   * @param {string} noteId - Note ID
   */
  async clearVersions(noteId) {
    const currentState = this.getState();
    const versions = { ...currentState.versions };
    delete versions[noteId];

    await stateManager.setState(
      this.domain,
      {
        versions,
        versionHistory: [
          ...currentState.versionHistory,
          {
            noteId,
            action: "cleared",
            timestamp: Date.now(),
          },
        ].slice(-100),
      },
      {
        source: "VersioningStateManager.clearVersions",
      }
    );

    await this.eventBus.emit("versions:cleared", { noteId });
  }

  // Private methods

  _setupEventListeners() {
    // Listen for save events to create versions
    eventBus.on("editor:save:requested", async (data) => {
      const { noteId, content, markdown, reason } = data;

      // Create version for significant changes
      if (reason === "note_switch" || reason === "manual_save") {
        await this.createVersion(noteId, content, markdown);
      }
    });

    // Listen for content changes to potentially create versions
    eventBus.on("editor:content:changed", async (data) => {
      const { noteId, content, markdown } = data;

      // Throttle version creation to avoid too many versions
      if (this._shouldCreateVersion(noteId, content, markdown)) {
        await this._throttledCreateVersion(noteId, content, markdown);
      }
    });

    // Listen for note deletion to clear versions
    eventBus.on("note:deleted", async (data) => {
      await this.clearVersions(data.noteId);
    });

    // Listen for version preview requests
    eventBus.on("version:preview:requested", async (data) => {
      await this.enterPreviewMode(data.noteId, data.versionId);
    });

    // Listen for version restore requests
    eventBus.on("version:restore:requested", async (data) => {
      await this.restoreVersion(data.noteId, data.versionId);
    });
  }

  _shouldCreateVersion(noteId, content, markdown) {
    const currentState = this.getState();
    const versions = currentState.versions[noteId] || [];

    if (versions.length === 0) {
      return true; // First version
    }

    const lastVersion = versions[versions.length - 1];
    const timeDiff = Date.now() - lastVersion.createdAt;
    const sizeDiff = Math.abs(markdown.length - lastVersion.size);

    // Create version if significant time has passed or content has changed significantly
    return timeDiff > 300000 || sizeDiff > lastVersion.size * 0.1; // 5 minutes or 10% change
  }

  _throttledCreateVersion = this._throttle(
    async (noteId, content, markdown) => {
      await this.createVersion(noteId, content, markdown);
    },
    60000
  ); // Throttle to once per minute

  _throttle(func, delay) {
    let timeoutId;
    let lastCallTime = 0;

    return function (...args) {
      const now = Date.now();

      if (now - lastCallTime >= delay) {
        lastCallTime = now;
        return func.apply(this, args);
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          func.apply(this, args);
        }, delay - (now - lastCallTime));
      }
    };
  }

  _generateVersionId() {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateChangeDescription(previousVersions, markdown) {
    if (previousVersions.length === 0) {
      return "Initial version";
    }

    const lastVersion = previousVersions[previousVersions.length - 1];
    const sizeDiff = markdown.length - lastVersion.size;

    if (sizeDiff > 0) {
      return `Added ${sizeDiff} characters`;
    } else if (sizeDiff < 0) {
      return `Removed ${Math.abs(sizeDiff)} characters`;
    } else {
      return "Content modified";
    }
  }

  _calculateChecksum(content, markdown) {
    // Simple checksum calculation
    const str = JSON.stringify(content) + markdown;
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(16);
  }
}

// Create and export singleton instance
const versioningStateManager = new VersioningStateManager();
export default versioningStateManager;
