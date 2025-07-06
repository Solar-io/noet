const http = require("http");
const https = require("https");

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    protocol
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            data: data,
          });
        });
      })
      .on("error", reject);
  });
}

async function testAppStatus() {
  console.log("🔍 Testing React App Status...\n");

  // Test 1: Main app
  try {
    const mainApp = await makeRequest("http://localhost:3001");
    if (mainApp.data.includes("React failed to load")) {
      console.log("❌ React app is showing failure message");
    } else if (mainApp.data.includes("Loading React app")) {
      console.log("⏳ React app is still in loading state");
    } else {
      console.log("✅ React app HTML looks normal");
    }
  } catch (err) {
    console.log(`❌ Main app error: ${err.message}`);
  }

  // Test 2: Backend health
  try {
    const backend = await makeRequest("http://localhost:3004/api/health");
    const healthData = JSON.parse(backend.data);
    if (healthData.status === "ok") {
      console.log("✅ Backend is healthy");
    } else {
      console.log("❌ Backend health check failed");
    }
  } catch (err) {
    console.log(`❌ Backend error: ${err.message}`);
  }

  // Test 3: PDF.js CDN
  try {
    const pdfjs = await makeRequest(
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    );
    if (pdfjs.status === 200) {
      console.log("✅ PDF.js CDN is accessible");
    } else {
      console.log("❌ PDF.js CDN failed");
    }
  } catch (err) {
    console.log(`❌ PDF.js CDN error: ${err.message}`);
  }

  // Test 4: Components
  try {
    const pdfViewer = await makeRequest(
      "http://localhost:3001/src/components/PDFViewer.jsx"
    );
    if (pdfViewer.status === 200) {
      console.log("✅ PDFViewer component is accessible");
    } else {
      console.log("❌ PDFViewer component not accessible");
    }
  } catch (err) {
    console.log(`❌ PDFViewer error: ${err.message}`);
  }

  // Test 5: Main JSX
  try {
    const mainJsx = await makeRequest("http://localhost:3001/src/main.jsx");
    if (mainJsx.status === 200) {
      console.log("✅ main.jsx is accessible");
    } else {
      console.log("❌ main.jsx not accessible");
    }
  } catch (err) {
    console.log(`❌ main.jsx error: ${err.message}`);
  }

  console.log("\n🏁 Tests completed");
}

testAppStatus();
