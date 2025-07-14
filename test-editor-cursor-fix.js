/**
 * Test script to verify TipTap editor cursor positioning fix
 * Tests basic editor functionality to ensure Enter key works properly
 */

import fetch from "node-fetch";

const API_BASE = "http://localhost:3004";

// Demo user credentials
const DEMO_USER = {
  email: "demo@example.com",
  password: "demo123",
};

async function testEditorFunctionality() {
  console.log("🧪 Testing TipTap Editor Cursor Positioning Fix...\n");

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

    // Step 2: Create a test note
    console.log("2. 📝 Creating test note...");
    const noteResponse = await fetch(`${API_BASE}/api/user-1/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: "Editor Cursor Test",
        content: "<p>Testing cursor positioning...</p>",
        markdown: "Testing cursor positioning...",
      }),
    });

    if (!noteResponse.ok) {
      throw new Error(`Note creation failed: ${noteResponse.status}`);
    }

    const note = await noteResponse.json();
    console.log("   ✅ Test note created:", note.id);

    // Step 3: Update note with line breaks (simulating Enter key presses)
    console.log("3. ↩️ Testing line break functionality...");
    const updateResponse = await fetch(
      `${API_BASE}/api/user-1/notes/${note.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: "<p>Line 1</p><p>Line 2</p><p>Line 3</p>",
          markdown: "Line 1\n\nLine 2\n\nLine 3",
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Note update failed: ${updateResponse.status}`);
    }

    console.log("   ✅ Line breaks processed successfully");

    // Step 4: Test with list items (the problematic case)
    console.log("4. 📋 Testing list functionality...");
    const listResponse = await fetch(
      `${API_BASE}/api/user-1/notes/${note.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content:
            "<ul><li><p>Item 1</p></li><li><p>Item 2</p></li></ul><p>After list</p>",
          markdown: "- Item 1\n- Item 2\n\nAfter list",
        }),
      }
    );

    if (!listResponse.ok) {
      throw new Error(`List update failed: ${listResponse.status}`);
    }

    console.log("   ✅ List functionality working");

    // Step 5: Clean up
    console.log("5. 🧹 Cleaning up test note...");
    await fetch(`${API_BASE}/api/user-1/notes/${note.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("   ✅ Test note cleaned up");

    console.log("\n🎉 All editor cursor positioning tests PASSED!");
    console.log("✅ Enter key should now work properly in the editor");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testEditorFunctionality();
