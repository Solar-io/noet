#!/usr/bin/env node

import PortManager from "./server/portManager.js";
import HealthChecker from "./healthcheck.js";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

class StartupManager {
  constructor() {
    this.portManager = new PortManager();
    this.processes = new Map();
  }

  async killExistingProcesses() {
    console.log("🔄 Cleaning up existing processes...");

    try {
      // Kill any existing Node.js processes on our ports
      const frontendPort = this.portManager.getFrontendPort();
      const backendPort = this.portManager.getBackendPort();

      const ports = [frontendPort, backendPort];

      for (const port of ports) {
        try {
          const { stdout } = await execAsync(`lsof -ti:${port}`);
          const pids = stdout
            .trim()
            .split("\n")
            .filter((pid) => pid);

          for (const pid of pids) {
            console.log(`  🔄 Killing process ${pid} on port ${port}`);
            await execAsync(`kill -9 ${pid}`);
          }
        } catch (error) {
          // Port is probably free, which is good
          console.log(`  ✅ Port ${port} is available`);
        }
      }

      // Wait a moment for processes to fully terminate
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn("⚠️  Warning during cleanup:", error.message);
    }
  }

  async startBackend() {
    console.log("🚀 Starting backend server...");

    const backendPort = this.portManager.getBackendPort();
    const backendHost = this.portManager.getBackendHost();

    return new Promise((resolve, reject) => {
      const backend = spawn("node", ["server/server.js"], {
        cwd: process.cwd(), // Ensure correct working directory
        env: {
          ...process.env,
          BACKEND_PORT: backendPort,
          BACKEND_HOST: backendHost,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let started = false;

      backend.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[Backend] ${output.trim()}`);

        if (output.includes("Noet server running") && !started) {
          started = true;
          resolve(backend);
        }
      });

      backend.stderr.on("data", (data) => {
        console.error(`[Backend Error] ${data.toString().trim()}`);
      });

      backend.on("error", (error) => {
        if (!started) {
          reject(error);
        }
      });

      backend.on("exit", (code) => {
        console.log(`Backend process exited with code ${code}`);
        this.processes.delete("backend");
      });

      this.processes.set("backend", backend);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!started) {
          reject(new Error("Backend startup timeout"));
        }
      }, 10000);
    });
  }

  async startFrontend() {
    console.log("🚀 Starting frontend server...");

    const frontendPort = this.portManager.getFrontendPort();
    const frontendHost = this.portManager.getFrontendHost();

    return new Promise((resolve, reject) => {
      const frontend = spawn("npm", ["run", "dev"], {
        cwd: process.cwd(), // Ensure correct working directory
        env: {
          ...process.env,
          VITE_PORT: frontendPort,
          VITE_HOST: frontendHost,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let started = false;

      frontend.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[Frontend] ${output.trim()}`);

        if (
          (output.includes("Local:") || output.includes("ready")) &&
          !started
        ) {
          started = true;
          resolve(frontend);
        }
      });

      frontend.stderr.on("data", (data) => {
        const output = data.toString();
        console.log(`[Frontend] ${output.trim()}`);

        if (output.includes("Local:") && !started) {
          started = true;
          resolve(frontend);
        }
      });

      frontend.on("error", (error) => {
        if (!started) {
          reject(error);
        }
      });

      frontend.on("exit", (code) => {
        console.log(`Frontend process exited with code ${code}`);
        this.processes.delete("frontend");
      });

      this.processes.set("frontend", frontend);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!started) {
          reject(new Error("Frontend startup timeout"));
        }
      }, 30000);
    });
  }

  async waitForBackendHealth() {
    console.log("🔍 Waiting for backend to be healthy...");

    const maxAttempts = 10;
    const delay = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const backendUrl = this.portManager.getBackendUrl();
        const response = await fetch(`${backendUrl}/api/health`, {
          signal: AbortSignal.timeout(3000),
        });

        if (response.ok) {
          console.log(`✅ Backend is healthy at ${backendUrl}`);
          return true;
        }
      } catch (error) {
        console.log(
          `  Attempt ${attempt}/${maxAttempts}: Backend not ready yet...`
        );
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error("Backend health check failed after maximum attempts");
  }

  setupGracefulShutdown() {
    const cleanup = () => {
      console.log("\n🛑 Shutting down gracefully...");

      for (const [name, process] of this.processes) {
        console.log(`  Stopping ${name}...`);
        process.kill("SIGTERM");
      }

      setTimeout(() => {
        for (const [name, process] of this.processes) {
          console.log(`  Force killing ${name}...`);
          process.kill("SIGKILL");
        }
        process.exit(0);
      }, 5000);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("SIGQUIT", cleanup);
  }

  async start() {
    console.log("🏁 NOET STARTUP MANAGER");
    console.log("========================\n");

    try {
      // Run health check first
      const healthChecker = new HealthChecker();
      await healthChecker.checkDependencies();
      await healthChecker.checkConfigFiles();
      await healthChecker.checkFileSystemAccess();

      // Clean up existing processes
      await this.killExistingProcesses();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start backend first
      await this.startBackend();

      // Wait for backend to be healthy
      await this.waitForBackendHealth();

      // Start frontend
      await this.startFrontend();

      console.log("\n🎉 SUCCESS! Both services are running:");
      console.log(`   Frontend: ${this.portManager.getFrontendUrl()}`);
      console.log(`   Backend:  ${this.portManager.getBackendUrl()}`);
      console.log("\n💡 Press Ctrl+C to stop all services");

      // Keep the script running
      process.stdin.resume();
    } catch (error) {
      console.error("\n❌ Startup failed:", error.message);

      // Cleanup any started processes
      for (const [name, process] of this.processes) {
        process.kill("SIGKILL");
      }

      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new StartupManager();
  manager.start();
}

export default StartupManager;
