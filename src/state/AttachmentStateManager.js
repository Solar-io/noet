/**
 * AttachmentStateManager - Isolated file and attachment management
 *
 * Manages file uploads, downloads, validation, storage, and attachment lifecycle
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class AttachmentStateManager {
  constructor() {
    this.domain = "attachments";
    this.eventBus = eventBus;
    this.uploadQueue = new Map();
    this.downloadCache = new Map();
    this.progressTrackers = new Map();
    this.maxFileSize = 100 * 1024 * 1024; // 100MB default
    this.allowedFileTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/markdown",
      "application/zip",
      "application/json",
    ];

    this._initialize();
  }

  /**
   * Initialize the attachment state manager
   */
  async _initialize() {
    // Listen for attachment events
    await this.eventBus.on(
      "attachments:upload",
      this.handleUploadEvent.bind(this)
    );
    await this.eventBus.on(
      "attachments:delete",
      this.handleDeleteEvent.bind(this)
    );
    await this.eventBus.on(
      "attachments:download",
      this.handleDownloadEvent.bind(this)
    );
    await this.eventBus.on(
      "attachments:validate",
      this.handleValidateEvent.bind(this)
    );
    await this.eventBus.on(
      "data:noteDeleted",
      this.handleNoteDeletedEvent.bind(this)
    );

    console.log("AttachmentStateManager initialized");
  }

  /**
   * Get current attachment state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Upload file attachment
   * @param {File} file - File to upload
   * @param {string} noteId - Note ID to attach to
   * @param {string} userId - User ID uploading the file
   * @param {Object} options - Upload options
   */
  async uploadFile(file, noteId, userId, options = {}) {
    const uploadId = this._generateUploadId();

    try {
      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check if upload already in progress for this file
      const existingUpload = this._findExistingUpload(file, noteId);
      if (existingUpload) {
        throw new Error("File upload already in progress");
      }

      // Create upload tracker
      const uploadTracker = {
        id: uploadId,
        file,
        noteId,
        userId,
        status: "preparing",
        progress: 0,
        startTime: Date.now(),
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
      };

      this.uploadQueue.set(uploadId, uploadTracker);
      this.progressTrackers.set(uploadId, uploadTracker);

      // Update state
      const currentState = this.getState();
      const updatedUploads = new Map(currentState.activeUploads);
      updatedUploads.set(uploadId, uploadTracker);

      await stateManager.setState(
        this.domain,
        {
          activeUploads: updatedUploads,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.uploadFile",
          operation: "uploadStart",
          uploadId,
          noteId,
        }
      );

      // Emit upload start event
      await this.eventBus.emit("attachments:uploadStarted", {
        uploadId,
        file: { name: file.name, size: file.size, type: file.type },
        noteId,
        userId,
      });

      // Start upload process
      const result = await this._performUpload(uploadTracker, options);

      // Clean up upload tracker
      this.uploadQueue.delete(uploadId);
      this.progressTrackers.delete(uploadId);

      // Update state
      const finalState = this.getState();
      const finalUploads = new Map(finalState.activeUploads);
      finalUploads.delete(uploadId);

      const updatedAttachments = new Map(finalState.attachments);
      updatedAttachments.set(result.attachment.id, result.attachment);

      await stateManager.setState(
        this.domain,
        {
          activeUploads: finalUploads,
          attachments: updatedAttachments,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.uploadFile",
          operation: "uploadComplete",
          uploadId,
          attachmentId: result.attachment.id,
        }
      );

      // Emit upload complete event
      await this.eventBus.emit("attachments:uploadCompleted", {
        uploadId,
        attachment: result.attachment,
        noteId,
        userId,
      });

      return result;
    } catch (error) {
      // Clean up on error
      this.uploadQueue.delete(uploadId);
      this.progressTrackers.delete(uploadId);

      // Update state to remove failed upload
      const currentState = this.getState();
      const updatedUploads = new Map(currentState.activeUploads);
      updatedUploads.delete(uploadId);

      await stateManager.setState(
        this.domain,
        {
          activeUploads: updatedUploads,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.uploadFile",
          operation: "uploadError",
          uploadId,
          error: error.message,
        }
      );

      // Emit upload error event
      await this.eventBus.emit("attachments:uploadError", {
        uploadId,
        error,
        file: { name: file.name, size: file.size, type: file.type },
        noteId,
        userId,
      });

      throw error;
    }
  }

  /**
   * Delete attachment
   * @param {string} attachmentId - Attachment ID to delete
   * @param {string} noteId - Note ID containing the attachment
   * @param {string} userId - User ID deleting the attachment
   */
  async deleteAttachment(attachmentId, noteId, userId) {
    try {
      const currentState = this.getState();
      const attachment = currentState.attachments.get(attachmentId);

      if (!attachment) {
        throw new Error(`Attachment with ID "${attachmentId}" not found`);
      }

      // Perform deletion
      await this._performDeletion(attachment, noteId, userId);

      // Update state
      const updatedAttachments = new Map(currentState.attachments);
      updatedAttachments.delete(attachmentId);

      await stateManager.setState(
        this.domain,
        {
          attachments: updatedAttachments,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.deleteAttachment",
          operation: "delete",
          attachmentId,
          noteId,
        }
      );

      // Emit deletion event
      await this.eventBus.emit("attachments:deleted", {
        attachment,
        noteId,
        userId,
      });

      return { success: true, deletedAttachment: attachment };
    } catch (error) {
      await this.eventBus.emit("attachments:deleteError", error);
      throw error;
    }
  }

  /**
   * Download attachment
   * @param {string} attachmentId - Attachment ID to download
   * @param {string} userId - User ID downloading the attachment
   */
  async downloadAttachment(attachmentId, userId) {
    try {
      const currentState = this.getState();
      const attachment = currentState.attachments.get(attachmentId);

      if (!attachment) {
        throw new Error(`Attachment with ID "${attachmentId}" not found`);
      }

      // Check cache first
      const cached = this.downloadCache.get(attachmentId);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        // 5 minute cache
        await this.eventBus.emit("attachments:downloadCompleted", {
          attachment,
          cached: true,
          userId,
        });
        return cached.blob;
      }

      // Perform download
      const blob = await this._performDownload(attachment, userId);

      // Cache the result
      this.downloadCache.set(attachmentId, {
        blob,
        timestamp: Date.now(),
      });

      // Emit download event
      await this.eventBus.emit("attachments:downloadCompleted", {
        attachment,
        cached: false,
        userId,
      });

      return blob;
    } catch (error) {
      await this.eventBus.emit("attachments:downloadError", error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   */
  async validateFile(file) {
    try {
      // Check if file exists
      if (!file) {
        return { valid: false, error: "No file provided" };
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        return {
          valid: false,
          error: `File size (${this._formatFileSize(
            file.size
          )}) exceeds maximum allowed size (${this._formatFileSize(
            this.maxFileSize
          )})`,
        };
      }

      // Check file type
      if (!this.allowedFileTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File type "${file.type}" is not allowed`,
        };
      }

      // Check filename
      if (!file.name || file.name.length > 255) {
        return {
          valid: false,
          error: "Invalid filename or filename too long",
        };
      }

      // Check for malicious files
      const maliciousCheck = await this._checkForMaliciousContent(file);
      if (!maliciousCheck.safe) {
        return {
          valid: false,
          error: maliciousCheck.reason,
        };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `Validation error: ${error.message}` };
    }
  }

  /**
   * Get attachments for a note
   * @param {string} noteId - Note ID
   */
  getAttachmentsForNote(noteId) {
    const currentState = this.getState();
    return Array.from(currentState.attachments.values()).filter(
      (attachment) => attachment.noteId === noteId
    );
  }

  /**
   * Get attachment by ID
   * @param {string} attachmentId - Attachment ID
   */
  getAttachment(attachmentId) {
    const currentState = this.getState();
    return currentState.attachments.get(attachmentId);
  }

  /**
   * Get upload progress
   * @param {string} uploadId - Upload ID
   */
  getUploadProgress(uploadId) {
    return this.progressTrackers.get(uploadId);
  }

  /**
   * Get attachment statistics
   */
  getAttachmentStatistics() {
    const currentState = this.getState();
    const attachments = Array.from(currentState.attachments.values());

    const stats = {
      total: attachments.length,
      totalSize: attachments.reduce((sum, att) => sum + att.size, 0),
      byType: {},
      byNote: {},
      largest: null,
      newest: null,
      oldest: null,
    };

    attachments.forEach((attachment) => {
      // By type
      const type = attachment.type || "unknown";
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // By note
      stats.byNote[attachment.noteId] =
        (stats.byNote[attachment.noteId] || 0) + 1;

      // Largest file
      if (!stats.largest || attachment.size > stats.largest.size) {
        stats.largest = attachment;
      }

      // Newest file
      if (
        !stats.newest ||
        new Date(attachment.uploadedAt) > new Date(stats.newest.uploadedAt)
      ) {
        stats.newest = attachment;
      }

      // Oldest file
      if (
        !stats.oldest ||
        new Date(attachment.uploadedAt) < new Date(stats.oldest.uploadedAt)
      ) {
        stats.oldest = attachment;
      }
    });

    return stats;
  }

  /**
   * Clean up orphaned attachments
   * @param {Array<string>} validNoteIds - Array of valid note IDs
   */
  async cleanupOrphanedAttachments(validNoteIds) {
    try {
      const currentState = this.getState();
      const attachments = Array.from(currentState.attachments.values());
      const orphanedAttachments = attachments.filter(
        (attachment) => !validNoteIds.includes(attachment.noteId)
      );

      if (orphanedAttachments.length === 0) {
        return { cleaned: 0, attachments: [] };
      }

      // Remove orphaned attachments
      const updatedAttachments = new Map(currentState.attachments);
      const cleanedAttachments = [];

      for (const attachment of orphanedAttachments) {
        try {
          await this._performDeletion(attachment, attachment.noteId, "system");
          updatedAttachments.delete(attachment.id);
          cleanedAttachments.push(attachment);
        } catch (error) {
          console.error(
            `Failed to cleanup attachment ${attachment.id}:`,
            error
          );
        }
      }

      // Update state
      await stateManager.setState(
        this.domain,
        {
          attachments: updatedAttachments,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.cleanupOrphanedAttachments",
          operation: "cleanup",
        }
      );

      // Emit cleanup event
      await this.eventBus.emit("attachments:cleanupCompleted", {
        cleaned: cleanedAttachments.length,
        attachments: cleanedAttachments,
      });

      return {
        cleaned: cleanedAttachments.length,
        attachments: cleanedAttachments,
      };
    } catch (error) {
      await this.eventBus.emit("attachments:cleanupError", error);
      throw error;
    }
  }

  /**
   * Update attachment metadata
   * @param {string} attachmentId - Attachment ID
   * @param {Object} metadata - Metadata to update
   * @param {string} userId - User ID making the update
   */
  async updateAttachmentMetadata(attachmentId, metadata, userId) {
    try {
      const currentState = this.getState();
      const attachment = currentState.attachments.get(attachmentId);

      if (!attachment) {
        throw new Error(`Attachment with ID "${attachmentId}" not found`);
      }

      // Validate metadata
      const validatedMetadata = await this._validateMetadata(metadata);

      // Update attachment
      const updatedAttachment = {
        ...attachment,
        metadata: { ...attachment.metadata, ...validatedMetadata },
        updatedAt: new Date().toISOString(),
      };

      // Update state
      const updatedAttachments = new Map(currentState.attachments);
      updatedAttachments.set(attachmentId, updatedAttachment);

      await stateManager.setState(
        this.domain,
        {
          attachments: updatedAttachments,
          lastUpdate: Date.now(),
        },
        {
          source: "AttachmentStateManager.updateAttachmentMetadata",
          operation: "metadataUpdate",
          attachmentId,
        }
      );

      // Emit metadata update event
      await this.eventBus.emit("attachments:metadataUpdated", {
        attachment: updatedAttachment,
        previousAttachment: attachment,
        userId,
      });

      return updatedAttachment;
    } catch (error) {
      await this.eventBus.emit("attachments:metadataUpdateError", error);
      throw error;
    }
  }

  /**
   * Private: Perform file upload
   * @param {Object} uploadTracker - Upload tracker object
   * @param {Object} options - Upload options
   */
  async _performUpload(uploadTracker, options = {}) {
    const { file, noteId, userId } = uploadTracker;

    // Update status
    uploadTracker.status = "uploading";
    await this._updateUploadProgress(uploadTracker.id, 0);

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("noteId", noteId);
    formData.append("userId", userId);

    // Get backend URL (in real app, this would come from config)
    const backendUrl = await this._getBackendUrl();

    // Perform upload with progress tracking
    const response = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteId}/attachments`,
      {
        method: "POST",
        body: formData,
        // Add progress tracking if supported
      }
    );

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    // Create attachment object
    const attachment = {
      id: result.attachment.filename || this._generateAttachmentId(),
      filename: result.attachment.filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      noteId,
      userId,
      uploadedAt: new Date().toISOString(),
      url: result.relativePath || result.url,
      metadata: {
        uploadId: uploadTracker.id,
        uploadDuration: Date.now() - uploadTracker.startTime,
        checksum: await this._calculateChecksum(file),
      },
    };

    // Update progress to 100%
    await this._updateUploadProgress(uploadTracker.id, 100);
    uploadTracker.status = "completed";

    return { attachment, result };
  }

  /**
   * Private: Perform file deletion
   * @param {Object} attachment - Attachment to delete
   * @param {string} noteId - Note ID
   * @param {string} userId - User ID
   */
  async _performDeletion(attachment, noteId, userId) {
    const backendUrl = await this._getBackendUrl();

    const response = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteId}/attachments/${attachment.filename}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Deletion failed: ${response.status} ${response.statusText}`
      );
    }

    // Remove from download cache
    this.downloadCache.delete(attachment.id);

    return await response.json();
  }

  /**
   * Private: Perform file download
   * @param {Object} attachment - Attachment to download
   * @param {string} userId - User ID
   */
  async _performDownload(attachment, userId) {
    const backendUrl = await this._getBackendUrl();

    const response = await fetch(
      `${backendUrl}/api/${userId}/notes/${attachment.noteId}/attachments/${attachment.filename}`
    );

    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.blob();
  }

  /**
   * Private: Update upload progress
   * @param {string} uploadId - Upload ID
   * @param {number} progress - Progress percentage (0-100)
   */
  async _updateUploadProgress(uploadId, progress) {
    const tracker = this.progressTrackers.get(uploadId);
    if (tracker) {
      tracker.progress = progress;

      // Emit progress event
      await this.eventBus.emit("attachments:uploadProgress", {
        uploadId,
        progress,
        status: tracker.status,
      });
    }
  }

  /**
   * Private: Check for malicious content
   * @param {File} file - File to check
   */
  async _checkForMaliciousContent(file) {
    // Basic malicious file checks
    const suspiciousExtensions = [
      ".exe",
      ".bat",
      ".cmd",
      ".scr",
      ".pif",
      ".jar",
    ];
    const fileExtension = file.name.toLowerCase().split(".").pop();

    if (suspiciousExtensions.includes(`.${fileExtension}`)) {
      return { safe: false, reason: "Potentially dangerous file extension" };
    }

    // Check file size vs type mismatches
    if (file.type.startsWith("image/") && file.size > 50 * 1024 * 1024) {
      return { safe: false, reason: "Image file unusually large" };
    }

    return { safe: true };
  }

  /**
   * Private: Calculate file checksum
   * @param {File} file - File to calculate checksum for
   */
  async _calculateChecksum(file) {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (error) {
      return `fallback-${Date.now()}-${Math.random()}`;
    }
  }

  /**
   * Private: Validate metadata
   * @param {Object} metadata - Metadata to validate
   */
  async _validateMetadata(metadata) {
    const validated = {};

    if (metadata.description !== undefined) {
      validated.description = String(metadata.description).slice(0, 500);
    }

    if (metadata.tags !== undefined && Array.isArray(metadata.tags)) {
      validated.tags = metadata.tags.slice(0, 10);
    }

    return validated;
  }

  /**
   * Private: Format file size
   * @param {number} bytes - Size in bytes
   */
  _formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Private: Find existing upload for file and note
   * @param {File} file - File to check
   * @param {string} noteId - Note ID
   */
  _findExistingUpload(file, noteId) {
    for (const upload of this.uploadQueue.values()) {
      if (
        upload.noteId === noteId &&
        upload.file.name === file.name &&
        upload.file.size === file.size &&
        upload.status !== "completed" &&
        upload.status !== "error"
      ) {
        return upload;
      }
    }
    return null;
  }

  /**
   * Private: Generate upload ID
   */
  _generateUploadId() {
    return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Generate attachment ID
   */
  _generateAttachmentId() {
    return `attachment-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Private: Get backend URL
   */
  async _getBackendUrl() {
    // In real app, this would come from config service
    return "http://localhost:3004";
  }

  /**
   * Event handlers
   */
  async handleUploadEvent(data) {
    console.log("Attachments: Upload event received", data);
  }

  async handleDeleteEvent(data) {
    console.log("Attachments: Delete event received", data);
  }

  async handleDownloadEvent(data) {
    console.log("Attachments: Download event received", data);
  }

  async handleValidateEvent(data) {
    console.log("Attachments: Validate event received", data);
  }

  async handleNoteDeletedEvent(data) {
    // Clean up attachments when note is deleted
    if (data.noteId) {
      const attachments = this.getAttachmentsForNote(data.noteId);
      for (const attachment of attachments) {
        try {
          await this.deleteAttachment(
            attachment.id,
            data.noteId,
            data.userId || "system"
          );
        } catch (error) {
          console.error(`Failed to delete attachment ${attachment.id}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup - remove event listeners and clear caches
   */
  destroy() {
    // Remove event listeners
    this.eventBus.off("attachments:upload", this.handleUploadEvent);
    this.eventBus.off("attachments:delete", this.handleDeleteEvent);
    this.eventBus.off("attachments:download", this.handleDownloadEvent);
    this.eventBus.off("attachments:validate", this.handleValidateEvent);
    this.eventBus.off("data:noteDeleted", this.handleNoteDeletedEvent);

    // Clear caches and queues
    this.uploadQueue.clear();
    this.downloadCache.clear();
    this.progressTrackers.clear();
  }
}

// Create and export singleton instance
const attachmentStateManager = new AttachmentStateManager();
export default attachmentStateManager;
