/**
 * Firesite Chat - Main Application Entry Point
 * Clean Chat Service with Revolutionary Streaming
 */

import { globalEvents, Events } from './core/events/event-emitter.js';
import { streamingMarkdownService } from './services/streaming/streaming-markdown.service.js';
import { anthropicDirectService } from './services/anthropic/anthropic-direct.service.js';
import { mcpProxyService } from './services/anthropic/mcp-proxy.service.js';
import { chatService } from './services/chat/chat.service.js';
import { smartScrollService } from './services/ui/smart-scroll.service.js';
import { toastNotificationService } from './services/ui/toast-notification.service.js';
import { messageCopyService } from './services/ui/message-copy.service.js';
import { modeDropdown } from './components/mode-dropdown.js';
import { modelSelector } from './components/model-selector.js';
import { exportMenu } from './components/export-menu.js';
import { conversationExportService } from './services/export/conversation-export.service.js';
import { domPurifyService } from './services/security/dom-purify.service.js';
import { settingsPanel } from './components/settings-panel.js';
import { bugReportButton } from './components/bug-report-button.js';
import { MCPControlsComponent } from './ui/components/mcp-controls.js';
import { FiresiteStreamingService } from './services/streaming/firesite-streaming.service.js';
import { contextManager } from './services/context/context-manager.service.js';
import { upgradeModal } from './components/upgrade-modal.js';

// Import CSS for feature restrictions
import './assets/css/feature-restrictions.css';

// Services loaded successfully

// Global app state
const app = {
  version: '1.0.0',
  services: {},
  ui: {},
  state: {
    currentSession: null,
    connected: false
  }
};

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('Initializing Firesite Chat...');
  
  try {
    // Initialize core services
    await initializeServices();
    
    // Setup UI components
    await setupUI();
    
    // Setup global error handling
    setupErrorHandling();
    
    // Update timestamp
    updateTimestamp();
    
    // Emit ready event
    globalEvents.emit(Events.APP_READY);
    
    console.log('Firesite Chat ready!');
    updateStatus('Ready - Enter your API key to start chatting', 'connected');
    
  } catch (error) {
    console.error('Initialization failed:', error);
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Initialize all services
 */
async function initializeServices() {
  console.log('Initializing services...');
  
  // Initialize streaming markdown service
  app.services.streamingMarkdown = streamingMarkdownService.initialize();
  
  // Initialize Anthropic Direct service (without API key for now)
  app.services.anthropicDirect = anthropicDirectService.initialize();
  
  // Initialize MCP Proxy service for CORS-free access
  try {
    app.services.mcpProxy = await mcpProxyService.initialize();
  } catch (error) {
    console.warn('MCP Proxy service not available:', error.message);
    app.services.mcpProxy = null;
  }
  
  // Initialize Toast Notification Service
  app.services.toastNotification = toastNotificationService;
  toastNotificationService.init();
  
  // Initialize Message Copy Service
  app.services.messageCopy = messageCopyService;
  messageCopyService.init();
  
  // Initialize DOMPurify service for security and syntax highlighting
  app.services.domPurify = domPurifyService;
  await domPurifyService.initialize();
  
  // Initialize Context Manager for settings panel
  app.services.contextManager = contextManager.initialize();
  
  // Initialize upgrade modal for Base Server restrictions
  app.services.upgradeModal = upgradeModal;
  
  // Initialize Chat Service with streaming markdown integration
  app.services.chatService = chatService.initialize({
    enableAutoSave: true,
    maxHistorySize: 1000
  });
  
  // Listen for service events
  setupServiceEventListeners();
}

/**
 * Setup UI components
 */
function setupUI() {
  console.log('Setting up UI...');
  
  // Setup chat interface
  setupChatInterface();
  
  // Initialize mode dropdown (contains connection toggle and model selector)
  modeDropdown.initialize();
  
  // Initialize export menu for conversation export functionality
  exportMenu.init();
  
  // Initialize export service
  conversationExportService.init();
  
  // Initialize settings panel (UI only - no wiring yet)
  settingsPanel.initialize();
  
  // Initialize bug report button
  app.ui.bugReportButton = bugReportButton;
  
  // Make bug report button available globally for modal interactions
  window.bugReportButton = bugReportButton;
  
  // Initialize MCP Controls Component with a proper FiresiteStreamingService instance
  const mcpTestContainer = document.createElement('div');
  mcpTestContainer.style.display = 'none'; // Hidden for MCP controls only
  const mcpStreamingService = new FiresiteStreamingService(mcpTestContainer);
  
  app.ui.mcpControls = new MCPControlsComponent(mcpStreamingService);
  app.ui.mcpControls.init();
  
  // Load saved preferences
  modelSelector.loadSavedModel();
}

/**
 * Setup clean chat interface
 */
function setupChatInterface() {
  const messageInput = document.getElementById('streaming-message-input');
  const sendButton = document.getElementById('streaming-send-message');
  const chatMessages = document.getElementById('streaming-chat-messages');
  const chatContainer = document.querySelector('#chat-tab .chat-container');
  
  if (!messageInput || !sendButton || !chatMessages) {
    console.warn('Streaming chat elements not found');
    return;
  }
  
  // Initialize SmartScrollService with the chat container
  smartScrollService.initialize(chatMessages);
  
  // Create scroll UI elements
  createScrollUI(chatContainer);
  
  /**
   * Auto-expand textarea based on content
   */
  function autoExpandTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = `${Math.min(messageInput.scrollHeight, 200)}px`;
  }
  
  messageInput.addEventListener('input', autoExpandTextarea);
  
  // Handle Enter key to send (Shift+Enter for new line)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  /**
   * Send message handler
   */
  const sendMessage = async () => {
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Clear input and reset height immediately
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    try {
      // Use ChatService to send the message
      await chatService.sendMessage(message, {
        displayInContainer: chatMessages,
        enableProgressiveRendering: true,
        enableSyntaxHighlighting: true
      });
      
      // Message sent successfully - metrics handled by chatService internally
      
    } catch (error) {
      console.error('Error sending message:', error);
      updateStatus(`Chat error: ${error.message}`, 'error');
    }
  };
  
  // Button click handler
  sendButton.addEventListener('click', sendMessage);
  
  // Enter key handler
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Listen for quick prompts from settings
  globalEvents.on('settings:quickPrompt', (data) => {
    messageInput.value = data.prompt;
    messageInput.focus();
  });
  
  console.log('Streaming chat setup complete');
}

/**
 * Setup conversation memory browser
 * Currently unused in production chat interface
 */
/* eslint-disable-next-line no-unused-vars */
function setupConversationMemory() {
  const saveBtn = document.getElementById('conv-save');
  const browseBtn = document.getElementById('conv-browse');
  const exportBtn = document.getElementById('conv-export');
  const importBtn = document.getElementById('conv-import');
  const clearBtn = document.getElementById('conv-clear-history');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveCurrentConversation();
    });
  }
  
  if (browseBtn) {
    browseBtn.addEventListener('click', () => {
      loadConversationHistory();
    });
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportConversationAsMarkdown();
    });
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      importConversation();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all conversation history?')) {
        clearConversationHistory();
      }
    });
  }
  
  // Load initial history
  loadConversationHistory();
  
  console.log('Conversation memory setup complete');
}

/**
 * Setup settings toggle button
 * Currently unused in production chat interface
 */
/* eslint-disable-next-line no-unused-vars */
function setupSettingsToggle() {
  const toggleBtn = document.getElementById('settings-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      settingsPanel.toggle();
    });
  }
}

/**
 * Setup service event listeners
 */
function setupServiceEventListeners() {
  // Streaming progress events - silently track progress
  globalEvents.on(Events.STREAMING_PROGRESS, () => {
    // Progress indicators handled by individual streaming services
    // Future: Could add global progress bar or status indicators here
  });
  
  // Error events
  globalEvents.on(Events.STREAM_ERROR, (data) => {
    console.error('Stream error:', data);
    updateStatus(`Stream error: ${data.error.message}`, 'error');
  });
  
  // Service event listeners can be expanded here as needed
  // Consider adding: CHAT_MESSAGE_COMPLETE, SESSION_CREATED, etc.
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    globalEvents.emit(Events.APP_ERROR, {
      error: event.error,
      message: event.message
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    globalEvents.emit(Events.APP_ERROR, {
      error: event.reason,
      message: 'Unhandled promise rejection'
    });
  });
}

/**
 * Create scroll UI elements
 */
function createScrollUI(container) {
  // Create scroll-to-bottom button
  const scrollButton = document.createElement('button');
  scrollButton.className = 'scroll-to-bottom';
  scrollButton.innerHTML = '↓';
  scrollButton.title = 'Scroll to bottom';
  scrollButton.style.display = 'none';
  
  scrollButton.addEventListener('click', () => {
    smartScrollService.scrollToBottom(true); // Force scroll and switch to auto mode
  });
  
  // Create scroll mode indicator
  const modeIndicator = document.createElement('div');
  modeIndicator.className = 'scroll-mode-indicator visible auto';
  modeIndicator.innerHTML = '<span class="mode-text">Auto-scroll</span>';
  
  // Position relative to the messages container itself
  // Ensure container has relative positioning for absolute children
  const currentPosition = window.getComputedStyle(container).position;
  if (currentPosition === 'static') {
    container.style.position = 'relative';
  }
  
  container.appendChild(scrollButton);
  container.appendChild(modeIndicator);
  
  // Listen for mode changes
  globalEvents.on('smartScroll:modeChanged', (data) => {
    const modeText = modeIndicator.querySelector('.mode-text');
    switch (data.mode) {
      case 'auto':
        modeText.textContent = 'Auto-scroll';
        modeIndicator.classList.remove('manual', 'paused');
        modeIndicator.classList.add('auto');
        scrollButton.style.display = 'none';
        scrollButton.classList.remove('visible');
        break;
      case 'manual':
        modeText.textContent = 'Manual scroll';
        modeIndicator.classList.add('manual');
        modeIndicator.classList.remove('paused', 'auto');
        scrollButton.style.display = 'block';
        scrollButton.classList.add('visible');
        break;
      case 'paused':
        modeText.textContent = 'Scroll paused';
        modeIndicator.classList.add('paused');
        modeIndicator.classList.remove('manual', 'auto');
        scrollButton.style.display = 'block';
        scrollButton.classList.add('visible');
        break;
    }
  });
  
  // Listen for bottom detection
  globalEvents.on('smartScroll:bottomDetected', (data) => {
    if (!data.isAtBottom && smartScrollService.getMode() !== 'auto') {
      scrollButton.style.display = 'block';
    } else {
      scrollButton.style.display = 'none';
    }
  });
}

/**
 * Update status display
 */
function updateStatus(message, type = '') {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type} visible`;
  
  // Auto-hide status after 5 seconds for non-persistent types
  if (type !== 'connected' && type !== 'error') {
    setTimeout(() => {
      statusElement.classList.remove('visible');
    }, 5000);
  }
}

/**
 * Update timestamp display
 */
function updateTimestamp() {
  const timestampElement = document.getElementById('timestamp');
  if (timestampElement) {
    const updateTime = () => {
      timestampElement.textContent = new Date().toLocaleTimeString();
    };
    updateTime();
    setInterval(updateTime, 1000);
  }
}

/**
 * Start connection monitoring
 * Currently unused in production
 */
/* eslint-disable-next-line no-unused-vars */
async function startConnectionMonitoring() {
  // Connection monitoring removed - no longer using testing proxy service
  // This functionality is now handled by the anthropicDirectService
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/**
 * Show API key dialog for Anthropic
 * Currently unused in production
 */
/* eslint-disable-next-line no-unused-vars */
function showApiKeyDialog() {
  const existingDialog = document.getElementById('api-key-dialog');
  if (existingDialog) {
    existingDialog.style.display = 'flex';
    return;
  }
  
  const dialog = document.createElement('div');
  dialog.id = 'api-key-dialog';
  dialog.className = 'modal-overlay';
  dialog.innerHTML = `
    <div class="modal-content">
      <h2>Enter Anthropic API Key</h2>
      <p>To use direct Claude streaming, please provide your Anthropic API key.</p>
      <p class="text-small">Your API key is only stored in memory and never sent anywhere except to Anthropic.</p>
      <input type="password" id="api-key-input" class="input-field" placeholder="sk-ant-...">
      <div class="button-group">
        <button class="btn btn-primary" onclick="window.submitApiKey()">Connect</button>
        <button class="btn btn-secondary" onclick="window.closeApiKeyDialog()">Cancel</button>
      </div>
      <p class="text-small">Get an API key from <a href="https://console.anthropic.com/api" target="_blank">console.anthropic.com</a></p>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Focus input
  setTimeout(() => {
    const input = document.getElementById('api-key-input');
    input.focus();
    
    // Submit on Enter
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.submitApiKey();
      }
    });
  }, 100);
  
  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      window.closeApiKeyDialog();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * Submit API key
 */
window.submitApiKey = function() {
  const apiKey = document.getElementById('api-key-input').value;
  if (apiKey) {
    anthropicDirectService.updateApiKey(apiKey);
    window.closeApiKeyDialog();
    updateStatus('Connected to Anthropic', 'connected');
  }
};

/**
 * Close API key dialog
 */
window.closeApiKeyDialog = function() {
  const dialog = document.getElementById('api-key-dialog');
  if (dialog) {
    dialog.remove();
  }
};

/**
 * Save current conversation to memory
 */
function saveCurrentConversation() {
  const stats = chatService.getStats();
  if (!stats.messageCount || stats.messageCount === 0) {
    updateStatus('No messages to save', 'warning');
    return;
  }
  
  const title = prompt('Enter a title for this conversation:') || 'Untitled Conversation';
  
  const conversation = {
    id: crypto.randomUUID(),
    title,
    date: new Date().toISOString(),
    messages: chatService.messageHistory,
    context: stats.contextState,
    metrics: stats.metrics
  };
  
  // Save to localStorage
  const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
  conversations.unshift(conversation);
  
  // Keep only last 50 conversations
  if (conversations.length > 50) {
    conversations.length = 50;
  }
  
  localStorage.setItem('conversations', JSON.stringify(conversations));
  updateStatus('Conversation saved!', 'success');
  
  // Refresh the conversation list if on that tab
  if (app.state.activeTab === 'conversation') {
    loadConversationHistory();
  }
}

/**
 * Load conversation history
 */
function loadConversationHistory() {
  const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
  const listElement = document.getElementById('conversation-list');
  
  if (!listElement) return;
  
  if (conversations.length === 0) {
    listElement.innerHTML = '<p class="empty-state">No saved conversations</p>';
    return;
  }
  
  listElement.innerHTML = conversations.map(conv => `
    <div class="conversation-item" data-id="${conv.id}">
      <div class="conversation-item-title">${conv.title}</div>
      <div class="conversation-item-date">${new Date(conv.date).toLocaleString()}</div>
      <div class="conversation-item-preview">${conv.messages.length} messages</div>
    </div>
  `).join('');
  
  // Add click handlers
  listElement.querySelectorAll('.conversation-item').forEach(item => {
    item.addEventListener('click', () => {
      previewConversation(item.dataset.id);
      
      // Update active state
      listElement.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
}

/**
 * Preview a conversation
 */
function previewConversation(conversationId) {
  const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) return;
  
  const previewElement = document.getElementById('conversation-preview');
  if (!previewElement) return;
  
  previewElement.innerHTML = `
    <h3>${conversation.title}</h3>
    <p class="conversation-meta">${new Date(conversation.date).toLocaleString()} • ${conversation.messages.length} messages</p>
    <div class="conversation-messages">
      ${conversation.messages.map(msg => `
        <div class="chat-message ${msg.role}">
          <div class="message-content">${msg.role === 'user' ? msg.content : msg.content || '[Streaming content]'}</div>
        </div>
      `).join('')}
    </div>
    <div class="conversation-actions">
      <button class="btn btn-primary" onclick="loadConversationIntoChat('${conversationId}')">Load into Chat</button>
      <button class="btn btn-danger" onclick="deleteConversation('${conversationId}')">Delete</button>
    </div>
  `;
}

/**
 * Export conversation as Markdown
 */
function exportConversationAsMarkdown() {
  const stats = chatService.getStats();
  if (!stats.messageCount || stats.messageCount === 0) {
    updateStatus('No messages to export', 'warning');
    return;
  }
  
  let markdown = `# Chat Conversation\n\n`;
  markdown += `**Date**: ${new Date().toLocaleString()}\n\n`;
  markdown += `**Messages**: ${stats.messageCount}\n\n`;
  
  // Add scroll statistics
  const scrollStats = smartScrollService.getStats();
  if (scrollStats.foldedMessages > 0) {
    markdown += `**Note**: ${scrollStats.foldedMessages} messages were folded for performance\n\n`;
  }
  
  markdown += `---\n\n`;
  
  // Get full content including folded messages from SmartScrollService
  const fullContent = smartScrollService.getFullContent();
  
  // Use message history for metadata and full content for actual text
  chatService.messageHistory.forEach((msg, index) => {
    markdown += `### ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n`;
    markdown += `_${new Date(msg.timestamp).toLocaleString()}_\n\n`;
    
    // Try to get content from SmartScrollService elements first
    if (fullContent[index]) {
      const contentEl = fullContent[index].querySelector('.message-content');
      if (contentEl) {
        markdown += `${contentEl.textContent || contentEl.innerText}\n\n`;
      } else {
        markdown += `${msg.content}\n\n`;
      }
    } else {
      markdown += `${msg.content}\n\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  // Create download
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  
  updateStatus('Conversation exported!', 'success');
}

/**
 * Import a conversation
 */
function importConversation() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.md';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await file.text(); // File reading for future implementation
      
      if (file.name.endsWith('.json')) {
        // const conversation = JSON.parse(text);
        // FEATURE ROADMAP: Implement conversation import validation
        // Should validate conversation format and merge with current history
        updateStatus('JSON import coming soon...', 'warning');
      } else {
        // FEATURE ROADMAP: Implement markdown conversation parsing
        // Should parse exported chat markdown back into conversation format
        updateStatus('Markdown import coming soon...', 'warning');
      }
    } catch (error) {
      updateStatus(`Import error: ${error.message}`, 'error');
    }
  };
  
  input.click();
}

/**
 * Clear all conversation history
 */
function clearConversationHistory() {
  localStorage.removeItem('conversations');
  loadConversationHistory();
  updateStatus('Conversation history cleared', 'success');
}

/**
 * Load conversation into chat
 */
window.loadConversationIntoChat = function(conversationId) {
  const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) return;
  
  // Focus on chat interface
  
  // Clear current chat
  const chatMessages = document.getElementById('streaming-chat-messages');
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
  
  // Load messages
  conversation.messages.forEach(msg => {
    if (msg.role === 'user') {
      chatService.displayUserMessage(msg, chatMessages);
    } else {
      // For assistant messages, create the wrapper and add content
      const messageWrapper = document.createElement('div');
      messageWrapper.className = 'chat-message assistant';
      
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      messageContent.innerHTML = msg.content || '[Content not available]';
      
      messageWrapper.appendChild(messageContent);
      chatMessages.appendChild(messageWrapper);
    }
  });
  
  updateStatus('Conversation loaded', 'success');
};

/**
 * Delete a conversation
 */
window.deleteConversation = function(conversationId) {
  if (!confirm('Are you sure you want to delete this conversation?')) return;
  
  let conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
  conversations = conversations.filter(c => c.id !== conversationId);
  localStorage.setItem('conversations', JSON.stringify(conversations));
  
  loadConversationHistory();
  document.getElementById('conversation-preview').innerHTML = '<p class="empty-state">Select a conversation to preview</p>';
  
  updateStatus('Conversation deleted', 'success');
};

// Export app and services for debugging
window.app = app;
window.streamingMarkdownService = streamingMarkdownService;
window.anthropicDirectService = anthropicDirectService;
window.chatService = chatService;
window.globalEvents = globalEvents;
window.smartScrollService = smartScrollService;

// Add error boundary
window.addEventListener('error', (event) => {
  console.error('Window error:', event);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});