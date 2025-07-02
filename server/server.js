import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import PortManager from "./portManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const portManager = new PortManager();
const PORT = portManager.getBackendPort();
const HOST = portManager.getBackendHost();

// Default notes storage path - can be configured via admin UI
let NOTES_BASE_PATH = process.env.NOTES_PATH || join(process.cwd(), "notes");

// In-memory storage for demo (in production, use a proper database)
const users = new Map([
  [
    "user-1",
    {
      id: "user-1",
      email: "demo@example.com",
      name: "Demo User",
      password: "demo123", // In production, use bcrypt hashing
      isAdmin: false,
      created: new Date().toISOString(),
      settings: {
        sessionTimeout: 20160 * 60 * 1000, // 2 weeks (20160 minutes)
        autoSave: true,
        theme: "light",
      },
    },
  ],
  [
    "admin-1",
    {
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123",
      isAdmin: true,
      created: new Date().toISOString(),
      settings: {
        sessionTimeout: 20160 * 60 * 1000, // 2 weeks (20160 minutes)
        autoSave: true,
        theme: "light",
      },
    },
  ],
]);

const notebooks = new Map();
const tags = new Map();
const folders = new Map();

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: "110mb" })); // Allow large payloads for file uploads

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { userId, noteId } = req.params;
      const attachmentsPath = join(
        NOTES_BASE_PATH,
        userId,
        noteId,
        "attachments"
      );
      await fs.mkdir(attachmentsPath, { recursive: true });
      cb(null, attachmentsPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Keep original filename but make it safe
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, safeName);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/markdown",
      "application/zip",
      "application/json",
      "application/octet-stream", // Generic binary type
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Helper function to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

// Helper function to get note path
function getNotePath(userId, noteId) {
  return join(NOTES_BASE_PATH, userId, noteId);
}

// Helper function to read metadata
async function readMetadata(userId, noteId) {
  try {
    const metadataPath = join(getNotePath(userId, noteId), "metadata.json");
    const data = await fs.readFile(metadataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

// Helper function to write metadata
async function writeMetadata(userId, noteId, metadata) {
  const notePath = getNotePath(userId, noteId);
  await ensureDir(notePath);
  const metadataPath = join(notePath, "metadata.json");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

// Helper function to read note content
async function readNoteContent(userId, noteId) {
  try {
    const contentPath = join(getNotePath(userId, noteId), "note.md");
    return await fs.readFile(contentPath, "utf8");
  } catch (error) {
    return "";
  }
}

// Helper function to write note content
async function writeNoteContent(userId, noteId, content) {
  const notePath = getNotePath(userId, noteId);
  await ensureDir(notePath);
  const contentPath = join(notePath, "note.md");
  await fs.writeFile(contentPath, content);
}

// API Routes

// Enhanced health check endpoint
app.get("/api/health", (req, res) => {
  const healthData = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "noet-backend",
    version: "1.0.0",
    port: PORT,
    host: HOST,
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    notesPath: NOTES_BASE_PATH,
  };

  res.json(healthData);
});

// Get storage configuration
app.get("/api/config", (req, res) => {
  const actualPort = req.socket.localPort; // Get the actual port the server is running on
  const actualHost = req.hostname || HOST;

  res.json({
    notesPath: NOTES_BASE_PATH,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "bmp",
      "tiff",
      "svg",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "md",
      "zip",
      "json",
    ],
    // Add server URL information for frontend discovery
    server: {
      backendUrl: `http://${actualHost}:${actualPort}`,
      actualPort: actualPort,
      configuredPort: PORT,
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Update storage path (admin only)
app.post("/api/storage/path", async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: "Path is required" });
    }

    // In a real app, you'd validate admin permissions here
    NOTES_BASE_PATH = path;
    await ensureDir(NOTES_BASE_PATH);

    res.json({ success: true, path: NOTES_BASE_PATH });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate storage path
app.post("/api/storage/validate", async (req, res) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: "Path is required" });
    }

    // Check if path exists and is writable
    try {
      await fs.access(path, fs.constants.F_OK);
      await fs.access(path, fs.constants.W_OK);

      // Get directory stats
      const stats = await fs.stat(path);
      if (!stats.isDirectory()) {
        return res.json({
          valid: false,
          errors: ["Path is not a directory"],
          path,
        });
      }

      // Count existing notes (simplified)
      let noteCount = 0;
      try {
        const userDirs = await fs.readdir(path);
        for (const userDir of userDirs) {
          const userPath = join(path, userDir);
          const userStats = await fs.stat(userPath);
          if (userStats.isDirectory()) {
            const notes = await fs.readdir(userPath);
            noteCount += notes.length;
          }
        }
      } catch (e) {
        // Ignore errors counting notes
      }

      res.json({
        valid: true,
        path,
        writable: true,
        spaceAvailable: "Available",
        noteCount,
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        res.json({
          valid: false,
          errors: ["Path does not exist"],
          path,
        });
      } else if (error.code === "EACCES") {
        res.json({
          valid: false,
          errors: ["Permission denied - path is not writable"],
          path,
        });
      } else {
        res.json({
          valid: false,
          errors: [`Error accessing path: ${error.message}`],
          path,
        });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes for a user
app.get("/api/:userId/notes", async (req, res) => {
  try {
    const { userId } = req.params;
    const userPath = join(NOTES_BASE_PATH, userId);

    // Extract query parameters for filtering
    const { starred, deleted, archived, since, notebook, folder, tag } =
      req.query;

    try {
      const noteDirs = await fs.readdir(userPath);
      const notes = [];

      for (const noteId of noteDirs) {
        const notePath = join(userPath, noteId);
        const stats = await fs.stat(notePath);

        if (stats.isDirectory()) {
          const metadata = await readMetadata(userId, noteId);
          if (metadata) {
            // Apply filters
            let includeNote = true;

            // Filter by deleted status
            if (deleted === "true") {
              // Only include notes that are explicitly marked as deleted (true)
              if (metadata.deleted !== true) {
                includeNote = false;
              }
            } else {
              // For all other views, exclude deleted notes (only include non-deleted)
              if (metadata.deleted === true) {
                includeNote = false;
              }
            }

            // Filter by starred status
            if (includeNote && starred === "true" && !metadata.starred) {
              includeNote = false;
            }

            // Filter by archived status
            if (includeNote && archived === "true" && !metadata.archived) {
              includeNote = false;
            }

            // Filter by date (recent notes)
            if (includeNote && since) {
              const sinceDate = new Date(since);
              const noteDate = new Date(metadata.updated);
              if (noteDate <= sinceDate) {
                includeNote = false;
              }
            }

            // Filter by notebook
            if (includeNote && notebook && metadata.notebook !== notebook) {
              includeNote = false;
            }

            // Filter by folder
            if (includeNote && folder && metadata.folder !== folder) {
              includeNote = false;
            }

            // Filter by tag
            if (includeNote && tag) {
              const noteTags = metadata.tags || [];
              const hasTag = noteTags.some((noteTag) =>
                typeof noteTag === "string"
                  ? noteTag === tag
                  : noteTag.id === tag
              );
              if (!hasTag) {
                includeNote = false;
              }
            }

            if (includeNote) {
              notes.push(metadata);
            }
          }
        }
      }

      // Sort notes by updated date (most recent first)
      notes.sort((a, b) => new Date(b.updated) - new Date(a.updated));

      res.json(notes);
    } catch (error) {
      if (error.code === "ENOENT") {
        res.json([]); // No notes yet
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific note
app.get("/api/:userId/notes/:noteId", async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    const metadata = await readMetadata(userId, noteId);
    const content = await readNoteContent(userId, noteId);

    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({
      ...metadata,
      content,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
app.post("/api/:userId/notes", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      title = "Untitled Note",
      content = "",
      tags = [],
      notebook = null,
    } = req.body;

    const noteId = uuidv4();
    const now = new Date().toISOString();

    const metadata = {
      id: noteId,
      title,
      created: now,
      updated: now,
      tags,
      notebook,
      folder: null,
      starred: false,
      deleted: false,
      version: 1,
      attachments: [],
    };

    await writeMetadata(userId, noteId, metadata);
    await writeNoteContent(userId, noteId, content);

    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note
app.put("/api/:userId/notes/:noteId", async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    const { content, metadata: updatedFields } = req.body;

    const metadata = await readMetadata(userId, noteId);
    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      ...updatedFields,
      updated: new Date().toISOString(),
      version: metadata.version + 1,
    };

    await writeMetadata(userId, noteId, updatedMetadata);

    if (content !== undefined) {
      await writeNoteContent(userId, noteId, content);
    }

    res.json(updatedMetadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note
app.delete("/api/:userId/notes/:noteId", async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    // Read the current metadata
    const metadata = await readMetadata(userId, noteId);
    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Implement soft delete by setting deleted flag to true
    metadata.deleted = true;
    metadata.deletedAt = new Date().toISOString();
    metadata.updated = new Date().toISOString();

    // Save the updated metadata
    await writeMetadata(userId, noteId, metadata);

    res.json({ success: true, message: "Note moved to trash" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload attachment
app.post(
  "/api/:userId/notes/:noteId/attachments",
  upload.single("file"),
  async (req, res) => {
    try {
      const { userId, noteId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Update metadata with attachment info
      const metadata = await readMetadata(userId, noteId);
      if (!metadata) {
        return res.status(404).json({ error: "Note not found" });
      }

      const attachment = {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
        uploaded: new Date().toISOString(),
      };

      metadata.attachments.push(attachment);
      metadata.updated = new Date().toISOString();

      await writeMetadata(userId, noteId, metadata);

      res.json({
        attachment,
        relativePath: `./attachments/${file.filename}`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get attachment
app.get(
  "/api/:userId/notes/:noteId/attachments/:filename",
  async (req, res) => {
    try {
      const { userId, noteId, filename } = req.params;
      const attachmentPath = join(
        NOTES_BASE_PATH,
        userId,
        noteId,
        "attachments",
        filename
      );

      await fs.access(attachmentPath);
      res.sendFile(attachmentPath);
    } catch (error) {
      res.status(404).json({ error: "Attachment not found" });
    }
  }
);

// Delete attachment
app.delete(
  "/api/:userId/notes/:noteId/attachments/:filename",
  async (req, res) => {
    try {
      const { userId, noteId, filename } = req.params;
      const attachmentPath = join(
        NOTES_BASE_PATH,
        userId,
        noteId,
        "attachments",
        filename
      );

      // Remove file
      await fs.unlink(attachmentPath);

      // Update metadata
      const metadata = await readMetadata(userId, noteId);
      if (metadata) {
        metadata.attachments = metadata.attachments.filter(
          (att) => att.filename !== filename
        );
        metadata.updated = new Date().toISOString();
        await writeMetadata(userId, noteId, metadata);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ==========================================
// NOTEBOOKS API
// ==========================================

// Get all notebooks for a user
app.get("/api/:userId/notebooks", async (req, res) => {
  try {
    const { userId } = req.params;
    const userNotebooks = Array.from(notebooks.values())
      .filter((nb) => nb.userId === userId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(userNotebooks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new notebook
app.post("/api/:userId/notebooks", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description = "", color = "#3B82F6" } = req.body;

    const notebookId = uuidv4();
    const notebook = {
      id: notebookId,
      userId,
      name,
      description,
      color,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      noteCount: 0,
    };

    notebooks.set(notebookId, notebook);
    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a notebook
app.put("/api/:userId/notebooks/:notebookId", async (req, res) => {
  try {
    const { userId, notebookId } = req.params;
    const updates = req.body;

    const notebook = notebooks.get(notebookId);
    if (!notebook || notebook.userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    Object.assign(notebook, updates, { updated: new Date().toISOString() });
    notebooks.set(notebookId, notebook);

    res.json(notebook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a notebook
app.delete("/api/:userId/notebooks/:notebookId", async (req, res) => {
  try {
    const { userId, notebookId } = req.params;

    const notebook = notebooks.get(notebookId);
    if (!notebook || notebook.userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    notebooks.delete(notebookId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder notebooks
app.post("/api/:userId/notebooks/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceNotebook = notebooks.get(sourceId);
    const targetNotebook = notebooks.get(targetId);

    if (
      !sourceNotebook ||
      !targetNotebook ||
      sourceNotebook.userId !== userId ||
      targetNotebook.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both notebooks not found" });
    }

    // For in-memory storage, we can implement ordering by updating a sort order field
    const userNotebooks = Array.from(notebooks.values()).filter(
      (nb) => nb.userId === userId
    );

    // Update sort orders
    userNotebooks.forEach((notebook, index) => {
      if (!notebook.sortOrder) notebook.sortOrder = index;
    });

    // Calculate new sort order for the moved notebook
    if (position === "before") {
      sourceNotebook.sortOrder = targetNotebook.sortOrder - 0.5;
    } else {
      sourceNotebook.sortOrder = targetNotebook.sortOrder + 0.5;
    }

    notebooks.set(sourceId, sourceNotebook);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// TAGS API
// ==========================================

// Get all tags for a user
app.get("/api/:userId/tags", async (req, res) => {
  try {
    const { userId } = req.params;
    const userTags = Array.from(tags.values())
      .filter((tag) => tag.userId === userId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(userTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new tag
app.post("/api/:userId/tags", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, color = "#10B981" } = req.body;

    const tagId = uuidv4();
    const tag = {
      id: tagId,
      userId,
      name,
      color,
      created: new Date().toISOString(),
      noteCount: 0,
    };

    tags.set(tagId, tag);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a tag
app.put("/api/:userId/tags/:tagId", async (req, res) => {
  try {
    const { userId, tagId } = req.params;
    const updates = req.body;

    const tag = tags.get(tagId);
    if (!tag || tag.userId !== userId) {
      return res.status(404).json({ error: "Tag not found" });
    }

    Object.assign(tag, updates);
    tags.set(tagId, tag);

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a tag
app.delete("/api/:userId/tags/:tagId", async (req, res) => {
  try {
    const { userId, tagId } = req.params;

    const tag = tags.get(tagId);
    if (!tag || tag.userId !== userId) {
      return res.status(404).json({ error: "Tag not found" });
    }

    tags.delete(tagId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder tags
app.post("/api/:userId/tags/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceTag = tags.get(sourceId);
    const targetTag = tags.get(targetId);

    if (
      !sourceTag ||
      !targetTag ||
      sourceTag.userId !== userId ||
      targetTag.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both tags not found" });
    }

    // For in-memory storage, we can implement ordering by updating a sort order field
    // In a real database, you'd handle this differently
    const userTags = Array.from(tags.values()).filter(
      (t) => t.userId === userId
    );
    const currentTime = Date.now();

    // Update sort orders
    userTags.forEach((tag, index) => {
      if (!tag.sortOrder) tag.sortOrder = index;
    });

    // Remove source from its current position and insert at target position
    const sourceIndex = userTags.findIndex((t) => t.id === sourceId);
    const targetIndex = userTags.findIndex((t) => t.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Calculate new sort order for the moved tag
      if (position === "before") {
        sourceTag.sortOrder = targetTag.sortOrder - 0.5;
      } else {
        sourceTag.sortOrder = targetTag.sortOrder + 0.5;
      }

      tags.set(sourceId, sourceTag);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// FOLDERS API
// ==========================================

// Get all folders for a user
app.get("/api/:userId/folders", async (req, res) => {
  try {
    const { userId } = req.params;
    const userFolders = Array.from(folders.values())
      .filter((folder) => folder.userId === userId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(userFolders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new folder
app.post("/api/:userId/folders", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, parentId = null, color = "#8B5CF6" } = req.body;

    const folderId = uuidv4();
    const folder = {
      id: folderId,
      userId,
      name,
      parentId,
      color,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      noteCount: 0,
    };

    folders.set(folderId, folder);
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a folder
app.put("/api/:userId/folders/:folderId", async (req, res) => {
  try {
    const { userId, folderId } = req.params;
    const updates = req.body;

    const folder = folders.get(folderId);
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: "Folder not found" });
    }

    Object.assign(folder, updates, { updated: new Date().toISOString() });
    folders.set(folderId, folder);

    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a folder
app.delete("/api/:userId/folders/:folderId", async (req, res) => {
  try {
    const { userId, folderId } = req.params;

    const folder = folders.get(folderId);
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: "Folder not found" });
    }

    folders.delete(folderId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder folders
app.post("/api/:userId/folders/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceFolder = folders.get(sourceId);
    const targetFolder = folders.get(targetId);

    if (
      !sourceFolder ||
      !targetFolder ||
      sourceFolder.userId !== userId ||
      targetFolder.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both folders not found" });
    }

    // For in-memory storage, we can implement ordering by updating a sort order field
    const userFolders = Array.from(folders.values()).filter(
      (f) => f.userId === userId
    );

    // Update sort orders
    userFolders.forEach((folder, index) => {
      if (!folder.sortOrder) folder.sortOrder = index;
    });

    // Calculate new sort order for the moved folder
    if (position === "before") {
      sourceFolder.sortOrder = targetFolder.sortOrder - 0.5;
    } else {
      sourceFolder.sortOrder = targetFolder.sortOrder + 0.5;
    }

    folders.set(sourceId, sourceFolder);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USER MANAGEMENT API
// ==========================================

// Get user profile
app.get("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove password from response
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put("/api/users/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't allow password changes through this endpoint
    const { password, ...allowedUpdates } = updates;
    Object.assign(user, allowedUpdates);
    users.set(userId, user);

    const { password: _, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
app.post("/api/users/:userId/change-password", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // In production, use bcrypt.compare
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // In production, use bcrypt.hash
    user.password = newPassword;
    users.set(userId, user);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENHANCED NOTES API
// ==========================================

// Get notes with filtering and sorting
app.get("/api/:userId/notes/search", async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      search,
      tags: tagFilter,
      notebook,
      folder,
      sortBy = "updated",
      sortOrder = "desc",
      limit = 50,
      offset = 0,
    } = req.query;

    const userPath = join(NOTES_BASE_PATH, userId);

    try {
      const noteDirs = await fs.readdir(userPath);
      let notes = [];

      for (const noteId of noteDirs) {
        const notePath = join(userPath, noteId);
        const stats = await fs.stat(notePath);

        if (stats.isDirectory()) {
          const metadata = await readMetadata(userId, noteId);
          if (metadata) {
            // Apply filters
            if (
              search &&
              !metadata.title.toLowerCase().includes(search.toLowerCase())
            ) {
              continue;
            }

            if (tagFilter && !metadata.tags.includes(tagFilter)) {
              continue;
            }

            if (notebook && metadata.notebook !== notebook) {
              continue;
            }

            if (folder && metadata.folder !== folder) {
              continue;
            }

            notes.push(metadata);
          }
        }
      }

      // Sort notes
      notes.sort((a, b) => {
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

      // Apply pagination
      const paginatedNotes = notes.slice(offset, offset + limit);

      res.json({
        notes: paginatedNotes,
        total: notes.length,
        offset,
        limit,
      });
    } catch (error) {
      if (error.code === "ENOENT") {
        res.json({ notes: [], total: 0, offset, limit });
      } else {
        throw error;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 100MB." });
    }
  }

  res.status(500).json({ error: "Internal server error" });
});

// Start server with strict port enforcement
async function startServer() {
  try {
    // Check if port is available
    const isAvailable = await portManager.isPortAvailable(PORT, HOST);

    if (!isAvailable) {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.error(`💡 Kill the process using port ${PORT} with: lsof -ti:${PORT} | xargs kill -9`);
      console.error(`� Or change the port in config.json`);
      process.exit(1);
    }

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Noet server running on http://${HOST}:${PORT}`);
      console.log(`📁 Notes storage path: ${NOTES_BASE_PATH}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

// Permanent delete (for emptying trash)
app.delete("/api/:userId/notes/:noteId/permanent", async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    // Check if note is in trash first
    const metadata = await readMetadata(userId, noteId);
    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (!metadata.deleted) {
      return res
        .status(400)
        .json({ error: "Note must be in trash before permanent deletion" });
    }

    // Permanently delete the note directory
    const notePath = getNotePath(userId, noteId);
    await fs.rm(notePath, { recursive: true, force: true });

    res.json({ success: true, message: "Note permanently deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore note from trash
app.post("/api/:userId/notes/:noteId/restore", async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    // Read the current metadata
    const metadata = await readMetadata(userId, noteId);
    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    if (!metadata.deleted) {
      return res.status(400).json({ error: "Note is not in trash" });
    }

    // Restore by removing deleted flag
    metadata.deleted = false;
    delete metadata.deletedAt;
    metadata.updated = new Date().toISOString();

    // Save the updated metadata
    await writeMetadata(userId, noteId, metadata);

    res.json({ success: true, message: "Note restored from trash" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
