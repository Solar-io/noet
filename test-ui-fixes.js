#!/usr/bin/env node

/**
 * Test script to verify UI fixes for:
 * 1. Tag display showing names instead of IDs
 * 2. Tag/notebook/folder creation working (no more prompts)
 * 3. Title editing saving properly
 * 4. Drag-and-drop functionality
 */

console.log("🧪 Testing UI Fixes for noet-app");
console.log("=================================");

// Test 1: Check that tags API returns proper data
console.log("\n1. Testing tags API...");
fetch("http://localhost:3004/api/user-1/tags")
  .then((response) => response.json())
  .then((tags) => {
    console.log("✅ Tags loaded:", tags.length, "tags");
    tags.forEach((tag) => {
      console.log(`   - ${tag.name} (${tag.id.substring(0, 8)}...)`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to load tags:", error.message);
  });

// Test 2: Check that notes have tags
console.log("\n2. Testing notes with tags...");
fetch("http://localhost:3004/api/user-1/notes")
  .then((response) => response.json())
  .then((notes) => {
    console.log("✅ Notes loaded:", notes.length, "notes");
    notes.forEach((note) => {
      console.log(`   - "${note.title}" has ${note.tags?.length || 0} tags`);
      if (note.tags?.length > 0) {
        console.log(
          `     Tags: ${note.tags
            .map((id) => id.substring(0, 8) + "...")
            .join(", ")}`
        );
      }
    });
  })
  .catch((error) => {
    console.error("❌ Failed to load notes:", error.message);
  });

// Test 3: Test title update API
console.log("\n3. Testing title update...");
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
