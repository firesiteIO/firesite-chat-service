/**
 * UI Initializer - Sets up all UI components
 */

import { globalEvents } from '../core/events/event-emitter.js';

export function initializeUI(app) {
  console.log('Initializing UI components...');
  
  // Set initial version display
  const versionElement = document.getElementById('version');
  if (versionElement) {
    versionElement.textContent = `v${app.version}`;
  }
  
  // Initialize connection status (removed from footer)
  // updateConnectionStatus('disconnected');
  
  // Add keyboard shortcuts
  setupKeyboardShortcuts();
  
  // Setup resize observer for adaptive UI
  setupResizeObserver();
  
  // Initialize tooltips
  initializeTooltips();
}

/**
 * Update connection status display
 */
export function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connection-status');
  if (statusElement) {
    const statusText = {
      'connected': '🟢 Connected',
      'disconnected': '🔴 Disconnected',
      'connecting': '🟡 Connecting...'
    };
    statusElement.textContent = statusText[status] || status;
  }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to clear output
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('stream-clear')?.click();
    }
    
    // Ctrl/Cmd + Enter to run selected demo
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // Run the first demo button
      document.getElementById('stream-basic')?.click();
    }
    
    // Escape to stop streaming
    if (e.key === 'Escape') {
      e.preventDefault();
      // Stop any active streaming
      if (window.chatService && typeof window.chatService.stopStreaming === 'function') {
        window.chatService.stopStreaming();
      }
      // Also stop any active test conversation generation
      if (window.stopTestConversation) {
        window.stopTestConversation();
      }
    }
  });
}

/**
 * Setup resize observer for adaptive UI
 */
function setupResizeObserver() {
  const outputContainers = document.querySelectorAll('.output-container');
  
  const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const { width } = entry.contentRect;
      
      // Adjust font size based on container width
      if (width < 600) {
        entry.target.style.fontSize = '0.875rem';
      } else {
        entry.target.style.fontSize = '1rem';
      }
    });
  });
  
  outputContainers.forEach(container => {
    resizeObserver.observe(container);
  });
}

/**
 * Initialize tooltips
 */
function initializeTooltips() {
  // Add title attributes for better UX
  const tooltips = {
    'stream-basic': 'Run basic markdown demo',
    'stream-code': 'Run code blocks demo',
    'stream-complex': 'Run complex document demo',
    'generate-test-conversation': 'Generate realistic streaming test conversation',
    'stream-anthropic': 'Stream directly from Anthropic API',
    'stream-mcp': 'Stream through MCP server',
    'stream-pause': 'Pause streaming (Esc)',
    'stream-resume': 'Resume streaming',
    'stream-clear': 'Clear output (Ctrl+K)'
  };
  
  Object.entries(tooltips).forEach(([id, tooltip]) => {
    const element = document.getElementById(id);
    if (element) {
      element.title = tooltip;
    }
  });
}

/**
 * Create a notification toast
 */
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Create a progress indicator
 */
export function createProgressIndicator(container) {
  const progress = document.createElement('div');
  progress.className = 'progress-indicator';
  progress.innerHTML = `
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div class="progress-text">0%</div>
  `;
  
  container.appendChild(progress);
  
  return {
    update(percent) {
      progress.querySelector('.progress-fill').style.width = `${percent}%`;
      progress.querySelector('.progress-text').textContent = `${Math.round(percent)}%`;
    },
    remove() {
      progress.remove();
    }
  };
}

// Add notification styles dynamically
const notificationStyles = `
<style>
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 6px;
  background: var(--surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateX(400px);
  transition: transform 0.3s ease;
  z-index: 1000;
  max-width: 300px;
}

.notification.show {
  transform: translateX(0);
}

.notification-info {
  background: var(--primary);
  color: white;
}

.notification-success {
  background: var(--success);
  color: white;
}

.notification-warning {
  background: var(--warning);
  color: white;
}

.notification-error {
  background: var(--danger);
  color: white;
}

.progress-indicator {
  margin: 20px 0;
}

.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  width: 0%;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--text-light);
  text-align: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  font-size: 0.875rem;
}

.metrics-grid > div {
  padding: 8px;
  background: rgba(37, 99, 235, 0.05);
  border-radius: 4px;
  text-align: center;
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', notificationStyles);