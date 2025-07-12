/**
 * AnthropicDirectService - Direct integration with Claude via Anthropic SDK
 * For testing and development purposes only
 */

import Anthropic from '@anthropic-ai/sdk';
import { globalEvents, Events } from '../../core/events/event-emitter.js';
import { getConfig } from '../../core/config/service-config.js';

export class AnthropicDirectService {
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY,
      model: options.model || getConfig('anthropic.model'),
      maxTokens: options.maxTokens || getConfig('anthropic.maxTokens'),
      temperature: options.temperature || getConfig('anthropic.temperature'),
      dangerouslyAllowBrowser: getConfig('anthropic.dangerouslyAllowBrowser'),
      ...options
    };
    
    this.client = null;
    this.isInitialized = false;
    this.activeStreams = new Map();
  }
  
  /**
   * Initialize the service
   * @param {Object|string} options - API key string or options object
   */
  initialize(options) {
    // Handle both string (apiKey) and object parameters
    if (typeof options === 'string') {
      options = { apiKey: options };
    } else if (!options) {
      options = {};
    }
    
    // Merge with existing options
    this.options = { ...this.options, ...options };
    
    // Try to get API key from various sources
    const finalApiKey = this.options.apiKey || localStorage.getItem('anthropicApiKey');
    
    if (!finalApiKey) {
      console.warn('No Anthropic API key found. Please provide an API key.');
      globalEvents.emit(Events.SERVICE_ERROR, { 
        service: 'AnthropicDirectService',
        error: 'No API key available'
      });
      return this;
    }
    
    try {
      this.client = new Anthropic({
        apiKey: finalApiKey,
        dangerouslyAllowBrowser: this.options.dangerouslyAllowBrowser
      });
      
      this.isInitialized = true;
      console.log('AnthropicDirectService initialized successfully');
      globalEvents.emit(Events.SERVICE_INITIALIZED, { service: 'AnthropicDirectService' });
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error);
      globalEvents.emit(Events.SERVICE_ERROR, { 
        service: 'AnthropicDirectService',
        error: error.message
      });
    }
    
    return this;
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized && this.client !== null;
  }
  
  /**
   * Send a message to Claude and get a complete response
   * @param {string} message - User message
   * @param {Object} options - Override options
   * @returns {Promise<string>} Claude's response
   */
  async sendMessage(message, options = {}) {
    if (!this.isReady()) {
      throw new Error('AnthropicDirectService not initialized');
    }
    
    try {
      const response = await this.client.messages.create({
        model: options.model || this.options.model,
        max_tokens: options.maxTokens || this.options.maxTokens,
        temperature: options.temperature || this.options.temperature,
        messages: [{ role: 'user', content: message }],
        ...options
      });
      
      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic API error:', error);
      
      // Check for CORS error
      if (error.message && error.message.includes('Failed to fetch')) {
        throw new Error('CORS Error: Direct API calls to Anthropic are blocked by browsers. To use this chat service, you need to either:\n\n1. Deploy this to a server with a backend proxy\n2. Use the Anthropic SDK in a Node.js environment\n3. Upgrade to MCP Max Server for seamless browser usage\n\nFor local testing, consider using the MCP Max Server which handles CORS for you.');
      }
      
      throw error;
    }
  }
  
  /**
   * Create a streaming response from Claude
   * @param {string} message - User message
   * @param {Object} options - Override options
   * @returns {AsyncIterable} Async iterable stream of text chunks
   */
  async createStream(message, options = {}) {
    if (!this.isReady()) {
      throw new Error('AnthropicDirectService not initialized');
    }
    
    const streamId = crypto.randomUUID();
    
    try {
      const stream = await this.client.messages.stream({
        model: options.model || this.options.model,
        max_tokens: options.maxTokens || this.options.maxTokens,
        temperature: options.temperature || this.options.temperature,
        messages: [{ role: 'user', content: message }],
        ...options
      });
      
      // Store active stream
      this.activeStreams.set(streamId, stream);
      
      // Create async generator that yields text chunks
      const generator = async function* () {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.text) {
              yield chunk.delta.text;
            }
          }
        } finally {
          // Clean up when done
          this.activeStreams.delete(streamId);
        }
      }.bind(this);
      
      // Return the generator
      return generator();
      
    } catch (error) {
      console.error('Anthropic streaming error:', error);
      this.activeStreams.delete(streamId);
      
      // Check for CORS error
      if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Connection error'))) {
        throw new Error('CORS Error: Direct API calls to Anthropic are blocked by browsers. To use this chat service, you need to either:\n\n1. Deploy this to a server with a backend proxy\n2. Use the Anthropic SDK in a Node.js environment\n3. Upgrade to MCP Max Server for seamless browser usage\n\nFor local testing, consider using the MCP Max Server which handles CORS for you.');
      }
      
      throw error;
    }
  }
  
  /**
   * Create a streaming response with conversation context
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Override options
   * @returns {AsyncIterable} Async iterable stream
   */
  async createConversationStream(messages, options = {}) {
    if (!this.isReady()) {
      throw new Error('AnthropicDirectService not initialized');
    }
    
    // Ensure messages are in the correct format
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    const streamId = crypto.randomUUID();
    
    try {
      const stream = await this.client.messages.stream({
        model: options.model || this.options.model,
        max_tokens: options.maxTokens || this.options.maxTokens,
        temperature: options.temperature || this.options.temperature,
        messages: formattedMessages,
        ...options
      });
      
      this.activeStreams.set(streamId, stream);
      
      // Create async generator
      const generator = async function* () {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.text) {
              yield chunk.delta.text;
            }
          }
        } finally {
          this.activeStreams.delete(streamId);
        }
      }.bind(this);
      
      return generator();
      
    } catch (error) {
      console.error('Anthropic conversation stream error:', error);
      this.activeStreams.delete(streamId);
      throw error;
    }
  }
  
  /**
   * Stop all active streams
   */
  stopAllStreams() {
    for (const [streamId, stream] of this.activeStreams) {
      try {
        if (stream && typeof stream.controller?.abort === 'function') {
          stream.controller.abort();
        }
      } catch (error) {
        console.error(`Error stopping stream ${streamId}:`, error);
      }
    }
    this.activeStreams.clear();
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.isInitialized,
      activeStreams: this.activeStreams.size,
      model: this.options.model,
      hasApiKey: !!this.options.apiKey
    };
  }
  
  /**
   * Set the current model
   * @param {string} modelId - Model ID to use
   */
  setModel(modelId) {
    this.options.model = modelId;
    console.log(`AnthropicDirectService model set to: ${modelId}`);
  }
  
  /**
   * Get the current model
   * @returns {string} Current model ID
   */
  getModel() {
    return this.options.model;
  }
  
  /**
   * Update API key
   * @param {string} apiKey - New API key
   */
  updateApiKey(apiKey) {
    if (apiKey) {
      this.options.apiKey = apiKey;
      this.initialize(apiKey);
    }
  }
  
  /**
   * Cleanup and dispose
   */
  dispose() {
    this.stopAllStreams();
    this.client = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const anthropicDirectService = new AnthropicDirectService();
export default anthropicDirectService;