/**
 * Universal Streaming Parser - CLEAN FOUNDATION
 * Extracted from the original breakthrough in streaming_service_complete.html
 * 
 * Core Principles:
 * 1. Progressive markdown parsing during streaming
 * 2. Graceful handling of incomplete markup
 * 3. Support for all markdown elements (tables, lists, code, etc.)
 * 4. Raw text mode for when no parsing is desired
 * 5. Smart paragraph accumulation (not line-by-line)
 * 
 * This is the ELEGANT foundation - no complex edge case handling,
 * just the proven breakthrough patterns that work.
 */

export class UniversalStreamingParser {
  constructor(mode = 'progressive') {
    this.mode = mode; // 'progressive' or 'raw'
    this.reset();
  }

  reset() {
    this.buffer = '';
    this.lineBuffer = '';
    this.state = 'normal';
    this.codeBlockLanguage = '';
    this.tableHeaders = [];
    this.inTable = false;
    this.listStack = []; // Track nested lists
    this.currentParagraph = ''; // Accumulate paragraph content
  }

  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Process a chunk from SSE stream - ORIGINAL ELEGANT APPROACH
   * @param {string} chunk - Text chunk from stream
   * @returns {Array} Array of rendering instructions
   */
  processChunk(chunk) {
    if (this.mode === 'raw') {
      return [{ type: 'raw_text', content: chunk }];
    }

    this.buffer += chunk;
    const instructions = [];
    
    // Handle code blocks first - they need special treatment
    if (this.state === 'code_block') {
      const codeLines = this.buffer.split('\n');
      this.buffer = codeLines.pop() || '';
      
      for (const line of codeLines) {
        if (line.trim() === '```') {
          instructions.push({ type: 'end_code_block' });
          this.state = 'normal';
        } else {
          instructions.push({ type: 'code_line', content: line + '\n', raw: true });
        }
      }
      return instructions;
    }
    
    // For normal content, process by lines but be smarter about paragraphs
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    // CRITICAL FIX: Check if buffer might contain start of code block
    // Don't process lines if buffer starts with `` (might be incomplete ```)
    if (this.buffer.startsWith('``') && this.buffer.length < 3) {
      // Put the last line back and wait for more content
      if (lines.length > 0) {
        this.buffer = lines.pop() + '\n' + this.buffer;
      }
    }
    
    for (const line of lines) {
      instructions.push(...this.processLine(line));
    }
    
    return instructions;
  }

  processLine(line) {
    const instructions = [];
    const trimmed = line.trim();

    // EDGE CASE FIX: If we're in a code block, handle code content first
    if (this.state === 'code_block') {
      // Check if this line ends the code block
      if (trimmed === '```') {
        instructions.push({ type: 'end_code_block' });
        this.state = 'normal';
        this.codeBlockLanguage = '';
        return instructions;
      } else {
        // It's code content - include original line with formatting
        instructions.push({ 
          type: 'code_line', 
          content: line + '\n'
        });
        return instructions;
      }
    }

    // Code block detection - Enhanced boundary protection
    if (trimmed.startsWith('```')) {
      // End any current paragraph before starting code block
      if (this.currentParagraph.trim()) {
        instructions.push({ 
          type: 'paragraph', 
          content: this.parseInlineMarkdown(this.currentParagraph.trim())
        });
        this.currentParagraph = '';
      }
      
      // Start new code block
      this.codeBlockLanguage = trimmed.slice(3) || 'text';
      instructions.push({ 
        type: 'start_code_block', 
        language: this.codeBlockLanguage 
      });
      this.state = 'code_block';
      return instructions;
    }

    // Table detection
    if (this.isTableRow(line)) {
      // End current paragraph before table
      if (this.currentParagraph.trim()) {
        instructions.push({ 
          type: 'paragraph', 
          content: this.parseInlineMarkdown(this.currentParagraph.trim())
        });
        this.currentParagraph = '';
      }
      return this.handleTableRow(line);
    }

    // Regular markdown parsing
    return this.parseMarkdownLine(line);
  }

  parseMarkdownLine(line) {
    const instructions = [];
    const trimmed = line.trim();

    // Empty line - end current paragraph
    if (!trimmed) {
      if (this.currentParagraph.trim()) {
        instructions.push({ 
          type: 'paragraph', 
          content: this.parseInlineMarkdown(this.currentParagraph.trim())
        });
        this.currentParagraph = '';
      }
      return instructions;
    }

    // Heading detection (1-6 levels)
    if (trimmed.startsWith('#')) {
      let hashCount = 0;
      for (let i = 0; i < trimmed.length && trimmed[i] === '#'; i++) {
        hashCount++;
      }
      
      if (hashCount >= 1 && hashCount <= 6) {
        let content = trimmed.slice(hashCount);
        if (content.startsWith(' ')) {
          content = content.slice(1);
        }
        content = content.trim();
        
        if (content) {
          this.endCurrentParagraph(instructions);
          instructions.push({ 
            type: 'heading', 
            level: hashCount, 
            content: this.parseInlineMarkdown(content)
          });
          return instructions;
        }
      }
    }

    // Blockquote detection
    if (trimmed.startsWith('> ')) {
      this.endCurrentParagraph(instructions);
      instructions.push({ 
        type: 'blockquote', 
        content: this.parseInlineMarkdown(trimmed.slice(2)) 
      });
    } 
    // Unordered list detection (with nesting support)
    else if (/^(\s*)[-*+]\s/.test(line)) {
      this.endCurrentParagraph(instructions);
      const match = line.match(/^(\s*)[-*+]\s(.*)$/);
      const indent = match[1].length;
      const level = Math.floor(indent / 2); // 2 spaces per level
      instructions.push({ 
        type: 'unordered_list_item', 
        content: this.parseInlineMarkdown(match[2].trim()),
        level: level 
      });
    } 
    // Ordered list detection (with intelligent rendering decision)
    else if (/^(\s*)\d+\.\s/.test(line)) {
      this.endCurrentParagraph(instructions);
      const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
      const indent = match[1].length;
      const level = Math.floor(indent / 2); // 2 spaces per level
      const number = parseInt(match[2]);
      const content = match[3].trim();
      
      // Intelligent decision: Use comprehensive pattern detection for complex content
      const remainingContent = this.buffer;
      
      // Check for multiple indicators that suggest this is part of a complex numbered sequence
      const hasComplexContent = 
        // 1. Explicit structural indicators
        remainingContent.includes('\n   ') ||        // Indented content
        remainingContent.includes('\n```') ||        // Code blocks
        remainingContent.includes('\n\n') ||         // Multiple newlines
        content.endsWith(':') ||                     // Colon ending
        
        // 2. Consecutive numbered items (most common pattern)
        remainingContent.match(/\n\s*\d+\.\s/) ||   // Next numbered item exists
        
        // 3. Formatting indicators (bold, italic, inline code, links)
        content.includes('**') ||                    // Bold text
        content.includes('*') && !content.includes('**') || // Italic text
        content.includes('`') ||                     // Inline code
        content.includes('[') ||                     // Links
        
        // 4. Content type indicators (common in complex lists)
        /\b(step|install|create|run|execute|setup|configure|build|test|deploy|download|navigate|ensure|open|check)\b/i.test(content) ||
        
        // 5. Buffer size indicates more content coming
        remainingContent.length > 50;               // Substantial content remaining
      
      if (hasComplexContent) {
        // Render as a numbered paragraph for better streaming and readability
        instructions.push({ 
          type: 'paragraph', 
          content: `<strong>${number}.</strong> ${this.parseInlineMarkdown(content)}`
        });
      } else {
        // Simple list item - use traditional ordered list
        instructions.push({ 
          type: 'ordered_list_item', 
          number: number, 
          content: this.parseInlineMarkdown(content),
          level: level
        });
      }
    } 
    // Horizontal rule detection
    else if (trimmed === '---' || trimmed === '***') {
      this.endCurrentParagraph(instructions);
      instructions.push({ type: 'horizontal_rule' });
    } 
    // Regular text - accumulate into current paragraph
    else {
      if (this.currentParagraph) {
        this.currentParagraph += ' ' + trimmed;
      } else {
        this.currentParagraph = trimmed;
      }
      
      // CRITICAL FIX: For plain text, emit paragraphs when they get substantial
      // This ensures plain text responses render progressively, not just at the end
      if (this.currentParagraph.length > 200 || 
          this.currentParagraph.includes('.') || 
          this.currentParagraph.includes('!') || 
          this.currentParagraph.includes('?')) {
        // Check if we have a sentence ending - emit the paragraph
        const sentences = this.currentParagraph.split(/([.!?]\s+)/);
        if (sentences.length > 2) {
          // We have at least one complete sentence - emit it
          const completeContent = sentences.slice(0, -1).join('');
          const remainingContent = sentences[sentences.length - 1];
          
          if (completeContent.trim()) {
            instructions.push({ 
              type: 'paragraph', 
              content: this.parseInlineMarkdown(completeContent.trim())
            });
            this.currentParagraph = remainingContent;
          }
        }
      }
    }

    return instructions;
  }

  endCurrentParagraph(instructions) {
    if (this.currentParagraph.trim()) {
      instructions.push({ 
        type: 'paragraph', 
        content: this.parseInlineMarkdown(this.currentParagraph.trim())
      });
      this.currentParagraph = '';
    }
  }

  isTableRow(line) {
    const trimmed = line.trim();
    return trimmed.includes('|') && trimmed.length > 2;
  }

  handleTableRow(line) {
    const instructions = [];
    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
    
    // Skip empty table rows
    if (cells.length === 0) {
      return instructions;
    }
    
    // Check if this is a separator row (|---|---|)
    if (cells.every(cell => /^-+$/.test(cell))) {
      if (!this.inTable && this.tableHeaders.length > 0) {
        instructions.push({ 
          type: 'start_table', 
          headers: this.tableHeaders 
        });
        this.inTable = true;
      }
      return instructions;
    }

    if (!this.inTable) {
      // This might be the header row - but only if we don't already have headers
      if (this.tableHeaders.length === 0) {
        this.tableHeaders = cells.map(cell => this.parseInlineMarkdown(cell));
      }
      return instructions; // Wait for separator
    }

    // This is a data row
    instructions.push({ 
      type: 'table_row', 
      cells: cells.map(cell => this.parseInlineMarkdown(cell))
    });

    return instructions;
  }

  parseInlineMarkdown(text) {
    if (!text) return '';
    
    return text
      // Links first (before other formatting)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Code spans (protect from other formatting)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold (** or __)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      // Italic (* or _)
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  finalize() {
    const instructions = [];
    
    // Handle any pending table headers that weren't emitted during streaming
    if (this.tableHeaders.length > 0 && !this.inTable) {
      instructions.push({ 
        type: 'start_table', 
        headers: this.tableHeaders 
      });
      instructions.push({ type: 'end_table' });
      this.tableHeaders = [];
    }
    
    // End current paragraph if we have content
    if (this.currentParagraph.trim()) {
      instructions.push({ 
        type: 'paragraph', 
        content: this.parseInlineMarkdown(this.currentParagraph.trim())
      });
    }
    
    // Close any open table
    if (this.inTable) {
      instructions.push({ type: 'end_table' });
    }
    
    // Process any remaining buffer content through normal parsing logic
    if (this.buffer.trim()) {
      if (this.state === 'code_block') {
        instructions.push({ type: 'code_line', content: this.buffer, raw: true });
        instructions.push({ type: 'end_code_block' });
      } else {
        // CRITICAL FIX: Process remaining buffer through normal line parsing
        // This ensures list items don't get converted to paragraphs
        const remainingInstructions = this.processLine(this.buffer);
        instructions.push(...remainingInstructions);
      }
    }
    
    return instructions;
  }
}

// Export singleton instance for immediate use
export const universalStreamingParser = new UniversalStreamingParser();
export default universalStreamingParser;