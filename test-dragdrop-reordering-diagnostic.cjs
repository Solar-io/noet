/**
 * Comprehensive Drag and Drop Reordering Diagnostic Test
 *
 * This test diagnoses why visual reordering isn't working despite successful backend operations
 */

const puppeteer = require("puppeteer");

async function testDragDropReordering() {
  console.log("🔍 Starting Drag and Drop Reordering Diagnostic Test");

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

    // Test 1: Check initial order of elements
    console.log("\n🔍 Test 1: Checking initial element order...");

    const initialOrder = await page.evaluate(() => {
      const getElementOrder = (selector, attribute) => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map((el, index) => ({
          index,
          text: el.textContent.trim().split("\n")[0],
          id: el.getAttribute(attribute) || "unknown",
          visible: el.offsetHeight > 0,
        }));
      };

      return {
        tags: getElementOrder(".tag-item", "data-tag-id"),
        notebooks: getElementOrder(".notebook-item", "data-notebook-id"),
        folders: getElementOrder(".folder-item", "data-folder-id"),
      };
    });

    console.log("📊 Initial Order:");
    console.log("Tags:", initialOrder.tags);
    console.log("Notebooks:", initialOrder.notebooks);
    console.log("Folders:", initialOrder.folders);

    // Test 2: Check backend data order
    console.log("\n🔍 Test 2: Checking backend data order...");

    const backendData = await page.evaluate(async () => {
      const fetchBackendData = async (endpoint) => {
        try {
          const response = await fetch(
            `http://localhost:3004/api/user-1/${endpoint}`
          );
          const data = await response.json();
          return data.map((item, index) => ({
            index,
            id: item.id,
            name: item.name,
            sortOrder: item.sortOrder,
          }));
        } catch (error) {
          return { error: error.message };
        }
      };

      return {
        tags: await fetchBackendData("tags"),
        notebooks: await fetchBackendData("notebooks"),
        folders: await fetchBackendData("folders"),
      };
    });

    console.log("📊 Backend Data Order:");
    console.log("Tags:", backendData.tags);
    console.log("Notebooks:", backendData.notebooks);
    console.log("Folders:", backendData.folders);

    // Test 3: Perform drag operation and check if order changes
    console.log("\n🔍 Test 3: Testing drag operation...");

    const tagElements = await page.$$('.tag-item[draggable="true"]');
    if (tagElements.length >= 2) {
      console.log(`📝 Found ${tagElements.length} draggable tags`);

      // Record order before drag
      const beforeDrag = await page.evaluate(() => {
        const elements = document.querySelectorAll(".tag-item");
        return Array.from(elements).map((el) => ({
          text: el.textContent.trim().split("\n")[0],
          id: el.getAttribute("data-tag-id"),
        }));
      });

      console.log("📊 Order before drag:", beforeDrag);

      // Perform drag operation
      const sourceTag = tagElements[0];
      const targetTag = tagElements[1];

      const sourceBounds = await sourceTag.boundingBox();
      const targetBounds = await targetTag.boundingBox();

      console.log("🎯 Dragging first tag to second tag position...");

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

      // Wait for potential updates
      await page.waitForTimeout(2000);

      // Record order after drag
      const afterDrag = await page.evaluate(() => {
        const elements = document.querySelectorAll(".tag-item");
        return Array.from(elements).map((el) => ({
          text: el.textContent.trim().split("\n")[0],
          id: el.getAttribute("data-tag-id"),
        }));
      });

      console.log("📊 Order after drag:", afterDrag);

      // Check if order actually changed
      const orderChanged =
        JSON.stringify(beforeDrag) !== JSON.stringify(afterDrag);
      console.log("🔄 Order changed:", orderChanged);

      // Check backend data after drag
      const backendAfterDrag = await page.evaluate(async () => {
        try {
          const response = await fetch("http://localhost:3004/api/user-1/tags");
          const data = await response.json();
          return data.map((item, index) => ({
            index,
            id: item.id,
            name: item.name,
            sortOrder: item.sortOrder,
          }));
        } catch (error) {
          return { error: error.message };
        }
      });

      console.log("📊 Backend data after drag:", backendAfterDrag);
    } else {
      console.log("⚠️ Not enough draggable tags found for drag test");
    }

    // Test 4: Check if React state is updating
    console.log("\n🔍 Test 4: Checking React state updates...");

    const reactState = await page.evaluate(() => {
      // Try to access React state through the DOM
      const appContainer = document.querySelector(".main-layout-container");
      if (appContainer && appContainer._reactInternalInstance) {
        // This is a rough way to check React state, may not work in all cases
        return "React state detected";
      }
      return "React state not accessible";
    });

    console.log("⚛️ React state:", reactState);

    // Test 5: Check console logs for any errors
    console.log("\n🔍 Test 5: Checking for console errors...");

    const consoleLogs = [];
    page.on("console", (msg) => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Wait a bit more to capture any delayed logs
    await page.waitForTimeout(1000);

    const errors = consoleLogs.filter((log) => log.type === "error");
    const warnings = consoleLogs.filter((log) => log.type === "warning");

    console.log("📊 Console errors:", errors.length);
    console.log("📊 Console warnings:", warnings.length);

    if (errors.length > 0) {
      console.log("❌ Errors found:");
      errors.forEach((error) => console.log(`  - ${error.text}`));
    }

    // Summary
    console.log("\n📋 DIAGNOSTIC SUMMARY:");
    console.log("======================");
    console.log(
      `✅ Initial elements found: Tags(${initialOrder.tags.length}), Notebooks(${initialOrder.notebooks.length}), Folders(${initialOrder.folders.length})`
    );
    console.log(
      `✅ Backend data accessible: ${backendData.tags.length ? "Yes" : "No"}`
    );
    console.log(
      `✅ Drag operation performed: ${tagElements.length >= 2 ? "Yes" : "No"}`
    );
    console.log(`✅ Console errors: ${errors.length}`);
  } catch (error) {
    console.error("❌ Diagnostic test failed:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testDragDropReordering().catch(console.error);
