import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PortManager {
  constructor() {
    this.configPath = path.join(__dirname, "../config.json");
    this.config = this.loadConfig();
    this.environment = process.env.NODE_ENV || "development";
  }

  loadConfig() {
    try {
      const configFile = fs.readFileSync(this.configPath, "utf8");
      return JSON.parse(configFile);
    } catch (error) {
      console.error("Failed to load config:", error.message);
      // Fallback configuration
      return {
        development: {
          frontend: { port: 3001, host: "localhost" },
          backend: { port: 3003, host: "localhost" },
        },
        production: {
          frontend: { port: 3000, host: "0.0.0.0" },
          backend: { port: 3001, host: "0.0.0.0" },
        },
      };
    }
  }

  getFrontendConfig() {
    return (
      this.config[this.environment]?.frontend ||
      this.config.development.frontend
    );
  }

  getBackendConfig() {
    return (
      this.config[this.environment]?.backend || this.config.development.backend
    );
  }

  getFrontendPort() {
    return process.env.FRONTEND_PORT || this.getFrontendConfig().port;
  }

  getBackendPort() {
    return process.env.BACKEND_PORT || this.getBackendConfig().port;
  }

  getFrontendHost() {
    return process.env.FRONTEND_HOST || this.getFrontendConfig().host;
  }

  getBackendHost() {
    return process.env.BACKEND_HOST || this.getBackendConfig().host;
  }

  getBackendUrl() {
    const config = this.getBackendConfig();
    const port = this.getBackendPort();
    const host = this.getBackendHost();
    return `http://${host}:${port}`;
  }

  getFrontendUrl() {
    const config = this.getFrontendConfig();
    const port = this.getFrontendPort();
    const host = this.getFrontendHost();
    return `http://${host}:${port}`;
  }

  // Check if a port is available
  async isPortAvailable(port, host = "localhost") {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.listen(port, host, () => {
        server.once("close", () => resolve(true));
        server.close();
      });

      server.on("error", () => resolve(false));
    });
  }

  // Find next available port
  async findAvailablePort(startPort, host = "localhost", maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      if (await this.isPortAvailable(port, host)) {
        return port;
      }
    }
    throw new Error(`No available port found starting from ${startPort}`);
  }
}

export default PortManager;
