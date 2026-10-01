# CHAT SERVICE — UNIFICATION & PRODUCTION ROADMAP

## From four bifurcated chats to one FSOS conduit, then the Trojan Horse

## Prepared by: Claude Fable 5 (claude.ai) + Thoms — June 10, 2026

## Status: STRATEGIC PLAN — ratify, then execute via session docs

## Supersedes: sprint ordering in VISION_AND_STRATEGY.md §8 (strategy

## in that doc remains canonical; this reorders execution around the

## bifurcation reality discovered June 10)

---

## THE PROBLEM, NAMED PRECISELY

The chat service has bifurcated into FOUR implementations:

1. firesite-chat-service (upstream) — 184+ tests, the Buffer-Parse- Replay core
   — but FROZEN since migration. Last commits are migration-era. Fixes stopped
   landing here.
2. firesite.ai copy-in — all FIVE copied streaming files have DRIFTED from
   upstream (verified by diff, June 10). The May 2026 race-fix and 26 sessions
   of polish live here, not upstream.
3. iamthoms-chat.js — an independent implementation with its own v2-migration
   history.
4. ARC claude_session.dart — voice + text connectivity with no session
   continuity and no TDO integration. Demonstrates novelty, not value.
5. Firesite MCP Max chat service in Flutter aslo was bifurcated but added here
   post Claude Fabel review.

The canonical source is the stale one. That is the worst drift mode: every
consumer is now its own fork, every fix lands once instead of everywhere, and
the thing that should be the FSOS conduit is four disconnected wires.

## THE STRATEGIC REFRAME

Unification does NOT mean one codebase — ARC is Dart and can never import the JS
core. Unification happens at the CONTRACT level:

THE CHAT CONTRACT v1 (owned by MCP Max)

- SSE event schema: text | tdo_update | trigger | error | done
- Context envelope: PACP + MMCO + UACP + TDO snapshots on request
- Session continuity: server-side history + resume by sessionId
- TDO comment protocol: <!-- TDO --> emission + guardrails

Then exactly TWO client implementations of that contract:

- @firesite/chat-core (JS) — the Buffer-Parse-Replay pipeline + contract client,
  extracted as a versioned package. Consumed by firesite.ai, iamthoms,
  chat.firesite.ai embed, the WP plugin.
- ArcChatClient (Dart) — the same contract in Flutter. Voice (Flux STT) and text
  feed ONE session. TDO comments parsed into ARC's TDO event stream.

One contract. Two clients. Every surface, same Claude, same memory. That is
"Anthropic SDK as the seamless conduit to a unified FSOS" — made concrete.

NOTE on the Cowork audit (May 17): it recommended copy-in and "wait for 1.0 to
extract." Correct then, wrong now — the wait assumed one consumer. With four
consumers and live drift, extraction is no longer premature optimization; it is
the bleeding tourniquet.

---

## TWO TRACKS

TRACK 1 — UNIFY (internal, immediate compounding impact) The FSOS conduit.
Phases 0–4. This track unblocks ARC chat value, iamthoms parity, and firesite.ai
maintenance simultaneously.

TRACK 2 — TROJAN HORSE (public, the coordinated release) Configurator, WP
plugin, embed CDN, marketplace, white paper. Phases 5–6. Strategy per
VISION_AND_STRATEGY.md, unchanged. Track 2 builds ON Track 1's extracted package
— sequencing them backwards rebuilds the fork problem in public.

---

## THE PHASES

### Phase 0 — HARVEST & TRUTH (Cowork, 1 session) ← inverted on purpose

Because upstream is stale, reconciliation precedes everything:

- Diff all five firesite.ai streaming files against upstream. Classify every
  divergence: fix-to-harvest / firesite.ai-specific / noise. (Known: the May
  race-condition mutex; expect more from 26 sessions.)
- Audit iamthoms-chat.js: which capabilities does it have that the core lacks
  (and vice versa)? Decommission list for Phase 3.
- Inventory ARC claude_session.dart: current request shape, what a contract-v1
  Dart client must preserve (Flux wiring, orb states).
- Canonicalize docs/: the folder holds geological strata (the secret-sauce
  context doc describes full-buffer-then-replay; the shipped pipeline parses
  progressively). Output a single ARCHITECTURE-CANONICAL.md; mark the rest
  historical. A new Claude must be able to tell truth from history in one read.
  Deliverable: HARVEST-REPORT.md + the classified diff. No code changes.

### Phase 1 — THE CHAT CONTRACT v1 (Strategic Command + Cowork, 1 session)

Write the contract spec as a versioned document in firesite-mcp-max: event
schema, context envelope, session continuity API (create / resume / history —
the "50 First Dates" fix lives SERVER-SIDE in MCP Max, where it belongs), TDO
comment protocol + guardrails (reuse RUBRIC-DOOR-CONFIDENCE-V1 G1–G3 semantics
generalized beyond onboarding), auth (SSO JWT), degraded mode (direct-API
fallback per the OSS strategy). Freeze v1. Additive changes only after freeze.
This document IS the FSOS conduit definition. Everything else implements it.

### Phase 2 — UPSTREAM HARDENING + EXTRACTION (Claude Code CLI, 2 sessions)

Session A — make upstream true again:

- Land the harvested fixes from Phase 0 into firesite-chat-service.
- Fix the broken module-load singleton (breakthrough-streaming line ~333) —
  export the class, kill the dead instance.
- Isolate MCP coupling: move the five MCP methods out of
  firesite-streaming.service.js into a thin adapter so the embed "surgery" the
  Cowork audit prescribed is never needed again.
- ESLint pass, dead code + debug logs removed (the §8 cleanup item). Session B —
  extract:
- npm workspace: @firesite/chat-core (streaming pipeline + DOMPurify
  - contract client) and keep the app shell as its first consumer.
- The 184+ tests move WITH the package. Coverage gate stays ≥95%.
- Tag v1.0.0 = contract v1 + frozen public API. The Buffer-Parse- Replay
  internals stay sacred; perfection here means a settled API and harvested
  fixes, NOT a rewrite. Simplification only where the Phase 0 diff proves dead
  paths (streaming-markdown.service.js is already excluded from the breakthrough
  chain — candidate for archive, decide on Phase 0 evidence).

### Phase 3 — REBASE THE WEB CONSUMERS (CLI + Cursor, 2 sessions)

- firesite.ai: replace the five drifted copies with @firesite/chat-core. Delete
  NOTES.md surgery notes — obsolete by design. Verify the orb, onboarding TDO
  flow, and audio sync against the package (the SSE pipeline constraint holds:
  consume, never rewrite).
- iamthoms: swap iamthoms-chat.js internals for the package + contract sessions.
  Customer Zero gains continuity for free.
- chat.firesite.ai/embed.js: production CDN deploy FROM the package build —
  Track 2's distribution artifact, produced by Track 1.

### Phase 4 — ARC JOINS THE CONDUIT (CLI, 1–2 sessions) ← the payoff

ArcChatClient (Dart) implementing contract v1:

- Session continuity: resume-by-default per project context. "Open Claude
  Session — Discuss/Adjust/Extend" resumes the SAME session; the Session Intent
  buttons become contract metadata.
- Voice and text converge: Flux STT output enters the same session as typed
  text. One conversation, two input modes. The decoupling dies here.
- TDO integration: tdo_update events from the contract parse into ARC's TDO
  event stream — chat can create sprints, log check-ins, and reference the
  morning brief. This is where ARC chat stops being novelty and starts being the
  daily-loop's hands.
- Coordinates with ARC-DAILY-LOOP-V1-PLAN Phase 2/3 (sprint + recalibration
  models must exist for chat to act on them).

### Phase 5 — MCP BRIDGE: TOOLS FOR REAL (CLI, 1 session)

Close the §8 blocker: tool execution, not simulation, through MCP Max. Required
for both the unified conduit (chat that DOES things) and the Track 2 quality gap
between free and Max tiers.

### Phase 6 — TROJAN HORSE ASSEMBLY (mixed, sequenced after 2–3)

Visual configurator (the Firesite.io expression layer — Cursor-heavy,
design-system work), WP plugin wrapper around the embed, 10 seed templates,
white paper, TPTTN post. DECISION GATE for Thoms before this phase: coordinated
big-bang release per VISION_AND_STRATEGY §7, or a quiet OSS soft-landing of the
package once Phase 2 tags v1.0 (community hardening while the configurator
catches up). Both defensible; choose deliberately, not by inheritance. This
roadmap takes no side — it makes either possible by putting the package first.

---

## DEPENDENCY MAP

Phase 0 (harvest) → Phase 1 (contract) → Phase 2 (harden+extract) → Phase 3 (web
rebase) ┐ → Phase 4 (ARC client) ┤→ Phase 5 (MCP bridge) → Phase 6 (release)
Phase 4 also depends on: ARC-DAILY-LOOP Phases 1–3 (models to act on) Phase 1
reuses: RUBRIC-DOOR-CONFIDENCE-V1 guardrail semantics Phase 6 gate: Thoms's
release-shape decision (big-bang vs soft-land)

## WHO DOES WHAT

- Cowork (Opus): Phase 0 harvest audit, Phase 1 contract co-author.
- Strategic Command (claude.ai): contract spec, session docs, gates, validation
  of every completion report.
- Claude Code CLI: Phases 2, 3 (firesite.ai + iamthoms), 4, 5.
- Cursor: Phase 3 visual parity passes, Phase 6 configurator UI.

## SUCCESS DEFINITION

Track 1 succeeds when ONE conversation, started by voice in ARC, is continued by
text on firesite.ai, references a TDO created in the morning brief, and survives
an app restart — with every consumer on the same package or the same contract,
and zero drifted files (the drift-check script returns clean). Track 2 succeeds
per VISION_AND_STRATEGY §7 — but only after Track 1, never instead of it.

## EXECUTION QUEUE EMITTED BY THIS PLAN

SESSION-COWORK-CHAT-HARVEST (Phase 0) → CHAT-CONTRACT-V1.md (Phase 1) →
CLAUDECODE-SESSION-UPSTREAM-HARDEN (2A) → CLAUDECODE-SESSION-EXTRACT (2B) →
rebase sessions per consumer (3) → CLAUDECODE-SESSION-ARC-CHAT- CLIENT (4) →
CLAUDECODE-SESSION-MCP-BRIDGE (5) → Track 2 docs after gate.

_One contract. Two clients. Every surface, same Claude, same memory._ _This is
not just software. This is Infrastructure for Human Potential._
