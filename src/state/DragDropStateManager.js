/**
 * DragDropStateManager - Isolated drag and drop operations management
 *
 * Manages drag and drop operations, validation, visual feedback, and cross-component interactions
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class DragDropStateManager {
  constructor() {
    this.domain = "dragdrop";
    this.eventBus = eventBus;
    this.activeDrags = new Map();
    this.dropTargets = new Map();
    this.dragHistory = [];
    this.maxHistoryEntries = 100;
    this.operationHandlers = new Map();

    this._initialize();
  }

  /**
   * Initialize the drag drop state manager
   */
  async _initialize() {
    // Register default operation handlers
    this._registerDefaultHandlers();

    // Listen for drag drop events
    await this.eventBus.on(
      "dragdrop:start",
      this.handleDragStartEvent.bind(this)
    );
    await this.eventBus.on("dragdrop:end", this.handleDragEndEvent.bind(this));
    await this.eventBus.on("dragdrop:drop", this.handleDropEvent.bind(this));
    await this.eventBus.on(
      "dragdrop:hover",
      this.handleDragHoverEvent.bind(this)
    );
    await this.eventBus.on(
      "dragdrop:leave",
      this.handleDragLeaveEvent.bind(this)
    );

    console.log("DragDropStateManager initialized");
  }

  /**
   * Get current drag drop state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Start a drag operation
   * @param {Object} dragData - Data being dragged
   * @param {string} sourceComponent - Component initiating the drag
   * @param {Object} options - Drag options
   */
  async startDrag(dragData, sourceComponent, options = {}) {
    try {
      // Validate drag data
      const validatedData = await this._validateDragData(dragData);

      // Generate drag ID
      const dragId = this._generateDragId();

      // Create drag operation
      const dragOperation = {
        id: dragId,
        data: validatedData,
        sourceComponent,
        startTime: Date.now(),
        status: "active",
        options: {
          allowCopy: options.allowCopy || false,
          allowMove: options.allowMove !== false,
          allowLink: options.allowLink || false,
          effectAllowed: options.effectAllowed || "move",
          ...options,
        },
        metadata: {
          userAgent: navigator.userAgent,
          startPosition: options.startPosition || null,
          sourceElement: options.sourceElement || null,
        },
      };

      // Store active drag
      this.activeDrags.set(dragId, dragOperation);

      // Update state
      const currentState = this.getState();
      await stateManager.setState(
        this.domain,
        {
          activeDrag: dragOperation,
          isDragging: true,
          dragTarget: null,
          dropEffect: null,
          visualFeedback: {
            showDropZones: true,
            highlightTargets: true,
          },
          lastUpdate: Date.now(),
        },
        {
          source: "DragDropStateManager.startDrag",
          operation: "dragStart",
          dragId,
        }
      );

      // Emit drag start event
      await this.eventBus.emit("dragdrop:dragStarted", {
        dragId,
        dragData: validatedData,
        sourceComponent,
        operation: dragOperation,
      });

      return { dragId, operation: dragOperation };
    } catch (error) {
      await this.eventBus.emit("dragdrop:dragStartError", error);
      throw error;
    }
  }

  /**
   * End a drag operation
   * @param {string} dragId - Drag ID
   * @param {Object} result - Drop result
   */
  async endDrag(dragId, result = {}) {
    try {
      const dragOperation = this.activeDrags.get(dragId);

      if (!dragOperation) {
        throw new Error(`Drag operation with ID "${dragId}" not found`);
      }

      // Update operation status
      dragOperation.status = result.success ? "completed" : "cancelled";
      dragOperation.endTime = Date.now();
      dragOperation.duration = dragOperation.endTime - dragOperation.startTime;
      dragOperation.result = result;

      // Add to history
      this._addToHistory(dragOperation);

      // Clean up active drag
      this.activeDrags.delete(dragId);

      // Update state
      await stateManager.setState(
        this.domain,
        {
          activeDrag: null,
          isDragging: false,
          dragTarget: null,
          dropEffect: null,
          visualFeedback: {
            showDropZones: false,
            highlightTargets: false,
          },
          lastUpdate: Date.now(),
        },
        {
          source: "DragDropStateManager.endDrag",
          operation: "dragEnd",
          dragId,
          result,
        }
      );

      // Emit drag end event
      await this.eventBus.emit("dragdrop:dragEnded", {
        dragId,
        operation: dragOperation,
        result,
      });

      return { success: true, operation: dragOperation };
    } catch (error) {
      await this.eventBus.emit("dragdrop:dragEndError", error);
      throw error;
    }
  }

  /**
   * Register a drop target
   * @param {string} targetId - Target ID
   * @param {Object} targetData - Target data
   * @param {Function} dropHandler - Handler function for drops
   */
  async registerDropTarget(targetId, targetData, dropHandler) {
    try {
      // Validate target data
      const validatedData = await this._validateDropTarget(targetData);

      // Create drop target
      const dropTarget = {
        id: targetId,
        data: validatedData,
        handler: dropHandler,
        registeredAt: Date.now(),
        accepts: validatedData.accepts || [],
        rejects: validatedData.rejects || [],
        isActive: true,
      };

      // Store drop target
      this.dropTargets.set(targetId, dropTarget);

      // Emit registration event
      await this.eventBus.emit("dragdrop:targetRegistered", {
        targetId,
        target: dropTarget,
      });

      return dropTarget;
    } catch (error) {
      await this.eventBus.emit("dragdrop:targetRegistrationError", error);
      throw error;
    }
  }

  /**
   * Unregister a drop target
   * @param {string} targetId - Target ID
   */
  async unregisterDropTarget(targetId) {
    const dropTarget = this.dropTargets.get(targetId);

    if (dropTarget) {
      this.dropTargets.delete(targetId);

      await this.eventBus.emit("dragdrop:targetUnregistered", {
        targetId,
        target: dropTarget,
      });
    }
  }

  /**
   * Handle drag over target
   * @param {string} dragId - Drag ID
   * @param {string} targetId - Target ID
   * @param {Object} position - Cursor position
   */
  async handleDragOver(dragId, targetId, position = {}) {
    try {
      const dragOperation = this.activeDrags.get(dragId);
      const dropTarget = this.dropTargets.get(targetId);

      if (!dragOperation || !dropTarget) {
        return { valid: false, reason: "Invalid drag or target" };
      }

      // Validate drop compatibility
      const validation = await this._validateDrop(
        dragOperation,
        dropTarget,
        position
      );

      // Update state with drag target
      await stateManager.setState(
        this.domain,
        {
          dragTarget: validation.valid
            ? {
                id: targetId,
                position,
                effect: validation.dropEffect,
                feedback: validation.feedback,
              }
            : null,
          dropEffect: validation.dropEffect,
          lastUpdate: Date.now(),
        },
        {
          source: "DragDropStateManager.handleDragOver",
          operation: "dragOver",
          dragId,
          targetId,
          valid: validation.valid,
        }
      );

      // Emit drag over event
      await this.eventBus.emit("dragdrop:dragOver", {
        dragId,
        targetId,
        position,
        validation,
        dragOperation,
        dropTarget,
      });

      return validation;
    } catch (error) {
      await this.eventBus.emit("dragdrop:dragOverError", error);
      throw error;
    }
  }

  /**
   * Handle drag leave target
   * @param {string} dragId - Drag ID
   * @param {string} targetId - Target ID
   */
  async handleDragLeave(dragId, targetId) {
    try {
      const currentState = this.getState();

      // Only clear if leaving the current target
      if (currentState.dragTarget?.id === targetId) {
        await stateManager.setState(
          this.domain,
          {
            dragTarget: null,
            dropEffect: null,
            lastUpdate: Date.now(),
          },
          {
            source: "DragDropStateManager.handleDragLeave",
            operation: "dragLeave",
            dragId,
            targetId,
          }
        );
      }

      // Emit drag leave event
      await this.eventBus.emit("dragdrop:dragLeave", {
        dragId,
        targetId,
      });
    } catch (error) {
      await this.eventBus.emit("dragdrop:dragLeaveError", error);
    }
  }

  /**
   * Execute drop operation
   * @param {string} dragId - Drag ID
   * @param {string} targetId - Target ID
   * @param {Object} dropPosition - Drop position details
   */
  async executeDrop(dragId, targetId, dropPosition = {}) {
    try {
      const dragOperation = this.activeDrags.get(dragId);
      const dropTarget = this.dropTargets.get(targetId);

      if (!dragOperation || !dropTarget) {
        throw new Error("Invalid drag operation or drop target");
      }

      // Validate drop
      const validation = await this._validateDrop(
        dragOperation,
        dropTarget,
        dropPosition
      );

      if (!validation.valid) {
        throw new Error(`Drop not allowed: ${validation.reason}`);
      }

      // Execute the drop operation
      const result = await this._executeDrop(
        dragOperation,
        dropTarget,
        dropPosition,
        validation
      );

      // End the drag operation with success
      await this.endDrag(dragId, {
        success: true,
        result,
        targetId,
        dropPosition,
      });

      // Emit drop completed event
      await this.eventBus.emit("dragdrop:dropCompleted", {
        dragId,
        targetId,
        result,
        dragOperation,
        dropTarget,
      });

      return result;
    } catch (error) {
      // End the drag operation with failure
      await this.endDrag(dragId, {
        success: false,
        error: error.message,
        targetId,
      });

      await this.eventBus.emit("dragdrop:dropError", error);
      throw error;
    }
  }

  /**
   * Get drop targets for a drag operation
   * @param {Object} dragData - Drag data
   */
  getValidDropTargets(dragData) {
    const validTargets = [];

    for (const [targetId, target] of this.dropTargets) {
      if (target.isActive && this._isCompatibleTarget(dragData, target)) {
        validTargets.push({ targetId, target });
      }
    }

    return validTargets;
  }

  /**
   * Get drag operation history
   * @param {number} limit - Maximum number of entries to return
   */
  getDragHistory(limit = 20) {
    return this.dragHistory.slice(-limit);
  }

  /**
   * Get active drag operations
   */
  getActiveDrags() {
    return Array.from(this.activeDrags.values());
  }

  /**
   * Cancel all active drags
   */
  async cancelAllDrags() {
    const activeDragIds = Array.from(this.activeDrags.keys());

    for (const dragId of activeDragIds) {
      try {
        await this.endDrag(dragId, { success: false, reason: "cancelled" });
      } catch (error) {
        console.error(`Failed to cancel drag ${dragId}:`, error);
      }
    }
  }

  /**
   * Register operation handler
   * @param {string} operationType - Type of operation
   * @param {Function} handler - Handler function
   */
  registerOperationHandler(operationType, handler) {
    this.operationHandlers.set(operationType, handler);
  }

  /**
   * Private: Validate drag data
   * @param {Object} dragData - Drag data to validate
   */
  async _validateDragData(dragData) {
    if (!dragData || typeof dragData !== "object") {
      throw new Error("Drag data must be an object");
    }

    if (!dragData.type || typeof dragData.type !== "string") {
      throw new Error("Drag data must have a type property");
    }

    if (!dragData.id) {
      throw new Error("Drag data must have an id property");
    }

    return {
      type: dragData.type,
      id: dragData.id,
      title: dragData.title || dragData.name || dragData.id,
      sourceComponent: dragData.sourceComponent || "unknown",
      metadata: dragData.metadata || {},
    };
  }

  /**
   * Private: Validate drop target
   * @param {Object} targetData - Target data to validate
   */
  async _validateDropTarget(targetData) {
    if (!targetData || typeof targetData !== "object") {
      throw new Error("Target data must be an object");
    }

    if (!targetData.type || typeof targetData.type !== "string") {
      throw new Error("Target data must have a type property");
    }

    return {
      type: targetData.type,
      id: targetData.id || "unknown",
      name: targetData.name || targetData.id || "unknown",
      accepts: Array.isArray(targetData.accepts) ? targetData.accepts : [],
      rejects: Array.isArray(targetData.rejects) ? targetData.rejects : [],
      metadata: targetData.metadata || {},
    };
  }

  /**
   * Private: Validate drop operation
   * @param {Object} dragOperation - Drag operation
   * @param {Object} dropTarget - Drop target
   * @param {Object} position - Drop position
   */
  async _validateDrop(dragOperation, dropTarget, position) {
    const { data: dragData } = dragOperation;
    const { data: targetData } = dropTarget;

    // Check if target accepts this drag type
    if (
      targetData.accepts.length > 0 &&
      !targetData.accepts.includes(dragData.type)
    ) {
      return {
        valid: false,
        reason: `Target does not accept ${dragData.type}`,
      };
    }

    // Check if target explicitly rejects this drag type
    if (targetData.rejects.includes(dragData.type)) {
      return {
        valid: false,
        reason: `Target rejects ${dragData.type}`,
      };
    }

    // Check for self-drop
    if (dragData.id === targetData.id && dragData.type === targetData.type) {
      return {
        valid: false,
        reason: "Cannot drop item on itself",
      };
    }

    // Determine drop effect
    let dropEffect = "move";
    if (dragOperation.options.allowCopy && position.ctrlKey) {
      dropEffect = "copy";
    } else if (dragOperation.options.allowLink && position.altKey) {
      dropEffect = "link";
    }

    // Generate feedback
    const feedback = this._generateDropFeedback(
      dragData,
      targetData,
      dropEffect,
      position
    );

    return {
      valid: true,
      dropEffect,
      feedback,
      operation: this._determineOperation(dragData, targetData, position),
    };
  }

  /**
   * Private: Execute drop operation
   * @param {Object} dragOperation - Drag operation
   * @param {Object} dropTarget - Drop target
   * @param {Object} dropPosition - Drop position
   * @param {Object} validation - Validation result
   */
  async _executeDrop(dragOperation, dropTarget, dropPosition, validation) {
    const operationType = validation.operation;
    const handler = this.operationHandlers.get(operationType);

    if (!handler) {
      throw new Error(
        `No handler registered for operation type: ${operationType}`
      );
    }

    // Execute the operation
    const result = await handler({
      drag: dragOperation,
      target: dropTarget,
      position: dropPosition,
      effect: validation.dropEffect,
    });

    return {
      operation: operationType,
      effect: validation.dropEffect,
      result,
      timestamp: Date.now(),
    };
  }

  /**
   * Private: Determine operation type
   * @param {Object} dragData - Drag data
   * @param {Object} targetData - Target data
   * @param {Object} position - Position data
   */
  _determineOperation(dragData, targetData, position) {
    // Create operation key
    const operationKey = `${dragData.type}-to-${targetData.type}`;

    // Check for position-specific operations
    if (position.position === "above" || position.position === "below") {
      return `${operationKey}-reorder`;
    }

    // Check for category operations
    if (
      targetData.type === "notebook" ||
      targetData.type === "folder" ||
      targetData.type === "tag"
    ) {
      return `${operationKey}-assign`;
    }

    return operationKey;
  }

  /**
   * Private: Generate drop feedback
   * @param {Object} dragData - Drag data
   * @param {Object} targetData - Target data
   * @param {string} dropEffect - Drop effect
   * @param {Object} position - Position data
   */
  _generateDropFeedback(dragData, targetData, dropEffect, position) {
    const action =
      dropEffect === "copy" ? "Copy" : dropEffect === "link" ? "Link" : "Move";

    let message = `${action} ${dragData.title || dragData.type}`;

    if (position.position === "above") {
      message += ` above ${targetData.name}`;
    } else if (position.position === "below") {
      message += ` below ${targetData.name}`;
    } else {
      message += ` to ${targetData.name}`;
    }

    return {
      message,
      icon: this._getDropIcon(dropEffect),
      color: this._getDropColor(dropEffect),
    };
  }

  /**
   * Private: Get drop icon
   * @param {string} dropEffect - Drop effect
   */
  _getDropIcon(dropEffect) {
    switch (dropEffect) {
      case "copy":
        return "📋";
      case "link":
        return "🔗";
      case "move":
      default:
        return "➡️";
    }
  }

  /**
   * Private: Get drop color
   * @param {string} dropEffect - Drop effect
   */
  _getDropColor(dropEffect) {
    switch (dropEffect) {
      case "copy":
        return "blue";
      case "link":
        return "purple";
      case "move":
      default:
        return "green";
    }
  }

  /**
   * Private: Check if target is compatible with drag
   * @param {Object} dragData - Drag data
   * @param {Object} target - Drop target
   */
  _isCompatibleTarget(dragData, target) {
    // Check accepts list
    if (target.data.accepts.length > 0) {
      return target.data.accepts.includes(dragData.type);
    }

    // Check rejects list
    if (target.data.rejects.includes(dragData.type)) {
      return false;
    }

    // Default to compatible
    return true;
  }

  /**
   * Private: Add operation to history
   * @param {Object} operation - Completed operation
   */
  _addToHistory(operation) {
    this.dragHistory.push({
      ...operation,
      addedToHistory: Date.now(),
    });

    // Keep history size manageable
    if (this.dragHistory.length > this.maxHistoryEntries) {
      this.dragHistory = this.dragHistory.slice(-this.maxHistoryEntries);
    }
  }

  /**
   * Private: Generate drag ID
   */
  _generateDragId() {
    return `drag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Register default operation handlers
   */
  _registerDefaultHandlers() {
    // Note to notebook assignment
    this.registerOperationHandler(
      "note-to-notebook-assign",
      async ({ drag, target }) => {
        await this.eventBus.emit("data:updateNote", {
          noteId: drag.data.id,
          updates: { notebook: target.data.id, folder: null },
        });
        return { assigned: true, notebook: target.data.id };
      }
    );

    // Note to folder assignment
    this.registerOperationHandler(
      "note-to-folder-assign",
      async ({ drag, target }) => {
        await this.eventBus.emit("data:updateNote", {
          noteId: drag.data.id,
          updates: { folder: target.data.id, notebook: null },
        });
        return { assigned: true, folder: target.data.id };
      }
    );

    // Note to tag assignment
    this.registerOperationHandler(
      "note-to-tag-assign",
      async ({ drag, target }) => {
        await this.eventBus.emit("tags:assign", {
          noteId: drag.data.id,
          tagIds: [target.data.id],
        });
        return { assigned: true, tag: target.data.id };
      }
    );

    // Note reordering
    this.registerOperationHandler(
      "note-to-note-reorder",
      async ({ drag, target, position }) => {
        await this.eventBus.emit("data:reorderNotes", {
          sourceId: drag.data.id,
          targetId: target.data.id,
          position: position.position,
        });
        return { reordered: true, position: position.position };
      }
    );

    // Notebook to folder assignment
    this.registerOperationHandler(
      "notebook-to-folder-assign",
      async ({ drag, target }) => {
        await this.eventBus.emit("data:updateNotebook", {
          notebookId: drag.data.id,
          updates: { folderId: target.data.id },
        });
        return { assigned: true, folder: target.data.id };
      }
    );
  }

  /**
   * Event handlers
   */
  async handleDragStartEvent(data) {
    console.log("DragDrop: Drag start event received", data);
  }

  async handleDragEndEvent(data) {
    console.log("DragDrop: Drag end event received", data);
  }

  async handleDropEvent(data) {
    console.log("DragDrop: Drop event received", data);
  }

  async handleDragHoverEvent(data) {
    console.log("DragDrop: Drag hover event received", data);
  }

  async handleDragLeaveEvent(data) {
    console.log("DragDrop: Drag leave event received", data);
  }

  /**
   * Cleanup - remove event listeners and clear caches
   */
  destroy() {
    // Cancel all active drags
    this.cancelAllDrags();

    // Remove event listeners
    this.eventBus.off("dragdrop:start", this.handleDragStartEvent);
    this.eventBus.off("dragdrop:end", this.handleDragEndEvent);
    this.eventBus.off("dragdrop:drop", this.handleDropEvent);
    this.eventBus.off("dragdrop:hover", this.handleDragHoverEvent);
    this.eventBus.off("dragdrop:leave", this.handleDragLeaveEvent);

    // Clear maps and history
    this.activeDrags.clear();
    this.dropTargets.clear();
    this.operationHandlers.clear();
    this.dragHistory.length = 0;
  }
}

// Create and export singleton instance
const dragDropStateManager = new DragDropStateManager();
export default dragDropStateManager;
