#!/usr/bin/env node

/**
 * Simple server startup without port checking - for debugging
 */

import express from "express";
import cors from "cors";
import { join } from "path";

const app = express();
const PORT = 3004;
const HOST = "localhost";

console.log("🔧 Starting simple debug server...");

// Basic middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server without port checking
console.log(`🚀 Attempting to bind to ${HOST}:${PORT}...`);

app.listen(PORT, HOST, () => {
  console.log(`✅ Simple server running on http://${HOST}:${PORT}`);
  console.log("📋 Available endpoints:");
  console.log("   GET /api/health");
}).on('error', (error) => {
  console.error("❌ Server startup error:", error.message);
  console.error("   Code:", error.code);
  console.error("   Port:", error.port);
  
  if (error.code === 'EADDRINUSE') {
    console.log("💡 Port 3004 is in use. Try:");
    console.log("   lsof -i :3004");
    console.log("   pkill -f node");
  }
});
