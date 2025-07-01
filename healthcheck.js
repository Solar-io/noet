#!/usr/bin/env node

import PortManager from "./server/portManager.js";
import fs from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import net from "net";

const execAsync = promisify(exec);

class HealthChecker {
  constructor() {
    this.portManager = new PortManager();
    this.results = {};
  }

  async checkPortAvailability() {
    console.log("🔍 Checking port availability...");

    const frontendPort = this.portManager.getFrontendPort();
    const backendPort = this.portManager.getBackendPort();

    try {
      const frontendAvailable = await this.portManager.isPortAvailable(
        frontendPort
      );
      const backendAvailable = await this.portManager.isPortAvailable(
        backendPort
      );

      this.results.ports = {
        frontend: {
          port: frontendPort,
          available: frontendAvailable,
          status: frontendAvailable ? "✅" : "❌",
        },
        backend: {
          port: backendPort,
          available: backendAvailable,
          status: backendAvailable ? "✅" : "❌",
        },
      };

      console.log(
        `  Frontend (${frontendPort}): ${this.results.ports.frontend.status}`
      );
      console.log(
        `  Backend (${backendPort}): ${this.results.ports.backend.status}`
      );
    } catch (error) {
      console.error("❌ Port check failed:", error.message);
      this.results.ports = { error: error.message };
    }
  }

  async checkRunningProcesses() {
    console.log("🔍 Checking running processes...");

    try {
      // Check for Vite dev server
      const { stdout: viteOutput } = await execAsync(
        "lsof -i -P | grep LISTEN | grep node || true"
      );

      const processes = viteOutput
        .trim()
        .split("\n")
        .filter((line) => line.length > 0);

      this.results.processes = {
        total: processes.length,
        details: processes.map((line) => {
          const parts = line.split(/\s+/);
          const pid = parts[1];
          const port = parts[8]?.split(":").pop();
          return { pid, port, line };
        }),
      };

      console.log(
        `  Found ${processes.length} Node.js processes listening on ports`
      );
      processes.forEach((line) => {
        const parts = line.split(/\s+/);
        const pid = parts[1];
        const port = parts[8]?.split(":").pop();
        console.log(`    PID ${pid} on port ${port}`);
      });
    } catch (error) {
      console.error("❌ Process check failed:", error.message);
      this.results.processes = { error: error.message };
    }
  }

  async checkBackendHealth() {
    console.log("🔍 Checking backend health...");

    try {
      const backendUrl = this.portManager.getBackendUrl();

      const response = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const health = await response.json();
        this.results.backendHealth = {
          status: "✅",
          url: backendUrl,
          data: health,
        };
        console.log(`  Backend healthy at ${backendUrl}`);
        console.log(`    Uptime: ${Math.floor(health.uptime)}s`);
        console.log(
          `    Memory: ${Math.round(health.memory.rss / 1024 / 1024)}MB`
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.results.backendHealth = {
        status: "❌",
        error: error.message,
        url: this.portManager.getBackendUrl(),
      };
      console.log(`  ❌ Backend not responding: ${error.message}`);
    }
  }

  async checkFileSystemAccess() {
    console.log("🔍 Checking file system access...");

    try {
      // Check if notes directory exists and is writable
      const notesPath = "./notes";

      try {
        await fs.access(notesPath, fs.constants.F_OK);
        await fs.access(notesPath, fs.constants.W_OK);

        this.results.fileSystem = {
          status: "✅",
          notesPath,
          writable: true,
        };
        console.log(`  ✅ Notes directory accessible: ${notesPath}`);
      } catch (accessError) {
        if (accessError.code === "ENOENT") {
          // Try to create the directory
          await fs.mkdir(notesPath, { recursive: true });
          this.results.fileSystem = {
            status: "✅",
            notesPath,
            created: true,
          };
          console.log(`  ✅ Created notes directory: ${notesPath}`);
        } else {
          throw accessError;
        }
      }
    } catch (error) {
      this.results.fileSystem = {
        status: "❌",
        error: error.message,
      };
      console.log(`  ❌ File system check failed: ${error.message}`);
    }
  }

  async checkDependencies() {
    console.log("🔍 Checking dependencies...");

    try {
      // Check if package.json exists
      const packageJson = JSON.parse(
        await fs.readFile("./package.json", "utf8")
      );

      // Check if node_modules exists
      await fs.access("./node_modules", fs.constants.F_OK);

      this.results.dependencies = {
        status: "✅",
        nodeModules: true,
        packageName: packageJson.name,
        version: packageJson.version,
      };

      console.log(
        `  ✅ Dependencies installed for ${packageJson.name} v${packageJson.version}`
      );
    } catch (error) {
      this.results.dependencies = {
        status: "❌",
        error: error.message,
      };
      console.log(`  ❌ Dependencies check failed: ${error.message}`);
    }
  }

  async checkConfigFiles() {
    console.log("🔍 Checking configuration files...");

    const configFiles = [
      "./config.json",
      "./package.json",
      "./server/server.js",
      "./src/TipTapEditor.jsx",
    ];

    const results = {};

    for (const file of configFiles) {
      try {
        await fs.access(file, fs.constants.F_OK);
        results[file] = "✅";
        console.log(`  ✅ ${file}`);
      } catch (error) {
        results[file] = "❌";
        console.log(`  ❌ ${file} - ${error.message}`);
      }
    }

    this.results.configFiles = results;
  }

  printSummary() {
    console.log("\n📋 HEALTH CHECK SUMMARY");
    console.log("========================");

    const allChecks = [
      this.results.ports?.frontend?.status === "✅" &&
        this.results.ports?.backend?.status === "✅",
      this.results.backendHealth?.status === "✅",
      this.results.fileSystem?.status === "✅",
      this.results.dependencies?.status === "✅",
      Object.values(this.results.configFiles || {}).every(
        (status) => status === "✅"
      ),
    ];

    const healthyChecks = allChecks.filter(Boolean).length;
    const totalChecks = allChecks.length;

    console.log(
      `Overall Health: ${healthyChecks}/${totalChecks} checks passed`
    );

    if (healthyChecks === totalChecks) {
      console.log(
        "🎉 All systems healthy! Your Noet app should work correctly."
      );
    } else {
      console.log(
        "⚠️  Some issues detected. Please address the failed checks above."
      );
    }

    // Print configuration info
    console.log("\n🔧 CONFIGURATION");
    console.log("==================");
    console.log(`Frontend URL: ${this.portManager.getFrontendUrl()}`);
    console.log(`Backend URL: ${this.portManager.getBackendUrl()}`);
    console.log(`Environment: ${this.portManager.environment}`);
  }

  async runAllChecks() {
    console.log("🏥 NOET HEALTH CHECK");
    console.log("=====================\n");

    await this.checkPortAvailability();
    await this.checkRunningProcesses();
    await this.checkBackendHealth();
    await this.checkFileSystemAccess();
    await this.checkDependencies();
    await this.checkConfigFiles();

    this.printSummary();

    return this.results;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  try {
    await checker.runAllChecks();
    process.exit(0);
  } catch (error) {
    console.error("❌ Health check failed:", error);
    process.exit(1);
  }
}

export default HealthChecker;
