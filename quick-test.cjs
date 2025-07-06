#!/usr/bin/env node

/**
 * Quick Test Script for Noet App Issues
 * Checks: Double line spacing and text loss problems
 */

const fetch = require("node-fetch");

const BACKEND_URL = "http://localhost:3004";
const FRONTEND_URL = "http://localhost:3001";

async function checkServers() {
  console.log("🔍 Checking server status...");

  try {
    // Check backend health
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      timeout: 3000,
    });
    console.log("✅ Backend server is running on port 3004");

    // Check frontend (just try to reach it)
    const frontendResponse = await fetch(FRONTEND_URL, { timeout: 3000 });
    console.log("✅ Frontend server is running on port 3001");

    return true;
  } catch (error) {
    console.error("❌ Server check failed:", error.message);
    console.log("\n💡 Make sure both servers are running:");
    console.log("   Terminal 1: cd server && node server.js");
    console.log("   Terminal 2: npm run dev");
    return false;
  }
}

async function checkCSSFixes() {
  console.log("\n📋 Checking CSS fixes for double line spacing...");

  const fs = require("fs");
  const cssPath = "./src/index.css";

  try {
    const cssContent = fs.readFileSync(cssPath, "utf8");

    // Check for our specific fixes
    const hasSpanFontSizeRule = cssContent.includes(
      'span[style*="font-size"]:not(.task-item span):not(.list-item span)'
    );
    const hasTaskItemRule = cssContent.includes(".ProseMirror li.task-item");
    const hasListItemRule = cssContent.includes(".ProseMirror li.list-item");
    const hasImportantDeclarations = cssContent.includes(
      "line-height: 1.5 !important"
    );

    console.log(`   Font-size span rule: ${hasSpanFontSizeRule ? "✅" : "❌"}`);
    console.log(`   Task item rule: ${hasTaskItemRule ? "✅" : "❌"}`);
    console.log(`   List item rule: ${hasListItemRule ? "✅" : "❌"}`);
    console.log(
      `   Important declarations: ${hasImportantDeclarations ? "✅" : "❌"}`
    );

    const allCSSFixesPresent =
      hasSpanFontSizeRule &&
      hasTaskItemRule &&
      hasListItemRule &&
      hasImportantDeclarations;

    if (!allCSSFixesPresent) {
      console.log("\n⚠️  CSS fixes are incomplete or missing!");
      console.log("The line-height fix may not be working properly.");
    }

    return allCSSFixesPresent;
  } catch (error) {
    console.error("❌ Could not read CSS file:", error.message);
    return false;
  }
}

async function checkAppTipTapFixes() {
  console.log("\n💾 Checking App-TipTap.jsx for text loss prevention...");

  const fs = require("fs");
  const appPath = "./src/App-TipTap.jsx";

  try {
    const appContent = fs.readFileSync(appPath, "utf8");

    // Check for save before switch logic - updated to match actual implementation
    const hasSaveBeforeSwitch = appContent.includes(
      "await handleNoteSave(selectedNote.content"
    );
    const hasHandleNoteSelection = appContent.includes("handleNoteSelection");
    const hasExplicitSave = appContent.includes(
      "SAVE CURRENT NOTE CONTENT BEFORE SWITCHING"
    );
    const hasCurrentNoteCheck = appContent.includes(
      "selectedNote && selectedNote.id !== note.id"
    );

    console.log(
      `   Save before switch logic: ${hasSaveBeforeSwitch ? "✅" : "❌"}`
    );
    console.log(
      `   Note selection handler: ${hasHandleNoteSelection ? "✅" : "❌"}`
    );
    console.log(`   Explicit save comment: ${hasExplicitSave ? "✅" : "❌"}`);
    console.log(`   Current note check: ${hasCurrentNoteCheck ? "✅" : "❌"}`);

    const textLossFixesPresent =
      hasSaveBeforeSwitch && hasExplicitSave && hasCurrentNoteCheck;

    if (!textLossFixesPresent) {
      console.log("\n⚠️  Text loss prevention fixes are missing!");
      console.log("Note switching may not save content properly.");
    }

    return textLossFixesPresent;
  } catch (error) {
    console.error("❌ Could not read App-TipTap.jsx file:", error.message);
    return false;
  }
}

async function checkServerVersionSettings() {
  console.log("\n⚙️  Checking server version settings...");

  const fs = require("fs");
  const serverPath = "./server/server.js";

  try {
    const serverContent = fs.readFileSync(serverPath, "utf8");

    // Check for version debounce settings
    const hasFocusSwitchSetting = serverContent.includes("focus_switch: 10000");
    const hasVersionDebounce = serverContent.includes("VERSION_DEBOUNCE_TIMES");

    console.log(
      `   Focus switch timing (10s): ${hasFocusSwitchSetting ? "✅" : "❌"}`
    );
    console.log(
      `   Version debounce settings: ${hasVersionDebounce ? "✅" : "❌"}`
    );

    if (hasFocusSwitchSetting) {
      console.log("   ✅ Focus switch versions reduced to 10 second intervals");
    } else {
      console.log("   ⚠️  Focus switch versions may be created too frequently");
    }

    return hasFocusSwitchSetting && hasVersionDebounce;
  } catch (error) {
    console.error("❌ Could not read server.js file:", error.message);
    return false;
  }
}

async function runQuickDiagnostics() {
  console.log("🚀 Noet App Quick Diagnostics");
  console.log("=" + "=".repeat(40));

  const serverStatus = await checkServers();
  const cssStatus = await checkCSSFixes();
  const appStatus = await checkAppTipTapFixes();
  const serverConfigStatus = await checkServerVersionSettings();

  console.log("\n📊 DIAGNOSTIC SUMMARY");
  console.log("=" + "=".repeat(30));

  const overallStatus =
    serverStatus && cssStatus && appStatus && serverConfigStatus;

  console.log(
    `🎯 Overall Status: ${
      overallStatus ? "✅ ALL FIXES PRESENT" : "❌ ISSUES DETECTED"
    }`
  );
  console.log(
    `🖥️  Server Status: ${serverStatus ? "✅ Running" : "❌ Not Running"}`
  );
  console.log(
    `🎨 CSS Fixes: ${cssStatus ? "✅ Applied" : "❌ Missing/Incomplete"}`
  );
  console.log(`💾 Text Loss Fixes: ${appStatus ? "✅ Applied" : "❌ Missing"}`);
  console.log(
    `⚙️  Server Config: ${serverConfigStatus ? "✅ Applied" : "❌ Missing"}`
  );

  if (!overallStatus) {
    console.log("\n🔧 RECOMMENDED ACTIONS:");
    if (!serverStatus)
      console.log("   1. Start both backend and frontend servers");
    if (!cssStatus)
      console.log("   2. Apply CSS line-height fixes to src/index.css");
    if (!appStatus)
      console.log("   3. Add save-before-switch logic to src/App-TipTap.jsx");
    if (!serverConfigStatus)
      console.log("   4. Update server version timing in server/server.js");
  }

  console.log("\n💡 To test the fixes manually:");
  console.log("   1. Open http://localhost:3001 in browser");
  console.log("   2. Create lists with bullets/checkboxes/numbers");
  console.log("   3. Apply font size changes - check for double spacing");
  console.log("   4. Type content in notes and switch between them rapidly");
  console.log("   5. Verify content is preserved when switching back");

  return overallStatus;
}

// Run diagnostics
if (require.main === module) {
  runQuickDiagnostics()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("❌ Diagnostic failed:", error);
      process.exit(1);
    });
}

module.exports = {
  runQuickDiagnostics,
  checkServers,
  checkCSSFixes,
  checkAppTipTapFixes,
};
