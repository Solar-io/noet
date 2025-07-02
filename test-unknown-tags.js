#!/usr/bin/env node

/**
 * Test Unknown Tags Removal
 * Tests if unknown/UUID tags can be properly removed
 */

const API_BASE = 'http://localhost:3004';
const userId = 'user-1';

async function testUnknownTagRemoval() {
  console.log('🔍 Testing Unknown Tags Removal');
  console.log('===============================\n');

  try {
    // 1. Create a test note with a fake UUID tag
    console.log('1. Creating test note with unknown UUID tag...');
    const fakeUuid = 'fake-uuid-1234-5678-9abc-def012345678';
    
    const createResponse = await fetch(`${API_BASE}/api/${userId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unknown Tag Test',
        content: 'Testing unknown tag removal',
        tags: [fakeUuid, 'normal-tag']
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const newNote = await createResponse.json();
    console.log(`✅ Created test note: ${newNote.id}`);
    console.log(`   Tags: ${JSON.stringify(newNote.tags)}`);

    // 2. Test removing the unknown UUID tag
    console.log('2. Testing removal of unknown UUID tag...');
    const noteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`);
    const fullNote = await noteResponse.json();
    
    // Remove the fake UUID tag
    const updatedTags = fullNote.tags.filter(tag => tag !== fakeUuid);
    
    const updateResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        metadata: { tags: updatedTags } 
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update note tags: ${updateResponse.status}`);
    }

    const updatedNote = await updateResponse.json();
    console.log(`✅ Unknown UUID tag removed. Remaining tags: ${JSON.stringify(updatedNote.tags)}`);

    // 3. Verify the UUID tag is gone
    if (!updatedNote.tags.includes(fakeUuid)) {
      console.log('✅ Confirmed: Unknown UUID tag successfully removed');
    } else {
      throw new Error('Unknown UUID tag was not removed');
    }

    // 4. Clean up test note
    console.log('3. Cleaning up test note...');
    const deleteResponse = await fetch(`${API_BASE}/api/${userId}/notes/${newNote.id}/permanent`, {
      method: 'DELETE'
    });

    if (deleteResponse.ok) {
      console.log('✅ Test note cleaned up');
    }

    console.log('\n🎉 UNKNOWN TAGS REMOVAL TEST RESULTS:');
    console.log('=====================================');
    console.log('✅ Unknown UUID tags can be removed from notes');
    console.log('✅ Backend properly handles tag removal');
    console.log('💡 Frontend should now show "Unknown" instead of UUID fragments');
    console.log('💡 Remove buttons should work for unknown tags');

  } catch (error) {
    console.error('\n❌ Unknown tags removal test failed:');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

testUnknownTagRemoval();
