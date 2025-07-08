// Test script to verify font-size issue and solution
// Run in browser console on the app

console.log("🔧 Testing Font Size Issue Fix");

// Wait for editor to be available
const waitForEditor = () => {
  return new Promise((resolve) => {
    const check = () => {
      const editor = document.querySelector(".ProseMirror");
      if (editor) {
        resolve(editor);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

waitForEditor().then((editor) => {
  console.log("✅ Editor found, running tests...");

  // Test 1: Check if font-size works in regular text
  console.log("Test 1: Regular text font-size");
  const regularText = editor.querySelector("p:not(li p)");
  if (regularText) {
    console.log("Regular text element:", regularText);
    console.log(
      "Computed font-size:",
      window.getComputedStyle(regularText).fontSize
    );
  }

  // Test 2: Check list items with font-size
  console.log("Test 2: List item font-size");
  const listItems = editor.querySelectorAll("li");
  console.log(`Found ${listItems.length} list items`);

  listItems.forEach((li, index) => {
    const spans = li.querySelectorAll('span[style*="font-size"]');
    const paragraphs = li.querySelectorAll("p");

    console.log(`List item ${index + 1}:`, {
      hasSpansWithFontSize: spans.length > 0,
      paragraphCount: paragraphs.length,
      innerHTML: li.innerHTML.substring(0, 100) + "...",
    });

    spans.forEach((span) => {
      const style = window.getComputedStyle(span);
      console.log("  Span font-size:", {
        inline: span.style.fontSize,
        computed: style.fontSize,
        display: style.display,
        visibility: style.visibility,
        parent: span.parentElement.tagName,
      });
    });
  });

  // Test 3: Create manual test elements to compare
  console.log("Test 3: Manual comparison test");

  // Test in regular paragraph
  const testDiv = document.createElement("div");
  testDiv.style.position = "absolute";
  testDiv.style.top = "10px";
  testDiv.style.right = "10px";
  testDiv.style.background = "#f0f0f0";
  testDiv.style.padding = "10px";
  testDiv.style.border = "1px solid #ccc";
  testDiv.style.zIndex = "9999";

  // Regular text test
  const regularTestP = document.createElement("p");
  const regularTestSpan = document.createElement("span");
  regularTestSpan.style.fontSize = "28px";
  regularTestSpan.textContent = "Regular: 28px";
  regularTestP.appendChild(regularTestSpan);

  // List item test
  const listTestUl = document.createElement("ul");
  listTestUl.className = "bullet-list";
  const listTestLi = document.createElement("li");
  listTestLi.className = "list-item";
  const listTestP = document.createElement("p");
  const listTestSpan = document.createElement("span");
  listTestSpan.style.fontSize = "28px";
  listTestSpan.textContent = "List: 28px";
  listTestP.appendChild(listTestSpan);
  listTestLi.appendChild(listTestP);
  listTestUl.appendChild(listTestLi);

  testDiv.appendChild(document.createTextNode("Font Size Test:"));
  testDiv.appendChild(document.createElement("br"));
  testDiv.appendChild(regularTestP);
  testDiv.appendChild(listTestUl);

  document.body.appendChild(testDiv);

  // Check computed styles after a brief delay
  setTimeout(() => {
    const regularStyle = window.getComputedStyle(regularTestSpan);
    const listStyle = window.getComputedStyle(listTestSpan);

    console.log("Manual test results:", {
      regular: {
        fontSize: regularStyle.fontSize,
        display: regularStyle.display,
        lineHeight: regularStyle.lineHeight,
      },
      list: {
        fontSize: listStyle.fontSize,
        display: listStyle.display,
        lineHeight: listStyle.lineHeight,
      },
    });

    // Clean up after 5 seconds
    setTimeout(() => {
      testDiv.remove();
    }, 5000);
  }, 100);
});

// Test 4: Check CSS rules
console.log("Test 4: CSS Rules Analysis");
const style = document.createElement("style");
style.textContent = `
/* Test CSS rule to verify font-size works */
.font-size-test {
  font-size: 28px !important;
  color: red !important;
}
`;
document.head.appendChild(style);

// Apply test class to see if CSS is working
setTimeout(() => {
  const allSpans = document.querySelectorAll(
    '.ProseMirror span[style*="font-size"]'
  );
  console.log(`Found ${allSpans.length} spans with font-size`);

  if (allSpans.length > 0) {
    allSpans[0].className += " font-size-test";
    console.log("Applied test class to first span");

    setTimeout(() => {
      const testStyle = window.getComputedStyle(allSpans[0]);
      console.log("Test span after CSS class:", {
        fontSize: testStyle.fontSize,
        color: testStyle.color,
      });

      // Clean up
      allSpans[0].className = allSpans[0].className.replace(
        " font-size-test",
        ""
      );
      style.remove();
    }, 1000);
  }
}, 1000);

console.log("🔧 Font size tests completed. Check console for results.");
