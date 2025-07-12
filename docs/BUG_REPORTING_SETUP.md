# Bug Reporting System - Setup Guide

## Quick Start for Localhost Development

### Start Both Servers
```bash
# Start file server (port 5174) AND Vite dev server (port 5173) together
npm run dev:debug

# OR start them separately:
npm run file-server  # Port 5174 - File saving API
npm run dev          # Port 5173 - Main app
```

### How It Works

**For Localhost Development (You):**
1. **Direct Filesystem Save** - Bug reports saved directly to `docs/sse_bug_reports/`
2. **No File Moving** - Files appear instantly in the correct folder
3. **Automatic Fallback** - If file server isn't running, falls back to browser download

**For Live Web Users:**
1. **File System Access API** - Modern browsers get native save dialog
2. **Browser Download** - Other browsers download with clear instructions
3. **Cross-Platform** - Works everywhere without server dependency

## Usage

### Chat Interface Bug Reports
1. Have a conversation
2. Notice an issue (heading corruption, list numbering, etc.)
3. Click the icon in bottom-right of conversation
4. Describe the issue
5. Click "Generate Bug Report"
6. **File instantly appears in `docs/sse_bug_reports/`** 

### Live Test Auto-Reports  
1. Go to `http://localhost:5173/live-claude-test.html`
2. Select a test (e.g., "simple-markdown")
3. Click "Run Single Test"
4. **Auto-generated report instantly appears in `docs/sse_bug_reports/`**

## File Structure

```
docs/
└── sse_bug_reports/          # ← Bug reports appear here automatically
    ├── simple-markdown-1704123456789.md
    ├── chat-session-bug-1704123456790.md
    └── complex-formatting-1704123456791.md
```

## Technical Details

### File Server API
- **Port**: 5174
- **Endpoint**: `POST /save-bug-report`
- **Health Check**: `GET /health`
- **CORS**: Enabled for localhost development

### Fallback Chain
1. **Node.js File Server** (localhost only)
2. **File System Access API** (Chrome/Edge)  
3. **Traditional Download** (all browsers)

### Security
- Filename sanitization (safe characters only)
- localhost/127.0.0.1 hostname check
- 10MB content limit for large reports

## Captured Data

Each bug report contains:
- **Full SSE Stream** (complete event/data format)
- **Rendered HTML Output** (final DOM state)
- **Console Logs** (filtered for relevance)
- **Performance Metrics** (timing, content length)
- **User Description** (your observations)
- **Metadata** (timestamp, test case, session ID)

## Quick Test

1. Start servers: `npm run dev:debug`
2. Open: `http://localhost:5173/live-claude-test.html`
3. Run "simple-markdown" test
4. Check: `docs/sse_bug_reports/` for the auto-generated file

Perfect for rapid bug capture and systematic debugging!