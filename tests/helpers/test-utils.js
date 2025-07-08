import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

// Mock StateIsolationAdapter
const mockStateIsolationAdapter = {
  useAuthState: () => ({
    user: { id: 1, username: "testuser" },
    login: jest.fn(),
    logout: jest.fn(),
    checkAuth: jest.fn(),
  }),
  useTagState: () => ({
    tags: [],
    addTag: jest.fn(),
    removeTag: jest.fn(),
    updateTag: jest.fn(),
  }),
  useAttachmentState: () => ({
    attachments: [],
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  }),
  useEditorState: () => ({
    content: "",
    setContent: jest.fn(),
    save: jest.fn(),
  }),
  useVersioningState: () => ({
    versions: [],
    createVersion: jest.fn(),
    restoreVersion: jest.fn(),
  }),
  useUIState: () => ({
    isLoading: false,
    setLoading: jest.fn(),
    showModal: jest.fn(),
  }),
  useDragDropState: () => ({
    draggedItem: null,
    setDraggedItem: jest.fn(),
    handleDrop: jest.fn(),
  }),
  useConfigState: () => ({
    config: {},
    updateConfig: jest.fn(),
  }),
  useSyncState: () => ({
    isOnline: true,
    sync: jest.fn(),
  }),
  useErrorRecoveryState: () => ({
    errors: [],
    clearErrors: jest.fn(),
  }),
};

// Test wrapper component
const TestWrapper = ({ children, initialState = {} }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Custom render function with wrapper
export const renderWithWrapper = (ui, options = {}) => {
  const { initialState = {}, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <TestWrapper initialState={initialState}>{children}</TestWrapper>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 1,
  username: "testuser",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestNote = (overrides = {}) => ({
  id: 1,
  title: "Test Note",
  content: "Test content",
  tags: ["test"],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createTestTag = (overrides = {}) => ({
  id: 1,
  name: "test-tag",
  color: "#ff0000",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createTestAttachment = (overrides = {}) => ({
  id: 1,
  filename: "test-file.pdf",
  size: 1024,
  type: "application/pdf",
  created_at: new Date().toISOString(),
  ...overrides,
});

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

export const mockApiError = (message = "API Error", status = 500) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
  text: async () => JSON.stringify({ error: message }),
});

// Test event helpers
export const createTestEvent = (type, data = {}) => ({
  type,
  data,
  timestamp: Date.now(),
});

// Performance testing helpers
export const measureRenderTime = async (renderFn) => {
  const start = performance.now();
  await renderFn();
  const end = performance.now();
  return end - start;
};

export const expectPerformance = (duration, maxMs = 100) => {
  expect(duration).toBeLessThan(maxMs);
};

// DOM interaction helpers
export const clickAndWait = async (element, timeout = 1000) => {
  await userEvent.click(element);
  await waitFor(() => {}, { timeout });
};

export const typeAndWait = async (element, text, timeout = 1000) => {
  await userEvent.type(element, text);
  await waitFor(() => {}, { timeout });
};

export const selectOption = async (selectElement, optionText) => {
  await userEvent.selectOptions(selectElement, optionText);
};

// State testing helpers
export const getElementState = (element) => ({
  disabled: element.disabled,
  checked: element.checked,
  value: element.value,
  textContent: element.textContent,
  className: element.className,
});

export const waitForElementState = async (
  selector,
  expectedState,
  timeout = 5000
) => {
  return waitFor(
    () => {
      const element = screen.getByTestId(selector);
      const currentState = getElementState(element);

      Object.entries(expectedState).forEach(([key, value]) => {
        expect(currentState[key]).toBe(value);
      });
    },
    { timeout }
  );
};

// Error boundary testing
export const TestErrorBoundary = ({ children, onError = jest.fn() }) => {
  return <div data-testid="error-boundary">{children}</div>;
};

// Local storage helpers
export const mockLocalStorage = (initialData = {}) => {
  const store = { ...initialData };

  jest.spyOn(localStorage, "getItem").mockImplementation((key) => {
    return store[key] || null;
  });

  jest.spyOn(localStorage, "setItem").mockImplementation((key, value) => {
    store[key] = value;
  });

  jest.spyOn(localStorage, "removeItem").mockImplementation((key) => {
    delete store[key];
  });

  jest.spyOn(localStorage, "clear").mockImplementation(() => {
    Object.keys(store).forEach((key) => delete store[key]);
  });

  return store;
};

// Async testing helpers
export const waitForAsync = async (fn, timeout = 5000) => {
  return waitFor(fn, { timeout });
};

export const eventually = async (assertion, timeout = 5000) => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await assertion();
      return;
    } catch (error) {
      if (Date.now() - startTime >= timeout) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
};

// Test isolation helpers
export const isolateTest = (testFn) => {
  return async () => {
    const cleanup = [];

    try {
      await testFn({ registerCleanup: (fn) => cleanup.push(fn) });
    } finally {
      // Cleanup in reverse order
      for (const cleanupFn of cleanup.reverse()) {
        try {
          await cleanupFn();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      }
    }
  };
};

// Export mocks for use in tests
export const mocks = {
  stateIsolationAdapter: mockStateIsolationAdapter,
  localStorage: mockLocalStorage,
  api: {
    response: mockApiResponse,
    error: mockApiError,
  },
};

// Default exports
export { render, screen, fireEvent, waitFor, userEvent, jest };
