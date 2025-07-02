import React, { useState, useEffect } from "react";
import { validateNote } from "../utils/validation.js";
import errorRecoveryService from "../services/ErrorRecoveryService.js";
import {
  Search,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  Star,
  Trash2,
  Edit2,
  MoreHorizontal,
  Calendar,
  Clock,
  FileText,
  Hash,
  Book,
  FolderOpen,
  Grid,
  List,
  Eye,
  EyeOff,
  ChevronDown,
  CheckSquare,
  Archive,
  Copy,
  Download,
  Upload,
  X,
} from "lucide-react";
import configService from "../configService.js";

const ImprovedNotesList = ({
  notes = [],
  selectedNote,
  onSelectNote,
  onCreateNewNote,
  searchQuery,
  onSearchChange,
  userId,
  onNotesRefresh,
  currentView,
  currentViewParams = {},
  onViewChange,
  notebooks = [],
  folders = [],
  tags = [],
  className = "",
}) => {
  const [backendUrl, setBackendUrl] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [dragOverNote, setDragOverNote] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Initialize backend URL and load tags if not provided as props
  useEffect(() => {
    const loadTags = async (url) => {
      if (!url || !userId) return;

      try {
        const response = await fetch(`${url}/api/${userId}/tags`);
        if (response.ok) {
          const tagsData = await response.json();
          setAvailableTags(tagsData);
        }
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };

    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);

        // Only load tags from API if not provided as props
        if (userId && url && tags.length === 0) {
          await loadTags(url);
        }
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        const fallbackUrl = "http://localhost:3004";
        setBackendUrl(fallbackUrl);
        if (userId && tags.length === 0) {
          await loadTags(fallbackUrl);
        }
      }
    };
    initBackendUrl();
  }, [userId, tags.length]);

  // Helper function to get notebook name by ID
  const getNotebookName = (notebookId) => {
    if (!notebookId) return null;
    const notebook = notebooks.find((nb) => nb.id === notebookId);
    return notebook ? notebook.name : "Unknown Notebook";
  };

  // Helper function to get folder name by ID
  const getFolderName = (folderId) => {
    if (!folderId) return null;
    const folder = folders.find((f) => f.id === folderId);
    return folder ? folder.name : "Unknown Folder";
  };

  // Helper function to get tag names from IDs
  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    return tagIds.map((tagId) => {
      const tag = availableTags.find((t) => t.id === tagId);
      return tag ? tag.name : `Tag ${tagId}`;
    });
  };

  // Calculate note count for each tag
  const getTagWithNoteCounts = () => {
    return availableTags.map((tag) => {
      const noteCount = notes.filter((note) => {
        return (
          note.tags &&
          Array.isArray(note.tags) &&
          note.tags.includes(tag.id) &&
          !note.deleted &&
          !note.archived
        );
      }).length;

      return {
        ...tag,
        noteCount,
      };
    });
  };

  // Note operations
  const updateNote = async (noteId, updates) => {
    if (!backendUrl) return false;

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: updates }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");

      onNotesRefresh?.();
      return true;
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
      return false;
    }
  };

  const startRenaming = (note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
  };

  const saveTitle = async () => {
    if (!editingTitle.trim() || !editingNoteId) return;

    const success = await updateNote(editingNoteId, {
      title: editingTitle.trim(),
    });
    if (success) {
      setEditingNoteId(null);
      setEditingTitle("");
    }
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditingTitle("");
  };

  const toggleStar = async (note) => {
    await updateNote(note.id, { starred: !note.starred });
  };

  const toggleArchive = async (note) => {
    await updateNote(note.id, { archived: !note.archived });
  };

  const deleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to move this note to trash?")) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            metadata: { 
              deleted: true,
              deletedAt: new Date().toISOString()
            } 
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete note");

      onNotesRefresh?.();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  // Unified drag and drop handlers
  const handleNoteDragStart = (e, note) => {
    if (!validateNote(note)) {
      console.error("Cannot drag invalid note:", note);
      e.preventDefault();
      return;
    }

    console.log("🏗️ Starting note drag:", note.title);

    // Set drag data with consistent formatting
    const dragData = {
      type: "note",
      id: note.id,
      title: note.title,
      sourceComponent: "notesList",
    };

    // Use both formats for compatibility
    const dragDataString = JSON.stringify(dragData);
    e.dataTransfer.setData("text/plain", dragDataString);
    e.dataTransfer.setData("application/json", dragDataString);
    e.dataTransfer.effectAllowed = "move";

    // Add visual feedback
    e.target.style.opacity = "0.5";

    // Store reference for cleanup
    e.target.addEventListener(
      "dragend",
      () => {
        e.target.style.opacity = "";
      },
      { once: true }
    );
  };

  const handleDragOver = (e, targetNote, position) => {
    e.preventDefault();
    e.stopPropagation();

    // Set the drop effect
    e.dataTransfer.dropEffect = "move";

    if (!validateNote(targetNote)) {
      console.warn("Invalid target note for drag over:", targetNote);
      return;
    }

    // Try to determine drag operation type for better visual feedback
    let isValidOperation = false;
    try {
      // During dragover, dataTransfer might be restricted in some browsers
      // So we'll optimistically show feedback and validate on drop
      isValidOperation = true;

      console.log(
        "📍 Drag over note:",
        targetNote.title,
        "position:",
        position
      );

      // Update visual feedback
      setDragOverNote(targetNote.id);
      setDragOverPosition(position);
    } catch (error) {
      console.warn("Error in drag over handler:", error);
      // Still show visual feedback
      setDragOverNote(targetNote.id);
      setDragOverPosition(position);
    }
  };

  const handleDragLeave = (e) => {
    e.stopPropagation();

    // Only clear drag state if we're actually leaving the drag area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      console.log("🚪 Drag leave - clearing state");
      setDragOverNote(null);
      setDragOverPosition(null);
    }
  };

  const handleDrop = async (e, targetNote, position) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("💧 Drop on note:", targetNote?.title, "position:", position);

    // Clear drag state immediately
    setDragOverNote(null);
    setDragOverPosition(null);

    if (!validateNote(targetNote)) {
      console.error("Cannot drop on invalid target note:", targetNote);
      return;
    }

    try {
      // Get drag data with both formats as fallback
      let dragDataText =
        e.dataTransfer.getData("application/json") ||
        e.dataTransfer.getData("text/plain") ||
        e.dataTransfer.getData("text");

      if (!dragDataText) {
        console.error("No drag data available");
        return;
      }

      const dragData = JSON.parse(dragDataText);
      console.log("📦 Drag data:", dragData);

      // Handle different drop operations
      if (dragData.type === "note" && dragData.id !== targetNote.id) {
        await handleNoteReorder(dragData, targetNote, position);
      } else if (dragData.type === "notebook") {
        await handleNoteCategoryMove(dragData, targetNote);
      } else if (dragData.type === "folder") {
        await handleNoteCategoryMove(dragData, targetNote);
      } else if (dragData.type === "tag") {
        await handleNoteTagAdd(dragData, targetNote);
      } else {
        console.log("🚫 Invalid drop operation or same note");
      }
    } catch (error) {
      console.error("❌ Error handling drop:", error);

      // Use error recovery service
      await errorRecoveryService.handleError(error, {
        operation: "drag_drop",
        data: { targetNote, position },
        safeFallback: null,
        allowPageRefresh: false,
      });
    }
  };

  // Helper function for adding tags to notes
  const handleNoteTagAdd = async (dragData, targetNote) => {
    console.log(
      `🏷️ Adding tag "${dragData.name}" to note "${targetNote.title}"`
    );

    try {
      // Get current note to check existing tags
      const currentTags = targetNote.tags || [];

      // Check if tag is already on the note
      if (currentTags.includes(dragData.id)) {
        console.log("ℹ️ Tag already exists on note");
        return;
      }

      // Add the tag
      const updatedTags = [...currentTags, dragData.id];
      await updateNote(targetNote.id, { tags: updatedTags });

      console.log("✅ Successfully added tag to note");

      // Refresh notes to reflect changes
      if (onNotesRefresh) {
        onNotesRefresh();
      }
    } catch (error) {
      console.error("❌ Failed to add tag to note:", error);
      throw error; // Re-throw to be handled by caller
    }
  };

  // Helper function for note reordering
  const handleNoteReorder = async (dragData, targetNote, position) => {
    console.log(
      `📋 Reordering: Moving note "${dragData.title}" ${position} note "${targetNote.title}"`
    );

    const draggedNote = notes.find((n) => n.id === dragData.id);
    const targetIndex = notes.findIndex((n) => n.id === targetNote.id);

    if (!draggedNote || targetIndex === -1) {
      console.error(
        "Could not find dragged note or target note in notes array"
      );
      return;
    }

    // Perform client-side reordering for immediate feedback
    const newNotes = [...notes];
    const draggedIndex = newNotes.findIndex((n) => n.id === dragData.id);

    if (draggedIndex === -1) {
      console.error("Dragged note not found in notes array");
      return;
    }

    // Remove the dragged note
    const [removed] = newNotes.splice(draggedIndex, 1);

    // Calculate new position
    let insertIndex = position === "above" ? targetIndex : targetIndex + 1;

    // Adjust for removal affecting indices
    if (draggedIndex < targetIndex) {
      insertIndex -= 1;
    }

    // Insert at new position
    newNotes.splice(insertIndex, 0, removed);

    // Update the notes list immediately for visual feedback
    if (onNotesRefresh) {
      console.log("✨ Client-side reordering completed, refreshing notes");
      onNotesRefresh();
    }

    // TODO: Send reorder request to backend if needed
    // This would depend on your backend API supporting note ordering
    try {
      // Optional: persist the new order to backend
      // await persistNoteOrder(newNotes.map(n => n.id));
      console.log("ℹ️ Note reordering completed (client-side only)");
    } catch (error) {
      console.warn("⚠️ Failed to persist note order to backend:", error);
      // Client-side reordering is still applied
    }
  };

  // Helper function for moving notes between categories
  const handleNoteCategoryMove = async (dragData, targetNote) => {
    console.log(
      `📝 Moving note "${targetNote.title}" to ${dragData.type}: ${dragData.name}`
    );

    const updates = {};
    if (dragData.type === "notebook") {
      updates.notebook = dragData.id;
      updates.folder = null;
    } else if (dragData.type === "folder") {
      updates.folder = dragData.id;
      updates.notebook = null;
    }

    console.log("🔄 Updating note with:", updates);

    try {
      await updateNote(targetNote.id, updates);
      console.log("✅ Successfully moved note to", dragData.type);

      // Refresh notes to reflect changes
      if (onNotesRefresh) {
        onNotesRefresh();
      }
    } catch (error) {
      console.error("❌ Failed to move note:", error);
      throw error; // Re-throw to be handled by caller
    }
  };

  // Filter and sort notes
  const filteredAndSortedNotes = notes
    .filter((note) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(searchLower);
        const contentMatch = note.content?.toLowerCase().includes(searchLower);

        if (!titleMatch && !contentMatch) {
          return false;
        }
      }

      switch (currentView) {
        case "starred":
          return note.starred === true;
        case "archived":
          return note.archived === true;
        case "trash":
          return note.deleted === true;
        case "recent":
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(note.updated) > weekAgo;
        case "notebook":
          return note.notebook === currentViewParams?.notebookId;
        case "folder":
          return note.folder === currentViewParams?.folderId;
        case "tag":
          return note.tags?.includes(currentViewParams?.tagId);
        case "all":
        default:
          return !note.deleted && !note.archived;
      }
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "created":
          aVal = new Date(a.created);
          bVal = new Date(b.created);
          break;
        case "updated":
        default:
          aVal = new Date(a.updated);
          bVal = new Date(b.updated);
          break;
      }

      if (sortOrder === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNote = (note) => {
    // Safety check for note object
    if (!note || !note.id) {
      console.error("renderNote called with invalid note:", note);
      return null;
    }

    const isEditing = editingNoteId === note.id;
    const isSelected = selectedNote?.id === note.id;
    const isDragTarget = dragOverNote === note.id;

    return (
      <div key={note.id} className="relative">
        {/* Drop zone above */}
        <div
          className={`h-2 transition-all ${
            isDragTarget && dragOverPosition === "above"
              ? "bg-blue-400 mx-2 rounded-full"
              : "transparent"
          }`}
          onDragOver={(e) => handleDragOver(e, note, "above")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, note, "above")}
        />

        <div
          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
          } ${
            isDragTarget && !dragOverPosition
              ? "bg-green-50 border-l-4 border-l-green-500"
              : ""
          }`}
          draggable={!isEditing}
          onDragStart={(e) => !isEditing && handleNoteDragStart(e, note)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";

            // Show visual feedback for category moves (notebook/folder/tag drops)
            setDragOverNote(note.id);
            setDragOverPosition(null);
          }}
          onDragLeave={handleDragLeave}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            setDragOverNote(null);
            setDragOverPosition(null);

            try {
              const dragDataText =
                e.dataTransfer.getData("application/json") ||
                e.dataTransfer.getData("text/plain");

              if (!dragDataText) return;

              const dragData = JSON.parse(dragDataText);
              console.log(
                "📦 Category drop on note:",
                note.title,
                "data:",
                dragData
              );

              // Handle category moves (notebook, folder, tag)
              if (dragData.type === "notebook") {
                await updateNote(note.id, {
                  notebook: dragData.id,
                  folder: null,
                });
                console.log("✅ Moved note to notebook");
              } else if (dragData.type === "folder") {
                await updateNote(note.id, {
                  folder: dragData.id,
                  notebook: null,
                });
                console.log("✅ Moved note to folder");
              } else if (dragData.type === "tag") {
                await handleNoteTagAdd(dragData, note);
              }
            } catch (error) {
              console.error("❌ Error handling category drop on note:", error);
            }
          }}
          onClick={() => {
            console.log("Note clicked:", note, "isEditing:", isEditing);

            if (!isEditing && validateNote(note)) {
              console.log("Calling onSelectNote with valid note:", note);
              onSelectNote(note);
            } else if (!validateNote(note)) {
              console.error("Cannot select note: invalid note object", note);
              // Could show user notification here
            } else if (isEditing) {
              console.log("Note click ignored - currently editing");
            }
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Title */}
              {isEditing ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      saveTitle();
                    } else if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                  onBlur={saveTitle}
                  className="text-lg font-medium text-gray-900 bg-transparent border-0 outline-none w-full"
                  autoFocus
                />
              ) : (
                <h3
                  className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                  onClick={(e) => {
                    e.stopPropagation();
                    startRenaming(note);
                  }}
                >
                  {note.title}
                </h3>
              )}

              {/* Content preview */}
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {note.content?.replace(/<[^>]*>/g, "") || "No content"}
              </p>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getTagNames(note.tags).map((tagName, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      #{tagName}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span>{formatDate(note.updated)}</span>
                </span>

                {note.notebook && (
                  <span className="flex items-center space-x-1">
                    <Book size={12} />
                    <span>{getNotebookName(note.notebook)}</span>
                  </span>
                )}

                {note.folder && (
                  <span className="flex items-center space-x-1">
                    <FolderOpen size={12} />
                    <span>{getFolderName(note.folder)}</span>
                  </span>
                )}

                {note.attachments && note.attachments.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>📎</span>
                    <span>{note.attachments.length}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-2">
              {note.archived && (
                <Archive size={16} className="text-orange-500" />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(note);
                }}
                className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                title={note.starred ? "Remove star" : "Add star"}
              >
                <Star
                  size={16}
                  className={note.starred ? "fill-current text-yellow-500" : ""}
                />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleArchive(note);
                }}
                className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                title={note.archived ? "Unarchive" : "Archive"}
              >
                <Archive size={16} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete note"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Drop zone below */}
        <div
          className={`h-2 transition-all ${
            isDragTarget && dragOverPosition === "below"
              ? "bg-blue-400 mx-2 rounded-full"
              : "transparent"
          }`}
          onDragOver={(e) => handleDragOver(e, note, "below")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, note, "below")}
        />
      </div>
    );
  };

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentView === "all" && "All Notes"}
            {currentView === "recent" && "Recent Notes"}
            {currentView === "starred" && "Starred Notes"}
            {currentView === "archived" && "Archived Notes"}
            {currentView === "trash" && "Trash"}
            {currentView === "notebook" && "Notebook Notes"}
            {currentView === "folder" && "Folder Notes"}
            {currentView === "tag" &&
              `Tagged: ${
                availableTags.find((t) => t.id === currentViewParams?.tagId)
                  ?.name || "Unknown Tag"
              }`}
            {![
              "all",
              "recent",
              "starred",
              "archived",
              "trash",
              "notebook",
              "folder",
              "tag",
            ].includes(currentView) && "Notes"}
          </h2>

          <button
            onClick={onCreateNewNote}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Create New Note"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2 mb-4 relative">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>

          {/* Filter Menu */}
          {showFilterMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 w-80">
              <div className="space-y-4">
                {/* Clear Filters */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Filters</h4>
                  <button
                    onClick={() => {
                      onViewChange?.("all");
                      setShowFilterMenu(false);
                    }}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    Clear all filters
                  </button>
                </div>

                {/* Quick Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Filters
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        onViewChange?.("starred");
                        setShowFilterMenu(false);
                      }}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200"
                    >
                      ⭐ Starred
                    </button>
                    <button
                      onClick={() => {
                        onViewChange?.("archived");
                        setShowFilterMenu(false);
                      }}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200"
                    >
                      📦 Archived
                    </button>
                    <button
                      onClick={() => {
                        onViewChange?.("recent");
                        setShowFilterMenu(false);
                      }}
                      className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full hover:bg-green-200"
                    >
                      🕒 Recent
                    </button>
                    <button
                      onClick={() => {
                        onViewChange?.("trash");
                        setShowFilterMenu(false);
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full hover:bg-red-200"
                    >
                      🗑️ Trash
                    </button>
                  </div>
                </div>

                {/* Tag Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Tags
                  </label>
                  {availableTags.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      No tags available
                    </div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {getTagWithNoteCounts().map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            onViewChange?.("tag", { tagId: tag.id });
                            setShowFilterMenu(false);
                          }}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded text-left"
                        >
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: tag.color || "#6B7280" }}
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {tag.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {tag.noteCount}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="updated">Updated</option>
              <option value="created">Created</option>
              <option value="title">Title</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1 border border-gray-300 rounded hover:bg-gray-50"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              {sortOrder === "asc" ? (
                <SortAsc size={16} />
              ) : (
                <SortDesc size={16} />
              )}
            </button>
          </div>

          <div className="text-sm text-gray-500">
            {filteredAndSortedNotes.length} notes
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No notes found</p>
            <p className="text-sm">
              Create your first note or adjust your filters
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredAndSortedNotes.map((note) => renderNote(note))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedNotesList;
