/**
 * Upgrade Modal Component
 * Shows upgrade prompts when users try to access MCP Max features while on Base Server
 */

import { modalDialog } from './modal-dialog.js';
import { globalEvents } from '../core/events/event-emitter.js';

export class UpgradeModal {
  constructor() {
    this.isVisible = false;
  }

  /**
   * Show upgrade modal for specific feature
   * @param {string} feature - Feature that requires upgrade
   * @param {Object} options - Additional options
   */
  show(feature, options = {}) {
    const featureInfo = this.getFeatureInfo(feature);
    
    modalDialog.show({
      title: '🚀 Upgrade to MCP Max Required',
      content: this.generateUpgradeContent(featureInfo, options),
      type: 'upgrade',
      primaryButton: {
        text: 'Upgrade to MCP Max',
        action: () => this.handleUpgrade()
      },
      secondaryButton: {
        text: 'Learn More',
        action: () => this.handleLearnMore()
      },
      size: 'large'
    });

    this.isVisible = true;
  }

  /**
   * Get feature information for upgrade prompt
   * @param {string} feature - Feature name
   * @returns {Object} Feature information
   */
  getFeatureInfo(feature) {
    const features = {
      'context-objects': {
        name: 'Context Objects (MMCO/UACP/PACP)',
        description: 'Persistent AI memory and project context',
        benefits: [
          'AI remembers your project details',
          'Personalized communication style',
          'Project-specific context awareness',
          'Persistent conversation memory'
        ]
      },
      'ai-modes': {
        name: 'Specialized AI Modes & Roles',
        description: 'Context-aware AI personas with persistent memory',
        benefits: [
          'Context-aware Developer mode',
          'Project-specific Designer guidance',
          'System Architect with memory',
          'Custom roles with context integration',
          'AI remembers your project details',
          'Role-based conversation persistence'
        ]
      },
      'system-prompts': {
        name: 'Custom System Prompts',
        description: 'Advanced AI behavior customization',
        benefits: [
          'Tailor AI responses to your needs',
          'Create specialized AI assistants',
          'Fine-tune communication style',
          'Project-specific AI behavior'
        ]
      },
      'sessions': {
        name: 'Session Management',
        description: 'Persistent conversations and context',
        benefits: [
          'Resume conversations seamlessly',
          'Maintain context across sessions',
          'Project-based conversation history',
          'Advanced memory capabilities'
        ]
      }
    };

    return features[feature] || {
      name: 'Advanced Features',
      description: 'Enhanced AI capabilities',
      benefits: ['More powerful AI assistance', 'Advanced customization options']
    };
  }

  /**
   * Generate upgrade modal content
   * @param {Object} featureInfo - Feature information
   * @param {Object} options - Additional options
   * @returns {string} HTML content
   */
  generateUpgradeContent(featureInfo, options) {
    return `
      <div class="upgrade-modal-content">
        <div class="upgrade-feature-highlight">
          <div class="feature-icon">⚡</div>
          <h3>${featureInfo.name}</h3>
          <p class="feature-description">${featureInfo.description}</p>
        </div>

        <div class="upgrade-comparison">
          <div class="server-comparison">
            <div class="server-option current">
              <div class="server-header">
                <div class="server-icon">🔧</div>
                <h4>Base Server (Current)</h4>
                <span class="server-status">Port 3001</span>
              </div>
              <ul class="server-features">
                <li>✅ Basic AI conversations</li>
                <li>✅ Basic system prompts</li>
                <li>✅ Model selection</li>
                <li>✅ Streaming markdown</li>
                <li>✅ Code syntax highlighting</li>
                <li>❌ Context objects (MMCO/UACP/PACP)</li>
                <li>❌ Specialized AI modes & roles</li>
                <li>❌ Session persistence with context</li>
              </ul>
            </div>

            <div class="server-option upgrade">
              <div class="server-header">
                <div class="server-icon">🚀</div>
                <h4>MCP Max Server</h4>
                <span class="server-status">Port 3002</span>
                <span class="upgrade-badge">UPGRADE</span>
              </div>
              <ul class="server-features">
                <li>✅ Everything in Base Server</li>
                <li>✅ <strong>Context objects (MMCO/UACP/PACP)</strong></li>
                <li>✅ <strong>Specialized AI modes & roles</strong></li>
                <li>✅ <strong>Session persistence with context</strong></li>
                <li>✅ <strong>AI role-based system prompts</strong></li>
                <li>✅ <strong>Advanced memory capabilities</strong></li>
                <li>✅ <strong>Project-aware conversations</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="upgrade-benefits">
          <h4>🎯 What You'll Get with ${featureInfo.name}:</h4>
          <ul class="benefits-list">
            ${featureInfo.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
          </ul>
        </div>

        <div class="upgrade-setup">
          <h4>🔧 Quick Setup:</h4>
          <ol class="setup-steps">
            <li>Ensure MCP Max server is running on <code>localhost:3002</code></li>
            <li>Switch to "MCP Max" in the connection mode dropdown</li>
            <li>Start using advanced features immediately!</li>
          </ol>
        </div>

        ${options.currentAttempt ? `
          <div class="upgrade-attempt-note">
            <p><strong>You tried to:</strong> ${options.currentAttempt}</p>
            <p>This feature requires MCP Max server for enhanced AI capabilities.</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Handle upgrade button click
   */
  handleUpgrade() {
    // Emit event to switch to MCP Max
    globalEvents.emit('upgrade:switchToMax', {
      reason: 'user_requested_upgrade',
      timestamp: Date.now()
    });
    
    // Close modal
    modalDialog.hide();
    this.isVisible = false;
  }

  /**
   * Handle learn more button click
   */
  handleLearnMore() {
    // Open documentation or help
    const helpUrl = 'https://github.com/firesiteio/firesite-mcp-max#features';
    window.open(helpUrl, '_blank');
  }

  /**
   * Show quick feature restriction notice
   * @param {string} featureName - Name of the restricted feature
   */
  showQuickNotice(featureName) {
    globalEvents.emit('ui:notification', {
      type: 'info',
      message: `${featureName} requires MCP Max server. Click here to upgrade.`,
      duration: 5000,
      action: {
        text: 'Upgrade',
        handler: () => this.show('context-objects', { currentAttempt: `access ${featureName}` })
      }
    });
  }

  /**
   * Check if modal is currently visible
   * @returns {boolean} True if modal is visible
   */
  isShowing() {
    return this.isVisible;
  }
}

// Export singleton instance
export const upgradeModal = new UpgradeModal();
export default upgradeModal;