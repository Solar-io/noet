// Comprehensive test to verify font size fix in live application
// Run this in browser console while testing font size changes

console.log("🔧 Font Size Fix Verification Test");
console.log("Run this in browser console after applying font size changes");

// Test configuration
const testConfig = {
  testSizes: ["14px", "18px", "24px", "28px", "32px"],
  maxRetries: 3,
  delayBetweenTests: 500,
};

// Main test function
async function verifyFontSizeFix() {
  console.log("🔍 Starting font size fix verification...");

  // Step 1: Find the editor
  const editor = document.querySelector(".ProseMirror");
  if (!editor) {
    console.error("❌ TipTap editor not found!");
    return false;
  }

  console.log("✅ Editor found:", editor);

  // Step 2: Check for existing font-size spans
  const existingSpans = editor.querySelectorAll('span[style*="font-size"]');
  console.log(`📏 Found ${existingSpans.length} existing spans with font-size`);

  // Step 3: Test each existing span
  let passedTests = 0;
  let totalTests = 0;

  existingSpans.forEach((span, index) => {
    const inlineStyle = span.style.fontSize;
    const computedStyle = window.getComputedStyle(span).fontSize;
    const isInList = span.closest("li") !== null;

    totalTests++;

    console.log(`Span ${index + 1}:`, {
      element: span,
      inlineStyle,
      computedStyle,
      isInList,
      matches: inlineStyle === computedStyle,
      parent: span.parentElement.tagName,
      className: span.className,
    });

    if (inlineStyle === computedStyle) {
      console.log(`✅ Span ${index + 1}: Font size working correctly`);
      passedTests++;
    } else {
      console.log(
        `❌ Span ${
          index + 1
        }: Font size mismatch - inline: ${inlineStyle}, computed: ${computedStyle}`
      );
    }
  });

  // Step 4: Test specific list items
  const listItems = editor.querySelectorAll("li");
  console.log(`📋 Found ${listItems.length} list items`);

  let listTestsPassed = 0;
  let listTestsTotal = 0;

  listItems.forEach((li, index) => {
    const fontSizeSpans = li.querySelectorAll('span[style*="font-size"]');

    fontSizeSpans.forEach((span, spanIndex) => {
      listTestsTotal++;

      const inlineStyle = span.style.fontSize;
      const computedStyle = window.getComputedStyle(span).fontSize;

      console.log(`List item ${index + 1}, span ${spanIndex + 1}:`, {
        inlineStyle,
        computedStyle,
        matches: inlineStyle === computedStyle,
        html: span.outerHTML.substring(0, 100) + "...",
      });

      if (inlineStyle === computedStyle) {
        listTestsPassed++;
      }
    });
  });

  // Step 5: CSS rules verification
  console.log("🎨 Checking CSS rules...");

  const testRules = [
    '.ProseMirror span[style*="font-size: 28px"]',
    '.ProseMirror ul li span[style*="font-size"]',
    '.ProseMirror li p span[style*="font-size"]',
  ];

  testRules.forEach((rule) => {
    const elements = document.querySelectorAll(rule);
    console.log(`Rule "${rule}": ${elements.length} elements found`);

    if (elements.length > 0) {
      const firstElement = elements[0];
      const computedStyle = window.getComputedStyle(firstElement);
      console.log(
        `  First element computed font-size: ${computedStyle.fontSize}`
      );
    }
  });

  // Step 6: Generate summary
  const regularTestsResult =
    totalTests > 0 ? `${passedTests}/${totalTests}` : "0/0";
  const listTestsResult =
    listTestsTotal > 0 ? `${listTestsPassed}/${listTestsTotal}` : "0/0";

  console.log("📊 Test Results Summary:");
  console.log(`  Regular font-size spans: ${regularTestsResult} passed`);
  console.log(`  List font-size spans: ${listTestsResult} passed`);

  const overallSuccess =
    passedTests === totalTests && listTestsPassed === listTestsTotal;

  if (overallSuccess && totalTests > 0) {
    console.log("🎉 SUCCESS: All font size tests passed!");
    return true;
  } else if (totalTests === 0) {
    console.log(
      "⚠️  No font-size spans found to test. Apply font size changes first."
    );
    return false;
  } else {
    console.log("❌ FAILURE: Some font size tests failed.");
    return false;
  }
}

// Step 7: Instructions for manual testing
console.log("📝 Manual Testing Instructions:");
console.log("1. Select text in a list item");
console.log("2. Change font size using the dropdown");
console.log("3. Run verifyFontSizeFix() in console");
console.log("4. Check if font size is visually applied");

// Auto-run if there are existing spans
setTimeout(() => {
  const existingSpans = document.querySelectorAll(
    '.ProseMirror span[style*="font-size"]'
  );
  if (existingSpans.length > 0) {
    console.log("🔄 Auto-running verification test...");
    verifyFontSizeFix();
  } else {
    console.log(
      "⏳ No existing font-size spans found. Apply font size changes first, then run verifyFontSizeFix()"
    );
  }
}, 1000);

// Make function globally available
window.verifyFontSizeFix = verifyFontSizeFix;

console.log(
  "✅ Font size fix verification test loaded. Run verifyFontSizeFix() after applying font size changes."
);
