/**
 * BugReportCaptureService - Automated context capture for streaming bugs
 * Integrates with existing streaming services without modification
 * 
 * This service captures SSE streams, parser states, and rendered HTML
 * to generate comprehensive bug reports in the standardized format.
 */

export class BugReportCaptureService {
  constructor() {
    this.isCapturing = false;
    this.sseChunks = [];
    this.renderedHTML = '';
    this.parserStates = [];
    this.consoleLogs = [];
    this.performanceMetrics = {};
    this.maxChunkHistory = 500; // Keep many more chunks to capture full conversations
    this.sessionId = this.generateSessionId();
    this.captureStartTime = null;
    this.originalPrompt = '';
    this.testCaseName = '';
    
    this.initializeConsoleCapture();
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize console log capture with filtering
   */
  initializeConsoleCapture() {
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    // Override console methods to capture relevant logs
    const captureConsoleOutput = (level) => {
      return (...args) => {
        // Call original method first
        this.originalConsole[level](...args);
        
        // Capture if we're actively capturing and it's relevant
        if (this.isCapturing) {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          
          // Filter for relevant logs only
          if (this.isRelevantLog(message)) {
            this.consoleLogs.push({
              level,
              message,
              timestamp: Date.now() - this.captureStartTime
            });
          }
        }
      };
    };

    console.log = captureConsoleOutput('log');
    console.warn = captureConsoleOutput('warn');
    console.error = captureConsoleOutput('error');
  }

  /**
   * Filter console logs to capture only relevant debugging info
   */
  isRelevantLog(message) {
    // Skip our own capture logs and other noise
    if (message.includes('Bug capture') || 
        message.includes('Performance metric') ||
        message.includes('Captured SSE chunk') ||
        message.includes('SSE chunk captured') ||
        message.includes('highlight.js not available')) {
      return false;
    }

    // Include only critical streaming, parsing, rendering logs
    const relevantPatterns = [
      'BREAKTHROUGH', 'STREAM END', 'Error', 'Failed', 'Warning',
      'error', 'failed', 'issue', 'problem',
      'STATE TRANSITION', 'BLOCKED RAPID', 'MICRO-CHUNK', 
      'CODE PROTECTION', 'PROCESSING LOCKED', 'COMPLETE SYNTAX',
      'CODE BLOCK ASSEMBLY', 'BUFFER FLUSH'
    ];

    return relevantPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Start capturing context for a test case or chat session
   */
  startCapture(testCase = '', originalPrompt = '') {
    this.isCapturing = true;
    this.captureStartTime = Date.now();
    this.testCaseName = testCase;
    this.originalPrompt = originalPrompt;
    this.sseChunks = [];
    this.consoleLogs = [];
    this.parserStates = [];
    this.performanceMetrics = {};
    this.renderedHTML = '';
  }

  /**
   * Stop capturing
   */
  stopCapture() {
    this.isCapturing = false;
  }

  /**
   * Capture SSE chunk with metadata
   */
  captureSSEChunk(chunk, metadata = {}) {
    if (!this.isCapturing) return;

    try {
      const timestamp = Date.now() - this.captureStartTime;
      this.sseChunks.push({
        chunk,
        timestamp,
        metadata,
        index: this.sseChunks.length
      });

      // Keep only recent chunks to avoid memory issues (but allow more for full capture)
      if (this.sseChunks.length > this.maxChunkHistory) {
        // Remove older chunks but keep a substantial history
        this.sseChunks.splice(0, this.sseChunks.length - this.maxChunkHistory);
      }
    } catch (error) {
      console.warn('Bug capture failed for SSE chunk:', error);
    }
  }

  /**
   * Capture rendered HTML output
   */
  captureRenderedHTML(html) {
    if (!this.isCapturing) return;

    try {
      this.renderedHTML = html;
    } catch (error) {
      console.warn('Bug capture failed for HTML:', error);
    }
  }

  /**
   * Capture parser state transitions
   */
  captureParserState(state, context = '') {
    if (!this.isCapturing) return;

    try {
      const timestamp = Date.now() - this.captureStartTime;
      this.parserStates.push({
        state,
        context,
        timestamp
      });
    } catch (error) {
      console.warn('Bug capture failed for parser state:', error);
    }
  }

  /**
   * Capture performance metrics
   */
  capturePerformanceMetric(name, value) {
    if (!this.isCapturing) return;

    try {
      this.performanceMetrics[name] = value;
    } catch (error) {
      console.warn('Bug capture failed for performance metric:', error);
    }
  }

  /**
   * Format SSE stream for report
   */
  formatSSEStream() {
    if (this.sseChunks.length === 0) {
      return 'No SSE chunks captured';
    }

    let formatted = '';

    // Add start event
    formatted += 'event: start\n';
    formatted += 'data: {"success":true}\n\n';

    // Format each chunk - check for different formats we might receive
    for (const {chunk, metadata} of this.sseChunks) {
      formatted += 'event: chunk\n';
      
      // Handle different chunk formats that might come from different providers
      if (typeof chunk === 'string') {
        // Escape quotes and newlines for JSON
        const escapedChunk = chunk
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        
        // Use content format (MCP Max style) if metadata suggests it, otherwise use text format  
        if (metadata && metadata.format === 'content') {
          formatted += `data: {"content":"${escapedChunk}"}\n\n`;
        } else {
          formatted += `data: {"text":"${escapedChunk}"}\n\n`;
        }
      } else if (typeof chunk === 'object') {
        // Already an object, stringify it
        formatted += `data: ${JSON.stringify(chunk)}\n\n`;
      } else {
        // Fallback
        formatted += `data: {"text":"${String(chunk).replace(/"/g, '\\"')}"}\n\n`;
      }
    }

    // Add end event
    formatted += 'event: end\n';
    formatted += 'data: {"success":true}\n\n';

    return formatted;
  }

  /**
   * Format console logs for report
   */
  formatConsoleLogs() {
    if (this.consoleLogs.length === 0) {
      return 'No relevant console logs captured';
    }

    return this.consoleLogs
      .map(({level, message, timestamp}) => 
        `[${timestamp}ms] ${level.toUpperCase()}: ${message}`
      )
      .join('\n');
  }

  /**
   * Format parser states for report
   */
  formatParserStates() {
    if (this.parserStates.length === 0) {
      return 'No parser state transitions captured';
    }

    return this.parserStates
      .map(({state, context, timestamp}) => 
        `[${timestamp}ms] ${state}: ${context}`
      )
      .join('\n');
  }

  /**
   * Generate comprehensive bug report
   */
  generateBugReport(title, description, userComments = '') {
    const timestamp = new Date().toISOString();
    const prompt = this.originalPrompt || 'No prompt captured';
    
    const report = `AUTO PROMPT TO CLAUDE:

${prompt}

COMMENTS & OBSERVATIONS: 

${userComments || description}

${description ? `This issue was captured during live testing of the Firesite chat interface. ${description}` : 'This issue was captured during live testing of the Firesite chat interface.'}

SSE DATA STREAM:

${this.formatSSEStream()}

RENDERED HTML OUTPUT:

${this.renderedHTML || 'No HTML output captured'}

CONSOLE LOGS:

${this.formatConsoleLogs()}

PARSER STATE TRANSITIONS:

${this.formatParserStates()}

PERFORMANCE METRICS:

${Object.entries(this.performanceMetrics)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n') || 'No performance metrics captured'}

CAPTURE METADATA:

- Session ID: ${this.sessionId}
- Test Case: ${this.testCaseName || 'Manual chat session'}
- Generated: ${timestamp}
- SSE Chunks: ${this.sseChunks.length}
- Console Logs: ${this.consoleLogs.length}
- Parser States: ${this.parserStates.length}

---
*Generated automatically by Firesite Bug Report Capture*`;

    return report;
  }

  /**
   * Download bug report as markdown file - tries Node.js server first for localhost
   */
  async downloadReport(content, filename) {
    try {
      // For localhost development, try to save directly via Node.js server
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const response = await fetch('http://localhost:5174/save-bug-report', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename,
              content
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            this.showDirectSaveSuccess(result.filename, result.path);
            return;
          } else {
            console.warn('Node.js file server not available, falling back to browser download');
          }
        } catch (serverError) {
          console.warn('Failed to connect to file server, falling back to browser download:', serverError.message);
        }
      }
      
      // Try File System Access API for modern browsers
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'Markdown files',
                accept: {
                  'text/markdown': ['.md'],
                },
              },
            ],
            startIn: 'documents' // Start in Documents folder
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(content);
          await writable.close();
          
          this.showSaveSuccess(filename);
          return;
        } catch (fsError) {
          if (fsError.name !== 'AbortError') {
            console.warn('File System API failed, falling back to download:', fsError);
          } else {
            console.log('User cancelled file save dialog');
            return;
          }
        }
      }
      
      // Fallback to traditional download with clear instructions
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`Bug report downloaded: ${filename}`);
      this.showMoveInstructions(filename);
      
    } catch (error) {
      console.error('Failed to download bug report:', error);
    }
  }

  /**
   * Show success message for direct filesystem save
   */
  showDirectSaveSuccess(filename, filepath) {
    // Create toast notification for direct save
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #059669;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 450px;
    `;
    toast.innerHTML = `
      <strong>Bug Report Saved to Filesystem!</strong><br>
      <span style="opacity: 0.9; font-size: 12px;">${filename}</span><br>
      <span style="opacity: 0.7; font-size: 11px;">sse_bug_reports/ folder</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 5000);
  }

  /**
   * Show success message for direct save
   */
  showSaveSuccess(filename) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 400px;
    `;
    toast.innerHTML = `
      <strong>Bug Report Saved!</strong><br>
      <span style="opacity: 0.9;">${filename}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 4000);
  }

  /**
   * Show instructions for moving downloaded file
   */
  showMoveInstructions(filename) {
    // Create instruction modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      ">
        <h3 style="margin: 0 0 15px 0; color: #1f2937;">Bug Report Downloaded</h3>
        <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5;">
          <strong>${filename}</strong> was downloaded to your Downloads folder.
        </p>
        <div style="
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: left;
          font-family: monospace;
          font-size: 13px;
          color: #374151;
        ">
          <strong>Move it to:</strong><br>
          /Users/thomasbutler/Documents/Firesite/<br>firesite-chat-service/docs/sse_bug_reports/
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        ">Got it!</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Create and download bug report
   */
  async createBugReport(title, description, userComments = '') {
    const report = this.generateBugReport(title, description, userComments);
    const filename = `${this.testCaseName || 'chat-session'}-bug-${Date.now()}.md`;
    await this.downloadReport(report, filename);
    return report;
  }

  /**
   * Get current capture status
   */
  getStatus() {
    return {
      isCapturing: this.isCapturing,
      sessionId: this.sessionId,
      sseChunks: this.sseChunks.length,
      consoleLogs: this.consoleLogs.length,
      parserStates: this.parserStates.length,
      testCase: this.testCaseName,
      hasRenderedHTML: !!this.renderedHTML,
      htmlLength: this.renderedHTML ? this.renderedHTML.length : 0
    };
  }

  /**
   * Wait for capture to have sufficient data
   */
  async waitForCaptureData(timeoutMs = 1000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = this.getStatus();
      
      // Check if we have meaningful data captured
      if (status.sseChunks > 0 && status.hasRenderedHTML) {
        // console.log(`Bug capture data ready: ${status.sseChunks} chunks, ${status.htmlLength} chars HTML`);
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.warn('Bug capture timeout - proceeding with available data');
    return false;
  }

  /**
   * Reset capture service
   */
  reset() {
    this.stopCapture();
    this.sseChunks = [];
    this.consoleLogs = [];
    this.parserStates = [];
    this.performanceMetrics = {};
    this.renderedHTML = '';
    this.sessionId = this.generateSessionId();
  }
}

// Export singleton instance
export const bugReportCapture = new BugReportCaptureService();
export default bugReportCapture;