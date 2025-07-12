/**
 * Toast Notification Service
 * Provides elegant toast/snackbar notifications for user feedback
 * 
 * Features:
 * - Multiple notification types (success, error, info, warning)
 * - Auto-dismiss with configurable duration
 * - Stackable notifications
 * - Smooth animations
 * - Accessible with ARIA announcements
 */

export class ToastNotificationService {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the toast notification system
   */
  init() {
    if (this.initialized) return;

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);

    this.initialized = true;
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Configuration options
   * @returns {string} Toast ID for manual dismissal
   */
  show(message, options = {}) {
    if (!this.initialized) this.init();

    const config = {
      type: 'info',
      duration: 3000,
      icon: true,
      ...options
    };

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast = this.createToast(message, config, id);
    
    this.container.appendChild(toast);
    this.notifications.set(id, toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto dismiss
    if (config.duration > 0) {
      setTimeout(() => this.dismiss(id), config.duration);
    }

    return id;
  }

  /**
   * Create a toast element
   * @private
   */
  createToast(message, config, id) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type}`;
    toast.id = id;

    // Icon
    if (config.icon) {
      const icon = document.createElement('span');
      icon.className = 'toast-icon';
      icon.innerHTML = this.getIcon(config.type);
      toast.appendChild(icon);
    }

    // Message
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.dismiss(id);
    toast.appendChild(closeBtn);

    return toast;
  }

  /**
   * Get icon SVG for toast type
   * @private
   */
  getIcon(type) {
    const icons = {
      success: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      error: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      warning: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
      info: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>'
    };
    return icons[type] || icons.info;
  }

  /**
   * Dismiss a toast notification
   * @param {string} id - Toast ID to dismiss
   */
  dismiss(id) {
    const toast = this.notifications.get(id);
    if (!toast) return;

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach((_, id) => this.dismiss(id));
  }
}

// Export singleton instance
export const toastNotificationService = new ToastNotificationService();
export default toastNotificationService;