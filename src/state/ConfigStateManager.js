/**
 * ConfigStateManager - Isolated configuration and settings management
 *
 * Manages application configuration, user settings, environment variables, and preferences
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class ConfigStateManager {
  constructor() {
    this.domain = "config";
    this.eventBus = eventBus;
    this.configCache = new Map();
    this.settingsHistory = [];
    this.maxHistoryEntries = 50;
    this.defaultConfig = this._getDefaultConfig();
    this.validationRules = this._getValidationRules();

    this._initialize();
  }

  /**
   * Initialize the config state manager
   */
  async _initialize() {
    // Load initial configuration
    await this._loadInitialConfig();

    // Listen for config events
    await this.eventBus.on("config:update", this.handleUpdateEvent.bind(this));
    await this.eventBus.on("config:reset", this.handleResetEvent.bind(this));
    await this.eventBus.on(
      "config:validate",
      this.handleValidateEvent.bind(this)
    );
    await this.eventBus.on("config:export", this.handleExportEvent.bind(this));
    await this.eventBus.on("config:import", this.handleImportEvent.bind(this));
    await this.eventBus.on(
      "auth:loginSuccess",
      this.handleUserLoginEvent.bind(this)
    );

    console.log("ConfigStateManager initialized");
  }

  /**
   * Get current config state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Get configuration value
   * @param {string} path - Configuration path (e.g., "editor.fontSize")
   * @param {*} defaultValue - Default value if not found
   */
  get(path, defaultValue = undefined) {
    const currentState = this.getState();
    return this._getNestedValue(currentState.config, path, defaultValue);
  }

  /**
   * Set configuration value
   * @param {string} path - Configuration path
   * @param {*} value - Value to set
   * @param {string} userId - User making the change
   */
  async set(path, value, userId = "system") {
    try {
      // Validate the setting
      const validation = await this._validateSetting(path, value);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const currentState = this.getState();

      // Create updated config
      const updatedConfig = this._setNestedValue(
        { ...currentState.config },
        path,
        validation.value
      );

      // Save to history
      this._addToHistory({
        path,
        oldValue: this._getNestedValue(currentState.config, path),
        newValue: validation.value,
        userId,
        timestamp: Date.now(),
      });

      // Update state
      await stateManager.setState(
        this.domain,
        {
          config: updatedConfig,
          lastUpdate: Date.now(),
          lastUpdatedBy: userId,
        },
        {
          source: "ConfigStateManager.set",
          operation: "setValue",
          path,
          userId,
        }
      );

      // Update cache
      this.configCache.set(path, validation.value);

      // Emit config change event
      await this.eventBus.emit("config:changed", {
        path,
        value: validation.value,
        previousValue: this._getNestedValue(currentState.config, path),
        userId,
      });

      return validation.value;
    } catch (error) {
      await this.eventBus.emit("config:setError", error);
      throw error;
    }
  }

  /**
   * Update multiple configuration values
   * @param {Object} updates - Object with path-value pairs
   * @param {string} userId - User making the changes
   */
  async updateMultiple(updates, userId = "system") {
    try {
      // Validate all updates first
      const validatedUpdates = {};
      for (const [path, value] of Object.entries(updates)) {
        const validation = await this._validateSetting(path, value);
        if (!validation.valid) {
          throw new Error(`Invalid setting for ${path}: ${validation.error}`);
        }
        validatedUpdates[path] = validation.value;
      }

      const currentState = this.getState();
      let updatedConfig = { ...currentState.config };

      // Apply all updates
      const changes = [];
      for (const [path, value] of Object.entries(validatedUpdates)) {
        const oldValue = this._getNestedValue(updatedConfig, path);
        updatedConfig = this._setNestedValue(updatedConfig, path, value);

        changes.push({
          path,
          oldValue,
          newValue: value,
        });

        // Update cache
        this.configCache.set(path, value);
      }

      // Save to history
      this._addToHistory({
        type: "batch",
        changes,
        userId,
        timestamp: Date.now(),
      });

      // Update state
      await stateManager.setState(
        this.domain,
        {
          config: updatedConfig,
          lastUpdate: Date.now(),
          lastUpdatedBy: userId,
        },
        {
          source: "ConfigStateManager.updateMultiple",
          operation: "batchUpdate",
          changes,
          userId,
        }
      );

      // Emit batch change event
      await this.eventBus.emit("config:batchChanged", {
        changes,
        userId,
      });

      return updatedConfig;
    } catch (error) {
      await this.eventBus.emit("config:updateMultipleError", error);
      throw error;
    }
  }

  /**
   * Reset configuration to defaults
   * @param {string} section - Optional section to reset (e.g., "editor")
   * @param {string} userId - User performing the reset
   */
  async reset(section = null, userId = "system") {
    try {
      const currentState = this.getState();
      let updatedConfig;

      if (section) {
        // Reset specific section
        updatedConfig = {
          ...currentState.config,
          [section]: this.defaultConfig[section] || {},
        };
      } else {
        // Reset entire config
        updatedConfig = { ...this.defaultConfig };
      }

      // Save to history
      this._addToHistory({
        type: "reset",
        section,
        oldConfig: section ? currentState.config[section] : currentState.config,
        userId,
        timestamp: Date.now(),
      });

      // Update state
      await stateManager.setState(
        this.domain,
        {
          config: updatedConfig,
          lastUpdate: Date.now(),
          lastUpdatedBy: userId,
        },
        {
          source: "ConfigStateManager.reset",
          operation: "reset",
          section,
          userId,
        }
      );

      // Clear relevant cache entries
      if (section) {
        for (const [key] of this.configCache) {
          if (key.startsWith(`${section}.`)) {
            this.configCache.delete(key);
          }
        }
      } else {
        this.configCache.clear();
      }

      // Emit reset event
      await this.eventBus.emit("config:reset", {
        section,
        config: updatedConfig,
        userId,
      });

      return updatedConfig;
    } catch (error) {
      await this.eventBus.emit("config:resetError", error);
      throw error;
    }
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   */
  async validateConfig(config = null) {
    const configToValidate = config || this.getState().config;
    const errors = [];
    const warnings = [];

    // Validate each section
    for (const [section, rules] of Object.entries(this.validationRules)) {
      const sectionConfig = configToValidate[section] || {};

      for (const [key, rule] of Object.entries(rules)) {
        const value = sectionConfig[key];
        const path = `${section}.${key}`;

        try {
          const validation = await this._validateSetting(path, value);
          if (!validation.valid) {
            if (validation.severity === "warning") {
              warnings.push({ path, message: validation.error });
            } else {
              errors.push({ path, message: validation.error });
            }
          }
        } catch (error) {
          errors.push({ path, message: error.message });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config: configToValidate,
    };
  }

  /**
   * Export configuration
   * @param {Object} options - Export options
   */
  async exportConfig(options = {}) {
    try {
      const currentState = this.getState();
      const {
        includeUserSettings = true,
        includeSystemSettings = false,
        includeSecrets = false,
        format = "json",
      } = options;

      // Filter config based on options
      let configToExport = { ...currentState.config };

      if (!includeSystemSettings) {
        // Remove system-only settings
        delete configToExport.system;
      }

      if (!includeSecrets) {
        // Remove secret values
        configToExport = this._removeSecrets(configToExport);
      }

      // Add metadata
      const exportData = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        exportedBy: currentState.lastUpdatedBy || "unknown",
        config: configToExport,
      };

      // Format output
      let output;
      switch (format) {
        case "json":
          output = JSON.stringify(exportData, null, 2);
          break;
        case "yaml":
          // In a real app, you might use a YAML library
          output = this._convertToYaml(exportData);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Emit export event
      await this.eventBus.emit("config:exported", {
        format,
        size: output.length,
        options,
      });

      return {
        data: output,
        filename: `noet-config-${
          new Date().toISOString().split("T")[0]
        }.${format}`,
        mimeType: format === "json" ? "application/json" : "text/yaml",
      };
    } catch (error) {
      await this.eventBus.emit("config:exportError", error);
      throw error;
    }
  }

  /**
   * Import configuration
   * @param {string} configData - Configuration data to import
   * @param {Object} options - Import options
   * @param {string} userId - User performing the import
   */
  async importConfig(configData, options = {}, userId = "system") {
    try {
      const {
        merge = true,
        validateOnly = false,
        overwriteExisting = false,
      } = options;

      // Parse config data
      let importedData;
      try {
        importedData = JSON.parse(configData);
      } catch (error) {
        throw new Error("Invalid JSON format");
      }

      // Validate imported config
      const validation = await this.validateConfig(
        importedData.config || importedData
      );
      if (!validation.valid) {
        throw new Error(
          `Invalid configuration: ${validation.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }

      if (validateOnly) {
        return {
          valid: true,
          config: validation.config,
          warnings: validation.warnings,
        };
      }

      const currentState = this.getState();
      let updatedConfig;

      if (merge && !overwriteExisting) {
        // Merge with existing config
        updatedConfig = this._mergeConfigs(
          currentState.config,
          validation.config
        );
      } else {
        // Replace config
        updatedConfig = validation.config;
      }

      // Save to history
      this._addToHistory({
        type: "import",
        oldConfig: currentState.config,
        newConfig: updatedConfig,
        merge,
        overwriteExisting,
        userId,
        timestamp: Date.now(),
      });

      // Update state
      await stateManager.setState(
        this.domain,
        {
          config: updatedConfig,
          lastUpdate: Date.now(),
          lastUpdatedBy: userId,
        },
        {
          source: "ConfigStateManager.importConfig",
          operation: "import",
          userId,
        }
      );

      // Clear cache
      this.configCache.clear();

      // Emit import event
      await this.eventBus.emit("config:imported", {
        config: updatedConfig,
        merge,
        overwriteExisting,
        userId,
      });

      return {
        success: true,
        config: updatedConfig,
        warnings: validation.warnings,
      };
    } catch (error) {
      await this.eventBus.emit("config:importError", error);
      throw error;
    }
  }

  /**
   * Get user-specific settings
   * @param {string} userId - User ID
   */
  getUserSettings(userId) {
    const currentState = this.getState();
    return currentState.config.users?.[userId] || {};
  }

  /**
   * Set user-specific setting
   * @param {string} userId - User ID
   * @param {string} path - Setting path
   * @param {*} value - Setting value
   */
  async setUserSetting(userId, path, value) {
    const userPath = `users.${userId}.${path}`;
    return await this.set(userPath, value, userId);
  }

  /**
   * Get environment-specific configuration
   * @param {string} environment - Environment name
   */
  getEnvironmentConfig(environment = "development") {
    const currentState = this.getState();
    return {
      ...currentState.config.common,
      ...currentState.config.environments?.[environment],
    };
  }

  /**
   * Switch environment
   * @param {string} environment - Target environment
   * @param {string} userId - User switching environment
   */
  async switchEnvironment(environment, userId = "system") {
    try {
      // Validate environment exists
      const currentState = this.getState();
      if (!currentState.config.environments?.[environment]) {
        throw new Error(`Environment "${environment}" not found`);
      }

      await this.set("system.currentEnvironment", environment, userId);

      // Emit environment switch event
      await this.eventBus.emit("config:environmentSwitched", {
        environment,
        userId,
      });

      return environment;
    } catch (error) {
      await this.eventBus.emit("config:environmentSwitchError", error);
      throw error;
    }
  }

  /**
   * Get configuration history
   * @param {number} limit - Maximum number of entries
   */
  getHistory(limit = 20) {
    return this.settingsHistory.slice(-limit);
  }

  /**
   * Get configuration schema
   */
  getSchema() {
    return {
      sections: Object.keys(this.validationRules),
      rules: this.validationRules,
      defaults: this.defaultConfig,
    };
  }

  /**
   * Private: Load initial configuration
   */
  async _loadInitialConfig() {
    try {
      // Try to load from localStorage first
      const savedConfig = localStorage.getItem("noet-config");
      let config = this.defaultConfig;

      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          config = this._mergeConfigs(this.defaultConfig, parsed);
        } catch (error) {
          console.warn("Failed to parse saved config, using defaults");
        }
      }

      // Initialize state
      await stateManager.setState(
        this.domain,
        {
          config,
          lastUpdate: Date.now(),
          lastUpdatedBy: "system",
          isLoaded: true,
        },
        {
          source: "ConfigStateManager._loadInitialConfig",
          operation: "initialize",
        }
      );

      // Save to localStorage
      this._saveToLocalStorage(config);
    } catch (error) {
      console.error("Failed to load initial config:", error);

      // Fallback to defaults
      await stateManager.setState(
        this.domain,
        {
          config: this.defaultConfig,
          lastUpdate: Date.now(),
          lastUpdatedBy: "system",
          isLoaded: true,
        },
        {
          source: "ConfigStateManager._loadInitialConfig",
          operation: "fallback",
        }
      );
    }
  }

  /**
   * Private: Get default configuration
   */
  _getDefaultConfig() {
    return {
      system: {
        version: "1.0.0",
        currentEnvironment: "development",
        debugMode: false,
        logLevel: "info",
      },
      environments: {
        development: {
          frontend: { port: 3001, host: "localhost" },
          backend: { port: 3004, host: "localhost" },
          debug: true,
        },
        production: {
          frontend: { port: 3000, host: "0.0.0.0" },
          backend: { port: 3004, host: "0.0.0.0" },
          debug: false,
        },
      },
      editor: {
        fontSize: 14,
        fontFamily: "Inter",
        lineHeight: 1.6,
        theme: "light",
        autoSave: true,
        autoSaveDelay: 10000,
        showLineNumbers: false,
        wordWrap: true,
      },
      ui: {
        theme: "light",
        sidebarWidth: 280,
        showPreview: false,
        compactMode: false,
        animationsEnabled: true,
        language: "en",
      },
      storage: {
        location: "./notes",
        autoBackup: true,
        backupInterval: 24,
        maxBackups: 30,
        compression: true,
      },
      security: {
        sessionTimeout: 30,
        requirePassword: true,
        allowRegistration: false,
        maxLoginAttempts: 5,
        lockoutDuration: 300,
      },
      features: {
        versionHistory: true,
        maxVersions: 100,
        autoVersioning: true,
        fileAttachments: true,
        maxFileSize: 100,
        allowedFileTypes: ["pdf", "jpg", "png", "gif", "txt", "md"],
      },
      users: {},
    };
  }

  /**
   * Private: Get validation rules
   */
  _getValidationRules() {
    return {
      editor: {
        fontSize: { type: "number", min: 8, max: 72, required: true },
        fontFamily: { type: "string", required: true },
        lineHeight: { type: "number", min: 1.0, max: 3.0, required: true },
        theme: { type: "string", enum: ["light", "dark"], required: true },
        autoSave: { type: "boolean", required: true },
        autoSaveDelay: {
          type: "number",
          min: 1000,
          max: 300000,
          required: true,
        },
      },
      ui: {
        theme: { type: "string", enum: ["light", "dark"], required: true },
        sidebarWidth: { type: "number", min: 200, max: 500, required: true },
        language: { type: "string", required: true },
      },
      storage: {
        location: { type: "string", required: true },
        autoBackup: { type: "boolean", required: true },
        backupInterval: { type: "number", min: 1, max: 168, required: true },
        maxBackups: { type: "number", min: 1, max: 100, required: true },
      },
      security: {
        sessionTimeout: { type: "number", min: 5, max: 43200, required: true },
        requirePassword: { type: "boolean", required: true },
        maxLoginAttempts: { type: "number", min: 1, max: 10, required: true },
        lockoutDuration: { type: "number", min: 60, max: 3600, required: true },
      },
    };
  }

  /**
   * Private: Validate a setting
   * @param {string} path - Setting path
   * @param {*} value - Value to validate
   */
  async _validateSetting(path, value) {
    const [section, key] = path.split(".");
    const rule = this.validationRules[section]?.[key];

    if (!rule) {
      return { valid: true, value }; // Allow unknown settings
    }

    // Type validation
    if (rule.type && typeof value !== rule.type) {
      return {
        valid: false,
        error: `Expected ${rule.type}, got ${typeof value}`,
      };
    }

    // Required validation
    if (rule.required && (value === undefined || value === null)) {
      return { valid: false, error: "Value is required" };
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      return {
        valid: false,
        error: `Value must be one of: ${rule.enum.join(", ")}`,
      };
    }

    // Range validation for numbers
    if (rule.type === "number") {
      if (rule.min !== undefined && value < rule.min) {
        return { valid: false, error: `Value must be at least ${rule.min}` };
      }
      if (rule.max !== undefined && value > rule.max) {
        return { valid: false, error: `Value must be at most ${rule.max}` };
      }
    }

    // Length validation for strings
    if (rule.type === "string") {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return {
          valid: false,
          error: `Value must be at least ${rule.minLength} characters`,
        };
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return {
          valid: false,
          error: `Value must be at most ${rule.maxLength} characters`,
        };
      }
    }

    return { valid: true, value };
  }

  /**
   * Private: Get nested value from object
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @param {*} defaultValue - Default value
   */
  _getNestedValue(obj, path, defaultValue = undefined) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined
        ? current[key]
        : defaultValue;
    }, obj);
  }

  /**
   * Private: Set nested value in object
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();

    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
    return obj;
  }

  /**
   * Private: Merge two configuration objects
   * @param {Object} base - Base configuration
   * @param {Object} override - Override configuration
   */
  _mergeConfigs(base, override) {
    const result = { ...base };

    for (const [key, value] of Object.entries(override)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = this._mergeConfigs(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Private: Remove secrets from config
   * @param {Object} config - Configuration object
   */
  _removeSecrets(config) {
    const secretKeys = ["password", "secret", "key", "token", "apiKey"];
    const cleaned = { ...config };

    for (const [key, value] of Object.entries(cleaned)) {
      if (secretKeys.some((secret) => key.toLowerCase().includes(secret))) {
        cleaned[key] = "***REDACTED***";
      } else if (value && typeof value === "object") {
        cleaned[key] = this._removeSecrets(value);
      }
    }

    return cleaned;
  }

  /**
   * Private: Convert to YAML (basic implementation)
   * @param {Object} obj - Object to convert
   */
  _convertToYaml(obj, indent = 0) {
    const spaces = "  ".repeat(indent);
    let yaml = "";

    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this._convertToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          yaml += `${spaces}  - ${item}\n`;
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  /**
   * Private: Add to history
   * @param {Object} entry - History entry
   */
  _addToHistory(entry) {
    this.settingsHistory.push(entry);

    if (this.settingsHistory.length > this.maxHistoryEntries) {
      this.settingsHistory = this.settingsHistory.slice(
        -this.maxHistoryEntries
      );
    }
  }

  /**
   * Private: Save to localStorage
   * @param {Object} config - Configuration to save
   */
  _saveToLocalStorage(config) {
    try {
      localStorage.setItem("noet-config", JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save config to localStorage:", error);
    }
  }

  /**
   * Event handlers
   */
  async handleUpdateEvent(data) {
    console.log("Config: Update event received", data);
  }

  async handleResetEvent(data) {
    console.log("Config: Reset event received", data);
  }

  async handleValidateEvent(data) {
    console.log("Config: Validate event received", data);
  }

  async handleExportEvent(data) {
    console.log("Config: Export event received", data);
  }

  async handleImportEvent(data) {
    console.log("Config: Import event received", data);
  }

  async handleUserLoginEvent(data) {
    // Load user-specific settings when user logs in
    if (data.user && data.user.id) {
      const userSettings = this.getUserSettings(data.user.id);
      console.log(
        "Config: Loaded user settings for",
        data.user.id,
        userSettings
      );
    }
  }

  /**
   * Cleanup - remove event listeners and clear caches
   */
  destroy() {
    // Save current config to localStorage
    const currentState = this.getState();
    if (currentState.config) {
      this._saveToLocalStorage(currentState.config);
    }

    // Remove event listeners
    this.eventBus.off("config:update", this.handleUpdateEvent);
    this.eventBus.off("config:reset", this.handleResetEvent);
    this.eventBus.off("config:validate", this.handleValidateEvent);
    this.eventBus.off("config:export", this.handleExportEvent);
    this.eventBus.off("config:import", this.handleImportEvent);
    this.eventBus.off("auth:loginSuccess", this.handleUserLoginEvent);

    // Clear caches
    this.configCache.clear();
    this.settingsHistory.length = 0;
  }
}

// Create and export singleton instance
const configStateManager = new ConfigStateManager();
export default configStateManager;
