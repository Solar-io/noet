/**
 * AuthStateManager - Isolated authentication and session management
 *
 * Manages user authentication, session timeout, profile updates, and security logging
 * with complete isolation from UI and other application concerns.
 */

import eventBus from "./EventBus.js";
import stateManager from "./StateManager.js";
import { validateState } from "./StateValidator.js";

class AuthStateManager {
  constructor() {
    this.domain = "auth";
    this.eventBus = eventBus;
    this.sessionTimeoutId = null;
    this.lastActivityTime = Date.now();
    this.securityLog = [];
    this.maxSecurityLogEntries = 1000;

    // Bind methods to maintain context
    this.handleActivity = this.handleActivity.bind(this);
    this.checkSessionTimeout = this.checkSessionTimeout.bind(this);

    this._initialize();
  }

  /**
   * Initialize the auth state manager
   */
  async _initialize() {
    // Set up activity listeners
    this._setupActivityListeners();

    // Listen for auth events
    await this.eventBus.on("auth:login", this.handleLoginEvent.bind(this));
    await this.eventBus.on("auth:logout", this.handleLogoutEvent.bind(this));
    await this.eventBus.on(
      "auth:sessionTimeout",
      this.handleSessionTimeoutEvent.bind(this)
    );
    await this.eventBus.on(
      "auth:profileUpdate",
      this.handleProfileUpdateEvent.bind(this)
    );

    console.log("AuthStateManager initialized");
  }

  /**
   * Get current authentication state
   */
  getState() {
    return stateManager.getState(this.domain);
  }

  /**
   * Login with credentials
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @param {string} credentials.otp - Optional OTP code
   */
  async login(credentials) {
    try {
      // Validate credentials
      if (!credentials.email || !credentials.password) {
        throw new Error("Email and password are required");
      }

      // Log security event
      await this.logSecurityEvent("login_attempt", {
        email: credentials.email,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: "client", // In production, get from server
      });

      // Emit login start event
      await this.eventBus.emit("auth:loginStart", credentials);

      // Simulate authentication process (in real app, this would call backend)
      const authResult = await this._authenticateUser(credentials);

      if (authResult.success) {
        // Update auth state
        await stateManager.setState(
          this.domain,
          {
            isAuthenticated: true,
            user: authResult.user,
            sessionId: authResult.sessionId,
            sessionTimeout: authResult.sessionTimeout || 30 * 60 * 1000, // 30 minutes default
            lastActivity: Date.now(),
            loginTime: Date.now(),
            permissions: authResult.permissions || [],
          },
          {
            source: "AuthStateManager.login",
            operation: "login",
          }
        );

        // Start session timeout monitoring
        this._startSessionTimeout();

        // Log successful login
        await this.logSecurityEvent("login_success", {
          userId: authResult.user.id,
          email: authResult.user.email,
          sessionId: authResult.sessionId,
        });

        // Emit login success event
        await this.eventBus.emit("auth:loginSuccess", authResult.user);

        return { success: true, user: authResult.user };
      } else {
        // Log failed login
        await this.logSecurityEvent("login_failed", {
          email: credentials.email,
          reason: authResult.error || "invalid_credentials",
        });

        throw new Error(authResult.error || "Authentication failed");
      }
    } catch (error) {
      // Log error
      await this.logSecurityEvent("login_error", {
        email: credentials.email,
        error: error.message,
      });

      // Emit login error event
      await this.eventBus.emit("auth:loginError", error);

      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    try {
      const currentState = this.getState();

      if (currentState.isAuthenticated && currentState.user) {
        // Log security event
        await this.logSecurityEvent("logout", {
          userId: currentState.user.id,
          email: currentState.user.email,
          sessionId: currentState.sessionId,
          sessionDuration: Date.now() - currentState.loginTime,
        });

        // Clear session timeout
        this._clearSessionTimeout();

        // Update auth state
        await stateManager.setState(
          this.domain,
          {
            isAuthenticated: false,
            user: null,
            sessionId: null,
            sessionTimeout: null,
            lastActivity: null,
            loginTime: null,
            permissions: [],
          },
          {
            source: "AuthStateManager.logout",
            operation: "logout",
          }
        );

        // Emit logout event
        await this.eventBus.emit("auth:logout", currentState.user);
      }
    } catch (error) {
      console.error("Logout error:", error);
      await this.eventBus.emit("auth:logoutError", error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   */
  async updateProfile(profileData) {
    try {
      const currentState = this.getState();

      if (!currentState.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      // Validate profile data
      const validatedData = await this._validateProfileData(profileData);

      // Log security event
      await this.logSecurityEvent("profile_update", {
        userId: currentState.user.id,
        changes: Object.keys(validatedData),
      });

      // Update user data
      const updatedUser = { ...currentState.user, ...validatedData };

      // Update auth state
      await stateManager.setState(
        this.domain,
        {
          user: updatedUser,
        },
        {
          source: "AuthStateManager.updateProfile",
          operation: "profileUpdate",
        }
      );

      // Emit profile update event
      await this.eventBus.emit("auth:profileUpdated", updatedUser);

      return updatedUser;
    } catch (error) {
      await this.eventBus.emit("auth:profileUpdateError", error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   */
  async changePassword(passwordData) {
    try {
      const currentState = this.getState();

      if (!currentState.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      // Validate password data
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        throw new Error("Current and new passwords are required");
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New passwords do not match");
      }

      // Validate password strength
      if (!this._validatePasswordStrength(passwordData.newPassword)) {
        throw new Error("Password does not meet strength requirements");
      }

      // Log security event
      await this.logSecurityEvent("password_change", {
        userId: currentState.user.id,
        email: currentState.user.email,
      });

      // In real app, this would update the password on the backend
      // For now, we'll simulate success

      // Emit password change event
      await this.eventBus.emit("auth:passwordChanged", currentState.user);

      return { success: true };
    } catch (error) {
      await this.eventBus.emit("auth:passwordChangeError", error);
      throw error;
    }
  }

  /**
   * Update session timeout
   * @param {number} timeoutMs - Timeout in milliseconds
   */
  async updateSessionTimeout(timeoutMs) {
    try {
      const currentState = this.getState();

      if (!currentState.isAuthenticated) {
        throw new Error("User not authenticated");
      }

      // Validate timeout value
      if (timeoutMs < 5 * 60 * 1000 || timeoutMs > 30 * 24 * 60 * 60 * 1000) {
        throw new Error(
          "Session timeout must be between 5 minutes and 30 days"
        );
      }

      // Update session timeout
      await stateManager.setState(
        this.domain,
        {
          sessionTimeout: timeoutMs,
        },
        {
          source: "AuthStateManager.updateSessionTimeout",
          operation: "sessionTimeoutUpdate",
        }
      );

      // Restart session timeout with new value
      this._startSessionTimeout();

      // Log security event
      await this.logSecurityEvent("session_timeout_changed", {
        userId: currentState.user.id,
        newTimeout: timeoutMs,
      });

      // Emit session timeout update event
      await this.eventBus.emit("auth:sessionTimeoutUpdated", timeoutMs);

      return { success: true };
    } catch (error) {
      await this.eventBus.emit("auth:sessionTimeoutError", error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   */
  hasPermission(permission) {
    const currentState = this.getState();
    return (
      currentState.permissions.includes(permission) ||
      currentState.user?.isAdmin === true
    );
  }

  /**
   * Get security log
   * @param {number} limit - Maximum number of entries to return
   */
  getSecurityLog(limit = 50) {
    return this.securityLog.slice(-limit);
  }

  /**
   * Handle user activity to prevent session timeout
   */
  handleActivity() {
    const currentState = this.getState();

    if (currentState.isAuthenticated) {
      this.lastActivityTime = Date.now();

      // Update last activity in state
      stateManager.setState(
        this.domain,
        {
          lastActivity: this.lastActivityTime,
        },
        {
          source: "AuthStateManager.handleActivity",
          operation: "activityUpdate",
        }
      );

      // Reset session timeout
      this._startSessionTimeout();
    }
  }

  /**
   * Force session timeout
   */
  async forceSessionTimeout() {
    try {
      const currentState = this.getState();

      if (currentState.isAuthenticated) {
        // Log security event
        await this.logSecurityEvent("session_timeout", {
          userId: currentState.user.id,
          email: currentState.user.email,
          sessionId: currentState.sessionId,
          sessionDuration: Date.now() - currentState.loginTime,
        });

        // Clear session timeout
        this._clearSessionTimeout();

        // Update auth state
        await stateManager.setState(
          this.domain,
          {
            isAuthenticated: false,
            user: null,
            sessionId: null,
            sessionTimeout: null,
            lastActivity: null,
            loginTime: null,
            permissions: [],
          },
          {
            source: "AuthStateManager.forceSessionTimeout",
            operation: "sessionTimeout",
          }
        );

        // Emit session timeout event
        await this.eventBus.emit("auth:sessionTimeout", currentState.user);
      }
    } catch (error) {
      console.error("Session timeout error:", error);
      await this.eventBus.emit("auth:sessionTimeoutError", error);
    }
  }

  /**
   * Log security event
   * @param {string} event - Event type
   * @param {Object} metadata - Event metadata
   */
  async logSecurityEvent(event, metadata = {}) {
    const logEntry = {
      id: Date.now().toString(),
      event,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.securityLog.push(logEntry);

    // Keep log size manageable
    if (this.securityLog.length > this.maxSecurityLogEntries) {
      this.securityLog = this.securityLog.slice(-this.maxSecurityLogEntries);
    }

    // Emit security event
    await this.eventBus.emit("auth:securityEvent", logEntry);
  }

  /**
   * Private: Authenticate user (simulated)
   * @param {Object} credentials - User credentials
   */
  async _authenticateUser(credentials) {
    // In real app, this would make API call to backend
    // For demo purposes, we'll simulate with hardcoded users
    const demoUsers = [
      {
        id: "user-1",
        email: "demo@example.com",
        password: "demo123",
        name: "Demo User",
        isAdmin: false,
      },
      {
        id: "admin-1",
        email: "admin@example.com",
        password: "admin123",
        name: "Admin User",
        isAdmin: true,
      },
    ];

    const user = demoUsers.find((u) => u.email === credentials.email);

    if (!user || user.password !== credentials.password) {
      return { success: false, error: "Invalid credentials" };
    }

    // If user has 2FA enabled, check OTP
    if (user.otpEnabled && !credentials.otp) {
      return { success: false, error: "OTP required", requiresOTP: true };
    }

    if (user.otpEnabled && !this._validateOTP(credentials.otp)) {
      return { success: false, error: "Invalid OTP" };
    }

    return {
      success: true,
      user: { ...user, password: undefined }, // Don't include password in response
      sessionId: `session-${Date.now()}`,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      permissions: user.isAdmin ? ["admin", "user"] : ["user"],
    };
  }

  /**
   * Private: Validate profile data
   * @param {Object} profileData - Profile data to validate
   */
  async _validateProfileData(profileData) {
    const validatedData = {};

    // Validate name
    if (profileData.name !== undefined) {
      if (typeof profileData.name !== "string" || profileData.name.length < 1) {
        throw new Error("Name must be a non-empty string");
      }
      validatedData.name = profileData.name.trim();
    }

    // Validate email
    if (profileData.email !== undefined) {
      if (!this._validateEmail(profileData.email)) {
        throw new Error("Invalid email format");
      }
      validatedData.email = profileData.email.toLowerCase().trim();
    }

    return validatedData;
  }

  /**
   * Private: Validate email format
   * @param {string} email - Email to validate
   */
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Private: Validate password strength
   * @param {string} password - Password to validate
   */
  _validatePasswordStrength(password) {
    // Basic password strength validation
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  }

  /**
   * Private: Validate OTP
   * @param {string} otp - OTP to validate
   */
  _validateOTP(otp) {
    // Demo OTP validation - in real app, this would validate against TOTP
    return otp === "123456" || otp === "000000";
  }

  /**
   * Private: Setup activity listeners
   */
  _setupActivityListeners() {
    // Listen for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.addEventListener(event, this.handleActivity, true);
    });
  }

  /**
   * Private: Start session timeout monitoring
   */
  _startSessionTimeout() {
    const currentState = this.getState();

    if (currentState.sessionTimeout) {
      // Clear existing timeout
      this._clearSessionTimeout();

      // Set new timeout
      this.sessionTimeoutId = setTimeout(() => {
        this.forceSessionTimeout();
      }, currentState.sessionTimeout);
    }
  }

  /**
   * Private: Clear session timeout
   */
  _clearSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Private: Check session timeout
   */
  checkSessionTimeout() {
    const currentState = this.getState();

    if (currentState.isAuthenticated && currentState.sessionTimeout) {
      const timeSinceActivity = Date.now() - this.lastActivityTime;

      if (timeSinceActivity >= currentState.sessionTimeout) {
        this.forceSessionTimeout();
      }
    }
  }

  /**
   * Event handlers
   */
  async handleLoginEvent(data) {
    console.log("Auth: Login event received", data);
  }

  async handleLogoutEvent(data) {
    console.log("Auth: Logout event received", data);
  }

  async handleSessionTimeoutEvent(data) {
    console.log("Auth: Session timeout event received", data);
  }

  async handleProfileUpdateEvent(data) {
    console.log("Auth: Profile update event received", data);
  }

  /**
   * Cleanup - remove event listeners
   */
  destroy() {
    // Remove activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    events.forEach((event) => {
      document.removeEventListener(event, this.handleActivity, true);
    });

    // Clear session timeout
    this._clearSessionTimeout();

    // Remove event listeners
    this.eventBus.off("auth:login", this.handleLoginEvent);
    this.eventBus.off("auth:logout", this.handleLogoutEvent);
    this.eventBus.off("auth:sessionTimeout", this.handleSessionTimeoutEvent);
    this.eventBus.off("auth:profileUpdate", this.handleProfileUpdateEvent);
  }
}

// Create and export singleton instance
const authStateManager = new AuthStateManager();
export default authStateManager;
