#!/usr/bin/env node

/**
 * Debug script to check server startup issues
 */

import { join } from 'path';
import fs from 'fs';

console.log('🔍 Debug Server Startup');
console.log('=======================');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', import.meta.url);

const notesPath = join(process.cwd(), 'notes');
console.log('Expected notes path:', notesPath);

try {
  const exists = fs.existsSync(notesPath);
  console.log('Notes directory exists:', exists);
  
  if (exists) {
    const contents = fs.readdirSync(notesPath);
    console.log('Notes directory contents:', contents.slice(0, 5)); // Show first 5 items
  }
} catch (error) {
  console.error('Error checking notes directory:', error.message);
}

console.log('\n🚀 Starting server with debug info...');

// Set explicit working directory
process.chdir('/Users/sgallant/sync/rygel/noet-app');
console.log('Changed working directory to:', process.cwd());

// Now try to import and start the server
try {
  const { default: app } = await import('./server/server.js');
  console.log('✅ Server imported successfully');
} catch (error) {
  console.error('❌ Server import failed:', error.message);
  console.error('Stack:', error.stack);
}
