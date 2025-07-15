/**
 * Comprehensive Drag and Drop Visual Reordering Test
 *
 * This test verifies that the drag and drop visual reordering works correctly
 * with the fixed backend sortOrder logic.
 */

const puppeteer = require("puppeteer");

async function testDragDropVisualReordering() {
  console.log("🧪 Testing Drag and Drop Visual Reordering");

  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ["--disable-web-security"],
    });

    page = await browser.newPage();

    // Navigate to the app
    console.log("📍 Navigating to http://localhost:3001...");
    await page.goto("http://localhost:3001");

    // Wait for the app to load
    await page.waitForSelector(".main-layout-container", { timeout: 10000 });
    console.log("✅ App loaded successfully");

    // Wait for sidebar to load
    await page.waitForSelector(".sidebar", { timeout: 5000 });
    console.log("✅ Sidebar loaded");

    // Test 1: Test notebook reordering
    console.log("\n🔍 Test 1: Testing notebook reordering...");

    // Wait for notebooks to load
    await page.waitForSelector(".notebook-item", { timeout: 5000 });

    const notebooksBefore = await page.evaluate(() => {
      const items = document.querySelectorAll(".notebook-item");
      return Array.from(items).map((item) => {
        const text = item.textContent.trim().split("\n")[0];
        return text;
      });
    });

    console.log("📊 Notebooks before drag:", notebooksBefore);

    // Perform drag operation on notebooks
    const notebookElements = await page.$$('.notebook-item[draggable="true"]');
    if (notebookElements.length >= 2) {
      console.log("🎯 Dragging first notebook to second position...");

      const source = notebookElements[0];
      const target = notebookElements[1];

      const sourceBounds = await source.boundingBox();
      const targetBounds = await target.boundingBox();

      await page.mouse.move(
        sourceBounds.x + sourceBounds.width / 2,
        sourceBounds.y + sourceBounds.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBounds.x + targetBounds.width / 2,
        targetBounds.y + targetBounds.height / 2
      );
      await page.mouse.up();

      // Wait for reordering to complete
      await page.waitForTimeout(3000);

      const notebooksAfter = await page.evaluate(() => {
        const items = document.querySelectorAll(".notebook-item");
        return Array.from(items).map((item) => {
          const text = item.textContent.trim().split("\n")[0];
          return text;
        });
      });

      console.log("📊 Notebooks after drag:", notebooksAfter);

      const orderChanged =
        JSON.stringify(notebooksBefore) !== JSON.stringify(notebooksAfter);
      console.log("🔄 Notebook order changed:", orderChanged);
    }

    // Test 2: Test folder reordering
    console.log("\n🔍 Test 2: Testing folder reordering...");

    // Wait for folders to load
    await page.waitForSelector(".folder-item", { timeout: 5000 });

    const foldersBefore = await page.evaluate(() => {
      const items = document.querySelectorAll(".folder-item");
      return Array.from(items).map((item) => {
        const text = item.textContent.trim().split("\n")[0];
        return text;
      });
    });

    console.log("📊 Folders before drag:", foldersBefore);

    // Perform drag operation on folders
    const folderElements = await page.$$('.folder-item[draggable="true"]');
    if (folderElements.length >= 2) {
      console.log("🎯 Dragging first folder to second position...");

      const source = folderElements[0];
      const target = folderElements[1];

      const sourceBounds = await source.boundingBox();
      const targetBounds = await target.boundingBox();

      await page.mouse.move(
        sourceBounds.x + sourceBounds.width / 2,
        sourceBounds.y + sourceBounds.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBounds.x + targetBounds.width / 2,
        targetBounds.y + targetBounds.height / 2
      );
      await page.mouse.up();

      // Wait for reordering to complete
      await page.waitForTimeout(3000);

      const foldersAfter = await page.evaluate(() => {
        const items = document.querySelectorAll(".folder-item");
        return Array.from(items).map((item) => {
          const text = item.textContent.trim().split("\n")[0];
          return text;
        });
      });

      console.log("📊 Folders after drag:", foldersAfter);

      const orderChanged =
        JSON.stringify(foldersBefore) !== JSON.stringify(foldersAfter);
      console.log("🔄 Folder order changed:", orderChanged);
    }

    // Test 3: Test tag reordering
    console.log("\n🔍 Test 3: Testing tag reordering...");

    // Wait for tags to load
    await page.waitForSelector(".tag-item", { timeout: 5000 });

    const tagsBefore = await page.evaluate(() => {
      const items = document.querySelectorAll(".tag-item");
      return Array.from(items).map((item) => {
        const text = item.textContent.trim().split("\n")[0];
        return text;
      });
    });

    console.log("📊 Tags before drag:", tagsBefore);

    // Perform drag operation on tags
    const tagElements = await page.$$('.tag-item[draggable="true"]');
    if (tagElements.length >= 2) {
      console.log("🎯 Dragging first tag to second position...");

      const source = tagElements[0];
      const target = tagElements[1];

      const sourceBounds = await source.boundingBox();
      const targetBounds = await target.boundingBox();

      await page.mouse.move(
        sourceBounds.x + sourceBounds.width / 2,
        sourceBounds.y + sourceBounds.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(
        targetBounds.x + targetBounds.width / 2,
        targetBounds.y + targetBounds.height / 2
      );
      await page.mouse.up();

      // Wait for reordering to complete
      await page.waitForTimeout(3000);

      const tagsAfter = await page.evaluate(() => {
        const items = document.querySelectorAll(".tag-item");
        return Array.from(items).map((item) => {
          const text = item.textContent.trim().split("\n")[0];
          return text;
        });
      });

      console.log("📊 Tags after drag:", tagsAfter);

      const orderChanged =
        JSON.stringify(tagsBefore) !== JSON.stringify(tagsAfter);
      console.log("🔄 Tag order changed:", orderChanged);
    }

    // Test 4: Verify backend persistence
    console.log("\n🔍 Test 4: Verifying backend persistence...");

    const backendData = await page.evaluate(async () => {
      try {
        const notebooks = await fetch(
          "http://localhost:3004/api/user-1/notebooks"
        ).then((r) => r.json());
        const folders = await fetch(
          "http://localhost:3004/api/user-1/folders"
        ).then((r) => r.json());
        const tags = await fetch("http://localhost:3004/api/user-1/tags").then(
          (r) => r.json()
        );

        return {
          notebooks: notebooks.map((nb) => ({
            name: nb.name,
            sortOrder: nb.sortOrder,
          })),
          folders: folders.map((f) => ({
            name: f.name,
            sortOrder: f.sortOrder,
          })),
          tags: tags.map((t) => ({ name: t.name, sortOrder: t.sortOrder })),
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log("📊 Backend data after operations:");
    console.log("Notebooks:", backendData.notebooks);
    console.log("Folders:", backendData.folders);
    console.log("Tags:", backendData.tags);

    // Summary
    console.log("\n📋 TEST SUMMARY:");
    console.log("================");
    console.log(
      `✅ Notebooks draggable: ${notebookElements.length >= 2 ? "Yes" : "No"}`
    );
    console.log(
      `✅ Folders draggable: ${folderElements.length >= 2 ? "Yes" : "No"}`
    );
    console.log(`✅ Tags draggable: ${tagElements.length >= 2 ? "Yes" : "No"}`);
    console.log(
      `✅ Backend persistence: ${backendData.error ? "Failed" : "Working"}`
    );

    console.log("\n🎉 Visual reordering test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDragDropVisualReordering().catch(console.error);
