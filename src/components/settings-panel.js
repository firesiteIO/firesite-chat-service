/**
 * Settings Panel Component - Slide-out configuration panel
 * Provides access to modes, prompts, and context configuration
 */

import { globalEvents } from '../core/events/event-emitter.js';
import { contextManager } from '../services/context/context-manager.service.js';
import { streamDisplaySettings } from '../services/ui/stream-display-settings.service.js';
import { upgradeModal } from './upgrade-modal.js';
import { connectionToggle } from './connection-toggle.js';

export class SettingsPanel {
  constructor() {
    this.isOpen = false;
    this.panel = null;
    this.overlay = null;
    this.initialized = false;
    this.serverCapabilities = null;
  }

  /**
   * Initialize the settings panel
   */
  initialize() {
    if (this.initialized) return;
    
    this.createPanel();
    this.setupEventListeners();
    this.loadSavedSettings();
    this.updateServerCapabilities();
    
    this.initialized = true;
    console.log('Settings panel initialized');
    
    // Create test buttons in main area
    this.createTestButtonsInMainArea();
  }

  /**
   * Create the panel DOM structure
   */
  createPanel() {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';
    this.overlay.style.display = 'none';
    
    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = 'settings-panel';
    this.panel.innerHTML = `
      <div class="settings-header">
        <h2>Chat Configuration</h2>
        <button class="settings-close" aria-label="Close settings">✕</button>
      </div>
      
      <!-- Settings Tab Navigation -->
      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="context">Context Settings</button>
        <button class="settings-tab" data-tab="chat-options">Chat Options</button>
      </div>
      
      <div class="settings-content">
        <!-- Context Settings Tab -->
        <div class="settings-tab-content active" id="context-tab">
          <!-- AI Mode Selection -->
          <section class="settings-section" data-requires="ai-modes">
            <h3>AI Mode <span class="feature-badge">MCP Max</span></h3>
            <p class="settings-description">Specialized AI roles with persistent context</p>
            <select id="ai-mode" class="settings-select">
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="analyst">Analyst</option>
              <option value="writer">Writer</option>
              <option value="reviewer">Code Reviewer</option>
              <option value="architect">Software Architect</option>
              <option value="custom">Custom</option>
            </select>
            <div class="feature-restriction-overlay">
              <div class="restriction-content">
                <div class="restriction-icon">🤖</div>
                <h4>MCP Max Required</h4>
                <p>Specialized AI roles with context awareness and memory require MCP Max server.</p>
                <button class="btn btn-primary btn-sm upgrade-btn" data-feature="ai-modes">Upgrade to MCP Max</button>
              </div>
            </div>
          </section>
          
          <!-- System Prompt -->
          <section class="settings-section">
            <h3>System Prompt</h3>
            <p class="settings-description">Basic system prompt (available on both servers)</p>
            <textarea id="system-prompt" class="settings-textarea" rows="4" 
              placeholder="Enter custom system prompt..."></textarea>
            <button class="btn btn-secondary btn-sm" id="reset-prompt">Reset to Default</button>
            <div class="server-info-note">
              <p><strong>Note:</strong> Base Server supports basic system prompts. MCP Max adds AI role integration and context awareness.</p>
            </div>
          </section>
          
          <!-- MMCO Configuration -->
          <section class="settings-section" data-requires="context-objects">
            <h3>MMCO (Micro Meta Context Objects) <span class="feature-badge">MCP Max</span></h3>
            <p class="settings-description">Project/task specific context</p>
            <textarea id="mmco-context" class="settings-textarea" rows="6" 
              placeholder='{\n  "project": "Testing Suite v2",\n  "focus": "streaming markdown",\n  "constraints": ["zero re-renders", "progressive enhancement"]\n}'></textarea>
            <button class="btn btn-secondary btn-sm" id="validate-mmco">Validate JSON</button>
            <div class="feature-restriction-overlay">
              <div class="restriction-content">
                <div class="restriction-icon">🧠</div>
                <h4>MCP Max Required</h4>
                <p>Context objects provide AI with persistent project memory and awareness.</p>
                <button class="btn btn-primary btn-sm upgrade-btn" data-feature="context-objects">Upgrade to MCP Max</button>
              </div>
            </div>
          </section>
          
          <!-- UACP Configuration -->
          <section class="settings-section" data-requires="context-objects">
            <h3>UACP (Universal AI Context Profile) <span class="feature-badge">MCP Max</span></h3>
            <p class="settings-description">Business/product context</p>
            <textarea id="uacp-context" class="settings-textarea" rows="4" 
              placeholder="Firesite MCP Max - Revolutionary streaming markdown service with service-first architecture"></textarea>
            <div class="feature-restriction-overlay">
              <div class="restriction-content">
                <div class="restriction-icon">🏢</div>
                <h4>MCP Max Required</h4>
                <p>Business context helps AI understand your company and product details.</p>
                <button class="btn btn-primary btn-sm upgrade-btn" data-feature="context-objects">Upgrade to MCP Max</button>
              </div>
            </div>
          </section>
          
          <!-- PACP Configuration -->
          <section class="settings-section" data-requires="context-objects">
            <h3>PACP (Personal AI Context Profile) <span class="feature-badge">MCP Max</span></h3>
            <p class="settings-description">Individual preferences and style</p>
            <textarea id="pacp-context" class="settings-textarea" rows="4" 
              placeholder='{\n  "preferredStyle": "concise and technical",\n  "focusAreas": ["performance", "architecture"],\n  "avoidTopics": []\n}'></textarea>
            <button class="btn btn-secondary btn-sm" id="validate-pacp">Validate JSON</button>
            <div class="feature-restriction-overlay">
              <div class="restriction-content">
                <div class="restriction-icon">👤</div>
                <h4>MCP Max Required</h4>
                <p>Personal context adapts AI communication to your preferred style.</p>
                <button class="btn btn-primary btn-sm upgrade-btn" data-feature="context-objects">Upgrade to MCP Max</button>
              </div>
            </div>
          </section>
          
          <!-- Quick Prompts -->
          <section class="settings-section">
            <h3>Quick Prompts</h3>
            <div class="quick-prompts">
              <button class="prompt-chip" data-prompt="Explain this code">Explain Code</button>
              <button class="prompt-chip" data-prompt="Find potential bugs">Find Bugs</button>
              <button class="prompt-chip" data-prompt="Suggest improvements">Improve Code</button>
              <button class="prompt-chip" data-prompt="Write tests for this">Write Tests</button>
              <button class="prompt-chip" data-prompt="Add documentation">Add Docs</button>
              <button class="prompt-chip" data-prompt="Refactor for performance">Optimize</button>
            </div>
          </section>
          
          <!-- Advanced Options -->
          <section class="settings-section">
            <h3>Advanced Options</h3>
            <label class="settings-checkbox">
              <input type="checkbox" id="enable-thinking" checked>
              <span>Show Claude's thinking process</span>
            </label>
            <label class="settings-checkbox">
              <input type="checkbox" id="enable-artifacts" checked>
              <span>Enable code artifacts</span>
            </label>
            <label class="settings-checkbox">
              <input type="checkbox" id="stream-tokens" checked>
              <span>Stream response tokens</span>
            </label>
          </section>
          
          <!-- Testing Features Toggle -->
          <section class="settings-section">
            <h3>Testing Features</h3>
            <p class="settings-description">Enable quick test buttons for development</p>
            
            <div class="settings-toggle-group">
              <label class="settings-toggle-label">
                <strong>Show test buttons</strong>
                <span class="settings-description">Display "Markdown Test" and "Generate Plain Text" buttons above chat</span>
              </label>
              <button class="settings-toggle-button" id="testing-features-toggle" aria-pressed="false">
                <span class="toggle-slider"></span>
              </button>
            </div>
          </section>
        </div>
        
        <!-- Chat Options Tab -->
        <div class="settings-tab-content" id="chat-options-tab">
          <!-- Natural Typing Settings -->
          <section class="settings-section">
            <h3>Natural Typing</h3>
            <p class="settings-description">Control the character-by-character streaming display</p>
            
            <div class="settings-toggle-group">
              <label class="settings-toggle-label">Enable Natural Typing</label>
              <button class="settings-toggle-button active" id="settings-natural-typing-toggle" aria-pressed="true">
                <span class="toggle-slider"></span>
              </button>
            </div>
            
            <div class="settings-subsection">
              <h4>Speed Settings</h4>
              <div class="slider-group">
                <label class="slider-label">
                  <span>Base Speed (10-50ms)</span>
                  <input type="range" id="typing-speed" min="10" max="50" value="20" class="settings-slider">
                  <span class="slider-value">20ms</span>
                </label>
              </div>
              
              <div class="slider-group">
                <label class="slider-label">
                  <span>Variability (0-50%)</span>
                  <input type="range" id="typing-variability" min="0" max="50" value="20" class="settings-slider">
                  <span class="slider-value">20%</span>
                </label>
              </div>
              
              <div class="slider-group">
                <label class="slider-label">
                  <span>Punctuation Pause (0-100ms)</span>
                  <input type="range" id="punctuation-pause" min="0" max="100" value="40" class="settings-slider">
                  <span class="slider-value">40ms</span>
                </label>
              </div>
            </div>
          </section>
          
          <!-- Element Animation Options -->
          <section class="settings-section">
            <h3>Element Animation Options</h3>
            <p class="settings-description">Choose how different markdown elements appear</p>
            
            <div class="animation-options">
              <div class="animation-option">
                <label>Code Blocks</label>
                <select class="settings-select-small" id="code-animation">
                  <option value="fade">Fade In</option>
                  <option value="immediate" selected>Immediate</option>
                </select>
              </div>
              
              <div class="animation-option">
                <label>Headers</label>
                <select class="settings-select-small" id="header-animation">
                  <option value="scale">Scale In</option>
                  <option value="immediate" selected>Immediate</option>
                </select>
              </div>
              
              <div class="animation-option">
                <label>Lists</label>
                <select class="settings-select-small" id="list-animation">
                  <option value="pop">Pop In</option>
                  <option value="immediate" selected>Immediate</option>
                </select>
              </div>
              
              <div class="animation-option">
                <label>Tables</label>
                <select class="settings-select-small" id="table-animation">
                  <option value="progressive">Progressive</option>
                  <option value="immediate" selected>Immediate</option>
                </select>
              </div>
            </div>
          </section>
          
          <!-- Advanced Options -->
          <section class="settings-section">
            <h3>Advanced Options</h3>
            <p class="settings-description">Fine-tune the streaming experience</p>
            
            <div class="slider-group">
              <label class="slider-label">
                <span>Buffer Time (100-500ms)</span>
                <input type="range" id="buffer-time" min="100" max="500" value="300" class="settings-slider">
                <span class="slider-value">300ms</span>
              </label>
            </div>
            
            <div class="slider-group">
              <label class="slider-label">
                <span>Paragraph Pause (0-200ms)</span>
                <input type="range" id="paragraph-pause" min="0" max="200" value="100" class="settings-slider">
                <span class="slider-value">100ms</span>
              </label>
            </div>
            
            <div class="settings-subsection">
              <h4>Preview Mode</h4>
              <label class="settings-radio">
                <input type="radio" name="preview-mode" value="none" checked>
                <span>None</span>
              </label>
              <label class="settings-radio">
                <input type="radio" name="preview-mode" value="ghost">
                <span>Ghost Preview</span>
              </label>
            </div>
          </section>
        </div>
      </div>
      
      <div class="settings-footer">
        <button class="btn btn-primary" id="apply-settings">Apply Changes</button>
        <button class="btn btn-secondary" id="save-preset">Save as Preset</button>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.panel);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    this.panel.querySelector('.settings-close').addEventListener('click', () => {
      this.close();
    });
    
    // Overlay click
    this.overlay.addEventListener('click', () => {
      this.close();
    });
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
    
    // Tab navigation
    this.panel.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });
    
    // Testing features toggle - now controls main area buttons
    const testingToggle = this.panel.querySelector('#testing-features-toggle');
    
    testingToggle.addEventListener('click', () => {
      const isActive = testingToggle.classList.contains('active');
      const newState = !isActive;
      
      testingToggle.classList.toggle('active', newState);
      testingToggle.setAttribute('aria-pressed', newState.toString());
      
      // Show/hide test buttons in main area
      this.toggleTestButtonsInMainArea(newState);
      
      // Save state
      localStorage.setItem('testingFeaturesEnabled', newState.toString());
    });
    
    // Load saved state and show/hide buttons accordingly
    const savedTestingState = localStorage.getItem('testingFeaturesEnabled') === 'true';
    if (savedTestingState) {
      testingToggle.classList.add('active');
      testingToggle.setAttribute('aria-pressed', 'true');
      // Will be applied when main area buttons are created
    }
    
    // Settings toggle button (the gear icon)
    const settingsToggle = document.getElementById('settings-toggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => {
        this.toggle();
      });
    }
    
    // Mode change
    const modeSelect = this.panel.querySelector('#ai-mode');
    modeSelect.addEventListener('change', (e) => {
      this.handleModeChange(e.target.value);
    });
    
    // Apply settings
    this.panel.querySelector('#apply-settings').addEventListener('click', () => {
      this.applySettings();
    });
    
    // Reset prompt
    this.panel.querySelector('#reset-prompt').addEventListener('click', () => {
      this.resetSystemPrompt();
    });
    
    // Validate JSON buttons
    this.panel.querySelector('#validate-mmco').addEventListener('click', () => {
      this.validateJSON('mmco-context');
    });
    
    this.panel.querySelector('#validate-pacp').addEventListener('click', () => {
      this.validateJSON('pacp-context');
    });
    
    // Quick prompts
    this.panel.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.insertQuickPrompt(e.target.dataset.prompt);
      });
    });
    
    // Save preset
    this.panel.querySelector('#save-preset').addEventListener('click', () => {
      this.savePreset();
    });
    
    // Slider event listeners
    this.setupSliderEventListeners();
  }
  
  /**
   * Setup slider event listeners
   */
  setupSliderEventListeners() {
    // All sliders with live value updates
    const sliders = this.panel.querySelectorAll('.settings-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const valueSpan = e.target.parentElement.querySelector('.slider-value');
        let value = e.target.value;
        
        // Add appropriate unit
        if (e.target.id.includes('speed') || e.target.id.includes('pause') || e.target.id.includes('time')) {
          value += 'ms';
        } else if (e.target.id.includes('variability')) {
          value += '%';
        }
        
        valueSpan.textContent = value;
        
        // Update stream display settings
        this.updateStreamSetting(e.target.id, parseInt(e.target.value));
      });
    });
    
    // Natural typing toggle button
    const settingsToggle = this.panel.querySelector('#settings-natural-typing-toggle');
    
    if (settingsToggle) {
      settingsToggle.addEventListener('click', (e) => {
        const isActive = settingsToggle.classList.contains('active');
        const newState = !isActive;
        
        // Update button state
        settingsToggle.classList.toggle('active', newState);
        settingsToggle.setAttribute('aria-pressed', newState.toString());
        
        // Update stream settings
        streamDisplaySettings.updateSetting('naturalTyping.enabled', newState);
      });
    }
    
    // Animation dropdowns
    const animationSelects = [
      'code-animation',
      'header-animation', 
      'list-animation',
      'table-animation'
    ];
    
    animationSelects.forEach(selectId => {
      const select = this.panel.querySelector(`#${selectId}`);
      if (select) {
        select.addEventListener('change', (e) => {
          const animationType = selectId.replace('-animation', '');
          const settingKey = `animations.${animationType}s`; // Note: pluralized for settings object
          streamDisplaySettings.updateSetting(settingKey, e.target.value !== 'immediate');
        });
      }
    });
    
    // Preview mode radio buttons
    const previewRadios = this.panel.querySelectorAll('input[name="preview-mode"]');
    previewRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          streamDisplaySettings.updateSetting('advanced.previewMode', e.target.value !== 'none');
        }
      });
    });
    
    // Server capability change listener
    globalEvents.on('connection:capabilitiesChanged', (capabilities) => {
      console.log('Settings panel received capability change:', capabilities);
      this.updateServerCapabilities(capabilities);
    });
    
    // MCP Max authentication listener
    globalEvents.on('connection:mcpMaxAuthenticated', () => {
      console.log('MCP Max authenticated, updating capabilities');
      this.updateServerCapabilities();
    });
    
    // Upgrade button listeners
    this.panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('upgrade-btn')) {
        const feature = e.target.dataset.feature;
        upgradeModal.show(feature, {
          currentAttempt: `configure ${feature}`
        });
      }
    });
    
    // Upgrade modal listener
    globalEvents.on('upgrade:switchToMax', () => {
      this.handleUpgradeToMax();
    });
  }
  
  /**
   * Update server capabilities and restrictions
   */
  updateServerCapabilities(capabilities = null) {
    this.serverCapabilities = capabilities || connectionToggle.getServerCapabilities();
    this.applyFeatureRestrictions();
  }
  
  /**
   * Apply feature restrictions based on server capabilities
   */
  applyFeatureRestrictions() {
    if (!this.serverCapabilities) return;
    
    const restrictedSections = this.panel.querySelectorAll('[data-requires]');
    
    restrictedSections.forEach(section => {
      const requirement = section.dataset.requires;
      let isAllowed = false;
      
      switch (requirement) {
        case 'context-objects':
          isAllowed = this.serverCapabilities.supportsContextObjects;
          break;
        case 'ai-modes':
          isAllowed = this.serverCapabilities.supportsAIModes;
          break;
        case 'advanced-system-prompts':
          isAllowed = this.serverCapabilities.supportsAdvancedSystemPrompts;
          break;
        case 'sessions':
          isAllowed = this.serverCapabilities.supportsSessions;
          break;
        default:
          isAllowed = true;
      }
      
      // Apply restriction styling
      section.classList.toggle('feature-restricted', !isAllowed);
      
      // Disable form elements if restricted
      if (!isAllowed) {
        const formElements = section.querySelectorAll('input, textarea, select, button:not(.upgrade-btn)');
        formElements.forEach(element => {
          element.disabled = true;
          element.setAttribute('data-restriction-disabled', 'true');
        });
        
        // Show restriction overlay
        const overlay = section.querySelector('.feature-restriction-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
        }
      } else {
        // Re-enable form elements
        const formElements = section.querySelectorAll('[data-restriction-disabled]');
        formElements.forEach(element => {
          element.disabled = false;
          element.removeAttribute('data-restriction-disabled');
        });
        
        // Hide restriction overlay
        const overlay = section.querySelector('.feature-restriction-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      }
    });
  }
  
  /**
   * Handle upgrade to MCP Max
   */
  handleUpgradeToMax() {
    // Switch connection mode to MCP Max
    connectionToggle.switchMode('mcp-max');
    
    // Show success notification
    globalEvents.emit('ui:notification', {
      type: 'success',
      message: 'Switched to MCP Max! Advanced features are now available.',
      duration: 4000
    });
  }
  
  /**
   * Update stream setting based on control ID
   */
  updateStreamSetting(controlId, value) {
    const settingMap = {
      'typing-speed': 'naturalTyping.baseSpeed',
      'typing-variability': 'naturalTyping.variability', 
      'punctuation-pause': 'naturalTyping.punctuationPause',
      'buffer-time': 'advanced.bufferTime',
      'paragraph-pause': 'advanced.paragraphPause'
    };
    
    const settingKey = settingMap[controlId];
    if (settingKey) {
      streamDisplaySettings.updateSetting(settingKey, value);
    }
  }
  
  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    this.panel.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    this.panel.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Show/hide footer buttons based on tab
    const footer = this.panel.querySelector('.settings-footer');
    if (footer) {
      // Only show footer for Context Settings tab
      footer.style.display = tabName === 'context' ? 'flex' : 'none';
    }
  }

  /**
   * Open the settings panel
   */
  open() {
    this.overlay.style.display = 'block';
    this.panel.classList.add('open');
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Load current settings
    this.loadCurrentSettings();
    this.loadStreamDisplaySettings();
    
    // Update server capabilities when opening
    this.updateServerCapabilities();
    
    // Ensure footer visibility is correct for default tab (context)
    const footer = this.panel.querySelector('.settings-footer');
    if (footer) {
      footer.style.display = 'flex'; // Context tab is active by default
    }
  }

  /**
   * Close the settings panel
   */
  close() {
    this.overlay.style.display = 'none';
    this.panel.classList.remove('open');
    this.isOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Toggle panel open/close
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Handle mode change
   */
  handleModeChange(mode) {
    const prompts = {
      developer: 'You are Claude, an AI assistant specialized in software development. Focus on code quality, best practices, and technical implementation details.',
      designer: 'You are Claude, an AI assistant specialized in UI/UX design. Focus on user experience, visual design, and interface patterns.',
      analyst: 'You are Claude, an AI assistant specialized in data analysis. Focus on insights, patterns, and data-driven recommendations.',
      writer: 'You are Claude, an AI assistant specialized in technical writing. Focus on clarity, documentation, and educational content.',
      reviewer: 'You are Claude, an AI assistant specialized in code review. Focus on finding issues, suggesting improvements, and ensuring best practices.',
      architect: 'You are Claude, an AI assistant specialized in software architecture. Focus on system design, scalability, and architectural patterns.',
      custom: ''
    };
    
    if (mode !== 'custom') {
      this.panel.querySelector('#system-prompt').value = prompts[mode];
    }
  }

  /**
   * Load current settings from context manager
   */
  loadCurrentSettings() {
    const context = contextManager.getAllContexts();
    
    // Set mode
    this.panel.querySelector('#ai-mode').value = context.aiRole || 'developer';
    
    // Set prompts and contexts
    this.panel.querySelector('#system-prompt').value = context.systemPrompt || '';
    
    if (context.mmco) {
      this.panel.querySelector('#mmco-context').value = JSON.stringify(context.mmco, null, 2);
    }
    
    if (context.uacp) {
      this.panel.querySelector('#uacp-context').value = context.uacp;
    }
    
    if (context.pacp) {
      this.panel.querySelector('#pacp-context').value = JSON.stringify(context.pacp, null, 2);
    }
  }
  
  /**
   * Load current stream display settings
   */
  loadStreamDisplaySettings() {
    const settings = streamDisplaySettings.getAllSettings();
    
    // Natural typing settings - update toggle button state
    const toggleButton = this.panel.querySelector('#settings-natural-typing-toggle');
    if (toggleButton) {
      toggleButton.classList.toggle('active', settings.naturalTyping.enabled);
      toggleButton.setAttribute('aria-pressed', settings.naturalTyping.enabled.toString());
    }
    this.panel.querySelector('#typing-speed').value = settings.naturalTyping.baseSpeed;
    this.panel.querySelector('#typing-variability').value = settings.naturalTyping.variability;
    this.panel.querySelector('#punctuation-pause').value = settings.naturalTyping.punctuationPause;
    
    // Advanced settings
    this.panel.querySelector('#buffer-time').value = settings.advanced.bufferTime;
    this.panel.querySelector('#paragraph-pause').value = settings.advanced.paragraphPause;
    
    // Animation settings
    const animationMap = {
      'code-animation': settings.animations.codeBlocks,
      'header-animation': settings.animations.headers,
      'list-animation': settings.animations.lists,
      'table-animation': settings.animations.tables
    };
    
    Object.entries(animationMap).forEach(([selectId, enabled]) => {
      const select = this.panel.querySelector(`#${selectId}`);
      if (select) {
        select.value = enabled ? select.options[0].value : 'immediate';
      }
    });
    
    // Preview mode
    const previewMode = settings.advanced.previewMode ? 'ghost' : 'none';
    const previewRadio = this.panel.querySelector(`input[name="preview-mode"][value="${previewMode}"]`);
    if (previewRadio) {
      previewRadio.checked = true;
    }
    
    // Update slider value displays
    this.updateSliderDisplays();
  }
  
  /**
   * Update slider value displays
   */
  updateSliderDisplays() {
    const sliders = this.panel.querySelectorAll('.settings-slider');
    sliders.forEach(slider => {
      const valueSpan = slider.parentElement.querySelector('.slider-value');
      if (valueSpan) {
        let value = slider.value;
        
        // Add appropriate unit
        if (slider.id.includes('speed') || slider.id.includes('pause') || slider.id.includes('time')) {
          value += 'ms';
        } else if (slider.id.includes('variability')) {
          value += '%';
        }
        
        valueSpan.textContent = value;
      }
    });
  }

  /**
   * Apply settings to context manager
   */
  applySettings() {
    try {
      const aiRole = this.panel.querySelector('#ai-mode').value;
      const systemPrompt = this.panel.querySelector('#system-prompt').value;
      const mmcoValue = this.panel.querySelector('#mmco-context').value;
      const uacpValue = this.panel.querySelector('#uacp-context').value;
      const pacpValue = this.panel.querySelector('#pacp-context').value;
      
      // Update each context using the appropriate method
      if (aiRole) {
        contextManager.updateAIRole(aiRole);
      }
      
      if (systemPrompt) {
        contextManager.updateSystemPrompt(systemPrompt);
      }
      
      if (mmcoValue && mmcoValue.trim()) {
        const mmco = this.parseJSON(mmcoValue);
        if (mmco) {
          contextManager.updateMMCO(mmco);
        }
      }
      
      if (uacpValue && uacpValue.trim()) {
        contextManager.updateUACP(uacpValue);
      }
      
      if (pacpValue && pacpValue.trim()) {
        const pacp = this.parseJSON(pacpValue);
        if (pacp) {
          contextManager.updatePACP(pacp);
        }
      }
      
      // Emit update event
      globalEvents.emit('settings:updated', {
        aiRole,
        systemPrompt,
        mmco: this.parseJSON(mmcoValue),
        uacp: uacpValue,
        pacp: this.parseJSON(pacpValue)
      });
      
      // Show success feedback
      this.showFeedback('Settings applied successfully!', 'success');
      
      // Close panel after short delay
      setTimeout(() => this.close(), 1000);
      
    } catch (error) {
      this.showFeedback(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Parse JSON safely
   */
  parseJSON(value) {
    if (!value || !value.trim()) return null;
    try {
      return JSON.parse(value);
    } catch (e) {
      return value; // Return as string if not valid JSON
    }
  }

  /**
   * Validate JSON in textarea
   */
  validateJSON(textareaId) {
    const textarea = this.panel.querySelector(`#${textareaId}`);
    const value = textarea.value.trim();
    
    if (!value) {
      this.showFeedback('Empty content', 'warning');
      return;
    }
    
    try {
      JSON.parse(value);
      this.showFeedback('Valid JSON!', 'success');
      
      // Pretty format
      textarea.value = JSON.stringify(JSON.parse(value), null, 2);
    } catch (error) {
      this.showFeedback(`Invalid JSON: ${error.message}`, 'error');
    }
  }

  /**
   * Reset system prompt to default
   */
  resetSystemPrompt() {
    const mode = this.panel.querySelector('#ai-mode').value;
    this.handleModeChange(mode);
  }

  /**
   * Insert quick prompt
   */
  insertQuickPrompt(prompt) {
    globalEvents.emit('settings:quickPrompt', { prompt });
    this.showFeedback('Prompt ready to send!', 'success');
  }

  /**
   * Save current settings as preset
   */
  savePreset() {
    const name = prompt('Enter preset name:');
    if (!name) return;
    
    const preset = {
      name,
      settings: {
        aiRole: this.panel.querySelector('#ai-mode').value,
        systemPrompt: this.panel.querySelector('#system-prompt').value,
        mmco: this.parseJSON(this.panel.querySelector('#mmco-context').value),
        uacp: this.panel.querySelector('#uacp-context').value,
        pacp: this.parseJSON(this.panel.querySelector('#pacp-context').value)
      }
    };
    
    // Save to localStorage
    const presets = JSON.parse(localStorage.getItem('chatPresets') || '[]');
    presets.push(preset);
    localStorage.setItem('chatPresets', JSON.stringify(presets));
    
    this.showFeedback('Preset saved!', 'success');
  }

  /**
   * Load saved settings from localStorage
   */
  loadSavedSettings() {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        contextManager.updateContext(settings);
      } catch (e) {
        console.warn('Failed to load saved settings:', e);
      }
    }
  }

  /**
   * Create test buttons in main content area
   */
  createTestButtonsInMainArea() {
    // Find the controls area in the main content
    const controlsHeader = document.querySelector('.controls-header');
    if (!controlsHeader) return;
    
    // Create test buttons container
    const testButtonsContainer = document.createElement('div');
    testButtonsContainer.id = 'test-buttons-container';
    testButtonsContainer.className = 'test-buttons-main-area';
    testButtonsContainer.style.display = 'none'; // Hidden by default
    
    testButtonsContainer.innerHTML = `
      <div class="test-buttons-header">
        <span class="test-label">Quick Tests:</span>
        <button class="test-button-main" id="test-markdown-complex">Markdown Test (Complex)</button>
        <button class="test-button-main" id="test-edge-cases">Edge Cases Test</button>
        <button class="test-button-main" id="test-plain-text">Generate Plain Text</button>
        <button class="test-button-main clear-button" id="test-clear-chat">Clear Chat</button>
      </div>
    `;
    
    // Insert after controls header
    controlsHeader.insertAdjacentElement('afterend', testButtonsContainer);
    
    // Add event listeners to test buttons
    document.getElementById('test-markdown-complex').addEventListener('click', () => {
      this.runMarkdownComplexTest();
    });
    
    document.getElementById('test-edge-cases').addEventListener('click', () => {
      this.runEdgeCasesTest();
    });
    
    document.getElementById('test-plain-text').addEventListener('click', () => {
      this.runPlainTextTest();
    });
    
    document.getElementById('test-clear-chat').addEventListener('click', () => {
      this.clearChatMessages();
    });
    
    // Show buttons if testing features are enabled
    const savedTestingState = localStorage.getItem('testingFeaturesEnabled') === 'true';
    if (savedTestingState) {
      testButtonsContainer.style.display = 'block';
    }
  }
  
  /**
   * Toggle test buttons visibility in main area
   */
  toggleTestButtonsInMainArea(show) {
    const container = document.getElementById('test-buttons-container');
    if (container) {
      container.style.display = show ? 'block' : 'none';
    }
  }
  
  /**
   * Run Markdown Complex Test - auto-feeds chat
   * EXACT function from testing suite v2 for consecutive output evaluation
   */
  runMarkdownComplexTest() {
    const testPrompt = "Explain JavaScript promises with 3 practical examples showing different use cases. Start with an introduction explaining what promises are and why they're useful. Then provide three detailed examples: 1) Basic promise creation and consumption with setTimeout, 2) Chaining promises for sequential API calls, and 3) Using Promise.all for parallel operations. Include code blocks for each example with detailed comments explaining each step. Add a section about error handling with try/catch and .catch() methods. Conclude with best practices and common pitfalls to avoid. Use proper markdown formatting with headers, code blocks, lists, and emphasis where appropriate.";
    
    this.autoFeedToChat(testPrompt);
    this.showFeedback('Markdown Complex Test sent to chat', 'success');
  }
  
  /**
   * Run Plain Text Test - auto-feeds chat
   * EXACT function from testing suite v2 for consecutive output evaluation
   */
  runPlainTextTest() {
    const testPrompt = "Tell me about your favorite season and why you enjoy it. Include at least three distinct reasons with detailed explanations. Describe specific activities you like to do during that season, how the weather affects your mood and daily routine, and any special memories or traditions associated with it. Also explain how this season compares to the others and what makes it unique in your experience. Write this as a natural conversation without using any markdown formatting - just flowing paragraphs of plain text that feel like you're talking to a friend about something you're passionate about.";
    
    this.autoFeedToChat(testPrompt);
    this.showFeedback('Plain Text Test sent to chat', 'success');
  }

  /**
   * Run Comprehensive Edge Cases Test - systematic testing
   * Tests all major streaming edge cases as outlined in SESSION.md
   */
  runEdgeCasesTest() {
    const testPrompt = `Please generate a response that includes all of the following markdown elements to test the streaming service. Include them in this exact order:

1. Start with a paragraph explaining that this is a comprehensive test of markdown rendering capabilities.

2. Create a nested list structure:
   - First level unordered item
   - Second unordered item with:
     1. Nested ordered sub-item
     2. Another nested ordered item
     - Back to unordered nesting
   - Third top-level item

3. Insert a code block with JavaScript:
\`\`\`javascript
// Test function for edge cases
function testEdgeCases() {
  const data = {
    lists: "nested properly",
    code: "syntax highlighted", 
    tables: "formatted correctly"
  };
  return data;
}
\`\`\`

4. Add a blockquote containing mixed content:
> This blockquote contains multiple elements:
>
> - A list inside the quote
> - Another list item
>
> And a paragraph still in the quote.

5. Create a table with formatting:

| Feature | Status | Notes |
|---------|--------|-------|
| **Bold text** | Working | Good |
| \`Inline code\` | Working | Good |
| *Italic text* | Working | Good |

6. Add another paragraph with inline formatting: This paragraph contains **bold text**, *italic text*, \`inline code\`, and normal text all mixed together.

7. Insert a different language code block:
\`\`\`python
# Python syntax test
def edge_case_test():
    return "Testing different language highlighting"
\`\`\`

8. End with headers of different levels:
# Main Header
## Sub Header  
### Third Level
#### Fourth Level

9. Final paragraph: This concludes the comprehensive edge case test for the streaming markdown service.`;
    
    this.autoFeedToChat(testPrompt);
    this.showFeedback('Edge Cases Test sent to chat', 'info');
  }
  
  /**
   * Auto-feed prompt to chat input and send
   */
  autoFeedToChat(prompt) {
    const messageInput = document.getElementById('streaming-message-input');
    const sendButton = document.getElementById('streaming-send-message');
    
    if (messageInput && sendButton) {
      messageInput.value = prompt;
      
      // Auto-resize textarea if needed
      messageInput.style.height = 'auto';
      messageInput.style.height = messageInput.scrollHeight + 'px';
      
      // Trigger send
      sendButton.click();
      
      // Close settings panel
      this.close();
    } else {
      console.warn('Chat input or send button not found');
    }
  }
  
  /**
   * Clear chat messages
   */
  clearChatMessages() {
    // Find the chat messages container
    const chatMessages = document.querySelector('.chat-messages') || 
                        document.getElementById('streaming-chat-messages') ||
                        document.querySelector('#chat-messages');
    
    if (chatMessages) {
      chatMessages.innerHTML = '';
      this.showFeedback('Chat cleared!', 'success');
      
      // Also clear any chat service state if available
      if (typeof window !== 'undefined' && window.chatService) {
        window.chatService.clearChat();
      }
    } else {
      this.showFeedback('Chat container not found', 'error');
    }
  }

  /**
   * Show feedback message
   */
  showFeedback(message, type = 'info') {
    // Remove existing feedback
    const existing = this.panel.querySelector('.settings-feedback');
    if (existing) existing.remove();
    
    // Create feedback element
    const feedback = document.createElement('div');
    feedback.className = `settings-feedback settings-feedback-${type}`;
    feedback.textContent = message;
    
    // Insert after header
    const header = this.panel.querySelector('.settings-header');
    header.insertAdjacentElement('afterend', feedback);
    
    // Auto remove after 3 seconds
    setTimeout(() => feedback.remove(), 3000);
  }
}

// Export singleton instance
export const settingsPanel = new SettingsPanel();
export default settingsPanel;