/**
 * Export Menu Component
 * Provides UI for exporting conversation history in multiple formats
 */

import { conversationExportService } from '../services/export/conversation-export.service.js';
import { globalEvents } from '../core/events/event-emitter.js';

export class ExportMenu {
  constructor() {
    this.container = null;
    this.button = null;
    this.menu = null;
    this.initialized = false;
  }

  /**
   * Initialize the export menu
   */
  init() {
    if (this.initialized) return;

    this.createButton();
    this.createMenu();
    this.attachEventListeners();
    
    this.initialized = true;
  }

  /**
   * Create the export button
   * @private
   */
  createButton() {
    // Find the chat wrapper to position the export button at the top
    const chatWrapper = document.querySelector('.chat-wrapper');
    
    if (!chatWrapper) {
      console.warn('Chat wrapper not found for export button');
      return;
    }

    // Create button container
    this.container = document.createElement('div');
    this.container.className = 'export-menu-container';

    // Create export button
    this.button = document.createElement('button');
    this.button.className = 'btn btn-secondary export-button';
    this.button.innerHTML = `
      <svg viewBox="0 0 20 20" fill="currentColor" class="export-icon">
        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
      <span>Export</span>
    `;
    this.button.setAttribute('aria-label', 'Export conversation');
    this.button.setAttribute('aria-haspopup', 'true');
    this.button.setAttribute('aria-expanded', 'false');

    this.container.appendChild(this.button);
    
    // Insert at the beginning of chat wrapper
    chatWrapper.insertBefore(this.container, chatWrapper.firstChild);
  }

  /**
   * Create the export menu dropdown
   * @private
   */
  createMenu() {
    if (!this.container) {
      console.warn('Container not created, skipping menu creation');
      return;
    }
    
    this.menu = document.createElement('div');
    this.menu.className = 'export-menu-dropdown';
    this.menu.style.display = 'none';
    
    const formats = conversationExportService.showExportMenu();
    
    formats.forEach(format => {
      const item = document.createElement('button');
      item.className = 'export-menu-item';
      item.textContent = format.name;
      item.onclick = () => {
        this.hideMenu();
        format.handler();
      };
      this.menu.appendChild(item);
    });

    this.container.appendChild(this.menu);
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    if (!this.button || !this.container) {
      console.warn('Button or container not created, skipping event listeners');
      return;
    }
    
    // Toggle menu on button click
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.container && !this.container.contains(e.target)) {
        this.hideMenu();
      }
    });

    // Keyboard navigation
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMenu();
      } else if (e.key === 'Escape') {
        this.hideMenu();
      }
    });
    
    // Update button state when conversations change
    globalEvents.on('chat:messageAdded', () => {
      this.updateButtonState();
    });
    
    // Initial state
    this.updateButtonState();
  }

  /**
   * Toggle menu visibility
   * @private
   */
  toggleMenu() {
    if (this.menu.style.display === 'none') {
      this.showMenu();
    } else {
      this.hideMenu();
    }
  }

  /**
   * Show the menu
   * @private
   */
  showMenu() {
    this.menu.style.display = 'block';
    this.button.setAttribute('aria-expanded', 'true');
    this.button.classList.add('active');
    
    // Focus first menu item
    const firstItem = this.menu.querySelector('.export-menu-item');
    if (firstItem) {
      firstItem.focus();
    }
  }

  /**
   * Hide the menu
   * @private
   */
  hideMenu() {
    if (this.menu) {
      this.menu.style.display = 'none';
    }
    if (this.button) {
      this.button.setAttribute('aria-expanded', 'false');
      this.button.classList.remove('active');
    }
  }

  /**
   * Update button state based on conversation count
   */
  updateButtonState() {
    if (!this.button) return;
    
    const hasConversations = document.querySelectorAll('.chat-group').length > 0;
    this.button.disabled = !hasConversations;
    
    if (!hasConversations) {
      this.button.setAttribute('title', 'No conversations to export');
    } else {
      this.button.setAttribute('title', 'Export conversation history');
    }
  }
}

// Export singleton instance
export const exportMenu = new ExportMenu();
export default exportMenu;