# Cowork Audit Memo — Embedding the Chat-Service Streaming Layer in firesite.ai

**For**: Thomas S. Butler
**From**: Claude (Cowork, Opus)
**Date**: May 17, 2026
**Scope**: Render-only embed of `firesite-chat-service` streaming pipeline into `firesite.ai/ConversationUI.js`

---

## 1. Minimum Viable File Set

Entry point: `BreakthroughStreamingService`. Pulling that thread yields the following closure:

| File | Role | Internal Imports |
|---|---|---|
| `streaming/breakthrough-streaming.service.js` | Public orchestrator (the API surface you'll call) | `./firesite-streaming.service.js`, `./universal-dom-renderer.service.js` |
| `streaming/firesite-streaming.service.js` | Inner orchestrator: parser → replay glue | `./universal-streaming-parser-service.js`, `./intelligent-progressive-replay.js`, **`../mcp/mcp-server-manager.service.js` ⚠️** |
| `streaming/universal-streaming-parser-service.js` | Pure text-to-instructions parser | _none_ |
| `streaming/intelligent-progressive-replay.js` | DOM streaming engine + natural-typing animation | _none_ (dynamically imports `highlight.js`) |
| `streaming/universal-dom-renderer.service.js` | Append-only renderer; used for `clear()`, flush, cursor | `../security/dom-purify.service.js`, `highlight.js` |
| `security/dom-purify.service.js` | DOMPurify wrapper | `dompurify`, `highlight.js` |

**Six application files total.** Plus two npm packages: `dompurify ^3.2.6`, `highlight.js ^11.9.0`.

**Explicitly excluded:**
- `streaming-markdown.service.js` — legacy/alternate path; depends on chat-service's `globalEvents` event bus (`../../core/events/event-emitter.js`) and `getConfig` from `core/config`. Not on the breakthrough chain. **Don't copy it.**
- All `*.test.js` files.
- The bottom-of-file singleton export `breakthroughStreamingService = new BreakthroughStreamingService()` — it's instantiated with no container and is effectively broken. **Import the class, not the singleton.**

---

## 2. Readiness Verdict — **Needs Work, but Surgical**

The pipeline is 95% ready for embed. Three concrete blockers, all small:

**Blocker 1 — MCP coupling in `firesite-streaming.service.js`.**
The file imports `mcpServerManager` and stores it as `this.mcpServerManager`. The MCP dep is **only** used in five methods that are irrelevant to rendering: `getStatus()` (one field), `switchMCPServer()`, `setAIMode()`, `setMMCOContext()`, `setUACPContext()`, `sendMessage()`. The streaming hot path — `start / processChunk / finish / pause / resume / clear` — never touches MCP. Surgery: remove the import, delete those five methods, drop the `mcpServer` field from `getStatus()`. About 40 lines deleted. No behavior change to the streaming path.

**Blocker 2 — npm deps missing from firesite.ai.**
`firesite.ai/package.json` does not currently include `dompurify` or `highlight.js`. Both must be added. Both are widely-used, well-maintained packages; no resolution conflict with the firesite.ai stack (Vite 5, ESM, Three 0.163). `highlight.js` is loaded via dynamic `import('highlight.js')` in `intelligent-progressive-replay.js`, so Vite will tree-shake it appropriately.

**Blocker 3 — Broken singleton at end of `breakthrough-streaming.service.js`.**
Line 333: `export const breakthroughStreamingService = new BreakthroughStreamingService();` runs at module load with `container = undefined`, then constructs `new FiresiteStreamingService(undefined, ...)`. It doesn't crash but creates a broken object. Don't import that named export. Use the class. (Worth flagging upstream too — this is a latent bug in chat-service itself.)

**Compatibility verified:**
- Both projects: `"type": "module"`, Vite ^5, ESM ✓
- No DOM features beyond `document.createElement` / `appendChild` / `innerHTML` / `textContent` ✓
- No `window.*` hard requirement (one optional `window.dispatchEvent('streamingStatus', …)` for telemetry, gated on `typeof window !== 'undefined'`) ✓
- No `localStorage`, no service workers, no globals beyond `document` ✓

---

## 3. Recommended Embed Strategy — **Copy-In**

Copy the 6 files into `firesite.ai/src/js/services/streaming/` (preserve the `streaming/` and `security/` folder split so internal imports work unchanged). Add `dompurify` and `highlight.js` to firesite.ai's `dependencies`. Apply the MCP surgery in your copy of `firesite-streaming.service.js`.

**Why copy-in over the alternatives:**

- **`npm link` / `file:`-path**: Forces both projects to live on the same machine with consistent install state. Firebase Hosting build pipelines hate `file:`-path deps — they require the linked path to exist at build time on CI runners. Tight coupling, hard to deploy. Rejected.
- **CDN bundle (`vite build --lib`)**: Solves decoupling but doesn't solve the MCP surgery — you'd still need a "clean" upstream version of `firesite-streaming.service.js` without the MCP dep, which means upstream work in chat-service before you can ship. It also adds a runtime fetch hop and a separate versioned artifact to maintain. Not worth it until the streaming layer stabilizes.
- **Extract to a shared package** (`@firesite/streaming-markdown` in the workspace): The right long-term answer, not the right today answer. Wait until the chat-service has shipped 1.0 and the streaming API is frozen.
- **Copy-in**: Today. ~1,200 LOC. Localized diff (the MCP strip). No build pipeline changes. Both projects keep moving independently.

**Drift mitigation** (do these the day you copy):

1. Header each copied file: `// Source: firesite-chat-service@<git-sha> src/services/streaming/<file>` so future-you can diff.
2. Add `firesite.ai/src/js/services/streaming/NOTES.md` listing the surgery applied (the MCP strip in `firesite-streaming.service.js`) and the rationale.
3. Optional but recommended: a 5-line script `scripts/check-streaming-drift.sh` that diffs each copied file against the upstream and warns. Run it in CI or pre-commit. Not blocking — just visibility.

---

## 4. Integration Point in `ConversationUI.js`

Today's pattern in `_streamResponse()` (lines 282–292) is accumulate-and-redraw:

```js
case 'text':
  assistantText += event.content;
  this._setMessageText(msgEl, assistantText);   // ← full re-render every token
  ...
```

And `_setMessageText(el, text)` (line 428) clears the element and rebuilds spans + `<br>` from scratch on every call. This is exactly the pattern the chat-service streaming layer eliminates.

**New shape** of `_streamResponse()`:

```js
// before the for-await loop
const streamer = new BreakthroughStreamingService(msgEl);
streamer.setMode('progressive');
streamer.start();

try {
  for await (const event of gen) {
    switch (event.type) {
      case 'text':
        assistantText += event.content;            // still needed for history + audio
        await streamer.processChunk(event.content); // append-only DOM, zero re-render
        if (assistantText.length === event.content.length) orbState('responding');
        this._scrollToBottom();
        break;
      // tdo_update, trigger, error, done — unchanged, with one tweak below
    }
  }
} finally {
  await streamer.finish();
}
```

**Keep `_setMessageText` as-is** for the three remaining call sites: the error/dropped-connection paths (lines 308, 331, 353) and the static `_appendMessage(role, content)` user-side bubbles (line 414). Those write a literal string into a fresh element — no streaming needed. Don't try to make `_setMessageText` itself "smart"; the streaming pipeline owns the assistant element for its lifetime, the static method owns everything else.

**One catch on the 'done' event** (lines 312–326): `await this._audioService.speak(assistantText)` runs after the stream completes. Add `await streamer.finish()` **before** the audio playback so the final DOM state is settled when the speech plays. (Or move the streamer cleanup into the `finally` as shown above — cleaner.)

**CSS gap to plan for:** The new pipeline produces `<p>`, `<h1>–<h6>`, `<ul>`, `<ol>`, `<li>`, `<blockquote>`, `<pre><code>`, `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<hr>`, plus inline `<strong>`, `<em>`, `<a>`, `<code>`, `<del>`. Today's `_setMessageText` only produced `<span>` + `<br>`. You'll want CSS for `.fs-msg--claude > *` covering at least: paragraph spacing, list bullets/numbers, `<code>` background, `<pre>` block styling, `<blockquote>` left rule, and `<table>` borders. The chat-service has stylesheets for these — worth a glance for visual parity. Not a code blocker; a "the day you wire this up, things will look unstyled until the CSS lands" warning.

---

## 5. Top 3 Risks

**1. MCP-coupling drift over time.**
The MCP strip on `firesite-streaming.service.js` is the only meaningful local diff. Every time chat-service refactors that file, the diff will conflict. Likelihood: medium. Impact: low (the surgery is small and well-bounded). Mitigation: the NOTES.md + drift-check script in §3, and a standing agreement that the MCP-related methods stay isolated in that file (don't let MCP logic creep into `processChunk` upstream).

**2. Animation timing interacting with Three.js main-thread work.**
`intelligent-progressive-replay.js` uses sequential `await sleep(12–25ms)` between every typed character, on `setTimeout`. firesite.ai's main thread is already busy: Three.js render loop, orb amplitude analysis (`AudioService.getAmplitude()`), `TextToSpeech` playback. The orb is in `'responding'` state during streaming. When the GPU is hot, expect occasional stuttering on typing — typed chars may bunch up. This is a perceptible-quality risk, not a correctness risk. Mitigation: profile on a mid-range laptop after wiring. If it's a problem, the fix is to bump `baseDelay` lower (it's effectively bottle-necked by the frame loop anyway) or short-circuit the natural-typing for plain paragraphs and just write `textContent` directly. Don't optimize until you measure.

**3. `clear()` calls `container.innerHTML = ''` on the first chunk.**
The pipeline assumes the container is dedicated to this one stream. In ConversationUI today, each assistant message gets its own fresh `msgEl` from `_createMessageEl('assistant')`, so this is safe. **But:** if you ever introduce a retry path that re-uses an existing `msgEl` (replace failed response, regenerate-button, etc.), the wipeout will nuke prior DOM. Worth a code comment at the call site, and a defensive rule: "if you're recycling msgEl, instantiate a new streamer with a fresh sub-container, don't reuse." Low-likelihood today; flagged so it doesn't bite later.

---

## Bottom Line

Ship it. The pipeline is well-factored, the dependency surface is small, and the surgery is 40 lines in one file. Copy-in is the right strategy for the next 3–6 months — re-evaluate to an extracted shared package once the streaming API stabilizes after firesite-chat-service 1.0.

The hardest part of this integration won't be the JS — it'll be writing the CSS so `.fs-msg--claude` looks polished with rich markdown elements instead of plain spans. Budget time for that.
