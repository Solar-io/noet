import { jest } from "@jest/globals";
import { isolateTest } from "../helpers/test-utils.js";

describe("Auth-Tag Management Integration Tests", () => {
  let AuthStateManager, TagStateManager, EventBus;

  beforeAll(async () => {
    const modules = await Promise.all([
      import("../../src/state/AuthStateManager.js"),
      import("../../src/state/TagStateManager.js"),
      import("../../src/state/EventBus.js"),
    ]);

    AuthStateManager = modules[0].AuthStateManager;
    TagStateManager = modules[1].TagStateManager;
    EventBus = modules[2].EventBus;
  });

  beforeEach(() => {
    global.cleanupTestData();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("User-specific Tag Management", () => {
    test(
      "should isolate tags by user",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login as user 1
        await authManager.login({ username: "user1", password: "password" });

        // Add tags for user 1
        await tagManager.addTag({ name: "user1-tag1", color: "#ff0000" });
        await tagManager.addTag({ name: "user1-tag2", color: "#00ff00" });

        const user1Tags = tagManager.getAllTags();
        expect(user1Tags).toHaveLength(2);

        // Switch to user 2
        await authManager.logout();
        await authManager.login({ username: "user2", password: "password" });

        // Add tags for user 2
        await tagManager.addTag({ name: "user2-tag1", color: "#0000ff" });

        const user2Tags = tagManager.getAllTags();
        expect(user2Tags).toHaveLength(1);
        expect(user2Tags[0].name).toBe("user2-tag1");

        // User 2 should not see user 1's tags
        expect(
          user2Tags.find((tag) => tag.name === "user1-tag1")
        ).toBeUndefined();
      })
    );

    test(
      "should handle tag permissions",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login as regular user
        await authManager.login({
          username: "user",
          password: "password",
          role: "user",
        });

        // Regular user should be able to create tags
        await tagManager.addTag({ name: "user-tag", color: "#ff0000" });

        const userTags = tagManager.getAllTags();
        expect(userTags).toHaveLength(1);

        // Login as admin
        await authManager.logout();
        await authManager.login({
          username: "admin",
          password: "password",
          role: "admin",
        });

        // Admin should be able to create system tags
        await tagManager.addTag({
          name: "system-tag",
          color: "#000000",
          isSystem: true,
        });

        const adminTags = tagManager.getAllTags();
        expect(adminTags.some((tag) => tag.isSystem)).toBe(true);
      })
    );

    test(
      "should sync tags on login",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Mock server-side tags
        const mockUserTags = [
          { id: 1, name: "server-tag1", color: "#ff0000" },
          { id: 2, name: "server-tag2", color: "#00ff00" },
        ];

        // Mock fetch for tag sync
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => mockUserTags,
        });

        // Login should trigger tag sync
        await authManager.login({ username: "user", password: "password" });

        // Wait for sync
        await new Promise((resolve) => setTimeout(resolve, 100));

        const syncedTags = tagManager.getAllTags();
        expect(syncedTags).toHaveLength(2);
        expect(
          syncedTags.find((tag) => tag.name === "server-tag1")
        ).toBeDefined();
        expect(
          syncedTags.find((tag) => tag.name === "server-tag2")
        ).toBeDefined();
      })
    );
  });

  describe("Authentication State Changes", () => {
    test(
      "should clear tags on logout",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login and add tags
        await authManager.login({ username: "user", password: "password" });
        await tagManager.addTag({ name: "test-tag", color: "#ff0000" });

        expect(tagManager.getAllTags()).toHaveLength(1);

        // Logout should clear user-specific tags
        await authManager.logout();

        expect(tagManager.getAllTags()).toHaveLength(0);
      })
    );

    test(
      "should handle session expiration",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login and add tags
        await authManager.login({ username: "user", password: "password" });
        await tagManager.addTag({ name: "test-tag", color: "#ff0000" });

        expect(tagManager.getAllTags()).toHaveLength(1);

        // Simulate session expiration
        eventBus.emit("auth:session:expired");

        // Tags should be cleared
        expect(tagManager.getAllTags()).toHaveLength(0);
      })
    );

    test(
      "should handle authentication errors during tag operations",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login
        await authManager.login({ username: "user", password: "password" });

        // Mock authentication failure
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        });

        // Tag operation should handle auth error
        try {
          await tagManager.addTag({ name: "test-tag", color: "#ff0000" });
        } catch (error) {
          expect(error.message).toContain("Unauthorized");
        }

        // Should trigger re-authentication
        expect(authManager.isAuthenticated()).toBe(false);
      })
    );
  });

  describe("Tag Sharing and Permissions", () => {
    test(
      "should handle shared tags",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login as user 1
        await authManager.login({ username: "user1", password: "password" });

        // Create a shared tag
        await tagManager.addTag({
          name: "shared-tag",
          color: "#ff0000",
          isShared: true,
          sharedWith: ["user2", "user3"],
        });

        // Switch to user 2
        await authManager.logout();
        await authManager.login({ username: "user2", password: "password" });

        // User 2 should see the shared tag
        const sharedTags = tagManager.getSharedTags();
        expect(sharedTags).toHaveLength(1);
        expect(sharedTags[0].name).toBe("shared-tag");

        // User 2 should be able to use but not modify the shared tag
        expect(tagManager.canModifyTag(sharedTags[0].id)).toBe(false);
        expect(tagManager.canUseTag(sharedTags[0].id)).toBe(true);
      })
    );

    test(
      "should handle tag collaboration",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login as user 1
        await authManager.login({ username: "user1", password: "password" });

        // Create a collaborative tag
        await tagManager.addTag({
          name: "collab-tag",
          color: "#ff0000",
          isCollaborative: true,
          collaborators: ["user2"],
        });

        // Switch to user 2
        await authManager.logout();
        await authManager.login({ username: "user2", password: "password" });

        // User 2 should be able to modify the collaborative tag
        const collabTags = tagManager.getCollaborativeTags();
        expect(collabTags).toHaveLength(1);
        expect(tagManager.canModifyTag(collabTags[0].id)).toBe(true);

        // User 2 modifies the tag
        await tagManager.updateTag(collabTags[0].id, {
          name: "collab-tag-updated",
          color: "#00ff00",
        });

        // Switch back to user 1
        await authManager.logout();
        await authManager.login({ username: "user1", password: "password" });

        // User 1 should see the updated tag
        const updatedTags = tagManager.getAllTags();
        const updatedTag = updatedTags.find(
          (tag) => tag.id === collabTags[0].id
        );
        expect(updatedTag.name).toBe("collab-tag-updated");
        expect(updatedTag.color).toBe("#00ff00");
      })
    );
  });

  describe("Performance and Sync", () => {
    test(
      "should handle large tag collections efficiently",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login
        await authManager.login({ username: "user", password: "password" });

        const startTime = performance.now();

        // Add many tags
        const tagPromises = [];
        for (let i = 0; i < 1000; i++) {
          tagPromises.push(
            tagManager.addTag({
              name: `tag-${i}`,
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            })
          );
        }

        await Promise.all(tagPromises);

        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
        expect(tagManager.getAllTags()).toHaveLength(1000);
      })
    );

    test(
      "should sync tags in background",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus, { syncInterval: 100 });

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Mock server responses
        let syncCallCount = 0;
        global.fetch = jest.fn().mockImplementation(() => {
          syncCallCount++;
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 1, name: `server-tag-${syncCallCount}`, color: "#ff0000" },
            ],
          });
        });

        // Login
        await authManager.login({ username: "user", password: "password" });

        // Wait for background sync
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Should have synced multiple times
        expect(syncCallCount).toBeGreaterThan(1);

        const tags = tagManager.getAllTags();
        expect(tags.length).toBeGreaterThan(0);
      })
    );
  });

  describe("Error Handling", () => {
    test(
      "should handle network errors gracefully",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login
        await authManager.login({ username: "user", password: "password" });

        // Mock network error
        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

        // Tag operations should handle network errors
        try {
          await tagManager.addTag({ name: "test-tag", color: "#ff0000" });
        } catch (error) {
          expect(error.message).toContain("Network error");
        }

        // Should remain authenticated
        expect(authManager.isAuthenticated()).toBe(true);

        // Should be able to add tags locally
        await tagManager.addTagLocally({ name: "local-tag", color: "#ff0000" });

        const localTags = tagManager.getLocalTags();
        expect(localTags).toHaveLength(1);
      })
    );

    test(
      "should handle tag conflicts",
      isolateTest(async ({ registerCleanup }) => {
        const eventBus = new EventBus();
        const authManager = new AuthStateManager(eventBus);
        const tagManager = new TagStateManager(eventBus);

        registerCleanup(() => {
          authManager.destroy?.();
          tagManager.destroy?.();
          eventBus.destroy?.();
        });

        // Login
        await authManager.login({ username: "user", password: "password" });

        // Create tag locally
        await tagManager.addTag({ name: "conflict-tag", color: "#ff0000" });

        // Mock server conflict
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 409,
          json: async () => ({
            error: "Tag already exists",
            conflictingTag: { id: 999, name: "conflict-tag", color: "#00ff00" },
          }),
        });

        // Should handle conflict gracefully
        try {
          await tagManager.syncTags();
        } catch (error) {
          expect(error.message).toContain("conflict");
        }

        // Should resolve conflict
        const tags = tagManager.getAllTags();
        const conflictTag = tags.find((tag) => tag.name === "conflict-tag");
        expect(conflictTag).toBeDefined();
      })
    );
  });
});
