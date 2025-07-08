import fs from "fs/promises";
import FormData from "form-data";
import fetch from "node-fetch";

// Create a minimal test ENEX file
const testEnex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="20250708T013000Z" application="Evernote" version="10.143.4">
  <note>
    <title>Test Note for Notebook Creation</title>
    <created>20250708T013000Z</created>
    <updated>20250708T013000Z</updated>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>
  <div>This is a test note to verify notebook creation works.</div>
  <div><br/></div>
  <div>The notebook should be named "Test Notebook Import" based on the filename.</div>
</en-note>
]]></content>
  </note>
</en-export>`;

async function testImport() {
  try {
    // Write test ENEX file
    const testFile = "Test Notebook Import.enex";
    await fs.writeFile(testFile, testEnex);

    // Create form data
    const form = new FormData();
    form.append("evernoteFile", await fs.readFile(testFile), testFile);
    form.append(
      "options",
      JSON.stringify({
        preserveNotebooks: true,
        preserveTags: true,
        preserveCreatedDates: true,
        preserveAttachments: true,
        conflictResolution: "rename",
      })
    );

    // Make request
    const response = await fetch(
      "http://localhost:3004/api/user-1/import/evernote",
      {
        method: "POST",
        body: form,
      }
    );

    // Check response
    if (!response.ok) {
      throw new Error(
        `Import failed: ${response.status} ${await response.text()}`
      );
    }

    const results = await response.json();
    console.log("✅ Import Results:", JSON.stringify(results, null, 2));

    // Verify notebooks file exists and contains our notebook
    try {
      const notebooksData = await fs.readFile(
        "notes/user-1/notebooks.json",
        "utf8"
      );
      const notebooks = JSON.parse(notebooksData);
      const testNotebook = notebooks.find(
        (nb) => nb.name === "Test Notebook Import"
      );

      if (testNotebook) {
        console.log("✅ Notebook created successfully:", testNotebook);
      } else {
        console.log("❌ Notebook not found in notebooks.json");
      }
    } catch (e) {
      console.log("ℹ️ Could not verify notebook creation:", e.message);
    }

    // Clean up
    await fs.unlink(testFile);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testImport();
