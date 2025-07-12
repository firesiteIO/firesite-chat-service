/**
 * MCP Server Manager Service
 * Handles switching between base MCP server and MCP Max server
 * while maintaining seamless chat service integration
 */

export class MCPServerManager {
  constructor(options = {}) {
    this.options = {
      baseServerUrl: 'http://localhost:3001',
      maxServerUrl: 'http://localhost:3002',
      defaultMode: 'base',
      timeout: 10000,
      retryAttempts: 3,
      ...options
    };

    this.currentMode = this.options.defaultMode;
    this.currentServerUrl = this.getCurrentServerUrl();
    this.isConnected = false;
    this.eventSource = null;
    this.sessionId = null;
    
    // AI Mode and Context state
    this.currentAIMode = null;
    this.mmcoContext = null;
    this.uacpContext = null;
    this.pacpContext = null;
    
    this.initialize();
  }

  initialize() {
    console.log(`🚀 MCP Server Manager initialized in ${this.currentMode} mode`);
    console.log(`📡 Server URL: ${this.currentServerUrl}`);
  }

  /**
   * Switch between base and max servers
   */
  async switchToServer(mode) {
    if (mode === this.currentMode) {
      console.log(`Already using ${mode} server`);
      return true;
    }

    const previousMode = this.currentMode;
    console.log(`🔄 Switching from ${previousMode} to ${mode} server...`);

    try {
      // Disconnect from current server
      await this.disconnect();

      // Update configuration
      this.currentMode = mode;
      this.currentServerUrl = this.getCurrentServerUrl();

      // Test connection to new server
      const isAvailable = await this.testServerConnection();
      
      if (!isAvailable) {
        // Fallback to previous server
        console.warn(`❌ ${mode} server unavailable, falling back to ${previousMode}`);
        this.currentMode = previousMode;
        this.currentServerUrl = this.getCurrentServerUrl();
        return false;
      }

      // Create session if switching to Max server
      if (mode === 'max') {
        await this.createSession();
      }

      // Mark as connected after successful switch
      this.isConnected = true;

      console.log(`✅ Successfully switched to ${mode} server`);
      return true;

    } catch (error) {
      console.error(`💥 Error switching to ${mode} server:`, error);
      
      // Restore previous configuration
      this.currentMode = previousMode;
      this.currentServerUrl = this.getCurrentServerUrl();
      return false;
    }
  }

  /**
   * Test if a server is available
   */
  async testServerConnection(serverUrl = this.currentServerUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      return response.ok;

    } catch (error) {
      console.warn(`Server connection test failed for ${serverUrl}:`, error.message);
      return false;
    }
  }

  /**
   * Get current server URL based on mode
   */
  getCurrentServerUrl() {
    return this.currentMode === 'max' ? 
      this.options.maxServerUrl : 
      this.options.baseServerUrl;
  }

  /**
   * AI Mode Management (MCP Max only)
   */
  async setAIMode(mode, customPrompt = null) {
    if (this.currentMode !== 'max') {
      console.warn('AI Modes are only available in MCP Max mode');
      return false;
    }

    try {
      const payload = {
        role: mode,
        customPrompt: customPrompt
      };

      console.log(`🤖 Setting AI mode with payload:`, payload);

      const response = await fetch(`${this.currentServerUrl}/api/sessions/${this.sessionId}/ai-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this.currentAIMode = mode;
        console.log(`🤖 AI Mode set to: ${mode}`);
        return true;
      } else {
        console.error('Failed to set AI mode:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Error setting AI mode:', error);
      return false;
    }
  }

  /**
   * Context Management (MCP Max only)
   */
  async setMMCOContext(mmcoContext) {
    if (this.currentMode !== 'max') {
      console.warn('MMCO Context is only available in MCP Max mode');
      return false;
    }

    try {
      const response = await fetch(`${this.currentServerUrl}/api/sessions/${this.sessionId}/mmcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mmcoContext)
      });

      if (response.ok) {
        this.mmcoContext = mmcoContext;
        console.log('📋 MMCO Context updated');
        return true;
      } else {
        console.error('Failed to set MMCO context:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Error setting MMCO context:', error);
      return false;
    }
  }

  async setUACPContext(uacpContext) {
    if (this.currentMode !== 'max') {
      console.warn('UACP Context is only available in MCP Max mode');
      return false;
    }

    try {
      const response = await fetch(`${this.currentServerUrl}/api/sessions/${this.sessionId}/uacp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uacpContext)
      });

      if (response.ok) {
        this.uacpContext = uacpContext;
        console.log('🏢 UACP Context updated');
        return true;
      } else {
        console.error('Failed to set UACP context:', await response.text());
        return false;
      }

    } catch (error) {
      console.error('Error setting UACP context:', error);
      return false;
    }
  }

  /**
   * Create a new session (MCP Max only)
   */
  async createSession(initialContext = {}) {
    if (this.currentMode !== 'max') {
      // For base server, no session management needed
      this.sessionId = 'default';
      return this.sessionId;
    }

    try {
      const response = await fetch(`${this.currentServerUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(initialContext)
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = data.session?.sessionId || data.sessionId;
        console.log(`🎯 Session created: ${this.sessionId}`);
        return this.sessionId;
      } else {
        console.error('Failed to create session:', await response.text());
        return null;
      }

    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  /**
   * Connect to MCP server via SSE
   */
  async connect() {
    if (this.isConnected) {
      console.log('Already connected to MCP server');
      return true;
    }

    try {
      // Test server availability first
      const isAvailable = await this.testServerConnection();
      if (!isAvailable) {
        throw new Error(`Server at ${this.currentServerUrl} is not available`);
      }

      // Create session if needed (MCP Max)
      if (this.currentMode === 'max' && !this.sessionId) {
        await this.createSession();
      }

      // Establish SSE connection
      const sseEndpoint = this.currentMode === 'max' ? 
        `/mcp/sse/${this.sessionId}` : 
        '/mcp/sse';

      this.eventSource = new EventSource(`${this.currentServerUrl}${sseEndpoint}`);
      
      this.eventSource.onopen = () => {
        this.isConnected = true;
        console.log(`✅ Connected to ${this.currentMode} MCP server`);
      };

      this.eventSource.onerror = (error) => {
        console.error(`💥 SSE connection error:`, error);
        this.isConnected = false;
      };

      return true;

    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from current server
   */
  async disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
    console.log(`🔌 Disconnected from ${this.currentMode} server`);
  }

  /**
   * Send message to MCP server
   */
  async sendMessage(content, options = {}) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const payload = {
        content: content,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        ...options
      };

      const response = await fetch(`${this.currentServerUrl}/mcp/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error sending message to MCP server:', error);
      throw error;
    }
  }

  /**
   * Get current server status and capabilities
   */
  getStatus() {
    return {
      mode: this.currentMode,
      serverUrl: this.currentServerUrl,
      isConnected: this.isConnected,
      sessionId: this.sessionId,
      capabilities: {
        aiModes: this.currentMode === 'max',
        contextObjects: this.currentMode === 'max',
        sessions: this.currentMode === 'max'
      },
      context: {
        aiMode: this.currentAIMode,
        hasMMCO: !!this.mmcoContext,
        hasUACP: !!this.uacpContext,
        hasPACP: !!this.pacpContext
      }
    };
  }

  /**
   * Auto-fallback mechanism
   */
  async ensureConnection() {
    if (this.isConnected) return true;

    console.log(`🔄 Attempting to reconnect to ${this.currentMode} server...`);
    
    const connected = await this.connect();
    
    if (!connected && this.currentMode === 'max') {
      console.log('🚨 MCP Max unavailable, falling back to base server');
      await this.switchToServer('base');
      return await this.connect();
    }
    
    return connected;
  }
}

// Export singleton instance
export const mcpServerManager = new MCPServerManager();
export default mcpServerManager;