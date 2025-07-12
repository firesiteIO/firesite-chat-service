/**
 * Conversation Export Service
 * Handles exporting full conversation history in multiple formats
 * 
 * Features:
 * - Export formats: Markdown, HTML, Plain Text, JSON
 * - PDF export (using browser print dialog)
 * - Timestamp and metadata preservation
 * - Proper formatting for each export type
 * - File download handling
 */

import { toastNotificationService } from '../ui/toast-notification.service.js';
import { messageCopyService } from '../ui/message-copy.service.js';

export class ConversationExportService {
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
   * Get all conversation groups from the chat
   * @private
   */
  getAllConversations() {
    const conversations = [];
    const chatGroups = document.querySelectorAll('.chat-group');
    
    chatGroups.forEach(group => {
      const conversationId = group.getAttribute('data-conversation-id');
      const userMessage = group.querySelector('.chat-message.user');
      const assistantMessage = group.querySelector('.chat-message.assistant');
      
      if (userMessage && assistantMessage) {
        conversations.push({
          id: conversationId,
          timestamp: group.querySelector('.message-timestamp')?.textContent || '',
          user: messageCopyService.extractMessageText(userMessage),
          assistant: messageCopyService.extractMessageText(assistantMessage)
        });
      }
    });
    
    return conversations;
  }

  /**
   * Export conversation as Markdown
   */
  async exportAsMarkdown() {
    try {
      const conversations = this.getAllConversations();
      if (conversations.length === 0) {
        toastNotificationService.warning('No conversations to export');
        return;
      }

      let markdown = '# Chat Export\n\n';
      markdown += `**Exported on:** ${new Date().toLocaleString()}\n\n`;
      markdown += `**Total Dialogs:** ${conversations.length}\n\n`;
      markdown += '---\n\n';

      conversations.forEach((conv, index) => {
        markdown += `## Dialog ${index + 1}\n\n`;
        if (conv.timestamp) {
          markdown += `*${conv.timestamp}*\n\n`;
        }
        markdown += '### User\n\n';
        markdown += conv.user + '\n\n';
        markdown += '### Assistant\n\n';
        markdown += conv.assistant + '\n\n';
        markdown += '---\n\n';
      });

      // Download the file
      this.downloadFile(markdown, 'chat-export.md', 'text/markdown');
      toastNotificationService.success('Conversation exported as Markdown!');
      
    } catch (error) {
      console.error('Export failed:', error);
      toastNotificationService.error('Failed to export conversation. Please try again.');
    }
  }

  /**
   * Export conversation as HTML
   */
  async exportAsHTML() {
    try {
      const conversations = this.getAllConversations();
      if (conversations.length === 0) {
        toastNotificationService.warning('No conversations to export');
        return;
      }

      let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Export - ${new Date().toLocaleDateString()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .header {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .dialog {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .timestamp {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 10px;
    }
    .user-message, .assistant-message {
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .user-message {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    .assistant-message {
      background-color: #f3e5f5;
      border-left: 4px solid #9c27b0;
    }
    h1, h2, h3 {
      margin-top: 0;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: 'Monaco', 'Consolas', monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Chat Export</h1>
    <p><strong>Exported on:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Total Dialogs:</strong> ${conversations.length}</p>
  </div>
`;

      conversations.forEach((conv, index) => {
        html += `
  <div class="dialog">
    <h2>Dialog ${index + 1}</h2>
    ${conv.timestamp ? `<div class="timestamp">${conv.timestamp}</div>` : ''}
    <div class="user-message">
      <h3>User</h3>
      ${this.markdownToHTML(conv.user)}
    </div>
    <div class="assistant-message">
      <h3>Assistant</h3>
      ${this.markdownToHTML(conv.assistant)}
    </div>
  </div>
`;
      });

      html += `
</body>
</html>`;

      // Download the file
      this.downloadFile(html, 'chat-export.html', 'text/html');
      toastNotificationService.success('Conversation exported as HTML!');
      
    } catch (error) {
      console.error('Export failed:', error);
      toastNotificationService.error('Failed to export conversation. Please try again.');
    }
  }

  /**
   * Export conversation as plain text
   */
  async exportAsText() {
    try {
      const conversations = this.getAllConversations();
      if (conversations.length === 0) {
        toastNotificationService.warning('No conversations to export');
        return;
      }

      let text = 'CHAT EXPORT\n';
      text += '===========\n\n';
      text += `Exported on: ${new Date().toLocaleString()}\n`;
      text += `Total Dialogs: ${conversations.length}\n\n`;
      text += '----------------------------------------\n\n';

      conversations.forEach((conv, index) => {
        text += `DIALOG ${index + 1}\n`;
        if (conv.timestamp) {
          text += `Time: ${conv.timestamp}\n`;
        }
        text += '\nUSER:\n';
        text += conv.user + '\n\n';
        text += 'ASSISTANT:\n';
        text += conv.assistant + '\n\n';
        text += '----------------------------------------\n\n';
      });

      // Download the file
      this.downloadFile(text, 'chat-export.txt', 'text/plain');
      toastNotificationService.success('Conversation exported as text!');
      
    } catch (error) {
      console.error('Export failed:', error);
      toastNotificationService.error('Failed to export conversation. Please try again.');
    }
  }

  /**
   * Export conversation as JSON
   */
  async exportAsJSON() {
    try {
      const conversations = this.getAllConversations();
      if (conversations.length === 0) {
        toastNotificationService.warning('No conversations to export');
        return;
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        totalDialogs: conversations.length,
        conversations: conversations.map((conv, index) => ({
          index: index + 1,
          id: conv.id,
          timestamp: conv.timestamp,
          messages: [
            {
              role: 'user',
              content: conv.user
            },
            {
              role: 'assistant',
              content: conv.assistant
            }
          ]
        }))
      };

      const json = JSON.stringify(exportData, null, 2);

      // Download the file
      this.downloadFile(json, 'chat-export.json', 'application/json');
      toastNotificationService.success('Conversation exported as JSON!');
      
    } catch (error) {
      console.error('Export failed:', error);
      toastNotificationService.error('Failed to export conversation. Please try again.');
    }
  }

  /**
   * Export conversation as PDF (using print dialog)
   */
  async exportAsPDF() {
    try {
      const conversations = this.getAllConversations();
      if (conversations.length === 0) {
        toastNotificationService.warning('No conversations to export');
        return;
      }

      // Create a printable HTML document
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toastNotificationService.error('Please allow popups to export as PDF');
        return;
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <title>Chat Export - ${new Date().toLocaleDateString()}</title>
  <style>
    @media print {
      body { margin: 0; }
      .dialog { page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #000;
      padding: 20px;
    }
    .header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #ddd;
    }
    .dialog {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }
    h1 { font-size: 24px; margin: 0 0 10px 0; }
    h2 { font-size: 18px; margin: 20px 0 10px 0; }
    h3 { font-size: 16px; margin: 15px 0 10px 0; }
    .timestamp { color: #666; font-size: 14px; }
    .user-message, .assistant-message {
      margin: 10px 0;
      padding: 10px;
      border-left: 3px solid #ddd;
    }
    .user-message { border-color: #2196f3; }
    .assistant-message { border-color: #9c27b0; }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      overflow-x: auto;
      font-size: 12px;
    }
    code {
      background-color: #f5f5f5;
      padding: 1px 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Chat Export</h1>
    <p>Exported on: ${new Date().toLocaleString()}</p>
    <p>Total Dialogs: ${conversations.length}</p>
  </div>
`;

      let content = '';
      conversations.forEach((conv, index) => {
        content += `
  <div class="dialog">
    <h2>Dialog ${index + 1}</h2>
    ${conv.timestamp ? `<div class="timestamp">${conv.timestamp}</div>` : ''}
    <div class="user-message">
      <h3>User</h3>
      ${this.markdownToHTML(conv.user)}
    </div>
    <div class="assistant-message">
      <h3>Assistant</h3>
      ${this.markdownToHTML(conv.assistant)}
    </div>
  </div>
`;
      });

      printWindow.document.write(html + content + '</body></html>');
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          toastNotificationService.info('Use your browser\'s print dialog to save as PDF');
        };
      };
      
    } catch (error) {
      console.error('Export failed:', error);
      toastNotificationService.error('Failed to export conversation. Please try again.');
    }
  }

  /**
   * Simple markdown to HTML converter
   * @private
   */
  markdownToHTML(markdown) {
    return markdown
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Headers
      .replace(/^### (.*)/gm, '<h3>$1</h3>')
      .replace(/^## (.*)/gm, '<h2>$1</h2>')
      .replace(/^# (.*)/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  /**
   * Download file utility
   * @private
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Show export menu
   */
  showExportMenu() {
    // This could be enhanced with a proper UI menu
    // For now, we'll use a simple approach
    const formats = [
      { name: 'Markdown', handler: () => this.exportAsMarkdown() },
      { name: 'HTML', handler: () => this.exportAsHTML() },
      { name: 'Plain Text', handler: () => this.exportAsText() },
      { name: 'JSON', handler: () => this.exportAsJSON() },
      { name: 'PDF', handler: () => this.exportAsPDF() }
    ];

    // Return formats for UI to handle
    return formats;
  }
}

// Export singleton instance
export const conversationExportService = new ConversationExportService();
export default conversationExportService;