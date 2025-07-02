#!/usr/bin/env node

/**
 * FINAL COMPREHENSIVE TEST - Complete Trash Workflow
 * Tests the entire soft delete → restore → permanent delete flow
 */

const API_BASE = 'http://localhost:3004';
const userId = 'demo-user';

async function finalComprehensiveTest() {
  console.log('🧪 FINAL COMPREHENSIVE TEST - Complete Trash Workflow');
  console.log('=====================================================\n');

  try {
    // 1. Create test note
    console.log('1. Creating test note...');
    const createResponse = await fetch(`${API_BASE}/api/${userId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'FINAL TEST - Complete Workflow',
        content: 'This note will test the complete trash workflow: soft delete → restore → permanent delete'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log(`✅ Created test note: ${newNote.id}`);

    // 2. Verify note in "all" view
    console.log('2. Verifying note appears in "all" view...');
    const allNotesResponse = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotes = await allNotesResponse.json();
    const noteInAll = allNotes.find(n => n.id === newNote.id && !n.deleted);
    
    if (!noteInAll) {
      throw new Error('Note not found in "all" view');
    }
    console.log('✅ Note confirmed in "all" view');

    // 3. SOFT DELETE (UI delete button action)
    console.log('3. Performing SOFT DELETE (UI delete button)...');
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
      throw new Error(`Soft delete failed: ${softDeleteResponse.status}`);
    }
    console.log('✅ Soft delete successful (note moved to trash)');

    // 4. Verify note removed from "all" view
    console.log('4. Verifying note removed from "all" view...');
    const allNotesAfterDelete = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotesData = await allNotesAfterDelete.json();
    const noteStillInAll = allNotesData.find(n => n.id === newNote.id && !n.deleted);
    
    if (noteStillInAll) {
      throw new Error('Note still appears in "all" view after soft delete');
    }
    console.log('✅ Note correctly removed from "all" view');

    // 5. Verify note in trash view
    console.log('5. Verifying note appears in trash view...');
    const trashResponse = await fetch(`${API_BASE}/api/${userId}/notes?deleted=true`);
    const trashNotes = await trashResponse.json();
    const noteInTrash = trashNotes.find(n => n.id === newNote.id && n.deleted);
    
    if (!noteInTrash) {
      throw new Error('Note not found in trash view');
    }
    console.log('✅ Note confirmed in trash view');

    // 6. RESTORE (UI restore button action)
    console.log('6. Performing RESTORE (UI restore button)...');
    const restoreResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!restoreResponse.ok) {
      throw new Error(`Restore failed: ${restoreResponse.status}`);
    }
    console.log('✅ Restore successful');

    // 7. Verify note back in "all" view
    console.log('7. Verifying note restored to "all" view...');
    const allNotesAfterRestore = await fetch(`${API_BASE}/api/${userId}/notes`);
    const allNotesRestored = await allNotesAfterRestore.json();
    const restoredNote = allNotesRestored.find(n => n.id === newNote.id && !n.deleted);
    
    if (!restoredNote) {
      throw new Error('Note not found in "all" view after restore');
    }
    console.log('✅ Note successfully restored to "all" view');

    // 8. Verify note removed from trash view
    console.log('8. Verifying note removed from trash view...');
    const trashAfterRestore = await fetch(`${API_BASE}/api/${userId}/notes?deleted=true`);
    const trashNotesAfterRestore = await trashAfterRestore.json();
    const noteStillInTrash = trashNotesAfterRestore.find(n => n.id === newNote.id);
    
    if (noteStillInTrash) {
      throw new Error('Note still in trash view after restore');
    }
    console.log('✅ Note correctly removed from trash view');

    // 9. Move to trash again for permanent delete test
    console.log('9. Moving note to trash again for permanent delete test...');
    const softDeleteAgain = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { 
          deleted: true,
          deletedAt: new Date().toISOString()
        } 
      })
    });

    if (!softDeleteAgain.ok) {
      throw new Error(`Second soft delete failed: ${softDeleteAgain.status}`);
    }
    console.log('✅ Note moved to trash again');

    // 10. PERMANENT DELETE (UI permanent delete button action)
    console.log('10. Performing PERMANENT DELETE (UI permanent delete button)...');
    const permanentDeleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}/permanent`, {
      method: 'DELETE'
    });

    if (!permanentDeleteResponse.ok) {
      throw new Error(`Permanent delete failed: ${permanentDeleteResponse.status}`);
    }
    console.log('✅ Permanent delete successful');

    // 11. Verify note completely gone from system
    console.log('11. Verifying note completely gone from system...');
    const finalCheckResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`);
    
    if (finalCheckResponse.ok) {
      throw new Error('Note still exists after permanent delete');
    }
    console.log('✅ Note completely removed from system');

    // 12. Final verification - check all views
    console.log('12. Final verification - checking all views...');
    
    // Check "all" view
    const finalAllNotes = await fetch(`${API_BASE}/api/${userId}/notes`);
    const finalAllNotesData = await finalAllNotes.json();
    const noteInFinalAll = finalAllNotesData.find(n => n.id === newNote.id);
    
    if (noteInFinalAll) {
      throw new Error('Note found in "all" view after permanent delete');
    }

    // Check trash view
    const finalTrashNotes = await fetch(`${API_BASE}/api/${userId}/notes?deleted=true`);
    const finalTrashNotesData = await finalTrashNotes.json();
    const noteInFinalTrash = finalTrashNotesData.find(n => n.id === newNote.id);
    
    if (noteInFinalTrash) {
      throw new Error('Note found in trash view after permanent delete');
    }

    console.log('✅ Final verification passed - note not found in any view');

    console.log('\n🎉🎉🎉 FINAL COMPREHENSIVE TEST PASSED! 🎉🎉🎉');
    console.log('============================================');
    console.log('✅ Soft delete (move to trash) - WORKING');
    console.log('✅ Restore from trash - WORKING');
    console.log('✅ Permanent delete - WORKING');
    console.log('✅ All view filtering - WORKING');
    console.log('✅ Trash view filtering - WORKING');
    console.log('\n🏆 Complete trash workflow is fully functional!');

  } catch (error) {
    console.error('\n❌ FINAL COMPREHENSIVE TEST FAILED:');
    console.error(`   ${error.message}`);
    console.log('\n💡 Please check the backend logs and UI implementation.');
    process.exit(1);
  }
}

finalComprehensiveTest();
