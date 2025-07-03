#!/usr/bin/env node

const baseUrl = "http://localhost:3004";
const userId = "user-1";

async function testReordering() {
  console.log("🧪 Testing drag and drop reordering...");

  try {
    // Test 1: Get current notebooks
    console.log("\n📚 Current notebooks:");
    const notebooksResponse = await fetch(`${baseUrl}/api/${userId}/notebooks`);
    const notebooks = await notebooksResponse.json();
    
    notebooks.forEach((nb, index) => {
      console.log(`  ${index + 1}. ${nb.name} (sortOrder: ${nb.sortOrder || 'none'})`);
    });

    if (notebooks.length < 2) {
      console.log("❌ Need at least 2 notebooks to test reordering");
      return;
    }

    // Test 2: Reorder first two notebooks
    const sourceId = notebooks[0].id;
    const targetId = notebooks[1].id;
    
    console.log(`\n🔄 Reordering: "${notebooks[0].name}" after "${notebooks[1].name}"`);
    
    const reorderResponse = await fetch(`${baseUrl}/api/${userId}/notebooks/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceId,
        targetId,
        position: "after"
      })
    });

    const reorderResult = await reorderResponse.json();
    console.log("Reorder result:", reorderResult);

    // Test 3: Get updated notebooks
    console.log("\n📚 Updated notebooks:");
    const updatedResponse = await fetch(`${baseUrl}/api/${userId}/notebooks`);
    const updatedNotebooks = await updatedResponse.json();
    
    updatedNotebooks.forEach((nb, index) => {
      console.log(`  ${index + 1}. ${nb.name} (sortOrder: ${nb.sortOrder || 'none'})`);
    });

    // Test 4: Test folders
    console.log("\n📁 Testing folder reordering:");
    const foldersResponse = await fetch(`${baseUrl}/api/${userId}/folders`);
    const folders = await foldersResponse.json();
    
    folders.forEach((folder, index) => {
      console.log(`  ${index + 1}. ${folder.name} (sortOrder: ${folder.sortOrder || 'none'})`);
    });

    if (folders.length >= 2) {
      const sourceFolderId = folders[0].id;
      const targetFolderId = folders[1].id;
      
      console.log(`\n🔄 Reordering folders: "${folders[0].name}" after "${folders[1].name}"`);
      
      const folderReorderResponse = await fetch(`${baseUrl}/api/${userId}/folders/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: sourceFolderId,
          targetId: targetFolderId,
          position: "after"
        })
      });

      const folderReorderResult = await folderReorderResponse.json();
      console.log("Folder reorder result:", folderReorderResult);
    }

    // Test 5: Test tags
    console.log("\n🏷️ Testing tag reordering:");
    const tagsResponse = await fetch(`${baseUrl}/api/${userId}/tags`);
    const tags = await tagsResponse.json();
    
    tags.forEach((tag, index) => {
      console.log(`  ${index + 1}. ${tag.name} (sortOrder: ${tag.sortOrder || 'none'})`);
    });

    if (tags.length >= 2) {
      const sourceTagId = tags[0].id;
      const targetTagId = tags[1].id;
      
      console.log(`\n🔄 Reordering tags: "${tags[0].name}" after "${tags[1].name}"`);
      
      const tagReorderResponse = await fetch(`${baseUrl}/api/${userId}/tags/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: sourceTagId,
          targetId: targetTagId,
          position: "after"
        })
      });

      const tagReorderResult = await tagReorderResponse.json();
      console.log("Tag reorder result:", tagReorderResult);
    }

    console.log("\n✅ Reordering tests completed!");

  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

testReordering();
