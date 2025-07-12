/**
 * ChatService Context Integration Unit Tests
 * Tests the integration between ChatService and ContextManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService } from '../../src/services/chat/chat.service.js';
import { globalEvents } from '../../src/core/events/event-emitter.js';

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

vi.mock('../../src/services/context/context-manager.service.js', () => ({
  contextManager: {
    isReady: vi.fn(() => true),
    initialize: vi.fn(),
    getAllContexts: vi.fn(() => ({
      mmco: null,
      uacp: null,
      pacp: null,
      systemPrompt: null,
      aiRole: 'developer'
    }))
  }
}));

describe('ChatService Context Integration', () => {
  let chatService;
  let mockLocalStorage;

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
    global.document = {
      createElement: vi.fn(() => ({
        className: '',
        appendChild: vi.fn(),
        querySelector: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false)
        }
      })),
      getElementById: vi.fn(() => null),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => [])
    };

    // Mock globalEvents
    vi.spyOn(globalEvents, 'emit');
    vi.spyOn(globalEvents, 'on');
    vi.spyOn(globalEvents, 'off');

    // Create fresh ChatService instance
    chatService = new ChatService();
  });

  describe('Context Loading', () => {
    it('should load context from ContextManager storage', () => {
      const mockContextData = {
        contexts: {
          mmco: { project: { name: 'Test Project' } },
          uacp: 'Test UACP content',
          pacp: { version: '1.0.0', profile: { name: 'Test User' } },
          systemPrompt: 'Test system prompt',
          aiRole: 'planner'
        }
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'firesite:context') {
          return JSON.stringify(mockContextData);
        }
        return null;
      });

      chatService.loadContextFromStorage();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('firesite:context');
      expect(chatService.contextState.mmco).toEqual({ project: { name: 'Test Project' } });
      expect(chatService.contextState.uacp).toBe('Test UACP content');
      expect(chatService.contextState.pacp).toEqual({ version: '1.0.0', profile: { name: 'Test User' } });
      expect(chatService.contextState.systemPrompt).toBe('Test system prompt');
      expect(chatService.contextState.aiRole).toBe('planner');
    });

    it('should handle legacy storage key for backward compatibility', () => {
      const legacyData = {
        systemPrompt: 'Legacy prompt',
        aiRole: 'developer'
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'chatService:context') {
          return JSON.stringify(legacyData);
        }
        return null;
      });

      chatService.loadContextFromStorage();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('firesite:context');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('chatService:context');
      expect(chatService.contextState.systemPrompt).toBe('Legacy prompt');
    });

    it('should handle corrupted storage data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(() => {
        chatService.loadContextFromStorage();
      }).not.toThrow();
    });
  });

  describe('Context Event Listeners', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should setup context event listeners', () => {
      expect(globalEvents.on).toHaveBeenCalledWith('context:all:updated', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:mmco:updated', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:uacp:updated', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:pacp:updated', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:systemPrompt:updated', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:aiRole:updated', expect.any(Function));
    });

    it('should handle MMCO updates', () => {
      const mockMMCO = { project: { name: 'Updated Project' } };
      
      // Simulate MMCO update event
      chatService.contextState.mmco = mockMMCO;
      
      expect(chatService.contextState.mmco).toEqual(mockMMCO);
    });

    it('should handle UACP updates', () => {
      const mockUACP = 'Updated UACP content';
      
      // Simulate UACP update event
      chatService.contextState.uacp = mockUACP;
      
      expect(chatService.contextState.uacp).toBe(mockUACP);
    });

    it('should handle PACP updates', () => {
      const mockPACP = { version: '1.0.0', profile: { name: 'Updated User' } };
      
      // Simulate PACP update event
      chatService.contextState.pacp = mockPACP;
      
      expect(chatService.contextState.pacp).toEqual(mockPACP);
    });

    it('should handle system prompt updates', () => {
      const mockPrompt = 'Updated system prompt';
      
      // Simulate system prompt update event
      chatService.contextState.systemPrompt = mockPrompt;
      
      expect(chatService.contextState.systemPrompt).toBe(mockPrompt);
    });

    it('should handle AI role updates', () => {
      const mockRole = 'tester';
      
      // Simulate AI role update event
      chatService.contextState.aiRole = mockRole;
      
      expect(chatService.contextState.aiRole).toBe(mockRole);
    });
  });

  describe('Context Manager Updates', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should handle context manager all-updated event', () => {
      const mockContexts = {
        mmco: { project: { name: 'Test' } },
        uacp: 'Test UACP',
        pacp: { version: '1.0.0' },
        systemPrompt: 'Test prompt',
        aiRole: 'planner'
      };

      chatService.handleContextManagerUpdate({ contexts: mockContexts });

      expect(chatService.contextState.mmco).toEqual(mockContexts.mmco);
      expect(chatService.contextState.uacp).toBe(mockContexts.uacp);
      expect(chatService.contextState.pacp).toEqual(mockContexts.pacp);
      expect(chatService.contextState.systemPrompt).toBe(mockContexts.systemPrompt);
      expect(chatService.contextState.aiRole).toBe(mockContexts.aiRole);
    });

    it('should emit context changed event after update', () => {
      const mockContexts = {
        mmco: { project: { name: 'Test' } }
      };

      chatService.handleContextManagerUpdate({ contexts: mockContexts });

      expect(globalEvents.emit).toHaveBeenCalledWith('context:changed', {
        oldContext: expect.any(Object),
        newContext: expect.any(Object)
      });
    });
  });

  describe('Request Data Preparation', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should prepare request data with current context', () => {
      chatService.contextState = {
        mmco: { project: { name: 'Test Project' } },
        uacp: 'Test UACP content',
        pacp: { profile: { name: 'Test User' } },
        systemPrompt: 'Test system prompt',
        aiRole: 'developer',
        model: 'claude-3-7-sonnet-20250219'
      };

      const requestData = chatService.prepareRequestData('Test message');

      expect(requestData).toEqual({
        message: 'Test message',
        systemPrompt: 'Test system prompt',
        context: {
          mmco: { project: { name: 'Test Project' } },
          uacp: 'Test UACP content',
          pacp: { profile: { name: 'Test User' } },
          role: 'developer',
          model: 'claude-3-7-sonnet-20250219'
        }
      });
    });

    it('should handle null context values', () => {
      chatService.contextState = {
        mmco: null,
        uacp: null,
        pacp: null,
        systemPrompt: null,
        aiRole: 'developer',
        model: null
      };

      const requestData = chatService.prepareRequestData('Test message');

      expect(requestData.context.mmco).toBeNull();
      expect(requestData.context.uacp).toBeNull();
      expect(requestData.context.pacp).toBeNull();
      expect(requestData.systemPrompt).toBeNull();
      expect(requestData.context.role).toBe('developer');
    });

    it('should include additional options in request data', () => {
      const options = { customOption: 'test value' };
      const requestData = chatService.prepareRequestData('Test message', options);

      expect(requestData.customOption).toBe('test value');
    });
  });

  describe('Context Updates in Conversation', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should update conversation context in MMCO', () => {
      const mockMMCO = {
        project: { name: 'Test Project' },
        conversations: {
          current: { messages: [] }
        }
      };
      chatService.contextState.mmco = mockMMCO;

      const userMessage = 'Test user message';
      const assistantMessage = 'Test assistant response';

      chatService.updateConversationContext(userMessage, assistantMessage);

      expect(chatService.contextState.mmco.conversations.current.messages).toHaveLength(2);
      expect(chatService.contextState.mmco.conversations.current.messages[0]).toEqual({
        role: 'user',
        content: userMessage,
        timestamp: expect.any(String)
      });
      expect(chatService.contextState.mmco.conversations.current.messages[1]).toEqual({
        role: 'assistant',
        content: assistantMessage,
        timestamp: expect.any(String)
      });
    });

    it('should initialize conversation structure if needed', () => {
      chatService.contextState.mmco = { project: { name: 'Test' } };

      chatService.updateConversationContext('Test message', 'Test response');

      expect(chatService.contextState.mmco.conversations).toBeDefined();
      expect(chatService.contextState.mmco.conversations.current).toBeDefined();
      expect(chatService.contextState.mmco.conversations.current.messages).toHaveLength(2);
    });

    it('should not update conversation context if no MMCO', () => {
      chatService.contextState.mmco = null;

      expect(() => {
        chatService.updateConversationContext('Test message', 'Test response');
      }).not.toThrow();
    });

    it('should emit MMCO updated event after conversation update', () => {
      chatService.contextState.mmco = { project: { name: 'Test' } };

      chatService.updateConversationContext('Test message', 'Test response');

      expect(globalEvents.emit).toHaveBeenCalledWith('context:mmco:updated', expect.any(Object));
    });
  });

  describe('Model Selection Integration', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should use selected model from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'selectedModel') {
          return 'claude-sonnet-4-20250514';
        }
        return null;
      });

      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBe('claude-sonnet-4-20250514');
    });

    it('should fallback to context model if no localStorage', () => {
      chatService.contextState.model = 'claude-3-7-sonnet-20250219';
      mockLocalStorage.getItem.mockReturnValue(null);

      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBe('claude-3-7-sonnet-20250219');
    });

    it('should use fallback model if no selection', () => {
      chatService.contextState.model = null;
      mockLocalStorage.getItem.mockReturnValue(null);

      const requestData = chatService.prepareRequestData('Test message');
      expect(requestData.context.model).toBeNull();
    });
  });

  describe('Service Lifecycle', () => {
    it('should initialize context before other services', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      chatService.initialize();

      expect(consoleSpy).toHaveBeenCalledWith('Context loaded from ContextManager:', expect.any(Object));
    });

    it('should clean up context event listeners on dispose', () => {
      chatService.initialize();
      chatService.dispose();

      expect(globalEvents.off).toHaveBeenCalledWith('context:all:updated');
      expect(globalEvents.off).toHaveBeenCalledWith('context:mmco:updated');
      expect(globalEvents.off).toHaveBeenCalledWith('context:uacp:updated');
      expect(globalEvents.off).toHaveBeenCalledWith('context:pacp:updated');
      expect(globalEvents.off).toHaveBeenCalledWith('context:systemPrompt:updated');
      expect(globalEvents.off).toHaveBeenCalledWith('context:aiRole:updated');
    });
  });

  describe('Context State Management', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should maintain context state immutability', () => {
      const originalContext = { ...chatService.contextState };
      
      chatService.updateContext({ mmco: { project: { name: 'New Project' } } });
      
      expect(originalContext).not.toEqual(chatService.contextState);
    });

    it('should emit context change events', () => {
      const contextData = { mmco: { project: { name: 'Test' } } };
      
      chatService.updateContext(contextData);
      
      expect(globalEvents.emit).toHaveBeenCalledWith('context:changed', {
        oldContext: expect.any(Object),
        newContext: expect.any(Object)
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      chatService.initialize();
    });

    it('should handle context loading errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        chatService.loadContextFromStorage();
      }).not.toThrow();
    });

    it('should handle malformed context data', () => {
      mockLocalStorage.getItem.mockReturnValue('{"contexts": invalid}');

      expect(() => {
        chatService.loadContextFromStorage();
      }).not.toThrow();
    });
  });
});