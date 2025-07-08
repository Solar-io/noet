import { jest } from "@jest/globals";

describe("Smoke Tests - State Isolation", () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Domain Isolation", () => {
    test("should isolate state domains properly", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      // Update different domains
      manager.setState("EDITOR", { content: "editor content" });
      manager.setState("AUTH", { user: { id: 1, name: "test" } });
      manager.setState("TAGS", { tags: ["tag1", "tag2"] });

      // Verify isolation
      expect(manager.getState("EDITOR").content).toBe("editor content");
      expect(manager.getState("AUTH").user.name).toBe("test");
      expect(manager.getState("TAGS").tags).toEqual(["tag1", "tag2"]);

      // Verify other domains are unaffected
      expect(manager.getState("EDITOR").user).toBeUndefined();
      expect(manager.getState("AUTH").content).toBeUndefined();
      expect(manager.getState("TAGS").content).toBeUndefined();
    });

    test("should maintain state independence across domains", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager1 = new StateManager();
      const manager2 = new StateManager();

      // Update same domain in different managers
      manager1.setState("EDITOR", { content: "manager1 content" });
      manager2.setState("EDITOR", { content: "manager2 content" });

      // Verify independence
      expect(manager1.getState("EDITOR").content).toBe("manager1 content");
      expect(manager2.getState("EDITOR").content).toBe("manager2 content");
    });
  });

  describe("Event System Isolation", () => {
    test("should maintain event isolation between domains", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");
      const eventBus = new EventBus();

      let editorEvents = 0;
      let authEvents = 0;

      eventBus.subscribe("editor:*", () => editorEvents++);
      eventBus.subscribe("auth:*", () => authEvents++);

      // Emit domain-specific events
      eventBus.emit("editor:content:changed");
      eventBus.emit("auth:user:login");
      eventBus.emit("editor:save:complete");

      expect(editorEvents).toBe(2);
      expect(authEvents).toBe(1);
    });

    test("should handle cross-domain event communication", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");
      const eventBus = new EventBus();

      let crossDomainEvents = 0;

      // Subscribe to cross-domain events
      eventBus.subscribe("*", () => crossDomainEvents++);

      // Emit events from different domains
      eventBus.emit("editor:content:changed");
      eventBus.emit("auth:user:login");
      eventBus.emit("tags:tag:added");

      expect(crossDomainEvents).toBe(3);
    });
  });

  describe("State Manager Integration", () => {
    test("should handle all state managers without conflicts", async () => {
      const modules = await Promise.all([
        import("../../src/state/AuthStateManager.js"),
        import("../../src/state/TagStateManager.js"),
        import("../../src/state/AttachmentStateManager.js"),
        import("../../src/state/EditorStateManager.js"),
        import("../../src/state/VersioningStateManager.js"),
      ]);

      expect(modules).toHaveLength(5);
      modules.forEach((module, index) => {
        expect(module.default).toBeDefined();
      });
    });

    test("should initialize all state managers quickly", async () => {
      const startTime = performance.now();

      const { AuthStateManager } = await import(
        "../../src/state/AuthStateManager.js"
      );
      const { TagStateManager } = await import(
        "../../src/state/TagStateManager.js"
      );
      const { AttachmentStateManager } = await import(
        "../../src/state/AttachmentStateManager.js"
      );

      const authManager = new AuthStateManager();
      const tagManager = new TagStateManager();
      const attachmentManager = new AttachmentStateManager();

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should initialize quickly
      expect(authManager).toBeDefined();
      expect(tagManager).toBeDefined();
      expect(attachmentManager).toBeDefined();
    });
  });

  describe("State Validation", () => {
    test("should validate state updates across domains", async () => {
      const { StateValidator } = await import(
        "../../src/state/StateValidator.js"
      );
      const validator = new StateValidator();

      // Test valid states
      expect(validator.validate("EDITOR", { content: "test" })).toBe(true);
      expect(validator.validate("AUTH", { user: { id: 1 } })).toBe(true);
      expect(validator.validate("TAGS", { tags: [] })).toBe(true);

      // Test invalid states
      expect(validator.validate("EDITOR", { content: 123 })).toBe(false);
      expect(validator.validate("AUTH", { user: "invalid" })).toBe(false);
      expect(validator.validate("TAGS", { tags: "invalid" })).toBe(false);
    });

    test("should handle validation errors gracefully", async () => {
      const { StateValidator } = await import(
        "../../src/state/StateValidator.js"
      );
      const validator = new StateValidator();

      expect(() => {
        validator.validate("INVALID_DOMAIN", {});
      }).not.toThrow();

      expect(() => {
        validator.validate("EDITOR", null);
      }).not.toThrow();
    });
  });

  describe("Performance Isolation", () => {
    test("should handle concurrent state operations efficiently", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      const startTime = performance.now();

      // Simulate concurrent operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            manager.setState("EDITOR", { content: `content-${i}` });
            manager.setState("AUTH", { user: { id: i } });
            manager.setState("TAGS", { tags: [`tag-${i}`] });
          })
        );
      }

      await Promise.all(promises);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should handle concurrency efficiently
    });

    test("should maintain performance with large state objects", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      const largeState = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `item-${i}`,
          metadata: { created: new Date().toISOString() },
        })),
      };

      const startTime = performance.now();
      manager.setState("EDITOR", largeState);
      const retrievedState = manager.getState("EDITOR");
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should handle large states quickly
      expect(retrievedState.items).toHaveLength(1000);
    });
  });

  describe("Error Recovery", () => {
    test("should handle state corruption gracefully", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      // Simulate state corruption
      manager.setState("EDITOR", { content: "valid content" });

      expect(() => {
        manager.setState("EDITOR", undefined);
      }).not.toThrow();

      expect(() => {
        manager.setState("EDITOR", null);
      }).not.toThrow();
    });

    test("should maintain other domains when one fails", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      // Set valid states
      manager.setState("EDITOR", { content: "editor content" });
      manager.setState("AUTH", { user: { id: 1 } });

      // Try to corrupt one domain
      try {
        manager.setState("EDITOR", null);
      } catch (error) {
        // Ignore validation errors
      }

      // Other domains should remain intact
      expect(manager.getState("AUTH").user.id).toBe(1);
    });
  });
});
