// Configuration service for frontend
class ConfigService {
  constructor() {
    this.config = null;
    this.loaded = false;
    this.backendUrl = null;
    this.backendDiscovered = false;
  }

  async loadConfig() {
    if (this.loaded) return this.config;

    try {
      // Try to load from config.json in public folder
      const response = await fetch("/config.json");
      if (response.ok) {
        this.config = await response.json();
        console.log("ConfigService: Loaded config from config.json");
      } else {
        throw new Error("Config file not found");
      }
    } catch (error) {
      console.warn(
        "ConfigService: Using fallback configuration:",
        error.message
      );
      // Fallback configuration - should match config.json
      this.config = {
        development: {
          frontend: { port: 3001, host: "localhost" },
          backend: { port: 3004, host: "localhost" },
        },
        production: {
          frontend: { port: 3000, host: "0.0.0.0" },
          backend: { port: 3001, host: "0.0.0.0" },
        },
      };
    }

    this.loaded = true;
    return this.config;
  }

  getEnvironment() {
    return import.meta.env.MODE || "development";
  }

  async getBackendConfig() {
    const config = await this.loadConfig();
    const env = this.getEnvironment();
    return config[env]?.backend || config.development.backend;
  }

  async discoverBackendUrl() {
    if (this.backendDiscovered && this.backendUrl) {
      return this.backendUrl;
    }

    const config = await this.loadConfig();
    const env = this.getEnvironment();
    const backendConfig = config[env]?.backend || config.development.backend;

    // Try multiple possible backend URLs in order of preference
    const possibleUrls = [
      `http://${backendConfig.host}:${backendConfig.port}`, // From config
      `http://localhost:3004`, // Current actual port
      `http://localhost:3003`, // Original config port
      `http://localhost:3000`, // Production fallback
      `http://localhost:3001`, // Alternative
      `http://localhost:3002`, // Alternative
    ];

    console.log("ConfigService: Discovering backend URL...");

    for (const url of possibleUrls) {
      try {
        console.log(`ConfigService: Trying ${url}`);
        const response = await fetch(`${url}/api/health`, {
          method: "GET",
          signal: AbortSignal.timeout(2000), // 2 second timeout
        });

        if (response.ok) {
          console.log(`✅ ConfigService: Backend found at ${url}`);
          this.backendUrl = url;
          this.backendDiscovered = true;

          // Try to get the actual backend URL from config endpoint
          try {
            const configResponse = await fetch(`${url}/api/config`);
            if (configResponse.ok) {
              const serverConfig = await configResponse.json();
              if (serverConfig.server?.backendUrl) {
                console.log(
                  `ConfigService: Server reports actual URL: ${serverConfig.server.backendUrl}`
                );
                this.backendUrl = serverConfig.server.backendUrl;
              }
            }
          } catch (configError) {
            console.warn(
              "ConfigService: Could not fetch server config, using health check URL"
            );
          }

          return this.backendUrl;
        }
      } catch (error) {
        console.warn(`ConfigService: ${url} not available:`, error.message);
      }
    }

    throw new Error(
      "❌ No backend server found. Please ensure the backend is running."
    );
  }

  async getBackendUrl() {
    return await this.discoverBackendUrl();
  }

  async checkBackendHealth() {
    try {
      const backendUrl = await this.getBackendUrl();
      const response = await fetch(`${backendUrl}/api/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const health = await response.json();
      return { success: true, data: health, url: backendUrl };
    } catch (error) {
      return { success: false, error: error.message, url: this.backendUrl };
    }
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;
