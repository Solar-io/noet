#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

// Configuration
const NOTES_BASE_PATH = path.join(__dirname, "../server/notes");
const USER_ID = "user-1"; // Primary user

async function loadUserTags(userId) {
  try {
    const tagsPath = path.join(NOTES_BASE_PATH, userId, "tags.json");
    const content = await fs.readFile(tagsPath, "utf8");
    const tags = JSON.parse(content);
    return new Set(tags.map((tag) => tag.id));
  } catch (error) {
    console.log(
      `📋 No tags file found for user ${userId}, checking notes for dynamic tags`
    );
    return new Set();
  }
}

async function getNoteMetadata(userId, noteId) {
  try {
    const metadataPath = path.join(
      NOTES_BASE_PATH,
      userId,
      noteId,
      "metadata.json"
    );
    const content = await fs.readFile(metadataPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function saveNoteMetadata(userId, noteId, metadata) {
  try {
    const metadataPath = path.join(
      NOTES_BASE_PATH,
      userId,
      noteId,
      "metadata.json"
    );
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ Failed to save metadata for note ${noteId}:`, error);
    return false;
  }
}

async function getAllNotes(userId) {
  try {
    const userNotesPath = path.join(NOTES_BASE_PATH, userId);
    const entries = await fs.readdir(userNotesPath, { withFileTypes: true });

    const notes = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metadata = await getNoteMetadata(userId, entry.name);
        if (metadata) {
          notes.push({ id: entry.name, ...metadata });
        }
      }
    }
    return notes;
  } catch (error) {
    console.error(`❌ Failed to load notes for user ${userId}:`, error);
    return [];
  }
}

function isValidTag(tagId) {
  // Skip UUID-style tags and obvious invalid ones
  const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Known problematic tags
  const INVALID_TAGS = ["non-existent-tag-id", "undefined", "null", ""];

  if (!tagId || typeof tagId !== "string") return false;
  if (INVALID_TAGS.includes(tagId)) return false;
  if (UUID_REGEX.test(tagId)) return false;

  return true;
}

async function cleanupInvalidTags() {
  console.log("🧹 Starting tag cleanup process...");

  // Load valid tags for the user
  const validTags = await loadUserTags(USER_ID);
  console.log(`📋 Found ${validTags.size} valid tags in tags.json`);

  // Load all notes
  const notes = await getAllNotes(USER_ID);
  console.log(`📝 Found ${notes.length} notes to check`);

  let notesProcessed = 0;
  let notesUpdated = 0;
  let invalidTagsRemoved = 0;
  const invalidTagsFound = new Set();

  for (const note of notes) {
    notesProcessed++;

    if (!note.tags || !Array.isArray(note.tags)) {
      continue;
    }

    const originalTags = [...note.tags];
    const cleanTags = note.tags.filter((tagId) => {
      const isValid = isValidTag(tagId);
      const existsInSystem = validTags.has(tagId) || isValid;

      if (!isValid || !existsInSystem) {
        invalidTagsFound.add(tagId);
        invalidTagsRemoved++;
        console.log(
          `   ❌ Removing invalid tag "${tagId}" from note "${note.title}"`
        );
        return false;
      }
      return true;
    });

    // Update note if tags were cleaned
    if (cleanTags.length !== originalTags.length) {
      const updatedMetadata = { ...note, tags: cleanTags };
      delete updatedMetadata.id; // Remove the ID we added for processing

      const success = await saveNoteMetadata(USER_ID, note.id, updatedMetadata);
      if (success) {
        notesUpdated++;
        console.log(
          `   ✅ Updated note "${note.title}" (removed ${
            originalTags.length - cleanTags.length
          } invalid tags)`
        );
      }
    }
  }

  // Summary
  console.log("\n🎉 Tag cleanup completed!");
  console.log(`📊 Summary:`);
  console.log(`   📝 Notes processed: ${notesProcessed}`);
  console.log(`   ✏️  Notes updated: ${notesUpdated}`);
  console.log(`   🗑️  Invalid tags removed: ${invalidTagsRemoved}`);
  console.log(`   🏷️  Unique invalid tags found: ${invalidTagsFound.size}`);

  if (invalidTagsFound.size > 0) {
    console.log(`\n🏷️  Invalid tags that were removed:`);
    Array.from(invalidTagsFound).forEach((tag) => {
      console.log(`   • "${tag}"`);
    });
  }

  if (notesUpdated > 0) {
    console.log(
      `\n✨ Performance should be improved! The app will no longer try to load non-existent tags.`
    );
    console.log(
      `💡 Recommendation: Restart the backend server to clear any cached invalid tag data.`
    );
  } else {
    console.log(`\n✅ No invalid tags found - your data is clean!`);
  }
}

// Main execution
if (require.main === module) {
  cleanupInvalidTags().catch((error) => {
    console.error("❌ Tag cleanup failed:", error);
    process.exit(1);
  });
}

module.exports = { cleanupInvalidTags, isValidTag };
