import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  createEditor,
  Transforms,
  Editor,
  Text,
  Element as SlateElement,
  Node,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
  useSelected,
  useFocused,
} from "slate-react";
import { withHistory } from "slate-history";
import {
  Search,
  Plus,
  MoreHorizontal,
  X,
  Settings,
  LogOut,
  FileText,
  Bookmark,
  Folder,
  Hash,
  Trash2,
  Share,
  Save,
  Clock,
  Tag,
  Filter,
  SortAsc,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Image,
  Paperclip,
  Shield,
  Smartphone,
  Key,
  AlertTriangle,
  Download,
  Upload,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  UserMinus,
  History,
  ChevronLeft,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Link,
  Highlighter,
  Archive,
  Star,
  Calendar,
  Layers,
  Menu,
  SearchX,
  FolderPlus,
  TagIcon,
  MousePointer,
  Home,
  Inbox,
  Archive as ArchiveIcon,
  Trash,
  Notebook,
  Bell,
} from "lucide-react";

// ========== SLATE EDITOR UTILITIES ==========
const initialValue = [
  {
    type: "paragraph",
    children: [
      {
        text: "Welcome to your new note! Try the formatting options in the toolbar above.",
      },
    ],
  },
];

// Slate helper functions
const LIST_TYPES = ["numbered-list", "bulleted-list"];
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"];

const isBlockActive = (editor, format, blockType = "type") => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        n[blockType] === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(
    editor,
    format,
    TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
  );
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes(n.type) &&
      !TEXT_ALIGN_TYPES.includes(format),
    split: true,
  });

  let newProperties;
  if (TEXT_ALIGN_TYPES.includes(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? "paragraph" : isList ? "list-item" : format,
    };
  }

  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// ========== AUTHENTICATION COMPONENT ==========

const AuthenticationFlow = ({
  users,
  setUsers,
  onLoginSuccess,
  onSecurityLog,
}) => {
  const [authStep, setAuthStep] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (authStep === "otp") {
      const foundUser = users.find((u) => u.email === email);
      if (!foundUser) {
        setLoginError("User not found.");
        return;
      }

      if (otp === "123456" || otp === "000000") {
        completeLogin(foundUser);
        return;
      }

      setLoginError(
        "Invalid verification code. Try demo codes: 123456 or 000000"
      );
      return;
    }

    if (!email || !password) {
      setLoginError("Please enter both email and password");
      return;
    }

    const foundUser = users.find((u) => u.email === email);

    if (!foundUser) {
      setLoginError("Account not found. Please check your email address.");
      onSecurityLog("login_failed", { email, reason: "account_not_found" });
      return;
    }

    if (foundUser.password !== password) {
      setLoginError("Incorrect password. Please try again.");
      onSecurityLog("login_failed", { email, reason: "incorrect_password" });
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === foundUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);

    if (foundUser.otpEnabled) {
      setAuthStep("otp");
      return;
    }

    completeLogin(foundUser);
  };

  const completeLogin = (user) => {
    const sessionId = Date.now().toString();
    const userWithSession = { ...user, sessionId };
    onSecurityLog("login_success");
    onLoginSuccess(userWithSession);
  };

  if (authStep === "otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
          <div className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setLoginError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              placeholder="123456"
              maxLength={6}
              onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">
              Demo codes: 123456 or 000000
            </p>
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm text-red-700">{loginError}</span>
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
            >
              Verify & Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <svg
            width="120"
            height="120"
            viewBox="0 0 400 400"
            className="mx-auto mb-6"
          >
            <rect
              x="60"
              y="40"
              width="240"
              height="280"
              rx="25"
              ry="25"
              fill="#1e40af"
              stroke="none"
            />
            <rect
              x="80"
              y="60"
              width="200"
              height="240"
              rx="15"
              ry="15"
              fill="#ffffff"
            />
            <rect
              x="100"
              y="100"
              width="100"
              height="8"
              rx="4"
              fill="#2563eb"
            />
            <rect x="100" y="120" width="80" height="8" rx="4" fill="#2563eb" />
            <rect x="100" y="140" width="60" height="8" rx="4" fill="#2563eb" />
          </svg>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        <div className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setLoginError("");
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="demo@example.com"
            onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
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
              onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
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
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Demo Accounts
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Email: demo@example.com | Password: demo123</div>
            <div>Email: admin@example.com | Password: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== ENHANCED SIDEBAR COMPONENT ==========

const Sidebar = ({
  currentView,
  setCurrentView,
  notebooks,
  folders,
  tags,
  user,
  onLogout,
  notes,
  trashedNotes,
  onCreateNotebook,
  onCreateFolder,
}) => {
  const [showNotebooks, setShowNotebooks] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showFolders, setShowFolders] = useState(true);

  const sidebarItems = [
    {
      id: "inbox",
      label: "All Notes",
      icon: <Home size={18} />,
      count: notes?.length || 0,
    },
    {
      id: "starred",
      label: "Starred",
      icon: <Star size={18} />,
      count: notes?.filter((n) => n.starred)?.length || 0,
    },
    {
      id: "recent",
      label: "Recent",
      icon: <Clock size={18} />,
      count:
        notes?.filter((n) => {
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return new Date(n.updated) > dayAgo;
        })?.length || 0,
    },
    {
      id: "trash",
      label: "Trash",
      icon: <Trash size={18} />,
      count: trashedNotes?.length || 0,
    },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Noet</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {}}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Welcome, {user?.name || "User"}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                currentView === item.id
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notebooks Section */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowNotebooks(!showNotebooks)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ChevronRight
                size={14}
                className={`transform transition-transform ${
                  showNotebooks ? "rotate-90" : ""
                }`}
              />
              <span>Notebooks</span>
            </button>
            <button
              onClick={onCreateNotebook}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Create Notebook"
            >
              <Plus size={14} />
            </button>
          </div>
          {showNotebooks && (
            <div className="ml-4 space-y-1">
              {notebooks?.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => setCurrentView(`notebook-${notebook.id}`)}
                  className={`w-full flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                    currentView === `notebook-${notebook.id}`
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <Notebook size={14} />
                  <span>{notebook.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <ChevronRight
                size={14}
                className={`transform transition-transform ${
                  showTags ? "rotate-90" : ""
                }`}
              />
              <span>Tags</span>
            </button>
            <button
              onClick={() => {}}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Manage Tags"
            >
              <Plus size={14} />
            </button>
          </div>
          {showTags && (
            <div className="ml-4 space-y-1">
              {tags?.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setCurrentView(`tag-${tag}`)}
                  className={`w-full flex items-center space-x-2 p-2 rounded text-sm transition-colors ${
                    currentView === `tag-${tag}`
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <TagIcon size={14} />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== ENHANCED NOTES LIST COMPONENT ==========

const NotesList = ({
  notes,
  selectedNote,
  setSelectedNote,
  currentView,
  onCreateNote,
  searchTerm,
  setSearchTerm,
  trashedNotes,
}) => {
  const [sortBy, setSortBy] = useState("updated");
  const [showSearch, setShowSearch] = useState(false);

  // Filter notes based on current view
  const getFilteredNotes = () => {
    let filtered = notes || [];

    switch (currentView) {
      case "starred":
        filtered = filtered.filter((note) => note.starred);
        break;
      case "recent":
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter((note) => new Date(note.updated) > dayAgo);
        break;
      case "trash":
        filtered = trashedNotes || [];
        break;
      default:
        if (currentView.startsWith("notebook-")) {
          const notebookId = parseInt(currentView.split("-")[1]);
          filtered = filtered.filter((note) => note.notebook === notebookId);
        } else if (currentView.startsWith("tag-")) {
          const tag = currentView.split("-")[1];
          filtered = filtered.filter((note) => note.tags?.includes(tag));
        }
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort notes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "created":
          return new Date(b.created) - new Date(a.created);
        default: // updated
          return new Date(b.updated) - new Date(a.updated);
      }
    });

    return filtered;
  };

  const filteredNotes = getFilteredNotes();

  const getViewTitle = () => {
    switch (currentView) {
      case "inbox":
        return "All Notes";
      case "starred":
        return "Starred Notes";
      case "recent":
        return "Recent Notes";
      case "trash":
        return "Trash";
      default:
        if (currentView.startsWith("notebook-")) return "Notebook";
        if (currentView.startsWith("tag-"))
          return `#${currentView.split("-")[1]}`;
        return "Notes";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const getPreviewText = (content) => {
    try {
      const parsed = JSON.parse(content);
      const text = parsed
        .map((node) => node.children?.map((child) => child.text).join("") || "")
        .join(" ");
      return text.slice(0, 150) + (text.length > 150 ? "..." : "");
    } catch {
      return "No preview available";
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {getViewTitle()}
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Search"
            >
              <Search size={16} />
            </button>
            <button
              onClick={onCreateNote}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Note"
            >
              <Plus size={16} />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="More Options"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mb-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{filteredNotes.length} notes</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-gray-600 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="updated">Last modified</option>
            <option value="created">Date created</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No notes found</p>
            <p className="text-sm">Create your first note to get started!</p>
            <button
              onClick={onCreateNote}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Note
            </button>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                  selectedNote?.id === note.id
                    ? "bg-blue-50 border-blue-200"
                    : "hover:bg-gray-50 border-transparent"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {note.title || "Untitled Note"}
                  </h3>
                  {note.starred && (
                    <Star size={14} className="text-yellow-500 ml-2" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                  {getPreviewText(note.content)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(note.updated)}</span>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span className="text-gray-400">
                          +{note.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ========== ENHANCED NOTE EDITOR ==========

const NoteEditor = ({
  selectedNote,
  setSelectedNote,
  notes,
  setNotes,
  tags,
  onAddTag,
  onRemoveTag,
  onShowTagModal,
  user,
  setUsers,
  onCreateNewNote,
}) => {
  const [noteTitle, setNoteTitle] = useState("");
  const [value, setValue] = useState(initialValue);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [lastVersionTime, setLastVersionTime] = useState(null);
  const editor = useRef(withHistory(withReact(createEditor())));

  // Load note content as Slate value
  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title || "Untitled Note");
      try {
        setValue(
          selectedNote.content ? JSON.parse(selectedNote.content) : initialValue
        );
      } catch {
        setValue(initialValue);
      }
      setViewingVersion(null);
      setShowVersionHistory(false);
    }
  }, [selectedNote]);

  // Save note on change
  const saveCurrentNote = useCallback(() => {
    if (!selectedNote) return;
    const newTitle = noteTitle || "Untitled Note";
    const newContent = JSON.stringify(value);
    const updatedNote = {
      ...selectedNote,
      title: newTitle,
      content: newContent,
      updated: new Date().toISOString(),
    };
    const updatedNotes = notes.map((note) =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, notes: updatedNotes } : u))
      );
    }
  }, [
    noteTitle,
    value,
    selectedNote,
    notes,
    setNotes,
    setSelectedNote,
    setUsers,
    user,
  ]);

  // Auto-save
  useEffect(() => {
    if (selectedNote) {
      const timeout = setTimeout(saveCurrentNote, 2000);
      return () => clearTimeout(timeout);
    }
  }, [noteTitle, value, selectedNote, saveCurrentNote]);

  // Render leaf for marks
  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (leaf.italic) {
      children = <em>{children}</em>;
    }
    if (leaf.underline) {
      children = <u>{children}</u>;
    }
    if (leaf.code) {
      children = (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    if (leaf.color) {
      children = <span style={{ color: leaf.color }}>{children}</span>;
    }
    if (leaf.backgroundColor) {
      children = (
        <span style={{ backgroundColor: leaf.backgroundColor }}>
          {children}
        </span>
      );
    }
    return <span {...attributes}>{children}</span>;
  }, []);

  // Render element for blocks
  const renderElement = useCallback(({ attributes, children, element }) => {
    const style = { textAlign: element.align };

    switch (element.type) {
      case "block-quote":
        return (
          <blockquote
            style={style}
            {...attributes}
            className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4"
          >
            {children}
          </blockquote>
        );
      case "bulleted-list":
        return (
          <ul style={style} {...attributes} className="list-disc ml-6 my-2">
            {children}
          </ul>
        );
      case "heading-one":
        return (
          <h1 style={style} {...attributes} className="text-3xl font-bold my-4">
            {children}
          </h1>
        );
      case "heading-two":
        return (
          <h2
            style={style}
            {...attributes}
            className="text-2xl font-semibold my-3"
          >
            {children}
          </h2>
        );
      case "heading-three":
        return (
          <h3
            style={style}
            {...attributes}
            className="text-xl font-medium my-2"
          >
            {children}
          </h3>
        );
      case "list-item":
        return (
          <li style={style} {...attributes} className="my-1">
            {children}
          </li>
        );
      case "numbered-list":
        return (
          <ol style={style} {...attributes} className="list-decimal ml-6 my-2">
            {children}
          </ol>
        );
      case "code-block":
        return (
          <pre
            {...attributes}
            className="bg-gray-100 p-4 rounded-md my-4 overflow-x-auto"
          >
            <code>{children}</code>
          </pre>
        );
      case "link":
        return (
          <a
            {...attributes}
            href={element.url}
            className="text-blue-600 underline hover:text-blue-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        );
      default:
        return (
          <p style={style} {...attributes} className="my-2">
            {children}
          </p>
        );
    }
  }, []);

  // Keyboard shortcuts
  const onKeyDown = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case "b":
        event.preventDefault();
        toggleMark(editor.current, "bold");
        break;
      case "i":
        event.preventDefault();
        toggleMark(editor.current, "italic");
        break;
      case "u":
        event.preventDefault();
        toggleMark(editor.current, "underline");
        break;
      case "`":
        event.preventDefault();
        toggleMark(editor.current, "code");
        break;
      case "s":
        event.preventDefault();
        saveCurrentNote();
        break;
      default:
        break;
    }
  };

  // Toolbar Component
  const Toolbar = () => {
    const editor = useSlate();

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <MarkButton format="bold" icon={<Bold size={16} />} />
        <MarkButton format="italic" icon={<Italic size={16} />} />
        <MarkButton format="underline" icon={<Underline size={16} />} />
        <MarkButton format="code" icon={<Code size={16} />} />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Headings */}
        <BlockButton format="heading-one" icon={<Heading1 size={16} />} />
        <BlockButton format="heading-two" icon={<Heading2 size={16} />} />
        <BlockButton format="heading-three" icon={<Heading3 size={16} />} />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Lists */}
        <BlockButton format="numbered-list" icon={<ListOrdered size={16} />} />
        <BlockButton format="bulleted-list" icon={<List size={16} />} />
        <BlockButton format="block-quote" icon={<Quote size={16} />} />
        <BlockButton format="code-block" icon={<Code size={16} />} />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Alignment */}
        <BlockButton format="left" icon={<AlignLeft size={16} />} />
        <BlockButton format="center" icon={<AlignCenter size={16} />} />
        <BlockButton format="right" icon={<AlignRight size={16} />} />

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Additional Tools */}
        <button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Add Link"
          onClick={() => {
            const url = window.prompt("Enter the URL of the link:");
            if (url && !Editor.string(editor, editor.selection) === "") {
              const link = { type: "link", url, children: [{ text: url }] };
              Transforms.insertNodes(editor, link);
            }
          }}
        >
          <Link size={16} />
        </button>

        <button
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Insert Image"
          onClick={() => {
            const url = window.prompt("Enter the URL of the image:");
            if (url) {
              const image = { type: "image", url, children: [{ text: "" }] };
              Transforms.insertNodes(editor, image);
            }
          }}
        >
          <Image size={16} />
        </button>
      </div>
    );
  };

  // Mark Button Component
  const MarkButton = ({ format, icon }) => {
    const editor = useSlate();
    return (
      <button
        className={`p-2 rounded-lg transition-colors ${
          isMarkActive(editor, format)
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-slate-100"
        }`}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
      >
        {icon}
      </button>
    );
  };

  // Block Button Component
  const BlockButton = ({ format, icon }) => {
    const editor = useSlate();
    return (
      <button
        className={`p-2 rounded-lg transition-colors ${
          isBlockActive(
            editor,
            format,
            TEXT_ALIGN_TYPES.includes(format) ? "align" : "type"
          )
            ? "bg-blue-100 text-blue-700"
            : "hover:bg-slate-100"
        }`}
        onMouseDown={(event) => {
          event.preventDefault();
          toggleBlock(editor, format);
        }}
      >
        {icon}
      </button>
    );
  };

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
            <FileText size={40} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">
            Select a note to edit
          </h3>
          <p className="text-slate-600 mb-6">
            Choose a note from the list or create a new one to start writing
            with our enhanced rich text editor.
          </p>
          <button
            onClick={onCreateNewNote}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-md"
          >
            <Plus size={20} />
            <span>Create New Note</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder-slate-400"
              placeholder="Untitled Note"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={saveCurrentNote}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Save Note (Ctrl+S)"
              >
                <Save size={16} />
              </button>
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Version History"
              >
                <History size={16} />
              </button>
              <button
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Share Note"
              >
                <Share size={16} />
              </button>
            </div>
          </div>

          {/* Enhanced Toolbar */}
          <Slate editor={editor.current} value={value} onChange={setValue}>
            <Toolbar />
          </Slate>
        </div>

        {/* Slate Editor */}
        <div className="flex-1 p-6 overflow-y-auto bg-white relative">
          <Slate editor={editor.current} value={value} onChange={setValue}>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={onKeyDown}
              placeholder="Start writing your note..."
              spellCheck
              autoFocus
              className="note-editor w-full h-full outline-none text-slate-900 leading-relaxed prose prose-lg max-w-none"
              style={{
                minHeight: "500px",
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: "16px",
                lineHeight: "1.6",
              }}
            />
          </Slate>
        </div>
      </div>
    </div>
  );
};

// ========== MAIN APP COMPONENT ==========

const NoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // User management with enhanced security
  const [users, setUsers] = useState([
    {
      id: 1,
      email: "demo@example.com",
      name: "Demo User",
      password: "demo123",
      sessionTimeout: 30,
      otpEnabled: false,
      otpSecret: null,
      backupCodes: [],
      lastLogin: null,
      securityLog: [],
      isAdmin: false,
      createdAt: new Date("2024-01-01").toISOString(),
      notes: [
        {
          id: 1001,
          title: "Welcome to Noet!",
          content: JSON.stringify([
            {
              type: "heading-one",
              children: [{ text: "Welcome to Noet!" }],
            },
            {
              type: "paragraph",
              children: [
                {
                  text: "This is your demo account. Try out all the features:",
                },
              ],
            },
            {
              type: "bulleted-list",
              children: [
                {
                  type: "list-item",
                  children: [
                    { text: "Rich text formatting with " },
                    { text: "bold", bold: true },
                    { text: ", " },
                    { text: "italic", italic: true },
                    { text: ", and " },
                    { text: "underline", underline: true },
                  ],
                },
                {
                  type: "list-item",
                  children: [{ text: "Create lists, headings, and quotes" }],
                },
                {
                  type: "list-item",
                  children: [
                    { text: "Organize notes with tags and notebooks" },
                  ],
                },
                {
                  type: "list-item",
                  children: [{ text: "Search and filter your notes" }],
                },
              ],
            },
            {
              type: "paragraph",
              children: [{ text: "Start writing your first note!" }],
            },
          ]),
          tags: ["demo", "welcome"],
          notebook: 1,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          starred: true,
          versions: [],
        },
        {
          id: 1002,
          title: "Getting Started Tips",
          content: JSON.stringify([
            {
              type: "heading-two",
              children: [{ text: "Tips for using Noet" }],
            },
            {
              type: "numbered-list",
              children: [
                {
                  type: "list-item",
                  children: [
                    { text: "Use Ctrl+B for bold, Ctrl+I for italic" },
                  ],
                },
                {
                  type: "list-item",
                  children: [
                    { text: "Try the toolbar for more formatting options" },
                  ],
                },
                {
                  type: "list-item",
                  children: [{ text: "Notes auto-save as you type" }],
                },
                {
                  type: "list-item",
                  children: [{ text: "Use tags to organize your content" }],
                },
              ],
            },
          ]),
          tags: ["tips", "help"],
          notebook: 1,
          created: new Date(Date.now() - 86400000).toISOString(),
          updated: new Date(Date.now() - 3600000).toISOString(),
          starred: false,
          versions: [],
        },
      ],
      notebooks: [
        { id: 1, name: "Getting Started", isShortcut: false, folderId: null },
        { id: 2, name: "Personal Notes", isShortcut: false, folderId: null },
      ],
      folders: [
        { id: 1, name: "Work Projects", parentId: null },
        { id: 2, name: "Personal", parentId: null },
      ],
      tags: ["demo", "welcome", "tips", "help", "important", "todo"],
      trashedNotes: [],
      files: {},
    },
    {
      id: 2,
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123",
      sessionTimeout: 15,
      otpEnabled: false,
      otpSecret: null,
      backupCodes: [],
      lastLogin: null,
      securityLog: [],
      isAdmin: true,
      createdAt: new Date("2024-01-01").toISOString(),
      notes: [
        {
          id: 2001,
          title: "Admin Dashboard",
          content: JSON.stringify(initialValue),
          tags: ["admin"],
          notebook: 1,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          starred: false,
          versions: [],
        },
      ],
      notebooks: [
        { id: 1, name: "Admin Archive", isShortcut: false, folderId: null },
        { id: 2, name: "System Notes", isShortcut: false, folderId: null },
      ],
      folders: [
        { id: 1, name: "Administration", parentId: null },
        { id: 2, name: "System", parentId: null },
      ],
      tags: ["admin", "system", "urgent"],
      trashedNotes: [],
      files: {},
    },
  ]);

  // Current user data
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [files, setFiles] = useState({});

  // UI States
  const [currentView, setCurrentView] = useState("inbox");
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load user data when user changes
  useEffect(() => {
    if (user?.id) {
      const currentUser = users.find((u) => u.id === user.id);
      if (currentUser) {
        setNotes(currentUser.notes || []);
        setNotebooks(currentUser.notebooks || []);
        setFolders(currentUser.folders || []);
        setTags(currentUser.tags || []);
        setTrashedNotes(currentUser.trashedNotes || []);
        setFiles(currentUser.files || {});
        // Auto-select first note
        if (currentUser.notes && currentUser.notes.length > 0) {
          setSelectedNote(currentUser.notes[0]);
        }
      }
    } else {
      setNotes([]);
      setNotebooks([]);
      setFolders([]);
      setTags([]);
      setTrashedNotes([]);
      setFiles({});
    }
  }, [user, users]);

  // Auth functions
  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView("inbox");
    setSelectedNotebook(null);
    setSelectedNote(null);
  };

  // Enhanced security logging
  const logSecurityEvent = (event, details = {}) => {
    if (!user?.id) return;
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      ip: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              securityLog: [...(u.securityLog || []), logEntry].slice(-50),
            }
          : u
      )
    );
  };

  // Enhanced note management
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "Untitled Note",
      content: JSON.stringify(initialValue),
      tags: [],
      notebook: selectedNotebook?.id || null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      starred: false,
      versions: [],
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedNote(newNote);
    if (user?.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, notes: updatedNotes } : u))
      );
    }
  };

  const addTagToNote = (tagName) => {
    if (!selectedNote || selectedNote.tags?.includes(tagName)) return;
    const updatedNote = {
      ...selectedNote,
      tags: [...(selectedNote.tags || []), tagName],
    };
    const updatedNotes = notes.map((note) =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, notes: updatedNotes } : u))
      );
    }
  };

  const removeTagFromNote = (tagName) => {
    if (!selectedNote) return;
    const updatedNote = {
      ...selectedNote,
      tags: selectedNote.tags?.filter((tag) => tag !== tagName) || [],
    };
    const updatedNotes = notes.map((note) =>
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, notes: updatedNotes } : u))
      );
    }
  };

  const showTagModal = () => {
    // Placeholder for tag modal
  };

  const createNotebook = () => {
    const name = window.prompt("Enter notebook name:");
    if (name) {
      const newNotebook = {
        id: Date.now(),
        name,
        isShortcut: false,
        folderId: null,
      };
      const updatedNotebooks = [...notebooks, newNotebook];
      setNotebooks(updatedNotebooks);
      if (user?.id) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, notebooks: updatedNotebooks } : u
          )
        );
      }
    }
  };

  const createFolder = () => {
    const name = window.prompt("Enter folder name:");
    if (name) {
      const newFolder = {
        id: Date.now(),
        name,
        parentId: null,
      };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      if (user?.id) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, folders: updatedFolders } : u
          )
        );
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthenticationFlow
        users={users}
        setUsers={setUsers}
        onLoginSuccess={handleLoginSuccess}
        onSecurityLog={logSecurityEvent}
      />
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        notebooks={notebooks}
        folders={folders}
        tags={tags}
        user={user}
        onLogout={handleLogout}
        notes={notes}
        trashedNotes={trashedNotes}
        onCreateNotebook={createNotebook}
        onCreateFolder={createFolder}
      />
      <NotesList
        notes={notes}
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        currentView={currentView}
        onCreateNote={createNewNote}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        trashedNotes={trashedNotes}
      />
      <NoteEditor
        selectedNote={selectedNote}
        setSelectedNote={setSelectedNote}
        notes={notes}
        setNotes={setNotes}
        tags={tags}
        onAddTag={addTagToNote}
        onRemoveTag={removeTagFromNote}
        onShowTagModal={showTagModal}
        user={user}
        setUsers={setUsers}
        onCreateNewNote={createNewNote}
      />
    </div>
  );
};

export default NoetApp;
