/**
 * Service Configuration
 * Central configuration for all services
 */

export const ServiceConfig = {
  // Streaming configuration - optimized for competitive speed
  streaming: {
    defaultBatchSize: 20,     // Larger chunks for smoother flow
    defaultBatchDelay: 10,    // Faster processing (~200 chars/sec)
    enableSyntaxHighlighting: true,
    maxBufferSize: 1024 * 1024, // 1MB
    cursorBlinkRate: 1000,
    progressUpdateInterval: 100
  },
  
  // MCP server configuration
  mcp: {
    defaultUrl: 'http://localhost:5006',
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    requestTimeout: 300000, // 5 minutes
    sseEndpoint: '/mcp/sse',
    messagesEndpoint: '/mcp/messages'
  },
  
  // Anthropic configuration
  anthropic: {
    model: import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-latest',
    maxTokens: 1024,
    temperature: 0.7,
    // Note: API key is loaded from environment variable
    dangerouslyAllowBrowser: true // Only for testing
  },
  
  // Firebase configuration
  firebase: {
    conversationsCollection: 'conversations',
    conversationsBucket: 'conversations',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    exportFormats: ['markdown', 'json', 'html']
  },
  
  // Performance monitoring
  performance: {
    fpsUpdateInterval: 1000,
    memoryUpdateInterval: 2000,
    metricsHistorySize: 100,
    enableDetailedMetrics: true
  },
  
  // UI configuration  
  ui: {
    defaultTheme: 'light',
    animationDuration: 200,
    debounceDelay: 300,
    maxMessageLength: 10000
  },
  
  // Testing configuration
  testing: {
    defaultTestDuration: 60000, // 1 minute
    stressTestIterations: 1000,
    benchmarkSamples: 100,
    enableAutoReporting: true
  }
};

/**
 * Get configuration value with dot notation
 * @param {string} path - Configuration path (e.g., 'streaming.batchSize')
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Configuration value
 */
export function getConfig(path, defaultValue = undefined) {
  const keys = path.split('.');
  let value = ServiceConfig;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

/**
 * Set configuration value with dot notation
 * @param {string} path - Configuration path
 * @param {any} value - Value to set
 */
export function setConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let target = ServiceConfig;
  
  for (const key of keys) {
    if (!(key in target)) {
      target[key] = {};
    }
    target = target[key];
  }
  
  target[lastKey] = value;
}

/**
 * Merge configuration object
 * @param {Object} config - Configuration to merge
 */
export function mergeConfig(config) {
  deepMerge(ServiceConfig, config);
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Export for use in services
export default ServiceConfig;