/**
 * ChatTestingService - Isolated testing functionality for chat system
 * Provides testing capabilities without contaminating production code
 * 
 * IMPORTANT: This service is for development/testing only and should not
 * be included in production builds
 */

import { chatService } from '../chat/chat.service.js';
import { globalEvents, Events } from '../../core/events/event-emitter.js';
import { BreakthroughStreamingService } from '../streaming/breakthrough-streaming.service.js';

export class ChatTestingService {
  constructor() {
    this.isGeneratingTestConversation = false;
    this.testConversationAbortController = null;
  }

  /**
   * Generate a test conversation using real Claude API responses
   * @param {Object} options - Test conversation options
   * @param {HTMLElement} options.container - Container for messages
   * @param {Function} options.onProgress - Progress callback
   * @returns {Promise<void>}
   */
  async generateTestConversation(options = {}) {
    const { container, onProgress } = options;
    
    if (!container) {
      throw new Error('Container element required for test conversation');
    }
    
    if (this.isGeneratingTestConversation) {
      console.warn('Test conversation already in progress');
      return;
    }
    
    this.isGeneratingTestConversation = true;
    this.testConversationAbortController = new AbortController();
    
    // Dynamic test conversation prompts
    const testPrompts = [
      'Explain JavaScript closures with practical examples. Make your response unique and include different examples each time.',
      'What are some advanced closure patterns? Give me creative, real-world use cases that I might not have seen before.',
      'How do closures interact with modern JavaScript features like async/await and modules? Include code examples.',
      'What are the performance implications of closures? Give me specific scenarios and measurements.',
      'Show me some elegant closure patterns for state management without using frameworks.',
      'How can closures be used for creating private methods and data encapsulation in JavaScript?',
      'What are some common closure-related bugs and how to avoid them? Include debugging tips.',
      'Demonstrate how closures work with event handling and DOM manipulation in modern web development.',
      'What are the best practices for using closures in large-scale applications? Include architectural considerations.'
    ];
    
    try {
      // Set up ESC key handler
      const escHandler = (e) => {
        if (e.key === 'Escape' && this.isGeneratingTestConversation) {
          this.stopTestConversation();
        }
      };
      document.addEventListener('keydown', escHandler);
      
      // Send each prompt with proper delay
      for (let i = 0; i < testPrompts.length && this.isGeneratingTestConversation; i++) {
        const prompt = testPrompts[i];
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: testPrompts.length,
            message: `Generating message ${i + 1}/${testPrompts.length}... (Press Esc to stop)`
          });
        }
        
        try {
          // Check if aborted
          if (this.testConversationAbortController.signal.aborted) {
            break;
          }
          
          // Use the actual ChatService to send the message with streaming
          await chatService.sendMessage(prompt, {
            displayInContainer: container,
            enableProgressiveRendering: true,
            enableSyntaxHighlighting: true
          });
          
          // Wait between messages to see the streaming effect
          if (i < testPrompts.length - 1 && this.isGeneratingTestConversation) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`Error generating test message ${i + 1}:`, error);
          throw error;
        }
      }
      
      // Clean up event listener
      document.removeEventListener('keydown', escHandler);
      
      if (this.isGeneratingTestConversation && onProgress) {
        onProgress({
          current: testPrompts.length,
          total: testPrompts.length,
          message: `Test conversation complete! (${testPrompts.length} messages)`,
          complete: true
        });
      }
      
    } finally {
      this.isGeneratingTestConversation = false;
      this.testConversationAbortController = null;
    }
  }

  /**
   * Stop ongoing test conversation generation
   */
  stopTestConversation() {
    if (this.isGeneratingTestConversation) {
      this.isGeneratingTestConversation = false;
      if (this.testConversationAbortController) {
        this.testConversationAbortController.abort();
      }
      console.log('Test conversation generation stopped by user');
    }
  }

  /**
   * Stream demo content directly to a container
   * @param {string} content - Content to stream
   * @param {HTMLElement} container - Target container
   * @param {HTMLElement} metricsElement - Optional metrics display element
   * @returns {Promise<Object>} Streaming metrics
   */
  async streamDemoContent(content, container, metricsElement) {
    if (!container) {
      throw new Error('Container element required for streaming');
    }
    
    // Create a wrapper for the demo content
    const messageWrapper = document.createElement('div');
    messageWrapper.className = 'chat-message assistant demo';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    messageWrapper.appendChild(messageContent);
    container.appendChild(messageWrapper);
    
    // Use BreakthroughStreamingService directly
    const streamer = new BreakthroughStreamingService(messageContent);
    streamer.setMode('progressive'); // Demo content is markdown
    
    // Simulate streaming the content
    const result = await streamer.simulateStream(content, 5, 30);
    
    // Update metrics if element provided
    if (metricsElement) {
      const metrics = streamer.getMetrics();
      metricsElement.innerHTML = `
        <div class="metric">
          <span class="metric-label">Chunks:</span>
          <span class="metric-value">${metrics.chunkCount}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Characters:</span>
          <span class="metric-value">${metrics.totalCharacters}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Speed:</span>
          <span class="metric-value">${metrics.charactersPerSecond} chars/sec</span>
        </div>
      `;
    }
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    messageWrapper.appendChild(timestamp);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
    
    return result;
  }

  /**
   * Check if currently generating test conversation
   * @returns {boolean}
   */
  isGenerating() {
    return this.isGeneratingTestConversation;
  }
}

// Export singleton instance
export const chatTestingService = new ChatTestingService();
export default chatTestingService;