#!/usr/bin/env node

/**
 * Test Script: List Functionality Issues
 *
 * This test documents the current list functionality issues and expected behaviors
 * for fixing the TipTap editor list implementation.
 *
 * Issues to test:
 * 1. Enter twice doesn't exit lists
 * 2. Backspace doesn't work properly
 * 3. List nesting is broken
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Testing List Functionality Issues");
console.log("====================================\n");

// Test data for manual verification
const testScenarios = [
  {
    name: "Bullet List Exit Behavior",
    description: "Pressing Enter twice should exit bullet lists",
    steps: [
      "1. Create a bullet list with one item",
      "2. Press Enter to create new list item",
      "3. Press Enter again on empty list item",
      "4. EXPECTED: Should exit list and create normal paragraph",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Exit list, create paragraph",
    currentBehavior: "To be tested",
  },
  {
    name: "Ordered List Exit Behavior",
    description: "Pressing Enter twice should exit ordered lists",
    steps: [
      "1. Create an ordered list with one item",
      "2. Press Enter to create new list item",
      "3. Press Enter again on empty list item",
      "4. EXPECTED: Should exit list and create normal paragraph",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Exit list, create paragraph",
    currentBehavior: "To be tested",
  },
  {
    name: "Task List Exit Behavior",
    description: "Pressing Enter twice should exit task lists",
    steps: [
      "1. Create a task list with one item",
      "2. Press Enter to create new task item",
      "3. Press Enter again on empty task item",
      "4. EXPECTED: Should exit list and create normal paragraph",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Exit list, create paragraph",
    currentBehavior: "To be tested",
  },
  {
    name: "Backspace at List Item Start",
    description: "Backspace at start of list item should lift item out of list",
    steps: [
      "1. Create a list with multiple items",
      "2. Position cursor at start of second list item",
      "3. Press Backspace",
      "4. EXPECTED: Should convert list item to paragraph or lift to previous level",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Lift item out of list or merge with previous",
    currentBehavior: "To be tested",
  },
  {
    name: "List Nesting with Tab",
    description: "Tab should indent list items to create nested lists",
    steps: [
      "1. Create a list with one item",
      "2. Press Enter to create second item",
      "3. Press Tab to indent second item",
      "4. EXPECTED: Should create nested list",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Create nested list structure",
    currentBehavior: "To be tested",
  },
  {
    name: "List Nesting with Shift+Tab",
    description: "Shift+Tab should outdent list items",
    steps: [
      "1. Create a nested list structure",
      "2. Position cursor in nested item",
      "3. Press Shift+Tab",
      "4. EXPECTED: Should outdent item to higher level",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Outdent to higher level",
    currentBehavior: "To be tested",
  },
  {
    name: "List Type Switching",
    description: "Should be able to switch between list types",
    steps: [
      "1. Create a bullet list",
      "2. Select all items",
      "3. Click ordered list button",
      "4. EXPECTED: Should convert to ordered list",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Convert list type",
    currentBehavior: "To be tested",
  },
  {
    name: "Mixed Content in Lists",
    description: "Lists should handle mixed content (text, formatting, etc.)",
    steps: [
      "1. Create a list item",
      "2. Add bold text, italic text, links",
      "3. Press Enter to create new item",
      "4. EXPECTED: Should maintain list structure with formatted content",
      "5. ACTUAL: ???",
    ],
    expectedBehavior: "Maintain list structure with formatting",
    currentBehavior: "To be tested",
  },
];

// Code analysis for current implementation
async function analyzeCurrentImplementation() {
  console.log("📋 Analyzing Current TipTap Implementation");
  console.log("==========================================\n");

  const tipTapFile = path.join(__dirname, "src/TipTapEditor.jsx");

  if (!fs.existsSync(tipTapFile)) {
    console.error("❌ TipTapEditor.jsx not found");
    return;
  }

  const content = fs.readFileSync(tipTapFile, "utf8");

  // Check for list extensions
  const listExtensions = [
    { name: "BulletList", found: content.includes("BulletList") },
    { name: "OrderedList", found: content.includes("OrderedList") },
    { name: "ListItem", found: content.includes("ListItem") },
    { name: "TaskList", found: content.includes("TaskList") },
    { name: "TaskItem", found: content.includes("TaskItem") },
  ];

  console.log("📦 List Extensions Found:");
  listExtensions.forEach((ext) => {
    console.log(`  ${ext.found ? "✅" : "❌"} ${ext.name}`);
  });

  // Check for custom key handling
  const hasCustomKeyHandling =
    content.includes("onKeyDown") || content.includes("keydown");
  console.log(
    `\n⌨️  Custom Key Handling: ${hasCustomKeyHandling ? "✅" : "❌"}`
  );

  // Check for list toggle functions
  const listToggleFunctions = [
    { name: "toggleBulletList", found: content.includes("toggleBulletList") },
    { name: "toggleOrderedList", found: content.includes("toggleOrderedList") },
    { name: "toggleTaskList", found: content.includes("toggleTaskList") },
  ];

  console.log("\n🔧 List Toggle Functions:");
  listToggleFunctions.forEach((func) => {
    console.log(`  ${func.found ? "✅" : "❌"} ${func.name}`);
  });

  // Check for list-specific configurations
  const hasListConfigurations =
    content.includes("configure") &&
    (content.includes("bulletList") || content.includes("orderedList"));
  console.log(
    `\n⚙️  List Configurations: ${hasListConfigurations ? "✅" : "❌"}`
  );

  return {
    extensions: listExtensions,
    keyHandling: hasCustomKeyHandling,
    toggleFunctions: listToggleFunctions,
    configurations: hasListConfigurations,
  };
}

// Manual testing instructions
function generateManualTestInstructions() {
  console.log("\n🔍 Manual Testing Instructions");
  console.log("==============================\n");

  console.log("1. Start the application:");
  console.log("   npm run dev");
  console.log("   Backend: http://localhost:3004");
  console.log("   Frontend: http://localhost:3001");
  console.log("");

  console.log("2. Login with demo credentials:");
  console.log("   Email: demo@example.com");
  console.log("   Password: demo123");
  console.log("");

  console.log("3. Create a new note or open existing note");
  console.log("");

  console.log("4. Test each scenario below:");
  console.log("");

  testScenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Expected: ${scenario.expectedBehavior}`);
    console.log("");
    scenario.steps.forEach((step) => {
      console.log(`   ${step}`);
    });
    console.log("");
  });

  console.log("5. Document results:");
  console.log("   - Record actual behavior for each test");
  console.log("   - Note any console errors");
  console.log("   - Take screenshots if needed");
  console.log("");
}

// Test result documentation template
function generateTestResultsTemplate() {
  console.log("📝 Test Results Documentation Template");
  console.log("======================================\n");

  const template = {
    testDate: new Date().toISOString(),
    environment: {
      node: process.version,
      frontend: "http://localhost:3001",
      backend: "http://localhost:3004",
    },
    testResults: testScenarios.map((scenario) => ({
      name: scenario.name,
      description: scenario.description,
      expectedBehavior: scenario.expectedBehavior,
      actualBehavior: "TO BE FILLED",
      status: "PENDING", // PASS/FAIL/PENDING
      notes: "",
      consoleErrors: [],
      screenshots: [],
    })),
  };

  // Write template to file
  const templatePath = path.join(
    __dirname,
    "test-results-list-functionality.json"
  );
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));

  console.log(`Template saved to: ${templatePath}`);
  console.log("Fill in the actualBehavior and status fields after testing");
}

// Main execution
async function main() {
  try {
    await analyzeCurrentImplementation();
    generateManualTestInstructions();
    generateTestResultsTemplate();

    console.log("\n🎯 Next Steps:");
    console.log("1. Run manual tests following the instructions above");
    console.log("2. Document results in test-results-list-functionality.json");
    console.log("3. Identify specific issues that need fixing");
    console.log("4. Create fixes for identified issues");
    console.log("5. Re-run tests to verify fixes");
  } catch (error) {
    console.error("❌ Test setup failed:", error);
  }
}

main();
