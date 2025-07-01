import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Settings,
  Star,
  Trash2,
  FileText,
  FolderOpen,
  Tag,
  Book,
  Hash,
  MoreHorizontal,
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Clock,
  Archive,
  Home,
  Bookmark,
  Filter,
} from "lucide-react";
import configService from "../configService.js";

const ImprovedSidebar = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  onShowSettings,
  onShowUserManagement,
  onShowEvernoteImport,
  onNotesUpdate,
}) => {
  const [backendUrl, setBackendUrl] = useState("");
  const [folders, setFolders] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [editing, setEditing] = useState({ type: null, id: null, name: "" });
  const [creating, setCreating] = useState({
    type: "",
    name: "",
    parentId: null,
  });
  const [dragOver, setDragOver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3003");
      }
    };
    initBackendUrl();
  }, []);

  // Load data when backend URL and user are available
  useEffect(() => {
    if (backendUrl && user?.id) {
      loadAllData();
    }
  }, [backendUrl, user?.id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadFolders(), loadNotebooks(), loadTags()]);
    } catch (error) {
      console.error("Error loading sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/folders`);
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const loadNotebooks = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/notebooks`);
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data);
      }
    } catch (error) {
      console.error("Error loading notebooks:", error);
    }
  };

  const loadTags = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tags`);
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  // Create operations
  const createFolder = async (name, parentId = null) => {
    if (!name?.trim()) {
      alert("Please enter a folder name");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId,
          color: "#3b82f6",
        }),
      });

      if (response.ok) {
        const newFolder = await response.json();
        setFolders((prev) => [...prev, newFolder]);
        onNotesUpdate?.(); // Refresh the main app
        return newFolder;
      } else {
        throw new Error(`Failed to create folder: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder. Please try again.");
    }
  };

  const createNotebook = async (name, folderId = null) => {
    if (!name?.trim()) {
      alert("Please enter a notebook name");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/notebooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          folderId,
          color: "#10b981",
        }),
      });

      if (response.ok) {
        const newNotebook = await response.json();
        setNotebooks((prev) => [...prev, newNotebook]);
        onNotesUpdate?.(); // Refresh the main app
        return newNotebook;
      } else {
        throw new Error(`Failed to create notebook: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating notebook:", error);
      alert("Failed to create notebook. Please try again.");
    }
  };

  const createTag = async (name) => {
    if (!name?.trim()) {
      alert("Please enter a tag name");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          color: "#f59e0b",
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags((prev) => [...prev, newTag]);
        onNotesUpdate?.(); // Refresh the main app
        return newTag;
      } else {
        throw new Error(`Failed to create tag: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      alert("Failed to create tag. Please try again.");
    }
  };

  // Update operations
  const updateItem = async (type, id, updates) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/${type}s/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        const updatedItem = await response.json();

        if (type === "folder") {
          setFolders((prev) =>
            prev.map((f) => (f.id === id ? updatedItem : f))
          );
        } else if (type === "notebook") {
          setNotebooks((prev) =>
            prev.map((n) => (n.id === id ? updatedItem : n))
          );
        } else if (type === "tag") {
          setTags((prev) => prev.map((t) => (t.id === id ? updatedItem : t)));
        }

        return updatedItem;
      }
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
    }
  };

  // Delete operations
  const deleteItem = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/${type}s/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        if (type === "folder") {
          setFolders((prev) => prev.filter((f) => f.id !== id));
          // Also remove notebooks in this folder
          setNotebooks((prev) => prev.filter((n) => n.folderId !== id));
        } else if (type === "notebook") {
          setNotebooks((prev) => prev.filter((n) => n.id !== id));
        } else if (type === "tag") {
          setTags((prev) => prev.filter((t) => t.id !== id));
        }
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, type, id) => {
    // Get the name/title for better debugging
    let name = "";
    if (type === "notebook") {
      const notebook = notebooks.find((n) => n.id === id);
      name = notebook?.name || "";
    } else if (type === "folder") {
      const folder = folders.find((f) => f.id === id);
      name = folder?.name || "";
    } else if (type === "tag") {
      const tag = tags.find((t) => t.id === id);
      name = tag?.name || "";
    }

    console.log(`🏗️ Starting ${type} drag:`, name);
    e.dataTransfer.setData("text/plain", JSON.stringify({ type, id, name }));
  };

  const handleDragOver = (e, targetType, targetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    console.log("📍 Sidebar drag over:", targetType, targetId);
    setDragOver({ type: targetType, id: targetId });
  };

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop target
    if (!e.currentTarget.contains(e.relatedTarget)) {
      console.log("🚪 Sidebar drag leave");
      setDragOver(null);
    }
  };

  const handleDrop = async (e, targetType, targetId) => {
    e.preventDefault();
    console.log("📦 Sidebar drop:", targetType, targetId);
    setDragOver(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { type: sourceType, id: sourceId } = dragData;
      console.log(
        "🎯 Drop data:",
        sourceType,
        sourceId,
        "->",
        targetType,
        targetId
      );

      // Handle note drops
      if (sourceType === "note") {
        console.log("📝 Note dropped on", targetType);
        if (targetType === "notebook") {
          console.log("📚 Moving note to notebook");
          await updateNote(sourceId, { notebook: targetId, folder: null });
        } else if (targetType === "folder") {
          console.log("📁 Moving note to folder");
          await updateNote(sourceId, { folder: targetId, notebook: null });
        } else if (targetType === "tag") {
          console.log("🏷️ Adding tag to note");
          // Add tag to note
          await addTagToNote(sourceId, targetId);
        }
      }
      // Handle notebook to folder drop
      else if (sourceType === "notebook" && targetType === "folder") {
        console.log("📚→📁 Moving notebook to folder");
        await updateItem("notebook", sourceId, { folderId: targetId });
      }
      // Handle notebook reordering
      else if (sourceType === "notebook" && targetType === "notebook") {
        console.log("📚↔️📚 Reordering notebooks");
        await reorderNotebooks(sourceId, targetId);
      }
      // Handle folder reordering
      else if (sourceType === "folder" && targetType === "folder") {
        console.log("📁↔️📁 Reordering folders");
        await reorderFolders(sourceId, targetId);
      }
      // Handle tag reordering
      else if (sourceType === "tag" && targetType === "tag") {
        console.log("🏷️↔️🏷️ Reordering tags");
        await reorderTags(sourceId, targetId);
      }

      await loadAllData(); // Refresh data
      if (onNotesUpdate) {
        console.log("🔄 Refreshing notes in parent");
        onNotesUpdate(); // Notify parent to refresh notes
      }
    } catch (error) {
      console.error("❌ Sidebar drop error:", error);
    }
  };

  // Note operations
  const updateNote = async (noteId, updates) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: updates }),
        }
      );

      if (!response.ok) throw new Error("Failed to update note");
      console.log("Note updated successfully");
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const addTagToNote = async (noteId, tagId) => {
    try {
      // First get the note to see its current tags
      const noteResponse = await fetch(
        `${backendUrl}/api/${user.id}/notes/${noteId}`
      );
      if (!noteResponse.ok) throw new Error("Failed to get note");

      const note = await noteResponse.json();
      const currentTags = note.tags || [];

      // Add the tag if it's not already there
      if (
        !currentTags.some((tag) =>
          typeof tag === "string" ? tag === tagId : tag.id === tagId
        )
      ) {
        const updatedTags = [...currentTags, tagId];
        await updateNote(noteId, { tags: updatedTags });
      }
    } catch (error) {
      console.error("Error adding tag to note:", error);
    }
  };

  // Editing handlers
  const startEditing = (type, id, currentName) => {
    setEditing({ type, id, name: currentName });
  };

  const startCreating = (type, parentId = null) => {
    setCreating({ type, name: "", parentId });
  };

  const cancelCreating = () => {
    setCreating({ type: "", name: "", parentId: null });
  };

  const submitCreation = async () => {
    if (!creating.name.trim()) return;

    try {
      let result;
      if (creating.type === "folder") {
        result = await createFolder(creating.name, creating.parentId);
      } else if (creating.type === "notebook") {
        result = await createNotebook(creating.name, creating.parentId);
      } else if (creating.type === "tag") {
        result = await createTag(creating.name);
      }

      if (result) {
        cancelCreating();
      }
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const saveEdit = async () => {
    if (!editing.name.trim()) return;

    await updateItem(editing.type, editing.id, { name: editing.name.trim() });
    setEditing({ type: null, id: null, name: "" });
  };

  const cancelEdit = () => {
    setEditing({ type: null, id: null, name: "" });
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Organize notebooks by folder
  const notebooksByFolder = notebooks.reduce((acc, notebook) => {
    const folderId = notebook.folderId || "root";
    if (!acc[folderId]) acc[folderId] = [];
    acc[folderId].push(notebook);
    return acc;
  }, {});

  // Reordering functions
  const reorderNotebooks = async (sourceNotebookId, targetNotebookId) => {
    try {
      console.log(
        "📚 Reordering notebooks:",
        sourceNotebookId,
        "->",
        targetNotebookId
      );

      const response = await fetch(`${backendUrl}/api/${user.id}/notebooks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceId: sourceNotebookId, 
          targetId: targetNotebookId,
          position: 'after' 
        })
      });

      if (response.ok) {
        console.log("✅ Notebook reordering completed successfully");
      } else {
        console.error("❌ Failed to reorder notebooks:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering notebooks:", error);
      throw error;
    }
  };

  const reorderFolders = async (sourceFolderId, targetFolderId) => {
    try {
      console.log(
        "📁 Reordering folders:",
        sourceFolderId,
        "->",
        targetFolderId
      );

      const response = await fetch(`${backendUrl}/api/${user.id}/folders/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceId: sourceFolderId, 
          targetId: targetFolderId,
          position: 'after' 
        })
      });

      if (response.ok) {
        console.log("✅ Folder reordering completed successfully");
      } else {
        console.error("❌ Failed to reorder folders:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering folders:", error);
      throw error;
    }
  };

  const reorderTags = async (sourceTagId, targetTagId) => {
    try {
      console.log("🏷️ Reordering tags:", sourceTagId, "->", targetTagId);

      const response = await fetch(`${backendUrl}/api/${user.id}/tags/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceId: sourceTagId, 
          targetId: targetTagId,
          position: 'after' 
        })
      });

      if (response.ok) {
        console.log("✅ Tag reordering completed successfully");
      } else {
        console.error("❌ Failed to reorder tags:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering tags:", error);
      throw error;
    }
  };

  // Render functions
  const renderFolder = (folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isEditing = editing.type === "folder" && editing.id === folder.id;
    const isDragTarget =
      dragOver?.type === "folder" && dragOver?.id === folder.id;
    const folderNotebooks = notebooksByFolder[folder.id] || [];
    const subFolders = folders.filter((f) => f.parentId === folder.id);

    return (
      <div key={folder.id} style={{ marginLeft: depth * 16 }}>
        <div
          className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group ${
            isDragTarget ? "bg-blue-100 border-2 border-blue-300" : ""
          } ${
            currentView === "folder" && currentView.folderId === folder.id
              ? "bg-blue-50"
              : ""
          }`}
          draggable
          onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
          onDragOver={(e) => handleDragOver(e, "folder", folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "folder", folder.id)}
          onClick={() => {
            onViewChange("folder", { folderId: folder.id });
            toggleFolder(folder.id);
          }}
        >
          <div className="flex items-center space-x-2 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            <FolderOpen
              size={16}
              style={{ color: folder.color || "#3b82f6" }}
            />
            {isEditing ? (
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, name: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                onBlur={saveEdit}
                className="flex-1 px-1 border rounded"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm">{folder.name}</span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing("folder", folder.id, folder.name);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteItem("folder", folder.id);
              }}
              className="p-1 hover:bg-gray-200 rounded text-red-600"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4">
            {/* Render notebooks in this folder */}
            {folderNotebooks.map((notebook) =>
              renderNotebook(notebook, depth + 1)
            )}

            {/* Render subfolders */}
            {subFolders.map((subFolder) => renderFolder(subFolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderNotebook = (notebook, depth = 0) => {
    const isEditing = editing.type === "notebook" && editing.id === notebook.id;
    const isDragTarget =
      dragOver?.type === "notebook" && dragOver?.id === notebook.id;

    return (
      <div
        key={notebook.id}
        style={{ marginLeft: depth * 16 }}
        className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group ${
          isDragTarget ? "bg-green-100 border-2 border-green-300" : ""
        } ${
          currentView === "notebook" && currentView.notebookId === notebook.id
            ? "bg-green-50"
            : ""
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, "notebook", notebook.id)}
        onDragOver={(e) => handleDragOver(e, "notebook", notebook.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "notebook", notebook.id)}
        onClick={() => onViewChange("notebook", { notebookId: notebook.id })}
      >
        <div className="flex items-center space-x-2 flex-1">
          <Book size={16} style={{ color: notebook.color || "#10b981" }} />
          {isEditing ? (
            <input
              value={editing.name}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, name: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              onBlur={saveEdit}
              className="flex-1 px-1 border rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{notebook.name}</span>
          )}
          {notebook.noteCount > 0 && (
            <span className="text-xs text-gray-500">
              ({notebook.noteCount})
            </span>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing("notebook", notebook.id, notebook.name);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteItem("notebook", notebook.id);
            }}
            className="p-1 hover:bg-gray-200 rounded text-red-600"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  };

  const renderTag = (tag) => {
    const isEditing = editing.type === "tag" && editing.id === tag.id;
    const isDragTarget = dragOver?.type === "tag" && dragOver?.id === tag.id;

    return (
      <div
        key={tag.id}
        className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group ${
          isDragTarget ? "bg-yellow-100 border-2 border-yellow-300" : ""
        } ${
          currentView === "tag" && currentView.tagId === tag.id
            ? "bg-yellow-50"
            : ""
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, "tag", tag.id)}
        onDragOver={(e) => handleDragOver(e, "tag", tag.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "tag", tag.id)}
        onClick={() => onViewChange("tag", { tagId: tag.id })}
      >
        <div className="flex items-center space-x-2 flex-1">
          <Hash size={16} style={{ color: tag.color || "#f59e0b" }} />
          {isEditing ? (
            <input
              value={editing.name}
              onChange={(e) =>
                setEditing((prev) => ({ ...prev, name: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              onBlur={saveEdit}
              className="flex-1 px-1 border rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm">{tag.name}</span>
          )}
          {tag.noteCount > 0 && (
            <span className="text-xs text-gray-500">({tag.noteCount})</span>
          )}
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing("tag", tag.id, tag.name);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteItem("tag", tag.id);
            }}
            className="p-1 hover:bg-gray-200 rounded text-red-600"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootNotebooks = notebooksByFolder.root || [];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Noet</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onShowSettings}
              className="p-1 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onLogout}
              className="p-1 hover:bg-gray-100 rounded text-red-600"
              title="Logout"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">{user?.name || user?.email}</div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {/* Main Views */}
          <div
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentView === "all" ? "bg-blue-50 text-blue-600" : ""
            }`}
            onClick={() => onViewChange("all")}
          >
            <FileText size={16} />
            <span className="text-sm">All Notes</span>
          </div>

          <div
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentView === "recent" ? "bg-blue-50 text-blue-600" : ""
            }`}
            onClick={() => onViewChange("recent")}
          >
            <Clock size={16} />
            <span className="text-sm">Recent</span>
          </div>

          <div
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentView === "starred" ? "bg-blue-50 text-blue-600" : ""
            }`}
            onClick={() => onViewChange("starred")}
          >
            <Star size={16} />
            <span className="text-sm">Starred</span>
          </div>

          <div
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentView === "archived" ? "bg-blue-50 text-blue-600" : ""
            }`}
            onClick={() => onViewChange("archived")}
          >
            <Archive size={16} />
            <span className="text-sm">Archived</span>
          </div>

          <div
            className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
              currentView === "trash" ? "bg-blue-50 text-blue-600" : ""
            }`}
            onClick={() => onViewChange("trash")}
          >
            <Trash2 size={16} />
            <span className="text-sm">Trash</span>
          </div>
        </div>

        {/* Folders & Notebooks */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Folders & Notebooks
            </h3>
            <div className="flex space-x-1">
              <button
                onClick={() => startCreating("folder")}
                className="p-1 hover:bg-gray-100 rounded"
                title="New Folder"
              >
                <FolderOpen size={14} />
              </button>
              <button
                onClick={() => startCreating("notebook")}
                className="p-1 hover:bg-gray-100 rounded"
                title="New Notebook"
              >
                <Book size={14} />
              </button>
            </div>
          </div>

          {/* Creation Form for Folders/Notebooks */}
          {(creating.type === "folder" || creating.type === "notebook") && (
            <div className="mb-2 p-2 bg-blue-50 rounded border">
              <div className="flex items-center space-x-2">
                {creating.type === "folder" ? (
                  <FolderOpen size={14} />
                ) : (
                  <Book size={14} />
                )}
                <input
                  value={creating.name}
                  onChange={(e) =>
                    setCreating((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreation();
                    if (e.key === "Escape") cancelCreating();
                  }}
                  placeholder={`${
                    creating.type === "folder" ? "Folder" : "Notebook"
                  } name...`}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={submitCreation}
                  className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  ✓
                </button>
                <button
                  onClick={cancelCreating}
                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {rootFolders.map((folder) => renderFolder(folder))}
            {rootNotebooks.map((notebook) => renderNotebook(notebook))}
          </div>
        </div>

        {/* Tags */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Tags</h3>
            <button
              onClick={() => startCreating("tag")}
              className="p-1 hover:bg-gray-100 rounded"
              title="New Tag"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Creation Form for Tags */}
          {creating.type === "tag" && (
            <div className="mb-2 p-2 bg-yellow-50 rounded border">
              <div className="flex items-center space-x-2">
                <Hash size={14} />
                <input
                  value={creating.name}
                  onChange={(e) =>
                    setCreating((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCreation();
                    if (e.key === "Escape") cancelCreating();
                  }}
                  placeholder="Tag name..."
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  autoFocus
                />
                <button
                  onClick={submitCreation}
                  className="px-2 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                >
                  ✓
                </button>
                <button
                  onClick={cancelCreating}
                  className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">{tags.map((tag) => renderTag(tag))}</div>
        </div>

        {/* User Actions */}
        <div className="p-2 border-t border-gray-200 mt-4">
          <button
            onClick={onShowUserManagement}
            className="w-full text-left p-2 hover:bg-gray-100 rounded-lg text-sm"
          >
            Account Settings
          </button>
          <button
            onClick={onShowEvernoteImport}
            className="w-full text-left p-2 hover:bg-gray-100 rounded-lg text-sm"
          >
            Import from Evernote
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedSidebar;
