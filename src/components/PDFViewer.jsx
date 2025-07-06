import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader,
} from "lucide-react";

// Import PDF.js
// Using CDN version instead of local package to avoid .mjs module issues
// The global pdfjsLib will be available from the CDN script tag

const PDFViewer = ({ fileUrl, filename }) => {
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null); // Track current render task for cancellation

  useEffect(() => {
    loadPDF();
  }, [fileUrl]);

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage();
    }
  }, [pdf, currentPage, scale, rotation]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for PDF.js to be available
      if (!window.pdfjsLib) {
        console.log("⏳ Waiting for PDF.js to load from CDN...");
        let attempts = 0;
        while (!window.pdfjsLib && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (!window.pdfjsLib) {
          throw new Error("PDF.js failed to load from CDN after 5 seconds");
        }
      }

      const pdfjsLib = window.pdfjsLib;
      console.log("📄 Loading PDF:", fileUrl);
      console.log("🔧 PDF.js version:", pdfjsLib.version);

      // Configure worker with working CDN version
      const workerUrls = [
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
        `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      ];

      // Set default worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0];
      console.log("🔧 Worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);

      // Test if the file URL is accessible first
      try {
        const response = await fetch(fileUrl, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(
            `PDF file not accessible: ${response.status} ${response.statusText}`
          );
        }
        console.log("✅ PDF file is accessible");
        console.log("📊 Content-Type:", response.headers.get("content-type"));
        console.log(
          "📊 Content-Length:",
          response.headers.get("content-length")
        );
      } catch (fetchError) {
        console.error("❌ PDF file fetch error:", fetchError);
        throw new Error("Cannot access PDF file from server");
      }

      // Test worker availability with fallbacks using the same workerUrls array
      let workerFound = false;
      for (const workerUrl of workerUrls) {
        try {
          const workerResponse = await fetch(workerUrl, { method: "HEAD" });
          if (workerResponse.ok) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
            console.log("✅ PDF.js worker found:", workerUrl);
            workerFound = true;
            break;
          }
        } catch (error) {
          console.warn(`⚠️ Worker URL failed: ${workerUrl}`, error.message);
        }
      }

      if (!workerFound) {
        console.warn(
          "⚠️ No PDF.js worker URLs accessible, PDF loading may fail"
        );
      }

      const loadingTask = pdfjsLib.getDocument({
        url: fileUrl,
        // Add additional options for better compatibility
        cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
        // Add more options for better compatibility
        verbosity: 1, // Show more detailed errors
        maxImageSize: 1024 * 1024 * 10, // 10MB max image size
        isEvalSupported: false, // Disable eval for security
      });

      // Add progress tracking
      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log(`📄 PDF loading progress: ${percent}%`);
        }
      };

      const pdfDocument = await loadingTask.promise;
      console.log("✅ PDF loaded successfully");
      console.log(`📋 PDF info: ${pdfDocument.numPages} pages`);

      setPdf(pdfDocument);
      setTotalPages(pdfDocument.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error("❌ Error loading PDF:", err);
      console.error("❌ Error details:", err.name, err.message);

      // Provide more specific error messages
      let errorMessage = "Failed to load PDF document";
      if (
        err.message.includes("fetch") ||
        err.message.includes("NetworkError")
      ) {
        errorMessage = "Cannot access PDF file from server";
      } else if (
        err.message.includes("worker") ||
        err.message.includes("Worker")
      ) {
        errorMessage =
          "PDF.js worker failed to load - check browser console for details";
      } else if (err.message.includes("InvalidPDFException")) {
        errorMessage = "Invalid or corrupted PDF file";
      } else if (err.message.includes("PasswordException")) {
        errorMessage = "PDF is password protected";
      } else if (err.message.includes("UnexpectedResponseException")) {
        errorMessage = "Unexpected response from server";
      }

      setError(`${errorMessage}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) {
      console.warn("⚠️ Cannot render page: missing PDF or canvas reference");
      return;
    }

    try {
      console.log(`🎨 Rendering page ${currentPage} of ${totalPages}`);

      // Cancel any ongoing render task
      if (renderTaskRef.current) {
        console.log("🔄 Cancelling previous render task");
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      // Wait for PDF.js to be available
      if (!window.pdfjsLib) {
        console.warn("⚠️ PDF.js not available for rendering");
        setError("PDF.js not loaded");
        return;
      }

      const page = await pdf.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not get canvas 2D context");
      }

      // Calculate the viewport
      const viewport = page.getViewport({ scale, rotation });
      console.log(
        `🎨 Viewport: ${viewport.width}x${viewport.height}, scale: ${scale}, rotation: ${rotation}`
      );

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Clear canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      console.log("🎨 Starting page render...");

      // Store the render task so we can cancel it if needed
      renderTaskRef.current = page.render(renderContext);

      await renderTaskRef.current.promise;
      renderTaskRef.current = null; // Clear the reference when done

      console.log("✅ Page rendered successfully");
    } catch (err) {
      renderTaskRef.current = null; // Clear the reference on error

      // Don't log cancellation errors as failures
      if (err.name === "RenderingCancelledException") {
        console.log("🔄 Render cancelled (normal behavior)");
        return;
      }

      console.error("❌ Error rendering page:", err);
      console.error("❌ Error details:", {
        name: err.name,
        message: err.message,
        stack: err.stack,
        currentPage,
        totalPages,
        scale,
        rotation,
      });
      setError(`Failed to render page: ${err.message}`);
    }
  };

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);
  const resetZoom = () => setScale(1.0);

  const handleDownload = () => {
    window.open(fileUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <Loader className="animate-spin" size={24} />
          <span>Loading PDF...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download PDF instead
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center space-x-2">
          {/* Page Navigation */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-medium min-w-20 text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-gray-200"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="text-sm text-gray-600 min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-gray-200"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={resetZoom}
            className="p-1 rounded hover:bg-gray-200 text-xs"
            title="Reset zoom"
          >
            100%
          </button>

          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-1 rounded hover:bg-gray-200"
            title="Rotate"
          >
            <RotateCw size={16} />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1 rounded hover:bg-gray-200"
            title="Download"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 shadow-lg bg-white"
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
      </div>

      {/* Page Input */}
      <div className="p-2 bg-gray-50 border-t">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Go to page:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page && page >= 1 && page <= totalPages) {
                setCurrentPage(page);
              }
            }}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
          />
          <span className="text-sm text-gray-600">of {totalPages}</span>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
