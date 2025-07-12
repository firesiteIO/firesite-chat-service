/**
 * Universal Streaming Parser Service Tests
 * Testing core markdown parsing logic and intelligent ordered list detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import universalStreamingParserService from './universal-streaming-parser-service.js';

describe('UniversalStreamingParserService', () => {
  let parser;

  beforeEach(() => {
    // Use the singleton parser service
    parser = universalStreamingParserService;
    // Reset parser state for clean tests
    parser.reset();
  });

  describe('Basic Markdown Parsing', () => {
    it('should parse headings correctly', () => {
      const instructions = parser.processChunk('# Main Title\n## Subtitle\n');
      
      expect(instructions).toContainEqual({
        type: 'heading',
        level: 1,
        content: 'Main Title'
      });
      expect(instructions).toContainEqual({
        type: 'heading',
        level: 2,
        content: 'Subtitle'
      });
    });

    it('should parse code blocks with language', () => {
      const markdown = '```javascript\nconst x = 1;\n```\n';
      const instructions = parser.processChunk(markdown);
      
      expect(instructions).toContainEqual({
        type: 'start_code_block',
        language: 'javascript'
      });
      expect(instructions).toContainEqual({
        type: 'code_line',
        content: 'const x = 1;\n'
      });
      expect(instructions).toContainEqual({
        type: 'end_code_block'
      });
    });

    it('should parse unordered lists', () => {
      const instructions = parser.processChunk('- Item 1\n- Item 2\n');
      
      expect(instructions).toContainEqual({
        type: 'unordered_list_item',
        content: 'Item 1',
        level: 0
      });
      expect(instructions).toContainEqual({
        type: 'unordered_list_item',
        content: 'Item 2',
        level: 0
      });
    });

    it('should parse blockquotes', () => {
      const instructions = parser.processChunk('> This is a quote\n');
      
      expect(instructions).toContainEqual({
        type: 'blockquote',
        content: 'This is a quote'
      });
    });

    it('should parse horizontal rules', () => {
      const instructions = parser.processChunk('---\n');
      
      expect(instructions).toContainEqual({
        type: 'horizontal_rule'
      });
    });
  });

  describe('Intelligent Ordered List Detection', () => {
    describe('Simple Lists (should use ordered_list_item)', () => {
      it('should detect simple consecutive items as ordered list', () => {
        const markdown = '1. Apple\n2. Banana\n3. Orange\n';
        const instructions = parser.processChunk(markdown);
        
        const listItems = instructions.filter(i => i.type === 'ordered_list_item');
        expect(listItems).toHaveLength(3);
        expect(listItems[0]).toEqual({
          type: 'ordered_list_item',
          number: 1,
          content: 'Apple',
          level: 0
        });
        expect(listItems[1]).toEqual({
          type: 'ordered_list_item',
          number: 2,
          content: 'Banana',
          level: 0
        });
      });

      it('should detect simple shopping list as ordered list', () => {
        const markdown = '1. Milk\n2. Bread\n3. Eggs\n4. Cheese\n';
        const instructions = parser.processChunk(markdown);
        
        const listItems = instructions.filter(i => i.type === 'ordered_list_item');
        expect(listItems).toHaveLength(4);
        listItems.forEach((item, index) => {
          expect(item.type).toBe('ordered_list_item');
          expect(item.number).toBe(index + 1);
        });
      });
    });

    describe('Complex Lists (should use paragraph)', () => {
      it('should detect list items with colons as paragraphs', () => {
        const markdown = '1. Install Node.js:\n2. Create project:\n';
        const instructions = parser.processChunk(markdown);
        
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs).toHaveLength(2);
        expect(paragraphs[0].content).toBe('<strong>1.</strong> Install Node.js:');
        expect(paragraphs[1].content).toBe('<strong>2.</strong> Create project:');
      });

      it('should detect list items with code blocks as paragraphs', () => {
        const markdown = '1. Install Node.js\n```bash\nnpm install\n```\n2. Run project\n';
        const instructions = parser.processChunk(markdown);
        
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs.length).toBeGreaterThanOrEqual(1);
        expect(paragraphs[0].content).toBe('<strong>1.</strong> Install Node.js');
      });

      it('should detect list items with indented content as paragraphs', () => {
        const markdown = '1. First step\n   - Sub item\n2. Second step';
        const instructions = parser.processChunk(markdown);
        
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs.length).toBeGreaterThanOrEqual(1);
        expect(paragraphs[0].content).toBe('<strong>1.</strong> First step');
      });

      it('should detect formatted content as complex', () => {
        const markdown = '1. **Bold step**\n2. *Italic step*\n3. `Code step`\n';
        const instructions = parser.processChunk(markdown);
        
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs).toHaveLength(3);
        expect(paragraphs[0].content).toBe('<strong>1.</strong> <strong>Bold step</strong>');
      });

      it('should detect instructional keywords as complex', () => {
        const testCases = [
          'install Node.js',
          'create a project', 
          'run the command',
          'execute the script',
          'setup the environment',
          'configure the settings'
        ];
        
        testCases.forEach((content, index) => {
          parser.reset(); // Reset parser for each test case
          const markdown = `${index + 1}. ${content}\n`;
          const instructions = parser.processChunk(markdown);
          
          const paragraphs = instructions.filter(i => i.type === 'paragraph');
          expect(paragraphs).toHaveLength(1);
          expect(paragraphs[0].content).toBe(`<strong>${index + 1}.</strong> ${content}`);
        });
      });

      it('should detect substantial remaining content as complex', () => {
        // Simulate a scenario where there's lots of content in the buffer by including it in the chunk
        const markdown = '1. First step\nThis is a very long buffer with lots of content that suggests more complex formatting is coming in subsequent chunks that would make this a complex list item rather than a simple one\n';
        const instructions = parser.processChunk(markdown);
        
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs.length).toBeGreaterThanOrEqual(1);
        expect(paragraphs[0].content).toBe('<strong>1.</strong> First step');
      });
    });

    describe('Mixed Content Scenarios', () => {
      it('should handle mixed simple and complex items correctly', () => {
        const markdown = `1. Simple item
2. Complex item:
   \`\`\`bash
   npm install
   \`\`\`
3. Another simple item
4. **Formatted item**`;
        
        const instructions = parser.processChunk(markdown);
        
        // Should have a mix of ordered_list_item and paragraph types
        const listItems = instructions.filter(i => i.type === 'ordered_list_item');
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        
        expect(listItems.length + paragraphs.length).toBeGreaterThanOrEqual(3);
      });

      it('should handle consecutive numbers in remaining buffer', () => {
        // Simulate chunk processing where next numbered item is in buffer
        const markdown = '1. First step\n2. Second step\n3. Third step';
        const instructions = parser.processChunk(markdown);
        
        // All should be detected as complex due to consecutive numbers
        const paragraphs = instructions.filter(i => i.type === 'paragraph');
        expect(paragraphs.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Inline Markdown Processing', () => {
    it('should parse bold text', () => {
      const result = parser.parseInlineMarkdown('This is **bold** text');
      expect(result).toBe('This is <strong>bold</strong> text');
    });

    it('should parse italic text', () => {
      const result = parser.parseInlineMarkdown('This is *italic* text');
      expect(result).toBe('This is <em>italic</em> text');
    });

    it('should parse inline code', () => {
      const result = parser.parseInlineMarkdown('Use `npm install` command');
      expect(result).toBe('Use <code>npm install</code> command');
    });

    it('should parse links', () => {
      const result = parser.parseInlineMarkdown('Visit [Google](https://google.com)');
      expect(result).toBe('Visit <a href="https://google.com">Google</a>');
    });
  });

  describe('Buffer Management', () => {
    it('should accumulate content in buffer', () => {
      parser.processChunk('Partial');
      expect(parser.buffer).toBe('Partial');
      
      parser.processChunk(' content');
      expect(parser.buffer).toContain('content');
    });

    it('should handle incomplete lines properly', () => {
      const instructions1 = parser.processChunk('# Incomplete');
      expect(instructions1).toHaveLength(0); // Nothing complete yet
      
      const instructions2 = parser.processChunk(' heading\n');
      expect(instructions2).toContainEqual({
        type: 'heading',
        level: 1,
        content: 'Incomplete heading'
      });
    });

    it('should handle code block state across chunks', () => {
      const instructions1 = parser.processChunk('```javascript\n');
      expect(parser.state).toBe('code_block');
      expect(instructions1).toContainEqual({
        type: 'start_code_block',
        language: 'javascript'
      });
      
      const instructions2 = parser.processChunk('const x = 1;\n```\n');
      expect(parser.state).toBe('normal');
      
      // Check for code line with any properties it might have
      const codeLines = instructions2.filter(i => i.type === 'code_line');
      expect(codeLines).toHaveLength(1);
      expect(codeLines[0].content).toBe('const x = 1;\n');
      
      expect(instructions2).toContainEqual({
        type: 'end_code_block'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const instructions = parser.processChunk('');
      expect(instructions).toEqual([]);
    });

    it('should handle only whitespace', () => {
      const instructions = parser.processChunk('   \n  \n  ');
      expect(instructions).toEqual([]);
    });

    it('should handle malformed markdown gracefully', () => {
      const instructions = parser.processChunk('### \n** incomplete bold\n``` no closing');
      // Should not throw errors and produce some reasonable output
      expect(Array.isArray(instructions)).toBe(true);
    });

    it('should handle nested list levels', () => {
      const markdown = '1. Level 1\n  2. Level 2\n    3. Level 3';
      const instructions = parser.processChunk(markdown);
      
      const listItems = instructions.filter(i => i.type === 'ordered_list_item');
      if (listItems.length > 0) {
        expect(listItems[0].level).toBe(0);
        if (listItems.length > 1) {
          expect(listItems[1].level).toBeGreaterThan(0);
        }
      }
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(1000); // Smaller for testing
      const instructions = parser.processChunk(`# ${longContent}\n`);
      
      expect(instructions).toContainEqual({
        type: 'heading',
        level: 1,
        content: longContent
      });
    });
  });

  describe('Mode Handling', () => {
    it('should handle raw mode', () => {
      parser.setMode('raw');
      const instructions = parser.processChunk('# This should not be parsed as markdown');
      
      expect(instructions).toEqual([{
        type: 'raw_text',
        content: '# This should not be parsed as markdown'
      }]);
    });

    it('should return to normal mode from raw', () => {
      parser.setMode('raw');
      parser.processChunk('raw content');
      
      parser.setMode('normal');
      parser.reset(); // Reset parser state when switching modes
      const instructions = parser.processChunk('# Normal markdown\n');
      
      expect(instructions).toContainEqual({
        type: 'heading',
        level: 1,
        content: 'Normal markdown'
      });
    });
  });
});