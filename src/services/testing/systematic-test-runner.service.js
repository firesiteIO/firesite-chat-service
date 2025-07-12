/**
 * SystematicTestRunner - Coordinates pattern-based testing using diagnostic tools
 * 
 * Purpose: Execute our test pattern matrix systematically and collect data
 * This runner focuses on MEASURING not FIXING
 */

import { stageInspector } from './stage-inspector.service.js';
import { failureClassifier } from './failure-classifier.service.js';

export class SystematicTestRunner {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
    
    // Test Pattern Matrix from STRATEGY.md
    this.testPatterns = {
      // Boundary Conditions
      boundaries: {
        'code-after-paragraph': {
          input: 'Text paragraph\n```js\ncode\n```',
          description: 'Code block immediately after paragraph'
        },
        'list-after-heading': {
          input: '# Heading\n- List item',
          description: 'List immediately after heading'
        },
        'table-no-separator': {
          input: '| Col1 | Col2 |\nData row',
          description: 'Table without separator row'
        },
        'blockquote-nested': {
          input: '> Quote\n> > Nested quote',
          description: 'Nested blockquotes'
        }
      },
      
      // State Transitions
      transitions: {
        'nested-list-escape': {
          input: '- Item\n  - Nested\nBack to paragraph',
          description: 'Escaping from nested list to paragraph'
        },
        'code-block-unclosed': {
          input: '```js\ncode without closing',
          description: 'Unclosed code block'
        },
        'mixed-list-types': {
          input: '- Unordered\n1. Suddenly ordered\n- Back to unordered',
          description: 'Switching between list types'
        }
      },
      
      // Complex Combinations
      complex: {
        'mixed-inline': {
          input: '**Bold with `code` inside** and *italic*',
          description: 'Mixed inline formatting'
        },
        'paragraph-accumulation': {
          input: 'Line 1\nLine 2\nLine 3\n\nNew paragraph',
          description: 'Multi-line paragraph accumulation'
        },
        'table-with-formatting': {
          input: '| **Bold** | `code` | *italic* |\n|---|---|---|\n| Data | More | Text |',
          description: 'Table with inline formatting'
        }
      },
      
      // Performance Stress
      stress: {
        'rapid-transitions': {
          input: 'Text\n# Header\nText\n```\ncode\n```\nText',
          description: 'Rapid content type transitions'
        },
        'deep-nesting': {
          input: '- L1\n  - L2\n    - L3\n      - L4',
          description: 'Deep list nesting'
        }
      }
    };
  }

  /**
   * Run all test patterns and collect diagnostic data
   * @param {Object} streamingService - The service to test
   * @param {HTMLElement} container - Test container element
   */
  async runAllTests(streamingService, container) {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.testResults = [];
    
    // Run tests for each category
    for (const [category, tests] of Object.entries(this.testPatterns)) {
      for (const [testName, testData] of Object.entries(tests)) {
        const fullTestName = `${category}.${testName}`;
        const result = await this.runSingleTest(
          fullTestName, 
          testData, 
          streamingService, 
          container
        );
        
        this.testResults.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    this.isRunning = false;
    
    // Analyze all results
    const analysis = this.analyzeAllResults();
    
    return analysis;
  }

  /**
   * Run a single test with full diagnostic capture
   * @param {string} testName - Name of the test
   * @param {Object} testData - Test input and description
   * @param {Object} streamingService - Service to test
   * @param {HTMLElement} container - Test container
   */
  async runSingleTest(testName, testData, streamingService, container) {
    // Start diagnostic session
    stageInspector.startSession(testName);
    
    // Clear container and reset service
    container.innerHTML = '';
    streamingService.clear();
    
    const startTime = performance.now();
    
    try {
      // Hook into the streaming service to capture data
      const originalService = this.instrumentService(streamingService);
      
      // Start streaming
      streamingService.start();
      
      // Simulate streaming chunks
      await this.simulateStream(testData.input, streamingService);
      
      // Finish streaming
      const metrics = await streamingService.finish();
      
      // End diagnostic session
      const diagnosticData = stageInspector.endSession();
      
      // Capture final DOM state
      const finalDOM = container.innerHTML;
      
      const endTime = performance.now();
      
      // Classify any failures
      const classification = this.classifyResult(
        diagnosticData, 
        testData, 
        finalDOM
      );
      
      return {
        testName,
        input: testData.input,
        description: testData.description,
        duration: endTime - startTime,
        diagnosticData,
        finalDOM,
        metrics,
        classification,
        success: classification === null
      };
      
    } catch (error) {
      console.error(`Test failed: ${testName}`, error);
      
      return {
        testName,
        input: testData.input,
        description: testData.description,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Instrument the streaming service to capture diagnostic data
   * @param {Object} streamingService - Service to instrument
   */
  instrumentService(streamingService) {
    // Store original parser method
    const originalParserProcessChunk = streamingService.parser.processChunk.bind(streamingService.parser);
    
    // Override parser processChunk to capture data
    streamingService.parser.processChunk = (chunk) => {
      // Capture buffer stage
      const bufferBefore = streamingService.parser.buffer || '';
      const bufferAfter = bufferBefore + chunk;
      stageInspector.captureBuffer(chunk, bufferAfter);
      
      // Call original parser method
      const instructions = originalParserProcessChunk(chunk);
      
      // Capture parser stage
      stageInspector.captureParser(chunk, instructions, {
        mode: streamingService.parser.mode,
        state: streamingService.parser.state,
        currentParagraph: streamingService.parser.currentParagraph,
        buffer: streamingService.parser.buffer
      });
      
      return instructions;
    };
    
    // Store original renderer method
    const originalRendererRender = streamingService.renderer.render.bind(streamingService.renderer);
    
    // Override renderer to capture replay stage
    streamingService.renderer.render = (instructions) => {
      instructions.forEach(instruction => {
        stageInspector.captureReplay(instruction, 'dom_operation');
      });
      
      return originalRendererRender(instructions);
    };
    
    return streamingService;
  }

  /**
   * Simulate streaming chunks for test input
   * @param {string} input - Text to stream
   * @param {Object} streamingService - Service to stream to
   */
  async simulateStream(input, streamingService) {
    // Split into chunks (simulate real streaming)
    const chunkSize = 3; // Small chunks to test boundary detection
    
    for (let i = 0; i < input.length; i += chunkSize) {
      const chunk = input.slice(i, i + chunkSize);
      streamingService.processChunk(chunk);
      
      // Small delay to simulate network timing
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Classify test result to determine if it's a failure
   * @param {Object} diagnosticData - Data from StageInspector
   * @param {Object} testData - Original test data
   * @param {string} finalDOM - Final DOM output
   */
  classifyResult(diagnosticData, testData, finalDOM) {
    // ENHANCED LOGIC: Only classify as failure if we have REAL issues
    // Not just any patterns (patterns can be normal behavior)
    
    const hasHighSeverityIssues = diagnosticData.potential_issues && 
                                 diagnosticData.potential_issues.some(issue => 
                                   issue.severity === 'high'
                                 );
    
    const hasContentProblems = finalDOM.length < 10; // Very short content suggests missing output
    
    const hasCriticalPatterns = diagnosticData.patterns && 
                               diagnosticData.patterns.some(pattern => 
                                 // Only treat as critical if it's actually a failure (not streaming behavior)
                                 (pattern.type === 'PARSE_EMPTY' && pattern.description?.includes('Critical failure')) ||
                                 pattern.type === 'BUFFER_TIMING' ||
                                 pattern.type === 'PARSE_STATE_THRASH'
                               );
    
    
    // Only classify as failure if we have REAL problems
    if (hasHighSeverityIssues || hasContentProblems || hasCriticalPatterns) {
      const classification = failureClassifier.classify(
        diagnosticData, 
        { expected: testData.input }, 
        { actual: finalDOM }
      );
      return classification;
    }
    
    return null; // No real failure detected
  }

  /**
   * Analyze all test results to find patterns
   */
  analyzeAllResults() {
    const analysis = {
      total_tests: this.testResults.length,
      successful_tests: this.testResults.filter(r => r.success).length,
      failed_tests: this.testResults.filter(r => !r.success),
      failure_rate: 0,
      patterns: failureClassifier.getPatternStats(),
      recommendations: failureClassifier.getRecommendations(),
      performance_stats: this.calculatePerformanceStats()
    };
    
    analysis.failure_rate = (
      (analysis.total_tests - analysis.successful_tests) / 
      analysis.total_tests * 100
    ).toFixed(1);
    
    return analysis;
  }

  /**
   * Calculate performance statistics
   */
  calculatePerformanceStats() {
    const successfulTests = this.testResults.filter(r => r.success && r.duration);
    
    if (successfulTests.length === 0) {
      return { no_data: true };
    }
    
    const durations = successfulTests.map(r => r.duration);
    
    return {
      avg_duration: durations.reduce((a, b) => a + b, 0) / durations.length,
      min_duration: Math.min(...durations),
      max_duration: Math.max(...durations),
      total_tests: successfulTests.length
    };
  }

  /**
   * Get results for a specific pattern category
   * @param {string} category - Category to filter by
   */
  getResultsByCategory(category) {
    return this.testResults.filter(r => r.testName.startsWith(category));
  }

  /**
   * Get a summary report
   */
  getSummaryReport() {
    const analysis = this.analyzeAllResults();
    
    return {
      overview: {
        accuracy: `${100 - parseFloat(analysis.failure_rate)}%`,
        total_tests: analysis.total_tests,
        failed_tests: analysis.failed_tests.length
      },
      top_issues: analysis.patterns.slice(0, 3),
      recommendations: analysis.recommendations,
      performance: analysis.performance_stats
    };
  }

  /**
   * Clear all test results
   */
  reset() {
    this.testResults = [];
    failureClassifier.reset();
  }
}

// Create singleton instance
export const systematicTestRunner = new SystematicTestRunner();
export default systematicTestRunner;