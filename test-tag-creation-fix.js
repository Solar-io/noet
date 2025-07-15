/**
 * Test script to verify tag creation fix
 * Tests that newly created tags appear in the tags list immediately
 */

import fetch from "node-fetch";

const API_BASE = "http://localhost:3004";

// Demo user credentials
const DEMO_USER = {
  email: "demo@example.com",
  password: "demo123",
};

async function testTagCreationFix() {
  console.log("🧪 Testing Tag Creation Fix...\n");

  try {
    // Step 1: Login
    console.log("1. 🔑 Logging in as demo user...");
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(DEMO_USER),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const { token } = await loginResponse.json();
    console.log("   ✅ Login successful");

    // Step 2: Get current tags count
    console.log("2. 📊 Getting current tags count...");
    const initialTagsResponse = await fetch(`${API_BASE}/api/user-1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!initialTagsResponse.ok) {
      throw new Error(`Failed to get tags: ${initialTagsResponse.status}`);
    }

    const initialTags = await initialTagsResponse.json();
    console.log(`   ✅ Current tags count: ${initialTags.length}`);

    // Step 3: Create a new tag
    console.log("3. 🏷️ Creating new tag...");
    const testTagName = `test-tag-${Date.now()}`;
    const createTagResponse = await fetch(`${API_BASE}/api/user-1/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: testTagName,
        color: "#4ECDC4",
      }),
    });

    if (!createTagResponse.ok) {
      throw new Error(`Failed to create tag: ${createTagResponse.status}`);
    }

    const createdTag = await createTagResponse.json();
    console.log(`   ✅ Created tag: ${createdTag.name} (ID: ${createdTag.id})`);

    // Step 4: Verify tag appears in tags list immediately
    console.log("4. 🔍 Verifying tag appears in tags list...");
    const updatedTagsResponse = await fetch(`${API_BASE}/api/user-1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!updatedTagsResponse.ok) {
      throw new Error(
        `Failed to get updated tags: ${updatedTagsResponse.status}`
      );
    }

    const updatedTags = await updatedTagsResponse.json();
    console.log(`   ✅ Updated tags count: ${updatedTags.length}`);

    // Check if the new tag is in the list
    const newTagInList = updatedTags.find((tag) => tag.id === createdTag.id);
    if (!newTagInList) {
      throw new Error("New tag not found in tags list!");
    }

    console.log(`   ✅ Tag found in list: ${newTagInList.name}`);

    // Step 5: Verify the tag count increased
    if (updatedTags.length !== initialTags.length + 1) {
      throw new Error(
        `Tag count mismatch. Expected ${initialTags.length + 1}, got ${
          updatedTags.length
        }`
      );
    }

    console.log("   ✅ Tag count increased correctly");

    // Step 6: Test tag update
    console.log("5. ✏️ Testing tag update...");
    const updatedTagName = `${testTagName}-updated`;
    const updateTagResponse = await fetch(
      `${API_BASE}/api/user-1/tags/${createdTag.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updatedTagName,
          color: "#E74C3C",
        }),
      }
    );

    if (!updateTagResponse.ok) {
      throw new Error(`Failed to update tag: ${updateTagResponse.status}`);
    }

    const updatedTag = await updateTagResponse.json();
    console.log(`   ✅ Updated tag: ${updatedTag.name}`);

    // Step 7: Verify updated tag appears in tags list
    console.log("6. 🔍 Verifying updated tag appears in tags list...");
    const finalTagsResponse = await fetch(`${API_BASE}/api/user-1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!finalTagsResponse.ok) {
      throw new Error(`Failed to get final tags: ${finalTagsResponse.status}`);
    }

    const finalTags = await finalTagsResponse.json();
    const updatedTagInList = finalTags.find((tag) => tag.id === createdTag.id);

    if (!updatedTagInList) {
      throw new Error("Updated tag not found in tags list!");
    }

    if (updatedTagInList.name !== updatedTagName) {
      throw new Error(
        `Tag name not updated. Expected ${updatedTagName}, got ${updatedTagInList.name}`
      );
    }

    console.log(`   ✅ Updated tag found in list: ${updatedTagInList.name}`);

    // Step 8: Clean up - delete the test tag
    console.log("7. 🧹 Cleaning up test tag...");
    const deleteTagResponse = await fetch(
      `${API_BASE}/api/user-1/tags/${createdTag.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!deleteTagResponse.ok) {
      throw new Error(`Failed to delete tag: ${deleteTagResponse.status}`);
    }

    console.log("   ✅ Test tag deleted");

    // Step 9: Verify tag is removed from tags list
    console.log("8. 🔍 Verifying tag is removed from tags list...");
    const cleanupTagsResponse = await fetch(`${API_BASE}/api/user-1/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!cleanupTagsResponse.ok) {
      throw new Error(
        `Failed to get cleanup tags: ${cleanupTagsResponse.status}`
      );
    }

    const cleanupTags = await cleanupTagsResponse.json();
    const deletedTagInList = cleanupTags.find(
      (tag) => tag.id === createdTag.id
    );

    if (deletedTagInList) {
      throw new Error("Deleted tag still found in tags list!");
    }

    console.log("   ✅ Tag successfully removed from list");

    if (cleanupTags.length !== initialTags.length) {
      throw new Error(
        `Final tag count mismatch. Expected ${initialTags.length}, got ${cleanupTags.length}`
      );
    }

    console.log("   ✅ Tag count back to original");

    console.log("\n🎉 All tag creation tests PASSED!");
    console.log("✅ Tags now appear immediately after creation");
    console.log("✅ Tag updates work correctly");
    console.log("✅ Tag deletion works correctly");
    console.log("✅ Cache clearing fix is working properly");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testTagCreationFix();
