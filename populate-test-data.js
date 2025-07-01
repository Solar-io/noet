#!/usr/bin/env node

/**
 * Script to populate test data for notebooks, tags, and folders
 * This will create sample entities so we can test the UI fixes
 */

console.log("🌱 Populating test data for noet-app");
console.log("===================================");

const BASE_URL = "http://localhost:3004";
const USER_ID = "user-1";

async function createTestData() {
  try {
    // Create some notebooks
    console.log("\n📚 Creating test notebooks...");
    const notebooks = [
      { name: "Work Projects", description: "Professional development notes" },
      { name: "Personal", description: "Personal notes and ideas" },
      { name: "Learning", description: "Study notes and tutorials" }
    ];

    const createdNotebooks = [];
    for (const notebook of notebooks) {
      const response = await fetch(`${BASE_URL}/api/${USER_ID}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notebook)
      });
      
      if (response.ok) {
        const created = await response.json();
        createdNotebooks.push(created);
        console.log(`✅ Created notebook: ${notebook.name} (${created.id.substring(0, 8)}...)`);
      } else {
        console.log(`❌ Failed to create notebook: ${notebook.name}`);
      }
    }

    // Create some tags
    console.log("\n🏷️  Creating test tags...");
    const tags = [
      { name: "JavaScript", color: "#F7DF1E" },
      { name: "React", color: "#61DAFB" },
      { name: "Tutorial", color: "#28A745" },
      { name: "Important", color: "#DC3545" },
      { name: "Work", color: "#6F42C1" }
    ];

    const createdTags = [];
    for (const tag of tags) {
      const response = await fetch(`${BASE_URL}/api/${USER_ID}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag)
      });
      
      if (response.ok) {
        const created = await response.json();
        createdTags.push(created);
        console.log(`✅ Created tag: ${tag.name} (${created.id.substring(0, 8)}...)`);
      } else {
        console.log(`❌ Failed to create tag: ${tag.name}`);
      }
    }

    // Create some folders
    console.log("\n📁 Creating test folders...");
    const folders = [
      { name: "Documentation", description: "Project documentation" },
      { name: "Ideas", description: "Random thoughts and ideas" },
      { name: "Archive", description: "Old notes to keep" }
    ];

    const createdFolders = [];
    for (const folder of folders) {
      const response = await fetch(`${BASE_URL}/api/${USER_ID}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder)
      });
      
      if (response.ok) {
        const created = await response.json();
        createdFolders.push(created);
        console.log(`✅ Created folder: ${folder.name} (${created.id.substring(0, 8)}...)`);
      } else {
        console.log(`❌ Failed to create folder: ${folder.name}`);
      }
    }

    console.log("\n✨ Test data creation completed!");
    console.log(`📊 Created: ${createdNotebooks.length} notebooks, ${createdTags.length} tags, ${createdFolders.length} folders`);
    
    // Now update some existing notes to use these entities
    console.log("\n📝 Updating existing notes with relationships...");
    
    const notesResponse = await fetch(`${BASE_URL}/api/${USER_ID}/notes`);
    const notes = await notesResponse.json();
    
    // Update a few notes to have proper notebook/tag relationships
    for (let i = 0; i < Math.min(5, notes.length); i++) {
      const note = notes[i];
      const updates = {};
      
      // Assign notebook
      if (createdNotebooks.length > 0) {
        updates.notebook = createdNotebooks[i % createdNotebooks.length].id;
      }
      
      // Assign some tags
      if (createdTags.length > 0) {
        updates.tags = [createdTags[i % createdTags.length].id];
      }
      
      const updateResponse = await fetch(`${BASE_URL}/api/${USER_ID}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (updateResponse.ok) {
        console.log(`✅ Updated note "${note.title}" with relationships`);
      }
    }
    
    console.log("\n🎉 All done! Now refresh the app to see the changes.");
    console.log("You should now see:");
    console.log("- Actual notebook names instead of 'Notebook'");
    console.log("- Tag filter options in the filter menu");
    console.log("- Sidebar with draggable notebooks, tags, and folders");

  } catch (error) {
    console.error("❌ Error creating test data:", error);
  }
}

createTestData();
