/**
 * ChatService - Core chat functionality with streaming markdown support
 * Integrates with the revolutionary StreamingMarkdownService for zero re-renders
 * 
 * Service-First Architecture following SOLID principles:
 * - Single Responsibility: Manages chat conversation flow
 * - Open/Closed: Extensible for new AI providers
 * - Liskov Substitution: Interface-based AI provider support
 * - Interface Segregation: Clean service boundaries
 * - Dependency Inversion: Depends on abstractions, not concretions
 */

import { globalEvents, Events } from '../../core/events/event-emitter.js';
import { streamingMarkdownService } from '../streaming/streaming-markdown.service.js';
import { BreakthroughStreamingService } from '../streaming/breakthrough-streaming.service.js';
import { anthropicDirectService } from '../anthropic/anthropic-direct.service.js';
import { mcpProxyService } from '../anthropic/mcp-proxy.service.js';
import { smartScrollService } from '../ui/smart-scroll.service.js';
import { messageCopyService } from '../ui/message-copy.service.js';
import { bugReportCapture } from '../debug/bug-report-capture.service.js';
import { bugReportButton } from '../../components/bug-report-button.js';
import { mcpServerManager } from '../mcp/mcp-server-manager.service.js';
import { contextManager } from '../context/context-manager.service.js';

export class ChatService {
  constructor(options = {}) {
    this.options = {
      enableAutoSave: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxHistorySize: 1000,
      debug: false, // Enable verbose console logging
      ...options
    };
    
    // Service dependencies
    this.streamingService = streamingMarkdownService;
    this.aiProvider = anthropicDirectService;
    this.connectionMode = localStorage.getItem('connectionMode') || 'mcp'; // Default to MCP mode
    
    // State management
    this.currentSession = null;
    this.messageHistory = [];
    this.isStreaming = false;
    this.initialized = false;
    this.currentAbortController = null;
    
    // Context state with new acronym definitions
    this.contextState = {
      mmco: null,        // Micro Meta Context Objects
      uacp: null,        // Universal AI Context Profile  
      pacp: null,        // Personal AI Context Profile (new!)
      systemPrompt: null,
      aiRole: 'developer',
      model: null        // Selected Claude model
    };
    
    // UI element references (set during initialization)
    this.chatContainer = null;
    this.messageInput = null;
    this.sendButton = null;
    
    // Metrics and analytics
    this.metrics = {
      totalMessages: 0,
      totalSessions: 0,
      averageResponseTime: 0,
      streamingMetrics: []
    };
  }
  
  /**
   * Initialize the chat service
   * @param {Object} config - Configuration options
   */
  initialize(config = {}) {
    // Merge configuration
    this.options = { ...this.options, ...config };
    
    // Initialize UI references
    this.setupUIReferences();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load persisted context (context manager is initialized in app.js)
    this.loadContextFromStorage();
    
    // Set up initial AI provider based on connection mode
    this.initializeAIProvider();
    
    // Create initial session
    this.createSession();
    
    this.initialized = true;
    globalEvents.emit(Events.SERVICE_INITIALIZED, { service: 'ChatService' });
    
    return this;
  }
  
  /**
   * Setup UI element references
   */
  setupUIReferences() {
    this.chatContainer = document.getElementById('streaming-chat-messages');
    this.messageInput = document.getElementById('streaming-message-input');
    this.sendButton = document.getElementById('streaming-send-message');
    
    if (!this.chatContainer) {
      console.warn('Chat container element not found - will use provided container');
    }
  }
  
  /**
   * Initialize AI provider based on connection mode
   */
  async initializeAIProvider() {
    // Ensure MCP server manager is initialized
    await mcpServerManager.ensureInitialized();
    
    // Check if MCP Max server is connected and available
    const mcpStatus = mcpServerManager.getStatus();
    
    console.log('🔍 Initializing AI provider - MCP Status:', mcpStatus);
    
    if (mcpStatus.isConnected && mcpStatus.mode === 'max') {
      // Use MCP Max server for context-aware AI
      this.aiProvider = {
        isReady: () => mcpServerManager.isConnected,
        createStream: (message, options) => this.createMCPMaxStream(message, options)
      };
      console.log('🎯 Using MCP Max server for AI responses');
    } else if (this.connectionMode === 'mcp' || (mcpStatus.isConnected && mcpStatus.mode === 'base')) {
      console.log('🎯 Attempting to use MCP proxy service (base mode)');
      try {
        // Try to use MCP proxy service
        this.aiProvider = mcpProxyService;
        if (!mcpProxyService.isReady()) {
          await mcpProxyService.initialize();
        }
        console.log('✅ Successfully initialized MCP proxy service');
      } catch (error) {
        console.error('Failed to initialize MCP proxy service:', error);
        console.log('Falling back to direct Anthropic service');
        this.connectionMode = 'direct';
        this.aiProvider = anthropicDirectService;
      }
    } else {
      // Use direct Anthropic service
      this.aiProvider = anthropicDirectService;
    }
  }

  /**
   * Create streaming response from MCP Max server
   */
  async createMCPMaxStream(message, options = {}) {
    try {
      // Ensure MCP Max connection
      await mcpServerManager.ensureConnection();
      
      console.log('🎯 Using MCP Max server for AI response');
      console.log('🔍 Message received:', message);
      console.log('🔍 Options received:', options);
      
      // Extract context from options (passed from prepareRequestData)
      const context = options.context;
      
      // Get current model from model selector or context, fallback to Claude 3.7 Sonnet
      const selectedModel = localStorage.getItem('selectedModel') || 
                           this.contextState.model || 
                           'claude-3-7-sonnet-20250219';
      
      const payload = {
        message: message,
        conversationId: mcpServerManager.sessionId,
        context: context,
        model: selectedModel
      };
      
      console.log('📤 MCP Max payload:', payload);
      
      // Use the Claude API through MCP Max with session context
      const response = await fetch('http://localhost:3002/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`MCP Max server error: ${response.status}`);
      }

      // Return streaming iterator for the response
      return {
        async *[Symbol.asyncIterator]() {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          if (!reader) {
            throw new Error('No response body reader available');
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      yield parsed.content; // Yield just the content string, not wrapped in object
                    } else if (parsed.final) {
                      // Final message from MCP Max - signal completion
                      return;
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }
      };
    } catch (error) {
      console.error('MCP Max streaming error:', error);
      throw error;
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for streaming events
    globalEvents.on(Events.STREAMING_COMPLETE, (data) => {
      this.handleStreamingComplete(data);
    });
    
    globalEvents.on(Events.STREAM_ERROR, (data) => {
      this.handleStreamingError(data);
    });
    
    // Listen for context updates
    globalEvents.on('context:updated', (contextData) => {
      this.updateContext(contextData);
    });
    
    // Auto-save on context changes
    globalEvents.on('context:changed', () => {
      if (this.options.enableAutoSave) {
        this.saveContextToStorage();
      }
    });
    
    // Listen for connection mode changes
    globalEvents.on('connection:modeChanged', async (data) => {
      await this.handleConnectionModeChange(data);
    });
    
    // Listen for context manager updates
    globalEvents.on('context:all:updated', (data) => {
      this.handleContextManagerUpdate(data);
    });
    
    globalEvents.on('context:mmco:updated', (data) => {
      this.contextState.mmco = data.mmco;
      console.log('MMCO updated in chat service:', data.mmco);
    });
    
    globalEvents.on('context:uacp:updated', (data) => {
      this.contextState.uacp = data.uacp;
      console.log('UACP updated in chat service:', data.uacp);
    });
    
    globalEvents.on('context:pacp:updated', (data) => {
      this.contextState.pacp = data.pacp;
      console.log('PACP updated in chat service:', data.pacp);
    });
    
    globalEvents.on('context:systemPrompt:updated', (data) => {
      this.contextState.systemPrompt = data.systemPrompt;
      console.log('System prompt updated in chat service');
    });
    
    globalEvents.on('context:aiRole:updated', (data) => {
      this.contextState.aiRole = data.aiRole;
      console.log('AI role updated in chat service:', data.aiRole);
    });
  }
  
  /**
   * Send a message and handle streaming response
   * @param {string} messageText - The message to send
   * @param {Object} options - Additional options
   */
  async sendMessage(messageText, options = {}) {
    if (!this.initialized) {
      throw new Error('ChatService not initialized');
    }

    // Reinitialize AI provider to check for MCP Max connection
    console.log('🚀 About to reinitialize AI provider...');
    await this.initializeAIProvider();
    console.log('🚀 AI provider after reinitialization:', this.aiProvider);
    
    if (!messageText?.trim()) {
      return;
    }
    
    if (this.isStreaming) {
      return;
    }
    
    // Use provided container or default
    const targetContainer = options.displayInContainer || this.chatContainer;
    if (!targetContainer) {
      throw new Error('No chat container available');
    }
    
    try {
      // Create abort controller for this request
      this.currentAbortController = new AbortController();
      
      this.isStreaming = true;
      this.metrics.totalMessages++;
      
      // Add user message to history
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession?.id
      };
      
      this.addMessageToHistory(userMessage);
      
      // Create conversation group to hold both user message and assistant response
      const conversationId = `conversation-${Date.now()}`;
      const conversationGroup = document.createElement('div');
      conversationGroup.className = 'chat-group streaming';
      conversationGroup.setAttribute('data-conversation-id', conversationId);
      targetContainer.appendChild(conversationGroup);
      
      // Display user message inside the conversation group
      this.displayUserMessage(userMessage, conversationGroup);
      
      // Clear input if provided
      if (this.messageInput) {
        this.messageInput.value = '';
      }
      
      // Prepare request with context
      const requestData = this.prepareRequestData(messageText, options);
      
      // Start streaming response (pass conversation group as container)
      const startTime = Date.now();
      await this.handleStreamingResponse(requestData, startTime, conversationGroup, conversationId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      this.handleSendError(error, targetContainer);
    } finally {
      this.isStreaming = false;
      
      // Ensure streaming and thinking classes are removed from all elements
      document.querySelectorAll('.streaming, .thinking').forEach(element => {
        element.classList.remove('streaming', 'thinking');
      });
    }
  }
  
  /**
   * Stop current streaming
   */
  stopStreaming() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    
    if (this.isStreaming) {
      this.isStreaming = false;
      
      // Remove streaming class from any active streaming elements
      document.querySelectorAll('.streaming').forEach(element => {
        element.classList.remove('streaming');
      });
      
      globalEvents.emit(Events.STREAM_COMPLETE);
    }
  }
  
  /**
   * Detect why content is considered markdown for debugging
   * @param {string} chunk - First chunk to analyze
   * @returns {string} Reason for markdown detection
   */
  detectMarkdownReason(chunk) {
    if (chunk.trim().startsWith('#')) return 'header';
    if (chunk.includes('```')) return 'code-block';
    if (chunk.includes('**')) return 'bold';
    if (/\*\*[^*]+\*\*/.test(chunk)) return 'bold-complete';
    if (chunk.includes('*')) return 'italic-star';
    if (chunk.includes('_')) return 'italic-underscore';
    if (/_[^_]+_/.test(chunk)) return 'italic-complete';
    if (chunk.includes('- ')) return 'unordered-list';
    if (chunk.includes('* ')) return 'unordered-list-star';
    if (chunk.includes('+ ')) return 'unordered-list-plus';
    if (chunk.includes('1. ') || chunk.includes('2. ')) return 'ordered-list';
    if (chunk.includes('> ')) return 'blockquote';
    if (chunk.includes('|')) return 'table';
    if (/`[^`]+`/.test(chunk)) return 'inline-code';
    return 'plain-text';
  }

  /**
   * Prepare request data with current context
   * @param {string} messageText - The message text
   * @param {Object} options - Additional options
   */
  prepareRequestData(messageText, options = {}) {
    return {
      message: messageText,
      systemPrompt: this.contextState.systemPrompt,
      context: {
        mmco: this.contextState.mmco,      // Micro Meta Context Objects
        uacp: this.contextState.uacp,      // Universal AI Context Profile
        pacp: this.contextState.pacp,      // Personal AI Context Profile  
        role: this.contextState.aiRole,
        model: this.contextState.model     // Selected Claude model
      },
      ...options
    };
  }
  
  /**
   * Handle streaming response using the revolutionary StreamingMarkdownService
   * @param {Object} requestData - The request data
   * @param {number} startTime - Start time for metrics
   * @param {HTMLElement} conversationGroup - Conversation group container
   * @param {string} conversationId - Unique conversation ID
   */
  async handleStreamingResponse(requestData, startTime, conversationGroup, conversationId) {
    // Declare these variables at the top so they're available in catch block
    let messageWrapper;
    let messageContent;
    
    try {
      // Create assistant message wrapper with thinking state
      messageWrapper = document.createElement('div');
      messageWrapper.className = 'chat-message assistant streaming thinking';
      
      messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.innerHTML = '<span class="thinking-text">Claude is thinking<span class="thinking-dots"></span></span>';
      
      messageWrapper.appendChild(messageContent);
      conversationGroup.appendChild(messageWrapper);
      
      // Track the conversation group with SmartScrollService (not individual messages)
      globalEvents.emit('chat:messageAdded', {
        element: conversationGroup,
        messageId: conversationId,
        type: 'conversation'
      });
      
      // Immediately scroll to bottom when thinking message appears
      globalEvents.emit('chat:scrollToBottom', { force: true });
      
      // Notify SmartScrollService that streaming is starting (after thinking message is shown)
      globalEvents.emit(Events.STREAM_START);
      
      // Start bug report capture for this conversation
      bugReportCapture.startCapture(conversationId, requestData.message);

      // Create stream from AI provider
      const aiStream = await this.aiProvider.createStream(
        requestData.message, 
        {
          systemPrompt: requestData.systemPrompt,
          context: requestData.context
        }
      );
      
      // BREAKTHROUGH SIMPLIFICATION: No detection needed - always use progressive mode
      let fullContent = '';
      
      const streamIterator = aiStream[Symbol.asyncIterator]();
      const bufferedChunks = [];
      
      
      // BREAKTHROUGH: Use the unified streaming service for both markdown and plain text
      let result;
      
      // Create unified breakthrough streaming service instance for this message
      const breakthroughStreamer = new BreakthroughStreamingService(messageContent);
      
      // BREAKTHROUGH: ALWAYS use progressive mode - this was our major discovery!
      // Raw mode is only for explicit user request, not automatic detection
      const mode = 'progressive';
      breakthroughStreamer.setMode(mode);
      
      // Create stream that yields chunks and collects content
      async function* unifiedStream() {
        let firstChunk = true;
        
        // Stream directly from the AI provider
        for await (const chunk of streamIterator) {
          // Remove thinking state on first chunk
          if (firstChunk) {
            messageWrapper.classList.remove('thinking');
            firstChunk = false;
          }
          
          fullContent += chunk; // Collect all content
          
          // Capture SSE chunk for bug reporting
          bugReportCapture.captureSSEChunk(chunk, { 
            type: 'streaming', 
            mode,
            timestamp: Date.now()
          });
          
          // Emit chunk event for SSE recording
          globalEvents.emit(Events.STREAM_CHUNK, { 
            chunk, 
            timestamp: Date.now(),
            type: mode
          });
          yield chunk;
        }
      }
      
      // Stream using breakthrough service
      await breakthroughStreamer.streamFromIterator(unifiedStream());
      
      // Get final metrics
      const metrics = breakthroughStreamer.getMetrics();
      
      result = {
        content: fullContent,
        metrics: {
          mode: `breakthrough-${mode}`,
          ...metrics
        }
      };
      
      // Record metrics
      const responseTime = Date.now() - startTime;
      this.recordMetrics(result.metrics, responseTime);
      
      // Extract the complete response text
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.content || '', // StreamingMarkdownService should provide this
        timestamp: new Date().toISOString(),
        sessionId: this.currentSession?.id,
        metrics: result.metrics
      };
      
      // Add to history
      this.addMessageToHistory(assistantMessage);
      
      // Update message ID tracking for SmartScrollService
      globalEvents.emit('chat:messageAdded', {
        element: messageWrapper,
        messageId: assistantMessage.id,
        type: 'assistant'
      });
      
      // Update context with conversation if MMCO is active
      this.updateConversationContext(requestData.message, assistantMessage.content);
      
      // Emit completion event
      globalEvents.emit(Events.CHAT_MESSAGE_COMPLETE, {
        sessionId: this.currentSession?.id,
        message: assistantMessage,
        metrics: result.metrics
      });
      
      // Remove streaming class from conversation group and message wrapper
      conversationGroup.classList.remove('streaming');
      messageWrapper.classList.remove('streaming');
      
      // Add copy button to the assistant message
      messageCopyService.addCopyButton(messageWrapper, conversationId);
      
      // Add bug report button to the conversation group
      bugReportButton.addToConversation(conversationGroup, conversationId);
      
      // Notify SmartScrollService that streaming is complete
      globalEvents.emit(Events.STREAM_COMPLETE);
      
      // ENHANCED HTML CAPTURE: Wait for streaming service to be completely finished
      // The user reported cut-off issues, so we use a more reliable approach
      
      // Method 1: Wait for streaming service metrics to indicate completion
      const waitForStreamingComplete = async () => {
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max wait
        
        while (attempts < maxAttempts) {
          const serviceMetrics = breakthroughStreamer.getMetrics();
          
          // Check if streaming service reports it's truly finished
          if (serviceMetrics && serviceMetrics.isComplete) {
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // Additional safety wait for DOM paint cycles
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(resolve); // Triple RAF for complete paint
            });
          });
        });
      };
      
      // Method 2: Capture HTML from the complete conversation group
      const captureCompleteHTML = () => {
        // CRITICAL FIX: Get the ASSISTANT message content, not the user message!
        // The conversation group contains both user and assistant messages
        const assistantMessage = conversationGroup.querySelector('.chat-message.assistant');
        
        if (!assistantMessage) {
          console.warn('Could not find assistant message element for HTML capture');
          return '';
        }
        
        const messageContentElement = assistantMessage.querySelector('.message-content');
        
        if (!messageContentElement) {
          console.warn('Could not find .message-content element in assistant message');
          return '';
        }
        
        // Get the complete innerHTML - this should include everything rendered
        const completeHTML = messageContentElement.innerHTML;
        
        return completeHTML;
      };
      
      // Execute the enhanced capture process
      (async () => {
        try {
          // Wait for streaming to be completely done
          await waitForStreamingComplete();
          
          // Add one more safety delay for any CSS animations
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Capture the complete HTML
          const finalHTML = captureCompleteHTML();
          
          // Capture final rendered HTML and performance metrics for bug reporting
          bugReportCapture.captureRenderedHTML(finalHTML);
          bugReportCapture.capturePerformanceMetric('responseTime', responseTime);
          bugReportCapture.capturePerformanceMetric('contentLength', fullContent.length);
          bugReportCapture.capturePerformanceMetric('mode', mode);
          bugReportCapture.capturePerformanceMetric('finalDomLength', finalHTML.length);
          
          // Stop bug report capture
          bugReportCapture.stopCapture();
          
        } catch (error) {
          console.error('Enhanced HTML capture failed:', error);
          // Fallback to basic capture
          const fallbackHTML = messageContent.innerHTML;
          bugReportCapture.captureRenderedHTML(fallbackHTML);
          bugReportCapture.stopCapture();
        }
      })();
      
    } catch (error) {
      console.error('Streaming response error:', error);
      
      // Stop bug report capture on error
      bugReportCapture.stopCapture();
      
      // Remove streaming class on error
      conversationGroup.classList.remove('streaming');
      
      // Check if it's a CORS error and display helpful message
      if (error.message && error.message.includes('CORS Error')) {
        // Display the CORS error message nicely in the chat
        const errorContent = document.createElement('div');
        errorContent.className = 'cors-error-message';
        errorContent.innerHTML = `
          <div class="error-header">Connection Error</div>
          <div class="error-content">
            ${error.message.replace(/\n/g, '<br>')}
          </div>
          <div class="error-footer">
            <a href="https://github.com/firesiteio/firesite-mcp-max" target="_blank" class="btn btn-sm btn-primary">
              Learn about MCP Max Server →
            </a>
          </div>
        `;
        messageContent.appendChild(errorContent);
      } else {
        // Display generic error
        messageContent.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
      }
      
      // Notify SmartScrollService even on error
      globalEvents.emit(Events.STREAM_COMPLETE);
      throw error;
    }
  }
  
  /**
   * Display user message in chat
   * @param {Object} message - The user message
   * @param {HTMLElement} targetContainer - Container for the message
   */
  displayUserMessage(message, targetContainer) {
    const container = targetContainer || this.chatContainer;
    if (!container) {
      return;
    }
    
    // Create user message wrapper
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'chat-message user';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message.content;
    
    messageWrapper.appendChild(messageContent);
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    messageWrapper.appendChild(timestamp);
    
    container.appendChild(messageWrapper);
    
    // Track message with SmartScrollService
    globalEvents.emit('chat:messageAdded', {
      element: messageWrapper,
      messageId: message.id,
      type: 'user'
    });
  }
  
  
  /**
   * Update context state
   * @param {Object} contextData - New context data
   */
  updateContext(contextData) {
    const oldContext = { ...this.contextState };
    
    // Update context with new data
    this.contextState = {
      ...this.contextState,
      ...contextData
    };
    
    // Emit context change event
    globalEvents.emit('context:changed', {
      oldContext,
      newContext: this.contextState
    });
  }
  
  /**
   * Handle context manager updates
   * @param {Object} data - Context update data from ContextManager
   */
  handleContextManagerUpdate(data) {
    if (data.contexts) {
      console.log('🔄 Context manager updated chat service contexts:', data.contexts);
      this.contextState = {
        ...this.contextState,
        ...data.contexts
      };
      
      // Emit context change event
      globalEvents.emit('context:changed', {
        oldContext: this.contextState,
        newContext: this.contextState
      });
    }
  }
  
  /**
   * Update conversation context in MMCO
   * @param {string} userMessage - The user message
   * @param {string} assistantMessage - The assistant response
   */
  updateConversationContext(userMessage, assistantMessage) {
    if (!this.contextState.mmco) return;
    
    // Initialize conversations structure if needed
    if (!this.contextState.mmco.conversations) {
      this.contextState.mmco.conversations = { current: { messages: [] } };
    }
    
    if (!this.contextState.mmco.conversations.current) {
      this.contextState.mmco.conversations.current = { messages: [] };
    }
    
    // Add messages to MMCO conversation history
    this.contextState.mmco.conversations.current.messages.push(
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant', 
        content: assistantMessage,
        timestamp: new Date().toISOString()
      }
    );
    
    // Emit context update
    globalEvents.emit('context:mmco:updated', this.contextState.mmco);
  }
  
  /**
   * Add message to history
   * @param {Object} message - The message to add
   */
  addMessageToHistory(message) {
    this.messageHistory.push(message);
    
    // Trim history if it gets too large
    if (this.messageHistory.length > this.options.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.options.maxHistorySize);
    }
  }
  
  /**
   * Create a new session
   * @param {Object} options - Session options
   */
  createSession(options = {}) {
    this.currentSession = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      context: { ...this.contextState },
      ...options
    };
    
    this.metrics.totalSessions++;
    
    globalEvents.emit(Events.SESSION_CREATED, {
      session: this.currentSession
    });
    
    return this.currentSession;
  }
  
  /**
   * Record performance metrics
   * @param {Object} streamingMetrics - Metrics from streaming service
   * @param {number} responseTime - Total response time
   */
  recordMetrics(streamingMetrics, responseTime) {
    this.metrics.streamingMetrics.push({
      ...streamingMetrics,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    // Update average response time
    const times = this.metrics.streamingMetrics.map(m => m.responseTime);
    this.metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
  }
  
  /**
   * Handle streaming completion
   * @param {Object} data - Completion data
   */
  handleStreamingComplete(data) {
    // Streaming completed
  }
  
  /**
   * Handle streaming errors
   * @param {Object} data - Error data
   */
  handleStreamingError(data) {
    console.error('Streaming error:', data);
    
    // Show error message to user
    this.showErrorMessage(data.error?.message || 'An error occurred while streaming the response');
  }
  
  /**
   * Handle send errors
   * @param {Error} error - The error that occurred
   * @param {HTMLElement} targetContainer - Container for the error
   */
  handleSendError(error, targetContainer) {
    this.showErrorMessage(`Failed to send message: ${error.message}`, targetContainer);
  }
  
  /**
   * Show error message to user
   * @param {string} message - Error message
   * @param {HTMLElement} targetContainer - Container for the error
   */
  showErrorMessage(message, targetContainer) {
    const container = targetContainer || this.chatContainer;
    if (!container) {
      console.error('Error message:', message);
      return;
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    container.appendChild(errorElement);
    container.scrollTop = container.scrollHeight;
  }
  
  /**
   * Save context to localStorage
   */
  saveContextToStorage() {
    try {
      localStorage.setItem('chatService:context', JSON.stringify(this.contextState));
    } catch (error) {
      console.warn('Failed to save context to storage:', error);
    }
  }
  
  /**
   * Load context from localStorage - reads from ContextManager storage
   */
  loadContextFromStorage() {
    try {
      // Read from context manager storage
      const contextManagerData = localStorage.getItem('firesite:context');
      if (contextManagerData) {
        const parsed = JSON.parse(contextManagerData);
        if (parsed.contexts) {
          this.contextState = { 
            ...this.contextState, 
            ...parsed.contexts 
          };
          console.log('Context loaded from ContextManager:', this.contextState);
        }
      }
      
      // Also check legacy storage key for backward compatibility
      const legacySaved = localStorage.getItem('chatService:context');
      if (legacySaved) {
        const legacyParsed = JSON.parse(legacySaved);
        this.contextState = { ...this.contextState, ...legacyParsed };
        console.log('Legacy context loaded');
      }
    } catch (error) {
      console.warn('Failed to load context from storage:', error);
    }
  }
  
  /**
   * Clear chat history
   */
  clearChat() {
    this.messageHistory = [];
    if (this.chatContainer) {
      this.chatContainer.innerHTML = '';
    }
    
    // Create new session
    this.createSession();
    
    globalEvents.emit(Events.CHAT_CLEARED, {
      sessionId: this.currentSession?.id
    });
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      isStreaming: this.isStreaming,
      currentSession: this.currentSession,
      messageCount: this.messageHistory.length,
      messageHistory: this.messageHistory,
      metrics: this.metrics,
      contextState: this.contextState
    };
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.streamingService.isReady() && this.aiProvider.isReady();
  }
  
  /**
   * Handle connection mode change
   * @param {Object} data - Mode change data
   */
  async handleConnectionModeChange(data) {
    this.connectionMode = data.mode;
    
    if (data.mode === 'direct') {
      // Switch to Direct Anthropic service
      try {
        this.aiProvider = anthropicDirectService;
        
        // Initialize with API key from localStorage
        const apiKey = localStorage.getItem('anthropicApiKey');
        if (apiKey) {
          anthropicDirectService.initialize({ apiKey });
        }
        
      } catch (error) {
        console.error('Failed to load Direct Anthropic service:', error);
        // Fall back to MCP mode
        this.connectionMode = 'mcp';
        this.aiProvider = mcpProxyService;
      }
    } else if (data.mode === 'mcp') {
      // Switch to MCP Proxy service
      try {
        this.aiProvider = mcpProxyService;
        
        // Ensure MCP service is initialized
        if (!mcpProxyService.isReady()) {
          await mcpProxyService.initialize();
        }
        
      } catch (error) {
        console.error('Failed to load MCP Proxy service:', error);
        // Fall back to direct mode
        this.connectionMode = 'direct';
        this.aiProvider = anthropicDirectService;
      }
    } else {
      // Switch back to MCP mode
      this.aiProvider = anthropicDirectService;
    }
    
    // Update context with connection mode
    this.contextState.connectionMode = this.connectionMode;
  }
  
  /**
   * Dispose of the service
   */
  dispose() {
    this.initialized = false;
    this.isStreaming = false;
    this.currentSession = null;
    this.messageHistory = [];
    
    // Remove event listeners
    globalEvents.off(Events.STREAMING_COMPLETE);
    globalEvents.off(Events.STREAM_ERROR);
    globalEvents.off('context:updated');
    globalEvents.off('context:changed');
    globalEvents.off('connection:modeChanged');
    globalEvents.off('context:all:updated');
    globalEvents.off('context:mmco:updated');
    globalEvents.off('context:uacp:updated');
    globalEvents.off('context:pacp:updated');
    globalEvents.off('context:systemPrompt:updated');
    globalEvents.off('context:aiRole:updated');
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;