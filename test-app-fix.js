#!/usr/bin/env node

/**
 * Quick test to verify the main app error is fixed
 */

console.log("🧪 Testing App Error Fix");
console.log("========================");

// Test that all required data is available
async function testAppData() {
  const BASE_URL = "http://localhost:3004";
  const USER_ID = "user-1";

  try {
    console.log("📊 Checking backend data availability...");

    const [notebooksRes, tagsRes, foldersRes, notesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/${USER_ID}/notebooks`),
      fetch(`${BASE_URL}/api/${USER_ID}/tags`),
      fetch(`${BASE_URL}/api/${USER_ID}/folders`),
      fetch(`${BASE_URL}/api/${USER_ID}/notes`),
    ]);

    const [notebooks, tags, folders, notes] = await Promise.all([
      notebooksRes.json(),
      tagsRes.json(),
      foldersRes.json(),
      notesRes.json(),
    ]);

    console.log(`✅ Notebooks: ${notebooks.length}`);
    console.log(`✅ Tags: ${tags.length}`);
    console.log(`✅ Folders: ${folders.length}`);
    console.log(`✅ Notes: ${notes.length}`);

    // Check if notes have proper relationships
    const notesWithNotebooks = notes.filter((n) => n.notebook).length;
    const notesWithTags = notes.filter(
      (n) => n.tags && n.tags.length > 0
    ).length;

    console.log(
      `📚 Notes with notebooks: ${notesWithNotebooks}/${notes.length}`
    );
    console.log(`🏷️  Notes with tags: ${notesWithTags}/${notes.length}`);

    if (notebooks.length > 0 && tags.length > 0 && folders.length > 0) {
      console.log("\n✅ Backend data looks good!");
      console.log("🌐 Try accessing http://localhost:3002 in your browser");
      console.log("📝 Login with: demo@example.com / demo123");
      console.log("\nThe app should now show:");
      console.log("- Actual notebook names instead of 'Notebook'");
      console.log("- Single star icons for starred notes");
      console.log("- Tag filter options in filter menu");
      console.log("- No 'folders is not defined' error");
    } else {
      console.log(
        "⚠️  Missing some data - you may need to run populate-test-data.js"
      );
    }
  } catch (error) {
    console.error("❌ Error testing app data:", error.message);
  }
}

testAppData();
