/**
 * Test Script: Attachment Handling with Versions
 *
 * This script tests that file attachments are properly handled during version operations,
 * including upload, version creation, restoration, and cleanup.
 */

import configService from "../../src/configService.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAttachmentVersions() {
  console.log("📎 Testing Attachment Handling with Versions...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const userId = "user-1";
  const testData = {
    createdNotes: [],
    createdVersions: [],
    uploadedFiles: [],
    testFiles: [],
  };

  // Performance tracking
  const performanceData = {
    fileUpload: [],
    versionCreation: [],
    versionRestoration: [],
    attachmentRetrieval: [],
    attachmentDeletion: [],
  };

  try {
    // Create test files
    console.log("📁 Creating test files...");
    const testFilesData = [
      {
        name: "test-document.txt",
        content:
          "This is a test document for attachment testing.\nLine 2\nLine 3\n",
        mimetype: "text/plain",
      },
      {
        name: "test-image.txt", // Simulating image as text for simplicity
        content: "FAKE_IMAGE_DATA_FOR_TESTING_PURPOSES_ONLY",
        mimetype: "image/jpeg",
      },
      {
        name: "test-large-file.txt",
        content: "Large file content: " + "x".repeat(10000), // 10KB+ file
        mimetype: "text/plain",
      },
    ];

    for (const fileData of testFilesData) {
      const filePath = path.join(__dirname, fileData.name);
      fs.writeFileSync(filePath, fileData.content);
      testData.testFiles.push(filePath);
      console.log(
        `✅ Created test file: ${fileData.name} (${fileData.content.length} bytes)`
      );
    }

    // Test 1: Create note with initial attachments
    console.log("\n📝 Test 1: Create note with initial attachments...");
    const startTime1 = Date.now();

    const createResponse = await fetch(`${backendUrl}/api/${userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Note with Attachments",
        content: "This note will have file attachments",
        attachments: [],
        tags: ["attachment-test"],
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.status}`);
    }

    const testNote = await createResponse.json();
    testData.createdNotes.push(testNote.id);

    const duration1 = Date.now() - startTime1;
    console.log(`✅ Created note for attachment testing (${duration1}ms)`);
    console.log(`   Note ID: ${testNote.id}`);

    // Test 2: Upload attachments to the note
    console.log("\n📤 Test 2: Upload attachments to the note...");
    const uploadedAttachments = [];

    for (const fileData of testFilesData) {
      const startTime2 = Date.now();
      const filePath = path.join(__dirname, fileData.name);

      // Create FormData for file upload
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(filePath);
      const blob = new Blob([fileBuffer], { type: fileData.mimetype });
      formData.append("file", blob, fileData.name);
      formData.append("noteId", testNote.id);

      const uploadResponse = await fetch(
        `${backendUrl}/api/${userId}/attachments`,
        {
          method: "POST",
          body: formData,
        }
      );

      const duration2 = Date.now() - startTime2;
      performanceData.fileUpload.push(duration2);

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        uploadedAttachments.push(uploadResult);
        testData.uploadedFiles.push(uploadResult.id);
        console.log(`✅ Uploaded ${fileData.name} (${duration2}ms)`);
        console.log(
          `   File ID: ${uploadResult.id}, Size: ${uploadResult.size} bytes`
        );
      } else {
        console.log(`❌ Failed to upload ${fileData.name} (${duration2}ms)`);
      }
    }

    // Test 3: Create version with attachments
    console.log("\n📋 Test 3: Create version with attachments...");
    const startTime3 = Date.now();

    const versionResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Version 1 with Attachments",
          content: "This is the first version with attachments",
          attachments: uploadedAttachments.map((att) => att.id),
          description: "Initial version with file attachments",
        }),
      }
    );

    if (!versionResponse.ok) {
      throw new Error(`Failed to create version: ${versionResponse.status}`);
    }

    const version1 = await versionResponse.json();
    testData.createdVersions.push(version1.id);

    const duration3 = Date.now() - startTime3;
    performanceData.versionCreation.push(duration3);
    console.log(`✅ Created version with attachments (${duration3}ms)`);
    console.log(`   Version ID: ${version1.id}`);
    console.log(
      `   Attachments: ${
        version1.attachments ? version1.attachments.length : 0
      }`
    );

    // Test 4: Add more attachments and create second version
    console.log(
      "\n📎 Test 4: Add more attachments and create second version..."
    );

    // Create additional test file
    const additionalFileData = {
      name: "additional-test.txt",
      content: "Additional file content for version 2",
      mimetype: "text/plain",
    };

    const additionalFilePath = path.join(__dirname, additionalFileData.name);
    fs.writeFileSync(additionalFilePath, additionalFileData.content);
    testData.testFiles.push(additionalFilePath);

    // Upload additional file
    const additionalFormData = new FormData();
    const additionalFileBuffer = fs.readFileSync(additionalFilePath);
    const additionalBlob = new Blob([additionalFileBuffer], {
      type: additionalFileData.mimetype,
    });
    additionalFormData.append("file", additionalBlob, additionalFileData.name);
    additionalFormData.append("noteId", testNote.id);

    const additionalUploadResponse = await fetch(
      `${backendUrl}/api/${userId}/attachments`,
      {
        method: "POST",
        body: additionalFormData,
      }
    );

    let additionalAttachment = null;
    if (additionalUploadResponse.ok) {
      additionalAttachment = await additionalUploadResponse.json();
      testData.uploadedFiles.push(additionalAttachment.id);
      console.log(`✅ Uploaded additional file: ${additionalFileData.name}`);
    }

    // Create second version
    const allAttachments = [...uploadedAttachments];
    if (additionalAttachment) {
      allAttachments.push(additionalAttachment);
    }

    const startTime4 = Date.now();
    const version2Response = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Version 2 with More Attachments",
          content: "This is the second version with more attachments",
          attachments: allAttachments.map((att) => att.id),
          description: "Second version with additional file attachments",
        }),
      }
    );

    if (!version2Response.ok) {
      throw new Error(
        `Failed to create second version: ${version2Response.status}`
      );
    }

    const version2 = await version2Response.json();
    testData.createdVersions.push(version2.id);

    const duration4 = Date.now() - startTime4;
    performanceData.versionCreation.push(duration4);
    console.log(
      `✅ Created second version with more attachments (${duration4}ms)`
    );
    console.log(`   Version ID: ${version2.id}`);
    console.log(
      `   Attachments: ${
        version2.attachments ? version2.attachments.length : 0
      }`
    );

    // Test 5: Restore to first version and verify attachments
    console.log(
      "\n🔄 Test 5: Restore to first version and verify attachments..."
    );
    const startTime5 = Date.now();

    const restoreResponse = await fetch(
      `${backendUrl}/api/${userId}/notes/${testNote.id}/versions/${version1.id}/restore`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preserveAttachments: true,
        }),
      }
    );

    if (!restoreResponse.ok) {
      throw new Error(`Failed to restore version: ${restoreResponse.status}`);
    }

    const restoredNote = await restoreResponse.json();
    const duration5 = Date.now() - startTime5;
    performanceData.versionRestoration.push(duration5);

    console.log(`✅ Restored to first version (${duration5}ms)`);
    console.log(
      `   Restored attachments: ${
        restoredNote.attachments ? restoredNote.attachments.length : 0
      }`
    );

    // Verify restored attachments match version 1
    const expectedAttachmentCount = uploadedAttachments.length;
    const actualAttachmentCount = restoredNote.attachments
      ? restoredNote.attachments.length
      : 0;

    if (actualAttachmentCount === expectedAttachmentCount) {
      console.log("✅ Correct number of attachments restored");
    } else {
      console.log(
        `❌ Attachment count mismatch: expected ${expectedAttachmentCount}, got ${actualAttachmentCount}`
      );
    }

    // Test 6: Retrieve and verify attachment content
    console.log("\n📥 Test 6: Retrieve and verify attachment content...");

    for (const attachment of uploadedAttachments) {
      const startTime6 = Date.now();

      const retrieveResponse = await fetch(
        `${backendUrl}/api/${userId}/attachments/${attachment.id}`
      );
      const duration6 = Date.now() - startTime6;
      performanceData.attachmentRetrieval.push(duration6);

      if (retrieveResponse.ok) {
        const retrievedContent = await retrieveResponse.text();
        const originalFile = testFilesData.find(
          (f) => f.name === attachment.name
        );

        if (originalFile && retrievedContent === originalFile.content) {
          console.log(
            `✅ Attachment ${attachment.name} content verified (${duration6}ms)`
          );
        } else {
          console.log(
            `❌ Attachment ${attachment.name} content mismatch (${duration6}ms)`
          );
        }
      } else {
        console.log(
          `❌ Failed to retrieve attachment ${attachment.name} (${duration6}ms)`
        );
      }
    }

    // Test 7: Test attachment metadata and properties
    console.log("\n📊 Test 7: Test attachment metadata and properties...");

    for (const attachment of uploadedAttachments) {
      console.log(`📎 Attachment: ${attachment.name}`);
      console.log(`   ID: ${attachment.id}`);
      console.log(`   Size: ${attachment.size} bytes`);
      console.log(`   Type: ${attachment.mimetype}`);
      console.log(`   Upload Date: ${attachment.uploadDate}`);

      // Verify required properties
      if (
        attachment.id &&
        attachment.name &&
        attachment.size &&
        attachment.mimetype
      ) {
        console.log(`   ✅ All required properties present`);
      } else {
        console.log(`   ❌ Missing required properties`);
      }
    }

    // Test 8: Test concurrent attachment operations
    console.log("\n⚡ Test 8: Test concurrent attachment operations...");
    const startTime8 = Date.now();

    // Create multiple test files for concurrent upload
    const concurrentFiles = [];
    for (let i = 0; i < 3; i++) {
      const fileName = `concurrent-test-${i}.txt`;
      const filePath = path.join(__dirname, fileName);
      const content = `Concurrent test file ${i} content`;

      fs.writeFileSync(filePath, content);
      testData.testFiles.push(filePath);
      concurrentFiles.push({ name: fileName, content, path: filePath });
    }

    // Upload files concurrently
    const concurrentUploads = concurrentFiles.map((file) => {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(file.path);
      const blob = new Blob([fileBuffer], { type: "text/plain" });
      formData.append("file", blob, file.name);
      formData.append("noteId", testNote.id);

      return fetch(`${backendUrl}/api/${userId}/attachments`, {
        method: "POST",
        body: formData,
      });
    });

    const concurrentResults = await Promise.allSettled(concurrentUploads);
    const duration8 = Date.now() - startTime8;

    let successCount = 0;
    for (const result of concurrentResults) {
      if (result.status === "fulfilled" && result.value.ok) {
        successCount++;
        const attachment = await result.value.json();
        testData.uploadedFiles.push(attachment.id);
      }
    }

    console.log(`✅ Concurrent attachment uploads completed (${duration8}ms)`);
    console.log(
      `   Successful uploads: ${successCount}/${concurrentFiles.length}`
    );

    // Test 9: Error handling - invalid attachment operations
    console.log(
      "\n❌ Test 9: Error handling - invalid attachment operations..."
    );

    // Try to upload file with invalid format
    const invalidFormData = new FormData();
    invalidFormData.append("invalid", "not-a-file");

    const invalidUploadResponse = await fetch(
      `${backendUrl}/api/${userId}/attachments`,
      {
        method: "POST",
        body: invalidFormData,
      }
    );

    if (!invalidUploadResponse.ok) {
      console.log("✅ Invalid file upload correctly rejected");
    } else {
      console.log("❌ Invalid file upload was accepted (should be rejected)");
    }

    // Try to retrieve non-existent attachment
    const nonExistentResponse = await fetch(
      `${backendUrl}/api/${userId}/attachments/non-existent-id`
    );

    if (!nonExistentResponse.ok) {
      console.log("✅ Non-existent attachment request correctly rejected");
    } else {
      console.log(
        "❌ Non-existent attachment request was accepted (should be rejected)"
      );
    }

    // Test 10: Performance benchmark for large file operations
    console.log(
      "\n⏱️  Test 10: Performance benchmark for large file operations..."
    );

    const largeFileData = {
      name: "large-performance-test.txt",
      content: "Large file for performance testing: " + "x".repeat(50000), // 50KB+ file
      mimetype: "text/plain",
    };

    const largeFilePath = path.join(__dirname, largeFileData.name);
    fs.writeFileSync(largeFilePath, largeFileData.content);
    testData.testFiles.push(largeFilePath);

    const benchmarkStartTime = Date.now();

    const largeFormData = new FormData();
    const largeFileBuffer = fs.readFileSync(largeFilePath);
    const largeBlob = new Blob([largeFileBuffer], {
      type: largeFileData.mimetype,
    });
    largeFormData.append("file", largeBlob, largeFileData.name);
    largeFormData.append("noteId", testNote.id);

    const largeUploadResponse = await fetch(
      `${backendUrl}/api/${userId}/attachments`,
      {
        method: "POST",
        body: largeFormData,
      }
    );

    const benchmarkDuration = Date.now() - benchmarkStartTime;

    if (largeUploadResponse.ok) {
      const largeAttachment = await largeUploadResponse.json();
      testData.uploadedFiles.push(largeAttachment.id);
      console.log(`✅ Large file uploaded (${benchmarkDuration}ms)`);
      console.log(`   File size: ${largeAttachment.size} bytes`);

      if (benchmarkDuration > 100) {
        console.log(
          `⚠️  Performance warning: Large file upload took ${benchmarkDuration}ms (>100ms threshold)`
        );
      }
    } else {
      console.log(`❌ Large file upload failed (${benchmarkDuration}ms)`);
    }

    // Test 11: Attachment cleanup and deletion
    console.log("\n🗑️  Test 11: Attachment cleanup and deletion...");

    // Delete a specific attachment
    if (uploadedAttachments.length > 0) {
      const attachmentToDelete = uploadedAttachments[0];
      const startTime11 = Date.now();

      const deleteResponse = await fetch(
        `${backendUrl}/api/${userId}/attachments/${attachmentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      const duration11 = Date.now() - startTime11;
      performanceData.attachmentDeletion.push(duration11);

      if (deleteResponse.ok) {
        console.log(`✅ Attachment deleted (${duration11}ms)`);
        console.log(`   Deleted: ${attachmentToDelete.name}`);

        // Remove from our tracking
        testData.uploadedFiles = testData.uploadedFiles.filter(
          (id) => id !== attachmentToDelete.id
        );
      } else {
        console.log(`❌ Failed to delete attachment (${duration11}ms)`);
      }
    }

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(`File Upload: ${performanceData.fileUpload.join("ms, ")}ms`);
    console.log(
      `Version Creation: ${performanceData.versionCreation.join("ms, ")}ms`
    );
    console.log(
      `Version Restoration: ${performanceData.versionRestoration.join(
        "ms, "
      )}ms`
    );
    console.log(
      `Attachment Retrieval: ${performanceData.attachmentRetrieval.join(
        "ms, "
      )}ms`
    );
    console.log(
      `Attachment Deletion: ${performanceData.attachmentDeletion.join(
        "ms, "
      )}ms`
    );

    const allOperations = [
      ...performanceData.fileUpload,
      ...performanceData.versionCreation,
      ...performanceData.versionRestoration,
      ...performanceData.attachmentRetrieval,
      ...performanceData.attachmentDeletion,
    ];

    if (allOperations.length > 0) {
      const avgPerformance =
        allOperations.reduce((a, b) => a + b, 0) / allOperations.length;
      console.log(`\nAverage Operation Time: ${avgPerformance.toFixed(2)}ms`);

      // Performance warnings
      const slowOperations = allOperations.filter((time) => time > 100);
      if (slowOperations.length > 0) {
        console.log(
          `⚠️  Performance warning: ${slowOperations.length} operations exceeded 100ms threshold`
        );
        console.log(`   Slow operations: ${slowOperations.join("ms, ")}ms`);
      }
    }

    console.log("\n🎉 Attachment Versions test completed successfully!");
  } catch (error) {
    console.error("\n❌ Attachment Versions test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete attachments
    for (const attachmentId of testData.uploadedFiles) {
      try {
        await fetch(`${backendUrl}/api/${userId}/attachments/${attachmentId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(
          `Failed to delete attachment ${attachmentId}:`,
          error.message
        );
      }
    }

    // Delete versions
    for (const versionId of testData.createdVersions) {
      try {
        await fetch(`${backendUrl}/api/${userId}/versions/${versionId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete version ${versionId}:`, error.message);
      }
    }

    // Delete notes
    for (const noteId of testData.createdNotes) {
      try {
        await fetch(`${backendUrl}/api/${userId}/notes/${noteId}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.warn(`Failed to delete note ${noteId}:`, error.message);
      }
    }

    // Delete test files
    for (const filePath of testData.testFiles) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn(`Failed to delete test file ${filePath}:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testAttachmentVersions().catch(console.error);
