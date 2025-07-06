const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    const req = protocol.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on("error", reject);
    req.end();
  });
}

async function testAttachmentFunctionality() {
  console.log("🔍 Testing Attachment Functionality...\n");

  let passed = 0;
  let failed = 0;

  function logResult(test, success, details = "") {
    if (success) {
      console.log(`✅ ${test}`);
      passed++;
    } else {
      console.log(`❌ ${test}: ${details}`);
      failed++;
    }
  }

  // Test 1: Backend health check
  try {
    const health = await makeRequest("http://localhost:3004/api/health");
    const healthData = JSON.parse(health.data);
    logResult("Backend health check", healthData.status === "ok");
  } catch (err) {
    logResult("Backend health check", false, err.message);
  }

  // Test 2: Frontend accessibility
  try {
    const frontend = await makeRequest("http://localhost:3001");
    logResult("Frontend accessibility", frontend.status === 200);
  } catch (err) {
    logResult("Frontend accessibility", false, err.message);
  }

  // Test 3: PDF.js CDN accessibility
  try {
    const pdfjs = await makeRequest(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    );
    logResult("PDF.js CDN accessibility", pdfjs.status === 200);
  } catch (err) {
    logResult("PDF.js CDN accessibility", false, err.message);
  }

  // Test 4: PDF.js Worker accessibility
  try {
    const worker = await makeRequest(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
    );
    logResult("PDF.js Worker accessibility", worker.status === 200);
  } catch (err) {
    logResult("PDF.js Worker accessibility", false, err.message);
  }

  // Test 5: PDFViewer component accessibility
  try {
    const pdfViewer = await makeRequest(
      "http://localhost:3001/src/components/PDFViewer.jsx"
    );
    logResult("PDFViewer component accessibility", pdfViewer.status === 200);
  } catch (err) {
    logResult("PDFViewer component accessibility", false, err.message);
  }

  // Test 6: FileViewer component accessibility
  try {
    const fileViewer = await makeRequest(
      "http://localhost:3001/src/components/FileViewer.jsx"
    );
    logResult("FileViewer component accessibility", fileViewer.status === 200);
  } catch (err) {
    logResult("FileViewer component accessibility", false, err.message);
  }

  // Test 7: Content Security Policy headers
  try {
    const response = await makeRequest("http://localhost:3004/api/health");
    const cspHeader = response.headers["content-security-policy"];
    const hasImageSrc = cspHeader && cspHeader.includes("img-src");
    logResult("CSP headers configured", hasImageSrc);
  } catch (err) {
    logResult("CSP headers configured", false, err.message);
  }

  // Test 8: Cross-Origin Resource Policy
  try {
    const response = await makeRequest("http://localhost:3004/api/health");
    const corpHeader = response.headers["cross-origin-resource-policy"];
    const isCrossOrigin = corpHeader && corpHeader.includes("cross-origin");
    logResult("Cross-Origin Resource Policy", isCrossOrigin);
  } catch (err) {
    logResult("Cross-Origin Resource Policy", false, err.message);
  }

  // Test 9: Check for test attachments
  const testAttachmentsPath = path.join(__dirname, "server", "notes");
  try {
    if (fs.existsSync(testAttachmentsPath)) {
      const files = fs.readdirSync(testAttachmentsPath);
      const hasAttachments = files.some(
        (file) =>
          file.endsWith(".pdf") ||
          file.endsWith(".png") ||
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg")
      );
      logResult("Test attachments available", hasAttachments);
    } else {
      logResult(
        "Test attachments available",
        false,
        "Notes directory not found"
      );
    }
  } catch (err) {
    logResult("Test attachments available", false, err.message);
  }

  // Test 10: Test attachment endpoint format
  try {
    const response = await makeRequest(
      "http://localhost:3004/api/attachments/test.pdf"
    );
    // Even if file doesn't exist, we should get a proper response structure
    const hasProperResponse =
      response.status === 404 || response.status === 200;
    logResult("Attachment endpoint format", hasProperResponse);
  } catch (err) {
    logResult("Attachment endpoint format", false, err.message);
  }

  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(
    `📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`
  );

  if (failed === 0) {
    console.log("\n🎉 All attachment functionality tests passed!");
    console.log("✅ PDF and image viewing should be working properly.");
  } else {
    console.log("\n⚠️  Some tests failed. Check the issues above.");
  }

  console.log("\n🔧 Manual Testing Steps:");
  console.log("1. Open http://localhost:3001 in your browser");
  console.log("2. Upload a PDF file to a note");
  console.log("3. Click on the PDF attachment to view it");
  console.log("4. Upload an image file (PNG/JPG) to a note");
  console.log("5. Click on the image attachment to view it");
  console.log(
    "6. Test notebook unnesting by dragging a notebook out of a folder"
  );

  return failed === 0;
}

if (require.main === module) {
  testAttachmentFunctionality()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Test runner error:", err);
      process.exit(1);
    });
}

module.exports = testAttachmentFunctionality;
