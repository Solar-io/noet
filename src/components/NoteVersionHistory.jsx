import React, { useState, useEffect } from "react";
import {
  History,
  Clock,
  User,
  FileText,
  Eye,
  RotateCcw,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Diff,
} from "lucide-react";
import configService from "../configService.js";

const NoteVersionHistory = ({ note, userId, onClose, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const backendUrl = configService.getBackendUrl();

  useEffect(() => {
    if (note?.id) {
      loadVersionHistory();
    }
  }, [note?.id]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/versions`
      );
      if (!response.ok) throw new Error("Failed to load version history");

      const versionsData = await response.json();
      setVersions(versionsData);

      if (versionsData.length > 0) {
        setSelectedVersion(versionsData[0]);
        setPreviewContent(versionsData[0].content);
      }
    } catch (err) {
      console.error("Error loading version history:", err);
      setError("Failed to load version history");
    } finally {
      setLoading(false);
    }
  };

  const handleVersionSelect = async (version) => {
    setSelectedVersion(version);

    try {
      // Load full content for this version
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/versions/${version.id}`
      );
      if (!response.ok) throw new Error("Failed to load version content");

      const versionData = await response.json();
      setPreviewContent(versionData.content);
    } catch (err) {
      console.error("Error loading version content:", err);
      setError("Failed to load version content");
    }
  };

  const handleRestore = async (version) => {
    if (
      !confirm(
        `Are you sure you want to restore to this version from ${formatDate(
          version.createdAt
        )}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/restore/${version.id}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to restore version");

      const restoredNote = await response.json();
      onRestore?.(restoredNote);
      onClose();
    } catch (err) {
      console.error("Error restoring version:", err);
      setError("Failed to restore version");
    }
  };

  const handleDeleteVersion = async (version) => {
    if (
      !confirm(
        `Are you sure you want to delete this version from ${formatDate(
          version.createdAt
        )}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/${userId}/notes/${note.id}/versions/${version.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete version");

      setVersions(versions.filter((v) => v.id !== version.id));

      if (selectedVersion?.id === version.id) {
        const remainingVersions = versions.filter((v) => v.id !== version.id);
        if (remainingVersions.length > 0) {
          handleVersionSelect(remainingVersions[0]);
        } else {
          setSelectedVersion(null);
          setPreviewContent("");
        }
      }
    } catch (err) {
      console.error("Error deleting version:", err);
      setError("Failed to delete version");
    }
  };

  const handleExport = (version) => {
    const blob = new Blob([version.content || ""], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "untitled"}_${formatDate(
      version.createdAt
    )}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeDifference = (date1, date2) => {
    const diff = Math.abs(new Date(date1) - new Date(date2));
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getVersionChanges = (version) => {
    const currentIndex = versions.findIndex((v) => v.id === version.id);
    const previousVersion = versions[currentIndex + 1];

    if (!previousVersion) return "Initial version";

    const currentLength = version.content?.length || 0;
    const previousLength = previousVersion.content?.length || 0;
    const diff = currentLength - previousLength;

    if (diff > 0) return `+${diff} characters`;
    if (diff < 0) return `${diff} characters`;
    return "No content changes";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading version history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <History size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Version History
              </h2>
              <p className="text-sm text-gray-600">{note.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex h-96">
          {/* Version List */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                {versions.length} Version{versions.length !== 1 ? "s" : ""}
              </h3>

              {versions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No version history available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      onClick={() => handleVersionSelect(version)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(version.createdAt)}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {getTimeDifference(version.createdAt, new Date())}
                          </p>
                          <p className="text-xs text-gray-600">
                            {getVersionChanges(version)}
                          </p>
                          {version.author && (
                            <div className="flex items-center space-x-1 mt-2">
                              <User size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {version.author}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExport(version);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Export version"
                          >
                            <Download size={12} />
                          </button>
                          {index !== 0 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(version);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Restore this version"
                              >
                                <RotateCcw size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVersion(version);
                                }}
                                className="p-1 hover:bg-red-100 text-red-600 rounded"
                                title="Delete version"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Version Preview
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowDiff(!showDiff)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          showDiff
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Diff size={14} className="mr-1 inline" />
                        {showDiff ? "Hide Diff" : "Show Diff"}
                      </button>
                      <button
                        onClick={() => handleRestore(selectedVersion)}
                        disabled={versions.indexOf(selectedVersion) === 0}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw size={14} className="mr-1 inline" />
                        Restore
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedVersion.createdAt)} •{" "}
                    {getVersionChanges(selectedVersion)}
                  </p>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Version history helps you track changes and restore previous
              versions of your notes.
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteVersionHistory;
