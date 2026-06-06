# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the method-led personal site to direction B (dark technical logbook, restraint-as-flex), v1, faithful to `DESIGN.md` and the spec, every viewport a designed tier.

**Architecture:** Next.js 16 App Router, Tailwind v4 tokens, server components by default. The keyless Falsafa librarian runs server-side behind `/api/query`; interactive pieces (graph, live terminal, BYOK, command palette, provenance) are client components. BYOK is hand-rolled OpenRouter streaming (dep-free) ported in spirit from Falsafa's island; the key rides only browser→openrouter, `/api/query` stays keyless.

**Tech Stack:** Next 16 / React 19 / TypeScript strict / Tailwind v4. No new deps unless approved (BYOK is dep-free).

**Spec:** `docs/superpowers/specs/2026-06-06-portfolio-site-design.md` (read it; it is the source of truth, with the Security section binding for BYOK).
**Design:** `DESIGN.md`. **Content source:** `content/methodology.md` (public-safe only).
**Falsafa reference (read-only, for POSTURE/behavior only):** `/Users/siraj/falsafa/apps/site/src/islands/byok/` — read `providers/openai.ts` (request shape + headers), `state.ts` (flow), `storage.ts` (key handling). Do NOT import `MarkdownView`/`defensive-linkify`/`marked`/Preact; reimplement dep-free per the spec Security "Rendering" rule.

**Autonomy notes:**
- Verify each task in the running Claude Preview (`preview_*`, serverId from `preview_list`) at desktop AND mobile before marking done.
- Route tests: there is NO test runner wired and we do not install one. The verification standard for `/api/*` is curl against the running dev server. For pure functions (`tfidf`, `openrouter` SSE parse, `safe-text`, `key-store`) write a `*.test.mjs` runnable with `node --test` (built into Node, no install).
- Confidentiality sweep before every push: grep the working tree (excluding node_modules) for known client names AND, if `~/Adnan/methodology/.offlimits-identifiers` exists, for those identifiers. If that external file is MISSING, the off-limits half is degraded — say so loudly in PROGRESS.md and fall back to the known-client grep; never report a clean off-limits pass you could not actually run.
- Concrete tier pass/fail (apply at each visual task, not just T11): no horizontal scroll at 320px; metrics are a 2-up grid below tablet and one row at lg+; the graph is interactive at lg+ and static+tappable below; the ledger label is a side rail at md+ and inline above content below md; prose `.measure` stays capped (no full-bleed text) at 2560.
- Commit + push per task. R10 (deploy) is OUT of autonomous scope — stop before it and report.

**Baseline already built (commits b28879e..abf9145):** scaffold, tokens/theme, `Section` ledger primitive, hero (downplayed line + amber metrics + hinge), how-i-build skeleton, interactive `force-graph.tsx`, keyless librarian (`lib/librarian.ts`, `lib/tfidf.ts`, `data/falsafa-corpus.json`), DESIGN/AGENTS/spec.

---

## Chunk 1: Live query (keyless) — R1, R2

### Task 1: `/api/query` keyless route

**Files:**
- Create: `src/app/api/query/route.ts`
- Verify: curl against the running dev server (route test standard).

- [ ] Step 1: Implement the POST handler: validate body (`query` must be a 1-200 char string, else 400), call `search(query, 3)` from `@/lib/librarian`, return `{hits}` as JSON. `k` fixed at 3 server-side. No secrets, no key handling. `export const runtime = "nodejs"` (corpus is in-memory JS).
- [ ] Step 2: Verify via curl against the dev server: `{"query":"the duty of a king"}` → 200 with non-empty `hits`, first hit has `text`/`workTitle`/`author`/`id`; `{"query":""}` → 400; a >200-char query → 400.
- [ ] Step 3: Confirm the 621 KB corpus is NOT in the client bundle (grep `.next` client chunks for a distinctive passage string; it should appear only in server output). It is only imported by the route.
- [ ] Step 4: Commit.

### Task 2: Live terminal UI

**Files:**
- Create: `src/components/live-query.tsx` (client)
- Modify: `src/app/page.tsx` (mount it in a new "falsafa" section near the bottom; full section content comes in Chunk 3, this adds the interactive terminal block)

- [ ] Step 1: Build `LiveQuery` client component: a labeled prompt (`run a query`), a text input, submit on Enter, debounce ~250ms, loading + empty states. On submit, `fetch('/api/query', {method:'POST', body: JSON.stringify({query})})`, render the returned hits as cited passages: passage text, then a mono citation line `— {author}, {workTitle} · {chapterTitle} [src:{id短}]`. Render passage text as TEXT (no `dangerouslySetInnerHTML`). Style per DESIGN.md (mono labels, surface card, hairline borders, amber accents on the citation).
- [ ] Step 2: Accessibility: input has a label, results are in an `aria-live="polite"` region, keyboard-operable.
- [ ] Step 3: Mount in page under a `<Section label="falsafa">` block with a one-line framing ("the librarian, not an LLM. real citations, no key.").
- [ ] Step 4: Verify in preview (desktop + mobile): type "freedom of thought" → Fichte passage with citation renders; empty state and loading state look right.
- [ ] Step 5: Commit.

---

## Chunk 2: BYOK reasoning (dep-free) — R3

> Faithful to Falsafa's behavior (read its island), but hand-rolled with `fetch` so no new dependency is needed. The OpenRouter request is browser→`https://openrouter.ai/api/v1/chat/completions` ONLY. Follow the spec Security section exactly.

### Task 3: OpenRouter streaming client (browser, dep-free)

**Files:**
- Create: `src/lib/openrouter.ts` (client-only; an async generator that streams text)
- Test: `src/lib/openrouter.test.ts` (inject a fake `fetch` returning a recorded SSE stream; assert it yields the concatenated text and never throws on `[DONE]`)

- [ ] Step 1: Failing test with a mocked SSE `ReadableStream` (chat.completions chunks + `[DONE]`).
- [ ] Step 2: Confirm fail.
- [ ] Step 3: Implement `streamOpenRouter({ apiKey, model, messages, signal, fetch? })`: POST to `https://openrouter.ai/api/v1/chat/completions` with `Authorization: Bearer <key>`, `HTTP-Referer` + `X-Title` set to this site, `stream: true`; parse the SSE lines, yield `delta.content`. Never log the key or the Authorization header. Tool-call support: parse `tool_calls` deltas; expose them so the caller can answer via `/api/query`. Cap rounds at ~10.
- [ ] Step 4: Confirm pass.
- [ ] Step 5: Commit.

### Task 4: CSP header (BEFORE BYOK, so BYOK is verified under it)

**Files:** Create/modify `next.config.ts` (headers()).

- [ ] Step 1: Add a `Content-Security-Policy` response header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://openrouter.ai; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'`.
- [ ] Step 2: Verify the site still loads, fonts render, the keyless live query still works, no CSP violations in console.
- [ ] Step 3: Commit.

### Task 5: BYOK panel + tool loop + key storage (DEP-FREE)

**Files:**
- Create: `src/components/byok.tsx` (client), `src/lib/key-store.ts` (localStorage read/set/clear, SSR-safe), `src/components/safe-text.tsx` (dep-free safe renderer — NOT a markdown lib)
- Modify: `src/components/live-query.tsx` (add a disclosed "reason over these with your OpenRouter key" toggle that mounts BYOK)

- [ ] Step 1: `key-store.ts`: get/set/clear in `localStorage` (guarded for SSR; key name `or_key`). `safe-text.tsx`: render text as React TEXT NODES only — split on newlines into lines, turn `[src:id]` into an inert styled `<span>`. NO `dangerouslySetInnerHTML`, NO `marked`, NO links/HTML. (Do NOT import Falsafa's `MarkdownView`/`defensive-linkify`; they pull `marked` + an 8 MB index. Take only the security posture.)
- [ ] Step 2: Tests: `safe-text` renders `<script>alert(1)</script>` and `[x](javascript:alert(1))` as literal visible text with nothing clickable and no execution; `key-store` round-trips and clears.
- [ ] Step 3: `byok.tsx`: `type=password autocomplete="off"` key input + a "forget key" button (clears key-store); a model `<select>` (OpenRouter ids, default a small one e.g. `openai/gpt-5-mini`); a question input. On ask: messages = [system "answer ONLY from the provided passages and cite their ids; if nothing relevant, say so", user question]; run `streamOpenRouter`; when the model emits a search tool call, answer it via `fetch('/api/query')` and feed results back (round cap ~10); stream output through `safe-text`. Key is read from key-store and passed straight to `streamOpenRouter` (browser→openrouter only). Define the FAILURE path: if `/api/query` or OpenRouter returns an error, surface the error text in an inert banner and end the stream cleanly (never hang).
- [ ] Step 4: Grep the BYOK code: no `console.*` logs the key or `Authorization` header; no analytics/error-reporter on the key path.
- [ ] Step 5: Security verification in preview (CSP now active): devtools network — ask a BYOK question, confirm NO request to our own origin carries the key/Authorization header (only `openrouter.ai` does) and `/api/query` carries no key; confirm a passage containing `<script>` renders inert; confirm no CSP violation.
- [ ] Step 6: Commit.

---

## Chunk 3: Real content — R4, R5

> Source: `content/methodology.md` (public draft) + public facts from the spec. Abstract all client work. Run the confidentiality sweep before committing. Relabel `[src:paxel]`→"local session analysis", `[src:git]`→"git history" while here.

### Task 6: Wire "how I build" from content

**Files:** Modify `src/app/page.tsx`; maybe add `src/lib/content.ts` to read `content/methodology.md` at build (server component) and extract the principle list.

- [ ] Step 1: Replace the 3-entry skeleton with the full named-principle set from `content/methodology.md` Part 1 (spec-first, the swarm, parallelism, plan/review/ship, data ontology, distrust reported state, verify by building, benchmark-first, reverse over-engineering, codify the lesson, memory, velocity). Each: a mono principle label + the shown one-liner + one evidence anchor. Keep the ledger layout.
- [ ] Step 2: Verify desktop + mobile; reading measure capped; ledger rail correct.
- [ ] Step 3: Commit.

### Task 7: The method, applied (3 abstracted case studies)

**Files:** Create `src/components/case-studies.tsx`; modify `page.tsx`.

- [ ] Step 1: Exactly 3 abstracted case studies (the archive rebuild, the publisher pipeline, the regulatory-intelligence product) using the public forms from `content/methodology.md`. Each: a mono title, what it is, the ontology core applied, status. NO client names; re-identification-checked (no sector+geo+size fingerprint that pins to one client).
- [ ] Step 2: Confidentiality sweep of the rendered text; verify desktop + mobile.
- [ ] Step 3: Commit.

### Task 8: Falsafa, Recognition, Writing, About, Contact

**Files:** Modify `page.tsx`; small section components as needed.

- [ ] Step 1: Falsafa section (frames the live query, names it as the one public OSS artifact). Recognition: EV ($20K), MSME Idea Hackathon 5.0 (₹12.75L), Cobden-Bright, Philosophy Now — mono list with years. Writing: Newsreader prose, Philosophy Now + the essay in flight. About: Newsreader, humanities-to-AI, the Hayek frame, occasionalism, poet. Contact: email + GitHub.
- [ ] Step 2: Verify all sections desktop + mobile; serif only in Writing/About; sweep.
- [ ] Step 3: Commit.

---

## Chunk 4: Provenance + command palette — R6, R7

### Task 9: Self-citation provenance popovers

**Files:** Create `src/components/provenance.tsx` (client); modify hero metrics + case studies to wrap `[src:]` tags.

- [ ] Step 1: A small accessible popover: hover, keyboard focus, and tap all reveal the source text. Text only. Public labels reader-legible. No client identifier ever shown.
- [ ] Step 2: Verify mouse + keyboard + touch (resize to mobile, tap) in preview.
- [ ] Step 3: Commit.

### Task 10: Command palette + graph navigator

**Files:** Create `src/components/command-palette.tsx` (client, dep-free); wire `g` to focus the graph.

- [ ] Step 1: `Cmd-K` / `/` opens a dep-free palette listing sections; arrow-key navigation, Enter scrolls to section, Esc closes, focus-trapped, reduced-motion aware. `g` scrolls the graph into view / opens the mobile full-screen graph.
- [ ] Step 2: Verify keyboard flows + mobile.
- [ ] Step 3: Commit.

---

## Chunk 5: Responsive tiers + final pass — R8, R9

### Task 11: Tablet, laptop, cinema/TV tiers

**Files:** touch components/CSS as needed.

- [ ] Step 1: In the preview, walk every tier (2560, 1440, 1024, 768, 480, 375, 320). Confirm per-element treatments from DESIGN.md hold: graph interactive on lg+ / static + tap on mobile; ledger rail to tablet / inline gutter on mobile; metrics row→2-up; terminal inline / sheet on mobile; reading measure capped on cinema with real estate going to the graph. Fix any tier that compromises.
- [ ] Step 2: Reduced-motion: confirm all entrance/ambient motion off under the preference.
- [ ] Step 3: Commit.

### Task 12: Final verification + handoff

- [ ] Step 1: `npm run build` clean; no console errors at any tier; full confidentiality sweep of the repo (grep for client + off-limits identifiers) returns clean.
- [ ] Step 2: Dispatch a final whole-site review subagent (correctness, a11y, DESIGN.md fidelity, security trust boundary, confidentiality). Fix blockers.
- [ ] Step 3: Write a short `PROGRESS.md`: what shipped, what is left (R10 deploy + the deferred deps decision), and the stated decisions — (a) `/api/query`'s only v1 abuse control is the 200-char cap + fixed k=3 (no rate limiter unless the deploy host makes it trivial); (b) whether the off-limits sweep ran against the external identifier file or was degraded. Commit + push.
- [ ] Step 4: STOP. R10 (deploy) waits for Adnan's go and target.
