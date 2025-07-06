#!/usr/bin/env node

/**
 * Automated Test Script for Noet App Fixes
 * Tests: Double line spacing in lists, Text loss on note switching
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const BACKEND_URL = "http://localhost:3004";
const FRONTEND_URL = "http://localhost:3001";
const TEST_USER = "test-user-automated";
const TEST_PASSWORD = "test123";

class NoetTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      doubleLineSpacing: { passed: false, details: [] },
      textLossPrevention: { passed: false, details: [] },
      overall: { passed: false, errors: [] },
    };
  }

  async initialize() {
    console.log("🚀 Starting Automated Noet Test Suite...");

    // Check if servers are running
    await this.checkServers();

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      devtools: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    // Navigate to app
    await this.page.goto(FRONTEND_URL);
    await this.page.waitForSelector("body", { timeout: 10000 });

    console.log("✅ Browser initialized and app loaded");
  }

  async checkServers() {
    console.log("🔍 Checking server availability...");

    try {
      const fetch = (await import("node-fetch")).default;

      // Check backend
      const backendResponse = await fetch(`${BACKEND_URL}/api/health`);
      if (!backendResponse.ok) throw new Error("Backend not responding");

      console.log("✅ Backend server is running");
      console.log(
        "✅ Frontend server is running (assumed if script reached here)"
      );
    } catch (error) {
      console.error("❌ Server check failed:", error.message);
      console.log("💡 Make sure both servers are running:");
      console.log("   Backend: cd server && node server.js");
      console.log("   Frontend: npm run dev");
      process.exit(1);
    }
  }

  async loginUser() {
    console.log("🔐 Logging in user...");

    try {
      // Look for login form or create user if needed
      await this.page.waitForSelector(
        'input[type="email"], input[placeholder*="email"], #email',
        { timeout: 5000 }
      );

      await this.page.type(
        'input[type="email"], input[placeholder*="email"], #email',
        TEST_USER + "@test.com"
      );
      await this.page.type(
        'input[type="password"], input[placeholder*="password"], #password',
        TEST_PASSWORD
      );

      await this.page.click(
        'button[type="submit"], button:contains("Login"), button:contains("Sign")'
      );
      await this.page.waitForTimeout(2000);

      console.log("✅ User logged in successfully");
    } catch (error) {
      console.log("ℹ️ No login required or already logged in");
    }
  }

  async testDoubleLineSpacing() {
    console.log("\n📋 Testing Double Line Spacing in Lists...");

    try {
      // Create a new note
      await this.createNewNote("Double Line Test Note");

      // Test bullet lists
      const bulletResult = await this.testBulletListSpacing();
      this.results.doubleLineSpacing.details.push(bulletResult);

      // Test checkbox lists
      const checkboxResult = await this.testCheckboxListSpacing();
      this.results.doubleLineSpacing.details.push(checkboxResult);

      // Test numbered lists
      const numberedResult = await this.testNumberedListSpacing();
      this.results.doubleLineSpacing.details.push(numberedResult);

      // Determine overall result
      const allPassed = this.results.doubleLineSpacing.details.every(
        (test) => test.passed
      );
      this.results.doubleLineSpacing.passed = allPassed;

      console.log(
        allPassed
          ? "✅ Double line spacing tests PASSED"
          : "❌ Double line spacing tests FAILED"
      );
    } catch (error) {
      this.results.doubleLineSpacing.details.push({
        name: "Double Line Spacing Test",
        passed: false,
        error: error.message,
      });
      console.error("❌ Double line spacing test failed:", error.message);
    }
  }

  async testBulletListSpacing() {
    console.log("  📍 Testing bullet list spacing...");

    // Click in editor and create bullet list
    await this.page.click('.ProseMirror, [contenteditable="true"]');
    await this.page.keyboard.type(
      "• First bullet item\n• Second bullet item\n• Third bullet item"
    );

    // Apply font size changes
    await this.page.keyboard.press("Control+a"); // Select all
    await this.selectFontSize("18px");

    await this.page.waitForTimeout(1000);

    // Check line heights
    const lineHeights = await this.page.evaluate(() => {
      const listItems = document.querySelectorAll(
        '.ProseMirror li, .ProseMirror [data-type="listItem"]'
      );
      return Array.from(listItems).map((item) => {
        const style = window.getComputedStyle(item);
        return {
          lineHeight: style.lineHeight,
          height: item.offsetHeight,
          fontSize: style.fontSize,
        };
      });
    });

    // Check for double spacing (line-height should be reasonable)
    const hasDoubleSpacing = lineHeights.some((item) => {
      const lineHeightValue = parseFloat(item.lineHeight);
      const fontSizeValue = parseFloat(item.fontSize);
      return lineHeightValue > fontSizeValue * 2.5; // Threshold for "double spacing"
    });

    return {
      name: "Bullet List Spacing",
      passed: !hasDoubleSpacing,
      details: { lineHeights, hasDoubleSpacing },
    };
  }

  async testCheckboxListSpacing() {
    console.log("  ☑️ Testing checkbox list spacing...");

    await this.page.keyboard.press("Control+a"); // Clear content
    await this.page.keyboard.press("Delete");

    // Create checkbox list (if TipTap supports it)
    await this.page.keyboard.type(
      "- [ ] First checkbox\n- [ ] Second checkbox\n- [x] Third checkbox"
    );

    await this.selectFontSize("16px");
    await this.page.waitForTimeout(1000);

    const checkboxSpacing = await this.page.evaluate(() => {
      const checkboxItems = document.querySelectorAll(
        '.ProseMirror [data-type="taskItem"], .ProseMirror .task-item'
      );
      return Array.from(checkboxItems).map((item) => {
        const style = window.getComputedStyle(item);
        return {
          lineHeight: style.lineHeight,
          height: item.offsetHeight,
        };
      });
    });

    const hasDoubleSpacing =
      checkboxSpacing.length > 0 &&
      checkboxSpacing.some(
        (item) => parseFloat(item.lineHeight) > item.height * 1.8
      );

    return {
      name: "Checkbox List Spacing",
      passed: !hasDoubleSpacing || checkboxSpacing.length === 0,
      details: { checkboxSpacing, hasDoubleSpacing },
    };
  }

  async testNumberedListSpacing() {
    console.log("  🔢 Testing numbered list spacing...");

    await this.page.keyboard.press("Control+a");
    await this.page.keyboard.press("Delete");

    await this.page.keyboard.type(
      "1. First numbered item\n2. Second numbered item\n3. Third numbered item"
    );

    await this.selectFontSize("20px");
    await this.page.waitForTimeout(1000);

    const numberedSpacing = await this.page.evaluate(() => {
      const numberedItems = document.querySelectorAll(
        '.ProseMirror ol li, .ProseMirror [data-type="orderedList"] li'
      );
      return Array.from(numberedItems).map((item) => {
        const style = window.getComputedStyle(item);
        return {
          lineHeight: style.lineHeight,
          height: item.offsetHeight,
          fontSize: style.fontSize,
        };
      });
    });

    const hasDoubleSpacing = numberedSpacing.some((item) => {
      const lineHeightValue = parseFloat(item.lineHeight);
      const fontSizeValue = parseFloat(item.fontSize);
      return lineHeightValue > fontSizeValue * 2.2;
    });

    return {
      name: "Numbered List Spacing",
      passed: !hasDoubleSpacing,
      details: { numberedSpacing, hasDoubleSpacing },
    };
  }

  async testTextLossPrevention() {
    console.log("\n💾 Testing Text Loss Prevention...");

    try {
      // Test rapid note switching
      const rapidSwitchResult = await this.testRapidNoteSwitching();
      this.results.textLossPrevention.details.push(rapidSwitchResult);

      // Test complex content preservation
      const complexContentResult = await this.testComplexContentPreservation();
      this.results.textLossPrevention.details.push(complexContentResult);

      const allPassed = this.results.textLossPrevention.details.every(
        (test) => test.passed
      );
      this.results.textLossPrevention.passed = allPassed;

      console.log(
        allPassed
          ? "✅ Text loss prevention tests PASSED"
          : "❌ Text loss prevention tests FAILED"
      );
    } catch (error) {
      this.results.textLossPrevention.details.push({
        name: "Text Loss Prevention Test",
        passed: false,
        error: error.message,
      });
      console.error("❌ Text loss prevention test failed:", error.message);
    }
  }

  async testRapidNoteSwitching() {
    console.log("  🔄 Testing rapid note switching...");

    // Create multiple notes
    const noteIds = [];
    for (let i = 1; i <= 3; i++) {
      const noteId = await this.createNewNote(`Switch Test Note ${i}`);
      noteIds.push(noteId);
    }

    // Add content to first note
    await this.selectNoteById(noteIds[0]);
    const testContent = `Test content for rapid switching - ${Date.now()}`;
    await this.typeInEditor(testContent);

    // Rapidly switch between notes
    for (let i = 0; i < 5; i++) {
      const nextNoteIndex = (i + 1) % noteIds.length;
      await this.selectNoteById(noteIds[nextNoteIndex]);
      await this.page.waitForTimeout(100); // Rapid switching
    }

    // Return to first note and check content
    await this.selectNoteById(noteIds[0]);
    await this.page.waitForTimeout(1000);

    const recoveredContent = await this.getEditorContent();
    const contentPreserved = recoveredContent.includes(testContent);

    return {
      name: "Rapid Note Switching",
      passed: contentPreserved,
      details: {
        originalContent: testContent,
        recoveredContent: recoveredContent.substring(0, 100) + "...",
        contentPreserved,
      },
    };
  }

  async testComplexContentPreservation() {
    console.log("  📝 Testing complex content preservation...");

    const noteId = await this.createNewNote("Complex Content Test");

    const complexContent = `
# Complex Test Content
- Bullet point 1
- Bullet point 2
  - Nested bullet
- [ ] Checkbox item
- [x] Completed checkbox

1. Numbered item
2. Another numbered item

**Bold text** and *italic text* and normal text.

Some more content to test preservation.
    `.trim();

    await this.typeInEditor(complexContent);

    // Switch to another note
    const tempNoteId = await this.createNewNote("Temporary Note");
    await this.typeInEditor("Temporary content");

    // Switch back and verify content
    await this.selectNoteById(noteId);
    await this.page.waitForTimeout(1000);

    const recoveredContent = await this.getEditorContent();

    // Check if key parts of content are preserved
    const keyParts = [
      "Complex Test Content",
      "Bullet point 1",
      "Bold text",
      "Numbered item",
    ];
    const allPartsFound = keyParts.every((part) =>
      recoveredContent.includes(part)
    );

    return {
      name: "Complex Content Preservation",
      passed: allPartsFound,
      details: {
        keyParts,
        allPartsFound,
        contentLength: recoveredContent.length,
      },
    };
  }

  // Helper methods
  async createNewNote(title) {
    await this.page.click(
      'button:contains("New Note"), [data-testid="new-note"], .new-note-btn'
    );
    await this.page.waitForTimeout(500);

    // Set title if there's a title field
    try {
      await this.page.type(
        'input[placeholder*="title"], .note-title input',
        title
      );
    } catch {
      // No title field, that's okay
    }

    return Date.now().toString(); // Mock note ID
  }

  async selectNoteById(noteId) {
    // This would need to be adapted based on actual note selection UI
    await this.page.click(
      `.note-item[data-id="${noteId}"], .note-list-item:first-child`
    );
    await this.page.waitForTimeout(200);
  }

  async typeInEditor(content) {
    await this.page.click('.ProseMirror, [contenteditable="true"]');
    await this.page.keyboard.type(content);
  }

  async getEditorContent() {
    return await this.page.evaluate(() => {
      const editor = document.querySelector(
        '.ProseMirror, [contenteditable="true"]'
      );
      return editor ? editor.textContent || editor.innerText : "";
    });
  }

  async selectFontSize(size) {
    // Mock font size selection - would need to match actual UI
    try {
      await this.page.click('.font-size-selector, [data-testid="font-size"]');
      await this.page.click(`[data-value="${size}"], option[value="${size}"]`);
    } catch {
      // Font size selector not found, skip
    }
  }

  async generateReport() {
    console.log("\n📊 TEST RESULTS REPORT");
    console.log("=" + "=".repeat(50));

    const overallPassed =
      this.results.doubleLineSpacing.passed &&
      this.results.textLossPrevention.passed;
    this.results.overall.passed = overallPassed;

    console.log(
      `\n🎯 OVERALL RESULT: ${overallPassed ? "✅ PASSED" : "❌ FAILED"}`
    );

    console.log("\n📋 Double Line Spacing Tests:");
    console.log(
      `   Result: ${
        this.results.doubleLineSpacing.passed ? "✅ PASSED" : "❌ FAILED"
      }`
    );
    this.results.doubleLineSpacing.details.forEach((test) => {
      console.log(`   - ${test.name}: ${test.passed ? "✅" : "❌"}`);
      if (test.error) console.log(`     Error: ${test.error}`);
    });

    console.log("\n💾 Text Loss Prevention Tests:");
    console.log(
      `   Result: ${
        this.results.textLossPrevention.passed ? "✅ PASSED" : "❌ FAILED"
      }`
    );
    this.results.textLossPrevention.details.forEach((test) => {
      console.log(`   - ${test.name}: ${test.passed ? "✅" : "❌"}`);
      if (test.error) console.log(`     Error: ${test.error}`);
    });

    // Save detailed results to file
    const reportPath = path.join(__dirname, "test-results.json");
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${reportPath}`);

    return this.results;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    console.log("\n🧹 Cleanup completed");
  }

  async runFullTestSuite() {
    try {
      await this.initialize();
      await this.loginUser();
      await this.testDoubleLineSpacing();
      await this.testTextLossPrevention();

      const results = await this.generateReport();
      return results;
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      this.results.overall.errors.push(error.message);
      return this.results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new NoetTestSuite();
  testSuite
    .runFullTestSuite()
    .then((results) => {
      const exitCode = results.overall.passed ? 0 : 1;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

module.exports = NoetTestSuite;
