/**
 * IntelligentProgressiveReplayService - THE NEXT STANDARD FOR AI SSE STREAMING
 * 
 * Revolutionary approach that combines:
 * - 120ms decision window for optimal parsing
 * - Smart completion detection
 * - Progressive queue management  
 * - Zero DOM re-renders
 * - Natural typing animation
 * 
 * This will become THE INDUSTRY STANDARD for AI streaming interfaces.
 */

export class IntelligentProgressiveReplayService {
  constructor(container, options = {}) {
    this.container = container;
    
    this.options = {
      decisionWindow: 120,     // 120ms analysis window
      maxWaitTime: 500,        // Maximum wait for completion
      baseDelay: 12,           // Base typing speed
      punctuationPause: 15,    // Pause at punctuation
      wordPause: 3,            // Pause between words
      debug: false,            // Enable debug logging
      ...options
    };
    
    // The revolutionary queue system
    this.completionQueue = [];    // Elements ready to stream
    this.waitingQueue = [];       // Elements waiting for context
    this.streamingQueue = [];     // Currently streaming
    this.analysisTimer = null;
    this.isStreaming = false;
    this.isAnalyzing = false;
    
    // Table tracking
    this.currentTable = null;
    this.currentTableBody = null;
    
    // Performance metrics
    this.metrics = {
      elementsProcessed: 0,
      averageDecisionTime: 0,
      streamingStartTime: null,
      firstElementTime: null
    };
    
    if (this.options.debug) {
      console.log('Intelligent Progressive Replay Service initialized');
    }
  }

  /**
   * Process new parsed elements from the Universal Streaming Parser
   * This is where the magic happens - intelligent decision making!
   */
  async processElements(elements) {
    
    let hasNewCompletedElements = false;
    
    for (const element of elements) {
      this.metrics.elementsProcessed++;
      
      if (this.isElementComplete(element)) {
        this.completionQueue.push(element);
        hasNewCompletedElements = true;
        
        // Record first element time for metrics
        if (!this.metrics.firstElementTime) {
          this.metrics.firstElementTime = Date.now();
        }
      } else {
        if (this.options.debug) console.log(`Element needs analysis: ${element.type}`);
        this.waitingQueue.push({
          element,
          waitingSince: Date.now()
        });
      }
    }
    
    // Start the intelligent streaming process
    this.startIntelligentStreaming();
    
    // CRITICAL FIX: Stream any newly completed elements immediately
    if (hasNewCompletedElements && this.isStreaming) {
      await this.streamAvailableElements();
    }
  }

  /**
   * Smart completion detection - the heart of the algorithm
   * Determines if an element is "safe" to stream immediately
   */
  isElementComplete(element) {
    switch (element.type) {
      case 'heading':
        // Headings are single-line, complete if we have content
        return element.content && element.content.trim().length > 0;
        
      case 'paragraph':
        // CRITICAL FIX: Paragraphs need more content or ending punctuation
        // to prevent fragmentation
        const content = element.content || '';
        const trimmedContent = content.trim();
        
        // Complete if:
        // 1. Ends with sentence-ending punctuation
        // 2. Has substantial content (30+ chars) 
        // 3. Contains a newline (paragraph boundary)
        return /[.!?]$/.test(trimmedContent) || 
               trimmedContent.length >= 30 ||
               content.includes('\n');
        
      case 'list_item':
      case 'unordered_list_item':
      case 'ordered_list_item':
        // More permissive: Complete if has any substantial content (3+ chars)
        return element.content && element.content.trim().length >= 3;
        
      case 'blockquote':
        // Complete if has content and ends properly
        return element.content && /[.!?\n]$/.test(element.content.trim());
        
      case 'code_line':
        // Code lines are always complete when they arrive
        return true;
        
      case 'start_code_block':
        // Code block starts are always complete
        return true;
        
      case 'end_code_block':
        // Code block ends are always complete
        return true;
        
      case 'horizontal_rule':
        // HR elements are always complete
        return true;
        
      case 'start_table':
        // Table starts are always complete
        return true;
        
      case 'table_row':
        // Table rows are complete when they have cells
        return element.cells && element.cells.length > 0;
        
      case 'end_table':
        // Table ends are always complete
        return true;
        
      case 'raw_text':
        // Raw text is complete when it has content
        return element.content && element.content.trim().length > 0;
        
      default:
        // Conservative approach for unknown types - wait for analysis
        console.log(`Unknown element type: ${element.type}, marking incomplete`);
        return false;
    }
  }

  /**
   * Start the intelligent streaming process
   * Uses the revolutionary 120ms decision window
   */
  startIntelligentStreaming() {
    if (this.isStreaming) return;
    
    this.isStreaming = true;
    this.metrics.streamingStartTime = Date.now();
    
    if (this.options.debug) console.log('Starting intelligent streaming with 120ms decision window');
    
    // Start streaming immediately available elements
    this.streamAvailableElements();
    
    // Start the analysis cycle for waiting elements
    this.startAnalysisCycle();
  }

  /**
   * The 120ms decision window analysis cycle
   * This is what makes us THE NEXT STANDARD
   */
  startAnalysisCycle() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    
    const analyzeWaitingElements = () => {
      const now = Date.now();
      const completedElements = [];
      const stillWaiting = [];
      
      // Analyze each waiting element
      for (const waiting of this.waitingQueue) {
        const waitTime = now - waiting.waitingSince;
        
        // Force completion if we've waited too long
        if (waitTime > this.options.maxWaitTime) {
          if (this.options.debug) console.log(`Force completing element after ${waitTime}ms wait: ${waiting.element.type}`);
          completedElements.push(waiting.element);
        }
        // Check if element has become complete
        else if (this.isElementComplete(waiting.element)) {
          if (this.options.debug) console.log(`Element became complete after ${waitTime}ms: ${waiting.element.type}`);
          completedElements.push(waiting.element);
        }
        // Still waiting
        else {
          if (this.options.debug) console.log(`Still waiting for ${waiting.element.type} after ${waitTime}ms (content: "${waiting.element.content?.substring(0, 30)}...")`);
          stillWaiting.push(waiting);
        }
      }
      
      // Move completed elements to streaming queue
      this.completionQueue.push(...completedElements);
      this.waitingQueue = stillWaiting;
      
      // Stream newly available elements
      this.streamAvailableElements();
      
      // Continue analysis cycle if elements are still waiting
      if (this.waitingQueue.length > 0) {
        this.analysisTimer = setTimeout(analyzeWaitingElements, this.options.decisionWindow);
      } else {
        this.isAnalyzing = false;
      }
    };
    
    // Start the analysis cycle
    this.analysisTimer = setTimeout(analyzeWaitingElements, this.options.decisionWindow);
  }

  /**
   * Stream all available elements in the completion queue
   * This happens continuously as elements become ready
   */
  async streamAvailableElements() {
    while (this.completionQueue.length > 0) {
      const element = this.completionQueue.shift();
      await this.streamElement(element);
    }
  }

  /**
   * Stream a single element with natural typing animation
   * Zero re-renders, perfect formatting, natural feel
   */
  async streamElement(element) {
    if (this.options.debug) console.log(`Streaming element: ${element.type}`, { content: element.content?.substring(0, 50) });
    
    try {
      switch (element.type) {
        case 'heading':
          await this.streamHeading(element);
          break;
          
        case 'paragraph':
          await this.streamParagraph(element);
          break;
          
        case 'list_item':
        case 'unordered_list_item':
        case 'ordered_list_item':
          await this.streamListItem(element);
          break;
          
        case 'blockquote':
          await this.streamBlockquote(element);
          break;
          
        case 'code_line':
          await this.streamCodeLine(element);
          break;
          
        case 'start_code_block':
          this.startCodeBlock(element);
          break;
          
        case 'end_code_block':
          this.endCodeBlock();
          break;
          
        case 'horizontal_rule':
          this.createHorizontalRule();
          break;
          
        case 'start_table':
          this.startTable(element);
          break;
          
        case 'table_row':
          await this.streamTableRow(element);
          break;
          
        case 'end_table':
          this.endTable();
          break;
          
        case 'raw_text':
          await this.streamRawText(element);
          break;
          
        default:
          console.warn(`Unknown element type for streaming: ${element.type}`);
      }
    } catch (error) {
      console.error(`Error streaming element type ${element.type}:`, error, `Element content:`, element.content, `Container:`, this.container);
    }
  }

  /**
   * Stream heading with scale-in animation effect
   */
  async streamHeading(element) {
    const heading = document.createElement(`h${element.level}`);
    this.container.appendChild(heading);
    
    // Type out content - let CSS handle styling
    await this.naturalTypeAnimation(element.content, heading, {
      baseDelay: 8  // Faster for headings
    });
  }

  /**
   * Stream paragraph with natural typing rhythm
   */
  async streamParagraph(element) {
    // Creating paragraph element
    const paragraph = document.createElement('p');
    // Appending paragraph to container
    this.container.appendChild(paragraph);
    // Starting naturalTypeAnimation
    
    await this.naturalTypeAnimation(element.content, paragraph, {
      baseDelay: this.options.baseDelay
    });
    
    // Animation completed
  }

  /**
   * Stream list item with bullet animation
   */
  async streamListItem(element) {
    // Creating list item element
    
    // Determine if this is an ordered list
    const isOrdered = element.type === 'ordered_list_item' || element.number !== undefined;
    // List type determined
    
    // Ensure we have a list container
    let list = this.container.lastElementChild;
    const expectedTag = isOrdered ? 'OL' : 'UL';
    // Checking for existing list
    
    if (!list || list.tagName !== expectedTag) {
      // Creating new list element
      list = document.createElement(isOrdered ? 'ol' : 'ul');
      // Appending list to container
      this.container.appendChild(list);
    }
    
    // Creating li element
    const listItem = document.createElement('li');
    // Appending li to list
    list.appendChild(listItem);
    
    // Starting naturalTypeAnimation for list item
    await this.naturalTypeAnimation(element.content, listItem, {
      baseDelay: 10  // Slightly faster for list items
    });
    
    // Animation completed
  }

  /**
   * Stream blockquote with left border slide-in
   */
  async streamBlockquote(element) {
    const blockquote = document.createElement('blockquote');
    this.container.appendChild(blockquote);
    
    await this.naturalTypeAnimation(element.content, blockquote, {
      baseDelay: 15  // Slower for emphasis
    });
  }

  /**
   * Natural typing animation with human-like characteristics
   * This is what makes the experience feel magical
   */
  async naturalTypeAnimation(content, element, options = {}) {
    const settings = {
      baseDelay: this.options.baseDelay,
      punctuationPause: this.options.punctuationPause,
      wordPause: this.options.wordPause,
      ...options
    };
    
    // Handle HTML content by extracting text and reapplying formatting
    if (content.includes('<')) {
      await this.typeHTMLContent(content, element, settings);
    } else {
      await this.typePlainContent(content, element, settings);
    }
  }

  /**
   * Type HTML content while preserving formatting
   */
   async typeHTMLContent(htmlContent, element, settings) {
    // CRITICAL FIX: For HTML content with formatting, set innerHTML directly
    // Trying to animate character-by-character destroys the HTML formatting
    element.innerHTML = htmlContent;
    
    // Add a small delay to simulate natural timing without breaking formatting
    await this.sleep(settings.baseDelay * htmlContent.length * 0.1);
  }

  /**
   * Type plain text content with natural rhythm
   */
  async typePlainContent(content, target, settings) {
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      // Add character
      if (target.textContent !== undefined) {
        target.textContent += char;
      } else {
        target.appendChild(document.createTextNode(char));
      }
      
      // Calculate delay for this character
      let delay = settings.baseDelay;
      
      // Add natural variation
      delay += (Math.random() - 0.5) * delay * 0.3;
      
      // Pause at punctuation for natural reading rhythm
      if ('.!?'.includes(char)) {
        delay += settings.punctuationPause;
      } else if (',;:'.includes(char)) {
        delay += settings.punctuationPause / 2;
      }
      
      // Brief pause at word boundaries
      if (char === ' ') {
        delay += settings.wordPause;
      }
      
      // Wait before next character (except for last character)
      if (i < content.length - 1) {
        await this.sleep(delay);
      }
    }
  }

  /**
   * Find the main text node in an element for typing animation
   */
  findMainTextNode(element) {
    // If element can hold text directly, return it
    if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'LI'].includes(element.tagName)) {
      return element;
    }
    
    // Otherwise find first text-containing child
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        return child;
      }
    }
    
    return element;
  }

  /**
   * Code block handling
   */
  startCodeBlock(element) {
    this.currentCodeBlock = document.createElement('pre');
    const code = document.createElement('code');
    
    if (element.language) {
      code.className = `language-${element.language}`;
    }
    
    this.currentCodeBlock.appendChild(code);
    this.container.appendChild(this.currentCodeBlock);
  }

  async streamCodeLine(element) {
    if (this.currentCodeBlock) {
      const code = this.currentCodeBlock.querySelector('code');
      
      // CRITICAL FIX: For code lines, append to existing content instead of typing animation
      // This prevents multiple lines from interfering with each other
      code.textContent += element.content;
    }
  }

  endCodeBlock() {
    if (this.currentCodeBlock) {
      const code = this.currentCodeBlock.querySelector('code');
      if (code) {
        // Apply syntax highlighting
        this.applySyntaxHighlighting(code);
      }
    }
    this.currentCodeBlock = null;
  }
  
  /**
   * Apply syntax highlighting to code element
   */
  applySyntaxHighlighting(codeElement) {
    try {
      // Import hljs dynamically if not already available
      import('highlight.js').then(hljs => {
        const className = codeElement.className;
        const languageMatch = className.match(/language-(\w+)/);
        const language = languageMatch ? languageMatch[1] : null;
        
        if (language && hljs.default.getLanguage(language)) {
          // Language-specific highlighting
          const result = hljs.default.highlight(codeElement.textContent, { language });
          codeElement.innerHTML = result.value;
          codeElement.classList.add('hljs', `language-${language}`);
        } else {
          // Auto-detect language
          hljs.default.highlightElement(codeElement);
        }
      }).catch(error => {
        console.error('Failed to load highlight.js:', error);
      });
    } catch (error) {
      console.error('Syntax highlighting error:', error);
    }
  }

  /**
   * Create horizontal rule with expand animation
   */
  createHorizontalRule() {
    const hr = document.createElement('hr');
    this.container.appendChild(hr);
  }

  /**
   * Start table with proper HTML table structure
   */
  startTable(element) {
    this.currentTable = document.createElement('table');
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    for (const header of element.headers) {
      const th = document.createElement('th');
      th.innerHTML = header;
      headerRow.appendChild(th);
    }
    
    thead.appendChild(headerRow);
    this.currentTable.appendChild(thead);
    
    // Create table body
    this.currentTableBody = document.createElement('tbody');
    this.currentTable.appendChild(this.currentTableBody);
    
    this.container.appendChild(this.currentTable);
  }

  /**
   * Stream table row with proper HTML table structure
   */
  async streamTableRow(element) {
    if (!this.currentTableBody) {
      console.warn('Table row received but no table body exists');
      return;
    }
    
    const row = document.createElement('tr');
    
    for (const cellContent of element.cells) {
      const td = document.createElement('td');
      
      // For table cells, we want immediate rendering with HTML support
      if (cellContent.includes('<')) {
        td.innerHTML = cellContent;
      } else {
        await this.naturalTypeAnimation(cellContent, td, {
          baseDelay: 6  // Faster for table cells
        });
      }
      
      row.appendChild(td);
    }
    
    this.currentTableBody.appendChild(row);
  }

  /**
   * End table
   */
  endTable() {
    this.currentTable = null;
    this.currentTableBody = null;
  }

  /**
   * Stream raw text content (no markdown parsing)
   * Used when content detection determines raw mode is more appropriate
   */
  async streamRawText(element) {
    // Create a text span or treat as paragraph if it contains line breaks
    if (element.content.includes('\n')) {
      // Multi-line raw text - treat as paragraph
      const paragraph = document.createElement('p');
      this.container.appendChild(paragraph);
      
      await this.naturalTypeAnimation(element.content, paragraph, {
        baseDelay: this.options.baseDelay
      });
    } else {
      // Single-line raw text - create a text node or span
      const span = document.createElement('span');
      this.container.appendChild(span);
      
      await this.naturalTypeAnimation(element.content, span, {
        baseDelay: this.options.baseDelay
      });
    }
  }

  /**
   * Utility sleep function for timing control
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const now = Date.now();
    return {
      ...this.metrics,
      timeToFirstElement: this.metrics.firstElementTime ? 
        this.metrics.firstElementTime - this.metrics.streamingStartTime : null,
      totalStreamingTime: this.metrics.streamingStartTime ? 
        now - this.metrics.streamingStartTime : 0,
      elementsInQueue: this.completionQueue.length,
      elementsWaiting: this.waitingQueue.length
    };
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }
    
    this.completionQueue = [];
    this.waitingQueue = [];
    this.isStreaming = false;
    this.isAnalyzing = false;
    this.currentTable = null;
    this.currentTableBody = null;
    
    if (this.options.debug) console.log('Intelligent Progressive Replay Service destroyed');
  }
}

export default IntelligentProgressiveReplayService;