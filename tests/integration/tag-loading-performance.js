#!/usr/bin/env node

async function testTagLoadingPerformance() {
    console.log('🏃 Testing tag loading performance...');
    
    // Test backend speed
    console.log('\n📡 Testing backend API speed:');
    const backendStart = Date.now();
    
    try {
        const response = await fetch('http://localhost:3004/api/user1/tags');
        const backendEnd = Date.now();
        const tags = await response.json();
        
        console.log(`✅ Backend response time: ${backendEnd - backendStart}ms`);
        console.log(`📊 Tags returned: ${tags.length}`);
        console.log('🏷️  Tag details:', tags.map(t => `${t.name} (${t.noteCount} notes)`).join(', '));
        
        // Verify no UUID tags
        const uuidTags = tags.filter(tag => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tag.id));
        if (uuidTags.length > 0) {
            console.log('⚠️  Found UUID tags (should be filtered out):', uuidTags);
        } else {
            console.log('✅ No UUID tags found - filtering is working correctly');
        }
        
    } catch (error) {
        console.error('❌ Backend API error:', error.message);
    }
    
    // Test notes endpoint to see note tag structure
    console.log('\n📝 Testing notes with tags:');
    try {
        const notesResponse = await fetch('http://localhost:3004/api/user1/notes');
        const notes = await notesResponse.json();
        const notesWithTags = notes.filter(note => note.tags && note.tags.length > 0);
        
        console.log(`✅ Found ${notesWithTags.length} notes with tags`);
        notesWithTags.forEach(note => {
            console.log(`📋 Note: "${note.title}" has tags: [${note.tags.join(', ')}]`);
        });
        
    } catch (error) {
        console.error('❌ Notes API error:', error.message);
    }
}

testTagLoadingPerformance();
