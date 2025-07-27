/**
 * MCP Proxy Service - Connects to Firesite MCP Server for CORS-free Anthropic API access
 * This service uses the local Firesite MCP server as a proxy to avoid CORS issues
 */

import { globalEvents } from '../../core/events/event-emitter.js';
// Removed service-registry import - can't use fs in browser

export class McpProxyService {
  constructor(options = {}) {
    this.options = {
      baseUrl: 'http://localhost:3001',
      timeout: 30000,
      retries: 3,
      ...options
    };
    
    this.initialized = false;
    // Get model from localStorage or use Claude 3.7 Sonnet (Claude 3.5 deprecated July 21, 2025)
    this.currentModel = localStorage.getItem('selectedModel') || 'claude-3-7-sonnet-20250219';
  }
  
  /**
   * Initialize the MCP proxy service with retry logic
   */
  async initialize() {
    console.log('Initializing MCP Proxy Service...');
    
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.options.retries; attempt++) {
      try {
        console.log(`Attempting to connect to MCP server (attempt ${attempt}/${this.options.retries})...`);
        
        // Try to discover MCP Basic port from registry API
        let baseUrl = this.options.baseUrl;
        try {
          // First attempt to get registry from MCP Basic itself
          const registryResponse = await fetch(`${baseUrl}/api/registry`);
          if (registryResponse.ok) {
            const registry = await registryResponse.json();
            const mcpBasic = registry.services?.['mcp-basic'];
            if (mcpBasic && mcpBasic.port) {
              baseUrl = `http://localhost:${mcpBasic.port}`;
              console.log(`Discovered MCP Basic server on port ${mcpBasic.port} from registry`);
            }
          }
        } catch (error) {
          console.log('Registry API not available, using default port:', baseUrl);
        }
        
        // Test connection to MCP server with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        const response = await fetch(`${baseUrl}/health`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`MCP server not responding: ${response.status}`);
        }
        
        const health = await response.json();
        console.log('MCP Server health:', health);
        
        // Store the discovered base URL for future requests
        this.options.baseUrl = baseUrl;
        
        this.initialized = true;
        console.log('MCP Proxy Service initialized successfully with URL:', baseUrl);
        
        // Listen for model changes
        this.setupEventListeners();
        
        return this;
        
      } catch (error) {
        lastError = error;
        
        if (attempt < this.options.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.warn(`MCP server not ready (attempt ${attempt}/${this.options.retries}), retrying in ${delay}ms...`);
          await this._delay(delay);
        } else {
          console.error('Failed to initialize MCP Proxy Service after all retries:', error);
        }
      }
    }
    
    throw new Error(`MCP server connection failed after ${this.options.retries} attempts: ${lastError.message}. Make sure the Firesite MCP server is running on ${this.options.baseUrl}`);
  }

  /**
   * Helper method for delays
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Set the current model
   */
  setModel(modelId) {
    this.currentModel = modelId;
    console.log(`Model set to: ${modelId}`);
  }
  
  /**
   * Get the current model
   */
  getModel() {
    return this.currentModel;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for model changes from the model selector
    globalEvents.on('anthropic:modelChanged', (data) => {
      if (data.model && data.model !== this.currentModel) {
        this.setModel(data.model);
      }
    });
  }
  
  /**
   * Create a streaming response via MCP proxy
   * @param {string} message - User message
   * @param {Object} options - Override options
   * @returns {AsyncIterable} Async iterable stream of text chunks
   */
  async createStream(message, options = {}) {
    if (!this.isReady()) {
      throw new Error('MCP Proxy Service not initialized');
    }
    
    const payload = {
      message,
      model: options.model || this.currentModel,
      options: {
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        ...options
      }
    };
    
    console.log('MCP request:', { model: payload.model, messageLength: payload.message.length });
    
    try {
      const response = await fetch(`${this.options.baseUrl}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body received');
      }
      
      // Create async generator from SSE stream
      return this._createStreamGenerator(response.body);
      
    } catch (error) {
      console.error('MCP proxy streaming error:', error);
      throw error;
    }
  }
  
  /**
   * Create async generator from SSE stream
   * @private
   */
  async* _createStreamGenerator(readableStream) {
    const reader = readableStream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          // Handle different SSE event types
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue; // Process the event type but don't yield
          }
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              // Handle different event data - support both formats
              if (parsed.content) {
                yield parsed.content; // New MCP Max format
              } else if (parsed.text) {
                yield parsed.text; // Legacy format
              } else if (parsed.success && parsed.success === true) {
                // Start or end event - don't yield anything
                continue;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e.message && e.message !== 'Unexpected end of JSON input') {
                console.warn('Failed to parse SSE data:', data, e);
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  /**
   * Check MCP server health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.options.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get service info
   */
  getInfo() {
    return {
      name: 'MCP Proxy Service',
      baseUrl: this.options.baseUrl,
      currentModel: this.currentModel,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const mcpProxyService = new McpProxyService();
export default mcpProxyService;