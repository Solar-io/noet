/**
 * Test Script: Editor State Preservation During Versioning
 *
 * This script tests that the editor state is properly preserved and restored
 * during version operations, including cursor position, selection, and content.
 */

import configService from "../../src/configService.js";

async function testEditorStateVersioning() {
  console.log("🧪 Testing Editor State Preservation During Versioning...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const userId = "user-1";
  const testData = {
    createdNotes: [],
    createdVersions: [],
  };

  // Performance tracking
  const performanceData = {
    versionCreation: [],
    versionRestoration: [],
    statePreservation: [],
  };

  try {
    // Test 1: Create a note with complex editor state
    console.log("📝 Test 1: Create note with complex editor state...");
    const startTime1 = Date.now();

    const complexContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is a " },
            { type: "text", text: "complex", marks: [{ type: "bold" }] },
            { type: "text", text: " document with " },
            { type: "text", text: "formatting", marks: [{ type: "italic" }] },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Section Header" }],
        },
        {
          type: "codeBlock",
          attrs: { language: "javascript" },
          content: [{ type: "text", text: 'console.log("Hello World");' }],
        },
      ],
    };

    const editorState = {
      selection: { from: 15, to: 23 }, // Selected "complex"
      cursorPosition: 23,
      scrollPosition: 0,
      activeMarks: ["bold"],
      focusedElement: "editor",
    };

    const createResponse = await fetch(`${backendUrl}/api/${userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Editor State Test Note",
        content: complexContent,
        editorState: editorState,
        tags: ["test-versioning", "editor-state"],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const testNote = await createResponse.json();
    testData.createdNotes.push(testNote.id);

    const duration1 = Date.now() - startTime1;
    console.log(`✅ Created note with editor state (${duration1}ms)`);
    console.log(`   Note ID: ${testNote.id}`);
    console.log(
      `   Initial selection: ${JSON.stringify(editorState.selection)}`
    );

    // Test 2: Create initial version
    console.log("\n📋 Test 2: Create initial version...");
    const startTime2 = Date.now();

    const versionResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Initial Version",
          content: complexContent,
          editorState: editorState,
          description: "Initial version with editor state",
        }),
      }
    );

    if (!versionResponse.ok) {
      throw new Error(`Failed to create version: ${versionResponse.status}`);
    }

    const initialVersion = await versionResponse.json();
    testData.createdVersions.push(initialVersion.id);

    const duration2 = Date.now() - startTime2;
    performanceData.versionCreation.push(duration2);
    console.log(`✅ Created initial version (${duration2}ms)`);
    console.log(`   Version ID: ${initialVersion.id}`);

    // Test 3: Update note content and editor state
    console.log("\n✏️ Test 3: Update note content and editor state...");

    const updatedContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "This is an " },
            {
              type: "text",
              text: "updated complex",
              marks: [{ type: "bold" }],
            },
            { type: "text", text: " document with " },
            {
              type: "text",
              text: "more formatting",
              marks: [{ type: "italic" }],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Updated Section Header" }],
        },
        {
          type: "codeBlock",
          attrs: { language: "javascript" },
          content: [
            { type: "text", text: 'console.log("Updated Hello World");' },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "New paragraph added" }],
        },
      ],
    };

    const updatedEditorState = {
      selection: { from: 45, to: 58 }, // Selected "more formatting"
      cursorPosition: 58,
      scrollPosition: 120,
      activeMarks: ["italic"],
      focusedElement: "editor",
    };

    const updateResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: updatedContent,
          editorState: updatedEditorState,
          metadata: { lastModified: new Date().toISOString() },
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Failed to update note: ${updateResponse.status}`);
    }

    console.log("✅ Updated note content and editor state");
    console.log(
      `   Updated selection: ${JSON.stringify(updatedEditorState.selection)}`
    );
    console.log(`   Scroll position: ${updatedEditorState.scrollPosition}`);

    // Test 4: Create second version with updated state
    console.log("\n📋 Test 4: Create second version...");
    const startTime4 = Date.now();

    const version2Response = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated Version",
          content: updatedContent,
          editorState: updatedEditorState,
          description: "Updated version with new editor state",
        }),
      }
    );

    if (!version2Response.ok) {
      throw new Error(
        `Failed to create second version: ${version2Response.status}`
      );
    }

    const secondVersion = await version2Response.json();
    testData.createdVersions.push(secondVersion.id);

    const duration4 = Date.now() - startTime4;
    performanceData.versionCreation.push(duration4);
    console.log(`✅ Created second version (${duration4}ms)`);

    // Test 5: Restore to first version and verify state preservation
    console.log("\n🔄 Test 5: Restore to first version and verify state...");
    const startTime5 = Date.now();

    const restoreResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions/${initialVersion.id}/restore`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preserveEditorState: true,
        }),
      }
    );

    if (!restoreResponse.ok) {
      throw new Error(`Failed to restore version: ${restoreResponse.status}`);
    }

    const restoredNote = await restoreResponse.json();
    const duration5 = Date.now() - startTime5;
    performanceData.versionRestoration.push(duration5);

    console.log(`✅ Restored to first version (${duration5}ms)`);

    // Verify restored editor state
    const verifyResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}`
    );
    const verifiedNote = await verifyResponse.json();

    if (verifiedNote.editorState) {
      const restored = verifiedNote.editorState;
      const original = editorState;

      console.log("🔍 Verifying restored editor state:");
      console.log(
        `   Selection: ${JSON.stringify(
          restored.selection
        )} (expected: ${JSON.stringify(original.selection)})`
      );
      console.log(
        `   Cursor: ${restored.cursorPosition} (expected: ${original.cursorPosition})`
      );
      console.log(
        `   Scroll: ${restored.scrollPosition} (expected: ${original.scrollPosition})`
      );

      if (
        JSON.stringify(restored.selection) ===
          JSON.stringify(original.selection) &&
        restored.cursorPosition === original.cursorPosition
      ) {
        console.log("✅ Editor state correctly restored");
      } else {
        console.log("❌ Editor state restoration failed");
      }
    } else {
      console.log("❌ No editor state found in restored note");
    }

    // Test 6: Test concurrent version operations
    console.log("\n⚡ Test 6: Test concurrent version operations...");
    const startTime6 = Date.now();

    const concurrentOperations = [
      fetch(`${backendUrl}/api/${userId}/notes/${testNote.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Concurrent Version 1",
          content: complexContent,
          editorState: { ...editorState, cursorPosition: 30 },
          description: "Concurrent version test 1",
        }),
      }),
      fetch(`${backendUrl}/api/${userId}/notes/${testNote.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Concurrent Version 2",
          content: updatedContent,
          editorState: { ...updatedEditorState, cursorPosition: 40 },
          description: "Concurrent version test 2",
        }),
      }),
    ];

    const concurrentResults = await Promise.allSettled(concurrentOperations);
    const duration6 = Date.now() - startTime6;

    let successCount = 0;
    for (const result of concurrentResults) {
      if (result.status === "fulfilled" && result.value.ok) {
        successCount++;
        const version = await result.value.json();
        testData.createdVersions.push(version.id);
      }
    }

    console.log(`✅ Concurrent operations completed (${duration6}ms)`);
    console.log(`   Successful operations: ${successCount}/2`);

    // Test 7: Error handling - invalid editor state
    console.log("\n❌ Test 7: Error handling - invalid editor state...");

    const invalidStateResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editorState: {
            selection: { from: -1, to: 999999 }, // Invalid selection
            cursorPosition: "invalid",
            scrollPosition: null,
          },
        }),
      }
    );

    if (!invalidStateResponse.ok) {
      console.log("✅ Invalid editor state correctly rejected");
    } else {
      console.log("❌ Invalid editor state was accepted (should be rejected)");
    }

    // Test 8: Performance benchmark for large editor states
    console.log(
      "\n⏱️ Test 8: Performance benchmark for large editor states..."
    );

    const largeEditorState = {
      selection: { from: 100, to: 200 },
      cursorPosition: 200,
      scrollPosition: 500,
      activeMarks: ["bold", "italic", "underline"],
      focusedElement: "editor",
      history: Array(100)
        .fill(null)
        .map((_, i) => ({
          action: "insert",
          position: i,
          text: `change${i}`,
        })),
      collaborators: Array(10)
        .fill(null)
        .map((_, i) => ({
          id: `user-${i}`,
          cursor: i * 10,
          selection: { from: i * 10, to: (i + 1) * 10 },
        })),
    };

    const benchmarkStartTime = Date.now();

    const benchmarkResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editorState: largeEditorState,
        }),
      }
    );

    const benchmarkDuration = Date.now() - benchmarkStartTime;
    performanceData.statePreservation.push(benchmarkDuration);

    if (benchmarkResponse.ok) {
      console.log(`✅ Large editor state processed (${benchmarkDuration}ms)`);
      if (benchmarkDuration > 100) {
        console.log(
          `⚠️  Performance warning: Large state took ${benchmarkDuration}ms (>100ms threshold)`
        );
      }
    } else {
      console.log(
        `❌ Large editor state processing failed (${benchmarkDuration}ms)`
      );
    }

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(
      `Version Creation: ${performanceData.versionCreation.join("ms, ")}ms`
    );
    console.log(
      `Version Restoration: ${performanceData.versionRestoration.join(
        "ms, "
      )}ms`
    );
    console.log(
      `State Preservation: ${performanceData.statePreservation.join("ms, ")}ms`
    );

    const avgVersionCreation =
      performanceData.versionCreation.reduce((a, b) => a + b, 0) /
      performanceData.versionCreation.length;
    const avgVersionRestoration =
      performanceData.versionRestoration.reduce((a, b) => a + b, 0) /
      performanceData.versionRestoration.length;
    const avgStatePreservation =
      performanceData.statePreservation.reduce((a, b) => a + b, 0) /
      performanceData.statePreservation.length;

    console.log(`\nAverages:`);
    console.log(`  Version Creation: ${avgVersionCreation.toFixed(2)}ms`);
    console.log(`  Version Restoration: ${avgVersionRestoration.toFixed(2)}ms`);
    console.log(`  State Preservation: ${avgStatePreservation.toFixed(2)}ms`);

    // Performance warnings
    if (avgVersionCreation > 100) {
      console.log(
        `⚠️  Performance warning: Average version creation exceeds 100ms threshold`
      );
    }
    if (avgVersionRestoration > 100) {
      console.log(
        `⚠️  Performance warning: Average version restoration exceeds 100ms threshold`
      );
    }
    if (avgStatePreservation > 100) {
      console.log(
        `⚠️  Performance warning: Average state preservation exceeds 100ms threshold`
      );
    }

    console.log("\n🎉 Editor State Versioning test completed successfully!");
  } catch (error) {
    console.error("\n❌ Editor State Versioning test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete versions first
    for (const versionId of testData.createdVersions) {
      try {
        await fetch(`${backendUrl}/api/${userId}/versions/${versionId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete version ${versionId}:`, error.message);
      }
    }

    // Delete notes
    for (const noteId of testData.createdNotes) {
      try {
        await fetch(`${backendUrl}/api/${userId}/notes/${noteId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete note ${noteId}:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testEditorStateVersioning().catch(console.error);
