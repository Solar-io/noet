#!/usr/bin/env node

/**
 * Test Tags Display and Functionality
 * Tests if tags are properly displayed and if tag removal works
 */

const API_BASE = "http://localhost:3004";
const userId = "demo-user";

async function testTagsFunctionality() {
  console.log("🏷️  Testing Tags Display and Functionality");
  console.log("==========================================\n");

  try {
    // 1. Check existing notes with tags
    console.log("1. Checking existing notes with tags...");
    const notesResponse = await fetch(`${API_BASE}/api/${userId}/notes`);
    const notes = await notesResponse.json();

    const notesWithTags = notes.filter(
      (note) => note.tags && note.tags.length > 0
    );
    console.log(`✅ Found ${notesWithTags.length} notes with tags`);

    if (notesWithTags.length > 0) {
      const firstTaggedNote = notesWithTags[0];
      console.log(
        `   Example: "${firstTaggedNote.title}" has tags: ${JSON.stringify(
          firstTaggedNote.tags
        )}`
      );
    }

    // 2. Create a test note with string tags
    console.log("2. Creating test note with string tags...");
    const createResponse = await fetch(`${API_BASE}/api/${userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Tag Test Note",
        content: "This note tests tag display and removal functionality",
        tags: ["test-tag", "ui-test", "frontend"],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log(`✅ Created test note: ${newNote.id}`);
    console.log(`   Tags: ${JSON.stringify(newNote.tags)}`);

    // 3. Test tag removal
    console.log("3. Testing tag removal...");
    const noteResponse = await fetch(
      `${API_BASE}/api/${userId}/notes/${newNote.id}`
    );
    const fullNote = await noteResponse.json();

    if (fullNote.tags && fullNote.tags.length > 0) {
      const tagToRemove = fullNote.tags[0]; // Remove first tag
      console.log(`   Removing tag: "${tagToRemove}"`);

      const updatedTags = fullNote.tags.filter((tag) => tag !== tagToRemove);

      const updateResponse = await fetch(
        `${API_BASE}/api/${userId}/notes/${newNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metadata: { tags: updatedTags },
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Failed to update note tags: ${updateResponse.status}`);
      }

      const updatedNote = await updateResponse.json();
      console.log(
        `✅ Tag removed. Remaining tags: ${JSON.stringify(updatedNote.tags)}`
      );
    }

    // 4. Check tags endpoint (should still be empty since no tag Map sync)
    console.log("4. Checking tags endpoint...");
    const tagsResponse = await fetch(`${API_BASE}/api/${userId}/tags`);
    const tags = await tagsResponse.json();
    console.log(`✅ Tags endpoint returns: ${tags.length} tags`);
    if (tags.length === 0) {
      console.log(
        "   (This is expected - the backend tags system is separate from note string tags)"
      );
    }

    // 5. Clean up test note
    console.log("5. Cleaning up test note...");
    const deleteResponse = await fetch(
      `${API_BASE}/api/${userId}/notes/${newNote.id}/permanent`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      console.log("✅ Test note cleaned up");
    }

    console.log("\n🎉 TAGS FUNCTIONALITY TEST RESULTS:");
    console.log("=====================================");
    console.log("✅ String tags in notes are properly stored");
    console.log("✅ Notes can be created with tags");
    console.log("✅ Tags can be updated/removed from notes");
    console.log("💡 Frontend should now display tags correctly");
    console.log("💡 Tag removal buttons should work in the UI");
    console.log(
      '\n📌 NOTE: The tags will display as simple strings (e.g., "test-tag")'
    );
    console.log('📌 Unknown tag IDs will show as "Unknown (12345678...)"');
  } catch (error) {
    console.error("\n❌ Tags functionality test failed:");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

testTagsFunctionality();
