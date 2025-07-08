#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../../");

// Test configuration
const TEST_CONFIG = {
  smoke: {
    name: "Smoke Tests",
    timeout: 30000,
    maxWorkers: 1,
    bail: true,
    pattern: "tests/smoke/**/*.test.js",
  },
  unit: {
    name: "Unit Tests",
    timeout: 10000,
    maxWorkers: "auto",
    bail: false,
    pattern: "tests/unit/**/*.test.{js,jsx}",
  },
  integration: {
    name: "Integration Tests",
    timeout: 30000,
    maxWorkers: 2,
    bail: false,
    pattern: "tests/integration/**/*.test.js",
  },
  e2e: {
    name: "E2E Tests",
    timeout: 60000,
    maxWorkers: 1,
    bail: false,
    pattern: "tests/e2e/**/*.test.js",
  },
};

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
  info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.blue}=== ${msg} ===${colors.reset}\n`
    ),
};

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  type: "all",
  watch: false,
  coverage: false,
  ci: false,
  bail: false,
  verbose: false,
  debug: false,
  parallel: false,
  maxWorkers: "auto",
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === "--smoke") options.type = "smoke";
  else if (arg === "--unit") options.type = "unit";
  else if (arg === "--integration") options.type = "integration";
  else if (arg === "--e2e") options.type = "e2e";
  else if (arg === "--all") options.type = "all";
  else if (arg === "--watch") options.watch = true;
  else if (arg === "--coverage") options.coverage = true;
  else if (arg === "--ci") options.ci = true;
  else if (arg === "--bail") options.bail = true;
  else if (arg === "--verbose") options.verbose = true;
  else if (arg === "--debug") options.debug = true;
  else if (arg === "--parallel") options.parallel = true;
  else if (arg === "--max-workers") options.maxWorkers = args[++i];
  else if (arg === "--help") {
    showHelp();
    process.exit(0);
  }
}

function showHelp() {
  console.log(`
${colors.bright}Noet Testing Suite${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/test/run-tests.js [options]

${colors.cyan}Test Types:${colors.reset}
  --smoke        Run smoke tests (30 seconds, critical functionality)
  --unit         Run unit tests (component and module tests)
  --integration  Run integration tests (feature combinations)
  --e2e          Run end-to-end tests (critical user paths)
  --all          Run all test types (default)

${colors.cyan}Options:${colors.reset}
  --watch        Run tests in watch mode
  --coverage     Generate coverage reports
  --ci           Run in CI mode (no watch, coverage, bail on first failure)
  --bail         Stop on first test failure
  --verbose      Verbose output
  --debug        Enable debugging
  --parallel     Run test suites in parallel
  --max-workers  Set maximum number of workers

${colors.cyan}Examples:${colors.reset}
  node scripts/test/run-tests.js --smoke --verbose
  node scripts/test/run-tests.js --unit --watch
  node scripts/test/run-tests.js --all --coverage
  node scripts/test/run-tests.js --e2e --debug
  node scripts/test/run-tests.js --ci
`);
}

// Test environment setup
async function setupTestEnvironment() {
  log.info("Setting up test environment...");

  // Check if Jest is installed
  const jestPath = join(projectRoot, "node_modules", ".bin", "jest");
  if (!fs.existsSync(jestPath)) {
    log.error("Jest not found. Please run: npm install");
    process.exit(1);
  }

  // Set environment variables
  process.env.NODE_ENV = "test";
  process.env.JEST_WORKER_ID = "1";

  // Create test directories if they don't exist
  const testDirs = [
    "tests/smoke",
    "tests/unit",
    "tests/integration",
    "tests/e2e",
  ];
  testDirs.forEach((dir) => {
    const fullPath = join(projectRoot, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });

  log.success("Test environment setup complete");
}

// Run specific test type
async function runTestType(testType) {
  const config = TEST_CONFIG[testType];
  if (!config) {
    log.error(`Unknown test type: ${testType}`);
    return false;
  }

  log.header(`Running ${config.name}`);

  const jestArgs = [
    "--selectProjects",
    testType,
    "--testTimeout",
    config.timeout.toString(),
    "--maxWorkers",
    options.maxWorkers === "auto"
      ? config.maxWorkers.toString()
      : options.maxWorkers,
  ];

  if (options.watch) jestArgs.push("--watch");
  if (options.coverage) jestArgs.push("--coverage");
  if (options.bail || config.bail) jestArgs.push("--bail");
  if (options.verbose) jestArgs.push("--verbose");
  if (options.ci) {
    jestArgs.push("--ci", "--watchAll=false");
  }
  if (options.debug) {
    jestArgs.push("--runInBand");
  }

  return new Promise((resolve) => {
    const startTime = Date.now();

    const jestProcess = spawn("npx", ["jest", ...jestArgs], {
      cwd: projectRoot,
      stdio: "inherit",
      env: { ...process.env, FORCE_COLOR: "1" },
    });

    jestProcess.on("close", (code) => {
      const duration = Date.now() - startTime;

      if (code === 0) {
        log.success(`${config.name} completed in ${duration}ms`);
        resolve(true);
      } else {
        log.error(`${config.name} failed with code ${code}`);
        resolve(false);
      }
    });

    jestProcess.on("error", (error) => {
      log.error(`Failed to run ${config.name}: ${error.message}`);
      resolve(false);
    });
  });
}

// Run all tests in sequence
async function runAllTests() {
  log.header("Running All Tests");

  const testTypes = ["smoke", "unit", "integration", "e2e"];
  const results = [];

  for (const testType of testTypes) {
    const result = await runTestType(testType);
    results.push({ testType, success: result });

    if (!result && options.bail) {
      log.error("Stopping due to test failure (--bail enabled)");
      break;
    }
  }

  // Summary
  log.header("Test Summary");

  let totalPassed = 0;
  let totalFailed = 0;

  results.forEach(({ testType, success }) => {
    const status = success
      ? `${colors.green}PASS${colors.reset}`
      : `${colors.red}FAIL${colors.reset}`;
    console.log(`  ${TEST_CONFIG[testType].name}: ${status}`);

    if (success) totalPassed++;
    else totalFailed++;
  });

  console.log(
    `\n${colors.bright}Total: ${totalPassed} passed, ${totalFailed} failed${colors.reset}`
  );

  return totalFailed === 0;
}

// Run tests in parallel
async function runTestsParallel() {
  log.header("Running Tests in Parallel");

  const testTypes =
    options.type === "all"
      ? ["smoke", "unit", "integration", "e2e"]
      : [options.type];

  const promises = testTypes.map((testType) => runTestType(testType));
  const results = await Promise.all(promises);

  const success = results.every((result) => result);

  if (success) {
    log.success("All tests passed!");
  } else {
    log.error("Some tests failed!");
  }

  return success;
}

// Pre-test cleanup
async function cleanup() {
  log.info("Cleaning up test environment...");

  // Clear test databases, temp files, etc.
  const tempDirs = [
    join(projectRoot, "tests/temp"),
    join(projectRoot, "coverage"),
  ];

  tempDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  log.success("Cleanup complete");
}

// Main execution
async function main() {
  try {
    // Setup
    await setupTestEnvironment();

    // Cleanup before running tests
    if (!options.watch) {
      await cleanup();
    }

    let success = false;

    // Run tests
    if (options.parallel && options.type === "all") {
      success = await runTestsParallel();
    } else if (options.type === "all") {
      success = await runAllTests();
    } else {
      success = await runTestType(options.type);
    }

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  } catch (error) {
    log.error(`Test runner failed: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", () => {
  log.warn("Test runner interrupted");
  process.exit(1);
});

process.on("SIGTERM", () => {
  log.warn("Test runner terminated");
  process.exit(1);
});

// Run main function
main().catch((error) => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
