#!/usr/bin/env node

/**
 * Test script for file upload functionality
 */

import fs from "fs";

const BACKEND_URL = "http://localhost:3004";
const USER_ID = "demo-user";

async function testFileUpload() {
  console.log("🔄 Testing file upload functionality...\n");

  try {
    // 1. Get all notes to find one to upload to
    console.log("1. Fetching notes...");
    const notesResponse = await fetch(`${BACKEND_URL}/api/${USER_ID}/notes`);
    if (!notesResponse.ok) {
      throw new Error(`Failed to fetch notes: ${notesResponse.statusText}`);
    }

    const notes = await notesResponse.json();
    if (notes.length === 0) {
      console.log("No notes found. Creating a test note...");

      // Create a test note
      const createResponse = await fetch(
        `${BACKEND_URL}/api/${USER_ID}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test Note for File Upload",
            content: "<p>This note is for testing file uploads.</p>",
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Failed to create note: ${createResponse.statusText}`);
      }

      const newNote = await createResponse.json();
      console.log(`Created test note: ${newNote.id}`);

      // Use the new note for upload
      const noteId = newNote.id;
      await testUploadToNote(noteId);
    } else {
      // Use the first note
      const noteId = notes[0].id;
      console.log(`Using existing note: ${noteId}`);
      await testUploadToNote(noteId);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

async function testUploadToNote(noteId) {
  try {
    // 2. Test file upload
    console.log(`2. Uploading test file to note ${noteId}...`);

    // Read the file
    const fileContent = fs.readFileSync(./upload-file.txt");
    const blob = new Blob([fileContent], { type: "text/plain" });

    const form = new FormData();
    form.append("file", blob, "test-upload-file.txt");

    const uploadResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${noteId}/attachments`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`
      );
    }

    const uploadResult = await uploadResponse.json();
    console.log("✅ File uploaded successfully!");
    console.log("   Attachment:", uploadResult.attachment);

    // 3. Verify the attachment is listed in the note
    console.log("3. Verifying attachment in note metadata...");
    const noteResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${noteId}`
    );
    if (!noteResponse.ok) {
      throw new Error(`Failed to fetch note: ${noteResponse.statusText}`);
    }

    const note = await noteResponse.json();
    console.log(`   Note has ${note.attachments?.length || 0} attachments`);

    if (note.attachments && note.attachments.length > 0) {
      console.log(
        "   Attachments:",
        note.attachments.map((a) => a.originalName)
      );
    }

    // 4. Test downloading the attachment
    console.log("4. Testing attachment download...");
    const filename = uploadResult.attachment.filename;
    const downloadResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${noteId}/attachments/${filename}`
    );

    if (!downloadResponse.ok) {
      throw new Error(
        `Download failed: ${downloadResponse.status} ${downloadResponse.statusText}`
      );
    }

    const downloadedContent = await downloadResponse.text();
    console.log("✅ Attachment downloaded successfully!");
    console.log(
      "   Downloaded content length:",
      downloadedContent.length,
      "bytes"
    );

    console.log("\n🎉 All file upload tests passed!");
  } catch (error) {
    console.error("❌ Upload test failed:", error.message);
    throw error;
  }
}

// Run the test
testFileUpload();
