import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  ChevronRight,
  ChevronDown,
  Folder,
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

const FolderManager = ({
  userId,
  currentFolder,
  onFolderChange,
  className = "",
}) => {
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [creatingParentId, setCreatingParentId] = useState(null);
  const [newFolder, setNewFolder] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });
  const [editingFolder, setEditingFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendUrl, setBackendUrl] = useState("");

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();
  }, []);

  useEffect(() => {
    if (backendUrl && userId) {
      loadFolders();
    }
  }, [userId, backendUrl]);

  const loadFolders = async () => {
    if (!backendUrl || !userId) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/${userId}/folders`);
      if (!response.ok) throw new Error("Failed to load folders");
      const foldersData = await response.json();
      setFolders(foldersData);
    } catch (err) {
      console.error("Error loading folders:", err);
      setError("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolder.name.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/${userId}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolder.name.trim(),
          description: newFolder.description.trim(),
          color: newFolder.color,
          parentId: creatingParentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create folder");

      const createdFolder = await response.json();
      setFolders([...folders, createdFolder]);
      setNewFolder({ name: "", description: "", color: "#3b82f6" });
      setIsCreating(false);
      setCreatingParentId(null);

      // Expand parent folder if creating a subfolder
      if (creatingParentId) {
        setExpandedFolders((prev) => new Set([...prev, creatingParentId]));
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      setError("Failed to create folder");
    }
  };

  const updateFolder = async (folderId, updates) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/folders/${folderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) throw new Error("Failed to update folder");

      const updatedFolder = await response.json();
      setFolders(folders.map((f) => (f.id === folderId ? updatedFolder : f)));
      setEditingFolder(null);
    } catch (err) {
      console.error("Error updating folder:", err);
      setError("Failed to update folder");
    }
  };

  const deleteFolder = async (folderId) => {
    const folder = folders.find((f) => f.id === folderId);
    const hasSubfolders = folders.some((f) => f.parentId === folderId);

    let confirmMessage = `Are you sure you want to delete "${folder?.name}"?`;
    if (hasSubfolders) {
      confirmMessage +=
        ' This will also delete all subfolders and move their notes to "No Folder".';
    }

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/folders/${folderId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete folder");

      // Remove folder and all its children
      const deleteRecursive = (id) => {
        const children = folders.filter((f) => f.parentId === id);
        children.forEach((child) => deleteRecursive(child.id));
        return folders.filter((f) => f.id !== id && f.parentId !== id);
      };

      setFolders(deleteRecursive(folderId));

      // If this was the current folder, reset to no folder
      if (currentFolder === folderId) {
        onFolderChange?.(null);
      }
    } catch (err) {
      console.error("Error deleting folder:", err);
      setError("Failed to delete folder");
    }
  };

  const toggleFolderExpansion = (folderId) => {
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

  const selectFolder = (folderId) => {
    onFolderChange?.(folderId);
  };

  const startCreatingSubfolder = (parentId) => {
    setCreatingParentId(parentId);
    setIsCreating(true);
    // Expand the parent folder
    if (parentId) {
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }
  };

  // Color picker component with presets
  const ColorPicker = ({ value, onChange, className = "" }) => (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
        />
        <span className="text-xs text-gray-500">Custom</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
              value === color ? "border-gray-800" : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );

  // Build folder hierarchy
  const buildFolderTree = (parentId = null, level = 0) => {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .map((folder) => {
        const hasChildren = folders.some((f) => f.parentId === folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = currentFolder === folder.id;

        return (
          <div key={folder.id} style={{ marginLeft: level * 16 }}>
            {/* Folder item */}
            <div
              className={`flex items-center justify-between p-2 rounded group transition-colors ${
                isSelected
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              <div
                className="flex items-center space-x-2 flex-1 cursor-pointer"
                onClick={() => selectFolder(folder.id)}
              >
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderExpansion(folder.id);
                    }}
                    className="p-0.5 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                )}
                {!hasChildren && <div className="w-6" />}
                <div
                  className="w-3 h-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: folder.color }}
                />
                <FolderOpen size={14} style={{ color: folder.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {folder.name}
                  </div>
                  {folder.description && (
                    <div className="text-xs text-gray-500 truncate">
                      {folder.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startCreatingSubfolder(folder.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title="Add subfolder"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title="Edit folder"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                  className="text-red-400 hover:text-red-600 p-1 rounded"
                  title="Delete folder"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Create subfolder form */}
            {isCreating && creatingParentId === folder.id && (
              <div
                className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3 mt-1"
                style={{ marginLeft: (level + 1) * 16 }}
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFolder.name}
                    onChange={(e) =>
                      setNewFolder({ ...newFolder, name: e.target.value })
                    }
                    placeholder="Subfolder name"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    autoFocus
                  />
                  <textarea
                    value={newFolder.description}
                    onChange={(e) =>
                      setNewFolder({
                        ...newFolder,
                        description: e.target.value,
                      })
                    }
                    placeholder="Description (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                    rows="2"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Color
                    </label>
                    <ColorPicker
                      value={newFolder.color}
                      onChange={(color) =>
                        setNewFolder({ ...newFolder, color })
                      }
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createFolder}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                  >
                    <Check size={12} className="mr-1" />
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setCreatingParentId(null);
                      setNewFolder({
                        name: "",
                        description: "",
                        color: "#3b82f6",
                      });
                    }}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Subfolders */}
            {isExpanded && buildFolderTree(folder.id, level + 1)}
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="space-y-1">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded ml-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          <FolderOpen size={14} className="mr-1" />
          Folders
        </label>
        <button
          onClick={() => {
            setCreatingParentId(null);
            setIsCreating(true);
          }}
          className="text-blue-600 hover:text-blue-700 p-1 rounded"
          title="Create new folder"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Create Root Folder */}
      {isCreating && creatingParentId === null && (
        <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              value={newFolder.name}
              onChange={(e) =>
                setNewFolder({ ...newFolder, name: e.target.value })
              }
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <textarea
              value={newFolder.description}
              onChange={(e) =>
                setNewFolder({ ...newFolder, description: e.target.value })
              }
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              rows="2"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Color
              </label>
              <ColorPicker
                value={newFolder.color}
                onChange={(color) => setNewFolder({ ...newFolder, color })}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={createFolder}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
            >
              <Check size={12} className="mr-1" />
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setCreatingParentId(null);
                setNewFolder({ name: "", description: "", color: "#3b82f6" });
              }}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No Folder Option */}
      <div
        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
          currentFolder === null
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "hover:bg-gray-50"
        }`}
        onClick={() => selectFolder(null)}
      >
        <div className="flex items-center space-x-2">
          <Folder size={16} className="text-gray-500" />
          <span className="text-sm font-medium">No Folder</span>
        </div>
      </div>

      {/* Folders Tree */}
      <div className="max-h-64 overflow-y-auto">
        {buildFolderTree()}

        {folders.length === 0 && !isCreating && (
          <div className="text-gray-500 text-sm text-center py-4">
            No folders yet. Create your first folder!
          </div>
        )}
      </div>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FolderOpen
                size={18}
                className="mr-2"
                style={{ color: editingFolder.color }}
              />
              Edit Folder
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingFolder.name}
                  onChange={(e) =>
                    setEditingFolder({ ...editingFolder, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingFolder.description || ""}
                  onChange={(e) =>
                    setEditingFolder({
                      ...editingFolder,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-none"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <ColorPicker
                  value={editingFolder.color}
                  onChange={(color) =>
                    setEditingFolder({ ...editingFolder, color })
                  }
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => updateFolder(editingFolder.id, editingFolder)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingFolder(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderManager;
