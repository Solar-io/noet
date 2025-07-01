import React, { useState, useEffect } from "react";
import {
  Book,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  FolderOpen,
  Star,
} from "lucide-react";
import configService from "../configService.js";

const NotebookManager = ({
  userId,
  currentNotebook,
  onNotebookChange,
  className = "",
}) => {
  const [notebooks, setNotebooks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });
  const [editingNotebook, setEditingNotebook] = useState(null);
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
        setBackendUrl("http://localhost:3003"); // fallback
      }
    };
    initBackendUrl();
  }, []);

  useEffect(() => {
    if (backendUrl && userId) {
      loadNotebooks();
    }
  }, [userId, backendUrl]);

  const loadNotebooks = async () => {
    if (!backendUrl || !userId) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/${userId}/notebooks`);
      if (!response.ok) throw new Error("Failed to load notebooks");
      const notebooksData = await response.json();
      setNotebooks(notebooksData);
    } catch (err) {
      console.error("Error loading notebooks:", err);
      setError("Failed to load notebooks");
    } finally {
      setLoading(false);
    }
  };

  const createNotebook = async () => {
    if (!newNotebook.name.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/${userId}/notebooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newNotebook.name.trim(),
          description: newNotebook.description.trim(),
          color: newNotebook.color,
        }),
      });

      if (!response.ok) throw new Error("Failed to create notebook");

      const createdNotebook = await response.json();
      setNotebooks([...notebooks, createdNotebook]);
      setNewNotebook({ name: "", description: "", color: "#3b82f6" });
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating notebook:", err);
      setError("Failed to create notebook");
    }
  };

  const updateNotebook = async (notebookId, updates) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notebooks/${notebookId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) throw new Error("Failed to update notebook");

      const updatedNotebook = await response.json();
      setNotebooks(
        notebooks.map((nb) => (nb.id === notebookId ? updatedNotebook : nb))
      );
      setEditingNotebook(null);
    } catch (err) {
      console.error("Error updating notebook:", err);
      setError("Failed to update notebook");
    }
  };

  const deleteNotebook = async (notebookId) => {
    if (
      !confirm(
        'Are you sure you want to delete this notebook? All notes in this notebook will be moved to "No Notebook".'
      )
    )
      return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notebooks/${notebookId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete notebook");

      setNotebooks(notebooks.filter((nb) => nb.id !== notebookId));

      // If this was the current notebook, reset to no notebook
      if (currentNotebook === notebookId) {
        onNotebookChange?.(null);
      }
    } catch (err) {
      console.error("Error deleting notebook:", err);
      setError("Failed to delete notebook");
    }
  };

  const selectNotebook = (notebookId) => {
    onNotebookChange?.(notebookId);
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="space-y-1">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
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
          <Book size={14} className="mr-1" />
          Notebooks
        </label>
        <button
          onClick={() => setIsCreating(true)}
          className="text-blue-600 hover:text-blue-700 p-1 rounded"
          title="Create new notebook"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Create New Notebook */}
      {isCreating && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-3">
          <div className="space-y-2">
            <input
              type="text"
              value={newNotebook.name}
              onChange={(e) =>
                setNewNotebook({ ...newNotebook, name: e.target.value })
              }
              placeholder="Notebook name"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              autoFocus
            />
            <textarea
              value={newNotebook.description}
              onChange={(e) =>
                setNewNotebook({ ...newNotebook, description: e.target.value })
              }
              placeholder="Description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
              rows="2"
            />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Color:</label>
              <input
                type="color"
                value={newNotebook.color}
                onChange={(e) =>
                  setNewNotebook({ ...newNotebook, color: e.target.value })
                }
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={createNotebook}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
            >
              <Check size={12} className="mr-1" />
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNotebook({ name: "", description: "", color: "#3b82f6" });
              }}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No Notebook Option */}
      <div
        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
          currentNotebook === null
            ? "bg-blue-100 text-blue-800 border border-blue-200"
            : "hover:bg-gray-50"
        }`}
        onClick={() => selectNotebook(null)}
      >
        <div className="flex items-center space-x-2">
          <FolderOpen size={16} className="text-gray-500" />
          <span className="text-sm font-medium">No Notebook</span>
        </div>
        {currentNotebook === null && (
          <Star size={14} className="text-blue-600" />
        )}
      </div>

      {/* Notebooks List */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {notebooks.map((notebook) => (
          <div
            key={notebook.id}
            className={`flex items-center justify-between p-2 rounded group transition-colors ${
              currentNotebook === notebook.id
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "hover:bg-gray-50 cursor-pointer"
            }`}
          >
            <div
              className="flex items-center space-x-2 flex-1 cursor-pointer"
              onClick={() => selectNotebook(notebook.id)}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: notebook.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {notebook.name}
                </div>
                {notebook.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {notebook.description}
                  </div>
                )}
              </div>
              {currentNotebook === notebook.id && (
                <Star size={14} className="text-blue-600" />
              )}
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNotebook(notebook);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
                title="Edit notebook"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotebook(notebook.id);
                }}
                className="text-red-400 hover:text-red-600 p-1 rounded"
                title="Delete notebook"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}

        {notebooks.length === 0 && !isCreating && (
          <div className="text-gray-500 text-sm text-center py-4">
            No notebooks yet. Create your first notebook!
          </div>
        )}
      </div>

      {/* Edit Notebook Modal */}
      {editingNotebook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Edit Notebook</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingNotebook.name}
                  onChange={(e) =>
                    setEditingNotebook({
                      ...editingNotebook,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingNotebook.description || ""}
                  onChange={(e) =>
                    setEditingNotebook({
                      ...editingNotebook,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={editingNotebook.color}
                  onChange={(e) =>
                    setEditingNotebook({
                      ...editingNotebook,
                      color: e.target.value,
                    })
                  }
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() =>
                  updateNotebook(editingNotebook.id, editingNotebook)
                }
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotebook(null)}
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

export default NotebookManager;
