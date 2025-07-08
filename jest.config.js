export default {
  // Multi-project configuration
  projects: [
    {
      displayName: "smoke",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/smoke/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
      testTimeout: 30000,
      maxWorkers: 1,
    },
    {
      displayName: "unit",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/unit/**/*.test.{js,jsx}"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
      testTimeout: 10000,
    },
    {
      displayName: "integration",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
      testTimeout: 30000,
      maxWorkers: 2,
    },
    {
      displayName: "e2e",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
      testTimeout: 60000,
      maxWorkers: 1,
    },
  ],

  // Global configuration
  testEnvironment: "jsdom",

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],

  // Module mappings
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{js,jsx,ts,tsx}",
    "!src/main.jsx",
    "!src/index.css",
  ],

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // Module file extensions
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/"],

  // Transform ignore patterns
  transformIgnorePatterns: ["node_modules/(?!(some-esm-package)/)"],

  // Reporter configuration
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
      },
    ],
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Verbose output
  verbose: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Reset modules before each test
  resetModules: true,
};
