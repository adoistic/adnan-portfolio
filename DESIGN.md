# Design System — Adnan Abbasi portfolio

## North star (the memorable thing)

A visitor should leave thinking "this person builds at a level I can't fathom," arrived at through understatement, not claims. The surface reads as a humble builder showing his work; the awe comes from the caliber and density of evidence accumulating as you scroll. Show, never tell. "The method is the product" appears once, plainly, at the hinge between how-I-build and the work.

Every design decision serves that effect. When in doubt, remove a claim and add a piece of evidence.

## Product context

- **What this is:** Adnan's method-led personal site. Not a project gallery. The methodology is the spine; work appears only as proof it holds across domains.
- **Who it's for:** people evaluating Adnan (founders, grantmakers, collaborators, prospective clients) and AI agents reading how he works.
- **Space:** technical-founder / builder portfolio, pushed to award-caliber craft.
- **Project type:** interactive single-site, server-backed (a live query endpoint).

## Aesthetic direction

- **Direction:** an engineer's build-log elevated to award-caliber. Nerdy, not artsy: the wow is computational and systems-flavored (graph, terminal, data), never decorative.
- **Decoration level:** minimal to intentional. Hairline rules, a faint ledger grid, monospace line numbers. The numbers and provenance are the ornament.
- **Mood:** quietly devastating. Restraint as flex. Dense with evidence, zero hype.

## Typography

- **Display / hero / labels / numbers / tags:** Geist Mono. Tabular-nums on. Carries the logbook identity. (Ships with Next via `next/font`.)
- **Body (technical sections):** Geist (sans). Pairs natively with Geist Mono.
- **Long-form prose (About, Writing, pull quotes):** Newsreader (serif). A quiet literary undertone for the humanities-to-AI duality. (Google Fonts via `next/font`.)
- **Scale:** fluid `clamp()` per tier. Reading measure capped at ~68-72ch at ALL sizes, including cinema and TV (never full-bleed prose). Hero line scales up on large screens; body does not sprawl.

## Color

- **Approach:** restrained. Grayscale base, color only where there is proof.
- `--bg: #0b0d10` · `--surface: #11141a` · `--text: #e6e8ec` · `--muted: #8a93a0` · `--hairline: #1d222b`
- **Accent (sparse):** `--accent: #7fae93` (desaturated terminal-green) for live and positive signals only.
- **Evidence:** `--metric: #d8a657` (warm amber) for numbers and metrics, so evidence quietly draws the eye.
- **Light mode:** not a priority. This is a dark-first identity. If added later, invert surfaces and keep amber/green as the only chromatic notes.

## Spacing

- **Base unit:** 8px. Scale: 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96.
- **Density:** airy between sections, dense inside evidence rows. The contrast (calm prose, tight data) is part of the effect.

## Layout

- **Approach:** grid-disciplined, left-aligned. A persistent left "ledger margin" with monospace line numbers frames the page as a build log.
- **Reading column:** capped (~68-72ch). On cinema/TV the extra horizontal real estate goes to the knowledge graph and ambient data, never to wider text.
- **Border radius:** small. sm 4px, md 6px. Nothing bubbly.

## Motion

- **Approach:** minimal-functional. A short fade-and-rise on section entry (~200ms, ease-out). No count-ups, no scroll gimmicks. Restraint is the point.
- Respect `prefers-reduced-motion`: disable entrance motion entirely.

## Signature interactions

1. **Knowledge-graph hero.** A force-directed graph of the ontology (works, thinkers, projects as nodes; thin hairline links; a few amber/green accent nodes). On-thesis, since the work itself is knowledge graphs.
2. **Live method on the page.** A query box that calls a server route proxying Falsafa's search/MCP and returns a real cited passage. The method demonstrating itself. Must be flawless or it undercuts everything.
3. **The site cites itself.** Inline `[src: ...]`-style provenance on metrics and claims; hover to reveal the source. The site practices its own rigor.
4. **Command palette.** `Cmd-K` to navigate; `g` opens the graph navigator. A nerdy, keyboard-first affordance.

## Responsive — every tier designed, no fallback

Hard rule: each viewport is a deliberate layout, never a shrunk desktop.

Tiers: `≥2560 cinema/TV · 1440 desktop · 1024 laptop · 768 tablet · 480 big mobile · 375 regular mobile · 320 small mobile`.

Per-element treatment:
- **Knowledge graph:** cinema/desktop run the full interactive graph and use the extra space (more nodes, ambient motion); laptop/tablet keep it interactive and contained; mobile shows a composed STATIC constellation hero with a "explore the graph" tap that opens it full-screen where it has room. Never a squished graph.
- **Ledger margin:** persistent left rail with line numbers from cinema down to tablet; on mobile it collapses to a thin inline gutter or section markers. Same identity, re-expressed.
- **Evidence metrics:** one dense row (desktop), two rows (tablet), a legible 2-up grid (mobile). Numbers never shrink below legibility.
- **Live terminal:** inline panel on desktop; a tap-to-expand full-screen sheet on mobile where typing works.
- **Type:** fluid `clamp()`; reading measure capped at every tier; big screens scale the hero and the graph, not the prose.

## Content architecture (method-led)

1. **Hero** — name, one downplayed line, a dense row of evidence metrics, the knowledge graph. No adjectives about the person.
2. **How I build** — the methodology as a build log (the spine), drawn from `content/methodology.md`.
3. *(hinge line)* "The method is the product."
4. **The method, applied** — 3-4 abstracted case studies showing range. No client names without permission.
5. **Falsafa** — the one named public artifact; home of the live query.
6. **Recognition** — EV, MSME, Cobden-Bright, Philosophy Now.
7. **Writing** — Newsreader prose; Philosophy Now plus the essay in flight.
8. **About** — the humanities-to-AI path, the Hayek frame. Newsreader.
9. **Contact.**

## Confidentiality (this repo is PUBLIC)

- Content source is `content/methodology.md` (the allowlist-filtered public draft). Never import the full-fidelity core, the corpus, or the off-limits list into this repo.
- Client engagements appear as abstracted case studies. No client name ships without Adnan's explicit per-client permission.
- The off-limits projects never appear anywhere, in any form.

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-06 | Direction B: dark technical logbook, restraint-as-flex | Chosen from 3 directions; serves the "level you can't fathom, shown not told" north star |
| 2026-06-06 | Wilder features: live Falsafa query + self-citation + knowledge-graph hero, nerdy-not-artsy | Awwwards-caliber craft expressed computationally, on-thesis with the data-ontology work |
| 2026-06-06 | Every viewport a designed tier, no compromise | Explicit requirement; signature elements get per-tier treatments, not shrinks |
| 2026-06-06 | Separate public repo, Next.js 16 + React 19 + TS + Tailwind v4 | Real deployable interactive app; scaffold is Next 16 / Tailwind v4. shadcn not required for v1 (hand-built primitives). |
| 2026-06-06 | BYOK reasoning in v1, ported from Falsafa's BYOK island (OpenRouter-only) | Adnan: copy Falsafa's proven, tested practices rather than build from zero. Key stays browser→OpenRouter; /api/query keyless. See site spec Security section. |
