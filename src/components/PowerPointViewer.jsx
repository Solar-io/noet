import React, { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, X, AlertCircle } from "lucide-react";

const PowerPointViewer = ({ attachment, userId, noteId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fileUrl = `${window.location.origin}/api/${userId}/notes/${noteId}/attachments/${attachment.filename}`;
  const encodedUrl = encodeURIComponent(fileUrl);
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  // Check if we can use Office Online (only works with public URLs)
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost");

  useEffect(() => {
    // Always use local rendering for private documents
    // Office Online requires publicly accessible files which we don't want for user privacy
    console.log("Using local rendering for private PowerPoint documents");
    setError(
      "PowerPoint files are displayed as download links to preserve privacy. Your documents remain private and secure."
    );
    setLoading(false);
  }, []);

  const handleOfficeOnlineLoad = () => {
    setLoading(false);
  };

  const handleOfficeOnlineError = () => {
    setError(
      "Microsoft Office Online viewer failed to load. The file may not be publicly accessible or there may be a network issue."
    );
    setLoading(false);
  };

  const handleDownload = () => {
    window.open(fileUrl, "_blank");
  };

  const openInNewTab = () => {
    // For privacy, always download instead of using Office Online
    handleDownload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg flex flex-col w-full max-w-6xl h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="text-orange-600" size={20} />
            <div>
              <h3 className="font-medium text-gray-900">
                {attachment.originalName || attachment.filename}
              </h3>
              <p className="text-sm text-gray-500">
                PowerPoint Presentation (Private Document)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={openInNewTab}
              className="p-2 hover:bg-gray-100 rounded"
              title="Download file"
            >
              <ExternalLink size={16} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Loading PowerPoint presentation...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <AlertCircle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 block mx-auto"
                  >
                    Download PowerPoint File
                  </button>
                  <p className="text-xs text-gray-500">
                    Note: PowerPoint files are kept private and secure on your
                    server
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Office Online removed - private documents should stay private */}
        </div>
      </div>
    </div>
  );
};

export default PowerPointViewer;
