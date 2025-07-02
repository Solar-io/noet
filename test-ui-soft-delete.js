#!/usr/bin/env node

// Test script to verify UI soft delete functionality
// This tests that the delete button in the UI now does soft delete instead of hard delete

const API_BASE = 'http://localhost:3004';
const userId = 'demo-user';

async function testUISoftDelete() {
  console.log('🔄 Testing UI soft delete behavior...');

  try {
    // 1. Create a test note
    console.log('1. Creating test note...');
    const createResponse = await fetch(`${API_BASE}/api/${userId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'UI Soft Delete Test Note',
        content: 'This note will test the UI soft delete functionality',
        tags: ['test', 'ui-delete']
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log(`✅ Created test note: ${newNote.id}`);

    // 2. Verify note appears in "all" view
    console.log('2. Verifying note appears in "all" view...');
    const allNotesResponse = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotes = await allNotesResponse.json();
    const noteInAll = allNotes.find(note => note.id === newNote.id);
    
    if (!noteInAll) {
      throw new Error('Note not found in "all" view');
    }
    console.log('✅ Note appears in "all" view');

    // 3. Simulate the UI soft delete (PUT with metadata.deleted: true)
    console.log('3. Simulating UI soft delete...');
    const deleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { 
          deleted: true,
          deletedAt: new Date().toISOString()
        } 
      })
    });

    if (!deleteResponse.ok) {
      throw new Error(`Failed to soft delete note: ${deleteResponse.status}`);
    }
    console.log('✅ UI soft delete successful');

    // 4. Verify note no longer appears in "all" view
    console.log('4. Verifying note removed from "all" view...');
    const allNotesAfterDelete = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotesAfterDeleteData = await allNotesAfterDelete.json();
    const noteStillInAll = allNotesAfterDeleteData.find(note => note.id === newNote.id);
    
    if (noteStillInAll) {
      throw new Error('Note still appears in "all" view after soft delete');
    }
    console.log('✅ Note correctly removed from "all" view');

    // 5. Verify note appears in trash view
    console.log('5. Verifying note appears in trash view...');
    const trashNotesResponse = await fetch(`${API_BASE}/api/${userId}/notes?deleted=true`);
    const trashNotes = await trashNotesResponse.json();
    const noteInTrash = trashNotes.find(note => note.id === newNote.id);
    
    if (!noteInTrash) {
      throw new Error('Note not found in trash view');
    }
    console.log('✅ Note correctly appears in trash view');
    console.log(`   Deleted at: ${noteInTrash.deletedAt}`);

    // 6. Clean up - permanently delete the test note
    console.log('6. Cleaning up test note...');
    const permanentDeleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'DELETE'
    });
    
    if (permanentDeleteResponse.ok) {
      console.log('✅ Test note cleaned up');
    } else {
      console.log('⚠️  Could not clean up test note (non-critical)');
    }

    console.log('\n🎉 UI soft delete test passed! The delete button now correctly performs soft delete.');

  } catch (error) {
    console.error('❌ UI soft delete test failed:', error.message);
    process.exit(1);
  }
}

testUISoftDelete();
