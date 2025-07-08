# Noet Testing Documentation

This document describes the comprehensive tiered testing system for the Noet note-taking application.

## Overview

The Noet testing system is designed with four distinct tiers, each serving a specific purpose in ensuring application quality and reliability:

1. **Smoke Tests** (30 seconds) - Critical functionality verification
2. **Unit Tests** - Component and module testing
3. **Integration Tests** - Feature combination testing
4. **E2E Tests** - Critical user path testing

## Test Architecture

### 🏗️ Test Structure

```
tests/
├── smoke/              # Quick critical functionality tests
│   ├── basic-functionality.test.js
│   └── state-isolation.test.js
├── unit/               # Component and module unit tests
│   ├── components/     # React component tests
│   ├── state/          # State manager tests
│   └── services/       # Service layer tests
├── integration/        # Feature combination tests
│   ├── editor-versioning.test.js
│   └── auth-tag-management.test.js
├── e2e/                # End-to-end user journey tests
│   └── critical-user-paths.test.js
├── helpers/            # Shared test utilities
│   └── test-utils.js
└── setup/              # Test configuration
    └── jest.setup.js
```

### 🔧 Configuration Files

- `jest.config.js` - Main Jest configuration with project-based setup
- `babel.config.js` - Babel configuration for JSX/ES6+ support
- `tests/setup/jest.setup.js` - Global test setup and mocks

## Test Types

### 🚀 Smoke Tests (30 seconds)

**Purpose**: Verify that critical application functionality works without deep testing.

**Characteristics**:

- Maximum 30-second execution time
- Tests basic module loading
- Verifies state management initialization
- Checks event system functionality
- Runs with single worker for speed

**When to Run**:

- Before every deployment
- After major changes
- As part of CI/CD pipeline
- First test in development

**Example**:

```javascript
test("should load core modules without errors", async () => {
  const startTime = performance.now();

  await import("../../src/state/StateManager.js");
  await import("../../src/state/EventBus.js");

  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(1000);
});
```

### 🧪 Unit Tests

**Purpose**: Test individual components and modules in isolation.

**Characteristics**:

- Fast execution (< 10 seconds per test)
- Complete isolation using mocks
- High code coverage
- Focus on single responsibility

**Coverage Areas**:

- React components
- State managers
- Utility functions
- Service modules
- Event handlers

**Example**:

```javascript
test(
  "should render with note content",
  isolateTest(async ({ registerCleanup }) => {
    const note = {
      id: 1,
      title: "Test Note",
      content: "Test content",
    };

    render(<NoteEditor note={note} />);

    const textarea = screen.getByTestId("editor-content");
    expect(textarea).toHaveValue("Test content");
  })
);
```

### 🔗 Integration Tests

**Purpose**: Test how different systems work together.

**Characteristics**:

- Tests feature combinations
- Verifies cross-system communication
- Event-driven interactions
- Performance under load

**Test Scenarios**:

- Editor + Versioning system
- Authentication + Tag management
- Sync + Offline functionality
- Error recovery between systems

**Example**:

```javascript
test(
  "should create versions when content changes",
  isolateTest(async ({ registerCleanup }) => {
    const eventBus = new EventBus();
    const editorManager = new EditorStateManager(eventBus);
    const versioningManager = new VersioningStateManager(eventBus);

    editorManager.setContent("Initial content");
    await new Promise((resolve) => setTimeout(resolve, 100));

    editorManager.setContent("Updated content");
    await new Promise((resolve) => setTimeout(resolve, 100));

    const versions = versioningManager.getVersions();
    expect(versions.length).toBeGreaterThan(0);
  })
);
```

### 🎭 E2E Tests

**Purpose**: Test complete user journeys in a real browser environment.

**Characteristics**:

- Uses Puppeteer for browser automation
- Tests critical user paths
- Longer execution time (up to 60 seconds per test)
- Real user interactions

**Test Scenarios**:

- Complete login/logout flow
- Note creation and editing
- Tag management workflow
- Version history restoration
- Offline/online synchronization

**Example**:

```javascript
test(
  "should complete full login/logout cycle",
  isolateTest(async ({ registerCleanup }) => {
    await page.goto(TEST_URL);
    await page.waitForSelector('[data-testid="login-form"]');

    await page.type('[data-testid="username-input"]', "testuser");
    await page.type('[data-testid="password-input"]', "testpassword");
    await page.click('[data-testid="login-button"]');

    await page.waitForSelector('[data-testid="main-app"]');

    const userInfo = await page.textContent('[data-testid="user-info"]');
    expect(userInfo).toContain("testuser");
  })
);
```

## Running Tests

### 📋 Available Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:smoke       # Smoke tests only
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only

# Development workflows
npm run test:watch       # Watch mode for all tests
npm run test:watch:unit  # Watch mode for unit tests only
npm run test:coverage    # Generate coverage report

# CI/CD workflows
npm run test:ci          # CI mode (no watch, with coverage)
npm run test:quick       # Quick smoke test verification
```

### 🔄 Watch Mode

The testing system includes an intelligent watch mode that automatically runs relevant tests when files change:

```bash
# Start watch mode
npm run test:watch

# Or use the dedicated watch runner
node scripts/test/watch-runner.js
```

**Watch Mode Features**:

- Automatic test selection based on changed files
- Debounced file change detection
- Interactive commands (press 'a' for all tests, 's' for smoke, etc.)
- Performance statistics
- Intelligent mapping of source files to test types

### 🚀 Advanced Test Running

```bash
# Custom test runner with options
node scripts/test/run-tests.js --smoke --verbose
node scripts/test/run-tests.js --all --coverage
node scripts/test/run-tests.js --e2e --debug
node scripts/test/run-tests.js --ci --parallel
```

**Options**:

- `--smoke`, `--unit`, `--integration`, `--e2e`, `--all` - Test type selection
- `--watch` - Enable watch mode
- `--coverage` - Generate coverage report
- `--ci` - CI mode (optimized for continuous integration)
- `--bail` - Stop on first failure
- `--verbose` - Detailed output
- `--debug` - Enable debugging mode
- `--parallel` - Run test suites in parallel

## Test Isolation and Cleanup

### 🧹 Automatic Cleanup

Every test uses the `isolateTest` helper function to ensure proper cleanup:

```javascript
test(
  "should handle state updates",
  isolateTest(async ({ registerCleanup }) => {
    const manager = new StateManager();
    registerCleanup(() => manager.destroy?.());

    // Test logic here

    // Cleanup happens automatically
  })
);
```

### 🔒 Test Independence

**Guaranteed Independence**:

- Each test runs in complete isolation
- No shared state between tests
- Automatic cleanup of resources
- Mock reset between tests
- Isolated browser contexts for E2E tests

**Cleanup Mechanisms**:

- Event listener cleanup
- State manager destruction
- Local/session storage clearing
- Mock function reset
- Temporary file removal

## Test Utilities

### 🛠️ Helper Functions

The `test-utils.js` file provides comprehensive testing utilities:

```javascript
// Rendering utilities
renderWithWrapper(component, options);

// Test data factories
createTestUser(overrides);
createTestNote(overrides);
createTestTag(overrides);

// Performance testing
measureRenderTime(renderFn);
expectPerformance(duration, maxMs);

// State testing
waitForElementState(selector, expectedState);
eventually(assertion, timeout);

// Mocking utilities
mockLocalStorage(initialData);
mockApiResponse(data, status);
```

### 🎭 Mock System

Comprehensive mocking for state isolation:

```javascript
// State manager mocks
const mockStateManager = {
  useAuthState: () => ({ user: mockUser, login: jest.fn() }),
  useEditorState: () => ({ content: "", setContent: jest.fn() }),
  // ... other state hooks
};

// API mocking
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
```

## Performance Requirements

### ⏱️ Execution Time Limits

- **Smoke Tests**: Maximum 30 seconds total
- **Unit Tests**: Maximum 10 seconds per test
- **Integration Tests**: Maximum 30 seconds per test
- **E2E Tests**: Maximum 60 seconds per test

### 📊 Performance Monitoring

Tests automatically track performance and flag slow operations:

```javascript
// Automatic performance tracking
const { result, duration } = global.measurePerformance(() => {
  // Test operation
});

// Automatic warnings for slow operations
expect(duration).toBeLessThan(100); // Fails if operation takes > 100ms
```

## Error Handling

### 🚨 Clear Error Messages

Tests are designed to provide clear, actionable error messages:

```javascript
// Good error message
expect(manager.getState("EDITOR").content).toBe("expected content");
// Error: Expected editor content to be 'expected content' but got 'actual content'

// Performance expectations
expect(duration).toBeWithinRange(50, 200);
// Error: Expected 350ms to be within range 50-200ms
```

### 🔄 Error Recovery Testing

Integration tests specifically verify error recovery:

```javascript
test(
  "should recover from editor errors",
  isolateTest(async ({ registerCleanup }) => {
    // Simulate error condition
    try {
      editorManager.setContent(null);
    } catch (error) {
      // Error should be handled gracefully
    }

    // System should recover
    const versions = versioningManager.getVersions();
    versioningManager.restoreVersion(versions[0].id);
    expect(editorManager.getContent()).toBe("Valid content");
  })
);
```

## CI/CD Integration

### 🔄 Continuous Integration

The testing system is optimized for CI/CD environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm ci
    npm run test:ci
```

**CI Mode Features**:

- No watch mode
- Automatic coverage reporting
- Fail-fast on critical errors
- Optimized for parallel execution
- Clear exit codes

### 📊 Coverage Requirements

- **Unit Tests**: Minimum 90% line coverage
- **Integration Tests**: Minimum 80% feature coverage
- **E2E Tests**: 100% critical path coverage

## Debugging Tests

### 🐛 Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Debug specific test type
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="specific test"
```

### 📝 Verbose Output

```bash
# Detailed test output
npm run test:smoke -- --verbose

# Debug with extra logging
DEBUG=* npm run test:integration
```

### 🔍 Test Investigation

```javascript
// Add debugging to tests
test(
  "debug example",
  isolateTest(async ({ registerCleanup }) => {
    console.log("Test state:", manager.getState("EDITOR"));

    // Use Jest's debugging features
    expect.extend({
      toBeWithinRange(received, floor, ceiling) {
        console.log(`Checking ${received} within ${floor}-${ceiling}`);
        // ... assertion logic
      },
    });
  })
);
```

## Best Practices

### ✅ Writing Good Tests

1. **Use descriptive test names**:

   ```javascript
   // Good
   test("should create version when content changes after auto-save interval");

   // Bad
   test("version test");
   ```

2. **Test behavior, not implementation**:

   ```javascript
   // Good - tests behavior
   expect(screen.getByText("Save successful")).toBeVisible();

   // Bad - tests implementation
   expect(component.state.saveStatus).toBe("success");
   ```

3. **Use the isolation helper**:

   ```javascript
   // Always use isolateTest for proper cleanup
   test(
     "should handle user input",
     isolateTest(async ({ registerCleanup }) => {
       // Test logic with automatic cleanup
     })
   );
   ```

4. **Mock external dependencies**:

   ```javascript
   // Mock API calls
   global.fetch = jest.fn().mockResolvedValue(mockResponse);

   // Mock state managers
   jest.mock("../../../src/state/StateIsolationAdapter.jsx");
   ```

### 🚨 Common Pitfalls

1. **Avoid test interdependence**
2. **Don't test third-party libraries**
3. **Avoid excessive mocking**
4. **Don't ignore performance requirements**
5. **Always clean up resources**

### 📈 Maintaining Tests

1. **Update tests when features change**
2. **Remove obsolete tests**
3. **Refactor test utilities when needed**
4. **Monitor test performance regularly**
5. **Keep test documentation current**

## Troubleshooting

### 🔧 Common Issues

**Tests timing out**:

```javascript
// Increase timeout for specific tests
jest.setTimeout(30000);

// Or use async/await properly
await waitFor(() => {
  expect(screen.getByText("Expected text")).toBeInTheDocument();
});
```

**Memory leaks in tests**:

```javascript
// Always cleanup event listeners
registerCleanup(() => {
  manager.destroy();
  eventBus.removeAllListeners();
});
```

**State pollution between tests**:

```javascript
// Use isolateTest helper
test(
  "isolated test",
  isolateTest(async ({ registerCleanup }) => {
    // Test is automatically isolated
  })
);
```

### 📞 Getting Help

1. Check test output for specific error messages
2. Run tests with `--verbose` flag for detailed information
3. Use `--debug` mode for step-by-step debugging
4. Check the test utilities documentation
5. Review existing tests for patterns and examples

## Conclusion

The Noet testing system provides comprehensive coverage with four distinct tiers, ensuring both rapid feedback during development and thorough validation before deployment. The system emphasizes test independence, clear error messages, and proper cleanup to maintain a reliable and maintainable test suite.

For questions or issues with the testing system, refer to the troubleshooting section or review the existing test files for examples and patterns.
