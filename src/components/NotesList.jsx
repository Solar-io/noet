import React, { useState, useEffect } from "react";
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

const NotesList = ({
  notes = [],
  selectedNote,
  onSelectNote,
  onCreateNewNote,
  searchQuery,
  onSearchChange,
  userId,
  onNotesRefresh,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterBy, setFilterBy] = useState("all"); // 'all', 'starred', 'recent', 'archived'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [noteOptions, setNoteOptions] = useState(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // Filter and sort notes
  const filteredAndSortedNotes = React.useMemo(() => {
    let filtered = notes.filter((note) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // Category filter
      switch (filterBy) {
        case "starred":
          return note.starred;
        case "recent":
          return (
            new Date(note.updatedAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
        case "archived":
          return note.archived;
        default:
          return !note.archived;
      }
    });

    // Sort notes
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = (a.title || "Untitled").localeCompare(
            b.title || "Untitled"
          );
          break;
        case "createdAt":
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case "updatedAt":
        default:
          comparison = new Date(a.updatedAt) - new Date(b.updatedAt);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [notes, searchQuery, filterBy, sortBy, sortOrder]);

  const handleNoteSelect = (note) => {
    onSelectNote(note);
    setSelectedNotes(new Set());
  };

  const handleBulkSelect = (noteId) => {
    setSelectedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === filteredAndSortedNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(filteredAndSortedNotes.map((note) => note.id)));
    }
  };

  const startRenaming = (note) => {
    setEditingNoteTitle(note.id);
    setNewTitle(note.title || "Untitled");
    setNoteOptions(null);
  };

  const saveNoteTitle = async () => {
    if (!editingNoteTitle || !newTitle.trim()) return;

    try {
      // Call the update API
      const response = await fetch(
        `${await configService.getBackendUrl()}/api/${userId}/notes/${editingNoteTitle}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note title");

      setEditingNoteTitle(null);
      setNewTitle("");
      onNotesRefresh?.();
    } catch (error) {
      console.error("Error updating note title:", error);
      alert("Failed to update note title");
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(
        `${await configService.getBackendUrl()}/api/${userId}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete note");

      // If we just deleted the selected note, clear selection
      if (selectedNote?.id === noteId) {
        onSelectNote(null);
      }

      onNotesRefresh?.();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const toggleNoteStar = async (noteId, starred) => {
    try {
      const response = await fetch(
        `${await configService.getBackendUrl()}/api/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starred: !starred }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");

      onNotesRefresh?.();
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };

  const archiveNote = async (noteId, archived) => {
    try {
      const response = await fetch(
        `${await configService.getBackendUrl()}/api/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            metadata: { archived: !archived }
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");

      onNotesRefresh?.();
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Failed to update note");
    }
  };

  const duplicateNote = async (note) => {
    try {
      const response = await fetch(
        `${await configService.getBackendUrl()}/api/${userId}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${note.title || "Untitled"} (Copy)`,
            content: note.content || "",
            tags: note.tags || [],
            notebook: note.notebook,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to duplicate note");

      onNotesRefresh?.();
    } catch (error) {
      console.error("Error duplicating note:", error);
      alert("Failed to duplicate note");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const getContentPreview = (content) => {
    if (!content) return "No content";
    // Remove HTML tags and get first 100 characters
    const text = content.replace(/<[^>]*>/g, "").trim();
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  // Get available notebooks and tags for filtering
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    // Load notebooks and tags for filter options
    const loadFilterOptions = async () => {
      try {
        const [notebooksRes, tagsRes] = await Promise.all([
          fetch(
            `${await configService.getBackendUrl()}/api/${userId}/notebooks`
          ),
          fetch(`${await configService.getBackendUrl()}/api/${userId}/tags`),
        ]);

        if (notebooksRes.ok) {
          const notebooksData = await notebooksRes.json();
          setNotebooks(notebooksData);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    if (userId) {
      loadFilterOptions();
    }
  }, [userId]);

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="p-2 text-gray-400 hover:text-gray-600 rounded"
              title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
            >
              {viewMode === "list" ? <Grid size={16} /> : <List size={16} />}
            </button>
            <button
              onClick={onCreateNewNote}
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
              title="Create new note"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
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

        {/* Filters and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                showFilters
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Filter size={14} />
              <span>Filter</span>
              <ChevronDown
                size={12}
                className={showFilters ? "rotate-180" : ""}
              />
            </button>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="updatedAt-desc">Latest First</option>
              <option value="updatedAt-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
              <option value="createdAt-desc">Newest Created</option>
              <option value="createdAt-asc">Oldest Created</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredAndSortedNotes.length} note
            {filteredAndSortedNotes.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFilterBy("all")}
                className={`px-3 py-2 rounded text-sm ${
                  filterBy === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setFilterBy("starred")}
                className={`px-3 py-2 rounded text-sm ${
                  filterBy === "starred"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Starred
              </button>
              <button
                onClick={() => setFilterBy("recent")}
                className={`px-3 py-2 rounded text-sm ${
                  filterBy === "recent"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setFilterBy("archived")}
                className={`px-3 py-2 rounded text-sm ${
                  filterBy === "archived"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedNotes.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedNotes.size} note{selectedNotes.size !== 1 ? "s" : ""}{" "}
                selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    selectedNotes.forEach((noteId) => {
                      const note = notes.find((n) => n.id === noteId);
                      if (note) toggleNoteStar(noteId, note.starred);
                    });
                    setSelectedNotes(new Set());
                  }}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded"
                  title="Toggle star"
                >
                  <Star size={14} />
                </button>
                <button
                  onClick={() => {
                    selectedNotes.forEach((noteId) => {
                      const note = notes.find((n) => n.id === noteId);
                      if (note) archiveNote(noteId, note.archived);
                    });
                    setSelectedNotes(new Set());
                  }}
                  className="text-blue-600 hover:text-blue-700 p-1 rounded"
                  title="Toggle archive"
                >
                  <Archive size={14} />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(`Delete ${selectedNotes.size} selected notes?`)
                    ) {
                      selectedNotes.forEach((noteId) => deleteNote(noteId));
                      setSelectedNotes(new Set());
                    }
                  }}
                  className="text-red-600 hover:text-red-700 p-1 rounded"
                  title="Delete selected"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setSelectedNotes(new Set())}
                  className="text-gray-600 hover:text-gray-700 p-1 rounded"
                  title="Clear selection"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-sm mb-4">
                {searchQuery
                  ? "No notes match your search."
                  : "Create your first note to get started."}
              </p>
              <button
                onClick={onCreateNewNote}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Note
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`p-2 ${
              viewMode === "grid" ? "grid grid-cols-2 gap-2" : "space-y-1"
            }`}
          >
            {filteredAndSortedNotes.map((note) => (
              <div
                key={note.id}
                className={`relative group ${
                  viewMode === "grid"
                    ? "bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md"
                    : `p-3 rounded cursor-pointer transition-colors ${
                        selectedNote?.id === note.id
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-gray-50"
                      }`
                } transition-all`}
              >
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="checkbox"
                    checked={selectedNotes.has(note.id)}
                    onChange={() => handleBulkSelect(note.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Note content */}
                <div
                  className={`${
                    selectedNotes.size > 0 ? "ml-6" : ""
                  } cursor-pointer`}
                  onClick={() => handleNoteSelect(note)}
                >
                  {/* Title */}
                  <div className="flex items-start justify-between mb-2">
                    {editingNoteTitle === note.id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={saveNoteTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveNoteTitle();
                          if (e.key === "Escape") {
                            setEditingNoteTitle(null);
                            setNewTitle("");
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 font-medium text-gray-900 bg-transparent border-b border-blue-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <h3 className="font-medium text-gray-900 truncate flex-1">
                        {note.title || "Untitled"}
                      </h3>
                    )}

                    <div className="flex items-center space-x-1 ml-2">
                      {note.starred && (
                        <Star
                          size={14}
                          className="text-yellow-500 fill-current"
                        />
                      )}
                      {note.archived && (
                        <Archive size={14} className="text-gray-400" />
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteOptions(
                              noteOptions === note.id ? null : note.id
                            );
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {getContentPreview(note.content)}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.slice(0, 3).map((tagId) => {
                        const tag = tags.find((t) => t.id === tagId);
                        return tag ? (
                          <span
                            key={tagId}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ) : null;
                      })}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{note.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(note.updatedAt)}</span>
                    {note.notebook && (
                      <span className="flex items-center">
                        <Book size={12} className="mr-1" />
                        {notebooks.find((nb) => nb.id === note.notebook)
                          ?.name || "Unknown"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Note options menu */}
                {noteOptions === note.id && (
                  <div className="absolute right-2 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-40">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenaming(note);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                    >
                      <Edit2 size={14} className="mr-2" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNoteStar(note.id, note.starred);
                        setNoteOptions(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                    >
                      <Star size={14} className="mr-2" />
                      {note.starred ? "Unstar" : "Star"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateNote(note);
                        setNoteOptions(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                    >
                      <Copy size={14} className="mr-2" />
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveNote(note.id, note.archived);
                        setNoteOptions(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                    >
                      <Archive size={14} className="mr-2" />
                      {note.archived ? "Unarchive" : "Archive"}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                        setNoteOptions(null);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(noteOptions || showFilters) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setNoteOptions(null);
            setShowFilters(false);
          }}
        />
      )}
    </div>
  );
};

export default NotesList;
