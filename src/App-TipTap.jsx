import React, { useState, useEffect, useCallback } from "react";
import TipTapEditor, {
  NoteStorageService,
  AdminSettings,
} from "./TipTapEditor.jsx";
import ImprovedNotesList from "./components/ImprovedNotesList.jsx";
import NoteEditor from "./components/NoteEditor.jsx";
import ImprovedSidebar from "./components/ImprovedSidebar.jsx";
import UserManagement from "./components/UserManagement.jsx";
import AdminInterface from "./components/AdminInterface.jsx";
import NoteVersionHistory from "./components/NoteVersionHistory.jsx";
import EvernoteImport from "./components/EvernoteImport.jsx";
import DragDropManager from "./components/DragDropManager.jsx";
import RobustErrorBoundary from "./components/RobustErrorBoundary.jsx";
import BulkActionsBar from "./components/BulkActionsBar.jsx";
import TagManagementDialog from "./components/TagManagementDialog.jsx";
import {
  validateNote,
  validateUser,
  validateApiResponse,
} from "./utils/validation.js";
import errorRecoveryService from "./services/ErrorRecoveryService.js";
import configService from "./configService.js";
import {
  Search,
  Plus,
  Settings,
  Star,
  Trash2,
  FileText,
  Eye,
  EyeOff,
  AlertTriangle,
  FolderOpen,
  Tag,
  Filter,
  SortAsc,
  LogOut,
  ChevronDown,
  ChevronRight,
  Book,
  Bookmark,
  Clock,
  Hash,
  MoreHorizontal,
  CheckSquare,
  BarChart3,
  User,
  History,
  Upload,
  Shield,
} from "lucide-react";

// Simple Authentication Component
const AuthenticationFlow = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        onLoginSuccess(user);
      } else {
        const error = await response.json();
        setLoginError(error.error || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src="/images/noet-logo-full.svg"
              alt="Noet Logo"
              className="h-16"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <div
              style={{ display: "none" }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-blue-900">Noet</h2>
            </div>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLoginError("");
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="demo@example.com"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              placeholder="demo123"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm text-red-700">{loginError}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
          >
            Sign In
          </button>
        </form>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Demo Accounts
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>User: demo@example.com | Password: demo123</div>
            <div>Admin: admin@example.com | Password: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern Sidebar Component with integrated managers
const Sidebar = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  onShowSettings,
  onShowUserManagement,
  onShowAdminInterface,
  onShowEvernoteImport,
  noteStats,
  storageService,
  userId,
}) => {
  const [expandedSections, setExpandedSections] = useState({
    notebooks: true,
    tags: false,
    folders: false,
  });

  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const backendUrl = configService.getBackendUrl();

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    try {
      const [notebooksRes, tagsRes, foldersRes] = await Promise.all([
        fetch(`${backendUrl}/api/${userId}/notebooks`),
        fetch(`${backendUrl}/api/${userId}/tags`),
        fetch(`${backendUrl}/api/${userId}/folders`),
      ]);

      if (notebooksRes.ok) {
        const notebooksData = await notebooksRes.json();
        setNotebooks(notebooksData);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }
    } catch (error) {
      console.error("Error loading sidebar data:", error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const SectionHeader = ({
    icon: Icon,
    title,
    isExpanded,
    onToggle,
    count,
    actionIcon: ActionIcon,
    onAction,
  }) => (
    <div className="flex items-center justify-between p-3 hover:bg-blue-50 rounded-xl transition-colors group">
      <div
        className="flex items-center space-x-3 flex-1 cursor-pointer"
        onClick={onToggle}
      >
        <Icon size={20} className="text-blue-600" />
        <span className="font-semibold text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full min-w-[24px] text-center font-medium">
            {count}
          </span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        {ActionIcon && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <ActionIcon size={16} className="text-blue-600" />
          </button>
        )}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-blue-600" />
            ) : (
              <ChevronRight size={16} className="text-blue-600" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const NavItem = ({
    icon: Icon,
    title,
    count,
    isActive,
    onClick,
    actionIcon: ActionIcon,
    onAction,
    className = "",
  }) => (
    <div
      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 cursor-pointer group ${
        isActive
          ? "bg-blue-100 border border-blue-200 shadow-sm"
          : "hover:bg-blue-50 hover:shadow-sm"
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3 flex-1">
        <Icon
          size={18}
          className={isActive ? "text-blue-700" : "text-blue-600"}
        />
        <span
          className={`font-medium ${
            isActive ? "text-blue-900" : "text-gray-700"
          }`}
        >
          {title}
        </span>
        {count !== undefined && (
          <span
            className={`text-xs px-2 py-1 rounded-full min-w-[24px] text-center font-medium ${
              isActive
                ? "bg-blue-200 text-blue-800"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {count}
          </span>
        )}
      </div>
      {ActionIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
          }}
          className={`p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
            isActive ? "hover:bg-blue-200" : "hover:bg-blue-100"
          }`}
        >
          <ActionIcon
            size={14}
            className={isActive ? "text-blue-700" : "text-blue-600"}
          />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl">
      {/* Header with Noet Logo */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src="/images/noet-logo.svg"
            alt="Noet Logo"
            className="w-10 h-10"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center"
            style={{ display: "none" }}
          >
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-blue-900">Noet</h1>
            <p className="text-sm text-blue-600">V1.16</p>
          </div>
        </div>
        {user?.isAdmin && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
              Admin
            </span>
            <span className="text-blue-400">•</span>
            <span
              className="text-blue-600 truncate"
              title={storageService?.notesPath}
            >
              {storageService?.notesPath?.split("/").pop() || "notes"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* All Notes Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 my-4 shadow-sm">
            <NavItem
              icon={FileText}
              title="All Notes"
              count={noteStats?.total || 0}
              isActive={currentView === "all"}
              onClick={() => onViewChange("all")}
              actionIcon={Plus}
              onAction={() => console.log("Create new note")}
            />

            <div className="mt-3 ml-6 space-y-2">
              <NavItem
                icon={Clock}
                title="Recent"
                isActive={currentView === "recent"}
                onClick={() => onViewChange("recent")}
                className="text-sm py-2"
              />
              <NavItem
                icon={Star}
                title="Shortcuts"
                count={noteStats?.starred || 0}
                isActive={currentView === "starred"}
                onClick={() => onViewChange("starred")}
                className="text-sm py-2"
              />
              <NavItem
                icon={Trash2}
                title="Trash"
                count={noteStats?.trash || 0}
                isActive={currentView === "trash"}
                onClick={() => onViewChange("trash")}
                className="text-sm py-2"
              />
            </div>
          </div>

          {/* Notebooks Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 my-4 shadow-sm">
            <SectionHeader
              icon={Book}
              title="Notebooks"
              isExpanded={expandedSections.notebooks}
              onToggle={() => toggleSection("notebooks")}
              count={notebooks.length}
              actionIcon={Plus}
              onAction={() => toggleSection("notebooks")}
            />

            {expandedSections.notebooks && (
              <div className="mt-3">
                <NotebookManager
                  userId={userId}
                  currentNotebook={selectedNotebook}
                  onNotebookChange={(notebookId) => {
                    setSelectedNotebook(notebookId);
                    onViewChange("notebook", { notebookId });
                  }}
                />
              </div>
            )}
          </div>

          {/* Folders Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 my-4 shadow-sm">
            <SectionHeader
              icon={FolderOpen}
              title="Folders"
              isExpanded={expandedSections.folders}
              onToggle={() => toggleSection("folders")}
              count={folders.length}
              actionIcon={Plus}
              onAction={() => toggleSection("folders")}
            />

            {expandedSections.folders && (
              <div className="mt-3">
                <FolderManager
                  userId={userId}
                  currentFolder={selectedFolder}
                  onFolderChange={(folderId) => {
                    setSelectedFolder(folderId);
                    onViewChange("folder", { folderId });
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 my-4 shadow-sm">
            <SectionHeader
              icon={Hash}
              title="Tags"
              isExpanded={expandedSections.tags}
              onToggle={() => toggleSection("tags")}
              count={tags.length}
              actionIcon={Plus}
              onAction={() => toggleSection("tags")}
            />

            {expandedSections.tags && (
              <div className="mt-3">
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => onViewChange("tag", { tagId: tag.id })}
                      className="w-full flex items-center space-x-2 p-2 rounded hover:bg-white/50 text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {tag.name}
                      </span>
                    </button>
                  ))}
                  {tags.length === 0 && (
                    <div className="text-sm text-gray-500 py-2 px-3 rounded-lg bg-white/50">
                      No tags yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tasks Section (for future use) */}
          <NavItem
            icon={CheckSquare}
            title="Tasks"
            isActive={currentView === "tasks"}
            onClick={() => onViewChange("tasks")}
          />

          {/* Reports Section (for future use) */}
          <NavItem
            icon={BarChart3}
            title="Reports"
            isActive={currentView === "reports"}
            onClick={() => onViewChange("reports")}
          />
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-blue-100 bg-gradient-to-r from-gray-50 to-blue-50 space-y-2">
        <NavItem
          icon={Upload}
          title="Import from Evernote"
          isActive={false}
          onClick={onShowEvernoteImport}
          className="py-2"
        />

        <NavItem
          icon={User}
          title="Account Settings"
          isActive={false}
          onClick={onShowUserManagement}
          className="py-2"
        />

        {user?.isAdmin && (
          <>
            <NavItem
              icon={Settings}
              title="Admin Settings"
              isActive={false}
              onClick={onShowSettings}
              className="py-2"
            />
            <NavItem
              icon={Shield}
              title="Admin Interface"
              isActive={false}
              onClick={onShowAdminInterface}
              className="py-2 text-red-600 hover:text-red-700"
            />
          </>
        )}

        <NavItem
          icon={LogOut}
          title="Sign Out"
          isActive={false}
          onClick={onLogout}
          className="text-red-600 hover:bg-red-50 py-2"
        />
      </div>
    </div>
  );
};

// Main App Component
const NoetTipTapApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentView, setCurrentView] = useState("all");
  const [currentViewParams, setCurrentViewParams] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAdminInterface, setShowAdminInterface] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showEvernoteImport, setShowEvernoteImport] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("info");
  const [storageService] = useState(new NoteStorageService());
  const [backendUrl, setBackendUrl] = useState("");

  // Bulk actions state
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [deletedNotes, setDeletedNotes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);

  // Resizable panes state with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("noet-sidebar-width");
    return saved ? parseInt(saved) : 320;
  });
  const [notesListWidth, setNotesListWidth] = useState(() => {
    const saved = localStorage.getItem("noet-noteslist-width");
    return saved ? parseInt(saved) : 384; // w-96 = 384px
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingPanel, setResizingPanel] = useState(null);

  // Set up error recovery service user message handler
  useEffect(() => {
    errorRecoveryService.setUserMessageHandler((message, type) => {
      setUserMessage(message);
      setUserMessageType(type);
      // Clear message after 5 seconds
      setTimeout(() => setUserMessage(""), 5000);
    });
  }, []);

  // Handle mouse events for resizing
  const handleMouseDown = (e, panel) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingPanel(panel);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || !resizingPanel) return;

      const containerRect = document
        .querySelector(".main-layout-container")
        .getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;

      if (resizingPanel === "sidebar") {
        const newWidth = Math.min(Math.max(mouseX, 200), 500); // Min 200px, Max 500px
        setSidebarWidth(newWidth);
        localStorage.setItem("noet-sidebar-width", newWidth.toString());
      } else if (resizingPanel === "notesList") {
        const newWidth = Math.min(
          Math.max(mouseX - sidebarWidth - 4, 300),
          600
        ); // Min 300px, Max 600px, account for 4px resize handle
        setNotesListWidth(newWidth);
        localStorage.setItem("noet-noteslist-width", newWidth.toString());
      }
    },
    [isResizing, resizingPanel, sidebarWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingPanel(null);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  // Add global mouse event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Initialize backend URL
  useEffect(() => {
    const initBackendUrl = async () => {
      try {
        const url = await configService.getBackendUrl();
        setBackendUrl(url);
        console.log("✅ Backend URL initialized:", url);
      } catch (error) {
        console.error("❌ Failed to get backend URL:", error);
        setBackendUrl("http://localhost:3004"); // fallback
      }
    };
    initBackendUrl();

    // Debug function for checking tag state
    window.debugTags = () => {
      console.log("🏷️ Current Tag State:");
      console.log("Available tags:", tags);
      console.log(
        "Notes with tags:",
        notes
          .filter((n) => n.tags?.length > 0)
          .map((n) => ({
            title: n.title,
            id: n.id,
            tags: n.tags,
            tagCount: n.tags?.length || 0,
          }))
      );
    };
  }, [tags, notes]);

  // Load notes from API
  const loadNotes = useCallback(async () => {
    if (!validateUser(user) || !backendUrl) {
      console.warn("Cannot load notes: missing user or backend URL");
      return;
    }

    try {
      let url = `${backendUrl}/api/${user.id}/notes`;

      // Add filters based on current view
      const params = new URLSearchParams();

      if (currentView === "starred") {
        params.append("starred", "true");
      } else if (currentView === "recent") {
        const weekAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        params.append("since", weekAgo);
      } else if (currentView === "archived") {
        params.append("archived", "true");
      } else if (currentView === "trash") {
        params.append("deleted", "true");
      } else if (currentView === "notebook" && currentViewParams.notebookId) {
        params.append("notebook", currentViewParams.notebookId);
      } else if (currentView === "folder" && currentViewParams.folderId) {
        params.append("folder", currentViewParams.folderId);
      } else if (currentView === "tag" && currentViewParams.tagId) {
        params.append("tag", currentViewParams.tagId);
      } else if (currentView === "all") {
        // No filters for all notes view
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to load notes: ${response.status}`);

      const notesData = await response.json();

      // Validate the response
      if (!Array.isArray(notesData)) {
        throw new Error("Invalid notes data received: not an array");
      }

      // Validate each note
      const validNotes = notesData.filter((note) => {
        if (!validateNote(note)) {
          console.warn("Filtering out invalid note:", note);
          return false;
        }
        return true;
      });

      console.log(
        `✅ Loaded ${validNotes.length} valid notes (${
          notesData.length - validNotes.length
        } filtered out)`
      );
      setNotes(validNotes);
    } catch (error) {
      // Handle network errors more gracefully during startup
      if (error.message.includes("Failed to fetch")) {
        console.log(
          "ℹ️ Notes loading failed (network), will retry automatically"
        );
      } else {
        console.error("Error loading notes:", error.message);
      }

      // Use error recovery service
      const recoveryResult = await errorRecoveryService.handleError(error, {
        operation: "load_notes",
        retryFunction: async () => {
          const response = await fetch(`${backendUrl}/api/${user.id}/notes`);
          if (!response.ok)
            throw new Error(`Failed to load notes: ${response.status}`);
          return response.json();
        },
        safeFallback: [],
        allowPageRefresh: false,
      });

      if (recoveryResult.success && Array.isArray(recoveryResult.result)) {
        const validNotes = recoveryResult.result.filter(validateNote);
        setNotes(validNotes);
      } else {
        // Fallback to empty array on error
        setNotes([]);
      }
    }
  }, [user, backendUrl, currentView, currentViewParams]);

  // Optimized notes update for quick local updates (like starring)
  const updateNotesOptimistically = useCallback((updatedNotes) => {
    setNotes(updatedNotes);
  }, []);

  // Load notebooks from backend
  const loadNotebooks = async () => {
    console.log("📚 loadNotebooks called", {
      hasUser: !!user,
      hasBackendUrl: !!backendUrl,
    });

    if (!validateUser(user) || !backendUrl) {
      console.warn("Cannot load notebooks: missing user or backend URL");
      return;
    }

    try {
      const apiUrl = `${backendUrl}/api/${user.id}/notebooks`;
      console.log("📚 Fetching notebooks from:", apiUrl);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to load notebooks: ${response.status}`);
      }
      const notebooksData = await response.json();
      console.log(
        `✅ Loaded ${notebooksData.length} notebooks:`,
        notebooksData
      );
      setNotebooks(notebooksData);

      console.log("📚 Notebooks state updated");
    } catch (error) {
      // Handle network errors more gracefully during startup
      if (error.message.includes("Failed to fetch")) {
        console.log("ℹ️ Notebooks loading failed (network), using empty list");
      } else {
        console.error("Error loading notebooks:", error.message);
      }
      setNotebooks([]);
    }
  };

  // Load tags from backend
  const loadTags = async () => {
    if (!validateUser(user) || !backendUrl) {
      console.warn("Cannot load tags: missing user or backend URL");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tags`);
      if (!response.ok) {
        throw new Error(`Failed to load tags: ${response.status}`);
      }
      const tagsData = await response.json();
      console.log(`✅ Loaded ${tagsData.length} tags`);
      console.log("Raw tags data from backend:", tagsData);
      console.log("First tag details:", tagsData[0]);
      setTags(tagsData);
    } catch (error) {
      // Handle network errors more gracefully during startup
      if (error.message.includes("Failed to fetch")) {
        console.log("ℹ️ Tags loading failed (network), using empty list");
      } else {
        console.error("Error loading tags:", error.message);
      }
      setTags([]);
    }
  };

  // Load folders from backend
  const loadFolders = async () => {
    if (!validateUser(user) || !backendUrl) {
      console.warn("Cannot load folders: missing user or backend URL");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/folders`);
      if (!response.ok) {
        throw new Error(`Failed to load folders: ${response.status}`);
      }
      const foldersData = await response.json();
      console.log(`✅ Loaded ${foldersData.length} folders`);
      setFolders(foldersData);
    } catch (error) {
      // Handle network errors more gracefully during startup
      if (error.message.includes("Failed to fetch")) {
        console.log("ℹ️ Folders loading failed (network), using empty list");
      } else {
        console.error("Error loading folders:", error.message);
      }
      setFolders([]);
    }
  };

  // Load all data
  const loadAllData = async () => {
    await Promise.all([
      loadNotes(),
      loadNotebooks(),
      loadTags(),
      loadFolders(),
    ]);
  };

  useEffect(() => {
    if (isAuthenticated && user && backendUrl) {
      loadAllData();
    }
  }, [isAuthenticated, user, currentView, currentViewParams, backendUrl]);

  const handleViewChange = useCallback((view, params = {}) => {
    setCurrentView(view);
    setCurrentViewParams(params);
    setSelectedNote(null); // Clear selection when changing views
  }, []);

  const handleLoginSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);

    // Notes will be loaded automatically by the useEffect
  };

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setCurrentView("all");
  }, []);

  const createNewNote = async () => {
    console.log("🚀 createNewNote called");
    console.log("User:", user);
    console.log("Backend URL:", backendUrl);
    console.log("Current view params:", currentViewParams);

    if (!validateUser(user) || !backendUrl) {
      const errorMsg = "Cannot create note: missing user or backend URL";
      console.error(errorMsg, { user, backendUrl });

      await errorRecoveryService.handleError(new Error(errorMsg), {
        operation: "create_note",
        safeFallback: null,
        allowPageRefresh: false,
      });
      return;
    }

    try {
      const noteData = {
        title: "Untitled Note",
        content: "",
        tags: [],
        notebook: currentViewParams.notebookId || null,
        folder: currentViewParams.folderId || null,
      };

      console.log("📝 Creating note with data:", noteData);
      console.log("📡 Posting to:", `${backendUrl}/api/${user.id}/notes`);

      const response = await fetch(`${backendUrl}/api/${user.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok)
        throw new Error(`Failed to create note: ${response.status}`);

      const newNote = await response.json();
      console.log("✅ Received new note:", newNote);

      // Validate the created note
      if (!validateNote(newNote)) {
        throw new Error(
          "Invalid note data received from server after creation"
        );
      }

      console.log("✅ Created new note:", newNote.title);
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
    } catch (error) {
      console.error("❌ Error creating note:", error);

      // Use error recovery service
      const recoveryResult = await errorRecoveryService.handleError(error, {
        operation: "create_note",
        retryFunction: async () => {
          const response = await fetch(`${backendUrl}/api/${user.id}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Untitled Note",
              content: "",
              tags: [],
              notebook: currentViewParams.notebookId || null,
              folder: currentViewParams.folderId || null,
            }),
          });
          if (!response.ok)
            throw new Error(`Failed to create note: ${response.status}`);
          return response.json();
        },
        safeFallback: null,
        allowPageRefresh: false,
      });

      if (recoveryResult.success && validateNote(recoveryResult.result)) {
        setNotes((prev) => [recoveryResult.result, ...prev]);
        setSelectedNote(recoveryResult.result);
      }
    }
  };

  const handleNoteContentChange = (note, content, markdown) => {
    console.log("📝 handleNoteContentChange called:", {
      noteId: note?.id,
      noteTitle: note?.title,
      isVersionPreview: note?.tempVersionPreview,
      previewingVersion: note?.previewingVersion,
      contentLength: content?.length,
      markdownLength: markdown?.length,
    });

    // If this is a version preview, don't update the main note state
    // Only update the editor content via the selectedNote state
    if (note?.tempVersionPreview) {
      console.log(
        "🔍 Version preview detected - updating editor only, not main state"
      );

      // Update only the selectedNote for editor display
      setSelectedNote((prev) =>
        prev
          ? {
              ...prev,
              content,
              markdown,
              tempVersionPreview: note.tempVersionPreview,
              previewingVersion: note.previewingVersion,
              // Preserve original content tracking for change detection
              originalContent: prev.originalContent,
              originalMarkdown: prev.originalMarkdown,
            }
          : null
      );

      console.log("✅ Editor content updated for version preview");
      return;
    }

    // Normal content update (not version preview) - update main state
    console.log("💾 Normal content update - updating main state");

    setSelectedNote((prev) =>
      prev
        ? {
            ...prev,
            content,
            markdown,
            // Preserve original content tracking for change detection
            originalContent: prev.originalContent,
            originalMarkdown: prev.originalMarkdown,
          }
        : null
    );

    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              content,
              markdown,
            }
          : n
      )
    );

    console.log("✅ Note content updated in main state");
  };

  const handleNoteSave = async (content, markdown, updatedNote) => {
    // If we already have the updated note data (from attachment operations), use it directly
    if (updatedNote) {
      console.log("✅ Using pre-fetched updated note data");

      // Update local state
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );

      // Update selectedNote and reset original content tracking
      setSelectedNote((prev) =>
        prev?.id === updatedNote.id
          ? {
              ...updatedNote,
              // Reset original content to current content after save
              originalContent: updatedNote.content,
              originalMarkdown: updatedNote.markdown,
              // Preserve any temporary flags
              tempVersionPreview: prev.tempVersionPreview,
              previewingVersion: prev.previewingVersion,
            }
          : prev
      );

      // Refresh tags since note tags may have changed (temporarily disabled)
      // await refreshTags();

      console.log("✅ Note saved successfully");
    }

    // Otherwise, perform a normal save operation
    if (!selectedNote || !user?.id) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notes/${selectedNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: selectedNote.title,
            content: content || selectedNote.content,
            markdown: markdown || selectedNote.markdown,
            tags: selectedNote.tags,
            notebook: selectedNote.notebook,
            folder: selectedNote.folder,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save note");

      const savedNote = await response.json();

      // Update local state
      setNotes((prev) =>
        prev.map((n) => (n.id === savedNote.id ? savedNote : n))
      );

      // Update selectedNote and reset original content tracking
      setSelectedNote((prev) =>
        prev?.id === savedNote.id
          ? {
              ...savedNote,
              // Reset original content to current content after save
              originalContent: savedNote.content,
              originalMarkdown: savedNote.markdown,
              // Preserve any temporary flags
              tempVersionPreview: prev.tempVersionPreview,
              previewingVersion: prev.previewingVersion,
            }
          : prev
      );

      // Refresh tags since note tags may have changed (temporarily disabled)
      // await refreshTags();

      console.log("✅ Note saved successfully");
    } catch (error) {
      console.error("Error saving note:", error);
      throw error; // Re-throw to let the editor handle the error
    }
  };

  // Save note without updating selectedNote state (for note switching)
  const saveNoteWithoutStateUpdate = async (noteToSave, content, markdown) => {
    const saveId = Math.random().toString(36).substr(2, 9);
    console.log(`💾 [${saveId}] saveNoteWithoutStateUpdate called:`, {
      noteId: noteToSave?.id,
      noteTitle: noteToSave?.title,
      contentLength: content?.length,
      markdownLength: markdown?.length,
    });

    if (!noteToSave || !user?.id) {
      console.warn(`⚠️ [${saveId}] Missing noteToSave or user ID`, {
        hasNote: !!noteToSave,
        hasUser: !!user?.id,
      });
      return;
    }

    try {
      const apiUrl = `${backendUrl}/api/${user.id}/notes/${noteToSave.id}`;
      console.log(`📡 [${saveId}] Saving note to:`, apiUrl);

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteToSave.title,
          content: content || noteToSave.content,
          markdown: markdown || noteToSave.markdown,
          tags: noteToSave.tags,
          notebook: noteToSave.notebook,
          folder: noteToSave.folder,
        }),
      });

      if (!response.ok) throw new Error("Failed to save note");

      const savedNote = await response.json();
      console.log(`📡 [${saveId}] Save response:`, {
        savedNoteId: savedNote?.id,
        savedNoteTitle: savedNote?.title,
        originalNoteId: noteToSave.id,
        originalNoteTitle: noteToSave.title,
        idsMatch: savedNote?.id === noteToSave.id,
      });

      // Only update notes array, not selectedNote
      setNotes((prev) =>
        prev.map((n) => (n.id === savedNote.id ? savedNote : n))
      );

      console.log(
        `✅ [${saveId}] Note saved successfully without state update`
      );
      return savedNote;
    } catch (error) {
      console.error(`❌ [${saveId}] Error saving note:`, error);
      throw error;
    }
  };

  const handleNoteUpdate = (updatedNote) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
    if (selectedNote?.id === updatedNote.id) {
      setSelectedNote(updatedNote);
    }
  };

  const handleNoteDelete = async (noteId) => {
    if (!user?.id) return;

    try {
      // Soft delete by marking the note as deleted instead of permanently removing it
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: { deleted: true } }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete note");

      const updatedNote = await response.json();

      // Remove from current view if not in trash view
      if (currentView !== "trash") {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (selectedNote?.id === noteId) {
          setSelectedNote(null);
        }
      } else {
        // Update the note in place if in trash view
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? updatedNote : n))
        );
        if (selectedNote?.id === noteId) {
          setSelectedNote(updatedNote);
        }
      }

      console.log("✅ Note moved to trash successfully");
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note");
    }
  };

  const handleStoragePathChange = async (newPath) => {
    try {
      const oldPath = storageService.notesPath;

      // Update the storage service
      storageService.setNotesPath(newPath);

      // Show success feedback
      console.log(`Storage path changed from "${oldPath}" to "${newPath}"`);

      // In a real app, this would trigger:
      // 1. Migration of existing notes to new location
      // 2. Reload of notes from new location
      // 3. Update of all file references

      // For now, just reload the notes
      await loadNotes();

      // Show user feedback
      alert(
        `Storage location updated successfully!\n\nOld: ${oldPath}\nNew: ${newPath}\n\nNotes will now be stored in the new location.`
      );
    } catch (error) {
      console.error("Error changing storage path:", error);
      alert("Failed to update storage location. Please try again.");
    }
  };

  // Handle note selection with full content loading
  const handleNoteSelection = async (note) => {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [${callId}] handleNoteSelection called with:`, {
      noteId: note?.id,
      noteTitle: note?.title,
      callStack: new Error().stack.split("\n").slice(1, 4).join("\n"),
    });

    // Validate note with comprehensive validation
    if (!validateNote(note)) {
      const errorMsg = "Invalid note object passed to handleNoteSelection";
      console.error(`❌ [${callId}] ${errorMsg}`, note);

      await errorRecoveryService.handleError(new Error(errorMsg), {
        operation: "note_selection",
        data: note,
        safeFallback: null,
        fallbackData: null,
      });

      setSelectedNote(null);
      return;
    }

    if (!validateUser(user) || !backendUrl) {
      console.warn(
        `⚠️ [${callId}] Missing user ID or backend URL, setting note without content`
      );
      console.warn(`⚠️ [${callId}] User:`, user, "Backend URL:", backendUrl);
      setSelectedNote(note);
      return;
    }

    // SAVE CURRENT NOTE CONTENT BEFORE SWITCHING (without updating selectedNote state)
    if (selectedNote && selectedNote.id !== note.id) {
      try {
        console.log(
          `💾 [${callId}] Saving current note content before switching...`
        );
        console.log(`💾 [${callId}] Current note:`, {
          id: selectedNote.id,
          title: selectedNote.title,
        });
        console.log(`💾 [${callId}] Target note:`, {
          id: note.id,
          title: note.title,
        });

        // Check if content has actually changed before saving
        const hasContentChanged =
          selectedNote.content !== selectedNote.originalContent ||
          selectedNote.markdown !== selectedNote.originalMarkdown;

        console.log(`🔍 [${callId}] Content change check:`, {
          hasContentChanged,
          currentContentLength: selectedNote.content?.length || 0,
          originalContentLength: selectedNote.originalContent?.length || 0,
          currentMarkdownLength: selectedNote.markdown?.length || 0,
          originalMarkdownLength: selectedNote.originalMarkdown?.length || 0,
        });

        // Only save if content has actually changed
        if (hasContentChanged) {
          console.log(`💾 [${callId}] Content changed - saving note`);
          // Use saveNoteWithoutStateUpdate to avoid intermediate state updates
          await saveNoteWithoutStateUpdate(
            selectedNote,
            selectedNote.content,
            selectedNote.markdown
          );
          console.log(`✅ [${callId}] Current note content saved successfully`);
        } else {
          console.log(
            `⏭️ [${callId}] No content changes detected - skipping save`
          );
        }

        // Small delay to ensure save completes (if it happened)
        if (hasContentChanged) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Create focus switch version checkpoint (with reduced frequency) - only if content changed
        if (hasContentChanged) {
          console.log(
            `🔄 [${callId}] Creating focus switch version for:`,
            selectedNote.title
          );
          await fetch(
            `${backendUrl}/api/${user.id}/notes/${selectedNote.id}/version-checkpoint`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );
          console.log(`✅ [${callId}] Focus switch version created`);
        } else {
          console.log(
            `⏭️ [${callId}] Skipping version creation - no content changes`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ [${callId}] Failed to save current note or create focus switch version:`,
          error
        );
        // Don't block note switching if save/version creation fails
      }
    }

    try {
      // Fetch the full note content with error recovery
      const apiUrl = `${backendUrl}/api/${user.id}/notes/${note.id}`;
      console.log(`📡 [${callId}] Fetching note from:`, apiUrl);
      console.log(`📡 [${callId}] Expected note ID:`, note.id);

      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(`Failed to load note content: ${response.status}`);

      const fullNote = await response.json();
      console.log(`📡 [${callId}] API Response:`, {
        returnedNoteId: fullNote?.id,
        returnedNoteTitle: fullNote?.title,
        expectedNoteId: note.id,
        expectedNoteTitle: note.title,
        idsMatch: fullNote?.id === note.id,
      });

      // Validate the response
      if (!validateNote(fullNote)) {
        throw new Error("Invalid note data received from server");
      }

      // Check if we got the wrong note
      if (fullNote.id !== note.id) {
        console.error(`❌ [${callId}] API returned wrong note!`, {
          requested: { id: note.id, title: note.title },
          received: { id: fullNote.id, title: fullNote.title },
        });
        // Don't update state with wrong note
        return;
      }

      console.log(
        `✅ [${callId}] Loaded full note content for:`,
        fullNote.title
      );

      // Clear version preview state when switching notes - do this AFTER loading the new note
      // to avoid unnecessary state updates that cause flashing
      const noteToSet = selectedNote?.tempVersionPreview
        ? { ...fullNote, tempVersionPreview: false, previewingVersion: null }
        : fullNote;

      // Track original content for change detection
      noteToSet.originalContent = fullNote.content;
      noteToSet.originalMarkdown = fullNote.markdown;

      console.log(`🎯 [${callId}] Setting selected note to:`, {
        id: noteToSet.id,
        title: noteToSet.title,
        hasOriginalContent: !!noteToSet.originalContent,
        hasOriginalMarkdown: !!noteToSet.originalMarkdown,
      });

      setSelectedNote(noteToSet);
    } catch (error) {
      console.error(`❌ [${callId}] Error loading note content:`, error);

      // Use error recovery service
      const recoveryResult = await errorRecoveryService.handleError(error, {
        operation: "load_note_content",
        data: note,
        retryFunction: async () => {
          const response = await fetch(
            `${backendUrl}/api/${user.id}/notes/${note.id}`
          );
          if (!response.ok)
            throw new Error(`Failed to load note content: ${response.status}`);
          return response.json();
        },
        safeFallback: note,
        allowPageRefresh: false,
      });

      if (recoveryResult.success) {
        if (validateNote(recoveryResult.result)) {
          // Clear version preview state if needed
          const noteToSet = selectedNote?.tempVersionPreview
            ? {
                ...recoveryResult.result,
                tempVersionPreview: false,
                previewingVersion: null,
              }
            : recoveryResult.result;

          // Track original content for change detection
          noteToSet.originalContent = recoveryResult.result.content;
          noteToSet.originalMarkdown = recoveryResult.result.markdown;

          console.log(`🎯 [${callId}] Setting selected note to (recovery):`, {
            id: noteToSet.id,
            title: noteToSet.title,
            hasOriginalContent: !!noteToSet.originalContent,
            hasOriginalMarkdown: !!noteToSet.originalMarkdown,
          });
          setSelectedNote(noteToSet);
        } else {
          console.log(`🎯 [${callId}] Setting selected note to (fallback):`, {
            id: note.id,
            title: note.title,
          });
          // For fallback without content, set original content to empty
          const noteToSet = {
            ...note,
            originalContent: "",
            originalMarkdown: "",
          };
          setSelectedNote(noteToSet); // Fallback to note without content
        }
      } else {
        // Fallback to the note without content
        console.log(
          `🎯 [${callId}] Setting selected note to (final fallback):`,
          {
            id: note.id,
            title: note.title,
          }
        );
        // For fallback without content, set original content to empty
        const noteToSet = {
          ...note,
          originalContent: "",
          originalMarkdown: "",
        };
        setSelectedNote(noteToSet);
      }
    }
  };

  // Bulk actions handlers
  const handleBulkTagAction = (noteIds) => {
    console.log("Bulk tag action called with noteIds:", noteIds);
    setShowTagDialog(true);
  };

  const handleBulkExport = async (noteIds) => {
    setIsProcessing(true);
    setProcessingStatus({
      current: 0,
      total: noteIds.length,
      operation: "exporting",
    });

    try {
      const notesToExport = notes.filter((note) => noteIds.includes(note.id));
      const JSZip = await import("jszip");
      const zip = new JSZip.default();

      for (let i = 0; i < notesToExport.length; i++) {
        const note = notesToExport[i];
        setProcessingStatus({
          current: i + 1,
          total: notesToExport.length,
          operation: "exporting",
        });

        const noteFolder = zip.folder(note.title || `Note_${note.id}`);
        const markdownContent = `# ${note.title || "Untitled"}\n\n${
          note.content || ""
        }`;
        noteFolder.file(
          `${note.title || `Note_${note.id}`}.md`,
          markdownContent
        );

        if (note.attachments && note.attachments.length > 0) {
          const attachmentsFolder = noteFolder.folder("attachments");
          for (const attachment of note.attachments) {
            try {
              const response = await fetch(
                `${backendUrl}/api/${user.id}/notes/${note.id}/attachments/${attachment.id}`
              );
              if (response.ok) {
                const blob = await response.blob();
                attachmentsFolder.file(attachment.filename, blob);
              }
            } catch (error) {
              console.error(
                `Failed to export attachment ${attachment.filename}:`,
                error
              );
            }
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notes_export_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSelectedNotes(new Set());
    } catch (error) {
      console.error("Export failed:", error);
      setUserMessage("Export failed. Please try again.");
      setUserMessageType("error");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleBulkDelete = async (noteIds) => {
    setIsProcessing(true);
    setProcessingStatus({
      current: 0,
      total: noteIds.length,
      operation: "deleting",
    });

    try {
      const notesToDelete = notes.filter((note) => noteIds.includes(note.id));
      setDeletedNotes(notesToDelete);

      for (let i = 0; i < noteIds.length; i++) {
        const noteId = noteIds[i];
        setProcessingStatus({
          current: i + 1,
          total: noteIds.length,
          operation: "deleting",
        });

        const response = await fetch(
          `${backendUrl}/api/${user.id}/notes/${noteId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete note ${noteId}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setSelectedNotes(new Set());
      await loadNotes();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      setUserMessage("Some notes could not be deleted. Please try again.");
      setUserMessageType("error");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleBulkUndo = async () => {
    console.log("Undo functionality would be implemented here");
    setDeletedNotes([]);
    await loadNotes();
  };

  const handleAddTags = async (noteIds, tagIds) => {
    console.log("Adding tags:", { noteIds, tagIds });
    setIsProcessing(true);
    setProcessingStatus({
      current: 0,
      total: noteIds.length,
      operation: "adding tags",
    });

    try {
      for (let i = 0; i < noteIds.length; i++) {
        const noteId = noteIds[i];
        setProcessingStatus({
          current: i + 1,
          total: noteIds.length,
          operation: "adding tags",
        });

        const note = notes.find((n) => n.id === noteId);
        if (!note) {
          console.warn(`Note not found: ${noteId}`);
          continue;
        }

        const existingTags = note.tags || [];
        const newTags = [...new Set([...existingTags, ...tagIds])];

        console.log(`Updating note ${noteId} with tags:`, {
          existingTags,
          newTags,
        });

        const response = await fetch(
          `${backendUrl}/api/${user.id}/notes/${noteId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadata: { tags: newTags } }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to add tags to note ${noteId}:`, errorText);
          throw new Error(`Failed to add tags to note ${noteId}: ${errorText}`);
        }

        const updatedNote = await response.json();
        console.log(
          `Successfully updated note ${noteId} with tags:`,
          updatedNote
        );
      }

      console.log("🔄 Reloading notes after tag application...");

      // Add a small delay to ensure backend processing is complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Reload data simultaneously to avoid empty state
      await Promise.all([loadNotes(), loadTags()]);

      // Force a second reload to ensure state synchronization
      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadNotes();

      setSelectedNotes(new Set());
      setUserMessage("Tags added successfully!");
      setUserMessageType("success");

      console.log(
        "✅ Tag application completed - notes should now show updated tags."
      );
    } catch (error) {
      console.error("Add tags failed:", error);
      setUserMessage("Failed to add tags. Please try again.");
      setUserMessageType("error");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleRemoveTags = async (noteIds, tagIds) => {
    setIsProcessing(true);
    setProcessingStatus({
      current: 0,
      total: noteIds.length,
      operation: "removing tags",
    });

    try {
      for (let i = 0; i < noteIds.length; i++) {
        const noteId = noteIds[i];
        setProcessingStatus({
          current: i + 1,
          total: noteIds.length,
          operation: "removing tags",
        });

        const note = notes.find((n) => n.id === noteId);
        if (!note) continue;

        const existingTags = note.tags || [];
        const newTags = existingTags.filter((tag) => !tagIds.includes(tag));

        const response = await fetch(
          `${backendUrl}/api/${user.id}/notes/${noteId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ metadata: { tags: newTags } }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to remove tags from note ${noteId}`);
        }
      }

      // Add delay and double reload for consistency with handleAddTags
      await new Promise((resolve) => setTimeout(resolve, 200));
      await Promise.all([loadNotes(), loadTags()]);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await loadNotes();

      setSelectedNotes(new Set());
    } catch (error) {
      console.error("Remove tags failed:", error);
      setUserMessage("Failed to remove tags. Please try again.");
      setUserMessageType("error");
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleCreateTag = async (tagName) => {
    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName, color: "#3B82F6" }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create tag: ${response.status}`);
      }

      const newTag = await response.json();
      await loadTags();
      return newTag;
    } catch (error) {
      console.error("Create tag failed:", error);
      setUserMessage("Failed to create tag. Please try again.");
      setUserMessageType("error");
      return null;
    }
  };

  const noteStats = {
    total: notes.length,
    starred: notes.filter((n) => n.starred).length,
    trash: notes.filter((n) => n.archived).length,
  };

  if (!isAuthenticated) {
    return (
      <RobustErrorBoundary fallbackMessage="The login system encountered an error. Please refresh the page to try again.">
        <AuthenticationFlow onLoginSuccess={handleLoginSuccess} />
      </RobustErrorBoundary>
    );
  }

  return (
    <RobustErrorBoundary
      fallbackMessage="The main application encountered an error. Your notes are safe and will be available after recovery."
      onGoHome={() => {
        setSelectedNote(null);
        setUser(null);
      }}
    >
      {/* User Message Display */}
      {userMessage && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ${
            userMessageType === "error"
              ? "bg-red-100 border border-red-300 text-red-800"
              : userMessageType === "warning"
              ? "bg-yellow-100 border border-yellow-300 text-yellow-800"
              : userMessageType === "success"
              ? "bg-green-100 border border-green-300 text-green-800"
              : "bg-blue-100 border border-blue-300 text-blue-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{userMessage}</span>
            <button
              onClick={() => setUserMessage("")}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div
        className={`h-screen flex bg-gray-50 main-layout-container ${
          isResizing ? "resizing" : ""
        }`}
      >
        {/* Sidebar Panel */}
        <div
          className="bg-white border-r border-gray-200 flex-shrink-0 h-full flex flex-col"
          style={{ width: `${sidebarWidth}px` }}
        >
          <ImprovedSidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            user={user}
            onLogout={handleLogout}
            onShowSettings={() => setShowSettings(true)}
            onShowUserManagement={() => setShowUserManagement(true)}
            onShowAdminInterface={() => setShowAdminInterface(true)}
            onShowEvernoteImport={() => setShowEvernoteImport(true)}
            onNotesUpdate={loadNotes}
            notebooks={notebooks}
            folders={folders}
            tags={tags}
          />
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className="w-1 bg-gray-200 cursor-col-resize flex-shrink-0 resize-handle"
          onMouseDown={(e) => handleMouseDown(e, "sidebar")}
        />

        {/* Notes List Panel */}
        <div
          className="border-r border-gray-200 flex-shrink-0 h-full flex flex-col"
          style={{ width: `${notesListWidth}px` }}
        >
          <RobustErrorBoundary
            fallbackMessage="The notes list encountered an error. Your notes are safe."
            additionalInfo="Try refreshing the page if this persists."
          >
            <ImprovedNotesList
              notes={notes}
              selectedNote={selectedNote}
              onSelectNote={handleNoteSelection}
              onCreateNewNote={createNewNote}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              userId={user?.id}
              onNotesRefresh={loadNotes}
              onNotesUpdate={updateNotesOptimistically}
              currentView={currentView}
              currentViewParams={currentViewParams}
              onViewChange={handleViewChange}
              notebooks={notebooks}
              folders={folders}
              tags={tags}
              selectedNotes={selectedNotes}
              onSelectedNotesChange={setSelectedNotes}
              onBulkTagAction={handleBulkTagAction}
              onBulkExport={handleBulkExport}
              onBulkDelete={handleBulkDelete}
              onBulkUndo={handleBulkUndo}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
              deletedNotes={deletedNotes}
            />
          </RobustErrorBoundary>
        </div>

        {/* Notes List Resize Handle */}
        <div
          className="w-1 bg-gray-200 cursor-col-resize flex-shrink-0 resize-handle"
          onMouseDown={(e) => handleMouseDown(e, "notesList")}
        />

        {/* Main Content Panel */}
        <div className="flex-1 min-w-0 h-full flex flex-col">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              userId={user?.id}
              onSave={handleNoteSave}
              onContentChange={handleNoteContentChange}
              onDelete={handleNoteDelete}
              onNoteUpdate={handleNoteUpdate}
              availableTags={tags}
            >
              <RobustErrorBoundary
                fallbackMessage="The note editor encountered an error. Your note content is safe."
                additionalInfo="Try selecting a different note or refreshing the page."
              >
                <TipTapEditor
                  note={selectedNote}
                  userId={user?.id}
                  onSave={handleNoteSave}
                  onContentChange={handleNoteContentChange}
                  availableTags={tags}
                  onTagsUpdate={loadTags}
                />
              </RobustErrorBoundary>
            </NoteEditor>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 to-white">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <FileText size={40} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  Select a note to edit
                </h3>
                <p className="text-slate-600 mb-6">
                  Choose a note from the list or create a new one with the new
                  TipTap editor!
                </p>
                <button
                  onClick={createNewNote}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-md"
                >
                  <Plus size={20} />
                  <span>Create New Note</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Settings Modal - Only for Admins */}
        {user?.isAdmin && (
          <AdminSettings
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            currentPath={storageService.notesPath}
            onPathChange={handleStoragePathChange}
          />
        )}

        {/* Regular User Settings Modal - For Non-Admins */}
        {!user?.isAdmin && showSettings && (
          <UserManagement user={user} onClose={() => setShowSettings(false)} />
        )}

        {/* User Management Modal */}
        {showUserManagement && (
          <UserManagement
            user={user}
            onClose={() => setShowUserManagement(false)}
          />
        )}

        {/* Admin Interface Modal */}
        {showAdminInterface && (
          <AdminInterface
            user={user}
            onClose={() => setShowAdminInterface(false)}
          />
        )}

        {/* Evernote Import Modal */}
        {showEvernoteImport && (
          <EvernoteImport
            userId={user?.id}
            onClose={() => setShowEvernoteImport(false)}
            onImportComplete={async (results) => {
              console.log("🔄 Import complete callback triggered", results);
              setShowEvernoteImport(false);

              // Add a small delay to ensure backend has finished processing
              console.log("⏱️ Waiting 500ms for backend processing...");
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Refresh all data to show imported content
              console.log("🔄 Refreshing notes...");
              await loadNotes(); // Refresh notes after import

              console.log("🔄 Refreshing notebooks...");
              await loadNotebooks(); // Refresh notebooks after import

              console.log("🔄 Refreshing folders...");
              await loadFolders(); // Refresh folders after import

              console.log("🔄 Refreshing tags...");
              await loadTags(); // Refresh tags after import

              console.log("✅ Import complete, data refreshed");
              console.log("📊 Current notebooks:", notebooks);
              console.log("📊 Current folders:", folders);
              console.log("📊 Current notes:", notes);
            }}
          />
        )}

        {/* Note Version History Modal */}
        {showVersionHistory && selectedNote && (
          <NoteVersionHistory
            noteId={selectedNote.id}
            onClose={() => setShowVersionHistory(false)}
          />
        )}

        {/* Tag Management Dialog */}
        {showTagDialog && (
          <TagManagementDialog
            isOpen={showTagDialog}
            onClose={() => setShowTagDialog(false)}
            selectedNotes={Array.from(selectedNotes)
              .map((noteId) => notes.find((note) => note.id === noteId))
              .filter(Boolean)}
            availableTags={tags}
            onAddTags={handleAddTags}
            onRemoveTags={handleRemoveTags}
            onCreateTag={handleCreateTag}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
          />
        )}
      </div>
    </RobustErrorBoundary>
  );
};

export default NoetTipTapApp;
