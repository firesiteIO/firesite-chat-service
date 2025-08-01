/**
 * Simple Node.js file server for saving bug reports directly to filesystem
 * Runs alongside Vite dev server for localhost development
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Import service registry for CLI integration
import { registerService, unregisterService } from './utils/service-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174; // Different port from Vite (5173)

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for big reports

// Target directory for bug reports
const BUG_REPORTS_DIR = path.join(__dirname, 'docs', 'sse_bug_reports');

/**
 * Ensure bug reports directory exists
 */
async function ensureDirectoryExists() {
  try {
    await fs.access(BUG_REPORTS_DIR);
  } catch (error) {
    await fs.mkdir(BUG_REPORTS_DIR, { recursive: true });
    console.log(`Created directory: ${BUG_REPORTS_DIR}`);
  }
}

/**
 * POST /save-bug-report
 * Save bug report directly to filesystem
 */
app.post('/save-bug-report', async (req, res) => {
  try {
    const { filename, content } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ 
        error: 'Missing filename or content' 
      });
    }
    
    // Ensure filename is safe
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(BUG_REPORTS_DIR, safeFilename);
    
    // Write file
    await fs.writeFile(filePath, content, 'utf8');
    
    console.log(`Bug report saved: ${safeFilename}`);
    
    res.json({ 
      success: true, 
      filename: safeFilename,
      path: filePath
    });
    
  } catch (error) {
    console.error('Error saving bug report:', error);
    res.status(500).json({ 
      error: 'Failed to save bug report',
      details: error.message 
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'file-server',
    port: PORT,
    bugReportsDir: BUG_REPORTS_DIR
  });
});

/**
 * Start server
 */
async function startServer() {
  try {
    await ensureDirectoryExists();
    
    app.listen(PORT, () => {
      console.log(`File server running on http://localhost:${PORT}`);
      console.log(`Bug reports will be saved to: ${BUG_REPORTS_DIR}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      
      // Register with Firesite CLI registry as chat-service
      try {
        registerService('chat-service', PORT, process.pid, '/health');
        console.log('Registered with Firesite CLI registry as: chat-service');
        console.log('Note: Frontend runs on Vite port 5173, backend/health on port 5174');
      } catch (error) {
        console.warn('Failed to register with CLI registry:', error.message);
      }
    });
  } catch (error) {
    console.error('Failed to start file server:', error);
    process.exit(1);
  }
}

// Setup cleanup handlers for graceful shutdown
const cleanup = () => {
  console.log('Shutting down file server...');
  
  // Unregister from CLI registry
  try {
    unregisterService('chat-service');
    console.log('Successfully unregistered from CLI registry');
  } catch (error) {
    console.error('Failed to unregister from CLI registry:', error.message);
  }
  
  process.exit(0);
};

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  try {
    unregisterService('chat-service');
  } catch (error) {
    // Silent fail on exit
  }
});

startServer();