#!/usr/bin/env node

/**
 * Script to fix note relationships with current available entities
 */

console.log("🔧 Fixing note relationships with current entities");
console.log("=================================================");

const BASE_URL = "http://localhost:3004";
const USER_ID = "user-1";

async function fixNoteRelationships() {
  try {
    // Get current entities
    const [notebooksRes, tagsRes, notesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/${USER_ID}/notebooks`),
      fetch(`${BASE_URL}/api/${USER_ID}/tags`),
      fetch(`${BASE_URL}/api/${USER_ID}/notes`)
    ]);

    const notebooks = await notebooksRes.json();
    const tags = await tagsRes.json();
    const notes = await notesRes.json();

    console.log(`📊 Found: ${notebooks.length} notebooks, ${tags.length} tags, ${notes.length} notes`);

    // Get the first few entities to use
    const workNotebook = notebooks.find(nb => nb.name.includes('Work'));
    const personalNotebook = notebooks.find(nb => nb.name.includes('Personal'));
    const learningNotebook = notebooks.find(nb => nb.name.includes('Learning'));
    
    const jsTag = tags.find(t => t.name === 'JavaScript');
    const reactTag = tags.find(t => t.name === 'React');
    const importantTag = tags.find(t => t.name === 'Important');

    console.log("\n🔄 Updating notes with current entity IDs...");

    // Update first 10 notes with proper relationships
    for (let i = 0; i < Math.min(10, notes.length); i++) {
      const note = notes[i];
      const updates = {};
      
      // Assign notebook based on index
      if (workNotebook && i % 3 === 0) {
        updates.notebook = workNotebook.id;
      } else if (personalNotebook && i % 3 === 1) {
        updates.notebook = personalNotebook.id;
      } else if (learningNotebook && i % 3 === 2) {
        updates.notebook = learningNotebook.id;
      }
      
      // Assign tags
      const tagList = [];
      if (jsTag && i % 4 === 0) tagList.push(jsTag.id);
      if (reactTag && i % 3 === 0) tagList.push(reactTag.id);
      if (importantTag && i % 5 === 0) tagList.push(importantTag.id);
      
      if (tagList.length > 0) {
        updates.tags = tagList;
      }
      
      // Make the update request
      if (Object.keys(updates).length > 0) {      const updateResponse = await fetch(`${BASE_URL}/api/${USER_ID}/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updates })
      });
        
        if (updateResponse.ok) {
          const notebookName = updates.notebook ? 
            (notebooks.find(nb => nb.id === updates.notebook)?.name || 'Unknown') : 
            'None';
          const tagNames = updates.tags ? 
            updates.tags.map(tagId => tags.find(t => t.id === tagId)?.name || 'Unknown').join(', ') : 
            'None';
          
          console.log(`✅ Updated "${note.title.substring(0, 30)}..." → Notebook: ${notebookName}, Tags: [${tagNames}]`);
        } else {
          console.log(`❌ Failed to update "${note.title}"`);
        }
      }
    }
    
    console.log("\n✨ Note relationships updated!");
    console.log("Now test the UI to see actual notebook names and tag filters.");

  } catch (error) {
    console.error("❌ Error fixing relationships:", error);
  }
}

fixNoteRelationships();
