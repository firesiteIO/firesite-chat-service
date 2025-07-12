/**
 * Context Flow Integration Tests
 * Tests the complete flow from Settings Panel → ContextManager → ChatService → MCP
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { globalEvents } from '../../src/core/events/event-emitter.js';

describe('Context Flow Integration', () => {
  let contextManager;
  let chatService;
  let settingsPanel;
  let mockLocalStorage;

  beforeEach(async () => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = mockLocalStorage;

    // Mock fetch for MCP calls
    global.fetch = vi.fn();

    // Mock DOM
    global.document = {
      createElement: vi.fn(() => ({
        className: '',
        appendChild: vi.fn(),
        querySelector: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() },
        innerHTML: '',
        textContent: ''
      })),
      getElementById: vi.fn(() => ({
        value: '',
        addEventListener: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      })),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    };

    // Create service instances
    const { ContextManager } = await import('../../src/services/context/context-manager.service.js');
    const { ChatService } = await import('../../src/services/chat/chat.service.js');
    const { SettingsPanel } = await import('../../src/components/settings-panel.js');

    contextManager = new ContextManager();
    chatService = new ChatService();
    settingsPanel = new SettingsPanel();

    // Initialize services
    contextManager.initialize();
    chatService.initialize();
    settingsPanel.initialize();
  });

  describe('Complete Context Flow', () => {
    it('should flow MMCO from Settings Panel to Chat Service', async () => {
      const mmcoData = {
        project: {
          name: 'Firesite Kanban System',
          type: 'web-application',
          phase: 'development'
        },
        task: {
          current: 'AI Integration',
          priority: 'high',
          deadline: '2025-07-15'
        },
        context: {
          environment: 'development',
          technologies: ['JavaScript', 'Node.js', 'Claude API'],
          integrations: ['MCP', 'Firebase', 'GitHub']
        }
      };

      // Step 1: Settings Panel updates MMCO
      settingsPanel.updateMMCO(JSON.stringify(mmcoData));

      // Step 2: ContextManager should receive and process the update
      expect(contextManager.contexts.mmco).toEqual(mmcoData);

      // Step 3: ChatService should receive the context update
      expect(chatService.contextState.mmco).toEqual(mmcoData);

      // Step 4: Request data should include the MMCO
      const requestData = chatService.prepareRequestData('What project are we working on?');
      expect(requestData.context.mmco).toEqual(mmcoData);
    });

    it('should flow UACP from Settings Panel to Chat Service', async () => {
      const uacpData = `[UACP:business]
Firesite is a revolutionary AI platform that inverts the traditional relationship between humans and software. We're building infrastructure for human potential where AI becomes a first-class team member with agency and context awareness.

[UACP:technology]
Our core technology stack includes:
- Claude API for AI conversations
- Model Context Protocol (MCP) for deep integration
- Zero re-render streaming architecture
- Event-driven service architecture

[UACP:mission]
We're creating systems that adapt to humans rather than forcing humans to adapt to technology. This represents a fundamental paradigm shift in human-computer interaction.`;

      // Step 1: Settings Panel updates UACP
      settingsPanel.updateUACP(uacpData);

      // Step 2: ContextManager should receive and process the update
      expect(contextManager.contexts.uacp).toBe(uacpData);

      // Step 3: ChatService should receive the context update
      expect(chatService.contextState.uacp).toBe(uacpData);

      // Step 4: Request data should include the UACP
      const requestData = chatService.prepareRequestData('Tell me about our company');
      expect(requestData.context.uacp).toBe(uacpData);
    });

    it('should flow PACP from Settings Panel to Chat Service', async () => {
      const pacpData = {
        version: '1.0.0',
        profile: {
          name: 'Senior Developer',
          preferences: {
            communicationStyle: 'direct',
            detailLevel: 'comprehensive',
            codeExplanationStyle: 'commented',
            preferredLanguages: ['JavaScript', 'TypeScript', 'Python'],
            learningStyle: 'hands-on'
          },
          interests: [
            'AI integration',
            'streaming architectures',
            'context-aware systems',
            'human-computer interaction'
          ],
          expertiseLevel: {
            programming: 'expert',
            systemDesign: 'advanced',
            aiIntegration: 'intermediate'
          },
          personalContext: {
            timezone: 'EST',
            workingHours: '9-17',
            projectTypes: ['AI tools', 'streaming services', 'real-time systems']
          }
        }
      };

      // Step 1: Settings Panel updates PACP
      settingsPanel.updatePACP(JSON.stringify(pacpData));

      // Step 2: ContextManager should receive and process the update
      expect(contextManager.contexts.pacp).toEqual(pacpData);

      // Step 3: ChatService should receive the context update
      expect(chatService.contextState.pacp).toEqual(pacpData);

      // Step 4: Request data should include the PACP
      const requestData = chatService.prepareRequestData('Explain our streaming architecture');
      expect(requestData.context.pacp).toEqual(pacpData);
    });

    it('should flow AI Role changes through the system', async () => {
      const aiRole = 'planner';

      // Step 1: Settings Panel updates AI Role
      settingsPanel.updateAIRole(aiRole);

      // Step 2: ContextManager should receive and process the update
      expect(contextManager.contexts.aiRole).toBe(aiRole);

      // Step 3: ChatService should receive the context update
      expect(chatService.contextState.aiRole).toBe(aiRole);

      // Step 4: Request data should include the AI Role
      const requestData = chatService.prepareRequestData('Help me plan the next sprint');
      expect(requestData.context.role).toBe(aiRole);
    });

    it('should flow System Prompt changes through the system', async () => {
      const systemPrompt = 'You are an expert AI assistant specializing in software development and system architecture. Focus on providing practical, actionable advice.';

      // Step 1: Settings Panel updates System Prompt
      settingsPanel.updateSystemPrompt(systemPrompt);

      // Step 2: ContextManager should receive and process the update
      expect(contextManager.contexts.systemPrompt).toBe(systemPrompt);

      // Step 3: ChatService should receive the context update
      expect(chatService.contextState.systemPrompt).toBe(systemPrompt);

      // Step 4: Request data should include the System Prompt
      const requestData = chatService.prepareRequestData('Help me with architecture');
      expect(requestData.systemPrompt).toBe(systemPrompt);
    });
  });

  describe('Combined Context Scenarios', () => {
    it('should handle multiple context objects together', async () => {
      const mmcoData = {
        project: { name: 'Firesite Chat', type: 'AI-powered chat' },
        task: { current: 'Context Integration', phase: 'testing' }
      };

      const uacpData = '[UACP:business] Firesite builds revolutionary AI systems';

      const pacpData = {
        version: '1.0.0',
        profile: {
          name: 'Technical Lead',
          preferences: { communicationStyle: 'technical', detailLevel: 'comprehensive' }
        }
      };

      const aiRole = 'architect';
      const systemPrompt = 'You are a senior technical architect.';

      // Update all contexts
      settingsPanel.updateMMCO(JSON.stringify(mmcoData));
      settingsPanel.updateUACP(uacpData);
      settingsPanel.updatePACP(JSON.stringify(pacpData));
      settingsPanel.updateAIRole(aiRole);
      settingsPanel.updateSystemPrompt(systemPrompt);

      // Verify all contexts are present in request data
      const requestData = chatService.prepareRequestData('Design our system architecture');

      expect(requestData.context.mmco).toEqual(mmcoData);
      expect(requestData.context.uacp).toBe(uacpData);
      expect(requestData.context.pacp).toEqual(pacpData);
      expect(requestData.context.role).toBe(aiRole);
      expect(requestData.systemPrompt).toBe(systemPrompt);
    });

    it('should handle context updates during active conversations', async () => {
      const initialMMCO = { project: { name: 'Initial Project' } };
      const updatedMMCO = { project: { name: 'Updated Project' } };

      // Set initial context
      settingsPanel.updateMMCO(JSON.stringify(initialMMCO));

      // Simulate conversation
      const initialRequest = chatService.prepareRequestData('What are we working on?');
      expect(initialRequest.context.mmco).toEqual(initialMMCO);

      // Update context mid-conversation
      settingsPanel.updateMMCO(JSON.stringify(updatedMMCO));

      // Next message should use updated context
      const updatedRequest = chatService.prepareRequestData('What changed?');
      expect(updatedRequest.context.mmco).toEqual(updatedMMCO);
    });
  });

  describe('Model Selection Integration', () => {
    it('should integrate model selection with context flow', async () => {
      const selectedModel = 'claude-sonnet-4-20250514';
      
      // Mock localStorage for model selection
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'selectedModel') return selectedModel;
        return null;
      });

      const mmcoData = { project: { name: 'Test Project' } };
      settingsPanel.updateMMCO(JSON.stringify(mmcoData));

      const requestData = chatService.prepareRequestData('Test message');

      expect(requestData.context.mmco).toEqual(mmcoData);
      expect(requestData.context.model).toBe(selectedModel);
    });

    it('should handle model changes with existing context', async () => {
      const contexts = {
        mmco: { project: { name: 'Test' } },
        uacp: 'Test UACP',
        aiRole: 'developer'
      };

      // Set contexts
      Object.entries(contexts).forEach(([key, value]) => {
        if (key === 'mmco') {
          settingsPanel.updateMMCO(JSON.stringify(value));
        } else if (key === 'uacp') {
          settingsPanel.updateUACP(value);
        } else if (key === 'aiRole') {
          settingsPanel.updateAIRole(value);
        }
      });

      // Test with different models
      const models = ['claude-3-7-sonnet-20250219', 'claude-sonnet-4-20250514'];
      
      models.forEach(model => {
        mockLocalStorage.getItem.mockImplementation((key) => {
          if (key === 'selectedModel') return model;
          return null;
        });

        const requestData = chatService.prepareRequestData('Test message');
        expect(requestData.context.model).toBe(model);
        expect(requestData.context.mmco).toEqual(contexts.mmco);
        expect(requestData.context.uacp).toBe(contexts.uacp);
      });
    });
  });

  describe('Persistence Integration', () => {
    it('should persist context changes across sessions', async () => {
      const contexts = {
        mmco: { project: { name: 'Persistent Project' } },
        uacp: 'Persistent UACP content',
        pacp: { version: '1.0.0', profile: { name: 'Persistent User' } },
        systemPrompt: 'Persistent system prompt',
        aiRole: 'planner'
      };

      // Update all contexts
      settingsPanel.updateMMCO(JSON.stringify(contexts.mmco));
      settingsPanel.updateUACP(contexts.uacp);
      settingsPanel.updatePACP(JSON.stringify(contexts.pacp));
      settingsPanel.updateSystemPrompt(contexts.systemPrompt);
      settingsPanel.updateAIRole(contexts.aiRole);

      // Verify localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'firesite:context',
        expect.stringContaining('Persistent Project')
      );

      // Simulate new session - create new services
      const newContextManager = new ContextManager();
      const newChatService = new ChatService();

      // Mock localStorage to return the saved data
      const savedData = {
        contexts: contexts,
        lastUpdated: new Date().toISOString()
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));

      // Initialize new services
      newContextManager.initialize();
      newChatService.initialize();

      // Verify contexts were restored
      expect(newContextManager.contexts.mmco).toEqual(contexts.mmco);
      expect(newContextManager.contexts.uacp).toBe(contexts.uacp);
      expect(newChatService.contextState.mmco).toEqual(contexts.mmco);
      expect(newChatService.contextState.uacp).toBe(contexts.uacp);
    });
  });

  describe('Error Handling in Context Flow', () => {
    it('should handle ContextManager errors gracefully', async () => {
      // Mock ContextManager to throw errors
      const originalUpdateMMCO = contextManager.updateMMCO;
      contextManager.updateMMCO = vi.fn().mockImplementation(() => {
        throw new Error('Context update failed');
      });

      expect(() => {
        settingsPanel.updateMMCO('{"project": {"name": "Test"}}');
      }).not.toThrow();

      // Restore original method
      contextManager.updateMMCO = originalUpdateMMCO;
    });

    it('should handle ChatService context loading errors', async () => {
      // Mock localStorage to throw error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        chatService.loadContextFromStorage();
      }).not.toThrow();
    });

    it('should handle invalid context data gracefully', async () => {
      // Test with various invalid data
      const invalidData = [
        'invalid json',
        '{"incomplete": }',
        null,
        undefined,
        123,
        []
      ];

      invalidData.forEach(data => {
        expect(() => {
          settingsPanel.updateMMCO(data);
        }).not.toThrow();
      });
    });
  });

  describe('Context History Integration', () => {
    it('should maintain context history across the system', async () => {
      const contexts = [
        { mmco: { project: { name: 'Version 1' } } },
        { mmco: { project: { name: 'Version 2' } } },
        { mmco: { project: { name: 'Version 3' } } }
      ];

      // Apply contexts sequentially
      contexts.forEach(context => {
        settingsPanel.updateMMCO(JSON.stringify(context.mmco));
      });

      // Verify history was maintained
      expect(contextManager.contextHistory.length).toBe(contexts.length - 1);

      // Test undo functionality
      const canUndo = contextManager.canUndo();
      expect(canUndo).toBe(true);

      contextManager.undo();
      expect(contextManager.contexts.mmco).toEqual(contexts[1].mmco);
      expect(chatService.contextState.mmco).toEqual(contexts[1].mmco);
    });
  });

  describe('Real-World Scenario Tests', () => {
    it('should handle a complete Kanban development session', async () => {
      // Scenario: Developer working on Kanban system with AI assistant
      const kanbanMMCO = {
        project: {
          name: 'Firesite Kanban System',
          type: 'web-application',
          phase: 'development',
          technologies: ['JavaScript', 'Node.js', 'Claude API'],
          currentSprint: 'Sprint 3',
          deadline: '2025-07-20'
        },
        task: {
          current: 'AI Integration for Card Management',
          priority: 'high',
          status: 'in-progress',
          blockers: ['Context awareness', 'Real-time updates'],
          requirements: ['CRUD operations', 'Drag-and-drop', 'AI suggestions']
        },
        context: {
          environment: 'development',
          codebase: 'https://github.com/firesite/kanban',
          documentation: 'https://docs.firesite.ai/kanban',
          testingFramework: 'Vitest',
          deployment: 'Firebase'
        }
      };

      const firesiteUACP = `[UACP:business]
Firesite is building revolutionary AI infrastructure that inverts the traditional relationship between humans and software. We're creating systems that adapt to humans rather than forcing humans to adapt to technology.

[UACP:technology]
Our core technology stack includes Claude API, Model Context Protocol (MCP), zero re-render streaming architecture, and event-driven service architecture.

[UACP:mission]
We're creating the foundation for human potential where AI becomes a first-class team member with agency and context awareness.`;

      const developerPACP = {
        version: '1.0.0',
        profile: {
          name: 'Senior Full-Stack Developer',
          preferences: {
            communicationStyle: 'direct',
            detailLevel: 'comprehensive',
            codeExplanationStyle: 'commented',
            preferredLanguages: ['JavaScript', 'TypeScript'],
            learningStyle: 'hands-on'
          },
          interests: [
            'AI integration',
            'real-time systems',
            'streaming architectures',
            'context-aware applications'
          ],
          expertiseLevel: {
            programming: 'expert',
            systemDesign: 'advanced',
            aiIntegration: 'intermediate'
          }
        }
      };

      const systemPrompt = 'You are an expert AI assistant specializing in modern web development and AI integration. Focus on practical, actionable advice with code examples.';

      // Set up complete context
      settingsPanel.updateMMCO(JSON.stringify(kanbanMMCO));
      settingsPanel.updateUACP(firesiteUACP);
      settingsPanel.updatePACP(JSON.stringify(developerPACP));
      settingsPanel.updateSystemPrompt(systemPrompt);
      settingsPanel.updateAIRole('developer');

      // Simulate developer asking for help
      const requestData = chatService.prepareRequestData('Help me implement AI-powered card suggestions for our Kanban system');

      // Verify complete context is available
      expect(requestData.context.mmco).toEqual(kanbanMMCO);
      expect(requestData.context.uacp).toBe(firesiteUACP);
      expect(requestData.context.pacp).toEqual(developerPACP);
      expect(requestData.systemPrompt).toBe(systemPrompt);
      expect(requestData.context.role).toBe('developer');
      expect(requestData.message).toBe('Help me implement AI-powered card suggestions for our Kanban system');

      // Verify the AI would have rich context about:
      // - Current project (Kanban system)
      // - Current task (AI Integration)
      // - Technology stack
      // - Company mission and technology
      // - Developer preferences and expertise
      // - Communication style preferences
    });
  });
});