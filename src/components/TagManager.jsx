import React, { useState, useEffect } from "react";
import { Hash, Plus, X, Tag, Edit2, Trash2, Check } from "lucide-react";
import configService from "../configService.js";

const TagManager = ({
  userId,
  noteId,
  noteTags = [],
  onTagsChange,
  availableTags = [], // Receive tags as props instead of loading them
  onTagsUpdate, // Callback to refresh tags in parent component
  className = "",
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [editingTag, setEditingTag] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const createTag = async () => {
    if (!newTagName.trim() || !backendUrl) return;

    try {
      const response = await fetch(`${backendUrl}/api/${userId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName.trim(),
          color: newTagColor,
          description: "",
        }),
      });

      if (!response.ok) throw new Error("Failed to create tag");

      const newTag = await response.json();
      setNewTagName("");
      setNewTagColor("#3b82f6");
      setIsCreating(false);
      
      // Refresh tags in parent component
      if (onTagsUpdate) {
        onTagsUpdate();
      }
    } catch (err) {
      console.error("Error creating tag:", err);
      setError("Failed to create tag");
    }
  };

  const updateTag = async (tagId, updates) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/tags/${tagId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) throw new Error("Failed to update tag");

      const updatedTag = await response.json();
      setEditingTag(null);
      
      // Refresh tags in parent component
      if (onTagsUpdate) {
        onTagsUpdate();
      }
    } catch (err) {
      console.error("Error updating tag:", err);
      setError("Failed to update tag");
    }
  };

  const deleteTag = async (tagId) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/tags/${tagId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete tag");

      // Remove tag from current note if it's assigned
      if (noteTags.includes(tagId)) {
        const updatedTags = noteTags.filter((t) => t !== tagId);
        onTagsChange?.(updatedTags);
      }
      
      // Refresh tags in parent component
      if (onTagsUpdate) {
        onTagsUpdate();
      }
    } catch (err) {
      console.error("Error deleting tag:", err);
      setError("Failed to delete tag");
    }
  };

  const toggleTagAssignment = (tagId) => {
    const isAssigned = noteTags.includes(tagId);
    const updatedTags = isAssigned
      ? noteTags.filter((t) => t !== tagId)
      : [...noteTags, tagId];

    onTagsChange?.(updatedTags);
  };

  const getTagById = (tagId) => {
    // Filter out UUID tags
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (UUID_REGEX.test(tagId)) {
      return null;
    }
    return availableTags.find((tag) => tag.id === tagId);
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-2 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
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

      {/* Assigned Tags Display */}
      {noteTags.filter(tagId => {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return !UUID_REGEX.test(tagId);
      }).length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Hash size={14} className="mr-1" />
            Tags
          </label>
          <div className="flex flex-wrap gap-1">
            {noteTags.map((tagId) => {
              const tag = getTagById(tagId);
              if (!tag) return null;

              return (
                <span
                  key={tagId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white group hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                  <button
                    onClick={() => toggleTagAssignment(tagId)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <Tag size={14} className="mr-1" />
            Available Tags
          </label>
          <button
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-700 p-1 rounded"
            title="Create new tag"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Create New Tag */}
        {isCreating && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createTag}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
              >
                <Check size={12} className="mr-1" />
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTagName("");
                  setNewTagColor("#3b82f6");
                }}
                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {availableTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 group"
            >
              <div className="flex items-center space-x-2 flex-1">
                <button
                  onClick={() => toggleTagAssignment(tag.id)}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all ${
                    noteTags.includes(tag.id)
                      ? "text-white"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={
                    noteTags.includes(tag.id)
                      ? { backgroundColor: tag.color }
                      : {}
                  }
                >
                  {tag.name}
                </button>
              </div>

              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingTag(tag)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  title="Edit tag"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded"
                  title="Delete tag"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {availableTags.length === 0 && !isCreating && (
            <div className="text-gray-500 text-sm text-center py-4">
              No tags yet. Create your first tag!
            </div>
          )}
        </div>
      </div>

      {/* Edit Tag Modal */}
      {editingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold mb-4">Edit Tag</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingTag.name}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={editingTag.color}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, color: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingTag.description || ""}
                  onChange={(e) =>
                    setEditingTag({
                      ...editingTag,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded resize-none"
                  rows="2"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => updateTag(editingTag.id, editingTag)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTag(null)}
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

export default TagManager;
