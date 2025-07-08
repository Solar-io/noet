#!/usr/bin/env node

import chokidar from "chokidar";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../");

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.cyan}[WATCH]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.magenta}=== ${msg} ===${colors.reset}\n`
    ),
};

// Watch configuration
const WATCH_CONFIG = {
  debounceMs: 500,
  ignored: [
    "**/node_modules/**",
    "**/coverage/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/tests/temp/**",
  ],
  watchPaths: [
    "src/**/*.{js,jsx,ts,tsx}",
    "tests/**/*.{js,jsx}",
    "jest.config.js",
    "babel.config.js",
  ],
};

// File change to test type mapping
const FILE_TEST_MAPPING = {
  "src/state/**": ["unit", "integration"],
  "src/components/**": ["unit"],
  "src/services/**": ["unit"],
  "src/utils/**": ["unit"],
  "tests/unit/**": ["unit"],
  "tests/integration/**": ["integration"],
  "tests/smoke/**": ["smoke"],
  "tests/e2e/**": ["e2e"],
  "jest.config.js": ["all"],
  "babel.config.js": ["all"],
};

class TestWatcher {
  constructor() {
    this.watcher = null;
    this.runningTests = new Set();
    this.pendingRuns = new Set();
    this.lastRunTime = 0;
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      filesChanged: 0,
    };
  }

  start() {
    log.header("Starting Test Watch Mode");
    log.info(`Watching: ${WATCH_CONFIG.watchPaths.join(", ")}`);

    this.watcher = chokidar.watch(WATCH_CONFIG.watchPaths, {
      ignored: WATCH_CONFIG.ignored,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on("change", (filePath) => this.handleFileChange(filePath, "changed"))
      .on("add", (filePath) => this.handleFileChange(filePath, "added"))
      .on("unlink", (filePath) => this.handleFileChange(filePath, "removed"))
      .on("error", (error) => log.error(`Watcher error: ${error}`));

    // Run initial test suite
    this.runTests(["smoke"], "Initial run");

    log.success("Test watcher started. Press Ctrl+C to stop.");
    this.showCommands();
  }

  showCommands() {
    console.log(`
${colors.cyan}Available Commands:${colors.reset}
  ${colors.yellow}a${colors.reset} - Run all tests
  ${colors.yellow}s${colors.reset} - Run smoke tests
  ${colors.yellow}u${colors.reset} - Run unit tests
  ${colors.yellow}i${colors.reset} - Run integration tests
  ${colors.yellow}e${colors.reset} - Run e2e tests
  ${colors.yellow}c${colors.reset} - Clear console
  ${colors.yellow}q${colors.reset} - Quit
  ${colors.yellow}stats${colors.reset} - Show statistics
`);

    // Setup keyboard input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key) => this.handleKeyPress(key));
  }

  handleKeyPress(key) {
    const keyStr = key.toString();

    if (keyStr === "\u0003" || keyStr === "q") {
      // Ctrl+C or q
      this.stop();
      return;
    }

    switch (keyStr) {
      case "a":
        this.runTests(
          ["smoke", "unit", "integration", "e2e"],
          "Manual: All tests"
        );
        break;
      case "s":
        this.runTests(["smoke"], "Manual: Smoke tests");
        break;
      case "u":
        this.runTests(["unit"], "Manual: Unit tests");
        break;
      case "i":
        this.runTests(["integration"], "Manual: Integration tests");
        break;
      case "e":
        this.runTests(["e2e"], "Manual: E2E tests");
        break;
      case "c":
        console.clear();
        this.showCommands();
        break;
      case "stats":
        this.showStats();
        break;
      default:
        if (keyStr.trim().length > 0) {
          log.warn(`Unknown command: ${keyStr.trim()}`);
        }
        break;
    }
  }

  stop() {
    log.info("Stopping test watcher...");

    if (this.watcher) {
      this.watcher.close();
    }

    process.stdin.setRawMode(false);
    process.stdin.pause();

    this.showStats();
    log.success("Test watcher stopped");
    process.exit(0);
  }

  handleFileChange(filePath, changeType) {
    this.stats.filesChanged++;

    const relativePath = path.relative(projectRoot, filePath);
    log.info(`File ${changeType}: ${relativePath}`);

    // Determine which tests to run based on file path
    const testTypes = this.getTestTypesForFile(relativePath);

    if (testTypes.length > 0) {
      this.scheduleTestRun(testTypes, `File change: ${relativePath}`);
    }
  }

  getTestTypesForFile(filePath) {
    const testTypes = new Set();

    for (const [pattern, types] of Object.entries(FILE_TEST_MAPPING)) {
      if (this.matchesPattern(filePath, pattern)) {
        types.forEach((type) => testTypes.add(type));
      }
    }

    return Array.from(testTypes);
  }

  matchesPattern(filePath, pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\./g, "\\.");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  scheduleTestRun(testTypes, reason) {
    if (testTypes.includes("all")) {
      testTypes = ["smoke", "unit", "integration", "e2e"];
    }

    // Add to pending runs
    testTypes.forEach((type) => this.pendingRuns.add(type));

    // Debounce multiple file changes
    setTimeout(() => {
      if (this.pendingRuns.size > 0) {
        const typesToRun = Array.from(this.pendingRuns);
        this.pendingRuns.clear();
        this.runTests(typesToRun, reason);
      }
    }, WATCH_CONFIG.debounceMs);
  }

  async runTests(testTypes, reason) {
    if (this.runningTests.size > 0) {
      log.warn("Tests already running, skipping...");
      return;
    }

    this.stats.totalRuns++;
    this.lastRunTime = Date.now();

    log.header(`Running Tests: ${testTypes.join(", ")}`);
    log.info(`Reason: ${reason}`);

    testTypes.forEach((type) => this.runningTests.add(type));

    try {
      const results = await Promise.all(
        testTypes.map((type) => this.runSingleTestType(type))
      );

      const allPassed = results.every((result) => result);

      if (allPassed) {
        this.stats.successfulRuns++;
        log.success(`All tests passed! (${Date.now() - this.lastRunTime}ms)`);
      } else {
        this.stats.failedRuns++;
        log.error(`Some tests failed! (${Date.now() - this.lastRunTime}ms)`);
      }
    } catch (error) {
      this.stats.failedRuns++;
      log.error(`Test run failed: ${error.message}`);
    } finally {
      testTypes.forEach((type) => this.runningTests.delete(type));
    }
  }

  runSingleTestType(testType) {
    return new Promise((resolve) => {
      const args = [
        "jest",
        "--selectProjects",
        testType,
        "--passWithNoTests",
        "--silent",
      ];

      const testProcess = spawn("npx", args, {
        cwd: projectRoot,
        stdio: "pipe",
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      let output = "";
      testProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      testProcess.stderr.on("data", (data) => {
        output += data.toString();
      });

      testProcess.on("close", (code) => {
        if (code === 0) {
          log.success(`${testType} tests passed`);
        } else {
          log.error(`${testType} tests failed`);
          // Show last few lines of output for context
          const lines = output.split("\n").slice(-10);
          lines.forEach((line) => {
            if (line.trim()) {
              console.log(`  ${line}`);
            }
          });
        }
        resolve(code === 0);
      });

      testProcess.on("error", (error) => {
        log.error(`Failed to run ${testType}: ${error.message}`);
        resolve(false);
      });
    });
  }

  showStats() {
    log.header("Test Watch Statistics");

    console.log(`  Total test runs: ${this.stats.totalRuns}`);
    console.log(
      `  Successful runs: ${colors.green}${this.stats.successfulRuns}${colors.reset}`
    );
    console.log(
      `  Failed runs: ${colors.red}${this.stats.failedRuns}${colors.reset}`
    );
    console.log(`  Files changed: ${this.stats.filesChanged}`);

    if (this.stats.totalRuns > 0) {
      const successRate = (
        (this.stats.successfulRuns / this.stats.totalRuns) *
        100
      ).toFixed(1);
      console.log(`  Success rate: ${successRate}%`);
    }
  }
}

// Error handling
process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  log.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Start the watcher
const watcher = new TestWatcher();
watcher.start();
