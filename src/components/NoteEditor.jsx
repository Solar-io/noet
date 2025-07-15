import React, { useState, useEffect } from "react";
import {
  Save,
  Star,
  Archive,
  Trash2,
  Book,
  FolderOpen,
  Hash,
  Clock,
  Calendar,
  MoreHorizontal,
  Edit2,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import TagManager from "./TagManager.jsx";
import NotebookManager from "./NotebookManager.jsx";
import FolderManager from "./FolderManager.jsx";
import configService from "../configService.js";

const NoteEditor = ({
  note,
  userId,
  onSave,
  onContentChange,
  onDelete,
  onNoteUpdate,
  onTagsUpdate, // Add onTagsUpdate prop
  availableTags = [], // Receive tags as props instead of loading them
  children,
}) => {
  const [noteTags, setNoteTags] = useState(note?.tags || []);
  const [noteNotebook, setNoteNotebook] = useState(note?.notebook || null);
  const [noteFolder, setNoteFolder] = useState(note?.folder || null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [backendUrl, setBackendUrl] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(note?.title || "");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [originalCurrentContent, setOriginalCurrentContent] = useState(null); // Store original content for version preview
  const [isVersionPreview, setIsVersionPreview] = useState(false); // Track if we're in preview mode

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTagDropdown && !event.target.closest(".tag-dropdown-container")) {
        setShowTagDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagDropdown]);

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
        console.log("NoteEditor: Backend URL set to", url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();
  }, [userId]);

  // Helper function to filter out UUID tags
  const filterValidTags = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Return only valid UUID tags (the opposite of the previous logic)
    return tagIds.filter((tagId) => UUID_REGEX.test(tagId));
  };

  const getTagNames = (tagIds) => {
    const validTagIds = filterValidTags(tagIds);

    console.log(
      "NoteEditor: Getting tag names for IDs:",
      validTagIds,
      "from available tags:",
      availableTags,
      "(filtered valid UUIDs from:",
      tagIds,
      ")"
    );

    if (availableTags.length === 0) {
      // If tags haven't loaded yet, show loading state or just the IDs temporarily
      return validTagIds.map((tagId) => `Loading...`);
    }

    return validTagIds.map((tagId) => {
      const tag = availableTags.find((t) => t.id === tagId);
      console.log("NoteEditor: Tag ID", tagId, "mapped to:", tag);
      return tag ? tag.name : `Tag ${tagId.substring(0, 8)}...`; // Show a truncated ID if no tag object found
    });
  };

  useEffect(() => {
    if (note) {
      setNoteTags(note.tags || []);
      setNoteNotebook(note.notebook || null);
      setNoteFolder(note.folder || null);
      setEditingTitle(note.title || "");
      setIsEditingTitle(false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!note || saving) return;

    try {
      setSaving(true);

      // Save the note with updated metadata
      await onSave?.({
        ...note,
        tags: noteTags,
        notebook: noteNotebook,
        folder: noteFolder,
      });

      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const updateNoteMetadata = async (updates) => {
    if (!note || !backendUrl) return;

    try {
      console.log("🔄 Updating note metadata:", updates);
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates), // Send updates directly, not wrapped in metadata
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to update note:", response.status, errorText);
        throw new Error(`Failed to update note: ${response.status}`);
      }

      const updatedNote = await response.json();
      console.log("✅ Note updated successfully:", updatedNote);
      onNoteUpdate?.(updatedNote);
    } catch (error) {
      console.error("Error updating note metadata:", error);
      alert("Failed to update note");
    }
  };

  const handleTagsChange = (newTags) => {
    setNoteTags(newTags);
    updateNoteMetadata({ tags: newTags });
  };

  const handleNotebookChange = (newNotebook) => {
    setNoteNotebook(newNotebook);
    updateNoteMetadata({ notebook: newNotebook });
  };

  const handleFolderChange = (newFolder) => {
    setNoteFolder(newFolder);
    updateNoteMetadata({ folder: newFolder });
  };

  const toggleNoteStar = () => {
    const newStarred = !note.starred;
    updateNoteMetadata({ starred: newStarred });
  };

  const toggleNoteArchive = () => {
    const newArchived = !note.archived;
    updateNoteMetadata({ archived: newArchived });
  };

  const handleDeleteNote = () => {
    if (confirm("Are you sure you want to delete this note?")) {
      onDelete?.(note.id);
    }
  };

  const startTitleEdit = () => {
    setIsEditingTitle(true);
    setEditingTitle(note.title || "");
  };

  const saveTitleEdit = async () => {
    if (!note || !backendUrl) return;

    try {
      const updatedTitle = editingTitle.trim() || "Untitled";
      await updateNoteMetadata({ title: updatedTitle });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error updating note title:", error);
      alert("Failed to update note title");
    }
  };

  const cancelTitleEdit = () => {
    setIsEditingTitle(false);
    setEditingTitle(note.title || "");
  };

  const toggleTagSelection = (tagId) => {
    const newTags = noteTags.includes(tagId)
      ? noteTags.filter((id) => id !== tagId)
      : [...noteTags, tagId];
    setNoteTags(newTags);
    updateNoteMetadata({ tags: newTags });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Load version history from API
  const loadVersionHistory = async () => {
    if (!note || !backendUrl) return;

    try {
      setLoadingVersions(true);
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/versions`
      );

      if (!response.ok) throw new Error("Failed to load versions");

      const versionData = await response.json();
      setVersions(versionData);
    } catch (error) {
      console.error("Error loading version history:", error);
      alert("Failed to load version history");
    } finally {
      setLoadingVersions(false);
    }
  };

  // Store original content when first switching to version preview
  const enterVersionPreview = (currentNote) => {
    if (!isVersionPreview) {
      const contentToStore = {
        content: currentNote.content,
        markdown: currentNote.markdown,
        title: currentNote.title,
        tags: currentNote.tags,
        notebook: currentNote.notebook,
        folder: currentNote.folder,
      };

      console.log("💾 Storing original content for version preview:", {
        contentLength: contentToStore.content?.length || 0,
        title: contentToStore.title,
        hasValidContent:
          !!contentToStore.content && contentToStore.content.trim().length > 0,
      });

      // Don't store empty content as "original" - this prevents restore issues
      if (
        !contentToStore.content ||
        contentToStore.content.trim().length === 0
      ) {
        console.warn(
          "⚠️ Attempted to store empty content as original - using fallback"
        );
        // Use a fallback that indicates this is a restored/empty state
        contentToStore.content = "<p></p>";
      }

      setOriginalCurrentContent(contentToStore);
      setIsVersionPreview(true);
    }
  };

  // Clear version preview state when note changes
  useEffect(() => {
    if (note?.id) {
      // Clear version preview state when switching to a different note
      setIsVersionPreview(false);
      setSelectedVersion(null);
      setOriginalCurrentContent(null);
    }
  }, [note?.id]);

  // Exit version preview and restore original content
  const exitVersionPreview = () => {
    if (isVersionPreview && originalCurrentContent) {
      console.log("🔄 Restoring original content:", {
        originalContentLength: originalCurrentContent.content?.length || 0,
        originalTitle: originalCurrentContent.title,
      });

      setIsVersionPreview(false);
      setSelectedVersion(null);

      // Restore original content to the editor
      if (onContentChange && note) {
        const currentNote = {
          ...note,
          content: originalCurrentContent.content,
          title: originalCurrentContent.title,
          tags: originalCurrentContent.tags,
          notebook: originalCurrentContent.notebook,
          folder: originalCurrentContent.folder,
          // Ensure version preview flags are cleared
          tempVersionPreview: false,
          previewingVersion: null,
        };

        onContentChange(
          currentNote,
          originalCurrentContent.content,
          originalCurrentContent.markdown
        );
      }

      setOriginalCurrentContent(null);
      console.log("✅ Exited version preview and restored original content");
    } else {
      // Even if we're not in version preview, clear the selected version
      setSelectedVersion(null);
      console.log("✅ Cleared version selection");
    }
  };

  // Switch back to current version (exit preview mode)
  const switchToCurrentVersion = () => {
    console.log("🔄 Switching back to current version");

    // If we have stored original content, use exitVersionPreview
    if (isVersionPreview && originalCurrentContent) {
      exitVersionPreview();
    } else {
      // Otherwise, directly restore to the current note content
      setIsVersionPreview(false);
      setSelectedVersion(null);
      setOriginalCurrentContent(null);

      if (onContentChange && note) {
        const currentNote = {
          ...note,
          tempVersionPreview: false,
          previewingVersion: null,
        };

        onContentChange(currentNote, note.content, note.markdown);
        console.log("✅ Restored to current note content directly");
      }
    }
  };

  // Switch to a specific version (enter preview mode)
  const switchToVersion = async (versionId) => {
    console.log("🔄 switchToVersion called with versionId:", versionId);

    if (!note || !backendUrl) {
      console.error("❌ Missing note or backendUrl:", {
        note: !!note,
        backendUrl: !!backendUrl,
      });
      return;
    }

    try {
      console.log("📡 Fetching version data...");
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/versions/${versionId}`
      );

      if (!response.ok) throw new Error("Failed to load version content");

      const versionData = await response.json();
      console.log("📦 Version data loaded:", versionData);

      // Store original content if not already in preview mode
      if (!isVersionPreview) {
        enterVersionPreview(note);
      }

      // Create a preview note with version content but don't update main state
      const previewNote = {
        ...note,
        content: versionData.content,
        title: versionData.metadata.title,
        tags: versionData.metadata.tags || [],
        notebook: versionData.metadata.notebook,
        folder: versionData.metadata.folder,
        tempVersionPreview: true,
        previewingVersion: versionData.version,
      };

      console.log("🔄 Calling onContentChange with version preview:", {
        note: previewNote,
        content: versionData.content,
        markdown: versionData.markdown,
      });

      // Update only the editor content, not the main note state
      if (onContentChange) {
        onContentChange(previewNote, versionData.content, versionData.markdown);
      }

      // Update local state to reflect the selected version
      setSelectedVersion(versionData);

      console.log(`✅ Switched to version ${versionData.version} preview`);
    } catch (error) {
      console.error("❌ Error switching to version:", error);
      alert("Failed to load version content");
    }
  };

  // Restore a version as the current version
  const restoreVersion = async (versionId) => {
    if (!note || !backendUrl) return;

    if (
      !confirm(
        "Are you sure you want to restore this version? This will create a new version with the restored content."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/restore/${versionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to restore version");

      const restoredNote = await response.json();

      // Update the note state with restored data
      if (onNoteUpdate) {
        onNoteUpdate(restoredNote);
      }

      // Wait a moment for the note state to update before clearing preview state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clear ALL version preview state completely
      setSelectedVersion(null);
      setIsVersionPreview(false);
      setOriginalCurrentContent(null);

      // Reload version history to show new version
      await loadVersionHistory();

      console.log(
        `✅ Restored version and created new version ${restoredNote.version}`
      );
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version");
    }
  };

  // Load version history when version panel opens
  useEffect(() => {
    if (showVersionHistory && note) {
      loadVersionHistory();
    }
  }, [showVersionHistory, note, backendUrl]);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <Book size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            No note selected
          </h3>
          <p className="text-gray-600">
            Select a note from the sidebar to start editing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2 flex-1">
                <input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitleEdit();
                    if (e.key === "Escape") cancelTitleEdit();
                  }}
                  className="text-2xl font-bold text-gray-900 border border-blue-300 rounded px-2 py-1 flex-1"
                  autoFocus
                />
                <button
                  onClick={saveTitleEdit}
                  className="p-1 rounded text-green-600 hover:bg-green-100"
                  title="Save title"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={cancelTitleEdit}
                  className="p-1 rounded text-red-600 hover:bg-red-100"
                  title="Cancel editing"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 flex-1 group">
                <h1
                  className="text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={startTitleEdit}
                  title="Click to edit title"
                >
                  {note.title || "Untitled"}
                </h1>
                <button
                  onClick={startTitleEdit}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit title"
                >
                  <Edit2 size={16} />
                </button>
                {note.starred && (
                  <Star size={20} className="text-yellow-500 fill-current" />
                )}
                {note.archived && (
                  <Archive size={20} className="text-gray-400" />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Saved {formatDate(lastSaved)}
              </span>
            )}

            <button
              onClick={toggleNoteStar}
              className={`p-2 rounded hover:bg-gray-100 ${
                note.starred ? "text-yellow-500" : "text-gray-400"
              }`}
              title={note.starred ? "Remove star" : "Add star"}
            >
              <Star size={16} className={note.starred ? "fill-current" : ""} />
            </button>

            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="p-2 rounded hover:bg-gray-100 text-gray-400"
              title="Toggle metadata panel"
            >
              <MoreHorizontal size={16} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded text-white font-medium ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Quick metadata bar */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {note.createdAt && (
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>Created {formatDate(note.createdAt)}</span>
              </div>
            )}
            {note.updatedAt && (
              <div className="flex items-center space-x-1">
                <Clock size={14} />
                <span>Updated {formatDate(note.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Quick tag display and management */}
          <div className="flex items-center space-x-2">
            {filterValidTags(noteTags).length > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Hash size={14} className="text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {getTagNames(noteTags)
                    .slice(0, 3)
                    .map((tagName, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          tagName.startsWith("Loading")
                            ? "bg-gray-100 text-gray-600"
                            : tagName.startsWith("Tag ")
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {tagName}
                      </span>
                    ))}
                  {filterValidTags(noteTags).length > 3 && (
                    <span className="text-xs text-gray-600">
                      +{filterValidTags(noteTags).length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Version Indicator */}
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="px-3 py-1 rounded text-sm font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center space-x-1"
              title="Version history"
            >
              <span>v{note?.version || 1}</span>
            </button>

            {/* Tag Dropdown */}
            <div className="relative tag-dropdown-container">
              <button
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center space-x-1"
                title="Manage tags"
              >
                <Hash size={14} />
                <span>Tags</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${
                    showTagDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showTagDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 tag-dropdown-container">
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Select Tags
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {availableTags.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2">
                          No tags available
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {availableTags.map((tag) => (
                            <label
                              key={tag.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={noteTags.includes(tag.id)}
                                onChange={() => toggleTagSelection(tag.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 flex-1">
                                {tag.name}
                              </span>
                              <span
                                className="w-3 h-3 rounded-full border"
                                style={{
                                  backgroundColor: tag.color || "#6B7280",
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {filterValidTags(noteTags).length > 0 && (
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            // Clear all valid tags
                            setNoteTags([]);
                            updateNoteMetadata({ tags: [] });
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Clear all tags
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Version History Panel */}
        {showVersionHistory && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Version History
                </h3>
                <button
                  onClick={() => setShowVersionHistory(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Versions for "{note?.title || "Untitled"}"
              </div>

              <div className="space-y-2">
                {/* Current Version */}
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVersion === null
                      ? "border-blue-300 bg-blue-100"
                      : "border-blue-200 bg-blue-50 hover:bg-blue-100"
                  }`}
                  onClick={switchToCurrentVersion}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-blue-900">
                        v{note?.version || 1} - Current
                      </span>
                      {selectedVersion === null && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-blue-600">
                      {formatDate(note?.updated)}
                    </span>
                  </div>
                  <div className="text-xs text-blue-700">
                    {selectedVersion === null
                      ? "Active version"
                      : "Click to view current version"}
                  </div>
                </div>

                {/* Loading State */}
                {loadingVersions && (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-sm">Loading version history...</div>
                  </div>
                )}

                {/* Version History */}
                {!loadingVersions && versions.length > 0 && (
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVersion?.id === version.id
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => switchToVersion(version.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              v{version.version}
                            </span>
                            {selectedVersion?.id === version.id && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(version.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {version.changeDescription}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {version.size} characters
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreVersion(version.id);
                            }}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="Restore this version as current (creates new version)"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Versions Message */}
                {!loadingVersions && versions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg mb-2">🚀</div>
                    <div className="text-sm">
                      No version history yet. Versions will appear here once you
                      make changes to your note.
                    </div>
                    <div className="text-xs mt-2 text-gray-400">
                      Changes are automatically saved as versions based on
                      content changes, title changes, or when switching notes.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Metadata Sidebar */}
        {showMetadata && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Note Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modified:</span>
                    <span className="text-gray-900">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count:</span>
                    <span className="text-gray-900">
                      {note.content
                        ? note.content.replace(/<[^>]*>/g, "").split(/\s+/)
                            .length
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Character Count:</span>
                    <span className="text-gray-900">
                      {note.content
                        ? note.content.replace(/<[^>]*>/g, "").length
                        : 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notebook Assignment */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <NotebookManager
                  userId={userId}
                  currentNotebook={noteNotebook}
                  onNotebookChange={handleNotebookChange}
                />
              </div>

              {/* Folder Assignment */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <FolderManager
                  userId={userId}
                  currentFolder={noteFolder}
                  onFolderChange={handleFolderChange}
                />
              </div>

              {/* Tags Management */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <TagManager
                  userId={userId}
                  noteId={note.id}
                  noteTags={noteTags}
                  onTagsChange={handleTagsChange}
                  availableTags={availableTags}
                  onTagsUpdate={onTagsUpdate}
                />
              </div>

              {/* Note Actions */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={toggleNoteArchive}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <Archive size={14} />
                    <span>{note.archived ? "Unarchive" : "Archive"} Note</span>
                  </button>

                  <button
                    onClick={handleDeleteNote}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                  >
                    <Trash2 size={14} />
                    <span>Delete Note</span>
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Export
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // Export as markdown
                      const blob = new Blob(
                        [note.markdown || note.content || ""],
                        { type: "text/markdown" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${note.title || "untitled"}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <span>Export as Markdown</span>
                  </button>

                  <button
                    onClick={() => {
                      // Export as HTML
                      const blob = new Blob([note.content || ""], {
                        type: "text/html",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${note.title || "untitled"}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <span>Export as HTML</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
