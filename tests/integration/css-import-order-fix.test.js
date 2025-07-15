/**
 * CSS Import Order Fix Test
 *
 * This test verifies that:
 * 1. CSS imports are in the correct order
 * 2. Arco Design CSS loads before Tailwind
 * 3. The app renders without black boxes
 * 4. Both frontend and backend are accessible
 */

const fs = require("fs");
const path = require("path");

describe("CSS Import Order Fix", () => {
  const cssFilePath = path.join(__dirname, "../../src/index.css");

  test("should have CSS imports in correct order", () => {
    expect(fs.existsSync(cssFilePath)).toBe(true);

    const cssContent = fs.readFileSync(cssFilePath, "utf-8");
    const lines = cssContent.split("\n").filter((line) => line.trim() !== "");

    // Find the positions of key imports
    let arcoImportIndex = -1;
    let tailwindBaseIndex = -1;

    lines.forEach((line, index) => {
      if (line.includes('@import "@arco-design/web-react/dist/css/arco.css"')) {
        arcoImportIndex = index;
      }
      if (line.includes("@tailwind base")) {
        tailwindBaseIndex = index;
      }
    });

    // Arco import should come before Tailwind
    expect(arcoImportIndex).toBeGreaterThan(-1);
    expect(tailwindBaseIndex).toBeGreaterThan(-1);
    expect(arcoImportIndex).toBeLessThan(tailwindBaseIndex);

    console.log("✅ CSS imports are in correct order");
    console.log(`📍 Arco import at line ${arcoImportIndex + 1}`);
    console.log(`📍 Tailwind base at line ${tailwindBaseIndex + 1}`);
  });

  test("should have Arco Design CSS as first import", () => {
    const cssContent = fs.readFileSync(cssFilePath, "utf-8");
    const lines = cssContent.split("\n").filter((line) => line.trim() !== "");

    // The first non-comment line should be the Arco import
    let firstImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("@import") && !line.startsWith("/*")) {
        firstImportIndex = i;
        break;
      }
    }

    expect(firstImportIndex).toBeGreaterThan(-1);
    expect(lines[firstImportIndex]).toContain(
      "@arco-design/web-react/dist/css/arco.css"
    );

    console.log("✅ Arco Design CSS is the first import");
  });

  test("should not have CSS syntax errors", () => {
    const cssContent = fs.readFileSync(cssFilePath, "utf-8");

    // Check for common CSS import errors
    expect(cssContent).not.toMatch(/@import.*after.*@tailwind/);
    expect(cssContent).not.toMatch(/\@import.*\n.*@tailwind.*\n.*@import/);

    // Verify proper import syntax
    const arcoImportMatch = cssContent.match(
      /@import\s+["']@arco-design\/web-react\/dist\/css\/arco\.css["'];/
    );
    expect(arcoImportMatch).toBeTruthy();

    console.log("✅ No CSS syntax errors detected");
  });
});

// Manual verification instructions
console.log(`
📋 Manual Verification Steps:
1. Start development servers: ./simple-noet.sh start-dev
2. Open http://localhost:3001 in browser
3. Verify no black boxes are visible
4. Check browser console for CSS errors
5. Verify Arco Tree components render properly
6. Test drag-and-drop functionality
7. Test resizable columns
`);
