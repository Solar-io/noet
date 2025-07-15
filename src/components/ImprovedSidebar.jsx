import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Shield,
  LogOut,
} from "lucide-react";
import configService from "../configService.js";

// Preset color options for quick selection
const PRESET_COLORS = [
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
  "#65a30d",
  "#ea580c",
  "#db2777",
  "#4f46e5",
  "#059669",
  "#d97706",
  "#b91c1c",
  "#7c2d12",
  "#991b1b",
];

const ImprovedSidebar = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  onShowSettings,
  onShowUserManagement,
  onShowAdminInterface,
  onShowEvernoteImport,
  onNotesUpdate,
  onNotebooksUpdate,
  onFoldersUpdate,
  onTagsUpdate,
  notebooks: propNotebooks = [],
  folders: propFolders = [],
  tags: propTags = [],
}) => {
  const [backendUrl, setBackendUrl] = useState("");
  const [internalFolders, setInternalFolders] = useState([]);
  const [internalNotebooks, setInternalNotebooks] = useState([]);
  const [internalTags, setInternalTags] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [editing, setEditing] = useState({
    type: null,
    id: null,
    name: "",
    color: "",
  });
  const [creating, setCreating] = useState({
    type: "",
    name: "",
    color: "#3b82f6",
    parentId: null,
  });
  const [dragOver, setDragOver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use props data if available, otherwise use internal state
  const folders = propFolders.length > 0 ? propFolders : internalFolders;
  const notebooks =
    propNotebooks.length > 0 ? propNotebooks : internalNotebooks;
  const tags = propTags.length > 0 ? propTags : internalTags;

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004");
      }
    };
    initBackendUrl();
  }, []);

  // Load data when backend URL and user are available (only if props are not provided)
  useEffect(() => {
    if (
      backendUrl &&
      user?.id &&
      propNotebooks.length === 0 &&
      propFolders.length === 0 &&
      propTags.length === 0
    ) {
      loadAllData();
    } else if (
      propNotebooks.length > 0 ||
      propFolders.length > 0 ||
      propTags.length > 0
    ) {
      // If props are provided, we don't need to show loading state
      setLoading(false);
    }
  }, [
    backendUrl,
    user?.id,
    propNotebooks.length,
    propFolders.length,
    propTags.length,
  ]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadFolders(), loadNotebooks(), loadTags()]);
    } catch (error) {
      console.error("Error loading sidebar data:", error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, user?.id]);

  const loadFolders = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/folders`);
      if (response.ok) {
        const data = await response.json();
        setInternalFolders(data);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  }, [backendUrl, user?.id]);

  const loadNotebooks = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/notebooks`);
      if (response.ok) {
        const data = await response.json();
        setInternalNotebooks(data);
      }
    } catch (error) {
      console.error("Error loading notebooks:", error);
    }
  }, [backendUrl, user?.id]);

  const loadTags = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tags`);
      if (response.ok) {
        const data = await response.json();
        setInternalTags(data);
      } else {
        console.error(
          "ImprovedSidebar: Failed to load tags:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  }, [backendUrl, user?.id]);

  // Color picker component with presets
  const ColorPicker = ({ value, onChange, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
        />
        <span className="text-xs text-gray-500">Custom</span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-4 h-4 rounded border transition-all hover:scale-110 ${
              value === color ? "border-gray-800 border-2" : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );

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
          color: creating.color,
        }),
      });

      if (response.ok) {
        const newFolder = await response.json();
        setInternalFolders((prev) => [...prev, newFolder]);
        // Notify parent component to refresh its state
        if (onFoldersUpdate) {
          onFoldersUpdate();
        }
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
          color: creating.color,
        }),
      });

      if (response.ok) {
        const newNotebook = await response.json();
        setInternalNotebooks((prev) => [...prev, newNotebook]);
        // Notify parent component to refresh its state
        if (onNotebooksUpdate) {
          onNotebooksUpdate();
        }
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
          color: creating.color,
        }),
      });

      if (response.ok) {
        const newTag = await response.json();
        setInternalTags((prev) => [...prev, newTag]);
        // Notify parent component to refresh its state
        if (onTagsUpdate) {
          onTagsUpdate();
        }
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
          setInternalFolders((prev) =>
            prev.map((f) => (f.id === id ? updatedItem : f))
          );
        } else if (type === "notebook") {
          setInternalNotebooks((prev) =>
            prev.map((n) => (n.id === id ? updatedItem : n))
          );
        } else if (type === "tag") {
          setInternalTags((prev) =>
            prev.map((t) => (t.id === id ? updatedItem : t))
          );
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
          setInternalFolders((prev) => prev.filter((f) => f.id !== id));
          // Also remove notebooks in this folder
          setInternalNotebooks((prev) => prev.filter((n) => n.folderId !== id));
          // Notify parent component to refresh
          onFoldersUpdate?.();
        } else if (type === "notebook") {
          setInternalNotebooks((prev) => prev.filter((n) => n.id !== id));
          // Notify parent component to refresh
          onNotebooksUpdate?.();
        } else if (type === "tag") {
          setInternalTags((prev) => prev.filter((t) => t.id !== id));
          // Notify parent component to refresh
          onTagsUpdate?.();
        }

        // Also trigger notes refresh since deleting organizational items affects note filtering
        onNotesUpdate?.();

        console.log(`✅ Successfully deleted ${type} and refreshed UI`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
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
      // Handle notebook to root drop (unnesting)
      else if (sourceType === "notebook" && targetType === "root") {
        console.log("📚→🏠 Moving notebook to root (unnesting)");
        await updateItem("notebook", sourceId, { folderId: null });
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
      // Don't refresh notes for reordering operations - they don't affect note content
    } catch (error) {
      console.error("❌ Sidebar drop error:", error);
    }
  };

  // Handle reordering drops (for above/below drop zones)
  const handleReorderDrop = async (e, targetType, targetId, position) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("📦 Reorder drop:", targetType, targetId, position);
    setDragOver(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { type: sourceType, id: sourceId } = dragData;

      console.log(
        "🎯 Reorder data:",
        sourceType,
        sourceId,
        "->",
        targetType,
        targetId,
        position
      );

      // Handle reordering within the same type
      if (sourceType === targetType && sourceId !== targetId) {
        if (sourceType === "notebook") {
          await reorderNotebooks(sourceId, targetId, position);
        } else if (sourceType === "folder") {
          await reorderFolders(sourceId, targetId, position);
        } else if (sourceType === "tag") {
          await reorderTags(sourceId, targetId, position);
        }

        await loadAllData(); // Refresh data
        // Don't refresh notes for reordering operations - they don't affect note content
      }
      // Handle notebook to root drop (unnesting via reorder zones)
      else if (sourceType === "notebook" && targetType === "root") {
        console.log("📚→🏠 Moving notebook to root (unnesting via reorder)");
        await updateItem("notebook", sourceId, { folderId: null });
        await loadAllData(); // Refresh data
      }
    } catch (error) {
      console.error("❌ Reorder drop error:", error);
    }
  };

  // Handle root-level drops (for unnesting notebooks)
  const handleRootDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("📦 Root drop");
    setDragOver(null);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { type: sourceType, id: sourceId, name } = dragData;

      console.log("🎯 Root drop data:", sourceType, sourceId, name);

      if (sourceType === "notebook") {
        console.log("📚→🏠 Unnesting notebook:", name);

        // Get current notebook to check if it's actually in a folder
        const currentNotebook = notebooks.find((n) => n.id === sourceId);
        if (currentNotebook?.folderId) {
          console.log(`📚 Moving "${name}" from folder to root`);
          await updateItem("notebook", sourceId, { folderId: null });
          await loadAllData();
          console.log("✅ Notebook unnested successfully");
        } else {
          console.log("⚠️ Notebook is already at root level");
        }
      } else {
        console.log("❌ Only notebooks can be unnested");
      }
    } catch (error) {
      console.error("❌ Root drop error:", error);
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
    const currentItem =
      type === "folder"
        ? folders.find((f) => f.id === id)
        : type === "notebook"
        ? notebooks.find((n) => n.id === id)
        : type === "tag"
        ? tags.find((t) => t.id === id)
        : null;

    setEditing({
      type,
      id,
      name: currentName,
      color: currentItem?.color || "#3b82f6",
    });
  };

  const startCreating = (type, parentId = null) => {
    const defaultColor =
      type === "folder"
        ? "#3b82f6"
        : type === "notebook"
        ? "#10b981"
        : type === "tag"
        ? "#f59e0b"
        : "#3b82f6";

    setCreating({
      type,
      name: "",
      color: defaultColor,
      parentId,
    });
  };

  const cancelCreating = () => {
    setCreating({ type: "", name: "", color: "#3b82f6", parentId: null });
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

    await updateItem(editing.type, editing.id, {
      name: editing.name.trim(),
      color: editing.color,
    });
    setEditing({ type: null, id: null, name: "", color: "" });
  };

  const cancelEdit = () => {
    setEditing({ type: null, id: null, name: "", color: "" });
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

  // Organize notebooks by folder - memoized for performance
  const notebooksByFolder = useMemo(() => {
    return notebooks.reduce((acc, notebook) => {
      const folderId = notebook.folderId || "root";
      if (!acc[folderId]) acc[folderId] = [];
      acc[folderId].push(notebook);
      return acc;
    }, {});
  }, [notebooks]);

  // Reordering functions
  const reorderNotebooks = async (
    sourceNotebookId,
    targetNotebookId,
    position = "after"
  ) => {
    try {
      console.log(
        "📚 Reordering notebooks:",
        sourceNotebookId,
        "->",
        targetNotebookId
      );

      const response = await fetch(
        `${backendUrl}/api/${user.id}/notebooks/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: sourceNotebookId,
            targetId: targetNotebookId,
            position: position,
          }),
        }
      );

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

  const reorderFolders = async (
    sourceFolderId,
    targetFolderId,
    position = "after"
  ) => {
    try {
      console.log(
        "📁 Reordering folders:",
        sourceFolderId,
        "->",
        targetFolderId
      );

      const response = await fetch(
        `${backendUrl}/api/${user.id}/folders/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: sourceFolderId,
            targetId: targetFolderId,
            position: position,
          }),
        }
      );

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

  const reorderTags = async (sourceTagId, targetTagId, position = "after") => {
    try {
      console.log("🏷️ Reordering tags:", sourceTagId, "->", targetTagId);

      const response = await fetch(
        `${backendUrl}/api/${user.id}/tags/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: sourceTagId,
            targetId: targetTagId,
            position: position,
          }),
        }
      );

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
    const isDragBefore =
      dragOver?.type === "folder-before" && dragOver?.id === folder.id;
    const isDragAfter =
      dragOver?.type === "folder-after" && dragOver?.id === folder.id;
    const folderNotebooks = notebooksByFolder[folder.id] || [];
    const subFolders = folders.filter((f) => f.parentId === folder.id);

    return (
      <div
        key={folder.id}
        style={{ marginLeft: depth * 16 }}
        className="relative"
      >
        {/* Elegant drop indicator above */}
        {isDragBefore && (
          <div className="h-0.5 bg-blue-500 mx-2 mb-1 rounded-full shadow-sm" />
        )}

        <div
          className={`flex items-start justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group relative ${
            isDragTarget ? "bg-blue-50" : ""
          } ${
            currentView === "folder" && currentView.folderId === folder.id
              ? "bg-blue-50"
              : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";

            // Determine if this is a before/after drop or target drop
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;

            if (y < height * 0.25) {
              setDragOver({ type: "folder-before", id: folder.id });
            } else if (y > height * 0.75) {
              setDragOver({ type: "folder-after", id: folder.id });
            } else {
              setDragOver({ type: "folder", id: folder.id });
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dragType = dragOver?.type;
            setDragOver(null);

            if (dragType === "folder-before") {
              handleReorderDrop(e, "folder", folder.id, "before");
            } else if (dragType === "folder-after") {
              handleReorderDrop(e, "folder", folder.id, "after");
            } else {
              handleDrop(e, "folder", folder.id);
            }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, "folder", folder.id)}
          onClick={() => {
            onViewChange("folder", { folderId: folder.id });
            toggleFolder(folder.id);
          }}
        >
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="flex-shrink-0 mt-0.5"
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
              className="flex-shrink-0 mt-0.5"
            />
            {isEditing ? (
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <div
                  className="absolute top-0 left-0 right-0 bg-white border rounded-lg shadow-lg p-3 z-10"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FolderOpen size={14} style={{ color: editing.color }} />
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="mb-2">
                    <ColorPicker
                      value={editing.color}
                      onChange={(color) =>
                        setEditing((prev) => ({ ...prev, color }))
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <span
                className="text-sm break-words overflow-wrap-anywhere flex-1 min-w-0 leading-relaxed"
                style={{
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "clip",
                }}
              >
                {folder.name}
              </span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0 ml-2 mt-0.5">
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

        {/* Elegant drop indicator below */}
        {isDragAfter && (
          <div className="h-0.5 bg-blue-500 mx-2 mt-1 rounded-full shadow-sm" />
        )}
      </div>
    );
  };

  const renderNotebook = (notebook, depth = 0) => {
    const isEditing = editing.type === "notebook" && editing.id === notebook.id;
    const isDragTarget =
      dragOver?.type === "notebook" && dragOver?.id === notebook.id;
    const isDragBefore =
      dragOver?.type === "notebook-before" && dragOver?.id === notebook.id;
    const isDragAfter =
      dragOver?.type === "notebook-after" && dragOver?.id === notebook.id;

    return (
      <div
        key={notebook.id}
        style={{ marginLeft: depth * 16 }}
        className="relative"
      >
        {/* Elegant drop indicator above */}
        {isDragBefore && (
          <div className="h-0.5 bg-green-500 mx-2 mb-1 rounded-full shadow-sm" />
        )}

        <div
          className={`flex items-start justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group relative ${
            isDragTarget ? "bg-green-50" : ""
          } ${
            currentView === "notebook" && currentView.notebookId === notebook.id
              ? "bg-green-50"
              : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";

            // Determine if this is a before/after drop or target drop
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;

            if (y < height * 0.25) {
              setDragOver({ type: "notebook-before", id: notebook.id });
            } else if (y > height * 0.75) {
              setDragOver({ type: "notebook-after", id: notebook.id });
            } else {
              setDragOver({ type: "notebook", id: notebook.id });
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dragType = dragOver?.type;
            setDragOver(null);

            if (dragType === "notebook-before") {
              handleReorderDrop(e, "notebook", notebook.id, "before");
            } else if (dragType === "notebook-after") {
              handleReorderDrop(e, "notebook", notebook.id, "after");
            } else {
              handleDrop(e, "notebook", notebook.id);
            }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, "notebook", notebook.id)}
          onClick={() => onViewChange("notebook", { notebookId: notebook.id })}
        >
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <Book
              size={16}
              style={{ color: notebook.color || "#10b981" }}
              className="flex-shrink-0 mt-0.5"
            />
            {isEditing ? (
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <div
                  className="absolute top-0 left-0 right-0 bg-white border rounded-lg shadow-lg p-3 z-10"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Book size={14} style={{ color: editing.color }} />
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="mb-2">
                    <ColorPicker
                      value={editing.color}
                      onChange={(color) =>
                        setEditing((prev) => ({ ...prev, color }))
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span
                  className="text-sm break-words overflow-wrap-anywhere flex-1 min-w-0 leading-relaxed"
                  style={{
                    whiteSpace: "normal",
                    overflow: "visible",
                    textOverflow: "clip",
                  }}
                >
                  {notebook.name}
                </span>
                {notebook.noteCount > 0 && (
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    ({notebook.noteCount})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0 ml-2 mt-0.5">
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

        {/* Elegant drop indicator below */}
        {isDragAfter && (
          <div className="h-0.5 bg-green-500 mx-2 mt-1 rounded-full shadow-sm" />
        )}
      </div>
    );
  };

  // Render creation form
  const renderCreationForm = (type) => {
    if (creating.type !== type) return null;

    const getIcon = () => {
      switch (type) {
        case "folder":
          return <FolderOpen size={14} style={{ color: creating.color }} />;
        case "notebook":
          return <Book size={14} style={{ color: creating.color }} />;
        case "tag":
          return <Hash size={14} style={{ color: creating.color }} />;
        default:
          return null;
      }
    };

    const getButtonColor = () => {
      switch (type) {
        case "folder":
          return "bg-blue-600 hover:bg-blue-700";
        case "notebook":
          return "bg-green-600 hover:bg-green-700";
        case "tag":
          return "bg-yellow-600 hover:bg-yellow-700";
        default:
          return "bg-blue-600 hover:bg-blue-700";
      }
    };

    return (
      <div className="bg-white border rounded-lg shadow-lg p-3 mb-2">
        <div className="flex items-center space-x-2 mb-2">
          {getIcon()}
          <input
            value={creating.name}
            onChange={(e) =>
              setCreating((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCreation();
              if (e.key === "Escape") cancelCreating();
            }}
            placeholder={`Enter ${type} name`}
            className="flex-1 px-2 py-1 border rounded text-sm"
            autoFocus
          />
        </div>
        <div className="mb-2">
          <ColorPicker
            value={creating.color}
            onChange={(color) => setCreating((prev) => ({ ...prev, color }))}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={submitCreation}
            className={`px-3 py-1 text-white rounded text-sm ${getButtonColor()}`}
          >
            Create
          </button>
          <button
            onClick={cancelCreating}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderTag = (tag, index) => {
    const isEditing = editing.type === "tag" && editing.id === tag.id;
    const isDragTarget = dragOver?.type === "tag" && dragOver?.id === tag.id;
    const isDragBefore =
      dragOver?.type === "tag-before" && dragOver?.id === tag.id;
    const isDragAfter =
      dragOver?.type === "tag-after" && dragOver?.id === tag.id;

    return (
      <div key={tag.id} className="relative">
        {/* Elegant drop indicator above */}
        {isDragBefore && (
          <div className="h-0.5 bg-yellow-500 mx-2 mb-1 rounded-full shadow-sm" />
        )}

        <div
          className={`flex items-start justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer group relative ${
            isDragTarget ? "bg-yellow-50" : ""
          } ${
            currentView === "tag" && currentView.tagId === tag.id
              ? "bg-yellow-50"
              : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "move";

            // Determine if this is a before/after drop or target drop
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const height = rect.height;

            if (y < height * 0.25) {
              setDragOver({ type: "tag-before", id: tag.id });
            } else if (y > height * 0.75) {
              setDragOver({ type: "tag-after", id: tag.id });
            } else {
              setDragOver({ type: "tag", id: tag.id });
            }
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const dragType = dragOver?.type;
            setDragOver(null);

            if (dragType === "tag-before") {
              handleReorderDrop(e, "tag", tag.id, "before");
            } else if (dragType === "tag-after") {
              handleReorderDrop(e, "tag", tag.id, "after");
            } else {
              handleDrop(e, "tag", tag.id);
            }
          }}
          draggable
          onDragStart={(e) => handleDragStart(e, "tag", tag.id)}
          onClick={() => onViewChange("tag", { tagId: tag.id })}
        >
          <div className="flex items-start space-x-2 flex-1 min-w-0">
            <Hash
              size={16}
              style={{ color: tag.color || "#f59e0b" }}
              className="flex-shrink-0 mt-0.5"
            />
            {isEditing ? (
              <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                <div
                  className="absolute top-0 left-0 right-0 bg-white border rounded-lg shadow-lg p-3 z-10"
                  style={{ minWidth: "300px" }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Hash size={14} style={{ color: editing.color }} />
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="mb-2">
                    <ColorPicker
                      value={editing.color}
                      onChange={(color) =>
                        setEditing((prev) => ({ ...prev, color }))
                      }
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between min-w-0">
                <span
                  className="text-sm break-words overflow-wrap-anywhere flex-1 min-w-0 leading-relaxed"
                  style={{
                    whiteSpace: "normal",
                    overflow: "visible",
                    textOverflow: "clip",
                  }}
                  title={`Tag ID: ${tag.id}, Name: ${tag.name}`}
                >
                  {tag.name || tag.id}
                </span>
                {(tag.noteCount || 0) > 0 && (
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                    ({tag.noteCount})
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0 ml-2 mt-0.5">
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

        {/* Elegant drop indicator below */}
        {isDragAfter && (
          <div className="h-0.5 bg-yellow-500 mx-2 mt-1 rounded-full shadow-sm" />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white flex items-center justify-center h-full w-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootNotebooks = notebooksByFolder.root || [];

  return (
    <div className="bg-white flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Noet</h1>
              <p className="text-xs text-gray-500">Sidebar</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onShowSettings}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
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

        {/* Folders Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <button
              onClick={() => startCreating("folder")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Create Folder"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {renderCreationForm("folder")}
            {folders.map((folder) => renderFolder(folder))}
          </div>
        </div>

        {/* Notebooks Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Notebooks</h3>
            <button
              onClick={() => startCreating("notebook")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Create Notebook"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {renderCreationForm("notebook")}
            {notebooks.map((notebook) => renderNotebook(notebook))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Tags</h3>
            <button
              onClick={() => startCreating("tag")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Create Tag"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="space-y-1">
            {renderCreationForm("tag")}
            {tags.map((tag) => renderTag(tag))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-gray-500">Connected</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ImprovedSidebar);
