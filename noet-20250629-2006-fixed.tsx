import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEditor, Transforms, Editor, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Search, Plus, MoreHorizontal, X, Settings, LogOut, FileText, Bookmark, 
  Folder, Hash, Trash2, Share, Save, Clock, Tag, Filter, SortAsc, Bold, 
  Italic, Underline, List, ListOrdered, Image, Paperclip, Shield, 
  Smartphone, Key, AlertTriangle, Download, Upload, Eye, EyeOff, Users, 
  UserPlus, UserMinus, History, ChevronLeft, RotateCcw, ChevronDown, 
  ChevronRight, Edit2
} from 'lucide-react';

// ========== SLATE EDITOR UTILITIES ========== 
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// ========== EXTRACTED COMPONENTS ==========

// AuthenticationFlow Component
const AuthenticationFlow = ({ 
  users, 
  setUsers, 
  onLoginSuccess, 
  onSecurityLog 
}) => {
  const [authStep, setAuthStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    
    if (authStep === 'otp') {
      const foundUser = users.find(u => u.email === email);
      if (!foundUser) {
        setLoginError('User not found.');
        return;
      }

      if (otp === '123456' || otp === '000000') {
        completeLogin(foundUser);
        return;
      }

      setLoginError('Invalid verification code. Try demo codes: 123456 or 000000');
      return;
    }

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    const foundUser = users.find(u => u.email === email);
    
    if (!foundUser) {
      setLoginError('Account not found. Please check your email address.');
      onSecurityLog('login_failed', { email, reason: 'account_not_found' });
      return;
    }
    
    if (foundUser.password !== password) {
      setLoginError('Incorrect password. Please try again.');
      onSecurityLog('login_failed', { email, reason: 'incorrect_password' });
      return;
    }
    
    const updatedUsers = users.map(u => 
      u.id === foundUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);
    
    if (foundUser.otpEnabled) {
      setAuthStep('otp');
      return;
    }
    
    completeLogin(foundUser);
  };

  const completeLogin = (user) => {
    const sessionId = Date.now().toString();
    const userWithSession = { ...user, sessionId };
    onSecurityLog('login_success');
    onLoginSuccess(userWithSession);
  };

  if (authStep === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
            <p className="text-gray-600">Enter the 6-digit code from your authenticator app</p>
          </div>
          <div className="space-y-6">
            <input
              type="text"
              value={otp}
              onChange={(e) => {setOtp(e.target.value); setLoginError('');}}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              placeholder="123456"
              maxLength={6}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center">Demo codes: 123456 or 000000</p>
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm text-red-700">{loginError}</span>
              </div>
            )}
            <button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium">
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
          <svg width="120" height="120" viewBox="0 0 400 400" className="mx-auto mb-6">
            <rect x="60" y="40" width="240" height="280" rx="25" ry="25" fill="#1e40af" stroke="none"/>
            <rect x="80" y="60" width="200" height="240" rx="15" ry="15" fill="#ffffff"/>
            <rect x="100" y="100" width="100" height="8" rx="4" fill="#2563eb"/>
            <rect x="100" y="120" width="80" height="8" rx="4" fill="#2563eb"/>
            <rect x="100" y="140" width="60" height="8" rx="4" fill="#2563eb"/>
          </svg>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        <div className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => {setEmail(e.target.value); setLoginError('');}}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="demo@example.com"
            onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {setPassword(e.target.value); setLoginError('');}}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              placeholder="demo123"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
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
          <button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium">
            Sign In
          </button>
        </div>
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

// Enhanced NoteEditor Component with Slate
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
  onCreateNewNote
}) => {
  const [noteTitle, setNoteTitle] = useState('');
  const [value, setValue] = useState(initialValue);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [lastVersionTime, setLastVersionTime] = useState(null);
  const editor = useRef(null);
  if (!editor.current) editor.current = withHistory(withReact(createEditor()));

  // Load note content as Slate value
  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title || 'Untitled Note');
      try {
        setValue(selectedNote.content ? JSON.parse(selectedNote.content) : initialValue);
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
    const newTitle = noteTitle || 'Untitled Note';
    const newContent = JSON.stringify(value);
    const updatedNote = {
      ...selectedNote,
      title: newTitle,
      content: newContent,
      updated: new Date().toISOString(),
    };
    const updatedNotes = notes.map(note => note.id === selectedNote.id ? updatedNote : note);
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, notes: updatedNotes } : u));
    }
  }, [noteTitle, value, selectedNote, notes, setNotes, setSelectedNote, setUsers, user]);

  // Auto-save
  useEffect(() => {
    if (selectedNote) {
      const timeout = setTimeout(saveCurrentNote, 2000);
      return () => clearTimeout(timeout);
    }
  }, [noteTitle, value, selectedNote, saveCurrentNote]);

  // Toolbar actions
  const toggleMark = (format) => {
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor.current, format);
    } else {
      Editor.addMark(editor.current, format, true);
    }
  };
  const isMarkActive = (format) => {
    const marks = Editor.marks(editor.current);
    return marks ? marks[format] === true : false;
  };

  // Render leaf for marks
  const renderLeaf = useCallback(props => {
    let { children } = props;
    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  // Render element for blocks
  const renderElement = useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <pre {...props.attributes}><code>{props.children}</code></pre>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes}>{props.children}</h2>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  // Keyboard shortcuts
  const onKeyDown = (event) => {
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
      case 's':
        event.preventDefault();
        saveCurrentNote();
        break;
      default:
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
            Choose a note from the list or create a new one to start writing with our enhanced rich text editor.
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
          <input
            type="text"
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder-slate-400"
            placeholder="Untitled Note"
          />
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4">
            <button onClick={() => toggleMark('bold')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Bold (Ctrl+B)"><Bold size={16} /></button>
            <button onClick={() => toggleMark('italic')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Italic (Ctrl+I)"><Italic size={16} /></button>
            <button onClick={() => toggleMark('underline')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Underline (Ctrl+U)"><Underline size={16} /></button>
            {/* Add more toolbar buttons for lists, code, etc. as needed */}
          </div>
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
              style={{ minHeight: '500px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
            />
          </Slate>
        </div>
      </div>
    </div>
  );
};

// Basic Sidebar Component (simplified for now)
const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Noet</h2>
        <p className="text-gray-600">Select a note to get started</p>
      </div>
    </div>
  );
};

// Basic NotesList Component (simplified for now)
const NotesList = () => {
  return (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-4">
        <h3 className="text-md font-semibold">Notes</h3>
        <p className="text-gray-600">No notes yet</p>
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
      email: 'demo@example.com',
      name: 'Demo User',
      password: 'demo123',
      sessionTimeout: 30,
      otpEnabled: false,
      otpSecret: null,
      backupCodes: [],
      lastLogin: null,
      securityLog: [],
      isAdmin: false,
      createdAt: new Date('2024-01-01').toISOString(),
      notes: [{
        id: 1001,
        title: 'Welcome to Demo Account',
        content: JSON.stringify(initialValue),
        tags: ['demo'],
        notebook: 1,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        isShortcut: true,
        versions: []
      }],
      notebooks: [
        { id: 1, name: 'Demo Archive', isShortcut: false, folderId: null },
        { id: 2, name: 'Demo Notes', isShortcut: false, folderId: null }
      ],
      folders: [
        { id: 1, name: 'Work Projects', parentId: null },
        { id: 2, name: 'Personal', parentId: null }
      ],
      tags: ['demo', 'important', 'todo'],
      trashedNotes: [],
      files: {}
    },
    {
      id: 2,
      email: 'admin@example.com',
      name: 'Admin User',
      password: 'admin123',
      sessionTimeout: 15,
      otpEnabled: false,
      otpSecret: null,
      backupCodes: [],
      lastLogin: null,
      securityLog: [],
      isAdmin: true,
      createdAt: new Date('2024-01-01').toISOString(),
      notes: [{
        id: 2001,
        title: 'Admin Dashboard',
        content: JSON.stringify(initialValue),
        tags: ['admin'],
        notebook: 1,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        isShortcut: true,
        versions: []
      }],
      notebooks: [
        { id: 1, name: 'Admin Archive', isShortcut: false, folderId: null },
        { id: 2, name: 'System Notes', isShortcut: false, folderId: null }
      ],
      folders: [
        { id: 1, name: 'Administration', parentId: null },
        { id: 2, name: 'System', parentId: null }
      ],
      tags: ['admin', 'system', 'urgent'],
      trashedNotes: [],
      files: {}
    }
  ]);

  // Current user data
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [files, setFiles] = useState({});

  // UI States
  const [currentView, setCurrentView] = useState('inbox');
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);

  // Load user data when user changes
  useEffect(() => {
    if (user?.id) {
      const currentUser = users.find(u => u.id === user.id);
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
    setCurrentView('inbox');
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
      ip: '127.0.0.1',
      userAgent: navigator.userAgent
    };
    
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { 
        ...u, 
        securityLog: [...(u.securityLog || []), logEntry].slice(-50)
      } : u
    ));
  };

  // Enhanced note management
  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: JSON.stringify(initialValue),
      tags: [],
      notebook: selectedNotebook?.id || null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      isShortcut: false,
      versions: []
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setSelectedNote(newNote);
    if (user?.id) {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, notes: updatedNotes } : u
      ));
    }
  };

  const addTagToNote = (tagName) => {
    if (!selectedNote || selectedNote.tags?.includes(tagName)) return;
    const updatedNote = {
      ...selectedNote,
      tags: [...(selectedNote.tags || []), tagName]
    };
    const updatedNotes = notes.map(note => note.id === selectedNote.id ? updatedNote : note);
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, notes: updatedNotes } : u));
    }
  };

  const removeTagFromNote = (tagName) => {
    if (!selectedNote) return;
    const updatedNote = {
      ...selectedNote,
      tags: selectedNote.tags?.filter(tag => tag !== tagName) || []
    };
    const updatedNotes = notes.map(note => note.id === selectedNote.id ? updatedNote : note);
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    if (user?.id) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, notes: updatedNotes } : u));
    }
  };

  const showTagModal = () => {
    // Placeholder for tag modal
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
      <Sidebar />
      <NotesList />
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
