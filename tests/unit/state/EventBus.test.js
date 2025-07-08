import { jest } from "@jest/globals";
import { isolateTest } from "../../helpers/test-utils.js";

describe("EventBus Unit Tests", () => {
  let EventBus;

  beforeAll(async () => {
    const module = await import("../../../src/state/EventBus.js");
    EventBus = module.EventBus;
  });

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    test(
      "should initialize with empty event listeners",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        expect(eventBus).toBeDefined();
        expect(eventBus.listeners).toBeDefined();
      })
    );

    test(
      "should initialize with optional configuration",
      isolateTest(async ({ registerCleanup }) => {
        const config = {
          maxListeners: 100,
          enableHistory: true,
        };

        const eventBus = new EventBus(config);
        registerCleanup(() => eventBus.destroy?.());

        expect(eventBus).toBeDefined();
        expect(eventBus.config?.maxListeners).toBe(100);
      })
    );
  });

  describe("Event Subscription", () => {
    test(
      "should subscribe to events",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:event", handler);

        eventBus.emit("test:event", { data: "test" });
        expect(handler).toHaveBeenCalledWith({ data: "test" });
      })
    );

    test(
      "should handle multiple subscribers for same event",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const handler3 = jest.fn();

        eventBus.subscribe("test:event", handler1);
        eventBus.subscribe("test:event", handler2);
        eventBus.subscribe("test:event", handler3);

        eventBus.emit("test:event", { data: "test" });

        expect(handler1).toHaveBeenCalledWith({ data: "test" });
        expect(handler2).toHaveBeenCalledWith({ data: "test" });
        expect(handler3).toHaveBeenCalledWith({ data: "test" });
      })
    );

    test(
      "should support wildcard subscriptions",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:*", handler);

        eventBus.emit("test:event1", { data: "test1" });
        eventBus.emit("test:event2", { data: "test2" });
        eventBus.emit("other:event", { data: "other" });

        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenCalledWith({ data: "test1" });
        expect(handler).toHaveBeenCalledWith({ data: "test2" });
      })
    );

    test(
      "should support once subscriptions",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.once("test:event", handler);

        eventBus.emit("test:event", { data: "test1" });
        eventBus.emit("test:event", { data: "test2" });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ data: "test1" });
      })
    );
  });

  describe("Event Unsubscription", () => {
    test(
      "should unsubscribe from events",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:event", handler);
        eventBus.unsubscribe("test:event", handler);

        eventBus.emit("test:event", { data: "test" });
        expect(handler).not.toHaveBeenCalled();
      })
    );

    test(
      "should handle unsubscribing non-existent handlers",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();

        expect(() => {
          eventBus.unsubscribe("test:event", handler);
        }).not.toThrow();
      })
    );

    test(
      "should unsubscribe specific handler without affecting others",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const handler3 = jest.fn();

        eventBus.subscribe("test:event", handler1);
        eventBus.subscribe("test:event", handler2);
        eventBus.subscribe("test:event", handler3);

        eventBus.unsubscribe("test:event", handler2);

        eventBus.emit("test:event", { data: "test" });

        expect(handler1).toHaveBeenCalledWith({ data: "test" });
        expect(handler2).not.toHaveBeenCalled();
        expect(handler3).toHaveBeenCalledWith({ data: "test" });
      })
    );
  });

  describe("Event Emission", () => {
    test(
      "should emit events with data",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:event", handler);

        const eventData = { message: "test message", id: 123 };
        eventBus.emit("test:event", eventData);

        expect(handler).toHaveBeenCalledWith(eventData);
      })
    );

    test(
      "should emit events without data",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:event", handler);

        eventBus.emit("test:event");

        expect(handler).toHaveBeenCalledWith(undefined);
      })
    );

    test(
      "should handle emitting to non-existent events",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        expect(() => {
          eventBus.emit("non-existent:event", { data: "test" });
        }).not.toThrow();
      })
    );
  });

  describe("Event Prioritization", () => {
    test(
      "should handle event priorities",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const results = [];
        const handler1 = () => results.push("handler1");
        const handler2 = () => results.push("handler2");
        const handler3 = () => results.push("handler3");

        eventBus.subscribe("test:event", handler1, { priority: 1 });
        eventBus.subscribe("test:event", handler2, { priority: 3 });
        eventBus.subscribe("test:event", handler3, { priority: 2 });

        eventBus.emit("test:event");

        expect(results).toEqual(["handler2", "handler3", "handler1"]);
      })
    );
  });

  describe("Event History", () => {
    test(
      "should maintain event history when enabled",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus({ enableHistory: true });
        registerCleanup(() => eventBus.destroy?.());

        eventBus.emit("test:event1", { data: "data1" });
        eventBus.emit("test:event2", { data: "data2" });
        eventBus.emit("test:event3", { data: "data3" });

        const history = eventBus.getHistory?.();
        expect(history).toHaveLength(3);
        expect(history[0]).toMatchObject({
          event: "test:event1",
          data: { data: "data1" },
        });
      })
    );

    test(
      "should limit history size",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus({
          enableHistory: true,
          maxHistorySize: 2,
        });
        registerCleanup(() => eventBus.destroy?.());

        eventBus.emit("test:event1", { data: "data1" });
        eventBus.emit("test:event2", { data: "data2" });
        eventBus.emit("test:event3", { data: "data3" });

        const history = eventBus.getHistory?.();
        expect(history).toHaveLength(2);
        expect(history[0].event).toBe("test:event2");
        expect(history[1].event).toBe("test:event3");
      })
    );
  });

  describe("Performance", () => {
    test(
      "should handle many subscribers efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handlers = [];
        for (let i = 0; i < 1000; i++) {
          const handler = jest.fn();
          handlers.push(handler);
          eventBus.subscribe("test:event", handler);
        }

        const startTime = performance.now();
        eventBus.emit("test:event", { data: "test" });
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(50);
        handlers.forEach((handler) => {
          expect(handler).toHaveBeenCalledTimes(1);
        });
      })
    );

    test(
      "should handle many events efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const handler = jest.fn();
        eventBus.subscribe("test:event", handler);

        const startTime = performance.now();
        for (let i = 0; i < 1000; i++) {
          eventBus.emit("test:event", { data: i });
        }
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100);
        expect(handler).toHaveBeenCalledTimes(1000);
      })
    );
  });

  describe("Error Handling", () => {
    test(
      "should handle handler errors gracefully",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const goodHandler = jest.fn();
        const errorHandler = jest.fn(() => {
          throw new Error("Handler error");
        });

        eventBus.subscribe("test:event", goodHandler);
        eventBus.subscribe("test:event", errorHandler);

        expect(() => {
          eventBus.emit("test:event", { data: "test" });
        }).not.toThrow();

        expect(goodHandler).toHaveBeenCalledWith({ data: "test" });
        expect(errorHandler).toHaveBeenCalledWith({ data: "test" });
      })
    );

    test(
      "should handle async handler errors",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        const goodHandler = jest.fn();
        const asyncErrorHandler = jest.fn(async () => {
          throw new Error("Async handler error");
        });

        eventBus.subscribe("test:event", goodHandler);
        eventBus.subscribe("test:event", asyncErrorHandler);

        await expect(async () => {
          await eventBus.emitAsync?.("test:event", { data: "test" });
        }).not.toThrow();

        expect(goodHandler).toHaveBeenCalledWith({ data: "test" });
        expect(asyncErrorHandler).toHaveBeenCalledWith({ data: "test" });
      })
    );
  });

  describe("Memory Management", () => {
    test(
      "should cleanup all listeners on destroy",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();

        const handler1 = jest.fn();
        const handler2 = jest.fn();

        eventBus.subscribe("test:event1", handler1);
        eventBus.subscribe("test:event2", handler2);

        eventBus.destroy?.();

        eventBus.emit?.("test:event1", { data: "test1" });
        eventBus.emit?.("test:event2", { data: "test2" });

        expect(handler1).not.toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();
      })
    );

    test(
      "should handle memory leaks with many events",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        registerCleanup(() => eventBus.destroy?.());

        for (let i = 0; i < 10000; i++) {
          const handler = jest.fn();
          eventBus.subscribe(`test:event:${i}`, handler);
          eventBus.emit(`test:event:${i}`, { data: i });
          eventBus.unsubscribe(`test:event:${i}`, handler);
        }

        // Should not cause memory issues
        expect(eventBus.listenerCount?.()).toBe(0);
      })
    );
  });
});
