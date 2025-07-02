#!/usr/bin/env node

// Test script to verify Step 2: Restore and Permanent Delete functionality
// This tests both the restore API and permanent delete API

const API_BASE = 'http://localhost:3004';
const userId = 'demo-user';

async function testStep2RestoreAndDelete() {
  console.log('🔄 Testing Step 2: Restore and Permanent Delete functionality...');

  try {
    // 1. Create a test note
    console.log('1. Creating test note...');
    const createResponse = await fetch(`${API_BASE}/api/${userId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🧪 Step 2 Test Note',
        content: 'This note will test restore and permanent delete functionality',
        tags: ['step2-test', 'restore-test']
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log(`✅ Created test note: ${newNote.id}`);

    // 2. Soft delete the note (move to trash)
    console.log('2. Moving note to trash (soft delete)...');
    const softDeleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { 
          deleted: true,
          deletedAt: new Date().toISOString()
        } 
      })
    });

    if (!softDeleteResponse.ok) {
      throw new Error(`Failed to soft delete note: ${softDeleteResponse.status}`);
    }
    console.log('✅ Note moved to trash');

    // 3. Verify note is in trash
    console.log('3. Verifying note is in trash...');
    const trashResponse = await fetch(`${API_BASE}/api/${userId}/notes?deleted=true`);
    const trashNotes = await trashResponse.json();
    const noteInTrash = trashNotes.find(note => note.id === newNote.id);
    
    if (!noteInTrash) {
      throw new Error('Note not found in trash');
    }
    console.log('✅ Note confirmed in trash');

    // 4. Test RESTORE functionality
    console.log('4. Testing RESTORE functionality...');
    const restoreResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { 
          deleted: false,
          deletedAt: null
        } 
      })
    });

    if (!restoreResponse.ok) {
      throw new Error(`Failed to restore note: ${restoreResponse.status}`);
    }
    console.log('✅ Note restored successfully');

    // 5. Verify note is back in main view
    console.log('5. Verifying note is restored to main view...');
    const allNotesResponse = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotes = await allNotesResponse.json();
    const restoredNote = allNotes.find(note => note.id === newNote.id);
    
    if (!restoredNote) {
      throw new Error('Note not found in main view after restore');
    }
    if (restoredNote.deleted !== false) {
      throw new Error('Note still marked as deleted after restore');
    }
    console.log('✅ Note successfully restored to main view');

    // 6. Move to trash again for permanent delete test
    console.log('6. Moving note to trash again for permanent delete test...');
    await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { 
          deleted: true,
          deletedAt: new Date().toISOString()
        } 
      })
    });
    console.log('✅ Note moved to trash again');

    // 7. Test PERMANENT DELETE functionality
    console.log('7. Testing PERMANENT DELETE functionality...');
    const permanentDeleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}/permanent`, {
      method: 'DELETE'
    });

    if (!permanentDeleteResponse.ok) {
      throw new Error(`Failed to permanently delete note: ${permanentDeleteResponse.status}`);
    }
    console.log('✅ Note permanently deleted');

    // 8. Verify note is completely gone
    console.log('8. Verifying note is completely gone...');
    const finalCheckResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`);
    
    if (finalCheckResponse.ok) {
      throw new Error('Note still exists after permanent delete');
    }
    console.log('✅ Note completely removed from system');

    console.log('\n🎉 Step 2 tests passed! Restore and permanent delete functionality working correctly.');

  } catch (error) {
    console.error('❌ Step 2 test failed:', error.message);
    process.exit(1);
  }
}

testStep2RestoreAndDelete();
