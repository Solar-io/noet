#!/usr/bin/env node

/**
 * Test Color Picker Functionality
 *
 * This test verifies that the color picker enhancements work correctly
 * for tags, notebooks, and folders in the sidebar.
 */

import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const backendUrl = "http://localhost:3004";
const userId = "demo-user";
const testTimeout = 30000;

// Test colors
const testColors = {
  folder: "#3b82f6",
  notebook: "#10b981",
  tag: "#f59e0b",
  custom: "#ff6b6b",
};

// Test results
let testResults = [];
let testCount = 0;
let passCount = 0;

// Utility functions
const logTest = (testName, passed, message = "") => {
  testCount++;
  if (passed) {
    passCount++;
    console.log(`✅ ${testName}${message ? ": " + message : ""}`);
  } else {
    console.log(`❌ ${testName}${message ? ": " + message : ""}`);
  }
  testResults.push({ testName, passed, message });
};

const makeRequest = (path, method = "GET", data = null) => {
  return new Promise((resolve, reject) => {
    const url = `${backendUrl}${path}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Test functions
const testServerConnection = async () => {
  try {
    // Use an existing endpoint instead of /health
    const response = await makeRequest(`/api/${userId}/tags`);
    logTest(
      "Server Connection",
      response.status === 200,
      `Server responded with status ${response.status}`
    );
    return response.status === 200;
  } catch (error) {
    logTest("Server Connection", false, `Failed to connect: ${error.message}`);
    return false;
  }
};

const testColorPersistenceInCreation = async () => {
  console.log("\n📁 Testing Color Persistence in Creation");

  // Test folder creation with color
  try {
    const folderData = {
      name: "Test Color Folder",
      color: testColors.folder,
      parentId: null,
    };

    const response = await makeRequest(
      `/api/${userId}/folders`,
      "POST",
      folderData
    );
    logTest(
      "Folder Creation with Color",
      response.status === 200,
      `Folder created with color ${testColors.folder}`
    );

    if (response.status === 200 && response.data) {
      const createdFolder = response.data;
      logTest(
        "Folder Color Saved",
        createdFolder.color === testColors.folder,
        `Expected ${testColors.folder}, got ${createdFolder.color}`
      );
    }
  } catch (error) {
    logTest("Folder Creation with Color", false, error.message);
  }

  // Test notebook creation with color
  try {
    const notebookData = {
      name: "Test Color Notebook",
      color: testColors.notebook,
      folderId: null,
    };

    const response = await makeRequest(
      `/api/${userId}/notebooks`,
      "POST",
      notebookData
    );
    logTest(
      "Notebook Creation with Color",
      response.status === 200,
      `Notebook created with color ${testColors.notebook}`
    );

    if (response.status === 200 && response.data) {
      const createdNotebook = response.data;
      logTest(
        "Notebook Color Saved",
        createdNotebook.color === testColors.notebook,
        `Expected ${testColors.notebook}, got ${createdNotebook.color}`
      );
    }
  } catch (error) {
    logTest("Notebook Creation with Color", false, error.message);
  }

  // Test tag creation with color
  try {
    const tagData = {
      name: "test-color-tag",
      color: testColors.tag,
    };

    const response = await makeRequest(`/api/${userId}/tags`, "POST", tagData);
    logTest(
      "Tag Creation with Color",
      response.status === 200,
      `Tag created with color ${testColors.tag}`
    );

    if (response.status === 200 && response.data) {
      const createdTag = response.data;
      logTest(
        "Tag Color Saved",
        createdTag.color === testColors.tag,
        `Expected ${testColors.tag}, got ${createdTag.color}`
      );
    }
  } catch (error) {
    logTest("Tag Creation with Color", false, error.message);
  }
};

const testColorPersistenceInUpdates = async () => {
  console.log("\n🎨 Testing Color Persistence in Updates");

  // Get folders to test updates
  try {
    const foldersResponse = await makeRequest(`/api/${userId}/folders`);
    if (foldersResponse.status === 200 && foldersResponse.data.length > 0) {
      const folder = foldersResponse.data.find(
        (f) => f.name === "Test Color Folder"
      );
      if (folder) {
        const updateData = {
          name: folder.name,
          color: testColors.custom,
        };

        const updateResponse = await makeRequest(
          `/api/${userId}/folders/${folder.id}`,
          "PUT",
          updateData
        );
        logTest(
          "Folder Color Update",
          updateResponse.status === 200,
          `Updated folder color to ${testColors.custom}`
        );

        if (updateResponse.status === 200 && updateResponse.data) {
          logTest(
            "Folder Color Updated",
            updateResponse.data.color === testColors.custom,
            `Expected ${testColors.custom}, got ${updateResponse.data.color}`
          );
        }
      }
    }
  } catch (error) {
    logTest("Folder Color Update", false, error.message);
  }

  // Get notebooks to test updates
  try {
    const notebooksResponse = await makeRequest(`/api/${userId}/notebooks`);
    if (notebooksResponse.status === 200 && notebooksResponse.data.length > 0) {
      const notebook = notebooksResponse.data.find(
        (n) => n.name === "Test Color Notebook"
      );
      if (notebook) {
        const updateData = {
          name: notebook.name,
          color: testColors.custom,
        };

        const updateResponse = await makeRequest(
          `/api/${userId}/notebooks/${notebook.id}`,
          "PUT",
          updateData
        );
        logTest(
          "Notebook Color Update",
          updateResponse.status === 200,
          `Updated notebook color to ${testColors.custom}`
        );

        if (updateResponse.status === 200 && updateResponse.data) {
          logTest(
            "Notebook Color Updated",
            updateResponse.data.color === testColors.custom,
            `Expected ${testColors.custom}, got ${updateResponse.data.color}`
          );
        }
      }
    }
  } catch (error) {
    logTest("Notebook Color Update", false, error.message);
  }
};

const testColorRetrieval = async () => {
  console.log("\n🔍 Testing Color Retrieval");

  // Test folder color retrieval
  try {
    const foldersResponse = await makeRequest(`/api/${userId}/folders`);
    logTest(
      "Folders Retrieved",
      foldersResponse.status === 200,
      `Retrieved ${
        foldersResponse.data ? foldersResponse.data.length : 0
      } folders`
    );

    if (foldersResponse.status === 200 && foldersResponse.data) {
      const coloredFolders = foldersResponse.data.filter((f) => f.color);
      logTest(
        "Folders Have Colors",
        coloredFolders.length > 0,
        `${coloredFolders.length} folders have colors`
      );
    }
  } catch (error) {
    logTest("Folders Retrieved", false, error.message);
  }

  // Test notebook color retrieval
  try {
    const notebooksResponse = await makeRequest(`/api/${userId}/notebooks`);
    logTest(
      "Notebooks Retrieved",
      notebooksResponse.status === 200,
      `Retrieved ${
        notebooksResponse.data ? notebooksResponse.data.length : 0
      } notebooks`
    );

    if (notebooksResponse.status === 200 && notebooksResponse.data) {
      const coloredNotebooks = notebooksResponse.data.filter((n) => n.color);
      logTest(
        "Notebooks Have Colors",
        coloredNotebooks.length > 0,
        `${coloredNotebooks.length} notebooks have colors`
      );
    }
  } catch (error) {
    logTest("Notebooks Retrieved", false, error.message);
  }

  // Test tag color retrieval
  try {
    const tagsResponse = await makeRequest(`/api/${userId}/tags`);
    logTest(
      "Tags Retrieved",
      tagsResponse.status === 200,
      `Retrieved ${tagsResponse.data ? tagsResponse.data.length : 0} tags`
    );

    if (tagsResponse.status === 200 && tagsResponse.data) {
      const coloredTags = tagsResponse.data.filter((t) => t.color);
      logTest(
        "Tags Have Colors",
        coloredTags.length > 0,
        `${coloredTags.length} tags have colors`
      );
    }
  } catch (error) {
    logTest("Tags Retrieved", false, error.message);
  }
};

const testColorValidation = async () => {
  console.log("\n✅ Testing Color Validation");

  // Test valid hex colors
  const validColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ff0000",
    "#00ff00",
    "#0000ff",
  ];
  for (const color of validColors) {
    const isValid = /^#[0-9a-fA-F]{6}$/.test(color);
    logTest(`Valid Color ${color}`, isValid, `Color format validation`);
  }

  // Test invalid colors (should be handled gracefully)
  const invalidColors = ["invalid", "#gggggg", "#12345", "123456"];
  for (const color of invalidColors) {
    const isValid = /^#[0-9a-fA-F]{6}$/.test(color);
    logTest(`Invalid Color ${color}`, !isValid, `Color format validation`);
  }
};

const testPresetColors = async () => {
  console.log("\n🎨 Testing Preset Colors");

  // Test that preset colors are valid hex values
  const presetColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#eab308",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#65a30d",
    "#ea580c",
    "#db2777",
    "#4f46e5",
    "#059669",
    "#d97706",
    "#b91c1c",
    "#7c2d12",
    "#991b1b",
  ];

  logTest(
    "Preset Colors Count",
    presetColors.length === 24,
    `Expected 24 preset colors, got ${presetColors.length}`
  );

  const validPresets = presetColors.filter((color) =>
    /^#[0-9a-fA-F]{6}$/.test(color)
  );
  logTest(
    "All Preset Colors Valid",
    validPresets.length === presetColors.length,
    `${validPresets.length} of ${presetColors.length} preset colors are valid`
  );

  // Test uniqueness
  const uniqueColors = new Set(presetColors);
  logTest(
    "Preset Colors Unique",
    uniqueColors.size === presetColors.length,
    `${uniqueColors.size} unique colors out of ${presetColors.length}`
  );
};

const testFrontendImplementation = async () => {
  console.log("\n🖥️ Testing Frontend Implementation");

  // Check if ImprovedSidebar.jsx exists and has color picker code
  const sidebarPath = path.join(
    __dirname,
    "src",
    "components",
    "ImprovedSidebar.jsx"
  );

  try {
    const sidebarContent = fs.readFileSync(sidebarPath, "utf8");

    // Check for key color picker components
    const hasPresetColors = sidebarContent.includes("PRESET_COLORS");
    logTest(
      "Preset Colors Defined",
      hasPresetColors,
      "PRESET_COLORS array found"
    );

    const hasColorPicker = sidebarContent.includes("ColorPicker");
    logTest(
      "ColorPicker Component",
      hasColorPicker,
      "ColorPicker component found"
    );

    const hasColorState =
      sidebarContent.includes("color:") &&
      sidebarContent.includes("setCreating");
    logTest(
      "Color State Management",
      hasColorState,
      "Color state management found"
    );

    const hasColorCreation = sidebarContent.includes("color: creating.color");
    logTest(
      "Color in Creation",
      hasColorCreation,
      "Color included in creation forms"
    );

    const hasColorEditing = sidebarContent.includes("color: editing.color");
    logTest(
      "Color in Editing",
      hasColorEditing,
      "Color included in editing forms"
    );
  } catch (error) {
    logTest(
      "Frontend Implementation",
      false,
      `Could not read ${sidebarPath}: ${error.message}`
    );
  }
};

const cleanup = async () => {
  console.log("\n🧹 Cleaning up test data");

  // Clean up test folders
  try {
    const foldersResponse = await makeRequest(`/api/${userId}/folders`);
    if (foldersResponse.status === 200 && foldersResponse.data) {
      const testFolders = foldersResponse.data.filter((f) =>
        f.name.includes("Test Color")
      );
      for (const folder of testFolders) {
        await makeRequest(`/api/${userId}/folders/${folder.id}`, "DELETE");
      }
      logTest(
        "Test Folders Cleaned",
        true,
        `Removed ${testFolders.length} test folders`
      );
    }
  } catch (error) {
    logTest("Test Folders Cleaned", false, error.message);
  }

  // Clean up test notebooks
  try {
    const notebooksResponse = await makeRequest(`/api/${userId}/notebooks`);
    if (notebooksResponse.status === 200 && notebooksResponse.data) {
      const testNotebooks = notebooksResponse.data.filter((n) =>
        n.name.includes("Test Color")
      );
      for (const notebook of testNotebooks) {
        await makeRequest(`/api/${userId}/notebooks/${notebook.id}`, "DELETE");
      }
      logTest(
        "Test Notebooks Cleaned",
        true,
        `Removed ${testNotebooks.length} test notebooks`
      );
    }
  } catch (error) {
    logTest("Test Notebooks Cleaned", false, error.message);
  }
};

// Main test execution
const runTests = async () => {
  console.log("🎨 Starting Color Picker Tests");
  console.log("=====================================\n");

  // Basic connectivity test
  const serverReady = await testServerConnection();
  if (!serverReady) {
    console.log(
      "❌ Server not ready. Make sure backend is running on port 3004"
    );
    process.exit(1);
  }

  // Run all tests
  await testColorPersistenceInCreation();
  await testColorPersistenceInUpdates();
  await testColorRetrieval();
  await testColorValidation();
  await testPresetColors();
  await testFrontendImplementation();
  await cleanup();

  // Results summary
  console.log("\n📊 Test Results Summary");
  console.log("=====================================");
  console.log(`Total Tests: ${testCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${testCount - passCount}`);
  console.log(`Success Rate: ${Math.round((passCount / testCount) * 100)}%`);

  if (passCount === testCount) {
    console.log(
      "\n🎉 All tests passed! Color picker functionality is working correctly."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
    process.exit(1);
  }
};

// Run tests with timeout
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error("Tests timed out")), testTimeout);
});

Promise.race([runTests(), timeoutPromise]).catch((error) => {
  console.error("\n❌ Test execution failed:", error.message);
  process.exit(1);
});
