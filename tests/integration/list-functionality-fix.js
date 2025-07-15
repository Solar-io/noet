#!/usr/bin/env node

/**
 * Integration Test: List Functionality Fix Verification
 *
 * This test verifies that the fixes for notebook/folder deletion and note counts
 * continue to work correctly. It prevents regression of the critical fixes.
 *
 * Run with: node tests/integration/list-functionality-fix.js
 */

const API_BASE = process.env.API_BASE || "http://localhost:3004";
const TEST_USER_ID = process.env.TEST_USER_ID || "user-1";

class ListFunctionalityFixTest {
  constructor() {
    this.apiBase = API_BASE;
    this.userId = TEST_USER_ID;
    this.testData = {
      createdFolders: [],
      createdNotebooks: [],
      createdTags: [],
      createdNotes: [],
    };
  }

  async runTests() {
    console.log("🧪 Running List Functionality Fix Tests...\n");

    try {
      await this.testBackendConnectivity();
      await this.createTestData();
      await this.testNoteCounts();
      await this.testDeleteFunctionality();
      await this.cleanupTestData();

      console.log("\n✅ All List Functionality Fix Tests PASSED!");
      console.log("🛡️ No regression detected in the fixes.");
    } catch (error) {
      console.error("\n❌ Test FAILED:", error.message);
      await this.cleanupTestData();
      process.exit(1);
    }
  }

  async testBackendConnectivity() {
    console.log("1. 🔌 Testing backend connectivity...");

    const response = await this.makeRequest(`${this.apiBase}/api/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    console.log("   ✅ Backend is responsive");
  }

  async createTestData() {
    console.log("\n2. 📝 Creating test data...");

    // Create test folder
    const folderData = {
      name: "Test Folder - Fix Verification",
      color: "#3b82f6",
    };

    const folderResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/folders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderData),
      }
    );

    if (!folderResponse.ok) {
      throw new Error(`Failed to create test folder: ${folderResponse.status}`);
    }

    const folder = await folderResponse.json();
    this.testData.createdFolders.push(folder);
    console.log(`   ✅ Created test folder: ${folder.name} (${folder.id})`);

    // Create test notebook
    const notebookData = {
      name: "Test Notebook - Fix Verification",
      color: "#10b981",
    };

    const notebookResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/notebooks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notebookData),
      }
    );

    if (!notebookResponse.ok) {
      throw new Error(
        `Failed to create test notebook: ${notebookResponse.status}`
      );
    }

    const notebook = await notebookResponse.json();
    this.testData.createdNotebooks.push(notebook);
    console.log(
      `   ✅ Created test notebook: ${notebook.name} (${notebook.id})`
    );

    // Create test tag
    const tagData = {
      name: "test-fix-verification-tag",
      color: "#f59e0b",
    };

    const tagResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/tags`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagData),
      }
    );

    if (!tagResponse.ok) {
      throw new Error(`Failed to create test tag: ${tagResponse.status}`);
    }

    const tag = await tagResponse.json();
    this.testData.createdTags.push(tag);
    console.log(`   ✅ Created test tag: ${tag.name} (${tag.id})`);

    // Create test notes to verify counting
    const noteData = {
      title: "Test Note for Fix Verification",
      content:
        "This note verifies that the list functionality fixes are working.",
      folder: folder.id,
      notebook: notebook.id,
      tags: [tag.id],
    };

    const noteResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      }
    );

    if (!noteResponse.ok) {
      throw new Error(`Failed to create test note: ${noteResponse.status}`);
    }

    const note = await noteResponse.json();
    this.testData.createdNotes.push(note);
    console.log(`   ✅ Created test note: ${note.title} (${note.id})`);
  }

  async testNoteCounts() {
    console.log("\n3. 🔢 Testing note counts...");

    // Test folder counts
    const foldersResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/folders`
    );

    if (!foldersResponse.ok) {
      throw new Error(`Failed to fetch folders: ${foldersResponse.status}`);
    }

    const folders = await foldersResponse.json();
    const testFolder = folders.find((f) =>
      f.name.includes("Test Folder - Fix Verification")
    );

    if (!testFolder) {
      throw new Error("Test folder not found");
    }

    if (typeof testFolder.noteCount !== "number") {
      throw new Error(
        `Folder noteCount missing or invalid: ${testFolder.noteCount}`
      );
    }

    if (testFolder.noteCount !== 1) {
      throw new Error(
        `Expected folder noteCount to be 1, got ${testFolder.noteCount}`
      );
    }

    console.log(`   ✅ Folder note count correct: ${testFolder.noteCount}`);

    // Test notebook counts
    const notebooksResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/notebooks`
    );

    if (!notebooksResponse.ok) {
      throw new Error(`Failed to fetch notebooks: ${notebooksResponse.status}`);
    }

    const notebooks = await notebooksResponse.json();
    const testNotebook = notebooks.find((n) =>
      n.name.includes("Test Notebook - Fix Verification")
    );

    if (!testNotebook) {
      throw new Error("Test notebook not found");
    }

    if (typeof testNotebook.noteCount !== "number") {
      throw new Error(
        `Notebook noteCount missing or invalid: ${testNotebook.noteCount}`
      );
    }

    if (testNotebook.noteCount !== 1) {
      throw new Error(
        `Expected notebook noteCount to be 1, got ${testNotebook.noteCount}`
      );
    }

    console.log(`   ✅ Notebook note count correct: ${testNotebook.noteCount}`);

    // Test tag counts
    const tagsResponse = await this.makeRequest(
      `${this.apiBase}/api/${this.userId}/tags`
    );

    if (!tagsResponse.ok) {
      throw new Error(`Failed to fetch tags: ${tagsResponse.status}`);
    }

    const tags = await tagsResponse.json();
    const testTag = tags.find((t) =>
      t.name.includes("test-fix-verification-tag")
    );

    if (!testTag) {
      throw new Error("Test tag not found");
    }

    if (typeof testTag.noteCount !== "number") {
      throw new Error(`Tag noteCount missing or invalid: ${testTag.noteCount}`);
    }

    console.log(`   ✅ Tag note count present: ${testTag.noteCount}`);
  }

  async testDeleteFunctionality() {
    console.log("\n4. 🗑️ Testing delete functionality...");

    // Test folder deletion
    if (this.testData.createdFolders.length > 0) {
      const folder = this.testData.createdFolders[0];
      console.log(`   🗑️ Deleting folder: ${folder.name} (${folder.id})`);

      const deleteResponse = await this.makeRequest(
        `${this.apiBase}/api/${this.userId}/folders/${folder.id}`,
        { method: "DELETE" }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(
          `Folder deletion failed: ${deleteResponse.status} - ${errorText}`
        );
      }

      console.log(`   ✅ Folder deletion successful`);

      // Verify it's actually deleted
      const verifyResponse = await this.makeRequest(
        `${this.apiBase}/api/${this.userId}/folders`
      );

      if (verifyResponse.ok) {
        const folders = await verifyResponse.json();
        const stillExists = folders.find((f) => f.id === folder.id);
        if (stillExists) {
          throw new Error("Folder still exists after deletion!");
        }
        console.log(`   ✅ Folder successfully removed from database`);
      }
    }

    // Test notebook deletion
    if (this.testData.createdNotebooks.length > 0) {
      const notebook = this.testData.createdNotebooks[0];
      console.log(`   🗑️ Deleting notebook: ${notebook.name} (${notebook.id})`);

      const deleteResponse = await this.makeRequest(
        `${this.apiBase}/api/${this.userId}/notebooks/${notebook.id}`,
        { method: "DELETE" }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(
          `Notebook deletion failed: ${deleteResponse.status} - ${errorText}`
        );
      }

      console.log(`   ✅ Notebook deletion successful`);

      // Verify it's actually deleted
      const verifyResponse = await this.makeRequest(
        `${this.apiBase}/api/${this.userId}/notebooks`
      );

      if (verifyResponse.ok) {
        const notebooks = await verifyResponse.json();
        const stillExists = notebooks.find((n) => n.id === notebook.id);
        if (stillExists) {
          throw new Error("Notebook still exists after deletion!");
        }
        console.log(`   ✅ Notebook successfully removed from database`);
      }
    }

    // Test tag deletion
    if (this.testData.createdTags.length > 0) {
      const tag = this.testData.createdTags[0];
      console.log(`   🗑️ Deleting tag: ${tag.name} (${tag.id})`);

      const deleteResponse = await this.makeRequest(
        `${this.apiBase}/api/${this.userId}/tags/${tag.id}`,
        { method: "DELETE" }
      );

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        throw new Error(
          `Tag deletion failed: ${deleteResponse.status} - ${errorText}`
        );
      }

      console.log(`   ✅ Tag deletion successful`);
    }
  }

  async cleanupTestData() {
    console.log("\n5. 🧹 Cleaning up test data...");

    // Clean up any remaining test notes
    for (const note of this.testData.createdNotes) {
      try {
        await this.makeRequest(
          `${this.apiBase}/api/${this.userId}/notes/${note.id}`,
          { method: "DELETE" }
        );
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    console.log("   ✅ Test cleanup completed");
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

// Run tests if this script is executed directly
const test = new ListFunctionalityFixTest();
test.runTests().catch(console.error);
