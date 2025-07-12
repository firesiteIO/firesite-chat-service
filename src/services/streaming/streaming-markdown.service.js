/**
 * StreamingMarkdownService - Revolutionary streaming markdown with zero re-renders
 * Based on BatchedSSEChatHandler but with service-first architecture
 */

// Core Firesite imports
import { globalEvents, Events } from '../../core/events/event-emitter.js';
import { getConfig } from '../../core/config/service-config.js';

// Firesite streaming architecture
import { FiresiteStreamingService } from './firesite-streaming.service.js';
import { UniversalDOMRenderer } from './universal-dom-renderer.service.js';

export class StreamingMarkdownService {
  constructor(options = {}) {
    this.options = {
      batchSize: getConfig('streaming.defaultBatchSize'),
      batchDelay: getConfig('streaming.defaultBatchDelay'),
      enableSyntaxHighlighting: getConfig('streaming.enableSyntaxHighlighting'),
      useUniversalParser: options.useUniversalParser !== false, // Default to true
      ...options
    };
    
    this.sessions = new Map();
    // UPDATED: Use Firesite streaming instead of legacy batching
    this.firesiteService = null;
    this.isInitialized = false;
    
    // Performance tracking
    this.metrics = {
      totalSessions: 0,
      totalChunks: 0,
      totalCharacters: 0,
      averageRenderTime: 0
    };
  }
  
  /**
   * Initialize the service
   */
  initialize() {
    if (this.isInitialized) return this;
    
    // Setup event listeners
    globalEvents.on(Events.STREAM_START, this.handleStreamStart.bind(this));
    globalEvents.on(Events.STREAM_CHUNK, this.handleStreamChunk.bind(this));
    globalEvents.on(Events.STREAM_COMPLETE, this.handleStreamComplete.bind(this));
    globalEvents.on(Events.STREAM_ERROR, this.handleStreamError.bind(this));
    
    this.isInitialized = true;
    return this;
  }

  /**
   * Switch parser type for new sessions
   */
  setParserType(useUniversalParser = true) {
    this.options.useUniversalParser = useUniversalParser;
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.isInitialized;
  }
  
  /**
   * Create a new streaming session
   * @param {HTMLElement} targetElement - DOM element to render into
   * @param {Object} options - Session options
   * @returns {string} Session ID
   */
  createSession(targetElement, options = {}) {
    const sessionId = crypto.randomUUID();
    const sessionOptions = { ...this.options, ...options };
    
    const session = {
      id: sessionId,
      // UPDATED: Use Firesite streaming service
      firesiteService: new FiresiteStreamingService(targetElement, {
        mode: 'progressive',
        enhancedDetection: false // Use our breakthrough approach
      }),
      renderer: new UniversalDOMRenderer(targetElement, { 
        enableSyntaxHighlighting: sessionOptions.enableSyntaxHighlighting 
      }),
      startTime: Date.now(),
      metrics: {
        chunkCount: 0,
        characterCount: 0,
        renderTimes: []
      },
      options: sessionOptions,
      status: 'ready'
    };
    
    this.sessions.set(sessionId, session);
    this.metrics.totalSessions++;
    
    globalEvents.emit(Events.STREAMING_PROGRESS, {
      sessionId,
      status: 'session_created'
    });
    
    return sessionId;
  }
  
  /**
   * Process a stream with progressive rendering
   * @param {AsyncIterable|ReadableStream} stream - Input stream
   * @param {HTMLElement} targetElement - Target element
   * @param {Object} options - Streaming options
   * @returns {Promise<Object>} Session metrics
   */
  async processStream(stream, targetElement, options = {}) {
    const sessionId = this.createSession(targetElement, options);
    const session = this.sessions.get(sessionId);
    
    try {
      session.status = 'streaming';
      session.renderer.clear();
      
      // Track all content for final result
      let fullContent = '';
      let isFirstBatch = true;
      
      // UPDATED: Use Firesite streaming service
      session.firesiteService.start();
      
      // Process stream chunks directly
      for await (const chunk of stream) {
        // Remove thinking state on first content
        if (isFirstBatch && options.thinkingElement) {
          options.thinkingElement.classList.remove('thinking');
          targetElement.innerHTML = ''; // Clear thinking message
          isFirstBatch = false;
        }
        
        fullContent += chunk;
        await session.firesiteService.processChunk(chunk);
        
        // Update metrics
        session.metrics.chunkCount++;
        session.metrics.characterCount += chunk.length;
      }
      
      // Finalize session
      await session.firesiteService.finish();
      await this.finalizeSession(sessionId);
      
      const metrics = this.getSessionMetrics(sessionId);
      
      return {
        sessionId,
        metrics,
        content: fullContent
      };
      
    } catch (error) {
      console.error('Stream processing error:', error);
      session.status = 'error';
      globalEvents.emit(Events.STREAM_ERROR, { sessionId, error });
      throw error;
    }
  }
  
  /**
   * Process a batch of text (LEGACY - now handled by Firesite service)
   * @private
   */
  async processBatch(sessionId, batch) {
    // UPDATED: This method is now legacy since we use Firesite streaming
    // All processing is handled by session.firesiteService.processChunk()
    return;
  }
  
  /**
   * Finalize a streaming session
   * @private
   */
  async finalizeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // Process any remaining content (both parsers have finalize method)
    const finalInstructions = session.parser.finalize();
    session.renderer.render(finalInstructions);
    session.renderer.hideCursor();
    
    // Calculate final metrics
    session.status = 'complete';
    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    const avgRenderTime = session.metrics.renderTimes.length > 0
      ? session.metrics.renderTimes.reduce((a, b) => a + b, 0) / session.metrics.renderTimes.length
      : 0;
    
    // Update global metrics
    this.updateGlobalMetrics(avgRenderTime);
    
    // Emit completion event
    globalEvents.emit(Events.STREAM_COMPLETE, {
      sessionId,
      metrics: this.getSessionMetrics(sessionId)
    });
  }
  
  /**
   * Get metrics for a session
   */
  getSessionMetrics(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId,
      status: session.status,
      duration: session.duration || (Date.now() - session.startTime),
      chunkCount: session.metrics.chunkCount,
      characterCount: session.metrics.characterCount,
      averageRenderTime: session.metrics.renderTimes.length > 0
        ? session.metrics.renderTimes.reduce((a, b) => a + b, 0) / session.metrics.renderTimes.length
        : 0,
      chunksPerSecond: session.duration 
        ? (session.metrics.chunkCount / (session.duration / 1000))
        : 0,
      charactersPerSecond: session.duration
        ? (session.metrics.characterCount / (session.duration / 1000))
        : 0
    };
  }
  
  /**
   * Get global service metrics
   */
  getGlobalMetrics() {
    return {
      ...this.metrics,
      activeSessions: this.sessions.size,
      averageChunksPerSession: this.metrics.totalSessions > 0
        ? this.metrics.totalChunks / this.metrics.totalSessions
        : 0
    };
  }
  
  /**
   * Update global metrics
   * @private
   */
  updateGlobalMetrics(avgRenderTime) {
    // Update average render time with exponential moving average
    const alpha = 0.2; // Smoothing factor
    this.metrics.averageRenderTime = this.metrics.averageRenderTime === 0
      ? avgRenderTime
      : (alpha * avgRenderTime + (1 - alpha) * this.metrics.averageRenderTime);
  }
  
  /**
   * Pause a streaming session
   */
  pauseSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'streaming') {
      session.status = 'paused';
      globalEvents.emit(Events.STREAMING_PROGRESS, {
        sessionId,
        status: 'paused'
      });
    }
  }
  
  /**
   * Resume a streaming session
   */
  resumeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'streaming';
      globalEvents.emit(Events.STREAMING_PROGRESS, {
        sessionId,
        status: 'resumed'
      });
    }
  }
  
  /**
   * Stop a streaming session
   */
  stopSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'stopped';
      this.finalizeSession(sessionId);
    }
  }
  
  /**
   * Clear a session
   */
  clearSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.renderer.clear();
      if (session.parser.reset) {
        session.parser.reset();
      }
      this.sessions.delete(sessionId);
    }
  }
  
  /**
   * Event handlers
   * @private
   */
  handleStreamStart(data) {
    // FUTURE INTEGRATION: MCP server streaming hook
    // This would integrate with MCP server's SSE transport when needed
    // Current system uses direct service connections via chat.service.js
  }
  
  handleStreamChunk(data) {
    // Process incoming chunks from external sources
    if (data.sessionId && this.sessions.has(data.sessionId)) {
      this.processBatch(data.sessionId, data.chunk);
    }
  }
  
  handleStreamComplete(data) {
    // Only process if we have a sessionId
    if (!data || !data.sessionId) {
      return;
    }
    
    // Only process if the session is still active (prevent recursion)
    const session = this.sessions.get(data.sessionId);
    if (session && session.status === 'streaming') {
      this.finalizeSession(data.sessionId);
    }
  }
  
  handleStreamError(data) {
    if (data.sessionId && this.sessions.has(data.sessionId)) {
      const session = this.sessions.get(data.sessionId);
      session.status = 'error';
      console.error('Stream error:', data.error);
    }
  }
  
  /**
   * Cleanup and dispose
   */
  dispose() {
    // Clear all sessions
    this.sessions.forEach((session, id) => this.clearSession(id));
    
    // Remove event listeners
    globalEvents.off(Events.STREAM_START, this.handleStreamStart);
    globalEvents.off(Events.STREAM_CHUNK, this.handleStreamChunk);
    globalEvents.off(Events.STREAM_COMPLETE, this.handleStreamComplete);
    globalEvents.off(Events.STREAM_ERROR, this.handleStreamError);
    
    this.isInitialized = false;
  }
}

// Export singleton instance
export const streamingMarkdownService = new StreamingMarkdownService();
export default streamingMarkdownService;