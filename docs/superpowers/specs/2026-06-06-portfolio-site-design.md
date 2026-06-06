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

### F2b. BYOK reasoning — DEFERRED to v1.1 (security-gated)

Per the spec review, the optional "reason over the passages with your own
OpenRouter key" layer is deferred out of v1: it is the only secret-handling
surface on a public site, and the keyless cited search already demonstrates the
method on the page. When built, it MUST meet the contract in the Security
section below; until then it is not implemented and no key input ships.

### F3. The site cites itself

Inline `[src:]`-style provenance on metrics and claims. Hover, keyboard focus,
and tap all reveal the source via a small accessible popover (text only, not a
tooltip soup). Public `[src:]` labels must be human-meaningful, not internal
tool names: the current hero uses `[src:paxel]` (a local session-log analysis)
and `[src:git]`; relabel to reader-legible terms like "local session analysis"
and "git history" during content wiring. For case studies the popover shows the
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

- **BYOK trust boundary (for v1.1, when built):** the visitor's OpenRouter key
  is used ONLY in a browser-originated request directly to `openrouter.ai`. It is
  never included in any request to this site's own origin. The `/api/query`
  route is keyless and never sees the key.
- **Key handling controls (v1.1):** held in component memory only, never in
  `localStorage`/`sessionStorage`, never in a URL or query string; input is
  `type=password`, `autocomplete="off"`, outside any URL-serializing form;
  cleared on unmount. No logging of the key, the `Authorization` header, or the
  request config; no third-party error reporting or telemetry on the BYOK path.
  The request payload to OpenRouter is exactly {model, the retrieved passages,
  the question}; nothing else.
- **Rendering (applies to v1 keyless too):** corpus passages and any future model
  output render as TEXT, never via `dangerouslySetInnerHTML`. An injection in a
  passage or model response must not be able to execute.
- **CSP:** ship a Content-Security-Policy that restricts `connect-src` to `'self'`
  plus `openrouter.ai` (added in v1.1), and `script-src 'self'`, so an injected
  script cannot exfiltrate anything to a third party.

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
(text-only rendering). R4 wire real content into how-i-build + exactly 3
abstracted case studies (each: what it is, the ontology core applied, status;
re-identification-checked; definition of done = renders faithfully at all tiers
with passing sweep). R5 Falsafa, Recognition (EV, MSME, Cobden-Bright,
Philosophy Now), Writing, About, Contact sections. R6 self-citation provenance
popovers + relabel public `[src:]` tags (F3). R7 command palette + graph
navigator (F4). R8 the tablet and cinema/TV tiers verified and tuned. R9 a CSP
header (F-Security). R10 deploy (gated on Adnan, target TBD).

Post-v1: R3 BYOK reasoning (opt-in), only under the full Security contract.

## Success criteria

- Every section renders, faithful to DESIGN.md, verified at desktop, tablet,
  mobile, and cinema tiers in the preview.
- The live query returns a real cited passage with no key (v1 keyless). Passages
  render as text; a CSP restricts `connect-src`/`script-src` to `'self'`.
- Provenance is reachable by mouse, keyboard, and touch; public `[src:]` labels
  are reader-legible, not internal tool names.
- `prefers-reduced-motion` disables all entrance and ambient motion.
- A confidentiality sweep of the repo shows zero client or off-limits
  identifiers in any shipped surface.
- Build and typecheck clean; no console errors at any tier.

## Out of scope (v1)

Light mode. A CMS. Analytics. The full Falsafa corpus (curated subset only).
Per-client naming (until Adnan grants it).
