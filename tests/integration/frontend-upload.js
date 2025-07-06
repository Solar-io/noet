#!/usr/bin/env node

/**
 * Test script for frontend file upload functionality
 * This tests the UI interactions programmatically
 */

import fs from "fs";

const BACKEND_URL = "http://localhost:3004";
const FRONTEND_URL = "http://localhost:3001";
const USER_ID = "demo-user";

async function testFrontendFileUpload() {
  console.log("🔄 Testing frontend file upload functionality...\n");

  try {
    // 1. Check that frontend is running
    console.log("1. Checking frontend accessibility...");
    const frontendResponse = await fetch(FRONTEND_URL);
    if (!frontendResponse.ok) {
      throw new Error(
        `Frontend not accessible: ${frontendResponse.statusText}`
      );
    }
    console.log("✅ Frontend is accessible");

    // 2. Create a test image file for upload
    console.log("2. Creating test image file...");
    const testImagePath = ./image.png";

    // Create a simple 1x1 PNG image (base64 encoded)
    const pngData = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGS4sLGAAAAABJRU5ErkJggg==",
      "base64"
    );
    fs.writeFileSync(testImagePath, pngData);
    console.log("✅ Test image created");

    // 3. Get available notes
    console.log("3. Fetching available notes...");
    const notesResponse = await fetch(`${BACKEND_URL}/api/${USER_ID}/notes`);
    if (!notesResponse.ok) {
      throw new Error(`Failed to fetch notes: ${notesResponse.statusText}`);
    }

    const notes = await notesResponse.json();
    if (notes.length === 0) {
      throw new Error("No notes available for testing");
    }

    const testNote = notes[0];
    console.log(`✅ Using note: ${testNote.title} (${testNote.id})`);

    // 4. Test image upload
    console.log("4. Testing image file upload...");
    await testFileUpload(
      testNote.id,
      testImagePath,
      "test-image.png",
      "image/png"
    );

    // 5. Test document upload
    console.log("5. Testing document file upload...");
    await testFileUpload(
      testNote.id,
      ./upload-file.txt",
      "test-document.txt",
      "text/plain"
    );

    // 6. Test attachment listing
    console.log("6. Verifying all attachments are listed...");
    const updatedNoteResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}`
    );
    const updatedNote = await updatedNoteResponse.json();

    console.log(
      `✅ Note now has ${updatedNote.attachments?.length || 0} attachments:`
    );
    updatedNote.attachments?.forEach((att, index) => {
      console.log(
        `   ${index + 1}. ${att.originalName} (${att.type}, ${formatFileSize(
          att.size
        )})`
      );
    });

    // 7. Test attachment removal
    if (updatedNote.attachments && updatedNote.attachments.length > 0) {
      const attachmentToRemove = updatedNote.attachments[0];
      console.log(
        `7. Testing attachment removal: ${attachmentToRemove.originalName}...`
      );

      const removeResponse = await fetch(
        `${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}/attachments/${attachmentToRemove.filename}`,
        { method: "DELETE" }
      );

      if (removeResponse.ok) {
        console.log("✅ Attachment removed successfully");
      } else {
        console.log("❌ Failed to remove attachment");
      }
    }

    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    console.log("\n🎉 All frontend file upload tests completed!");
  } catch (error) {
    console.error("❌ Frontend test failed:", error.message);
    process.exit(1);
  }
}

async function testFileUpload(noteId, filePath, fileName, mimeType) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const blob = new Blob([fileContent], { type: mimeType });

    const form = new FormData();
    form.append("file", blob, fileName);

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

    const result = await uploadResponse.json();
    console.log(
      `   ✅ Uploaded: ${result.attachment.originalName} (${formatFileSize(
        result.attachment.size
      )})`
    );

    return result.attachment;
  } catch (error) {
    console.error(`   ❌ Upload failed: ${error.message}`);
    throw error;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Run the test
testFrontendFileUpload();
