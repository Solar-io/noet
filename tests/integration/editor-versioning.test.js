import { jest } from "@jest/globals";
import { isolateTest } from "../helpers/test-utils.js";

describe("Editor-Versioning Integration Tests", () => {
  let StateManager, EditorStateManager, VersioningStateManager, EventBus;

  beforeAll(async () => {
    const modules = await Promise.all([
      import("../../src/state/StateManager.js"),
      import("../../src/state/EditorStateManager.js"),
      import("../../src/state/VersioningStateManager.js"),
      import("../../src/state/EventBus.js"),
    ]);

    StateManager = modules[0].StateManager;
    EditorStateManager = modules[1].EditorStateManager;
    VersioningStateManager = modules[2].VersioningStateManager;
    EventBus = modules[3].EventBus;
  });

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Content Versioning Integration", () => {
    test(
      "should create versions when content changes",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Set initial content
        editorManager.setContent("Initial content");

        // Wait for version creation
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Update content
        editorManager.setContent("Updated content");

        // Wait for version creation
        await new Promise((resolve) => setTimeout(resolve, 100));

        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);
        expect(versions[0].content).toBe("Initial content");
      })
    );

    test(
      "should restore content from version",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Create content with versions
        editorManager.setContent("Version 1");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Version 2");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Version 3");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);

        // Restore first version
        versioningManager.restoreVersion(versions[0].id);

        // Content should be restored
        expect(editorManager.getContent()).toBe("Version 1");
      })
    );

    test(
      "should handle version conflicts",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Create content
        editorManager.setContent("Original content");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate concurrent edits
        editorManager.setContent("Edit 1");
        editorManager.setContent("Edit 2");

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should handle conflicts gracefully
        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);

        // Should maintain version integrity
        const lastVersion = versions[versions.length - 1];
        expect(["Edit 1", "Edit 2"]).toContain(lastVersion.content);
      })
    );
  });

  describe("Auto-save Integration", () => {
    test(
      "should auto-save content at intervals",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus, {
          autoSaveInterval: 100,
        });
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Set content
        editorManager.setContent("Auto-save test content");

        // Wait for auto-save
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Check if version was created
        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);
        expect(versions[0].content).toBe("Auto-save test content");
      })
    );

    test(
      "should debounce rapid changes",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus, {
          autoSaveInterval: 100,
        });
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Make rapid changes
        for (let i = 0; i < 10; i++) {
          editorManager.setContent(`Content ${i}`);
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Wait for debounce
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Should have fewer versions than changes
        const versions = versioningManager.getVersions();
        expect(versions.length).toBeLessThan(10);
        expect(versions[0].content).toBe("Content 9");
      })
    );
  });

  describe("Undo/Redo Integration", () => {
    test(
      "should support undo/redo operations",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Create content history
        editorManager.setContent("Step 1");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Step 2");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Step 3");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Undo operation
        versioningManager.undo();
        expect(editorManager.getContent()).toBe("Step 2");

        // Undo again
        versioningManager.undo();
        expect(editorManager.getContent()).toBe("Step 1");

        // Redo operation
        versioningManager.redo();
        expect(editorManager.getContent()).toBe("Step 2");
      })
    );

    test(
      "should handle undo/redo limits",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus, {
          maxUndoSteps: 2,
        });

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Create more content than undo limit
        editorManager.setContent("Step 1");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Step 2");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Step 3");
        await new Promise((resolve) => setTimeout(resolve, 100));

        editorManager.setContent("Step 4");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should only be able to undo 2 steps
        versioningManager.undo();
        expect(editorManager.getContent()).toBe("Step 3");

        versioningManager.undo();
        expect(editorManager.getContent()).toBe("Step 2");

        // Should not be able to undo further
        versioningManager.undo();
        expect(editorManager.getContent()).toBe("Step 2");
      })
    );
  });

  describe("Performance Integration", () => {
    test(
      "should handle large content efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        const largeContent = "a".repeat(100000);

        const startTime = performance.now();

        editorManager.setContent(largeContent);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(1000);
        expect(editorManager.getContent()).toBe(largeContent);

        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);
        expect(versions[0].content).toBe(largeContent);
      })
    );

    test(
      "should cleanup old versions automatically",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus, {
          maxVersions: 5,
        });

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Create more versions than the limit
        for (let i = 0; i < 10; i++) {
          editorManager.setContent(`Version ${i}`);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Should only keep the configured number of versions
        const versions = versioningManager.getVersions();
        expect(versions.length).toBeLessThanOrEqual(5);

        // Should keep the most recent versions
        const latestVersion = versions[versions.length - 1];
        expect(latestVersion.content).toBe("Version 9");
      })
    );
  });

  describe("Error Recovery Integration", () => {
    test(
      "should recover from editor errors",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Set valid content
        editorManager.setContent("Valid content");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate editor error
        try {
          editorManager.setContent(null);
        } catch (error) {
          // Error should be handled gracefully
        }

        // Should be able to restore from version
        const versions = versioningManager.getVersions();
        expect(versions.length).toBeGreaterThan(0);

        versioningManager.restoreVersion(versions[0].id);
        expect(editorManager.getContent()).toBe("Valid content");
      })
    );

    test(
      "should handle versioning system errors",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        // Set content
        editorManager.setContent("Content before error");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate versioning error
        try {
          versioningManager.restoreVersion("non-existent-id");
        } catch (error) {
          // Error should be handled gracefully
        }

        // Editor should still work
        expect(editorManager.getContent()).toBe("Content before error");

        editorManager.setContent("Content after error");
        expect(editorManager.getContent()).toBe("Content after error");
      })
    );
  });

  describe("Event Communication", () => {
    test(
      "should communicate through events properly",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const editorManager = new EditorStateManager(eventBus);
        const versioningManager = new VersioningStateManager(eventBus);

        registerCleanup(() => {
          editorManager.destroy?.();
          versioningManager.destroy?.();
          eventBus.destroy?.();
        });

        const eventLog = [];

        // Subscribe to events
        eventBus.subscribe("editor:*", (data) => {
          eventLog.push({ type: "editor", data });
        });

        eventBus.subscribe("versioning:*", (data) => {
          eventLog.push({ type: "versioning", data });
        });

        // Trigger events
        editorManager.setContent("Test content");
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Should have received events
        expect(eventLog.length).toBeGreaterThan(0);

        const editorEvents = eventLog.filter((e) => e.type === "editor");
        const versioningEvents = eventLog.filter(
          (e) => e.type === "versioning"
        );

        expect(editorEvents.length).toBeGreaterThan(0);
        expect(versioningEvents.length).toBeGreaterThan(0);
      })
    );
  });
});
