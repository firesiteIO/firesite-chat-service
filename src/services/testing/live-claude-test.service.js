/**
 * Firesite.ai Chat Service Integration Test - Test our streaming parser against real Claude responses
 * 
 * This service connects to the actual Claude API and streams real responses
 * through our parsing system to verify real-world performance
 */

import { bugReportCapture } from '../debug/bug-report-capture.service.js';

export class LiveClaudeTestService {
  constructor() {
    this.apiKey = null;
    this.testPrompts = [
      // Simple markdown test
      {
        name: 'simple-markdown',
        prompt: 'Create a simple markdown example with a heading, paragraph, and bullet list about cats.',
        expectedElements: ['heading', 'paragraph', 'list']
      },
      
      // Complex formatting test
      {
        name: 'complex-formatting',
        prompt: 'Write a technical explanation with **bold**, *italic*, `code spans`, and a code block showing a JavaScript function.',
        expectedElements: ['paragraph', 'code_block', 'inline_formatting']
      },
      
      // Table test
      {
        name: 'table-generation',
        prompt: `Generate a comparison table of 3 different programming languages (choose randomly from Python, JavaScript, Java, C++, Go, Rust, Swift, Ruby, PHP, C#) with columns for Language, Type, and Use Case. Include a brief introduction paragraph before the table, then after the table add a some details with **bold** and *italic* formatting explaining your personal recommendation for beginners and why. Use the current timestamp: ${Date.now()}`,
        expectedElements: ['table', 'paragraph']
      },
      
      // Mixed content test
      {
        name: 'mixed-content',
        prompt: 'Explain how to set up a React project with: 1) A numbered list of steps, 2) Code examples, 3) A table of npm commands, and 4) Important notes in blockquotes.',
        expectedElements: ['heading', 'ordered_list', 'code_block', 'table', 'blockquote']
      },
      
      // Long response test
      {
        name: 'long-response',
        prompt: 'Write a comprehensive guide to JavaScript async/await with multiple sections, code examples, best practices, and common pitfalls. Include at least 5 headings.',
        expectedElements: ['multiple_headings', 'paragraphs', 'code_blocks', 'lists']
      }
    ];
    
    this.testResults = [];
  }

  /**
   * Initialize - no API key needed since server handles it
   */
  init() {
    this.serverUrl = 'http://localhost:3001';
    // Service initialized
  }

  /**
   * Run all live tests against Claude API
   * @param {Object} streamingService - Our streaming service to test
   * @param {HTMLElement} container - DOM container for output
   * @param {Function} onProgress - Progress callback
   */
  async runLiveTests(streamingService, container, onProgress = () => {}) {
    if (!this.serverUrl) {
      throw new Error('Service not initialized. Call init() first.');
    }

    console.log('Firesite.ai Chat Service integration tests...');
    this.testResults = [];

    for (let i = 0; i < this.testPrompts.length; i++) {
      const testPrompt = this.testPrompts[i];
      
      onProgress({
        current: i + 1,
        total: this.testPrompts.length,
        test: testPrompt.name,
        status: 'running'
      });

      try {
        const result = await this.runSingleLiveTest(testPrompt, streamingService, container);
        this.testResults.push(result);
        
        onProgress({
          current: i + 1,
          total: this.testPrompts.length,
          test: testPrompt.name,
          status: result.success ? 'passed' : 'failed',
          result
        });

        // Small delay between tests to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Live test failed: ${testPrompt.name}`, error);
        const failureResult = {
          testName: testPrompt.name,
          success: false,
          error: error.message,
          timestamp: Date.now()
        };
        this.testResults.push(failureResult);
        
        onProgress({
          current: i + 1,
          total: this.testPrompts.length,
          test: testPrompt.name,
          status: 'error',
          error: error.message
        });
      }
    }

    return this.analyzeResults();
  }

  /**
   * Run a single test against Claude API
   */
  async runSingleLiveTest(testPrompt, streamingService, container) {
    console.log(`Running live test: ${testPrompt.name}`);
    
    // ENHANCED: Ensure bug capture is properly reset and started
    bugReportCapture.reset(); // Clear any previous capture data
    bugReportCapture.startCapture(testPrompt.name, testPrompt.prompt);
    
    // Create test output container with clear test identification
    const testOutputContainer = document.createElement('div');
    testOutputContainer.style.cssText = 'margin: 20px 0; padding: 20px; border: 2px solid #3b82f6; border-radius: 8px; background: white; position: relative;';
    testOutputContainer.id = `test-output-${testPrompt.name}`;
    
    // Add test header
    const testHeader = document.createElement('div');
    testHeader.style.cssText = 'margin-bottom: 15px; padding: 10px; background: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;';
    testHeader.innerHTML = `
      <h4 style="margin: 0; color: #1f2937; font-size: 1rem;">Test: ${testPrompt.name}</h4>
      <p style="margin: 5px 0 0 0; font-size: 0.875rem; color: #6b7280;">Prompt: ${testPrompt.prompt}</p>
    `;
    testOutputContainer.appendChild(testHeader);
    
    // Create content area for streaming
    const contentArea = document.createElement('div');
    contentArea.style.cssText = 'border-top: 1px solid #e5e7eb; padding-top: 15px;';
    testOutputContainer.appendChild(contentArea);
    
    container.appendChild(testOutputContainer);
    
    // CRITICAL FIX: Update ALL container references
    streamingService.container = contentArea;
    streamingService.renderer.container = contentArea; // Legacy renderer container
    streamingService.firesiteService.container = contentArea; // World-class service container
    
    // Also update the IntelligentProgressiveReplayService container
    if (streamingService.firesiteService.replayService) {
      streamingService.firesiteService.replayService.container = contentArea;
    }
    
    // Explicitly clear the content area and ensure it's empty
    contentArea.innerHTML = '';
    streamingService.clear();
    
    const startTime = performance.now();
    
    // Start streaming
    streamingService.start();
    
    try {
      // Make request to Claude API
      const response = await this.callClaudeAPI(testPrompt.prompt);
      
      if (!response || response.length === 0) {
        throw new Error('Empty response from Claude API');
      }
      
      // Stream the response through our parser
      await this.streamResponse(response, streamingService);
      
      // Finish streaming
      const metrics = await streamingService.finish();
      
      // ENHANCED: Give DOM more time to complete and capture comprehensive data
      await new Promise(resolve => setTimeout(resolve, 300)); // Increased wait time
      
      const endTime = performance.now();
      const finalDOM = contentArea.innerHTML;
      
      // CRITICAL FIX: The contentArea.innerHTML is empty because the streaming service clears it!
      // We need to get the HTML from the streaming service's rendered content instead
      
      // CRITICAL FIX: Get the rendered content from the contentArea where we actually streamed
      // The streamingService.container might have been changed back to the original container
      const actualRenderedHTML = contentArea.innerHTML;
      bugReportCapture.captureRenderedHTML(actualRenderedHTML);
      bugReportCapture.capturePerformanceMetric('duration', endTime - startTime);
      bugReportCapture.capturePerformanceMetric('responseLength', response.length);
      bugReportCapture.capturePerformanceMetric('domLength', actualRenderedHTML.length);
      bugReportCapture.capturePerformanceMetric('testName', testPrompt.name);
      
      // Stop bug capture
      bugReportCapture.stopCapture();
      
      // Add a summary to the test header
      const summary = document.createElement('div');
      summary.style.cssText = 'margin-top: 10px; font-size: 0.75rem; color: #059669; font-weight: bold;';
      summary.innerHTML = `Test completed • ${response.length} chars → ${actualRenderedHTML.length} HTML chars • ${(endTime - startTime).toFixed(0)}ms`;
      testHeader.appendChild(summary);
      
      // Restore original container references
      streamingService.container = container;
      streamingService.renderer.container = container;
      
      // Analyze the result
      const analysis = this.analyzeResponse(actualRenderedHTML, testPrompt, response);
      
      // Generate the bug report WITHIN the service where we have the captured data
      const bugReport = bugReportCapture.generateBugReport(
        testPrompt.name,
        `Live test ${analysis.success ? 'PASSED' : 'FAILED'}`,
        `This test was run automatically using the live test interface. Test result: ${analysis.success ? 'PASSED' : 'FAILED'}\n\n` +
        `${analysis.success ? 'This test passed successfully with no observed issues.' : 'This test failed and may indicate a bug that needs investigation.'}\n\n` +
        `Test Name: ${testPrompt.name}\n` +
        `Expected Elements: ${testPrompt.expectedElements.join(', ')}`
      );

      // Save the bug report immediately (for localhost development)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const reportFilename = `${testPrompt.name}-${Date.now()}.md`;
        try {
          await bugReportCapture.downloadReport(bugReport, reportFilename);
        } catch (error) {
          console.error('Failed to save bug report:', error);
        }
      }

      return {
        testName: testPrompt.name,
        prompt: testPrompt.prompt,
        duration: endTime - startTime,
        responseLength: response.length,
        finalDOM: actualRenderedHTML, // Use the correctly captured HTML
        metrics,
        analysis,
        success: analysis.success,
        timestamp: startTime,
        bugReport // Include the generated report!
      };
      
    } catch (error) {
      console.error(`Test failed: ${testPrompt.name}`, error);
      // Stop bug capture on error
      bugReportCapture.stopCapture();
      throw error;
    }
  }

  /**
   * Call Claude API via the existing server proxy with streaming
   */
  async callClaudeAPI(prompt) {
    console.log('Testing:', prompt.substring(0, 60) + '...');
    
    const response = await fetch(`${this.serverUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: prompt,
        model: 'claude-3-7-sonnet-20250219',
        options: {
          maxTokens: 2000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('API Error:', response.status, error.error || 'Unknown');
      throw new Error(`Server API error: ${response.status} - ${error.error || 'Unknown error'}`);
    }

    if (!response.body) {
      throw new Error('No response body received from server');
    }

    // Read the streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunkCount = 0;

    // Reading streaming response

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        // Removed verbose chunk logging for cleaner debugging
        
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('Stream complete');
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              // Removed verbose parsed data logging
              
              // Handle both formats: {"content": "..."} (new) and {"text": "..."} (legacy)
              if (parsed.content) {
                fullResponse += parsed.content;
                // Capture SSE chunk for bug reporting (silent)
                bugReportCapture.captureSSEChunk(parsed.content, { 
                  type: 'streaming', 
                  format: 'content',
                  chunkIndex: chunkCount,
                  timestamp: Date.now()
                });
              } else if (parsed.text) {
                fullResponse += parsed.text;
                // Capture SSE chunk for bug reporting (silent)
                bugReportCapture.captureSSEChunk(parsed.text, { 
                  type: 'streaming', 
                  format: 'text',
                  chunkIndex: chunkCount,
                  timestamp: Date.now()
                });
              }
            } catch (e) {
              // Only log actual errors, not every JSON parse attempt
              if (data.trim() && data.trim() !== '[DONE]') {
                console.log('Parse error for:', data.substring(0, 50));
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  /**
   * Stream Claude response through our parser
   */
  async streamResponse(text, streamingService) {
    
    if (!text || text.length === 0) {
      console.warn('No text to stream!');
      return;
    }

    // Simulate realistic streaming with variable chunk sizes
    const chunkSizes = [5, 8, 12, 15, 20, 10, 7]; // Variable like real streaming
    let position = 0;
    let chunkIndex = 0;

    while (position < text.length) {
      const chunkSize = chunkSizes[chunkIndex % chunkSizes.length];
      const chunk = text.slice(position, position + chunkSize);
      
      streamingService.processChunk(chunk);
      position += chunkSize;
      chunkIndex++;
      
      // Add realistic streaming delays (15-45ms)
      const delay = 15 + Math.random() * 30;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Analyze the parsed response
   */
  analyzeResponse(finalDOM, testPrompt, originalResponse) {
    const analysis = {
      success: false,
      issues: [],
      metrics: {},
      expectedElements: testPrompt.expectedElements
    };

    // Check for basic rendering
    if (finalDOM.length < 10) {
      analysis.issues.push('Very short DOM output suggests parsing failure');
      return analysis;
    }

    // Check for common markdown elements
    const hasHeading = /<h[1-6]/.test(finalDOM);
    const hasParagraph = /<p>/.test(finalDOM);
    const hasCodeBlock = /<pre>/.test(finalDOM);
    const hasCodeSpan = /<code>/.test(finalDOM);
    const hasList = /<[uo]l>/.test(finalDOM);
    const hasTable = /<table>/.test(finalDOM);
    const hasBlockquote = /<blockquote>/.test(finalDOM);
    const hasBold = /<strong>/.test(finalDOM);
    const hasItalic = /<em>/.test(finalDOM);

    analysis.metrics = {
      hasHeading,
      hasParagraph,
      hasCodeBlock,
      hasCodeSpan,
      hasList,
      hasTable,
      hasBlockquote,
      hasBold,
      hasItalic,
      domLength: finalDOM.length,
      originalLength: originalResponse.length,
      renderRatio: finalDOM.length / originalResponse.length
    };

    // Check if we have basic content
    if (!hasParagraph && finalDOM.length < 50) {
      analysis.issues.push('No paragraphs detected and very short output');
    }

    // Success criteria: Content was rendered and no major issues
    analysis.success = analysis.issues.length === 0 && finalDOM.length > 50;

    return analysis;
  }

  /**
   * Analyze all test results
   */
  analyzeResults() {
    const successfulTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);
    
    const analysis = {
      totalTests: this.testResults.length,
      successfulTests: successfulTests.length,
      failedTests: failedTests.length,
      successRate: (successfulTests.length / this.testResults.length * 100).toFixed(1),
      averageDuration: successfulTests.length > 0 ? 
        successfulTests.reduce((sum, t) => sum + t.duration, 0) / successfulTests.length : 0,
      averageResponseLength: successfulTests.length > 0 ?
        successfulTests.reduce((sum, t) => sum + t.responseLength, 0) / successfulTests.length : 0,
      elementCoverage: this.calculateElementCoverage(successfulTests),
      issues: this.identifyCommonIssues(failedTests),
      recommendations: []
    };

    // Generate recommendations
    if (analysis.successRate < 90) {
      analysis.recommendations.push('Live response parsing needs improvement');
    }
    
    if (analysis.elementCoverage.tables < 0.5) {
      analysis.recommendations.push('Table parsing may need attention for real responses');
    }

    return analysis;
  }

  /**
   * Calculate how well we handled different markdown elements
   */
  calculateElementCoverage(successfulTests) {
    if (successfulTests.length === 0) return {};

    const coverage = {
      headings: 0,
      paragraphs: 0,
      codeBlocks: 0,
      lists: 0,
      tables: 0,
      formatting: 0
    };

    successfulTests.forEach(test => {
      const metrics = test.analysis.metrics;
      if (metrics.hasHeading) coverage.headings++;
      if (metrics.hasParagraph) coverage.paragraphs++;
      if (metrics.hasCodeBlock) coverage.codeBlocks++;
      if (metrics.hasList) coverage.lists++;
      if (metrics.hasTable) coverage.tables++;
      if (metrics.hasBold || metrics.hasItalic) coverage.formatting++;
    });

    // Convert to ratios
    Object.keys(coverage).forEach(key => {
      coverage[key] = coverage[key] / successfulTests.length;
    });

    return coverage;
  }

  /**
   * Identify common issues across failed tests
   */
  identifyCommonIssues(failedTests) {
    const issues = [];
    
    failedTests.forEach(test => {
      if (test.analysis && test.analysis.issues) {
        issues.push(...test.analysis.issues);
      }
    });

    // Count frequency of issues
    const issueCounts = {};
    issues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    return Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([issue, count]) => ({ issue, count }));
  }

  /**
   * Get summary report
   */
  getSummaryReport() {
    const analysis = this.analyzeResults();
    
    return {
      overview: {
        successRate: `${analysis.successRate}%`,
        totalTests: analysis.totalTests,
        averageDuration: `${analysis.averageDuration.toFixed(0)}ms`
      },
      coverage: analysis.elementCoverage,
      issues: analysis.issues.slice(0, 3), // Top 3 issues
      recommendations: analysis.recommendations
    };
  }
}

// Export singleton
export const liveClaudeTestService = new LiveClaudeTestService();
export default liveClaudeTestService;