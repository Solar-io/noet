import { jest } from "@jest/globals";

describe("Smoke Tests - Basic Functionality", () => {
  // Test suite should complete within 30 seconds
  jest.setTimeout(30000);

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Application Bootstrap", () => {
    test("should load core modules without errors", async () => {
      const startTime = performance.now();

      // Test that core modules can be imported
      expect(async () => {
        await import("../../src/state/StateManager.js");
        await import("../../src/state/EventBus.js");
        await import("../../src/state/StateValidator.js");
      }).not.toThrow();

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should load in under 1 second
    });

    test("should initialize state managers successfully", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");

      expect(() => {
        new StateManager();
      }).not.toThrow();
    });

    test("should initialize event bus successfully", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");

      expect(() => {
        new EventBus();
      }).not.toThrow();
    });
  });

  describe("State Management", () => {
    test("should handle basic state operations", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      // Test basic state operations
      expect(manager.getState("EDITOR")).toBeDefined();
      expect(manager.getState("AUTH")).toBeDefined();
      expect(manager.getState("TAGS")).toBeDefined();

      // Test state updates
      manager.setState("EDITOR", { content: "test" });
      expect(manager.getState("EDITOR").content).toBe("test");
    });

    test("should validate state updates", async () => {
      const { StateValidator } = await import(
        "../../src/state/StateValidator.js"
      );
      const validator = new StateValidator();

      // Test validation
      expect(validator.validate("EDITOR", { content: "test" })).toBe(true);
      expect(validator.validate("EDITOR", { content: 123 })).toBe(false);
    });
  });

  describe("Event Communication", () => {
    test("should handle event subscription and emission", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");
      const eventBus = new EventBus();

      let eventReceived = false;
      const handler = () => {
        eventReceived = true;
      };

      eventBus.subscribe("test:event", handler);
      eventBus.emit("test:event");

      expect(eventReceived).toBe(true);
    });

    test("should handle event unsubscription", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");
      const eventBus = new EventBus();

      let eventCount = 0;
      const handler = () => {
        eventCount++;
      };

      eventBus.subscribe("test:event", handler);
      eventBus.emit("test:event");
      eventBus.unsubscribe("test:event", handler);
      eventBus.emit("test:event");

      expect(eventCount).toBe(1);
    });
  });

  describe("Performance Checks", () => {
    test("should initialize state managers quickly", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");

      const startTime = performance.now();
      const manager = new StateManager();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should initialize in under 100ms
    });

    test("should handle state operations efficiently", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      const startTime = performance.now();

      // Perform multiple operations
      for (let i = 0; i < 100; i++) {
        manager.setState("EDITOR", { content: `test-${i}` });
        manager.getState("EDITOR");
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid state domain gracefully", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      expect(() => {
        manager.getState("INVALID_DOMAIN");
      }).not.toThrow();

      expect(manager.getState("INVALID_DOMAIN")).toBeUndefined();
    });

    test("should handle validation errors gracefully", async () => {
      const { StateValidator } = await import(
        "../../src/state/StateValidator.js"
      );
      const validator = new StateValidator();

      expect(() => {
        validator.validate("INVALID_DOMAIN", {});
      }).not.toThrow();

      expect(validator.validate("INVALID_DOMAIN", {})).toBe(false);
    });
  });

  describe("Memory Management", () => {
    test("should cleanup event listeners properly", async () => {
      const { EventBus } = await import("../../src/state/EventBus.js");
      const eventBus = new EventBus();

      const handler = jest.fn();
      eventBus.subscribe("test:event", handler);

      // Simulate cleanup
      eventBus.unsubscribe("test:event", handler);
      eventBus.emit("test:event");

      expect(handler).not.toHaveBeenCalled();
    });

    test("should handle large state updates efficiently", async () => {
      const { StateManager } = await import("../../src/state/StateManager.js");
      const manager = new StateManager();

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`,
        })),
      };

      const startTime = performance.now();
      manager.setState("EDITOR", largeData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should handle large updates quickly
    });
  });
});
