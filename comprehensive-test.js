#!/usr/bin/env node

/**
 * Comprehensive Noet App Test Suite
 * Tests all major functionality including the recent bug fixes
 */

import axios from "axios";
import { promises as fs } from "fs";
import { join } from "path";

// Configuration
const CONFIG = {
  backend: "http://localhost:3004",
  frontend: "http://localhost:3001",
  userId: "user-1",
  testTimeout: 30000,
};

// Test utilities
class TestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: [],
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const emoji =
      {
        info: "ℹ️",
        success: "✅",
        error: "❌",
        warning: "⚠️",
        debug: "🔍",
      }[level] || "ℹ️";

    console.log(`${emoji} [${timestamp}] ${message}`);
    if (data) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  }

  async test(name, testFn) {
    this.results.total++;
    this.log("info", `Testing: ${name}`);

    try {
      const result = await Promise.race([
        testFn(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Test timeout")),
            CONFIG.testTimeout
          )
        ),
      ]);

      this.results.passed++;
      this.results.details.push({ name, status: "PASSED", result });
      this.log("success", `PASSED: ${name}`, result);
      return result;
    } catch (error) {
      this.results.failed++;
      this.results.details.push({
        name,
        status: "FAILED",
        error: error.message,
      });
      this.log("error", `FAILED: ${name} - ${error.message}`);
      return null;
    }
  }

  summary() {
    const successRate = (
      (this.results.passed / this.results.total) *
      100
    ).toFixed(1);

    console.log("\n📊 Comprehensive Test Results Summary:");
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.results.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.results.details
        .filter((t) => t.status === "FAILED")
        .forEach((t) => console.log(`  - ${t.name}: ${t.error}`));
    }

    console.log("\n" + "=".repeat(50));
    return this.results.failed === 0;
  }
}

// Helper functions
async function apiCall(method, endpoint, data = null) {
  const url = `${CONFIG.backend}${endpoint}`;
  const config = {
    method,
    url,
    headers: { "Content-Type": "application/json" },
    ...(data && { data }),
  };

  const response = await axios(config);
  return response.data;
}

async function waitForServer(url, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

// Test suites
const runner = new TestRunner();

// 1. Infrastructure Tests
async function testInfrastructure() {
  await runner.test("Backend Server Health", async () => {
    const health = await apiCall("GET", "/api/health");
    if (!health.status || health.status !== "ok") {
      throw new Error("Backend health check failed");
    }
    return { status: health.status, port: health.port };
  });

  await runner.test("Frontend Server Accessibility", async () => {
    try {
      const response = await axios.get(CONFIG.frontend);
      if (response.status !== 200) {
        throw new Error(`Frontend returned status ${response.status}`);
      }
      return { status: response.status, accessible: true };
    } catch (error) {
      throw new Error(`Frontend not accessible: ${error.message}`);
    }
  });

  await runner.test("Configuration Service", async () => {
    try {
      const configPath = join(process.cwd(), "public", "config.json");
      const config = JSON.parse(await fs.readFile(configPath, "utf8"));
      return { backendUrl: config.backendUrl, backendPort: config.backendPort };
    } catch (error) {
      throw new Error(`Config file error: ${error.message}`);
    }
  });
}

// 2. Backend API Tests
async function testBackendAPI() {
  let testNoteId = null;
  let testTagId = null;
  let testNotebookId = null;
  let testFolderId = null;

  // Note CRUD operations
  await runner.test("Note Creation", async () => {
    const note = await apiCall("POST", `/api/${CONFIG.userId}/notes`, {
      title: "Test Note - Comprehensive Suite",
      content: "<p>This is test content for comprehensive testing</p>",
      tags: [],
    });
    testNoteId = note.id;
    return { id: note.id, title: note.title };
  });

  await runner.test("Note Content Retrieval", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const note = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes/${testNoteId}`
    );
    if (!note.content || !note.content.includes("comprehensive testing")) {
      throw new Error("Note content not properly retrieved");
    }
    return { hasContent: true, contentLength: note.content.length };
  });

  await runner.test("Note Title Update", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const updatedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { title: "Updated Test Note Title" },
      }
    );
    if (updatedNote.title !== "Updated Test Note Title") {
      throw new Error("Note title was not updated");
    }
    return { newTitle: updatedNote.title };
  });

  await runner.test("Note Content Update", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const newContent = "<p>Updated content for comprehensive testing</p>";
    const updatedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        content: newContent,
      }
    );
    if (
      !updatedNote.content ||
      !updatedNote.content.includes("Updated content")
    ) {
      throw new Error("Note content was not updated");
    }
    return { contentUpdated: true };
  });

  // Tag management
  await runner.test("Tag Creation", async () => {
    const tag = await apiCall("POST", `/api/${CONFIG.userId}/tags`, {
      name: "comprehensive-test-tag",
      color: "#FF5733",
    });
    testTagId = tag.id;
    return { id: tag.id, name: tag.name, color: tag.color };
  });

  await runner.test("Tag Assignment to Note", async () => {
    if (!testNoteId || !testTagId) throw new Error("Missing test note or tag");
    const updatedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { tags: [testTagId] },
      }
    );
    if (!updatedNote.tags || !updatedNote.tags.includes(testTagId)) {
      throw new Error("Tag was not assigned to note");
    }
    return { tagsAssigned: updatedNote.tags.length };
  });

  // Notebook management
  await runner.test("Notebook Creation", async () => {
    const notebook = await apiCall("POST", `/api/${CONFIG.userId}/notebooks`, {
      name: "Test Notebook - Comprehensive",
    });
    testNotebookId = notebook.id;
    return { id: notebook.id, name: notebook.name };
  });

  await runner.test("Note Assignment to Notebook", async () => {
    if (!testNoteId || !testNotebookId)
      throw new Error("Missing test note or notebook");
    const updatedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { notebook: testNotebookId },
      }
    );
    if (updatedNote.notebook !== testNotebookId) {
      throw new Error("Note was not assigned to notebook");
    }
    return { assignedNotebook: updatedNote.notebook };
  });

  // Folder management
  await runner.test("Folder Creation", async () => {
    const folder = await apiCall("POST", `/api/${CONFIG.userId}/folders`, {
      name: "Test Folder - Comprehensive",
    });
    testFolderId = folder.id;
    return { id: folder.id, name: folder.name };
  });

  // Note operations
  await runner.test("Note Starring", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const starredNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { starred: true },
      }
    );
    if (!starredNote.starred) {
      throw new Error("Note was not starred");
    }
    return { starred: starredNote.starred };
  });

  await runner.test("Note Archiving", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const archivedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { archived: true },
      }
    );
    if (!archivedNote.archived) {
      throw new Error("Note was not archived");
    }
    return { archived: archivedNote.archived };
  });

  await runner.test("Note Soft Delete (Trash)", async () => {
    if (!testNoteId) throw new Error("No test note available");
    const deletedNote = await apiCall(
      "PUT",
      `/api/${CONFIG.userId}/notes/${testNoteId}`,
      {
        metadata: { deleted: true },
      }
    );
    if (!deletedNote.deleted) {
      throw new Error("Note was not moved to trash");
    }
    return { deleted: deletedNote.deleted, inTrash: true };
  });

  // Filtering tests
  await runner.test("Starred Notes Filter", async () => {
    const starredNotes = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes?starred=true`
    );
    return { count: starredNotes.length };
  });

  await runner.test("Archived Notes Filter", async () => {
    const archivedNotes = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes?archived=true`
    );
    return { count: archivedNotes.length };
  });

  await runner.test("Deleted Notes Filter (Trash)", async () => {
    const deletedNotes = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes?deleted=true`
    );
    if (deletedNotes.length === 0) {
      throw new Error("No deleted notes found in trash");
    }
    return { count: deletedNotes.length };
  });

  // Cleanup
  await runner.test("Test Data Cleanup", async () => {
    const cleanupResults = [];

    // Clean up in reverse order to avoid dependency issues
    if (testTagId) {
      try {
        await apiCall("DELETE", `/api/${CONFIG.userId}/tags/${testTagId}`);
        cleanupResults.push("tag");
      } catch (e) {
        /* ignore cleanup errors */
      }
    }

    if (testNotebookId) {
      try {
        await apiCall(
          "DELETE",
          `/api/${CONFIG.userId}/notebooks/${testNotebookId}`
        );
        cleanupResults.push("notebook");
      } catch (e) {
        /* ignore cleanup errors */
      }
    }

    if (testFolderId) {
      try {
        await apiCall(
          "DELETE",
          `/api/${CONFIG.userId}/folders/${testFolderId}`
        );
        cleanupResults.push("folder");
      } catch (e) {
        /* ignore cleanup errors */
      }
    }

    return { cleaned: cleanupResults };
  });
}

// 3. Content Differentiation Tests
async function testContentDifferentiation() {
  await runner.test("Multiple Notes Content Differentiation", async () => {
    // Get all notes
    const notes = await apiCall("GET", `/api/${CONFIG.userId}/notes`);
    if (notes.length < 2) {
      throw new Error("Need at least 2 notes to test content differentiation");
    }

    // Get full content for first 3 notes
    const noteContents = [];
    for (let i = 0; i < Math.min(3, notes.length); i++) {
      const fullNote = await apiCall(
        "GET",
        `/api/${CONFIG.userId}/notes/${notes[i].id}`
      );
      noteContents.push({
        id: notes[i].id,
        title: fullNote.title,
        content: fullNote.content || "",
        contentLength: (fullNote.content || "").length,
      });
    }

    // Check if contents are different
    const uniqueContents = new Set(noteContents.map((n) => n.content));
    if (uniqueContents.size < 2 && noteContents.length >= 2) {
      throw new Error(
        "Notes have identical content - content sharing bug exists"
      );
    }

    return {
      notesChecked: noteContents.length,
      uniqueContents: uniqueContents.size,
      contentLengths: noteContents.map((n) => n.contentLength),
    };
  });
}

// 4. User Management Tests
async function testUserManagement() {
  await runner.test("Session Timeout Configuration", async () => {
    // Test that the backend supports 2-week session timeout
    const testUser = await apiCall(
      "GET",
      `/api/users/${CONFIG.userId}/profile`
    );

    // Try to update session timeout to 2 weeks (20160 minutes)
    const updatedSettings = await apiCall(
      "PUT",
      `/api/users/${CONFIG.userId}/settings`,
      {
        sessionTimeout: 20160, // 2 weeks in minutes
      }
    );

    if (updatedSettings.sessionTimeout !== 20160) {
      throw new Error("Backend does not support 2-week session timeout");
    }

    return { sessionTimeout: updatedSettings.sessionTimeout, weeks: 2 };
  });
}

// 5. Integration Tests
async function testIntegration() {
  await runner.test("End-to-End Note Workflow", async () => {
    // Create a complete note with all metadata
    const tag = await apiCall("POST", `/api/${CONFIG.userId}/tags`, {
      name: "integration-test",
      color: "#4CAF50",
    });

    const notebook = await apiCall("POST", `/api/${CONFIG.userId}/notebooks`, {
      name: "Integration Test Notebook",
    });

    const note = await apiCall("POST", `/api/${CONFIG.userId}/notes`, {
      title: "Integration Test Note",
      content: "<p>This note tests the complete workflow</p>",
      tags: [tag.id],
      notebook: notebook.id,
      starred: true,
    });

    // Verify the note was created with all metadata
    const fullNote = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes/${note.id}`
    );

    if (!fullNote.content.includes("complete workflow")) {
      throw new Error("Note content not properly saved");
    }

    if (!fullNote.tags.includes(tag.id)) {
      throw new Error("Note tag not properly assigned");
    }

    if (fullNote.notebook !== notebook.id) {
      throw new Error("Note notebook not properly assigned");
    }

    if (!fullNote.starred) {
      throw new Error("Note starring not properly saved");
    }

    // Update the note
    await apiCall("PUT", `/api/${CONFIG.userId}/notes/${note.id}`, {
      content: "<p>Updated content through integration test</p>",
      metadata: { title: "Updated Integration Test Note" },
    });

    // Verify updates
    const updatedNote = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes/${note.id}`
    );

    if (!updatedNote.content.includes("Updated content")) {
      throw new Error("Note content update failed");
    }

    if (updatedNote.title !== "Updated Integration Test Note") {
      throw new Error("Note title update failed");
    }

    // Move to trash
    await apiCall("PUT", `/api/${CONFIG.userId}/notes/${note.id}`, {
      metadata: { deleted: true },
    });

    // Verify it's in trash
    const trashNotes = await apiCall(
      "GET",
      `/api/${CONFIG.userId}/notes?deleted=true`
    );
    const noteInTrash = trashNotes.find((n) => n.id === note.id);

    if (!noteInTrash || !noteInTrash.deleted) {
      throw new Error("Note not properly moved to trash");
    }

    // Cleanup
    await apiCall("DELETE", `/api/${CONFIG.userId}/tags/${tag.id}`);
    await apiCall("DELETE", `/api/${CONFIG.userId}/notebooks/${notebook.id}`);

    return {
      noteCreated: true,
      metadataAssigned: true,
      contentUpdated: true,
      movedToTrash: true,
    };
  });
}

// Main test execution
async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive Noet App Test Suite\n");

  try {
    // Wait for servers to be ready
    await waitForServer(`${CONFIG.backend}/api/health`);

    // Run all test suites
    await testInfrastructure();
    await testBackendAPI();
    await testContentDifferentiation();
    await testUserManagement();
    await testIntegration();
  } catch (error) {
    runner.log("error", `Test suite failed to complete: ${error.message}`);
  }

  // Show final results
  const success = runner.summary();
  process.exit(success ? 0 : 1);
}

// Run the tests
runComprehensiveTests().catch((error) => {
  console.error("❌ Test suite crashed:", error);
  process.exit(1);
});
