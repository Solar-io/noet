import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { v4 as uuidv4 } from "uuid";
import xml2js from "xml2js";
import PortManager from "./portManager.js";
import TurndownService from "turndown";
import { Buffer } from "buffer";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const portManager = new PortManager();
const PORT = portManager.getBackendPort();
const HOST = portManager.getBackendHost();

// Default notes storage path - can be configured via admin UI
let NOTES_BASE_PATH = process.env.NOTES_PATH || join(process.cwd(), "notes");
const USERS_FILE_PATH = join(process.cwd(), "users.json");

// Initialize markdown converter
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  br: "\n", // Handle line breaks properly
});

// Add custom rules for better conversion
turndownService.addRule("strikethrough", {
  filter: ["del", "s", "strike"],
  replacement: function (content) {
    return "~~" + content + "~~";
  },
});

// Add rule to ensure proper paragraph spacing
turndownService.addRule("paragraph", {
  filter: "p",
  replacement: function (content) {
    return "\n\n" + content + "\n\n";
  },
});

// Add rule to handle divs as paragraphs (common in Evernote)
turndownService.addRule("div", {
  filter: function (node) {
    return node.nodeName === "DIV" && !node.querySelector("div");
  },
  replacement: function (content) {
    // If the div contains text or inline elements, treat it as a paragraph
    if (content.trim()) {
      return "\n\n" + content + "\n\n";
    }
    return content;
  },
});

// Add rule to handle line breaks
turndownService.addRule("lineBreak", {
  filter: "br",
  replacement: function () {
    return "  \n"; // Two spaces + newline for markdown line break
  },
});

// Helper function to get file extension from mime type
function getMimeExtension(mimeType) {
  const mimeMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "pptx",
    "text/plain": "txt",
    "text/markdown": "md",
    "application/zip": "zip",
    "application/json": "json",
  };
  return mimeMap[mimeType] || "dat";
}

// User persistence functions
async function saveUsers() {
  try {
    const usersArray = Array.from(users.entries()).map(([id, user]) => [
      id,
      user,
    ]);
    const usersData = {
      version: 1,
      lastSaved: new Date().toISOString(),
      users: usersArray,
    };

    // Use atomic write to prevent corruption
    const tempFile = USERS_FILE_PATH + ".tmp";
    await fs.writeFile(tempFile, JSON.stringify(usersData, null, 2));
    await fs.rename(tempFile, USERS_FILE_PATH);

    console.log(`💾 Users saved to ${USERS_FILE_PATH} (${users.size} users)`);
  } catch (error) {
    console.error("❌ Failed to save users:", error.message);
  }
}

async function loadUsers() {
  try {
    // Check if users file exists
    try {
      await fs.access(USERS_FILE_PATH);
    } catch {
      console.log(
        "📄 No existing users file found, starting with default users"
      );
      await saveUsers(); // Create initial users file with defaults
      return;
    }

    const data = await fs.readFile(USERS_FILE_PATH, "utf8");
    const usersData = JSON.parse(data);

    if (usersData.version !== 1) {
      console.warn("⚠️ Users file version mismatch, using defaults");
      return;
    }

    // Clear existing users and load from file
    users.clear();

    for (const [id, user] of usersData.users) {
      users.set(id, user);
    }

    console.log(`📂 Loaded ${users.size} users from ${USERS_FILE_PATH}`);

    // Ensure default users exist
    if (
      !Array.from(users.values()).find((u) => u.email === "demo@example.com")
    ) {
      console.log("🔧 Adding missing demo user");
      users.set("user-1", {
        id: "user-1",
        email: "demo@example.com",
        name: "Demo User",
        password: "demo123",
        isAdmin: false,
        created: new Date().toISOString(),
        settings: {
          sessionTimeout: 20160 * 60 * 1000,
          autoSave: true,
          theme: "light",
        },
      });
    }

    if (
      !Array.from(users.values()).find((u) => u.email === "admin@example.com")
    ) {
      console.log("🔧 Adding missing admin user");
      users.set("admin-1", {
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
      });
    }

    // Save if we added default users
    if (users.size !== usersData.users.length) {
      await saveUsers();
    }
  } catch (error) {
    console.error("❌ Failed to load users, using defaults:", error.message);
    // Keep the default users that are already in the Map
  }
}

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

// All data is now loaded on-demand from disk - no more memory maps!

// Initialize demo notebooks for existing notes
const demoNotebooks = [
  {
    id: "3640a87b-099d-42f6-a687-d22ff79b82f3",
    userId: "user-1",
    name: "Work Projects",
    description: "Professional development notes",
    color: "#3B82F6",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 0,
  },
  {
    id: "47e11737-778a-440d-91ae-aa423b325ae1",
    userId: "user-1",
    name: "Personal",
    description: "Personal notes and ideas",
    color: "#10B981",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 1,
  },
  {
    id: "73de6ab4-b41e-49a9-8662-3fda18371dcb",
    userId: "user-1",
    name: "Learning",
    description: "Study notes and tutorials",
    color: "#8B5CF6",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 2,
  },
  {
    id: "9678289f-57cf-483c-952f-b360692f7f8d",
    userId: "user-1",
    name: "Ideas",
    description: "Creative ideas and brainstorming",
    color: "#F59E0B",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 3,
  },
  {
    id: "ab6cc683-41da-43e5-aa65-7e3e7016fb05",
    userId: "user-1",
    name: "Research",
    description: "Research notes and references",
    color: "#EF4444",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 4,
  },
  {
    id: "bafd6479-7c7b-4c5e-8e31-7d18f85276fc",
    userId: "user-1",
    name: "Meeting Notes",
    description: "Notes from meetings and discussions",
    color: "#06B6D4",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 5,
  },
  {
    id: "c77c52b9-32dd-446e-93c1-7c4107532126",
    userId: "user-1",
    name: "Archive",
    description: "Archived notes and references",
    color: "#6B7280",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    noteCount: 0,
    sortOrder: 6,
  },
];

// Demo notebooks will be created on-demand when users access their notebooks
// This ensures we don't populate memory maps but still provide demo data

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "'unsafe-inline'",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "http://localhost:3001",
          "http://localhost:3004",
        ],
        workerSrc: [
          "'self'",
          "blob:",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
          "data:",
        ],
        objectSrc: ["'self'", "data:"],
        frameSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://cdn.jsdelivr.net",
        ],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
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

// Separate multer config for imports (no noteId required)
const importStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const tempImportPath = join(NOTES_BASE_PATH, ".temp-imports");
      await fs.mkdir(tempImportPath, { recursive: true });
      cb(null, tempImportPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Add timestamp to avoid conflicts
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const uploadImport = multer({
  storage: importStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow Evernote export files and other common formats
    const allowedTypes = [
      "text/xml",
      "application/xml",
      "application/octet-stream", // Some browsers send ENEX files as binary
      "text/plain",
    ];

    // Also allow if filename ends with .enex
    if (
      allowedTypes.includes(file.mimetype) ||
      file.originalname.toLowerCase().endsWith(".enex")
    ) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed for import`), false);
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

// Helper function to check if a string is a UUID
function isUUID(str) {
  if (typeof str !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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

// Helper function to get tags file path
function getTagsFilePath(userId) {
  return join(NOTES_BASE_PATH, userId, "tags.json");
}

// ==========================================
// DISK-FIRST TAG OPERATIONS
// ==========================================

// Load all tags for a user from disk
async function loadAllUserTagsFromDisk(userId) {
  try {
    const tagsFilePath = getTagsFilePath(userId);
    if (fsSync.existsSync(tagsFilePath)) {
      const data = await fs.readFile(tagsFilePath, "utf8");
      const userTags = JSON.parse(data);
      console.log(
        `🏷️ Loaded ${userTags.length} tags for user ${userId} from disk`
      );
      return userTags;
    } else {
      console.log(`🏷️ No tags file found for user ${userId}, starting fresh`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error loading tags for user ${userId}:`, error);
    return [];
  }
}

// Load a specific tag from disk
async function loadTagFromDisk(userId, tagId) {
  try {
    const userTags = await loadAllUserTagsFromDisk(userId);
    const tag = userTags.find((t) => t.id === tagId);
    if (!tag) {
      throw new Error(`Tag ${tagId} not found for user ${userId}`);
    }
    return tag;
  } catch (error) {
    console.error(`Error loading tag ${tagId} for user ${userId}:`, error);
    throw error;
  }
}

// Save a single tag to disk
async function saveTagToDisk(userId, tagId, tag) {
  try {
    const userTags = await loadAllUserTagsFromDisk(userId);
    const existingIndex = userTags.findIndex((t) => t.id === tagId);

    if (existingIndex >= 0) {
      userTags[existingIndex] = tag;
    } else {
      userTags.push(tag);
    }

    const tagsFilePath = getTagsFilePath(userId);
    await ensureDir(join(NOTES_BASE_PATH, userId));
    await fs.writeFile(tagsFilePath, JSON.stringify(userTags, null, 2));

    console.log(`💾 Saved tag ${tagId} for user ${userId} to disk`);
  } catch (error) {
    console.error(`Error saving tag ${tagId} for user ${userId}:`, error);
    throw error;
  }
}

// Delete a tag from disk
async function deleteTagFromDisk(userId, tagId) {
  try {
    const userTags = await loadAllUserTagsFromDisk(userId);
    const filteredTags = userTags.filter((t) => t.id !== tagId);

    const tagsFilePath = getTagsFilePath(userId);
    await ensureDir(join(NOTES_BASE_PATH, userId));
    await fs.writeFile(tagsFilePath, JSON.stringify(filteredTags, null, 2));

    console.log(`🗑️ Deleted tag ${tagId} for user ${userId} from disk`);
  } catch (error) {
    console.error(`Error deleting tag ${tagId} for user ${userId}:`, error);
    throw error;
  }
}

// Update tag sort order on disk
async function updateTagSortOrderOnDisk(userId, tagId, sortOrder) {
  try {
    const userTags = await loadAllUserTagsFromDisk(userId);
    const tag = userTags.find((t) => t.id === tagId);

    if (!tag) {
      throw new Error(`Tag ${tagId} not found for user ${userId}`);
    }

    tag.sortOrder = sortOrder;
    tag.updated = new Date().toISOString();

    const tagsFilePath = getTagsFilePath(userId);
    await ensureDir(join(NOTES_BASE_PATH, userId));
    await fs.writeFile(tagsFilePath, JSON.stringify(userTags, null, 2));

    console.log(`📋 Updated sort order for tag ${tagId} for user ${userId}`);
  } catch (error) {
    console.error(
      `Error updating tag sort order ${tagId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Helper function to get notebooks file path
function getNotebooksFilePath(userId) {
  return join(NOTES_BASE_PATH, userId, "notebooks.json");
}

// ==========================================
// DISK-FIRST NOTEBOOK OPERATIONS
// ==========================================

// Load all notebooks for a user from disk
async function loadAllUserNotebooksFromDisk(userId) {
  try {
    const notebooksPath = getNotebooksFilePath(userId);
    if (fsSync.existsSync(notebooksPath)) {
      const content = await fs.readFile(notebooksPath, "utf8");
      const userNotebooks = JSON.parse(content);
      console.log(
        `📚 Loaded ${userNotebooks.length} notebooks for user ${userId} from disk`
      );
      return userNotebooks;
    } else {
      console.log(
        `📚 No notebooks file found for user ${userId}, starting fresh`
      );
      return [];
    }
  } catch (error) {
    console.error(`Error loading notebooks for user ${userId}:`, error);
    return [];
  }
}

// Load a specific notebook from disk
async function loadNotebookFromDisk(userId, notebookId) {
  try {
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);
    const notebook = userNotebooks.find((nb) => nb.id === notebookId);
    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found for user ${userId}`);
    }
    return notebook;
  } catch (error) {
    console.error(
      `Error loading notebook ${notebookId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Save a single notebook to disk
async function saveNotebookToDisk(userId, notebookId, notebook) {
  try {
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);
    const existingIndex = userNotebooks.findIndex((nb) => nb.id === notebookId);

    if (existingIndex >= 0) {
      userNotebooks[existingIndex] = notebook;
    } else {
      userNotebooks.push(notebook);
    }

    const notebooksPath = getNotebooksFilePath(userId);
    await ensureDir(dirname(notebooksPath));
    await fs.writeFile(
      notebooksPath,
      JSON.stringify(userNotebooks, null, 2),
      "utf8"
    );

    console.log(`💾 Saved notebook ${notebookId} for user ${userId} to disk`);
  } catch (error) {
    console.error(
      `Error saving notebook ${notebookId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Delete a notebook from disk
async function deleteNotebookFromDisk(userId, notebookId) {
  try {
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);
    const filteredNotebooks = userNotebooks.filter(
      (nb) => nb.id !== notebookId
    );

    const notebooksPath = getNotebooksFilePath(userId);
    await ensureDir(dirname(notebooksPath));
    await fs.writeFile(
      notebooksPath,
      JSON.stringify(filteredNotebooks, null, 2),
      "utf8"
    );

    console.log(
      `🗑️ Deleted notebook ${notebookId} for user ${userId} from disk`
    );
  } catch (error) {
    console.error(
      `Error deleting notebook ${notebookId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Update notebooks sort order on disk
async function updateNotebookSortOrderOnDisk(userId, notebookId, sortOrder) {
  try {
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);
    const notebook = userNotebooks.find((nb) => nb.id === notebookId);

    if (!notebook) {
      throw new Error(`Notebook ${notebookId} not found for user ${userId}`);
    }

    notebook.sortOrder = sortOrder;
    notebook.updated = new Date().toISOString();

    const notebooksPath = getNotebooksFilePath(userId);
    await ensureDir(dirname(notebooksPath));
    await fs.writeFile(
      notebooksPath,
      JSON.stringify(userNotebooks, null, 2),
      "utf8"
    );

    console.log(
      `📋 Updated sort order for notebook ${notebookId} for user ${userId}`
    );
  } catch (error) {
    console.error(
      `Error updating notebook sort order ${notebookId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Helper function to get folders file path
function getFoldersFilePath(userId) {
  return join(NOTES_BASE_PATH, userId, "folders.json");
}

// ==========================================
// DISK-FIRST FOLDER OPERATIONS
// ==========================================

// Load all folders for a user from disk
async function loadAllUserFoldersFromDisk(userId) {
  try {
    const foldersPath = getFoldersFilePath(userId);
    if (fsSync.existsSync(foldersPath)) {
      const content = await fs.readFile(foldersPath, "utf8");
      const userFolders = JSON.parse(content);
      console.log(
        `📁 Loaded ${userFolders.length} folders for user ${userId} from disk`
      );
      return userFolders;
    } else {
      console.log(
        `📁 No folders file found for user ${userId}, starting fresh`
      );
      return [];
    }
  } catch (error) {
    console.error(`Error loading folders for user ${userId}:`, error);
    return [];
  }
}

// Load a specific folder from disk
async function loadFolderFromDisk(userId, folderId) {
  try {
    const userFolders = await loadAllUserFoldersFromDisk(userId);
    const folder = userFolders.find((f) => f.id === folderId);
    if (!folder) {
      throw new Error(`Folder ${folderId} not found for user ${userId}`);
    }
    return folder;
  } catch (error) {
    console.error(
      `Error loading folder ${folderId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Save a single folder to disk
async function saveFolderToDisk(userId, folderId, folder) {
  try {
    const userFolders = await loadAllUserFoldersFromDisk(userId);
    const existingIndex = userFolders.findIndex((f) => f.id === folderId);

    if (existingIndex >= 0) {
      userFolders[existingIndex] = folder;
    } else {
      userFolders.push(folder);
    }

    const foldersPath = getFoldersFilePath(userId);
    await ensureDir(dirname(foldersPath));
    await fs.writeFile(
      foldersPath,
      JSON.stringify(userFolders, null, 2),
      "utf8"
    );

    console.log(`💾 Saved folder ${folderId} for user ${userId} to disk`);
  } catch (error) {
    console.error(`Error saving folder ${folderId} for user ${userId}:`, error);
    throw error;
  }
}

// Delete a folder from disk
async function deleteFolderFromDisk(userId, folderId) {
  try {
    const userFolders = await loadAllUserFoldersFromDisk(userId);
    const filteredFolders = userFolders.filter((f) => f.id !== folderId);

    const foldersPath = getFoldersFilePath(userId);
    await ensureDir(dirname(foldersPath));
    await fs.writeFile(
      foldersPath,
      JSON.stringify(filteredFolders, null, 2),
      "utf8"
    );

    console.log(`🗑️ Deleted folder ${folderId} for user ${userId} from disk`);
  } catch (error) {
    console.error(
      `Error deleting folder ${folderId} for user ${userId}:`,
      error
    );
    throw error;
  }
}

// Update folder sort order on disk
async function updateFolderSortOrderOnDisk(userId, folderId, sortOrder) {
  try {
    const userFolders = await loadAllUserFoldersFromDisk(userId);
    const folder = userFolders.find((f) => f.id === folderId);

    if (!folder) {
      throw new Error(`Folder ${folderId} not found for user ${userId}`);
    }

    folder.sortOrder = sortOrder;
    folder.updated = new Date().toISOString();

    const foldersPath = getFoldersFilePath(userId);
    await ensureDir(dirname(foldersPath));
    await fs.writeFile(
      foldersPath,
      JSON.stringify(userFolders, null, 2),
      "utf8"
    );

    console.log(
      `📋 Updated sort order for folder ${folderId} for user ${userId}`
    );
  } catch (error) {
    console.error(
      `Error updating folder sort order ${folderId} for user ${userId}:`,
      error
    );
    throw error;
  }
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
    const markdownContent = await readNoteContent(userId, noteId);

    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Convert markdown to HTML for the frontend editor
    const htmlContent = marked(markdownContent || "");

    res.json({
      ...metadata,
      content: htmlContent,
      markdown: markdownContent,
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
      markdown,
      tags = [],
      notebook = null,
    } = req.body;

    const noteId = uuidv4();
    const now = new Date().toISOString();

    // Convert HTML to markdown if markdown not provided
    let markdownContent = markdown;
    if (!markdown && content) {
      markdownContent = turndownService.turndown(content);
    } else if (!markdown && !content) {
      markdownContent = `# ${title}`;
    }

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
    await writeNoteContent(userId, noteId, markdownContent);

    // Convert markdown to HTML for response
    const htmlContent = marked(markdownContent);

    res.json({
      ...metadata,
      content: htmlContent,
      markdown: markdownContent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note
app.put("/api/:userId/notes/:noteId", async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    const { content, markdown, title, tags, notebook, folder, ...otherFields } =
      req.body;

    const metadata = await readMetadata(userId, noteId);
    if (!metadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Get current content for version comparison
    const currentMarkdown = await readNoteContent(userId, noteId);

    // Convert HTML content to markdown if markdown not provided
    let markdownContent = markdown;
    if (content !== undefined && !markdown) {
      markdownContent = turndownService.turndown(content);
    }

    // Determine version trigger
    let versionTrigger = null;
    if (markdownContent !== undefined && markdownContent !== currentMarkdown) {
      versionTrigger = "content_change";
    } else if (title && title !== metadata.title) {
      versionTrigger = "title_change";
    } else if (tags && JSON.stringify(tags) !== JSON.stringify(metadata.tags)) {
      versionTrigger = "tags_change";
    } else if (folder && folder !== metadata.folder) {
      versionTrigger = "folder_change";
    } else if (notebook && notebook !== metadata.notebook) {
      versionTrigger = "notebook_change";
    }

    // Create version before updating if needed
    if (versionTrigger) {
      await createVersionIfNeeded(
        userId,
        noteId,
        currentMarkdown,
        metadata,
        versionTrigger
      );
    }

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      ...otherFields,
      updated: new Date().toISOString(),
      version: metadata.version + 1,
    };

    if (title !== undefined) updatedMetadata.title = title;
    if (tags !== undefined) updatedMetadata.tags = tags;
    if (notebook !== undefined) updatedMetadata.notebook = notebook;
    if (folder !== undefined) updatedMetadata.folder = folder;

    await writeMetadata(userId, noteId, updatedMetadata);

    if (markdownContent !== undefined) {
      await writeNoteContent(userId, noteId, markdownContent);
    }

    // Convert markdown back to HTML for response
    const htmlContent = markdownContent ? marked(markdownContent) : undefined;

    res.json({
      ...updatedMetadata,
      content: htmlContent,
      markdown: markdownContent,
    });
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

      // Get file stats
      const stats = await fs.stat(attachmentPath);
      const fileSize = stats.size;

      // Set proper headers based on file type
      const fileExtension = filename.toLowerCase().split(".").pop();

      // Set Content-Type based on file extension
      if (fileExtension === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + filename + '"'
        );
      } else if (
        ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
          fileExtension
        )
      ) {
        const mimeTypes = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          bmp: "image/bmp",
          svg: "image/svg+xml",
        };
        res.setHeader("Content-Type", mimeTypes[fileExtension] || "image/jpeg");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + filename + '"'
        );
      } else if (["txt", "md"].includes(fileExtension)) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + filename + '"'
        );
      } else if (fileExtension === "json") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          'inline; filename="' + filename + '"'
        );
      } else {
        // For other files, suggest download
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="' + filename + '"'
        );
      }

      // Set additional security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Length", fileSize);

      // Enable CORS for cross-origin requests
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);

    // Sort notebooks by sortOrder
    const sortedNotebooks = userNotebooks.sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    // Add note count to each notebook
    const notebooksWithCounts = await Promise.all(
      sortedNotebooks.map(async (notebook) => {
        const userNotesPath = join(NOTES_BASE_PATH, userId);
        let noteCount = 0;
        try {
          const noteDirs = await fs.readdir(userNotesPath, {
            withFileTypes: true,
          });
          for (const dirent of noteDirs) {
            if (dirent.isDirectory()) {
              const metadataPath = join(
                userNotesPath,
                dirent.name,
                "metadata.json"
              );
              try {
                const content = await fs.readFile(metadataPath, "utf8");
                const noteData = JSON.parse(content);
                if (noteData.notebook === notebook.id && !noteData.deleted) {
                  noteCount++;
                }
              } catch (err) {
                // Skip if metadata.json doesn't exist or can't be read
                continue;
              }
            }
          }
        } catch (err) {
          // Directory doesn't exist or can't be read, count remains 0
        }
        return {
          ...notebook,
          noteCount,
        };
      })
    );

    res.json(notebooksWithCounts);
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

    await saveNotebookToDisk(userId, notebookId, notebook);

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

    const notebook = await loadNotebookFromDisk(userId, notebookId);
    if (!notebook || notebook.userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    Object.assign(notebook, updates, { updated: new Date().toISOString() });
    await saveNotebookToDisk(userId, notebookId, notebook);

    res.json(notebook);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Notebook not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a notebook
app.delete("/api/:userId/notebooks/:notebookId", async (req, res) => {
  try {
    const { userId, notebookId } = req.params;

    // Verify notebook exists before attempting deletion
    const notebook = await loadNotebookFromDisk(userId, notebookId);
    if (!notebook || notebook.userId !== userId) {
      return res.status(404).json({ error: "Notebook not found" });
    }

    await deleteNotebookFromDisk(userId, notebookId);

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Notebook not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Reorder notebooks
app.post("/api/:userId/notebooks/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceNotebook = await loadNotebookFromDisk(userId, sourceId);
    const targetNotebook = await loadNotebookFromDisk(userId, targetId);

    if (
      !sourceNotebook ||
      !targetNotebook ||
      sourceNotebook.userId !== userId ||
      targetNotebook.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both notebooks not found" });
    }

    // Load all user notebooks to update sort orders
    const userNotebooks = await loadAllUserNotebooksFromDisk(userId);

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

    await updateNotebookSortOrderOnDisk(
      userId,
      sourceId,
      sourceNotebook.sortOrder
    );

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "One or both notebooks not found" });
    }
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

    // Get explicitly created tags from disk (filter out any with missing names)
    const allUserTags = await loadAllUserTagsFromDisk(userId);
    const explicitTags = allUserTags
      .filter((tag) => tag.userId === userId && tag.name && tag.name.trim())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Generate dynamic tags from notes
    const dynamicTagCounts = new Map();
    const userNotesPath = join(NOTES_BASE_PATH, userId);

    if (fsSync.existsSync(userNotesPath)) {
      const scanForTags = (dirPath) => {
        const entries = fsSync.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            scanForTags(fullPath);
          } else if (entry.name === "metadata.json") {
            try {
              const metadata = JSON.parse(
                fsSync.readFileSync(fullPath, "utf8")
              );
              if (metadata.tags && Array.isArray(metadata.tags)) {
                metadata.tags.forEach((tagRef) => {
                  if (typeof tagRef === "string" && tagRef.trim()) {
                    const tagName = tagRef.trim();

                    // Filter out UUID tags or convert them to "unknown"
                    const UUID_REGEX =
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (UUID_REGEX.test(tagName)) {
                      // Skip UUID tags entirely
                      return;
                    }

                    dynamicTagCounts.set(
                      tagName,
                      (dynamicTagCounts.get(tagName) || 0) + 1
                    );
                  }
                });
              }
            } catch (error) {
              // Skip invalid metadata files
              console.warn(`Skipping invalid metadata: ${fullPath}`);
            }
          }
        }
      };

      scanForTags(userNotesPath);
    }

    // Create combined tag list
    const allTags = new Map();

    // Add explicit tags with their counts
    for (const tag of explicitTags) {
      let noteCount = 0;

      // Count notes that reference this tag (by name or ID)
      const userNotesPath = join(NOTES_BASE_PATH, userId);
      if (fsSync.existsSync(userNotesPath)) {
        const countTagUsage = (dirPath) => {
          const entries = fsSync.readdirSync(dirPath, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);

            if (entry.isDirectory()) {
              countTagUsage(fullPath);
            } else if (entry.name === "metadata.json") {
              try {
                const metadata = JSON.parse(
                  fsSync.readFileSync(fullPath, "utf8")
                );
                if (metadata.tags && Array.isArray(metadata.tags)) {
                  const hasTag = metadata.tags.some((noteTag) => {
                    if (typeof noteTag === "string") {
                      // Skip UUID tags when counting explicit tag usage
                      const UUID_REGEX =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                      if (UUID_REGEX.test(noteTag)) {
                        return false;
                      }
                      return noteTag === tag.name || noteTag === tag.id;
                    }
                    return noteTag === tag.id || noteTag.id === tag.id;
                  });

                  if (hasTag) {
                    noteCount++;
                  }
                }
              } catch (error) {
                console.warn(`Skipping invalid metadata: ${fullPath}`);
              }
            }
          }
        };

        countTagUsage(userNotesPath);
      }

      allTags.set(tag.name, {
        ...tag,
        noteCount,
      });
    }

    // Add dynamic tags that don't have explicit entities
    for (const [tagName, count] of dynamicTagCounts) {
      if (!allTags.has(tagName)) {
        // Create a dynamic tag entity
        allTags.set(tagName, {
          id: tagName, // Use name as ID for string tags
          userId,
          name: tagName,
          color: "#" + Math.floor(Math.random() * 16777215).toString(16), // Random color
          created: new Date().toISOString(),
          noteCount: count,
          dynamic: true, // Mark as dynamically generated
        });
      }
    }

    // Convert to array and sort by note count (most used first)
    const result = Array.from(allTags.values()).sort(
      (a, b) => (b.noteCount || 0) - (a.noteCount || 0)
    );

    res.json(result);
  } catch (error) {
    console.error("Error getting tags:", error);
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

    await saveTagToDisk(userId, tagId, tag);

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

    const tag = await loadTagFromDisk(userId, tagId);
    if (!tag || tag.userId !== userId) {
      return res.status(404).json({ error: "Tag not found" });
    }

    Object.assign(tag, updates, { updated: new Date().toISOString() });
    await saveTagToDisk(userId, tagId, tag);

    res.json(tag);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Tag not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a tag
app.delete("/api/:userId/tags/:tagId", async (req, res) => {
  try {
    const { userId, tagId } = req.params;

    // Verify tag exists before attempting deletion
    const tag = await loadTagFromDisk(userId, tagId);
    if (!tag || tag.userId !== userId) {
      return res.status(404).json({ error: "Tag not found" });
    }

    await deleteTagFromDisk(userId, tagId);

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Tag not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Reorder tags
app.post("/api/:userId/tags/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceTag = await loadTagFromDisk(userId, sourceId);
    const targetTag = await loadTagFromDisk(userId, targetId);

    if (
      !sourceTag ||
      !targetTag ||
      sourceTag.userId !== userId ||
      targetTag.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both tags not found" });
    }

    // Get all user tags and sort them by current sortOrder
    const userTags = await loadAllUserTagsFromDisk(userId);
    const sortedUserTags = userTags
      .filter((t) => t.userId === userId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Initialize sortOrder if not set
    sortedUserTags.forEach((tag, index) => {
      if (tag.sortOrder === undefined || tag.sortOrder === null) {
        tag.sortOrder = index;
      }
    });

    // Remove source tag from current position
    const sourceIndex = sortedUserTags.findIndex((t) => t.id === sourceId);
    const targetIndex = sortedUserTags.findIndex((t) => t.id === targetId);

    if (sourceIndex !== -1 && targetIndex !== -1) {
      // Remove source from array
      const [movedTag] = sortedUserTags.splice(sourceIndex, 1);

      // Calculate new target index after removal
      let newTargetIndex = sortedUserTags.findIndex((t) => t.id === targetId);

      // Insert at correct position
      if (position === "before") {
        sortedUserTags.splice(newTargetIndex, 0, movedTag);
      } else {
        sortedUserTags.splice(newTargetIndex + 1, 0, movedTag);
      }

      // Reassign sortOrder values to maintain proper order and save each tag
      for (let index = 0; index < sortedUserTags.length; index++) {
        const tag = sortedUserTags[index];
        tag.sortOrder = index;
        await saveTagToDisk(userId, tag.id, tag);
      }
    }

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "One or both tags not found" });
    }
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
    const userFolders = await loadAllUserFoldersFromDisk(userId);
    const sortedFolders = userFolders
      .filter((folder) => folder.userId === userId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    res.json(sortedFolders);
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

    await saveFolderToDisk(userId, folderId, folder);

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

    const folder = await loadFolderFromDisk(userId, folderId);
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: "Folder not found" });
    }

    Object.assign(folder, updates, { updated: new Date().toISOString() });
    await saveFolderToDisk(userId, folderId, folder);

    res.json(folder);
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a folder
app.delete("/api/:userId/folders/:folderId", async (req, res) => {
  try {
    const { userId, folderId } = req.params;

    // Verify folder exists before attempting deletion
    const folder = await loadFolderFromDisk(userId, folderId);
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ error: "Folder not found" });
    }

    await deleteFolderFromDisk(userId, folderId);

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "Folder not found" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Reorder folders
app.post("/api/:userId/folders/reorder", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sourceId, targetId, position = "after" } = req.body;

    const sourceFolder = await loadFolderFromDisk(userId, sourceId);
    const targetFolder = await loadFolderFromDisk(userId, targetId);

    if (
      !sourceFolder ||
      !targetFolder ||
      sourceFolder.userId !== userId ||
      targetFolder.userId !== userId
    ) {
      return res.status(404).json({ error: "One or both folders not found" });
    }

    // Load all user folders to update sort orders
    const userFolders = await loadAllUserFoldersFromDisk(userId);

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

    await updateFolderSortOrderOnDisk(userId, sourceId, sourceFolder.sortOrder);

    res.json({ success: true });
  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: "One or both folders not found" });
    }
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

    // Save users to disk
    await saveUsers();

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

    // Save users to disk
    await saveUsers();

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

// Authentication endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = Array.from(users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.disabled) {
      return res.status(401).json({ error: "Account is disabled" });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    // Save users to disk (for lastLogin update)
    await saveUsers();

    // Return user info without password
    const { password: _, ...userInfo } = user;
    res.json(userInfo);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
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
      console.error(
        `💡 Kill the process using port ${PORT} with: lsof -ti:${PORT} | xargs kill -9`
      );
      console.error(`📝 Or change the port in config.json`);
      process.exit(1);
    }

    // Load existing users from disk before starting the server
    await loadUsers();

    // Note: Notebooks, tags, and folders are now loaded on-demand
    // No need to pre-load them into memory maps

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

// ==========================================
// ADMIN API ROUTES
// ==========================================

// Admin middleware to check admin privileges
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  const userId = authHeader.substring(7); // Remove 'Bearer ' prefix
  const user = users.get(userId);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  req.adminUser = user;
  next();
};

// Get all users (admin only)
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const allUsers = Array.from(users.values()).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      disabled: user.disabled || false,
      created: user.created,
      lastLogin: user.lastLogin,
    }));

    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (admin only)
app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // Check if email already exists
    const existingUser = Array.from(users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newUserId = `user-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: name.trim(),
      email: email.trim(),
      password: password, // In production, use bcrypt hashing
      isAdmin: isAdmin || false,
      disabled: false,
      created: new Date().toISOString(),
      settings: {
        sessionTimeout: 20160 * 60 * 1000, // 2 weeks
        autoSave: true,
        theme: "light",
      },
    };

    users.set(newUserId, newUser);

    // Save users to disk
    await saveUsers();

    // Create user directory
    const userNotesDir = join(NOTES_BASE_PATH, newUserId);
    await ensureDir(userNotesDir);

    // Log admin action
    console.log(`Admin ${req.adminUser.email} created user: ${email}`);

    // Return user without password
    const { password: _, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable user (admin only)
app.post("/api/admin/users/:userId/disable", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isAdmin && user.id !== req.adminUser.id) {
      return res
        .status(400)
        .json({ error: "Cannot disable other admin users" });
    }

    user.disabled = true;
    user.disabledAt = new Date().toISOString();
    user.disabledBy = req.adminUser.id;
    users.set(userId, user);

    // Save users to disk
    await saveUsers();

    console.log(`Admin ${req.adminUser.email} disabled user: ${user.email}`);
    res.json({ success: true, message: "User disabled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable user (admin only)
app.post("/api/admin/users/:userId/enable", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.disabled = false;
    delete user.disabledAt;
    delete user.disabledBy;
    users.set(userId, user);

    // Save users to disk
    await saveUsers();

    console.log(`Admin ${req.adminUser.email} enabled user: ${user.email}`);
    res.json({ success: true, message: "User enabled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isAdmin && user.id !== req.adminUser.id) {
      return res.status(400).json({ error: "Cannot delete other admin users" });
    }

    if (user.id === req.adminUser.id) {
      return res
        .status(400)
        .json({ error: "Cannot delete your own admin account" });
    }

    // Delete user's notes directory
    try {
      const userNotesDir = join(NOTES_BASE_PATH, userId);
      if (fsSync.existsSync(userNotesDir)) {
        await fs.rm(userNotesDir, { recursive: true, force: true });
      }
    } catch (dirError) {
      console.error(`Error deleting user directory for ${userId}:`, dirError);
    }

    // Remove user from memory
    users.delete(userId);

    // Save users to disk
    await saveUsers();

    console.log(`Admin ${req.adminUser.email} deleted user: ${user.email}`);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (admin only)
app.post(
  "/api/admin/users/:userId/reset-password",
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters long" });
      }

      const user = users.get(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // In production, use bcrypt.hash
      user.password = newPassword;
      user.passwordResetAt = new Date().toISOString();
      user.passwordResetBy = req.adminUser.id;
      users.set(userId, user);

      // Save users to disk
      await saveUsers();

      console.log(
        `Admin ${req.adminUser.email} reset password for user: ${user.email}`
      );
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update user information (admin only)
app.put("/api/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, isAdmin } = req.body;

    const user = users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate required fields
    if (name !== undefined && (!name || !name.trim())) {
      return res
        .status(400)
        .json({ error: "Name is required and cannot be empty" });
    }

    if (email !== undefined && (!email || !email.trim())) {
      return res
        .status(400)
        .json({ error: "Email is required and cannot be empty" });
    }

    // Validate email uniqueness
    if (email && email !== user.email) {
      const existingUser = Array.from(users.values()).find(
        (u) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase()
      );

      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Update user information
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim();
    if (typeof isAdmin === "boolean") {
      // Prevent removing admin status from the last admin
      if (!isAdmin && user.isAdmin) {
        const adminCount = Array.from(users.values()).filter(
          (u) => u.isAdmin
        ).length;
        if (adminCount <= 1) {
          return res.status(400).json({
            error: "Cannot remove admin status from the last admin user",
          });
        }
      }
      user.isAdmin = isAdmin;
    }

    user.updated = new Date().toISOString();
    user.updatedBy = req.adminUser.id;
    users.set(userId, user);

    // Save users to disk
    await saveUsers();

    console.log(`Admin ${req.adminUser.email} updated user: ${user.email}`);

    // Return user without password
    const { password: _, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get storage information (admin only)
app.get("/api/admin/storage", requireAdmin, async (req, res) => {
  try {
    const userUsage = [];

    for (const [userId, user] of users.entries()) {
      try {
        const userNotesDir = join(NOTES_BASE_PATH, userId);

        if (!fsSync.existsSync(userNotesDir)) {
          userUsage.push({
            userId,
            userName: user.name,
            noteCount: 0,
            attachmentCount: 0,
            totalSize: "0 KB",
          });
          continue;
        }

        const noteFiles = await fs.readdir(userNotesDir);
        const jsonFiles = noteFiles.filter((file) => file.endsWith(".json"));

        let totalSizeBytes = 0;
        let attachmentCount = 0;

        // Calculate notes size
        for (const file of jsonFiles) {
          const filePath = join(userNotesDir, file);
          const stats = await fs.stat(filePath);
          totalSizeBytes += stats.size;

          // Check for attachments
          const noteDir = join(userNotesDir, file.replace(".json", ""));
          if (fsSync.existsSync(noteDir)) {
            const attachmentsDir = join(noteDir, "attachments");
            if (fsSync.existsSync(attachmentsDir)) {
              const attachments = await fs.readdir(attachmentsDir);
              attachmentCount += attachments.length;

              for (const attachment of attachments) {
                const attachmentPath = join(attachmentsDir, attachment);
                const attachmentStats = await fs.stat(attachmentPath);
                totalSizeBytes += attachmentStats.size;
              }
            }
          }
        }

        const formatSize = (bytes) => {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          if (bytes < 1024 * 1024 * 1024)
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        };

        userUsage.push({
          userId,
          userName: user.name,
          noteCount: jsonFiles.length,
          attachmentCount,
          totalSize: formatSize(totalSizeBytes),
        });
      } catch (userError) {
        console.error(`Error calculating usage for user ${userId}:`, userError);
        userUsage.push({
          userId,
          userName: user.name,
          noteCount: 0,
          attachmentCount: 0,
          totalSize: "Error",
        });
      }
    }

    res.json({
      location: NOTES_BASE_PATH,
      userUsage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update storage location (admin only)
app.post("/api/admin/storage/location", requireAdmin, async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: "Storage location is required" });
    }

    // Validate the path exists or can be created
    try {
      await ensureDir(location);
      NOTES_BASE_PATH = location;

      console.log(
        `Admin ${req.adminUser.email} updated storage location to: ${location}`
      );
      res.json({ success: true, location: NOTES_BASE_PATH });
    } catch (pathError) {
      res

        .status(400)
        .json({ error: `Invalid storage location: ${pathError.message}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear unknown tags for a user (admin only)
app.post(
  "/api/admin/users/:userId/clear-unknown-tags",
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = users.get(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userNotesDir = join(NOTES_BASE_PATH, userId);
      if (!fsSync.existsSync(userNotesDir)) {
        return res.json({ success: true, message: "No notes found for user" });
      }

      const noteFiles = await fs.readdir(userNotesDir);
      const jsonFiles = noteFiles.filter((file) => file.endsWith(".json"));

      let clearedCount = 0;

      for (const file of jsonFiles) {
        try {
          const filePath = join(userNotesDir, file);
          const noteData = JSON.parse(await fs.readFile(filePath, "utf8"));

          if (noteData.tags && Array.isArray(noteData.tags)) {
            const originalLength = noteData.tags.length;
            // Filter out UUID tags (unknown tags)
            noteData.tags = noteData.tags.filter((tag) => {
              const tagName =
                typeof tag === "string" ? tag : tag.name || tag.id;
              return tagName && !isUUID(tagName);
            });

            if (noteData.tags.length !== originalLength) {
              noteData.updated = new Date().toISOString();
              await fs.writeFile(filePath, JSON.stringify(noteData, null, 2));
              clearedCount++;
            }
          }
        } catch (fileError) {
          console.error(`Error processing note file ${file}:`, fileError);
        }
      }

      console.log(
        `Admin ${req.adminUser.email} cleared unknown tags for user: ${user.email}, ${clearedCount} notes updated`
      );
      res.json({
        success: true,
        message: `Cleared unknown tags from ${clearedCount} notes`,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ==========================================
// VERSION MANAGEMENT SYSTEM
// ==========================================

// Default version configuration
let VERSION_CONFIG = {
  maxVersionsPerNote: 100,
  autoVersionOnChange: true,
  minChangePercentage: 10, // 10% change triggers version (increased from 5%)
  enableFocusSwitch: false, // Disabled to prevent cursor jumping
};

// Default auto-save configuration
let AUTO_SAVE_CONFIG = {
  autoSaveDelayMs: 10000, // 10 seconds default
  minChangePercentage: 5, // 5% change required for auto-save
  enableAutoSave: true,
  enableBeforeUnloadSave: true,
};

// Version creation locks to prevent race conditions
const versionLocks = new Map();

// Version deduplication cache (trigger -> timestamp)
const versionDedupeCache = new Map();

// Enhanced debouncing for different operations
const VERSION_DEBOUNCE_TIMES = {
  content_change: 30000, // 30 seconds between content versions (increased to prevent cursor jumping)
  focus_switch: 60000, // 60 seconds between focus switch versions (disabled anyway)
  title_change: 5000, // 5 seconds between title changes
  tags_change: 5000, // 5 seconds between tag changes
  folder_change: 5000, // 5 seconds between folder changes
  notebook_change: 5000, // 5 seconds between notebook changes
};

// Helper function to get a lock for version creation
async function getVersionLock(noteId) {
  const lockKey = `version_lock_${noteId}`;

  if (versionLocks.has(lockKey)) {
    // Wait for existing lock to be released
    await versionLocks.get(lockKey);
  }

  let resolveLock;
  const lockPromise = new Promise((resolve) => {
    resolveLock = resolve;
  });

  versionLocks.set(lockKey, lockPromise);

  return () => {
    versionLocks.delete(lockKey);
    resolveLock();
  };
}

// Helper function to get the next version number based on disk state
async function getNextVersionNumber(userId, noteId) {
  try {
    const versions = await loadVersionHistory(userId, noteId);

    if (versions.length === 0) {
      return 1;
    }

    // Find the highest version number actually saved on disk
    const highestVersion = Math.max(...versions.map((v) => v.version));
    return highestVersion + 1;
  } catch (error) {
    console.error("Error calculating next version number:", error);
    return 1;
  }
}

// Helper function to check if we should dedupe this version creation
function shouldDedupeVersion(noteId, trigger) {
  const dedupeKey = `${noteId}_${trigger}`;
  const now = Date.now();
  const lastCreated = versionDedupeCache.get(dedupeKey);

  // Get debounce time for this trigger type
  const debounceTime = VERSION_DEBOUNCE_TIMES[trigger] || 1000;

  // Dedupe if same trigger happened within the debounce time
  if (lastCreated && now - lastCreated < debounceTime) {
    return true;
  }

  versionDedupeCache.set(dedupeKey, now);

  // Clean up old cache entries (older than 30 seconds)
  for (const [key, timestamp] of versionDedupeCache.entries()) {
    if (now - timestamp > 30000) {
      versionDedupeCache.delete(key);
    }
  }

  return false;
}

// Helper function to calculate content change percentage
function calculateChangePercentage(oldContent, newContent) {
  if (!oldContent && !newContent) return 0;
  if (!oldContent) return 100;
  if (!newContent) return 100;

  // Remove HTML tags for accurate text comparison
  const oldText = oldContent.replace(/<[^>]*>/g, "");
  const newText = newContent.replace(/<[^>]*>/g, "");

  const oldLength = oldText.length;
  const newLength = newText.length;

  if (oldLength === 0 && newLength === 0) return 0;
  if (oldLength === 0) return 100;

  const changeRatio = Math.abs(newLength - oldLength) / oldLength;
  return changeRatio * 100;
}

// Helper function to get version directory path
function getVersionsPath(userId, noteId) {
  return join(getNotePath(userId, noteId), "versions");
}

// Helper function to read all versions for a note
async function loadVersionHistory(userId, noteId) {
  try {
    const versionsPath = getVersionsPath(userId, noteId);

    if (!fsSync.existsSync(versionsPath)) {
      return [];
    }

    const versionFiles = await fs.readdir(versionsPath);
    const versions = [];

    for (const file of versionFiles) {
      if (file.endsWith(".json")) {
        try {
          const versionPath = join(versionsPath, file);
          const versionData = JSON.parse(
            await fs.readFile(versionPath, "utf8")
          );
          versions.push(versionData);
        } catch (error) {
          console.error(`Error reading version file ${file}:`, error);
        }
      }
    }

    // Sort by creation date (newest first)
    versions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return versions;
  } catch (error) {
    console.error("Error loading version history:", error);
    return [];
  }
}

// Helper function to save a version
async function saveVersion(userId, noteId, versionData) {
  try {
    const versionsPath = getVersionsPath(userId, noteId);
    await ensureDir(versionsPath);

    const versionFile = join(versionsPath, `v${versionData.version}.json`);
    await fs.writeFile(versionFile, JSON.stringify(versionData, null, 2));

    console.log(`💾 Saved version ${versionData.version} for note ${noteId}`);

    // Clean up old versions if we exceed the limit
    await cleanupOldVersions(userId, noteId);

    return versionData;
  } catch (error) {
    console.error("Error saving version:", error);
    throw error;
  }
}

// Helper function to cleanup old versions based on admin limit
async function cleanupOldVersions(userId, noteId) {
  try {
    const versions = await loadVersionHistory(userId, noteId);

    if (versions.length <= VERSION_CONFIG.maxVersionsPerNote) {
      return; // No cleanup needed
    }

    // Remove oldest versions beyond the limit
    const versionsToRemove = versions.slice(VERSION_CONFIG.maxVersionsPerNote);
    const versionsPath = getVersionsPath(userId, noteId);

    for (const version of versionsToRemove) {
      try {
        const versionFile = join(versionsPath, `v${version.version}.json`);
        await fs.unlink(versionFile);
        console.log(
          `🗑️ Cleaned up old version ${version.version} for note ${noteId}`
        );
      } catch (error) {
        console.error(`Error removing version ${version.version}:`, error);
      }
    }
  } catch (error) {
    console.error("Error during version cleanup:", error);
  }
}

// Helper function to create a version when conditions are met
async function createVersionIfNeeded(
  userId,
  noteId,
  currentContent,
  currentMetadata,
  trigger
) {
  // Get lock for this note to prevent race conditions
  const releaseLock = await getVersionLock(noteId);

  try {
    if (!VERSION_CONFIG.autoVersionOnChange) {
      return false;
    }

    // Check for deduplication
    if (shouldDedupeVersion(noteId, trigger)) {
      console.log(
        `🔄 Deduping version creation for note ${noteId}, trigger: ${trigger}`
      );
      return false;
    }

    const versions = await loadVersionHistory(userId, noteId);
    const lastVersion = versions.length > 0 ? versions[0] : null;

    let shouldCreateVersion = false;
    let changeDescription = trigger;

    // Check different triggers
    if (trigger === "content_change") {
      if (lastVersion) {
        const changePercentage = calculateChangePercentage(
          lastVersion.content,
          currentContent
        );
        if (changePercentage >= VERSION_CONFIG.minChangePercentage) {
          shouldCreateVersion = true;
          changeDescription = `${changePercentage.toFixed(1)}% content change`;
        }
      } else {
        shouldCreateVersion = true;
        changeDescription = "Initial version";
      }
    } else if (
      [
        "title_change",
        "tags_change",
        "folder_change",
        "notebook_change",
        "focus_switch",
      ].includes(trigger)
    ) {
      shouldCreateVersion = true;
    }

    if (shouldCreateVersion) {
      // Get the next version number based on actual disk state
      const nextVersionNumber = await getNextVersionNumber(userId, noteId);

      const newVersion = {
        id: uuidv4(),
        version: nextVersionNumber,
        noteId: noteId,
        userId: userId,
        content: currentContent || "",
        metadata: { ...currentMetadata },
        createdAt: new Date().toISOString(),
        trigger: trigger,
        changeDescription: changeDescription,
        size: (currentContent || "").length,
      };

      await saveVersion(userId, noteId, newVersion);
      console.log(
        `📝 Created version ${newVersion.version} for note ${noteId}: ${changeDescription}`
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error creating version:", error);
    return false;
  } finally {
    // Always release the lock
    releaseLock();
  }
}

// ==========================================
// VERSION API ENDPOINTS
// ==========================================

// Get version history for a note
app.get("/api/:userId/notes/:noteId/versions", async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    const versions = await loadVersionHistory(userId, noteId);

    // Return summary info (without full content to save bandwidth)
    const versionSummaries = versions.map((v) => ({
      id: v.id,
      version: v.version,
      createdAt: v.createdAt,
      trigger: v.trigger,
      changeDescription: v.changeDescription,
      size: v.size,
    }));

    res.json(versionSummaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific version content
app.get("/api/:userId/notes/:noteId/versions/:versionId", async (req, res) => {
  try {
    const { userId, noteId, versionId } = req.params;
    const versions = await loadVersionHistory(userId, noteId);

    const version = versions.find((v) => v.id === versionId);
    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore note to specific version
app.post("/api/:userId/notes/:noteId/restore/:versionId", async (req, res) => {
  try {
    const { userId, noteId, versionId } = req.params;
    const versions = await loadVersionHistory(userId, noteId);

    const versionToRestore = versions.find((v) => v.id === versionId);
    if (!versionToRestore) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Get current metadata
    const currentMetadata = await readMetadata(userId, noteId);
    if (!currentMetadata) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Create a version of the current state before restoring
    const currentContent = await readNoteContent(userId, noteId);
    await createVersionIfNeeded(
      userId,
      noteId,
      currentContent,
      currentMetadata,
      "before_restore"
    );

    // Update metadata with restored version info
    const restoredMetadata = {
      ...currentMetadata,
      ...versionToRestore.metadata,
      updated: new Date().toISOString(),
      version: currentMetadata.version + 1,
      restoredFromVersion: versionToRestore.version,
    };

    // Write restored content and metadata
    await writeNoteContent(userId, noteId, versionToRestore.content);
    await writeMetadata(userId, noteId, restoredMetadata);

    // Create a version for the restore action
    await createVersionIfNeeded(
      userId,
      noteId,
      versionToRestore.content,
      restoredMetadata,
      `restored_from_v${versionToRestore.version}`
    );

    // Return the complete note object with content
    const restoredNote = {
      ...restoredMetadata,
      content: versionToRestore.content,
    };

    console.log(
      `✅ Restored note ${noteId} to version ${versionToRestore.version}, created new version ${restoredMetadata.version}`
    );

    res.json(restoredNote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete specific version
app.delete(
  "/api/:userId/notes/:noteId/versions/:versionId",
  async (req, res) => {
    try {
      const { userId, noteId, versionId } = req.params;
      const versions = await loadVersionHistory(userId, noteId);

      const versionToDelete = versions.find((v) => v.id === versionId);
      if (!versionToDelete) {
        return res.status(404).json({ error: "Version not found" });
      }

      const versionsPath = getVersionsPath(userId, noteId);
      const versionFile = join(
        versionsPath,
        `v${versionToDelete.version}.json`
      );

      await fs.unlink(versionFile);

      res.json({ success: true, message: "Version deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Create version on focus switch
app.post("/api/:userId/notes/:noteId/version-checkpoint", async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    const metadata = await readMetadata(userId, noteId);
    const content = await readNoteContent(userId, noteId);

    if (metadata) {
      const created = await createVersionIfNeeded(
        userId,
        noteId,
        content,
        metadata,
        "focus_switch"
      );
      res.json({ versionCreated: created });
    } else {
      res.status(404).json({ error: "Note not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ADMIN VERSION CONFIGURATION
// ==========================================

// Get version configuration (admin only)
app.get("/api/admin/config/versions", requireAdmin, (req, res) => {
  res.json(VERSION_CONFIG);
});

// Update version configuration (admin only)
app.post("/api/admin/config/versions", requireAdmin, async (req, res) => {
  try {
    const {
      maxVersionsPerNote,
      autoVersionOnChange,
      minChangePercentage,
      enableFocusSwitch,
    } = req.body;

    if (maxVersionsPerNote !== undefined) {
      VERSION_CONFIG.maxVersionsPerNote = Math.max(
        1,
        Math.min(1000, maxVersionsPerNote)
      );
    }
    if (autoVersionOnChange !== undefined) {
      VERSION_CONFIG.autoVersionOnChange = Boolean(autoVersionOnChange);
    }
    if (minChangePercentage !== undefined) {
      VERSION_CONFIG.minChangePercentage = Math.max(
        1,
        Math.min(100, minChangePercentage)
      );
    }
    if (enableFocusSwitch !== undefined) {
      VERSION_CONFIG.enableFocusSwitch = Boolean(enableFocusSwitch);
    }

    console.log(
      `Admin ${req.adminUser.email} updated version configuration:`,
      VERSION_CONFIG
    );
    res.json(VERSION_CONFIG);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// AUTO-SAVE CONFIGURATION
// ==========================================

// Get auto-save configuration
app.get("/api/admin/config/auto-save", requireAdmin, (req, res) => {
  res.json(AUTO_SAVE_CONFIG);
});

// Update auto-save configuration (admin only)
app.post("/api/admin/config/auto-save", requireAdmin, async (req, res) => {
  try {
    const {
      autoSaveDelayMs,
      minChangePercentage,
      enableAutoSave,
      enableBeforeUnloadSave,
    } = req.body;

    if (autoSaveDelayMs !== undefined) {
      AUTO_SAVE_CONFIG.autoSaveDelayMs = Math.max(
        1000, // Minimum 1 second
        Math.min(300000, autoSaveDelayMs) // Maximum 5 minutes
      );
    }
    if (minChangePercentage !== undefined) {
      AUTO_SAVE_CONFIG.minChangePercentage = Math.max(
        0, // Allow 0% for immediate save
        Math.min(100, minChangePercentage)
      );
    }
    if (enableAutoSave !== undefined) {
      AUTO_SAVE_CONFIG.enableAutoSave = Boolean(enableAutoSave);
    }
    if (enableBeforeUnloadSave !== undefined) {
      AUTO_SAVE_CONFIG.enableBeforeUnloadSave = Boolean(enableBeforeUnloadSave);
    }

    console.log(
      `Admin ${req.adminUser.email} updated auto-save configuration:`,
      AUTO_SAVE_CONFIG
    );
    res.json(AUTO_SAVE_CONFIG);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get auto-save configuration (public endpoint for frontend)
app.get("/api/config/auto-save", (req, res) => {
  res.json(AUTO_SAVE_CONFIG);
});

// ==========================================
// ENHANCED NOTE UPDATE WITH VERSIONING
// ==========================================

// ==========================================
// EVERNOTE IMPORT API
// ==========================================

// Import Evernote .enex file
app.post(
  "/api/:userId/import/evernote",
  (req, res, next) => {
    // Debug middleware
    console.log("📥 Import endpoint hit");
    console.log("📥 Request headers:", req.headers);
    console.log("📥 Content-Type:", req.get("content-type"));
    next();
  },
  uploadImport.single("evernoteFile"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const evernoteFile = req.file;
      const options = JSON.parse(req.body.options || "{}");

      if (!evernoteFile) {
        console.error("❌ No file uploaded - req.file is:", req.file);
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`📥 Starting Evernote import for user ${userId}`);
      console.log(
        `📄 File: ${evernoteFile.originalname} (${evernoteFile.size} bytes)`
      );
      console.log(`⚙️ Options:`, options);

      // Extract notebook name from filename (remove .enex extension)
      const notebookName = evernoteFile.originalname.replace(/\.enex$/i, "");
      console.log(`📚 Creating notebook: ${notebookName}`);

      // Read the uploaded file
      const fileContent = await fs.readFile(evernoteFile.path, "utf8");

      // Clean up uploaded file
      await fs.unlink(evernoteFile.path);

      // Parse the Evernote XML
      let enexData;
      try {
        enexData = await new Promise((resolve, reject) => {
          xml2js.parseString(
            fileContent,
            {
              explicitArray: false,
              ignoreAttrs: false,
              tagNameProcessors: [(name) => name.toLowerCase()],
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      } catch (parseError) {
        console.error("❌ Failed to parse Evernote XML:", parseError);
        return res.status(400).json({
          error: "Invalid Evernote file format",
          message:
            "The uploaded file is not a valid Evernote export (.enex) file",
        });
      }

      // Extract notes from the parsed data
      console.log(
        "📋 Parsed ENEX structure:",
        JSON.stringify(enexData, null, 2).substring(0, 500)
      );
      const enNotes = enexData["en-export"]?.note || [];
      const notesArray = Array.isArray(enNotes) ? enNotes : [enNotes];

      console.log(`📝 Found ${notesArray.length} notes to import`);

      // Initialize results object early
      const results = {
        notesImported: 0,
        notebooksCreated: 0,
        tagsCreated: 0,
        attachmentsImported: 0,
        warnings: [],
      };

      // Create or get the "evernote" tag
      let evernoteTagId;
      try {
        // First check if the tag already exists
        const existingTags = await loadAllUserTagsFromDisk(userId);
        const evernoteTag = existingTags.find((tag) => tag.name === "evernote");

        if (evernoteTag) {
          evernoteTagId = evernoteTag.id;
          console.log(`🏷️ Using existing "evernote" tag: ${evernoteTagId}`);
        } else {
          // Create new tag
          evernoteTagId = uuidv4();
          const newTag = {
            id: evernoteTagId,
            userId,
            name: "evernote",
            color: "#2DBE60", // Evernote green
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            sortOrder: 0,
          };
          await saveTagToDisk(userId, evernoteTagId, newTag);
          console.log(`🏷️ Created new "evernote" tag: ${evernoteTagId}`);
        }
      } catch (error) {
        console.error("❌ Failed to create/get evernote tag:", error);
        return res.status(500).json({ error: "Failed to create import tag" });
      }

      // Create or get the notebook for this import
      let importNotebookId;
      let existingNotebooks = [];
      try {
        console.log(`📚 Setting up notebook "${notebookName}" for import`);
        // First check if the notebook already exists
        existingNotebooks = await loadAllUserNotebooksFromDisk(userId);
        const importNotebook = existingNotebooks.find(
          (notebook) => notebook.name === notebookName
        );

        if (importNotebook) {
          importNotebookId = importNotebook.id;
          console.log(
            `📚 Using existing notebook "${notebookName}": ${importNotebookId}`
          );
        } else {
          // Create new notebook
          importNotebookId = uuidv4();
          console.log(`📚 Generated new notebook ID: ${importNotebookId}`);
          const newNotebook = {
            id: importNotebookId,
            userId,
            name: notebookName,
            description: `Imported from ${evernoteFile.originalname}`,
            color: "#6B46C1", // Purple color for import notebooks
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            noteCount: 0,
            sortOrder: existingNotebooks.length,
            folder: null, // Notebooks can be assigned to folders later
          };
          await saveNotebookToDisk(userId, importNotebookId, newNotebook);
          console.log(
            `📚 Created new notebook "${notebookName}": ${importNotebookId}`
          );
          results.notebooksCreated++;
        }
        console.log(`📚 Final importNotebookId: ${importNotebookId}`);
      } catch (error) {
        console.error("❌ Failed to create/get import notebook:", error);
        return res
          .status(500)
          .json({ error: "Failed to create import notebook" });
      }

      // Track notebooks and tags
      const notebookMap = new Map();
      const tagMap = new Map();

      // Process each note
      for (const enNote of notesArray) {
        try {
          // Helper function to parse Evernote date format (YYYYMMDDTHHMMSSZ)
          const parseEvernoteDate = (dateStr) => {
            if (!dateStr) return new Date().toISOString();

            // Handle Evernote date format: 20240101T120000Z
            const match = dateStr.match(
              /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/
            );
            if (match) {
              const [, year, month, day, hour, minute, second] = match;
              return new Date(
                Date.UTC(
                  parseInt(year),
                  parseInt(month) - 1, // Month is 0-based
                  parseInt(day),
                  parseInt(hour),
                  parseInt(minute),
                  parseInt(second)
                )
              ).toISOString();
            }

            // Try standard date parsing as fallback
            try {
              return new Date(dateStr).toISOString();
            } catch (e) {
              console.warn(
                `Failed to parse date: ${dateStr}, using current date`
              );
              return new Date().toISOString();
            }
          };

          // Extract note data
          const title = enNote.title || "Untitled Note";
          const created = parseEvernoteDate(enNote.created);
          const updated = parseEvernoteDate(enNote.updated) || created;

          // Create the note ID early so we can use it for attachments
          const noteId = uuidv4();

          // Process resources (attachments/images) first
          const resourceMap = new Map();
          const attachmentMetadata = [];

          if (enNote.resource) {
            const resources = Array.isArray(enNote.resource)
              ? enNote.resource
              : [enNote.resource];

            for (const resource of resources) {
              try {
                if (resource.data) {
                  let base64Data = "";

                  // Handle different data structures from xml2js
                  if (typeof resource.data === "string") {
                    base64Data = resource.data;
                  } else if (typeof resource.data === "object") {
                    // Sometimes xml2js puts text content in '_' property
                    base64Data = resource.data._ || resource.data;
                  }

                  // Clean up base64 data (remove whitespace/newlines)
                  base64Data = base64Data.replace(/\s/g, "");

                  // Decode base64 data
                  const buffer = Buffer.from(base64Data, "base64");

                  // Extract hash from source-url if available
                  let hash = null;
                  if (
                    resource["resource-attributes"] &&
                    resource["resource-attributes"]["source-url"]
                  ) {
                    const sourceUrl =
                      resource["resource-attributes"]["source-url"];
                    // Hash is typically after the user token and before the final part
                    const hashMatch = sourceUrl.match(/\+([a-f0-9]{32})\+/);
                    if (hashMatch) {
                      hash = hashMatch[1];
                    }
                  }

                  // Fallback to generate hash if not found
                  if (!hash) {
                    // Generate hash from buffer content for consistent identification
                    const crypto = await import("crypto");
                    hash = crypto.default
                      .createHash("md5")
                      .update(buffer)
                      .digest("hex");
                  }

                  // Get other resource attributes
                  const originalFileName =
                    resource["resource-attributes"]?.["file-name"] ||
                    resource.filename ||
                    "attachment";
                  const mimeType = resource.mime || "application/octet-stream";

                  // Create unique filename using hash to prevent overwrites
                  const extension = getMimeExtension(mimeType);
                  const uniqueFileName = `${hash.substring(
                    0,
                    8
                  )}_${originalFileName}`;

                  // Ensure it has the correct extension
                  let fileName = uniqueFileName;
                  if (!uniqueFileName.endsWith(`.${extension}`)) {
                    // Remove any existing extension and add the correct one
                    fileName =
                      uniqueFileName.replace(/\.[^.]+$/, "") + `.${extension}`;
                  }

                  // Ensure attachments directory exists
                  const attachmentsPath = join(
                    NOTES_BASE_PATH,
                    userId,
                    noteId,
                    "attachments"
                  );
                  await fs.mkdir(attachmentsPath, { recursive: true });

                  // Save the file
                  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
                  const filePath = join(attachmentsPath, safeName);
                  await fs.writeFile(filePath, buffer);

                  // Store mapping for en-media replacement
                  resourceMap.set(hash, {
                    filename: safeName,
                    mimeType: mimeType,
                    originalName: originalFileName,
                  });

                  // Add to attachment metadata
                  attachmentMetadata.push({
                    filename: safeName,
                    originalName: originalFileName,
                    size: buffer.length,
                    type: mimeType,
                    uploaded: new Date().toISOString(),
                  });

                  console.log(`📎 Saved attachment: ${safeName} (${mimeType})`);
                  results.attachmentsImported++;
                }
              } catch (resourceError) {
                console.error(`❌ Failed to process resource:`, resourceError);
                results.warnings.push(
                  `Failed to import attachment in note "${title}"`
                );
              }
            }
          }

          // Convert Evernote content (ENML) to HTML
          let htmlContent = enNote.content || "";

          // First, replace en-media tags with img/link tags
          htmlContent = htmlContent.replace(/<en-media[^>]*\/>/g, (match) => {
            // Extract hash from en-media tag
            const hashMatch = match.match(/hash="([^"]+)"/);
            if (hashMatch && resourceMap.has(hashMatch[1])) {
              const resource = resourceMap.get(hashMatch[1]);
              const attachmentUrl = `./attachments/${resource.filename}`;

              // If it's an image, use img tag
              if (resource.mimeType.startsWith("image/")) {
                return `<img src="${attachmentUrl}" alt="${resource.originalName}" />`;
              } else {
                // For other files, create a link
                return `<a href="${attachmentUrl}">${resource.originalName}</a>`;
              }
            }
            return ""; // Remove unmatched en-media tags
          });

          // Clean up ENML structure
          htmlContent = htmlContent
            .replace(/<en-note[^>]*>/gi, "")
            .replace(/<\/en-note>/gi, "")
            .replace(/<!DOCTYPE[^>]*>/gi, "")
            .replace(/<\?xml[^>]*>/gi, "")
            .trim();

          // Wrap content in a div if it doesn't have a root element
          if (!htmlContent.startsWith("<")) {
            htmlContent = `<div>${htmlContent}</div>`;
          }

          // Convert HTML to Markdown
          let markdownContent = turndownService.turndown(htmlContent);

          // Post-process markdown to clean up excessive line breaks
          markdownContent = markdownContent
            .replace(/\n{4,}/g, "\n\n\n") // Reduce excessive line breaks to max 3
            .replace(/^\n+/, "") // Remove leading line breaks
            .replace(/\n+$/, "") // Remove trailing line breaks
            .trim();

          // Handle notebook
          let notebookId = null;
          if (
            options.preserveNotebooks &&
            enNote["note-attributes"]?.["source-notebook"]
          ) {
            const notebookName = enNote["note-attributes"]["source-notebook"];
            if (!notebookMap.has(notebookName)) {
              // Create notebook
              notebookId = uuidv4();
              const notebook = {
                id: notebookId,
                userId,
                name: notebookName,
                description: `Imported from Evernote`,
                color: "#3B82F6",
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                noteCount: 0,
                sortOrder: notebookMap.size,
              };
              await saveNotebookToDisk(userId, notebookId, notebook);
              notebookMap.set(notebookName, notebookId);
              results.notebooksCreated++;
              console.log(`📚 Created notebook: ${notebookName}`);
            } else {
              notebookId = notebookMap.get(notebookName);
            }
          }

          // Handle tags
          const tagIds = [evernoteTagId]; // Always include the "evernote" tag
          if (options.preserveTags && enNote.tag) {
            const tags = Array.isArray(enNote.tag) ? enNote.tag : [enNote.tag];
            for (const tagName of tags) {
              if (!tagMap.has(tagName)) {
                // Create tag
                const tagId = uuidv4();
                const tag = {
                  id: tagId,
                  userId,
                  name: tagName,
                  color: `#${Math.floor(Math.random() * 16777215).toString(
                    16
                  )}`,
                  created: new Date().toISOString(),
                  updated: new Date().toISOString(),
                  sortOrder: tagMap.size + 1, // +1 because evernote tag is 0
                };
                await saveTagToDisk(userId, tagId, tag);
                tagMap.set(tagName, tagId);
                results.tagsCreated++;
                console.log(`🏷️ Created tag: ${tagName}`);
              }
              tagIds.push(tagMap.get(tagName));
            }
          }

          // Create the note
          console.log(
            `📝 Creating note "${title}" with notebook: ${importNotebookId}`
          );
          const metadata = {
            id: noteId,
            title,
            created: options.preserveCreatedDates
              ? created
              : new Date().toISOString(),
            updated: new Date().toISOString(),
            tags: tagIds,
            notebook: importNotebookId, // Assign to the import notebook
            folder: null, // Notes don't go directly in folders
            starred: false,
            deleted: false,
            version: 1,
            attachments: attachmentMetadata,
            evernoteImport: {
              originalId: enNote["$"]?.guid || null,
              importedAt: new Date().toISOString(),
              source: "evernote",
            },
          };

          await writeMetadata(userId, noteId, metadata);
          await writeNoteContent(userId, noteId, markdownContent);
          results.notesImported++;
          console.log(`✅ Imported note: ${title}`);
        } catch (noteError) {
          console.error(`❌ Failed to import note:`, noteError);
          console.error(
            `📋 Note data that failed:`,
            JSON.stringify(enNote, null, 2).substring(0, 500)
          );
          results.warnings.push(
            `Failed to import note: ${enNote.title || "Untitled"}`
          );
        }
      }

      console.log(`✅ Evernote import completed:`, results);
      res.json(results);
    } catch (error) {
      console.error("❌ Evernote import error:", error);
      res.status(500).json({
        error: "Import failed",
        message: error.message,
      });
    }
  }
);

// Global error handler - MUST be at the very end after all routes
app.use((error, req, res, next) => {
  console.error("❌ Global error handler caught:", error);

  // Always return JSON for API routes
  if (req.path.startsWith("/api/")) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "File too large. Maximum size is 100MB." });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: error.message || "Internal server error",
      type: error.constructor.name,
    });
  }

  // For non-API routes, use default Express error handler
  next(error);
});
