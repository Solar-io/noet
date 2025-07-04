import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  RefreshCw,
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
  onNotesUpdate,
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
  const [selectedTagFilters, setSelectedTagFilters] = useState([]);

  // Use ref to avoid circular dependencies in useCallback
  const notesRef = useRef(notes);
  notesRef.current = notes;

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

  // Generate dynamic tags from notes
  const generateAvailableTagsFromNotes = () => {
    const tagMap = new Map();

    notes.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag) => {
          if (typeof tag === "string" && tag.trim()) {
            const tagName = tag.trim();
            if (tagMap.has(tagName)) {
              tagMap.set(tagName, tagMap.get(tagName) + 1);
            } else {
              tagMap.set(tagName, 1);
            }
          }
        });
      }
    });

    return Array.from(tagMap.entries())
      .map(([name, count]) => ({
        id: name, // Use the name as the ID for string tags
        name: name,
        noteCount: count,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
      }))
      .sort((a, b) => b.noteCount - a.noteCount); // Sort by usage
  };

  // Update available tags when notes change
  useEffect(() => {
    if (notes.length > 0 && tags.length === 0) {
      // If no tags provided via props but we have notes, generate from notes
      const dynamicTags = generateAvailableTagsFromNotes();
      setAvailableTags(dynamicTags);
    } else if (tags.length > 0) {
      // Use provided tags
      setAvailableTags(tags);
    }
  }, [notes, tags]);

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

  // Helper function to get tag names from IDs or strings
  const getTagNames = (tagIds) => {
    if (!tagIds || !Array.isArray(tagIds)) return [];
    return tagIds.map((tagId) => {
      // If it's already a string, return it directly
      if (typeof tagId === "string") {
        // Check if it looks like a UUID (has hyphens), if so try to find in availableTags
        if (tagId.includes("-")) {
          const tag = availableTags.find((t) => t.id === tagId);
          return tag ? tag.name : "Unknown";
        } else {
          // It's a simple string tag, return as-is
          return tagId;
        }
      }
      // Fallback for other types
      const tag = availableTags.find((t) => t.id === tagId);
      return tag ? tag.name : "Unknown";
    });
  };

  // Calculate note count for each tag
  const getTagWithNoteCounts = () => {
    return availableTags.map((tag) => {
      const noteCount = notes.filter((note) => {
        return (
          note.tags &&
          Array.isArray(note.tags) &&
          // Check for both tag ID and tag name matches
          (note.tags.includes(tag.id) || note.tags.includes(tag.name)) &&
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
  const updateNote = useCallback(
    async (noteId, updates) => {
      if (!backendUrl) return false;

      // Optimistic update - update the note locally first
      const currentNotes = notesRef.current;
      const optimisticNotes = currentNotes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note
      );
      onNotesUpdate?.(optimisticNotes);

      try {
        const response = await fetch(
          `${backendUrl}/api/${userId}/notes/${noteId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadata: updates }),
          }
        );

        if (!response.ok) {
          // Revert optimistic update on failure
          onNotesUpdate?.(currentNotes);
          throw new Error("Failed to update note");
        }

        // Success - the optimistic update is already in place
        return true;
      } catch (error) {
        console.error("Error updating note:", error);
        alert("Failed to update note");
        return false;
      }
    },
    [backendUrl, userId, onNotesUpdate]
  );

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

  const toggleStar = useCallback(
    async (note) => {
      await updateNote(note.id, { starred: !note.starred });
    },
    [updateNote]
  );

  const toggleArchive = useCallback(
    async (note) => {
      await updateNote(note.id, { archived: !note.archived });
    },
    [updateNote]
  );

  const deleteNote = useCallback(
    async (noteId) => {
      if (!confirm("Are you sure you want to move this note to trash?")) return;

      // Optimistic update - remove note from list immediately
      const currentNotes = notesRef.current;
      const optimisticNotes = currentNotes.filter((note) => note.id !== noteId);
      onNotesUpdate?.(optimisticNotes);

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
                deletedAt: new Date().toISOString(),
              },
            }),
          }
        );

        if (!response.ok) {
          // Revert optimistic update on failure
          onNotesUpdate?.(currentNotes);
          throw new Error("Failed to delete note");
        }

        // Success - optimistic update is already applied
      } catch (error) {
        console.error("Error deleting note:", error);
        alert("Failed to delete note");
      }
    },
    [backendUrl, userId, onNotesUpdate]
  );

  const restoreNote = useCallback(
    async (noteId) => {
      if (!confirm("Are you sure you want to restore this note?")) return;

      try {
        const response = await fetch(
          `${backendUrl}/api/${userId}/notes/${noteId}/restore`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to restore note");

        // For restore, we need to refresh since note moves between views
        onNotesRefresh?.();
      } catch (error) {
        console.error("Error restoring note:", error);
        alert("Failed to restore note");
      }
    },
    [backendUrl, userId, onNotesRefresh]
  );

  const permanentDeleteNote = useCallback(
    async (noteId) => {
      if (
        !confirm(
          "Are you sure you want to permanently delete this note? This action cannot be undone."
        )
      )
        return;

      // Optimistic update - remove note from list immediately
      const currentNotes = notesRef.current;
      const optimisticNotes = currentNotes.filter((note) => note.id !== noteId);
      onNotesUpdate?.(optimisticNotes);

      try {
        const response = await fetch(
          `${backendUrl}/api/${userId}/notes/${noteId}/permanent`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          // Revert optimistic update on failure
          onNotesUpdate?.(currentNotes);
          throw new Error("Failed to permanently delete note");
        }

        // Success - optimistic update is already applied
      } catch (error) {
        console.error("Error permanently deleting note:", error);
        alert("Failed to permanently delete note");
      }
    },
    [backendUrl, userId, onNotesUpdate]
  );

  // Handle tag filter selection
  const toggleTagFilter = useCallback((tagId) => {
    setSelectedTagFilters((prev) => {
      if (prev.includes(tagId)) {
        // Remove tag from filter
        return prev.filter((id) => id !== tagId);
      } else {
        // Add tag to filter
        return [...prev, tagId];
      }
    });
  }, []);

  const clearTagFilters = useCallback(() => {
    setSelectedTagFilters([]);
  }, []);

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

  // Helper function for removing tags from notes
  const removeTagFromNote = async (noteId, tagToRemove) => {
    const displayName =
      typeof tagToRemove === "string" && tagToRemove.includes("-")
        ? "Unknown"
        : tagToRemove;

    if (
      !confirm(
        `Are you sure you want to remove the tag "${displayName}" from this note?`
      )
    )
      return;

    try {
      // Get the current note
      const noteResponse = await fetch(
        `${backendUrl}/api/${userId}/notes/${noteId}`
      );
      if (!noteResponse.ok) throw new Error("Failed to get note");

      const note = await noteResponse.json();

      // Remove the tag from the note's tags array (using original tag value)
      const updatedTags = (note.tags || []).filter(
        (tag) => tag !== tagToRemove
      );

      // Update the note
      const success = await updateNote(noteId, { tags: updatedTags });
      if (success) {
        console.log(`✅ Removed tag "${displayName}" from note ${noteId}`);
      }
    } catch (error) {
      console.error("Error removing tag from note:", error);
      alert("Failed to remove tag from note");
    }
  };

  // Filter and sort notes
  const filteredAndSortedNotes = notes
    .filter((note) => {
      // Search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = note.title.toLowerCase().includes(searchLower);
        const contentMatch = note.content?.toLowerCase().includes(searchLower);

        if (!titleMatch && !contentMatch) {
          return false;
        }
      }

      // Multi-tag filter (independent of view)
      if (selectedTagFilters.length > 0) {
        const hasAllSelectedTags = selectedTagFilters.every((selectedTagId) =>
          note.tags?.includes(selectedTagId)
        );
        if (!hasAllSelectedTags) {
          return false;
        }
      }

      // View-based filters
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
              {note.content && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {note.content.replace(/<[^>]*>/g, "")}
                </p>
              )}

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getTagNames(note.tags).map((tagName, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group hover:bg-blue-200"
                    >
                      #{tagName}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use the original tag value (could be string or ID)
                          const originalTag = note.tags[index];
                          removeTagFromNote(note.id, originalTag);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Remove tag "${tagName}"`}
                      >
                        <X size={10} className="text-blue-600" />
                      </button>
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

              {/* Conditional buttons based on current view */}
              {currentView === "trash" ? (
                // Trash view: Show restore and permanent delete buttons
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreNote(note.id);
                    }}
                    className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                    title="Restore note"
                  >
                    <RefreshCw size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      permanentDeleteNote(note.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Permanently delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                // Regular views: Show normal delete button (soft delete)
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Move to trash"
                >
                  <Trash2 size={16} />
                </button>
              )}
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
            className={`px-3 py-2 border rounded-lg flex items-center space-x-1 relative ${
              selectedTagFilters.length > 0
                ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter size={16} />
            <span>Filter</span>
            {selectedTagFilters.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedTagFilters.length}
              </span>
            )}
          </button>

          {/* Filter Menu */}
          {showFilterMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 w-80">
              <div className="space-y-4">
                {/* Clear Filters */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">
                    Tag Filters
                  </h4>
                  {selectedTagFilters.length > 0 && (
                    <button
                      onClick={clearTagFilters}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Selected Tags Display */}
                {selectedTagFilters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Active Filters ({selectedTagFilters.length})
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selectedTagFilters.map((tagId) => {
                        const tag = availableTags.find((t) => t.id === tagId);
                        return tag ? (
                          <span
                            key={tagId}
                            className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: tag.color || "#6B7280",
                              }}
                            />
                            <span>{tag.name}</span>
                            <button
                              onClick={() => toggleTagFilter(tagId)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Multi-Select Tag Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tags (Multi-select enabled)
                  </label>
                  {availableTags.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">
                      No tags available
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {getTagWithNoteCounts().map((tag) => {
                        const isSelected = selectedTagFilters.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTagFilter(tag.id)}
                            className={`w-full flex items-center space-x-2 p-2 rounded text-left transition-colors ${
                              isSelected
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 border rounded flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-500 border-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <span className="text-white text-xs">✓</span>
                              )}
                            </div>
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: tag.color || "#6B7280",
                              }}
                            />
                            <span
                              className={`text-sm flex-1 ${
                                isSelected
                                  ? "text-blue-800 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              {tag.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {tag.noteCount}
                            </span>
                          </button>
                        );
                      })}
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

export default React.memo(ImprovedNotesList);
