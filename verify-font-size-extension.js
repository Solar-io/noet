// FontSize Extension Test Suite
console.log("🔬 Testing FontSize Extension...");

// Test 1: Check if FontSize extension is loaded
const checkExtension = () => {
  const editor = window.editor;
  if (!editor) {
    console.error("❌ Editor not found on window.editor");
    return false;
  }

  // Check if setFontSize command exists
  const hasFontSizeCommand = editor.commands.setFontSize;
  const hasUnsetFontSizeCommand = editor.commands.unsetFontSize;

  console.log("✅ FontSize extension commands:", {
    setFontSize: !!hasFontSizeCommand,
    unsetFontSize: !!hasUnsetFontSizeCommand,
  });

  return hasFontSizeCommand && hasUnsetFontSizeCommand;
};

// Test 2: Test font size application
const testFontSize = (fontSize) => {
  const editor = window.editor;
  if (!editor) return false;

  console.log(`📏 Testing font size: ${fontSize}`);

  // Create test text
  editor.chain().focus().insertContent("Test text for font size ").run();

  // Select the text
  editor.chain().focus().selectAll().run();

  // Apply font size
  const result = editor.chain().focus().setFontSize(fontSize).run();

  console.log(`📏 Font size ${fontSize} applied:`, result);

  // Check the HTML output
  const html = editor.getHTML();
  console.log("📄 HTML output:", html);

  // Check if font-size style is in the HTML
  const hasFontSizeStyle = html.includes(`font-size: ${fontSize}`);
  console.log(`✅ Font size ${fontSize} in HTML:`, hasFontSizeStyle);

  return hasFontSizeStyle;
};

// Test 3: Test font size in lists
const testFontSizeInLists = () => {
  const editor = window.editor;
  if (!editor) return false;

  console.log("📝 Testing font size in lists...");

  // Clear editor
  editor.chain().focus().clearContent().run();

  // Create a bullet list
  editor.chain().focus().toggleBulletList().run();

  // Add some text
  editor.chain().focus().insertContent("List item with font size").run();

  // Select the text
  editor.chain().focus().selectAll().run();

  // Apply font size
  const result = editor.chain().focus().setFontSize("24px").run();

  console.log("📝 Font size applied to list:", result);

  // Check the HTML output
  const html = editor.getHTML();
  console.log("📄 List HTML output:", html);

  // Check if font-size style is in the HTML
  const hasFontSizeStyle = html.includes("font-size: 24px");
  console.log("✅ Font size 24px in list HTML:", hasFontSizeStyle);

  return hasFontSizeStyle;
};

// Test 4: Test font size removal
const testFontSizeRemoval = () => {
  const editor = window.editor;
  if (!editor) return false;

  console.log("🗑️ Testing font size removal...");

  // Apply font size first
  editor.chain().focus().selectAll().setFontSize("32px").run();

  // Check it's applied
  let html = editor.getHTML();
  console.log("📄 Before removal:", html);

  // Remove font size
  const result = editor.chain().focus().selectAll().unsetFontSize().run();

  console.log("🗑️ Font size removal result:", result);

  // Check the HTML output
  html = editor.getHTML();
  console.log("📄 After removal:", html);

  // Check if font-size style is gone
  const hasFontSizeStyle = html.includes("font-size:");
  console.log("✅ Font size removed:", !hasFontSizeStyle);

  return !hasFontSizeStyle;
};

// Run all tests
const runTests = () => {
  console.log("🚀 Starting FontSize Extension Tests...");

  const results = {
    extensionLoaded: checkExtension(),
    fontSizeApplication: testFontSize("18px"),
    fontSizeInLists: testFontSizeInLists(),
    fontSizeRemoval: testFontSizeRemoval(),
  };

  console.log("📊 Test Results:", results);

  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log(
      "🎉 All tests passed! FontSize extension is working correctly."
    );
  } else {
    console.log("❌ Some tests failed. Check the results above.");
  }

  return results;
};

// Make test function globally available
window.testFontSizeExtension = runTests;

console.log("🔬 FontSize Extension Test Suite loaded.");
console.log("💡 Run window.testFontSizeExtension() to start testing.");
