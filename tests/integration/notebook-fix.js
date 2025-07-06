#!/usr/bin/env node

// Test script to verify notebook association fix
import configService from "./src/configService.js";

async function testNotebookFix() {
  console.log("🔍 Testing Notebook Association Fix...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const userId = "user-1"; // Demo user

  try {
    // Test 1: Verify notebooks are loaded
    console.log("📚 Test 1: Check notebooks are loaded...");
    const notebooksResponse = await fetch(`${backendUrl}/api/${userId}/notebooks`);
    
    if (!notebooksResponse.ok) {
      throw new Error(`Failed to fetch notebooks: ${notebooksResponse.status}`);
    }

    const notebooks = await notebooksResponse.json();
    console.log(`✅ Found ${notebooks.length} notebooks`);
    
    // Create a lookup map for notebooks
    const notebookMap = new Map();
    notebooks.forEach(notebook => {
      notebookMap.set(notebook.id, notebook.name);
      console.log(`  📖 ${notebook.name} (${notebook.noteCount} notes)`);
    });

    // Test 2: Check notes with notebook associations
    console.log("\n📝 Test 2: Check notes with notebook associations...");
    const notesResponse = await fetch(`${backendUrl}/api/${userId}/notes`);
    
    if (!notesResponse.ok) {
      throw new Error(`Failed to fetch notes: ${notesResponse.status}`);
    }

    const notes = await notesResponse.json();
    console.log(`✅ Found ${notes.length} total notes`);

    let notesWithNotebooks = 0;
    let notesWithValidNotebooks = 0;
    let notesWithoutNotebooks = 0;

    console.log("\n📋 Note associations:");
    notes.forEach(note => {
      if (note.notebook) {
        notesWithNotebooks++;
        const notebookName = notebookMap.get(note.notebook);
        if (notebookName) {
          notesWithValidNotebooks++;
          console.log(`  ✅ "${note.title}" → "${notebookName}"`);
        } else {
          console.log(`  ❌ "${note.title}" → Unknown notebook (${note.notebook})`);
        }
      } else {
        notesWithoutNotebooks++;
        console.log(`  📄 "${note.title}" → No notebook`);
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`  Total notes: ${notes.length}`);
    console.log(`  Notes with notebooks: ${notesWithNotebooks}`);
    console.log(`  Notes with valid notebooks: ${notesWithValidNotebooks}`);
    console.log(`  Notes without notebooks: ${notesWithoutNotebooks}`);
    console.log(`  Notes with broken notebook references: ${notesWithNotebooks - notesWithValidNotebooks}`);

    if (notesWithValidNotebooks === notesWithNotebooks && notesWithNotebooks > 0) {
      console.log("\n🎉 SUCCESS: All notebook associations are working correctly!");
      console.log("✨ The frontend should now show proper notebook names instead of 'Unknown Notebook'");
    } else if (notesWithValidNotebooks > 0) {
      console.log("\n⚠️  PARTIAL SUCCESS: Some notebooks are working but there may be broken references");
    } else {
      console.log("\n❌ FAILED: No valid notebook associations found");
    }

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testNotebookFix();
