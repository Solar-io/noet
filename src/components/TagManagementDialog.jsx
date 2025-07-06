import React, { useState, useEffect } from "react";
import {
  X,
  Tag,
  Plus,
  Minus,
  Check,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

const TagManagementDialog = ({
  isOpen,
  onClose,
  selectedNotes = [],
  availableTags = [],
  onAddTags,
  onRemoveTags,
  onCreateTag,
  isProcessing = false,
  processingStatus = null,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagsToAdd, setSelectedTagsToAdd] = useState(new Set());
  const [selectedTagsToRemove, setSelectedTagsToRemove] = useState(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [showCreateTag, setShowCreateTag] = useState(false);

  // Calculate tag statistics for selected notes
  const tagStats = React.useMemo(() => {
    const stats = {};

    selectedNotes.forEach((note) => {
      const noteTags = note.tags || [];
      noteTags.forEach((tagId) => {
        if (!stats[tagId]) {
          stats[tagId] = 0;
        }
        stats[tagId]++;
      });
    });

    return stats;
  }, [selectedNotes]);

  // Filter available tags based on search
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTagsToAdd(new Set());
      setSelectedTagsToRemove(new Set());
      setSearchQuery("");
      setNewTagName("");
      setShowCreateTag(false);
    }
  }, [isOpen]);

  const handleTagSelection = (tagId, action) => {
    if (action === "add") {
      setSelectedTagsToAdd((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) {
          newSet.delete(tagId);
        } else {
          newSet.add(tagId);
        }
        return newSet;
      });
    } else if (action === "remove") {
      setSelectedTagsToRemove((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(tagId)) {
          newSet.delete(tagId);
        } else {
          newSet.add(tagId);
        }
        return newSet;
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const newTag = await onCreateTag(newTagName.trim());
      if (newTag) {
        setSelectedTagsToAdd((prev) => new Set([...prev, newTag.id]));
        setNewTagName("");
        setShowCreateTag(false);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleApplyChanges = async () => {
    const tagsToAdd = Array.from(selectedTagsToAdd);
    const tagsToRemove = Array.from(selectedTagsToRemove);

    try {
      if (tagsToAdd.length > 0) {
        await onAddTags(
          selectedNotes.map((n) => n.id),
          tagsToAdd
        );
      }
      if (tagsToRemove.length > 0) {
        await onRemoveTags(
          selectedNotes.map((n) => n.id),
          tagsToRemove
        );
      }
      onClose();
    } catch (error) {
      console.error("Error applying tag changes:", error);
    }
  };

  const getTagStatus = (tagId) => {
    const count = tagStats[tagId] || 0;
    const total = selectedNotes.length;

    if (count === 0) return "none";
    if (count === total) return "all";
    return "some";
  };

  const getTagStatusText = (tagId) => {
    const count = tagStats[tagId] || 0;
    const total = selectedNotes.length;

    if (count === 0) return "Add to all";
    if (count === total) return "Remove from all";
    return `On ${count} of ${total}`;
  };

  const hasChanges =
    selectedTagsToAdd.size > 0 || selectedTagsToRemove.size > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Tags</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedNotes.length} note{selectedNotes.length !== 1 ? "s" : ""}{" "}
              selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Create */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={() => setShowCreateTag(!showCreateTag)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              disabled={isProcessing}
            >
              <Plus size={16} />
              <span>New Tag</span>
            </button>
          </div>

          {/* Create Tag Form */}
          {showCreateTag && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {isProcessing && processingStatus && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center space-x-3">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">
                Processing note {processingStatus.current} of{" "}
                {processingStatus.total}
              </span>
            </div>
          </div>
        )}

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No tags found</p>
              <p className="text-sm">
                {searchQuery
                  ? "No tags match your search"
                  : "Create your first tag to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTags.map((tag) => {
                const status = getTagStatus(tag.id);
                const statusText = getTagStatusText(tag.id);
                const isSelectedToAdd = selectedTagsToAdd.has(tag.id);
                const isSelectedToRemove = selectedTagsToRemove.has(tag.id);

                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-gray-900">
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {statusText}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {status !== "all" && (
                        <button
                          onClick={() => handleTagSelection(tag.id, "add")}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                            isSelectedToAdd
                              ? "bg-green-600 text-white"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                          disabled={isProcessing}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      )}

                      {status !== "none" && (
                        <button
                          onClick={() => handleTagSelection(tag.id, "remove")}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                            isSelectedToRemove
                              ? "bg-red-600 text-white"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                          disabled={isProcessing}
                        >
                          <Minus size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTagsToAdd.size > 0 && (
                <span className="text-green-600">
                  +{selectedTagsToAdd.size} to add
                </span>
              )}
              {selectedTagsToAdd.size > 0 && selectedTagsToRemove.size > 0 && (
                <span className="mx-2">•</span>
              )}
              {selectedTagsToRemove.size > 0 && (
                <span className="text-red-600">
                  -{selectedTagsToRemove.size} to remove
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={!hasChanges || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                <span>Apply Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagementDialog;
