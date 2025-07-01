/**
 * Data validation utilities for the Noet app
 * Prevents "works then breaks" issues by validating data structures
 */

// Note validation
export const validateNote = (note) => {
  if (!note || typeof note !== "object") {
    console.warn("validateNote: note is not an object", note);
    return false;
  }

  if (
    !note.id ||
    (typeof note.id !== "string" && typeof note.id !== "number")
  ) {
    console.warn("validateNote: note.id is missing or invalid", note);
    return false;
  }

  // Title is optional but should be string if present
  if (note.title !== undefined && typeof note.title !== "string") {
    console.warn("validateNote: note.title is not a string", note);
    return false;
  }

  // Content is optional but should be string if present
  if (note.content !== undefined && typeof note.content !== "string") {
    console.warn("validateNote: note.content is not a string", note);
    return false;
  }

  return true;
};

// User validation
export const validateUser = (user) => {
  if (!user || typeof user !== "object") {
    console.warn("validateUser: user is not an object", user);
    return false;
  }

  if (
    !user.id ||
    (typeof user.id !== "string" && typeof user.id !== "number")
  ) {
    console.warn("validateUser: user.id is missing or invalid", user);
    return false;
  }

  return true;
};

// Notebook validation
export const validateNotebook = (notebook) => {
  if (!notebook || typeof notebook !== "object") {
    console.warn("validateNotebook: notebook is not an object", notebook);
    return false;
  }

  if (
    !notebook.id ||
    (typeof notebook.id !== "string" && typeof notebook.id !== "number")
  ) {
    console.warn(
      "validateNotebook: notebook.id is missing or invalid",
      notebook
    );
    return false;
  }

  if (!notebook.name || typeof notebook.name !== "string") {
    console.warn(
      "validateNotebook: notebook.name is missing or invalid",
      notebook
    );
    return false;
  }

  return true;
};

// API response validation
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== "object") {
    console.warn("validateApiResponse: response is not an object", response);
    return false;
  }

  for (const field of expectedFields) {
    if (!(field in response)) {
      console.warn(
        `validateApiResponse: missing required field '${field}'`,
        response
      );
      return false;
    }
  }

  return true;
};

// Array validation with item validation
export const validateArray = (arr, itemValidator = null) => {
  if (!Array.isArray(arr)) {
    console.warn("validateArray: not an array", arr);
    return false;
  }

  if (itemValidator) {
    for (let i = 0; i < arr.length; i++) {
      if (!itemValidator(arr[i])) {
        console.warn(
          `validateArray: item at index ${i} failed validation`,
          arr[i]
        );
        return false;
      }
    }
  }

  return true;
};

// URL validation
export const validateUrl = (url) => {
  if (!url || typeof url !== "string") {
    console.warn("validateUrl: url is not a string", url);
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    console.warn("validateUrl: invalid URL format", url, error);
    return false;
  }
};

// Safe property access with validation
export const safeAccess = (
  obj,
  path,
  validator = null,
  defaultValue = null
) => {
  try {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        console.warn(`safeAccess: path '${path}' not found in object`, obj);
        return defaultValue;
      }
      current = current[key];
    }

    if (validator && !validator(current)) {
      console.warn(`safeAccess: value at '${path}' failed validation`, current);
      return defaultValue;
    }

    return current;
  } catch (error) {
    console.warn(`safeAccess: error accessing '${path}'`, error);
    return defaultValue;
  }
};

// Sanitize string input
export const sanitizeString = (str, maxLength = 1000) => {
  if (typeof str !== "string") {
    return "";
  }

  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ""); // Remove control characters
};

// Validation result helper
export const createValidationResult = (isValid, message = "", data = null) => ({
  isValid,
  message,
  data,
  timestamp: new Date().toISOString(),
});

// Comprehensive note validation with detailed feedback
export const validateNoteComprehensive = (note) => {
  if (!note) {
    return createValidationResult(false, "Note is null or undefined");
  }

  if (typeof note !== "object") {
    return createValidationResult(false, "Note is not an object", note);
  }

  if (!note.id) {
    return createValidationResult(false, "Note is missing id field", note);
  }

  if (typeof note.id !== "string" && typeof note.id !== "number") {
    return createValidationResult(
      false,
      "Note id is not a string or number",
      note
    );
  }

  if (note.title !== undefined && typeof note.title !== "string") {
    return createValidationResult(false, "Note title is not a string", note);
  }

  if (note.content !== undefined && typeof note.content !== "string") {
    return createValidationResult(false, "Note content is not a string", note);
  }

  if (note.tags !== undefined && !Array.isArray(note.tags)) {
    return createValidationResult(false, "Note tags is not an array", note);
  }

  if (
    note.createdAt !== undefined &&
    !(note.createdAt instanceof Date) &&
    typeof note.createdAt !== "string"
  ) {
    return createValidationResult(
      false,
      "Note createdAt is not a Date or string",
      note
    );
  }

  return createValidationResult(true, "Note is valid", note);
};

export default {
  validateNote,
  validateUser,
  validateNotebook,
  validateApiResponse,
  validateArray,
  validateUrl,
  safeAccess,
  sanitizeString,
  createValidationResult,
  validateNoteComprehensive,
};
