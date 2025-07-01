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
  const [availableTags, setAvailableTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

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

        // Load available tags for display
        if (userId) {
          console.log("NoteEditor: Loading tags for user", userId);
          loadTags(url);
        }
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();
  }, [userId]);

  // Load available tags
  const loadTags = async (url) => {
    if (!url || !userId) return;

    try {
      console.log(
        "NoteEditor: Fetching tags from",
        `${url}/api/${userId}/tags`
      );
      const response = await fetch(`${url}/api/${userId}/tags`);
      if (response.ok) {
        const tags = await response.json();
        console.log("NoteEditor: Loaded tags:", tags);
        setAvailableTags(tags);
      } else {
        console.error(
          "NoteEditor: Failed to load tags, status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  // Helper function to get tag names from IDs
  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    console.log(
      "NoteEditor: Getting tag names for IDs:",
      tagIds,
      "from available tags:",
      availableTags
    );

    if (availableTags.length === 0) {
      // If tags haven't loaded yet, show loading state or just the IDs temporarily
      return tagIds.map((tagId) => `Loading...`);
    }

    return tagIds.map((tagId) => {
      const tag = availableTags.find((t) => t.id === tagId);
      console.log("NoteEditor: Tag ID", tagId, "mapped to:", tag);
      return tag ? tag.name : `Tag ${tagId.substring(0, 8)}...`;
    });
  };

  useEffect(() => {
    if (note) {
      setNoteTags(note.tags || []);
      setNoteNotebook(note.notebook || null);
      setNoteFolder(note.folder || null);
      setEditingTitle(note.title || "");
      setIsEditingTitle(false);

      // Reload tags if they aren't loaded yet
      if (availableTags.length === 0 && backendUrl && userId) {
        console.log(
          "NoteEditor: Reloading tags because availableTags is empty"
        );
        loadTags(backendUrl);
      }
    }
  }, [note, availableTags.length, backendUrl, userId]);

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
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: updates }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");

      const updatedNote = await response.json();
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
            {noteTags.length > 0 && (
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
                  {noteTags.length > 3 && (
                    <span className="text-xs text-gray-600">
                      +{noteTags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

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
                    {noteTags.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-gray-200">
                        <button
                          onClick={() => {
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

            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                showMetadata
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="Manage tags, notebooks, and folders"
            >
              Manage
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 flex flex-col">{children}</div>

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
