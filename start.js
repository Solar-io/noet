#!/usr/bin/env node

/**
 * Startup script for noet-app
 * Automatically handles directory navigation and shows clear URLs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we're in the correct directory
const projectRoot = path.resolve(__dirname);
process.chdir(projectRoot);

console.log("🚀 Starting noet-app...\n");
console.log(`📁 Working directory: ${process.cwd()}`);

// Load config
const loadConfig = () => {
  try {
    const configPath = path.resolve(projectRoot, "config.json");
    const configFile = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configFile);
    const env = process.env.NODE_ENV || "development";
    return config[env] || config.development;
  } catch (error) {
    console.warn("⚠️  Could not load config:", error.message);
    return {
      frontend: { port: 3001, host: "localhost" },
      backend: { port: 3004, host: "localhost" },
    };
  }
};

const config = loadConfig();
const frontendUrl = `http://${config.frontend.host}:${config.frontend.port}`;
const backendUrl = `http://${config.backend.host}:${config.backend.port}`;

console.log("📋 Configuration:");
console.log("================");
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Frontend:    ${frontendUrl}`);
console.log(`Backend:     ${backendUrl}`);
console.log(`Config:      ${path.resolve(projectRoot, "config.json")}`);
console.log("");

console.log("🎯 Access URLs:");
console.log("===============");
console.log(`✅ Main App:    ${frontendUrl}`);
console.log(`🔧 API Health:  ${backendUrl}/api/health`);
console.log(`⚙️  API Config:  ${backendUrl}/api/config`);
console.log("");

console.log("📝 Notes:");
console.log("=========");
console.log("• If ports are in use, servers will find alternatives");
console.log("• Frontend will auto-discover backend URL");
console.log("• Login: demo@example.com / demo123");
console.log("• Use Ctrl+C to stop both servers");
console.log("");

// Start both servers with correct working directory
console.log("Starting servers...\n");

const backendProcess = spawn("npm", ["run", "backend"], {
  stdio: "inherit",
  shell: true,
  cwd: projectRoot,
});

// Wait a moment for backend to start
setTimeout(() => {
  const frontendProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    cwd: projectRoot,
  });

  // Handle cleanup
  const cleanup = () => {
    console.log("\n🛑 Shutting down servers...");
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}, 2000);
