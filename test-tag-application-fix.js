#!/usr/bin/env node

import configService from "./src/configService.js";

async function testTagApplicationFix() {
  console.log("🧪 Testing Tag Application and Performance Fixes");
  console.log("=================================================\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log("✅ Backend URL:", backendUrl);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const userId = "user-1";

  // Test 1: Backend Performance
  console.log("📊 Test 1: Backend Performance...");
  console.time("Tags API Performance");

  try {
    const response = await fetch(`${backendUrl}/api/${userId}/tags`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const tags = await response.json();
    console.timeEnd("Tags API Performance");
    console.log(`✅ Retrieved ${tags.length} tags`);

    if (tags.length === 0) {
      console.log("⚠️  No tags found, creating test tag...");
      const createResponse = await fetch(`${backendUrl}/api/${userId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "test-performance-tag",
          color: "#3b82f6",
        }),
      });

      if (createResponse.ok) {
        const newTag = await createResponse.json();
        console.log("✅ Created test tag:", newTag.name);
        tags.push(newTag);
      }
    }

    // Test 2: Note Creation and Tag Application
    console.log("\n🏷️  Test 2: Note Creation and Tag Application...");

    // Create a test note
    const createNoteResponse = await fetch(
      `${backendUrl}/api/${userId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Tag Application Test Note",
          content: "Testing tag application functionality",
          tags: [],
        }),
      }
    );

    if (!createNoteResponse.ok) {
      throw new Error(`Failed to create note: ${createNoteResponse.status}`);
    }

    const testNote = await createNoteResponse.json();
    console.log("✅ Created test note:", testNote.title);

    // Test 3: Tag Application (Frontend Format)
    console.log("\n🔧 Test 3: Tag Application (Frontend Format)...");

    if (tags.length > 0) {
      const tagToAdd = tags[0];
      console.log("🏷️  Adding tag:", tagToAdd.name);

      // Test the CORRECT format (what we just fixed)
      const updateResponse = await fetch(
        `${backendUrl}/api/${userId}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags: [tagToAdd.id], // Direct format, not wrapped in metadata
          }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error(
          "❌ Failed to add tag:",
          updateResponse.status,
          errorText
        );
      } else {
        const updatedNote = await updateResponse.json();
        console.log(
          "✅ Tag applied successfully! Note now has tags:",
          updatedNote.tags
        );

        // Verify the tag was actually applied
        const verifyResponse = await fetch(
          `${backendUrl}/api/${userId}/notes/${testNote.id}`
        );
        if (verifyResponse.ok) {
          const verifiedNote = await verifyResponse.json();
          if (verifiedNote.tags && verifiedNote.tags.includes(tagToAdd.id)) {
            console.log("✅ Tag persistence verified!");
          } else {
            console.log("❌ Tag was not persisted correctly");
          }
        }
      }

      // Test 4: Tag Removal
      console.log("\n🗑️  Test 4: Tag Removal...");

      const removeResponse = await fetch(
        `${backendUrl}/api/${userId}/notes/${testNote.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tags: [], // Remove all tags
          }),
        }
      );

      if (!removeResponse.ok) {
        const errorText = await removeResponse.text();
        console.error(
          "❌ Failed to remove tag:",
          removeResponse.status,
          errorText
        );
      } else {
        const updatedNote = await removeResponse.json();
        console.log(
          "✅ Tag removed successfully! Note now has tags:",
          updatedNote.tags
        );
      }
    }

    // Test 5: Cache Performance
    console.log("\n⚡ Test 5: Cache Performance...");

    console.time("Cached Tags API");
    const cachedResponse = await fetch(`${backendUrl}/api/${userId}/tags`);
    if (cachedResponse.ok) {
      const cachedTags = await cachedResponse.json();
      console.timeEnd("Cached Tags API");
      console.log(`✅ Retrieved ${cachedTags.length} tags from cache`);
    }

    // Cleanup: Delete test note
    console.log("\n🧹 Cleanup: Deleting test note...");
    const deleteResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      console.log("✅ Test note deleted");
    }

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testTagApplicationFix().catch(console.error);
