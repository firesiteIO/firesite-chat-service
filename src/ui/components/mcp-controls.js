/**
 * MCP Controls Component
 * Handles MCP server switching and AI mode selection UI
 */

export class MCPControlsComponent {
  constructor(streamingService) {
    this.streamingService = streamingService;
    this.elements = {};
    this.initialized = false;
  }

  /**
   * Initialize the component
   */
  init() {
    if (this.initialized) return;
    this._cacheElements();
    this._bindEvents();
    this._updateStatus();
    this.initialized = true;
  }

  /**
   * Cache DOM elements
   */
  _cacheElements() {
    this.elements = {
      mcpServerSelect: document.getElementById('mcp-server-select'),
      aiModeSelect: document.getElementById('ai-mode-select'),
      aiModeControls: document.querySelector('.ai-mode-controls'),
      statusContainer: document.getElementById('status')
    };
  }

  /**
   * Bind event listeners
   */
  _bindEvents() {
    // MCP Server selection
    this.elements.mcpServerSelect?.addEventListener('change', async (e) => {
      await this._handleServerChange(e.target.value);
    });

    // AI Mode selection
    this.elements.aiModeSelect?.addEventListener('change', async (e) => {
      await this._handleAIModeChange(e.target.value);
    });

    // Listen for streaming service events
    window.addEventListener('mcpStatusUpdate', (e) => {
      this._updateStatus(e.detail);
    });
  }

  /**
   * Handle MCP server switching
   */
  async _handleServerChange(serverMode) {
    try {
      this._showStatus('Switching server...', 'connecting');
      
      const success = await this.streamingService.switchMCPServer(serverMode);
      
      if (success) {
        this._showStatus(`Connected to ${serverMode} server`, 'connected');
        
        // Show/hide AI mode controls based on server
        if (this.elements.aiModeControls) {
          this.elements.aiModeControls.style.display = 
            serverMode === 'max' ? 'flex' : 'none';
        }
        
        // If switching to Max server, set default AI mode after a brief delay
        if (serverMode === 'max' && this.elements.aiModeSelect) {
          // Small delay to ensure session is fully created
          setTimeout(async () => {
            const defaultMode = this.elements.aiModeSelect.value || 'development';
            await this._handleAIModeChange(defaultMode);
          }, 500);
        }
      } else {
        this._showStatus(`Failed to connect to ${serverMode} server`, 'disconnected');
        // Revert select to previous value
        const currentMode = this.streamingService.mcpServerManager.currentMode;
        this.elements.mcpServerSelect.value = currentMode;
      }
    } catch (error) {
      console.error('Error switching MCP server:', error);
      this._showStatus('Server switch failed', 'disconnected');
    }
  }

  /**
   * Handle AI mode change
   */
  async _handleAIModeChange(mode) {
    try {
      const success = await this.streamingService.setAIMode(mode);
      
      if (success) {
        this._showStatus(`AI Mode: ${this._formatModeName(mode)}`, 'connected');
      } else {
        this._showStatus('Failed to set AI mode', 'disconnected');
      }
    } catch (error) {
      console.error('Error setting AI mode:', error);
      this._showStatus('AI mode change failed', 'disconnected');
    }
  }

  /**
   * Show status message
   */
  _showStatus(message, type = 'connected') {
    if (!this.elements.statusContainer) return;

    const statusHtml = `
      <div class="mcp-status ${type}">
        <div class="mcp-status-dot"></div>
        ${message}
      </div>
    `;
    
    this.elements.statusContainer.innerHTML = statusHtml;
  }

  /**
   * Update status from MCP server manager
   */
  _updateStatus(statusData = null) {
    const status = statusData || this.streamingService.mcpServerManager.getStatus();
    
    if (!status) return;

    const serverType = status.mode === 'max' ? 'Max' : 'Base';
    const connectionStatus = status.isConnected ? 'connected' : 'disconnected';
    
    let statusMessage = `${serverType} Server`;
    
    if (status.context?.aiMode) {
      statusMessage += ` • ${this._formatModeName(status.context.aiMode)}`;
    }
    
    this._showStatus(statusMessage, connectionStatus);

    // Update UI state
    if (this.elements.mcpServerSelect) {
      this.elements.mcpServerSelect.value = status.mode;
    }

    if (this.elements.aiModeControls) {
      this.elements.aiModeControls.style.display = 
        status.mode === 'max' ? 'flex' : 'none';
    }
  }

  /**
   * Format mode name for display
   */
  _formatModeName(mode) {
    const modeNames = {
      'development': 'Developer',
      'planning': 'Planner',
      'testing': 'Tester',
      'documentation': 'Documenter',
      'analysis': 'Analyst',
      'review': 'Reviewer',
      'research': 'Researcher'
    };
    
    return modeNames[mode] || mode;
  }

  /**
   * Set context objects (MMCO, UACP)
   */
  async setContextObjects(mmcoContext = null, uacpContext = null) {
    try {
      if (mmcoContext) {
        await this.streamingService.setMMCOContext(mmcoContext);
      }
      
      if (uacpContext) {
        await this.streamingService.setUACPContext(uacpContext);
      }
      
      this._showStatus('Context updated', 'connected');
    } catch (error) {
      console.error('Error setting context objects:', error);
      this._showStatus('Context update failed', 'disconnected');
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfig() {
    const status = this.streamingService.mcpServerManager.getStatus();
    
    return {
      server: status.mode,
      aiMode: status.context?.aiMode,
      hasMMCO: status.context?.hasMMCO,
      hasUACP: status.context?.hasUACP,
      isConnected: status.isConnected
    };
  }

  /**
   * Destroy component
   */
  destroy() {
    // Remove event listeners
    this.elements.mcpServerSelect?.removeEventListener('change', this._handleServerChange);
    this.elements.aiModeSelect?.removeEventListener('change', this._handleAIModeChange);
    
    this.initialized = false;
  }
}

export default MCPControlsComponent;