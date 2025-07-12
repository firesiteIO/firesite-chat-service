/**
 * SmartScrollService - World-class intelligent scrolling for chat interfaces
 * 
 * Features:
 * - Auto-scroll to bottom during streaming
 * - Smart pause on manual scroll with intelligent resume
 * - Message folding for performance with lazy loading
 * - Full content preservation for copy/export/print
 * 
 * Service-First Architecture with zero dependencies on UI framework
 */

import { globalEvents, Events } from '../../core/events/event-emitter.js';

export class SmartScrollService {
  constructor(options = {}) {
    this.options = {
      // Auto-scroll settings
      scrollThreshold: 50,              // Pixels from bottom to consider "at bottom"
      scrollBehavior: 'smooth',         // smooth or instant
      scrollDelay: 300,                 // Delay between scroll attempts during streaming (increased to reduce fighting)
      
      // Smart pause settings
      scrollDebounce: 150,              // Debounce for scroll detection
      
      // Visibility settings
      enableMessageHiding: true,        // Enable/disable message hiding feature
      maxVisibleMessages: 8,            // Maximum messages to keep visible (lowered for testing)
      loadBatchSize: 4,                 // Messages to load when clicking "Load Older Messages"
      hideDelay: 1000,                  // Delay before hiding older messages (faster for testing)
      showButtonThreshold: 200,         // Show button when within 200px of top of visible content
      
      // Performance settings
      useIntersectionObserver: true,    // Use IO for efficient scroll detection
      useRequestAnimationFrame: true,   // Use RAF for smooth scrolling
      
      // Debug settings
      debug: false,                     // Enable verbose console logging
      
      ...options
    };
    
    // State management
    this.state = {
      mode: 'auto',                     // 'auto', 'manual', 'paused'
      isScrolling: false,
      lastScrollTime: 0,
      lastScrollTop: 0,
      isAtBottom: true,
      activeStreams: new Set(),
      hiddenMessages: [],               // Array of hidden message IDs (oldest first)
      viewingOlderMessages: false,      // Whether user is viewing older messages
      topVisibleMessageIndex: 0         // Index of the first visible message in messageOrder
    };
    
    // DOM references
    this.container = null;
    this.sentinelElement = null;
    this.scrollTimeout = null;
    this.scrollRAF = null;
    
    // Observers
    this.intersectionObserver = null;
    this.mutationObserver = null;
    this.resizeObserver = null;
    
    // Message tracking
    this.messages = new Map();
    this.messageOrder = [];
    
    // Performance metrics
    this.metrics = {
      totalScrolls: 0,
      autoScrolls: 0,
      manualScrolls: 0,
      messagesFolded: 0,
      messagesUnfolded: 0
    };
  }
  
  /**
   * Initialize the service with a container element
   * @param {HTMLElement} container - The scrollable container
   */
  initialize(container) {
    if (!container) {
      throw new Error('Container element is required');
    }
    
    this.container = container;
    this.setupSentinel();
    this.setupObservers();
    this.setupEventListeners();
    this.startAutoScroll();
    
    console.log('SmartScrollService initialized');
    globalEvents.emit('smartScroll:initialized');
    
    return this;
  }
  
  /**
   * Setup sentinel element for bottom detection
   */
  setupSentinel() {
    this.sentinelElement = document.createElement('div');
    this.sentinelElement.className = 'scroll-sentinel';
    this.sentinelElement.style.height = '1px';
    this.sentinelElement.style.visibility = 'hidden';
    this.sentinelElement.setAttribute('aria-hidden', 'true');
    this.container.appendChild(this.sentinelElement);
  }
  
  /**
   * Setup observers for efficient tracking
   */
  setupObservers() {
    // Intersection Observer for bottom detection
    if (this.options.useIntersectionObserver && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const wasAtBottom = this.state.isAtBottom;
            this.state.isAtBottom = entry.isIntersecting;
            
            if (!wasAtBottom && this.state.isAtBottom && this.state.mode === 'manual') {
              // User scrolled back to bottom - they can click the button to resume auto-scroll
              globalEvents.emit('smartScroll:bottomReached', { manual: true });
            }
          });
        },
        {
          root: this.container,
          threshold: 0.1
        }
      );
      
      this.intersectionObserver.observe(this.sentinelElement);
    }
    
    // Mutation Observer for new content
    this.mutationObserver = new MutationObserver((mutations) => {
      const hasNewContent = mutations.some(mutation => 
        mutation.type === 'childList' && mutation.addedNodes.length > 0
      );
      
      if (hasNewContent) {
        this.handleNewContent();
      }
    });
    
    this.mutationObserver.observe(this.container, {
      childList: true,
      subtree: true
    });
    
    // Resize Observer for container size changes
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkScrollPosition();
      });
      
      this.resizeObserver.observe(this.container);
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Scroll event with debouncing
    let scrollTimer;
    let previousScrollTop = this.container.scrollTop;
    
    this.container.addEventListener('scroll', (e) => {
      const currentScrollTop = this.container.scrollTop;
      const scrollDelta = Math.abs(currentScrollTop - previousScrollTop);
      
      // Only process if there's a meaningful scroll (more than 5 pixels)
      if (scrollDelta > 5) {
        this.state.isScrolling = true;
        this.state.lastScrollTime = Date.now();
        
        // Clear existing timer
        clearTimeout(scrollTimer);
        clearTimeout(this.scrollTimeout);
        
        // Handle scroll immediately for better responsiveness
        this.handleManualScroll(previousScrollTop, currentScrollTop);
        previousScrollTop = currentScrollTop;
        
        // Set scrolling to false after delay
        this.scrollTimeout = setTimeout(() => {
          this.state.isScrolling = false;
          this.checkVisibilityWindow();
          
          // Update button visibility after scrolling stops
          this.updateLoadOlderButton();
        }, this.options.scrollDebounce + 100);
      }
    }, { passive: true });
    
    // Touch events for mobile
    let touchStartY = 0;
    this.container.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    this.container.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      
      if (Math.abs(deltaY) > 10) {
        this.state.isScrolling = true;
        this.state.lastScrollTime = Date.now();
      }
    }, { passive: true });
    
    // Listen for streaming events
    globalEvents.on(Events.STREAM_START, () => {
      this.handleStreamStart();
    });
    
    globalEvents.on(Events.STREAM_COMPLETE, () => {
      this.handleStreamComplete();
    });
    
    // Listen for message events
    globalEvents.on('chat:messageAdded', (data) => {
      this.trackMessage(data.element, data.messageId);
    });
    
    // Listen for chat cleared event to reset scroll behavior
    globalEvents.on(Events.CHAT_CLEARED, () => {
      this.resetScrollBehavior();
    });
    
    // Listen for explicit scroll to bottom requests
    globalEvents.on('chat:scrollToBottom', (data) => {
      this.scrollToBottom(data?.force || false);
    });
  }
  
  /**
   * Handle manual scroll detection
   */
  handleManualScroll(previousScrollTop, currentScrollTop) {
    const scrollHeight = this.container.scrollHeight;
    const clientHeight = this.container.clientHeight;
    const distanceFromBottom = scrollHeight - currentScrollTop - clientHeight;
    
    // Update metrics
    this.metrics.totalScrolls++;
    
    const isScrollingUp = currentScrollTop < previousScrollTop;
    
    // Suppress scroll spam during automated testing
    if (!window.automatedTesting && this.options.debug) {
      console.log('Manual scroll detected:', {
        currentScrollTop,
        previousScrollTop,
        distanceFromBottom,
        threshold: this.options.scrollThreshold,
        currentMode: this.state.mode,
        isScrollingUp,
        willTriggerManualMode: isScrollingUp && distanceFromBottom > this.options.scrollThreshold
      });
    }
    
    // Check if user is scrolling up
    if (currentScrollTop < previousScrollTop && distanceFromBottom > this.options.scrollThreshold) {
      this.setMode('manual');
      this.metrics.manualScrolls++;
      
      // Check viewing status when scrolling
      this.checkViewingStatus();
      
      // Update button visibility on scroll
      this.updateLoadOlderButton();
    }
    
    // Update bottom state
    const wasAtBottom = this.state.isAtBottom;
    this.state.isAtBottom = distanceFromBottom <= this.options.scrollThreshold;
    
    // If user reached bottom, reset to auto mode
    if (!wasAtBottom && this.state.isAtBottom && this.state.mode !== 'auto') {
      this.setMode('auto');
      if (!window.automatedTesting && this.options.debug) {
        console.log('Reset to auto-scroll mode - user reached bottom');
      }
    }
    
    // Emit bottom detection event if state changed
    if (wasAtBottom !== this.state.isAtBottom) {
      globalEvents.emit('smartScroll:bottomDetected', {
        isAtBottom: this.state.isAtBottom
      });
    }
    
    // Update last scroll position
    this.state.lastScrollTop = currentScrollTop;
  }
  
  /**
   * Get current scroll mode
   */
  getMode() {
    return this.state.mode;
  }
  
  /**
   * Get current stats
   */
  getStats() {
    const position = this.checkScrollPosition();
    return {
      mode: this.state.mode,
      isAtBottom: this.state.isAtBottom,
      isScrolling: this.state.isScrolling,
      activeStreams: this.state.activeStreams.size,
      metrics: this.metrics,
      position
    };
  }
  
  /**
   * Resume auto-scroll
   */
  resume() {
    this.setMode('auto');
    this.scrollToBottom();
  }
  
  /**
   * Set scroll mode
   */
  setMode(mode) {
    if (this.state.mode !== mode) {
      const oldMode = this.state.mode;
      this.state.mode = mode;
      
      globalEvents.emit('smartScroll:modeChanged', {
        oldMode,
        mode: mode,
        isAtBottom: this.state.isAtBottom
      });
      
      if (!window.automatedTesting && this.options.debug) {
        console.log(`Scroll mode changed: ${oldMode} → ${mode}`);
      }
    }
  }
  
  
  /**
   * Handle new content added
   */
  handleNewContent() {
    if (this.state.mode === 'auto' || this.state.isAtBottom) {
      this.scrollToBottom();
    }
    
    // Schedule visibility check
    setTimeout(() => {
      this.checkVisibilityWindow();
    }, this.options.hideDelay);
  }
  
  /**
   * Scroll to bottom
   */
  scrollToBottom(force = false) {
    if (!this.container) return;
    
    // Don't scroll if user is actively scrolling
    if (!force && this.state.isScrolling) return;
    
    // Allow forced scroll even in manual mode (for button click)
    if (!force && this.state.mode === 'manual') return;
    
    this.metrics.autoScrolls++;
    
    // If forced, switch back to auto mode
    if (force && this.state.mode === 'manual') {
      this.setMode('auto');
    }
    
    if (this.options.useRequestAnimationFrame && 'requestAnimationFrame' in window) {
      cancelAnimationFrame(this.scrollRAF);
      
      this.scrollRAF = requestAnimationFrame(() => {
        // Double-check we're still in auto mode and not scrolling
        if (!force && (this.state.mode === 'manual' || this.state.isScrolling)) return;
        
        this.container.scrollTo({
          top: this.container.scrollHeight,
          behavior: this.options.scrollBehavior
        });
      });
    } else {
      this.container.scrollTo({
        top: this.container.scrollHeight,
        behavior: this.options.scrollBehavior
      });
    }
  }
  
  /**
   * Start auto-scroll monitoring
   */
  startAutoScroll() {
    // Use RAF for smooth auto-scrolling during streaming
    const autoScrollLoop = () => {
      if (this.state.mode === 'auto' && this.state.activeStreams.size > 0) {
        this.scrollToBottom();
      }
      
      setTimeout(() => {
        requestAnimationFrame(autoScrollLoop);
      }, this.options.scrollDelay);
    };
    
    if (this.options.useRequestAnimationFrame) {
      requestAnimationFrame(autoScrollLoop);
    }
  }
  
  /**
   * Track a conversation group element
   */
  trackMessage(element, messageId) {
    if (!element || !messageId) return;
    
    const messageData = {
      id: messageId,
      element,
      timestamp: Date.now(),
      isHidden: false,
      originalDisplay: null
    };
    
    this.messages.set(messageId, messageData);
    this.messageOrder.push(messageId);
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Tracked conversation group ${messageId}. Total: ${this.messageOrder.length}`);
    }
    
    // Check if we need to hide older conversation groups
    this.checkVisibilityWindow();
  }
  
  /**
   * Check if older messages should be hidden (simple sliding window approach)
   */
  checkVisibilityWindow() {
    if (!this.options.enableMessageHiding) {
      return; // Feature disabled
    }
    
    if (this.state.isScrolling || this.state.viewingOlderMessages) {
      return;
    }
    
    const totalMessages = this.messageOrder.length;
    const maxVisible = this.options.maxVisibleMessages;
    
    // Only hide if we have more messages than the limit
    if (totalMessages > maxVisible) {
      const messagesToHide = totalMessages - maxVisible;
      
      // Hide messages from the beginning (oldest messages)
      for (let i = 0; i < messagesToHide; i++) {
        const messageId = this.messageOrder[i];
        const message = this.messages.get(messageId);
        
        if (message && !message.isHidden) {
          this.hideMessage(messageId);
          this.state.topVisibleMessageIndex = i + 1;
        }
      }
      
      this.updateLoadOlderButton();
    }
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Visibility check: ${totalMessages} total, ${this.state.hiddenMessages.length} hidden, top visible: ${this.state.topVisibleMessageIndex}`);
    }
  }
  
  /**
   * Group messages into conversation pairs (user question + assistant response)
   */
  groupIntoConversationPairs() {
    const pairs = [];
    let currentPair = [];
    
    this.messageOrder.forEach(messageId => {
      const message = this.messages.get(messageId);
      if (!message) return;
      
      // Determine message type from element class
      const isUser = message.element.classList.contains('user');
      const isAssistant = message.element.classList.contains('assistant');
      
      if (isUser) {
        // Start new pair with user message
        if (currentPair.length > 0) {
          pairs.push([...currentPair]);
        }
        currentPair = [messageId];
      } else if (isAssistant && currentPair.length > 0) {
        // Complete pair with assistant response
        currentPair.push(messageId);
        pairs.push([...currentPair]);
        currentPair = [];
      }
    });
    
    // Add any remaining incomplete pair
    if (currentPair.length > 0) {
      pairs.push(currentPair);
    }
    
    return pairs;
  }
  
  /**
   * Hide a conversation group (for maintaining limit)
   */
  hideMessage(messageId) {
    const message = this.messages.get(messageId);
    if (!message || message.isHidden) return;
    
    const element = message.element;
    
    // Hide the entire conversation group using data attribute
    // This will hide both user message and assistant response together
    element.setAttribute('data-hidden', 'true');
    
    // Update state
    message.isHidden = true;
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Hidden conversation group ${messageId}`);
    }
  }
  
  /**
   * Show a conversation group (force visible regardless of current state)
   */
  showMessage(messageId) {
    const message = this.messages.get(messageId);
    if (!message) return;
    
    const element = message.element;
    
    // Show the entire conversation group
    // This will show both user message and assistant response together
    element.removeAttribute('data-hidden');
    
    // Update state
    message.isHidden = false;
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Shown conversation group ${messageId}`);
    }
  }
  
  /**
   * Load the next batch of older messages
   */
  loadOlderMessages() {
    if (this.state.topVisibleMessageIndex <= 0) {
      if (!window.automatedTesting && this.options.debug) {
        console.log('No more older messages to load');
      }
      return;
    }
    
    // Set flag to prevent auto-hiding while viewing older messages
    this.state.viewingOlderMessages = true;
    
    // Calculate how many messages to show (work backwards from current top)
    const batchSize = Math.min(this.options.loadBatchSize, this.state.topVisibleMessageIndex);
    const newTopIndex = Math.max(0, this.state.topVisibleMessageIndex - batchSize);
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Loading batch: from index ${newTopIndex} to ${this.state.topVisibleMessageIndex - 1}`);
    }
    
    // Show ALL messages in this range (both user and assistant)
    for (let i = newTopIndex; i < this.state.topVisibleMessageIndex; i++) {
      const messageId = this.messageOrder[i];
      const message = this.messages.get(messageId);
      
      if (message) {
        // Force show the message regardless of current state
        this.showMessage(messageId);
      }
    }
    
    // Update the top visible index
    this.state.topVisibleMessageIndex = newTopIndex;
    
    // Scroll to the first newly shown message
    const firstNewMessageId = this.messageOrder[newTopIndex];
    const firstNewMessage = this.messages.get(firstNewMessageId);
    
    if (firstNewMessage && firstNewMessage.element) {
      setTimeout(() => {
        firstNewMessage.element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100);
    }
    
    // Update button
    this.updateLoadOlderButton();
    
    if (!window.automatedTesting && this.options.debug) {
      console.log(`Loaded ${batchSize} older messages. New top index: ${newTopIndex}`);
    }
  }
  
  /**
   * Update the "Load Older Messages" button with smart visibility
   */
  updateLoadOlderButton() {
    let button = this.container.parentElement.querySelector('.load-older-messages');
    
    // Check if we should show the button
    const shouldShowButton = this.shouldShowLoadOlderButton();
    
    if (shouldShowButton) {
      if (!button) {
        // Create button if it doesn't exist
        button = document.createElement('button');
        button.className = 'load-older-messages';
        button.textContent = 'Load Older Messages';
        button.addEventListener('click', () => {
          this.loadOlderMessages();
        });
        
        // Insert at the top of the container
        this.container.parentElement.insertBefore(button, this.container);
      }
      
      // Simple button text - no count needed
      button.textContent = 'Load Older Messages';
      button.style.display = 'block';
    } else if (button) {
      // Hide button
      button.style.display = 'none';
    }
  }
  
  /**
   * Determine if "Load Older Messages" button should be visible
   * Only show when: 1) Near top of visible content, 2) More messages exist to load
   */
  shouldShowLoadOlderButton() {
    // Don't show if no older messages exist
    if (this.state.topVisibleMessageIndex <= 0) {
      return false;
    }
    
    // Only show when user is near the top of visible content
    const scrollTop = this.container.scrollTop;
    
    // Show button only when within 200px of the top of visible content
    return scrollTop <= this.options.showButtonThreshold;
  }
  
  /**
   * Get the first visible conversation group in the viewport
   */
  getFirstVisibleMessage() {
    const containerRect = this.container.getBoundingClientRect();
    const groups = this.container.querySelectorAll('.chat-group');
    
    for (let group of groups) {
      const groupRect = group.getBoundingClientRect();
      
      // Check if this group is visible in the viewport
      if (groupRect.bottom > containerRect.top && 
          groupRect.top < containerRect.bottom) {
        return group;
      }
    }
    
    return null;
  }
  
  /**
   * Get conversation group ID from a DOM element
   */
  getMessageIdFromElement(element) {
    // Check if element is a chat-group with data-conversation-id
    if (element.classList.contains('chat-group')) {
      return element.getAttribute('data-conversation-id');
    }
    
    // Find the conversation group ID by searching our tracked groups
    for (let [messageId, message] of this.messages) {
      if (message.element === element) {
        return messageId;
      }
    }
    return null;
  }
  
  /**
   * Clear viewing older messages flag when scrolling to recent messages
   * Also reset auto-scroll mode when at bottom
   */
  checkViewingStatus() {
    const scrollHeight = this.container.scrollHeight;
    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // If user scrolls near the bottom, clear the viewing flag and reset to auto mode
    if (distanceFromBottom <= this.options.scrollThreshold) {
      if (this.state.viewingOlderMessages) {
        this.state.viewingOlderMessages = false;
        if (!window.automatedTesting && this.options.debug) {
          console.log('Cleared viewing older messages flag - user scrolled to recent messages');
        }
      }
      
      // Reset to auto-scroll mode if not already
      if (this.state.mode !== 'auto') {
        this.setMode('auto');
        if (!window.automatedTesting && this.options.debug) {
          console.log('Reset to auto-scroll mode - user at bottom');
        }
      }
    } else if (distanceFromBottom < 500 && this.state.viewingOlderMessages) {
      // Just clear viewing flag if close to bottom
      this.state.viewingOlderMessages = false;
      if (!window.automatedTesting && this.options.debug) {
        console.log('Cleared viewing older messages flag - user scrolled to recent messages');
      }
    }
  }
  
  /**
   * Handle stream start
   */
  handleStreamStart() {
    const streamId = Date.now().toString();
    this.state.activeStreams.add(streamId);
    
    if (this.state.mode === 'auto') {
      this.scrollToBottom();
    }
    
    return streamId;
  }
  
  /**
   * Handle stream complete
   */
  handleStreamComplete(streamId) {
    if (streamId) {
      this.state.activeStreams.delete(streamId);
    }
    
    // Final scroll if in auto mode
    if (this.state.mode === 'auto' && this.state.activeStreams.size === 0) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }
  
  /**
   * Check current scroll position
   */
  checkScrollPosition() {
    const scrollHeight = this.container.scrollHeight;
    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return {
      scrollHeight,
      scrollTop,
      clientHeight,
      distanceFromBottom,
      isAtBottom: distanceFromBottom <= this.options.scrollThreshold,
      scrollPercentage: (scrollTop / (scrollHeight - clientHeight)) * 100
    };
  }
  
  /**
   * Get full content for export (including folded)
   */
  getFullContent() {
    const contentElements = [];
    
    this.messageOrder.forEach(messageId => {
      const message = this.messages.get(messageId);
      if (!message) return;
      
      const element = message.element.cloneNode(true);
      
      // Ensure folded content is visible in export
      if (message.isFolded && message.foldedContent) {
        element.innerHTML = message.foldedContent;
        element.style.display = '';
        element.removeAttribute('data-folded');
      }
      
      contentElements.push(element);
    });
    
    return contentElements;
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      mode: this.state.mode,
      isAtBottom: this.state.isAtBottom,
      activeStreams: this.state.activeStreams.size,
      totalMessages: this.messages.size,
      foldedMessages: Array.from(this.messages.values()).filter(m => m.isFolded).length,
      metrics: { ...this.metrics },
      scrollPosition: this.checkScrollPosition()
    };
  }
  
  /**
   * Update options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    if (!window.automatedTesting && this.options.debug) {
      console.log('SmartScrollService options updated:', newOptions);
    }
  }
  
  /**
   * Pause auto-scrolling
   */
  pause() {
    this.setMode('paused');
    clearTimeout(this.resumeTimeout);
  }
  
  /**
   * Resume auto-scrolling
   */
  resume() {
    this.setMode('auto');
    if (this.state.isAtBottom) {
      this.scrollToBottom();
    }
  }
  
  /**
   * Cleanup and dispose
   */
  dispose() {
    // Clear timeouts
    clearTimeout(this.scrollTimeout);
    clearTimeout(this.resumeTimeout);
    cancelAnimationFrame(this.scrollRAF);
    
    // Disconnect observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Clear references
    this.container = null;
    this.messages.clear();
    this.messageOrder = [];
    this.state.activeStreams.clear();
    
    console.log('SmartScrollService disposed');
  }
  
  /**
   * Reset scroll behavior to auto mode
   * Called when chat is cleared or new conversation starts
   */
  resetScrollBehavior() {
    // Reset to auto scroll mode
    this.setMode('auto');
    
    // Clear hidden messages
    this.state.hiddenMessages = [];
    this.state.viewingOlderMessages = false;
    this.state.topVisibleMessageIndex = 0;
    
    // Clear message tracking
    this.messages.clear();
    this.messageOrder = [];
    
    // Hide load older messages button if it exists
    if (this.loadOlderButton) {
      this.loadOlderButton.style.display = 'none';
    }
    
    // Ensure we're at the bottom
    if (this.container) {
      this.scrollToBottom(true);
    }
    
    if (!window.automatedTesting && this.options.debug) {
      console.log('Scroll behavior reset to auto mode');
    }
  }
}

// Export singleton instance
export const smartScrollService = new SmartScrollService();
export default smartScrollService;