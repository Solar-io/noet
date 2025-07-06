/**
 * Test Script: Note Count Feature
 * 
 * This script tests that notebooks display the correct count of notes
 * and that the count updates when notes are added or removed.
 */

import configService from './src/configService.js';

async function testNoteCountFeature() {
  console.log('🧪 Testing Note Count Feature...\n');
  
  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error('❌ Failed to get backend URL:', error);
    return;
  }

  const userId = 'user-1'; // Demo user
  
  try {
    // Test 1: Get notebooks and check if they have noteCount property
    console.log('📋 Test 1: Check notebook data structure...');
    const notebooksResponse = await fetch(`${backendUrl}/api/${userId}/notebooks`);
    
    if (!notebooksResponse.ok) {
      throw new Error(`Failed to fetch notebooks: ${notebooksResponse.status}`);
    }
    
    const notebooks = await notebooksResponse.json();
    console.log(`📚 Found ${notebooks.length} notebooks`);
    
    for (const notebook of notebooks) {
      const hasNoteCount = 'noteCount' in notebook;
      console.log(`  📖 ${notebook.name}: noteCount=${notebook.noteCount} (${hasNoteCount ? '✅' : '❌'})`);
    }
    
    // Test 2: Create a test notebook and verify it starts with 0 count
    console.log('\n📋 Test 2: Create test notebook...');
    const createResponse = await fetch(`${backendUrl}/api/${userId}/notebooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Notebook for Count',
        description: 'Testing note counts',
        color: '#3B82F6'
      })
    });
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create notebook: ${createResponse.status}`);
    }
    
    const newNotebook = await createResponse.json();
    console.log(`✅ Created notebook: ${newNotebook.name} (ID: ${newNotebook.id})`);
    
    // Test 3: Verify new notebook shows up with count
    console.log('\n📋 Test 3: Verify new notebook appears with count...');
    const updatedNotebooksResponse = await fetch(`${backendUrl}/api/${userId}/notebooks`);
    const updatedNotebooks = await updatedNotebooksResponse.json();
    
    const testNotebook = updatedNotebooks.find(nb => nb.id === newNotebook.id);
    if (testNotebook) {
      console.log(`✅ Test notebook found with noteCount: ${testNotebook.noteCount}`);
      if (testNotebook.noteCount === 0) {
        console.log('✅ New notebook correctly shows 0 notes');
      } else {
        console.log(`❌ Expected 0 notes, got ${testNotebook.noteCount}`);
      }
    } else {
      console.log('❌ Test notebook not found in updated list');
    }
    
    // Test 4: Create a note in the test notebook
    console.log('\n📋 Test 4: Create note in test notebook...');
    const noteResponse = await fetch(`${backendUrl}/api/${userId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Note for Count',
        content: [{ type: 'paragraph', children: [{ text: 'Testing note count feature' }] }],
        notebookId: newNotebook.id
      })
    });
    
    if (!noteResponse.ok) {
      throw new Error(`Failed to create note: ${noteResponse.status}`);
    }
    
    const newNote = await noteResponse.json();
    console.log(`✅ Created note: ${newNote.title} (ID: ${newNote.id})`);
    
    // Test 5: Verify notebook count increased
    console.log('\n📋 Test 5: Verify notebook count increased...');
    const finalNotebooksResponse = await fetch(`${backendUrl}/api/${userId}/notebooks`);
    const finalNotebooks = await finalNotebooksResponse.json();
    
    const finalTestNotebook = finalNotebooks.find(nb => nb.id === newNotebook.id);
    if (finalTestNotebook) {
      console.log(`📊 Final notebook count: ${finalTestNotebook.noteCount}`);
      if (finalTestNotebook.noteCount === 1) {
        console.log('✅ Notebook count correctly increased to 1');
      } else {
        console.log(`❌ Expected 1 note, got ${finalTestNotebook.noteCount}`);
      }
    } else {
      console.log('❌ Test notebook not found in final list');
    }
    
    // Test 6: Clean up - delete the test note and notebook
    console.log('\n📋 Test 6: Cleanup...');
    
    // Delete the note
    const deleteNoteResponse = await fetch(`${backendUrl}/api/${userId}/notes/${newNote.id}`, {
      method: 'DELETE'
    });
    
    if (deleteNoteResponse.ok) {
      console.log('✅ Test note deleted');
    } else {
      console.log('❌ Failed to delete test note');
    }
    
    // Delete the notebook
    const deleteNotebookResponse = await fetch(`${backendUrl}/api/${userId}/notebooks/${newNotebook.id}`, {
      method: 'DELETE'
    });
    
    if (deleteNotebookResponse.ok) {
      console.log('✅ Test notebook deleted');
    } else {
      console.log('❌ Failed to delete test notebook');
    }
    
    console.log('\n🎉 Note count feature test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testNoteCountFeature().catch(console.error);
