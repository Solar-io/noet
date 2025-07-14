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
import TagManagementDialog from "./TagManagementDialog.jsx";
import BulkActionsBar from "./BulkActionsBar.jsx";

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
  selectedNotes = new Set(),
  onSelectedNotesChange,
  onBulkTagAction,
  onBulkExport,
  onBulkDelete,
  onBulkUndo,
  isProcessing = false,
  processingStatus = null,
  deletedNotes = [],
}) => {
  const [backendUrl, setBackendUrl] = useState("");
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [dragOverNote, setDragOverNote] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedTagFilters, setSelectedTagFilters] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);

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
        // Handle network errors more gracefully during startup
        if (error.message.includes("Failed to fetch")) {
          console.log("ℹ️ Tags loading failed (network) in NotesList");
        } else {
          console.error("Error loading tags:", error.message);
        }
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

      // Update visual feedback only if changed to prevent flicker
      if (dragOverNote !== targetNote.id || dragOverPosition !== position) {
        setDragOverNote(targetNote.id);
        setDragOverPosition(position);
      }
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
      // Add a small delay to prevent flickering when moving between drop zones
      setTimeout(() => {
        setDragOverNote(null);
        setDragOverPosition(null);
      }, 50);
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
  const filteredAndSortedNotes = React.useMemo(() => {
    let filtered = notes.filter((note) => {
      // Skip deleted notes in regular views
      if (currentView !== "trash" && note.deleted) {
        return false;
      }

      // Apply view-specific filters
      switch (currentView) {
        case "all":
          return !note.deleted && !note.archived;
        case "recent":
          return (
            !note.deleted &&
            !note.archived &&
            new Date(note.updated) >
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
        case "starred":
          return !note.deleted && note.starred;
        case "archived":
          return !note.deleted && note.archived;
        case "trash":
          return note.deleted === true;
        case "notebook":
          return (
            !note.deleted &&
            !note.archived &&
            note.notebook === currentViewParams?.notebookId
          );
        case "folder":
          return (
            !note.deleted &&
            !note.archived &&
            note.folder === currentViewParams?.folderId
          );
        case "tag":
          return (
            !note.deleted &&
            !note.archived &&
            note.tags &&
            (note.tags.includes(currentViewParams?.tagId) ||
              note.tags.includes(currentViewParams?.tagName))
          );
        default:
          return !note.deleted && !note.archived;
      }
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query)
      );
    }

    // Apply tag filters
    if (selectedTagFilters.length > 0) {
      filtered = filtered.filter((note) => {
        if (!note.tags || note.tags.length === 0) return false;
        return selectedTagFilters.some((tagId) => {
          return note.tags.some((noteTag) => {
            if (typeof noteTag === "string") {
              const tag = availableTags.find(
                (t) => t.id === tagId || t.name === tagId
              );
              return tag && (noteTag === tag.name || noteTag === tag.id);
            }
            return noteTag === tagId;
          });
        });
      });
    }

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = (a.title || "Untitled").localeCompare(
            b.title || "Untitled"
          );
          break;
        case "created":
          comparison = new Date(a.created) - new Date(b.created);
          break;
        case "updated":
        default:
          comparison = new Date(a.updated) - new Date(b.updated);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    notes,
    searchQuery,
    currentView,
    currentViewParams,
    sortBy,
    sortOrder,
    selectedTagFilters,
    availableTags,
  ]);

  // Enhanced note selection with Cmd/Ctrl+click and Shift+click
  const handleNoteSelect = (note, event) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Cmd/Ctrl+click: Toggle selection
      event.preventDefault();

      // If this is the currently selected note and it's not in selectedNotes, add it
      if (selectedNote?.id === note.id && !selectedNotes.has(note.id)) {
        const newSet = new Set(selectedNotes);
        newSet.add(note.id);
        onSelectedNotesChange(newSet);
      } else {
        handleBulkSelect(note.id);
      }
    } else if (event?.shiftKey) {
      // Shift+click: Range selection
      event.preventDefault();
      handleRangeSelect(note.id, event);
    } else {
      // Regular click: Select note and clear bulk selection
      onSelectNote(note);
      if (onSelectedNotesChange) {
        onSelectedNotesChange(new Set());
      }
      // Reset lastSelectedIndex only when clearing multi-selection
      setLastSelectedIndex(-1);
    }
  };

  const handleBulkSelect = (noteId) => {
    console.log("🎯 Bulk select called:", {
      noteId,
      currentSelection: Array.from(selectedNotes),
    });

    const noteIndex = filteredAndSortedNotes.findIndex(
      (note) => note.id === noteId
    );

    if (onSelectedNotesChange) {
      const newSet = new Set(selectedNotes);
      if (newSet.has(noteId)) {
        console.log("➖ Removing from selection:", noteId);
        newSet.delete(noteId);
      } else {
        console.log("➕ Adding to selection:", noteId);
        newSet.add(noteId);
      }
      console.log("📊 New selection:", Array.from(newSet));
      onSelectedNotesChange(newSet);
    }

    setLastSelectedIndex(noteIndex);
  };

  const handleRangeSelect = (noteId, event) => {
    console.log("🔄 Range select called:", {
      noteId,
      lastSelectedIndex,
      selectedNotesSize: selectedNotes.size,
    });

    // Prevent text selection
    if (event) {
      event.preventDefault();
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }

    const currentIndex = filteredAndSortedNotes.findIndex(
      (note) => note.id === noteId
    );

    console.log(
      "📍 Current index:",
      currentIndex,
      "for note:",
      filteredAndSortedNotes[currentIndex]?.title
    );

    // If no previous multi-selection, but there's a currently selected note,
    // create range from currently selected note to shift-clicked note
    if (selectedNotes.size === 0 && selectedNote) {
      const selectedNoteIndex = filteredAndSortedNotes.findIndex(
        (note) => note.id === selectedNote.id
      );

      if (selectedNoteIndex !== -1) {
        console.log(
          "🎯 Creating range from currently selected note:",
          selectedNote.title
        );
        const start = Math.min(selectedNoteIndex, currentIndex);
        const end = Math.max(selectedNoteIndex, currentIndex);

        const rangeNotes = filteredAndSortedNotes.slice(start, end + 1);
        console.log(
          "📝 Notes in range:",
          rangeNotes.map((n) => n.title)
        );

        const newSelectedNotes = new Set(rangeNotes.map((note) => note.id));

        console.log("✅ New selection set size:", newSelectedNotes.size);

        if (onSelectedNotesChange) {
          onSelectedNotesChange(newSelectedNotes);
        }
        setLastSelectedIndex(currentIndex);
        return;
      }
    }

    if (lastSelectedIndex === -1 || selectedNotes.size === 0) {
      // No previous selection, just select current
      console.log("🎯 No previous selection, selecting current note");
      if (onSelectedNotesChange) {
        onSelectedNotesChange(new Set([noteId]));
      }
      setLastSelectedIndex(currentIndex);
      return;
    }

    // Select range from last selected to current
    const start = Math.min(lastSelectedIndex, currentIndex);
    const end = Math.max(lastSelectedIndex, currentIndex);

    console.log("📊 Range selection:", {
      start,
      end,
      lastSelectedIndex,
      currentIndex,
    });

    const rangeNotes = filteredAndSortedNotes.slice(start, end + 1);
    console.log(
      "📝 Notes in range:",
      rangeNotes.map((n) => n.title)
    );

    const newSelectedNotes = new Set(selectedNotes);

    rangeNotes.forEach((note) => {
      newSelectedNotes.add(note.id);
    });

    console.log("✅ New selection set size:", newSelectedNotes.size);

    if (onSelectedNotesChange) {
      onSelectedNotesChange(newSelectedNotes);
    }

    // Update the last selected index to the current one
    setLastSelectedIndex(currentIndex);
  };

  const handleSelectAll = () => {
    if (onSelectedNotesChange) {
      if (selectedNotes.size === filteredAndSortedNotes.length) {
        onSelectedNotesChange(new Set());
        setLastSelectedIndex(-1);
      } else {
        onSelectedNotesChange(
          new Set(filteredAndSortedNotes.map((note) => note.id))
        );
        setLastSelectedIndex(-1);
      }
    }
  };

  const handleDeselectAll = () => {
    if (onSelectedNotesChange) {
      onSelectedNotesChange(new Set());
    }
    setLastSelectedIndex(-1);
  };

  const handleClearSelection = () => {
    if (onSelectedNotesChange) {
      onSelectedNotesChange(new Set());
    }
    setLastSelectedIndex(-1);
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return; // Don't handle shortcuts when typing
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "a") {
        event.preventDefault();
        handleSelectAll();
      }
    },
    [filteredAndSortedNotes]
  );

  useEffect(() => {
    const handleKeyDownListener = (event) => handleKeyDown(event);
    document.addEventListener("keydown", handleKeyDownListener);
    return () => {
      document.removeEventListener("keydown", handleKeyDownListener);
    };
  }, [handleKeyDown]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if we're clicking truly outside the filter container
      if (showFilterMenu) {
        const filterContainer = event.target.closest(".filter-menu-container");
        if (!filterContainer) {
          console.log("Closing filter menu due to outside click");
          setShowFilterMenu(false);
        } else {
          console.log("Click inside filter menu - keeping open");
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showFilterMenu]);

  // Reset selections when view changes
  useEffect(() => {
    console.log("🔄 Selection reset triggered by view change:", {
      currentView,
      currentViewParams,
    });
    if (onSelectedNotesChange) {
      onSelectedNotesChange(new Set());
    }
    setLastSelectedIndex(-1);
  }, [currentView, currentViewParams, onSelectedNotesChange]);

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
    const isEditing = editingNoteId === note.id;
    const isSelected = selectedNote?.id === note.id;
    const isMultiSelected = selectedNotes.has(note.id);
    const isDragTarget = dragOverNote === note.id;
    const isDragOverAbove = isDragTarget && dragOverPosition === "above";
    const isDragOverBelow = isDragTarget && dragOverPosition === "below";

    return (
      <div key={note.id} className="note-item-container relative">
        {/* Drop zone above */}
        <div
          className={`absolute top-0 left-0 right-0 transition-all duration-200 pointer-events-none ${
            isDragOverAbove ? "h-0.5 bg-blue-500" : "h-0"
          }`}
          style={{
            transform: isDragOverAbove ? "translateY(-2px)" : "translateY(0)",
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-2 opacity-0"
          onDragOver={(e) => handleDragOver(e, note, "above")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, note, "above")}
        />

        <div
          className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
            isMultiSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
          } ${
            isSelected && !isMultiSelected
              ? "bg-blue-50 border-l-4 border-l-blue-500"
              : ""
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
          onClick={(e) => {
            const clickId = Math.random().toString(36).substr(2, 9);
            console.log(`🖱️ [${clickId}] Note clicked:`, {
              noteId: note.id,
              noteTitle: note.title,
              isEditing: isEditing,
              timestamp: new Date().toISOString(),
            });

            if (!isEditing && validateNote(note)) {
              console.log(
                `✅ [${clickId}] Calling handleNoteSelect with valid note:`,
                {
                  noteId: note.id,
                  noteTitle: note.title,
                }
              );
              handleNoteSelect(note, e);
            } else if (!validateNote(note)) {
              console.error(
                `❌ [${clickId}] Cannot select note: invalid note object`,
                note
              );
              // Could show user notification here
            } else if (isEditing) {
              console.log(
                `⏭️ [${clickId}] Note click ignored - currently editing`
              );
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
          className={`absolute bottom-0 left-0 right-0 transition-all duration-200 pointer-events-none ${
            isDragOverBelow ? "h-0.5 bg-blue-500" : "h-0"
          }`}
          style={{
            transform: isDragOverBelow ? "translateY(2px)" : "translateY(0)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-2 opacity-0"
          onDragOver={(e) => handleDragOver(e, note, "below")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, note, "below")}
        />
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCreateNewNote}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Create New Note"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Filter Dropdown */}
            <div className="relative filter-menu-container">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  setShowFilterMenu(!showFilterMenu);
                }}
                className={`flex items-center space-x-1 px-3 py-1 text-sm border rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedTagFilters.length > 0
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-300"
                }`}
              >
                <Filter size={14} />
                <span>Filter</span>
                {selectedTagFilters.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {selectedTagFilters.length}
                  </span>
                )}
                <ChevronDown size={14} />
              </button>

              {/* Filter Menu - positioned relative to button */}
              {showFilterMenu && (
                <div
                  className="filter-menu-container absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                  style={{
                    zIndex: 9999,
                  }}
                >
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Filter by Tags
                      </h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {availableTags.length > 0 ? (
                          availableTags.map((tag) => (
                            <label
                              key={tag.id}
                              className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTagFilters.includes(tag.id)}
                                onChange={() => toggleTagFilter(tag.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="truncate flex-1">
                                {tag.name}
                              </span>
                              {tag.noteCount && (
                                <span className="text-xs text-gray-500">
                                  ({tag.noteCount})
                                </span>
                              )}
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 py-2">
                            No tags available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {selectedTagFilters.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={clearTagFilters}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="updated-desc">Latest First</option>
                <option value="updated-asc">Oldest First</option>
                <option value="title-asc">A to Z</option>
                <option value="title-desc">Z to A</option>
                <option value="created-desc">Newest Created</option>
                <option value="created-asc">Oldest Created</option>
              </select>
            </div>
          </div>

          {/* Note count */}
          <div className="text-sm text-gray-500">
            {filteredAndSortedNotes.length} note
            {filteredAndSortedNotes.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Notes List - Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No notes found</p>
            <p className="text-sm">
              Create your first note or adjust your filters
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedNotes.map((note) => renderNote(note))}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedNotes={Array.from(selectedNotes)}
        totalNotes={filteredAndSortedNotes.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onClearSelection={handleClearSelection}
        onBulkTagAction={onBulkTagAction}
        onBulkExport={onBulkExport}
        onBulkDelete={onBulkDelete}
        onBulkUndo={onBulkUndo}
        isProcessing={isProcessing}
        processingStatus={processingStatus}
        deletedNotes={deletedNotes}
      />
    </div>
  );
};

export default React.memo(ImprovedNotesList);
