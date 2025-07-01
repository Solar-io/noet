/**
 * Error Recovery Service
 * Provides graceful error handling and recovery mechanisms
 */

class ErrorRecoveryService {
  constructor() {
    this.errorCounts = new Map();
    this.maxRetries = 3;
    this.recoveryStrategies = new Map();
    this.userMessageQueue = [];
    this.onUserMessage = null;
  }

  // Register recovery strategies for different error types
  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  // Handle errors with automatic recovery attempts
  async handleError(error, context = {}) {
    const errorKey = this.getErrorKey(error, context);
    const errorCount = this.errorCounts.get(errorKey) || 0;

    console.group(
      `🔧 ErrorRecoveryService handling error (attempt ${errorCount + 1})`
    );
    console.error("Error:", error);
    console.error("Context:", context);
    console.error("Error key:", errorKey);

    // Increment error count
    this.errorCounts.set(errorKey, errorCount + 1);

    // Try recovery if we haven't exceeded max retries
    if (errorCount < this.maxRetries) {
      const recoveryResult = await this.attemptRecovery(
        error,
        context,
        errorCount
      );
      console.log("Recovery result:", recoveryResult);
      console.groupEnd();
      return recoveryResult;
    } else {
      console.warn(`Max retries exceeded for error: ${errorKey}`);
      console.groupEnd();
      return this.handleUnrecoverableError(error, context);
    }
  }

  // Attempt to recover from the error
  async attemptRecovery(error, context, attempt) {
    const errorType = this.classifyError(error);
    const strategy = this.recoveryStrategies.get(errorType);

    if (strategy) {
      try {
        const result = await strategy(error, context, attempt);
        if (result.success) {
          // Clear error count on successful recovery
          const errorKey = this.getErrorKey(error, context);
          this.errorCounts.delete(errorKey);
          this.showUserMessage(`Recovered from ${errorType}`, "success");
          return { success: true, result: result.data };
        }
      } catch (recoveryError) {
        console.error("Recovery strategy failed:", recoveryError);
      }
    }

    // Default recovery strategies
    return await this.defaultRecovery(error, context, attempt);
  }

  // Default recovery strategies for common error types
  async defaultRecovery(error, context, attempt) {
    const errorType = this.classifyError(error);

    switch (errorType) {
      case "network":
        return await this.recoverFromNetworkError(error, context, attempt);

      case "validation":
        return await this.recoverFromValidationError(error, context, attempt);

      case "state":
        return await this.recoverFromStateError(error, context, attempt);

      case "component":
        return await this.recoverFromComponentError(error, context, attempt);

      default:
        return await this.recoverFromUnknownError(error, context, attempt);
    }
  }

  // Network error recovery
  async recoverFromNetworkError(error, context, attempt) {
    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff

    this.showUserMessage(
      `Network error, retrying in ${delay / 1000} seconds...`,
      "warning"
    );

    await this.sleep(delay);

    if (context.retryFunction) {
      try {
        const result = await context.retryFunction();
        return { success: true, result };
      } catch (retryError) {
        return { success: false, error: retryError };
      }
    }

    return { success: false, error: new Error("No retry function provided") };
  }

  // Validation error recovery
  async recoverFromValidationError(error, context, attempt) {
    // Try to clean/fix the data
    if (context.data && context.cleanFunction) {
      try {
        const cleanedData = context.cleanFunction(context.data);
        return { success: true, result: cleanedData };
      } catch (cleanError) {
        console.error("Data cleaning failed:", cleanError);
      }
    }

    // Fallback to default/safe values
    if (context.fallbackData) {
      this.showUserMessage(
        "Using default values due to data validation error",
        "warning"
      );
      return { success: true, result: context.fallbackData };
    }

    return {
      success: false,
      error: new Error("Cannot recover from validation error"),
    };
  }

  // State error recovery
  async recoverFromStateError(error, context, attempt) {
    // Try to reset problematic state
    if (context.resetState) {
      try {
        context.resetState();
        this.showUserMessage("Application state has been reset", "info");
        return { success: true, result: "state_reset" };
      } catch (resetError) {
        console.error("State reset failed:", resetError);
      }
    }

    return { success: false, error: new Error("Cannot reset state") };
  }

  // Component error recovery
  async recoverFromComponentError(error, context, attempt) {
    // Try to remount component
    if (context.remountComponent) {
      try {
        context.remountComponent();
        this.showUserMessage("Component has been refreshed", "info");
        return { success: true, result: "component_remounted" };
      } catch (remountError) {
        console.error("Component remount failed:", remountError);
      }
    }

    return { success: false, error: new Error("Cannot remount component") };
  }

  // Unknown error recovery
  async recoverFromUnknownError(error, context, attempt) {
    // Last resort: try a page refresh if this is a critical error
    if (attempt >= 2 && context.allowPageRefresh) {
      this.showUserMessage(
        "Refreshing page to recover from error...",
        "warning"
      );
      setTimeout(() => window.location.reload(), 2000);
      return { success: true, result: "page_refresh_scheduled" };
    }

    return { success: false, error };
  }

  // Handle unrecoverable errors
  handleUnrecoverableError(error, context) {
    const userMessage = this.generateUserFriendlyMessage(error, context);
    this.showUserMessage(userMessage, "error");

    // Log for debugging
    console.error("🚨 Unrecoverable error:", error, context);

    // Return safe fallback
    return {
      success: false,
      error,
      fallback: context.safeFallback || null,
      userMessage,
    };
  }

  // Classify error types
  classifyError(error) {
    if (!error) return "unknown";

    const message = error.message || "";
    const name = error.name || "";

    if (
      message.includes("fetch") ||
      message.includes("network") ||
      (name === "TypeError" && message.includes("Failed to fetch"))
    ) {
      return "network";
    }

    if (
      message.includes("validation") ||
      message.includes("invalid") ||
      message.includes("required")
    ) {
      return "validation";
    }

    if (
      message.includes("state") ||
      message.includes("setState") ||
      message.includes("Cannot read prop")
    ) {
      return "state";
    }

    if (message.includes("component") || name === "ChunkLoadError") {
      return "component";
    }

    return "unknown";
  }

  // Generate user-friendly error messages
  generateUserFriendlyMessage(error, context) {
    const errorType = this.classifyError(error);

    const messages = {
      network:
        "Unable to connect to the server. Please check your internet connection and try again.",
      validation:
        "Some information appears to be invalid. Please refresh the page and try again.",
      state:
        "The application encountered an unexpected state. Please refresh the page.",
      component: "A component failed to load. Please refresh the page.",
      unknown:
        "An unexpected error occurred. Please refresh the page or contact support.",
    };

    return messages[errorType] || messages.unknown;
  }

  // Generate error key for tracking
  getErrorKey(error, context) {
    const errorType = this.classifyError(error);
    const contextKey = context.operation || context.component || "unknown";
    return `${errorType}_${contextKey}`;
  }

  // Show message to user
  showUserMessage(message, type = "info") {
    console.log(`📢 User message (${type}):`, message);

    if (this.onUserMessage) {
      this.onUserMessage(message, type);
    } else {
      // Fallback: store in queue
      this.userMessageQueue.push({ message, type, timestamp: Date.now() });
    }
  }

  // Set user message handler
  setUserMessageHandler(handler) {
    this.onUserMessage = handler;

    // Flush queued messages
    while (this.userMessageQueue.length > 0) {
      const msg = this.userMessageQueue.shift();
      handler(msg.message, msg.type);
    }
  }

  // Utility: sleep function
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Clear error counts (useful for testing or manual recovery)
  clearErrorCounts() {
    this.errorCounts.clear();
  }

  // Get error statistics
  getErrorStats() {
    return {
      totalErrors: this.errorCounts.size,
      errors: Array.from(this.errorCounts.entries()).map(([key, count]) => ({
        error: key,
        count,
      })),
    };
  }
}

// Create singleton instance
const errorRecoveryService = new ErrorRecoveryService();

// Register default recovery strategies
errorRecoveryService.registerRecoveryStrategy(
  "network",
  async (error, context, attempt) => {
    // Custom network recovery logic
    const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Max 10 second delay
    await errorRecoveryService.sleep(delay);

    if (context.retryFunction) {
      const result = await context.retryFunction();
      return { success: true, data: result };
    }

    return { success: false };
  }
);

export default errorRecoveryService;
