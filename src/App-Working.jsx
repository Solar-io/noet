import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  createEditor,
  Transforms,
  Editor,
  Text,
  Element as SlateElement,
} from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import {
  Bold,
  Italic,
  Underline,
  Plus,
  FileText,
  Eye,
  EyeOff,
  AlertTriangle,
  List,
  ListOrdered,
  Search,
  Star,
  Trash2,
  Folder,
  Tag,
  Settings,
} from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong!
            </h1>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced initial value for Slate with different element types
const initialValue = [
  {
    type: "paragraph",
    children: [{ text: "Welcome to your new note! This editor supports:" }],
  },
  {
    type: "bulleted-list",
    children: [
      {
        type: "list-item",
        children: [{ text: "Bold, italic, and underline formatting" }],
      },
      {
        type: "list-item",
        children: [{ text: "Bulleted and numbered lists" }],
      },
      {
        type: "list-item",
        children: [{ text: "Press Enter twice to exit lists" }],
      },
    ],
  },
  {
    type: "paragraph",
    children: [{ text: "Start typing to begin your note!" }],
  },
];

// Authentication Component
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
        id: 1,
        email,
        name: "Demo User",
        notes: [
          {
            id: 1001,
            title: "Welcome Note",
            content: JSON.stringify(initialValue),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        ],
      });
    } else if (email === "admin@example.com" && password === "admin123") {
      onLoginSuccess({
        id: 2,
        email,
        name: "Admin User",
        notes: [
          {
            id: 2001,
            title: "Admin Note",
            content: JSON.stringify(initialValue),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
          },
        ],
      });
    } else {
      setLoginError("Invalid credentials. Try demo@example.com / demo123");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to Noet
          </h2>
          <p className="text-gray-600">Enter your credentials to continue</p>
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
            <div>Email: demo@example.com | Password: demo123</div>
            <div>Email: admin@example.com | Password: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Note Editor with proper list handling
const NoteEditor = ({ selectedNote, onNoteChange, onCreateNewNote }) => {
  const [noteTitle, setNoteTitle] = useState("");
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef();

  if (!editorRef.current) {
    editorRef.current = withHistory(withReact(createEditor()));
  }

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
    }
  }, [selectedNote]);

  // Auto-save functionality
  useEffect(() => {
    if (selectedNote && onNoteChange) {
      const timeout = setTimeout(() => {
        onNoteChange({
          ...selectedNote,
          title: noteTitle,
          content: JSON.stringify(value),
          updated: new Date().toISOString(),
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [noteTitle, value, selectedNote, onNoteChange]);

  const LIST_TYPES = ["numbered-list", "bulleted-list"];

  const toggleMark = (format) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editorRef.current, format);
    } else {
      Editor.addMark(editorRef.current, format, true);
    }
  };

  const isMarkActive = (format) => {
    const marks = Editor.marks(editorRef.current);
    return marks ? marks[format] === true : false;
  };

  const toggleBlock = (format) => {
    const isActive = isBlockActive(format);
    const isList = LIST_TYPES.includes(format);

    if (isList) {
      if (isActive) {
        // We're in this list type, convert to paragraph
        Transforms.unwrapNodes(editorRef.current, {
          match: (n) =>
            SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
          split: true,
        });
        Transforms.setNodes(editorRef.current, { type: "paragraph" });
      } else {
        // Convert to list
        const isInOtherList = LIST_TYPES.some(
          (listType) => listType !== format && isBlockActive(listType)
        );

        if (isInOtherList) {
          // First unwrap from existing list
          Transforms.unwrapNodes(editorRef.current, {
            match: (n) =>
              SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
            split: true,
          });
        }

        // Set current node to list-item
        Transforms.setNodes(editorRef.current, { type: "list-item" });

        // Wrap in the new list type
        const block = { type: format, children: [] };
        Transforms.wrapNodes(editorRef.current, block);
      }
    } else {
      // Handle non-list block types
      Transforms.setNodes(editorRef.current, {
        type: isActive ? "paragraph" : format,
      });
    }
  };

  const isBlockActive = (format) => {
    const nodeGen = Editor.nodes(editorRef.current, {
      match: (n) => SlateElement.isElement(n) && n.type === format,
    });

    let node = nodeGen.next();
    return !node.done;
  };

  const renderLeaf = useCallback((props) => {
    let { children } = props;
    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case "bulleted-list":
        return (
          <ul className="list-disc list-inside ml-4 my-2" {...props.attributes}>
            {props.children}
          </ul>
        );
      case "numbered-list":
        return (
          <ol
            className="list-decimal list-inside ml-4 my-2"
            {...props.attributes}
          >
            {props.children}
          </ol>
        );
      case "list-item":
        return (
          <li className="mb-1" {...props.attributes}>
            {props.children}
          </li>
        );
      default:
        return (
          <p className="mb-2" {...props.attributes}>
            {props.children}
          </p>
        );
    }
  }, []);

  const onKeyDown = (event) => {
    const { selection } = editorRef.current;

    if (event.key === "Enter") {
      // Check if we're in a list
      const [listMatch] = Editor.nodes(editorRef.current, {
        match: (n) => SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
      });

      if (listMatch) {
        event.preventDefault();

        // Get current list item
        const [listItemMatch] = Editor.nodes(editorRef.current, {
          match: (n) => SlateElement.isElement(n) && n.type === "list-item",
        });

        if (listItemMatch) {
          const [listItem, listItemPath] = listItemMatch;

          // Check if the list item is empty
          const itemText = Editor.string(editorRef.current, listItemPath);
          const isEmpty = itemText.trim() === "";

          if (isEmpty) {
            // Remove the empty list item
            Transforms.removeNodes(editorRef.current, {
              at: listItemPath,
            });

            // Check if the list is now empty, if so, remove it too
            const [currentList] = Editor.nodes(editorRef.current, {
              match: (n) =>
                SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
            });

            if (currentList) {
              const [list] = currentList;
              if (list.children.length === 0) {
                // Remove empty list and insert paragraph
                Transforms.removeNodes(editorRef.current, {
                  match: (n) =>
                    SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
                });
                Transforms.insertNodes(editorRef.current, {
                  type: "paragraph",
                  children: [{ text: "" }],
                });
              } else {
                // Just insert a paragraph after the list
                Transforms.insertNodes(editorRef.current, {
                  type: "paragraph",
                  children: [{ text: "" }],
                });
              }
            }
            return;
          }
        }

        // Create new list item if not empty
        Transforms.insertNodes(editorRef.current, {
          type: "list-item",
          children: [{ text: "" }],
        });
        return;
      }
    }

    if (event.key === "Backspace") {
      // Check if we're at the start of a list item
      const [listItemMatch] = Editor.nodes(editorRef.current, {
        match: (n) => SlateElement.isElement(n) && n.type === "list-item",
      });

      if (listItemMatch && selection && selection.anchor.offset === 0) {
        const [listItem, listItemPath] = listItemMatch;
        const itemText = Editor.string(editorRef.current, listItemPath);

        if (itemText.trim() === "") {
          event.preventDefault();

          // Remove the empty list item
          Transforms.removeNodes(editorRef.current, {
            at: listItemPath,
          });

          // Check if list is now empty
          const [currentList] = Editor.nodes(editorRef.current, {
            match: (n) =>
              SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
          });

          if (currentList) {
            const [list] = currentList;
            if (list.children.length === 0) {
              // Remove empty list and insert paragraph
              Transforms.removeNodes(editorRef.current, {
                match: (n) =>
                  SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
              });
              Transforms.insertNodes(editorRef.current, {
                type: "paragraph",
                children: [{ text: "" }],
              });
            }
          }
          return;
        }
      }
    }

    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case "b":
        event.preventDefault();
        toggleMark("bold");
        break;
      case "i":
        event.preventDefault();
        toggleMark("italic");
        break;
      case "u":
        event.preventDefault();
        toggleMark("underline");
        break;
    }
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
            Choose a note from the list or create a new one to start writing.
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder-slate-400 w-full"
          placeholder="Untitled Note"
        />
        {/* Enhanced Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4 flex flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-2">
            <button
              onClick={() => toggleMark("bold")}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isMarkActive("bold") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => toggleMark("italic")}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isMarkActive("italic") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button
              onClick={() => toggleMark("underline")}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isMarkActive("underline") ? "bg-blue-100 text-blue-700" : ""
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline size={16} />
            </button>
          </div>

          {/* Lists */}
          <div className="flex space-x-1">
            <button
              onClick={() => toggleBlock("bulleted-list")}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isBlockActive("bulleted-list")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => toggleBlock("numbered-list")}
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                isBlockActive("numbered-list")
                  ? "bg-blue-100 text-blue-700"
                  : ""
              }`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Slate Editor */}
      <div className="flex-1 p-6 overflow-y-auto bg-white">
        <Slate
          editor={editorRef.current}
          initialValue={value}
          onChange={setValue}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={onKeyDown}
            placeholder="Start writing your note..."
            spellCheck
            autoFocus
            className="w-full h-full outline-none text-slate-900 leading-relaxed"
            style={{
              minHeight: "400px",
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          />
        </Slate>
      </div>
    </div>
  );
};

// Enhanced Sidebar Component with comprehensive functionality
const Sidebar = ({
  currentView,
  onViewChange,
  user,
  onLogout,
  notebooks,
  tags,
  noteCount,
}) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Noet</h2>
        <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Quick Actions */}
        <nav className="space-y-1 mb-6">
          <button
            onClick={() => onViewChange("all")}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
              currentView === "all"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <FileText size={18} />
            <span>All Notes</span>
            <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
              {noteCount?.all || 0}
            </span>
          </button>

          <button
            onClick={() => onViewChange("recent")}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
              currentView === "recent"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <Search size={18} />
            <span>Recent</span>
          </button>

          <button
            onClick={() => onViewChange("starred")}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
              currentView === "starred"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <Star size={18} />
            <span>Starred</span>
            <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
              {noteCount?.starred || 0}
            </span>
          </button>

          <button
            onClick={() => onViewChange("trash")}
            className={`w-full text-left p-3 rounded-lg transition-colors flex items-center space-x-3 ${
              currentView === "trash"
                ? "bg-blue-100 text-blue-700"
                : "hover:bg-gray-100"
            }`}
          >
            <Trash2 size={18} />
            <span>Trash</span>
            <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
              {noteCount?.trash || 0}
            </span>
          </button>
        </nav>

        {/* Notebooks Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              Notebooks
            </h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Add Notebook"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {notebooks && notebooks.length > 0 ? (
              notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => onViewChange(`notebook-${notebook.id}`)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === `notebook-${notebook.id}`
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Folder size={16} />
                  <span className="truncate">{notebook.name}</span>
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {notebook.noteCount || 0}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic px-2">
                No notebooks yet
              </p>
            )}
          </div>
        </div>

        {/* Tags Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              Tags
            </h3>
            <button
              className="text-gray-400 hover:text-gray-600"
              title="Manage Tags"
            >
              <Tag size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {tags && tags.length > 0 ? (
              tags.slice(0, 5).map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => onViewChange(`tag-${tag.name}`)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    currentView === `tag-${tag.name}`
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full`}
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="truncate">{tag.name}</span>
                  <span className="ml-auto text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {tag.noteCount || 0}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic px-2">No tags yet</p>
            )}
            {tags && tags.length > 5 && (
              <button
                onClick={() => onViewChange("all-tags")}
                className="w-full text-left p-2 text-sm text-blue-600 hover:text-blue-700"
              >
                View all tags ({tags.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => onViewChange("settings")}
          className="w-full text-left p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

// Enhanced Notes List Component with search and filtering
const NotesList = ({
  notes,
  selectedNote,
  onSelectNote,
  onCreateNewNote,
  currentView,
  searchQuery,
  onSearchChange,
  onDeleteNote,
  onStarNote,
}) => {
  const [sortBy, setSortBy] = useState("updated");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter notes based on current view and search
  const filteredNotes = notes.filter((note) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(query) ||
        (note.content && note.content.toLowerCase().includes(query))
      );
    }

    // View-based filter
    switch (currentView) {
      case "recent":
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return new Date(note.updated) > threeDaysAgo;
      case "starred":
        return note.starred;
      case "trash":
        return note.deleted;
      case "all":
      default:
        return !note.deleted;
    }
  });

  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "created":
        comparison = new Date(a.created) - new Date(b.created);
        break;
      case "updated":
      default:
        comparison = new Date(a.updated) - new Date(b.updated);
        break;
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getPreviewText = (content) => {
    try {
      const parsed = JSON.parse(content);
      const text = parsed
        .map((node) => {
          if (node.children) {
            return node.children.map((child) => child.text || "").join(" ");
          }
          return "";
        })
        .join(" ");
      return text.substring(0, 100) + (text.length > 100 ? "..." : "");
    } catch {
      return "";
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {currentView === "all" && "All Notes"}
            {currentView === "recent" && "Recent Notes"}
            {currentView === "starred" && "Starred Notes"}
            {currentView === "trash" && "Trash"}
            {currentView.startsWith("notebook-") && "Notebook"}
            {currentView.startsWith("tag-") && "Tagged Notes"}
          </h3>
          <button
            onClick={onCreateNewNote}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Create New Note"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Sort Options */}
        <div className="flex space-x-2 text-sm">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs"
          >
            <option value="updated">Last Modified</option>
            <option value="created">Date Created</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50"
          >
            {sortOrder === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? (
              <div>
                <p>No notes found for "{searchQuery}"</p>
                <button
                  onClick={() => onSearchChange("")}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <p>
                  No notes in{" "}
                  {currentView === "all" ? "this view" : currentView}
                </p>
                {currentView === "all" && (
                  <button
                    onClick={onCreateNewNote}
                    className="mt-2 text-blue-600 hover:text-blue-700"
                  >
                    Create your first note
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`group relative border-b border-gray-100 hover:bg-gray-50 ${
                selectedNote?.id === note.id
                  ? "bg-blue-50 border-l-4 border-l-blue-500"
                  : ""
              }`}
            >
              <div
                onClick={() => onSelectNote(note)}
                className="p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate flex-1 pr-2">
                    {note.title}
                  </h4>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStarNote(note.id);
                      }}
                      className={`p-1 rounded hover:bg-gray-200 ${
                        note.starred ? "text-yellow-500" : "text-gray-400"
                      }`}
                      title={note.starred ? "Unstar" : "Star"}
                    >
                      <Star
                        size={14}
                        fill={note.starred ? "currentColor" : "none"}
                      />
                    </button>
                    {currentView !== "trash" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNote(note.id);
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Note preview */}
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {getPreviewText(note.content)}
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(note.updated)}</span>
                  <div className="flex items-center space-x-2">
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-200 px-2 py-1 rounded-full text-xs"
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
                    {note.starred && (
                      <Star
                        size={12}
                        className="text-yellow-500"
                        fill="currentColor"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Enhanced Main App Component with comprehensive functionality
const NoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentView, setCurrentView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notebooks, setNotebooks] = useState([
    { id: 1, name: "Personal", noteCount: 0, color: "#3B82F6" },
    { id: 2, name: "Work", noteCount: 0, color: "#10B981" },
  ]);
  const [tags, setTags] = useState([
    { name: "important", noteCount: 0, color: "#EF4444" },
    { name: "todo", noteCount: 0, color: "#F59E0B" },
    { name: "ideas", noteCount: 0, color: "#8B5CF6" },
  ]);

  // Enhanced demo data with more features
  const enhancedInitialValue = [
    {
      type: "paragraph",
      children: [{ text: "Welcome to Noet! 🎉" }],
    },
    {
      type: "paragraph",
      children: [{ text: "This is a fully-featured note-taking app with:" }],
    },
    {
      type: "bulleted-list",
      children: [
        {
          type: "list-item",
          children: [
            { text: "Rich text editing with lists, formatting, and more" },
          ],
        },
        {
          type: "list-item",
          children: [{ text: "Smart search and filtering" }],
        },
        {
          type: "list-item",
          children: [{ text: "Notebooks and tags for organization" }],
        },
        {
          type: "list-item",
          children: [{ text: "Starred notes and trash functionality" }],
        },
        {
          type: "list-item",
          children: [{ text: "Auto-save and real-time updates" }],
        },
      ],
    },
    {
      type: "paragraph",
      children: [
        { text: "Try creating lists and pressing Enter twice to exit them!" },
      ],
    },
  ];

  const handleLoginSuccess = (authenticatedUser) => {
    console.log("Login successful:", authenticatedUser);
    setUser(authenticatedUser);

    // Enhanced demo notes with more metadata
    const demoNotes = [
      {
        id: 1001,
        title: "Welcome to Noet",
        content: JSON.stringify(enhancedInitialValue),
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        starred: true,
        deleted: false,
        tags: ["important"],
        notebookId: 1,
      },
      {
        id: 1002,
        title: "Meeting Notes - Q1 Planning",
        content: JSON.stringify([
          {
            type: "paragraph",
            children: [{ text: "Q1 Planning Meeting - January 15, 2025" }],
          },
          {
            type: "bulleted-list",
            children: [
              {
                type: "list-item",
                children: [{ text: "Review budget allocation" }],
              },
              {
                type: "list-item",
                children: [{ text: "Set team goals and objectives" }],
              },
              {
                type: "list-item",
                children: [{ text: "Plan quarterly milestones" }],
              },
            ],
          },
        ]),
        created: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        starred: false,
        deleted: false,
        tags: ["work", "todo"],
        notebookId: 2,
      },
      {
        id: 1003,
        title: "Project Ideas",
        content: JSON.stringify([
          {
            type: "paragraph",
            children: [{ text: "Random ideas for future projects:" }],
          },
          {
            type: "numbered-list",
            children: [
              {
                type: "list-item",
                children: [{ text: "AI-powered writing assistant" }],
              },
              {
                type: "list-item",
                children: [{ text: "Collaborative note-taking platform" }],
              },
              {
                type: "list-item",
                children: [{ text: "Mobile app for quick voice notes" }],
              },
            ],
          },
        ]),
        created: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated: new Date(Date.now() - 172800000).toISOString(),
        starred: false,
        deleted: false,
        tags: ["ideas"],
        notebookId: 1,
      },
    ];

    setNotes(demoNotes);
    setIsAuthenticated(true);

    // Auto-select first note
    setSelectedNote(demoNotes[0]);

    // Update notebook and tag counts
    updateCounts(demoNotes);
  };

  const updateCounts = (notesList) => {
    // Update notebook counts
    const notebookCounts = {};
    const tagCounts = {};

    notesList.forEach((note) => {
      if (!note.deleted) {
        // Count notebooks
        if (note.notebookId) {
          notebookCounts[note.notebookId] =
            (notebookCounts[note.notebookId] || 0) + 1;
        }

        // Count tags
        if (note.tags) {
          note.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      }
    });

    setNotebooks((prev) =>
      prev.map((nb) => ({
        ...nb,
        noteCount: notebookCounts[nb.id] || 0,
      }))
    );

    setTags((prev) =>
      prev.map((tag) => ({
        ...tag,
        noteCount: tagCounts[tag.name] || 0,
      }))
    );
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setCurrentView("all");
    setSearchQuery("");
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: "Untitled Note",
      content: JSON.stringify(initialValue),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      starred: false,
      deleted: false,
      tags: [],
      notebookId: notebooks[0]?.id || null,
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedNote(newNote);
    updateCounts(updatedNotes);
  };

  const handleNoteChange = (updatedNote) => {
    const updatedNotes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    updateCounts(updatedNotes);
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? { ...note, deleted: true } : note
    );
    setNotes(updatedNotes);

    // If currently selected note was deleted, clear selection
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
    }

    updateCounts(updatedNotes);
  };

  const handleStarNote = (noteId) => {
    const updatedNotes = notes.map((note) =>
      note.id === noteId ? { ...note, starred: !note.starred } : note
    );
    setNotes(updatedNotes);

    // Update selected note if it was the starred one
    if (selectedNote?.id === noteId) {
      setSelectedNote((prev) => ({ ...prev, starred: !prev.starred }));
    }

    updateCounts(updatedNotes);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Calculate note counts for sidebar
  const noteCount = {
    all: notes.filter((note) => !note.deleted).length,
    starred: notes.filter((note) => note.starred && !note.deleted).length,
    trash: notes.filter((note) => note.deleted).length,
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <AuthenticationFlow onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-gray-50">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          user={user}
          onLogout={handleLogout}
          notebooks={notebooks}
          tags={tags}
          noteCount={noteCount}
        />
        <NotesList
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onCreateNewNote={createNewNote}
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onDeleteNote={handleDeleteNote}
          onStarNote={handleStarNote}
        />
        <NoteEditor
          selectedNote={selectedNote}
          onNoteChange={handleNoteChange}
          onCreateNewNote={createNewNote}
        />
      </div>
    </ErrorBoundary>
  );
};

export default NoetApp;
