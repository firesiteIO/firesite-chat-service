/**
 * Enhanced DOMPurify Security Service with highlight.js integration
 * Provides secure HTML sanitization with syntax highlighting support
 * 
 * Features:
 * - DOMPurify sanitization for security
 * - highlight.js syntax highlighting for code blocks
 * - Language detection and highlighting
 * - Streaming-compatible processing
 */

import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

class DOMPurifyService {
  constructor() {
    this.isLoaded = false;
    this.highlightJsLoaded = false;
    this.DOMPurify = DOMPurify;
    this.hljs = hljs;
    
    // Enhanced config for highlight.js compatibility with production security
    this.config = {
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'div', 'strong', 'em', 'b', 'i', 'u',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'pre', 'code', 'blockquote', 'a',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'hr', 'del', 'sup', 'sub'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src', 'class', 'id',
        'data-language', 'data-highlighted', 'language',
        'data-hljs-language', // For highlight.js language detection
        'value' // For ordered list items
      ],
      ALLOW_DATA_ATTR: false, // More secure - only allow specific data attrs
      ALLOWED_DATA_ATTR: ['data-language', 'data-highlighted', 'data-hljs-language'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onfocus', 'onblur'],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_TRUSTED_TYPE: false,
      SANITIZE_DOM: true,
      FORCE_BODY: true,
      // URL sanitization
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      // Prevent DOM clobbering
      SANITIZE_NAMED_PROPS: true,
      SANITIZE_NAMED_PROPS_PREFIX: 'user-content-'
    };
    
    // Supported languages for syntax highlighting
    this.supportedLanguages = [
      'javascript', 'js', 'typescript', 'ts', 'python', 'py',
      'java', 'c', 'cpp', 'csharp', 'php', 'ruby', 'go',
      'rust', 'swift', 'kotlin', 'dart', 'html', 'css',
      'scss', 'sass', 'less', 'xml', 'json', 'yaml', 'yml',
      'markdown', 'md', 'bash', 'shell', 'sh', 'sql',
      'dockerfile', 'nginx', 'apache', 'ini', 'toml'
    ];
  }

  /**
   * Initialize DOMPurify and highlight.js
   */
  async initialize() {
    if (this.isLoaded) return;
    
    try {
      // DOMPurify and hljs are now imported, no need to load
      this._configureDOMPurify();
      this.highlightJsLoaded = true;
      this.isLoaded = true;
      
    } catch (error) {
      console.error('Failed to initialize DOMPurify service:', error);
      throw error;
    }
  }

  /**
   * Load DOMPurify library (deprecated - now imported)
   * @deprecated
   */
  async _loadDOMPurify() {
    // DOMPurify is now imported directly
    return Promise.resolve();
  }

  /**
   * Load highlight.js library (deprecated - now imported)
   * @deprecated
   */
  async _loadHighlightJs() {
    // highlight.js is now imported directly
    return Promise.resolve();
  }

  /**
   * Configure DOMPurify with our security settings
   */
  _configureDOMPurify() {
    if (!this.DOMPurify) return;
    this.DOMPurify.setConfig(this.config);
  }

  /**
   * Sanitize content before display with optional syntax highlighting
   */
  sanitize(dirty, options = {}) {
    if (!this.isLoaded || !this.DOMPurify) {
      console.warn('DOMPurify not loaded, escaping content');
      return this.sanitizePlainText(dirty);
    }
    
    const config = { ...this.config, ...options };
    let cleanContent = this.DOMPurify.sanitize(dirty, config);
    
    // Apply syntax highlighting if enabled and available
    if (options.enableSyntaxHighlighting !== false && this.highlightJsLoaded) {
      cleanContent = this._applySyntaxHighlighting(cleanContent);
    }
    
    return cleanContent;
  }

  /**
   * Production-ready sanitization with strict security
   * Use this for user-generated content in production environments
   */
  sanitizeStrict(dirty, options = {}) {
    if (!this.isLoaded || !this.DOMPurify) {
      return this.sanitizePlainText(dirty);
    }
    
    // Even stricter config for production
    const strictConfig = {
      ...this.config,
      ALLOWED_TAGS: [
        'p', 'br', 'span', 'strong', 'em', 'b', 'i',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'pre', 'code', 'blockquote',
        'a', 'hr'
      ],
      ALLOWED_ATTR: ['href', 'class', 'data-language'],
      FORBID_CONTENTS: ['script', 'style'],
      ...options
    };
    
    return this.DOMPurify.sanitize(dirty, strictConfig);
  }

  /**
   * Sanitize and highlight code blocks specifically
   */
  sanitizeCodeBlock(code, language = null, options = {}) {
    if (!this.isLoaded || !this.DOMPurify) {
      return this.sanitizePlainText(code);
    }
    
    // Create a temporary container for processing
    const container = document.createElement('div');
    const pre = document.createElement('pre');
    const codeElement = document.createElement('code');
    
    // Set language class if provided
    if (language && this.supportedLanguages.includes(language.toLowerCase())) {
      codeElement.className = `language-${language.toLowerCase()}`;
    }
    
    codeElement.textContent = code;
    pre.appendChild(codeElement);
    container.appendChild(pre);
    
    // Apply syntax highlighting if available
    if (this.highlightJsLoaded && this.hljs) {
      try {
        if (language) {
          // Highlight with specific language
          const result = this.hljs.highlight(code, { language: language.toLowerCase() });
          codeElement.innerHTML = result.value;
          codeElement.className = `hljs language-${language.toLowerCase()}`;
        } else {
          // Auto-detect language
          this.hljs.highlightElement(codeElement);
        }
      } catch (error) {
        // If highlighting fails, keep plain text
        console.warn('Syntax highlighting failed:', error);
      }
    }
    
    // Sanitize the highlighted content
    const config = { ...this.config, ...options };
    return this.DOMPurify.sanitize(container.innerHTML, config);
  }

  /**
   * Apply syntax highlighting to existing HTML content
   * @private
   */
  _applySyntaxHighlighting(htmlContent) {
    if (!this.highlightJsLoaded || !this.hljs) {
      return htmlContent;
    }
    
    // Create temporary container to process code blocks
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find all code blocks and apply highlighting
    const codeBlocks = tempDiv.querySelectorAll('pre code, code');
    
    codeBlocks.forEach(codeBlock => {
      // Skip if already highlighted
      if (codeBlock.classList.contains('hljs') || codeBlock.hasAttribute('data-highlighted')) {
        return;
      }
      
      try {
        // Extract language from class attribute
        const languageClass = Array.from(codeBlock.classList).find(cls => cls.startsWith('language-'));
        
        if (languageClass) {
          const language = languageClass.replace('language-', '');
          if (this.supportedLanguages.includes(language)) {
            const result = this.hljs.highlight(codeBlock.textContent, { language });
            codeBlock.innerHTML = result.value;
            codeBlock.className = `hljs language-${language}`;
          }
        } else {
          // Auto-detect and highlight
          this.hljs.highlightElement(codeBlock);
        }
        
        // Mark as highlighted to prevent re-processing
        codeBlock.setAttribute('data-highlighted', 'true');
      } catch (error) {
        // If highlighting fails, keep original content
        console.warn('Failed to highlight code block:', error);
      }
    });
    
    return tempDiv.innerHTML;
  }

  /**
   * Highlight code element directly (for streaming scenarios)
   */
  highlightCodeElement(codeElement, language = null) {
    if (!this.highlightJsLoaded || !this.hljs || !codeElement) {
      return false;
    }
    
    // Skip if already highlighted
    if (codeElement.classList.contains('hljs') || codeElement.hasAttribute('data-highlighted')) {
      return false;
    }
    
    try {
      if (language && this.supportedLanguages.includes(language.toLowerCase())) {
        const result = this.hljs.highlight(codeElement.textContent, { language: language.toLowerCase() });
        codeElement.innerHTML = result.value;
        codeElement.className = `hljs language-${language.toLowerCase()}`;
      } else {
        this.hljs.highlightElement(codeElement);
      }
      
      codeElement.setAttribute('data-highlighted', 'true');
      return true;
    } catch (error) {
      console.warn('Failed to highlight code element:', error);
      return false;
    }
  }

  /**
   * Sanitize for plain text (no HTML)
   */
  sanitizePlainText(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.isLoaded && this.DOMPurify;
  }

  /**
   * Check if syntax highlighting is available
   */
  isHighlightingReady() {
    return this.highlightJsLoaded && this.hljs;
  }

  /**
   * Get supported languages for syntax highlighting
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }
}

// Export singleton instance
export const domPurifyService = new DOMPurifyService();
export default domPurifyService;

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      domPurifyService.initialize().catch(console.error);
    });
  } else {
    domPurifyService.initialize().catch(console.error);
  }
}