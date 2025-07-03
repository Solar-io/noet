// Test the frontend-backend connection for delete functionality
// Open browser console and paste this to test

console.log("🔍 Testing frontend-backend connection...");

// Test 1: Check if configService can discover backend
async function testBackendConnection() {
  try {
    // Try to access the configService directly if available
    if (window.configService) {
      const backendUrl = await window.configService.getBackendUrl();
      console.log("✅ Backend URL discovered:", backendUrl);
      return backendUrl;
    } else {
      console.log(
        "⚠️ configService not available on window, trying manual discovery..."
      );

      // Manual discovery
      const ports = [3005, 3004, 3003];
      for (const port of ports) {
        try {
          const response = await fetch(`http://localhost:${port}/api/health`);
          if (response.ok) {
            console.log(`✅ Backend found on port ${port}`);
            return `http://localhost:${port}`;
          }
        } catch (e) {
          console.log(`❌ Port ${port} not accessible`);
        }
      }
      throw new Error("No backend found");
    }
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    return null;
  }
}

// Test 2: Test the delete API call
async function testDeleteAPI(backendUrl) {
  if (!backendUrl) {
    console.error("❌ No backend URL available for delete test");
    return;
  }

  try {
    // First create a test note
    console.log("📝 Creating test note...");
    const createResponse = await fetch(`${backendUrl}/api/demo-user/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "🧪 Browser Console Test Note",
        content:
          "This note was created from browser console to test delete functionality",
        tags: ["console-test"],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log("✅ Test note created:", newNote.id);

    // Test the delete (soft delete)
    console.log("🗑️ Testing soft delete...");
    const deleteResponse = await fetch(
      `${backendUrl}/api/demo-user/notes/${newNote.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            deleted: true,
            deletedAt: new Date().toISOString(),
          },
        }),
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete note: ${deleteResponse.status}`);
    }

    console.log("✅ Soft delete successful");

    // Verify it's in trash
    console.log("🔍 Checking trash...");
    const trashResponse = await fetch(
      `${backendUrl}/api/demo-user/notes?deleted=true`
    );
    const trashNotes = await trashResponse.json();
    const deletedNote = trashNotes.find((note) => note.id === newNote.id);

    if (deletedNote) {
      console.log("✅ Note found in trash:", deletedNote.title);
    } else {
      console.log("❌ Note not found in trash");
    }

    // Clean up
    await fetch(`${backendUrl}/api/demo-user/notes/${newNote.id}`, {
      method: "DELETE",
    });
    console.log("🧹 Test note cleaned up");
  } catch (error) {
    console.error("❌ Delete API test failed:", error);
  }
}

// Run tests
(async () => {
  console.log("🚀 Starting tests...");
  const backendUrl = await testBackendConnection();
  if (backendUrl) {
    await testDeleteAPI(backendUrl);
  }
  console.log("✅ Tests completed");
})();
