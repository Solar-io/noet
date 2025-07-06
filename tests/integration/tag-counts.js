#!/usr/bin/env node

import configService from "./src/configService.js";

async function testTagCounts() {
  console.log("🧪 Testing Tag Count Feature...");
  console.log("");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log("✅ Backend URL:", backendUrl);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error.message);
    return;
  }

  const testUserId = "demo-user";

  try {
    // Test 1: Get tags with counts
    console.log("📋 Test 1: Fetch tags with note counts...");
    const tagsResponse = await fetch(`${backendUrl}/api/${testUserId}/tags`);

    if (!tagsResponse.ok) {
      throw new Error(`Failed to fetch tags: ${tagsResponse.status}`);
    }

    const tags = await tagsResponse.json();
    console.log(`📚 Found ${tags.length} tags`);

    tags.forEach((tag) => {
      console.log(
        `  🏷️  ${tag.name}: noteCount=${tag.noteCount} (${
          tag.noteCount > 0 ? "✅" : "⚠️"
        })`
      );
    });

    // Test 2: Get notes to verify tag counts are correct
    console.log("");
    console.log("📋 Test 2: Verify counts by scanning notes...");
    const notesResponse = await fetch(`${backendUrl}/api/${testUserId}/notes`);

    if (!notesResponse.ok) {
      throw new Error(`Failed to fetch notes: ${notesResponse.status}`);
    }

    const notes = await notesResponse.json();
    console.log(`📝 Found ${notes.length} notes`);

    // Count tags manually
    const manualTagCounts = {};
    console.log("📝 Scanning notes for tags...");
    notes.forEach((note, index) => {
      console.log(`  Note ${index + 1}: ${note.title || "Untitled"}`);
      if (note.tags && Array.isArray(note.tags)) {
        console.log(`    Tags: [${note.tags.join(", ")}]`);
        note.tags.forEach((tagRef) => {
          // Handle both string tags and tag IDs
          let tagKey;
          if (typeof tagRef === "string") {
            // Find tag by name or ID
            const tag = tags.find((t) => t.name === tagRef || t.id === tagRef);
            tagKey = tag ? tag.name : tagRef;
          } else {
            tagKey = tagRef;
          }

          manualTagCounts[tagKey] = (manualTagCounts[tagKey] || 0) + 1;
        });
      } else {
        console.log(`    Tags: none`);
      }
    });

    console.log("");
    console.log("🏷️ Found tags in notes:");
    Object.entries(manualTagCounts).forEach(([tagName, count]) => {
      console.log(`  ${tagName}: ${count} notes`);
    });

    console.log("");
    console.log("📊 Manual count vs API count comparison:");
    let allCorrect = true;

    tags.forEach((tag) => {
      const manualCount = manualTagCounts[tag.name] || 0;
      const apiCount = tag.noteCount || 0;
      const isCorrect = manualCount === apiCount;

      console.log(
        `  🏷️  ${tag.name}: manual=${manualCount}, api=${apiCount} ${
          isCorrect ? "✅" : "❌"
        }`
      );

      if (!isCorrect) {
        allCorrect = false;
      }
    });

    // Test 3: Performance test
    console.log("");
    console.log("📋 Test 3: Performance test...");
    const startTime = Date.now();

    for (let i = 0; i < 5; i++) {
      const perfResponse = await fetch(`${backendUrl}/api/${testUserId}/tags`);
      await perfResponse.json();
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 5;

    console.log(
      `⏱️  Average response time: ${avgTime.toFixed(2)}ms ${
        avgTime < 1000 ? "✅" : "⚠️"
      }`
    );

    console.log("");
    console.log("🎉 TAG COUNT TEST RESULTS:");
    console.log(`✅ Tags loaded successfully: ${tags.length} tags`);
    console.log(
      `${allCorrect ? "✅" : "❌"} Tag counts ${
        allCorrect ? "match" : "DO NOT match"
      } manual verification`
    );
    console.log(
      `${avgTime < 1000 ? "✅" : "⚠️"} Performance ${
        avgTime < 1000 ? "acceptable" : "needs improvement"
      }`
    );

    if (allCorrect && avgTime < 1000) {
      console.log("🎊 All tests passed! Tag counts are working correctly.");
    } else {
      console.log("❌ Some tests failed. Check the issues above.");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testTagCounts();
