# Firesite Chat Service — Vision, Strategy & Intent
**Document Type**: Authoritative Context for AI Collaborators (Cowork, Claude Code, etc.)  
**Author**: Thomas S. Butler, Founder/CEO, Firesite LLC  
**Last Updated**: March 2026  
**Status**: Canonical — do not override with assumptions

---

## Why This Document Exists

This document exists because AI collaborators (including Cowork) have been asking questions we have already fully answered in months of prior sessions. This is the consolidated, authoritative source for the *why* behind the Firesite Chat Service — its purpose, its open source strategy, its WordPress disruption role, its position in the Firesite ecosystem, and its relationship to MCP Max adoption.

If you are a Cowork session, Claude Code CLI session, or any AI collaborator touching this project: **read this first. Then build.**

---

## The One-Line Answer

> The Firesite Chat Service is the **Trojan Horse** — an open-source, embeddable AI chat widget that looks like "just another AI chat plugin" but is actually the first public expression of the Firesite ecosystem and the primary on-ramp to MCP Max adoption.

---

## 1. What the Chat Service Actually Is

The `firesite-chat-service` is a production-quality, open-source AI chat interface built on:

- **Vanilla JS / Vite** frontend (no React dependency — drop-in friendly)
- **SSE streaming** with a proprietary Buffer-Parse-Replay pattern ("the secret sauce")
- **MCP Max connectivity** — the service is architected to prefer MCP Max when available
- **MMCO / UACP / PACP** context object support for full Firesite context protocol compatibility
- **Firesite SSO** integration for authenticated sessions
- **Configurable templates** — the visual layer of the widget is the gateway to Firesite.io

The service lives at `chat.firesite.ai` in production and is designed to be embedded anywhere via a single script tag:

```html
<script src="https://chat.firesite.ai/embed.js"></script>
<div data-firesite-chat
     data-template="claude-style"
     data-theme="dark"
     data-model="claude-sonnet-4">
</div>
```

---

## 2. The Trojan Horse Strategy

### The Surface Story
"It's just another AI chat plugin."

WordPress site owners install plugins constantly. There are 60,000+ WordPress plugins. "AI chat widget" is a category they already understand and want. The friction to install is near zero.

### What Actually Happens
1. A WordPress site owner finds the Firesite Chat plugin in the WP plugin marketplace
2. They install it — 5 minutes, no technical knowledge required
3. They configure it visually using the **Firesite.io Configuration Engine** (see Section 4)
4. It works beautifully — better streaming, better rendering, better UX than anything else in the category
5. They're now **inside the Firesite ecosystem**

The Trojan Horse doesn't announce itself. It just works better than everything else in the room.

### The WordPress Plugin Is the Wedge
The WordPress plugin wrapper around the chat service is a deliberate strategic choice. WordPress powers ~43% of all websites. By meeting site owners where they already are — in the WP plugin marketplace — we bypass the "why would I switch platforms?" objection entirely. They don't switch. They add. And then they're ours.

---

## 3. The Open Source Strategy

### What Is Open Source
The core `firesite-chat-service` is released under the **MIT License**. This means:
- Anyone can use it, fork it, embed it
- Self-hosted with personal API keys (no Firesite account required for basic use)
- Provider-agnostic — easily modified for OpenAI, Gemini, or other providers
- Full source on GitHub at `github.com/firesiteio/firesite-chat-service`

This is intentional and strategic. We are not giving away the business. We are building the community and the distribution channel.

### What Is Commercial
- **MCP Max** — the orchestration layer. Free tier exists; enterprise tier is commercial SaaS.
- **Premium chat templates** — the marketplace (see Section 5)
- **White-label** — enterprise customers who want to remove Firesite branding
- **Firesite SSO + persistent context** — requires a Firesite account
- **Firesite.io** — the full CMS and configuration platform

### The Long-Term Vision
Once the community is well-established and revenue is on a growth trajectory, the plan is to **open source the entire Firesite platform** — including MCP Max. This is the WordPress playbook inverted: start commercial, build community, eventually go fully open. This ensures we build something worth open sourcing before we do it.

### Why Open Source the Chat Service First?
Because it is the widest top of funnel. A chat widget has zero switching cost. A developer trying it has nothing to lose. A WordPress site owner installing a free plugin has nothing to lose. But once they experience the quality — the streaming accuracy, the context awareness, the visual configurator — they want more. And "more" is the Firesite ecosystem.

---

## 4. The Firesite.io Configuration Engine

This is the piece that makes the chat service more than a widget.

The visual configurator — think "ADHD Disneyland of templates, style tokens, and configuration options" — is the **first public expression of what Firesite.io actually is**.

Firesite.io's core thesis is: **technology should adapt to humans, not humans to technology.** The configuration engine expresses this at small scale. You don't edit JSON to configure your chat widget. You:
- Pick a feeling (warm, professional, playful, clinical)
- Choose a layout
- Set colors that match your brand
- Preview in real-time
- Export as an embed code

The JSON is the output, not the interface. The human never sees it.

**When someone finishes configuring their chat widget and thinks "wait, I can configure my whole site this way?" — that is the Firesite.io conversion moment.**

The configurator isn't just a feature. It is the on-ramp to Firesite.io. The chat service is Firesite.io at 1% scope — same paradigm, same philosophy, same technology foundation — scoped to a single component anyone can understand in 30 seconds.

### The Template Marketplace
The configurator feeds a marketplace economy:
- Community members build templates (law firm, medical practice, e-commerce boutique, etc.)
- Templates are free or paid (Firesite takes 30% of paid)
- Buyers can fork and remix templates
- The ecosystem self-populates

This is the WordPress plugin/theme economy, rebuilt without WordPress's technical debt.

---

## 5. The Gateway Drug to MCP Max

This is the core commercial strategy embedded in the open source play.

### Without MCP Max (Free / Self-Hosted)
- Direct Anthropic API calls
- Basic SSE streaming
- No persistent context across sessions
- No MMCO/UACP/PACP context protocol
- No session management
- No tenant configuration
- Conversation resets on page reload ("50 First Dates" problem)

### With MCP Max (Firesite Account / Paid Tiers)
- Context-aware conversations that persist
- MMCO objects carry full project/task context
- UACP carries company/brand context
- PACP carries personal preferences
- Session management with UUID tracking
- Tenant-specific model configuration
- Analytics and usage monitoring
- Multi-model routing
- HALO sub-protocol support (PACP, CRAG, TDO, TDOM)

### The Upgrade Path Is the Product
The free tier of the chat service is genuinely useful. But the moment a user experiences context-aware conversation — where the AI remembers who they are, what their site is about, what tone they want — they will not go back. That experience is only available through MCP Max.

The chat service is the demo. MCP Max is the product. The demo is so good it converts.

---

## 6. The Kill-WordPress Play

### The Death-by-1000-Plugins Strategy
WordPress is killed by making its own distribution channel work against it.

- **Phase 1**: Chat plugin establishes Firesite in the WP ecosystem
- **Phase 2**: Design tokens (style system) are exported and adopted by WP theme developers
- **Phase 3**: Component playground components are exported to WP
- **Phase 4**: Developers realize every capability they're getting through WP plugins, Firesite.io delivers natively — faster, cheaper, with AI orchestration
- **Phase 5**: New site starts go to Firesite.io instead of WordPress

The chat service is Phase 1. We are not announcing "we're killing WordPress." We're just being better at everything WordPress adjacent, one touchpoint at a time.

### Why Firesite.io Wins Long-Term
- WordPress install: 4-6 hours, MySQL, PHP, security plugins, update anxiety
- Firesite.io install: < 5 minutes, Firebase-native, zero maintenance, Google Cloud scale
- WordPress content model: flat posts and pages in database rows
- Firesite.io content model: knowledge graph with semantic relationships, GraphQL API
- WordPress "AI": bolt-on plugins with no architectural coherence
- Firesite.io AI: MCP Max orchestration baked into the foundation

The comparison isn't close. But the strategy isn't "announce superiority." It's "infiltrate, demonstrate, convert."

---

## 7. The Coordinated Release Strategy

This is critical: **the chat service does not release alone.**

The full release is a coordinated drop across:

| Component | Role at Launch |
|-----------|----------------|
| `firesite-chat-service` (OSS) | Open source GitHub release + NPM package |
| WordPress plugin | WP plugin marketplace submission |
| Embed script (`chat.firesite.ai/embed.js`) | CDN-hosted public embed |
| Visual configurator | Live at `firesite.io/configure` |
| Template marketplace | Initial seed templates (minimum 10) |
| MCP Max free tier | Activated for all new signups |
| White paper | "The Open Context Protocol" — establishes thought leadership |
| Substack post (TPTTN) | "The Trojan Horse is Ready" or similar |

**Nothing ships alone. Everything ships together.** The reason is narrative coherence — each piece tells part of the story, and the story only makes sense when all the parts are present at once.

---

## 8. Current Technical State (March 2026)

### What Is Done
- SSE streaming core with Buffer-Parse-Replay pattern ✅
- 95%+ rendering accuracy (world-class) ✅
- Context system (MMCO/UACP/PACP) — implemented ✅
- MCP Max connectivity (dual-mode: Basic port 3001 / Max port 3002) ✅
- Settings panel with gear icon UI ✅
- Model selection (Claude 3.7 / 4) with localStorage persistence ✅
- Firesite SSO integration ✅
- 184+ tests, 95%+ coverage ✅
- Firebase Functions V2 compatibility ✅
- DOMPurify XSS protection ✅

### What Is Outstanding (Pre-Release Blockers)
- **MCP Bridge**: Chat Service cannot yet execute MCP tools — only simulate. This is a blocker for full MCP Max integration.
- **Visual Configurator**: The template/style playground is not yet built. This is the Firesite.io expression layer and the WordPress killer feature.
- **WordPress Plugin Wrapper**: The WP plugin scaffold needs to be built around the embed script.
- **Embed script CDN**: `chat.firesite.ai/embed.js` needs to be production-deployed.
- **Template Marketplace**: Initial seed templates needed (minimum 10 before launch).
- **Code cleanup**: Debug console.logs, dead code, ESLint compliance.
- **Manual testing pass**: Full context flow validation.

### Immediate Sprint Priority Order
1. MCP Bridge (tool execution, not simulation)
2. Visual Configurator (template/style playground)
3. Embed script production deploy
4. WordPress plugin wrapper
5. Seed templates (10 minimum)
6. Code cleanup + ESLint
7. Coordinated release prep

---

## 9. Architecture Relationship Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE FIRESITE ECOSYSTEM                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              FIRESITE.IO (CMS / Config Engine)            │ │
│  │         "Technology that adapts to humans"                │ │
│  │    Knowledge graph + GraphQL + AI-native architecture     │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │ expresses at 1% scope              │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │           FIRESITE CHAT SERVICE (OSS, MIT)                │ │
│  │         The Trojan Horse / The Gateway Drug               │ │
│  │    Embed anywhere · WP Plugin · Visual Configurator       │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │ connects to                        │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │                    MCP MAX                                 │ │
│  │              The Commercial Core                          │ │
│  │   Context persistence · HALO protocols · Multi-tenant    │ │
│  │   MMCO · UACP · PACP · CRAG · TDO · TDOM · LSTO         │ │
│  └────────────────────────┬──────────────────────────────────┘ │
│                           │ authenticated by                   │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │                  FIRESITE SSO                              │ │
│  │         Firebase Auth · JWT · Custom Claims               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Distribution Channels:                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  WP Plugin   │  │ GitHub OSS   │  │  chat.firesite.ai    │ │
│  │  Marketplace │  │  + NPM pkg   │  │  (CDN embed)         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. What Cowork (and All AI Collaborators) Should Know

1. **Do not ask what the chat service is for.** You now know. It is the Trojan Horse, the Gateway Drug, and the first expression of Firesite.io — all in one embeddable widget.

2. **Do not suggest rebuilding what exists.** The SSE streaming core (Buffer-Parse-Replay) is the "secret sauce." It is production quality and not to be refactored without explicit instruction.

3. **The visual configurator is not a nice-to-have.** It is the feature that makes this a Firesite product and not just another chat widget. It is required before coordinated release.

4. **The WordPress plugin is a wrapper, not a rebuild.** The embed script is the product. The WP plugin is just a packaging layer that puts the embed script into WordPress's distribution channel.

5. **MCP Max is the destination, not the dependency.** The chat service works without MCP Max (direct API mode). But MCP Max is where the real value lives, and the chat service is designed to make that obvious through the quality gap between modes.

6. **The release is coordinated.** Nothing ships alone. Ask before assuming any single component is ready to go independently.

7. **This is Infrastructure for Human Potential.** Every decision — open source, WordPress plugin, visual configurator, context protocols — traces back to this thesis: technology should adapt to humans, not humans to technology.

---

*Document maintained by Thomas S. Butler in partnership with Claude.*  
*For questions about strategic intent, refer to this document before asking.*  
*For implementation questions, refer to README.md, TODO.md, and the docs/ directory.*
