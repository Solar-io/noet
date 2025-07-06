#!/usr/bin/env node

/**
 * Test script to verify tag display and archive functionality
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source the directory config
const configPath = path.join(__dirname, 'simple-config.sh');
let config = {};
try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const match = configContent.match(/export NOET_PROJECT_PATH="([^"]+)"/);
    if (match) {
        config.projectPath = match[1];
        process.chdir(config.projectPath);
        console.log('✅ Set working directory to:', process.cwd());
    }
} catch (error) {
    console.log('⚠️  Using current directory:', process.cwd());
}

async function testTagsAndArchive() {
    console.log('🏷️  Testing tag display and archive functionality...\n');
    
    const baseUrl = 'http://localhost:3004';
    const userId = 'demo-user';
    
    try {
        // Test 1: Check tags endpoint
        console.log('1. Testing tags endpoint...');
        const tagsResponse = await fetch(`${baseUrl}/api/${userId}/tags`);
        if (!tagsResponse.ok) {
            throw new Error(`Tags API failed: ${tagsResponse.status}`);
        }
        
        const tags = await tagsResponse.json();
        console.log(`   ✅ Found ${tags.length} tags`);
        
        // Check if tags have proper name field
        const invalidTags = tags.filter(tag => !tag.name || tag.name.length === 0 || tag.name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/));
        if (invalidTags.length > 0) {
            console.log(`   ❌ Found ${invalidTags.length} tags with UUID names or missing names:`);
            invalidTags.forEach(tag => {
                console.log(`      - ID: ${tag.id}, Name: ${tag.name || 'MISSING'}`);
            });
        } else {
            console.log('   ✅ All tags have proper names (not UUIDs)');
        }
        
        // Test 2: Check notes endpoint to test archive functionality
        console.log('\n2. Testing notes endpoint for archive functionality...');
        const notesResponse = await fetch(`${baseUrl}/api/${userId}/notes`);
        if (!notesResponse.ok) {
            throw new Error(`Notes API failed: ${notesResponse.status}`);
        }
        
        const notes = await notesResponse.json();
        console.log(`   ✅ Found ${notes.length} total notes`);
        
        const archivedNotes = notes.filter(note => note.archived);
        const activeNotes = notes.filter(note => !note.archived);
        
        console.log(`   📁 Active notes: ${activeNotes.length}`);
        console.log(`   📦 Archived notes: ${archivedNotes.length}`);
        
        // Test 3: Try to archive a note if there are any active notes
        if (activeNotes.length > 0) {
            console.log('\n3. Testing archive functionality...');
            const testNote = activeNotes[0];
            console.log(`   Testing with note: "${testNote.title}"`);
            
            const archiveResponse = await fetch(`${baseUrl}/api/${userId}/notes/${testNote.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    metadata: { archived: true }
                })
            });
            
            if (archiveResponse.ok) {
                console.log('   ✅ Archive API call successful');
                
                // Verify the note was archived
                const verifyResponse = await fetch(`${baseUrl}/api/${userId}/notes/${testNote.id}`);
                if (verifyResponse.ok) {
                    const updatedNote = await verifyResponse.json();
                    if (updatedNote.archived) {
                        console.log('   ✅ Note successfully archived');
                        
                        // Restore it back
                        const restoreResponse = await fetch(`${baseUrl}/api/${userId}/notes/${testNote.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                metadata: { archived: false }
                            })
                        });
                        
                        if (restoreResponse.ok) {
                            console.log('   ✅ Note successfully restored');
                        } else {
                            console.log('   ⚠️  Could not restore note');
                        }
                    } else {
                        console.log('   ❌ Note was not actually archived');
                    }
                }
            } else {
                console.log('   ❌ Archive API call failed:', archiveResponse.status);
            }
        } else {
            console.log('\n3. Skipping archive test - no active notes found');
        }
        
        console.log('\n✅ Tag and archive test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testTagsAndArchive().catch(console.error);
