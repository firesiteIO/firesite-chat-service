/**
 * Mode Dropdown Component
 * Unified dropdown for connection mode and model selection
 */

import { globalEvents } from '../core/events/event-emitter.js';
import { modelSelector } from './model-selector.js';
import { connectionToggle } from './connection-toggle.js';

export class ModeDropdown {
  constructor() {
    this.isExpanded = false;
    this.container = null;
    this.dropdownContent = null;
  }
  
  /**
   * Initialize the mode dropdown
   * @param {string} containerId - ID of container element
   */
  initialize(containerId = 'mode-dropdown-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Mode dropdown container not found');
      return;
    }
    
    this.render();
    this.setupEventListeners();
    
    console.log('Mode dropdown initialized');
  }
  
  /**
   * Render the mode dropdown
   */
  render() {
    const currentMode = connectionToggle.getCurrentMode();
    const currentModel = modelSelector.getCurrentModel();
    
    this.container.innerHTML = `
      <div class="mode-dropdown">
        <button class="mode-dropdown-toggle" id="mode-dropdown-toggle">
          <span class="mode-dropdown-label">
            <span class="mode-text">Connection Mode: ${currentMode.name}</span>
            <span class="model-text">(${currentModel.name})</span>
          </span>
          <svg class="chevron-icon ${this.isExpanded ? 'expanded' : ''}" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div class="mode-dropdown-content ${this.isExpanded ? 'expanded' : ''}" id="mode-dropdown-content">
          <div class="dropdown-section">
            <h4 class="dropdown-section-title">Connection Mode</h4>
            <div id="connection-toggle-container"></div>
          </div>
          
          <div class="dropdown-divider"></div>
          
          <div class="dropdown-section">
            <h4 class="dropdown-section-title">Model Selection</h4>
            <div id="model-selector-container"></div>
          </div>
        </div>
      </div>
    `;
    
    // Re-initialize child components in their new containers
    if (this.isExpanded) {
      setTimeout(() => {
        connectionToggle.initialize();
        modelSelector.initialize();
        modelSelector.loadSavedModel();
      }, 0);
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const toggleBtn = document.getElementById('mode-dropdown-toggle');
    if (!toggleBtn) return;
    
    // Toggle dropdown
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isExpanded && !this.container.contains(e.target)) {
        this.closeDropdown();
      }
    });
    
    // Listen for mode/model changes to update the display
    globalEvents.on('connection:modeChanged', () => this.updateDisplay());
    globalEvents.on('anthropic:modelChanged', () => this.updateDisplay());
  }
  
  /**
   * Toggle dropdown expansion
   */
  toggleDropdown() {
    this.isExpanded = !this.isExpanded;
    
    const content = document.getElementById('mode-dropdown-content');
    const chevron = this.container.querySelector('.chevron-icon');
    
    if (this.isExpanded) {
      content.classList.add('expanded');
      chevron.classList.add('expanded');
      
      // Initialize child components
      setTimeout(() => {
        connectionToggle.initialize();
        modelSelector.initialize();
        modelSelector.loadSavedModel();
      }, 0);
    } else {
      content.classList.remove('expanded');
      chevron.classList.remove('expanded');
    }
  }
  
  /**
   * Close dropdown
   */
  closeDropdown() {
    this.isExpanded = false;
    
    const content = document.getElementById('mode-dropdown-content');
    const chevron = this.container.querySelector('.chevron-icon');
    
    if (content) content.classList.remove('expanded');
    if (chevron) chevron.classList.remove('expanded');
  }
  
  /**
   * Update display text
   */
  updateDisplay() {
    const currentMode = connectionToggle.getCurrentMode();
    const currentModel = modelSelector.getCurrentModel();
    
    const modeText = this.container.querySelector('.mode-text');
    const modelText = this.container.querySelector('.model-text');
    
    if (modeText) modeText.textContent = `Connection Mode: ${currentMode.name}`;
    if (modelText) modelText.textContent = `(${currentModel.name})`;
  }
}

// Export singleton instance
export const modeDropdown = new ModeDropdown();
export default modeDropdown;