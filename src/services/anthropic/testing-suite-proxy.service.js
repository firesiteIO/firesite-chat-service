/**
 * TestingSuiteProxyService - Proxy to the testing suite server for Anthropic calls
 * This avoids CORS issues by using the existing backend
 */

import { globalEvents, Events } from '../../core/events/event-emitter.js';
import { getConfig } from '../../core/config/service-config.js';

export class TestingSuiteProxyService {
  constructor(options = {}) {
    // Model aliases mapping
    this.modelAliases = {
      'claude-sonnet-latest': 'claude-sonnet-4-20250514',
      'claude-opus-latest': 'claude-opus-4-20250514',
      'claude-haiku-latest': 'claude-3-5-haiku-20241022'
    };
    
    // Default to claude-sonnet-latest alias
    const defaultModel = options.model || getConfig('anthropic.model') || 'claude-sonnet-latest';
    
    this.options = {
      baseUrl: options.baseUrl || 'http://localhost:3002',
      model: this.resolveModelAlias(defaultModel),
      ...options
    };
    this.activeStreams = new Map();
    this.initialized = false;
  }
  
  /**
   * Resolve model alias to actual model ID
   * @param {string} modelId - Model ID or alias
   * @returns {string} Resolved model ID
   */
  resolveModelAlias(modelId) {
    return this.modelAliases[modelId] || modelId;
  }
  
  /**
   * Initialize the service
   * @param {Object} options - Initialization options
   * @returns {TestingSuiteProxyService} Returns self for chaining
   */
  initialize(options = {}) {
    this.options = { ...this.options, ...options };
    this.initialized = true;
    console.log('TestingSuiteProxyService initialized');
    globalEvents.emit(Events.SERVICE_INITIALIZED, { service: 'TestingSuiteProxyService' });
    return this;
  }
  
  /**
   * Check if service is ready
   * @returns {boolean} True if service is initialized
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Create a streaming response using the testing suite proxy
   * @param {string} message - User message
   * @param {Object} options - Request options
   * @returns {AsyncIterable} Async iterable stream of text chunks
   */
  async createStream(message, options = {}) {
    const streamId = crypto.randomUUID();
    const controller = new AbortController();
    
    try {
      const response = await fetch(`${this.options.baseUrl}/test/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          systemPrompt: options.systemPrompt,
          context: options.context,
          model: options.model || this.options.model
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      // Get reader once
      const reader = response.body.getReader();
      
      // Store active stream
      this.activeStreams.set(streamId, { controller, reader });
      
      // Create async generator that yields text chunks from SSE using unified parser
      const generator = async function* () {
        const decoder = new TextDecoder();
        let buffer = '';
        let parseBuffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim()) {
                  try {
                    const parsed = JSON.parse(data);
                    // Handle both formats
                    if (parsed.content) {
                      yield parsed.content; // New MCP Max format
                    } else if (parsed.text) {
                      yield parsed.text; // Legacy format
                    }
                  } catch (e) {
                    // Not JSON, might be plain text - yield as-is
                    if (data.trim() !== '[DONE]') {
                      yield data;
                    }
                  }
                }
              } else if (line.startsWith('event: ')) {
                // Handle event lines (start, chunk, end)
                const event = line.slice(7).trim();
                if (event === 'end') {
                  break;
                }
              } else if (line.trim() && !line.startsWith(':')) {
                // Handle non-SSE formatted lines (plain text chunks)
                yield line;
              }
            }
          }
          
          // Process any remaining buffer content
          if (buffer.trim() && !buffer.startsWith(':')) {
            yield buffer;
          }
          
        } finally {
          reader.releaseLock();
          this.activeStreams.delete(streamId);
        }
      }.bind(this);
      
      return generator();
      
    } catch (error) {
      console.error('Testing suite proxy error:', error);
      this.activeStreams.delete(streamId);
      throw error;
    }
  }
  
  /**
   * Stop a specific stream
   * @param {string} streamId - Stream ID to stop
   */
  stopStream(streamId) {
    const stream = this.activeStreams.get(streamId);
    if (stream && stream.controller) {
      stream.controller.abort();
      this.activeStreams.delete(streamId);
    }
  }
  
  /**
   * Stop all active streams
   */
  stopAllStreams() {
    for (const [streamId, stream] of this.activeStreams) {
      if (stream.controller) {
        stream.controller.abort();
      }
    }
    this.activeStreams.clear();
  }
  
  /**
   * Update the model being used
   * @param {string} model - Model identifier or alias
   */
  setModel(model) {
    const resolvedModel = this.resolveModelAlias(model);
    this.options.model = resolvedModel;
    console.log(`Model updated to: ${resolvedModel}${model !== resolvedModel ? ` (from alias: ${model})` : ''}`);
    globalEvents.emit('anthropic:modelChanged', { model: resolvedModel });
  }
  
  /**
   * Get current model
   * @returns {string} Current model identifier
   */
  getModel() {
    return this.options.model;
  }
  
  /**
   * Check if the testing suite server is available
   * @returns {Promise<boolean>} True if server is available
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.options.baseUrl}/test/status`);
      const data = await response.json();
      return data.success && data.anthropicApiKey === 'configured';
    } catch (error) {
      console.warn('Testing suite server not available:', error.message);
      return false;
    }
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      baseUrl: this.options.baseUrl,
      activeStreams: this.activeStreams.size
    };
  }
  
  /**
   * Cleanup and dispose
   */
  dispose() {
    this.stopAllStreams();
  }
}

// Export singleton instance
export const testingSuiteProxyService = new TestingSuiteProxyService();
export default testingSuiteProxyService;