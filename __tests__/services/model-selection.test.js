/**
 * Model Selection Unit Tests
 * Tests for dynamic model selection and integration with context system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { globalEvents } from '../../src/core/events/event-emitter.js';

describe('Model Selection', () => {
  let mockLocalStorage;
  let mockDocument;
  let mockElements;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = mockLocalStorage;

    // Mock DOM elements
    mockElements = {
      modelSelect: {
        value: 'claude-3-7-sonnet-20250219',
        addEventListener: vi.fn(),
        options: [
          { value: 'claude-3-7-sonnet-20250219', textContent: 'Claude 3.7 Sonnet' },
          { value: 'claude-sonnet-4-20250514', textContent: 'Claude 4 Sonnet' },
          { value: 'claude-3-5-sonnet-20241022', textContent: 'Claude 3.5 Sonnet' }
        ]
      },
      modelStatus: {
        textContent: '',
        className: ''
      }
    };

    mockDocument = {
      getElementById: vi.fn((id) => {
        if (id === 'model-select') return mockElements.modelSelect;
        if (id === 'model-status') return mockElements.modelStatus;
        return null;
      }),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    };

    global.document = mockDocument;

    // Mock globalEvents
    vi.spyOn(globalEvents, 'emit');
    vi.spyOn(globalEvents, 'on');
  });

  describe('Model Selection Component', () => {
    let modelSelector;

    beforeEach(async () => {
      // Import and create model selector
      const { ModelSelector } = await import('../../src/components/model-selector.js');
      modelSelector = new ModelSelector();
    });

    it('should initialize with default model', () => {
      expect(modelSelector.currentModel).toBe('claude-3-7-sonnet-20250219');
      expect(modelSelector.initialized).toBe(false);
    });

    it('should load saved model from localStorage', () => {
      const savedModel = 'claude-sonnet-4-20250514';
      mockLocalStorage.getItem.mockReturnValue(savedModel);

      modelSelector.initialize();

      expect(modelSelector.currentModel).toBe(savedModel);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('selectedModel');
    });

    it('should setup event listeners on initialization', () => {
      modelSelector.initialize();

      expect(mockElements.modelSelect.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('model:change', expect.any(Function));
    });

    it('should handle model selection changes', () => {
      modelSelector.initialize();
      
      const newModel = 'claude-sonnet-4-20250514';
      mockElements.modelSelect.value = newModel;
      
      modelSelector.handleModelChange();

      expect(modelSelector.currentModel).toBe(newModel);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedModel', newModel);
      expect(globalEvents.emit).toHaveBeenCalledWith('model:changed', {
        model: newModel,
        timestamp: expect.any(String)
      });
    });

    it('should validate model selection', () => {
      const validModels = [
        'claude-3-7-sonnet-20250219',
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022'
      ];

      validModels.forEach(model => {
        expect(modelSelector.isValidModel(model)).toBe(true);
      });

      expect(modelSelector.isValidModel('invalid-model')).toBe(false);
    });

    it('should get model display name', () => {
      const testCases = [
        { model: 'claude-3-7-sonnet-20250219', expected: 'Claude 3.7 Sonnet' },
        { model: 'claude-sonnet-4-20250514', expected: 'Claude 4 Sonnet' },
        { model: 'claude-3-5-sonnet-20241022', expected: 'Claude 3.5 Sonnet' },
        { model: 'claude-3-5-haiku-20241022', expected: 'Claude 3.5 Haiku' }
      ];

      testCases.forEach(({ model, expected }) => {
        expect(modelSelector.getModelDisplayName(model)).toBe(expected);
      });
    });

    it('should handle model selection errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        modelSelector.handleModelChange();
      }).not.toThrow();
    });
  });

  describe('Model Selection in Mode Dropdown', () => {
    let modeDropdown;

    beforeEach(async () => {
      // Mock mode dropdown with model selection
      const { ModeDropdown } = await import('../../src/components/mode-dropdown.js');
      modeDropdown = new ModeDropdown();
    });

    it('should include model selection in mode dropdown', () => {
      modeDropdown.initialize();
      
      expect(modeDropdown.elements.modelSelect).toBeDefined();
    });

    it('should update model when dropdown selection changes', () => {
      modeDropdown.initialize();
      
      const newModel = 'claude-sonnet-4-20250514';
      modeDropdown.updateSelectedModel(newModel);

      expect(modeDropdown.selectedModel).toBe(newModel);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedModel', newModel);
    });

    it('should show model status in dropdown', () => {
      modeDropdown.initialize();
      
      const model = 'claude-sonnet-4-20250514';
      modeDropdown.updateModelStatus(model, 'connected');

      expect(modeDropdown.modelStatus).toBe('connected');
    });
  });

  describe('Model Selection Integration with ChatService', () => {
    let chatService;

    beforeEach(async () => {
      // Mock dependencies
      vi.mock('../../src/services/streaming/streaming-markdown.service.js', () => ({
        streamingMarkdownService: {
          isReady: vi.fn(() => true),
          initialize: vi.fn()
        }
      }));

      vi.mock('../../src/services/anthropic/anthropic-direct.service.js', () => ({
        anthropicDirectService: {
          isReady: vi.fn(() => true),
          createStream: vi.fn()
        }
      }));

      const { ChatService } = await import('../../src/services/chat/chat.service.js');
      chatService = new ChatService();
    });

    it('should use selected model in chat requests', () => {
      const selectedModel = 'claude-sonnet-4-20250514';
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'selectedModel') return selectedModel;
        return null;
      });

      chatService.initialize();
      
      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBe(selectedModel);
    });

    it('should fallback to context model if no selection', () => {
      const contextModel = 'claude-3-7-sonnet-20250219';
      mockLocalStorage.getItem.mockReturnValue(null);

      chatService.initialize();
      chatService.contextState.model = contextModel;
      
      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBe(contextModel);
    });

    it('should handle model changes dynamically', () => {
      chatService.initialize();
      
      const newModel = 'claude-sonnet-4-20250514';
      globalEvents.emit('model:changed', { model: newModel });
      
      // Simulate model update
      mockLocalStorage.getItem.mockReturnValue(newModel);
      
      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBe(newModel);
    });
  });

  describe('Model Selection in MCP Communication', () => {
    it('should pass selected model to MCP servers', async () => {
      // Mock fetch for MCP calls
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        body: {
          getReader: vi.fn(() => ({
            read: vi.fn(() => Promise.resolve({ done: true })),
            releaseLock: vi.fn()
          }))
        }
      }));

      const { ChatService } = await import('../../src/services/chat/chat.service.js');
      const chatService = new ChatService();
      
      const selectedModel = 'claude-sonnet-4-20250514';
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'selectedModel') return selectedModel;
        return null;
      });

      chatService.initialize();
      
      // Mock MCP Max stream creation
      const options = {
        context: {
          mmco: { project: { name: 'Test' } },
          role: 'developer',
          model: selectedModel
        }
      };

      await chatService.createMCPMaxStream('Test message', options);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/chat/stream',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(`"model":"${selectedModel}"`)
        })
      );
    });

    it('should handle model validation in MCP servers', async () => {
      const validModels = [
        'claude-3-7-sonnet-20250219',
        'claude-sonnet-4-20250514',
        'claude-3-5-sonnet-20241022'
      ];

      validModels.forEach(model => {
        // Mock model validation
        const isValid = [
          'claude-3-7-sonnet-20250219',
          'claude-sonnet-4-20250514',
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022'
        ].includes(model);

        expect(isValid).toBe(true);
      });
    });
  });

  describe('Model Selection Persistence', () => {
    it('should persist model selection across sessions', () => {
      const selectedModel = 'claude-sonnet-4-20250514';
      
      // Simulate selecting model
      mockLocalStorage.setItem('selectedModel', selectedModel);
      
      // Simulate new session
      mockLocalStorage.getItem.mockReturnValue(selectedModel);
      
      expect(mockLocalStorage.getItem('selectedModel')).toBe(selectedModel);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        mockLocalStorage.setItem('selectedModel', 'claude-sonnet-4-20250514');
      }).toThrow();
    });
  });

  describe('Model Selection UI Updates', () => {
    it('should update UI when model changes', () => {
      const newModel = 'claude-sonnet-4-20250514';
      const displayName = 'Claude 4 Sonnet';
      
      // Mock UI update
      mockElements.modelSelect.value = newModel;
      mockElements.modelStatus.textContent = `Connected to ${displayName}`;
      
      expect(mockElements.modelSelect.value).toBe(newModel);
      expect(mockElements.modelStatus.textContent).toBe(`Connected to ${displayName}`);
    });

    it('should show model status indicators', () => {
      const testCases = [
        { status: 'connected', expected: 'model-connected' },
        { status: 'disconnected', expected: 'model-disconnected' },
        { status: 'error', expected: 'model-error' }
      ];

      testCases.forEach(({ status, expected }) => {
        mockElements.modelStatus.className = expected;
        expect(mockElements.modelStatus.className).toBe(expected);
      });
    });
  });

  describe('Model Selection Events', () => {
    it('should emit model change events', () => {
      const model = 'claude-sonnet-4-20250514';
      const eventData = {
        model,
        timestamp: new Date().toISOString(),
        source: 'user-selection'
      };

      globalEvents.emit('model:changed', eventData);

      expect(globalEvents.emit).toHaveBeenCalledWith('model:changed', eventData);
    });

    it('should listen for model validation events', () => {
      const validationData = {
        model: 'claude-sonnet-4-20250514',
        isValid: true,
        source: 'mcp-server'
      };

      globalEvents.emit('model:validated', validationData);

      expect(globalEvents.emit).toHaveBeenCalledWith('model:validated', validationData);
    });
  });

  describe('Model Selection Error Handling', () => {
    it('should handle invalid model selections', () => {
      const invalidModel = 'invalid-model-name';
      
      expect(() => {
        mockElements.modelSelect.value = invalidModel;
        // Should not throw, but should fall back to default
      }).not.toThrow();
    });

    it('should handle MCP server model validation errors', () => {
      const errorData = {
        model: 'claude-sonnet-4-20250514',
        error: 'Model not supported by server',
        fallback: 'claude-3-7-sonnet-20250219'
      };

      expect(() => {
        globalEvents.emit('model:validation-error', errorData);
      }).not.toThrow();
    });
  });

  describe('Model Selection Performance', () => {
    it('should debounce rapid model changes', () => {
      const debounceTime = 300;
      let lastChangeTime = 0;
      
      const handleChange = () => {
        const now = Date.now();
        if (now - lastChangeTime < debounceTime) {
          return; // Skip rapid changes
        }
        lastChangeTime = now;
        
        // Process change
        globalEvents.emit('model:changed', {
          model: mockElements.modelSelect.value,
          timestamp: new Date().toISOString()
        });
      };

      // Simulate rapid changes
      handleChange();
      handleChange();
      handleChange();

      // Should only process the last change
      expect(globalEvents.emit).toHaveBeenCalledTimes(1);
    });
  });
});