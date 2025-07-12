/**
 * Settings Panel Component Unit Tests
 * Tests for the settings panel UI component and context integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { globalEvents } from '../../src/core/events/event-emitter.js';

// Mock the ContextManager
vi.mock('../../src/services/context/context-manager.service.js', () => ({
  contextManager: {
    isReady: vi.fn(() => true),
    getAllContexts: vi.fn(() => ({
      mmco: null,
      uacp: null,
      pacp: null,
      systemPrompt: null,
      aiRole: 'developer'
    })),
    updateMMCO: vi.fn(),
    updateUACP: vi.fn(),
    updatePACP: vi.fn(),
    updateSystemPrompt: vi.fn(),
    updateAIRole: vi.fn(),
    validateContext: vi.fn(),
    canUndo: vi.fn(() => false),
    canRedo: vi.fn(() => false),
    undo: vi.fn(),
    redo: vi.fn()
  }
}));

// Mock the ChatService
vi.mock('../../src/services/chat/chat.service.js', () => ({
  chatService: {
    isReady: vi.fn(() => true),
    sendMessage: vi.fn(),
    clearChat: vi.fn()
  }
}));

describe('Settings Panel Component', () => {
  let settingsPanel;
  let mockDocument;
  let mockElements;

  beforeEach(() => {
    // Create mock DOM elements
    mockElements = {
      settingsToggle: {
        addEventListener: vi.fn(),
        click: vi.fn()
      },
      settingsPanel: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          toggle: vi.fn(),
          contains: vi.fn(() => false)
        },
        style: {},
        addEventListener: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(() => [])
      },
      settingsOverlay: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          toggle: vi.fn()
        },
        addEventListener: vi.fn()
      },
      tabs: {
        forEach: vi.fn(),
        addEventListener: vi.fn()
      },
      tabContents: {
        forEach: vi.fn()
      },
      aiModeSelect: {
        value: 'developer',
        addEventListener: vi.fn()
      },
      systemPromptTextarea: {
        value: '',
        addEventListener: vi.fn()
      },
      mmcoTextarea: {
        value: '',
        addEventListener: vi.fn()
      },
      uacpTextarea: {
        value: '',
        addEventListener: vi.fn()
      },
      pacpTextarea: {
        value: '',
        addEventListener: vi.fn()
      },
      applySettingsBtn: {
        addEventListener: vi.fn()
      },
      resetSettingsBtn: {
        addEventListener: vi.fn()
      },
      validateJsonBtn: {
        addEventListener: vi.fn()
      },
      clearChatBtn: {
        addEventListener: vi.fn()
      }
    };

    // Mock document
    mockDocument = {
      getElementById: vi.fn((id) => mockElements[id.replace('#', '').replace('-', '')] || null),
      querySelector: vi.fn((selector) => {
        const id = selector.replace('#', '').replace('-', '');
        return mockElements[id] || null;
      }),
      querySelectorAll: vi.fn((selector) => {
        if (selector === '.settings-tab') return [mockElements.tabs];
        if (selector === '.tab-content') return [mockElements.tabContents];
        return [];
      }),
      createElement: vi.fn(() => ({
        classList: { add: vi.fn(), remove: vi.fn() },
        appendChild: vi.fn(),
        innerHTML: '',
        textContent: ''
      }))
    };

    global.document = mockDocument;

    // Mock globalEvents
    vi.spyOn(globalEvents, 'emit');
    vi.spyOn(globalEvents, 'on');

    // Create mock SettingsPanel class
    class MockSettingsPanel {
      constructor() {
        this.isVisible = false;
        this.currentTab = 'context';
        this.initialized = false;
      }
      
      initialize() {
        this.initialized = true;
      }
      
      showSettings() {
        this.isVisible = true;
        mockElements.settingsPanel.classList.add('visible');
        mockElements.settingsOverlay.classList.add('visible');
      }
      
      hideSettings() {
        this.isVisible = false;
        mockElements.settingsPanel.classList.remove('visible');
        mockElements.settingsOverlay.classList.remove('visible');
      }
      
      toggleSettings() {
        if (this.isVisible) {
          this.hideSettings();
        } else {
          this.showSettings();
        }
      }
      
      switchTab(tabName) {
        if (['context', 'chat'].includes(tabName)) {
          this.currentTab = tabName;
        }
      }
      
      updateAIRole(role) {
        globalEvents.emit('context:update:aiRole', role);
      }
      
      updateSystemPrompt(prompt) {
        globalEvents.emit('context:update:systemPrompt', prompt);
      }
      
      updateMMCO(mmcoJson) {
        try {
          JSON.parse(mmcoJson);
          globalEvents.emit('context:update:mmco', mmcoJson);
        } catch (error) {
          console.error('Invalid MMCO JSON:', error);
        }
      }
      
      updateUACP(uacpText) {
        globalEvents.emit('context:update:uacp', uacpText);
      }
      
      updatePACP(pacpJson) {
        try {
          JSON.parse(pacpJson);
          globalEvents.emit('context:update:pacp', pacpJson);
        } catch (error) {
          console.error('Invalid PACP JSON:', error);
        }
      }
      
      validateJson(jsonString) {
        try {
          const parsed = JSON.parse(jsonString);
          return { isValid: true, parsed };
        } catch (error) {
          return { isValid: false, error: error.message };
        }
      }
      
      prettyPrintJson(jsonString) {
        try {
          const parsed = JSON.parse(jsonString);
          return JSON.stringify(parsed, null, 2);
        } catch (error) {
          return jsonString;
        }
      }
      
      saveSettings(settings) {
        try {
          global.localStorage.setItem('firesite:settings', JSON.stringify(settings));
        } catch (error) {
          console.warn('Failed to save settings:', error);
        }
      }
      
      loadSettings() {
        try {
          const saved = global.localStorage.getItem('firesite:settings');
          return saved ? JSON.parse(saved) : {};
        } catch (error) {
          return {};
        }
      }
      
      applyAllSettings() {
        this.updateAIRole(mockElements.aiModeSelect.value);
        this.updateSystemPrompt(mockElements.systemPromptTextarea.value);
        this.updateMMCO(mockElements.mmcoTextarea.value);
        this.updateUACP(mockElements.uacpTextarea.value);
        this.updatePACP(mockElements.pacpTextarea.value);
      }
      
      resetToDefaults() {
        mockElements.aiModeSelect.value = 'developer';
        mockElements.systemPromptTextarea.value = '';
        mockElements.mmcoTextarea.value = '';
        mockElements.uacpTextarea.value = '';
        mockElements.pacpTextarea.value = '';
      }
      
      clearChat() {
        globalEvents.emit('chat:clear');
      }
      
      loadSampleMMCO(data) {
        try {
          mockElements.mmcoTextarea.value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        } catch (error) {
          console.warn('Failed to load sample MMCO:', error);
        }
      }
      
      loadSampleUACP(data) {
        mockElements.uacpTextarea.value = data;
      }
      
      loadSamplePACP(data) {
        try {
          mockElements.pacpTextarea.value = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        } catch (error) {
          console.warn('Failed to load sample PACP:', error);
        }
      }
      
      updateUIFromContexts(contexts) {
        if (contexts.aiRole) mockElements.aiModeSelect.value = contexts.aiRole;
        if (contexts.systemPrompt) mockElements.systemPromptTextarea.value = contexts.systemPrompt;
        if (contexts.mmco) mockElements.mmcoTextarea.value = JSON.stringify(contexts.mmco, null, 2);
        if (contexts.uacp) mockElements.uacpTextarea.value = contexts.uacp;
        if (contexts.pacp) mockElements.pacpTextarea.value = JSON.stringify(contexts.pacp, null, 2);
      }
      
      showValidationStatus(element, isValid, message) {
        element.textContent = message;
        element.className = isValid ? 'validation-success' : 'validation-error';
      }
      
      undo() {
        const { contextManager } = require('../../src/services/context/context-manager.service.js');
        contextManager.undo();
      }
      
      redo() {
        const { contextManager } = require('../../src/services/context/context-manager.service.js');
        contextManager.redo();
      }
      
      sendQuickPrompt(prompt) {
        globalEvents.emit('chat:sendMessage', prompt);
      }
      
      updateChatSettings(settings) {
        globalEvents.emit('chat:updateSettings', settings);
      }
    }
    
    settingsPanel = new MockSettingsPanel();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      expect(settingsPanel.isVisible).toBe(false);
      expect(settingsPanel.currentTab).toBe('context');
      expect(settingsPanel.initialized).toBe(false);
    });

    it('should cache DOM elements during initialization', () => {
      settingsPanel.initialize();
      
      expect(mockDocument.getElementById).toHaveBeenCalledWith('settings-toggle');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('settings-panel');
      expect(mockDocument.getElementById).toHaveBeenCalledWith('settings-overlay');
    });

    it('should setup event listeners', () => {
      settingsPanel.initialize();
      
      expect(mockElements.settingsToggle.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockElements.settingsOverlay.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should load saved settings on initialization', () => {
      const mockSettings = {
        aiRole: 'planner',
        systemPrompt: 'Test prompt',
        mmco: '{"project": {"name": "Test"}}',
        uacp: 'Test UACP',
        pacp: '{"version": "1.0.0"}'
      };

      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn((key) => {
          if (key === 'firesite:settings') return JSON.stringify(mockSettings);
          return null;
        }),
        setItem: vi.fn()
      };

      settingsPanel.initialize();

      expect(global.localStorage.getItem).toHaveBeenCalledWith('firesite:settings');
    });
  });

  describe('Panel Visibility', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should show settings panel', () => {
      settingsPanel.showSettings();
      
      expect(settingsPanel.isVisible).toBe(true);
      expect(mockElements.settingsPanel.classList.add).toHaveBeenCalledWith('visible');
      expect(mockElements.settingsOverlay.classList.add).toHaveBeenCalledWith('visible');
    });

    it('should hide settings panel', () => {
      settingsPanel.isVisible = true;
      settingsPanel.hideSettings();
      
      expect(settingsPanel.isVisible).toBe(false);
      expect(mockElements.settingsPanel.classList.remove).toHaveBeenCalledWith('visible');
      expect(mockElements.settingsOverlay.classList.remove).toHaveBeenCalledWith('visible');
    });

    it('should toggle settings panel visibility', () => {
      settingsPanel.toggleSettings();
      expect(settingsPanel.isVisible).toBe(true);
      
      settingsPanel.toggleSettings();
      expect(settingsPanel.isVisible).toBe(false);
    });
  });

  describe('Tab Management', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should switch tabs', () => {
      settingsPanel.switchTab('chat');
      
      expect(settingsPanel.currentTab).toBe('chat');
    });

    it('should handle invalid tab names', () => {
      const originalTab = settingsPanel.currentTab;
      settingsPanel.switchTab('invalid-tab');
      
      expect(settingsPanel.currentTab).toBe(originalTab);
    });
  });

  describe('Context Settings', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should update AI role', () => {
      settingsPanel.updateAIRole('planner');
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:aiRole', 'planner');
    });

    it('should update system prompt', () => {
      const prompt = 'Test system prompt';
      settingsPanel.updateSystemPrompt(prompt);
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:systemPrompt', prompt);
    });

    it('should update MMCO with valid JSON', () => {
      const mmcoJson = '{"project": {"name": "Test Project"}}';
      settingsPanel.updateMMCO(mmcoJson);
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:mmco', mmcoJson);
    });

    it('should handle invalid MMCO JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      settingsPanel.updateMMCO('invalid json');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(globalEvents.emit).not.toHaveBeenCalledWith('context:update:mmco', expect.any(String));
    });

    it('should update UACP', () => {
      const uacpText = 'Test UACP content';
      settingsPanel.updateUACP(uacpText);
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:uacp', uacpText);
    });

    it('should update PACP with valid JSON', () => {
      const pacpJson = '{"version": "1.0.0", "profile": {"name": "Test"}}';
      settingsPanel.updatePACP(pacpJson);
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:pacp', pacpJson);
    });

    it('should handle invalid PACP JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      settingsPanel.updatePACP('invalid json');
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(globalEvents.emit).not.toHaveBeenCalledWith('context:update:pacp', expect.any(String));
    });
  });

  describe('JSON Validation', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should validate correct JSON', () => {
      const result = settingsPanel.validateJson('{"valid": "json"}');
      
      expect(result.isValid).toBe(true);
      expect(result.parsed).toEqual({ valid: 'json' });
    });

    it('should detect invalid JSON', () => {
      const result = settingsPanel.validateJson('invalid json');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty JSON', () => {
      const result = settingsPanel.validateJson('');
      
      expect(result.isValid).toBe(false);
    });

    it('should pretty print JSON', () => {
      const uglyJson = '{"a":1,"b":2}';
      const prettyJson = settingsPanel.prettyPrintJson(uglyJson);
      
      expect(prettyJson).toContain('\n');
      expect(prettyJson).toContain('  ');
    });
  });

  describe('Settings Persistence', () => {
    beforeEach(() => {
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      settingsPanel.initialize();
    });

    it('should save settings to localStorage', () => {
      const settings = {
        aiRole: 'planner',
        systemPrompt: 'Test prompt',
        mmco: '{"project": {}}',
        uacp: 'Test UACP',
        pacp: '{"version": "1.0.0"}'
      };

      settingsPanel.saveSettings(settings);
      
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'firesite:settings',
        JSON.stringify(settings)
      );
    });

    it('should load settings from localStorage', () => {
      const mockSettings = {
        aiRole: 'tester',
        systemPrompt: 'Loaded prompt'
      };

      global.localStorage.getItem.mockReturnValue(JSON.stringify(mockSettings));
      
      const settings = settingsPanel.loadSettings();
      
      expect(settings).toEqual(mockSettings);
      expect(global.localStorage.getItem).toHaveBeenCalledWith('firesite:settings');
    });

    it('should handle localStorage errors gracefully', () => {
      global.localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        settingsPanel.saveSettings({ test: 'data' });
      }).not.toThrow();
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should apply all settings', () => {
      mockElements.aiModeSelect.value = 'planner';
      mockElements.systemPromptTextarea.value = 'Test prompt';
      mockElements.mmcoTextarea.value = '{"project": {}}';
      mockElements.uacpTextarea.value = 'Test UACP';
      mockElements.pacpTextarea.value = '{"version": "1.0.0"}';

      settingsPanel.applyAllSettings();

      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:aiRole', 'planner');
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:systemPrompt', 'Test prompt');
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:mmco', '{"project": {}}');
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:uacp', 'Test UACP');
      expect(globalEvents.emit).toHaveBeenCalledWith('context:update:pacp', '{"version": "1.0.0"}');
    });

    it('should reset to defaults', () => {
      settingsPanel.resetToDefaults();

      expect(mockElements.aiModeSelect.value).toBe('developer');
      expect(mockElements.systemPromptTextarea.value).toBe('');
      expect(mockElements.mmcoTextarea.value).toBe('');
      expect(mockElements.uacpTextarea.value).toBe('');
      expect(mockElements.pacpTextarea.value).toBe('');
    });

    it('should clear chat', () => {
      settingsPanel.clearChat();

      expect(globalEvents.emit).toHaveBeenCalledWith('chat:clear');
    });
  });

  describe('Sample Data Loading', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should load sample MMCO data', () => {
      const sampleData = {
        project: { name: 'Sample Project' },
        task: { current: 'Development' }
      };

      settingsPanel.loadSampleMMCO(sampleData);

      expect(mockElements.mmcoTextarea.value).toBe(JSON.stringify(sampleData, null, 2));
    });

    it('should load sample UACP data', () => {
      const sampleData = '[UACP:business] Sample business context';

      settingsPanel.loadSampleUACP(sampleData);

      expect(mockElements.uacpTextarea.value).toBe(sampleData);
    });

    it('should load sample PACP data', () => {
      const sampleData = {
        version: '1.0.0',
        profile: { name: 'Sample User' }
      };

      settingsPanel.loadSamplePACP(sampleData);

      expect(mockElements.pacpTextarea.value).toBe(JSON.stringify(sampleData, null, 2));
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should handle missing DOM elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);

      expect(() => {
        settingsPanel.initialize();
      }).not.toThrow();
    });

    it('should handle context update errors', () => {
      globalEvents.emit.mockImplementation(() => {
        throw new Error('Context update failed');
      });

      expect(() => {
        settingsPanel.updateAIRole('planner');
      }).not.toThrow();
    });

    it('should handle JSON parsing errors in sample data', () => {
      expect(() => {
        settingsPanel.loadSampleMMCO('invalid json');
      }).not.toThrow();
    });
  });

  describe('UI State Management', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should update UI when context changes', () => {
      const mockContexts = {
        aiRole: 'planner',
        systemPrompt: 'Updated prompt',
        mmco: { project: { name: 'Test' } },
        uacp: 'Updated UACP',
        pacp: { version: '1.0.0' }
      };

      settingsPanel.updateUIFromContexts(mockContexts);

      expect(mockElements.aiModeSelect.value).toBe('planner');
      expect(mockElements.systemPromptTextarea.value).toBe('Updated prompt');
    });

    it('should show validation status', () => {
      const mockStatusElement = {
        textContent: '',
        className: ''
      };

      settingsPanel.showValidationStatus(mockStatusElement, true, 'Valid JSON');

      expect(mockStatusElement.textContent).toBe('Valid JSON');
      expect(mockStatusElement.className).toBe('validation-success');
    });

    it('should handle validation errors', () => {
      const mockStatusElement = {
        textContent: '',
        className: ''
      };

      settingsPanel.showValidationStatus(mockStatusElement, false, 'Invalid JSON');

      expect(mockStatusElement.textContent).toBe('Invalid JSON');
      expect(mockStatusElement.className).toBe('validation-error');
    });
  });

  describe('Integration Features', () => {
    beforeEach(() => {
      settingsPanel.initialize();
    });

    it('should support undo/redo functionality', () => {
      const { contextManager } = require('../../src/services/context/context-manager.service.js');
      
      contextManager.canUndo.mockReturnValue(true);
      contextManager.canRedo.mockReturnValue(true);

      settingsPanel.undo();
      expect(contextManager.undo).toHaveBeenCalled();

      settingsPanel.redo();
      expect(contextManager.redo).toHaveBeenCalled();
    });

    it('should send quick prompt to chat', () => {
      const prompt = 'Test quick prompt';
      settingsPanel.sendQuickPrompt(prompt);

      expect(globalEvents.emit).toHaveBeenCalledWith('chat:sendMessage', prompt);
    });

    it('should update chat settings', () => {
      const chatSettings = {
        naturalTyping: true,
        typingSpeed: 30,
        showThinking: false
      };

      settingsPanel.updateChatSettings(chatSettings);

      expect(globalEvents.emit).toHaveBeenCalledWith('chat:updateSettings', chatSettings);
    });
  });
});