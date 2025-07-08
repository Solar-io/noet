import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const OfficeOnlineViewer = ({ attachment, userId, noteId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useOfficeOnline, setUseOfficeOnline] = useState(true);
  const [localContent, setLocalContent] = useState(null);
  const [currentSheet, setCurrentSheet] = useState(0);

  // Construct URLs
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
    console.log("Using local rendering for private Office documents");
    setUseOfficeOnline(false);
    loadLocalFallback();
  }, []);

  const loadLocalFallback = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileType = attachment.type || "";

      if (fileType.includes("word") || fileType.includes("document")) {
        // Use mammoth for Word documents
        console.log("Loading Word document with local fallback");
        const mammoth = await import("mammoth");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });

        setLocalContent({
          type: "word",
          content: result.value,
          messages: result.messages || [],
        });
      } else if (fileType.includes("sheet") || fileType.includes("excel")) {
        // Use xlsx for Excel documents
        console.log("Loading Excel document with local fallback");
        const XLSX = await import("xlsx");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheets = workbook.SheetNames.map((name) => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }),
        }));

        setLocalContent({
          type: "excel",
          sheets,
          currentSheet: 0,
        });
      } else {
        throw new Error("Unsupported file type for local preview");
      }
    } catch (err) {
      console.error("Local fallback failed:", err);
      setError(`Local preview failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficeOnlineLoad = () => {
    setLoading(false);
  };

  const handleOfficeOnlineError = () => {
    console.log("Office Online failed, trying local fallback");
    setError(
      "Microsoft Office Online viewer failed. Switching to local preview..."
    );
    setUseOfficeOnline(false);
    loadLocalFallback();
  };

  const handleDownload = () => {
    window.open(fileUrl, "_blank");
  };

  const openInNewTab = () => {
    if (useOfficeOnline) {
      window.open(officeViewerUrl, "_blank");
    } else {
      // For local content, just download
      handleDownload();
    }
  };

  const switchToOfficeOnline = () => {
    setUseOfficeOnline(true);
    setLocalContent(null);
    setError(null);
    setLoading(true);
  };

  const handleSheetChange = (direction) => {
    if (localContent?.type === "excel" && localContent.sheets) {
      const newSheet =
        direction === "next"
          ? Math.min(currentSheet + 1, localContent.sheets.length - 1)
          : Math.max(currentSheet - 1, 0);
      setCurrentSheet(newSheet);
    }
  };

  const renderExcelTable = (data) => {
    if (!data || data.length === 0) {
      return <div className="p-4 text-gray-500">No data in this sheet</div>;
    }

    return (
      <div className="overflow-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex === 0 ? "bg-gray-50 font-semibold" : ""}
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-gray-300 px-2 py-1 text-sm"
                  >
                    {cell !== null && cell !== undefined ? String(cell) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderLocalContent = () => {
    if (!localContent) return null;

    if (localContent.type === "word") {
      return (
        <div className="overflow-auto h-full">
          <div
            className="p-4 bg-white prose max-w-none"
            dangerouslySetInnerHTML={{ __html: localContent.content }}
          />
          {localContent.messages && localContent.messages.length > 0 && (
            <div className="p-4 bg-yellow-50 border-t">
              <h4 className="font-medium text-yellow-800 mb-2">
                Conversion Notes:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {localContent.messages.map((msg, i) => (
                  <li key={i}>{msg.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (localContent.type === "excel") {
      return (
        <div className="h-full flex flex-col">
          {localContent.sheets && localContent.sheets.length > 1 && (
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSheetChange("prev")}
                  disabled={currentSheet === 0}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium">
                  Sheet: {localContent.sheets[currentSheet]?.name || "Unknown"}{" "}
                  ({currentSheet + 1} of {localContent.sheets.length})
                </span>
                <button
                  onClick={() => handleSheetChange("next")}
                  disabled={currentSheet === localContent.sheets.length - 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {renderExcelTable(localContent.sheets[currentSheet]?.data)}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg flex flex-col w-full max-w-6xl h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={20} />
            <div>
              <h3 className="font-medium text-gray-900">
                {attachment.originalName || attachment.filename}
              </h3>
              <p className="text-sm text-gray-500">
                Microsoft Office Document
                {isLocalhost && " (Local Preview)"}
                {!useOfficeOnline && !isLocalhost && " (Fallback Mode)"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isLocalhost && !useOfficeOnline && (
              <button
                onClick={switchToOfficeOnline}
                className="p-2 hover:bg-gray-100 rounded"
                title="Try Office Online"
              >
                <RefreshCw size={16} />
              </button>
            )}
            <button
              onClick={openInNewTab}
              className="p-2 hover:bg-gray-100 rounded"
              title={useOfficeOnline ? "Open in new tab" : "Download file"}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Loading{" "}
                  {useOfficeOnline ? "Office Online viewer" : "local preview"}
                  ...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-x-2">
                  {!useOfficeOnline && !localContent && (
                    <button
                      onClick={loadLocalFallback}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Retry Local Preview
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Download to view
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Office Online Viewer */}
          {useOfficeOnline && !error && (
            <iframe
              src={officeViewerUrl}
              className="w-full h-full border-0"
              onLoad={handleOfficeOnlineLoad}
              onError={handleOfficeOnlineError}
              title="Office Online Viewer"
            />
          )}

          {/* Local Content */}
          {!useOfficeOnline && localContent && !loading && renderLocalContent()}
        </div>
      </div>
    </div>
  );
};

export default OfficeOnlineViewer;
