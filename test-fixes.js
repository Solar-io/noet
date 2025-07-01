#!/usr/bin/env node

import axios from "axios";

const BACKEND_URL = "http://localhost:3004";
const FRONTEND_URL = "http://localhost:3001";
const TEST_USER = "user-1";

console.log("🔧 Testing Noet App Fixes");
console.log("========================\n");

async function testBackendConnectivity() {
  console.log("1️⃣ Testing Backend Connectivity...");
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log("✅ Backend is responding");
    return true;
  } catch (error) {
    console.log("❌ Backend not responding:", error.message);
    return false;
  }
}

async function testFrontendConnectivity() {
  console.log("\n2️⃣ Testing Frontend Connectivity...");
  try {
    const response = await axios.get(FRONTEND_URL);
    if (response.data.includes("Noet")) {
      console.log("✅ Frontend is responding");
      return true;
    } else {
      console.log("⚠️ Frontend responding but may have issues");
      return false;
    }
  } catch (error) {
    console.log("❌ Frontend not responding:", error.message);
    return false;
  }
}

async function testTagCounts() {
  console.log("\n3️⃣ Testing Tag Count Logic...");
  try {
    // Get all notes and tags
    const [notesResponse, tagsResponse] = await Promise.all([
      axios.get(`${BACKEND_URL}/api/${TEST_USER}/notes`),
      axios.get(`${BACKEND_URL}/api/${TEST_USER}/tags`),
    ]);

    const notes = notesResponse.data;
    const tags = tagsResponse.data;

    console.log(`📝 Found ${notes.length} notes`);
    console.log(`🏷️ Found ${tags.length} tags`);

    // Calculate note counts for each tag (same logic as frontend)
    const tagsWithCounts = tags.map((tag) => {
      const noteCount = notes.filter((note) => {
        return (
          note.tags &&
          Array.isArray(note.tags) &&
          note.tags.includes(tag.id) &&
          !note.deleted &&
          !note.archived
        );
      }).length;

      return {
        ...tag,
        noteCount,
      };
    });

    console.log("\n📊 Tag Count Results:");
    tagsWithCounts.forEach((tag) => {
      const status = tag.noteCount > 0 ? "✅" : "⚠️";
      console.log(`${status} Tag "${tag.name}": ${tag.noteCount} notes`);
    });

    const hasCorrectCounts = tagsWithCounts.some((tag) => tag.noteCount > 0);
    if (hasCorrectCounts) {
      console.log("\n✅ Tag counting logic appears to be working");
    } else {
      console.log("\n❌ All tags show 0 notes - there may be an issue");
    }

    return hasCorrectCounts;
  } catch (error) {
    console.log("❌ Error testing tag counts:", error.message);
    return false;
  }
}

async function testNoteCreationAndEditing() {
  console.log("\n4️⃣ Testing Note Creation and Content Persistence...");
  try {
    // Create a test note
    const testNote = {
      title: "Test Content Persistence",
      content: "<p>Initial content for testing</p>",
      tags: [],
      notebook: null,
      folder: null,
    };

    const createResponse = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/notes`,
      testNote
    );
    const createdNote = createResponse.data;
    console.log(`✅ Created test note: ${createdNote.title}`);

    // Update the note content
    const updatedContent =
      "<p>Updated content to test persistence</p><p>Second paragraph with line break</p>";
    const updateResponse = await axios.put(
      `${BACKEND_URL}/api/${TEST_USER}/notes/${createdNote.id}`,
      {
        title: createdNote.title,
        content: updatedContent,
        tags: createdNote.tags,
        notebook: createdNote.notebook,
        folder: createdNote.folder,
      }
    );

    console.log("✅ Updated note content");

    // Retrieve the note to verify content persistence
    const getResponse = await axios.get(
      `${BACKEND_URL}/api/${TEST_USER}/notes/${createdNote.id}`
    );
    const retrievedNote = getResponse.data;

    if (retrievedNote.content === updatedContent) {
      console.log("✅ Note content persisted correctly");
    } else {
      console.log("❌ Note content did not persist correctly");
      console.log("Expected:", updatedContent);
      console.log("Got:", retrievedNote.content);
    }

    // Clean up - delete the test note
    await axios.delete(
      `${BACKEND_URL}/api/${TEST_USER}/notes/${createdNote.id}`
    );
    console.log("✅ Cleaned up test note");

    return retrievedNote.content === updatedContent;
  } catch (error) {
    console.log("❌ Error testing note persistence:", error.message);
    return false;
  }
}

async function testDragDropData() {
  console.log("\n5️⃣ Testing Drag and Drop Data Structure...");
  try {
    // Get notes to test drag/drop structure
    const notesResponse = await axios.get(
      `${BACKEND_URL}/api/${TEST_USER}/notes`
    );
    const notes = notesResponse.data;

    if (notes.length < 2) {
      console.log("⚠️ Need at least 2 notes to test drag and drop");
      return false;
    }

    // Simulate drag data creation (what the frontend does)
    const dragNote = notes[0];
    const dragData = {
      type: "note",
      id: dragNote.id,
      title: dragNote.title,
    };

    console.log("✅ Drag data structure:", JSON.stringify(dragData, null, 2));

    // Check if notes have proper IDs and structure for reordering
    const hasProperStructure = notes.every(
      (note) => note.id && note.title && note.updated
    );

    if (hasProperStructure) {
      console.log("✅ Notes have proper structure for drag and drop");
    } else {
      console.log("❌ Notes missing required fields for drag and drop");
    }

    return hasProperStructure;
  } catch (error) {
    console.log("❌ Error testing drag and drop data:", error.message);
    return false;
  }
}

async function runAllTests() {
  const results = {
    backend: await testBackendConnectivity(),
    frontend: await testFrontendConnectivity(),
    tagCounts: await testTagCounts(),
    notePersistence: await testNoteCreationAndEditing(),
    dragDrop: await testDragDropData(),
  };

  console.log("\n📊 Test Results Summary:");
  console.log("========================");
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? "✅" : "❌";
    console.log(`${status} ${test}`);
  });

  const allPassed = Object.values(results).every(Boolean);
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.values(results).length;

  console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed`);

  if (allPassed) {
    console.log("🎉 All fixes appear to be working!");
  } else {
    console.log("⚠️ Some issues remain. Check the failed tests above.");
  }

  console.log("\n🔍 Manual Testing Required:");
  console.log("1. Open http://localhost:3001 in browser");
  console.log("2. Log in with demo@example.com / demo123");
  console.log("3. Test typing in note editor (check if text persists)");
  console.log("4. Test pressing Enter (check if cursor stays in place)");
  console.log("5. Check if tag filter shows correct note counts");
  console.log("6. Test dragging notes to reorder them");
}

runAllTests().catch(console.error);
