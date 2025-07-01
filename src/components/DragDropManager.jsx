import React, { useState, useCallback } from "react";
import { Move, ArrowRight, FolderOpen, Book, Hash } from "lucide-react";
import configService from "../configService.js";

const DragDropManager = ({
  children,
  userId,
  onUpdateComplete,
  dragData,
  onDragStart,
  onDragEnd,
  dropTargets = [], // [{ type: 'notebook', id: 'notebook-1', name: 'Work Notes' }]
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);

  const backendUrl = configService.getBackendUrl();

  const handleDragStart = useCallback(
    (e, data) => {
      setIsDragging(true);
      onDragStart?.(data);

      // Set drag data
      e.dataTransfer.setData("application/json", JSON.stringify(data));
      e.dataTransfer.effectAllowed = "move";

      // Create drag image
      const dragImage = document.createElement("div");
      dragImage.className =
        "bg-blue-100 border border-blue-300 rounded-lg p-2 text-sm font-medium text-blue-800";
      dragImage.textContent = data.title || data.name || "Item";
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);

      setTimeout(() => document.body.removeChild(dragImage), 0);
    },
    [onDragStart]
  );

  const handleDragEnd = useCallback(
    (e) => {
      setIsDragging(false);
      setDragOverTarget(null);
      setDropIndicator(null);
      onDragEnd?.();
    },
    [onDragEnd]
  );

  const handleDragOver = useCallback((e, target) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(target);

    // Calculate drop indicator position
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;

    if (y < height / 3) {
      setDropIndicator("above");
    } else if (y > (height * 2) / 3) {
      setDropIndicator("below");
    } else {
      setDropIndicator("inside");
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear if we're leaving the target completely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null);
      setDropIndicator(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e, target) => {
      e.preventDefault();
      setIsDragging(false);
      setDragOverTarget(null);
      setDropIndicator(null);

      try {
        const draggedData = JSON.parse(
          e.dataTransfer.getData("application/json")
        );

        if (!draggedData || !target) return;

        // Handle different drop scenarios
        await handleDropOperation(draggedData, target, dropIndicator);

        onUpdateComplete?.();
      } catch (error) {
        console.error("Drop operation failed:", error);
      }
    },
    [dropIndicator, onUpdateComplete]
  );

  const handleDropOperation = async (draggedItem, target, position) => {
    const { type: dragType, id: dragId } = draggedItem;
    const { type: targetType, id: targetId } = target;

    // Different drop scenarios
    if (dragType === "note") {
      if (targetType === "notebook") {
        await moveNoteToNotebook(dragId, targetId);
      } else if (targetType === "folder") {
        await moveNoteToFolder(dragId, targetId);
      } else if (targetType === "tag") {
        await addTagToNote(dragId, targetId);
      }
    } else if (dragType === "notebook") {
      if (targetType === "folder") {
        await moveNotebookToFolder(dragId, targetId);
      }
    } else if (dragType === "folder") {
      if (targetType === "folder" && position !== "inside") {
        await reorderFolder(dragId, targetId, position);
      }
    }
  };

  const moveNoteToNotebook = async (noteId, notebookId) => {
    const response = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebook: notebookId }),
      }
    );

    if (!response.ok) throw new Error("Failed to move note to notebook");
  };

  const moveNoteToFolder = async (noteId, folderId) => {
    const response = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderId }),
      }
    );

    if (!response.ok) throw new Error("Failed to move note to folder");
  };

  const addTagToNote = async (noteId, tagId) => {
    // First get the current note to get existing tags
    const noteResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteId}`
    );
    if (!noteResponse.ok) throw new Error("Failed to get note");

    const note = await noteResponse.json();
    const currentTags = note.tags || [];

    // Add tag if not already present
    if (!currentTags.includes(tagId)) {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: [...currentTags, tagId] }),
        }
      );

      if (!response.ok) throw new Error("Failed to add tag to note");
    }
  };

  const moveNotebookToFolder = async (notebookId, folderId) => {
    const response = await fetch(
      `${backendUrl}/api/${userId}/notebooks/${notebookId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentFolder: folderId }),
      }
    );

    if (!response.ok) throw new Error("Failed to move notebook to folder");
  };

  const reorderFolder = async (folderId, targetFolderId, position) => {
    const response = await fetch(
      `${backendUrl}/api/${userId}/folders/${folderId}/reorder`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: targetFolderId,
          position, // 'above' or 'below'
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to reorder folder");
  };

  const getTargetIcon = (type) => {
    switch (type) {
      case "notebook":
        return Book;
      case "folder":
        return FolderOpen;
      case "tag":
        return Hash;
      default:
        return Move;
    }
  };

  const getDropIndicatorClasses = (target, position) => {
    if (dragOverTarget?.id !== target.id) return "";

    const baseClasses = "transition-all duration-200";

    switch (position) {
      case "above":
        return `${baseClasses} border-t-2 border-blue-500`;
      case "below":
        return `${baseClasses} border-b-2 border-blue-500`;
      case "inside":
        return `${baseClasses} bg-blue-50 border border-blue-300 ring-2 ring-blue-200`;
      default:
        return baseClasses;
    }
  };

  // Create draggable wrapper
  const DraggableItem = ({
    data,
    children: itemChildren,
    className = "",
    ...props
  }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, data)}
      onDragEnd={handleDragEnd}
      className={`${className} ${
        isDragging && dragData?.id === data.id ? "opacity-50" : ""
      } cursor-move`}
      {...props}
    >
      {itemChildren}
    </div>
  );

  // Create drop target wrapper
  const DropTarget = ({
    target,
    children: targetChildren,
    className = "",
    ...props
  }) => {
    const Icon = getTargetIcon(target.type);
    const isActive = dragOverTarget?.id === target.id;

    return (
      <div
        onDragOver={(e) => handleDragOver(e, target)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, target)}
        className={`${className} ${getDropIndicatorClasses(
          target,
          dropIndicator
        )} relative`}
        {...props}
      >
        {targetChildren}

        {/* Drop indicator overlay */}
        {isActive && dropIndicator === "inside" && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg border-2 border-dashed border-blue-400 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg p-2 shadow-lg flex items-center space-x-2">
              <Icon size={16} className="text-blue-600" />
              <ArrowRight size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Drop here
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Global drop indicator for above/below positions
  const DropIndicator = ({ target, position }) => {
    if (dragOverTarget?.id !== target.id || dropIndicator !== position)
      return null;

    return (
      <div
        className={`h-0.5 bg-blue-500 relative ${
          position === "above" ? "-mt-0.5" : "-mb-0.5"
        }`}
      >
        <div className="absolute left-0 top-0 w-2 h-2 bg-blue-500 rounded-full transform -translate-y-1/2"></div>
      </div>
    );
  };

  return (
    <div className={`${isDragging ? "select-none" : ""}`}>
      {React.cloneElement(children, {
        DraggableItem,
        DropTarget,
        DropIndicator,
        isDragging,
        dragOverTarget,
        dropIndicator,
      })}
    </div>
  );
};

export default DragDropManager;
