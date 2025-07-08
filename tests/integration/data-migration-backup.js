/**
 * Test Script: Data Migration & Backup Testing
 *
 * This script tests data migration and backup functionality including export/import,
 * backup/restore operations, database migration, and data integrity validation.
 */

import configService from "../../src/configService.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

async function testDataMigrationBackup() {
  console.log("💾 Testing Data Migration & Backup...\n");

  let backendUrl;
  try {
    backendUrl = await configService.getBackendUrl();
    console.log(`✅ Backend URL: ${backendUrl}`);
  } catch (error) {
    console.error("❌ Failed to get backend URL:", error);
    return;
  }

  const testData = {
    createdNotes: [],
    createdTags: [],
    createdUsers: [],
    backupFiles: [],
    tempFiles: [],
  };

  // Performance tracking
  const performanceData = {
    exportOps: [],
    importOps: [],
    backupOps: [],
    restoreOps: [],
    migrationOps: [],
    integrityChecks: [],
  };

  // Data integrity tracking
  const integrityData = {
    checksums: {},
    counts: {},
    relationships: {},
  };

  try {
    // Test 1: Data Export Functionality
    console.log("📤 Test 1: Data Export Functionality...");
    const startTime1 = Date.now();

    // Create test data to export
    const testNotes = [];
    for (let i = 0; i < 10; i++) {
      const noteResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-1",
        },
        body: JSON.stringify({
          title: `Export Test Note ${i + 1}`,
          content: `This is test content for export note ${
            i + 1
          }. Created: ${new Date().toISOString()}`,
          tags: [`export-test`, `note-${i + 1}`],
        }),
      });

      if (noteResponse.ok) {
        const note = await noteResponse.json();
        testNotes.push(note);
        testData.createdNotes.push(note.id);
      }
    }

    // Test JSON export
    const jsonExportResponse = await fetch(
      `${backendUrl}/api/user-1/export/json`,
      {
        headers: { Authorization: "Bearer user-1" },
      }
    );

    if (jsonExportResponse.ok) {
      const exportData = await jsonExportResponse.json();
      console.log(
        `✅ JSON export successful - ${
          exportData.notes?.length || 0
        } notes exported`
      );

      // Verify export contains our test data
      const exportedTestNotes =
        exportData.notes?.filter((note) =>
          note.title.includes("Export Test Note")
        ) || [];

      if (exportedTestNotes.length === testNotes.length) {
        console.log("✅ All test notes included in export");
      } else {
        console.log(
          `❌ Export missing notes: expected ${testNotes.length}, got ${exportedTestNotes.length}`
        );
      }

      // Calculate checksum for data integrity
      const exportChecksum = crypto
        .createHash("md5")
        .update(JSON.stringify(exportData))
        .digest("hex");
      integrityData.checksums.jsonExport = exportChecksum;
      console.log(`✅ Export checksum: ${exportChecksum.substring(0, 8)}...`);
    } else {
      console.log("❌ JSON export failed");
    }

    // Test CSV export
    const csvExportResponse = await fetch(
      `${backendUrl}/api/user-1/export/csv`,
      {
        headers: { Authorization: "Bearer user-1" },
      }
    );

    if (csvExportResponse.ok) {
      const csvData = await csvExportResponse.text();
      console.log(
        `✅ CSV export successful - ${
          csvData.split("\n").length - 1
        } rows exported`
      );

      // Verify CSV contains our test data
      const csvLines = csvData.split("\n");
      const testNoteLines = csvLines.filter((line) =>
        line.includes("Export Test Note")
      );

      if (testNoteLines.length === testNotes.length) {
        console.log("✅ All test notes included in CSV export");
      } else {
        console.log(
          `❌ CSV export missing notes: expected ${testNotes.length}, got ${testNoteLines.length}`
        );
      }
    } else {
      console.log("❌ CSV export failed");
    }

    const duration1 = Date.now() - startTime1;
    performanceData.exportOps.push(duration1);
    console.log(`✅ Data export tested (${duration1}ms)`);

    // Test 2: Data Import Functionality
    console.log("\n📥 Test 2: Data Import Functionality...");
    const startTime2 = Date.now();

    // Prepare test import data
    const importData = {
      notes: [
        {
          id: `import-test-${Date.now()}-1`,
          title: "Imported Note 1",
          content: "This note was imported from external data",
          tags: ["imported", "test"],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        {
          id: `import-test-${Date.now()}-2`,
          title: "Imported Note 2",
          content: "This is another imported note with more content",
          tags: ["imported", "test", "sample"],
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      ],
      tags: ["imported", "test", "sample"],
      metadata: {
        exportDate: new Date().toISOString(),
        version: "1.0",
        noteCount: 2,
      },
    };

    // Test JSON import
    const jsonImportResponse = await fetch(
      `${backendUrl}/api/user-1/import/json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-1",
        },
        body: JSON.stringify(importData),
      }
    );

    if (jsonImportResponse.ok) {
      const importResult = await jsonImportResponse.json();
      console.log(
        `✅ JSON import successful - ${
          importResult.imported || 0
        } notes imported`
      );

      // Verify imported notes exist
      for (const note of importData.notes) {
        const verifyResponse = await fetch(
          `${backendUrl}/api/user-1/notes/${note.id}`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (verifyResponse.ok) {
          const verifiedNote = await verifyResponse.json();
          console.log(`✅ Imported note verified: ${verifiedNote.title}`);
          testData.createdNotes.push(note.id);
        } else {
          console.log(`❌ Imported note not found: ${note.title}`);
        }
      }
    } else {
      console.log("❌ JSON import failed");
    }

    // Test CSV import
    const csvImportData = [
      "title,content,tags,created,modified",
      `"CSV Import Test 1","Content from CSV import","csv,import,test","${new Date().toISOString()}","${new Date().toISOString()}"`,
      `"CSV Import Test 2","Another CSV imported note","csv,import,sample","${new Date().toISOString()}","${new Date().toISOString()}"`,
    ].join("\n");

    const csvImportResponse = await fetch(
      `${backendUrl}/api/user-1/import/csv`,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
          Authorization: "Bearer user-1",
        },
        body: csvImportData,
      }
    );

    if (csvImportResponse.ok) {
      const csvImportResult = await csvImportResponse.json();
      console.log(
        `✅ CSV import successful - ${
          csvImportResult.imported || 0
        } notes imported`
      );

      // Add imported note IDs to cleanup list
      if (csvImportResult.noteIds) {
        testData.createdNotes.push(...csvImportResult.noteIds);
      }
    } else {
      console.log("❌ CSV import failed");
    }

    const duration2 = Date.now() - startTime2;
    performanceData.importOps.push(duration2);
    console.log(`✅ Data import tested (${duration2}ms)`);

    // Test 3: Backup Operations
    console.log("\n💾 Test 3: Backup Operations...");
    const startTime3 = Date.now();

    // Create full backup
    const backupResponse = await fetch(`${backendUrl}/api/admin/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-1",
      },
      body: JSON.stringify({
        type: "full",
        includeUsers: true,
        includeNotes: true,
        includeTags: true,
        includeMetadata: true,
      }),
    });

    if (backupResponse.ok) {
      const backupResult = await backupResponse.json();
      console.log(`✅ Full backup created: ${backupResult.filename}`);
      testData.backupFiles.push(backupResult.filename);

      // Verify backup file exists and has content
      const backupPath = path.join(
        process.cwd(),
        "backups",
        backupResult.filename
      );
      if (fs.existsSync(backupPath)) {
        const stats = fs.statSync(backupPath);
        console.log(`✅ Backup file exists (${stats.size} bytes)`);

        // Calculate backup checksum
        const backupContent = fs.readFileSync(backupPath, "utf8");
        const backupChecksum = crypto
          .createHash("md5")
          .update(backupContent)
          .digest("hex");
        integrityData.checksums.fullBackup = backupChecksum;
        console.log(`✅ Backup checksum: ${backupChecksum.substring(0, 8)}...`);
      } else {
        console.log("❌ Backup file not found");
      }
    } else {
      console.log("❌ Full backup failed");
    }

    // Create incremental backup
    const incrementalBackupResponse = await fetch(
      `${backendUrl}/api/admin/backup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-1",
        },
        body: JSON.stringify({
          type: "incremental",
          since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        }),
      }
    );

    if (incrementalBackupResponse.ok) {
      const incrementalResult = await incrementalBackupResponse.json();
      console.log(
        `✅ Incremental backup created: ${incrementalResult.filename}`
      );
      testData.backupFiles.push(incrementalResult.filename);
    } else {
      console.log("❌ Incremental backup failed");
    }

    // Test backup scheduling
    const scheduleResponse = await fetch(
      `${backendUrl}/api/admin/backup/schedule`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-1",
        },
        body: JSON.stringify({
          frequency: "daily",
          time: "02:00",
          type: "full",
          retention: 30,
        }),
      }
    );

    if (scheduleResponse.ok) {
      console.log("✅ Backup schedule configured");
    } else {
      console.log("❌ Backup scheduling failed");
    }

    const duration3 = Date.now() - startTime3;
    performanceData.backupOps.push(duration3);
    console.log(`✅ Backup operations tested (${duration3}ms)`);

    // Test 4: Restore Operations
    console.log("\n🔄 Test 4: Restore Operations...");
    const startTime4 = Date.now();

    // Get current data counts for comparison
    const preRestoreNotesResponse = await fetch(
      `${backendUrl}/api/user-1/notes`,
      {
        headers: { Authorization: "Bearer user-1" },
      }
    );

    let preRestoreCount = 0;
    if (preRestoreNotesResponse.ok) {
      const preRestoreNotes = await preRestoreNotesResponse.json();
      preRestoreCount = preRestoreNotes.length;
      integrityData.counts.preRestore = preRestoreCount;
    }

    // Create a test backup to restore from
    const testBackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      users: [
        {
          id: "restore-test-user",
          name: "Restore Test User",
          email: "restore@example.com",
          created: new Date().toISOString(),
        },
      ],
      notes: [
        {
          id: "restore-test-note-1",
          title: "Restore Test Note 1",
          content: "This note should be restored",
          tags: ["restore", "test"],
          userId: "restore-test-user",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
      ],
      tags: ["restore", "test"],
      metadata: {
        noteCount: 1,
        userCount: 1,
        tagCount: 2,
      },
    };

    // Write test backup file
    const testBackupPath = path.join(
      process.cwd(),
      "backups",
      `test-restore-${Date.now()}.json`
    );
    fs.writeFileSync(testBackupPath, JSON.stringify(testBackupData, null, 2));
    testData.backupFiles.push(path.basename(testBackupPath));

    // Test restore operation
    const restoreResponse = await fetch(`${backendUrl}/api/admin/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-1",
      },
      body: JSON.stringify({
        backupFile: path.basename(testBackupPath),
        mode: "merge", // Don't overwrite existing data
        validateIntegrity: true,
      }),
    });

    if (restoreResponse.ok) {
      const restoreResult = await restoreResponse.json();
      console.log(
        `✅ Restore completed: ${restoreResult.restored || 0} items restored`
      );

      // Verify restored data
      const restoredNoteResponse = await fetch(
        `${backendUrl}/api/user-1/notes/restore-test-note-1`,
        {
          headers: { Authorization: "Bearer user-1" },
        }
      );

      if (restoredNoteResponse.ok) {
        const restoredNote = await restoredNoteResponse.json();
        console.log(`✅ Restored note verified: ${restoredNote.title}`);
        testData.createdNotes.push(restoredNote.id);
      } else {
        console.log("❌ Restored note not found");
      }
    } else {
      console.log("❌ Restore operation failed");
    }

    // Test selective restore
    const selectiveRestoreResponse = await fetch(
      `${backendUrl}/api/admin/restore`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-1",
        },
        body: JSON.stringify({
          backupFile: path.basename(testBackupPath),
          mode: "selective",
          items: ["notes"],
          validateIntegrity: true,
        }),
      }
    );

    if (selectiveRestoreResponse.ok) {
      console.log("✅ Selective restore completed");
    } else {
      console.log("❌ Selective restore failed");
    }

    const duration4 = Date.now() - startTime4;
    performanceData.restoreOps.push(duration4);
    console.log(`✅ Restore operations tested (${duration4}ms)`);

    // Test 5: Database Migration Testing
    console.log("\n🔄 Test 5: Database Migration Testing...");
    const startTime5 = Date.now();

    // Test migration version compatibility
    const migrationStatusResponse = await fetch(
      `${backendUrl}/api/admin/migrations/status`,
      {
        headers: { Authorization: "Bearer admin-1" },
      }
    );

    if (migrationStatusResponse.ok) {
      const migrationStatus = await migrationStatusResponse.json();
      console.log(
        `✅ Current migration version: ${migrationStatus.currentVersion}`
      );
      console.log(
        `✅ Pending migrations: ${
          migrationStatus.pendingMigrations?.length || 0
        }`
      );

      // Run pending migrations if any
      if (migrationStatus.pendingMigrations?.length > 0) {
        const runMigrationsResponse = await fetch(
          `${backendUrl}/api/admin/migrations/run`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer admin-1",
            },
            body: JSON.stringify({
              dryRun: true, // Test mode
            }),
          }
        );

        if (runMigrationsResponse.ok) {
          const migrationResult = await runMigrationsResponse.json();
          console.log(
            `✅ Migration dry run completed: ${
              migrationResult.migrationsApplied || 0
            } migrations would be applied`
          );
        } else {
          console.log("❌ Migration dry run failed");
        }
      }
    } else {
      console.log("❌ Migration status check failed");
    }

    // Test schema validation
    const schemaValidationResponse = await fetch(
      `${backendUrl}/api/admin/validate/schema`,
      {
        headers: { Authorization: "Bearer admin-1" },
      }
    );

    if (schemaValidationResponse.ok) {
      const validationResult = await schemaValidationResponse.json();
      console.log(
        `✅ Schema validation: ${validationResult.valid ? "PASSED" : "FAILED"}`
      );

      if (!validationResult.valid) {
        console.log(`   Issues found: ${validationResult.issues?.length || 0}`);
        validationResult.issues?.forEach((issue) => {
          console.log(`   - ${issue}`);
        });
      }
    } else {
      console.log("❌ Schema validation failed");
    }

    const duration5 = Date.now() - startTime5;
    performanceData.migrationOps.push(duration5);
    console.log(`✅ Database migration tested (${duration5}ms)`);

    // Test 6: Data Integrity During Operations
    console.log("\n🔍 Test 6: Data Integrity During Operations...");
    const startTime6 = Date.now();

    // Create baseline data
    const baselineNotes = [];
    for (let i = 0; i < 5; i++) {
      const noteResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-1",
        },
        body: JSON.stringify({
          title: `Integrity Test Note ${i + 1}`,
          content: `Integrity test content ${i + 1}`,
          tags: ["integrity", "test", `note-${i + 1}`],
        }),
      });

      if (noteResponse.ok) {
        const note = await noteResponse.json();
        baselineNotes.push(note);
        testData.createdNotes.push(note.id);
      }
    }

    // Calculate baseline checksum
    const baselineChecksum = crypto
      .createHash("md5")
      .update(
        JSON.stringify(baselineNotes.sort((a, b) => a.id.localeCompare(b.id)))
      )
      .digest("hex");
    integrityData.checksums.baseline = baselineChecksum;

    // Simulate concurrent operations
    const concurrentOps = [];
    for (let i = 0; i < 3; i++) {
      // Update operations
      concurrentOps.push(
        fetch(`${backendUrl}/api/user-1/notes/${baselineNotes[i].id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer user-1",
          },
          body: JSON.stringify({
            ...baselineNotes[i],
            content: `Updated content ${i + 1} - ${Date.now()}`,
            modified: new Date().toISOString(),
          }),
        })
      );
    }

    // Execute concurrent operations
    const concurrentResults = await Promise.allSettled(concurrentOps);
    const successfulOps = concurrentResults.filter(
      (result) => result.status === "fulfilled" && result.value.ok
    ).length;

    console.log(
      `✅ Concurrent operations: ${successfulOps}/${concurrentOps.length} successful`
    );

    // Re-fetch data and verify integrity
    const postOpNotes = [];
    for (const note of baselineNotes) {
      const fetchResponse = await fetch(
        `${backendUrl}/api/user-1/notes/${note.id}`,
        {
          headers: { Authorization: "Bearer user-1" },
        }
      );

      if (fetchResponse.ok) {
        const fetchedNote = await fetchResponse.json();
        postOpNotes.push(fetchedNote);
      }
    }

    // Check data consistency
    if (postOpNotes.length === baselineNotes.length) {
      console.log("✅ Data consistency maintained - no notes lost");
    } else {
      console.log(
        `❌ Data consistency issue: ${
          baselineNotes.length - postOpNotes.length
        } notes lost`
      );
    }

    // Check relationship integrity
    const relationshipIssues = [];
    for (const note of postOpNotes) {
      // Check if note has valid user relationship
      if (!note.userId || note.userId !== "user-1") {
        relationshipIssues.push(
          `Note ${note.id} has invalid user relationship`
        );
      }

      // Check if tags are properly linked
      if (note.tags && note.tags.length > 0) {
        for (const tag of note.tags) {
          if (!tag || typeof tag !== "string") {
            relationshipIssues.push(`Note ${note.id} has invalid tag: ${tag}`);
          }
        }
      }
    }

    if (relationshipIssues.length === 0) {
      console.log("✅ Relationship integrity maintained");
    } else {
      console.log(
        `❌ Relationship integrity issues: ${relationshipIssues.length}`
      );
      relationshipIssues.forEach((issue) => console.log(`   - ${issue}`));
    }

    const duration6 = Date.now() - startTime6;
    performanceData.integrityChecks.push(duration6);
    console.log(`✅ Data integrity tested (${duration6}ms)`);

    // Test 7: Large Dataset Migration
    console.log("\n📊 Test 7: Large Dataset Migration...");
    const startTime7 = Date.now();

    // Create large dataset for migration testing
    const largeDataset = {
      notes: [],
      tags: [],
      users: [],
    };

    // Generate 100 test notes
    for (let i = 0; i < 100; i++) {
      largeDataset.notes.push({
        id: `large-test-${i}`,
        title: `Large Dataset Note ${i + 1}`,
        content: `This is content for large dataset note ${
          i + 1
        }. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`,
        tags: [`large-test`, `batch-${Math.floor(i / 10)}`, `note-${i}`],
        userId: "user-1",
        created: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        modified: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      });
    }

    // Generate 50 test tags
    for (let i = 0; i < 50; i++) {
      largeDataset.tags.push(`large-tag-${i}`);
    }

    // Test large dataset import
    const largeImportResponse = await fetch(
      `${backendUrl}/api/user-1/import/json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer user-1",
        },
        body: JSON.stringify(largeDataset),
      }
    );

    if (largeImportResponse.ok) {
      const largeImportResult = await largeImportResponse.json();
      console.log(
        `✅ Large dataset import successful: ${
          largeImportResult.imported || 0
        } notes imported`
      );

      // Add imported notes to cleanup
      for (const note of largeDataset.notes) {
        testData.createdNotes.push(note.id);
      }

      // Verify import completeness
      const verifyResponse = await fetch(
        `${backendUrl}/api/user-1/notes?limit=1000`,
        {
          headers: { Authorization: "Bearer user-1" },
        }
      );

      if (verifyResponse.ok) {
        const allNotes = await verifyResponse.json();
        const importedNotes = allNotes.filter((note) =>
          note.title.includes("Large Dataset Note")
        );

        if (importedNotes.length === largeDataset.notes.length) {
          console.log("✅ Large dataset import complete and verified");
        } else {
          console.log(
            `❌ Large dataset import incomplete: ${importedNotes.length}/${largeDataset.notes.length} notes found`
          );
        }
      }
    } else {
      console.log("❌ Large dataset import failed");
    }

    const duration7 = Date.now() - startTime7;
    performanceData.migrationOps.push(duration7);
    console.log(`✅ Large dataset migration tested (${duration7}ms)`);

    // Test 8: Backup/Restore Cycle Validation
    console.log("\n🔄 Test 8: Backup/Restore Cycle Validation...");
    const startTime8 = Date.now();

    // Create full backup
    const cycleBackupResponse = await fetch(`${backendUrl}/api/admin/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-1",
      },
      body: JSON.stringify({
        type: "full",
        includeUsers: true,
        includeNotes: true,
        includeTags: true,
      }),
    });

    if (cycleBackupResponse.ok) {
      const cycleBackupResult = await cycleBackupResponse.json();
      const backupFilename = cycleBackupResult.filename;
      testData.backupFiles.push(backupFilename);

      // Get current data counts
      const preDeleteResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        headers: { Authorization: "Bearer user-1" },
      });

      let preDeleteCount = 0;
      if (preDeleteResponse.ok) {
        const preDeleteNotes = await preDeleteResponse.json();
        preDeleteCount = preDeleteNotes.length;
      }

      // Delete some test data
      const notesToDelete = testData.createdNotes.slice(0, 5);
      for (const noteId of notesToDelete) {
        await fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer user-1" },
        });
      }

      // Verify deletion
      const postDeleteResponse = await fetch(`${backendUrl}/api/user-1/notes`, {
        headers: { Authorization: "Bearer user-1" },
      });

      let postDeleteCount = 0;
      if (postDeleteResponse.ok) {
        const postDeleteNotes = await postDeleteResponse.json();
        postDeleteCount = postDeleteNotes.length;
      }

      console.log(
        `✅ Data deleted: ${preDeleteCount} -> ${postDeleteCount} notes`
      );

      // Restore from backup
      const cycleRestoreResponse = await fetch(
        `${backendUrl}/api/admin/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin-1",
          },
          body: JSON.stringify({
            backupFile: backupFilename,
            mode: "merge",
            validateIntegrity: true,
          }),
        }
      );

      if (cycleRestoreResponse.ok) {
        // Verify restore
        const postRestoreResponse = await fetch(
          `${backendUrl}/api/user-1/notes`,
          {
            headers: { Authorization: "Bearer user-1" },
          }
        );

        if (postRestoreResponse.ok) {
          const postRestoreNotes = await postRestoreResponse.json();
          const postRestoreCount = postRestoreNotes.length;

          console.log(
            `✅ Data restored: ${postDeleteCount} -> ${postRestoreCount} notes`
          );

          if (postRestoreCount >= preDeleteCount) {
            console.log(
              "✅ Backup/restore cycle successful - data integrity maintained"
            );
          } else {
            console.log(
              `❌ Backup/restore cycle incomplete: ${postRestoreCount}/${preDeleteCount} notes`
            );
          }
        }
      } else {
        console.log("❌ Restore from backup failed");
      }
    } else {
      console.log("❌ Backup creation failed");
    }

    const duration8 = Date.now() - startTime8;
    performanceData.backupOps.push(duration8);
    console.log(`✅ Backup/restore cycle tested (${duration8}ms)`);

    console.log("\n📊 Performance Summary:");
    console.log("========================");
    console.log(
      `Export Operations: ${performanceData.exportOps.join("ms, ")}ms`
    );
    console.log(
      `Import Operations: ${performanceData.importOps.join("ms, ")}ms`
    );
    console.log(
      `Backup Operations: ${performanceData.backupOps.join("ms, ")}ms`
    );
    console.log(
      `Restore Operations: ${performanceData.restoreOps.join("ms, ")}ms`
    );
    console.log(
      `Migration Operations: ${performanceData.migrationOps.join("ms, ")}ms`
    );
    console.log(
      `Integrity Checks: ${performanceData.integrityChecks.join("ms, ")}ms`
    );

    const allOperations = [
      ...performanceData.exportOps,
      ...performanceData.importOps,
      ...performanceData.backupOps,
      ...performanceData.restoreOps,
      ...performanceData.migrationOps,
      ...performanceData.integrityChecks,
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
        console.log(`   Slowest operation: ${Math.max(...slowOperations)}ms`);
      }
    }

    console.log("\n🔍 Data Integrity Summary:");
    console.log("==========================");
    console.log("Checksums:");
    Object.entries(integrityData.checksums).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.substring(0, 16)}...`);
    });

    console.log("Counts:");
    Object.entries(integrityData.counts).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log("\n🎉 Data Migration & Backup test completed!");
  } catch (error) {
    console.error("\n❌ Data Migration & Backup test failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");

    // Delete created notes
    for (const noteId of testData.createdNotes) {
      try {
        await fetch(`${backendUrl}/api/user-1/notes/${noteId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer user-1" },
        });
      } catch (error) {
        console.warn(`Failed to delete note ${noteId}:`, error.message);
      }
    }

    // Delete created users
    for (const userId of testData.createdUsers) {
      try {
        await fetch(`${backendUrl}/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer admin-1" },
        });
      } catch (error) {
        console.warn(`Failed to delete user ${userId}:`, error.message);
      }
    }

    // Delete backup files
    for (const backupFile of testData.backupFiles) {
      try {
        const backupPath = path.join(process.cwd(), "backups", backupFile);
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
      } catch (error) {
        console.warn(
          `Failed to delete backup file ${backupFile}:`,
          error.message
        );
      }
    }

    // Delete temp files
    for (const tempFile of testData.tempFiles) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (error) {
        console.warn(`Failed to delete temp file ${tempFile}:`, error.message);
      }
    }

    console.log("✅ Cleanup completed");
  }
}

// Run the test
testDataMigrationBackup().catch(console.error);
