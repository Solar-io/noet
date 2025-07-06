import React, { useState } from "react";
import {
  Tag,
  Download,
  Trash2,
  X,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Undo2,
  CheckCircle,
} from "lucide-react";

const BulkActionsBar = ({
  selectedNotes = [],
  totalNotes = 0,
  onSelectAll,
  onDeselectAll,
  onClearSelection,
  onBulkTagAction,
  onBulkExport,
  onBulkDelete,
  onBulkUndo,
  isProcessing = false,
  processingStatus = null, // { current: 3, total: 15, operation: "exporting" }
  deletedNotes = [], // For undo functionality
  className = "",
}) => {
  const [showUndoDialog, setShowUndoDialog] = useState(false);

  const isAllSelected = selectedNotes.length === totalNotes && totalNotes > 0;
  const hasSelection = selectedNotes.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotes.length > 0) {
      onBulkDelete(selectedNotes);
      setShowUndoDialog(true);
    }
  };

  const handleUndo = () => {
    onBulkUndo();
    setShowUndoDialog(false);
  };

  const handleContinue = () => {
    setShowUndoDialog(false);
    // Notes are already deleted, just close the dialog
  };

  if (!hasSelection && !showUndoDialog) {
    return null;
  }

  return (
    <>
      {/* Main Bulk Actions Bar */}
      {hasSelection && (
        <div
          className={`fixed bottom-0 left-0 right-0 bg-[#27303f] text-white shadow-lg border-t border-gray-600 z-50 ${className}`}
        >
          <div className="max-w-full mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Selection Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center space-x-2 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                    disabled={isProcessing}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={16} />
                    ) : (
                      <Square size={16} />
                    )}
                    <span className="text-sm">
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </span>
                  </button>
                </div>

                <div className="text-sm text-gray-300">
                  {selectedNotes.length} of {totalNotes} note
                  {selectedNotes.length !== 1 ? "s" : ""} selected
                </div>

                {/* Processing Status */}
                {isProcessing && processingStatus && (
                  <div className="flex items-center space-x-2 text-sm text-blue-300">
                    <Loader2 size={14} className="animate-spin" />
                    <span>
                      Processing note {processingStatus.current} of{" "}
                      {processingStatus.total}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onBulkTagAction(selectedNotes)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                  title="Manage Tags"
                >
                  <Tag size={16} />
                  <span>Tags</span>
                </button>

                <button
                  onClick={() => onBulkExport(selectedNotes)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                  title="Export as ZIP"
                >
                  <Download size={16} />
                  <span>Export</span>
                </button>

                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isProcessing}
                  title="Delete Notes"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>

                <button
                  onClick={onClearSelection}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                  disabled={isProcessing}
                  title="Clear Selection"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Dialog */}
      {showUndoDialog && deletedNotes.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle size={24} className="text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Notes Deleted
                </h3>
                <p className="text-sm text-gray-600">
                  {deletedNotes.length} note
                  {deletedNotes.length !== 1 ? "s" : ""} ha
                  {deletedNotes.length !== 1 ? "ve" : "s"} been moved to trash.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Deleted Notes:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {deletedNotes.slice(0, 5).map((note, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-600 flex items-center"
                  >
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    {note.title || "Untitled Note"}
                  </div>
                ))}
                {deletedNotes.length > 5 && (
                  <div className="text-sm text-gray-500 italic">
                    +{deletedNotes.length - 5} more notes
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUndo}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
              >
                <Undo2 size={16} />
                <span>Undo</span>
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <CheckCircle size={16} />
                <span>Continue</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsBar;
