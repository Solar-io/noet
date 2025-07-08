import { jest } from "@jest/globals";
import puppeteer from "puppeteer";
import { isolateTest } from "../helpers/test-utils.js";

describe("Critical User Paths E2E Tests", () => {
  let browser;
  let page;

  const TEST_URL = process.env.TEST_URL || "http://localhost:3000";

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    global.cleanupTestData();
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
    jest.clearAllMocks();
  });

  describe("User Authentication Flow", () => {
    test(
      "should complete full login/logout cycle",
      isolateTest(async ({ registerCleanup }) => {
        await page.goto(TEST_URL);

        // Should show login form
        await page.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });

        // Fill login form
        await page.type('[data-testid="username-input"]', "testuser");
        await page.type('[data-testid="password-input"]', "testpassword");

        // Submit login
        await page.click('[data-testid="login-button"]');

        // Should navigate to main app
        await page.waitForSelector('[data-testid="main-app"]', {
          timeout: 5000,
        });

        // Should show user info
        const userInfo = await page.textContent('[data-testid="user-info"]');
        expect(userInfo).toContain("testuser");

        // Logout
        await page.click('[data-testid="logout-button"]');

        // Should return to login form
        await page.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });
      })
    );

    test(
      "should handle invalid credentials",
      isolateTest(async ({ registerCleanup }) => {
        await page.goto(TEST_URL);

        // Wait for login form
        await page.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });

        // Fill invalid credentials
        await page.type('[data-testid="username-input"]', "invaliduser");
        await page.type('[data-testid="password-input"]', "wrongpassword");

        // Submit login
        await page.click('[data-testid="login-button"]');

        // Should show error message
        await page.waitForSelector('[data-testid="error-message"]', {
          timeout: 5000,
        });
        const errorText = await page.textContent(
          '[data-testid="error-message"]'
        );
        expect(errorText).toContain("Invalid credentials");

        // Should remain on login page
        expect(await page.isVisible('[data-testid="login-form"]')).toBe(true);
      })
    );

    test(
      "should handle session timeout",
      isolateTest(async ({ registerCleanup }) => {
        await page.goto(TEST_URL);

        // Login successfully
        await page.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });
        await page.type('[data-testid="username-input"]', "testuser");
        await page.type('[data-testid="password-input"]', "testpassword");
        await page.click('[data-testid="login-button"]');

        // Wait for main app
        await page.waitForSelector('[data-testid="main-app"]', {
          timeout: 5000,
        });

        // Simulate session timeout by clearing cookies
        await page.evaluate(() => {
          document.cookie.split(";").forEach(function (c) {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(
                /=.*/,
                "=;expires=" + new Date().toUTCString() + ";path=/"
              );
          });
        });

        // Try to perform an action that requires authentication
        await page.click('[data-testid="create-note-button"]');

        // Should redirect to login
        await page.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });

        // Should show session expired message
        const message = await page.textContent(
          '[data-testid="session-message"]'
        );
        expect(message).toContain("Session expired");
      })
    );
  });

  describe("Note Creation and Editing", () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(TEST_URL);
      await page.waitForSelector('[data-testid="login-form"]', {
        timeout: 5000,
      });
      await page.type('[data-testid="username-input"]', "testuser");
      await page.type('[data-testid="password-input"]', "testpassword");
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="main-app"]', { timeout: 5000 });
    });

    test(
      "should create and save a new note",
      isolateTest(async ({ registerCleanup }) => {
        // Click create note button
        await page.click('[data-testid="create-note-button"]');

        // Should open note editor
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Enter note content
        await page.type('[data-testid="note-title-input"]', "Test Note Title");
        await page.type(
          '[data-testid="note-content-editor"]',
          "This is test note content"
        );

        // Save note
        await page.click('[data-testid="save-note-button"]');

        // Should show success message
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Should appear in notes list
        await page.waitForSelector('[data-testid="notes-list"]', {
          timeout: 5000,
        });
        const notesList = await page.$$('[data-testid="note-item"]');
        expect(notesList.length).toBeGreaterThan(0);

        // Should show correct title
        const firstNote = await page.textContent(
          '[data-testid="note-item"]:first-child [data-testid="note-title"]'
        );
        expect(firstNote).toBe("Test Note Title");
      })
    );

    test(
      "should edit existing note",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note first
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });
        await page.type('[data-testid="note-title-input"]', "Original Title");
        await page.type(
          '[data-testid="note-content-editor"]',
          "Original content"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Go back to notes list
        await page.click('[data-testid="back-to-notes-button"]');
        await page.waitForSelector('[data-testid="notes-list"]', {
          timeout: 5000,
        });

        // Edit the note
        await page.click('[data-testid="note-item"]:first-child');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Modify content
        await page.fill('[data-testid="note-title-input"]', "Updated Title");
        await page.fill(
          '[data-testid="note-content-editor"]',
          "Updated content"
        );

        // Save changes
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Verify changes
        await page.click('[data-testid="back-to-notes-button"]');
        await page.waitForSelector('[data-testid="notes-list"]', {
          timeout: 5000,
        });

        const updatedTitle = await page.textContent(
          '[data-testid="note-item"]:first-child [data-testid="note-title"]'
        );
        expect(updatedTitle).toBe("Updated Title");
      })
    );

    test(
      "should handle auto-save functionality",
      isolateTest(async ({ registerCleanup }) => {
        // Create new note
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Type content
        await page.type('[data-testid="note-title-input"]', "Auto-save Test");
        await page.type(
          '[data-testid="note-content-editor"]',
          "This content should auto-save"
        );

        // Wait for auto-save indicator
        await page.waitForSelector('[data-testid="auto-save-indicator"]', {
          timeout: 10000,
        });

        // Should show "Saved" status
        const saveStatus = await page.textContent(
          '[data-testid="save-status"]'
        );
        expect(saveStatus).toContain("Saved");

        // Navigate away and back
        await page.click('[data-testid="back-to-notes-button"]');
        await page.waitForSelector('[data-testid="notes-list"]', {
          timeout: 5000,
        });
        await page.click('[data-testid="note-item"]:first-child');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Content should be preserved
        const title = await page.inputValue('[data-testid="note-title-input"]');
        const content = await page.inputValue(
          '[data-testid="note-content-editor"]'
        );

        expect(title).toBe("Auto-save Test");
        expect(content).toBe("This content should auto-save");
      })
    );
  });

  describe("Tag Management", () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(TEST_URL);
      await page.waitForSelector('[data-testid="login-form"]', {
        timeout: 5000,
      });
      await page.type('[data-testid="username-input"]', "testuser");
      await page.type('[data-testid="password-input"]', "testpassword");
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="main-app"]', { timeout: 5000 });
    });

    test(
      "should create and assign tags to notes",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });
        await page.type('[data-testid="note-title-input"]', "Note with Tags");
        await page.type(
          '[data-testid="note-content-editor"]',
          "This note will have tags"
        );

        // Add tags
        await page.click('[data-testid="add-tag-button"]');
        await page.waitForSelector('[data-testid="tag-input"]', {
          timeout: 5000,
        });
        await page.type('[data-testid="tag-input"]', "work");
        await page.press('[data-testid="tag-input"]', "Enter");

        await page.type('[data-testid="tag-input"]', "important");
        await page.press('[data-testid="tag-input"]', "Enter");

        // Should show tags
        await page.waitForSelector('[data-testid="tag-work"]', {
          timeout: 5000,
        });
        await page.waitForSelector('[data-testid="tag-important"]', {
          timeout: 5000,
        });

        // Save note
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Go back to notes list
        await page.click('[data-testid="back-to-notes-button"]');
        await page.waitForSelector('[data-testid="notes-list"]', {
          timeout: 5000,
        });

        // Should show tags on note item
        const tags = await page.$$(
          '[data-testid="note-item"]:first-child [data-testid^="tag-"]'
        );
        expect(tags.length).toBe(2);
      })
    );

    test(
      "should filter notes by tags",
      isolateTest(async ({ registerCleanup }) => {
        // Create multiple notes with different tags
        const notes = [
          { title: "Work Note", content: "Work content", tags: ["work"] },
          {
            title: "Personal Note",
            content: "Personal content",
            tags: ["personal"],
          },
          {
            title: "Mixed Note",
            content: "Mixed content",
            tags: ["work", "personal"],
          },
        ];

        for (const note of notes) {
          await page.click('[data-testid="create-note-button"]');
          await page.waitForSelector('[data-testid="note-editor"]', {
            timeout: 5000,
          });

          await page.type('[data-testid="note-title-input"]', note.title);
          await page.type('[data-testid="note-content-editor"]', note.content);

          // Add tags
          await page.click('[data-testid="add-tag-button"]');
          await page.waitForSelector('[data-testid="tag-input"]', {
            timeout: 5000,
          });

          for (const tag of note.tags) {
            await page.type('[data-testid="tag-input"]', tag);
            await page.press('[data-testid="tag-input"]', "Enter");
          }

          await page.click('[data-testid="save-note-button"]');
          await page.waitForSelector('[data-testid="save-success-message"]', {
            timeout: 5000,
          });
          await page.click('[data-testid="back-to-notes-button"]');
          await page.waitForSelector('[data-testid="notes-list"]', {
            timeout: 5000,
          });
        }

        // Should show all notes initially
        let noteItems = await page.$$('[data-testid="note-item"]');
        expect(noteItems.length).toBe(3);

        // Filter by 'work' tag
        await page.click('[data-testid="filter-by-tag-work"]');
        await page.waitForTimeout(1000);

        noteItems = await page.$$('[data-testid="note-item"]');
        expect(noteItems.length).toBe(2); // Work Note and Mixed Note

        // Filter by 'personal' tag
        await page.click('[data-testid="filter-by-tag-personal"]');
        await page.waitForTimeout(1000);

        noteItems = await page.$$('[data-testid="note-item"]');
        expect(noteItems.length).toBe(2); // Personal Note and Mixed Note
      })
    );

    test(
      "should manage tag colors",
      isolateTest(async ({ registerCleanup }) => {
        // Open tag management
        await page.click('[data-testid="manage-tags-button"]');
        await page.waitForSelector('[data-testid="tag-management-dialog"]', {
          timeout: 5000,
        });

        // Create a new tag
        await page.click('[data-testid="create-tag-button"]');
        await page.waitForSelector('[data-testid="tag-creation-form"]', {
          timeout: 5000,
        });

        await page.type('[data-testid="tag-name-input"]', "urgent");
        await page.click('[data-testid="tag-color-picker"]');

        // Select red color
        await page.click('[data-testid="color-red"]');

        // Save tag
        await page.click('[data-testid="save-tag-button"]');

        // Should appear in tag list
        await page.waitForSelector('[data-testid="tag-urgent"]', {
          timeout: 5000,
        });

        // Should have red color
        const tagElement = await page.$('[data-testid="tag-urgent"]');
        const backgroundColor = await tagElement.evaluate(
          (el) => getComputedStyle(el).backgroundColor
        );
        expect(backgroundColor).toContain("rgb(255, 0, 0)"); // Red color

        // Close dialog
        await page.click('[data-testid="close-tag-dialog"]');

        // Tag should be available in note editor
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });
        await page.click('[data-testid="add-tag-button"]');

        // Should show 'urgent' tag in suggestions
        await page.waitForSelector('[data-testid="tag-suggestion-urgent"]', {
          timeout: 5000,
        });
      })
    );
  });

  describe("Version History", () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(TEST_URL);
      await page.waitForSelector('[data-testid="login-form"]', {
        timeout: 5000,
      });
      await page.type('[data-testid="username-input"]', "testuser");
      await page.type('[data-testid="password-input"]', "testpassword");
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="main-app"]', { timeout: 5000 });
    });

    test(
      "should create and restore from version history",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Initial content
        await page.type('[data-testid="note-title-input"]', "Version Test");
        await page.type(
          '[data-testid="note-content-editor"]',
          "Version 1 content"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Update content
        await page.fill(
          '[data-testid="note-content-editor"]',
          "Version 2 content"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Update again
        await page.fill(
          '[data-testid="note-content-editor"]',
          "Version 3 content"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Open version history
        await page.click('[data-testid="version-history-button"]');
        await page.waitForSelector('[data-testid="version-history-dialog"]', {
          timeout: 5000,
        });

        // Should show 3 versions
        const versions = await page.$$('[data-testid^="version-"]');
        expect(versions.length).toBe(3);

        // Restore to version 1
        await page.click(
          '[data-testid="version-0"] [data-testid="restore-version-button"]'
        );
        await page.waitForSelector('[data-testid="restore-confirmation"]', {
          timeout: 5000,
        });
        await page.click('[data-testid="confirm-restore-button"]');

        // Should close dialog and show restored content
        await page.waitForSelector('[data-testid="version-history-dialog"]', {
          state: "hidden",
          timeout: 5000,
        });

        const restoredContent = await page.inputValue(
          '[data-testid="note-content-editor"]'
        );
        expect(restoredContent).toBe("Version 1 content");
      })
    );

    test(
      "should handle version comparison",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note with multiple versions
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        await page.type('[data-testid="note-title-input"]', "Compare Test");
        await page.type(
          '[data-testid="note-content-editor"]',
          "Original content for comparison"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Update content
        await page.fill(
          '[data-testid="note-content-editor"]',
          "Updated content for comparison"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Open version history
        await page.click('[data-testid="version-history-button"]');
        await page.waitForSelector('[data-testid="version-history-dialog"]', {
          timeout: 5000,
        });

        // Compare versions
        await page.click(
          '[data-testid="version-0"] [data-testid="compare-version-button"]'
        );
        await page.waitForSelector(
          '[data-testid="version-comparison-dialog"]',
          { timeout: 5000 }
        );

        // Should show differences
        await page.waitForSelector('[data-testid="version-diff"]', {
          timeout: 5000,
        });

        const addedText = await page.textContent('[data-testid="diff-added"]');
        const removedText = await page.textContent(
          '[data-testid="diff-removed"]'
        );

        expect(addedText).toContain("Updated");
        expect(removedText).toContain("Original");
      })
    );
  });

  describe("Performance and Reliability", () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(TEST_URL);
      await page.waitForSelector('[data-testid="login-form"]', {
        timeout: 5000,
      });
      await page.type('[data-testid="username-input"]', "testuser");
      await page.type('[data-testid="password-input"]', "testpassword");
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="main-app"]', { timeout: 5000 });
    });

    test(
      "should handle large note content",
      isolateTest(async ({ registerCleanup }) => {
        // Create note with large content
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        const largeContent =
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
            1000
          );

        const startTime = Date.now();

        await page.type('[data-testid="note-title-input"]', "Large Note Test");
        await page.type('[data-testid="note-content-editor"]', largeContent);

        const endTime = Date.now();
        const typingTime = endTime - startTime;

        // Should handle typing within reasonable time
        expect(typingTime).toBeLessThan(30000); // 30 seconds

        // Save should work
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 10000,
        });

        // Content should be preserved
        const savedContent = await page.inputValue(
          '[data-testid="note-content-editor"]'
        );
        expect(savedContent).toBe(largeContent);
      })
    );

    test(
      "should handle network interruptions",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        await page.type('[data-testid="note-title-input"]', "Network Test");
        await page.type(
          '[data-testid="note-content-editor"]',
          "Content before network issue"
        );

        // Simulate network interruption
        await page.setOfflineMode(true);

        // Try to save
        await page.click('[data-testid="save-note-button"]');

        // Should show offline indicator
        await page.waitForSelector('[data-testid="offline-indicator"]', {
          timeout: 5000,
        });

        // Continue editing
        await page.type(
          '[data-testid="note-content-editor"]',
          "\nContent added while offline"
        );

        // Restore network
        await page.setOfflineMode(false);

        // Should auto-sync when back online
        await page.waitForSelector('[data-testid="sync-indicator"]', {
          timeout: 10000,
        });

        // Should eventually show saved status
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 10000,
        });
      })
    );

    test(
      "should handle concurrent editing",
      isolateTest(async ({ registerCleanup }) => {
        // Create a note
        await page.click('[data-testid="create-note-button"]');
        await page.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        await page.type('[data-testid="note-title-input"]', "Concurrent Test");
        await page.type(
          '[data-testid="note-content-editor"]',
          "Original content"
        );
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Open same note in new tab (simulate concurrent editing)
        const secondPage = await browser.newPage();
        await secondPage.setViewport({ width: 1280, height: 720 });

        await secondPage.goto(TEST_URL);
        // Login in second tab
        await secondPage.waitForSelector('[data-testid="login-form"]', {
          timeout: 5000,
        });
        await secondPage.type('[data-testid="username-input"]', "testuser");
        await secondPage.type('[data-testid="password-input"]', "testpassword");
        await secondPage.click('[data-testid="login-button"]');
        await secondPage.waitForSelector('[data-testid="main-app"]', {
          timeout: 5000,
        });

        // Open the same note
        await secondPage.click('[data-testid="note-item"]:first-child');
        await secondPage.waitForSelector('[data-testid="note-editor"]', {
          timeout: 5000,
        });

        // Edit in both tabs
        await page.type(
          '[data-testid="note-content-editor"]',
          "\nEdit from tab 1"
        );
        await secondPage.type(
          '[data-testid="note-content-editor"]',
          "\nEdit from tab 2"
        );

        // Save in first tab
        await page.click('[data-testid="save-note-button"]');
        await page.waitForSelector('[data-testid="save-success-message"]', {
          timeout: 5000,
        });

        // Save in second tab should show conflict resolution
        await secondPage.click('[data-testid="save-note-button"]');
        await secondPage.waitForSelector(
          '[data-testid="conflict-resolution-dialog"]',
          { timeout: 5000 }
        );

        // Should be able to resolve conflict
        await secondPage.click('[data-testid="merge-changes-button"]');
        await secondPage.waitForSelector(
          '[data-testid="save-success-message"]',
          { timeout: 5000 }
        );

        await secondPage.close();
      })
    );
  });
});
