# Firesite — Master Battle Plan
**Authored by**: Thomas S. Butler + Claude Desktop (March 24, 2026)  
**Scope**: All projects, all tools, all decisions through Wave 2 launch  
**This document governs**: Project sequencing · DevOps standards · AI tool assignment · Business model · LMS integration · Developer doc standards

---

## Part 1: Project Registry and Order of Operations

### Wave 1 — Coordinated Launch (7–8 sessions)

| Session | Project | Blocker Before | Validation Criteria | Primary Tool |
|---------|---------|----------------|---------------------|--------------|
| 1 | Chat Service: SSE fix + SDK update + cleanup | Nothing — start now | DevTools EventStream shows token-by-token SSE from stream.firesite.ai | Cursor |
| 2 | Embed script + CDN deploy | Session 1 | script tag on external domain streams tokens | Cursor + CLI |
| 3 | MCP Max free tier + tenant onboarding | Session 2 + SSO packaging | New user → token → embed → context persists across sessions | Cursor + CLI |
| 4–5 | Visual Configurator (Flutter) | Session 2 | User exports working embed code from firesite.io/configure | Thoms + Cursor |
| 6 | WordPress plugin + React/Vue/Flutter wrappers | Sessions 1–2 | Fresh WP install + zip → streaming chat works | Cursor |
| 7 | Coordinated launch | All sessions | Master Definition of Done checklist 100% | Thoms + Cowork + CLI |

### Wave 2 — 60–90 Days Post-Launch

- HALO Protocol spec + white paper ("The Open Context Protocol") — Cowork authors
- WordPress plugin marketplace full submission — Thoms + Claude in Chrome
- Flutter pub.dev package full submission — CLI
- Firesite.io Configurator for WordPress/Flutter/"any flavor" — Thoms + Cursor
- Firesite.io + Firesite.ai Marketplace (free + paid templates, 30% rev share) — Thoms + Cursor

---

## Part 2: DevOps Infrastructure

### GitHub Organization: firesiteio

Every repo follows this structure without exception:
```
/src                    — source code
/docs                   — VISION.md · ARCHITECTURE.md · API.md
/tests                  — unit · integration · e2e
/.github/workflows      — lint-test.yml · deploy-staging.yml · deploy-prod.yml
README.md               — one-sentence description + quick start (3 commands max)
LICENSE                 — Apache 2.0 (all public repos)
CONTRIBUTING.md         — one page, practical
CHANGELOG.md            — version history from launch
.env.example            — all required env vars documented
```

### Repos to Create Before Session 1

| Repo | Visibility | License | Branches |
|------|-----------|---------|---------|
| firesiteio/firesite-chat-service | Public at launch | Apache 2.0 | main · dev · test |
| firesiteio/firesite-mcp-max | Private until launch | Apache 2.0 | main · dev · test |
| firesiteio/firesite-mcp-basic | Public now | Apache 2.0 | main · dev |
| firesiteio/halo-protocol | Public now | Apache 2.0 | main |
| firesiteio/firesite-cli | Public now | MIT | main · dev |
| firesiteio/firesite-sso | Private | Apache 2.0 | main · dev · test |

### Firebase Projects

| Project | Purpose | Firestore Collections |
|---------|---------|----------------------|
| firesite-dev | Local dev + staging | dev/ prefix |
| firesite-prod | Live production | prod/ prefix |

### Domain Map (Cloudflare DNS)

| Domain | Routing | CDN Caching |
|--------|---------|-------------|
| firesite.io | Firebase Hosting | Yes |
| firesite.ai | Firebase Hosting | Yes |
| max.firesite.ai | Firebase Hosting | Yes (health/config endpoints only) |
| stream.firesite.ai | Cloud Run DIRECT | NO — Cache-Control: no-store on /api/chat/stream |
| chat.firesite.ai | Firebase Hosting | Yes (embed.js is a static asset) |

**Critical:** stream.firesite.ai must bypass CDN for SSE. This is the Firebase CDN lesson from GoRout. Set at Cloudflare level: Cache-Control: no-store header on /api/chat/stream route.

### GitHub Actions — Standard Workflow (per repo)

**lint-test.yml** — triggers on every PR and push to dev
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

**deploy-staging.yml** — triggers on push to dev
- Deploys to firesite-dev Firebase project
- Uses FIREBASE_TOKEN secret

**deploy-prod.yml** — triggers on push to main
- Requires passing lint-test
- Deploys to firesite-prod Firebase project
- Notifies Slack #deployments channel (future)

### Secrets Required (GitHub repo secrets)
- `FIREBASE_TOKEN` — for CLI deploys
- `ANTHROPIC_API_KEY` — for test suites that call Claude
- `STRIPE_SECRET_KEY` — for billing tests
- `FIREBASE_PROJECT_ID_PROD` and `_DEV`

---

## Part 3: AI Tool Assignment

The single most important thing to get right. Wrong tool = context loss = wasted session time.

### Decision Matrix

| Task Type | Tool | Why |
|-----------|------|-----|
| Strategy, architecture, cross-project diagnosis | Claude Desktop (you, here) | MCP tools, memory, full ecosystem context |
| White paper writing, deep docs, business narrative | Cowork (Opus 4.6) | Deep reasoning, long-form, no file access needed |
| Feature implementation, file creation, bug fixes | Cursor (Sonnet 4.6) | IDE context, file access, best for code |
| Testing, deployment, CI/CD, cross-project coordination | Claude Code CLI | Terminal access, automation, build scripts |
| Browser research, marketplace submissions | Claude in Chrome | Web access, form filling |
| Audio content (podcast, Substack audio) | ElevenLabs | After written content finalized |
| Brand assets, marketplace templates | Adobe CC | After Wave 1 ships |
| Competitive/market research | Grok / xAI | Real-time web data |

### The Handoff Protocol

Every task has a clear handoff point:
1. **Cowork / Claude Desktop** defines what needs to be built and writes the HANDOFF.md
2. **Cursor** implements it with full IDE context
3. **Claude Code CLI** tests and deploys it
4. **Cowork / Claude Desktop** validates and updates HANDOFF.md for next session

Never skip steps. Never have Cursor make architecture decisions. Never have Cowork write files directly to a project.

---

## Part 4: Business Model

### Revenue Tiers

| Tier | Price | What They Get |
|------|-------|---------------|
| Free | $0 | Bearer token · rate limited · no context persistence · "50 First Dates" |
| Pro | $14.95/mo | Persistent context · MMCO/UACP/PACP · session history · 3 widgets |
| Studio | $49/mo | Multi-widget · custom prompts · 5 tenant configs · analytics |
| Enterprise | Custom | White-label · dedicated Cloud Run · SLA · custom models |
| Marketplace | Rev share | 30% on paid templates/tools sold |

### Cost Structure

| Item | Cost | Notes |
|------|------|-------|
| Firebase Hosting | Free | Up to 10GB transfer/mo |
| Cloud Run (SSE) | ~$0.40/M requests | Scales to zero |
| Firestore | Free | Up to 50K reads/day |
| Anthropic API | Passed through | Self-hosted users pay directly; Pro+ includes margin |
| Stripe | 2.9% + $0.30/tx | No monthly fee |
| Domain/DNS | ~$20/yr | Per domain, Cloudflare |
| GitHub | Free | Public repos + Actions free tier |

**Estimated monthly infra cost:**
- 0–100 users: ~$50/mo
- 100–500 users: ~$200/mo
- 500–1,000 users: ~$500/mo

### Break-Even Math

- Fixed monthly costs: ~$50 at launch
- Break-even: 4 Pro users ($59.80/mo)
- Ramen profitable: ~50 Pro users ($747/mo)
- GoRout CTO replacement: ~350 Pro users (~$5,200/mo)

### Investor Strategy: Bootstrapped Until Traction

GoRout CTO income funds development. Firebase free tier covers launch. The goal is traction before any investor conversation — 100+ paying users and GoRout as a reference customer. If investment is ever considered, Series A only with leverage. Never dilute for runway already covered.

**Trigger for investor conversation:** $10K MRR sustained for 3 months. Before that, the answer is no.

### Growth Triggers — Infrastructure Upgrade Points

| User Count | Action |
|-----------|--------|
| 100 | Upgrade to Firebase Blaze pay-as-you-go |
| 500 | Dedicated Cloud Run service · CDN optimization |
| 1,000 | Separate Firebase project per tier |
| 5,000 | Infrastructure architect conversation |

---

## Part 5: Developer Documentation Standard

Every service ships with these docs at launch:

1. **Quick start** — embed in 5 minutes, self-hosted in 10
2. **Architecture overview** — diagram + narrative
3. **API reference** — Swagger/OpenAPI for REST endpoints, JSDoc for all public functions
4. **Context objects guide** — MMCO/UACP/PACP schemas with examples
5. **HALO spec reference** — link to halo-protocol repo
6. **Self-hosted guide** — BYOK (bring your own API key) setup
7. **Troubleshooting** — top 5 issues + solutions

### Help Resources at Launch

- **GitHub Discussions** on each repo — free, indexed, permanent record
- **Slack workspace** — invite-only for early adopters (Wave 1 launch)
- **README** on each repo links to all docs
- **No Zendesk, Intercom, or paid support tooling** in Wave 1

---

## Part 6: LMS Integration — Customer Zero

The Firesite LMS is the system Thoms uses to run his own life and work. Every element of this battle plan feeds into it.

### Three Calendar Schema (Permanent)

- `tbutler@gorout.com` — GoRout: meetings, standups, sprint work. Takes precedence. Fixed.
- `tom@butlerconsulting.com` — Personal: Stacy (Fri night + Sun AM sacred), doctors, walks
- `tom@firesite.io` — Firesite: all build sessions, reminders, milestones, LMS anchors

### Daily Architecture (The Honest Version)

- 7:00 AM — Morning prayer (personal calendar)
- 9:00 AM — GoRout standup (GoRout calendar)
- 9:30 AM–12:00 PM — GoRout work (GoRout calendar)
- 12:00–4:00 PM — Firesite deep work (Firesite calendar, around GoRout meetings)
- 4:00–5:00 PM — Walk with Stacy (personal calendar, sacred)
- 5:00–8:00 PM — Firesite evening build (Firesite calendar, double-usage window)
- 9:30 PM — Evening prayer (personal calendar)

### LSTO Protocol (Session Start Standard)

Every Firesite build session begins:
1. Read HANDOFF.md for current project
2. Read relevant CONTEXT.md or ARCHITECTURE.md
3. Load LSTO task object into Claude Code CLI
4. Execute in correct tool (Cursor / CLI)
5. Write updated HANDOFF.md at session end

### The 10-Day GoRout Leave Strategy

Reserve GoRout leave for Sessions 5–7 — the Visual Configurator, WP plugin, and coordinated launch. This is when Thoms' creative direction is most needed and most time-sensitive. Do NOT burn leave on Sessions 1–4, which Cursor can execute independently.

**Trigger:** Sessions 1–4 complete → book 10 days → execute Sessions 5–7 → launch.

---

## Part 7: Universal Standards

### HANDOFF.md Template (Every Session)

```markdown
# Session Handoff — [Date] — [Project]

## What was completed
- [specific item with file paths]

## Exact state
- [file]: [what was done, what remains]

## What is next (ordered)
1. [task with exact specification]
2. [task]

## Decisions needed from Thoms
- [question requiring creative or strategic input]

## Which Claude picks this up
- [Cursor / CLI / Cowork] for [reason]

## Validation criteria
- Happy path: [exact user action] → [expected result]
- DevTools: [what to check]
- CLI: [test command]
```

### README Template

```markdown
# [Component Name]
[One sentence description]

## Quick start
[3 commands maximum]

## How it fits in the Firesite ecosystem
[2-3 sentences with link to VISION_AND_STRATEGY.md]

## Contributing
See CONTRIBUTING.md

## License
Apache 2.0
```

### Context Document Hierarchy

Every AI session reads these in order:
1. `VISION_AND_STRATEGY.md` — why everything exists (master context)
2. `BATTLE_PLAN.md` — this document (what ships in what order)
3. `MASTER_LAUNCH_PLAN.md` — session sequence and Definition of Done
4. `HANDOFF.md` — where we are right now in this project
5. `TODO.md` — task queue for the current component

Zero context rebuild. Every session starts fully loaded.

---

## Part 8: The North Star

We release without apology and without seeking validation.

No beta waitlist. No "coming soon." No hype. No seeking market validation from people who don't yet know they need this. We ship. We commoditize the AI chat widget category. We become infrastructure.

The real market — normal people who want AI that works, embedded in their existing tools — has not been tapped. AI power users are validators, not the primary audience. We build for the WordPress site owner who installs a plugin in 5 minutes and never reads a white paper.

The Trojan Horse enters quietly. The infrastructure compounds invisibly. The world catches up later.

**Infrastructure for Human Potential. This is Firesite.**

---

*Document authored: Thomas S. Butler + Claude, March 24, 2026*  
*Next review: After Session 3 completion*
