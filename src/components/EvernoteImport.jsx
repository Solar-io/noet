import React, { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  FolderOpen,
  Tag,
  Book,
  RefreshCw,
} from "lucide-react";
import configService from "../configService.js";

const EvernoteImport = ({ userId, onClose, onImportComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("idle"); // 'idle', 'processing', 'success', 'error'
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState("");
  const [backendUrl, setBackendUrl] = useState(null);
  const [options, setOptions] = useState({
    preserveNotebooks: true,
    preserveTags: true,
    preserveCreatedDates: true,
    preserveAttachments: true,
    conflictResolution: "rename", // 'rename', 'overwrite', 'skip'
  });

  // Load backend URL on component mount
  useEffect(() => {
    const loadBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        console.log("Loaded backend URL:", url);
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to load backend URL:", error);
        setError(
          "Failed to connect to server. Please ensure the backend is running."
        );
      }
    };
    loadBackendUrl();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith(".enex") || file.type === "application/xml") {
        setSelectedFile(file);
        setError("");
      } else {
        setError("Please select a valid Evernote export file (.enex)");
        setSelectedFile(null);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (
      file &&
      (file.name.endsWith(".enex") || file.type === "application/xml")
    ) {
      setSelectedFile(file);
      setError("");
    } else {
      setError("Please drop a valid Evernote export file (.enex)");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const startImport = async () => {
    if (!selectedFile) return;

    if (!backendUrl) {
      setError("Backend URL not loaded. Please try again.");
      return;
    }

    setImporting(true);
    setImportStatus("processing");
    setError("");

    const formData = new FormData();
    formData.append("evernoteFile", selectedFile);
    formData.append("options", JSON.stringify(options));

    try {
      const importUrl = `${backendUrl}/api/${userId}/import/evernote`;
      console.log("Import URL:", importUrl);
      console.log("Backend URL:", backendUrl);
      console.log("User ID:", userId);
      console.log("File:", selectedFile);

      const response = await fetch(importUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Import response status:", response.status);
      console.log("Import response headers:", response.headers);

      // First check if the response is ok
      if (!response.ok) {
        // Try to get error text first
        const errorText = await response.text();
        console.error("Import error response text:", errorText);

        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // If not JSON, use the text as the error message
          errorData = {
            message:
              errorText || `Import failed with status ${response.status}`,
          };
        }

        throw new Error(errorData.message || "Import failed");
      }

      // For success responses, also check content type
      const contentType = response.headers.get("content-type");
      console.log("Response content type:", contentType);

      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        console.error("Non-JSON response:", responseText);
        throw new Error("Server returned non-JSON response");
      }

      const results = await response.json();
      console.log("Import results:", results);

      setImportResults(results);
      setImportStatus("success");

      // Notify parent component
      onImportComplete?.(results);
    } catch (err) {
      console.error("Import error:", err);
      setError(err.message || "Failed to import Evernote data");
      setImportStatus("error");
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportStatus("idle");
    setImportResults(null);
    setError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Import from Evernote
              </h2>
              <p className="text-sm text-gray-600">
                Import your notes from Evernote export files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {importStatus === "idle" && (
            <>
              {/* File Upload */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  1. Select Evernote Export File
                </h3>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() =>
                    document.getElementById("evernote-file").click()
                  }
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <CheckCircle
                        size={48}
                        className="mx-auto text-green-500"
                      />
                      <p className="text-lg font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(selectedFile.size)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={48} className="mx-auto text-gray-400" />
                      <p className="text-lg font-medium text-gray-900">
                        Drop your .enex file here
                      </p>
                      <p className="text-sm text-gray-600">
                        or click to browse files
                      </p>
                    </div>
                  )}
                </div>

                <input
                  id="evernote-file"
                  type="file"
                  accept=".enex,application/xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                    <AlertTriangle
                      size={16}
                      className="text-red-600 mt-0.5 flex-shrink-0"
                    />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  2. Import Options
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.preserveNotebooks}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          preserveNotebooks: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Book size={16} className="text-blue-600" />
                      <span className="text-sm font-medium">
                        Preserve Notebooks
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.preserveTags}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          preserveTags: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Tag size={16} className="text-green-600" />
                      <span className="text-sm font-medium">Preserve Tags</span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.preserveCreatedDates}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          preserveCreatedDates: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-purple-600" />
                      <span className="text-sm font-medium">
                        Preserve Created Dates
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.preserveAttachments}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          preserveAttachments: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <FolderOpen size={16} className="text-orange-600" />
                      <span className="text-sm font-medium">
                        Import Attachments
                      </span>
                    </div>
                  </label>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conflict Resolution
                  </label>
                  <select
                    value={options.conflictResolution}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        conflictResolution: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="rename">Rename conflicting items</option>
                    <option value="overwrite">Overwrite existing items</option>
                    <option value="skip">Skip conflicting items</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    How to handle items that already exist with the same name
                  </p>
                </div>
              </div>

              {/* Start Import */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Make sure you have exported your notes from Evernote as a
                  .enex file
                </div>
                <button
                  onClick={startImport}
                  disabled={!selectedFile || importing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Upload size={16} />
                  <span>Start Import</span>
                </button>
              </div>
            </>
          )}

          {importStatus === "processing" && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Importing your notes...
              </h3>
              <p className="text-gray-600">
                This may take a few minutes depending on the number of notes.
              </p>
            </div>
          )}

          {importStatus === "success" && importResults && (
            <div className="text-center py-8">
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Import Completed Successfully!
              </h3>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-800">Notes Imported</p>
                    <p className="text-green-600 text-2xl font-bold">
                      {importResults.notesImported || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      Notebooks Created
                    </p>
                    <p className="text-green-600 text-2xl font-bold">
                      {importResults.notebooksCreated || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Tags Created</p>
                    <p className="text-green-600 text-2xl font-bold">
                      {importResults.tagsCreated || 0}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Attachments</p>
                    <p className="text-green-600 text-2xl font-bold">
                      {importResults.attachmentsImported || 0}
                    </p>
                  </div>
                </div>
              </div>

              {importResults.warnings && importResults.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                  <ul className="text-sm text-yellow-700 text-left space-y-1">
                    {importResults.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Import Another File</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {importStatus === "error" && (
            <div className="text-center py-8">
              <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Import Failed
              </h3>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={resetImport}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {importStatus === "idle" && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              How to export from Evernote:
            </h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Open Evernote desktop application</li>
              <li>Select the notebooks or notes you want to export</li>
              <li>Go to File → Export Notes</li>
              <li>Choose "Evernote XML Format (.enex)" and save the file</li>
              <li>Upload the .enex file here</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvernoteImport;
