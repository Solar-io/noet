#!/usr/bin/env node

/**
 * Test frontend UUID filtering by adding a proper tag to a note that has UUID tags
 */

import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUUIDFiltering() {
    console.log('🧪 Testing UUID tag filtering...\n');
    
    const baseUrl = 'http://localhost:3004';
    const userId = 'user-1';
    
    try {
        // Find a note with UUID tags
        const notesResponse = await fetch(`${baseUrl}/api/${userId}/notes`);
        const notes = await notesResponse.json();
        
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const noteWithUUIDs = notes.find(note => 
            note.tags && note.tags.some(tag => UUID_REGEX.test(tag))
        );
        
        if (!noteWithUUIDs) {
            console.log('❌ No notes found with UUID tags');
            return;
        }
        
        console.log(`📝 Found note with UUID tags: "${noteWithUUIDs.title}"`);
        console.log(`   Current tags: ${JSON.stringify(noteWithUUIDs.tags)}`);
        
        // Add a meaningful tag to this note
        const newTags = [...noteWithUUIDs.tags, 'test-tag-12345'];
        
        console.log(`   Adding tag: test-tag-12345`);
        
        const updateResponse = await fetch(`${baseUrl}/api/${userId}/notes/${noteWithUUIDs.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                metadata: { tags: newTags }
            })
        });
        
        if (updateResponse.ok) {
            console.log('   ✅ Tag added successfully');
            
            // Verify the note was updated
            const verifyResponse = await fetch(`${baseUrl}/api/${userId}/notes/${noteWithUUIDs.id}`);
            const updatedNote = await verifyResponse.json();
            
            console.log(`   Updated tags: ${JSON.stringify(updatedNote.tags)}`);
            
            // Check what the tags endpoint returns
            const tagsResponse = await fetch(`${baseUrl}/api/${userId}/tags`);
            const tags = await tagsResponse.json();
            
            console.log(`\n🏷️  Backend tags endpoint returns ${tags.length} tags:`);
            tags.forEach(tag => {
                console.log(`   - ${tag.name} (${tag.noteCount} notes)`);
            });
            
        } else {
            console.log('   ❌ Failed to add tag:', updateResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUUIDFiltering().catch(console.error);
