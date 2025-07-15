#!/usr/bin/env node

/**
 * Comprehensive test to diagnose list functionality issues:
 * 1. Why notebook and folder delete functionality is not working
 * 2. Why note counts are missing for notebooks and folders
 * 3. Verify which functions are actually being called
 */

const API_BASE = process.env.API_BASE || "http://localhost:3004";
const TEST_USER_ID = process.env.TEST_USER_ID || "user-1";

class ListFunctionalityDiagnostics {
  constructor() {
    this.apiBase = API_BASE;
    this.userId = TEST_USER_ID;
    this.testData = {
      createdFolders: [],
      createdNotebooks: [],
      createdTags: [],
    };
  }

  async diagnose() {
    console.log("🔍 Starting List Functionality Diagnostics...\n");

    try {
      // Test 1: Verify backend connectivity
      await this.testBackendConnectivity();

      // Test 2: Create test data
      await this.createTestData();

      // Test 3: Test note counts
      await this.testNoteCounts();

      // Test 4: Test delete functionality
      await this.testDeleteFunctionality();

      // Test 5: Check API responses for counts
      await this.verifyApiResponses();

      console.log("\n✅ Diagnostics completed successfully!");
      await this.generateReport();
    } catch (error) {
      console.error("❌ Diagnostics failed:", error.message);
      process.exit(1);
    }
  }

  async testBackendConnectivity() {
    console.log("1. 🔌 Testing backend connectivity...");

    try {
      const response = await fetch(`${this.apiBase}/api/health`);
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }
      console.log("   ✅ Backend is responsive");
    } catch (error) {
      throw new Error(`Backend connectivity failed: ${error.message}`);
    }
  }

  async createTestData() {
    console.log("\n2. 📝 Creating test data...");

    // Create test folder
    try {
      const folderResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/folders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test Folder - Diagnosis",
            color: "#3b82f6",
          }),
        }
      );

      if (!folderResponse.ok) {
        throw new Error(`Failed to create folder: ${folderResponse.status}`);
      }

      const folder = await folderResponse.json();
      this.testData.createdFolders.push(folder);
      console.log(`   ✅ Created test folder: ${folder.name} (${folder.id})`);
    } catch (error) {
      console.log(`   ❌ Failed to create folder: ${error.message}`);
    }

    // Create test notebook
    try {
      const notebookResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/notebooks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test Notebook - Diagnosis",
            color: "#10b981",
          }),
        }
      );

      if (!notebookResponse.ok) {
        throw new Error(
          `Failed to create notebook: ${notebookResponse.status}`
        );
      }

      const notebook = await notebookResponse.json();
      this.testData.createdNotebooks.push(notebook);
      console.log(
        `   ✅ Created test notebook: ${notebook.name} (${notebook.id})`
      );
    } catch (error) {
      console.log(`   ❌ Failed to create notebook: ${error.message}`);
    }

    // Create test tag
    try {
      const tagResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "test-diagnosis-tag",
            color: "#f59e0b",
          }),
        }
      );

      if (!tagResponse.ok) {
        throw new Error(`Failed to create tag: ${tagResponse.status}`);
      }

      const tag = await tagResponse.json();
      this.testData.createdTags.push(tag);
      console.log(`   ✅ Created test tag: ${tag.name} (${tag.id})`);
    } catch (error) {
      console.log(`   ❌ Failed to create tag: ${error.message}`);
    }

    // Create test notes to verify counting
    if (
      this.testData.createdFolders.length > 0 &&
      this.testData.createdNotebooks.length > 0
    ) {
      try {
        const folder = this.testData.createdFolders[0];
        const notebook = this.testData.createdNotebooks[0];
        const tag = this.testData.createdTags[0];

        const noteResponse = await fetch(
          `${this.apiBase}/api/${this.userId}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "Test Note for Counting",
              content: "This note is used to test note counting functionality.",
              folder: folder.id,
              notebook: notebook.id,
              tags: tag ? [tag.id] : [],
            }),
          }
        );

        if (!noteResponse.ok) {
          throw new Error(`Failed to create note: ${noteResponse.status}`);
        }

        const note = await noteResponse.json();
        console.log(`   ✅ Created test note: ${note.title} (${note.id})`);
        console.log(`      📁 Assigned to folder: ${folder.name}`);
        console.log(`      📚 Assigned to notebook: ${notebook.name}`);
        if (tag) console.log(`      🏷️ Tagged with: ${tag.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to create note: ${error.message}`);
      }
    }
  }

  async testNoteCounts() {
    console.log("\n3. 🔢 Testing note counts...");

    // Test folder counts
    try {
      const foldersResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/folders`
      );
      if (!foldersResponse.ok) {
        throw new Error(`Failed to fetch folders: ${foldersResponse.status}`);
      }

      const folders = await foldersResponse.json();
      console.log(`   📁 Loaded ${folders.length} folders:`);

      folders.forEach((folder) => {
        console.log(
          `      - ${folder.name}: count = ${
            folder.noteCount || folder.count || "MISSING"
          }`
        );
      });

      const testFolder = folders.find((f) => f.name.includes("Test Folder"));
      if (testFolder) {
        const expectedCount = 1; // We created one note in this folder
        const actualCount = testFolder.noteCount || testFolder.count || 0;
        if (actualCount !== expectedCount) {
          console.log(
            `   ⚠️ Test folder count mismatch: expected ${expectedCount}, got ${actualCount}`
          );
        } else {
          console.log(`   ✅ Test folder count correct: ${actualCount}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to test folder counts: ${error.message}`);
    }

    // Test notebook counts
    try {
      const notebooksResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/notebooks`
      );
      if (!notebooksResponse.ok) {
        throw new Error(
          `Failed to fetch notebooks: ${notebooksResponse.status}`
        );
      }

      const notebooks = await notebooksResponse.json();
      console.log(`   📚 Loaded ${notebooks.length} notebooks:`);

      notebooks.forEach((notebook) => {
        console.log(
          `      - ${notebook.name}: count = ${
            notebook.noteCount || notebook.count || "MISSING"
          }`
        );
      });

      const testNotebook = notebooks.find((n) =>
        n.name.includes("Test Notebook")
      );
      if (testNotebook) {
        const expectedCount = 1; // We created one note in this notebook
        const actualCount = testNotebook.noteCount || testNotebook.count || 0;
        if (actualCount !== expectedCount) {
          console.log(
            `   ⚠️ Test notebook count mismatch: expected ${expectedCount}, got ${actualCount}`
          );
        } else {
          console.log(`   ✅ Test notebook count correct: ${actualCount}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to test notebook counts: ${error.message}`);
    }

    // Test tag counts
    try {
      const tagsResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/tags`
      );
      if (!tagsResponse.ok) {
        throw new Error(`Failed to fetch tags: ${tagsResponse.status}`);
      }

      const tags = await tagsResponse.json();
      console.log(`   🏷️ Loaded ${tags.length} tags:`);

      tags.forEach((tag) => {
        console.log(
          `      - ${tag.name}: count = ${
            tag.noteCount || tag.count || "MISSING"
          }`
        );
      });
    } catch (error) {
      console.log(`   ❌ Failed to test tag counts: ${error.message}`);
    }
  }

  async testDeleteFunctionality() {
    console.log("\n4. 🗑️ Testing delete functionality...");

    // Test folder deletion
    if (this.testData.createdFolders.length > 0) {
      try {
        const folder = this.testData.createdFolders[0];
        console.log(
          `   🗑️ Attempting to delete folder: ${folder.name} (${folder.id})`
        );

        const deleteResponse = await fetch(
          `${this.apiBase}/api/${this.userId}/folders/${folder.id}`,
          {
            method: "DELETE",
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.log(
            `   ❌ Folder deletion failed: ${deleteResponse.status} - ${errorText}`
          );
        } else {
          console.log(`   ✅ Folder deletion successful`);

          // Verify it's actually deleted
          const verifyResponse = await fetch(
            `${this.apiBase}/api/${this.userId}/folders`
          );
          if (verifyResponse.ok) {
            const folders = await verifyResponse.json();
            const stillExists = folders.find((f) => f.id === folder.id);
            if (stillExists) {
              console.log(`   ⚠️ Folder still exists after deletion!`);
            } else {
              console.log(`   ✅ Folder successfully removed from database`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Folder deletion test failed: ${error.message}`);
      }
    }

    // Test notebook deletion
    if (this.testData.createdNotebooks.length > 0) {
      try {
        const notebook = this.testData.createdNotebooks[0];
        console.log(
          `   🗑️ Attempting to delete notebook: ${notebook.name} (${notebook.id})`
        );

        const deleteResponse = await fetch(
          `${this.apiBase}/api/${this.userId}/notebooks/${notebook.id}`,
          {
            method: "DELETE",
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.log(
            `   ❌ Notebook deletion failed: ${deleteResponse.status} - ${errorText}`
          );
        } else {
          console.log(`   ✅ Notebook deletion successful`);

          // Verify it's actually deleted
          const verifyResponse = await fetch(
            `${this.apiBase}/api/${this.userId}/notebooks`
          );
          if (verifyResponse.ok) {
            const notebooks = await verifyResponse.json();
            const stillExists = notebooks.find((n) => n.id === notebook.id);
            if (stillExists) {
              console.log(`   ⚠️ Notebook still exists after deletion!`);
            } else {
              console.log(`   ✅ Notebook successfully removed from database`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Notebook deletion test failed: ${error.message}`);
      }
    }

    // Test tag deletion (this should work)
    if (this.testData.createdTags.length > 0) {
      try {
        const tag = this.testData.createdTags[0];
        console.log(`   🗑️ Attempting to delete tag: ${tag.name} (${tag.id})`);

        const deleteResponse = await fetch(
          `${this.apiBase}/api/${this.userId}/tags/${tag.id}`,
          {
            method: "DELETE",
          }
        );

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          console.log(
            `   ❌ Tag deletion failed: ${deleteResponse.status} - ${errorText}`
          );
        } else {
          console.log(`   ✅ Tag deletion successful`);
        }
      } catch (error) {
        console.log(`   ❌ Tag deletion test failed: ${error.message}`);
      }
    }
  }

  async verifyApiResponses() {
    console.log("\n5. 🔍 Verifying API response structures...");

    // Check what the frontend actually receives
    try {
      const [foldersRes, notebooksRes, tagsRes] = await Promise.all([
        fetch(`${this.apiBase}/api/${this.userId}/folders`),
        fetch(`${this.apiBase}/api/${this.userId}/notebooks`),
        fetch(`${this.apiBase}/api/${this.userId}/tags`),
      ]);

      if (foldersRes.ok) {
        const folders = await foldersRes.json();
        console.log("   📁 Folders API response structure:");
        if (folders.length > 0) {
          console.log("      Sample folder keys:", Object.keys(folders[0]));
          console.log(
            "      Sample folder:",
            JSON.stringify(folders[0], null, 6)
          );
        } else {
          console.log("      No folders found");
        }
      }

      if (notebooksRes.ok) {
        const notebooks = await notebooksRes.json();
        console.log("   📚 Notebooks API response structure:");
        if (notebooks.length > 0) {
          console.log("      Sample notebook keys:", Object.keys(notebooks[0]));
          console.log(
            "      Sample notebook:",
            JSON.stringify(notebooks[0], null, 6)
          );
        } else {
          console.log("      No notebooks found");
        }
      }

      if (tagsRes.ok) {
        const tags = await tagsRes.json();
        console.log("   🏷️ Tags API response structure:");
        if (tags.length > 0) {
          console.log("      Sample tag keys:", Object.keys(tags[0]));
          console.log("      Sample tag:", JSON.stringify(tags[0], null, 6));
        } else {
          console.log("      No tags found");
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to verify API responses: ${error.message}`);
    }
  }

  async generateReport() {
    console.log("\n📋 DIAGNOSTIC REPORT");
    console.log("==================");
    console.log("Based on the tests above, here are the key findings:");
    console.log();
    console.log("Issues Identified:");
    console.log("1. Check if notebook/folder delete endpoints exist and work");
    console.log(
      "2. Verify if note counts are being calculated and included in API responses"
    );
    console.log(
      "3. Examine if SimplifiedSidebar is using the correct count property names"
    );
    console.log();
    console.log("Recommended UI Library Alternatives:");
    console.log(
      "- React Complex Tree: https://rct.lukasbach.com/ (full-featured, zero deps)"
    );
    console.log(
      "- react-composable-treeview: Headless, accessible, fully customizable"
    );
    console.log("- rc-tree: Feature-rich with animations from ant-design team");
    console.log("- shadcn-ui-tree-view: Modern design system integration");
    console.log();
  }
}

// Run diagnostics if this script is executed directly
const diagnostics = new ListFunctionalityDiagnostics();
diagnostics.diagnose().catch(console.error);
