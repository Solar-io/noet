// Debug script to inspect font size issues in TipTap editor
// Run this in browser console while font size issue is occurring

console.log("🔍 Font Size Debug Inspector");

// 1. Find the TipTap editor
const editor = document.querySelector(".ProseMirror");
if (!editor) {
  console.error("❌ No TipTap editor found");
} else {
  console.log("✅ TipTap editor found:", editor);
}

// 2. Find all elements with font-size styling
const fontSizeElements = editor.querySelectorAll('*[style*="font-size"]');
console.log(`📏 Elements with font-size: ${fontSizeElements.length}`);

fontSizeElements.forEach((el, index) => {
  const computedStyle = window.getComputedStyle(el);
  const isInList = el.closest("li") !== null;

  console.log(`Element ${index + 1}:`, {
    element: el,
    tagName: el.tagName,
    className: el.className,
    inlineStyle: el.style.fontSize,
    computedFontSize: computedStyle.fontSize,
    isInList: isInList,
    parent: el.parentElement.tagName,
    parentClass: el.parentElement.className,
    html: el.outerHTML.substring(0, 100) + "...",
  });
});

// 3. Check list items specifically
const listItems = editor.querySelectorAll("li");
console.log(`📋 List items found: ${listItems.length}`);

listItems.forEach((li, index) => {
  const spans = li.querySelectorAll('span[style*="font-size"]');
  const paragraphs = li.querySelectorAll("p");

  console.log(`List item ${index + 1}:`, {
    element: li,
    className: li.className,
    spans: spans.length,
    paragraphs: paragraphs.length,
    innerHTML: li.innerHTML.substring(0, 150) + "...",
  });

  spans.forEach((span, spanIndex) => {
    const computedStyle = window.getComputedStyle(span);
    console.log(`  Span ${spanIndex + 1}:`, {
      inlineStyle: span.style.fontSize,
      computedFontSize: computedStyle.fontSize,
      effectiveSize: computedStyle.fontSize,
      display: computedStyle.display,
      parent: span.parentElement.tagName,
    });
  });
});

// 4. Test CSS rule application
console.log("🎨 Testing CSS rule application:");

// Create a test span with font-size
const testSpan = document.createElement("span");
testSpan.style.fontSize = "28px";
testSpan.textContent = "Test text";
testSpan.className = "debug-test-span";

// Test in regular paragraph
const testP = document.createElement("p");
testP.appendChild(testSpan.cloneNode(true));
editor.appendChild(testP);

// Test in list item
const testUl = document.createElement("ul");
testUl.className = "bullet-list";
const testLi = document.createElement("li");
testLi.className = "list-item";
const testLiP = document.createElement("p");
testLiP.appendChild(testSpan.cloneNode(true));
testLi.appendChild(testLiP);
testUl.appendChild(testLi);
editor.appendChild(testUl);

// Check computed styles
setTimeout(() => {
  const regularSpan = editor.querySelector("p > .debug-test-span");
  const listSpan = editor.querySelector("li .debug-test-span");

  console.log("Regular text span:", {
    fontSize: window.getComputedStyle(regularSpan).fontSize,
    display: window.getComputedStyle(regularSpan).display,
  });

  console.log("List text span:", {
    fontSize: window.getComputedStyle(listSpan).fontSize,
    display: window.getComputedStyle(listSpan).display,
  });

  // Clean up test elements
  testP.remove();
  testUl.remove();
}, 100);

// 5. Check for CSS conflicts
console.log("⚠️ Checking for CSS conflicts:");
const allRules = [];
for (let sheet of document.styleSheets) {
  try {
    for (let rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes("font-size")) {
        allRules.push({
          selector: rule.selectorText,
          cssText: rule.cssText,
        });
      }
    }
  } catch (e) {
    console.log("Cannot access stylesheet:", sheet.href);
  }
}

console.log("Font-size related CSS rules:", allRules);

export default {
  runDebug: () => console.log("Debug script loaded"),
};
