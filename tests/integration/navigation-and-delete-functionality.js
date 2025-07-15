#!/usr/bin/env node

/**
 * Integration Test: Navigation Buttons and Delete Functionality
 *
 * This test verifies:
 * 1. Navigation button endpoints work correctly
 * 2. Delete functionality for folders, notebooks, and tags
 * 3. UI components are properly connected to backend APIs
 *
 * Run with: node tests/integration/navigation-and-delete-functionality.js
 */

const fetch = require("node-fetch");

const API_BASE = process.env.API_BASE || "http://localhost:3004";
const FRONTEND_BASE = process.env.FRONTEND_BASE || "http://localhost:3001";
const TEST_USER_ID = process.env.TEST_USER_ID || "user-1";

class NavigationDeleteTest {
  constructor() {
    this.apiBase = API_BASE;
    this.frontendBase = FRONTEND_BASE;
    this.userId = TEST_USER_ID;
    this.testData = {
      folders: [],
      notebooks: [],
      tags: [],
    };
  }

  async runAllTests() {
    console.log("🧪 Navigation and Delete Functionality Integration Test");
    console.log("=" * 60);

    try {
      await this.testConnectivity();
      await this.testNavigationEndpoints();
      await this.createTestData();
      await this.testDeleteFunctionality();
      await this.cleanup();

      console.log("\n✅ All tests passed successfully!");
      return true;
    } catch (error) {
      console.error("\n❌ Test suite failed:", error.message);
      await this.cleanup();
      return false;
    }
  }

  async testConnectivity() {
    console.log("\n📡 Testing Connectivity...");

    // Test backend health
    const healthResponse = await fetch(`${this.apiBase}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Backend health check failed: ${healthResponse.status}`);
    }
    console.log("  ✅ Backend connection established");

    // Test frontend
    const frontendResponse = await fetch(this.frontendBase);
    if (!frontendResponse.ok) {
      throw new Error(`Frontend connection failed: ${frontendResponse.status}`);
    }
    console.log("  ✅ Frontend connection established");
  }

  async testNavigationEndpoints() {
    console.log("\n🧭 Testing Navigation Endpoints...");

    const endpoints = [
      { name: "All Notes", url: `${this.apiBase}/api/${this.userId}/notes` },
      {
        name: "Recent Notes",
        url: `${this.apiBase}/api/${this.userId}/notes?since=${new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString()}`,
      },
      {
        name: "Starred Notes",
        url: `${this.apiBase}/api/${this.userId}/notes?starred=true`,
      },
      {
        name: "Archived Notes",
        url: `${this.apiBase}/api/${this.userId}/notes?archived=true`,
      },
      {
        name: "Trash Notes",
        url: `${this.apiBase}/api/${this.userId}/notes?deleted=true`,
      },
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint.url);
      if (!response.ok) {
        throw new Error(`${endpoint.name} endpoint failed: ${response.status}`);
      }
      console.log(`  ✅ ${endpoint.name} endpoint working`);
    }
  }

  async createTestData() {
    console.log("\n📋 Creating Test Data...");

    // Create test folder
    const folderResponse = await fetch(
      `${this.apiBase}/api/${this.userId}/folders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Delete Folder",
          color: "#3b82f6",
        }),
      }
    );

    if (!folderResponse.ok) {
      throw new Error(`Failed to create test folder: ${folderResponse.status}`);
    }

    const testFolder = await folderResponse.json();
    this.testData.folders.push(testFolder);
    console.log(`  ✅ Created test folder: ${testFolder.name}`);

    // Create test notebook
    const notebookResponse = await fetch(
      `${this.apiBase}/api/${this.userId}/notebooks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Delete Notebook",
          color: "#10b981",
        }),
      }
    );

    if (!notebookResponse.ok) {
      throw new Error(
        `Failed to create test notebook: ${notebookResponse.status}`
      );
    }

    const testNotebook = await notebookResponse.json();
    this.testData.notebooks.push(testNotebook);
    console.log(`  ✅ Created test notebook: ${testNotebook.name}`);

    // Create test tag
    const tagResponse = await fetch(`${this.apiBase}/api/${this.userId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "test-delete-integration",
        color: "#f59e0b",
      }),
    });

    if (!tagResponse.ok) {
      throw new Error(`Failed to create test tag: ${tagResponse.status}`);
    }

    const testTag = await tagResponse.json();
    this.testData.tags.push(testTag);
    console.log(`  ✅ Created test tag: ${testTag.name}`);
  }

  async testDeleteFunctionality() {
    console.log("\n🗑️ Testing Delete Functionality...");

    // Test folder deletion
    for (const folder of this.testData.folders) {
      const deleteResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/folders/${folder.id}`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete folder ${folder.name}: ${deleteResponse.status}`
        );
      }
      console.log(`  ✅ Deleted folder: ${folder.name}`);
    }

    // Test notebook deletion
    for (const notebook of this.testData.notebooks) {
      const deleteResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/notebooks/${notebook.id}`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete notebook ${notebook.name}: ${deleteResponse.status}`
        );
      }
      console.log(`  ✅ Deleted notebook: ${notebook.name}`);
    }

    // Test tag deletion
    for (const tag of this.testData.tags) {
      const deleteResponse = await fetch(
        `${this.apiBase}/api/${this.userId}/tags/${tag.id}`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to delete tag ${tag.name}: ${deleteResponse.status}`
        );
      }
      console.log(`  ✅ Deleted tag: ${tag.name}`);
    }
  }

  async cleanup() {
    console.log("\n🧹 Cleaning up test data...");

    // Delete any remaining test data
    const cleanupTasks = [];

    // Clean folders
    for (const folder of this.testData.folders) {
      cleanupTasks.push(
        fetch(`${this.apiBase}/api/${this.userId}/folders/${folder.id}`, {
          method: "DELETE",
        }).catch(() => {}) // Ignore errors - may already be deleted
      );
    }

    // Clean notebooks
    for (const notebook of this.testData.notebooks) {
      cleanupTasks.push(
        fetch(`${this.apiBase}/api/${this.userId}/notebooks/${notebook.id}`, {
          method: "DELETE",
        }).catch(() => {}) // Ignore errors - may already be deleted
      );
    }

    // Clean tags
    for (const tag of this.testData.tags) {
      cleanupTasks.push(
        fetch(`${this.apiBase}/api/${this.userId}/tags/${tag.id}`, {
          method: "DELETE",
        }).catch(() => {}) // Ignore errors - may already be deleted
      );
    }

    await Promise.all(cleanupTasks);
    console.log("  ✅ Cleanup completed");
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new NavigationDeleteTest();
  test
    .runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("Test runner error:", error);
      process.exit(1);
    });
}

module.exports = NavigationDeleteTest;
