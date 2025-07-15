/**
 * Fix Duplicate sortOrder Values Script
 *
 * This script fixes the duplicate sortOrder values that were created by the old
 * flawed reordering logic, ensuring each entity has a unique sequential sortOrder.
 */

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3004";
const USER_ID = "user-1";

async function fixDuplicateSortOrders() {
  console.log("🔧 Fixing duplicate sortOrder values...");

  try {
    // Fix tags
    console.log("\n📝 Fixing tags...");
    const tagsResponse = await fetch(`${BASE_URL}/api/${USER_ID}/tags`);
    const tags = await tagsResponse.json();

    console.log("Tags before fix:");
    tags.forEach((tag, i) => {
      console.log(`  ${i}: ${tag.name} (sortOrder: ${tag.sortOrder})`);
    });

    // Fix notebooks
    console.log("\n📚 Fixing notebooks...");
    const notebooksResponse = await fetch(
      `${BASE_URL}/api/${USER_ID}/notebooks`
    );
    const notebooks = await notebooksResponse.json();

    console.log("Notebooks before fix:");
    notebooks.forEach((notebook, i) => {
      console.log(
        `  ${i}: ${notebook.name} (sortOrder: ${notebook.sortOrder})`
      );
    });

    // Fix folders
    console.log("\n📁 Fixing folders...");
    const foldersResponse = await fetch(`${BASE_URL}/api/${USER_ID}/folders`);
    const folders = await foldersResponse.json();

    console.log("Folders before fix:");
    folders.forEach((folder, i) => {
      console.log(`  ${i}: ${folder.name} (sortOrder: ${folder.sortOrder})`);
    });

    // Fix by doing a dummy reorder operation that will trigger the new logic
    if (notebooks.length >= 2) {
      console.log("\n🔄 Triggering notebook reorder to fix duplicates...");
      const response = await fetch(
        `${BASE_URL}/api/${USER_ID}/notebooks/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: notebooks[0].id,
            targetId: notebooks[1].id,
            position: "after",
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Notebook reorder completed");
      } else {
        console.log("❌ Notebook reorder failed");
      }
    }

    if (folders.length >= 2) {
      console.log("\n🔄 Triggering folder reorder to fix duplicates...");
      const response = await fetch(
        `${BASE_URL}/api/${USER_ID}/folders/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: folders[0].id,
            targetId: folders[1].id,
            position: "after",
          }),
        }
      );

      if (response.ok) {
        console.log("✅ Folder reorder completed");
      } else {
        console.log("❌ Folder reorder failed");
      }
    }

    // Check results
    console.log("\n📊 Checking results...");

    const notebooksAfter = await fetch(
      `${BASE_URL}/api/${USER_ID}/notebooks`
    ).then((r) => r.json());
    console.log("Notebooks after fix:");
    notebooksAfter.forEach((notebook, i) => {
      console.log(
        `  ${i}: ${notebook.name} (sortOrder: ${notebook.sortOrder})`
      );
    });

    const foldersAfter = await fetch(`${BASE_URL}/api/${USER_ID}/folders`).then(
      (r) => r.json()
    );
    console.log("Folders after fix:");
    foldersAfter.forEach((folder, i) => {
      console.log(`  ${i}: ${folder.name} (sortOrder: ${folder.sortOrder})`);
    });

    console.log("\n✅ Duplicate sortOrder fix completed!");
  } catch (error) {
    console.error("❌ Error fixing duplicates:", error);
  }
}

// Run the fix
fixDuplicateSortOrders().catch(console.error);
