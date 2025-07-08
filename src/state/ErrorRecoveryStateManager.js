/**
 * ErrorRecoveryStateManager - Isolated error recovery and resilience management
 *
 * Manages error handling, circuit breakers, retry logic, graceful degradation, and system recovery
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class ErrorRecoveryStateManager {
  constructor() {
    this.domain = "errorRecovery";
    this.eventBus = eventBus;
    this.circuitBreakers = new Map();
    this.retryQueues = new Map();
    this.errorHistory = [];
    this.recoveryStrategies = new Map();
    this.healthChecks = new Map();
    this.degradationMode = "none";
    this.maxErrorHistory = 1000;
    this.healthCheckInterval = null;
    this.criticalErrorThreshold = 5;
    this.recoveryTimeouts = new Map();

    this._initialize();
  }

  /**
   * Initialize the error recovery state manager
   */
  async _initialize() {
    // Register default recovery strategies
    this._registerDefaultStrategies();

    // Setup default circuit breakers
    this._setupDefaultCircuitBreakers();

    // Start health monitoring
    this._startHealthMonitoring();

    // Listen for error events
    await this.eventBus.on("error:occurred", this.handleErrorEvent.bind(this));
    await this.eventBus.on(
      "error:critical",
      this.handleCriticalErrorEvent.bind(this)
    );
    await this.eventBus.on(
      "error:recovered",
      this.handleRecoveredEvent.bind(this)
    );
    await this.eventBus.on(
      "system:degraded",
      this.handleDegradationEvent.bind(this)
    );
    await this.eventBus.on(
      "system:recovered",
      this.handleSystemRecoveredEvent.bind(this)
    );

    // Global error handler
    this._setupGlobalErrorHandling();

    console.log("ErrorRecoveryStateManager initialized");
  }

  /**
   * Get current error recovery state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Record an error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @param {string} severity - Error severity (low, medium, high, critical)
   */
  async recordError(error, context = {}, severity = "medium") {
    try {
      const errorRecord = {
        id: this._generateErrorId(),
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        severity,
        context,
        timestamp: Date.now(),
        resolved: false,
        component: context.component || "unknown",
        operation: context.operation || "unknown",
        userId: context.userId || "unknown",
      };

      // Add to error history
      this.errorHistory.push(errorRecord);
      this._trimErrorHistory();

      // Update state
      const currentState = this.getState();
      const errorCounts = { ...currentState.errorCounts };
      errorCounts[severity] = (errorCounts[severity] || 0) + 1;
      errorCounts.total = (errorCounts.total || 0) + 1;

      await stateManager.setState(
        this.domain,
        {
          errorCounts,
          lastError: errorRecord,
          lastErrorTime: Date.now(),
        },
        {
          source: "ErrorRecoveryStateManager.recordError",
          operation: "recordError",
          errorId: errorRecord.id,
        }
      );

      // Check if error triggers circuit breaker
      await this._checkCircuitBreaker(errorRecord);

      // Attempt recovery if strategy exists
      await this._attemptRecovery(errorRecord);

      // Emit error recorded event
      await this.eventBus.emit("error:recorded", errorRecord);

      // Check for system degradation
      await this._checkSystemHealth();

      return errorRecord;
    } catch (recordingError) {
      console.error("Failed to record error:", recordingError);
      throw recordingError;
    }
  }

  /**
   * Create a circuit breaker
   * @param {string} name - Circuit breaker name
   * @param {Object} options - Circuit breaker options
   */
  async createCircuitBreaker(name, options = {}) {
    const circuitBreaker = {
      name,
      state: "closed", // closed, open, half-open
      errorCount: 0,
      lastError: null,
      lastSuccess: null,
      errorThreshold: options.errorThreshold || 5,
      timeout: options.timeout || 60000, // 1 minute
      resetTimeout: options.resetTimeout || 30000, // 30 seconds
      successThreshold: options.successThreshold || 3,
      consecutiveSuccesses: 0,
      createdAt: Date.now(),
      lastStateChange: Date.now(),
    };

    this.circuitBreakers.set(name, circuitBreaker);

    // Emit circuit breaker created event
    await this.eventBus.emit("errorRecovery:circuitBreakerCreated", {
      name,
      circuitBreaker,
    });

    return circuitBreaker;
  }

  /**
   * Execute operation with circuit breaker protection
   * @param {string} circuitBreakerName - Circuit breaker name
   * @param {Function} operation - Operation to execute
   * @param {*} fallback - Fallback value/function
   */
  async executeWithCircuitBreaker(
    circuitBreakerName,
    operation,
    fallback = null
  ) {
    const circuitBreaker = this.circuitBreakers.get(circuitBreakerName);

    if (!circuitBreaker) {
      throw new Error(`Circuit breaker "${circuitBreakerName}" not found`);
    }

    // Check circuit breaker state
    if (circuitBreaker.state === "open") {
      // Check if timeout has passed
      if (
        Date.now() - circuitBreaker.lastStateChange >
        circuitBreaker.timeout
      ) {
        circuitBreaker.state = "half-open";
        circuitBreaker.lastStateChange = Date.now();
      } else {
        // Circuit is open, return fallback
        return typeof fallback === "function" ? await fallback() : fallback;
      }
    }

    try {
      const result = await operation();

      // Operation succeeded
      await this._recordCircuitBreakerSuccess(circuitBreaker);

      return result;
    } catch (error) {
      // Operation failed
      await this._recordCircuitBreakerFailure(circuitBreaker, error);

      if (circuitBreaker.state === "open") {
        return typeof fallback === "function" ? await fallback() : fallback;
      }

      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   */
  async retryOperation(operation, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      jitter = true,
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();

        if (attempt > 0) {
          // Operation succeeded after retries
          await this.eventBus.emit("errorRecovery:operationRecovered", {
            attempt,
            totalAttempts: attempt + 1,
            lastError,
          });
        }

        return result;
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          // All retries exhausted
          await this.eventBus.emit("errorRecovery:operationFailed", {
            error,
            totalAttempts: attempt + 1,
            maxRetries,
          });
          throw error;
        }

        // Calculate delay for next retry
        let delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        await this.eventBus.emit("errorRecovery:retryAttempt", {
          attempt: attempt + 1,
          maxRetries,
          delay,
          error,
        });

        await this._sleep(delay);
      }
    }
  }

  /**
   * Register recovery strategy
   * @param {string} errorType - Type of error
   * @param {Function} strategy - Recovery strategy function
   */
  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * Trigger graceful degradation
   * @param {string} level - Degradation level (minimal, reduced, emergency)
   * @param {string} reason - Reason for degradation
   */
  async triggerDegradation(level, reason) {
    try {
      const currentState = this.getState();

      if (currentState.degradationMode === level) {
        return { success: false, reason: "Already in this degradation mode" };
      }

      // Update degradation mode
      this.degradationMode = level;

      await stateManager.setState(
        this.domain,
        {
          degradationMode: level,
          degradationReason: reason,
          degradationStartTime: Date.now(),
        },
        {
          source: "ErrorRecoveryStateManager.triggerDegradation",
          operation: "triggerDegradation",
          level,
          reason,
        }
      );

      // Apply degradation strategies
      await this._applyDegradationStrategies(level, reason);

      // Emit degradation event
      await this.eventBus.emit("system:degraded", {
        level,
        reason,
        timestamp: Date.now(),
      });

      return { success: true, level, reason };
    } catch (error) {
      await this.eventBus.emit("errorRecovery:degradationError", error);
      throw error;
    }
  }

  /**
   * Recover from degradation
   * @param {string} reason - Reason for recovery
   */
  async recoverFromDegradation(reason = "Manual recovery") {
    try {
      const currentState = this.getState();

      if (currentState.degradationMode === "none") {
        return { success: false, reason: "System is not degraded" };
      }

      const previousLevel = currentState.degradationMode;
      this.degradationMode = "none";

      await stateManager.setState(
        this.domain,
        {
          degradationMode: "none",
          degradationReason: null,
          degradationStartTime: null,
          lastRecoveryTime: Date.now(),
        },
        {
          source: "ErrorRecoveryStateManager.recoverFromDegradation",
          operation: "recoverFromDegradation",
          previousLevel,
          reason,
        }
      );

      // Apply recovery strategies
      await this._applyRecoveryStrategies(previousLevel, reason);

      // Emit recovery event
      await this.eventBus.emit("system:recovered", {
        previousLevel,
        reason,
        timestamp: Date.now(),
      });

      return { success: true, previousLevel, reason };
    } catch (error) {
      await this.eventBus.emit("errorRecovery:recoveryError", error);
      throw error;
    }
  }

  /**
   * Register health check
   * @param {string} name - Health check name
   * @param {Function} checkFunction - Health check function
   * @param {Object} options - Health check options
   */
  registerHealthCheck(name, checkFunction, options = {}) {
    const healthCheck = {
      name,
      checkFunction,
      interval: options.interval || 30000, // 30 seconds
      timeout: options.timeout || 5000, // 5 seconds
      critical: options.critical || false,
      lastCheck: null,
      lastResult: null,
      consecutiveFailures: 0,
      isHealthy: null,
    };

    this.healthChecks.set(name, healthCheck);

    // Emit health check registered event
    this.eventBus.emit("errorRecovery:healthCheckRegistered", {
      name,
      healthCheck,
    });

    return healthCheck;
  }

  /**
   * Run health check
   * @param {string} name - Health check name
   */
  async runHealthCheck(name) {
    const healthCheck = this.healthChecks.get(name);

    if (!healthCheck) {
      throw new Error(`Health check "${name}" not found`);
    }

    try {
      const startTime = Date.now();

      // Run health check with timeout
      const result = await Promise.race([
        healthCheck.checkFunction(),
        this._timeout(healthCheck.timeout),
      ]);

      const duration = Date.now() - startTime;

      healthCheck.lastCheck = Date.now();
      healthCheck.lastResult = { success: true, result, duration };
      healthCheck.consecutiveFailures = 0;
      healthCheck.isHealthy = true;

      // Emit health check success event
      await this.eventBus.emit("errorRecovery:healthCheckPassed", {
        name,
        result,
        duration,
      });

      return { success: true, result, duration };
    } catch (error) {
      healthCheck.lastCheck = Date.now();
      healthCheck.lastResult = { success: false, error: error.message };
      healthCheck.consecutiveFailures++;
      healthCheck.isHealthy = false;

      // Emit health check failure event
      await this.eventBus.emit("errorRecovery:healthCheckFailed", {
        name,
        error,
        consecutiveFailures: healthCheck.consecutiveFailures,
      });

      // Check if this is a critical failure
      if (healthCheck.critical && healthCheck.consecutiveFailures >= 3) {
        await this.eventBus.emit("errorRecovery:criticalHealthCheckFailed", {
          name,
          error,
          consecutiveFailures: healthCheck.consecutiveFailures,
        });
      }

      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth() {
    const healthResults = {};
    let overallHealth = "healthy";
    let criticalFailures = 0;

    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const result = await this.runHealthCheck(name);
        healthResults[name] = result;
      } catch (error) {
        healthResults[name] = {
          success: false,
          error: error.message,
          consecutiveFailures: healthCheck.consecutiveFailures,
        };

        if (healthCheck.critical) {
          criticalFailures++;
        }
      }
    }

    // Determine overall health
    if (criticalFailures > 0) {
      overallHealth = "critical";
    } else if (Object.values(healthResults).some((r) => !r.success)) {
      overallHealth = "degraded";
    }

    return {
      overallHealth,
      criticalFailures,
      healthResults,
      timestamp: Date.now(),
    };
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const currentState = this.getState();
    const recentErrors = this.errorHistory.filter(
      (error) => Date.now() - error.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    return {
      totalErrors: currentState.errorCounts.total || 0,
      errorsByCategory: currentState.errorCounts,
      recentErrors: recentErrors.length,
      criticalErrors: recentErrors.filter((e) => e.severity === "critical")
        .length,
      resolvedErrors: recentErrors.filter((e) => e.resolved).length,
      topErrors: this._getTopErrors(recentErrors),
      errorTrend: this._calculateErrorTrend(),
      averageResolutionTime: this._calculateAverageResolutionTime(),
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    const status = {};

    for (const [name, cb] of this.circuitBreakers) {
      status[name] = {
        state: cb.state,
        errorCount: cb.errorCount,
        lastError: cb.lastError,
        lastSuccess: cb.lastSuccess,
        uptime: cb.lastSuccess ? Date.now() - cb.lastSuccess : null,
      };
    }

    return status;
  }

  /**
   * Reset circuit breaker
   * @param {string} name - Circuit breaker name
   */
  async resetCircuitBreaker(name) {
    const circuitBreaker = this.circuitBreakers.get(name);

    if (!circuitBreaker) {
      throw new Error(`Circuit breaker "${name}" not found`);
    }

    circuitBreaker.state = "closed";
    circuitBreaker.errorCount = 0;
    circuitBreaker.consecutiveSuccesses = 0;
    circuitBreaker.lastStateChange = Date.now();

    await this.eventBus.emit("errorRecovery:circuitBreakerReset", {
      name,
      circuitBreaker,
    });

    return circuitBreaker;
  }

  /**
   * Clear error history
   */
  async clearErrorHistory() {
    this.errorHistory.length = 0;

    await stateManager.setState(
      this.domain,
      {
        errorCounts: { total: 0 },
        lastError: null,
        lastErrorTime: null,
      },
      {
        source: "ErrorRecoveryStateManager.clearErrorHistory",
        operation: "clearErrorHistory",
      }
    );

    await this.eventBus.emit("errorRecovery:historyCleared");

    return { success: true };
  }

  /**
   * Private: Check circuit breaker
   * @param {Object} errorRecord - Error record
   */
  async _checkCircuitBreaker(errorRecord) {
    const component = errorRecord.component;
    const circuitBreaker = this.circuitBreakers.get(component);

    if (circuitBreaker) {
      await this._recordCircuitBreakerFailure(circuitBreaker, errorRecord);
    }
  }

  /**
   * Private: Record circuit breaker failure
   * @param {Object} circuitBreaker - Circuit breaker
   * @param {Object} error - Error
   */
  async _recordCircuitBreakerFailure(circuitBreaker, error) {
    circuitBreaker.errorCount++;
    circuitBreaker.lastError = Date.now();
    circuitBreaker.consecutiveSuccesses = 0;

    if (
      circuitBreaker.state === "closed" &&
      circuitBreaker.errorCount >= circuitBreaker.errorThreshold
    ) {
      // Open circuit breaker
      circuitBreaker.state = "open";
      circuitBreaker.lastStateChange = Date.now();

      await this.eventBus.emit("errorRecovery:circuitBreakerOpened", {
        name: circuitBreaker.name,
        errorCount: circuitBreaker.errorCount,
        error,
      });
    } else if (circuitBreaker.state === "half-open") {
      // Failed in half-open state, go back to open
      circuitBreaker.state = "open";
      circuitBreaker.lastStateChange = Date.now();

      await this.eventBus.emit("errorRecovery:circuitBreakerReopened", {
        name: circuitBreaker.name,
        error,
      });
    }
  }

  /**
   * Private: Record circuit breaker success
   * @param {Object} circuitBreaker - Circuit breaker
   */
  async _recordCircuitBreakerSuccess(circuitBreaker) {
    circuitBreaker.lastSuccess = Date.now();
    circuitBreaker.consecutiveSuccesses++;

    if (
      circuitBreaker.state === "half-open" &&
      circuitBreaker.consecutiveSuccesses >= circuitBreaker.successThreshold
    ) {
      // Close circuit breaker
      circuitBreaker.state = "closed";
      circuitBreaker.errorCount = 0;
      circuitBreaker.lastStateChange = Date.now();

      await this.eventBus.emit("errorRecovery:circuitBreakerClosed", {
        name: circuitBreaker.name,
        consecutiveSuccesses: circuitBreaker.consecutiveSuccesses,
      });
    }
  }

  /**
   * Private: Attempt error recovery
   * @param {Object} errorRecord - Error record
   */
  async _attemptRecovery(errorRecord) {
    const strategy =
      this.recoveryStrategies.get(errorRecord.name) ||
      this.recoveryStrategies.get(errorRecord.component) ||
      this.recoveryStrategies.get("default");

    if (strategy) {
      try {
        const result = await strategy(errorRecord);

        if (result.success) {
          errorRecord.resolved = true;
          errorRecord.resolvedAt = Date.now();
          errorRecord.resolution = result.resolution;

          await this.eventBus.emit("error:recovered", {
            errorRecord,
            resolution: result.resolution,
          });
        }
      } catch (recoveryError) {
        console.error("Recovery strategy failed:", recoveryError);
        await this.eventBus.emit("errorRecovery:recoveryFailed", {
          errorRecord,
          recoveryError,
        });
      }
    }
  }

  /**
   * Private: Check system health
   */
  async _checkSystemHealth() {
    const currentState = this.getState();
    const criticalErrorCount = this.errorHistory.filter(
      (error) =>
        error.severity === "critical" &&
        Date.now() - error.timestamp < 5 * 60 * 1000 // Last 5 minutes
    ).length;

    if (criticalErrorCount >= this.criticalErrorThreshold) {
      await this.triggerDegradation(
        "emergency",
        `${criticalErrorCount} critical errors in the last 5 minutes`
      );
    }
  }

  /**
   * Private: Apply degradation strategies
   * @param {string} level - Degradation level
   * @param {string} reason - Reason for degradation
   */
  async _applyDegradationStrategies(level, reason) {
    switch (level) {
      case "minimal":
        // Disable non-essential features
        await this.eventBus.emit("system:disableFeature", {
          feature: "animations",
        });
        await this.eventBus.emit("system:disableFeature", {
          feature: "autoSave",
        });
        break;
      case "reduced":
        // Reduce functionality
        await this.eventBus.emit("system:disableFeature", {
          feature: "versionHistory",
        });
        await this.eventBus.emit("system:disableFeature", {
          feature: "fileAttachments",
        });
        await this.eventBus.emit("system:reduceFrequency", {
          operation: "sync",
        });
        break;
      case "emergency":
        // Emergency mode - minimal functionality only
        await this.eventBus.emit("system:enableEmergencyMode");
        await this.eventBus.emit("system:disableFeature", {
          feature: "realTimeUpdates",
        });
        break;
    }
  }

  /**
   * Private: Apply recovery strategies
   * @param {string} previousLevel - Previous degradation level
   * @param {string} reason - Reason for recovery
   */
  async _applyRecoveryStrategies(previousLevel, reason) {
    // Re-enable features based on previous degradation level
    switch (previousLevel) {
      case "emergency":
        await this.eventBus.emit("system:disableEmergencyMode");
        await this.eventBus.emit("system:enableFeature", {
          feature: "realTimeUpdates",
        });
      // Fall through to re-enable reduced features
      case "reduced":
        await this.eventBus.emit("system:enableFeature", {
          feature: "versionHistory",
        });
        await this.eventBus.emit("system:enableFeature", {
          feature: "fileAttachments",
        });
        await this.eventBus.emit("system:restoreFrequency", {
          operation: "sync",
        });
      // Fall through to re-enable minimal features
      case "minimal":
        await this.eventBus.emit("system:enableFeature", {
          feature: "animations",
        });
        await this.eventBus.emit("system:enableFeature", {
          feature: "autoSave",
        });
        break;
    }
  }

  /**
   * Private: Setup default circuit breakers
   */
  _setupDefaultCircuitBreakers() {
    this.createCircuitBreaker("database", {
      errorThreshold: 5,
      timeout: 60000,
      resetTimeout: 30000,
    });

    this.createCircuitBreaker("fileSystem", {
      errorThreshold: 3,
      timeout: 30000,
      resetTimeout: 15000,
    });

    this.createCircuitBreaker("network", {
      errorThreshold: 5,
      timeout: 120000,
      resetTimeout: 60000,
    });
  }

  /**
   * Private: Register default recovery strategies
   */
  _registerDefaultStrategies() {
    // Default strategy - log and notify
    this.registerRecoveryStrategy("default", async (errorRecord) => {
      console.log("Attempting default recovery for:", errorRecord.message);
      return { success: false, resolution: "No specific recovery strategy" };
    });

    // Network error strategy
    this.registerRecoveryStrategy("NetworkError", async (errorRecord) => {
      // Attempt to reconnect
      await this.eventBus.emit("network:reconnect");
      return { success: true, resolution: "Network reconnection attempted" };
    });

    // Database error strategy
    this.registerRecoveryStrategy("DatabaseError", async (errorRecord) => {
      // Attempt to reconnect to database
      await this.eventBus.emit("database:reconnect");
      return { success: true, resolution: "Database reconnection attempted" };
    });

    // File system error strategy
    this.registerRecoveryStrategy("FileSystemError", async (errorRecord) => {
      // Check disk space and permissions
      await this.eventBus.emit("fileSystem:checkHealth");
      return {
        success: true,
        resolution: "File system health check initiated",
      };
    });
  }

  /**
   * Private: Setup global error handling
   */
  _setupGlobalErrorHandling() {
    // Catch unhandled promise rejections
    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", (event) => {
        this.recordError(
          event.reason,
          {
            component: "global",
            operation: "unhandledRejection",
            type: "promise",
          },
          "critical"
        );
      });

      // Catch global errors
      window.addEventListener("error", (event) => {
        this.recordError(
          event.error,
          {
            component: "global",
            operation: "globalError",
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          "critical"
        );
      });
    }
  }

  /**
   * Private: Start health monitoring
   */
  _startHealthMonitoring() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getSystemHealth();
      } catch (error) {
        console.error("Health monitoring failed:", error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Private: Trim error history
   */
  _trimErrorHistory() {
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }
  }

  /**
   * Private: Get top errors
   * @param {Array} errors - Error array
   */
  _getTopErrors(errors) {
    const errorCounts = {};

    errors.forEach((error) => {
      const key = `${error.name}:${error.component}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ error: key, count }));
  }

  /**
   * Private: Calculate error trend
   */
  _calculateErrorTrend() {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const lastHourErrors = this.errorHistory.filter(
      (e) => e.timestamp > hourAgo
    ).length;
    const lastDayErrors = this.errorHistory.filter(
      (e) => e.timestamp > dayAgo
    ).length;

    return {
      lastHour: lastHourErrors,
      lastDay: lastDayErrors,
      trend: lastHourErrors > lastDayErrors / 24 ? "increasing" : "stable",
    };
  }

  /**
   * Private: Calculate average resolution time
   */
  _calculateAverageResolutionTime() {
    const resolvedErrors = this.errorHistory.filter(
      (e) => e.resolved && e.resolvedAt
    );

    if (resolvedErrors.length === 0) return 0;

    const totalTime = resolvedErrors.reduce(
      (sum, error) => sum + (error.resolvedAt - error.timestamp),
      0
    );

    return Math.round(totalTime / resolvedErrors.length);
  }

  /**
   * Private: Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Private: Timeout utility
   * @param {number} ms - Timeout in milliseconds
   */
  _timeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timeout")), ms)
    );
  }

  /**
   * Private: Generate error ID
   */
  _generateErrorId() {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event handlers
   */
  async handleErrorEvent(data) {
    console.log("ErrorRecovery: Error event received", data);
    if (data.error) {
      await this.recordError(data.error, data.context, data.severity);
    }
  }

  async handleCriticalErrorEvent(data) {
    console.log("ErrorRecovery: Critical error event received", data);
    await this.recordError(data.error, data.context, "critical");
  }

  async handleRecoveredEvent(data) {
    console.log("ErrorRecovery: Recovered event received", data);
  }

  async handleDegradationEvent(data) {
    console.log("ErrorRecovery: Degradation event received", data);
  }

  async handleSystemRecoveredEvent(data) {
    console.log("ErrorRecovery: System recovered event received", data);
  }

  /**
   * Cleanup - remove event listeners and clear intervals
   */
  destroy() {
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Clear recovery timeouts
    for (const timeout of this.recoveryTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.recoveryTimeouts.clear();

    // Remove event listeners
    this.eventBus.off("error:occurred", this.handleErrorEvent);
    this.eventBus.off("error:critical", this.handleCriticalErrorEvent);
    this.eventBus.off("error:recovered", this.handleRecoveredEvent);
    this.eventBus.off("system:degraded", this.handleDegradationEvent);
    this.eventBus.off("system:recovered", this.handleSystemRecoveredEvent);

    // Remove global error handlers
    if (typeof window !== "undefined") {
      window.removeEventListener("unhandledrejection", this.handleErrorEvent);
      window.removeEventListener("error", this.handleErrorEvent);
    }

    // Clear maps and history
    this.circuitBreakers.clear();
    this.retryQueues.clear();
    this.recoveryStrategies.clear();
    this.healthChecks.clear();
    this.errorHistory.length = 0;
  }
}

// Create and export singleton instance
const errorRecoveryStateManager = new ErrorRecoveryStateManager();
export default errorRecoveryStateManager;
