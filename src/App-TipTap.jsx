import React, { useState, useEffect } from "react";
import {
  TipTapEditor,
  NoteStorageService,
  AdminSettings,
} from "./TipTapEditor.jsx";
import ImprovedNotesList from "./components/ImprovedNotesList.jsx";
import NoteEditor from "./components/NoteEditor.jsx";
import ImprovedSidebar from "./components/ImprovedSidebar.jsx";
import UserManagement from "./components/UserManagement.jsx";
import NoteVersionHistory from "./components/NoteVersionHistory.jsx";
import EvernoteImport from "./components/EvernoteImport.jsx";
import DragDropManager from "./components/DragDropManager.jsx";
import RobustErrorBoundary from "./components/RobustErrorBoundary.jsx";
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
} from "lucide-react";

// Simple Authentication Component
const AuthenticationFlow = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }

    if (email === "demo@example.com" && password === "demo123") {
      onLoginSuccess({
        id: "user-1",
        email,
        name: "Demo User",
        isAdmin: false,
      });
    } else if (email === "admin@example.com" && password === "admin123") {
      onLoginSuccess({
        id: "admin-1",
        email,
        name: "Admin User",
        isAdmin: true,
      });
    } else {
      setLoginError(
        "Invalid credentials. Try demo@example.com / demo123 or admin@example.com / admin123"
      );
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
          <NavItem
            icon={Settings}
            title="Admin Settings"
            isActive={false}
            onClick={onShowSettings}
            className="py-2"
          />
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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showEvernoteImport, setShowEvernoteImport] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [userMessageType, setUserMessageType] = useState("info");
  const [storageService] = useState(new NoteStorageService());
  const [backendUrl, setBackendUrl] = useState("");

  // Set up error recovery service user message handler
  useEffect(() => {
    errorRecoveryService.setUserMessageHandler((message, type) => {
      setUserMessage(message);
      setUserMessageType(type);
      // Clear message after 5 seconds
      setTimeout(() => setUserMessage(""), 5000);
    });
  }, []);

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

  // Load notes from API
  const loadNotes = async () => {
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
      console.error("Error loading notes:", error);

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
  };

  // Load notebooks from backend
  const loadNotebooks = async () => {
    if (!validateUser(user) || !backendUrl) {
      console.warn("Cannot load notebooks: missing user or backend URL");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/${user.id}/notebooks`);
      if (!response.ok) {
        throw new Error(`Failed to load notebooks: ${response.status}`);
      }
      const notebooksData = await response.json();
      console.log(`✅ Loaded ${notebooksData.length} notebooks`);
      setNotebooks(notebooksData);
    } catch (error) {
      console.error("Error loading notebooks:", error);
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
      setTags(tagsData);
    } catch (error) {
      console.error("Error loading tags:", error);
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
      console.error("Error loading folders:", error);
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

  const handleViewChange = (view, params = {}) => {
    setCurrentView(view);
    setCurrentViewParams(params);
    setSelectedNote(null); // Clear selection when changing views
  };

  const handleLoginSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);

    // Notes will be loaded automatically by the useEffect
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setCurrentView("all");
  };

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
    // Update local state immediately for better UX
    setSelectedNote((prev) => (prev ? { ...prev, content, markdown } : null));
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, content, markdown } : n))
    );
  };

  const handleNoteSave = async (note) => {
    if (!note || !user?.id) return;

    try {
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notes/${note.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            markdown: note.markdown,
            tags: note.tags,
            notebook: note.notebook,
            folder: note.folder,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save note");

      const updatedNote = await response.json();

      // Update local state
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );
      setSelectedNote(updatedNote);

      console.log("✅ Note saved successfully");
    } catch (error) {
      console.error("Error saving note:", error);
      throw error; // Re-throw to let the editor handle the error
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
    console.log("handleNoteSelection called with:", note);

    // Validate note with comprehensive validation
    if (!validateNote(note)) {
      const errorMsg = "Invalid note object passed to handleNoteSelection";
      console.error(errorMsg, note);

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
        "Missing user ID or backend URL, setting note without content"
      );
      console.warn("User:", user, "Backend URL:", backendUrl);
      setSelectedNote(note);
      return;
    }

    try {
      // Fetch the full note content with error recovery
      const response = await fetch(
        `${backendUrl}/api/${user.id}/notes/${note.id}`
      );
      if (!response.ok)
        throw new Error(`Failed to load note content: ${response.status}`);

      const fullNote = await response.json();

      // Validate the response
      if (!validateNote(fullNote)) {
        throw new Error("Invalid note data received from server");
      }

      console.log("✅ Loaded full note content for:", fullNote.title);
      setSelectedNote(fullNote);
    } catch (error) {
      console.error("Error loading note content:", error);

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
          setSelectedNote(recoveryResult.result);
        } else {
          setSelectedNote(note); // Fallback to note without content
        }
      } else {
        // Fallback to the note without content
        setSelectedNote(note);
      }
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

      <div className="h-screen flex bg-gray-50">
        <ImprovedSidebar
          currentView={currentView}
          onViewChange={handleViewChange}
          user={user}
          onLogout={handleLogout}
          onShowSettings={() => setShowSettings(true)}
          onShowUserManagement={() => setShowUserManagement(true)}
          onShowEvernoteImport={() => setShowEvernoteImport(true)}
          onNotesUpdate={loadNotes}
        />

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
            currentView={currentView}
            currentViewParams={currentViewParams}
            onViewChange={handleViewChange}
            notebooks={notebooks}
            folders={folders}
            tags={tags}
            className="w-96"
          />
        </RobustErrorBoundary>

        <div className="flex-1">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              userId={user?.id}
              onSave={handleNoteSave}
              onContentChange={handleNoteContentChange}
              onDelete={handleNoteDelete}
              onNoteUpdate={handleNoteUpdate}
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

        {/* Admin Settings Modal */}
        <AdminSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentPath={storageService.notesPath}
          onPathChange={handleStoragePathChange}
        />

        {/* User Management Modal */}
        {showUserManagement && (
          <UserManagement
            user={user}
            onClose={() => setShowUserManagement(false)}
          />
        )}

        {/* Evernote Import Modal */}
        {showEvernoteImport && (
          <EvernoteImport
            userId={user?.id}
            onClose={() => setShowEvernoteImport(false)}
            onImportComplete={() => {
              setShowEvernoteImport(false);
              loadNotes(); // Refresh notes after import
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
      </div>
    </RobustErrorBoundary>
  );
};

export default NoetTipTapApp;
