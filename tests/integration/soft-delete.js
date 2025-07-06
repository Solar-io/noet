#!/usr/bin/env node

/**
 * Test script for soft delete functionality
 */

import fs from "fs";

const BACKEND_URL = "http://localhost:3004";
const USER_ID = "demo-user";

async function testSoftDelete() {
  console.log("🔄 Testing soft delete functionality...\n");

  try {
    // 1. Create a test note
    console.log("1. Creating test note...");
    const createResponse = await fetch(`${BACKEND_URL}/api/${USER_ID}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Note for Soft Delete",
        content:
          "<p>This note will be tested for soft delete functionality.</p>",
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create note: ${createResponse.statusText}`);
    }

    const testNote = await createResponse.json();
    console.log(`✅ Created test note: ${testNote.id}`);

    // 2. Verify note appears in "all" view
    console.log('2. Verifying note appears in "all" view...');
    const allNotesResponse = await fetch(`${BACKEND_URL}/api/${USER_ID}/notes`);
    const allNotes = await allNotesResponse.json();

    const noteInAll = allNotes.find((n) => n.id === testNote.id);
    if (noteInAll) {
      console.log('✅ Note appears in "all" view');
    } else {
      throw new Error('Note does not appear in "all" view');
    }

    // 3. Verify note does NOT appear in trash view initially
    console.log("3. Verifying note does NOT appear in trash view...");
    const trashNotesResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes?deleted=true`
    );
    const trashNotes = await trashNotesResponse.json();

    const noteInTrash = trashNotes.find((n) => n.id === testNote.id);
    if (!noteInTrash) {
      console.log("✅ Note correctly NOT in trash view");
    } else {
      throw new Error("Note incorrectly appears in trash view");
    }

    // 4. Soft delete the note
    console.log("4. Soft deleting the note...");
    const deleteResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}`,
      {
        method: "DELETE",
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Failed to delete note: ${deleteResponse.statusText}`);
    }

    const deleteResult = await deleteResponse.json();
    console.log("✅ Note soft deleted:", deleteResult.message);

    // 5. Verify note does NOT appear in "all" view after deletion
    console.log(
      '5. Verifying note does NOT appear in "all" view after deletion...'
    );
    const allNotesAfterResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes`
    );
    const allNotesAfter = await allNotesAfterResponse.json();

    const noteInAllAfter = allNotesAfter.find((n) => n.id === testNote.id);
    if (!noteInAllAfter) {
      console.log('✅ Note correctly removed from "all" view');
    } else {
      throw new Error('Note still appears in "all" view after deletion');
    }

    // 6. Verify note DOES appear in trash view after deletion
    console.log("6. Verifying note appears in trash view after deletion...");
    const trashNotesAfterResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes?deleted=true`
    );
    const trashNotesAfter = await trashNotesAfterResponse.json();

    const noteInTrashAfter = trashNotesAfter.find((n) => n.id === testNote.id);
    if (noteInTrashAfter && noteInTrashAfter.deleted) {
      console.log("✅ Note correctly appears in trash view");
      console.log(`   Deleted at: ${noteInTrashAfter.deletedAt}`);
    } else {
      throw new Error("Note does not appear in trash view after deletion");
    }

    // 7. Test restore functionality
    console.log("7. Testing restore functionality...");
    const restoreResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}/restore`,
      {
        method: "POST",
      }
    );

    if (!restoreResponse.ok) {
      throw new Error(`Failed to restore note: ${restoreResponse.statusText}`);
    }

    const restoreResult = await restoreResponse.json();
    console.log("✅ Note restored:", restoreResult.message);

    // 8. Verify note appears in "all" view after restore
    console.log('8. Verifying note appears in "all" view after restore...');
    const allNotesRestoredResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes`
    );
    const allNotesRestored = await allNotesRestoredResponse.json();

    const noteInAllRestored = allNotesRestored.find(
      (n) => n.id === testNote.id
    );
    if (noteInAllRestored && !noteInAllRestored.deleted) {
      console.log('✅ Note correctly restored to "all" view');
    } else {
      throw new Error('Note not properly restored to "all" view');
    }

    // 9. Test permanent delete
    console.log("9. Testing permanent delete...");

    // First soft delete again
    await fetch(`${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}`, {
      method: "DELETE",
    });

    // Then permanently delete
    const permanentDeleteResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes/${testNote.id}/permanent`,
      {
        method: "DELETE",
      }
    );

    if (!permanentDeleteResponse.ok) {
      throw new Error(
        `Failed to permanently delete note: ${permanentDeleteResponse.statusText}`
      );
    }

    const permanentDeleteResult = await permanentDeleteResponse.json();
    console.log("✅ Note permanently deleted:", permanentDeleteResult.message);

    // 10. Verify note is completely gone
    console.log("10. Verifying note is completely gone...");
    const finalTrashResponse = await fetch(
      `${BACKEND_URL}/api/${USER_ID}/notes?deleted=true`
    );
    const finalTrash = await finalTrashResponse.json();

    const noteInFinalTrash = finalTrash.find((n) => n.id === testNote.id);
    if (!noteInFinalTrash) {
      console.log("✅ Note completely removed from system");
    } else {
      throw new Error("Note still exists after permanent deletion");
    }

    console.log("\n🎉 All soft delete tests passed!");
  } catch (error) {
    console.error("❌ Soft delete test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testSoftDelete();
