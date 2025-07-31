/**
 * ContextManager Service Unit Tests
 * Tests for MMCO, UACP, and PACP context management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextManager } from '../../src/services/context/context-manager.service.js';
import { globalEvents } from '../../src/core/events/event-emitter.js';

describe('ContextManager Service', () => {
  let contextManager;
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

    // Mock globalEvents
    vi.spyOn(globalEvents, 'emit');
    vi.spyOn(globalEvents, 'on');
    vi.spyOn(globalEvents, 'off');

    // Create fresh instance
    contextManager = new ContextManager();
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(contextManager.contexts).toEqual({
        mmco: null,
        uacp: null,
        pacp: null,
        systemPrompt: null,
        aiRole: 'developer'
      });
      expect(contextManager.initialized).toBe(false);
    });

    it('should initialize service and create default PACP', () => {
      contextManager.initialize();
      
      expect(contextManager.initialized).toBe(true);
      expect(contextManager.contexts.pacp).toBeDefined();
      expect(contextManager.contexts.pacp.version).toBe('1.0.0');
      expect(contextManager.contexts.pacp.profile.name).toBe('Default User');
      expect(globalEvents.emit).toHaveBeenCalledWith('service:initialized', { service: 'ContextManager' });
    });

    it('should load from storage during initialization', () => {
      const mockStoredData = {
        contexts: {
          mmco: { project: { name: 'Test Project' } },
          uacp: 'Test UACP Content',
          systemPrompt: 'Test System Prompt'
        }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStoredData));

      contextManager.initialize();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('firesite:context');
      expect(contextManager.contexts.mmco).toEqual({ project: { name: 'Test Project' } });
      expect(contextManager.contexts.uacp).toBe('Test UACP Content');
      expect(contextManager.contexts.systemPrompt).toBe('Test System Prompt');
    });

    it('should setup event listeners', () => {
      contextManager.initialize();

      expect(globalEvents.on).toHaveBeenCalledWith('context:update:mmco', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:update:uacp', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:update:pacp', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:update:systemPrompt', expect.any(Function));
      expect(globalEvents.on).toHaveBeenCalledWith('context:update:aiRole', expect.any(Function));
    });
  });

  describe('MMCO Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should update MMCO with valid JSON object', () => {
      const mmcoData = {
        project: { name: 'Firesite Kanban', type: 'web-app' },
        task: { current: 'AI Integration', phase: 'development' }
      };

      contextManager.updateMMCO(mmcoData);

      expect(contextManager.contexts.mmco).toEqual(mmcoData);
      expect(globalEvents.emit).toHaveBeenCalledWith('context:mmco:updated', {
        mmco: mmcoData,
        timestamp: expect.any(String)
      });
    });

    it('should update MMCO with valid JSON string', () => {
      const mmcoData = {
        project: { name: 'Test Project' },
        context: { environment: 'development' }
      };
      const jsonString = JSON.stringify(mmcoData);

      contextManager.updateMMCO(jsonString);

      expect(contextManager.contexts.mmco).toEqual(mmcoData);
    });

    it('should validate MMCO structure', () => {
      const invalidMMCO = 'invalid json';

      expect(() => {
        contextManager.updateMMCO(invalidMMCO);
      }).toThrow();
    });

    it('should save to history before updating MMCO', () => {
      const initialMMCO = { project: { name: 'Initial' } };
      contextManager.contexts.mmco = initialMMCO;

      const newMMCO = { project: { name: 'Updated' } };
      contextManager.updateMMCO(newMMCO);

      expect(contextManager.contextHistory.length).toBe(1);
      expect(contextManager.contextHistory[0].contexts.mmco).toEqual(initialMMCO);
    });

    it('should persist changes to localStorage', () => {
      const mmcoData = { project: { name: 'Test' } };
      contextManager.updateMMCO(mmcoData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'firesite:context',
        expect.stringContaining('"mmco"')
      );
    });
  });

  describe('UACP Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should update UACP with valid string content', () => {
      const uacpData = '[UACP:business] Firesite is a revolutionary AI platform...';

      contextManager.updateUACP(uacpData);

      expect(contextManager.contexts.uacp).toBe(uacpData);
      expect(globalEvents.emit).toHaveBeenCalledWith('context:uacp:updated', {
        uacp: uacpData,
        timestamp: expect.any(String)
      });
    });

    it('should validate UACP is non-empty string', () => {
      expect(() => {
        contextManager.updateUACP('');
      }).toThrow('UACP must be a non-empty string');

      expect(() => {
        contextManager.updateUACP(null);
      }).toThrow('UACP must be a non-empty string');
    });

    it('should save to history and persist changes', () => {
      const uacpData = 'Test UACP Content';
      contextManager.updateUACP(uacpData);

      expect(contextManager.contextHistory.length).toBe(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('PACP Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should update PACP with valid JSON object', () => {
      const pacpData = {
        version: '1.0.0',
        profile: {
          name: 'Developer',
          preferences: {
            communicationStyle: 'direct',
            detailLevel: 'comprehensive'
          }
        }
      };

      contextManager.updatePACP(pacpData);

      expect(contextManager.contexts.pacp).toEqual(pacpData);
      expect(globalEvents.emit).toHaveBeenCalledWith('context:pacp:updated', {
        pacp: pacpData,
        timestamp: expect.any(String)
      });
    });

    it('should update PACP with valid JSON string', () => {
      const pacpData = {
        version: '1.0.0',
        profile: {
          name: 'Manager',
          preferences: { communicationStyle: 'business' }
        }
      };
      const jsonString = JSON.stringify(pacpData);

      contextManager.updatePACP(jsonString);

      expect(contextManager.contexts.pacp).toEqual(pacpData);
    });

    it('should validate PACP structure', () => {
      const invalidPACP = 'invalid json';

      expect(() => {
        contextManager.updatePACP(invalidPACP);
      }).toThrow();
    });

    it('should create default PACP', () => {
      const defaultPACP = contextManager.createDefaultPACP();

      expect(defaultPACP).toHaveProperty('version');
      expect(defaultPACP).toHaveProperty('profile');
      expect(defaultPACP.profile).toHaveProperty('name');
      expect(defaultPACP.profile).toHaveProperty('preferences');
      expect(defaultPACP.profile.preferences).toHaveProperty('communicationStyle');
      expect(defaultPACP).toHaveProperty('metadata');
    });
  });

  describe('System Prompt Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should update system prompt', () => {
      const promptText = 'You are an expert developer assistant';

      contextManager.updateSystemPrompt(promptText);

      expect(contextManager.contexts.systemPrompt).toBe(promptText);
      expect(globalEvents.emit).toHaveBeenCalledWith('context:systemPrompt:updated', {
        systemPrompt: promptText,
        timestamp: expect.any(String)
      });
    });

    it('should save to history and persist changes', () => {
      const promptText = 'Test system prompt';
      contextManager.updateSystemPrompt(promptText);

      expect(contextManager.contextHistory.length).toBe(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('AI Role Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should update AI role with valid role', () => {
      const role = 'planner';

      contextManager.updateAIRole(role);

      expect(contextManager.contexts.aiRole).toBe(role);
      expect(globalEvents.emit).toHaveBeenCalledWith('context:aiRole:updated', {
        aiRole: role,
        timestamp: expect.any(String)
      });
    });

    it('should validate AI role', () => {
      expect(() => {
        contextManager.updateAIRole('invalid-role');
      }).toThrow('Invalid AI role: invalid-role');
    });

    it('should accept valid roles', () => {
      const validRoles = ['developer', 'planner', 'tester', 'writer'];

      validRoles.forEach(role => {
        expect(() => {
          contextManager.updateAIRole(role);
        }).not.toThrow();
      });
    });
  });

  describe('Context History (Undo/Redo)', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should save state to history', () => {
      contextManager.contexts.mmco = { project: { name: 'Test' } };
      contextManager.saveToHistory();

      expect(contextManager.contextHistory.length).toBe(1);
      expect(contextManager.contextHistory[0].contexts.mmco).toEqual({ project: { name: 'Test' } });
    });

    it('should support undo functionality', () => {
      const initialMMCO = { project: { name: 'Initial' } };
      contextManager.contexts.mmco = initialMMCO;
      contextManager.saveToHistory();

      const newMMCO = { project: { name: 'Updated' } };
      contextManager.updateMMCO(newMMCO);

      expect(contextManager.contexts.mmco).toEqual(newMMCO);
      expect(contextManager.canUndo()).toBe(true);

      const undoResult = contextManager.undo();
      expect(undoResult).toBe(true);
      expect(contextManager.contexts.mmco).toEqual(initialMMCO);
    });

    it('should support redo functionality', () => {
      const initialMMCO = { project: { name: 'Initial' } };
      contextManager.contexts.mmco = initialMMCO;
      contextManager.saveToHistory();

      const newMMCO = { project: { name: 'Updated' } };
      contextManager.updateMMCO(newMMCO);

      contextManager.undo();
      expect(contextManager.canRedo()).toBe(true);

      const redoResult = contextManager.redo();
      expect(redoResult).toBe(true);
      expect(contextManager.contexts.mmco).toEqual(newMMCO);
    });

    it('should handle undo/redo limits', () => {
      expect(contextManager.canUndo()).toBe(false);
      expect(contextManager.canRedo()).toBe(false);
      expect(contextManager.undo()).toBe(false);
      expect(contextManager.redo()).toBe(false);
    });

    it('should trim history when max size reached', () => {
      contextManager.options.maxHistorySize = 3;

      // Add 5 states to history
      for (let i = 0; i < 5; i++) {
        contextManager.contexts.mmco = { project: { name: `Test ${i}` } };
        contextManager.saveToHistory();
      }

      expect(contextManager.contextHistory.length).toBe(3);
    });
  });

  describe('Context Export/Import', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should export contexts as JSON', () => {
      contextManager.contexts.mmco = { project: { name: 'Test' } };
      contextManager.contexts.uacp = 'Test UACP';

      const exported = contextManager.exportContexts('json');
      const parsed = JSON.parse(exported);

      expect(parsed.contexts.mmco).toEqual({ project: { name: 'Test' } });
      expect(parsed.contexts.uacp).toBe('Test UACP');
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.version).toBe('1.0.0');
    });

    it('should import contexts from JSON', () => {
      const importData = {
        contexts: {
          mmco: { project: { name: 'Imported' } },
          uacp: 'Imported UACP'
        }
      };

      contextManager.importContexts(JSON.stringify(importData));

      expect(contextManager.contexts.mmco).toEqual({ project: { name: 'Imported' } });
      expect(contextManager.contexts.uacp).toBe('Imported UACP');
    });

    it('should handle invalid import data', () => {
      expect(() => {
        contextManager.importContexts('invalid json');
      }).toThrow();

      expect(() => {
        contextManager.importContexts('{}');
      }).toThrow('Invalid import data: missing contexts');
    });
  });

  describe('Context Validation', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should validate MMCO as object', () => {
      expect(() => {
        contextManager.validateContext('mmco', 'not an object');
      }).toThrow('MMCO must be a valid object');

      expect(() => {
        contextManager.validateContext('mmco', null);
      }).toThrow('MMCO must be a valid object');

      expect(() => {
        contextManager.validateContext('mmco', { project: {} });
      }).not.toThrow();
    });

    it('should validate UACP as string', () => {
      expect(() => {
        contextManager.validateContext('uacp', '');
      }).toThrow('UACP must be a non-empty string');

      expect(() => {
        contextManager.validateContext('uacp', 123);
      }).toThrow('UACP must be a non-empty string');

      expect(() => {
        contextManager.validateContext('uacp', 'Valid UACP content');
      }).not.toThrow();
    });

    it('should validate PACP as object', () => {
      expect(() => {
        contextManager.validateContext('pacp', 'not an object');
      }).toThrow('PACP must be a valid object');

      expect(() => {
        contextManager.validateContext('pacp', { version: '1.0.0' });
      }).not.toThrow();
    });
  });

  describe('Service Management', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should provide service statistics', () => {
      contextManager.contexts.mmco = { project: {} };
      contextManager.contexts.uacp = 'Test';

      const stats = contextManager.getStats();

      expect(stats.initialized).toBe(true);
      expect(stats.contextsCount).toBe(3); // mmco, uacp, pacp (default)
      expect(stats.historySize).toBe(0);
      expect(stats.canUndo).toBe(false);
      expect(stats.canRedo).toBe(false);
    });

    it('should check if service is ready', () => {
      expect(contextManager.isReady()).toBe(false);

      contextManager.initialize();
      expect(contextManager.isReady()).toBe(true);
    });

    it('should dispose service properly', () => {
      contextManager.initialize();
      contextManager.dispose();

      expect(contextManager.initialized).toBe(false);
      expect(globalEvents.off).toHaveBeenCalledWith('context:update:mmco');
      expect(globalEvents.off).toHaveBeenCalledWith('context:update:uacp');
      expect(globalEvents.off).toHaveBeenCalledWith('context:update:pacp');
      expect(globalEvents.off).toHaveBeenCalledWith('context:update:systemPrompt');
      expect(globalEvents.off).toHaveBeenCalledWith('context:update:aiRole');
    });

    it('should clear all contexts', () => {
      contextManager.contexts.mmco = { project: {} };
      contextManager.contexts.uacp = 'Test';
      contextManager.contexts.systemPrompt = 'Test prompt';

      contextManager.clearAllContexts();

      expect(contextManager.contexts.mmco).toBeNull();
      expect(contextManager.contexts.uacp).toBeNull();
      expect(contextManager.contexts.systemPrompt).toBeNull();
      expect(contextManager.contexts.pacp).toBeDefined(); // Should keep default PACP
      expect(contextManager.contexts.aiRole).toBe('developer');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      contextManager.initialize();
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        contextManager.updateMMCO({ project: {} });
      }).not.toThrow();
    });

    it('should handle invalid JSON in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(() => {
        contextManager.loadFromStorage();
      }).not.toThrow();
    });

    it('should emit error events on validation failures', () => {
      try {
        contextManager.updateMMCO('invalid json');
      } catch (error) {
        // Expected to throw
      }

      expect(globalEvents.emit).toHaveBeenCalledWith('context:error', {
        type: 'mmco',
        error: expect.any(String)
      });
    });
  });
});