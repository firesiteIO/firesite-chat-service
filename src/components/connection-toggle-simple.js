/**
 * Connection Toggle Component (Simplified)
 * Allows switching between Direct Anthropic API and MCP Max Server
 */

import { globalEvents } from '../core/events/event-emitter.js';
import { getConfig, setConfig } from '../core/config/service-config.js';
import { modalDialog } from './modal-dialog.js';

export class ConnectionToggle {
  constructor() {
    this.modes = {
      mcp: {
        id: 'mcp',
        name: 'MCP Max',
        description: 'Use MCP Max proxy server (recommended)',
        icon: '🚀'
      },
      direct: {
        id: 'direct',
        name: 'Direct',
        description: 'Connect directly to Anthropic API',
        icon: '⚡'
      }
    };
    
    this.currentMode = localStorage.getItem('connectionMode') || 'mcp';
    this.container = null;
    this.apiKeyInput = null;
  }
  
  /**
   * Initialize the connection toggle
   * @param {string} containerId - ID of container element
   */
  initialize(containerId = 'connection-toggle-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Connection toggle container not found');
      return;
    }
    
    this.render();
    this.setupEventListeners();
    
    // Emit initial mode
    globalEvents.emit('connection:modeChanged', { 
      mode: this.currentMode,
      config: this.modes[this.currentMode]
    });
    
    console.log('Connection toggle initialized');
  }
  
  /**
   * Render the connection toggle
   */
  render() {
    this.container.innerHTML = `
      <div class="connection-toggle-simple">
        <div class="mode-options">
          ${Object.entries(this.modes).map(([key, mode]) => `
            <label class="mode-option ${this.currentMode === key ? 'active' : ''}" data-mode="${key}">
              <input type="radio" name="connection-mode" value="${key}" ${this.currentMode === key ? 'checked' : ''} />
              <span class="mode-icon">${mode.icon}</span>
              <span class="mode-name">${mode.name}</span>
              <button class="info-button" data-mode="${key}" aria-label="More info about ${mode.name}">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
              </button>
            </label>
          `).join('')}
        </div>
        
        ${this.currentMode === 'direct' ? this.renderDirectModeSettings() : ''}
      </div>
    `;
  }
  
  /**
   * Render Direct mode settings (API key input)
   */
  renderDirectModeSettings() {
    const savedApiKey = localStorage.getItem('anthropicApiKey') || '';
    const hasApiKey = savedApiKey.length > 0;
    
    return `
      <div class="direct-mode-settings">
        <div class="api-key-section">
          <div class="api-key-input-group">
            <input 
              type="password" 
              id="anthropic-api-key" 
              class="api-key-input" 
              placeholder="${hasApiKey ? '••••••••••••••••' : 'Enter API key...'}"
              value="${savedApiKey}"
            />
            <button id="save-api-key" class="btn btn-sm ${hasApiKey ? 'btn-secondary' : 'btn-primary'}">
              ${hasApiKey ? '✓' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mode toggle
    const modeOptions = this.container.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        // Don't trigger mode change if clicking info button
        if (e.target.closest('.info-button')) return;
        
        const mode = option.dataset.mode;
        if (mode !== this.currentMode) {
          this.switchMode(mode);
        }
      });
    });
    
    // Radio inputs
    const radios = this.container.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.switchMode(e.target.value);
      });
    });
    
    // Info buttons
    const infoButtons = this.container.querySelectorAll('.info-button');
    infoButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mode = btn.dataset.mode;
        this.showModeInfo(mode);
      });
    });
    
    // API key save button (if in direct mode)
    if (this.currentMode === 'direct') {
      const saveButton = document.getElementById('save-api-key');
      const apiKeyInput = document.getElementById('anthropic-api-key');
      
      if (saveButton && apiKeyInput) {
        saveButton.addEventListener('click', () => {
          this.saveApiKey(apiKeyInput.value);
        });
        
        // Save on Enter key
        apiKeyInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.saveApiKey(apiKeyInput.value);
          }
        });
      }
    }
  }
  
  /**
   * Show mode information in modal
   * @param {string} mode - Mode to show info for
   */
  showModeInfo(mode) {
    const modeInfo = {
      mcp: {
        title: 'MCP Max Server',
        content: `
          <div class="mode-info">
            <h4>Benefits:</h4>
            <ul>
              <li><strong>No API key required</strong> - Uses server-side authentication</li>
              <li><strong>Built-in rate limiting</strong> - Prevents API quota issues</li>
              <li><strong>Server-side request handling</strong> - Enhanced reliability</li>
              <li><strong>Enhanced security</strong> - API keys never exposed to browser</li>
              <li><strong>CORS handling</strong> - No browser restrictions</li>
              <li><strong>Session management</strong> - Maintains context across requests</li>
            </ul>
            <p class="mode-recommendation">✓ Recommended for most users</p>
          </div>
        `
      },
      direct: {
        title: 'Direct Anthropic Connection',
        content: `
          <div class="mode-info">
            <h4>Benefits:</h4>
            <ul>
              <li><strong>Direct API access</strong> - No intermediary server</li>
              <li><strong>Lower latency</strong> - Faster response times</li>
              <li><strong>No proxy overhead</strong> - Maximum performance</li>
              <li><strong>Full API features</strong> - Access to all Anthropic features</li>
            </ul>
            <h4>Requirements:</h4>
            <ul>
              <li>Valid Anthropic API key</li>
              <li>Proper CORS configuration</li>
            </ul>
            <p class="mode-warning">API key will be stored in browser localStorage</p>
          </div>
        `
      }
    };
    
    const info = modeInfo[mode];
    if (info) {
      modalDialog.showInfo(info.title, info.content);
    }
  }
  
  /**
   * Switch connection mode
   * @param {string} mode - New mode ('mcp' or 'direct')
   */
  async switchMode(mode) {
    if (!this.modes[mode]) return;
    
    // Check if switching to direct mode requires API key
    if (mode === 'direct') {
      const hasApiKey = localStorage.getItem('anthropicApiKey');
      if (!hasApiKey) {
        // Show API key requirement in modal
        modalDialog.show({
          title: 'API Key Required',
          content: `
            <div class="api-key-required">
              <p>Direct mode requires an Anthropic API key.</p>
              <p>Get your API key from the <a href="https://console.anthropic.com/settings/keys" target="_blank">Anthropic Console</a></p>
            </div>
          `,
          type: 'warning',
          onClose: () => {
            // Update UI to show API key input
            this.currentMode = mode;
            this.render();
            this.setupEventListeners();
            
            // Focus on API key input
            const apiKeyInput = document.getElementById('anthropic-api-key');
            if (apiKeyInput) {
              apiKeyInput.focus();
            }
          }
        });
        return;
      }
    }
    
    this.currentMode = mode;
    localStorage.setItem('connectionMode', mode);
    
    // Update UI
    this.render();
    this.setupEventListeners();
    
    // Emit mode change event
    globalEvents.emit('connection:modeChanged', { 
      mode: this.currentMode,
      config: this.modes[this.currentMode]
    });
    
    // Update service configuration
    setConfig('connection.mode', mode);
    
    console.log(`Connection mode switched to: ${this.modes[mode].name}`);
  }
  
  /**
   * Save API key
   * @param {string} apiKey - API key to save
   */
  saveApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      modalDialog.showError('Invalid API Key', 'Please enter a valid API key');
      return;
    }
    
    // Basic validation
    if (!apiKey.startsWith('sk-ant-')) {
      modalDialog.showWarning('API Key Format', 'API key should start with "sk-ant-"');
    }
    
    // Save to localStorage
    localStorage.setItem('anthropicApiKey', apiKey.trim());
    
    // Update button
    const saveButton = document.getElementById('save-api-key');
    if (saveButton) {
      saveButton.textContent = '✓';
      saveButton.classList.remove('btn-primary');
      saveButton.classList.add('btn-secondary');
    }
    
    // Emit event
    globalEvents.emit('connection:apiKeyUpdated', { hasKey: true });
    
    // Show success (brief notification, not modal)
    globalEvents.emit('ui:notification', {
      type: 'success',
      message: 'API key saved'
    });
  }
  
  /**
   * Get current mode
   * @returns {Object} Current mode configuration
   */
  getCurrentMode() {
    return {
      id: this.currentMode,
      ...this.modes[this.currentMode]
    };
  }
  
  /**
   * Check if API key is available for direct mode
   * @returns {boolean} True if API key exists
   */
  hasApiKey() {
    return !!localStorage.getItem('anthropicApiKey');
  }
}

// Export singleton instance
export const connectionToggle = new ConnectionToggle();
export default connectionToggle;