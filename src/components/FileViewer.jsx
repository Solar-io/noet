import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Image,
  File,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import configService from "../configService.js";
import PDFViewer from "./PDFViewer.jsx";

// Dynamic imports for better performance
const loadMammoth = () => import("mammoth");
const loadXLSX = () => import("xlsx");

const FileViewer = ({ attachment, userId, noteId, onClose }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backendUrl, setBackendUrl] = useState("");
  const [currentSheet, setCurrentSheet] = useState(0);

  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
      } catch (error) {
        console.error("Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();
  }, []);

  const fileUrl = backendUrl
    ? `${backendUrl}/api/${userId}/notes/${noteId}/attachments/${attachment.filename}`
    : "";

  useEffect(() => {
    if (backendUrl) {
      loadFileContent();
    }
  }, [attachment, backendUrl]);

  const loadFileContent = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSheet(0);

      console.log("FileViewer: Loading file:", fileUrl);
      console.log("FileViewer: Attachment type:", attachment.type);

      const fileType = attachment.type || "";

      if (fileType.startsWith("image/")) {
        console.log("FileViewer: Setting up image viewer");
        setContent({ type: "image", url: fileUrl });
      } else if (fileType === "application/pdf") {
        console.log("FileViewer: Setting up PDF viewer");
        setContent({ type: "pdf", url: fileUrl });
      } else if (fileType === "text/plain" || fileType === "text/markdown") {
        console.log("FileViewer: Loading text file");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(
            `Failed to load file: ${response.status} ${response.statusText}`
          );
        const text = await response.text();
        setContent({ type: "text", content: text });
      } else if (fileType.includes("word") || fileType.includes("document")) {
        console.log("FileViewer: Loading Word document");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(
            `Failed to load file: ${response.status} ${response.statusText}`
          );
        await loadWordDocument(response);
      } else if (fileType.includes("sheet") || fileType.includes("excel")) {
        console.log("FileViewer: Loading Excel document");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(
            `Failed to load file: ${response.status} ${response.statusText}`
          );
        await loadExcelDocument(response);
      } else if (fileType === "application/json") {
        console.log("FileViewer: Loading JSON file");
        const response = await fetch(fileUrl);
        if (!response.ok)
          throw new Error(
            `Failed to load file: ${response.status} ${response.statusText}`
          );
        const json = await response.json();
        setContent({ type: "json", content: JSON.stringify(json, null, 2) });
      } else {
        console.log("FileViewer: Unknown file type, using download fallback");
        // Fallback for other file types
        setContent({ type: "download", url: fileUrl });
      }
    } catch (err) {
      console.error("FileViewer: Error loading file:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWordDocument = async (response) => {
    try {
      const mammoth = await loadMammoth();
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });

      if (result.value) {
        setContent({
          type: "word",
          content: result.value,
          messages: result.messages || [],
        });
      } else {
        throw new Error("Failed to convert Word document");
      }
    } catch (err) {
      console.error("Error loading Word document:", err);
      setContent({ type: "office", url: fileUrl, subtype: "word" });
    }
  };

  const loadExcelDocument = async (response) => {
    try {
      const XLSX = await loadXLSX();
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      const sheets = workbook.SheetNames.map((name) => ({
        name,
        data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }),
      }));

      setContent({
        type: "excel",
        sheets,
        currentSheet: 0,
      });
    } catch (err) {
      console.error("Error loading Excel document:", err);
      setContent({ type: "office", url: fileUrl, subtype: "excel" });
    }
  };

  const handleDownload = () => {
    window.open(fileUrl, "_blank");
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoom(1);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSheetChange = (direction) => {
    if (content?.type === "excel" && content.sheets) {
      const newSheet =
        direction === "next"
          ? Math.min(currentSheet + 1, content.sheets.length - 1)
          : Math.max(currentSheet - 1, 0);
      setCurrentSheet(newSheet);
    }
  };

  const renderExcelTable = (data) => {
    if (!data || data.length === 0)
      return <div className="p-4 text-gray-500">No data in this sheet</div>;

    return (
      <div className="overflow-auto" style={{ fontSize: `${zoom}em` }}>
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <File size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Could not preview this file</p>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download to view
          </button>
        </div>
      );
    }

    if (!content) return null;

    switch (content.type) {
      case "image":
        return (
          <div className="flex items-center justify-center overflow-auto">
            <img
              src={content.url}
              alt={attachment.originalName}
              style={{ transform: `scale(${zoom})` }}
              className="max-w-full max-h-full object-contain transition-transform"
              onError={(e) => {
                console.error("FileViewer: Failed to load image:", content.url);
                console.error("FileViewer: Image error details:", e);
                // Test the URL directly
                fetch(content.url, { method: "HEAD" })
                  .then((response) => {
                    console.log(
                      "FileViewer: Image URL test:",
                      response.status,
                      response.headers.get("content-type")
                    );
                    if (!response.ok) {
                      setError(
                        `Failed to load image: ${response.status} ${response.statusText}`
                      );
                    } else {
                      setError(
                        "Image loaded from server but failed to display - check browser console"
                      );
                    }
                  })
                  .catch((err) => {
                    console.error("FileViewer: Image URL test failed:", err);
                    setError(`Failed to load image: ${err.message}`);
                  });
              }}
              onLoad={() => {
                console.log(
                  "FileViewer: Image loaded successfully:",
                  content.url
                );
              }}
            />
          </div>
        );

      case "pdf":
        return (
          <div className="w-full h-full">
            <PDFViewer
              fileUrl={content.url}
              filename={attachment.originalName}
            />
          </div>
        );

      case "text":
        return (
          <div className="overflow-auto h-full">
            <pre
              className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded"
              style={{ fontSize: `${zoom}em` }}
            >
              {content.content}
            </pre>
          </div>
        );

      case "json":
        return (
          <div className="overflow-auto h-full">
            <pre
              className="whitespace-pre-wrap font-mono text-sm p-4 bg-gray-50 rounded"
              style={{ fontSize: `${zoom}em` }}
            >
              {content.content}
            </pre>
          </div>
        );

      case "word":
        return (
          <div className="overflow-auto h-full">
            <div
              className="p-4 bg-white prose max-w-none"
              style={{ fontSize: `${zoom}em` }}
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
            {content.messages && content.messages.length > 0 && (
              <div className="p-4 bg-yellow-50 border-t">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Conversion Notes:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {content.messages.map((msg, i) => (
                    <li key={i}>{msg.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case "excel":
        return (
          <div className="h-full flex flex-col">
            {content.sheets && content.sheets.length > 1 && (
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
                    Sheet: {content.sheets[currentSheet]?.name || "Unknown"}(
                    {currentSheet + 1} of {content.sheets.length})
                  </span>
                  <button
                    onClick={() => handleSheetChange("next")}
                    disabled={currentSheet === content.sheets.length - 1}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              {renderExcelTable(content.sheets[currentSheet]?.data)}
            </div>
          </div>
        );

      case "office":
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText size={48} className="text-blue-600 mb-4" />
            <p className="text-gray-600 mb-2">
              {content.subtype === "word"
                ? "Word Document"
                : "Excel Spreadsheet"}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Enhanced preview not available
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download to view
            </button>
          </div>
        );

      case "download":
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <File size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Preview not available for this file type
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Download to view
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${
        isFullscreen ? "p-0" : "p-4"
      }`}
    >
      <div
        className={`bg-white rounded-lg flex flex-col ${
          isFullscreen
            ? "w-full h-full"
            : "w-full max-w-4xl h-full max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {attachment.type?.startsWith("image/")
                  ? "🖼️"
                  : attachment.type === "application/pdf"
                  ? "📄"
                  : attachment.type?.includes("word")
                  ? "📝"
                  : attachment.type?.includes("sheet")
                  ? "📊"
                  : attachment.type === "application/json"
                  ? "��"
                  : "📎"}
              </span>
              <div>
                <h3 className="font-medium text-gray-900">
                  {attachment.originalName || attachment.filename}
                </h3>
                <p className="text-sm text-gray-500">
                  {attachment.size
                    ? formatFileSize(attachment.size)
                    : "Unknown size"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom controls for images, text, and documents */}
            {(content?.type === "image" ||
              content?.type === "text" ||
              content?.type === "json" ||
              content?.type === "word" ||
              content?.type === "excel") && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Zoom out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-sm text-gray-600 min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Zoom in"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 hover:bg-gray-100 rounded text-xs"
                  title="Reset zoom"
                >
                  1:1
                </button>
              </>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
};

// Helper function
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default FileViewer;
