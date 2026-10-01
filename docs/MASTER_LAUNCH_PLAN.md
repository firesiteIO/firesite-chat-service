# Firesite Ecosystem — Master Launch Plan
**Authored by**: Thomas S. Butler + Claude (Cowork session, March 24, 2026)  
**Governs**: All sessions from this point through coordinated Wave 1 launch  
**Principle**: Ship it simple. Nothing ships alone. Everything ships together.

---

## The Core Axiom

We are operating at Claude speed, not human speed. Each "sprint week" in legacy planning = one focused session. Wave 1 launch is 7–8 sessions away. That is 3–4 weeks at current pace, not 8–10.

**Feature creep is the only real threat.** The anti-feature list is law.

---

## The Five Components and Their Minimum Viable State

### 1. Firesite SSO
**Must have at launch:**
- Firebase Auth (Google + email/password)
- JWT custom claims + bearer token issuance
- Stripe free/paid tier gate (free tier auto-provision, paid tier Stripe webhook)
- Tenant identity linked to bearer token

**Must NOT ship in Wave 1:**
- OAuth social logins beyond Google
- Admin dashboard UI
- Teams / org accounts
- User-facing billing portal

**Current state:** 202/202 backend tests passing. Needs release packaging only.

---

### 2. Firesite MCP Max
**Must have at launch:**
- SSE streaming via Cloud Run direct (stream.firesite.ai — NOT through Firebase Hosting CDN)
- Tenant config loaded from bearer token
- MMCO / UACP / PACP context passing to Claude
- Free tier rate limits enforced
- Model: claude-sonnet-4-6 + claude-haiku-4-5 (current SDK)

**Must NOT ship in Wave 1:**
- MCP Bridge tool execution (this is Sprint 7 / post-launch)
- Analytics dashboard
- Multi-model routing UI
- Docker orchestration

**Architecture note:** max.firesite.ai (Firebase Hosting) handles health/status/tenant config. stream.firesite.ai (Cloud Run direct) handles all SSE streaming. This dual-URL pattern must be in embed script config from Session 1.

---

### 3. Firesite Chat Service
**Must have at launch:**
- SSE streaming fixed (stream.on("text") pattern — revert for-await regression)
- Anthropic SDK updated to ^0.72.1+
- All model refs updated to claude-sonnet-4-6 / claude-haiku-4-5
- Embed script (embed.js) with shadow DOM isolation
- Dual-mode init: self-hosted (user API key → direct Anthropic) vs MCP Max (bearer token → stream.firesite.ai)
- CSS scoping: widget styles don't leak into host page
- Code clean: debug logs stripped, ESLint passing, dead code removed
- GitHub public + NPM package published (@firesite/chat-service)
- Apache 2.0 license

**Must NOT ship in Wave 1:**
- Visual Configurator (this is Wave 1.5 — Session 4/5)
- MCP tool execution / MCP Bridge
- Template marketplace
- Analytics / conversation history UI

**Note on Visual Configurator:** It IS part of Wave 1 (Sessions 4–5) but it is NOT a blocker for the embed script or WP plugin. The configurator ships as firesite.io/configure. If it slips, the embed still launches.

---

### 4. Firesite CLI
**Must have at launch:**
- `firesite init` — scaffold project with firesite.config.json
- `firesite start` — launch all services with auto-port assignment (MCP Basic: 3001, MCP Max proxy: 3002, Chat Service: 5173)
- `firesite deploy` — deploy to Firebase Hosting with correct URL config for production
- NPM package: `npm install -g firesite`

**Must NOT ship in Wave 1:**
- Interactive wizard UI (beyond what already exists)
- Plugin marketplace CLI
- Docker orchestration commands

---

### 5. HALO Protocol
**Must have at launch:**
- Published spec document (markdown, linked from all repos)
- Reference implementation in MCP Max (MMCO, UACP, PACP, CRAG, TDO endpoints)
- White paper: "The Open Context Protocol" (Cowork authors this — one dedicated session)
- GitHub repo: halo-protocol (Apache 2.0)

**Must NOT ship in Wave 1:**
- SDK packages for other platforms
- Governance / RFC process
- Blockchain attribution (documented as roadmap, not implemented)

---

## Standards That Apply to Every Component

### GitHub repos
Every public repo ships with:
- `README.md` — what it is, quick start, architecture diagram link
- `LICENSE` — Apache 2.0
- `CONTRIBUTING.md` — one page, practical
- `CHANGELOG.md` — version history from launch
- `.env.example` — all required environment variables documented

### CI/CD (GitHub Actions)
Every repo gets:
- `lint-and-test.yml` — runs on every PR and push to main
- `deploy.yml` — main branch merge → auto-deploy to prod (Firebase / Cloud Run)
- No manual deployment steps after Session 1 infrastructure is set up

### Environments
Every service has three:
- `localhost` dev — env-based URL config, mock where needed
- `staging` — same Firebase project, separate Firestore collection prefix
- `prod` — live at firesite.ai / max.firesite.ai / stream.firesite.ai / chat.firesite.ai

### API Documentation
- MCP Max: Swagger / OpenAPI spec at max.firesite.ai/api-docs
- All public service functions: JSDoc with @param, @returns, @example

### Developer Documentation (ships at launch)
- Quick start guide (embed in 5 minutes)
- Self-hosted guide (bring your own API key)
- HALO spec and context objects guide (MMCO/UACP/PACP)
- MCP Max tenant configuration guide

### Support Channel
- GitHub Discussions on each repo (free, indexed, permanent)
- Slack workspace for early adopters (invite-only at launch)
- No Zendesk, Intercom, or paid support tooling in Wave 1

---

## Session Execution Map

| Session | Deliverable | Tool | Definition of Done |
|---------|-------------|------|--------------------|
| **1** | SSE fix + SDK update + code cleanup | Cursor | stream.on("text") restored, SDK ^0.72.1, all model refs updated, ESLint clean |
| **2** | Embed script + CDN deploy | Cursor + CLI | embed.js on chat.firesite.ai, shadow DOM isolated, streams on external domain |
| **3** | MCP Max free tier + tenant onboarding | Cursor + CLI | New user signs up → bearer token → embed config → context-aware chat |
| **4–5** | Visual Configurator (Flutter) | Thoms + Cursor | firesite.io/configure live, layout picker + color/font + live preview + embed export |
| **6** | WordPress plugin + framework wrappers | Cursor | WP plugin installs from zip, streams, configurable from WP admin |
| **7** | Coordinated release | CLI + Cowork | ALL items in Master Definition of Done checked |

---

## Master Definition of Done

**Launch is achieved when ALL of the following are simultaneously true:**

- [ ] `embed.js` loads on an external domain and streams tokens via `stream.firesite.ai` (verified in Chrome DevTools EventStream tab — not buffered)
- [ ] New user signs up for Firesite → receives bearer token → pastes into widget config → context persists across sessions (no "50 First Dates")
- [ ] WordPress plugin installs from a zip file on a fresh WordPress install, renders the chat widget, SSE streaming confirmed
- [ ] GitHub repos are public: firesite-chat-service, firesite-mcp-max, firesite-mcp-basic, halo-protocol
- [ ] NPM packages published: @firesite/chat-service, @firesite/chat-react, @firesite/chat-vue
- [ ] pub.dev package published: firesite_chat
- [ ] White paper "The Open Context Protocol" is live (linked from all repos)
- [ ] Substack post (TPTTN) is published
- [ ] firesite.io/configure is live with at least 2 layout templates and 4 theme presets

---

## The Anti-Feature List (Wave 1 scope cuts — no exceptions)

The following will not ship in Wave 1 regardless of how good an idea they seem in the moment:

- MCP Bridge tool execution (Sprint 7)
- Template / component marketplace
- Admin dashboard UI
- Teams / org accounts
- Blockchain attribution
- Multi-model routing UI
- Docker orchestration
- Analytics dashboard
- Interactive CLI wizard
- OAuth social logins beyond Google
- Governance / RFC process for HALO
- SDK packages for HALO on non-Firesite platforms

**The rule:** if it's not in the "must have" list above, it goes on the roadmap, not in the sprint.

---

## The Two-Layer Product Model (Internalize This)

**Layer 1 — Visual (Chat Service + Configurator):** Layout templates, color themes, fonts, spacing. This is what the free/OSS user configures. It defines how the chat *looks*. Available to everyone.

**Layer 2 — Intelligence (MCP Max):** System prompts, tenant config, context persistence, MCP tools, skills, session management. This is what the paid subscriber configures. It defines how the chat *thinks*.

The Visual Configurator handles Layer 1. MCP Max handles Layer 2.  
The upgrade path between them is the business model.  
The free user gets a beautiful widget. The paid user gets a beautiful widget that remembers who they are.

---

## The Delivery Sequence for Wave 2 (60–90 Days Post-Launch)

Once Wave 1 is live:

1. Firesite Chat Service for WordPress (plugin marketplace, full submission)
2. Firesite Chat Service for Flutter (pub.dev package, full submission)
3. Firesite.io Configurator for WordPress / Flutter / "any flavor"
4. Firesite.io + Firesite.ai Marketplace (user-uploaded free and paid templates and tools, 30% rev share)

These are not features. They are expansion vectors that the Wave 1 architecture already supports.

---

## The Market Strategy (Say This Out Loud)

We release without apology and without seeking validation. No beta waitlist. No "coming soon." No hype campaign. We ship.

The real market — normal people who want AI that works without a PhD — has not been tapped. AI power users (OpenAI devotees, Claude CLI hackers) are validators, not the primary audience. They will notice. They will spread it. But they are not who we are building for.

We commoditize the AI chat widget category. We become the infrastructure layer that everyone builds on. We do it by being first, being simple, being open, and being genuinely better at every level that matters.

The Trojan Horse doesn't announce itself. It just works better than everything else in the room.

---

*Infrastructure for Human Potential. This is Firesite.*  
*Document authored: Thomas S. Butler + Claude, March 24, 2026*
