import React, { useEffect, useRef, useState } from "react";
import Sortable from "sortablejs";
import {
  Folder,
  Book,
  Hash,
  Home,
  Search,
  Settings,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  X,
  Check,
  Plus,
  Clock,
  Star,
  Archive,
} from "lucide-react";
import configService from "../configService";

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

const SimplifiedSidebar = ({
  user,
  folders: propFolders = [],
  notebooks: propNotebooks = [],
  tags: propTags = [],
  noteCount = 0,
  currentView,
  onViewChange,
  onFoldersUpdate,
  onNotebooksUpdate,
  onTagsUpdate,
  updateNote,
  updateFolder,
  updateNotebook,
  updateTag,
  deleteFolder,
  deleteNotebook,
  deleteTag,
  createFolder,
  createNotebook,
  createTag,
}) => {
  const [backendUrl, setBackendUrl] = useState("");
  const [loading, setLoading] = useState(true);

  // Creation and editing state
  const [creating, setCreating] = useState({
    type: "",
    name: "",
    color: "#3b82f6",
    parentId: null,
  });
  const [editing, setEditing] = useState({
    type: null,
    id: null,
    name: "",
    color: "",
  });

  // Refs for Sortable instances
  const foldersRef = useRef(null);
  const notebooksRef = useRef(null);
  const tagsRef = useRef(null);

  // Sortable instances
  const foldersSortable = useRef(null);
  const notebooksSortable = useRef(null);
  const tagsSortable = useRef(null);

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

  // Initialize Sortable for folders
  useEffect(() => {
    if (foldersRef.current && !foldersSortable.current) {
      foldersSortable.current = Sortable.create(foldersRef.current, {
        group: "folders",
        animation: 150,
        ghostClass: "opacity-50",
        dragClass: "shadow-lg",
        handle: ".folder-item",
        onEnd: async (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === newIndex) return;

          const sourceId = propFolders[oldIndex]?.id;
          const targetId = propFolders[newIndex]?.id;

          if (sourceId && targetId) {
            console.log("📁 Reordering folders:", sourceId, "->", targetId);
            await reorderFolders(
              sourceId,
              targetId,
              newIndex > oldIndex ? "after" : "before"
            );
          }
        },
      });
    }

    return () => {
      if (foldersSortable.current) {
        foldersSortable.current.destroy();
        foldersSortable.current = null;
      }
    };
  }, [propFolders]);

  // Initialize Sortable for notebooks
  useEffect(() => {
    if (notebooksRef.current && !notebooksSortable.current) {
      notebooksSortable.current = Sortable.create(notebooksRef.current, {
        group: "notebooks",
        animation: 150,
        ghostClass: "opacity-50",
        dragClass: "shadow-lg",
        handle: ".notebook-item",
        onEnd: async (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === newIndex) return;

          const sourceId = propNotebooks[oldIndex]?.id;
          const targetId = propNotebooks[newIndex]?.id;

          if (sourceId && targetId) {
            console.log("📚 Reordering notebooks:", sourceId, "->", targetId);
            await reorderNotebooks(
              sourceId,
              targetId,
              newIndex > oldIndex ? "after" : "before"
            );
          }
        },
      });
    }

    return () => {
      if (notebooksSortable.current) {
        notebooksSortable.current.destroy();
        notebooksSortable.current = null;
      }
    };
  }, [propNotebooks]);

  // Initialize Sortable for tags
  useEffect(() => {
    if (tagsRef.current && !tagsSortable.current) {
      tagsSortable.current = Sortable.create(tagsRef.current, {
        group: "tags",
        animation: 150,
        ghostClass: "opacity-50",
        dragClass: "shadow-lg",
        handle: ".tag-item",
        onEnd: async (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === newIndex) return;

          const sourceId = propTags[oldIndex]?.id;
          const targetId = propTags[newIndex]?.id;

          if (sourceId && targetId) {
            console.log("🏷️ Reordering tags:", sourceId, "->", targetId);
            await reorderTags(
              sourceId,
              targetId,
              newIndex > oldIndex ? "after" : "before"
            );
          }
        },
      });
    }

    return () => {
      if (tagsSortable.current) {
        tagsSortable.current.destroy();
        tagsSortable.current = null;
      }
    };
  }, [propTags]);

  // Color picker component
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

  // Creation and editing functions
  const startCreating = (type, parentId = null) => {
    const defaultColor =
      type === "folder"
        ? "#3b82f6"
        : type === "notebook"
        ? "#10b981"
        : "#f59e0b";
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
      if (creating.type === "folder") {
        await createFolder({
          name: creating.name,
          color: creating.color,
          parentId: creating.parentId,
        });
      } else if (creating.type === "notebook") {
        await createNotebook({
          name: creating.name,
          color: creating.color,
          folderId: creating.parentId,
        });
      } else if (creating.type === "tag") {
        await createTag({ name: creating.name, color: creating.color });
      }
      cancelCreating();
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  const startEditing = (type, id, currentName, currentColor) => {
    setEditing({
      type,
      id,
      name: currentName,
      color: currentColor || "#3b82f6",
    });
  };

  const cancelEdit = () => {
    setEditing({ type: null, id: null, name: "", color: "" });
  };

  const saveEdit = async () => {
    if (!editing.name.trim()) return;

    try {
      const data = { name: editing.name.trim(), color: editing.color };
      if (editing.type === "folder") {
        await updateFolder(editing.id, data);
      } else if (editing.type === "notebook") {
        await updateNotebook(editing.id, data);
      } else if (editing.type === "tag") {
        await updateTag(editing.id, data);
      }
      cancelEdit();
    } catch (error) {
      console.error("Error saving edit:", error);
    }
  };

  // Reorder functions
  const reorderFolders = async (sourceId, targetId, position) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/folders/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId,
            targetId,
            position,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Folder reordering completed successfully");
        onFoldersUpdate?.();
      } else {
        console.error("❌ Failed to reorder folders:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering folders:", error);
    }
  };

  const reorderNotebooks = async (sourceId, targetId, position) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notebooks/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId,
            targetId,
            position,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Notebook reordering completed successfully");
        onNotebooksUpdate?.();
      } else {
        console.error("❌ Failed to reorder notebooks:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering notebooks:", error);
    }
  };

  const reorderTags = async (sourceId, targetId, position) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/tags/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId,
            targetId,
            position,
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Tag reordering completed successfully");
        onTagsUpdate?.();
      } else {
        console.error("❌ Failed to reorder tags:", await response.text());
      }
    } catch (error) {
      console.error("❌ Error reordering tags:", error);
    }
  };

  // Render creation form
  const renderCreationForm = (type) => {
    if (creating.type !== type) return null;

    const getIcon = () => {
      switch (type) {
        case "folder":
          return <Folder size={14} style={{ color: creating.color }} />;
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

  return (
    <div className="flex-shrink-0 h-full flex flex-col w-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Noet</h2>
          <button className="p-1 hover:bg-gray-200 rounded">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* All Notes */}
        <div className="p-2">
          <button
            onClick={() => onViewChange("all")}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 ${
              currentView === "all" ? "bg-gray-200" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <Home size={16} />
              <span className="text-sm font-medium">All Notes</span>
            </div>
            <span className="text-xs text-gray-500">{noteCount}</span>
          </button>

          {/* Recent Notes */}
          <button
            onClick={() => onViewChange("recent")}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 ${
              currentView === "recent" ? "bg-gray-200" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span className="text-sm font-medium">Recent</span>
            </div>
          </button>

          {/* Starred Notes */}
          <button
            onClick={() => onViewChange("starred")}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 ${
              currentView === "starred" ? "bg-gray-200" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <Star size={16} />
              <span className="text-sm font-medium">Starred</span>
            </div>
          </button>

          {/* Archived Notes */}
          <button
            onClick={() => onViewChange("archived")}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 ${
              currentView === "archived" ? "bg-gray-200" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <Archive size={16} />
              <span className="text-sm font-medium">Archived</span>
            </div>
          </button>

          {/* Trash */}
          <button
            onClick={() => onViewChange("trash")}
            className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 ${
              currentView === "trash" ? "bg-gray-200" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <Trash2 size={16} />
              <span className="text-sm font-medium">Trash</span>
            </div>
          </button>
        </div>

        {/* Folders Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <button
              onClick={() => startCreating("folder")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Folder"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={foldersRef} className="space-y-1">
            {renderCreationForm("folder")}
            {propFolders.map((folder) => (
              <div key={folder.id}>
                {editing.type === "folder" && editing.id === folder.id ? (
                  <div className="bg-white border rounded-lg shadow-lg p-3 mb-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Folder size={14} style={{ color: editing.color }} />
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
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="folder-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move group"
                    onClick={() =>
                      onViewChange("folder", { folderId: folder.id })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <Folder
                        size={16}
                        style={{ color: folder.color || "#3b82f6" }}
                      />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 mr-2">
                        {folder.count || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(
                            "folder",
                            folder.id,
                            folder.name,
                            folder.color
                          );
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notebooks Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Notebooks</h3>
            <button
              onClick={() => startCreating("notebook")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Notebook"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={notebooksRef} className="space-y-1">
            {renderCreationForm("notebook")}
            {propNotebooks.map((notebook) => (
              <div key={notebook.id}>
                {editing.type === "notebook" && editing.id === notebook.id ? (
                  <div className="bg-white border rounded-lg shadow-lg p-3 mb-2">
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
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="notebook-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move group"
                    onClick={() =>
                      onViewChange("notebook", { notebookId: notebook.id })
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <Book
                        size={16}
                        style={{ color: notebook.color || "#10b981" }}
                      />
                      <span className="text-sm">{notebook.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 mr-2">
                        {notebook.count || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(
                            "notebook",
                            notebook.id,
                            notebook.name,
                            notebook.color
                          );
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotebook(notebook.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Tags</h3>
            <button
              onClick={() => startCreating("tag")}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Tag"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={tagsRef} className="space-y-1">
            {renderCreationForm("tag")}
            {propTags.map((tag) => (
              <div key={tag.id}>
                {editing.type === "tag" && editing.id === tag.id ? (
                  <div className="bg-white border rounded-lg shadow-lg p-3 mb-2">
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
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="tag-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move group"
                    onClick={() => onViewChange("tag", { tagId: tag.id })}
                  >
                    <div className="flex items-center space-x-2">
                      <Hash
                        size={16}
                        style={{ color: tag.color || "#f59e0b" }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 mr-2">
                        {tag.count || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing("tag", tag.id, tag.name, tag.color);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTag(tag.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
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

export default SimplifiedSidebar;
