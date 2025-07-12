/**
 * Stream Display Settings Service
 * Manages configuration for stream display options including natural typing,
 * animations, and other streaming behavior settings
 */
export class StreamDisplaySettingsService {
  constructor() {
    this.settings = this._getDefaultSettings();
    this._loadFromStorage();
    this._bindEvents();
  }

  /**
   * Get default settings configuration
   * @returns {Object} Default settings object
   */
  _getDefaultSettings() {
    return {
      naturalTyping: {
        enabled: true,
        baseSpeed: 30,
        variability: 15,
        punctuationPause: 200
      },
      animations: {
        codeBlocks: true,
        headers: true,
        lists: true,
        tables: true
      },
      advanced: {
        bufferTime: 100,
        paragraphPause: 300,
        previewMode: false
      }
    };
  }

  /**
   * Load settings from localStorage
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem('streamDisplaySettings');
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.settings = { ...this.settings, ...parsedSettings };
      }
    } catch (error) {
      console.warn('Failed to load stream display settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  _saveToStorage() {
    try {
      localStorage.setItem('streamDisplaySettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save stream display settings:', error);
    }
  }

  /**
   * Bind event listeners for settings updates
   */
  _bindEvents() {
    // Listen for settings panel updates
    document.addEventListener('stream-settings-update', (event) => {
      this.updateSetting(event.detail.key, event.detail.value);
    });

    // Listen for natural typing toggle from main UI
    document.addEventListener('natural-typing-toggle', (event) => {
      this.updateSetting('naturalTyping.enabled', event.detail.enabled);
    });
  }

  /**
   * Update a specific setting
   * @param {string} key - Dot notation key (e.g., 'naturalTyping.baseSpeed')
   * @param {*} value - New value
   */
  updateSetting(key, value) {
    const keys = key.split('.');
    let target = this.settings;
    
    // Navigate to the correct nested object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    
    // Set the value
    target[keys[keys.length - 1]] = value;
    
    // Save to storage
    this._saveToStorage();
    
    // Emit update event
    document.dispatchEvent(new CustomEvent('stream-settings-changed', {
      detail: { key, value, settings: this.settings }
    }));
  }

  /**
   * Get a specific setting value
   * @param {string} key - Dot notation key
   * @returns {*} Setting value
   */
  getSetting(key) {
    const keys = key.split('.');
    let value = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Get all settings
   * @returns {Object} Complete settings object
   */
  getAllSettings() {
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults() {
    this.settings = this._getDefaultSettings();
    this._saveToStorage();
    
    // Emit reset event
    document.dispatchEvent(new CustomEvent('stream-settings-reset', {
      detail: { settings: this.settings }
    }));
  }

  /**
   * Get typing configuration for replay streaming
   * @returns {Object} Typing configuration
   */
  getTypingConfig() {
    return {
      enabled: this.settings.naturalTyping.enabled,
      baseDelay: Math.max(1, 1000 / this.settings.naturalTyping.baseSpeed), // Convert WPM to delay
      variability: this.settings.naturalTyping.variability / 100, // Convert percentage to decimal
      punctuationDelay: this.settings.naturalTyping.punctuationPause,
      bufferTime: this.settings.advanced.bufferTime,
      paragraphPause: this.settings.advanced.paragraphPause
    };
  }

  /**
   * Get animation configuration
   * @returns {Object} Animation settings
   */
  getAnimationConfig() {
    return {
      ...this.settings.animations,
      previewMode: this.settings.advanced.previewMode
    };
  }
}

// Export singleton instance
export const streamDisplaySettings = new StreamDisplaySettingsService();
export default streamDisplaySettings;