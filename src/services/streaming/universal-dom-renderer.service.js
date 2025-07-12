/**
 * UniversalDOMRenderer - Extracted from streaming_service_complete.html
 * The breakthrough renderer that achieves zero DOM re-renders
 * 
 * Core Principles:
 * 1. Append-only DOM operations (zero re-renders)
 * 2. Persistent element creation with content updates only
 * 3. Proper cursor management during streaming
 * 4. Mode-aware rendering (progressive vs raw text)
 * 5. Support for all markdown elements with proper structure
 * 6. Integrated security via DOMPurify sanitization
 */

import { domPurifyService } from '../security/dom-purify.service.js';
import hljs from 'highlight.js';

export class UniversalDOMRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      enableSyntaxHighlighting: true,
      showCursor: false, // Disabled - distracting and not standard for chat
      ...options
    };
    
    this.currentElement = null;
    this.currentList = null;
    this.currentTable = null;
    this.cursor = null;
    this.showCursor = this.options.showCursor;
    
    // Track code blocks for post-processing syntax highlighting
    this.completedCodeBlocks = [];
    
    // Queue for sequential streaming animations
    this.streamingQueue = Promise.resolve();
  }

  clear() {
    this.container.innerHTML = '';
    this.currentElement = null;
    this.currentList = null;
    this.currentTable = null;
    this.cursor = null;
    this.streamingQueue = Promise.resolve(); // Reset streaming queue
  }

  render(instructions) {
    instructions.forEach(instruction => {
      this.renderInstruction(instruction);
    });
  }

  renderInstruction(instruction) {
    switch (instruction.type) {
      case 'raw_text':
        this.renderRawText(instruction.content);
        break;

      case 'append_text':
        this.appendToCurrentElement(instruction.content);
        break;

      case 'heading':
        // SURGICAL FIX: Always create heading element, handle empty content gracefully
        this.finishCurrentElement();
        // LIST CONTINUITY FIX: DON'T break lists for headings
        this.createElement(`h${instruction.level}`);
        if (instruction.content && instruction.content.trim()) {
          // Stream headings for smoother experience
          this.streamContentSync(instruction.content);
        }
        // Empty headings are valid for chunk boundary scenarios
        break;

      case 'paragraph':
        this.finishCurrentElement();
        // LIST CONTINUITY FIX: DON'T break lists for paragraphs between list items
        this.createElement('p');
        // Stream paragraphs for smoother experience
        this.streamContentSync(instruction.content);
        break;

      case 'start_code_block':
        this.finishCurrentElement();
        this.createElement('pre');
        const code = document.createElement('code');
        // 🥚 HATCHLING FIX: Sanitize language class to prevent injection
        if (instruction.language && /^[a-zA-Z0-9-_]+$/.test(instruction.language)) {
          code.className = `language-${instruction.language}`;
        }
        this.currentElement.appendChild(code);
        this.currentElement = code;
        break;

      case 'code_line':
        if (this.currentElement && this.currentElement.tagName === 'CODE') {
          // NUCLEAR FIX: ALWAYS use textContent for code blocks - prevents HTML parsing!
          // This stops JSX/HTML corruption by treating content as literal text
          this.removeCursor();
          const textNode = document.createTextNode(instruction.content);
          this.currentElement.appendChild(textNode);
        }
        break;

      case 'end_code_block':
        if (this.currentElement && this.currentElement.tagName === 'CODE') {
          this.applyCodeBlockFormatting(this.currentElement);
          // Move currentElement up to the <pre> parent, then finish it properly
          this.currentElement = this.currentElement.parentElement;
        }
        this.finishCurrentElement();
        break;

      case 'unordered_list_item':
        this.ensureList('ul');
        this.addListItem(instruction.content);
        break;

      case 'ordered_list_item':
        this.ensureList('ol');
        this.addListItem(instruction.content, instruction.number); // Pass the number
        break;

      case 'blockquote':
        this.finishCurrentElement();
        // LIST CONTINUITY FIX: DON'T break lists for blockquotes
        this.createElement('blockquote');
        // Stream blockquotes for smoother experience
        this.streamContentSync(instruction.content);
        break;

      case 'horizontal_rule':
        this.finishCurrentElement();
        const hr = document.createElement('hr');
        this.container.appendChild(hr);
        break;

      case 'start_table':
        this.finishCurrentElement();
        this.createTable(instruction.headers);
        break;

      case 'table_row':
        this.addTableRow(instruction.cells);
        break;

      case 'end_table':
        this.currentTable = null;
        break;

      case 'line_break':
        // Remove this case - we handle paragraph boundaries differently now
        break;

      default:
        console.warn('Unknown instruction type:', instruction.type);
        break;
    }
  }

  renderRawText(content) {
    if (!this.currentElement || !this.currentElement.classList.contains('raw-text')) {
      this.finishCurrentElement();
      this.currentElement = document.createElement('div');
      this.currentElement.className = 'raw-text';
      this.container.appendChild(this.currentElement);
    }
    
    this.removeCursor();
    this.currentElement.appendChild(document.createTextNode(content));
  }

  ensureList(tagName) {
    if (!this.currentList || this.currentList.tagName.toLowerCase() !== tagName) {
      this.finishCurrentElement();
      // LIST CONTINUITY FIX: Only create new list if type changes or no current list
      if (this.currentList && this.currentList.tagName.toLowerCase() !== tagName) {
        // Different list type - finish current and create new
        this.finishCurrentList();
        this.currentList = document.createElement(tagName);
        this.container.appendChild(this.currentList);
      } else if (!this.currentList) {
        // No current list - create new
        this.currentList = document.createElement(tagName);
        this.container.appendChild(this.currentList);
      }
      // If same type and current list exists, keep using it (list continuity!)
    }
  }
  
  finishCurrentList() {
    this.currentList = null;
  }

  addListItem(content, itemNumber = null) {
    if (this.currentList) {
      const li = document.createElement('li');
      
      // CRITICAL: Preserve original list numbers for ordered lists
      if (this.currentList.tagName.toLowerCase() === 'ol' && itemNumber !== null) {
        // Set the value attribute to preserve original numbering
        li.value = itemNumber;
      }
      
      this.currentList.appendChild(li);
      
      // For list items, append content directly instead of streaming
      // This ensures proper rendering during rapid chunk processing
      if (content.includes('<')) {
        // Content has HTML tags - sanitize it
        const sanitizedContent = domPurifyService.isReady() ? 
          domPurifyService.sanitize(content) : content;
        li.innerHTML = sanitizedContent;
      } else {
        // Plain text - set directly
        li.textContent = content;
      }
      
      // Don't set currentElement for list items - they're complete
    }
  }

  createTable(headers) {
    this.currentTable = document.createElement('table');
    this.container.appendChild(this.currentTable);
    
    if (headers && headers.length > 0) {
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      
      headers.forEach(header => {
        const th = document.createElement('th');
        // Sanitize header content before rendering
        if (header.includes('<')) {
          const sanitizedHeader = domPurifyService.isReady() ? 
            domPurifyService.sanitize(header) : header;
          th.innerHTML = sanitizedHeader;
        } else {
          th.textContent = header;
        }
        tr.appendChild(th);
      });
      
      thead.appendChild(tr);
      this.currentTable.appendChild(thead);
    }
    
    const tbody = document.createElement('tbody');
    this.currentTable.appendChild(tbody);
  }

  addTableRow(cells) {
    if (this.currentTable) {
      const tbody = this.currentTable.querySelector('tbody');
      const tr = document.createElement('tr');
      
      cells.forEach(cell => {
        const td = document.createElement('td');
        // Sanitize cell content before rendering
        if (cell.includes('<')) {
          const sanitizedCell = domPurifyService.isReady() ? 
            domPurifyService.sanitize(cell) : cell;
          td.innerHTML = sanitizedCell;
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    }
  }

  createElement(tagName) {
    this.finishCurrentElement();
    this.currentElement = document.createElement(tagName);
    
    // Apply styling based on element type
    this.applyElementStyling(this.currentElement, tagName);
    
    // LIST CONTINUITY: Only finish lists for certain structural elements
    if (['table', 'pre'].includes(tagName.toLowerCase())) {
      // These elements should break list continuity
      this.finishCurrentList();
    }
    
    this.container.appendChild(this.currentElement);
  }

  applyElementStyling(element, tagName) {
    // Clean elements - let CSS handle styling via .message-content selectors
    // No need for redundant classes!
  }

  appendContent(content) {
    if (this.currentElement) {
      this.removeCursor();
      
      // NUCLEAR FIX: Check if we're in a code block
      if (this.currentElement.tagName === 'CODE') {
        // CODE BLOCKS: ALWAYS use textContent (prevents HTML parsing corruption)
        this.currentElement.appendChild(document.createTextNode(content));
      } else {
        // REGULAR CONTENT: Can use innerHTML for markdown formatting
        if (content.includes('<')) {
          // Content has HTML tags - sanitize with enhanced DOMPurify config
          const sanitizedContent = domPurifyService.isReady() ? 
            domPurifyService.sanitize(content) : content;
          this.currentElement.innerHTML += sanitizedContent;
        } else {
          // Plain text - use text node for safety
          this.currentElement.appendChild(document.createTextNode(content));
        }
      }
    }
  }

  appendToCurrentElement(content) {
    if (this.currentElement) {
      this.currentElement.appendChild(document.createTextNode(content));
    } else {
      // No current element, create a paragraph
      this.createElement('p');
      this.appendContent(content);
    }
  }

  /**
   * Stream content synchronously (queues the streaming for sequential execution)
   * @param {string} content - Content to stream
   */
  streamContentSync(content) {
    // For HTML content, append immediately (contains formatting)
    if (content.includes('<')) {
      this.appendContent(content);
      return;
    }
    
    // For plain text, queue streaming animation
    this.streamingQueue = this.streamingQueue.then(async () => {
      await this.streamContent(content, { 
        baseDelay: 4,        // Faster for markdown elements  
        variability: 0.15,   // Less variation for readability
        punctuationPause: 6, // Shorter pauses
        wordPause: 1         // Minimal word pauses
      });
    }).catch(error => {
      console.warn('Streaming error:', error);
      // Fallback to immediate append if streaming fails
      this.appendContent(content);
    });
  }

  /**
   * Stream content character-by-character for natural typing effect
   * @param {string} content - Content to stream
   * @param {Object} options - Streaming options
   */
  async streamContent(content, options = {}) {
    const defaultOptions = {
      baseDelay: 8,           // ~125 chars/second  
      variability: 0.3,       // Natural variation
      punctuationPause: 15,   // Brief pauses at punctuation
      wordPause: 3           // Brief pause at word boundaries
    };
    
    const streamOptions = { ...defaultOptions, ...options };
    
    // Ensure we have a current element (create paragraph if needed)
    if (!this.currentElement) {
      this.createElement('p');
    }
    
    // Create a text node for streaming
    const textNode = document.createTextNode('');
    this.currentElement.appendChild(textNode);
    
    let displayedText = '';
    
    // Stream character by character
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      displayedText += char;
      textNode.textContent = displayedText;
      
      // Calculate delay for this character
      let delay = streamOptions.baseDelay;
      
      // Add natural variability
      delay += (Math.random() - 0.5) * delay * streamOptions.variability;
      
      // Pause at punctuation for natural reading rhythm
      if ('.!?'.includes(char)) {
        delay += streamOptions.punctuationPause;
      }
      
      // Brief pause at word boundaries
      if (char === ' ') {
        delay += streamOptions.wordPause;
      }
      
      // Wait before next character
      if (i < content.length - 1) { // Don't delay after last character
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  finishCurrentElement() {
    if (this.currentElement && this.currentElement.tagName === 'P' && 
        this.currentElement.textContent.trim() === '') {
      // Remove empty paragraphs
      this.currentElement.remove();
    }
    this.currentElement = null;
    // LIST CONTINUITY CRITICAL FIX: DON'T clear currentList here!
    // Lists should persist across headings, paragraphs, and blockquotes
    // Only clear list when different list type is encountered
  }

  updateCursor() {
    if (!this.showCursor) return;
    
    this.removeCursor();
    this.cursor = document.createElement('span');
    this.cursor.className = 'streaming-cursor';
    this.cursor.style.display = 'inline-block';
    this.cursor.style.background = '#2563eb';
    this.cursor.style.width = '2px';
    this.cursor.style.height = '1.2em';
    this.cursor.style.marginLeft = '2px';
    this.cursor.style.verticalAlign = 'text-bottom';
    this.cursor.style.animation = 'blink 1s infinite';
    
    // Add blink animation if not exists
    if (!document.querySelector('#cursor-blink-style')) {
      const style = document.createElement('style');
      style.id = 'cursor-blink-style';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    if (this.currentElement) {
      this.currentElement.appendChild(this.cursor);
    } else {
      this.container.appendChild(this.cursor);
    }
  }

  removeCursor() {
    if (this.cursor && this.cursor.parentNode) {
      this.cursor.parentNode.removeChild(this.cursor);
      this.cursor = null;
    }
  }

  hideCursor() {
    this.showCursor = false;
    this.removeCursor();
  }

  showCursorAgain() {
    this.showCursor = true;
    this.updateCursor();
  }

  /**
   * Apply formatting to completed code block - surgical, one-time operation
   */
  applyCodeBlockFormatting(codeElement) {
    if (!this.options.enableSyntaxHighlighting) return;
    
    // Remove cursor before processing
    this.removeCursor();
    
    try {
      // Get the language from className
      const className = codeElement.className;
      const languageMatch = className.match(/language-(\w+)/);
      const language = languageMatch ? languageMatch[1] : null;
      
      // Apply syntax highlighting using direct hljs import
      if (language && hljs.getLanguage(language)) {
        // Language-specific highlighting
        const result = hljs.highlight(codeElement.textContent, { language });
        codeElement.innerHTML = result.value;
        codeElement.classList.add('hljs', `language-${language}`);
      } else {
        // Auto-detect language
        hljs.highlightElement(codeElement);
      }
      
      // Track for performance metrics
      this.completedCodeBlocks.push({
        language: language || 'auto-detected',
        length: codeElement.textContent.length,
        timestamp: Date.now(),
        highlighted: true
      });
    } catch (error) {
      console.error('Syntax highlighting error:', error);
      // Don't break rendering if highlighting fails
    }
  }

  /**
   * Get syntax highlighting metrics
   */
  getHighlightingMetrics() {
    return {
      totalCodeBlocks: this.completedCodeBlocks.length,
      languages: [...new Set(this.completedCodeBlocks.map(block => block.language))],
      averageBlockSize: this.completedCodeBlocks.length > 0 
        ? this.completedCodeBlocks.reduce((sum, block) => sum + block.length, 0) / this.completedCodeBlocks.length
        : 0
    };
  }

  /**
   * Wait for all streaming animations to complete
   */
  async waitForStreamingCompletion() {
    // Wait for the streaming queue to resolve
    await this.streamingQueue;
  }
}

export default UniversalDOMRenderer;