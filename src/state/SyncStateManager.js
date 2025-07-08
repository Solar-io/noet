/**
 * SyncStateManager - Isolated sync and offline management
 *
 * Manages data synchronization, offline caching, conflict resolution, and connection state
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class SyncStateManager {
  constructor() {
    this.domain = "sync";
    this.eventBus = eventBus;
    this.syncQueue = [];
    this.offlineQueue = [];
    this.conflictQueue = [];
    this.syncHistory = [];
    this.maxHistoryEntries = 100;
    this.syncInterval = null;
    this.connectionCheckInterval = null;
    this.retryTimeouts = new Map();
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // Progressive delay

    this._initialize();
  }

  /**
   * Initialize the sync state manager
   */
  async _initialize() {
    // Check initial connection status
    await this._checkConnectionStatus();

    // Setup connection monitoring
    this._setupConnectionMonitoring();

    // Listen for sync events
    await this.eventBus.on("sync:start", this.handleSyncStartEvent.bind(this));
    await this.eventBus.on("sync:stop", this.handleSyncStopEvent.bind(this));
    await this.eventBus.on("sync:force", this.handleForceSyncEvent.bind(this));
    await this.eventBus.on(
      "sync:conflict",
      this.handleConflictEvent.bind(this)
    );
    await this.eventBus.on(
      "data:noteUpdated",
      this.handleDataChangeEvent.bind(this)
    );
    await this.eventBus.on(
      "data:noteCreated",
      this.handleDataChangeEvent.bind(this)
    );
    await this.eventBus.on(
      "data:noteDeleted",
      this.handleDataChangeEvent.bind(this)
    );

    // Start automatic sync if enabled
    const config = await this._getConfig();
    if (config.autoSync) {
      await this.startAutoSync();
    }

    console.log("SyncStateManager initialized");
  }

  /**
   * Get current sync state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Start automatic synchronization
   * @param {Object} options - Sync options
   */
  async startAutoSync(options = {}) {
    try {
      const config = await this._getConfig();
      const syncIntervalMs = options.interval || config.syncInterval || 30000; // 30 seconds default

      // Clear existing interval
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
      }

      // Start new interval
      this.syncInterval = setInterval(async () => {
        try {
          await this.sync({ background: true });
        } catch (error) {
          console.warn("Background sync failed:", error);
        }
      }, syncIntervalMs);

      // Update state
      await stateManager.setState(
        this.domain,
        {
          autoSyncEnabled: true,
          autoSyncInterval: syncIntervalMs,
          lastUpdate: Date.now(),
        },
        {
          source: "SyncStateManager.startAutoSync",
          operation: "startAutoSync",
        }
      );

      // Emit auto sync started event
      await this.eventBus.emit("sync:autoSyncStarted", {
        interval: syncIntervalMs,
        options,
      });

      return { success: true, interval: syncIntervalMs };
    } catch (error) {
      await this.eventBus.emit("sync:autoSyncStartError", error);
      throw error;
    }
  }

  /**
   * Stop automatic synchronization
   */
  async stopAutoSync() {
    try {
      if (this.syncInterval) {
        clearInterval(this.syncInterval);
        this.syncInterval = null;
      }

      // Update state
      await stateManager.setState(
        this.domain,
        {
          autoSyncEnabled: false,
          autoSyncInterval: null,
          lastUpdate: Date.now(),
        },
        {
          source: "SyncStateManager.stopAutoSync",
          operation: "stopAutoSync",
        }
      );

      // Emit auto sync stopped event
      await this.eventBus.emit("sync:autoSyncStopped");

      return { success: true };
    } catch (error) {
      await this.eventBus.emit("sync:autoSyncStopError", error);
      throw error;
    }
  }

  /**
   * Perform manual synchronization
   * @param {Object} options - Sync options
   */
  async sync(options = {}) {
    try {
      const currentState = this.getState();

      // Check if sync is already in progress
      if (currentState.isSyncing && !options.force) {
        return { success: false, reason: "Sync already in progress" };
      }

      // Check connection
      if (!currentState.isOnline) {
        await this._queueForOfflineSync(options);
        return { success: false, reason: "Offline - queued for later" };
      }

      // Start sync
      const syncId = this._generateSyncId();
      const syncOperation = {
        id: syncId,
        startTime: Date.now(),
        options,
        status: "started",
      };

      // Update state
      await stateManager.setState(
        this.domain,
        {
          isSyncing: true,
          currentSync: syncOperation,
          lastSyncAttempt: Date.now(),
        },
        {
          source: "SyncStateManager.sync",
          operation: "syncStart",
          syncId,
        }
      );

      // Emit sync started event
      await this.eventBus.emit("sync:syncStarted", {
        syncId,
        options,
        background: options.background || false,
      });

      // Perform sync steps
      const result = await this._performSync(syncOperation);

      // Update state with result
      await stateManager.setState(
        this.domain,
        {
          isSyncing: false,
          currentSync: null,
          lastSyncCompleted: Date.now(),
          lastSyncResult: result,
        },
        {
          source: "SyncStateManager.sync",
          operation: "syncComplete",
          syncId,
          result,
        }
      );

      // Add to history
      this._addToHistory({
        ...syncOperation,
        endTime: Date.now(),
        duration: Date.now() - syncOperation.startTime,
        result,
      });

      // Emit sync completed event
      await this.eventBus.emit("sync:syncCompleted", {
        syncId,
        result,
      });

      return result;
    } catch (error) {
      // Update state on error
      await stateManager.setState(
        this.domain,
        {
          isSyncing: false,
          currentSync: null,
          lastSyncError: error.message,
          lastSyncAttempt: Date.now(),
        },
        {
          source: "SyncStateManager.sync",
          operation: "syncError",
          error: error.message,
        }
      );

      await this.eventBus.emit("sync:syncError", error);
      throw error;
    }
  }

  /**
   * Queue item for synchronization
   * @param {Object} item - Item to queue
   * @param {string} operation - Operation type (create, update, delete)
   */
  async queueForSync(item, operation) {
    try {
      const queueItem = {
        id: this._generateQueueId(),
        item,
        operation,
        timestamp: Date.now(),
        retryCount: 0,
        status: "queued",
      };

      this.syncQueue.push(queueItem);

      // Update state
      const currentState = this.getState();
      await stateManager.setState(
        this.domain,
        {
          queuedItems: this.syncQueue.length,
          lastQueueUpdate: Date.now(),
        },
        {
          source: "SyncStateManager.queueForSync",
          operation: "queueItem",
          queueItemId: queueItem.id,
        }
      );

      // Emit queue update event
      await this.eventBus.emit("sync:itemQueued", {
        queueItem,
        queueLength: this.syncQueue.length,
      });

      return queueItem;
    } catch (error) {
      await this.eventBus.emit("sync:queueError", error);
      throw error;
    }
  }

  /**
   * Process offline queue when connection is restored
   */
  async processOfflineQueue() {
    try {
      const currentState = this.getState();

      if (!currentState.isOnline) {
        return { success: false, reason: "Still offline" };
      }

      if (this.offlineQueue.length === 0) {
        return { success: true, processed: 0 };
      }

      // Process offline queue
      const processed = [];
      const failed = [];

      for (const queueItem of this.offlineQueue) {
        try {
          const result = await this._processQueueItem(queueItem);
          processed.push({ item: queueItem, result });
        } catch (error) {
          failed.push({ item: queueItem, error });
        }
      }

      // Clear processed items
      this.offlineQueue = this.offlineQueue.filter(
        (item) => !processed.find((p) => p.item.id === item.id)
      );

      // Update state
      await stateManager.setState(
        this.domain,
        {
          offlineQueueSize: this.offlineQueue.length,
          lastOfflineProcessed: Date.now(),
        },
        {
          source: "SyncStateManager.processOfflineQueue",
          operation: "processOfflineQueue",
          processed: processed.length,
          failed: failed.length,
        }
      );

      // Emit offline queue processed event
      await this.eventBus.emit("sync:offlineQueueProcessed", {
        processed: processed.length,
        failed: failed.length,
        remaining: this.offlineQueue.length,
      });

      return {
        success: true,
        processed: processed.length,
        failed: failed.length,
        remaining: this.offlineQueue.length,
      };
    } catch (error) {
      await this.eventBus.emit("sync:offlineQueueProcessError", error);
      throw error;
    }
  }

  /**
   * Handle sync conflicts
   * @param {Object} conflict - Conflict data
   * @param {string} resolution - Resolution strategy
   */
  async resolveConflict(conflict, resolution) {
    try {
      // Validate resolution strategy
      const validResolutions = ["local", "remote", "merge", "manual"];
      if (!validResolutions.includes(resolution)) {
        throw new Error(`Invalid resolution strategy: ${resolution}`);
      }

      // Apply resolution
      const result = await this._applyConflictResolution(conflict, resolution);

      // Remove from conflict queue
      this.conflictQueue = this.conflictQueue.filter(
        (c) => c.id !== conflict.id
      );

      // Update state
      await stateManager.setState(
        this.domain,
        {
          conflictCount: this.conflictQueue.length,
          lastConflictResolved: Date.now(),
        },
        {
          source: "SyncStateManager.resolveConflict",
          operation: "resolveConflict",
          conflictId: conflict.id,
          resolution,
        }
      );

      // Emit conflict resolved event
      await this.eventBus.emit("sync:conflictResolved", {
        conflict,
        resolution,
        result,
      });

      return result;
    } catch (error) {
      await this.eventBus.emit("sync:conflictResolutionError", error);
      throw error;
    }
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts() {
    return [...this.conflictQueue];
  }

  /**
   * Get sync queue status
   */
  getQueueStatus() {
    return {
      syncQueue: this.syncQueue.length,
      offlineQueue: this.offlineQueue.length,
      conflictQueue: this.conflictQueue.length,
      totalPending:
        this.syncQueue.length +
        this.offlineQueue.length +
        this.conflictQueue.length,
    };
  }

  /**
   * Get sync history
   * @param {number} limit - Maximum number of entries
   */
  getSyncHistory(limit = 20) {
    return this.syncHistory.slice(-limit);
  }

  /**
   * Clear sync history
   */
  async clearSyncHistory() {
    this.syncHistory.length = 0;

    await this.eventBus.emit("sync:historyCleard");

    return { success: true };
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    const currentState = this.getState();
    return {
      isOnline: currentState.isOnline,
      lastOnline: currentState.lastOnline,
      lastConnectionCheck: currentState.lastConnectionCheck,
      connectionQuality: currentState.connectionQuality,
    };
  }

  /**
   * Force connection check
   */
  async checkConnection() {
    return await this._checkConnectionStatus();
  }

  /**
   * Enable offline mode
   */
  async enableOfflineMode() {
    try {
      await stateManager.setState(
        this.domain,
        {
          offlineModeEnabled: true,
          lastUpdate: Date.now(),
        },
        {
          source: "SyncStateManager.enableOfflineMode",
          operation: "enableOfflineMode",
        }
      );

      await this.eventBus.emit("sync:offlineModeEnabled");

      return { success: true };
    } catch (error) {
      await this.eventBus.emit("sync:offlineModeError", error);
      throw error;
    }
  }

  /**
   * Disable offline mode
   */
  async disableOfflineMode() {
    try {
      await stateManager.setState(
        this.domain,
        {
          offlineModeEnabled: false,
          lastUpdate: Date.now(),
        },
        {
          source: "SyncStateManager.disableOfflineMode",
          operation: "disableOfflineMode",
        }
      );

      await this.eventBus.emit("sync:offlineModeDisabled");

      return { success: true };
    } catch (error) {
      await this.eventBus.emit("sync:offlineModeError", error);
      throw error;
    }
  }

  /**
   * Private: Perform sync operation
   * @param {Object} syncOperation - Sync operation details
   */
  async _performSync(syncOperation) {
    const steps = [
      { name: "fetchRemoteChanges", fn: this._fetchRemoteChanges },
      { name: "detectConflicts", fn: this._detectConflicts },
      { name: "pushLocalChanges", fn: this._pushLocalChanges },
      { name: "updateLocalData", fn: this._updateLocalData },
    ];

    const results = {};
    let totalChanges = 0;

    for (const step of steps) {
      try {
        const stepResult = await step.fn.call(this, syncOperation);
        results[step.name] = stepResult;
        totalChanges += stepResult.changes || 0;
      } catch (error) {
        results[step.name] = { error: error.message };
        throw error;
      }
    }

    return {
      success: true,
      totalChanges,
      results,
      timestamp: Date.now(),
    };
  }

  /**
   * Private: Fetch remote changes
   * @param {Object} syncOperation - Sync operation
   */
  async _fetchRemoteChanges(syncOperation) {
    try {
      const backendUrl = await this._getBackendUrl();
      const response = await fetch(`${backendUrl}/api/sync/changes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch remote changes: ${response.status}`);
      }

      const changes = await response.json();

      return {
        changes: changes.length,
        data: changes,
      };
    } catch (error) {
      throw new Error(`Remote fetch failed: ${error.message}`);
    }
  }

  /**
   * Private: Detect conflicts
   * @param {Object} syncOperation - Sync operation
   */
  async _detectConflicts(syncOperation) {
    // In a real implementation, this would compare local and remote changes
    // For now, we'll simulate conflict detection
    const conflicts = [];

    // Simulate finding conflicts
    if (Math.random() < 0.1) {
      // 10% chance of conflict
      conflicts.push({
        id: `conflict-${Date.now()}`,
        type: "edit",
        itemId: "note-123",
        localVersion: {
          content: "Local content",
          timestamp: Date.now() - 1000,
        },
        remoteVersion: {
          content: "Remote content",
          timestamp: Date.now() - 500,
        },
      });
    }

    // Add conflicts to queue
    this.conflictQueue.push(...conflicts);

    return {
      conflicts: conflicts.length,
      data: conflicts,
    };
  }

  /**
   * Private: Push local changes
   * @param {Object} syncOperation - Sync operation
   */
  async _pushLocalChanges(syncOperation) {
    const itemsToPush = [...this.syncQueue];
    const pushed = [];
    const failed = [];

    for (const item of itemsToPush) {
      try {
        const result = await this._pushItem(item);
        pushed.push({ item, result });

        // Remove from queue
        this.syncQueue = this.syncQueue.filter((q) => q.id !== item.id);
      } catch (error) {
        failed.push({ item, error });

        // Increment retry count
        item.retryCount++;
        if (item.retryCount >= this.maxRetries) {
          // Move to failed queue or remove
          this.syncQueue = this.syncQueue.filter((q) => q.id !== item.id);
        }
      }
    }

    return {
      changes: pushed.length,
      pushed: pushed.length,
      failed: failed.length,
    };
  }

  /**
   * Private: Update local data
   * @param {Object} syncOperation - Sync operation
   */
  async _updateLocalData(syncOperation) {
    // In a real implementation, this would apply remote changes locally
    // For now, we'll simulate success
    return {
      changes: 0,
      updated: 0,
    };
  }

  /**
   * Private: Push individual item
   * @param {Object} item - Item to push
   */
  async _pushItem(item) {
    const backendUrl = await this._getBackendUrl();
    const response = await fetch(`${backendUrl}/api/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operation: item.operation,
        data: item.item,
      }),
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Private: Process queue item
   * @param {Object} queueItem - Queue item to process
   */
  async _processQueueItem(queueItem) {
    // Process based on operation type
    switch (queueItem.operation) {
      case "create":
        return await this._processCreateOperation(queueItem);
      case "update":
        return await this._processUpdateOperation(queueItem);
      case "delete":
        return await this._processDeleteOperation(queueItem);
      default:
        throw new Error(`Unknown operation: ${queueItem.operation}`);
    }
  }

  /**
   * Private: Process create operation
   * @param {Object} queueItem - Queue item
   */
  async _processCreateOperation(queueItem) {
    // In a real implementation, this would create the item on the server
    return { success: true, operation: "create", id: queueItem.id };
  }

  /**
   * Private: Process update operation
   * @param {Object} queueItem - Queue item
   */
  async _processUpdateOperation(queueItem) {
    // In a real implementation, this would update the item on the server
    return { success: true, operation: "update", id: queueItem.id };
  }

  /**
   * Private: Process delete operation
   * @param {Object} queueItem - Queue item
   */
  async _processDeleteOperation(queueItem) {
    // In a real implementation, this would delete the item on the server
    return { success: true, operation: "delete", id: queueItem.id };
  }

  /**
   * Private: Apply conflict resolution
   * @param {Object} conflict - Conflict data
   * @param {string} resolution - Resolution strategy
   */
  async _applyConflictResolution(conflict, resolution) {
    switch (resolution) {
      case "local":
        // Keep local version
        return { applied: "local", version: conflict.localVersion };
      case "remote":
        // Keep remote version
        return { applied: "remote", version: conflict.remoteVersion };
      case "merge":
        // Merge versions (basic implementation)
        const merged = {
          content: `${conflict.localVersion.content}\n\n${conflict.remoteVersion.content}`,
          timestamp: Date.now(),
        };
        return { applied: "merge", version: merged };
      case "manual":
        // Manual resolution required
        throw new Error("Manual resolution not implemented");
      default:
        throw new Error(`Unknown resolution strategy: ${resolution}`);
    }
  }

  /**
   * Private: Check connection status
   */
  async _checkConnectionStatus() {
    try {
      const startTime = Date.now();
      const backendUrl = await this._getBackendUrl();

      const response = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;
      const isOnline = response.ok;

      let connectionQuality = "unknown";
      if (isOnline) {
        if (responseTime < 100) connectionQuality = "excellent";
        else if (responseTime < 500) connectionQuality = "good";
        else if (responseTime < 1000) connectionQuality = "fair";
        else connectionQuality = "poor";
      }

      // Update state
      await stateManager.setState(
        this.domain,
        {
          isOnline,
          lastOnline: isOnline
            ? Date.now()
            : this.getState().lastOnline || null,
          lastConnectionCheck: Date.now(),
          connectionQuality,
          responseTime,
        },
        {
          source: "SyncStateManager._checkConnectionStatus",
          operation: "connectionCheck",
        }
      );

      // Emit connection status event
      await this.eventBus.emit("sync:connectionStatusChanged", {
        isOnline,
        connectionQuality,
        responseTime,
      });

      // Process offline queue if connection restored
      if (isOnline && this.offlineQueue.length > 0) {
        setTimeout(() => {
          this.processOfflineQueue();
        }, 1000);
      }

      return { isOnline, connectionQuality, responseTime };
    } catch (error) {
      // Connection failed
      await stateManager.setState(
        this.domain,
        {
          isOnline: false,
          lastConnectionCheck: Date.now(),
          connectionQuality: "offline",
          connectionError: error.message,
        },
        {
          source: "SyncStateManager._checkConnectionStatus",
          operation: "connectionCheckFailed",
        }
      );

      await this.eventBus.emit("sync:connectionStatusChanged", {
        isOnline: false,
        connectionQuality: "offline",
        error: error.message,
      });

      return {
        isOnline: false,
        connectionQuality: "offline",
        error: error.message,
      };
    }
  }

  /**
   * Private: Setup connection monitoring
   */
  _setupConnectionMonitoring() {
    // Check connection every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      this._checkConnectionStatus();
    }, 30000);

    // Listen for online/offline events
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this._checkConnectionStatus();
      });

      window.addEventListener("offline", () => {
        this._checkConnectionStatus();
      });
    }
  }

  /**
   * Private: Queue for offline sync
   * @param {Object} options - Sync options
   */
  async _queueForOfflineSync(options) {
    const offlineItem = {
      id: this._generateQueueId(),
      options,
      timestamp: Date.now(),
      type: "sync",
    };

    this.offlineQueue.push(offlineItem);

    // Update state
    await stateManager.setState(
      this.domain,
      {
        offlineQueueSize: this.offlineQueue.length,
        lastOfflineQueueUpdate: Date.now(),
      },
      {
        source: "SyncStateManager._queueForOfflineSync",
        operation: "queueOfflineSync",
      }
    );
  }

  /**
   * Private: Add to sync history
   * @param {Object} entry - History entry
   */
  _addToHistory(entry) {
    this.syncHistory.push(entry);

    if (this.syncHistory.length > this.maxHistoryEntries) {
      this.syncHistory = this.syncHistory.slice(-this.maxHistoryEntries);
    }
  }

  /**
   * Private: Generate sync ID
   */
  _generateSyncId() {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Generate queue ID
   */
  _generateQueueId() {
    return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Get backend URL
   */
  async _getBackendUrl() {
    // In real app, this would come from config
    return "http://localhost:3004";
  }

  /**
   * Private: Get configuration
   */
  async _getConfig() {
    return {
      autoSync: true,
      syncInterval: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    };
  }

  /**
   * Event handlers
   */
  async handleSyncStartEvent(data) {
    console.log("Sync: Start event received", data);
  }

  async handleSyncStopEvent(data) {
    console.log("Sync: Stop event received", data);
  }

  async handleForceSyncEvent(data) {
    console.log("Sync: Force sync event received", data);
    await this.sync({ force: true });
  }

  async handleConflictEvent(data) {
    console.log("Sync: Conflict event received", data);
  }

  async handleDataChangeEvent(data) {
    // Queue data changes for sync
    if (data.noteId) {
      await this.queueForSync(data, data.operation || "update");
    }
  }

  /**
   * Cleanup - remove event listeners and clear intervals
   */
  destroy() {
    // Clear intervals
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    // Clear retry timeouts
    for (const timeout of this.retryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.retryTimeouts.clear();

    // Remove event listeners
    this.eventBus.off("sync:start", this.handleSyncStartEvent);
    this.eventBus.off("sync:stop", this.handleSyncStopEvent);
    this.eventBus.off("sync:force", this.handleForceSyncEvent);
    this.eventBus.off("sync:conflict", this.handleConflictEvent);
    this.eventBus.off("data:noteUpdated", this.handleDataChangeEvent);
    this.eventBus.off("data:noteCreated", this.handleDataChangeEvent);
    this.eventBus.off("data:noteDeleted", this.handleDataChangeEvent);

    // Remove window event listeners
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this._checkConnectionStatus);
      window.removeEventListener("offline", this._checkConnectionStatus);
    }

    // Clear queues and history
    this.syncQueue.length = 0;
    this.offlineQueue.length = 0;
    this.conflictQueue.length = 0;
    this.syncHistory.length = 0;
  }
}

// Create and export singleton instance
const syncStateManager = new SyncStateManager();
export default syncStateManager;
