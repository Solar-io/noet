/**
 * EventBus - Centralized event system for state isolation
 *
 * Enables communication between isolated state systems without direct coupling.
 * Each system can emit events and listen to events without knowing about other systems.
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.debugMode = process.env.NODE_ENV === "development";
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @param {Object} options - Options (priority, once, context)
   */
  on(event, listener, options = {}) {
    if (typeof listener !== "function") {
      throw new Error("Event listener must be a function");
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listenerData = {
      listener,
      priority: options.priority || 0,
      once: options.once || false,
      context: options.context || null,
      id: this._generateId(),
    };

    const listeners = this.listeners.get(event);
    listeners.push(listenerData);

    // Sort by priority (higher priority first)
    listeners.sort((a, b) => b.priority - a.priority);

    if (this.debugMode) {
      console.log(`📡 EventBus: Registered listener for "${event}"`, {
        priority: listenerData.priority,
        context: options.context,
      });
    }

    // Return unsubscribe function
    return () => this.off(event, listenerData.id);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @param {Object} options - Options
   */
  once(event, listener, options = {}) {
    return this.on(event, listener, { ...options, once: true });
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {string|Function} listenerOrId - Listener function or ID
   */
  off(event, listenerOrId) {
    if (!this.listeners.has(event)) return false;

    const listeners = this.listeners.get(event);
    const index = listeners.findIndex(
      (l) => l.id === listenerOrId || l.listener === listenerOrId
    );

    if (index !== -1) {
      listeners.splice(index, 1);

      if (listeners.length === 0) {
        this.listeners.delete(event);
      }

      if (this.debugMode) {
        console.log(`📡 EventBus: Removed listener for "${event}"`);
      }

      return true;
    }

    return false;
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {Object} options - Options (async, validateData)
   */
  async emit(event, data = null, options = {}) {
    const timestamp = Date.now();
    const eventData = {
      event,
      data,
      timestamp,
      source: options.source || "unknown",
      id: this._generateId(),
    };

    // Add to event history
    this._addToHistory(eventData);

    if (this.debugMode) {
      console.log(`📡 EventBus: Emitting "${event}"`, {
        data,
        source: options.source,
        listenerCount: this.listeners.get(event)?.length || 0,
      });
    }

    if (!this.listeners.has(event)) {
      if (this.debugMode) {
        console.warn(`📡 EventBus: No listeners for event "${event}"`);
      }
      return { handled: false, results: [] };
    }

    const listeners = [...this.listeners.get(event)];
    const results = [];
    const errors = [];

    for (const listenerData of listeners) {
      try {
        let result;

        if (options.async) {
          result = await this._callListener(listenerData, eventData);
        } else {
          result = this._callListener(listenerData, eventData);
        }

        results.push({
          listenerId: listenerData.id,
          context: listenerData.context,
          result,
        });

        // Remove one-time listeners
        if (listenerData.once) {
          this.off(event, listenerData.id);
        }
      } catch (error) {
        errors.push({
          listenerId: listenerData.id,
          context: listenerData.context,
          error: error.message,
        });

        console.error(`📡 EventBus: Error in listener for "${event}":`, error);
      }
    }

    return {
      handled: results.length > 0,
      results,
      errors,
      eventId: eventData.id,
    };
  }

  /**
   * Emit an event and wait for all listeners to complete
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {Object} options - Options
   */
  async emitAsync(event, data = null, options = {}) {
    return this.emit(event, data, { ...options, async: true });
  }

  /**
   * Get all registered events
   */
  getEvents() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   */
  getListenerCount(event) {
    return this.listeners.get(event)?.length || 0;
  }

  /**
   * Get event history
   * @param {number} limit - Number of events to return
   */
  getEventHistory(limit = 50) {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
    if (this.debugMode) {
      console.log("📡 EventBus: Removed all listeners");
    }
  }

  /**
   * Clear listeners for a specific event
   * @param {string} event - Event name
   */
  removeAllListenersForEvent(event) {
    this.listeners.delete(event);
    if (this.debugMode) {
      console.log(`📡 EventBus: Removed all listeners for "${event}"`);
    }
  }

  /**
   * Wait for a specific event
   * @param {string} event - Event name
   * @param {number} timeout - Timeout in milliseconds
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`EventBus: Timeout waiting for event "${event}"`));
      }, timeout);

      const listener = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(event, listener);
    });
  }

  /**
   * Create a namespaced event bus
   * @param {string} namespace - Namespace prefix
   */
  namespace(namespace) {
    return {
      on: (event, listener, options) =>
        this.on(`${namespace}:${event}`, listener, options),
      once: (event, listener, options) =>
        this.once(`${namespace}:${event}`, listener, options),
      off: (event, listenerOrId) =>
        this.off(`${namespace}:${event}`, listenerOrId),
      emit: (event, data, options) =>
        this.emit(`${namespace}:${event}`, data, {
          ...options,
          source: namespace,
        }),
      emitAsync: (event, data, options) =>
        this.emitAsync(`${namespace}:${event}`, data, {
          ...options,
          source: namespace,
        }),
    };
  }

  // Private methods

  _callListener(listenerData, eventData) {
    if (listenerData.context) {
      return listenerData.listener.call(
        listenerData.context,
        eventData.data,
        eventData
      );
    }
    return listenerData.listener(eventData.data, eventData);
  }

  _addToHistory(eventData) {
    this.eventHistory.push(eventData);

    // Keep history size under control
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create and export singleton instance
const eventBus = new EventBus();
export default eventBus;
