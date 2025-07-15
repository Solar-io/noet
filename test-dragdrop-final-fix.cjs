const puppeteer = require("puppeteer");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testDragDropFunctionality() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on("console", (msg) => {
    const text = msg.text();
    if (
      text.includes("🏗️") ||
      text.includes("📍") ||
      text.includes("📦") ||
      text.includes("🔄") ||
      text.includes("✅") ||
      text.includes("❌") ||
      text.includes("🚪") ||
      text.includes("🏷️") ||
      text.includes("📚") ||
      text.includes("📁")
    ) {
      console.log("Browser:", text);
    }
  });

  try {
    console.log("🚀 Starting drag and drop test...");

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

    // Test 1: Notebook reordering
    console.log("\n📚 Testing notebook reordering...");
    const notebooks = await page.$$('[draggable="true"]');
    const notebookElements = [];

    for (const element of notebooks) {
      const text = await element.evaluate((el) => el.textContent);
      if (!text.includes("Tag") && !text.includes("Folder")) {
        notebookElements.push(element);
      }
    }

    if (notebookElements.length >= 2) {
      const source = notebookElements[0];
      const target = notebookElements[1];

      const sourceBox = await source.boundingBox();
      const targetBox = await target.boundingBox();

      // Start drag
      await page.mouse.move(
        sourceBox.x + sourceBox.width / 2,
        sourceBox.y + sourceBox.height / 2
      );
      await page.mouse.down();

      // Move to target (drop after)
      await page.mouse.move(
        targetBox.x + targetBox.width / 2,
        targetBox.y + targetBox.height - 5
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Notebook drag and drop completed");
    }

    // Test 2: Folder reordering
    console.log("\n📁 Testing folder reordering...");
    await sleep(1000);

    const folderElements = await page.$$eval(
      '[draggable="true"]',
      (elements) => {
        return elements
          .filter((el) => el.textContent.includes("Folder"))
          .map((el) => ({
            text: el.textContent,
            rect: el.getBoundingClientRect(),
          }));
      }
    );

    if (folderElements.length >= 2) {
      const source = folderElements[0];
      const target = folderElements[1];

      // Start drag
      await page.mouse.move(
        source.rect.x + source.rect.width / 2,
        source.rect.y + source.rect.height / 2
      );
      await page.mouse.down();

      // Move to target (drop after)
      await page.mouse.move(
        target.rect.x + target.rect.width / 2,
        target.rect.y + target.rect.height - 5
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Folder drag and drop completed");
    }

    // Test 3: Tag reordering
    console.log("\n🏷️ Testing tag reordering...");
    await sleep(1000);

    const tagElements = await page.$$eval('[draggable="true"]', (elements) => {
      return elements
        .filter((el) => el.textContent.includes("Tag"))
        .map((el) => ({
          text: el.textContent,
          rect: el.getBoundingClientRect(),
        }));
    });

    if (tagElements.length >= 2) {
      const source = tagElements[0];
      const target = tagElements[1];

      // Start drag
      await page.mouse.move(
        source.rect.x + source.rect.width / 2,
        source.rect.y + source.rect.height / 2
      );
      await page.mouse.down();

      // Move to target (drop after)
      await page.mouse.move(
        target.rect.x + target.rect.width / 2,
        target.rect.y + target.rect.height - 5
      );
      await sleep(100);

      // Drop
      await page.mouse.up();
      await sleep(1000);

      console.log("✅ Tag drag and drop completed");
    }

    // Wait to see results
    console.log(
      "\n✅ All tests completed! Check console for drag/drop messages."
    );
    await sleep(5000);
  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDragDropFunctionality().catch(console.error);
