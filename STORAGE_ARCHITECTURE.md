# Note Storage Architecture

## 📁 **Folder Structure**

```
notes/
├── user-1/
│   ├── note-uuid-1/
│   │   ├── note.md
│   │   ├── metadata.json
│   │   ├── attachments/
│   │   │   ├── document.pdf
│   │   │   ├── spreadsheet.xlsx
│   │   │   └── image.png
│   │   └── versions/
│   │       ├── v1-2025-01-15.md
│   │       └── v2-2025-01-20.md
│   └── note-uuid-2/
│       ├── note.md
│       ├── metadata.json
│       └── attachments/
└── user-2/
    └── note-uuid-3/
        ├── note.md
        ├── metadata.json
        └── attachments/
```

## 📄 **File Formats**

### **note.md** (Main Content)

```markdown
# Meeting Notes - Q1 Planning

## Agenda Items

- [ ] Review budget allocation
- [ ] Set team goals
- [x] Plan quarterly milestones

## Action Items

1. Follow up with finance team
2. Schedule follow-up meeting
3. Update project timeline

## Attachments

- [Budget Spreadsheet](./attachments/q1-budget.xlsx)
- [Project Timeline](./attachments/timeline.pdf)
```

### **metadata.json** (Note Metadata)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Meeting Notes - Q1 Planning",
  "created": "2025-01-15T10:30:00Z",
  "updated": "2025-01-20T14:45:00Z",
  "tags": ["work", "meetings", "q1"],
  "notebook": "work-projects",
  "folder": "meetings",
  "starred": false,
  "deleted": false,
  "version": 2,
  "attachments": [
    {
      "filename": "q1-budget.xlsx",
      "size": 24576,
      "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "uploaded": "2025-01-15T10:35:00Z"
    },
    {
      "filename": "timeline.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "uploaded": "2025-01-15T10:40:00Z"
    }
  ],
  "evernote_import": {
    "original_id": "12345",
    "imported_at": "2025-01-15T09:00:00Z",
    "source": "evernote"
  }
}
```

## 🔄 **Import/Export Benefits**

### **Evernote Import**

- Drop exported Evernote folders directly into user directory
- Automatic metadata.json generation from existing markdown
- Preserve all attachments and file relationships
- Maintain creation/modification dates

### **Export Options**

- Zip entire user folder for backup
- Export as markdown + attachments for any platform
- Import into any markdown-based system
- Perfect portability

### **Version Control**

- Each note edit creates timestamped markdown backup
- Easy diff viewing between versions
- Restore any previous version
- Git-friendly storage format

## 🏗️ **Implementation Architecture**

### **Backend Storage API**

```typescript
class NoteStorage {
  async createNote(userId: string, note: NoteData): Promise<string>;
  async updateNote(
    userId: string,
    noteId: string,
    content: string
  ): Promise<void>;
  async deleteNote(userId: string, noteId: string): Promise<void>;
  async addAttachment(
    userId: string,
    noteId: string,
    file: File
  ): Promise<string>;
  async removeAttachment(
    userId: string,
    noteId: string,
    filename: string
  ): Promise<void>;
  async exportNote(userId: string, noteId: string): Promise<Blob>;
  async importEvernoteFolder(userId: string, folder: FileList): Promise<void>;
}
```

### **Frontend Editor Integration**

- TipTap editor for rich text editing
- Real-time markdown conversion
- Drag & drop file attachment
- Attachment preview and management
- Auto-save to markdown files

### **Sync Strategy**

- Real-time file system watching
- Automatic backup creation
- Conflict resolution for concurrent edits
- Cloud storage integration (optional)

## ⚙️ **Admin Configuration**

### **System Settings**

```json
{
  "storage": {
    "notesPath": "/Users/username/Documents/Noet/notes",
    "backupPath": "/Users/username/Documents/Noet/backups",
    "maxAttachmentSize": 100,
    "allowedFileTypes": [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "tiff",
      "svg",
      "txt",
      "md"
    ],
    "autoBackup": true,
    "backupInterval": 24
  },
  "security": {
    "sessionTimeout": 30,
    "requirePassword": true,
    "allowRegistration": false
  }
}
```

### **Admin UI for Path Configuration**

- Browse and select notes folder location
- Validate folder permissions (read/write access)
- Test folder accessibility before saving
- Migration assistant when changing locations
- Backup current location before moving
- Import existing notes from previous location

### **Path Validation**

```typescript
interface StorageValidation {
  path: string;
  exists: boolean;
  writable: boolean;
  readable: boolean;
  spaceAvailable: number;
  noteCount: number;
  errors: string[];
}
```

### **Migration Process**

1. Validate new location
2. Create backup of current notes
3. Copy all notes to new location
4. Update configuration
5. Verify migration success
6. Optional: Remove old location

## 🚀 **Migration Path**

1. **Phase 1**: Implement TipTap editor with markdown storage
2. **Phase 2**: Add file attachment system
3. **Phase 3**: Build Evernote import functionality
4. **Phase 4**: Add version control and backup features
5. **Phase 5**: Implement sync and collaboration features

This architecture ensures maximum portability while maintaining rich editing capabilities.
