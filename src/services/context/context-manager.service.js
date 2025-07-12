/**
 * ContextManager - Manages MMCO, UACP, and PACP context systems
 * 
 * Handles the three types of AI context:
 * - MMCO: Micro Meta Context Objects (project/task specific JSON objects)
 * - UACP: Universal AI Context Profile (business/product context)
 * - PACP: Personal AI Context Profile (individual user preferences)
 * 
 * Service-First Architecture following SOLID principles
 */

import { globalEvents, Events } from '../../core/events/event-emitter.js';

export class ContextManager {
  constructor(options = {}) {
    this.options = {
      enablePersistence: true,
      storageKey: 'firesite:context',
      enableValidation: true,
      enableContextHistory: true,
      maxHistorySize: 50,
      ...options
    };
    
    // Context state with new acronym definitions
    this.contexts = {
      mmco: null,        // Micro Meta Context Objects
      uacp: null,        // Universal AI Context Profile
      pacp: null,        // Personal AI Context Profile
      systemPrompt: null,
      aiRole: 'developer'
    };
    
    // Context schemas for validation
    this.schemas = {
      mmco: this.getMMCOSchema(),
      uacp: this.getUACPSchema(), 
      pacp: this.getPACPSchema()
    };
    
    // Context history for undo/redo
    this.contextHistory = [];
    this.historyIndex = -1;
    
    // Initialized flag
    this.initialized = false;
  }
  
  /**
   * Initialize the context manager
   */
  initialize() {
    console.log('Initializing ContextManager...');
    
    // Load persisted contexts
    if (this.options.enablePersistence) {
      this.loadFromStorage();
    }
    
    // Initialize with default PACP if none exists
    if (!this.contexts.pacp) {
      this.contexts.pacp = this.createDefaultPACP();
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    this.initialized = true;
    globalEvents.emit(Events.SERVICE_INITIALIZED, { service: 'ContextManager' });
    
    console.log('ContextManager initialized');
    return this;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for context updates from UI
    globalEvents.on('context:update:mmco', (data) => {
      this.updateMMCO(data);
    });
    
    globalEvents.on('context:update:uacp', (data) => {
      this.updateUACP(data);
    });
    
    globalEvents.on('context:update:pacp', (data) => {
      this.updatePACP(data);
    });
    
    globalEvents.on('context:update:systemPrompt', (data) => {
      this.updateSystemPrompt(data);
    });
    
    globalEvents.on('context:update:aiRole', (data) => {
      this.updateAIRole(data);
    });
  }
  
  /**
   * Get all contexts
   */
  getAllContexts() {
    return { ...this.contexts };
  }
  
  /**
   * Update MMCO (Micro Meta Context Objects)
   * @param {Object|string} mmcoData - MMCO data as object or JSON string
   */
  updateMMCO(mmcoData) {
    try {
      let parsedMMCO;
      
      if (typeof mmcoData === 'string') {
        parsedMMCO = JSON.parse(mmcoData);
      } else {
        parsedMMCO = mmcoData;
      }
      
      // Validate MMCO structure
      if (this.options.enableValidation) {
        this.validateContext('mmco', parsedMMCO);
      }
      
      // Save to history
      this.saveToHistory();
      
      // Update context
      this.contexts.mmco = parsedMMCO;
      
      // Persist changes
      this.persistChanges();
      
      // Emit update event
      globalEvents.emit('context:mmco:updated', {
        mmco: this.contexts.mmco,
        timestamp: new Date().toISOString()
      });
      
      console.log('MMCO updated:', this.contexts.mmco);
      
    } catch (error) {
      console.error('Error updating MMCO:', error);
      globalEvents.emit('context:error', {
        type: 'mmco',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Update UACP (Universal AI Context Profile)
   * @param {string} uacpData - UACP text content
   */
  updateUACP(uacpData) {
    try {
      // Validate UACP format
      if (this.options.enableValidation) {
        this.validateContext('uacp', uacpData);
      }
      
      // Save to history
      this.saveToHistory();
      
      // Update context
      this.contexts.uacp = uacpData;
      
      // Persist changes
      this.persistChanges();
      
      // Emit update event
      globalEvents.emit('context:uacp:updated', {
        uacp: this.contexts.uacp,
        timestamp: new Date().toISOString()
      });
      
      console.log('UACP updated');
      
    } catch (error) {
      console.error('Error updating UACP:', error);
      globalEvents.emit('context:error', {
        type: 'uacp',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Update PACP (Personal AI Context Profile)
   * @param {Object|string} pacpData - PACP data as object or JSON string
   */
  updatePACP(pacpData) {
    try {
      let parsedPACP;
      
      if (typeof pacpData === 'string') {
        parsedPACP = JSON.parse(pacpData);
      } else {
        parsedPACP = pacpData;
      }
      
      // Validate PACP structure
      if (this.options.enableValidation) {
        this.validateContext('pacp', parsedPACP);
      }
      
      // Save to history
      this.saveToHistory();
      
      // Update context
      this.contexts.pacp = parsedPACP;
      
      // Persist changes
      this.persistChanges();
      
      // Emit update event
      globalEvents.emit('context:pacp:updated', {
        pacp: this.contexts.pacp,
        timestamp: new Date().toISOString()
      });
      
      console.log('PACP updated:', this.contexts.pacp);
      
    } catch (error) {
      console.error('Error updating PACP:', error);
      globalEvents.emit('context:error', {
        type: 'pacp',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Update system prompt
   * @param {string} promptText - System prompt text
   */
  updateSystemPrompt(promptText) {
    // Save to history
    this.saveToHistory();
    
    // Update context
    this.contexts.systemPrompt = promptText;
    
    // Persist changes
    this.persistChanges();
    
    // Emit update event
    globalEvents.emit('context:systemPrompt:updated', {
      systemPrompt: this.contexts.systemPrompt,
      timestamp: new Date().toISOString()
    });
    
    console.log('System prompt updated');
  }
  
  /**
   * Update AI role
   * @param {string} role - AI role (developer, planner, tester, writer)
   */
  updateAIRole(role) {
    const validRoles = ['developer', 'planner', 'tester', 'writer'];
    
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid AI role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }
    
    // Save to history
    this.saveToHistory();
    
    // Update context
    this.contexts.aiRole = role;
    
    // Persist changes
    this.persistChanges();
    
    // Emit update event
    globalEvents.emit('context:aiRole:updated', {
      aiRole: this.contexts.aiRole,
      timestamp: new Date().toISOString()
    });
    
    console.log('AI role updated:', role);
  }
  
  /**
   * Create default PACP (Personal AI Context Profile)
   */
  createDefaultPACP() {
    return {
      version: '1.0.0',
      profile: {
        name: 'Default User',
        preferences: {
          communicationStyle: 'professional',
          detailLevel: 'moderate',
          codeExplanationStyle: 'commented',
          preferredLanguages: ['javascript', 'typescript'],
          learningStyle: 'hands-on'
        },
        interests: [
          'web development',
          'software architecture',
          'AI integration'
        ],
        expertiseLevel: {
          programming: 'intermediate',
          systemDesign: 'beginner',
          aiIntegration: 'beginner'
        },
        personalContext: {
          timezone: 'UTC',
          workingHours: '9-17',
          projectTypes: ['web applications', 'ai tools']
        }
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }
  
  /**
   * Get MMCO schema for validation
   */
  getMMCOSchema() {
    return {
      type: 'object',
      properties: {
        project: { type: 'object' },
        task: { type: 'object' },
        context: { type: 'object' },
        conversations: { type: 'object' },
        metadata: { type: 'object' }
      }
    };
  }
  
  /**
   * Get UACP schema for validation
   */
  getUACPSchema() {
    return {
      type: 'string',
      minLength: 1,
      pattern: '\\[UACP:'  // Should contain UACP tags
    };
  }
  
  /**
   * Get PACP schema for validation
   */
  getPACPSchema() {
    return {
      type: 'object',
      required: ['version', 'profile'],
      properties: {
        version: { type: 'string' },
        profile: {
          type: 'object',
          required: ['name', 'preferences'],
          properties: {
            name: { type: 'string' },
            preferences: { type: 'object' },
            interests: { type: 'array' },
            expertiseLevel: { type: 'object' },
            personalContext: { type: 'object' }
          }
        },
        metadata: { type: 'object' }
      }
    };
  }
  
  /**
   * Validate context data against schema
   * @param {string} contextType - Type of context (mmco, uacp, pacp)
   * @param {any} data - Data to validate
   */
  validateContext(contextType, data) {
    const schema = this.schemas[contextType];
    if (!schema) {
      console.warn(`No schema available for context type: ${contextType}`);
      return true;
    }
    
    // Basic validation (in a real implementation, use a proper JSON schema validator)
    if (contextType === 'mmco' || contextType === 'pacp') {
      if (typeof data !== 'object' || data === null) {
        throw new Error(`${contextType.toUpperCase()} must be a valid object`);
      }
    }
    
    if (contextType === 'uacp') {
      if (typeof data !== 'string' || data.length === 0) {
        throw new Error('UACP must be a non-empty string');
      }
    }
    
    return true;
  }
  
  /**
   * Save current state to history for undo/redo
   */
  saveToHistory() {
    if (!this.options.enableContextHistory) return;
    
    // Remove any future history if we're not at the end
    if (this.historyIndex < this.contextHistory.length - 1) {
      this.contextHistory = this.contextHistory.slice(0, this.historyIndex + 1);
    }
    
    // Add current state to history
    this.contextHistory.push({
      contexts: JSON.parse(JSON.stringify(this.contexts)),
      timestamp: new Date().toISOString()
    });
    
    // Trim history if it gets too large
    if (this.contextHistory.length > this.options.maxHistorySize) {
      this.contextHistory.shift();
    } else {
      this.historyIndex++;
    }
  }
  
  /**
   * Undo last context change
   */
  undo() {
    if (!this.canUndo()) {
      console.warn('Cannot undo: no previous state available');
      return false;
    }
    
    this.historyIndex--;
    this.contexts = JSON.parse(JSON.stringify(this.contextHistory[this.historyIndex].contexts));
    
    this.persistChanges();
    this.emitAllContextUpdates();
    
    console.log('Context undo performed');
    return true;
  }
  
  /**
   * Redo next context change
   */
  redo() {
    if (!this.canRedo()) {
      console.warn('Cannot redo: no future state available');
      return false;
    }
    
    this.historyIndex++;
    this.contexts = JSON.parse(JSON.stringify(this.contextHistory[this.historyIndex].contexts));
    
    this.persistChanges();
    this.emitAllContextUpdates();
    
    console.log('Context redo performed');
    return true;
  }
  
  /**
   * Check if undo is possible
   */
  canUndo() {
    return this.historyIndex > 0;
  }
  
  /**
   * Check if redo is possible
   */
  canRedo() {
    return this.historyIndex < this.contextHistory.length - 1;
  }
  
  /**
   * Emit all context update events
   */
  emitAllContextUpdates() {
    globalEvents.emit('context:all:updated', {
      contexts: this.contexts,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Persist changes to storage
   */
  persistChanges() {
    if (!this.options.enablePersistence) return;
    
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify({
        contexts: this.contexts,
        history: this.contextHistory,
        historyIndex: this.historyIndex,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to persist context changes:', error);
    }
  }
  
  /**
   * Load contexts from storage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (!stored) return;
      
      const data = JSON.parse(stored);
      
      if (data.contexts) {
        this.contexts = { ...this.contexts, ...data.contexts };
      }
      
      if (data.history && this.options.enableContextHistory) {
        this.contextHistory = data.history;
        this.historyIndex = data.historyIndex || -1;
      }
      
      console.log('Context loaded from storage');
      
    } catch (error) {
      console.error('Failed to load context from storage:', error);
    }
  }
  
  /**
   * Clear all contexts
   */
  clearAllContexts() {
    // Save to history first
    this.saveToHistory();
    
    // Clear contexts
    this.contexts = {
      mmco: null,
      uacp: null,
      pacp: this.createDefaultPACP(), // Keep default PACP
      systemPrompt: null,
      aiRole: 'developer'
    };
    
    // Persist changes
    this.persistChanges();
    
    // Emit updates
    this.emitAllContextUpdates();
    
    console.log('All contexts cleared');
  }
  
  /**
   * Export contexts
   * @param {string} format - Export format (json, yaml, etc.)
   */
  exportContexts(format = 'json') {
    const exportData = {
      contexts: this.contexts,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Import contexts
   * @param {string} data - Import data
   * @param {string} format - Import format
   */
  importContexts(data, format = 'json') {
    try {
      let importData;
      
      switch (format.toLowerCase()) {
        case 'json':
          importData = JSON.parse(data);
          break;
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
      
      if (!importData.contexts) {
        throw new Error('Invalid import data: missing contexts');
      }
      
      // Save current state to history
      this.saveToHistory();
      
      // Update contexts
      this.contexts = { ...this.contexts, ...importData.contexts };
      
      // Persist changes
      this.persistChanges();
      
      // Emit updates
      this.emitAllContextUpdates();
      
      console.log('Contexts imported successfully');
      
    } catch (error) {
      console.error('Failed to import contexts:', error);
      throw error;
    }
  }
  
  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      contextsCount: Object.keys(this.contexts).filter(key => this.contexts[key] !== null).length,
      historySize: this.contextHistory.length,
      historyIndex: this.historyIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
  
  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized;
  }
  
  /**
   * Dispose of the service
   */
  dispose() {
    this.initialized = false;
    
    // Remove event listeners
    globalEvents.off('context:update:mmco');
    globalEvents.off('context:update:uacp');
    globalEvents.off('context:update:pacp');
    globalEvents.off('context:update:systemPrompt');
    globalEvents.off('context:update:aiRole');
    
    console.log('ContextManager disposed');
  }
}

// Export singleton instance
export const contextManager = new ContextManager();
export default contextManager;