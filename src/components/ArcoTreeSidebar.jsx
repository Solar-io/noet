import React, { useState, useEffect, useMemo } from "react";
import {
  Tree,
  Button,
  Input,
  Space,
  Tooltip,
  Modal,
} from "@arco-design/web-react";
import {
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  FolderOpen,
  Book,
  Hash,
  Clock,
  Archive,
  Bookmark,
} from "lucide-react";
import configService from "../configService.js";

const ArcoTreeSidebar = ({
  userId,
  notebooks = [],
  folders = [],
  tags = [],
  currentView,
  onViewChange,
  onRefreshData,
  onUpdateNote,
  onNotesUpdate,
  onNotebooksUpdate,
  onFoldersUpdate,
  onTagsUpdate,
  sidebarCollapsed,
  onToggleSidebar,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([
    "navigation",
    "notebooks",
    "folders",
    "tags",
  ]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);

  const backendUrl = configService.getBackendUrl();

  // Navigation items
  const navigationItems = [
    {
      key: "all",
      title: "All Notes",
      icon: <FileText size={16} />,
      view: "all",
    },
    {
      key: "recent",
      title: "Recent",
      icon: <Clock size={16} />,
      view: "recent",
    },
    {
      key: "starred",
      title: "Starred",
      icon: <Star size={16} />,
      view: "starred",
    },
    {
      key: "archived",
      title: "Archived",
      icon: <Archive size={16} />,
      view: "archived",
    },
    { key: "trash", title: "Trash", icon: <Trash2 size={16} />, view: "trash" },
  ];

  // Convert data to tree structure
  const treeData = useMemo(() => {
    const filterBySearch = (items, searchKey) => {
      if (!searchTerm) return items;
      return items.filter((item) =>
        item[searchKey]?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    };

    return [
      {
        key: "navigation",
        title: "Navigation",
        selectable: false,
        children: navigationItems.map((item) => ({
          key: item.key,
          title: (
            <span className="flex items-center space-x-2">
              {item.icon}
              <span>{item.title}</span>
            </span>
          ),
          isNavigation: true,
          viewType: item.view,
        })),
      },
      {
        key: "notebooks",
        title: (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center space-x-2">
              <Book size={16} />
              <span>Notebooks</span>
            </span>
            <Button
              type="text"
              size="mini"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateItem("notebook");
              }}
            />
          </div>
        ),
        selectable: false,
        children: filterBySearch(notebooks, "name").map((notebook) => ({
          key: `notebook-${notebook.id}`,
          title: (
            <span className="flex items-center space-x-2">
              <Book size={14} style={{ color: notebook.color || "#3b82f6" }} />
              <span>{notebook.name}</span>
              {notebook.noteCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({notebook.noteCount})
                </span>
              )}
            </span>
          ),
          dataType: "notebook",
          data: notebook,
        })),
      },
      {
        key: "folders",
        title: (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center space-x-2">
              <FolderOpen size={16} />
              <span>Folders</span>
            </span>
            <Button
              type="text"
              size="mini"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateItem("folder");
              }}
            />
          </div>
        ),
        selectable: false,
        children: filterBySearch(folders, "name").map((folder) => ({
          key: `folder-${folder.id}`,
          title: (
            <span className="flex items-center space-x-2">
              <FolderOpen
                size={14}
                style={{ color: folder.color || "#f59e0b" }}
              />
              <span>{folder.name}</span>
              {folder.noteCount > 0 && (
                <span className="text-xs text-gray-500">
                  ({folder.noteCount})
                </span>
              )}
            </span>
          ),
          dataType: "folder",
          data: folder,
        })),
      },
      {
        key: "tags",
        title: (
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center space-x-2">
              <Hash size={16} />
              <span>Tags</span>
            </span>
            <Button
              type="text"
              size="mini"
              icon={<Plus size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                handleCreateItem("tag");
              }}
            />
          </div>
        ),
        selectable: false,
        children: filterBySearch(tags, "name").map((tag) => ({
          key: `tag-${tag.id}`,
          title: (
            <span className="flex items-center space-x-2">
              <Hash size={14} style={{ color: tag.color || "#10b981" }} />
              <span>{tag.name}</span>
              {tag.noteCount > 0 && (
                <span className="text-xs text-gray-500">({tag.noteCount})</span>
              )}
            </span>
          ),
          dataType: "tag",
          data: tag,
        })),
      },
    ];
  }, [notebooks, folders, tags, searchTerm]);

  // Handle node selection
  const handleSelect = (selectedKeys, { node }) => {
    const { key, isNavigation, viewType, dataType, data } = node;

    if (isNavigation && viewType) {
      onViewChange(viewType);
    } else if (dataType && data) {
      if (dataType === "notebook") {
        onViewChange("notebook", { notebookId: data.id });
      } else if (dataType === "folder") {
        onViewChange("folder", { folderId: data.id });
      } else if (dataType === "tag") {
        onViewChange("tag", { tagId: data.id });
      }
    }

    setSelectedKeys(selectedKeys);
  };

  // Handle drag and drop
  const handleDragStart = ({ node }) => {
    setDraggedNode(node);
  };

  const handleDrop = async ({ dragNode, dropNode, dropPosition }) => {
    try {
      const dragData = dragNode.dataType ? dragNode.data : null;
      const dropData = dropNode.dataType ? dropNode.data : null;

      if (!dragData || !dropData) return;

      const dragType = dragNode.dataType;
      const dropType = dropNode.dataType;

      // Handle different drop scenarios
      if (dragType === "notebook" && dropType === "folder") {
        // Move notebook to folder
        await updateItem("notebook", dragData.id, { folderId: dropData.id });
      } else if (dragType === "notebook" && dropType === "notebook") {
        // Reorder notebooks
        await reorderItems("notebooks", dragData.id, dropData.id, dropPosition);
      } else if (dragType === "folder" && dropType === "folder") {
        // Reorder folders
        await reorderItems("folders", dragData.id, dropData.id, dropPosition);
      } else if (dragType === "tag" && dropType === "tag") {
        // Reorder tags
        await reorderItems("tags", dragData.id, dropData.id, dropPosition);
      }

      // Refresh data after successful operation
      await onRefreshData?.();
    } catch (error) {
      console.error("❌ Drop operation failed:", error);
    }
  };

  // API helper functions
  const updateItem = async (type, id, updates) => {
    const response = await fetch(`${backendUrl}/api/${userId}/${type}s/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update ${type}`);
    return response.json();
  };

  const reorderItems = async (type, sourceId, targetId, position) => {
    const response = await fetch(
      `${backendUrl}/api/${userId}/${type}/reorder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          targetId,
          position: position === 0 ? "before" : "after",
        }),
      }
    );
    if (!response.ok) throw new Error(`Failed to reorder ${type}`);
    return response.json();
  };

  const createItem = async (type, data) => {
    const response = await fetch(`${backendUrl}/api/${userId}/${type}s`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create ${type}`);
    return response.json();
  };

  const deleteItem = async (type, id) => {
    const response = await fetch(`${backendUrl}/api/${userId}/${type}s/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error(`Failed to delete ${type}`);
  };

  // Handle item creation
  const handleCreateItem = async (type) => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    try {
      await createItem(type, { name });
      await onRefreshData?.();

      // Trigger specific update callbacks
      if (type === "notebook") onNotebooksUpdate?.();
      else if (type === "folder") onFoldersUpdate?.();
      else if (type === "tag") onTagsUpdate?.();
    } catch (error) {
      console.error(`❌ Failed to create ${type}:`, error);
    }
  };

  // Handle item deletion with context menu
  const handleContextMenu = (node) => {
    if (!node.dataType || !node.data) return;

    Modal.confirm({
      title: `Delete ${node.dataType}?`,
      content: `Are you sure you want to delete "${node.data.name}"?`,
      onOk: async () => {
        try {
          await deleteItem(node.dataType, node.data.id);
          await onRefreshData?.();

          // Trigger specific update callbacks
          if (node.dataType === "notebook") onNotebooksUpdate?.();
          else if (node.dataType === "folder") onFoldersUpdate?.();
          else if (node.dataType === "tag") onTagsUpdate?.();
        } catch (error) {
          console.error(`❌ Failed to delete ${node.dataType}:`, error);
        }
      },
    });
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          type="text"
          icon={<Eye size={16} />}
          onClick={onToggleSidebar}
          className="mb-4"
        />
        <div className="flex flex-col space-y-2">
          {navigationItems.slice(0, 4).map((item) => (
            <Tooltip key={item.key} content={item.title} position="right">
              <Button
                type="text"
                icon={item.icon}
                onClick={() => onViewChange(item.view)}
                className={currentView?.type === item.view ? "bg-blue-100" : ""}
              />
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <Button
            type="text"
            icon={<EyeOff size={16} />}
            onClick={onToggleSidebar}
          />
        </div>

        {/* Search */}
        <Input
          prefix={<Search size={16} />}
          placeholder="Search..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="mb-2"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        <Tree
          treeData={treeData}
          expandedKeys={expandedKeys}
          onExpand={setExpandedKeys}
          selectedKeys={selectedKeys}
          onSelect={handleSelect}
          draggable
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          allowDrop={({ dragNode, dropNode }) => {
            // Allow dropping only on compatible types
            if (!dragNode.dataType || !dropNode.dataType) return false;

            const dragType = dragNode.dataType;
            const dropType = dropNode.dataType;

            // Define allowed drop combinations
            return (
              (dragType === "notebook" &&
                (dropType === "folder" || dropType === "notebook")) ||
              (dragType === "folder" && dropType === "folder") ||
              (dragType === "tag" && dropType === "tag")
            );
          }}
          onRightClick={({ node }) => handleContextMenu(node)}
          className="arco-tree-custom"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Space>
          <Button
            type="text"
            icon={<Settings size={16} />}
            onClick={() => onViewChange("settings")}
          >
            Settings
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ArcoTreeSidebar;
