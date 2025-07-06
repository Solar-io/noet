import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Load config to get consistent port
const loadConfig = () => {
  try {
    const configPath = path.resolve(process.cwd(), "config.json");
    const configFile = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(configFile);
    const env = process.env.NODE_ENV || "development";
    return config[env] || config.development;
  } catch (error) {
    console.warn("Could not load config, using defaults:", error.message);
    return {
      frontend: { port: 3001, host: "localhost" },
      backend: { port: 3004, host: "localhost" },
    };
  }
};

const config = loadConfig();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.VITE_PORT) || config.frontend.port,
    host: process.env.VITE_HOST || config.frontend.host,
    strictPort: true, // Fail if port is in use instead of finding alternative
    open: false, // Don't auto-open browser since we'll control this
    proxy: {
      "/api": {
        target: `http://${config.backend.host}:${config.backend.port}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: parseInt(process.env.VITE_PREVIEW_PORT) || 3000,
    host: process.env.VITE_HOST || config.frontend.host,
  },
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
  assetsInclude: ["**/*.pdf"],
  define: {
    global: "globalThis",
  },
  worker: {
    format: "es",
  },
  build: {
    rollupOptions: {
      external: [],
    },
  },
});
