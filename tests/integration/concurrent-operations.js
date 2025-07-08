/**
 * Test Script: Concurrent User Operations
 *
 * This script tests the system's behavior under concurrent user operations,
 * including race conditions, data consistency, and performance under load.
 */

import configService from "../../src/configService.js";

async function testConcurrentOperations() {
  console.log("⚡ Testing Concurrent User Operations...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const users = ["user-1", "user-2", "admin-1"];
  const testData = {
    createdNotes: [],
    createdTags: [],
    createdNotebooks: [],
    createdVersions: [],
  };

  // Performance tracking
  const performanceData = {
    concurrentCreation: [],
    concurrentUpdates: [],
    concurrentDeletion: [],
    raceConditions: [],
    loadTesting: [],
  };

  // Conflict tracking
  const conflicts = {
    noteConflicts: 0,
    tagConflicts: 0,
    versionConflicts: 0,
    dataInconsistencies: 0,
  };

  try {
    // Test 1: Concurrent note creation by multiple users
    console.log("📝 Test 1: Concurrent note creation by multiple users...");
    const startTime1 = Date.now();

    const concurrentNoteCreations = [];
    for (let i = 0; i < 10; i++) {
      for (const userId of users) {
        concurrentNoteCreations.push(
          fetch(`${backendUrl}/api/${userId}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: `Concurrent Note ${i} by ${userId}`,
              content: `Content created concurrently by ${userId} at ${new Date().toISOString()}`,
              tags: [],
            }),
          })
        );
      }
    }

    const results1 = await Promise.allSettled(concurrentNoteCreations);
    const duration1 = Date.now() - startTime1;
    performanceData.concurrentCreation.push(duration1);

    let successCount = 0;
    let failureCount = 0;

    for (const result of results1) {
      if (result.status === "fulfilled" && result.value.ok) {
        successCount++;
        const note = await result.value.json();
        testData.createdNotes.push(note.id);
      } else {
        failureCount++;
      }
    }

    console.log(`✅ Concurrent note creation completed (${duration1}ms)`);
    console.log(`   Successful: ${successCount}, Failed: ${failureCount}`);
    console.log(`   Total operations: ${concurrentNoteCreations.length}`);

    // Test 2: Concurrent updates to the same note
    console.log("\n✏️ Test 2: Concurrent updates to the same note...");

    if (testData.createdNotes.length > 0) {
      const targetNoteId = testData.createdNotes[0];
      const startTime2 = Date.now();

      const concurrentUpdates = [];
      for (let i = 0; i < 5; i++) {
        for (const userId of users) {
          concurrentUpdates.push(
            fetch(`${backendUrl}/api/${userId}/notes/${targetNoteId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                metadata: {
                  title: `Updated by ${userId} at ${Date.now()}`,
                  lastModified: new Date().toISOString(),
                },
              }),
            })
          );
        }
      }

      const results2 = await Promise.allSettled(concurrentUpdates);
      const duration2 = Date.now() - startTime2;
      performanceData.concurrentUpdates.push(duration2);

      let updateSuccessCount = 0;
      let updateFailureCount = 0;
      let conflictCount = 0;

      for (const result of results2) {
        if (result.status === "fulfilled") {
          if (result.value.ok) {
            updateSuccessCount++;
          } else if (result.value.status === 409) {
            // Conflict
            conflictCount++;
            conflicts.noteConflicts++;
          } else {
            updateFailureCount++;
          }
        } else {
          updateFailureCount++;
        }
      }

      console.log(`✅ Concurrent note updates completed (${duration2}ms)`);
      console.log(
        `   Successful: ${updateSuccessCount}, Failed: ${updateFailureCount}, Conflicts: ${conflictCount}`
      );

      // Verify final state consistency
      const finalStateResponse = await fetch(
        `${backendUrl}/api/${users[0]}/notes/${targetNoteId}`
      );
      if (finalStateResponse.ok) {
        const finalNote = await finalStateResponse.json();
        console.log(`   Final note title: "${finalNote.title}"`);
        console.log(`   Final update time: ${finalNote.lastModified}`);
      }
    }

    // Test 3: Concurrent tag operations
    console.log("\n🏷️  Test 3: Concurrent tag operations...");
    const startTime3 = Date.now();

    const concurrentTagOperations = [];

    // Create tags concurrently
    for (let i = 0; i < 5; i++) {
      for (const userId of users) {
        concurrentTagOperations.push(
          fetch(`${backendUrl}/api/${userId}/tags`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `concurrent-tag-${i}-${userId}`,
              color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
              description: `Tag created by ${userId}`,
            }),
          })
        );
      }
    }

    const results3 = await Promise.allSettled(concurrentTagOperations);
    const duration3 = Date.now() - startTime3;

    let tagSuccessCount = 0;
    let tagFailureCount = 0;

    for (const result of results3) {
      if (result.status === "fulfilled" && result.value.ok) {
        tagSuccessCount++;
        const tag = await result.value.json();
        testData.createdTags.push(tag.id);
      } else {
        tagFailureCount++;
        if (result.status === "fulfilled" && result.value.status === 409) {
          conflicts.tagConflicts++;
        }
      }
    }

    console.log(`✅ Concurrent tag operations completed (${duration3}ms)`);
    console.log(
      `   Successful: ${tagSuccessCount}, Failed: ${tagFailureCount}`
    );

    // Test 4: Race condition simulation - version creation
    console.log("\n🏁 Test 4: Race condition simulation - version creation...");

    if (testData.createdNotes.length > 0) {
      const targetNoteId = testData.createdNotes[1] || testData.createdNotes[0];
      const startTime4 = Date.now();

      const raceConditionVersions = [];

      // Multiple users trying to create versions simultaneously
      for (let i = 0; i < 3; i++) {
        for (const userId of users) {
          raceConditionVersions.push(
            fetch(
              `${backendUrl}/api/${userId}/notes/${targetNoteId}/versions`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: `Race Version ${i} by ${userId}`,
                  content: `Version created in race condition by ${userId}`,
                  description: `Race condition test version ${i}`,
                }),
              }
            )
          );
        }
      }

      const results4 = await Promise.allSettled(raceConditionVersions);
      const duration4 = Date.now() - startTime4;
      performanceData.raceConditions.push(duration4);

      let versionSuccessCount = 0;
      let versionFailureCount = 0;
      let versionConflictCount = 0;

      for (const result of results4) {
        if (result.status === "fulfilled") {
          if (result.value.ok) {
            versionSuccessCount++;
            const version = await result.value.json();
            testData.createdVersions.push(version.id);
          } else if (result.value.status === 409) {
            versionConflictCount++;
            conflicts.versionConflicts++;
          } else {
            versionFailureCount++;
          }
        } else {
          versionFailureCount++;
        }
      }

      console.log(`✅ Race condition version test completed (${duration4}ms)`);
      console.log(
        `   Successful: ${versionSuccessCount}, Failed: ${versionFailureCount}, Conflicts: ${versionConflictCount}`
      );
    }

    // Test 5: Concurrent bulk operations
    console.log("\n📦 Test 5: Concurrent bulk operations...");
    const startTime5 = Date.now();

    const bulkOperations = [];

    // Each user performs bulk operations
    for (const userId of users) {
      // Bulk note creation
      const noteIds = testData.createdNotes.filter(
        (_, index) => index % users.length === users.indexOf(userId)
      );

      if (noteIds.length > 0) {
        bulkOperations.push(
          fetch(`${backendUrl}/api/${userId}/notes/bulk`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              noteIds: noteIds.slice(0, 3), // Limit to first 3 notes
              updates: {
                starred: true,
                archived: false,
                tags: testData.createdTags.slice(0, 2), // Add first 2 tags
              },
            }),
          })
        );
      }
    }

    const results5 = await Promise.allSettled(bulkOperations);
    const duration5 = Date.now() - startTime5;

    let bulkSuccessCount = 0;
    let bulkFailureCount = 0;

    for (const result of results5) {
      if (result.status === "fulfilled" && result.value.ok) {
        bulkSuccessCount++;
      } else {
        bulkFailureCount++;
      }
    }

    console.log(`✅ Concurrent bulk operations completed (${duration5}ms)`);
    console.log(
      `   Successful: ${bulkSuccessCount}, Failed: ${bulkFailureCount}`
    );

    // Test 6: Load testing with rapid sequential operations
    console.log(
      "\n📈 Test 6: Load testing with rapid sequential operations..."
    );
    const startTime6 = Date.now();

    const loadTestOperations = [];
    const operationsPerUser = 20;

    for (const userId of users) {
      for (let i = 0; i < operationsPerUser; i++) {
        // Mix of different operations
        if (i % 4 === 0) {
          // Create note
          loadTestOperations.push(
            fetch(`${backendUrl}/api/${userId}/notes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: `Load Test Note ${i}`,
                content: `Content ${i}`,
                tags: [],
              }),
            })
          );
        } else if (i % 4 === 1 && testData.createdNotes.length > 0) {
          // Update note
          const randomNoteId =
            testData.createdNotes[
              Math.floor(Math.random() * testData.createdNotes.length)
            ];
          loadTestOperations.push(
            fetch(`${backendUrl}/api/${userId}/notes/${randomNoteId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                metadata: { title: `Load Updated ${i}` },
              }),
            })
          );
        } else if (i % 4 === 2) {
          // Get notes
          loadTestOperations.push(fetch(`${backendUrl}/api/${userId}/notes`));
        } else {
          // Get tags
          loadTestOperations.push(fetch(`${backendUrl}/api/${userId}/tags`));
        }
      }
    }

    // Execute all operations
    const results6 = await Promise.allSettled(loadTestOperations);
    const duration6 = Date.now() - startTime6;
    performanceData.loadTesting.push(duration6);

    let loadSuccessCount = 0;
    let loadFailureCount = 0;

    for (const result of results6) {
      if (result.status === "fulfilled" && result.value.ok) {
        loadSuccessCount++;
        // If it's a create operation, track the created item
        if (result.value.status === 200 || result.value.status === 201) {
          try {
            const data = await result.value.json();
            if (data.id && data.title) {
              testData.createdNotes.push(data.id);
            }
          } catch (e) {
            // Ignore parsing errors for non-JSON responses
          }
        }
      } else {
        loadFailureCount++;
      }
    }

    console.log(`✅ Load testing completed (${duration6}ms)`);
    console.log(`   Total operations: ${loadTestOperations.length}`);
    console.log(
      `   Successful: ${loadSuccessCount}, Failed: ${loadFailureCount}`
    );
    console.log(
      `   Operations per second: ${(
        loadTestOperations.length /
        (duration6 / 1000)
      ).toFixed(2)}`
    );

    // Test 7: Data consistency verification
    console.log("\n🔍 Test 7: Data consistency verification...");

    // Check if all users see the same data
    const consistencyChecks = [];

    for (const userId of users) {
      consistencyChecks.push(
        fetch(`${backendUrl}/api/${userId}/notes`).then((r) => r.json()),
        fetch(`${backendUrl}/api/${userId}/tags`).then((r) => r.json())
      );
    }

    const consistencyResults = await Promise.allSettled(consistencyChecks);

    // Analyze consistency
    const userNoteCounts = [];
    const userTagCounts = [];

    for (let i = 0; i < users.length; i++) {
      const notesResult = consistencyResults[i * 2];
      const tagsResult = consistencyResults[i * 2 + 1];

      if (notesResult.status === "fulfilled") {
        userNoteCounts.push(notesResult.value.length);
      }
      if (tagsResult.status === "fulfilled") {
        userTagCounts.push(tagsResult.value.length);
      }
    }

    const notesConsistent = userNoteCounts.every(
      (count) => count === userNoteCounts[0]
    );
    const tagsConsistent = userTagCounts.every(
      (count) => count === userTagCounts[0]
    );

    console.log(`✅ Data consistency check completed`);
    console.log(
      `   Notes consistency: ${
        notesConsistent ? "✅" : "❌"
      } (counts: ${userNoteCounts.join(", ")})`
    );
    console.log(
      `   Tags consistency: ${
        tagsConsistent ? "✅" : "❌"
      } (counts: ${userTagCounts.join(", ")})`
    );

    if (!notesConsistent || !tagsConsistent) {
      conflicts.dataInconsistencies++;
    }

    // Test 8: Stress test - maximum concurrent operations
    console.log("\n💪 Test 8: Stress test - maximum concurrent operations...");
    const startTime8 = Date.now();

    const stressTestOperations = [];
    const maxConcurrentOps = 50;

    for (let i = 0; i < maxConcurrentOps; i++) {
      const userId = users[i % users.length];
      stressTestOperations.push(
        fetch(`${backendUrl}/api/${userId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Stress Test Note ${i}`,
            content: `Stress test content ${i}`,
            tags: [],
          }),
        })
      );
    }

    const results8 = await Promise.allSettled(stressTestOperations);
    const duration8 = Date.now() - startTime8;

    let stressSuccessCount = 0;
    let stressFailureCount = 0;

    for (const result of results8) {
      if (result.status === "fulfilled" && result.value.ok) {
        stressSuccessCount++;
        const note = await result.value.json();
        testData.createdNotes.push(note.id);
      } else {
        stressFailureCount++;
      }
    }

    console.log(`✅ Stress test completed (${duration8}ms)`);
    console.log(`   Operations: ${maxConcurrentOps}`);
    console.log(
      `   Successful: ${stressSuccessCount}, Failed: ${stressFailureCount}`
    );
    console.log(
      `   Success rate: ${(
        (stressSuccessCount / maxConcurrentOps) *
        100
      ).toFixed(1)}%`
    );
    console.log(
      `   Average time per operation: ${(duration8 / maxConcurrentOps).toFixed(
        2
      )}ms`
    );

    // Test 9: Cleanup race conditions
    console.log("\n🧹 Test 9: Cleanup race conditions...");
    const startTime9 = Date.now();

    // Multiple users trying to delete the same resources
    const cleanupOperations = [];
    const notesToDelete = testData.createdNotes.slice(0, 5); // First 5 notes

    for (const noteId of notesToDelete) {
      for (const userId of users) {
        cleanupOperations.push(
          fetch(`${backendUrl}/api/${userId}/notes/${noteId}`, {
            method: "DELETE",
          })
        );
      }
    }

    const results9 = await Promise.allSettled(cleanupOperations);
    const duration9 = Date.now() - startTime9;

    let cleanupSuccessCount = 0;
    let cleanupFailureCount = 0;
    let cleanupNotFoundCount = 0;

    for (const result of results9) {
      if (result.status === "fulfilled") {
        if (result.value.ok) {
          cleanupSuccessCount++;
        } else if (result.value.status === 404) {
          cleanupNotFoundCount++; // Expected for duplicate deletion attempts
        } else {
          cleanupFailureCount++;
        }
      } else {
        cleanupFailureCount++;
      }
    }

    console.log(`✅ Cleanup race conditions test completed (${duration9}ms)`);
    console.log(`   Successful deletions: ${cleanupSuccessCount}`);
    console.log(`   Not found (expected): ${cleanupNotFoundCount}`);
    console.log(`   Failures: ${cleanupFailureCount}`);

    // Remove successfully deleted notes from tracking
    for (const noteId of notesToDelete) {
      const index = testData.createdNotes.indexOf(noteId);
      if (index > -1) {
        testData.createdNotes.splice(index, 1);
      }
    }

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(
      `Concurrent Creation: ${performanceData.concurrentCreation.join(
        "ms, "
      )}ms`
    );
    console.log(
      `Concurrent Updates: ${performanceData.concurrentUpdates.join("ms, ")}ms`
    );
    console.log(
      `Race Conditions: ${performanceData.raceConditions.join("ms, ")}ms`
    );
    console.log(`Load Testing: ${performanceData.loadTesting.join("ms, ")}ms`);

    const allOperations = [
      ...performanceData.concurrentCreation,
      ...performanceData.concurrentUpdates,
      ...performanceData.raceConditions,
      ...performanceData.loadTesting,
    ];

    if (allOperations.length > 0) {
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
    }

    console.log("\n⚠️  Conflict Summary:");
    console.log("=====================");
    console.log(`Note Conflicts: ${conflicts.noteConflicts}`);
    console.log(`Tag Conflicts: ${conflicts.tagConflicts}`);
    console.log(`Version Conflicts: ${conflicts.versionConflicts}`);
    console.log(`Data Inconsistencies: ${conflicts.dataInconsistencies}`);

    const totalConflicts = Object.values(conflicts).reduce((a, b) => a + b, 0);
    console.log(`Total Conflicts: ${totalConflicts}`);

    if (totalConflicts === 0) {
      console.log("✅ No conflicts detected - excellent concurrency handling!");
    } else if (totalConflicts < 10) {
      console.log(
        "⚠️  Some conflicts detected - normal for high concurrency scenarios"
      );
    } else {
      console.log(
        "❌ High number of conflicts - may indicate concurrency issues"
      );
    }

    console.log("\n🎉 Concurrent Operations test completed successfully!");
  } catch (error) {
    console.error("\n❌ Concurrent Operations test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup remaining test data
    console.log("\n🧹 Final cleanup...");

    const cleanupPromises = [];

    // Delete remaining notes
    for (const noteId of testData.createdNotes) {
      cleanupPromises.push(
        fetch(`${backendUrl}/api/${users[0]}/notes/${noteId}`, {
          method: "DELETE",
        }).catch((err) =>
          console.warn(`Failed to delete note ${noteId}:`, err.message)
        )
      );
    }

    // Delete tags
    for (const tagId of testData.createdTags) {
      cleanupPromises.push(
        fetch(`${backendUrl}/api/${users[0]}/tags/${tagId}`, {
          method: "DELETE",
        }).catch((err) =>
          console.warn(`Failed to delete tag ${tagId}:`, err.message)
        )
      );
    }

    // Delete versions
    for (const versionId of testData.createdVersions) {
      cleanupPromises.push(
        fetch(`${backendUrl}/api/${users[0]}/versions/${versionId}`, {
          method: "DELETE",
        }).catch((err) =>
          console.warn(`Failed to delete version ${versionId}:`, err.message)
        )
      );
    }

    // Delete notebooks
    for (const notebookId of testData.createdNotebooks) {
      cleanupPromises.push(
        fetch(`${backendUrl}/api/${users[0]}/notebooks/${notebookId}`, {
          method: "DELETE",
        }).catch((err) =>
          console.warn(`Failed to delete notebook ${notebookId}:`, err.message)
        )
      );
    }

    await Promise.allSettled(cleanupPromises);
    console.log("✅ Final cleanup completed");
  }
}

// Run the test
testConcurrentOperations().catch(console.error);
