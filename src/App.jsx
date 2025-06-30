import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEditor, Transforms, Editor, Text, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Bold, Italic, Underline, Plus, FileText, Eye, EyeOff, AlertTriangle,
  Heading1, Heading2, List, ListOrdered, Code, Quote, AlignLeft, AlignCenter, AlignRight,
  Search, Star, Hash, Trash2, Archive, Folder, Settings, Download, Upload, 
  Filter, SortAsc, SortDesc, Calendar, Tag, Book
} from 'lucide-react';

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
      errorInfo: errorInfo
    });
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h1>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium">Error Details</summary>
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

// Enhanced initial value with different element types
const initialValue = [
  {
    type: 'heading-one',
    children: [{ text: 'Welcome to your new note!' }],
  },
  {
    type: 'paragraph',
    children: [{ text: 'This is a rich text editor with support for:' }],
  },
  {
    type: 'bulleted-list',
    children: [
      {
        type: 'list-item',
        children: [{ text: 'Bold, italic, and underline text formatting' }],
      },
      {
        type: 'list-item',
        children: [{ text: 'Multiple heading levels' }],
      },
      {
        type: 'list-item',
        children: [{ text: 'Bulleted and numbered lists' }],
      },
      {
        type: 'list-item',
        children: [{ text: 'Code blocks and quotes' }],
      },
    ],
  },
  {
    type: 'paragraph',
    children: [{ text: 'Start writing to replace this content!' }],
  },
];

// Authentication Component
const AuthenticationFlow = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    
    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }
    
    if (email === 'demo@example.com' && password === 'demo123') {
      onLoginSuccess({ 
        id: 1, 
        email, 
        name: 'Demo User',
        notes: [{
          id: 1001,
          title: 'Welcome Note',
          content: JSON.stringify(initialValue),
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        }]
      });
    } else if (email === 'admin@example.com' && password === 'admin123') {
      onLoginSuccess({ 
        id: 2, 
        email, 
        name: 'Admin User',
        notes: [{
          id: 2001,
          title: 'Admin Note',
          content: JSON.stringify(initialValue),
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        }]
      });
    } else {
      setLoginError('Invalid credentials. Try demo@example.com / demo123');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Noet</h2>
          <p className="text-gray-600">Enter your credentials to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => {setEmail(e.target.value); setLoginError('');}}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="demo@example.com"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {setPassword(e.target.value); setLoginError('');}}
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
          <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Email: demo@example.com | Password: demo123</div>
            <div>Email: admin@example.com | Password: admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple Note Editor with Slate
const NoteEditor = ({ selectedNote, onNoteChange, onCreateNewNote }) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef();
  
  if (!editorRef.current) {
    editorRef.current = withHistory(withReact(createEditor()));
  }

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title || 'Untitled Note');
      try {
        setValue(selectedNote.content ? JSON.parse(selectedNote.content) : initialValue);
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
          updated: new Date().toISOString()
        });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [noteTitle, value, selectedNote, onNoteChange]);

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

    Transforms.unwrapNodes(editorRef.current, {
      match: n => SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
      split: true,
    });

    let newProperties;
    if (isActive) {
      newProperties = { type: 'paragraph' };
    } else if (isList) {
      newProperties = { type: 'list-item' };
    } else {
      newProperties = { type: format };
    }

    Transforms.setNodes(editorRef.current, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editorRef.current, block);
    }
  };

  const isBlockActive = (format) => {
    const nodeGen = Editor.nodes(editorRef.current, {
      match: n => SlateElement.isElement(n) && n.type === format,
    });

    let node = nodeGen.next();
    return !node.done;
  };

  const LIST_TYPES = ['numbered-list', 'bulleted-list'];

  const renderLeaf = useCallback((props) => {
    let { children } = props;
    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    if (props.leaf.code) children = <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  const renderElement = useCallback((props) => {
    const style = { textAlign: props.element.align };
    
    switch (props.element.type) {
      case 'heading-one':
        return <h1 style={style} className="text-3xl font-bold mb-4 mt-6" {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 style={style} className="text-2xl font-semibold mb-3 mt-5" {...props.attributes}>{props.children}</h2>;
      case 'heading-three':
        return <h3 style={style} className="text-xl font-semibold mb-2 mt-4" {...props.attributes}>{props.children}</h3>;
      case 'block-quote':
        return <blockquote style={style} className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4" {...props.attributes}>{props.children}</blockquote>;
      case 'bulleted-list':
        return <ul style={style} className="list-disc list-inside ml-4 my-2" {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol style={style} className="list-decimal list-inside ml-4 my-2" {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li style={style} className="mb-1" {...props.attributes}>{props.children}</li>;
      case 'code-block':
        return <pre style={style} className="bg-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto my-4" {...props.attributes}><code>{props.children}</code></pre>;
      default:
        return <p style={style} className="mb-2" {...props.attributes}>{props.children}</p>;
    }
  }, []);

  const onKeyDown = (event) => {
    // Handle Enter key for lists
    if (event.key === 'Enter') {
      const [match] = Editor.nodes(editorRef.current, {
        match: n => SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
      });

      if (match) {
        const [, path] = Editor.node(editorRef.current, []);
        const text = Editor.string(editorRef.current, path);
        
        // If current line is empty, break out of list
        if (text.trim() === '') {
          event.preventDefault();
          Transforms.unwrapNodes(editorRef.current, {
            match: n => SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
          });
          Transforms.setNodes(editorRef.current, { type: 'paragraph' });
          return;
        }
      }
    }
    
    // Handle keyboard shortcuts
    if (!event.ctrlKey && !event.metaKey) return;
    
    switch (event.key) {
      case 'b':
        event.preventDefault();
        toggleMark('bold');
        break;
      case 'i':
        event.preventDefault();
        toggleMark('italic');
        break;
      case 'u':
        event.preventDefault();
        toggleMark('underline');
        break;
      case '`':
        event.preventDefault();
        toggleMark('code');
        break;
      case '1':
        event.preventDefault();
        toggleBlock('heading-one');
        break;
      case '2':
        event.preventDefault();
        toggleBlock('heading-two');
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
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Select a note to edit</h3>
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
          onChange={e => setNoteTitle(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder-slate-400 w-full"
          placeholder="Untitled Note"
        />
        {/* Enhanced Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4 flex flex-wrap gap-2">
          {/* Text Formatting */}
          <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-2">
            <button 
              onClick={() => toggleMark('bold')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isMarkActive('bold') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Bold (Ctrl+B)"
            >
              <Bold size={16} />
            </button>
            <button 
              onClick={() => toggleMark('italic')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isMarkActive('italic') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Italic (Ctrl+I)"
            >
              <Italic size={16} />
            </button>
            <button 
              onClick={() => toggleMark('underline')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isMarkActive('underline') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Underline (Ctrl+U)"
            >
              <Underline size={16} />
            </button>
            <button 
              onClick={() => toggleMark('code')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isMarkActive('code') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Code (Ctrl+`)"
            >
              <Code size={16} />
            </button>
          </div>
          
          {/* Headings */}
          <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-2">
            <button 
              onClick={() => toggleBlock('heading-one')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isBlockActive('heading-one') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Heading 1 (Ctrl+1)"
            >
              <Heading1 size={16} />
            </button>
            <button 
              onClick={() => toggleBlock('heading-two')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isBlockActive('heading-two') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Heading 2 (Ctrl+2)"
            >
              <Heading2 size={16} />
            </button>
          </div>
          
          {/* Lists */}
          <div className="flex space-x-1 border-r border-slate-200 pr-2 mr-2">
            <button 
              onClick={() => toggleBlock('bulleted-list')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isBlockActive('bulleted-list') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Bullet List"
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => toggleBlock('numbered-list')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isBlockActive('numbered-list') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>
          
          {/* Other Blocks */}
          <div className="flex space-x-1">
            <button 
              onClick={() => toggleBlock('block-quote')} 
              className={`p-2 hover:bg-slate-100 rounded-lg transition-colors ${isBlockActive('block-quote') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Quote"
            >
              <Quote size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Slate Editor */}
      <div className="flex-1 p-6 overflow-y-auto bg-white">
        <Slate editor={editorRef.current} initialValue={value} onChange={setValue}>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={onKeyDown}
            placeholder="Start writing your note..."
            spellCheck
            autoFocus
            className="w-full h-full outline-none text-slate-900 leading-relaxed"
            style={{ minHeight: '400px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          />
        </Slate>
      </div>
    </div>
  );
};

// Enhanced Sidebar Component
const Sidebar = ({ currentView, onViewChange, user, onLogout, notes, onSearch, searchQuery }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const noteStats = {
    total: notes.length,
    starred: notes.filter(n => n.starred).length,
    archived: notes.filter(n => n.archived).length,
    trashed: notes.filter(n => n.trashed).length,
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Noet</h2>
        <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery || ''}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange('all')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={16} />
            <span>All Notes</span>
            <span className="ml-auto text-xs text-gray-500">{noteStats.total}</span>
          </button>
          
          <button
            onClick={() => onViewChange('recent')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'recent' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Calendar size={16} />
            <span>Recent</span>
          </button>
          
          <button
            onClick={() => onViewChange('starred')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'starred' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Star size={16} />
            <span>Starred</span>
            <span className="ml-auto text-xs text-gray-500">{noteStats.starred}</span>
          </button>
          
          <button
            onClick={() => onViewChange('notebooks')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'notebooks' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Book size={16} />
            <span>Notebooks</span>
          </button>
          
          <button
            onClick={() => onViewChange('tags')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'tags' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Tag size={16} />
            <span>Tags</span>
          </button>
          
          <hr className="my-3 border-gray-300" />
          
          <button
            onClick={() => onViewChange('archived')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'archived' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Archive size={16} />
            <span>Archived</span>
            <span className="ml-auto text-xs text-gray-500">{noteStats.archived}</span>
          </button>
          
          <button
            onClick={() => onViewChange('trash')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
              currentView === 'trash' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            <Trash2 size={16} />
            <span>Trash</span>
            <span className="ml-auto text-xs text-gray-500">{noteStats.trashed}</span>
          </button>
        </nav>
      </div>
      
      {/* Settings and Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-left p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          
          {showSettings && (
            <div className="ml-6 space-y-1">
              <button className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded flex items-center space-x-2">
                <Download size={14} />
                <span>Export Notes</span>
              </button>
              <button className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded flex items-center space-x-2">
                <Upload size={14} />
                <span>Import Notes</span>
              </button>
            </div>
          )}
          
          <button
            onClick={onLogout}
            className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Notes List Component
const NotesList = ({ notes, selectedNote, onSelectNote, onCreateNewNote, currentView, searchQuery, onStarNote, onArchiveNote, onDeleteNote, sortBy, setSortBy }) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Filter notes based on current view and search
  const filteredNotes = notes.filter(note => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(searchLower);
      const contentMatch = note.content && note.content.toLowerCase().includes(searchLower);
      if (!titleMatch && !contentMatch) return false;
    }
    
    // Apply view filter
    switch (currentView) {
      case 'starred':
        return note.starred && !note.trashed;
      case 'archived':
        return note.archived && !note.trashed;
      case 'trash':
        return note.trashed;
      case 'recent':
        return !note.archived && !note.trashed;
      default:
        return !note.archived && !note.trashed;
    }
  });
  
  // Sort notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'created':
        return new Date(b.created) - new Date(a.created);
      case 'updated':
      default:
        return new Date(b.updated) - new Date(a.updated);
    }
  });

  const getPreviewText = (content) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.map(block => 
        block.children.map(child => child.text).join('')
      ).join(' ').substring(0, 100) + '...';
    } catch {
      return 'No preview available...';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {currentView === 'all' && 'All Notes'}
            {currentView === 'recent' && 'Recent Notes'}
            {currentView === 'starred' && 'Starred Notes'}
            {currentView === 'archived' && 'Archived Notes'}
            {currentView === 'trash' && 'Trash'}
            {currentView === 'notebooks' && 'Notebooks'}
            {currentView === 'tags' && 'Tags'}
          </h3>
          <div className="flex space-x-1">
            <div className="relative">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sort Options"
              >
                <Filter size={16} />
              </button>
              {showSortMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {setSortBy('updated'); setShowSortMenu(false);}}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${sortBy === 'updated' ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      Sort by Updated
                    </button>
                    <button
                      onClick={() => {setSortBy('created'); setShowSortMenu(false);}}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${sortBy === 'created' ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      Sort by Created
                    </button>
                    <button
                      onClick={() => {setSortBy('title'); setShowSortMenu(false);}}
                      className={`w-full text-left p-2 rounded hover:bg-gray-100 ${sortBy === 'title' ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      Sort by Title
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={onCreateNewNote}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Create New Note"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        
        {searchQuery && (
          <div className="text-sm text-gray-600 mb-2">
            {sortedNotes.length} result{sortedNotes.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchQuery ? (
              <div>
                <p>No notes found</p>
                <p className="text-xs mt-1">Try different search terms</p>
              </div>
            ) : currentView === 'trash' ? (
              <p>Trash is empty</p>
            ) : (
              <div>
                <p>No notes yet</p>
                <button 
                  onClick={onCreateNewNote}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Create your first note
                </button>
              </div>
            )}
          </div>
        ) : (
          sortedNotes.map(note => (
            <div
              key={note.id}
              className={`group relative border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedNote?.id === note.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div 
                onClick={() => onSelectNote(note)}
                className="p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 mb-1 truncate pr-2 flex-1">
                    {note.title}
                  </h4>
                  {note.starred && <Star size={14} className="text-yellow-500 fill-current" />}
                </div>
                
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(note.updated).toLocaleDateString()} • {new Date(note.updated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {getPreviewText(note.content)}
                </p>
                
                {(note.tags && note.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{note.tags.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                {currentView !== 'trash' && (
                  <>
                    <button
                      onClick={(e) => {e.stopPropagation(); onStarNote(note.id);}}
                      className="p-1 hover:bg-gray-200 rounded"
                      title={note.starred ? "Unstar" : "Star"}
                    >
                      <Star size={12} className={note.starred ? "text-yellow-500 fill-current" : "text-gray-400"} />
                    </button>
                    <button
                      onClick={(e) => {e.stopPropagation(); onArchiveNote(note.id);}}
                      className="p-1 hover:bg-gray-200 rounded"
                      title={note.archived ? "Unarchive" : "Archive"}
                    >
                      <Archive size={12} className="text-gray-400" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {e.stopPropagation(); onDeleteNote(note.id);}}
                  className="p-1 hover:bg-gray-200 rounded"
                  title={currentView === 'trash' ? "Delete Forever" : "Move to Trash"}
                >
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Enhanced Main App Component
const NoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentView, setCurrentView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('updated');

  const handleLoginSuccess = (authenticatedUser) => {
    console.log('Login successful:', authenticatedUser);
    setUser(authenticatedUser);
    setNotes(authenticatedUser.notes || []);
    setIsAuthenticated(true);
    
    // Auto-select first note
    if (authenticatedUser.notes && authenticatedUser.notes.length > 0) {
      setSelectedNote(authenticatedUser.notes[0]);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setCurrentView('all');
    setSearchQuery('');
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: JSON.stringify(initialValue),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      starred: false,
      archived: false,
      trashed: false,
      tags: [],
      notebook: 'default'
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedNote(newNote);
  };

  const handleNoteChange = (updatedNote) => {
    const updatedNotes = notes.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
  };

  const handleStarNote = (noteId) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, starred: !note.starred } : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote(prev => ({ ...prev, starred: !prev.starred }));
    }
  };

  const handleArchiveNote = (noteId) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, archived: !note.archived } : note
    );
    setNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote(prev => ({ ...prev, archived: !prev.archived }));
    }
  };

  const handleDeleteNote = (noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note?.trashed) {
      // Permanently delete
      const updatedNotes = notes.filter(n => n.id !== noteId);
      setNotes(updatedNotes);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } else {
      // Move to trash
      const updatedNotes = notes.map(note => 
        note.id === noteId ? { ...note, trashed: true } : note
      );
      setNotes(updatedNotes);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
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
          notes={notes}
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
        <NotesList 
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onCreateNewNote={createNewNote}
          currentView={currentView}
          searchQuery={searchQuery}
          onStarNote={handleStarNote}
          onArchiveNote={handleArchiveNote}
          onDeleteNote={handleDeleteNote}
          sortBy={sortBy}
          setSortBy={setSortBy}
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
