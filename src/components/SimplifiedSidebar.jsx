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
} from "lucide-react";
import configService from "../configService";

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

  return (
    <div className="flex-shrink-0 h-full flex flex-col w-64 bg-gray-50 border-r border-gray-200">
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
        </div>

        {/* Folders Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Folders</h3>
            <button
              onClick={() => createFolder?.({ name: "New Folder" })}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Folder"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={foldersRef} className="space-y-1">
            {propFolders.map((folder) => (
              <div
                key={folder.id}
                className="folder-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move"
                onClick={() => onViewChange("folder", { folderId: folder.id })}
              >
                <div className="flex items-center space-x-2">
                  <Folder
                    size={16}
                    style={{ color: folder.color || "#3b82f6" }}
                  />
                  <span className="text-sm">{folder.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {folder.count || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notebooks Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Notebooks</h3>
            <button
              onClick={() => createNotebook?.({ name: "New Notebook" })}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Notebook"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={notebooksRef} className="space-y-1">
            {propNotebooks.map((notebook) => (
              <div
                key={notebook.id}
                className="notebook-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move"
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
                <span className="text-xs text-gray-500">
                  {notebook.count || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Tags</h3>
            <button
              onClick={() => createTag?.({ name: "New Tag" })}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Create Tag"
            >
              <Plus size={12} />
            </button>
          </div>
          <div ref={tagsRef} className="space-y-1">
            {propTags.map((tag) => (
              <div
                key={tag.id}
                className="tag-item flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-move"
                onClick={() => onViewChange("tag", { tagId: tag.id })}
              >
                <div className="flex items-center space-x-2">
                  <Hash size={16} style={{ color: tag.color || "#f59e0b" }} />
                  <span className="text-sm">{tag.name}</span>
                </div>
                <span className="text-xs text-gray-500">{tag.count || 0}</span>
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
