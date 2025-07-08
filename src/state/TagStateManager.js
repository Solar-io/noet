/**
 * TagStateManager - Isolated tag and metadata management
 *
 * Manages tag creation, assignment, filtering, and metadata operations
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class TagStateManager {
  constructor() {
    this.domain = "tags";
    this.eventBus = eventBus;
    this.tagCache = new Map();
    this.metadataCache = new Map();
    this.uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    this._initialize();
  }

  /**
   * Initialize the tag state manager
   */
  async _initialize() {
    // Listen for tag events
    await this.eventBus.on("tags:create", this.handleCreateEvent.bind(this));
    await this.eventBus.on("tags:update", this.handleUpdateEvent.bind(this));
    await this.eventBus.on("tags:delete", this.handleDeleteEvent.bind(this));
    await this.eventBus.on("tags:assign", this.handleAssignEvent.bind(this));
    await this.eventBus.on(
      "tags:unassign",
      this.handleUnassignEvent.bind(this)
    );
    await this.eventBus.on(
      "data:noteUpdated",
      this.handleNoteUpdateEvent.bind(this)
    );

    console.log("TagStateManager initialized");
  }

  /**
   * Get current tag state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @param {string} tagData.name - Tag name
   * @param {string} tagData.color - Tag color
   * @param {string} tagData.description - Optional tag description
   * @param {string} userId - User ID creating the tag
   */
  async createTag(tagData, userId) {
    try {
      // Validate tag data
      const validatedTag = await this._validateTagData(tagData);

      // Check for duplicate tag names
      const currentState = this.getState();
      const existingTag = Array.from(currentState.tags.values()).find(
        (tag) => tag.name.toLowerCase() === validatedTag.name.toLowerCase()
      );

      if (existingTag) {
        throw new Error(`Tag with name "${validatedTag.name}" already exists`);
      }

      // Generate tag ID
      const tagId = this._generateTagId();

      // Create tag object
      const tag = {
        id: tagId,
        name: validatedTag.name,
        color: validatedTag.color,
        description: validatedTag.description || "",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        noteCount: 0,
        metadata: {
          isSystem: false,
          isArchived: false,
          sortOrder: Date.now(),
        },
      };

      // Update state
      const updatedTags = new Map(currentState.tags);
      updatedTags.set(tagId, tag);

      await stateManager.setState(
        this.domain,
        {
          tags: updatedTags,
          lastUpdate: Date.now(),
        },
        {
          source: "TagStateManager.createTag",
          operation: "create",
          tagId,
        }
      );

      // Update cache
      this.tagCache.set(tagId, tag);

      // Emit tag created event
      await this.eventBus.emit("tags:created", { tag, userId });

      return tag;
    } catch (error) {
      await this.eventBus.emit("tags:createError", error);
      throw error;
    }
  }

  /**
   * Update an existing tag
   * @param {string} tagId - Tag ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User ID making the update
   */
  async updateTag(tagId, updates, userId) {
    try {
      const currentState = this.getState();
      const existingTag = currentState.tags.get(tagId);

      if (!existingTag) {
        throw new Error(`Tag with ID "${tagId}" not found`);
      }

      // Validate updates
      const validatedUpdates = await this._validateTagUpdates(updates);

      // Check for duplicate names if name is being updated
      if (validatedUpdates.name && validatedUpdates.name !== existingTag.name) {
        const duplicateTag = Array.from(currentState.tags.values()).find(
          (tag) =>
            tag.id !== tagId &&
            tag.name.toLowerCase() === validatedUpdates.name.toLowerCase()
        );

        if (duplicateTag) {
          throw new Error(
            `Tag with name "${validatedUpdates.name}" already exists`
          );
        }
      }

      // Create updated tag
      const updatedTag = {
        ...existingTag,
        ...validatedUpdates,
        updatedAt: new Date().toISOString(),
      };

      // Update state
      const updatedTags = new Map(currentState.tags);
      updatedTags.set(tagId, updatedTag);

      await stateManager.setState(
        this.domain,
        {
          tags: updatedTags,
          lastUpdate: Date.now(),
        },
        {
          source: "TagStateManager.updateTag",
          operation: "update",
          tagId,
        }
      );

      // Update cache
      this.tagCache.set(tagId, updatedTag);

      // Emit tag updated event
      await this.eventBus.emit("tags:updated", {
        tag: updatedTag,
        previousTag: existingTag,
        userId,
      });

      return updatedTag;
    } catch (error) {
      await this.eventBus.emit("tags:updateError", error);
      throw error;
    }
  }

  /**
   * Delete a tag
   * @param {string} tagId - Tag ID
   * @param {string} userId - User ID deleting the tag
   * @param {boolean} force - Force delete even if tag has notes
   */
  async deleteTag(tagId, userId, force = false) {
    try {
      const currentState = this.getState();
      const existingTag = currentState.tags.get(tagId);

      if (!existingTag) {
        throw new Error(`Tag with ID "${tagId}" not found`);
      }

      // Check if tag has notes assigned
      if (existingTag.noteCount > 0 && !force) {
        throw new Error(
          `Cannot delete tag "${existingTag.name}" because it has ${existingTag.noteCount} notes assigned. Use force delete to proceed.`
        );
      }

      // Remove tag from state
      const updatedTags = new Map(currentState.tags);
      updatedTags.delete(tagId);

      await stateManager.setState(
        this.domain,
        {
          tags: updatedTags,
          lastUpdate: Date.now(),
        },
        {
          source: "TagStateManager.deleteTag",
          operation: "delete",
          tagId,
        }
      );

      // Remove from cache
      this.tagCache.delete(tagId);

      // Emit tag deleted event
      await this.eventBus.emit("tags:deleted", {
        tag: existingTag,
        userId,
        force,
      });

      // If force delete, emit event to remove tag from all notes
      if (force && existingTag.noteCount > 0) {
        await this.eventBus.emit("tags:forceRemoveFromNotes", { tagId });
      }

      return { success: true, deletedTag: existingTag };
    } catch (error) {
      await this.eventBus.emit("tags:deleteError", error);
      throw error;
    }
  }

  /**
   * Assign tags to a note
   * @param {string} noteId - Note ID
   * @param {Array<string>} tagIds - Array of tag IDs to assign
   * @param {string} userId - User ID making the assignment
   */
  async assignTagsToNote(noteId, tagIds, userId) {
    try {
      // Validate inputs
      if (!noteId || !Array.isArray(tagIds)) {
        throw new Error("Invalid note ID or tag IDs");
      }

      // Filter out UUID tags and validate tag IDs
      const validTagIds = await this._validateAndFilterTagIds(tagIds);

      // Get current state
      const currentState = this.getState();

      // Verify all tags exist
      const invalidTags = validTagIds.filter(
        (tagId) => !currentState.tags.has(tagId)
      );
      if (invalidTags.length > 0) {
        throw new Error(`Tags not found: ${invalidTags.join(", ")}`);
      }

      // Update note count for tags
      const updatedTags = new Map(currentState.tags);
      validTagIds.forEach((tagId) => {
        const tag = updatedTags.get(tagId);
        if (tag) {
          updatedTags.set(tagId, {
            ...tag,
            noteCount: tag.noteCount + 1,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      await stateManager.setState(
        this.domain,
        {
          tags: updatedTags,
          lastUpdate: Date.now(),
        },
        {
          source: "TagStateManager.assignTagsToNote",
          operation: "assign",
          noteId,
          tagIds: validTagIds,
        }
      );

      // Update cache
      validTagIds.forEach((tagId) => {
        const tag = updatedTags.get(tagId);
        if (tag) {
          this.tagCache.set(tagId, tag);
        }
      });

      // Emit tags assigned event
      await this.eventBus.emit("tags:assigned", {
        noteId,
        tagIds: validTagIds,
        userId,
      });

      return { success: true, assignedTags: validTagIds };
    } catch (error) {
      await this.eventBus.emit("tags:assignError", error);
      throw error;
    }
  }

  /**
   * Unassign tags from a note
   * @param {string} noteId - Note ID
   * @param {Array<string>} tagIds - Array of tag IDs to unassign
   * @param {string} userId - User ID making the unassignment
   */
  async unassignTagsFromNote(noteId, tagIds, userId) {
    try {
      // Validate inputs
      if (!noteId || !Array.isArray(tagIds)) {
        throw new Error("Invalid note ID or tag IDs");
      }

      // Filter out UUID tags and validate tag IDs
      const validTagIds = await this._validateAndFilterTagIds(tagIds);

      // Get current state
      const currentState = this.getState();

      // Update note count for tags
      const updatedTags = new Map(currentState.tags);
      validTagIds.forEach((tagId) => {
        const tag = updatedTags.get(tagId);
        if (tag && tag.noteCount > 0) {
          updatedTags.set(tagId, {
            ...tag,
            noteCount: Math.max(0, tag.noteCount - 1),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      await stateManager.setState(
        this.domain,
        {
          tags: updatedTags,
          lastUpdate: Date.now(),
        },
        {
          source: "TagStateManager.unassignTagsFromNote",
          operation: "unassign",
          noteId,
          tagIds: validTagIds,
        }
      );

      // Update cache
      validTagIds.forEach((tagId) => {
        const tag = updatedTags.get(tagId);
        if (tag) {
          this.tagCache.set(tagId, tag);
        }
      });

      // Emit tags unassigned event
      await this.eventBus.emit("tags:unassigned", {
        noteId,
        tagIds: validTagIds,
        userId,
      });

      return { success: true, unassignedTags: validTagIds };
    } catch (error) {
      await this.eventBus.emit("tags:unassignError", error);
      throw error;
    }
  }

  /**
   * Filter out UUID tags from a tag array
   * @param {Array<string>} tags - Array of tag IDs or names
   */
  filterUUIDTags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags.filter((tag) => !this.uuidRegex.test(tag));
  }

  /**
   * Get tag by ID or name
   * @param {string} identifier - Tag ID or name
   */
  getTag(identifier) {
    const currentState = this.getState();

    // Try by ID first
    if (currentState.tags.has(identifier)) {
      return currentState.tags.get(identifier);
    }

    // Try by name
    return Array.from(currentState.tags.values()).find(
      (tag) => tag.name === identifier
    );
  }

  /**
   * Get tags by IDs
   * @param {Array<string>} tagIds - Array of tag IDs
   */
  getTagsByIds(tagIds) {
    const currentState = this.getState();
    const filteredIds = this.filterUUIDTags(tagIds);

    return filteredIds
      .map((tagId) => currentState.tags.get(tagId))
      .filter(Boolean);
  }

  /**
   * Get tag names from tag IDs
   * @param {Array<string>} tagIds - Array of tag IDs
   */
  getTagNames(tagIds) {
    const filteredIds = this.filterUUIDTags(tagIds);
    const tags = this.getTagsByIds(filteredIds);

    return tags.map((tag) => (tag ? tag.name : "Unknown Tag"));
  }

  /**
   * Search tags by name
   * @param {string} query - Search query
   * @param {Object} options - Search options
   */
  searchTags(query, options = {}) {
    const currentState = this.getState();
    const { limit = 50, includeArchived = false, sortBy = "name" } = options;

    let tags = Array.from(currentState.tags.values());

    // Filter by archived status
    if (!includeArchived) {
      tags = tags.filter((tag) => !tag.metadata.isArchived);
    }

    // Apply search filter
    if (query && query.trim()) {
      const searchTerm = query.toLowerCase().trim();
      tags = tags.filter(
        (tag) =>
          tag.name.toLowerCase().includes(searchTerm) ||
          tag.description.toLowerCase().includes(searchTerm)
      );
    }

    // Sort tags
    tags.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "noteCount":
          return b.noteCount - a.noteCount;
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "updated":
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Apply limit
    return tags.slice(0, limit);
  }

  /**
   * Get tag statistics
   */
  getTagStatistics() {
    const currentState = this.getState();
    const tags = Array.from(currentState.tags.values());

    return {
      total: tags.length,
      active: tags.filter((tag) => !tag.metadata.isArchived).length,
      archived: tags.filter((tag) => tag.metadata.isArchived).length,
      withNotes: tags.filter((tag) => tag.noteCount > 0).length,
      unused: tags.filter((tag) => tag.noteCount === 0).length,
      mostUsed: tags.reduce(
        (max, tag) => (tag.noteCount > (max?.noteCount || 0) ? tag : max),
        null
      ),
      averageNotesPerTag:
        tags.length > 0
          ? tags.reduce((sum, tag) => sum + tag.noteCount, 0) / tags.length
          : 0,
    };
  }

  /**
   * Validate tag name
   * @param {string} name - Tag name to validate
   */
  validateTagName(name) {
    if (!name || typeof name !== "string") {
      return {
        valid: false,
        error: "Tag name is required and must be a string",
      };
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
      return { valid: false, error: "Tag name cannot be empty" };
    }

    if (trimmedName.length > 50) {
      return { valid: false, error: "Tag name cannot exceed 50 characters" };
    }

    if (this.uuidRegex.test(trimmedName)) {
      return { valid: false, error: "Tag name cannot be a UUID" };
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      return {
        valid: false,
        error:
          "Tag name can only contain letters, numbers, spaces, hyphens, and underscores",
      };
    }

    return { valid: true, name: trimmedName };
  }

  /**
   * Get tag color suggestions based on existing tags
   */
  getColorSuggestions() {
    const currentState = this.getState();
    const usedColors = new Set(
      Array.from(currentState.tags.values()).map((tag) => tag.color)
    );

    const availableColors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#ec4899",
      "#6366f1",
      "#14b8a6",
      "#eab308",
      "#dc2626",
      "#7c3aed",
      "#0891b2",
    ];

    return availableColors.filter((color) => !usedColors.has(color));
  }

  /**
   * Private: Validate tag data
   * @param {Object} tagData - Tag data to validate
   */
  async _validateTagData(tagData) {
    const nameValidation = this.validateTagName(tagData.name);
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error);
    }

    // Validate color
    const color = tagData.color || "#3b82f6";
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error("Invalid color format. Must be a valid hex color.");
    }

    return {
      name: nameValidation.name,
      color,
      description: tagData.description || "",
    };
  }

  /**
   * Private: Validate tag updates
   * @param {Object} updates - Updates to validate
   */
  async _validateTagUpdates(updates) {
    const validatedUpdates = {};

    if (updates.name !== undefined) {
      const nameValidation = this.validateTagName(updates.name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error);
      }
      validatedUpdates.name = nameValidation.name;
    }

    if (updates.color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(updates.color)) {
        throw new Error("Invalid color format. Must be a valid hex color.");
      }
      validatedUpdates.color = updates.color;
    }

    if (updates.description !== undefined) {
      validatedUpdates.description = updates.description || "";
    }

    if (updates.metadata !== undefined) {
      validatedUpdates.metadata = { ...updates.metadata };
    }

    return validatedUpdates;
  }

  /**
   * Private: Validate and filter tag IDs
   * @param {Array<string>} tagIds - Tag IDs to validate
   */
  async _validateAndFilterTagIds(tagIds) {
    if (!Array.isArray(tagIds)) {
      throw new Error("Tag IDs must be an array");
    }

    // Filter out UUID tags
    const filteredIds = this.filterUUIDTags(tagIds);

    // Remove duplicates
    return [...new Set(filteredIds)];
  }

  /**
   * Private: Generate tag ID
   */
  _generateTagId() {
    return `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handlers
   */
  async handleCreateEvent(data) {
    console.log("Tags: Create event received", data);
  }

  async handleUpdateEvent(data) {
    console.log("Tags: Update event received", data);
  }

  async handleDeleteEvent(data) {
    console.log("Tags: Delete event received", data);
  }

  async handleAssignEvent(data) {
    console.log("Tags: Assign event received", data);
  }

  async handleUnassignEvent(data) {
    console.log("Tags: Unassign event received", data);
  }

  async handleNoteUpdateEvent(data) {
    // Handle note updates that might affect tag assignments
    if (data.tagsChanged) {
      console.log("Tags: Note update with tag changes", data);
      // This could trigger tag count recalculation if needed
    }
  }

  /**
   * Cleanup - remove event listeners
   */
  destroy() {
    // Remove event listeners
    this.eventBus.off("tags:create", this.handleCreateEvent);
    this.eventBus.off("tags:update", this.handleUpdateEvent);
    this.eventBus.off("tags:delete", this.handleDeleteEvent);
    this.eventBus.off("tags:assign", this.handleAssignEvent);
    this.eventBus.off("tags:unassign", this.handleUnassignEvent);
    this.eventBus.off("data:noteUpdated", this.handleNoteUpdateEvent);

    // Clear caches
    this.tagCache.clear();
    this.metadataCache.clear();
  }
}

// Create and export singleton instance
const tagStateManager = new TagStateManager();
export default tagStateManager;
