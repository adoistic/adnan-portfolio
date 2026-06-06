# Portfolio site — implementation spec

Date: 2026-06-06
Status: draft for review
Repo: github.com/adoistic/adnan-portfolio (public)
Design system source of truth: `DESIGN.md` (this spec is implementation, not look)

## Overview

A method-led personal site for Adnan Abbasi. The methodology is the spine; work
appears only as proof it holds across domains. The north star: a visitor leaves
thinking "this person builds at a level I can't fathom," reached through
understatement and shown evidence, never claims. "The method is the product"
appears once.

Direction B (dark technical logbook, restraint as flex) is locked. This spec
covers building the full site to that direction, reconciling what is already
built, and finishing under review gates.

## Goals

- Ship every section of the method-led architecture, faithful to DESIGN.md.
- The three signature interactions feel real, not decorative: an interactive
  ontology graph, a keyless live cited-passage query, and a self-citing surface.
- Every viewport is a designed tier, no compromise (2560 to 320).
- Public-safe by construction: nothing client-confidential or off-limits ships.

## Non-goals / constraints

- No project gallery. Work is abstracted case studies + Falsafa as the one named
  public artifact. Studio Whence folds under Thothica.
- Repo is PUBLIC. Site content comes only from `content/methodology.md` (the
  allowlist-filtered public draft). Never import the full-fidelity core, the
  analysis corpus, or any off-limits identifier. Client names abstracted; no
  client named without explicit per-client permission; off-limits projects never
  appear in any form.
- No light mode for v1 (dark-first identity).
- No deploy without Adnan's explicit go and target.

## Content architecture (sections)

1. Hero: name, one downplayed line, evidence metrics row, the knowledge graph.
2. How I build: the methodology as a build log (the spine), from
   `content/methodology.md`.
3. Hinge line: "the method is the product."
4. The method, applied: 3-4 abstracted case studies showing range.
5. Falsafa: the named public artifact; home of the live query.
6. Recognition: EV, MSME Idea Hackathon 5.0, Cobden-Bright, Philosophy Now.
7. Writing: Newsreader prose; Philosophy Now + the essay in flight.
8. About: the humanities-to-AI path, the Hayek frame. Newsreader.
9. Contact.

## Signature features (implementation)

### F1. Knowledge-graph hero — BUILT

Dependency-free force-directed graph (`src/components/force-graph.tsx`).
Interactive on lg+ with hover labels; static constellation on mobile. Public-safe
ontology nodes. Remaining: hook it to the `g` command-palette navigator (F4).

### F2. Live Falsafa query (keyless) — backend BUILT, UI remaining

Keyless TF-IDF librarian over a bundled curated corpus
(`src/lib/librarian.ts`, `src/lib/tfidf.ts`, `src/data/falsafa-corpus.json`).
`search()` returns real cited passages, verified. v1 is keyless-only. Remaining:
- A server route `src/app/api/query/route.ts` (POST) that calls `search()` and
  returns hits as JSON. Server-side keeps the 621 KB corpus off the client
  bundle. Acceptance bounds: query length 1-200 chars (reject otherwise, 400);
  `k` fixed server-side at 3 (client cannot raise it); response is the hit
  array only (passage text, work, author, chapter, citation id) — no server
  secret, no extra corpus data. Only the returned hits (public, MIT) cross to
  the client. Basic per-IP throttle if the host makes it trivial; otherwise the
  input cap is the v1 DoS guard.
- A client terminal UI in the Falsafa section: a prompt, debounced submit
  (~250ms), a loading state, empty state, and rendered cited passages (work,
  author, chapter, the passage, and a `[src:]` citation). Keyboard-first,
  accessible. Passages render as TEXT ONLY (no `dangerouslySetInnerHTML`).

### F2b. BYOK reasoning (v1) — ported from Falsafa

Ships in v1. Ported from Falsafa's proven, tested BYOK island
(`/Users/siraj/falsafa/apps/site/src/islands/byok/`), scoped to OpenRouter only
(Adnan: "only OpenRouter"). Do not rebuild from zero; copy and adapt.

- **Trust boundary (testable):** the model request carrying the visitor's key is
  made from the BROWSER directly to `https://openrouter.ai/api/v1`. The model's
  search tool calls are answered by our KEYLESS `/api/query` route
  (`onToolCall` → `fetch('/api/query')` → `search()`). The key never appears in
  any request to this site's own origin; `/api/query` never sees it.
- **Stack (DEPENDENCY-FREE, for autonomy):** hand-rolled `fetch` streaming to
  OpenRouter's `chat/completions` (SSE), not the Vercel AI SDK. This avoids any
  npm-install approval gate while the run is autonomous. `HTTP-Referer`/`X-Title`
  set to this site; tool-loop round cap ~10; streaming output. No new
  dependencies. (If Adnan later prefers the AI SDK, it can replace the hand-rolled
  client behind the same interface.)
- **Learn from Falsafa, do not import it:** read `providers/openai.ts` (the
  OpenRouter request shape + headers), `state.ts` (the SETUP→streaming flow),
  `storage.ts` (localStorage key handling), and `MarkdownView.tsx` (the
  escape-then-render *security posture*) for behavior, but reimplement small,
  dep-free equivalents in React. Do NOT copy `marked`, `marked-footnote`, Preact,
  or `defensive-linkify` (Falsafa-corpus-specific, ~8 MB index). The model's
  search tool calls are answered by our keyless `/api/query`, not an in-browser
  corpus fetch.
- Default state is keyless cited search; reasoning is opt-in (the visitor adds a
  key). Provider picker is OpenRouter-only.

### F3. The site cites itself

Inline `[src:]`-style provenance on metrics and claims. Hover, keyboard focus,
and tap all reveal the source via a small accessible popover (text only, not a
tooltip soup). Public `[src:]` labels must be human-meaningful, not internal
tool names: an early hero used an internal-tool tag and a `[src:git]` tag;
relabel both to reader-legible terms like "local session analysis" and "git
history" during content wiring. For case studies the popover shows the
abstracted basis only. No real client identifier is ever shown publicly.

### F4. Command palette

`Cmd-K` (and `/`) opens a command palette to jump between sections and actions.
`g` is the graph navigator: it scrolls the graph into view, focuses it, and (on
mobile) opens the full-screen graph explorer; it does not filter or mutate the
graph in v1. Keyboard-first, focus-trapped, escape-closable, reduced-motion
aware. v1 is dependency-free (hand-rolled) to stay unblocked; cmdk only if Adnan
approves the dependency.

## Responsive contract (every tier designed)

Tiers: 2560 cinema/TV, 1440 desktop, 1024 laptop, 768 tablet, 480 big mobile,
375 regular mobile, 320 small mobile. Per-element treatments per DESIGN.md:
graph interactive on lg+ / static constellation + tap-to-explore on mobile;
ledger rail down to tablet / inline gutter on mobile; metrics one row to 2-up
grid; terminal inline / tap-to-expand sheet; reading measure capped at every
tier, big screens spend real estate on the graph not on wider prose. Each tier
verified in the preview before its task is marked done.

## Confidentiality model

- **All shipped text is subject to the allowlist**, not just `content/methodology.md`:
  prose, graph node labels, case-study copy, provenance popover text, and metric
  `[src:]` labels. Each authored artifact (graph nodes, case studies) names its
  basis and uses the abstracted public form from the methodology.
- **Case studies pass a re-identification check, not just name-stripping.** An
  abstraction that still pins to one client (e.g. a description unique to a
  single named engagement) is not acceptable; abstract further or drop.
- **The sweep cannot contain the off-limits list (it would leak into public git
  history).** Resolution: the off-limits identifier file lives only in
  `~/Adnan/methodology/.offlimits-identifiers` (gitignored, outside this repo).
  The pre-push check runs the grep against that external local file when present;
  the actual gate is human review of the diff before every push. The off-limits
  list never enters this repo in any form.
- The hero graph and the bundled Falsafa corpus contain only public material
  (the corpus is MIT and public; graph nodes are public thinkers/concepts).

## Security

Aligned to Falsafa's shipped BYOK practices (the thing we are copying), with the
non-negotiables kept hard.

- **Trust boundary (testable, non-negotiable):** the key rides ONLY on a
  browser-originated request to `https://openrouter.ai/api/v1`. It is never in
  any request to this site's own origin; `/api/query` is keyless. Acceptance:
  inspect network in the preview, confirm no request to our origin carries an
  `Authorization` header or the key string.
- **Key persistence (Falsafa-aligned, with the tradeoff stated):** the key is
  stored in `localStorage` like Falsafa (deliberate, for reload persistence),
  entered via an `input type=password` with `autocomplete="off"`, never placed in
  a URL or query string, and clearable by the visitor (a "forget key" control).
  Tradeoff accepted and documented: an XSS could read `localStorage`, which the
  CSP and escaped rendering below exist to prevent. It is the visitor's own key.
- **No key in logs (non-negotiable):** audit every ported `console.*` and error
  path so the key and the `Authorization` header are never logged; surface only
  the provider's own error text. No third-party error reporting or analytics on
  the BYOK path.
- **Rendering (dep-free, safest):** model output and corpus passages render as
  React TEXT NODES only. NO `dangerouslySetInnerHTML` anywhere, no HTML parsing,
  no `marked`. The only allowed transforms are inert: newline→line break, and
  `[src:id]` citations into inert styled `<span>`s. Because no links or HTML are
  rendered, `javascript:`/`data:` hrefs, event-handler attributes, and `<script>`
  are structurally impossible to execute, not merely escaped. Acceptance: a
  passage or model chunk containing `<script>alert(1)</script>` and
  `[x](javascript:alert(1))` renders as literal visible text with nothing
  clickable and no execution.
- **CSP (non-negotiable):** ship a Content-Security-Policy with
  `connect-src 'self' https://openrouter.ai`, `script-src 'self'`, so an injected
  script cannot exfiltrate the key or anything else to a third party.

## Tech approach

- Next.js 16 App Router, React 19, Tailwind v4 (`@theme` tokens in
  `globals.css`), TypeScript strict.
- Server components by default; client components only for interactivity (graph,
  terminal, command palette, provenance popover). The librarian is server-only.
- Fonts via `next/font` (Geist, Geist Mono, Newsreader).
- New dependencies require approval; prefer dependency-free where reasonable.
- **shadcn/ui is NOT required for v1.** The UI primitives here (ledger section,
  metrics, terminal, popover, command palette) are simple and hand-built with
  Tailwind. shadcn may be adopted later if the component surface grows; DESIGN.md
  and AGENTS.md are updated to reflect this. The graph is dependency-free.
- Deploy target (Cloudflare Pages or Vercel) decided with Adnan before any
  deploy task runs.

## Already built (baseline to reconcile, commits b28879e..458bdb8)

- Scaffold (Next 16 / TS / Tailwind v4), DESIGN.md, AGENTS.md guardrails,
  `content/methodology.md`.
- Design tokens + dark theme, Newsreader added, the `Section` ledger primitive,
  a real hero (downplayed line, amber metrics with `[src:]`, hinge, how-i-build
  skeleton). Verified desktop + mobile, no console errors.
- The interactive force-directed graph hero (F1).
- The keyless librarian backend (F2 backend): corpus subset + ported TF-IDF +
  `search()`, verified.

## Remaining work (the plan will decompose)

R1 live-query server route (keyless, bounds per F2). R2 live-query terminal UI
(text-only rendering). R3 BYOK reasoning, dep-free hand-rolled OpenRouter
streaming modeled on Falsafa's island (OpenRouter-only, under the full Security
contract; no new dependency). R4 wire real content into how-i-build + exactly 3
abstracted case studies (each: what it is, the ontology core applied, status;
re-identification-checked; definition of done = renders faithfully at all tiers
with passing sweep). R5 Falsafa, Recognition (EV, MSME, Cobden-Bright,
Philosophy Now), Writing, About, Contact sections. R6 self-citation provenance
popovers + relabel public `[src:]` tags (F3). R7 command palette + graph
navigator (F4). R8 the tablet and cinema/TV tiers verified and tuned. R9 a CSP
header (F-Security). R10 deploy (gated on Adnan, target TBD).

## Success criteria

- Every section renders, faithful to DESIGN.md, verified at desktop, tablet,
  mobile, and cinema tiers in the preview.
- The live query returns a real cited passage with no key (default keyless path).
  With a key, BYOK reasoning streams a grounded answer, and network inspection in
  the preview confirms NO request to our own origin carries the key or an
  `Authorization` header. Passages and model output render via the escaped
  MarkdownView; a CSP restricts `connect-src` to `'self' https://openrouter.ai`
  and `script-src` to `'self'`.
- Provenance is reachable by mouse, keyboard, and touch; public `[src:]` labels
  are reader-legible, not internal tool names.
- `prefers-reduced-motion` disables all entrance and ambient motion.
- A confidentiality sweep of the repo shows zero client or off-limits
  identifiers in any shipped surface.
- Build and typecheck clean; no console errors at any tier.

## Out of scope (v1)

Light mode. A CMS. Analytics. The full Falsafa corpus (curated subset only).
Per-client naming (until Adnan grants it).
