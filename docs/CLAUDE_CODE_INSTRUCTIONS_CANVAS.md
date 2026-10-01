# Claude Code CLI — Build Instructions
# Firesite Mission Control: Infinite Canvas Dashboard
# Target: admin.firesite.ai
# Authored by: Thomas S. Butler + Claude Desktop, March 2026

---

## READ THIS FIRST

You are Claude Code CLI. Your job in this session is to build the Firesite Mission Control canvas and deploy it to admin.firesite.ai via Firebase Hosting. Read these instructions completely before writing a single line of code.

**What you are building:** A self-contained, interactive infinite canvas web application — think Gliffy or Miro, but purpose-built for the Firesite ecosystem. It shows every project, component, document, repo, and relationship as a pannable, zoomable, clickable node graph. It lives at admin.firesite.ai and is the single source of truth for where everything stands.

**Architecture decision (understand this before building):**
- Phase 1 (this session): Static HTML file with embedded JSON data. No backend. Deploys to Firebase Hosting as a static asset. Data updated by editing the JSON and redeploying.
- Phase 2 (future session): Firestore backend so Claude Code CLI can update node status programmatically without redeploying. Phase 1 is designed to make Phase 2 a clean addition, not a rewrite.

**Output:** One file — `canvas.html` — deployed to Firebase Hosting at admin.firesite.ai. No npm, no build step, no framework. Vanilla JS + Canvas API only.

---

## Step 0: Verify environment

```bash
# Confirm Firebase CLI is installed and authenticated
firebase --version
firebase projects:list

# Confirm the target project exists
# You need: firesite-prod (or firesite-dev for staging)
# If only dev exists, deploy to dev and note the URL

# Check current directory
pwd
# Should be in a Firesite project directory or create a new one:
mkdir -p ~/development/Firesite/admin-canvas
cd ~/development/Firesite/admin-canvas
```

---

## Step 1: Create the project structure

```bash
mkdir -p public
touch public/canvas.html
touch firebase.json
touch .firebaserc
```

**Write firebase.json:**
```json
{
  "hosting": {
    "site": "firesite-admin",
    "public": "public",
    "ignore": ["firebase.json", "**/.*"],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
        ]
      }
    ]
  }
}
```

**Write .firebaserc:**
```json
{
  "projects": {
    "default": "firesite-prod"
  },
  "targets": {
    "firesite-prod": {
      "hosting": {
        "firesite-admin": ["firesite-admin"]
      }
    }
  }
}
```

---

## Step 2: Write canvas.html

This is the entire application. Write it as a single file. Every section below is a part of this file in order.

### 2a. HTML shell and CSS

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Firesite Mission Control</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f0f0f;
  color: #e8e6e0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  user-select: none;
}

#canvas {
  position: absolute;
  top: 0; left: 0;
  cursor: grab;
}
#canvas.panning { cursor: grabbing; }

/* Top bar */
#topbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 48px;
  background: rgba(15,15,15,0.95);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 16px;
  z-index: 100;
  backdrop-filter: blur(8px);
}

#logo {
  font-size: 14px;
  font-weight: 600;
  color: #7F77DD;
  letter-spacing: 0.02em;
}

#subtitle {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
}

.spacer { flex: 1; }

#zoom-display {
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  min-width: 48px;
  text-align: right;
}

.toolbar-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12);
  background: transparent;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.toolbar-btn:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.9);
}

/* Legend */
#legend {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(15,15,15,0.9);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 12px 16px;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.legend-title {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 11px;
  color: rgba(255,255,255,0.55);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Detail panel */
#detail-panel {
  position: fixed;
  top: 68px;
  right: 20px;
  width: 300px;
  background: rgba(18,18,18,0.97);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 20px;
  z-index: 100;
  backdrop-filter: blur(12px);
  display: none;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

#detail-panel.visible { display: block; }

.detail-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.35);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
}
.detail-close:hover { color: rgba(255,255,255,0.8); }

.detail-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #e8e6e0;
  margin-bottom: 6px;
  line-height: 1.3;
}

.detail-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  line-height: 1.6;
  margin-bottom: 14px;
}

.detail-section {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 14px 0 6px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  align-items: flex-start;
}

.detail-label {
  color: rgba(255,255,255,0.35);
  min-width: 72px;
  flex-shrink: 0;
}

.detail-value {
  color: rgba(255,255,255,0.75);
  line-height: 1.5;
}

.detail-link {
  color: #7F77DD;
  text-decoration: none;
  font-size: 12px;
  display: block;
  margin-bottom: 4px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.detail-link:hover { color: #AFA9EC; }
.detail-link:last-child { border-bottom: none; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 500;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Mini map */
#minimap {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 160px;
  height: 100px;
  background: rgba(15,15,15,0.85);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  z-index: 100;
  overflow: hidden;
}

#minimap canvas {
  width: 100%;
  height: 100%;
}

/* Filter bar */
#filters {
  position: fixed;
  top: 58px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 99;
  padding: 6px;
  background: rgba(15,15,15,0.8);
  border-radius: 8px;
  backdrop-filter: blur(8px);
}

.filter-btn {
  padding: 4px 12px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.1);
  background: transparent;
  color: rgba(255,255,255,0.45);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn.active, .filter-btn:hover {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.9);
  border-color: rgba(255,255,255,0.2);
}
</style>
</head>
```

### 2b. HTML body structure

```html
<body>

<div id="topbar">
  <span id="logo">Firesite Mission Control</span>
  <span id="subtitle">Infrastructure for Human Potential</span>
  <div class="spacer"></div>
  <button class="toolbar-btn" onclick="resetView()">Reset view</button>
  <button class="toolbar-btn" onclick="fitAll()">Fit all</button>
  <button class="toolbar-btn" onclick="exportPNG()">Export PNG</button>
  <span id="zoom-display">100%</span>
</div>

<div id="filters">
  <button class="filter-btn active" onclick="setFilter('all')">All</button>
  <button class="filter-btn" onclick="setFilter('wave1')">Wave 1</button>
  <button class="filter-btn" onclick="setFilter('wave2')">Wave 2</button>
  <button class="filter-btn" onclick="setFilter('infra')">Infra</button>
  <button class="filter-btn" onclick="setFilter('business')">Business</button>
  <button class="filter-btn" onclick="setFilter('content')">Content</button>
</div>

<canvas id="canvas"></canvas>

<div id="legend">
  <div class="legend-title">Components</div>
  <div class="legend-item"><div class="legend-dot" style="background:#7F77DD"></div>Core platform</div>
  <div class="legend-item"><div class="legend-dot" style="background:#1D9E75"></div>Open source</div>
  <div class="legend-item"><div class="legend-dot" style="background:#D85A30"></div>Distribution</div>
  <div class="legend-item"><div class="legend-dot" style="background:#BA7517"></div>Business</div>
  <div class="legend-item"><div class="legend-dot" style="background:#378ADD"></div>Infrastructure</div>
  <div class="legend-item"><div class="legend-dot" style="background:#888780"></div>Content</div>
  <div class="legend-title" style="margin-top:10px">Status</div>
  <div class="legend-item"><div class="legend-dot" style="background:#1D9E75"></div>Done</div>
  <div class="legend-item"><div class="legend-dot" style="background:#BA7517"></div>In progress</div>
  <div class="legend-item"><div class="legend-dot" style="background:#888780"></div>Planned</div>
  <div class="legend-item"><div class="legend-dot" style="background:#A32D2D"></div>Blocked</div>
</div>

<div id="detail-panel">
  <button class="detail-close" onclick="closeDetail()">×</button>
  <span class="detail-badge" id="dp-badge"></span>
  <div class="detail-title" id="dp-title"></div>
  <div class="detail-desc" id="dp-desc"></div>
  <div class="detail-section">Details</div>
  <div id="dp-rows"></div>
  <div class="detail-section" id="dp-links-section" style="display:none">Links</div>
  <div id="dp-links"></div>
  <div class="detail-section" id="dp-blockers-section" style="display:none">Blockers</div>
  <div id="dp-blockers"></div>
</div>

<div id="minimap">
  <canvas id="minimap-canvas"></canvas>
</div>
```

### 2c. The data model

This is the source of truth. Every node, edge, and relationship lives here. Add nodes by extending this JSON. Claude Code CLI updates this JSON to reflect status changes.

```html
<script>
// ============================================================
// DATA MODEL — edit this JSON to update the canvas
// Claude Code CLI: update node.status and node.session fields
// to reflect real-time project state
// ============================================================

const GRAPH_DATA = {
  meta: {
    lastUpdated: "2026-03-25",
    version: "1.0.0",
    description: "Firesite Ecosystem — Mission Control"
  },

  // Color scheme per category
  colors: {
    platform:      { fill: "#2A2060", stroke: "#7F77DD", text: "#AFA9EC", badge: "#7F77DD" },
    oss:           { fill: "#0A3020", stroke: "#1D9E75", text: "#5DCAA5", badge: "#1D9E75" },
    distribution:  { fill: "#3A1A08", stroke: "#D85A30", text: "#F0997B", badge: "#D85A30" },
    business:      { fill: "#2A1A00", stroke: "#BA7517", text: "#EF9F27", badge: "#BA7517" },
    infra:         { fill: "#0A1A30", stroke: "#378ADD", text: "#85B7EB", badge: "#378ADD" },
    content:       { fill: "#1A1A1A", stroke: "#888780", text: "#B4B2A9", badge: "#888780" },
    protocol:      { fill: "#1A0A30", stroke: "#AFA9EC", text: "#CECBF6", badge: "#AFA9EC" }
  },

  // Status colors
  statusColors: {
    done:        "#1D9E75",
    inprogress:  "#BA7517",
    planned:     "#444441",
    blocked:     "#A32D2D"
  },

  // Canvas nodes
  nodes: [

    // ── CORE PLATFORM ──
    {
      id: "sso",
      label: "Firesite SSO",
      sublabel: "Auth · JWT · Stripe",
      category: "platform",
      filter: ["wave1", "infra"],
      status: "done",
      session: null,
      x: 340, y: 120,
      width: 180, height: 64,
      description: "Firebase Auth with JWT custom claims, Stripe billing integration, bearer token issuance, and tenant identity. 202/202 backend tests passing. Needs release packaging.",
      details: [
        { label: "Status", value: "202/202 tests passing" },
        { label: "Owner", value: "Cursor + CLI" },
        { label: "Blocker", value: "None — packaging only" },
        { label: "Validates", value: "New user → token → embed" }
      ],
      links: [
        { label: "GitHub: firesite-sso", url: "https://github.com/firesiteio/firesite-sso" },
        { label: "VISION_AND_STRATEGY.md", url: "#" }
      ],
      blockers: []
    },

    {
      id: "mcp-max",
      label: "MCP Max",
      sublabel: "Nerve center · Claude orchestration",
      category: "platform",
      filter: ["wave1"],
      status: "inprogress",
      session: "Session 3",
      x: 340, y: 240,
      width: 220, height: 64,
      description: "The intelligence layer. Claude orchestration, MMCO/UACP/PACP context passing, tenant configuration, skill deployment, and rate limiting. stream.firesite.ai (Cloud Run direct) handles all SSE.",
      details: [
        { label: "Status", value: "Partial — free tier needed" },
        { label: "Session", value: "Session 3" },
        { label: "Owner", value: "Cursor + CLI" },
        { label: "Blocker", value: "Session 2 (embed) first" }
      ],
      links: [
        { label: "GitHub: firesite-mcp-max (private)", url: "#" },
        { label: "Swagger docs: max.firesite.ai/api-docs", url: "https://max.firesite.ai/api-docs" },
        { label: "MASTER_LAUNCH_PLAN.md", url: "#" }
      ],
      blockers: ["Session 2 complete"]
    },

    {
      id: "halo",
      label: "HALO Protocol",
      sublabel: "Open attribution standard",
      category: "protocol",
      filter: ["wave1", "oss"],
      status: "inprogress",
      session: "Session 7",
      x: 580, y: 240,
      width: 190, height: 64,
      description: "Human Attribution Layer & Orchestration. Open standard woven through the entire ecosystem. PACP, CRAG, TDO, TDOM, LSTO, MMCO, UACP sub-protocols. Reference implementation in MCP Max.",
      details: [
        { label: "Status", value: "Architecture documented" },
        { label: "Session", value: "Session 7 (launch)" },
        { label: "Owner", value: "Cowork (spec) + Cursor (impl)" },
        { label: "Validates", value: "Spec published + white paper live" }
      ],
      links: [
        { label: "GitHub: halo-protocol", url: "https://github.com/firesiteio/halo-protocol" },
        { label: "White paper: The Open Context Protocol", url: "#" }
      ],
      blockers: []
    },

    // ── OPEN SOURCE ──
    {
      id: "chat-service",
      label: "Chat Service",
      sublabel: "OSS · Trojan Horse",
      category: "oss",
      filter: ["wave1", "oss"],
      status: "inprogress",
      session: "Session 1",
      x: 100, y: 240,
      width: 180, height: 64,
      description: "The Trojan Horse. Open-source embeddable AI chat widget. SSE streaming with Buffer-Parse-Replay pattern. Dual-mode: self-hosted (BYOK) or MCP Max (bearer token). Deploys to chat.firesite.ai/embed.js.",
      details: [
        { label: "Status", value: "95% — SSE fix needed" },
        { label: "Session", value: "Session 1 (NOW)" },
        { label: "Owner", value: "Cursor" },
        { label: "Blocker", value: "None — start immediately" },
        { label: "Validates", value: "Token-by-token SSE in DevTools" }
      ],
      links: [
        { label: "GitHub: firesite-chat-service", url: "https://github.com/firesiteio/firesite-chat-service" },
        { label: "NPM: @firesite/chat-service", url: "#" },
        { label: "VISION_AND_STRATEGY.md", url: "#" },
        { label: "TODO.md", url: "#" }
      ],
      blockers: []
    },

    {
      id: "mcp-basic",
      label: "MCP Basic",
      sublabel: "OSS · self-hosted",
      category: "oss",
      filter: ["oss"],
      status: "done",
      session: null,
      x: 100, y: 380,
      width: 160, height: 56,
      description: "Open-source MCP server. Self-hosted with personal API keys. No context persistence. The 'bring your own key' tier that makes the upgrade to MCP Max obvious.",
      details: [
        { label: "Status", value: "Live at port 3001" },
        { label: "License", value: "Apache 2.0" },
        { label: "Owner", value: "Public" }
      ],
      links: [
        { label: "GitHub: firesite-mcp-basic", url: "https://github.com/firesiteio/firesite-mcp-basic" }
      ],
      blockers: []
    },

    {
      id: "cli",
      label: "Firesite CLI",
      sublabel: "Port orchestration · deploy",
      category: "oss",
      filter: ["infra", "oss"],
      status: "inprogress",
      session: "Wave 1",
      x: 580, y: 380,
      width: 190, height: 56,
      description: "The five-minute deployment. firesite init → start → deploy. Auto port orchestration (3001/3002/5173). Claude-connected superpowers and shortcuts. npm install -g firesite.",
      details: [
        { label: "Status", value: "Core exists — needs integration" },
        { label: "Session", value: "Parallel to Wave 1" },
        { label: "Owner", value: "Cursor + CLI" },
        { label: "Deploy", value: "< 5 minutes to Firebase" }
      ],
      links: [
        { label: "GitHub: firesite-cli", url: "https://github.com/firesiteio/firesite-cli" },
        { label: "NPM: firesite", url: "#" }
      ],
      blockers: []
    },

    // ── DISTRIBUTION ──
    {
      id: "embed",
      label: "Embed script",
      sublabel: "chat.firesite.ai/embed.js",
      category: "distribution",
      filter: ["wave1"],
      status: "planned",
      session: "Session 2",
      x: 100, y: 500,
      width: 200, height: 56,
      description: "Single script tag + data-firesite-chat div = working chat widget on any site. Shadow DOM isolation. Dual-mode init. Deployed to Firebase Hosting as a CDN static asset.",
      details: [
        { label: "Status", value: "Not started" },
        { label: "Session", value: "Session 2" },
        { label: "Owner", value: "Cursor + CLI" },
        { label: "Blocker", value: "Session 1 complete" },
        { label: "Validates", value: "External domain + streaming" }
      ],
      links: [
        { label: "chat.firesite.ai/embed.js", url: "https://chat.firesite.ai/embed.js" }
      ],
      blockers: ["Session 1"]
    },

    {
      id: "wp-plugin",
      label: "WordPress plugin",
      sublabel: "WP marketplace · Trojan Horse wedge",
      category: "distribution",
      filter: ["wave1", "distribution"],
      status: "planned",
      session: "Session 6",
      x: 100, y: 620,
      width: 210, height: 56,
      description: "PHP wrapper around embed.js. WP admin settings page. Layout selector, theme picker, API key / bearer token input. Submitted to WordPress.org plugin marketplace.",
      details: [
        { label: "Status", value: "Not started" },
        { label: "Session", value: "Session 6" },
        { label: "Owner", value: "Cursor" },
        { label: "Blocker", value: "Sessions 1–2 complete" },
        { label: "Market", value: "43% of all websites" }
      ],
      links: [
        { label: "WordPress.org plugin submission", url: "https://wordpress.org/plugins/developers/" }
      ],
      blockers: ["Session 1", "Session 2"]
    },

    {
      id: "configurator",
      label: "Visual Configurator",
      sublabel: "firesite.io/configure · Flutter",
      category: "platform",
      filter: ["wave1"],
      status: "planned",
      session: "Sessions 4–5",
      x: 340, y: 500,
      width: 220, height: 56,
      description: "The Firesite.io expression layer. Layout picker (bubble/sidebar/modal/inline), color+font style tokens, 'pick a feeling' presets, real-time preview, embed export. Thoms leads creative direction.",
      details: [
        { label: "Status", value: "Design ready — not built" },
        { label: "Session", value: "Sessions 4–5 (critical path)" },
        { label: "Owner", value: "Thoms + Cursor" },
        { label: "Blocker", value: "Session 2 (embed exists first)" },
        { label: "10-day leave", value: "Reserve for this + Sessions 6–7" }
      ],
      links: [
        { label: "firesite.io/configure", url: "https://firesite.io/configure" }
      ],
      blockers: ["Session 2"]
    },

    // ── INFRASTRUCTURE ──
    {
      id: "firebase",
      label: "Firebase / GCP",
      sublabel: "Hosting · Firestore · Functions · Cloud Run",
      category: "infra",
      filter: ["infra"],
      status: "done",
      session: null,
      x: 580, y: 120,
      width: 220, height: 56,
      description: "Google Cloud / Firebase stack. Hosting for static assets. Firestore for data. Functions V2 for backend. Cloud Run for SSE streaming (stream.firesite.ai — bypass CDN). All V2 migrations complete.",
      details: [
        { label: "Projects", value: "firesite-dev + firesite-prod" },
        { label: "Functions", value: "V2 only — all migrated" },
        { label: "SSE routing", value: "stream.firesite.ai → Cloud Run direct" },
        { label: "CDN", value: "Cloudflare DNS — no caching on /stream" }
      ],
      links: [
        { label: "Firebase Console", url: "https://console.firebase.google.com" },
        { label: "Cloud Run console", url: "https://console.cloud.google.com/run" }
      ],
      blockers: []
    },

    {
      id: "github-ci",
      label: "GitHub CI/CD",
      sublabel: "Actions · lint · test · deploy",
      category: "infra",
      filter: ["infra"],
      status: "planned",
      session: "Before Session 1",
      x: 800, y: 240,
      width: 200, height: 56,
      description: "GitHub Actions workflows for every repo. lint-test on every PR. deploy-staging on dev push. deploy-prod on main merge. Secrets: FIREBASE_TOKEN, ANTHROPIC_API_KEY, STRIPE_SECRET.",
      details: [
        { label: "Status", value: "Template ready — not set up" },
        { label: "Priority", value: "Set up before Session 1" },
        { label: "Repos", value: "chat-service, mcp-max, mcp-basic, halo, cli, sso" }
      ],
      links: [
        { label: "GitHub: firesiteio org", url: "https://github.com/firesiteio" },
        { label: "BATTLE_PLAN.md — DevOps section", url: "#" }
      ],
      blockers: []
    },

    // ── BUSINESS ──
    {
      id: "stripe",
      label: "Stripe / Billing",
      sublabel: "Free → Pro → Studio → Enterprise",
      category: "business",
      filter: ["business"],
      status: "planned",
      session: "Session 3",
      x: 800, y: 380,
      width: 210, height: 56,
      description: "Stripe integration for tier gating. Free (rate limited, no persistence), Pro $14.95/mo, Studio $49/mo, Enterprise custom. Break-even at 4 Pro users. Ramen profitable at 50 users.",
      details: [
        { label: "Free tier", value: "Rate limited · no context persistence" },
        { label: "Pro", value: "$14.95/mo · context + MMCO" },
        { label: "Studio", value: "$49/mo · multi-widget + analytics" },
        { label: "Break-even", value: "4 Pro users ($59.80/mo)" },
        { label: "GoRout salary eq.", value: "~350 Pro users" }
      ],
      links: [
        { label: "Stripe dashboard", url: "https://dashboard.stripe.com" }
      ],
      blockers: ["Session 3 (SSO links Stripe)"]
    },

    {
      id: "gorout-customer1",
      label: "GoRout — Customer #1",
      sublabel: "Flag Football POC · reference case",
      category: "business",
      filter: ["business"],
      status: "inprogress",
      session: "Parallel",
      x: 800, y: 500,
      width: 200, height: 56,
      description: "GoRout Flag Football POC running on Firesite MCP Max infrastructure. Live case study. Mike Rolih's approval of the Firesite stack is the enterprise tier validator.",
      details: [
        { label: "Status", value: "POC sprint active" },
        { label: "CEO", value: "Mike Rolih — approved Firesite stack" },
        { label: "Role", value: "Enterprise reference customer" },
        { label: "Revenue", value: "Covered by CTO income during build" }
      ],
      links: [
        { label: "GoRout Flag Football repo", url: "https://github.com/firesiteio/gorout-flag-football" }
      ],
      blockers: []
    },

    // ── CONTENT ──
    {
      id: "tpttn",
      label: "TPTTN Substack",
      sublabel: "Three Paths Through the Noise",
      category: "content",
      filter: ["content"],
      status: "inprogress",
      session: "Ongoing",
      x: 340, y: 620,
      width: 200, height: 56,
      description: "Thomas's Substack publication. Market warm-up for Firesite launch. Releases independently as content is ready. Co-authored with Claude. Mon/Wed/Fri + Sunday podcast. Does not wait for coordinated launch.",
      details: [
        { label: "Status", value: "Active — publishing now" },
        { label: "Cadence", value: "Mon/Wed/Fri + Sunday podcast" },
        { label: "Role", value: "Market warm-up for Wave 1 launch" },
        { label: "Audio", value: "ElevenLabs voiceover" }
      ],
      links: [
        { label: "Substack", url: "https://substack.com" },
        { label: "iamthoms.com", url: "https://iamthoms.com" }
      ],
      blockers: []
    },

    {
      id: "white-paper",
      label: "White paper",
      sublabel: "The Open Context Protocol",
      category: "content",
      filter: ["content", "wave1"],
      status: "planned",
      session: "Session 7",
      x: 580, y: 620,
      width: 200, height: 56,
      description: "Thought leadership document establishing Firesite as the author of the open context protocol category. Authored by Cowork in one dedicated session. Published with coordinated launch.",
      details: [
        { label: "Status", value: "Not started" },
        { label: "Session", value: "One Cowork session" },
        { label: "Owner", value: "Cowork (author) + Thoms (review)" },
        { label: "Publishes", value: "Coordinated launch day" }
      ],
      links: [],
      blockers: ["All Wave 1 sessions complete"]
    },

    // ── WAVE 2 ──
    {
      id: "marketplace",
      label: "Firesite Marketplace",
      sublabel: "Templates · tools · 30% rev share",
      category: "platform",
      filter: ["wave2"],
      status: "planned",
      session: "Wave 2",
      x: 340, y: 760,
      width: 210, height: 56,
      description: "User-uploaded free and paid templates and tools. 30% revenue share. Self-populating economy. Firesite takes 30% of paid template revenue. Community builds the ecosystem.",
      details: [
        { label: "Status", value: "Wave 2 — not started" },
        { label: "Timeline", value: "60–90 days post-launch" },
        { label: "Rev share", value: "30% of paid template sales" }
      ],
      links: [],
      blockers: ["Wave 1 launch"]
    },

    {
      id: "firesite-io",
      label: "Firesite.io",
      sublabel: "CMS · knowledge graph · WP killer",
      category: "platform",
      filter: ["wave2"],
      status: "planned",
      session: "Wave 2+",
      x: 580, y: 760,
      width: 200, height: 56,
      description: "The WordPress killer. AI-native CMS on Firebase. GraphQL knowledge graph. MCP Max orchestration. Sub-5-minute install. Firesite.io is Firesite at 100% scope — the configurator is Firesite.io at 1% scope.",
      details: [
        { label: "Status", value: "Wave 2+ — architecture defined" },
        { label: "Timeline", value: "90+ days from launch" },
        { label: "Stack", value: "Firebase · GraphQL · MCP Max · Flutter" }
      ],
      links: [
        { label: "VISION_AND_STRATEGY.md", url: "#" }
      ],
      blockers: ["Wave 1 launch", "Marketplace v1"]
    }

  ], // end nodes

  // ── EDGES — connections between nodes ──
  edges: [
    { from: "sso",           to: "mcp-max",          label: "auth" },
    { from: "mcp-max",       to: "chat-service",      label: "orchestrates" },
    { from: "mcp-max",       to: "mcp-basic",         label: "upgrades to" },
    { from: "mcp-max",       to: "configurator",      label: "powers" },
    { from: "chat-service",  to: "embed",             label: "bundles to" },
    { from: "embed",         to: "wp-plugin",         label: "wrapped by" },
    { from: "firebase",      to: "mcp-max",           label: "hosts" },
    { from: "firebase",      to: "sso",               label: "hosts" },
    { from: "github-ci",     to: "firebase",          label: "deploys to" },
    { from: "halo",          to: "mcp-max",           label: "implemented in" },
    { from: "halo",          to: "white-paper",       label: "documented in" },
    { from: "cli",           to: "firebase",          label: "deploys to" },
    { from: "stripe",        to: "sso",               label: "billed via" },
    { from: "gorout-customer1", to: "mcp-max",        label: "uses" },
    { from: "configurator",  to: "marketplace",       label: "feeds" },
    { from: "marketplace",   to: "firesite-io",       label: "expands to" },
    { from: "wp-plugin",     to: "configurator",      label: "links to" },
    { from: "tpttn",         to: "white-paper",       label: "amplifies" }
  ]

}; // end GRAPH_DATA
```

### 2d. Canvas engine

```html
// ============================================================
// CANVAS ENGINE
// ============================================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

let transform = { x: 60, y: 80, scale: 1.0 };
let isPanning = false;
let lastMouse = { x: 0, y: 0 };
let hoveredNode = null;
let selectedNode = null;
let activeFilter = 'all';
let animFrame = null;

// Resize canvas to fill window
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  minimapCanvas.width = 160;
  minimapCanvas.height = 100;
  render();
}

window.addEventListener('resize', resize);

// ── Coordinate transforms ──
function toScreen(wx, wy) {
  return {
    x: wx * transform.scale + transform.x,
    y: wy * transform.scale + transform.y
  };
}

function toWorld(sx, sy) {
  return {
    x: (sx - transform.x) / transform.scale,
    y: (sy - transform.y) / transform.scale
  };
}

// ── Filtered nodes ──
function visibleNodes() {
  if (activeFilter === 'all') return GRAPH_DATA.nodes;
  return GRAPH_DATA.nodes.filter(n => n.filter && n.filter.includes(activeFilter));
}

// ── Hit test ──
function nodeAt(sx, sy) {
  const world = toWorld(sx, sy);
  const nodes = visibleNodes().slice().reverse();
  for (const n of nodes) {
    if (world.x >= n.x && world.x <= n.x + n.width &&
        world.y >= n.y && world.y <= n.y + n.height) {
      return n;
    }
  }
  return null;
}

// ── Drawing ──
function drawNode(n, isHovered, isSelected) {
  const c = GRAPH_DATA.colors[n.category] || GRAPH_DATA.colors.content;
  const sc = toScreen(n.x, n.y);
  const w = n.width * transform.scale;
  const h = n.height * transform.scale;
  const r = 10 * transform.scale;

  ctx.save();

  // Selection glow
  if (isSelected) {
    ctx.shadowColor = c.stroke;
    ctx.shadowBlur = 16;
  }

  // Hover scale
  const scale = isHovered ? 1.03 : 1.0;
  const cx = sc.x + w / 2;
  const cy = sc.y + h / 2;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  // Node background
  ctx.beginPath();
  roundRect(ctx, sc.x, sc.y, w, h, r);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = isSelected ? c.badge : (isHovered ? c.stroke : c.stroke + '88');
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.stroke();

  // Status indicator (left edge)
  const statusColor = GRAPH_DATA.statusColors[n.status] || '#444';
  ctx.beginPath();
  roundRect(ctx, sc.x, sc.y + h * 0.25, 3 * transform.scale, h * 0.5, 2);
  ctx.fillStyle = statusColor;
  ctx.fill();

  // Label
  const baseFontSize = Math.max(10, 13 * transform.scale);
  const subFontSize = Math.max(9, 11 * transform.scale);
  const labelY = n.sublabel ? sc.y + h * 0.38 : sc.y + h * 0.5;

  ctx.fillStyle = c.text;
  ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(n.label, sc.x + w / 2, labelY);

  if (n.sublabel) {
    ctx.fillStyle = c.text + 'aa';
    ctx.font = `400 ${subFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillText(n.sublabel, sc.x + w / 2, sc.y + h * 0.65);
  }

  // Session badge (top right)
  if (n.session) {
    const bfs = Math.max(8, 9 * transform.scale);
    ctx.font = `500 ${bfs}px -apple-system, sans-serif`;
    ctx.fillStyle = c.badge;
    ctx.textAlign = 'right';
    ctx.fillText(n.session, sc.x + w - 8 * transform.scale, sc.y + 12 * transform.scale);
  }

  ctx.restore();
}

function drawEdge(edge) {
  const fn = GRAPH_DATA.nodes.find(n => n.id === edge.from);
  const tn = GRAPH_DATA.nodes.find(n => n.id === edge.to);
  if (!fn || !tn) return;

  const visIds = visibleNodes().map(n => n.id);
  if (!visIds.includes(fn.id) || !visIds.includes(tn.id)) return;

  const fs = toScreen(fn.x + fn.width / 2, fn.y + fn.height / 2);
  const ts = toScreen(tn.x + tn.width / 2, tn.y + tn.height / 2);

  // Curve the line slightly
  const mx = (fs.x + ts.x) / 2;
  const my = (fs.y + ts.y) / 2 - 20 * transform.scale;

  ctx.beginPath();
  ctx.moveTo(fs.x, fs.y);
  ctx.quadraticCurveTo(mx, my, ts.x, ts.y);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = Math.max(0.5, transform.scale);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(ts.y - my, ts.x - mx);
  const aSize = 6 * transform.scale;
  ctx.beginPath();
  ctx.moveTo(ts.x, ts.y);
  ctx.lineTo(ts.x - aSize * Math.cos(angle - 0.4), ts.y - aSize * Math.sin(angle - 0.4));
  ctx.lineTo(ts.x - aSize * Math.cos(angle + 0.4), ts.y - aSize * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGrid() {
  const gridSize = 40 * transform.scale;
  const offsetX = transform.x % gridSize;
  const offsetY = transform.y % gridSize;

  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth = 0.5;

  for (let x = offsetX; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = offsetY; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawMinimap() {
  const mc = minimapCtx;
  mc.clearRect(0, 0, 160, 100);

  // Find world bounds
  const nodes = visibleNodes();
  if (nodes.length === 0) return;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const xe = nodes.map(n => n.x + n.width);
  const ye = nodes.map(n => n.y + n.height);
  const minX = Math.min(...xs) - 20;
  const minY = Math.min(...ys) - 20;
  const maxX = Math.max(...xe) + 20;
  const maxY = Math.max(...ye) + 20;
  const ww = maxX - minX;
  const wh = maxY - minY;
  const scaleX = 160 / ww;
  const scaleY = 100 / wh;
  const s = Math.min(scaleX, scaleY);

  for (const n of nodes) {
    const c = GRAPH_DATA.colors[n.category] || GRAPH_DATA.colors.content;
    mc.fillStyle = c.stroke + '66';
    mc.fillRect((n.x - minX) * s, (n.y - minY) * s, n.width * s, n.height * s);
  }

  // Viewport indicator
  const vx = (-transform.x / transform.scale - minX) * s;
  const vy = (-transform.y / transform.scale - minY) * s;
  const vw = (canvas.width / transform.scale) * s;
  const vh = (canvas.height / transform.scale) * s;
  mc.strokeStyle = 'rgba(255,255,255,0.4)';
  mc.lineWidth = 1;
  mc.strokeRect(vx, vy, vw, vh);
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // Edges first
  for (const e of GRAPH_DATA.edges) drawEdge(e);

  // Nodes
  for (const n of visibleNodes()) {
    drawNode(n, n === hoveredNode, n === selectedNode);
  }

  drawMinimap();
  document.getElementById('zoom-display').textContent = Math.round(transform.scale * 100) + '%';
}

// ── Interaction ──
canvas.addEventListener('mousedown', e => {
  if (e.button === 0) {
    const hit = nodeAt(e.clientX, e.clientY);
    if (hit) {
      selectNode(hit);
    } else {
      closeDetail();
      selectedNode = null;
      isPanning = true;
      canvas.classList.add('panning');
      lastMouse = { x: e.clientX, y: e.clientY };
    }
  }
});

canvas.addEventListener('mousemove', e => {
  if (isPanning) {
    transform.x += e.clientX - lastMouse.x;
    transform.y += e.clientY - lastMouse.y;
    lastMouse = { x: e.clientX, y: e.clientY };
    render();
  } else {
    const hit = nodeAt(e.clientX, e.clientY);
    if (hit !== hoveredNode) {
      hoveredNode = hit;
      canvas.style.cursor = hit ? 'pointer' : 'grab';
      render();
    }
  }
});

canvas.addEventListener('mouseup', () => {
  isPanning = false;
  canvas.classList.remove('panning');
});

canvas.addEventListener('mouseleave', () => {
  isPanning = false;
  canvas.classList.remove('panning');
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.91;
  const cx = e.clientX;
  const cy = e.clientY;
  transform.x = cx - (cx - transform.x) * factor;
  transform.y = cy - (cy - transform.y) * factor;
  transform.scale = Math.min(3, Math.max(0.2, transform.scale * factor));
  render();
}, { passive: false });

// Touch support
let lastTouchDist = 0;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    const hit = nodeAt(t.clientX, t.clientY);
    if (hit) { selectNode(hit); return; }
    isPanning = true;
    lastMouse = { x: t.clientX, y: t.clientY };
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && isPanning) {
    const t = e.touches[0];
    transform.x += t.clientX - lastMouse.x;
    transform.y += t.clientY - lastMouse.y;
    lastMouse = { x: t.clientX, y: t.clientY };
    render();
  } else if (e.touches.length === 2) {
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = d / lastTouchDist;
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    transform.x = cx - (cx - transform.x) * factor;
    transform.y = cy - (cy - transform.y) * factor;
    transform.scale = Math.min(3, Math.max(0.2, transform.scale * factor));
    lastTouchDist = d;
    render();
  }
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', () => { isPanning = false; });

// ── Detail panel ──
function selectNode(n) {
  selectedNode = n;
  const panel = document.getElementById('detail-panel');
  const c = GRAPH_DATA.colors[n.category] || GRAPH_DATA.colors.content;

  document.getElementById('dp-badge').textContent = n.category.toUpperCase();
  document.getElementById('dp-badge').style.background = c.fill;
  document.getElementById('dp-badge').style.color = c.badge;
  document.getElementById('dp-title').textContent = n.label;
  document.getElementById('dp-desc').textContent = n.description;

  // Status pill
  const statusColor = GRAPH_DATA.statusColors[n.status] || '#444';
  const rows = document.getElementById('dp-rows');
  rows.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">Status</span>
      <span class="status-pill" style="background:${statusColor}22;color:${statusColor}">
        <span class="status-dot" style="background:${statusColor}"></span>
        ${n.status}
      </span>
    </div>
  `;

  for (const d of (n.details || [])) {
    if (d.label === 'Status') continue;
    rows.innerHTML += `
      <div class="detail-row">
        <span class="detail-label">${d.label}</span>
        <span class="detail-value">${d.value}</span>
      </div>
    `;
  }

  const linksEl = document.getElementById('dp-links');
  const linksSection = document.getElementById('dp-links-section');
  if (n.links && n.links.length > 0) {
    linksSection.style.display = 'block';
    linksEl.innerHTML = n.links.map(l =>
      `<a class="detail-link" href="${l.url}" target="_blank">${l.label}</a>`
    ).join('');
  } else {
    linksSection.style.display = 'none';
    linksEl.innerHTML = '';
  }

  const blockersEl = document.getElementById('dp-blockers');
  const blockersSection = document.getElementById('dp-blockers-section');
  if (n.blockers && n.blockers.length > 0) {
    blockersSection.style.display = 'block';
    blockersEl.innerHTML = n.blockers.map(b =>
      `<div class="detail-row"><span class="detail-value" style="color:#E24B4A">⚡ ${b}</span></div>`
    ).join('');
  } else {
    blockersSection.style.display = 'none';
    blockersEl.innerHTML = '';
  }

  panel.classList.add('visible');
  render();
}

function closeDetail() {
  document.getElementById('detail-panel').classList.remove('visible');
  selectedNode = null;
  render();
}

// ── Controls ──
function resetView() {
  transform = { x: 60, y: 80, scale: 1.0 };
  render();
}

function fitAll() {
  const nodes = visibleNodes();
  if (nodes.length === 0) return;
  const padding = 80;
  const minX = Math.min(...nodes.map(n => n.x)) - padding;
  const minY = Math.min(...nodes.map(n => n.y)) - padding;
  const maxX = Math.max(...nodes.map(n => n.x + n.width)) + padding;
  const maxY = Math.max(...nodes.map(n => n.y + n.height)) + padding;
  const scaleX = canvas.width / (maxX - minX);
  const scaleY = canvas.height / (maxY - minY);
  transform.scale = Math.min(scaleX, scaleY, 1.5);
  transform.x = -minX * transform.scale + (canvas.width - (maxX - minX) * transform.scale) / 2;
  transform.y = -minY * transform.scale + (canvas.height - (maxY - minY) * transform.scale) / 2;
  render();
}

function setFilter(f) {
  activeFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.filter-btn').forEach(b => {
    if (b.getAttribute('onclick').includes("'" + f + "'")) b.classList.add('active');
  });
  closeDetail();
  fitAll();
}

function exportPNG() {
  const link = document.createElement('a');
  link.download = 'firesite-mission-control.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDetail();
  if (e.key === 'f' || e.key === 'F') fitAll();
  if (e.key === 'r' || e.key === 'R') resetView();
  if (e.key === '+' || e.key === '=') {
    transform.scale = Math.min(3, transform.scale * 1.2);
    render();
  }
  if (e.key === '-') {
    transform.scale = Math.max(0.2, transform.scale * 0.83);
    render();
  }
});

// ── Init ──
resize();
fitAll();
</script>
</body>
</html>
```

---

## Step 3: Deploy to Firebase Hosting

```bash
# From ~/development/Firesite/admin-canvas

# First deploy: initialize hosting site if needed
firebase hosting:sites:create firesite-admin
# (only needed first time)

# Deploy
firebase deploy --only hosting:firesite-admin

# Output will give you the URL — add custom domain after:
# Firebase Console → Hosting → Add custom domain → admin.firesite.ai
```

---

## Step 4: Set up admin.firesite.ai custom domain

1. Go to Firebase Console → Hosting → your project
2. Click "Add custom domain"
3. Enter: `admin.firesite.ai`
4. Add the DNS records Firebase gives you in Cloudflare
5. Wait for SSL provisioning (~30 min)

In Cloudflare for admin.firesite.ai:
- Type: CNAME
- Name: admin
- Target: (value Firebase gives you)
- Proxy: ON (orange cloud)

---

## Step 5: Validate

```bash
# After deploy, test locally first:
cd public
python3 -m http.server 8888
# Open http://localhost:8888/canvas.html

# Verify:
# - Canvas renders with all nodes
# - Pan works (click+drag on empty space)
# - Zoom works (mouse wheel / pinch)
# - Click a node opens detail panel
# - Filter buttons change visible nodes
# - Fit All button zooms to show all nodes
# - Export PNG downloads the canvas
```

---

## Step 6: How to update the canvas going forward

The canvas is data-driven. All updates are edits to the `GRAPH_DATA` JSON inside `canvas.html`.

### Update a node status (mark as done):
Find the node by `id` and change:
```json
"status": "inprogress"  →  "status": "done"
"session": "Session 1"  →  "session": null
```

### Add a new node:
Copy any existing node object, give it a new unique `id`, update all fields, add it to the `nodes` array. Then add edges if needed.

### Add a new edge:
```json
{ "from": "source-node-id", "to": "target-node-id", "label": "relationship" }
```

### After any edit:
```bash
firebase deploy --only hosting:firesite-admin
```

The canvas is live-updated in ~30 seconds after deploy.

---

## Phase 2 (Future Session): Firestore backend

When you want Claude Code CLI to update node status programmatically without editing HTML:

1. Move `GRAPH_DATA` to a Firestore document: `admin/canvas/graphData`
2. Add Firebase SDK to canvas.html
3. Replace static JSON load with `onSnapshot` real-time listener
4. Create a Cloud Function: `POST /api/canvas/updateNode` that accepts `{id, status, session}` and writes to Firestore
5. Claude Code CLI can then call: `curl -X POST https://max.firesite.ai/api/canvas/updateNode -d '{"id":"chat-service","status":"done"}'`

This is a clean addition to Phase 1 — no rewrite required.

---

## Summary of what you are building

- A single `canvas.html` file deployed to admin.firesite.ai
- Infinite pannable/zoomable canvas with all Firesite projects as nodes
- Click any node for full detail: description, status, links, blockers
- Filter by wave, domain, or status
- Minimap for navigation
- Export to PNG
- Keyboard shortcuts (f=fit, r=reset, esc=close panel, +/-=zoom)
- Touch/mobile support
- Zero npm, zero build step, zero framework
- Data lives in JSON — update by editing and redeploying
- Phase 2 Firestore backend is a clean add-on

Total estimated build time: 1–2 hours (mostly verification and Firebase setup).

---

*Instructions authored by: Claude Desktop, March 2026*  
*For: Thomas S. Butler, Firesite LLC*
