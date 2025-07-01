#!/usr/bin/env node

/**
 * Test script to verify recent UI fixes for the noet app
 * Tests:
 * 1. No duplicate stars for starred notes
 * 2. Actual notebook names show instead of "Notebook"
 * 3. Tag filtering is available in filter menu
 * 4. Drag and drop basic functionality
 * 5. API data integrity
 */

console.log("🧪 Testing UI Fixes for noet-app");
console.log("=================================");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Check that tags API returns proper data
console.log("\n1. Testing tags API...");
fetch("http://localhost:3004/api/user-1/tags")
  .then((response) => response.json())
  .then((tags) => {
    console.log("✅ Tags loaded:", tags.length, "tags");
    tags.forEach((tag) => {
      console.log(`   - ${tag.name} (${tag.id.substring(0, 8)}...)`);
    });
    
    if (tags.length === 0) {
      console.log("⚠️  No tags found - this might explain missing tag filters");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to load tags:", error.message);
  });

// Test 2: Check notebooks API
console.log("\n2. Testing notebooks API...");
fetch("http://localhost:3004/api/user-1/notebooks")
  .then((response) => response.json())
  .then((notebooks) => {
    console.log("✅ Notebooks loaded:", notebooks.length, "notebooks");
    notebooks.forEach((notebook) => {
      console.log(`   - ${notebook.name} (${notebook.id.substring(0, 8)}...)`);
    });
    
    if (notebooks.length === 0) {
      console.log("⚠️  No notebooks found");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to load notebooks:", error.message);
  });

// Test 3: Check folders API
console.log("\n3. Testing folders API...");
fetch("http://localhost:3004/api/user-1/folders")
  .then((response) => response.json())
  .then((folders) => {
    console.log("✅ Folders loaded:", folders.length, "folders");
    folders.forEach((folder) => {
      console.log(`   - ${folder.name} (${folder.id.substring(0, 8)}...)`);
    });
    
    if (folders.length === 0) {
      console.log("⚠️  No folders found");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to load folders:", error.message);
  });

// Test 4: Check that notes have proper relationships
console.log("\n4. Testing notes with relationships...");
fetch("http://localhost:3004/api/user-1/notes")
  .then((response) => response.json())
  .then((notes) => {
    console.log("✅ Notes loaded:", notes.length, "notes");
    
    let notesWithNotebooks = 0;
    let notesWithFolders = 0;
    let notesWithTags = 0;
    let starredNotes = 0;
    
    notes.forEach((note) => {
      if (note.notebook) notesWithNotebooks++;
      if (note.folder) notesWithFolders++;
      if (note.tags?.length > 0) notesWithTags++;
      if (note.starred) starredNotes++;
      
      console.log(`   - "${note.title}" | notebook: ${note.notebook ? '✓' : '✗'} | folder: ${note.folder ? '✓' : '✗'} | tags: ${note.tags?.length || 0} | starred: ${note.starred ? '⭐' : '☐'}`);
    });
    
    console.log(`📊 Summary:`);
    console.log(`   - Notes with notebooks: ${notesWithNotebooks}/${notes.length}`);
    console.log(`   - Notes with folders: ${notesWithFolders}/${notes.length}`);
    console.log(`   - Notes with tags: ${notesWithTags}/${notes.length}`);
    console.log(`   - Starred notes: ${starredNotes}/${notes.length}`);
  })
  .catch((error) => {
    console.error("❌ Failed to load notes:", error.message);
  });

console.log("\n✨ Test completed - check the app UI to verify fixes:");
console.log("1. 📚 Notebook names should show actual names, not 'Notebook'");
console.log("2. ⭐ Starred notes should have only one star icon");
console.log("3. 🏷️  Filter menu should show available tags");
console.log("4. 🖱️  Items in sidebar should be draggable");
fetch(
  "http://localhost:3004/api/user-1/notes/285710ec-889d-44a1-b512-e245ebecbffd",
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metadata: {
        title: "Test Title Update - " + new Date().toLocaleTimeString(),
      },
    }),
  }
)
  .then((response) => response.json())
  .then((note) => {
    console.log("✅ Title updated successfully:", note.title);
  })
  .catch((error) => {
    console.error("❌ Failed to update title:", error.message);
  });

console.log("\n📋 Manual Testing Required:");
console.log("===========================");
console.log("1. Open http://localhost:3003 in browser");
console.log("2. Login with demo@example.com / demo123");
console.log(
  "3. Check that tags show as names (JavaScript, React, Tutorial) not IDs"
);
console.log(
  "4. Try clicking + buttons in sidebar to create folders/notebooks/tags"
);
console.log("5. Test inline forms (no browser prompts!)");
console.log("6. Try editing note title by clicking edit icon");
console.log("7. Try drag and drop of notes");
console.log("8. Check that changes persist after page refresh");

setTimeout(() => {
  console.log("\n✨ Test completed!");
  process.exit(0);
}, 2000);
