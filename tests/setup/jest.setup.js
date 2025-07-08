import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";
import { jest } from "@jest/globals";

// Configure testing library
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(init) {
    this.params = new Map();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.params.set(key, value);
      });
    }
  }

  get(key) {
    return this.params.get(key);
  }

  set(key, value) {
    this.params.set(key, value);
  }

  toString() {
    return Array.from(this.params.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }
};

// Suppress console warnings in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test cleanup
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Extend Jest matchers for better assertions
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Performance testing utilities
global.measurePerformance = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

// Test data cleanup utilities
global.cleanupTestData = () => {
  localStorage.clear();
  sessionStorage.clear();
  // Clear any global state
  if (global.testStateCleanup) {
    global.testStateCleanup.forEach((cleanup) => cleanup());
    global.testStateCleanup = [];
  }
};

// Register cleanup functions
global.testStateCleanup = [];
global.registerCleanup = (cleanup) => {
  global.testStateCleanup.push(cleanup);
};
