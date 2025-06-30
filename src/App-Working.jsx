import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createEditor, Transforms, Editor, Text } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { 
  Bold, Italic, Underline, Plus, FileText, Eye, EyeOff, AlertTriangle
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

// Simple initial value for Slate
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: 'Welcome to your new note!' }],
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

  const renderLeaf = useCallback((props) => {
    let { children } = props;
    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  const renderElement = useCallback((props) => {
    return <p {...props.attributes}>{props.children}</p>;
  }, []);

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
        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 mt-4 flex space-x-2">
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

// Sidebar Component
const Sidebar = ({ currentView, onViewChange, user, onLogout }) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Noet</h2>
        <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
      </div>
      <div className="p-4">
        <nav className="space-y-2">
          <button
            onClick={() => onViewChange('all')}
            className={`w-full text-left p-2 rounded-lg transition-colors ${
              currentView === 'all' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            All Notes
          </button>
          <button
            onClick={() => onViewChange('recent')}
            className={`w-full text-left p-2 rounded-lg transition-colors ${
              currentView === 'recent' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
          >
            Recent
          </button>
        </nav>
        <div className="mt-8 pt-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// Notes List Component
const NotesList = ({ notes, selectedNote, onSelectNote, onCreateNewNote }) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          <button 
            onClick={onCreateNewNote}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Create New Note"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No notes yet</p>
            <button 
              onClick={onCreateNewNote}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Create your first note
            </button>
          </div>
        ) : (
          notes.map(note => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedNote?.id === note.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-1 truncate">{note.title}</h4>
              <p className="text-sm text-gray-600 mb-2">
                {new Date(note.updated).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main App Component
const NoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [currentView, setCurrentView] = useState('all');

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
  };

  const createNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: JSON.stringify(initialValue),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
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
        />
        <NotesList 
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onCreateNewNote={createNewNote}
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
