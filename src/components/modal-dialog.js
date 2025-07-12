/**
 * Modal Dialog Component
 * Displays benefits, warnings, and other information in a modal overlay
 */

export class ModalDialog {
  constructor() {
    this.container = null;
    this.isOpen = false;
  }
  
  /**
   * Show modal with content
   * @param {Object} options - Modal options
   * @param {string} options.title - Modal title
   * @param {string} options.content - HTML content
   * @param {string} options.type - Modal type (info, warning, error)
   * @param {Function} options.onClose - Close callback
   */
  show(options = {}) {
    const {
      title = 'Information',
      content = '',
      type = 'info',
      onClose = null
    } = options;
    
    // Remove existing modal if any
    this.close();
    
    // Create modal container
    this.container = document.createElement('div');
    this.container.className = 'modal-overlay';
    this.container.innerHTML = `
      <div class="modal-dialog modal-${type}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-footer">
          <button class="modal-button modal-button-primary">OK</button>
        </div>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(this.container);
    this.isOpen = true;
    
    // Setup event listeners
    const closeBtn = this.container.querySelector('.modal-close');
    const okBtn = this.container.querySelector('.modal-button-primary');
    const overlay = this.container;
    
    const handleClose = () => {
      this.close();
      if (onClose) onClose();
    };
    
    closeBtn.addEventListener('click', handleClose);
    okBtn.addEventListener('click', handleClose);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        handleClose();
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        handleClose();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Focus the OK button
    requestAnimationFrame(() => {
      okBtn.focus();
    });
  }
  
  /**
   * Show info modal
   * @param {string} title - Modal title
   * @param {string} content - Modal content
   */
  showInfo(title, content) {
    this.show({ title, content, type: 'info' });
  }
  
  /**
   * Show warning modal
   * @param {string} title - Modal title
   * @param {string} content - Modal content
   */
  showWarning(title, content) {
    this.show({ title, content, type: 'warning' });
  }
  
  /**
   * Show error modal
   * @param {string} title - Modal title
   * @param {string} content - Modal content
   */
  showError(title, content) {
    this.show({ title, content, type: 'error' });
  }
  
  /**
   * Close modal
   */
  close() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.isOpen = false;
    }
  }
}

// Export singleton instance
export const modalDialog = new ModalDialog();
export default modalDialog;