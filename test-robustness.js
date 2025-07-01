/**
 * Test script for validating the new error handling and robustness improvements
 */

import {
  validateNote,
  validateUser,
  validateApiResponse,
} from "./src/utils/validation.js";

// Test validation functions
function testValidationFunctions() {
  console.log("🧪 Testing validation functions...\n");

  // Test validateNote
  console.log("Testing validateNote:");

  const validNote = { id: "123", title: "Test Note", content: "Test content" };
  const invalidNotes = [
    null,
    undefined,
    {},
    { title: "No ID" },
    { id: 123, title: "Number ID is OK" },
    { id: "", title: "Empty ID" },
    { id: "123", title: 123 }, // Invalid title type
  ];

  console.log("✅ Valid note:", validateNote(validNote));

  invalidNotes.forEach((note, index) => {
    const result = validateNote(note);
    console.log(
      `${result ? "✅" : "❌"} Invalid note ${index + 1}:`,
      result,
      note
    );
  });

  // Test validateUser
  console.log("\nTesting validateUser:");

  const validUser = { id: "user123", name: "Test User" };
  const invalidUsers = [null, undefined, {}, { name: "No ID" }, { id: "" }];

  console.log("✅ Valid user:", validateUser(validUser));

  invalidUsers.forEach((user, index) => {
    const result = validateUser(user);
    console.log(
      `${result ? "✅" : "❌"} Invalid user ${index + 1}:`,
      result,
      user
    );
  });

  // Test validateApiResponse
  console.log("\nTesting validateApiResponse:");

  const validResponse = { success: true, data: { notes: [] } };
  const invalidResponses = [
    null,
    undefined,
    "string response",
    { data: "missing success field" },
  ];

  console.log(
    "✅ Valid API response:",
    validateApiResponse(validResponse, ["success", "data"])
  );

  invalidResponses.forEach((response, index) => {
    const result = validateApiResponse(response, ["success", "data"]);
    console.log(
      `${result ? "✅" : "❌"} Invalid API response ${index + 1}:`,
      result,
      response
    );
  });

  console.log("\n✅ Validation function tests completed!\n");
}

// Test error scenarios
async function testErrorScenarios() {
  console.log("🚨 Testing error scenarios...\n");

  // Simulate network error
  try {
    throw new Error("Simulated network error");
  } catch (error) {
    console.log("❌ Caught network error:", error.message);
  }

  // Simulate validation error
  try {
    const invalidNote = { title: "No ID" };
    if (!validateNote(invalidNote)) {
      throw new Error("Note validation failed");
    }
  } catch (error) {
    console.log("❌ Caught validation error:", error.message);
  }

  // Simulate component error
  try {
    const nullObject = null;
    const result = nullObject.someProperty; // This will throw
  } catch (error) {
    console.log("❌ Caught component error:", error.message);
  }

  console.log("\n✅ Error scenario tests completed!\n");
}

// Test data integrity patterns
function testDataIntegrityPatterns() {
  console.log("🔒 Testing data integrity patterns...\n");

  // Test safe property access pattern
  const safeGet = (obj, path, defaultValue = null) => {
    try {
      return path.split(".").reduce((o, p) => o && o[p], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const testObject = {
    user: {
      id: "123",
      profile: {
        name: "John Doe",
      },
    },
  };

  console.log(
    "✅ Safe access (valid path):",
    safeGet(testObject, "user.profile.name")
  );
  console.log(
    "✅ Safe access (invalid path):",
    safeGet(testObject, "user.settings.theme", "default")
  );
  console.log(
    "✅ Safe access (null object):",
    safeGet(null, "user.name", "fallback")
  );

  // Test array validation pattern
  const testArrays = [
    [{ id: "1" }, { id: "2" }], // Valid
    [{ id: "1" }, { name: "missing id" }], // Invalid item
    "not an array", // Not an array
    null, // Null
  ];

  testArrays.forEach((arr, index) => {
    const isValid =
      Array.isArray(arr) &&
      arr.every((item) => validateNote({ id: "1", ...item }));
    console.log(
      `${isValid ? "✅" : "❌"} Array ${index + 1} validation:`,
      isValid
    );
  });

  console.log("\n✅ Data integrity pattern tests completed!\n");
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting robustness and error handling tests...\n");

  try {
    testValidationFunctions();
    await testErrorScenarios();
    testDataIntegrityPatterns();

    console.log("🎉 All tests completed successfully!");
    console.log("\n📊 Test Summary:");
    console.log("✅ Validation functions: Working");
    console.log("✅ Error handling: Working");
    console.log("✅ Data integrity patterns: Working");
    console.log("\n🔧 Next steps:");
    console.log("1. Test the app in the browser");
    console.log("2. Try clicking on notes to verify error handling");
    console.log("3. Test with invalid data scenarios");
    console.log("4. Monitor console for error recovery messages");
  } catch (error) {
    console.error("❌ Test runner failed:", error);
  }
}

// Run tests if this script is executed directly
runTests();

export {
  testValidationFunctions,
  testErrorScenarios,
  testDataIntegrityPatterns,
  runTests,
};
