import { jest } from "@jest/globals";
import { isolateTest } from "../../helpers/test-utils.js";

describe("StateManager Unit Tests", () => {
  let StateManager;

  beforeAll(async () => {
    const module = await import("../../../src/state/StateManager.js");
    StateManager = module.StateManager;
  });

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    test(
      "should initialize with default state",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        expect(manager).toBeDefined();
        expect(manager.getState("EDITOR")).toBeDefined();
        expect(manager.getState("AUTH")).toBeDefined();
        expect(manager.getState("TAGS")).toBeDefined();
      })
    );

    test(
      "should initialize with custom initial state",
      isolateTest(async ({ registerCleanup }) => {
        const initialState = {
          EDITOR: { content: "test content" },
          AUTH: { user: { id: 1 } },
        };

        const manager = new StateManager(initialState);
        registerCleanup(() => manager.destroy?.());

        expect(manager.getState("EDITOR").content).toBe("test content");
        expect(manager.getState("AUTH").user.id).toBe(1);
      })
    );
  });

  describe("State Operations", () => {
    test(
      "should get state for valid domain",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const editorState = manager.getState("EDITOR");
        expect(editorState).toBeDefined();
        expect(typeof editorState).toBe("object");
      })
    );

    test(
      "should return undefined for invalid domain",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const invalidState = manager.getState("INVALID_DOMAIN");
        expect(invalidState).toBeUndefined();
      })
    );

    test(
      "should set state for valid domain",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const newState = { content: "new content" };
        manager.setState("EDITOR", newState);

        expect(manager.getState("EDITOR").content).toBe("new content");
      })
    );

    test(
      "should merge state updates",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        manager.setState("EDITOR", { content: "initial" });
        manager.setState("EDITOR", { title: "test title" });

        const state = manager.getState("EDITOR");
        expect(state.content).toBe("initial");
        expect(state.title).toBe("test title");
      })
    );

    test(
      "should handle partial state updates",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        manager.setState("EDITOR", {
          content: "content",
          metadata: { created: "2023-01-01" },
        });

        manager.updateState("EDITOR", { content: "updated content" });

        const state = manager.getState("EDITOR");
        expect(state.content).toBe("updated content");
        expect(state.metadata.created).toBe("2023-01-01");
      })
    );
  });

  describe("Event Integration", () => {
    test(
      "should emit events on state changes",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const eventSpy = jest.fn();
        manager.eventBus.subscribe("state:changed", eventSpy);

        manager.setState("EDITOR", { content: "test" });

        expect(eventSpy).toHaveBeenCalledWith({
          domain: "EDITOR",
          data: { content: "test" },
          timestamp: expect.any(Number),
        });
      })
    );

    test(
      "should handle event subscription and unsubscription",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const handler = jest.fn();
        const unsubscribe = manager.subscribe("test:event", handler);

        manager.emit("test:event", { data: "test" });
        expect(handler).toHaveBeenCalledTimes(1);

        unsubscribe();
        manager.emit("test:event", { data: "test" });
        expect(handler).toHaveBeenCalledTimes(1);
      })
    );
  });

  describe("Validation", () => {
    test(
      "should validate state updates",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        expect(() => {
          manager.setState("EDITOR", { content: "valid string" });
        }).not.toThrow();

        expect(() => {
          manager.setState("EDITOR", { content: 123 });
        }).toThrow();
      })
    );

    test(
      "should handle validation errors gracefully",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const originalState = manager.getState("EDITOR");

        try {
          manager.setState("EDITOR", { content: 123 });
        } catch (error) {
          expect(error.message).toContain("validation");
        }

        // State should remain unchanged after validation error
        expect(manager.getState("EDITOR")).toEqual(originalState);
      })
    );
  });

  describe("Performance", () => {
    test(
      "should handle multiple state updates efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const startTime = performance.now();

        for (let i = 0; i < 1000; i++) {
          manager.setState("EDITOR", { content: `content-${i}` });
        }

        const endTime = performance.now();
        expect(endTime - startTime).toBeLessThan(100);
      })
    );

    test(
      "should handle large state objects efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const largeState = {
          items: Array.from({ length: 10000 }, (_, i) => ({
            id: i,
            data: `item-${i}`,
          })),
        };

        const startTime = performance.now();
        manager.setState("EDITOR", largeState);
        const retrievedState = manager.getState("EDITOR");
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(50);
        expect(retrievedState.items).toHaveLength(10000);
      })
    );
  });

  describe("Error Handling", () => {
    test(
      "should handle invalid domain gracefully",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        expect(() => {
          manager.setState("INVALID_DOMAIN", { data: "test" });
        }).not.toThrow();
      })
    );

    test(
      "should handle null/undefined states",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        expect(() => {
          manager.setState("EDITOR", null);
        }).not.toThrow();

        expect(() => {
          manager.setState("EDITOR", undefined);
        }).not.toThrow();
      })
    );

    test(
      "should maintain state integrity after errors",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        manager.setState("EDITOR", { content: "valid" });
        manager.setState("AUTH", { user: { id: 1 } });

        try {
          manager.setState("EDITOR", null);
        } catch (error) {
          // Ignore validation errors
        }

        // Other domains should remain intact
        expect(manager.getState("AUTH").user.id).toBe(1);
      })
    );
  });

  describe("Memory Management", () => {
    test(
      "should cleanup event listeners on destroy",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();

        const handler = jest.fn();
        manager.subscribe("test:event", handler);

        manager.destroy?.();

        // Trying to emit after destroy should not call handlers
        manager.emit?.("test:event", { data: "test" });
        expect(handler).not.toHaveBeenCalled();
      })
    );

    test(
      "should handle memory leaks with many subscriptions",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const handlers = [];
        for (let i = 0; i < 1000; i++) {
          const handler = jest.fn();
          handlers.push(handler);
          manager.subscribe(`test:event:${i}`, handler);
        }

        // Emit events
        for (let i = 0; i < 1000; i++) {
          manager.emit(`test:event:${i}`, { data: i });
        }

        // All handlers should be called
        handlers.forEach((handler) => {
          expect(handler).toHaveBeenCalledTimes(1);
        });
      })
    );
  });

  describe("State Persistence", () => {
    test(
      "should serialize state properly",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        manager.setState("EDITOR", { content: "test content" });
        manager.setState("AUTH", { user: { id: 1, name: "test" } });

        const serialized = manager.serialize?.();
        expect(serialized).toBeDefined();
        expect(typeof serialized).toBe("string");

        const parsed = JSON.parse(serialized);
        expect(parsed.EDITOR.content).toBe("test content");
        expect(parsed.AUTH.user.name).toBe("test");
      })
    );

    test(
      "should restore state from serialized data",
      isolateTest(async ({ registerCleanup }) => {
        const manager = new StateManager();
        registerCleanup(() => manager.destroy?.());

        const stateData = {
          EDITOR: { content: "restored content" },
          AUTH: { user: { id: 2, name: "restored" } },
        };

        manager.restore?.(JSON.stringify(stateData));

        expect(manager.getState("EDITOR").content).toBe("restored content");
        expect(manager.getState("AUTH").user.name).toBe("restored");
      })
    );
  });
});
