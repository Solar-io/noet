/**
 * StateManager - Centralized state management with domain isolation
 *
 * Manages separate state domains (editor, versioning, UI, data) with strict boundaries.
 * Each domain is isolated and communicates only through the EventBus.
 */

import eventBus from "./EventBus.js";
import { validateState, createValidator } from "./StateValidator.js";

// State domain definitions
const STATE_DOMAINS = {
  EDITOR: "editor",
  VERSIONING: "versioning",
  UI: "ui",
  DATA: "data",
  AUTH: "auth",
  TAGS: "tags",
  ATTACHMENTS: "attachments",
  DRAGDROP: "dragdrop",
  CONFIG: "config",
  SYNC: "sync",
  ERROR_RECOVERY: "errorRecovery",
};

// Default state for each domain
const DEFAULT_STATES = {
  [STATE_DOMAINS.EDITOR]: {
    content: null,
    markdown: "",
    selection: null,
    cursor: { line: 0, column: 0 },
    isDirty: false,
    isPreviewMode: false,
    activeNoteId: null,
    lastSaved: null,
    editorInstance: null,
    formatSettings: {
      fontSize: 14,
      fontFamily: "Inter",
      lineHeight: 1.6,
    },
  },

  [STATE_DOMAINS.VERSIONING]: {
    versions: {},
    activeVersionId: null,
    isPreviewingVersion: false,
    previewVersionId: null,
    versionHistory: [],
    maxVersions: 100,
    autoVersioning: true,
    lastVersionedNoteId: null,
    pendingVersions: new Set(),
  },

  [STATE_DOMAINS.UI]: {
    currentView: "all",
    selectedNoteId: null,
    selectedNotes: new Set(),
    searchQuery: "",
    sortBy: "updated",
    sortOrder: "desc",
    sidebarCollapsed: false,
    showSettings: false,
    showVersionHistory: false,
    showTagDialog: false,
    modals: {},
    notifications: [],
    isProcessing: false,
    processingStatus: null,
  },

  [STATE_DOMAINS.DATA]: {
    notes: new Map(),
    tags: new Map(),
    notebooks: new Map(),
    folders: new Map(),
    deletedNotes: new Map(),
    lastSync: null,
    isOnline: true,
    pendingChanges: new Set(),
  },

  [STATE_DOMAINS.AUTH]: {
    isAuthenticated: false,
    user: null,
    permissions: [],
    sessionTimeout: null,
    lastActivity: null,
  },

  [STATE_DOMAINS.TAGS]: {
    tags: new Map(),
    tagsByName: new Map(),
    lastUpdate: null,
    isLoading: false,
    error: null,
  },

  [STATE_DOMAINS.ATTACHMENTS]: {
    attachments: new Map(),
    activeUploads: new Map(),
    uploadProgress: new Map(),
    lastUpdate: null,
    isProcessing: false,
    error: null,
  },

  [STATE_DOMAINS.DRAGDROP]: {
    activeDrag: null,
    isDragging: false,
    dragTarget: null,
    dropEffect: null,
    visualFeedback: {
      showDropZones: false,
      highlightTargets: false,
    },
    lastUpdate: null,
  },

  [STATE_DOMAINS.CONFIG]: {
    config: {},
    isLoaded: false,
    lastUpdate: null,
    lastUpdatedBy: null,
    error: null,
  },

  [STATE_DOMAINS.SYNC]: {
    isOnline: true,
    isSyncing: false,
    autoSyncEnabled: false,
    autoSyncInterval: null,
    lastSync: null,
    lastSyncAttempt: null,
    lastSyncCompleted: null,
    lastSyncResult: null,
    lastSyncError: null,
    queuedItems: 0,
    offlineQueueSize: 0,
    conflictCount: 0,
    lastConnectionCheck: null,
    connectionQuality: "unknown",
    responseTime: null,
    lastUpdate: null,
  },

  [STATE_DOMAINS.ERROR_RECOVERY]: {
    errorCounts: { total: 0 },
    lastError: null,
    lastErrorTime: null,
    degradationMode: "none",
    degradationReason: null,
    degradationStartTime: null,
    lastRecoveryTime: null,
    circuitBreakers: new Map(),
    healthChecks: new Map(),
    offlineModeEnabled: false,
    lastUpdate: null,
  },
};

class StateManager {
  constructor() {
    this.states = {};
    this.validators = {};
    this.subscriptions = new Map();
    this.stateHistory = new Map();
    this.maxHistorySize = 50;
    this.debugMode = process.env.NODE_ENV === "development";

    // Initialize all state domains
    this._initializeStates();
    this._setupStateValidators();
    this._setupEventListeners();

    if (this.debugMode) {
      console.log(
        "🏗️  StateManager: Initialized with isolated domains:",
        Object.keys(this.states)
      );
    }
  }

  /**
   * Get state for a specific domain
   * @param {string} domain - State domain
   * @param {string} key - Optional specific key
   */
  getState(domain, key = null) {
    this._validateDomain(domain);

    const state = this.states[domain];
    if (key) {
      return state[key];
    }

    // Return a deep copy to prevent external mutations
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Set state for a specific domain with validation
   * @param {string} domain - State domain
   * @param {Object|Function} updates - State updates or updater function
   * @param {Object} options - Options (skipValidation, source)
   */
  async setState(domain, updates, options = {}) {
    this._validateDomain(domain);

    const currentState = this.states[domain];
    let newState;

    // Handle function updates
    if (typeof updates === "function") {
      newState = { ...currentState, ...updates(currentState) };
    } else {
      newState = { ...currentState, ...updates };
    }

    // Validate state before applying
    if (!options.skipValidation) {
      const validation = await this._validateStateUpdate(
        domain,
        newState,
        currentState
      );
      if (!validation.isValid) {
        throw new Error(
          `StateManager: Invalid state update for ${domain}: ${validation.errors.join(
            ", "
          )}`
        );
      }
    }

    // Store previous state for history
    this._addToHistory(domain, currentState);

    // Apply the new state
    this.states[domain] = newState;

    // Emit state change event
    await eventBus.emit(
      `state:${domain}:changed`,
      {
        domain,
        newState: JSON.parse(JSON.stringify(newState)),
        previousState: currentState,
        changes: this._getStateChanges(currentState, newState),
      },
      {
        source: options.source || "StateManager",
      }
    );

    if (this.debugMode) {
      console.log(`🔄 StateManager: Updated ${domain} state`, {
        changes: this._getStateChanges(currentState, newState),
        source: options.source,
      });
    }

    return newState;
  }

  /**
   * Subscribe to state changes for a domain
   * @param {string} domain - State domain
   * @param {Function} callback - Callback function
   * @param {Object} options - Options (keys, immediate)
   */
  subscribe(domain, callback, options = {}) {
    this._validateDomain(domain);

    const subscriptionId = this._generateId();
    const subscription = {
      id: subscriptionId,
      domain,
      callback,
      keys: options.keys || null,
      immediate: options.immediate || false,
    };

    if (!this.subscriptions.has(domain)) {
      this.subscriptions.set(domain, new Map());
    }

    this.subscriptions.get(domain).set(subscriptionId, subscription);

    // Set up event listener for this domain
    const unsubscribe = eventBus.on(`state:${domain}:changed`, (data) => {
      const { newState, previousState, changes } = data;

      // Filter by specific keys if requested
      if (subscription.keys) {
        const relevantChanges = changes.filter((change) =>
          subscription.keys.includes(change.key)
        );

        if (relevantChanges.length === 0) return;
      }

      callback({
        domain,
        state: newState,
        previousState,
        changes,
        subscriptionId,
      });
    });

    // Call immediately if requested
    if (options.immediate) {
      callback({
        domain,
        state: this.getState(domain),
        previousState: null,
        changes: [],
        subscriptionId,
      });
    }

    if (this.debugMode) {
      console.log(`📡 StateManager: Subscribed to ${domain} state changes`, {
        subscriptionId,
        keys: options.keys,
      });
    }

    // Return unsubscribe function
    return () => {
      unsubscribe();
      this.subscriptions.get(domain)?.delete(subscriptionId);
      if (this.debugMode) {
        console.log(
          `📡 StateManager: Unsubscribed from ${domain} state changes`,
          { subscriptionId }
        );
      }
    };
  }

  /**
   * Get state history for a domain
   * @param {string} domain - State domain
   * @param {number} limit - Number of history entries to return
   */
  getStateHistory(domain, limit = 10) {
    this._validateDomain(domain);

    const history = this.stateHistory.get(domain) || [];
    return history.slice(-limit);
  }

  /**
   * Reset state for a domain to default
   * @param {string} domain - State domain
   */
  async resetState(domain, options = {}) {
    this._validateDomain(domain);

    const defaultState = JSON.parse(JSON.stringify(DEFAULT_STATES[domain]));
    await this.setState(domain, defaultState, options);

    if (this.debugMode) {
      console.log(`🔄 StateManager: Reset ${domain} state to default`);
    }
  }

  /**
   * Reset all states to default
   */
  async resetAllStates(options = {}) {
    for (const domain of Object.values(STATE_DOMAINS)) {
      await this.resetState(domain, options);
    }

    if (this.debugMode) {
      console.log("🔄 StateManager: Reset all states to default");
    }
  }

  /**
   * Get a snapshot of all states
   */
  getSnapshot() {
    const snapshot = {};
    for (const domain of Object.values(STATE_DOMAINS)) {
      snapshot[domain] = this.getState(domain);
    }
    return {
      states: snapshot,
      timestamp: Date.now(),
      version: "1.0",
    };
  }

  /**
   * Restore from a snapshot
   * @param {Object} snapshot - State snapshot
   */
  async restoreFromSnapshot(snapshot, options = {}) {
    if (!snapshot.states) {
      throw new Error("StateManager: Invalid snapshot format");
    }

    for (const [domain, state] of Object.entries(snapshot.states)) {
      if (Object.values(STATE_DOMAINS).includes(domain)) {
        await this.setState(domain, state, {
          ...options,
          skipValidation: options.skipValidation,
        });
      }
    }

    if (this.debugMode) {
      console.log("🔄 StateManager: Restored from snapshot", {
        timestamp: snapshot.timestamp,
        domains: Object.keys(snapshot.states),
      });
    }
  }

  /**
   * Cross-domain state query with safe access
   * @param {Function} queryFn - Query function that receives all states
   */
  query(queryFn) {
    const allStates = {};
    for (const domain of Object.values(STATE_DOMAINS)) {
      allStates[domain] = this.getState(domain);
    }

    return queryFn(allStates);
  }

  /**
   * Batch state updates across domains
   * @param {Array} updates - Array of {domain, updates, options}
   */
  async batchUpdate(updates, options = {}) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.setState(update.domain, update.updates, {
          ...options,
          ...update.options,
        });
        results.push({ domain: update.domain, success: true, result });
      } catch (error) {
        results.push({
          domain: update.domain,
          success: false,
          error: error.message,
        });

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return results;
  }

  // Private methods

  _initializeStates() {
    for (const [domain, defaultState] of Object.entries(DEFAULT_STATES)) {
      this.states[domain] = JSON.parse(JSON.stringify(defaultState));
      this.stateHistory.set(domain, []);
    }
  }

  _setupStateValidators() {
    // Editor state validator
    this.validators[STATE_DOMAINS.EDITOR] = createValidator({
      content: { type: "any", required: false },
      markdown: { type: "string", required: true },
      selection: { type: "any", required: false },
      cursor: {
        type: "object",
        required: true,
        properties: {
          line: { type: "number", min: 0 },
          column: { type: "number", min: 0 },
        },
      },
      isDirty: { type: "boolean", required: true },
      isPreviewMode: { type: "boolean", required: true },
      activeNoteId: { type: "string", required: false },
      lastSaved: { type: "number", required: false },
      formatSettings: { type: "object", required: true },
    });

    // Versioning state validator
    this.validators[STATE_DOMAINS.VERSIONING] = createValidator({
      versions: { type: "object", required: true },
      activeVersionId: { type: "string", required: false },
      isPreviewingVersion: { type: "boolean", required: true },
      previewVersionId: { type: "string", required: false },
      versionHistory: { type: "array", required: true },
      maxVersions: { type: "number", min: 1, max: 1000 },
      autoVersioning: { type: "boolean", required: true },
    });

    // UI state validator
    this.validators[STATE_DOMAINS.UI] = createValidator({
      currentView: { type: "string", required: true },
      selectedNoteId: { type: "string", required: false },
      searchQuery: { type: "string", required: true },
      sortBy: { type: "string", enum: ["title", "created", "updated"] },
      sortOrder: { type: "string", enum: ["asc", "desc"] },
      sidebarCollapsed: { type: "boolean", required: true },
      isProcessing: { type: "boolean", required: true },
    });

    // Data state validator
    this.validators[STATE_DOMAINS.DATA] = createValidator({
      notes: { type: "object", required: true },
      tags: { type: "object", required: true },
      notebooks: { type: "object", required: true },
      folders: { type: "object", required: true },
      isOnline: { type: "boolean", required: true },
    });

    // Auth state validator
    this.validators[STATE_DOMAINS.AUTH] = createValidator({
      isAuthenticated: { type: "boolean", required: true },
      user: { type: "object", required: false },
      permissions: { type: "array", required: true },
      sessionTimeout: { type: "number", required: false },
    });
  }

  _setupEventListeners() {
    // Listen for cross-domain events that need special handling

    // When a note is selected in UI, notify editor
    eventBus.on("state:ui:changed", async (data) => {
      const { changes } = data;
      const noteIdChange = changes.find(
        (change) => change.key === "selectedNoteId"
      );

      if (noteIdChange && noteIdChange.newValue !== noteIdChange.oldValue) {
        // Emit note selection event for other systems to handle
        await eventBus.emit(
          "note:selected",
          {
            noteId: noteIdChange.newValue,
            previousNoteId: noteIdChange.oldValue,
          },
          { source: "StateManager" }
        );
      }
    });

    // When editor content changes, mark as dirty
    eventBus.on("state:editor:changed", async (data) => {
      const { changes } = data;
      const contentChange = changes.find((change) => change.key === "content");

      if (contentChange && !this.getState(STATE_DOMAINS.EDITOR, "isDirty")) {
        await this.setState(
          STATE_DOMAINS.EDITOR,
          { isDirty: true },
          {
            source: "StateManager.autoUpdate",
          }
        );
      }
    });
  }

  async _validateStateUpdate(domain, newState, currentState) {
    if (!this.validators[domain]) {
      return { isValid: true, errors: [] };
    }

    return await validateState(newState, this.validators[domain]);
  }

  _validateDomain(domain) {
    if (!Object.values(STATE_DOMAINS).includes(domain)) {
      throw new Error(
        `StateManager: Invalid state domain "${domain}". Valid domains: ${Object.values(
          STATE_DOMAINS
        ).join(", ")}`
      );
    }
  }

  _getStateChanges(oldState, newState) {
    const changes = [];

    for (const key in newState) {
      if (oldState[key] !== newState[key]) {
        changes.push({
          key,
          oldValue: oldState[key],
          newValue: newState[key],
          type: this._getChangeType(oldState[key], newState[key]),
        });
      }
    }

    return changes;
  }

  _getChangeType(oldValue, newValue) {
    if (oldValue === undefined || oldValue === null) return "added";
    if (newValue === undefined || newValue === null) return "removed";
    return "modified";
  }

  _addToHistory(domain, state) {
    const history = this.stateHistory.get(domain);
    history.push({
      state: JSON.parse(JSON.stringify(state)),
      timestamp: Date.now(),
    });

    // Keep history size under control
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export state domains for use by other modules
export { STATE_DOMAINS };

// Create and export singleton instance
const stateManager = new StateManager();
export default stateManager;
