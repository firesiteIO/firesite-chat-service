/**
 * BugReportButton - Floating bug report button for chat dialogs
 * Provides one-click bug reporting with automated context capture
 */

import { bugReportCapture } from '../services/debug/bug-report-capture.service.js';

export class BugReportButton {
  constructor() {
    this.modal = null;
    this.currentConversationId = null;
    this.isVisible = false;
    
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Add bug report button to a conversation group
   */
  addToConversation(conversationGroup, conversationId) {
    // Check if button already exists
    if (conversationGroup.querySelector('.bug-report-btn')) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'bug-report-btn';
    button.innerHTML = '🐛';
    button.title = 'Report Bug - Capture context for debugging';
    button.setAttribute('data-conversation-id', conversationId);
    
    // Position button in bottom-right of conversation
    button.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: #f56565;
      color: white;
      font-size: 14px;
      cursor: pointer;
      z-index: 10;
      opacity: 0.7;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '1';
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '0.7';
      button.style.transform = 'scale(1)';
    });
    
    // Add click handler
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openBugReportModal(conversationId, conversationGroup);
    });
    
    // Make sure conversation group is positioned relatively
    if (getComputedStyle(conversationGroup).position === 'static') {
      conversationGroup.style.position = 'relative';
    }
    
    conversationGroup.appendChild(button);
  }

  /**
   * Create bug report modal
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'bug-report-modal hidden';
    this.modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Bug Report</h3>
            <button class="modal-close" onclick="bugReportButton.closeModal()">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label for="bug-title">Bug Title:</label>
              <input type="text" id="bug-title" placeholder="Brief description of the issue">
            </div>
            
            <div class="form-group">
              <label for="bug-description">Detailed Description:</label>
              <textarea id="bug-description" rows="4" placeholder="Describe what you expected vs what actually happened. Include any patterns you notice."></textarea>
            </div>
            
            <div class="capture-info">
              <h4>Captured Context:</h4>
              <div id="capture-summary">
                <div class="capture-item">
                  <span class="capture-label">SSE Chunks:</span>
                  <span id="chunk-count">0</span>
                </div>
                <div class="capture-item">
                  <span class="capture-label">Console Logs:</span>
                  <span id="log-count">0</span>
                </div>
                <div class="capture-item">
                  <span class="capture-label">Session ID:</span>
                  <span id="session-id">-</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="bugReportButton.closeModal()">Cancel</button>
            <button class="btn btn-primary" onclick="bugReportButton.generateReport()">Generate Bug Report</button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal styles
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    document.body.appendChild(this.modal);
    this.addModalStyles();
  }

  /**
   * Add CSS styles for the modal
   */
  addModalStyles() {
    const existingStyle = document.getElementById('bug-report-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'bug-report-styles';
    style.textContent = `
      .bug-report-modal.hidden {
        display: none !important;
      }
      
      .bug-report-modal .modal-overlay {
        background: rgba(0, 0, 0, 0.5);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .bug-report-modal .modal-content {
        background: white;
        border-radius: 8px;
        padding: 0;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .bug-report-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .bug-report-modal .modal-header h3 {
        margin: 0;
        color: #1f2937;
      }
      
      .bug-report-modal .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
      
      .bug-report-modal .modal-close:hover {
        background: #f3f4f6;
      }
      
      .bug-report-modal .modal-body {
        padding: 20px;
      }
      
      .bug-report-modal .form-group {
        margin-bottom: 20px;
      }
      
      .bug-report-modal .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #374151;
      }
      
      .bug-report-modal .form-group input,
      .bug-report-modal .form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-family: inherit;
        font-size: 14px;
      }
      
      .bug-report-modal .form-group input:focus,
      .bug-report-modal .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      .bug-report-modal .capture-info {
        background: #f9fafb;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
      }
      
      .bug-report-modal .capture-info h4 {
        margin: 0 0 10px 0;
        color: #374151;
        font-size: 14px;
      }
      
      .bug-report-modal .capture-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .bug-report-modal .capture-label {
        color: #6b7280;
        font-size: 13px;
      }
      
      .bug-report-modal .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      
      .bug-report-modal .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .bug-report-modal .btn-secondary {
        background: #6b7280;
        color: white;
      }
      
      .bug-report-modal .btn-secondary:hover {
        background: #4b5563;
      }
      
      .bug-report-modal .btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .bug-report-modal .btn-primary:hover {
        background: #2563eb;
      }
      
      .chat-group {
        position: relative;
      }
      
      .bug-report-btn {
        transition: all 0.2s ease !important;
      }
      
      .bug-report-btn:hover {
        transform: scale(1.1) !important;
        opacity: 1 !important;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
    
    // Close modal on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal.querySelector('.modal-overlay')) {
        this.closeModal();
      }
    });
  }

  /**
   * Open bug report modal for a specific conversation
   */
  openBugReportModal(conversationId, conversationGroup) {
    this.currentConversationId = conversationId;
    
    // Update capture summary
    const status = bugReportCapture.getStatus();
    document.getElementById('chunk-count').textContent = status.sseChunks;
    document.getElementById('log-count').textContent = status.consoleLogs;
    document.getElementById('session-id').textContent = status.sessionId;
    
    // Clear previous input
    document.getElementById('bug-title').value = '';
    document.getElementById('bug-description').value = '';
    
    // Show modal
    this.modal.classList.remove('hidden');
    
    // Focus title input
    setTimeout(() => {
      document.getElementById('bug-title').focus();
    }, 100);
  }

  /**
   * Close the modal
   */
  closeModal() {
    this.modal.classList.add('hidden');
    this.currentConversationId = null;
  }

  /**
   * Generate and download bug report
   */
  async generateReport() {
    const title = document.getElementById('bug-title').value.trim();
    const description = document.getElementById('bug-description').value.trim();
    
    if (!title) {
      alert('Please enter a bug title');
      document.getElementById('bug-title').focus();
      return;
    }
    
    if (!description) {
      alert('Please enter a description of the issue');
      document.getElementById('bug-description').focus();
      return;
    }
    
    // Generate and download the bug report
    const report = await bugReportCapture.createBugReport(title, description, description);
    
    // Show success message
    const generateBtn = this.modal.querySelector('.btn-primary');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = 'Report Generated!';
    generateBtn.disabled = true;
    
    setTimeout(() => {
      generateBtn.textContent = originalText;
      generateBtn.disabled = false;
      this.closeModal();
    }, 2000);
  }
}

// Export singleton instance  
export const bugReportButton = new BugReportButton();
export default bugReportButton;