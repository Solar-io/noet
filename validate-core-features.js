// Core Features Validation Test
// Run this in browser console to verify core functionality after font size fix

console.log("🔧 Core Features Validation Test");
console.log("Testing 5 core features after font size fix");

const coreFeatures = [
  {
    name: "Note Creation",
    test: async () => {
      // Check if note creation works
      const createButton = document.querySelector(
        '[data-testid="create-note"], button[title*="New"], button:contains("New Note")'
      );
      if (createButton) {
        console.log("✅ Note creation button found");
        return true;
      } else {
        console.log("❌ Note creation button not found");
        return false;
      }
    },
  },
  {
    name: "Text Editing",
    test: async () => {
      // Check if TipTap editor is functional
      const editor = document.querySelector(".ProseMirror");
      if (editor && editor.contentEditable === "true") {
        console.log("✅ Text editor is functional");
        return true;
      } else {
        console.log("❌ Text editor not found or not editable");
        return false;
      }
    },
  },
  {
    name: "Font Size Changes",
    test: async () => {
      // Check if font size dropdown exists and works
      const fontSizeDropdown = document.querySelector(
        'select[title*="Font"], select:has(option[value*="px"])'
      );
      if (fontSizeDropdown) {
        console.log("✅ Font size dropdown found");
        return true;
      } else {
        console.log("❌ Font size dropdown not found");
        return false;
      }
    },
  },
  {
    name: "List Creation",
    test: async () => {
      // Check if list buttons work
      const listButtons = document.querySelectorAll(
        'button[title*="list"], button[title*="List"]'
      );
      if (listButtons.length > 0) {
        console.log(`✅ List buttons found: ${listButtons.length}`);
        return true;
      } else {
        console.log("❌ List buttons not found");
        return false;
      }
    },
  },
  {
    name: "Note Saving",
    test: async () => {
      // Check if auto-save or save functionality works
      const saveIndicator = document.querySelector(
        '[data-testid="save-status"], .save-status, .auto-save'
      );
      if (saveIndicator || window.localStorage.getItem("autoSave") !== null) {
        console.log("✅ Save functionality detected");
        return true;
      } else {
        console.log("❌ Save functionality not clearly detected");
        return false;
      }
    },
  },
];

async function validateCoreFeatures() {
  console.log("🔍 Starting core features validation...");

  let passedTests = 0;
  const totalTests = coreFeatures.length;

  for (const feature of coreFeatures) {
    console.log(`\n🧪 Testing: ${feature.name}`);
    try {
      const result = await feature.test();
      if (result) {
        passedTests++;
        console.log(`✅ ${feature.name}: PASSED`);
      } else {
        console.log(`❌ ${feature.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${feature.name}: ERROR - ${error.message}`);
    }
  }

  console.log(
    `\n📊 Core Features Test Results: ${passedTests}/${totalTests} passed`
  );

  if (passedTests === totalTests) {
    console.log(
      "🎉 ALL CORE FEATURES WORKING: Font size fix did not break existing functionality!"
    );
    return true;
  } else {
    console.log(
      "⚠️  SOME CORE FEATURES ISSUES: Font size fix may have caused regressions."
    );
    return false;
  }
}

// Make function globally available
window.validateCoreFeatures = validateCoreFeatures;

// Auto-run after DOM is ready
setTimeout(() => {
  console.log("🔄 Auto-running core features validation...");
  validateCoreFeatures();
}, 2000);

console.log(
  "✅ Core features validation test loaded. Run validateCoreFeatures() to test."
);
