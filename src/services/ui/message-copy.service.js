/**
 * Message Copy Service
 * Handles copying of conversation groups (Q&A pairs) with proper markdown formatting
 * 
 * Features:
 * - Copy entire conversation groups (question + answer)
 * - Format as proper markdown
 * - Preserve code blocks with language hints
 * - Clean formatting for readability
 */

import { toastNotificationService } from './toast-notification.service.js';

export class MessageCopyService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Extract text content from a message element
   * @private
   */
  extractMessageText(messageElement) {
    const contentEl = messageElement.querySelector('.message-content');
    if (!contentEl) return '';

    // Clone the element to avoid modifying the original
    const clone = contentEl.cloneNode(true);
    
    // Remove any copy buttons from the clone
    clone.querySelectorAll('.copy-button, .message-copy-button').forEach(btn => btn.remove());
    
    // Convert HTML to markdown-like format
    return this.htmlToMarkdown(clone);
  }

  /**
   * Convert HTML content to markdown
   * @private
   */
  htmlToMarkdown(element) {
    let markdown = '';
    
    // Process each child node
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        switch (node.tagName.toLowerCase()) {
          case 'p':
            markdown += node.textContent + '\n\n';
            break;
          case 'pre':
            const code = node.querySelector('code');
            if (code) {
              const language = code.dataset.language || code.className.replace('language-', '') || '';
              markdown += '```' + language + '\n';
              markdown += code.textContent;
              markdown += '\n```\n\n';
            }
            break;
          case 'h1':
            markdown += '# ' + node.textContent + '\n\n';
            break;
          case 'h2':
            markdown += '## ' + node.textContent + '\n\n';
            break;
          case 'h3':
            markdown += '### ' + node.textContent + '\n\n';
            break;
          case 'h4':
            markdown += '#### ' + node.textContent + '\n\n';
            break;
          case 'h5':
            markdown += '##### ' + node.textContent + '\n\n';
            break;
          case 'h6':
            markdown += '###### ' + node.textContent + '\n\n';
            break;
          case 'ul':
            for (const li of node.querySelectorAll('li')) {
              markdown += '- ' + li.textContent + '\n';
            }
            markdown += '\n';
            break;
          case 'ol':
            let index = 1;
            for (const li of node.querySelectorAll('li')) {
              markdown += index + '. ' + li.textContent + '\n';
              index++;
            }
            markdown += '\n';
            break;
          case 'blockquote':
            markdown += '> ' + node.textContent.split('\n').join('\n> ') + '\n\n';
            break;
          case 'strong':
          case 'b':
            markdown += '**' + node.textContent + '**';
            break;
          case 'em':
          case 'i':
            markdown += '*' + node.textContent + '*';
            break;
          case 'code':
            if (!node.closest('pre')) {
              markdown += '`' + node.textContent + '`';
            }
            break;
          case 'a':
            markdown += '[' + node.textContent + '](' + node.href + ')';
            break;
          case 'br':
            markdown += '\n';
            break;
          default:
            // Recursively process other elements
            markdown += this.htmlToMarkdown(node);
        }
      }
    }
    
    return markdown.trim();
  }

  /**
   * Copy a conversation group (question + answer)
   * @param {string} conversationId - The conversation ID
   */
  async copyConversation(conversationId) {
    try {
      const conversationGroup = document.querySelector(`[data-conversation-id="${conversationId}"]`);
      if (!conversationGroup) {
        throw new Error('Conversation not found');
      }

      // Extract user message
      const userMessage = conversationGroup.querySelector('.chat-message.user');
      const assistantMessage = conversationGroup.querySelector('.chat-message.assistant');
      
      if (!userMessage || !assistantMessage) {
        throw new Error('Incomplete conversation');
      }

      // Build markdown content
      let markdown = '## User\n\n';
      markdown += this.extractMessageText(userMessage) + '\n\n';
      markdown += '## Assistant\n\n';
      markdown += this.extractMessageText(assistantMessage) + '\n';

      // Copy to clipboard
      await navigator.clipboard.writeText(markdown);
      
      // Show success toast
      toastNotificationService.success('Dialog copied to clipboard!');
      
      // FUTURE INTEGRATION: MCP Memory service
      // When MCP Memory service is available, conversations could be automatically
      // stored for context preservation across sessions
      
    } catch (error) {
      console.error('Failed to copy dialog:', error);
      toastNotificationService.error('Failed to copy dialog. Please try again.');
    }
  }

  /**
   * Add copy button to a message
   * @param {HTMLElement} messageElement - The message element
   * @param {string} conversationId - The conversation ID
   */
  addCopyButton(messageElement, conversationId) {
    // Only add to assistant messages
    if (!messageElement.classList.contains('assistant')) return;
    
    const messageContent = messageElement.querySelector('.message-content');
    if (!messageContent) return;
    
    // Check if button already exists
    if (messageContent.querySelector('.message-copy-button')) return;
    
    // Create copy button
    const copyButton = document.createElement('button');
    copyButton.className = 'message-copy-button';
    copyButton.textContent = 'Copy';
    copyButton.setAttribute('aria-label', 'Copy conversation');
    
    copyButton.onclick = () => {
      this.copyConversation(conversationId);
    };
    
    // Add to message content
    messageContent.appendChild(copyButton);
  }
}

// Export singleton instance
export const messageCopyService = new MessageCopyService();
export default messageCopyService;