/**
 * EventEmitter - Core event system for service communication
 * Following the service-first architecture from firesite-io-slim
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
    this.oneTimeListeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} listener - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(listener);
    
    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} listener - Event handler
   */
  once(event, listener) {
    if (!this.oneTimeListeners.has(event)) {
      this.oneTimeListeners.set(event, new Set());
    }
    this.oneTimeListeners.get(event).add(listener);
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event, ...args) {
    // Handle regular listeners
    if (this.events.has(event)) {
      this.events.get(event).forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
    
    // Handle one-time listeners
    if (this.oneTimeListeners.has(event)) {
      const listeners = this.oneTimeListeners.get(event);
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in one-time listener for ${event}:`, error);
        }
      });
      this.oneTimeListeners.delete(event);
    }
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} listenerToRemove - Event handler to remove
   */
  off(event, listenerToRemove) {
    if (this.events.has(event)) {
      this.events.get(event).delete(listenerToRemove);
      if (this.events.get(event).size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
      this.oneTimeListeners.delete(event);
    } else {
      this.events.clear();
      this.oneTimeListeners.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    const regular = this.events.get(event)?.size || 0;
    const oneTime = this.oneTimeListeners.get(event)?.size || 0;
    return regular + oneTime;
  }
}

// Global event emitter instance
export const globalEvents = new EventEmitter();

// Common event names for consistency
export const Events = {
  // App lifecycle
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  
  // Streaming events
  STREAM_START: 'stream:start',
  STREAM_CHUNK: 'stream:chunk',
  STREAM_COMPLETE: 'stream:complete',
  STREAM_ERROR: 'stream:error',
  STREAMING_PROGRESS: 'streaming:progress',
  
  // Conversation events
  CONVERSATION_START: 'conversation:start',
  CONVERSATION_MESSAGE: 'conversation:message',
  CONVERSATION_SAVED: 'conversation:saved',
  CONVERSATION_LOADED: 'conversation:loaded',
  
  // MCP events
  MCP_CONNECTED: 'mcp:connected',
  MCP_DISCONNECTED: 'mcp:disconnected',
  MCP_MESSAGE: 'mcp:message',
  MCP_ERROR: 'mcp:error',
  
  // Performance events
  PERFORMANCE_METRIC: 'performance:metric',
  PERFORMANCE_TEST_START: 'performance:test:start',
  PERFORMANCE_TEST_COMPLETE: 'performance:test:complete',
  
  // Test events
  TEST_START: 'test:start',
  TEST_COMPLETE: 'test:complete',
  TEST_FAILED: 'test:failed'
};