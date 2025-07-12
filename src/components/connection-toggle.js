/**
 * Connection Toggle Component - Direct Anthropic + MCP Proxy
 * Choose between direct API calls or MCP proxy for CORS-free access
 */

import { globalEvents } from '../core/events/event-emitter.js';
import { getConfig, setConfig } from '../core/config/service-config.js';

export class ConnectionToggle {
  constructor() {
    this.modes = {
      'mcp-base': {
        id: 'mcp-base',
        name: 'MCP Base Server',
        description: 'Basic AI conversations with system prompts (Port 3001)',
        icon: '🔧',
        serverUrl: 'http://localhost:3001',
        features: [
          'Basic AI conversations', 
          'Custom system prompts',
          'Model selection',
          'Streaming markdown', 
          'Code highlighting'
        ],
        benefits: [
          'No CORS issues',
          'Works in any browser',
          'No API key needed',
          'Basic AI customization',
          'Fast and reliable'
        ]
      },
      'mcp-max': {
        id: 'mcp-max',
        name: 'MCP Max Server',
        description: 'Advanced AI with context objects and specialized roles (Port 3002)',
        icon: '🚀',
        serverUrl: 'http://localhost:3002',
        features: [
          'Everything in Base Server',
          'Context objects (MMCO/UACP/PACP)',
          'Specialized AI modes & roles',
          'Session persistence with context',
          'AI role-based system prompts',
          'Advanced memory capabilities'
        ],
        benefits: [
          'All Base Server features',
          'Context-aware conversations',
          'Specialized AI roles',
          'Persistent session memory',
          'Project/business context integration',
          'Advanced AI customization'
        ]
      },
      direct: {
        id: 'direct',
        name: 'Direct Anthropic',
        description: 'Connect directly to Anthropic API (requires deployment)',
        icon: '⚡',
        benefits: [
          'Lower latency',
          'Direct API access',
          'No proxy overhead'
        ],
        warnings: [
          'CORS blocked in browsers',
          'Requires server deployment',
          'API key in frontend'
        ]
      }
    };
    
    this.currentMode = localStorage.getItem('connectionMode') || 'mcp-base';
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
    const currentModeConfig = this.modes[this.currentMode];
    
    this.container.innerHTML = `
      <div class="connection-toggle">
        <div class="toggle-header">
          <label class="toggle-label">Connection Mode:</label>
          <div class="toggle-switch-container">
            <button class="toggle-option ${this.currentMode === 'mcp-base' ? 'active' : ''}" 
                    data-mode="mcp-base" title="${this.modes['mcp-base'].description}">
              ${this.modes['mcp-base'].icon} ${this.modes['mcp-base'].name}
            </button>
            <button class="toggle-option ${this.currentMode === 'mcp-max' ? 'active' : ''}" 
                    data-mode="mcp-max" title="${this.modes['mcp-max'].description}">
              ${this.modes['mcp-max'].icon} ${this.modes['mcp-max'].name}
            </button>
            <button class="toggle-option ${this.currentMode === 'direct' ? 'active' : ''}" 
                    data-mode="direct" title="${this.modes.direct.description}">
              ${this.modes.direct.icon} ${this.modes.direct.name}
            </button>
          </div>
        </div>
        
        <div class="mode-info">
          <div class="mode-description">${currentModeConfig.description}</div>
          
          ${this.isMcpMode() ? this.renderMcpModeSettings() : ''}
          ${this.currentMode === 'direct' ? this.renderDirectModeSettings() : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Render MCP mode settings
   */
  renderMcpModeSettings() {
    const currentModeConfig = this.modes[this.currentMode];
    const isMaxMode = this.currentMode === 'mcp-max';
    
    return `
      <div class="mcp-mode-settings">
        ${isMaxMode ? this.renderMaxServerAuth() : ''}
        <div class="mcp-status-section">
          <div class="mcp-server-status">
            <span class="status-label">MCP Server Status:</span>
            <span id="mcp-status-indicator" class="status-indicator checking">Checking...</span>
          </div>
          <div class="mcp-info">
            <p>${isMaxMode ? 'Advanced MCP server with context objects and AI modes.' : 'Basic MCP server for AI conversations.'}</p>
            <p><strong>Server URL:</strong> ${currentModeConfig.serverUrl}</p>
            <div class="mcp-features">
              <h5>Available Features:</h5>
              <ul>
                ${currentModeConfig.features.map(feature => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="mcp-actions">
            <button id="check-mcp-server" class="btn btn-sm btn-secondary">Check Connection</button>
            <a href="https://github.com/firesiteio/${isMaxMode ? 'firesite-mcp-max' : 'firesite-mcp'}" target="_blank" class="btn btn-sm btn-outline">
              Setup Guide →
            </a>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render MCP Max server authentication section
   */
  renderMaxServerAuth() {
    const savedMaxApiKey = localStorage.getItem('mcpMaxApiKey') || '';
    const hasMaxApiKey = savedMaxApiKey.length > 0;
    
    return `
      <div class="max-server-auth-section">
        <h4>MCP Max Authentication</h4>
        <p class="auth-description">Secure access to advanced AI features</p>
        <div class="api-key-section">
          <label for="mcp-max-api-key" class="api-key-label">
            MCP Max API Key:
            ${hasMaxApiKey ? '<span class="key-status saved">✓ Saved</span>' : '<span class="key-status missing">Required for advanced features</span>'}
          </label>
          <div class="api-key-input-group">
            <input 
              type="password" 
              id="mcp-max-api-key" 
              class="api-key-input" 
              placeholder="${hasMaxApiKey ? '••••••••••••••••' : 'mcp-max-key-...'}"
              value="${savedMaxApiKey}"
            />
            <button id="save-max-api-key" class="btn btn-sm btn-primary">
              ${hasMaxApiKey ? 'Update' : 'Authenticate'}
            </button>
          </div>
          <div class="api-key-help">
            <small>Demo Mode: Any key starting with "mcp-max-" will work</small>
          </div>
        </div>
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
          <label for="anthropic-api-key" class="api-key-label">
            Anthropic API Key:
            ${hasApiKey ? '<span class="key-status saved">✓ Saved</span>' : '<span class="key-status missing">Required</span>'}
          </label>
          <div class="api-key-input-group">
            <input 
              type="password" 
              id="anthropic-api-key" 
              class="api-key-input" 
              placeholder="${hasApiKey ? '••••••••••••••••' : 'sk-ant-api03-...'}"
              value="${savedApiKey}"
            />
            <button id="save-api-key" class="btn btn-sm btn-primary">
              ${hasApiKey ? 'Update' : 'Save'}
            </button>
          </div>
          <div class="api-key-help">
            Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank">Anthropic Console</a>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mode toggle buttons
    const toggleButtons = this.container.querySelectorAll('.toggle-option');
    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.mode;
        if (mode !== this.currentMode) {
          this.switchMode(mode);
        }
      });
    });
    
    // Direct mode: API key save button
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
    
    // MCP mode: Check server button
    const checkServerButton = document.getElementById('check-mcp-server');
    if (checkServerButton) {
      checkServerButton.addEventListener('click', () => {
        this.checkMcpServer();
      });
    }
    
    // MCP Max mode: API key save button
    const saveMaxKeyButton = document.getElementById('save-max-api-key');
    const maxApiKeyInput = document.getElementById('mcp-max-api-key');
    
    if (saveMaxKeyButton && maxApiKeyInput) {
      saveMaxKeyButton.addEventListener('click', () => {
        this.saveMcpMaxApiKey(maxApiKeyInput.value);
      });
      
      // Save on Enter key
      maxApiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveMcpMaxApiKey(maxApiKeyInput.value);
        }
      });
    }
    
    // Auto-check MCP server status if in MCP mode
    if (this.isMcpMode()) {
      setTimeout(() => this.checkMcpServer(), 500);
    }
  }
  
  /**
   * Switch connection mode
   * @param {string} mode - New mode ('mcp' or 'direct')
   */
  async switchMode(mode) {
    if (!this.modes[mode]) return;
    
    this.currentMode = mode;
    localStorage.setItem('connectionMode', mode);
    
    // Emit server capability change for UI restrictions
    this.emitServerCapabilities();
    
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
   * Check MCP server connection
   */
  async checkMcpServer() {
    const statusIndicator = document.getElementById('mcp-status-indicator');
    if (!statusIndicator) return;
    
    statusIndicator.textContent = 'Checking...';
    statusIndicator.className = 'status-indicator checking';
    
    try {
      const serverUrl = this.modes[this.currentMode]?.serverUrl || 'http://localhost:3001';
    const response = await fetch(`${serverUrl}/health`);
      
      if (response.ok) {
        const health = await response.json();
        statusIndicator.textContent = '✓ Connected';
        statusIndicator.className = 'status-indicator connected';
        
        globalEvents.emit('ui:notification', {
          type: 'success',
          message: `MCP server connected: ${health.server.name}`
        });
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      statusIndicator.textContent = '✗ Disconnected';
      statusIndicator.className = 'status-indicator disconnected';
      
      globalEvents.emit('ui:notification', {
        type: 'error',
        message: 'MCP server not running on localhost:3001. Please start the server first.'
      });
    }
  }
  
  /**
   * Validate connection setup
   */
  validateConnection() {
    if (this.currentMode === 'direct') {
      return this.validateApiKey();
    } else if (this.currentMode === 'mcp') {
      return true; // MCP server handles auth
    }
    return false;
  }
  
  /**
   * Validate API key setup (for direct mode)
   */
  validateApiKey() {
    const hasApiKey = localStorage.getItem('anthropicApiKey');
    if (!hasApiKey) {
      // Focus on API key input
      const apiKeyInput = document.getElementById('anthropic-api-key');
      if (apiKeyInput) {
        apiKeyInput.focus();
      }
      
      // Show warning
      globalEvents.emit('ui:notification', {
        type: 'warning',
        message: 'Please enter your Anthropic API key to start chatting'
      });
      return false;
    }
    return true;
  }
  
  /**
   * Save API key
   * @param {string} apiKey - API key to save
   */
  saveApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      globalEvents.emit('ui:notification', {
        type: 'error',
        message: 'Please enter a valid API key'
      });
      return;
    }
    
    // Basic validation
    if (!apiKey.startsWith('sk-ant-')) {
      globalEvents.emit('ui:notification', {
        type: 'warning',
        message: 'API key should start with "sk-ant-"'
      });
    }
    
    // Save to localStorage (in production, this should be handled more securely)
    localStorage.setItem('anthropicApiKey', apiKey.trim());
    
    // Update UI
    const keyStatus = this.container.querySelector('.key-status');
    if (keyStatus) {
      keyStatus.textContent = '✓ Saved';
      keyStatus.className = 'key-status saved';
    }
    
    // Update button text
    const saveButton = document.getElementById('save-api-key');
    if (saveButton) {
      saveButton.textContent = 'Update';
    }
    
    // Emit event
    globalEvents.emit('connection:apiKeyUpdated', { hasKey: true });
    
    globalEvents.emit('ui:notification', {
      type: 'success',
      message: 'API key saved successfully'
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
  
  /**
   * Check if current mode is MCP (base or max)
   * @returns {boolean} True if MCP mode
   */
  isMcpMode() {
    return this.currentMode === 'mcp-base' || this.currentMode === 'mcp-max';
  }
  
  /**
   * Check if current mode supports advanced features
   * @returns {boolean} True if MCP Max mode
   */
  supportsAdvancedFeatures() {
    return this.currentMode === 'mcp-max';
  }
  
  /**
   * Get server capabilities based on current mode
   * @returns {Object} Server capabilities
   */
  getServerCapabilities() {
    return {
      mode: this.currentMode,
      serverUrl: this.modes[this.currentMode]?.serverUrl,
      features: this.modes[this.currentMode]?.features || [],
      supportsContextObjects: this.currentMode === 'mcp-max' && this.isMcpMaxAuthenticated(),
      supportsAIModes: this.currentMode === 'mcp-max' && this.isMcpMaxAuthenticated(),
      supportsBasicSystemPrompts: true, // Both servers support basic prompts
      supportsAdvancedSystemPrompts: this.currentMode === 'mcp-max' && this.isMcpMaxAuthenticated(),
      supportsSessions: this.currentMode === 'mcp-max' && this.isMcpMaxAuthenticated(),
      isAuthenticated: this.currentMode === 'mcp-max' ? this.isMcpMaxAuthenticated() : true
    };
  }
  
  /**
   * Emit server capabilities for UI restrictions
   */
  emitServerCapabilities() {
    const capabilities = this.getServerCapabilities();
    globalEvents.emit('connection:capabilitiesChanged', capabilities);
  }
  
  /**
   * Save MCP Max API key (mock authentication)
   * @param {string} apiKey - API key to save
   */
  saveMcpMaxApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      globalEvents.emit('ui:notification', {
        type: 'error',
        message: 'Please enter a valid MCP Max API key'
      });
      return;
    }
    
    // Mock validation - accept any key starting with "mcp-max-"
    if (!apiKey.startsWith('mcp-max-')) {
      globalEvents.emit('ui:notification', {
        type: 'warning',
        message: 'Demo Mode: API key should start with "mcp-max-"'
      });
    }
    
    // Save to localStorage
    localStorage.setItem('mcpMaxApiKey', apiKey.trim());
    
    // Update UI
    const keyStatus = this.container.querySelector('.max-server-auth-section .key-status');
    if (keyStatus) {
      keyStatus.textContent = '✓ Saved';
      keyStatus.className = 'key-status saved';
    }
    
    // Update button text
    const saveButton = document.getElementById('save-max-api-key');
    if (saveButton) {
      saveButton.textContent = 'Update';
    }
    
    // Emit event and update capabilities
    globalEvents.emit('connection:mcpMaxAuthenticated', { hasKey: true });
    this.emitServerCapabilities();
    
    globalEvents.emit('ui:notification', {
      type: 'success',
      message: 'MCP Max API key saved successfully. Advanced features unlocked!'
    });
  }
  
  /**
   * Check if MCP Max is authenticated
   * @returns {boolean} True if MCP Max API key exists
   */
  isMcpMaxAuthenticated() {
    if (this.currentMode !== 'mcp-max') return false;
    const apiKey = localStorage.getItem('mcpMaxApiKey');
    return !!apiKey && apiKey.startsWith('mcp-max-');
  }
}

// Export singleton instance
export const connectionToggle = new ConnectionToggle();
export default connectionToggle;