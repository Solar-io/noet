const puppeteer = require("puppeteer");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSortableJSDragDrop() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on("console", (msg) => {
    console.log("Browser:", msg.text());
  });

  try {
    console.log("🚀 Starting SortableJS drag and drop test...");

    // Navigate to the app
    await page.goto("http://localhost:3001", { waitUntil: "networkidle2" });
    console.log("✅ Page loaded");

    // Login
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', "demo@example.com");
    await page.type('input[type="password"]', "demo123");
    await page.click('button[type="submit"]');
    console.log("✅ Logged in");

    // Wait for sidebar to load
    await page.waitForSelector(".flex-shrink-0.h-full.flex.flex-col.w-64", {
      timeout: 10000,
    });
    console.log("✅ Sidebar loaded");

    // Test 1: Folder reordering
    console.log("\n📁 Testing folder reordering with SortableJS...");
    await sleep(1000);

    const folderItems = await page.$$(".folder-item");
    if (folderItems.length >= 2) {
      const source = folderItems[0];
      const target = folderItems[1];

      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();

      // Drag from first folder to second
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await page.mouse.down();
      await sleep(100);

      // Move to second folder position
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height + 10
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Folder drag and drop completed");
    } else {
      console.log("⚠️ Not enough folders to test reordering");
    }

    // Test 2: Notebook reordering
    console.log("\n📚 Testing notebook reordering with SortableJS...");
    await sleep(1000);

    const notebookItems = await page.$$(".notebook-item");
    if (notebookItems.length >= 2) {
      const source = notebookItems[0];
      const target = notebookItems[1];

      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();

      // Drag from first notebook to second
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await page.mouse.down();
      await sleep(100);

      // Move to second notebook position
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height + 10
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Notebook drag and drop completed");
    } else {
      console.log("⚠️ Not enough notebooks to test reordering");
    }

    // Test 3: Tag reordering
    console.log("\n🏷️ Testing tag reordering with SortableJS...");
    await sleep(1000);

    const tagItems = await page.$$(".tag-item");
    if (tagItems.length >= 2) {
      const source = tagItems[0];
      const target = tagItems[1];

      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();

      // Drag from first tag to second
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await page.mouse.down();
      await sleep(100);

      // Move to second tag position
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height + 10
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Tag drag and drop completed");
    } else {
      console.log("⚠️ Not enough tags to test reordering");
    }

    // Wait to see results
    console.log("\n✅ All SortableJS tests completed!");
    await sleep(5000);
  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSortableJSDragDrop().catch(console.error);
