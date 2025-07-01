#!/usr/bin/env node

/**
 * Noet App Feature Test Suite
 * Run this after every code change to verify all features work
 */

import axios from "axios";

const FRONTEND_URL = "http://localhost:3001";
const BACKEND_URL = "http://localhost:3004";
const TEST_USER = "testuser123";

class FeatureTestSuite {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = type === "pass" ? "✅" : type === "fail" ? "❌" : "ℹ️";
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFunction) {
    try {
      await this.log(`Testing: ${name}`, "info");
      await testFunction();
      this.testResults.push({ name, status: "PASS" });
      this.passedTests++;
      await this.log(`PASSED: ${name}`, "pass");
    } catch (error) {
      this.testResults.push({ name, status: "FAIL", error: error.message });
      this.failedTests++;
      await this.log(`FAILED: ${name} - ${error.message}`, "fail");
    }
  }

  async testBackendHealth() {
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    if (response.status !== 200) throw new Error("Backend health check failed");
    if (!response.data.status === "ok") throw new Error("Backend not healthy");
  }

  async testFrontendHealth() {
    const response = await axios.get(FRONTEND_URL);
    if (response.status !== 200) throw new Error("Frontend not accessible");
  }

  async testNoteCreation() {
    const testNote = {
      title: "Test Note " + Date.now(),
      content: "Test content for automated testing",
      tags: [],
      starred: false,
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/notes`,
      testNote
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Note creation failed");
    }

    const note = response.data;
    if (!note.id) throw new Error("Created note missing ID");
    if (note.title !== testNote.title)
      throw new Error("Note title not saved correctly");

    // Clean up
    await axios.delete(`${BACKEND_URL}/api/${TEST_USER}/notes/${note.id}`);
    return note;
  }

  async testNoteTitleUpdate() {
    // Create a test note (without cleanup)
    const testNote = await this.createTestNote("Original Title");

    try {
      // Update the title
      const newTitle = "Updated Title " + Date.now();
      const updateResponse = await axios.put(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`,
        {
          metadata: { title: newTitle },
        }
      );

      if (updateResponse.status !== 200)
        throw new Error("Note title update failed");

      // Verify update
      const getResponse = await axios.get(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`
      );
      if (getResponse.data.title !== newTitle) {
        throw new Error("Note title not updated correctly");
      }
    } finally {
      // Clean up
      await this.cleanupTestNote(testNote.id);
    }
  }

  async testTagCreation() {
    const testTag = {
      name: "test-tag-" + Date.now(),
      color: "#ff0000",
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/tags`,
      testTag
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Tag creation failed");
    }

    const tag = response.data;
    if (!tag.id) throw new Error("Created tag missing ID");
    if (tag.name !== testTag.name)
      throw new Error("Tag name not saved correctly");

    // Clean up
    await axios.delete(`${BACKEND_URL}/api/${TEST_USER}/tags/${tag.id}`);
    return tag;
  }

  async testNotebookCreation() {
    const testNotebook = {
      name: "test-notebook-" + Date.now(),
      color: "#00ff00",
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/notebooks`,
      testNotebook
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Notebook creation failed");
    }

    const notebook = response.data;
    if (!notebook.id) throw new Error("Created notebook missing ID");
    if (notebook.name !== testNotebook.name)
      throw new Error("Notebook name not saved correctly");

    // Clean up
    await axios.delete(
      `${BACKEND_URL}/api/${TEST_USER}/notebooks/${notebook.id}`
    );
    return notebook;
  }

  async testFolderCreation() {
    const testFolder = {
      name: "test-folder-" + Date.now(),
      color: "#0000ff",
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/folders`,
      testFolder
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Folder creation failed");
    }

    const folder = response.data;
    if (!folder.id) throw new Error("Created folder missing ID");
    if (folder.name !== testFolder.name)
      throw new Error("Folder name not saved correctly");

    // Clean up
    await axios.delete(`${BACKEND_URL}/api/${TEST_USER}/folders/${folder.id}`);
    return folder;
  }

  async testNoteArchiving() {
    const testNote = await this.createTestNote("Archive Test Note");

    try {
      // Archive the note
      const archiveResponse = await axios.put(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`,
        {
          metadata: { archived: true },
        }
      );

      if (archiveResponse.status !== 200)
        throw new Error("Note archiving failed");

      // Verify archived
      const getResponse = await axios.get(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`
      );
      if (!getResponse.data.archived) {
        throw new Error("Note not archived correctly");
      }
    } finally {
      // Clean up
      await this.cleanupTestNote(testNote.id);
    }
  }

  async testNoteStarring() {
    const testNote = await this.createTestNote("Star Test Note");

    try {
      // Star the note
      const starResponse = await axios.put(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`,
        {
          metadata: { starred: true },
        }
      );

      if (starResponse.status !== 200) throw new Error("Note starring failed");

      // Verify starred
      const getResponse = await axios.get(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`
      );
      if (!getResponse.data.starred) {
        throw new Error("Note not starred correctly");
      }
    } finally {
      // Clean up
      await this.cleanupTestNote(testNote.id);
    }
  }

  async testSessionTimeout() {
    // Check server configuration to verify 2-week timeout
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
    if (!healthResponse.data) throw new Error("No health data returned");

    // Read the actual server configuration to verify 2-week timeout
    const fs = await import("fs");
    const serverConfigPath = "./server/server.js";

    try {
      const serverConfig = fs.readFileSync(serverConfigPath, "utf8");
      const twoWeeksInMs = 20160 * 60 * 1000; // 2 weeks in milliseconds

      if (
        !serverConfig.includes("20160 * 60 * 1000") &&
        !serverConfig.includes(twoWeeksInMs.toString())
      ) {
        throw new Error(
          `Session timeout not set to 2 weeks (expected ${twoWeeksInMs}ms)`
        );
      }
    } catch (error) {
      throw new Error(
        `Could not verify session timeout configuration: ${error.message}`
      );
    }
  }

  async testDragAndDropFunctionality() {
    // This test requires manual verification since we can't simulate actual drag/drop in automation
    // We'll test if the frontend has the proper drag/drop handlers and visual feedback

    console.log("🔍 MANUAL TEST REQUIRED: Drag and Drop");
    console.log("   1. Open the app in browser");
    console.log("   2. Try dragging a note to a notebook in the sidebar");
    console.log(
      "   3. Try dragging a note above/below another note to reorder"
    );
    console.log("   4. Verify visual feedback (drop zones, hover effects)");
    console.log("   5. Check if the note actually moves after dropping");

    // For now, let's check if the frontend code has drag handlers
    const fs = await import("fs");

    try {
      // Check if ImprovedNotesList has drag handlers
      const notesListFile = fs.readFileSync(
        "./src/components/ImprovedNotesList.jsx",
        "utf8"
      );
      const hasDragStart =
        notesListFile.includes("onDragStart") ||
        notesListFile.includes("handleNoteDragStart");
      const hasDragOver =
        notesListFile.includes("onDragOver") ||
        notesListFile.includes("handleDragOver");
      const hasDrop =
        notesListFile.includes("onDrop") ||
        notesListFile.includes("handleDrop");

      if (!hasDragStart || !hasDragOver || !hasDrop) {
        throw new Error(
          "ImprovedNotesList missing drag and drop event handlers"
        );
      }

      // Check if ImprovedSidebar has drop handlers
      const sidebarFile = fs.readFileSync(
        "./src/components/ImprovedSidebar.jsx",
        "utf8"
      );
      const sidebarHasDrop =
        sidebarFile.includes("onDrop") || sidebarFile.includes("handleDrop");

      if (!sidebarHasDrop) {
        throw new Error(
          "ImprovedSidebar missing drop handlers for drag and drop"
        );
      }

      console.log("✅ Frontend drag/drop handlers found in code");
      console.log(
        "⚠️  Manual testing still required to verify actual functionality"
      );
    } catch (error) {
      throw new Error(`Drag and drop code check failed: ${error.message}`);
    }
  }

  async testTagManagement() {
    const testNote = await this.createTestNote("Tag Management Test");
    const testTag1 = await this.createTestTag("test-tag-1");
    const testTag2 = await this.createTestTag("test-tag-2");

    try {
      // Test adding tags to note
      const addTagsResponse = await axios.put(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`,
        {
          metadata: { tags: [testTag1.id, testTag2.id] },
        }
      );

      if (addTagsResponse.status !== 200) {
        throw new Error("Adding tags to note failed");
      }

      // Verify tags were added
      const verifyResponse = await axios.get(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`
      );
      const noteTags = verifyResponse.data.tags || [];

      if (!noteTags.includes(testTag1.id) || !noteTags.includes(testTag2.id)) {
        throw new Error("Tags were not added to note correctly");
      }

      // Test removing tags
      const removeTagsResponse = await axios.put(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`,
        {
          metadata: { tags: [testTag1.id] },
        }
      );

      if (removeTagsResponse.status !== 200) {
        throw new Error("Removing tags from note failed");
      }

      // Verify tag was removed
      const verifyRemoveResponse = await axios.get(
        `${BACKEND_URL}/api/${TEST_USER}/notes/${testNote.id}`
      );
      const updatedTags = verifyRemoveResponse.data.tags || [];

      if (updatedTags.includes(testTag2.id)) {
        throw new Error("Tag was not removed from note correctly");
      }
    } finally {
      // Clean up
      await this.cleanupTestNote(testNote.id);
      await this.cleanupTestTag(testTag1.id);
      await this.cleanupTestTag(testTag2.id);
    }
  }

  async testFilterButtonFunctionality() {
    console.log("🔍 MANUAL TEST REQUIRED: Filter Button");
    console.log("   1. Open the app in browser");
    console.log("   2. Look for the Filter button in the notes list");
    console.log("   3. Click the Filter button");
    console.log("   4. Verify if a filter menu/dropdown appears");
    console.log(
      "   5. Test if filters actually work (starred, archived, etc.)"
    );

    // Check if the frontend code has a filter button implementation
    const fs = await import("fs");

    try {
      const notesListFile = fs.readFileSync(
        "./src/components/ImprovedNotesList.jsx",
        "utf8"
      );

      // Check if there's a filter button
      const hasFilterButton =
        notesListFile.includes("<Filter") ||
        notesListFile.includes("Filter button");
      const hasFilterOnClick =
        notesListFile.includes("onClick") && notesListFile.includes("filter");

      if (!hasFilterButton) {
        throw new Error(
          "Filter button not found in ImprovedNotesList component"
        );
      }

      console.log("✅ Filter button found in code");

      // Check if there's actual filter logic
      const hasFilterLogic =
        notesListFile.includes("filteredAndSortedNotes") ||
        notesListFile.includes("filter(note =>");

      if (!hasFilterLogic) {
        throw new Error("Filter logic not implemented in notes list");
      }

      console.log("✅ Filter logic found in code");
      console.log(
        "⚠️  Manual testing required to verify filter button actually opens a menu"
      );
    } catch (error) {
      throw new Error(
        `Filter button functionality check failed: ${error.message}`
      );
    }
  }

  async testFrontendUIComponents() {
    console.log("🔍 MANUAL TEST REQUIRED: Frontend UI Components");
    console.log(
      "   1. Open the app and verify all components load without errors"
    );
    console.log(
      "   2. Check if sidebar shows notebooks, folders, and tags sections"
    );
    console.log("   3. Verify + buttons are visible for creating new items");
    console.log("   4. Test if clicking note titles makes them editable");
    console.log("   5. Verify tag names show up (not just counts)");
    console.log("   6. Check if archive buttons are present and functional");

    // Check if frontend files exist and have basic structure
    const fs = await import("fs");

    try {
      // Check main components exist
      const components = [
        "./src/App-TipTap.jsx",
        "./src/components/ImprovedSidebar.jsx",
        "./src/components/ImprovedNotesList.jsx",
        "./src/components/NoteEditor.jsx",
        "./src/components/TagManager.jsx",
      ];

      for (const component of components) {
        if (!fs.existsSync(component)) {
          throw new Error(`Missing component: ${component}`);
        }
      }

      console.log("✅ All main component files exist");
      console.log("⚠️  Manual testing required to verify UI functionality");
    } catch (error) {
      throw new Error(`Frontend component check failed: ${error.message}`);
    }
  }

  async testTitleEditingFunctionality() {
    console.log("🔍 MANUAL TEST REQUIRED: Title Editing");
    console.log("   1. Click on any note title in the notes list");
    console.log("   2. Verify it becomes an editable input field");
    console.log("   3. Change the title and press Enter or click away");
    console.log("   4. Verify the title actually updates and persists");
    console.log("   5. Test both in notes list and note editor header");

    // Check if the frontend code has title editing implemented
    const fs = await import("fs");

    try {
      // Check ImprovedNotesList for title editing
      const notesListFile = fs.readFileSync(
        "./src/components/ImprovedNotesList.jsx",
        "utf8"
      );
      const hasEditingState =
        notesListFile.includes("editingNoteId") ||
        notesListFile.includes("isEditing");
      const hasEditInput =
        notesListFile.includes("input") && notesListFile.includes("title");

      if (!hasEditingState || !hasEditInput) {
        throw new Error("Title editing not implemented in ImprovedNotesList");
      }

      // Check NoteEditor for title editing
      const editorFile = fs.readFileSync(
        "./src/components/NoteEditor.jsx",
        "utf8"
      );
      const hasEditorTitleEdit =
        editorFile.includes("isEditingTitle") ||
        editorFile.includes("editingTitle");

      if (!hasEditorTitleEdit) {
        throw new Error("Title editing not implemented in NoteEditor");
      }

      console.log("✅ Title editing code found in components");
      console.log("⚠️  Manual testing required to verify actual functionality");
    } catch (error) {
      throw new Error(
        `Title editing functionality check failed: ${error.message}`
      );
    }
  }

  // Helper methods for test data creation and cleanup
  async createTestNote(title, metadata = {}) {
    const testNote = {
      title: title + " " + Date.now(),
      content: "Test content for automated testing",
      ...metadata,
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/notes`,
      testNote
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Test note creation failed");
    }
    return response.data;
  }

  async createTestTag(baseName) {
    const testTag = {
      name: baseName + "-" + Date.now(),
      color: "#ff0000",
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/tags`,
      testTag
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Test tag creation failed");
    }
    return response.data;
  }

  async createTestNotebook(baseName) {
    const testNotebook = {
      name: baseName + "-" + Date.now(),
      color: "#00ff00",
    };

    const response = await axios.post(
      `${BACKEND_URL}/api/${TEST_USER}/notebooks`,
      testNotebook
    );
    if (response.status !== 200 && response.status !== 201) {
      throw new Error("Test notebook creation failed");
    }
    return response.data;
  }

  async cleanupTestNote(noteId) {
    try {
      await axios.delete(`${BACKEND_URL}/api/${TEST_USER}/notes/${noteId}`);
    } catch (error) {
      console.warn(`Failed to cleanup test note ${noteId}:`, error.message);
    }
  }

  async cleanupTestTag(tagId) {
    try {
      await axios.delete(`${BACKEND_URL}/api/${TEST_USER}/tags/${tagId}`);
    } catch (error) {
      console.warn(`Failed to cleanup test tag ${tagId}:`, error.message);
    }
  }

  async cleanupTestNotebook(notebookId) {
    try {
      await axios.delete(
        `${BACKEND_URL}/api/${TEST_USER}/notebooks/${notebookId}`
      );
    } catch (error) {
      console.warn(
        `Failed to cleanup test notebook ${notebookId}:`,
        error.message
      );
    }
  }

  async runAllTests() {
    console.log("\n🧪 Starting Noet App Feature Test Suite\n");

    await this.test("Backend Health Check", () => this.testBackendHealth());
    await this.test("Frontend Health Check", () => this.testFrontendHealth());
    await this.test("Note Creation", () => this.testNoteCreation());
    await this.test("Note Title Update API", () => this.testNoteTitleUpdate());
    await this.test("Tag Creation", () => this.testTagCreation());
    await this.test("Tag Management on Notes", () => this.testTagManagement());
    await this.test("Notebook Creation", () => this.testNotebookCreation());
    await this.test("Folder Creation", () => this.testFolderCreation());
    await this.test("Note Archiving API", () => this.testNoteArchiving());
    await this.test("Note Starring API", () => this.testNoteStarring());
    await this.test("Session Timeout (2 weeks)", () =>
      this.testSessionTimeout()
    );

    // Frontend UI Tests (require manual verification)
    console.log(
      "\n🔍 FRONTEND FUNCTIONALITY TESTS (Manual Verification Required):"
    );
    await this.test("Frontend UI Components", () =>
      this.testFrontendUIComponents()
    );
    await this.test("Title Editing Functionality", () =>
      this.testTitleEditingFunctionality()
    );
    await this.test("Drag and Drop Functionality", () =>
      this.testDragAndDropFunctionality()
    );
    await this.test("Filter Button Functionality", () =>
      this.testFilterButtonFunctionality()
    );

    this.printSummary();
  }

  printSummary() {
    console.log("\n📊 Test Results Summary:");
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(
      `📈 Success Rate: ${(
        (this.passedTests / (this.passedTests + this.failedTests)) *
        100
      ).toFixed(1)}%`
    );

    if (this.failedTests > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults
        .filter((result) => result.status === "FAIL")
        .forEach((result) => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
    }

    console.log("\n" + "=".repeat(50));
    return this.failedTests === 0;
  }
}

// Run tests if called directly
const testSuite = new FeatureTestSuite();
testSuite
  .runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Test suite failed to run:", error.message);
    process.exit(1);
  });

export default FeatureTestSuite;
