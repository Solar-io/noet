import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, MoreHorizontal, X, Settings, LogOut, FileText, Bookmark, 
  Folder, Hash, Trash2, Share, Save, Clock, Tag, Filter, SortAsc, Bold, 
  Italic, Underline, List, ListOrdered, Image, Paperclip, Shield, 
  Smartphone, Key, AlertTriangle, Download, Upload, Eye, EyeOff, Users, 
  UserPlus, UserMinus, History, ChevronLeft, RotateCcw, ChevronDown, 
  ChevronRight, Edit2
} from 'lucide-react';

const NoetApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStep, setAuthStep] = useState('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI States
  const [currentView, setCurrentView] = useState('inbox');
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  // Folder and notebook management states
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [showRenameNotebookModal, setShowRenameNotebookModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNotebookName, setNewNotebookName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingNotebook, setEditingNotebook] = useState(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renameNotebookName, setRenameNotebookName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showSortModal, setShowSortModal] = useState(false);

  // Editor states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);

  // Layout states
  const [leftPanelWidth, setLeftPanelWidth] = useState(256);
  const [middlePanelWidth, setMiddlePanelWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(null);

  // Drag states
  const [draggedNote, setDraggedNote] = useState(null);
  const [draggedNotebook, setDraggedNotebook] = useState(null);
  const [draggedTag, setDraggedTag] = useState(null);
  const [dragOverNotebook, setDragOverNotebook] = useState(null);
  const [isDragOverEditor, setIsDragOverEditor] = useState(false);

  // Filter and sort
  const [filterBy, setFilterBy] = useState({ tags: [], notebook: null });
  const [sortBy, setSortBy] = useState('dateUpdated');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // User administration states
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [confirmNewUserPassword, setConfirmNewUserPassword] = useState('');
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(null);

  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPasswordChange, setNewPasswordChange] = useState('');
  const [confirmPasswordChange, setConfirmPasswordChange] = useState('');

  // Login error handling
  const [loginError, setLoginError] = useState('');

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
        content: '<p>This is your demo account with private notes!</p>',
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
        content: '<p>Admin account with separate data!</p>',
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

  // Session management
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState('0.5');
  const [lastActivity, setLastActivity] = useState(new Date());

  // Modal states
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showOtpSetup, setShowOtpSetup] = useState(false);

  // OTP Enhanced
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [otpSecret, setOtpSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);

  // Current user data
  const [notes, setNotes] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [files, setFiles] = useState({});

  // Versioning states
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [lastVersionTime, setLastVersionTime] = useState(null);

  // Editor
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Track last saved state for comparison
  const [lastSavedTitle, setLastSavedTitle] = useState('');
  const [lastSavedContent, setLastSavedContent] = useState('');

  // Define updateNoteContent function first
  const updateNoteContent = () => {
    if (editorRef.current) {
      setNoteContent(editorRef.current.innerHTML);
      setIsEditing(true);
    }
  };

  // Versioning utility functions
  const extractFileReferencesFromContent = (content) => {
    if (!content) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const fileAttachments = doc.querySelectorAll('.file-attachment');
    const images = doc.querySelectorAll('img');
    
    const references = [];
    
    fileAttachments.forEach((attachment, index) => {
      const fileId = attachment.getAttribute('data-file-id');
      const fileName = attachment.querySelector('[data-file-name]')?.getAttribute('data-file-name');
      if (fileId && fileName) {
        references.push({
          fileId,
          fileName,
          type: 'attachment',
          position: `attachment-${index}`
        });
      }
    });
    
    images.forEach((img, index) => {
      const src = img.src;
      if (src && src.startsWith('data:')) {
        const fileId = img.getAttribute('data-file-id');
        if (fileId) {
          references.push({
            fileId,
            fileName: img.alt || `image-${index}`,
            type: 'image',
            position: `image-${index}`
          });
        }
      }
    });
    
    return references;
  };

  const calculateContentSignificance = (oldContent, newContent, oldTitle, newTitle) => {
    console.log('Calculating significance:', {
      oldTitle,
      newTitle,
      titleChanged: oldTitle !== newTitle,
      oldContentLength: oldContent?.length || 0,
      newContentLength: newContent?.length || 0
    });
    
    if (!oldContent && !newContent) return false;
    if (!oldContent || !newContent) return true;
    
    // Title changes are always significant
    if (oldTitle !== newTitle) {
      console.log('Title changed - significant');
      return true;
    }
    
    const oldText = oldContent.replace(/<[^>]*>/g, '').trim();
    const newText = newContent.replace(/<[^>]*>/g, '').trim();
    
    const charDiff = Math.abs(newText.length - oldText.length);
    const oldWords = oldText.split(/\s+/).filter(w => w.length > 0);
    const newWords = newText.split(/\s+/).filter(w => w.length > 0);
    const wordDiff = Math.abs(newWords.length - oldWords.length);
    
    // Reduced thresholds for more sensitive detection
    const charThreshold = 25; // Reduced from 50
    const wordThreshold = 5;  // Reduced from 10
    const percentThreshold = 0.03; // Reduced from 0.05
    
    const charSignificant = charDiff > charThreshold;
    const wordSignificant = wordDiff > wordThreshold;
    const percentSignificant = oldText.length > 0 && (charDiff / oldText.length) > percentThreshold;
    
    console.log('Significance metrics:', {
      charDiff,
      wordDiff,
      charThreshold,
      wordThreshold,
      charSignificant,
      wordSignificant,
      percentSignificant,
      result: charSignificant || wordSignificant || percentSignificant
    });
    
    return charSignificant || wordSignificant || percentSignificant;
  };

  const shouldCreateVersion = (note, newTitle, newContent, forceCreate = false) => {
    console.log('Checking if should create version:', {
      hasVersions: !!note.versions,
      versionsLength: note.versions?.length || 0,
      lastVersionTime,
      newTitle,
      oldTitle: note.title,
      forceCreate
    });
    
    // Always create version if forced (manual save)
    if (forceCreate) {
      console.log('Force create version');
      return true;
    }
    
    // Initialize versions array if it doesn't exist
    if (!note.versions) {
      console.log('No versions array, creating first version');
      return true;
    }
    
    // Check time threshold (2 minutes for auto-save, but only if changes aren't significant)
    const isSignificant = calculateContentSignificance(
      note.content,
      newContent,
      note.title,
      newTitle
    );
    
    // If changes are significant, ignore time threshold
    if (isSignificant) {
      console.log('Significant changes detected, creating version regardless of time');
      return true;
    }
    
    // For non-significant changes, check time threshold
    if (lastVersionTime) {
      const timeDiff = Date.now() - new Date(lastVersionTime).getTime();
      const twoMinutes = 2 * 60 * 1000; // Reduced from 10 minutes
      console.log('Time check for non-significant changes:', { timeDiff, twoMinutes, shouldWait: timeDiff < twoMinutes });
      if (timeDiff < twoMinutes) {
        console.log('Too soon for new version (non-significant changes)');
        return false;
      }
    }
    
    console.log('Creating version for time-based changes');
    return true;
  };

  const createVersion = (note) => {
    const referencedFiles = extractFileReferencesFromContent(note.content);
    const timestamp = new Date().toISOString();
    
    const version = {
      versionNumber: (note.versions?.length || 0) + 1,
      title: note.title,
      content: note.content,
      timestamp,
      referencedFiles,
      characterCount: (note.content?.replace(/<[^>]*>/g, '') || '').length,
      wordCount: (note.content?.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0) || []).length,
      changesSummary: generateChangesSummary(note.title, note.content, note.versions?.[note.versions.length - 1])
    };
    
    return version;
  };

  const generateChangesSummary = (title, content, previousVersion) => {
    if (!previousVersion) return "Initial version";
    
    const titleChanged = title !== previousVersion.title;
    const contentText = content?.replace(/<[^>]*>/g, '') || '';
    const prevContentText = previousVersion.content?.replace(/<[^>]*>/g, '') || '';
    
    const charDiff = contentText.length - prevContentText.length;
    const wordDiff = contentText.split(/\s+/).filter(w => w.length > 0).length - 
                    prevContentText.split(/\s+/).filter(w => w.length > 0).length;
    
    let summary = [];
    
    if (titleChanged) summary.push("Title updated");
    if (charDiff > 50) summary.push(`Added ${charDiff} characters`);
    else if (charDiff < -50) summary.push(`Removed ${Math.abs(charDiff)} characters`);
    if (wordDiff > 10) summary.push(`Added ${wordDiff} words`);
    else if (wordDiff < -10) summary.push(`Removed ${Math.abs(wordDiff)} words`);
    
    return summary.length > 0 ? summary.join(", ") : "Content modified";
  };

  const addVersionToNote = (note, newTitle, newContent, forceCreate = false) => {
    console.log('addVersionToNote called with:', {
      noteId: note.id,
      oldTitle: note.title,
      newTitle,
      oldContentLength: note.content?.length || 0,
      newContentLength: newContent?.length || 0,
      forceCreate
    });

    if (!shouldCreateVersion(note, newTitle, newContent, forceCreate)) {
      console.log('Not creating version');
      return note;
    }
    
    console.log('Creating version...');
    const version = createVersion(note);
    const updatedVersions = [...(note.versions || []), version];
    
    // Keep only last 100 versions (increased from 20)
    if (updatedVersions.length > 100) {
      updatedVersions.shift();
      updatedVersions.forEach((v, index) => {
        v.versionNumber = index + 1;
      });
    }
    
    setLastVersionTime(version.timestamp);
    
    console.log('Version created:', {
      versionNumber: version.versionNumber,
      totalVersions: updatedVersions.length,
      timestamp: version.timestamp
    });
    
    return {
      ...note,
      versions: updatedVersions
    };
  };

  // Enhanced editor commands with proper code block handling
  const execCommand = (command, value = null) => {
    if (!editorRef.current) return;
    
    try {
      editorRef.current.focus();

      if (command === 'insertCode') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const codeBlock = document.createElement('div');
          codeBlock.className = 'code-block-wrapper';
          codeBlock.style.cssText = 'background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; margin: 16px 0;';
          codeBlock.innerHTML = `
            <div style="padding: 8px 12px; background: #e9ecef; font-size: 12px; color: #6c757d; border-radius: 6px 6px 0 0;">
              Code Block
              <button onclick="this.parentElement.parentElement.remove()" style="float: right; border: none; background: none; cursor: pointer; color: #6c757d; font-size: 16px; line-height: 1;">&times;</button>
            </div>
            <div contenteditable="true" spellcheck="false" class="code-editor-area" style="
              padding: 16px; font-family: 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 14px; 
              line-height: 1.5; background: #fafbfc; white-space: pre-wrap; min-height: 80px; outline: none;
              border-radius: 0 0 6px 6px; color: #24292e;
            ">// Type your code here...</div>
          `;
          
          range.deleteContents();
          range.insertNode(codeBlock);
          
          const afterCodeBlock1 = document.createElement('p');
          afterCodeBlock1.innerHTML = '<br>';
          const afterCodeBlock2 = document.createElement('p');
          afterCodeBlock2.innerHTML = '<br>';
          
          codeBlock.parentNode.insertBefore(afterCodeBlock1, codeBlock.nextSibling);
          codeBlock.parentNode.insertBefore(afterCodeBlock2, afterCodeBlock1.nextSibling);
          
          const newRange = document.createRange();
          newRange.setStart(afterCodeBlock1, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else if (command === 'insertBulletList') {
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        ul.appendChild(li);
        document.execCommand('insertHTML', false, ul.outerHTML);
      } else if (command === 'insertNumberedList') {
        const ol = document.createElement('ol');
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        ol.appendChild(li);
        document.execCommand('insertHTML', false, ol.outerHTML);
      } else {
        document.execCommand(command, false, value);
      }
      updateNoteContent();
    } catch (error) {
      console.error('Error in execCommand:', error);
    }
  };

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
        setOtpEnabled(currentUser.otpEnabled || false);
        setOtpSecret(currentUser.otpSecret || '');
        setBackupCodes(currentUser.backupCodes || []);
      }
    } else {
      setNotes([]);
      setNotebooks([]);
      setFolders([]);
      setTags([]);
      setTrashedNotes([]);
      setFiles({});
      setOtpEnabled(false);
      setOtpSecret('');
      setBackupCodes([]);
    }
  }, [user, users]);

  // Calculate notebook counts correctly
  const getNotebookCount = (notebookId) => {
    return notes.filter(note => note.notebook === notebookId).length;
  };

  // Calculate tag counts
  const getTagCount = (tagName) => {
    return notes.filter(note => note.tags && note.tags.includes(tagName)).length;
  };

  // Filter notes by tag
  const filterNotesByTag = (tagName) => {
    setFilterBy({ tags: [tagName], notebook: null });
    setCurrentView('notes');
    setSelectedNotebook(null);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  // Save user data
  const saveUserData = (userData) => {
    if (!user?.id) return;
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, ...userData } : u
    ));
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

  // Password change function
  const changePassword = () => {
    if (!currentPassword) {
      alert('Please enter your current password');
      return;
    }
    if (!newPasswordChange) {
      alert('Please enter a new password');
      return;
    }
    if (newPasswordChange !== confirmPasswordChange) {
      alert('New passwords do not match');
      return;
    }
    if (newPasswordChange.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    if (user.password !== currentPassword) {
      alert('Current password is incorrect');
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, password: newPasswordChange } : u
    );
    setUsers(updatedUsers);
    
    setUser(prev => ({ ...prev, password: newPasswordChange }));
    
    logSecurityEvent('password_changed');
    
    setCurrentPassword('');
    setNewPasswordChange('');
    setConfirmPasswordChange('');
    setShowChangePassword(false);
    
    alert('Password changed successfully!');
  };

  // User Administration Functions
  const createUser = () => {
    if (!newUserName.trim()) {
      alert('Please enter a name');
      return;
    }
    if (!newUserEmail.trim()) {
      alert('Please enter an email');
      return;
    }
    if (!newUserPassword) {
      alert('Please enter a password');
      return;
    }
    if (newUserPassword !== confirmNewUserPassword) {
      alert('Passwords do not match');
      return;
    }
    if (users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      alert('Email already exists');
      return;
    }

    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      email: newUserEmail.trim(),
      name: newUserName.trim(),
      password: newUserPassword,
      sessionTimeout: 30,
      otpEnabled: false,
      otpSecret: null,
      backupCodes: [],
      lastLogin: null,
      securityLog: [],
      isAdmin: false,
      createdAt: new Date().toISOString(),
      notes: [],
      notebooks: [
        { id: 1, name: 'Personal', isShortcut: false, folderId: null },
        { id: 2, name: 'Work', isShortcut: false, folderId: null }
      ],
      folders: [],
      tags: ['important', 'todo'],
      trashedNotes: [],
      files: {}
    };

    setUsers(prev => [...prev, newUser]);
    
    logSecurityEvent('user_created', { 
      newUserId: newUser.id, 
      newUserEmail: newUser.email,
      createdBy: user.email 
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setConfirmNewUserPassword('');
    setShowCreateUser(false);
    
    alert(`User "${newUser.name}" created successfully!`);
  };

  const deleteUser = (userId) => {
    if (userId === user.id) {
      alert('You cannot delete your own account');
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    logSecurityEvent('user_deleted', { 
      deletedUserId: userId, 
      deletedUserEmail: userToDelete.email,
      deletedBy: user.email 
    });

    setUsers(prev => prev.filter(u => u.id !== userId));
    setShowDeleteUserConfirm(null);
    
    alert(`User "${userToDelete.name}" has been deleted`);
  };

  // Session timeout
  useEffect(() => {
    if (isAuthenticated && user) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeSinceLastActivity = (now - lastActivity) / (1000 * 60);
        if (timeSinceLastActivity >= sessionTimeout) {
          alert('Session expired due to inactivity.');
          logSecurityEvent('session_timeout');
          handleLogout();
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, lastActivity, sessionTimeout]);

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => setLastActivity(new Date());
    if (isAuthenticated) {
      document.addEventListener('mousedown', updateActivity);
      document.addEventListener('keydown', updateActivity);
      return () => {
        document.removeEventListener('mousedown', updateActivity);
        document.removeEventListener('keydown', updateActivity);
      };
    }
  }, [isAuthenticated]);

  // Panel resizing
  const handleMouseDown = (panel) => (e) => {
    setIsResizing(panel);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isResizing === 'left') {
      setLeftPanelWidth(Math.max(200, Math.min(400, e.clientX)));
    } else if (isResizing === 'middle') {
      setMiddlePanelWidth(Math.max(300, Math.min(600, e.clientX - leftPanelWidth)));
    }
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseUp = () => setIsResizing(null);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, leftPanelWidth]);

  // Auth functions
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    
    if (authStep === 'reset') {
      if (users.find(u => u.email === email)) {
        setAuthStep('otp');
        logSecurityEvent('password_reset_requested', { email });
      } else {
        setLoginError('Email address not found.');
      }
      return;
    }

    if (!email || !password) {
      setLoginError('Please enter both email and password');
      return;
    }

    const foundUser = users.find(u => u.email === email);
    
    if (!foundUser) {
      setLoginError('Account not found. Please check your email address.');
      logSecurityEvent('login_failed', { email, reason: 'account_not_found' });
      return;
    }
    
    if (foundUser.password !== password) {
      setLoginError('Incorrect password. Please try again.');
      logSecurityEvent('login_failed', { email, reason: 'incorrect_password' });
      return;
    }
    
    setUsers(prev => prev.map(u => 
      u.id === foundUser.id ? { ...u, lastLogin: new Date().toISOString() } : u
    ));
    
    if (foundUser.otpEnabled) {
      setAuthStep('otp');
      return;
    }
    
    const sessionId = Date.now().toString();
    const userWithSession = { ...foundUser, sessionId };
    setUser(userWithSession);
    setSessionTimeout(foundUser.sessionTimeout);
    setSessionTimeoutHours((foundUser.sessionTimeout / 60).toString());
    setOtpEnabled(foundUser.otpEnabled || false);
    
    setIsAuthenticated(true);
    
    logSecurityEvent('login_success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setShowUserMenu(false);
    setShowUserAdmin(false);
    setShowChangePassword(false);
    setAuthStep('login');
    setEmail('');
    setPassword('');
    setOtp('');
    setLoginError('');
    setCurrentPassword('');
    setNewPasswordChange('');
    setConfirmPasswordChange('');
    setIsUsingBackupCode(false);
  };

  // File handling for drag and drop
  const generateFileId = () => {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const storeFile = (file, fileData) => {
    const fileId = generateFileId();
    const fileRecord = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: fileData,
      uploadDate: new Date().toISOString(),
      referencedBy: [selectedNote?.id].filter(Boolean)
    };
    
    const updatedFiles = {
      ...files,
      [fileId]: fileRecord
    };
    
    setFiles(updatedFiles);
    saveToStorage('files', updatedFiles);
    
    return fileId;
  };

  const handleFileRead = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        const fileId = storeFile(file, fileData);
        
        const img = document.createElement('img');
        img.src = fileData;
        img.setAttribute('data-file-id', fileId);
        img.alt = file.name;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '10px 0';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        
        if (editorRef.current) {
          const p = document.createElement('p');
          p.appendChild(img);
          editorRef.current.appendChild(p);
          
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';
          editorRef.current.appendChild(newP);
          
          updateNoteContent();
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target.result;
        const fileId = storeFile(file, fileData);
        
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-attachment';
        fileDiv.setAttribute('data-file-id', fileId);
        fileDiv.style.cssText = 'background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 16px 0; display: flex; align-items: center; gap: 12px; transition: all 0.2s ease; cursor: pointer;';
        
        fileDiv.onclick = () => {
          const blob = new Blob([fileData], { type: file.type });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.click();
          URL.revokeObjectURL(url);
        };
        
        fileDiv.onmouseenter = () => {
          fileDiv.style.transform = 'translateY(-2px)';
          fileDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          fileDiv.style.backgroundColor = '#dbeafe';
        };
        
        fileDiv.onmouseleave = () => {
          fileDiv.style.transform = 'translateY(0)';
          fileDiv.style.boxShadow = 'none';
          fileDiv.style.backgroundColor = '#f0f9ff';
        };
        
        fileDiv.innerHTML = `
          <div style="width: 32px; height: 32px; background: #0ea5e9; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: #0f172a; font-size: 14px;" data-file-name="${file.name}">${file.name}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${(file.size / 1024).toFixed(1)} KB • ${file.type || 'Unknown type'}</div>
            <div style="font-size: 11px; color: #0ea5e9; margin-top: 4px; font-weight: 500;">Click to download</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" fill="#0ea5e9" viewBox="0 0 24 24">
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            <div style="padding: 6px 12px; background: rgba(14, 165, 233, 0.1); border-radius: 4px; font-size: 11px; color: #0ea5e9; font-weight: 600;">
              ATTACHED
            </div>
          </div>
        `;
        
        if (editorRef.current) {
          editorRef.current.appendChild(fileDiv);
          
          const newP = document.createElement('p');
          newP.innerHTML = '<br>';
          editorRef.current.appendChild(newP);
          
          updateNoteContent();
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Data export functionality
  const exportUserData = () => {
    const userData = {
      user: {
        name: user.name,
        email: user.email,
        exportDate: new Date().toISOString()
      },
      notes,
      notebooks,
      tags,
      trashedNotes
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noet-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    logSecurityEvent('data_exported');
  };

  // OTP functions
  const disableOtp = () => {
    if (confirm('Disable two-factor authentication? This will make your account less secure.')) {
      const updatedUsers = users.map(u => 
        u.id === user.id ? { 
          ...u, 
          otpEnabled: false, 
          otpSecret: null,
          backupCodes: []
        } : u
      );
      setUsers(updatedUsers);
      setOtpEnabled(false);
      setOtpSecret('');
      setBackupCodes([]);
      
      setUser(prev => ({ 
        ...prev, 
        otpEnabled: false, 
        otpSecret: null,
        backupCodes: []
      }));
      
      logSecurityEvent('2fa_disabled');
      alert('Two-factor authentication has been disabled.');
      setShowUserSettings(false);
    }
  };

  const generateOtpSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push({ code, used: false });
    }
    return codes;
  };

  const setupOtp = () => {
    const secret = generateOtpSecret();
    const newBackupCodes = generateBackupCodes();
    
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { 
        ...u, 
        otpSecret: secret, 
        otpEnabled: true,
        backupCodes: newBackupCodes
      } : u
    ));
    setOtpEnabled(true);
    setOtpSecret(secret);
    setBackupCodes(newBackupCodes);
    
    setUser(prev => ({ 
      ...prev, 
      otpEnabled: true, 
      otpSecret: secret,
      backupCodes: newBackupCodes
    }));
    
    logSecurityEvent('2fa_enabled');
    setShowOtpSetup(false);
    
    alert(`Your 2FA Secret Key:\n\n${secret}\n\nSave this secret in your authenticator app. You can also use demo codes 123456 or 000000 for testing.`);
    setShowBackupCodes(true);
  };

  // Enhanced note management with versioning
  const saveCurrentNote = (createVersionFlag = false) => {
    if (!selectedNote) return;
    
    const newTitle = noteTitle || 'Untitled Note';
    const newContent = editorRef.current?.innerHTML || '';
    
    console.log('saveCurrentNote called:', {
      createVersionFlag,
      noteId: selectedNote.id,
      oldTitle: selectedNote.title,
      newTitle,
      hasContentChanged: newContent !== selectedNote.content,
      hasTitleChanged: newTitle !== selectedNote.title
    });
    
    let updatedNote = { ...selectedNote };
    
    // Create version first with the current state
    if (createVersionFlag || isEditing) {
      updatedNote = addVersionToNote(selectedNote, newTitle, newContent, createVersionFlag);
    }
    
    // Then update the note content
    updatedNote = {
      ...updatedNote,
      title: newTitle,
      content: newContent,
      updated: new Date().toISOString()
    };
    
    // Update last saved state for tracking
    setLastSavedTitle(newTitle);
    setLastSavedContent(newContent);
    
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    saveToStorage('notes', updatedNotes);
    setIsEditing(false);

    console.log('Note saved with versions:', updatedNote.versions?.length || 0);
  };

  const manualSave = () => {
    if (!selectedNote) return;
    console.log('Manual save triggered - forcing version creation');
    
    const newTitle = noteTitle || 'Untitled Note';
    const newContent = editorRef.current?.innerHTML || '';
    
    // Force version creation on manual save
    const noteWithVersion = addVersionToNote(selectedNote, newTitle, newContent, true);
    console.log('Manual save - version created:', noteWithVersion.versions?.length);
    
    const updatedNote = {
      ...noteWithVersion,
      title: newTitle,
      content: newContent,
      updated: new Date().toISOString()
    };
    
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    setLastSavedTitle(newTitle);
    setLastSavedContent(newContent);
    saveToStorage('notes', updatedNotes);
    setIsEditing(false);
    
    console.log('Manual save completed, total versions:', updatedNote.versions?.length);
  };

  // Auto-save with debouncing and improved version detection
  useEffect(() => {
    if (isEditing && selectedNote) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        // Check if we should create a version during auto-save
        const newTitle = noteTitle || 'Untitled Note';
        const newContent = editorRef.current?.innerHTML || '';
        const shouldCreateVersionForAutoSave = shouldCreateVersion(selectedNote, newTitle, newContent, false);
        saveCurrentNote(shouldCreateVersionForAutoSave);
      }, 2000);
      return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
    }
  }, [noteTitle, noteContent, isEditing, selectedNote]);

  const createNewNote = () => {
    if (selectedNote && isEditing) saveCurrentNote(true);
    const newNote = {
      id: Date.now(),
      title: 'Untitled Note',
      content: '',
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
    setNoteTitle(newNote.title);
    setNoteContent('');
    setLastSavedTitle(newNote.title);
    setLastSavedContent('');
    setIsEditing(false);
    setViewingVersion(null);
    setShowVersionHistory(false);
    saveToStorage('notes', updatedNotes);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      setTimeout(() => editorRef.current?.focus(), 100);
    }
  };

  const selectNote = (note) => {
    if (selectedNote && isEditing) saveCurrentNote(true);
    setSelectedNote(note);
    setNoteTitle(note.title || 'Untitled Note');
    setNoteContent(note.content || '');
    setLastSavedTitle(note.title || 'Untitled Note');
    setLastSavedContent(note.content || '');
    setIsEditing(false);
    setViewingVersion(null);
    setShowVersionHistory(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.content || '';
    }
  };

  const deleteNote = (noteId) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const noteToDelete = notes.find(note => note.id === noteId);
      if (noteToDelete) {
        const updatedTrashedNotes = [...trashedNotes, { 
          ...noteToDelete, 
          deletedAt: new Date().toISOString() 
        }];
        setTrashedNotes(updatedTrashedNotes);
        saveToStorage('trashedNotes', updatedTrashedNotes);
      }
      
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      saveToStorage('notes', updatedNotes);
      
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setNoteTitle('');
        setNoteContent('');
        setLastSavedTitle('');
        setLastSavedContent('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      }
    }
  };

  // Version history functions
  const viewVersion = (version) => {
    setViewingVersion(version);
    setNoteTitle(version.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content;
    }
  };

  const quickViewVersion = (version) => {
    // Quick preview without changing the viewing state
    setNoteTitle(version.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = version.content;
    }
  };

  const viewCurrentVersion = () => {
    setViewingVersion(null);
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = selectedNote.content || '';
      }
    }
  };

  const restoreVersion = (version) => {
    if (confirm(`Restore to version ${version.versionNumber}? This will replace the current content.`)) {
      if (selectedNote) {
        const noteWithVersion = addVersionToNote(selectedNote, noteTitle, editorRef.current?.innerHTML || '', true);
        
        const restoredNote = {
          ...noteWithVersion,
          title: version.title,
          content: version.content,
          updated: new Date().toISOString()
        };
        
        const updatedNotes = notes.map(note => 
          note.id === selectedNote.id ? restoredNote : note
        );
        setNotes(updatedNotes);
        setSelectedNote(restoredNote);
        setNoteTitle(version.title);
        setLastSavedTitle(version.title);
        setLastSavedContent(version.content);
        saveToStorage('notes', updatedNotes);
        
        if (editorRef.current) {
          editorRef.current.innerHTML = version.content;
        }
        
        setViewingVersion(null);
        setIsEditing(false);
      }
    }
  };

  const exitVersionView = () => {
    setViewingVersion(null);
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      if (editorRef.current) {
        editorRef.current.innerHTML = selectedNote.content || '';
      }
    }
  };

  const toggleNoteShortcut = (noteId) => {
    const updatedNotes = notes.map(note => 
      note.id === noteId ? { ...note, isShortcut: !note.isShortcut } : note
    );
    setNotes(updatedNotes);
    saveToStorage('notes', updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, isShortcut: !selectedNote.isShortcut });
    }
  };

  // Enhanced storage
  const saveToStorage = (key, data) => {
    if (!user?.id) return;
    saveUserData({ [key]: data });
  };

  // Folder management functions
  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        parentId: null
      };
      const updatedFolders = [...folders, newFolder];
      setFolders(updatedFolders);
      saveToStorage('folders', updatedFolders);
      setNewFolderName('');
      setShowFolderModal(false);
    }
  };

  const renameFolder = () => {
    if (renameFolderName.trim() && editingFolder) {
      const updatedFolders = folders.map(folder => 
        folder.id === editingFolder.id ? { ...folder, name: renameFolderName.trim() } : folder
      );
      setFolders(updatedFolders);
      saveToStorage('folders', updatedFolders);
      setRenameFolderName('');
      setEditingFolder(null);
      setShowRenameFolderModal(false);
    }
  };

  const deleteFolder = (folderId) => {
    if (confirm('Delete this folder? Notebooks inside will be moved to the root level.')) {
      // Move notebooks out of the folder
      const updatedNotebooks = notebooks.map(notebook => 
        notebook.folderId === folderId ? { ...notebook, folderId: null } : notebook
      );
      setNotebooks(updatedNotebooks);
      saveToStorage('notebooks', updatedNotebooks);
      
      // Delete the folder
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      setFolders(updatedFolders);
      saveToStorage('folders', updatedFolders);
    }
  };

  const toggleFolderExpanded = (folderId) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }
    setExpandedFolders(newExpandedFolders);
  };

  // Enhanced notebook management
  const createNotebook = () => {
    if (newNotebookName.trim()) {
      const newNotebook = {
        id: Date.now(),
        name: newNotebookName.trim(),
        isShortcut: false,
        folderId: null
      };
      const updatedNotebooks = [...notebooks, newNotebook];
      setNotebooks(updatedNotebooks);
      saveToStorage('notebooks', updatedNotebooks);
      setNewNotebookName('');
      setShowNotebookModal(false);
    }
  };

  const renameNotebook = () => {
    if (renameNotebookName.trim() && editingNotebook) {
      const updatedNotebooks = notebooks.map(notebook => 
        notebook.id === editingNotebook.id ? { ...notebook, name: renameNotebookName.trim() } : notebook
      );
      setNotebooks(updatedNotebooks);
      saveToStorage('notebooks', updatedNotebooks);
      setRenameNotebookName('');
      setEditingNotebook(null);
      setShowRenameNotebookModal(false);
    }
  };

  const deleteNotebook = (notebookId) => {
    if (confirm('Delete this notebook? Notes will be moved to Inbox.')) {
      const updatedNotebooks = notebooks.filter(n => n.id !== notebookId);
      setNotebooks(updatedNotebooks);
      saveToStorage('notebooks', updatedNotebooks);
      const updatedNotes = notes.map(note => 
        note.notebook === notebookId ? { ...note, notebook: null } : note
      );
      setNotes(updatedNotes);
      saveToStorage('notes', updatedNotes);
    }
  };

  const moveNotebookToFolder = (notebookId, folderId) => {
    const updatedNotebooks = notebooks.map(notebook => 
      notebook.id === notebookId ? { ...notebook, folderId } : notebook
    );
    setNotebooks(updatedNotebooks);
    saveToStorage('notebooks', updatedNotebooks);
  };

  // Get notebooks organized by folders
  const getOrganizedNotebooks = () => {
    const rootNotebooks = notebooks.filter(notebook => !notebook.folderId);
    const folderNotebooks = {};
    
    folders.forEach(folder => {
      folderNotebooks[folder.id] = notebooks.filter(notebook => notebook.folderId === folder.id);
    });
    
    return { rootNotebooks, folderNotebooks };
  };

  const createTag = () => {
    if (newTagName.trim() && !tags.includes(newTagName.trim())) {
      const updatedTags = [...tags, newTagName.trim()];
      setTags(updatedTags);
      saveToStorage('tags', updatedTags);
      setNewTagName('');
      setShowTagModal(false);
    }
  };

  const deleteTag = (tagName) => {
    if (confirm('Delete this tag? It will be removed from all notes.')) {
      const updatedTags = tags.filter(tag => tag !== tagName);
      setTags(updatedTags);
      saveToStorage('tags', updatedTags);
      
      const updatedNotes = notes.map(note => ({
        ...note,
        tags: (note.tags || []).filter(tag => tag !== tagName)
      }));
      setNotes(updatedNotes);
      saveToStorage('notes', updatedNotes);
    }
  };

  const addTagToNote = (tagName) => {
    if (!selectedNote || !tagName) return;
    const currentTags = selectedNote.tags || [];
    if (currentTags.includes(tagName)) return;
    const updatedNote = { ...selectedNote, tags: [...currentTags, tagName] };
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    saveToStorage('notes', updatedNotes);
  };

  const removeTagFromNote = (tagName) => {
    if (!selectedNote) return;
    const updatedNote = {
      ...selectedNote,
      tags: (selectedNote.tags || []).filter(tag => tag !== tagName)
    };
    const updatedNotes = notes.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    );
    setNotes(updatedNotes);
    setSelectedNote(updatedNote);
    saveToStorage('notes', updatedNotes);
  };

  // Drag and drop handlers with proper cleanup
  const handleNoteDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', note.id.toString());
  };

  const handleNotebookDrop = (e, notebookId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedNote && draggedNote.notebook !== notebookId) {
      const updatedNotes = notes.map(note => 
        note.id === draggedNote.id ? { ...note, notebook: notebookId } : note
      );
      setNotes(updatedNotes);
      saveToStorage('notes', updatedNotes);
    }
    setDraggedNote(null);
    setDragOverNotebook(null);
  };

  const handleFolderDrop = (e, folderId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedNotebook && draggedNotebook.folderId !== folderId) {
      moveNotebookToFolder(draggedNotebook.id, folderId);
    }
    setDraggedNotebook(null);
  };

  const handleNotebookDragStart = (e, notebook) => {
    setDraggedNotebook(notebook);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', notebook.id.toString());
    e.stopPropagation();
  };

  const handleNotebookReorderDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedNotebook) return;
    
    const currentIndex = notebooks.findIndex(n => n.id === draggedNotebook.id);
    if (currentIndex === targetIndex) return;
    
    const updatedNotebooks = [...notebooks];
    updatedNotebooks.splice(currentIndex, 1);
    updatedNotebooks.splice(targetIndex, 0, draggedNotebook);
    
    setNotebooks(updatedNotebooks);
    saveToStorage('notebooks', updatedNotebooks);
    setDraggedNotebook(null);
  };

  const handleTagDragStart = (e, tag) => {
    setDraggedTag(tag);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tag);
    e.stopPropagation();
  };

  const handleTagDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTag) return;
    
    const currentIndex = tags.findIndex(t => t === draggedTag);
    if (currentIndex === targetIndex) return;
    
    const updatedTags = [...tags];
    updatedTags.splice(currentIndex, 1);
    updatedTags.splice(targetIndex, 0, draggedTag);
    
    setTags(updatedTags);
    saveToStorage('tags', updatedTags);
    setDraggedTag(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (notebookId) => {
    if (draggedNote) {
      setDragOverNotebook(notebookId);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverNotebook(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
    setDraggedNotebook(null);
    setDraggedTag(null);
    setDragOverNotebook(null);
  };

  // View management functions
  const handleViewChange = (newView) => {
    if (selectedNote && isEditing) saveCurrentNote(true);
    setCurrentView(newView);
    setSelectedNotebook(null);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setLastSavedTitle('');
    setLastSavedContent('');
    setViewingVersion(null);
    setShowVersionHistory(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const selectNotebook = (notebook) => {
    if (selectedNote && isEditing) saveCurrentNote(true);
    setSelectedNotebook(notebook);
    setCurrentView('notebook');
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setLastSavedTitle('');
    setLastSavedContent('');
    setViewingVersion(null);
    setShowVersionHistory(false);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  // Get current items with proper filtering
  const getCurrentItems = () => {
    let items = [];
    switch (currentView) {
      case 'inbox':
        items = notes.filter(note => !note.notebook);
        break;
      case 'notebook':
        if (!selectedNotebook) return [];
        items = notes.filter(note => note.notebook === selectedNotebook.id);
        break;
      case 'shortcuts':
        items = notes.filter(note => note.isShortcut);
        break;
      case 'notes':
        items = notes;
        break;
      case 'trash':
        items = trashedNotes;
        break;
      default:
        items = notes;
    }
    
    if (filterBy.tags.length > 0) {
      items = items.filter(note => {
        const noteTags = note.tags || [];
        return filterBy.tags.some(filterTag => noteTags.includes(filterTag));
      });
    }
    
    if (searchTerm) {
      items = items.filter(note => 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        note.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    items.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'dateCreated') {
        return new Date(b.created || 0) - new Date(a.created || 0);
      } else {
        return new Date(b.updated || 0) - new Date(a.updated || 0);
      }
    });
    
    return items;
  };

  const getCurrentViewTitle = () => {
    if (currentView === 'notebook' && selectedNotebook) {
      return selectedNotebook.name;
    }
    return currentView === 'inbox' ? 'Inbox' : 
           currentView === 'trash' ? 'Trash' :
           currentView.charAt(0).toUpperCase() + currentView.slice(1);
  };

  if (!isAuthenticated) {
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
              <rect x="260" y="80" width="80" height="20" rx="10" ry="10" fill="#0ea5e9" transform="rotate(45 300 90)"/>
              <polygon points="320,50 340,70 330,80 310,60" fill="#1e40af"/>
              <circle cx="280" cy="120" r="8" fill="#0ea5e9"/>
              <rect x="275" y="115" width="10" height="10" rx="2" fill="#64748b"/>
            </svg>
            <p className="text-gray-600">
              {authStep === 'login' ? 'Sign in to your account' : 
               authStep === 'reset' ? 'Reset your password' : 'Enter verification code'}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="demo@example.com"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
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
            <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Accounts</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Email: demo@example.com | Password: demo123</div>
              <div>Email: admin@example.com | Password: admin123</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentItems = getCurrentItems();

  return (
    <div className="h-screen flex bg-white">
      {/* Left Sidebar */}
      <div className="bg-slate-50 border-r border-slate-200 flex flex-col" style={{ width: `${leftPanelWidth}px` }}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-semibold text-lg relative">
              <svg width="24" height="24" viewBox="0 0 100 100" className="text-white">
                <rect x="15" y="20" width="60" height="60" rx="8" ry="8" fill="currentColor" stroke="none"/>
                <rect x="20" y="25" width="50" height="50" rx="6" ry="6" fill="#f8fafc"/>
                <rect x="25" y="35" width="25" height="3" rx="1.5" fill="#2563eb"/>
                <rect x="25" y="42" width="20" height="3" rx="1.5" fill="#2563eb"/>
                <rect x="25" y="49" width="15" height="3" rx="1.5" fill="#2563eb"/>
                <path d="M55 28 L75 48 L70 53 L50 33 Z" fill="#0ea5e9"/>
                <circle cx="75" cy="28" r="4" fill="#0ea5e9"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{user?.name}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <span>{notes.length} notes</span>
                {otpEnabled && <Shield size={12} className="text-blue-600" />}
                {user?.isAdmin && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin</span>}
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-50">
                  <div className="py-1">
                    <button 
                      onClick={() => {setShowUserSettings(true); setShowUserMenu(false);}}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button 
                      onClick={() => {setShowChangePassword(true); setShowUserMenu(false);}}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                    >
                      <Key size={16} />
                      <span>Change Password</span>
                    </button>
                    {user?.isAdmin && (
                      <button 
                        onClick={() => {setShowUserAdmin(true); setShowUserMenu(false);}}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                      >
                        <Users size={16} />
                        <span>User Administration</span>
                      </button>
                    )}
                    <div className="border-t border-slate-100"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={createNewNote}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
          >
            <Plus size={18} />
            <span className="font-medium">New Note</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 space-y-1">
            <button
              onClick={() => handleViewChange('inbox')}
              className={`w-full text-left py-3 px-3 text-sm flex items-center space-x-3 rounded-lg transition-colors ${
                currentView === 'inbox' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText size={18} />
              <span>Inbox</span>
              <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                {notes.filter(n => !n.notebook).length}
              </span>
            </button>
            
            <button
              onClick={() => handleViewChange('shortcuts')}
              className={`w-full text-left py-3 px-3 text-sm flex items-center space-x-3 rounded-lg transition-colors ${
                currentView === 'shortcuts' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={18} />
              <span>Shortcuts</span>
              <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                {notes.filter(n => n.isShortcut).length}
              </span>
            </button>
            
            <button
              onClick={() => handleViewChange('notes')}
              className={`w-full text-left py-3 px-3 text-sm flex items-center space-x-3 rounded-lg transition-colors ${
                currentView === 'notes' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText size={18} />
              <span>All Notes</span>
              <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                {notes.length}
              </span>
            </button>
          </div>

          <div className="px-4 py-2 border-t border-slate-200 mt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notebooks</div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                  title="New Folder"
                >
                  <Folder size={14} />
                </button>
                <button
                  onClick={() => setShowNotebookModal(true)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                  title="New Notebook"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            {(() => {
              const { rootNotebooks, folderNotebooks } = getOrganizedNotebooks();
              
              return (
                <>
                  {/* Folders with their notebooks */}
                  {folders.map((folder) => (
                    <div key={`folder-${folder.id}`} className="mb-2">
                      <div 
                        className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
                        onClick={() => toggleFolderExpanded(folder.id)}
                        onDrop={(e) => handleFolderDrop(e, folder.id)}
                        onDragOver={handleDragOver}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {expandedFolders.has(folder.id) ? (
                              <ChevronDown size={14} className="text-slate-400" />
                            ) : (
                              <ChevronRight size={14} className="text-slate-400" />
                            )}
                            <Folder size={14} className="text-slate-400 ml-1" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{folder.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                            {folderNotebooks[folder.id]?.length || 0}
                          </span>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolder(folder);
                                setRenameFolderName(folder.name);
                                setShowRenameFolderModal(true);
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                              title="Rename Folder"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                              title="Delete Folder"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notebooks in this folder */}
                      {expandedFolders.has(folder.id) && folderNotebooks[folder.id] && (
                        <div className="ml-6 mt-1">
                          {folderNotebooks[folder.id].map((notebook) => (
                            <div key={`notebook-${notebook.id}`} className="mb-1">
                              <div
                                draggable
                                onDragStart={(e) => handleNotebookDragStart(e, notebook)}
                                onDragEnd={handleDragEnd}
                                onClick={() => selectNotebook(notebook)}
                                onDrop={(e) => {
                                  if (draggedNote) {
                                    handleNotebookDrop(e, notebook.id);
                                  }
                                }}
                                onDragEnter={() => {
                                  if (draggedNote) {
                                    handleDragEnter(notebook.id);
                                  }
                                }}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                className={`group w-full text-left py-2 px-3 rounded-lg transition-colors ${
                                  selectedNotebook?.id === notebook.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                                } ${dragOverNotebook === notebook.id ? 'bg-blue-100 border-2 border-blue-300' : ''}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <FileText size={14} className="text-slate-400" />
                                    <span className="text-sm text-slate-700">{notebook.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                                      {getNotebookCount(notebook.id)}
                                    </span>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingNotebook(notebook);
                                          setRenameNotebookName(notebook.name);
                                          setShowRenameNotebookModal(true);
                                        }}
                                        className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                        title="Rename Notebook"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotebook(notebook.id);
                                        }}
                                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                                        title="Delete Notebook"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Root level notebooks */}
                  {rootNotebooks.map((notebook) => (
                    <div key={`root-notebook-${notebook.id}`} className="mb-1">
                      <div
                        draggable
                        onDragStart={(e) => handleNotebookDragStart(e, notebook)}
                        onDragEnd={handleDragEnd}
                        onClick={() => selectNotebook(notebook)}
                        onDrop={(e) => {
                          if (draggedNote) {
                            handleNotebookDrop(e, notebook.id);
                          }
                        }}
                        onDragEnter={() => {
                          if (draggedNote) {
                            handleDragEnter(notebook.id);
                          }
                        }}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        className={`group w-full text-left py-2 px-3 rounded-lg transition-colors ${
                          selectedNotebook?.id === notebook.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'
                        } ${dragOverNotebook === notebook.id ? 'bg-blue-100 border-2 border-blue-300' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-700">{notebook.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                              {getNotebookCount(notebook.id)}
                            </span>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNotebook(notebook);
                                  setRenameNotebookName(notebook.name);
                                  setShowRenameNotebookModal(true);
                                }}
                                className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                title="Rename Notebook"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotebook(notebook.id);
                                }}
                                className="p-1 hover:bg-red-100 rounded text-red-600 transition-opacity"
                                title="Delete Notebook"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          <div className="px-4 py-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tags</div>
              <button 
                onClick={() => setShowTagModal(true)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
              >
                <Plus size={14} />
              </button>
            </div>
            
            {tags.map((tag, index) => (
              <div key={tag}>
                <div 
                  className="h-2 transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTagDrop(e, index);
                    e.currentTarget.className = 'h-2 transition-colors';
                    e.currentTarget.style.height = '8px';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    if (draggedTag) {
                      e.currentTarget.className = 'h-3 bg-blue-600 rounded transition-colors';
                      e.currentTarget.style.height = '12px';
                      e.currentTarget.style.backgroundColor = '#2563eb';
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(37, 99, 235, 0.5)';
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      e.currentTarget.className = 'h-2 transition-colors';
                      e.currentTarget.style.height = '8px';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                />
                
                <div 
                  draggable
                  onDragStart={(e) => handleTagDragStart(e, tag)}
                  onDragEnd={handleDragEnd}
                  onClick={() => filterNotesByTag(tag)}
                  className="group flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 mb-1 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Hash size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-700">{tag}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                      {getTagCount(tag)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTag(tag);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {index === tags.length - 1 && (
                  <div 
                    className="h-2 transition-colors"
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTagDrop(e, index + 1);
                      e.currentTarget.className = 'h-2 transition-colors';
                      e.currentTarget.style.height = '8px';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      if (draggedTag) {
                        e.currentTarget.className = 'h-3 bg-blue-600 rounded transition-colors';
                        e.currentTarget.style.height = '12px';
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(37, 99, 235, 0.5)';
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        e.currentTarget.className = 'h-2 transition-colors';
                        e.currentTarget.style.height = '8px';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-slate-200">
            <button
              onClick={() => handleViewChange('trash')}
              className={`w-full text-left py-3 px-3 text-sm flex items-center space-x-3 rounded-lg transition-colors ${
                currentView === 'trash' ? 'bg-red-100 text-red-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Trash2 size={18} />
              <span>Trash</span>
              <span className="ml-auto text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                {trashedNotes.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Left Panel Resizer */}
      <div
        className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0"
        onMouseDown={handleMouseDown('left')}
      />

      {/* Middle Panel */}
      <div className="bg-white border-r border-slate-200 flex flex-col" style={{ width: `${middlePanelWidth}px` }}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-900">
              {getCurrentViewTitle()}
            </h1>
          </div>
          
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <span className="font-medium">{currentItems.length} notes</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowFilterModal(!showFilterModal)}
                className={`p-2 hover:bg-slate-100 rounded-lg relative transition-colors ${
                  filterBy.tags.length > 0 ? 'bg-blue-100 text-blue-600' : ''
                }`}
                title="Filter"
              >
                <Filter size={16} />
                {filterBy.tags.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                    {filterBy.tags.length}
                  </div>
                )}
                {showFilterModal && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm font-medium text-slate-700 border-b">Filter by Tags</div>
                      {filterBy.tags.length > 0 && (
                        <button
                          onClick={() => setFilterBy({ tags: [], notebook: null })}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Clear all filters
                        </button>
                      )}
                      {tags.map(tag => (
                        <label key={tag} className="flex items-center px-4 py-2 hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={filterBy.tags.includes(tag)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterBy(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                              } else {
                                setFilterBy(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </button>
              <button 
                onClick={() => setShowSortModal(!showSortModal)}
                className="p-2 hover:bg-slate-100 rounded-lg relative transition-colors"
              >
                <SortAsc size={16} />
                {showSortModal && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="py-2">
                      {[
                        { value: 'title', label: 'Title' },
                        { value: 'dateUpdated', label: 'Date Updated' },
                        { value: 'dateCreated', label: 'Date Created' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {setSortBy(option.value); setShowSortModal(false);}}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 ${
                            sortBy === option.value ? 'text-blue-600 bg-blue-50' : 'text-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {currentItems.map(note => (
            <div
              key={note.id}
              draggable
              onDragStart={(e) => handleNoteDragStart(e, note)}
              onDragEnd={handleDragEnd}
              onClick={() => selectNote(note)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 group transition-colors ${
                selectedNote?.id === note.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate mb-2">{note.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {note.content?.replace(/<[^>]*>/g, '') || 'No content'}
                  </p>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {note.updated ? new Date(note.updated).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: new Date(note.updated).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      }) : 'No date'}
                    </span>
                    {note.isShortcut && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center space-x-1">
                        <Bookmark size={10} />
                        <span>Pinned</span>
                      </span>
                    )}
                    {note.versions && note.versions.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center space-x-1">
                        <History size={10} />
                        <span>v{note.versions.length + 1}</span>
                      </span>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-slate-500">+{note.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNoteShortcut(note.id);
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Bookmark size={16} className={note.isShortcut ? 'text-blue-500 fill-current' : 'text-slate-400'} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {currentItems.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No notes found</h3>
              <p className="text-slate-500 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first note to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={createNewNote}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  <span>Create Note</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle Panel Resizer */}
      <div
        className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0"
        onMouseDown={handleMouseDown('middle')}
      />

      {/* Right Panel - Editor with File Drop */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedNote ? (
          <>
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              {viewingVersion ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <History size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      Viewing Version {viewingVersion.versionNumber} from {new Date(viewingVersion.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => restoreVersion(viewingVersion)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <RotateCcw size={14} />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={exitVersionView}
                      className="px-3 py-1 border border-blue-300 text-blue-600 rounded text-sm hover:bg-blue-100 flex items-center space-x-1"
                    >
                      <ChevronLeft size={14} />
                      <span>Back to Current</span>
                    </button>
                  </div>
                </div>
              ) : null}
              
              <div className="flex items-start justify-between mb-4">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => {
                    setNoteTitle(e.target.value);
                    if (!viewingVersion) setIsEditing(true);
                  }}
                  disabled={!!viewingVersion}
                  className={`text-2xl font-bold bg-transparent border-none outline-none flex-1 text-slate-900 placeholder-slate-400 ${
                    viewingVersion ? 'opacity-70' : ''
                  }`}
                  placeholder="Untitled Note"
                />
                <div className="flex items-center space-x-3 ml-4">
                  {!viewingVersion && isEditing && (
                    <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Saving...</span>
                    </span>
                  )}
                  
                  {selectedNote?.versions && selectedNote.versions.length > 0 && (
                    <button
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                      className={`text-sm px-3 py-1 rounded-full flex items-center space-x-1 transition-colors ${
                        showVersionHistory 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Version History"
                    >
                      <History size={14} />
                      <span>v{selectedNote.versions.length + 1}</span>
                    </button>
                  )}
                  
                  {/* Always show version indicator, even with 0 versions */}
                  {(!selectedNote?.versions || selectedNote.versions.length === 0) && !viewingVersion && (
                    <button
                      onClick={() => setShowVersionHistory(!showVersionHistory)}
                      className="text-sm px-3 py-1 rounded-full flex items-center space-x-1 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="Version History (No versions yet)"
                    >
                      <History size={14} />
                      <span>v1</span>
                    </button>
                  )}
                  
                  <span className="text-sm text-slate-500">
                    Last edited {new Date(selectedNote.updated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => navigator.share?.({ title: noteTitle, text: noteContent.replace(/<[^>]*>/g, '') })}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Share"
                    >
                      <Share size={18} />
                    </button>
                    <button 
                      onClick={manualSave}
                      disabled={viewingVersion}
                      className={`p-2 hover:bg-slate-200 rounded-lg transition-colors ${
                        viewingVersion ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Save (Ctrl+S)"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedNote.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTagFromNote(tag)}
                        className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-4 flex items-center space-x-3">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addTagToNote(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Add tag...</option>
                  {tags.filter(tag => !(selectedNote?.tags || []).includes(tag)).map(tag => (
                    <option key={tag} value={tag}>#{tag}</option>
                  ))}
                </select>
                
                <button
                  onClick={() => setShowTagModal(true)}
                  className="text-sm border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                >
                  <Plus size={14} />
                  <span>New Tag</span>
                </button>
              </div>

              {/* Enhanced Toolbar */}
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center space-x-1 flex-wrap gap-2">
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => execCommand('bold')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold size={16} />
                    </button>
                    <button 
                      onClick={() => execCommand('italic')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic size={16} />
                    </button>
                    <button 
                      onClick={() => execCommand('underline')}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Underline (Ctrl+U)"
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                  
                  <div className="w-px h-6 bg-slate-300"></div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                      className="px-3 py-2 hover:bg-slate-100 rounded-lg text-sm border transition-colors"
                      title="Font Size"
                    >
                      Size
                    </button>
                    {showFontSizePicker && (
                      <div className="absolute top-10 left-0 w-24 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                        <div className="py-2">
                          {[1, 2, 3, 4, 5, 6, 7].map(size => (
                            <button
                              key={size}
                              onClick={() => {execCommand('fontSize', size); setShowFontSizePicker(false);}}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                            >
                              {size === 1 ? 'Tiny' : size === 2 ? 'Small' : size === 3 ? 'Normal' : size === 4 ? 'Large' : size === 5 ? 'XL' : size === 6 ? 'XXL' : 'Huge'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="p-2 hover:bg-slate-100 rounded-lg border transition-colors"
                      title="Text Color"
                    >
                      <div className="w-4 h-4 bg-black rounded"></div>
                    </button>
                    {showColorPicker && (
                      <div className="absolute top-10 left-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 p-3">
                        <div className="grid grid-cols-8 gap-1">
                          {['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff', '#ff0000', '#ff6600', '#ffcc00', '#33ff00', '#00ff99', '#00ccff', '#3366ff', '#9933ff', '#ff3399', '#ff6666'].map(color => (
                            <button
                              key={color}
                              onClick={() => {execCommand('foreColor', color); setShowColorPicker(false);}}
                              className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                      className="p-2 hover:bg-slate-100 rounded-lg border transition-colors"
                      title="Text Highlight"
                    >
                      <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                    </button>
                    {showHighlightPicker && (
                      <div className="absolute top-10 left-0 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 p-3">
                        <div className="grid grid-cols-8 gap-1">
                          {['transparent', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff6600', '#ff0000', '#0066ff'].map(color => (
                            <button
                              key={color}
                              onClick={() => {execCommand('hiliteColor', color); setShowHighlightPicker(false);}}
                              className="w-6 h-6 rounded border border-slate-300 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
                            >
                              {color === 'transparent' && <X size={12} className="text-slate-400" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-px h-6 bg-slate-300"></div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowHeaderPicker(!showHeaderPicker)}
                      className="px-3 py-2 hover:bg-slate-100 rounded-lg text-sm border transition-colors"
                      title="Headers"
                    >
                      H
                    </button>
                    {showHeaderPicker && (
                      <div className="absolute top-10 left-0 w-36 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                        <div className="py-2">
                          <button
                            onClick={() => {execCommand('formatBlock', 'div'); setShowHeaderPicker(false);}}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                          >
                            Normal
                          </button>
                          {[1, 2, 3, 4, 5, 6].map(level => (
                            <button
                              key={level}
                              onClick={() => {execCommand('formatBlock', `h${level}`); setShowHeaderPicker(false);}}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                              style={{ fontSize: `${20 - (level * 2)}px`, fontWeight: 'bold' }}
                            >
                              Heading {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-px h-6 bg-slate-300"></div>
                  
                  <button 
                    onClick={() => execCommand('insertBulletList')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Bullet List"
                  >
                    <List size={16} />
                  </button>
                  <button 
                    onClick={() => execCommand('insertNumberedList')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Numbered List"
                  >
                    <ListOrdered size={16} />
                  </button>
                  
                  <div className="w-px h-6 bg-slate-300"></div>
                  
                  <button 
                    onClick={() => execCommand('insertCode')}
                    className="px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors text-sm font-mono border"
                    title="Code Block"
                  >
                    &lt;/&gt;
                  </button>
                  
                  <div className="w-px h-6 bg-slate-300"></div>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Insert Image"
                  >
                    <Image size={16} />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Attach File"
                  >
                    <Paperclip size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-white relative">
              {isDragOverEditor && (
                <div className="absolute inset-0 bg-blue-100 bg-opacity-90 flex items-center justify-center z-10 border-2 border-blue-400 border-dashed rounded-lg">
                  <div className="text-center">
                    <Upload size={48} className="text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-700 font-medium">Drop files here to add to note</p>
                    <p className="text-blue-600 text-sm">Images and documents supported</p>
                  </div>
                </div>
              )}
              
              <style>
                {`
                  .note-editor {
                    line-height: 1.7;
                    font-size: 16px;
                  }
                  .note-editor h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
                  .note-editor h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
                  .note-editor h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
                  .note-editor h4 { font-size: 1em; font-weight: bold; margin: 1.12em 0; }
                  .note-editor h5 { font-size: 0.83em; font-weight: bold; margin: 1.5em 0; }
                  .note-editor h6 { font-size: 0.75em; font-weight: bold; margin: 1.67em 0; }
                  .note-editor ul {
                    list-style-type: disc !important;
                    margin-left: 20px !important;
                    padding-left: 20px !important;
                  }
                  .note-editor ol {
                    list-style-type: decimal !important;
                    margin-left: 20px !important;
                    padding-left: 20px !important;
                  }
                  .note-editor li {
                    margin: 6px 0 !important;
                    display: list-item !important;
                  }
                  .note-editor p {
                    margin: 1em 0;
                  }
                  .note-editor:empty:before {
                    content: "Start writing your note...";
                    color: #9ca3af;
                    font-style: italic;
                  }
                  .file-attachment {
                    transition: all 0.2s ease;
                  }
                  .file-attachment:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  }
                `}
              </style>
              <div
                ref={editorRef}
                contentEditable={!viewingVersion}
                suppressContentEditableWarning={true}
                onInput={viewingVersion ? undefined : updateNoteContent}
                onBlur={() => {
                  if (isEditing && !viewingVersion) {
                    saveCurrentNote();
                  }
                }}
                onDragOver={viewingVersion ? undefined : (e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setIsDragOverEditor(true);
                }}
                onDragLeave={viewingVersion ? undefined : (e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsDragOverEditor(false);
                  }
                }}
                onDrop={viewingVersion ? undefined : (e) => {
                  e.preventDefault();
                  setIsDragOverEditor(false);
                  const files = Array.from(e.dataTransfer.files);
                  files.forEach(file => handleFileRead(file));
                }}
                onKeyDown={(e) => {
                  if (viewingVersion) return;
                  if (e.ctrlKey || e.metaKey) {
                    switch (e.key.toLowerCase()) {
                      case 'b':
                        e.preventDefault();
                        execCommand('bold');
                        break;
                      case 'i':
                        e.preventDefault();
                        execCommand('italic');
                        break;
                      case 'u':
                        e.preventDefault();
                        execCommand('underline');
                        break;
                      case 's':
                        e.preventDefault();
                        manualSave();
                        break;
                    }
                  }
                }}
                className={`note-editor w-full h-full outline-none text-slate-900 leading-relaxed prose prose-lg max-w-none ${
                  viewingVersion ? 'opacity-70 cursor-default' : ''
                }`}
                style={{ 
                  minHeight: '500px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileRead(file);
                }
              }}
              style={{ display: 'none' }}
              accept="*/*"
              multiple
            />

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Rich Text Editor</span>
                </span>
                <span className="flex items-center space-x-2">
                  <Clock size={14} />
                  <span>{(editorRef.current?.textContent || '').length} characters</span>
                </span>
                <span className="flex items-center space-x-2">
                  <Upload size={14} />
                  <span>Drag & drop files</span>
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span>Auto-save enabled</span>
                <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">Ctrl+S to save</kbd>
              </div>
            </div>
          </>
        ) : (
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

      {/* Version History Panel */}
      {showVersionHistory && selectedNote && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900 flex items-center space-x-2">
                <History size={18} />
                <span>Version History</span>
              </h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {selectedNote.versions?.length || 0} saved versions
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* Current Version */}
            <div 
              className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${!viewingVersion ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              onClick={() => viewCurrentVersion()}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-slate-900">Current Version</span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(selectedNote.updated).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {selectedNote.content?.replace(/<[^>]*>/g, '').substring(0, 100) || 'No content'}...
              </p>
              <div className="text-xs text-slate-500 mb-2">
                {(selectedNote.content?.replace(/<[^>]*>/g, '') || '').length} characters • {' '}
                {(selectedNote.content?.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0) || []).length} words
              </div>
              {!viewingVersion && (
                <div className="text-xs text-blue-600 font-medium">Currently viewing</div>
              )}
            </div>

            {/* Previous Versions */}
            {selectedNote.versions && selectedNote.versions.length > 0 ? (
              selectedNote.versions.slice().reverse().map((version) => (
                <div 
                  key={version.versionNumber}
                  className={`p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                    viewingVersion?.versionNumber === version.versionNumber ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => viewVersion(version)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <span className="font-medium text-slate-900">Version {version.versionNumber}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(version.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                    {version.content?.replace(/<[^>]*>/g, '').substring(0, 100) || 'No content'}...
                  </p>
                  
                  <div className="text-xs text-slate-500 mb-2">
                    {version.characterCount} characters • {version.wordCount} words
                  </div>
                  
                  <div className="text-xs text-slate-600 mb-3">
                    {version.changesSummary}
                  </div>
                  
                  {version.referencedFiles && version.referencedFiles.length > 0 && (
                    <div className="text-xs text-slate-500 mb-3">
                      📎 {version.referencedFiles.length} file{version.referencedFiles.length > 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {viewingVersion?.versionNumber === version.versionNumber && (
                    <div className="text-xs text-blue-600 font-medium mb-2">Currently viewing</div>
                  )}
                  
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => restoreVersion(version)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <History size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No versions saved yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Versions are created when you manually save or make significant changes
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals follow here... */}

      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {setShowFolderModal(false); setNewFolderName('');}}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Rename Folder</h3>
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && renameFolder()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRenameFolderModal(false); 
                  setRenameFolderName('');
                  setEditingFolder(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={renameFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Notebook Modal */}
      {showRenameNotebookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Rename Notebook</h3>
            <input
              type="text"
              value={renameNotebookName}
              onChange={(e) => setRenameNotebookName(e.target.value)}
              placeholder="Notebook name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && renameNotebook()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRenameNotebookModal(false); 
                  setRenameNotebookName('');
                  setEditingNotebook(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={renameNotebook}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Tag</h3>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createTag()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {setShowTagModal(false); setNewTagName('');}}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createTag}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notebook Modal */}
      {showNotebookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Create New Notebook</h3>
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              placeholder="Notebook name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createNotebook()}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {setShowNotebookModal(false); setNewNotebookName('');}}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={createNotebook}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Key className="mr-2" size={20} />
              Change Password
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPasswordChange}
                  onChange={(e) => setNewPasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPasswordChange}
                  onChange={(e) => setConfirmPasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setCurrentPassword('');
                  setNewPasswordChange('');
                  setConfirmPasswordChange('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={changePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Admin Modal */}
      {showUserAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Users className="mr-2" size={20} />
              User Administration
            </h3>
            
            <div className="mb-6">
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center space-x-2"
              >
                <UserPlus size={16} />
                <span>Create New User</span>
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">All Users ({users.length})</h4>
              {users.map(userItem => (
                <div key={userItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{userItem.name}</h5>
                        {userItem.isAdmin && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Admin</span>
                        )}
                        {userItem.otpEnabled && (
                          <Shield size={14} className="text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{userItem.email}</p>
                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                        <div>Created: {new Date(userItem.createdAt).toLocaleDateString()}</div>
                        <div>Last Login: {userItem.lastLogin ? new Date(userItem.lastLogin).toLocaleDateString() : 'Never'}</div>
                        <div>Notes: {userItem.notes?.length || 0} | Notebooks: {userItem.notebooks?.length || 0}</div>
                        <div>Session Timeout: {userItem.sessionTimeout} minutes</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {userItem.id !== user.id && (
                        <button
                          onClick={() => setShowDeleteUserConfirm(userItem.id)}
                          className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowUserAdmin(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <UserPlus className="mr-2" size={20} />
              Create New User
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmNewUserPassword}
                  onChange={(e) => setConfirmNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setConfirmNewUserPassword('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteUserConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-red-700 flex items-center">
              <AlertTriangle className="mr-2" size={20} />
              Delete User
            </h3>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteUserConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(showDeleteUserConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {showUserSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Settings className="mr-2" size={20} />
              Security Settings
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
                <select
                  value={sessionTimeoutHours}
                  onChange={(e) => {
                    const hours = e.target.value;
                    const minutes = Math.round(parseFloat(hours) * 60);
                    setSessionTimeout(minutes);
                    setSessionTimeoutHours(hours);
                    if (user) {
                      setUsers(prev => prev.map(u => 
                        u.id === user.id ? { ...u, sessionTimeout: minutes } : u
                      ));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="0.25">15 minutes</option>
                  <option value="0.5">30 minutes</option>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                  <option value="24">1 day</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-logout after inactivity</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  {otpEnabled ? (
                    <span className="flex items-center text-blue-600 text-sm">
                      <Shield size={16} className="mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Disabled</span>
                  )}
                </div>
                
                {otpEnabled ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowBackupCodes(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center space-x-2"
                    >
                      <Key size={16} />
                      <span>View Backup Codes</span>
                    </button>
                    <button
                      onClick={disableOtp}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Disable 2FA
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowOtpSetup(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center space-x-2"
                  >
                    <Smartphone size={16} />
                    <span>Enable 2FA</span>
                  </button>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <button
                  onClick={exportUserData}
                  className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center justify-center space-x-2"
                >
                  <Download size={16} />
                  <span>Export My Data</span>
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowUserSettings(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Setup Modal */}
      {showOtpSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Smartphone className="mr-2" size={20} />
              Enable Two-Factor Authentication
            </h3>
            
            <p className="text-gray-600 mb-6">
              Two-factor authentication adds an extra layer of security to your account. 
              You'll need an authenticator app to use this feature.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowOtpSetup(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={setupOtp}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Key className="mr-2" size={20} />
              Backup Codes
            </h3>
            
            <p className="text-gray-600 mb-4 text-sm">
              Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2 mb-6">
              {backupCodes.map((codeObj, index) => (
                <div key={index} className={`${codeObj.used ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {codeObj.code}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowBackupCodes(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoetApp;