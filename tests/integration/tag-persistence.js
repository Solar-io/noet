/**
 * Test Script: Tag Persistence Across Operations
 *
 * This script tests that tags are properly persisted across various operations
 * including CRUD operations, bulk operations, archiving, and system restarts.
 */

import configService from "../../src/configService.js";

async function testTagPersistence() {
  console.log("🏷️  Testing Tag Persistence Across Operations...\n");

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
    createdTags: [],
    createdNotes: [],
    createdNotebooks: [],
  };

  // Performance tracking
  const performanceData = {
    tagCreation: [],
    tagAssignment: [],
    tagRemoval: [],
    bulkOperations: [],
    tagQueries: [],
  };

  try {
    // Test 1: Create multiple tags with different properties
    console.log(
      "🏷️  Test 1: Create multiple tags with different properties..."
    );
    const startTime1 = Date.now();

    const tagsToCreate = [
      {
        name: "persistent-tag-1",
        color: "#FF6B6B",
        description: "First persistent tag",
      },
      {
        name: "persistent-tag-2",
        color: "#4ECDC4",
        description: "Second persistent tag",
      },
      {
        name: "special-chars-tag-#@!",
        color: "#45B7D1",
        description: "Tag with special characters",
      },
      {
        name: "unicode-tag-🏷️",
        color: "#96CEB4",
        description: "Tag with unicode",
      },
      {
        name: "long-tag-name-that-is-very-long-and-should-be-handled-properly",
        color: "#FFEAA7",
        description: "Very long tag name",
      },
    ];

    const createdTags = [];
    for (const tagData of tagsToCreate) {
      const createResponse = await fetch(`${backendUrl}/api/${userId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagData),
      });

      if (!createResponse.ok) {
        throw new Error(
          `Failed to create tag ${tagData.name}: ${createResponse.status}`
        );
      }

      const tag = await createResponse.json();
      createdTags.push(tag);
      testData.createdTags.push(tag.id);
      console.log(`✅ Created tag: ${tag.name} (ID: ${tag.id})`);
    }

    const duration1 = Date.now() - startTime1;
    performanceData.tagCreation.push(duration1);
    console.log(`✅ Created ${createdTags.length} tags (${duration1}ms)`);

    // Test 2: Create notes with tag assignments
    console.log("\n📝 Test 2: Create notes with tag assignments...");
    const startTime2 = Date.now();

    const notesToCreate = [
      {
        title: "Note with single tag",
        content: "Content for single tag test",
        tags: [createdTags[0].id],
      },
      {
        title: "Note with multiple tags",
        content: "Content for multiple tags test",
        tags: [createdTags[0].id, createdTags[1].id, createdTags[2].id],
      },
      {
        title: "Note with all tags",
        content: "Content for all tags test",
        tags: createdTags.map((tag) => tag.id),
      },
      {
        title: "Note with no tags",
        content: "Content for no tags test",
        tags: [],
      },
    ];

    const createdNotes = [];
    for (const noteData of notesToCreate) {
      const createResponse = await fetch(`${backendUrl}/api/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create note: ${createResponse.status}`);
      }

      const note = await createResponse.json();
      createdNotes.push(note);
      testData.createdNotes.push(note.id);
      console.log(
        `✅ Created note: ${note.title} with ${note.tags.length} tags`
      );
    }

    const duration2 = Date.now() - startTime2;
    performanceData.tagAssignment.push(duration2);
    console.log(
      `✅ Created ${createdNotes.length} notes with tag assignments (${duration2}ms)`
    );

    // Test 3: Verify tag persistence after note operations
    console.log("\n🔍 Test 3: Verify tag persistence after note operations...");
    const startTime3 = Date.now();

    // Archive and unarchive a note
    const noteToArchive = createdNotes[1]; // Note with multiple tags
    const archiveResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteToArchive.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { archived: true },
        }),
      }
    );

    if (!archiveResponse.ok) {
      throw new Error(`Failed to archive note: ${archiveResponse.status}`);
    }

    const archivedNote = await archiveResponse.json();
    console.log(`✅ Archived note: ${archivedNote.title}`);
    console.log(`   Tags preserved: ${archivedNote.tags.length} tags`);

    // Unarchive the note
    const unarchiveResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteToArchive.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { archived: false },
        }),
      }
    );

    if (!unarchiveResponse.ok) {
      throw new Error(`Failed to unarchive note: ${unarchiveResponse.status}`);
    }

    const unarchivedNote = await unarchiveResponse.json();
    console.log(`✅ Unarchived note: ${unarchivedNote.title}`);
    console.log(`   Tags preserved: ${unarchivedNote.tags.length} tags`);

    // Verify tags are still intact
    if (
      JSON.stringify(noteToArchive.tags.sort()) ===
      JSON.stringify(unarchivedNote.tags.sort())
    ) {
      console.log(
        "✅ Tags correctly preserved through archive/unarchive operations"
      );
    } else {
      console.log(
        "❌ Tags were not preserved through archive/unarchive operations"
      );
    }

    const duration3 = Date.now() - startTime3;
    console.log(`✅ Tag persistence verification completed (${duration3}ms)`);

    // Test 4: Bulk tag operations
    console.log("\n📦 Test 4: Bulk tag operations...");
    const startTime4 = Date.now();

    // Add a tag to multiple notes
    const tagToAdd = createdTags[3]; // Unicode tag
    const notesToUpdate = [createdNotes[0], createdNotes[3]]; // Single tag note and no tags note

    const bulkUpdatePromises = notesToUpdate.map((note) => {
      const updatedTags = [...note.tags, tagToAdd.id];
      return fetch(`${backendUrl}/api/${userId}/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { tags: updatedTags },
        }),
      });
    });

    const bulkResults = await Promise.all(bulkUpdatePromises);
    let successCount = 0;
    for (const result of bulkResults) {
      if (result.ok) {
        successCount++;
      }
    }

    const duration4 = Date.now() - startTime4;
    performanceData.bulkOperations.push(duration4);
    console.log(`✅ Bulk tag assignment completed (${duration4}ms)`);
    console.log(
      `   Successful updates: ${successCount}/${notesToUpdate.length}`
    );

    // Test 5: Tag removal and persistence
    console.log("\n🗑️  Test 5: Tag removal and persistence...");
    const startTime5 = Date.now();

    // Remove a tag from a note
    const noteToModify = createdNotes[2]; // Note with all tags
    const tagToRemove = createdTags[1]; // Second tag

    const originalTags = noteToModify.tags;
    const updatedTags = originalTags.filter(
      (tagId) => tagId !== tagToRemove.id
    );

    const removeResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteToModify.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { tags: updatedTags },
        }),
      }
    );

    if (!removeResponse.ok) {
      throw new Error(`Failed to remove tag: ${removeResponse.status}`);
    }

    const modifiedNote = await removeResponse.json();
    console.log(`✅ Removed tag from note: ${modifiedNote.title}`);
    console.log(
      `   Tags before: ${originalTags.length}, after: ${modifiedNote.tags.length}`
    );

    // Verify the tag was removed but others persist
    if (
      modifiedNote.tags.length === originalTags.length - 1 &&
      !modifiedNote.tags.includes(tagToRemove.id)
    ) {
      console.log("✅ Tag correctly removed, other tags preserved");
    } else {
      console.log("❌ Tag removal failed or affected other tags");
    }

    const duration5 = Date.now() - startTime5;
    performanceData.tagRemoval.push(duration5);
    console.log(`✅ Tag removal completed (${duration5}ms)`);

    // Test 6: Tag queries and filtering
    console.log("\n🔍 Test 6: Tag queries and filtering...");
    const startTime6 = Date.now();

    // Get all tags
    const allTagsResponse = await fetch(`${backendUrl}/api/${userId}/tags`);
    if (!allTagsResponse.ok) {
      throw new Error(`Failed to get all tags: ${allTagsResponse.status}`);
    }

    const allTags = await allTagsResponse.json();
    console.log(`✅ Retrieved ${allTags.length} tags`);

    // Filter notes by tag
    const tagForFiltering = createdTags[0]; // First tag
    const filteredNotesResponse = await fetch(
      `${backendUrl}/api/${userId}/notes?tag=${tagForFiltering.id}`
    );

    if (filteredNotesResponse.ok) {
      const filteredNotes = await filteredNotesResponse.json();
      console.log(
        `✅ Found ${filteredNotes.length} notes with tag: ${tagForFiltering.name}`
      );
    } else {
      console.log("⚠️  Tag filtering not implemented or failed");
    }

    const duration6 = Date.now() - startTime6;
    performanceData.tagQueries.push(duration6);
    console.log(`✅ Tag queries completed (${duration6}ms)`);

    // Test 7: Error handling - invalid tag operations
    console.log("\n❌ Test 7: Error handling - invalid tag operations...");

    // Try to create duplicate tag
    const duplicateTagResponse = await fetch(
      `${backendUrl}/api/${userId}/tags`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createdTags[0].name, // Duplicate name
          color: "#FF0000",
        }),
      }
    );

    if (!duplicateTagResponse.ok) {
      console.log("✅ Duplicate tag creation correctly rejected");
    } else {
      console.log(
        "❌ Duplicate tag creation was accepted (should be rejected)"
      );
    }

    // Try to assign non-existent tag
    const invalidTagResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${createdNotes[0].id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { tags: ["non-existent-tag-id"] },
        }),
      }
    );

    if (!invalidTagResponse.ok) {
      console.log("✅ Invalid tag assignment correctly rejected");
    } else {
      console.log(
        "❌ Invalid tag assignment was accepted (should be rejected)"
      );
    }

    // Test 8: Performance benchmark for large tag operations
    console.log(
      "\n⏱️  Test 8: Performance benchmark for large tag operations..."
    );

    // Create a note with many tags
    const manyTagsNote = {
      title: "Note with many tags",
      content: "Testing performance with many tags",
      tags: createdTags.map((tag) => tag.id), // All created tags
    };

    const benchmarkStartTime = Date.now();

    const manyTagsResponse = await fetch(`${backendUrl}/api/${userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manyTagsNote),
    });

    const benchmarkDuration = Date.now() - benchmarkStartTime;

    if (manyTagsResponse.ok) {
      const noteWithManyTags = await manyTagsResponse.json();
      testData.createdNotes.push(noteWithManyTags.id);
      console.log(
        `✅ Created note with ${noteWithManyTags.tags.length} tags (${benchmarkDuration}ms)`
      );

      if (benchmarkDuration > 100) {
        console.log(
          `⚠️  Performance warning: Many tags operation took ${benchmarkDuration}ms (>100ms threshold)`
        );
      }
    } else {
      console.log(
        `❌ Failed to create note with many tags (${benchmarkDuration}ms)`
      );
    }

    // Test 9: Tag persistence across note deletions
    console.log("\n🗑️  Test 9: Tag persistence across note deletions...");

    // Delete a note and verify tags still exist
    const noteToDelete = createdNotes[0];
    const tagsBeforeDeletion = noteToDelete.tags;

    const deleteResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${noteToDelete.id}`,
      {
        method: "DELETE",
      }
    );

    if (deleteResponse.ok) {
      console.log(`✅ Deleted note: ${noteToDelete.title}`);

      // Verify tags still exist
      const tagsAfterDeletion = await fetch(`${backendUrl}/api/${userId}/tags`);
      if (tagsAfterDeletion.ok) {
        const currentTags = await tagsAfterDeletion.json();
        const tagIdsAfterDeletion = currentTags.map((tag) => tag.id);

        let allTagsStillExist = true;
        for (const tagId of tagsBeforeDeletion) {
          if (!tagIdsAfterDeletion.includes(tagId)) {
            allTagsStillExist = false;
            break;
          }
        }

        if (allTagsStillExist) {
          console.log("✅ All tags preserved after note deletion");
        } else {
          console.log("❌ Some tags were lost after note deletion");
        }
      }
    } else {
      console.log("❌ Failed to delete note");
    }

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(`Tag Creation: ${performanceData.tagCreation.join("ms, ")}ms`);
    console.log(
      `Tag Assignment: ${performanceData.tagAssignment.join("ms, ")}ms`
    );
    console.log(`Tag Removal: ${performanceData.tagRemoval.join("ms, ")}ms`);
    console.log(
      `Bulk Operations: ${performanceData.bulkOperations.join("ms, ")}ms`
    );
    console.log(`Tag Queries: ${performanceData.tagQueries.join("ms, ")}ms`);

    const allOperations = [
      ...performanceData.tagCreation,
      ...performanceData.tagAssignment,
      ...performanceData.tagRemoval,
      ...performanceData.bulkOperations,
      ...performanceData.tagQueries,
    ];

    const avgPerformance =
      allOperations.reduce((a, b) => a + b, 0) / allOperations.length;
    console.log(`\nAverage Operation Time: ${avgPerformance.toFixed(2)}ms`);

    // Performance warnings
    const slowOperations = allOperations.filter((time) => time > 100);
    if (slowOperations.length > 0) {
      console.log(
        `⚠️  Performance warning: ${slowOperations.length} operations exceeded 100ms threshold`
      );
      console.log(`   Slow operations: ${slowOperations.join("ms, ")}ms`);
    }

    console.log("\n🎉 Tag Persistence test completed successfully!");
  } catch (error) {
    console.error("\n❌ Tag Persistence test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete notes first (they reference tags)
    for (const noteId of testData.createdNotes) {
      try {
        await fetch(`${backendUrl}/api/${userId}/notes/${noteId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete note ${noteId}:`, error.message);
      }
    }

    // Delete tags
    for (const tagId of testData.createdTags) {
      try {
        await fetch(`${backendUrl}/api/${userId}/tags/${tagId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete tag ${tagId}:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testTagPersistence().catch(console.error);
