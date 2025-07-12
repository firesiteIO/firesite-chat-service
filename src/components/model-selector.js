/**
 * Model Selector Component
 * Allows users to choose between different Claude models
 */

import { globalEvents } from '../core/events/event-emitter.js';
import { anthropicDirectService } from '../services/anthropic/anthropic-direct.service.js';
import { modalDialog } from './modal-dialog.js';

export class ModelSelector {
  constructor() {
    // Model definitions with additional metadata
    this.models = [
      { 
        id: 'claude-opus-4-20250514', 
        name: 'Claude 4 Opus', 
        description: 'Most capable & intelligent model',
        characteristics: {
          capability: 'highest',
          cost: 'premium',
          warning: 'Premium model - Higher token costs apply',
          warningType: 'cost'
        }
      },
      { 
        id: 'claude-sonnet-4-20250514', 
        name: 'Claude 4 Sonnet', 
        description: 'High-performance with exceptional reasoning',
        characteristics: {
          capability: 'high',
          cost: 'standard'
        }
      },
      { 
        id: 'claude-3-7-sonnet-20250219', 
        name: 'Claude 3.7 Sonnet', 
        description: 'Recommended upgrade from 3.5',
        characteristics: {
          capability: 'high',
          cost: 'standard',
          isDefault: true
        }
      },
      { 
        id: 'claude-3-5-haiku-20241022', 
        name: 'Claude 3.5 Haiku', 
        description: 'Fast & efficient',
        characteristics: {
          capability: 'basic',
          cost: 'economical',
          warning: 'Faster but less capable - Best for simple tasks',
          warningType: 'capability'
        }
      },
      { 
        id: 'claude-3-5-sonnet-20241022', 
        name: 'Claude 3.5 Sonnet', 
        description: 'Balanced v3.5 model',
        characteristics: {
          capability: 'high',
          cost: 'standard'
        }
      },
      { 
        id: 'claude-3-opus-20240229', 
        name: 'Claude 3 Opus', 
        description: 'Powerful v3 reasoning',
        characteristics: {
          capability: 'high',
          cost: 'premium',
          warning: 'Previous generation Opus - Consider Claude 4 models',
          warningType: 'version'
        }
      }
    ];
    
    // Model aliases mapping
    this.modelAliases = {
      'claude-sonnet-latest': 'claude-sonnet-4-20250514',
      'claude-opus-latest': 'claude-opus-4-20250514',
      'claude-haiku-latest': 'claude-3-5-haiku-20241022'
    };
    
    // Get default model (claude-sonnet-latest mapped to actual ID)
    const savedModel = localStorage.getItem('selectedModel');
    const defaultModel = this.models.find(m => m.characteristics.isDefault)?.id || this.models[0].id;
    this.currentModel = this.resolveModelAlias(savedModel) || defaultModel;
    
    this.container = null;
    this.warningTimeout = null;
  }
  
  /**
   * Resolve model alias to actual model ID
   * @param {string} modelId - Model ID or alias
   * @returns {string} Resolved model ID
   */
  resolveModelAlias(modelId) {
    return this.modelAliases[modelId] || modelId;
  }
  
  /**
   * Initialize the model selector
   * @param {string} containerId - ID of container element
   */
  initialize(containerId = 'model-selector-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Model selector container not found');
      return;
    }
    
    this.render();
    this.setupEventListeners();
    
    // No initial warnings for default models
    
    console.log('Model selector initialized');
  }
  
  /**
   * Render the model selector
   */
  render() {
    const currentModelInfo = this.models.find(m => m.id === this.currentModel) || this.models[0];
    
    this.container.innerHTML = `
      <div class="model-selector">
        <label class="model-selector-label">Model:</label>
        <div class="model-selector-wrapper">
          <select id="model-select" class="model-select">
            ${this.models.map(model => `
              <option value="${model.id}" ${model.id === this.currentModel ? 'selected' : ''}>
                ${model.name}
              </option>
            `).join('')}
          </select>
          <div class="model-description">${currentModelInfo.description}</div>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const select = document.getElementById('model-select');
    if (!select) return;
    
    select.addEventListener('change', (e) => {
      this.handleModelChange(e.target.value);
    });
    
    // Listen for external model changes
    globalEvents.on('anthropic:modelChanged', (data) => {
      if (data.model !== this.currentModel) {
        this.currentModel = data.model;
        this.render();
      }
    });
  }
  
  /**
   * Handle model change
   * @param {string} modelId - Selected model ID
   */
  handleModelChange(modelId) {
    const model = this.models.find(m => m.id === modelId);
    if (!model) return;
    
    // Show warning modal if applicable (but not for default model)
    if (model.characteristics.warning && !model.characteristics.isDefault) {
      const select = document.getElementById('model-select');
      
      modalDialog.show({
        title: `${model.name} - Important Notice`,
        content: `
          <div class="model-warning-modal">
            <p>${model.characteristics.warning}</p>
            <p>Do you want to continue with <strong>${model.name}</strong>?</p>
          </div>
        `,
        type: model.characteristics.warningType === 'cost' ? 'warning' : 'info',
        onClose: () => {
          // User confirmed, proceed with model change
          this.setModel(modelId);
        }
      });
      
      // Revert select to current model until user confirms
      if (select) {
        select.value = this.currentModel;
      }
    } else {
      // No warning or default model, proceed immediately
      this.setModel(modelId);
    }
  }
  
  /**
   * Set the model (after any warnings are handled)
   * @param {string} modelId - Model ID to set
   */
  setModel(modelId) {
    const model = this.models.find(m => m.id === modelId);
    if (!model) return;
    
    this.currentModel = modelId;
    anthropicDirectService.setModel(modelId);
    
    // Update description
    const descElement = this.container.querySelector('.model-description');
    if (descElement) {
      descElement.textContent = model.description;
    }
    
    // Update select if it was reverted
    const select = document.getElementById('model-select');
    if (select && select.value !== modelId) {
      select.value = modelId;
    }
    
    // Save to localStorage
    localStorage.setItem('selectedModel', modelId);
    
    // Emit model change event
    globalEvents.emit('anthropic:modelChanged', { model: modelId });
    
    console.log(`Model changed to: ${model.name}`);
  }
  
  
  /**
   * Load saved model preference
   */
  loadSavedModel() {
    const savedModel = localStorage.getItem('selectedModel');
    if (savedModel) {
      // Resolve alias if needed
      const resolvedModel = this.resolveModelAlias(savedModel);
      if (this.models.find(m => m.id === resolvedModel)) {
        this.currentModel = resolvedModel;
        anthropicDirectService.setModel(resolvedModel);
      }
    }
  }
  
  /**
   * Get current model
   * @returns {Object} Current model info
   */
  getCurrentModel() {
    return this.models.find(m => m.id === this.currentModel);
  }
}

// Export singleton instance
export const modelSelector = new ModelSelector();
export default modelSelector;