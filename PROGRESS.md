# Build progress — portfolio site v1

Autonomous build against `docs/superpowers/plans/2026-06-06-portfolio-site.md`.
Plan and spec are the source of truth. R10 (deploy) is out of autonomous scope.

## Done

- **Baseline** (pre-loop): scaffold, tokens/theme, `Section` ledger primitive,
  hero (downplayed line + amber metrics + hinge), how-i-build skeleton,
  interactive force-graph hero, keyless librarian (corpus + TF-IDF + `search()`).
- **Task 1 — `/api/query` keyless route** ✅. POST, validates 1..200 chars,
  k fixed at 3 server-side, 400 on empty/too-long/malformed JSON, runtime nodejs,
  corpus stays server-only. Verified via curl ("freedom of thought" → Fichte;
  empty/long/malformed → 400). Build clean.
- **Task 2 — live terminal UI** ✅ (`src/components/live-query.tsx`, mounted in a
  new `falsafa` section). Keyless: type a query → real cited passages render
  (text-only, no dangerouslySetInnerHTML); loading/empty/error states; aria-live;
  keyboard. Verified in preview ("the duty of a king" → Comte's Traité, 3
  citations). Build clean, no console errors.

- **Task 4 — CSP + security headers** ✅ (`next.config.ts`). `Content-Security-Policy`
  with `connect-src 'self' https://openrouter.ai` (the load-bearing BYOK control:
  nothing can be exfiltrated to a third party), plus `frame-ancestors/object-src
  'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
  Verified: header live, page renders, fonts load, query works, no console/CSP
  errors. **Decision for Adnan:** `script-src` keeps `'unsafe-inline'` (Next
  injects inline hydration scripts; strict `script-src 'self'` needs nonce
  middleware that's fragile under turbopack dev). connect-src + text-only
  rendering already close the realistic XSS/exfil surface. Recommend adding
  nonce-based CSP at deploy (R10) when the prod host is known.

- **Task 3 — OpenRouter SSE client** ✅ (`src/lib/openrouter.ts` + test). Dep-free
  async generator: POSTs to openrouter.ai with Bearer key + Referer/Title,
  streams SSE, yields text/tool_call/done/error, never parses `[DONE]`, never
  throws, never logs the key. 2/2 node --test pass, build clean.

- **Task 5 — BYOK reasoning (dep-free)** ✅. `key-store.ts` (localStorage,
  SSR-safe), `safe-text.tsx` + pure `safe-text-model.ts` (text-nodes-only, inert:
  `<script>`/`javascript:` render as literal text), `byok.tsx` (password key +
  forget, model select, question, capped-10 tool loop calling keyless `/api/query`,
  streams via openrouter.ts, failure-path banner, abort). Opt-in toggle in
  live-query.tsx. **Security VERIFIED:** the key is passed only to
  `streamOpenRouter` (code line 164); the only origin fetch is keyless `/api/query`
  (live fetch-spy test: that request carried no key / no Authorization); no key
  logging. 15/15 tests pass, build clean, no console errors.
  **Note for Adnan:** the live OpenRouter streaming UX was not exercised against a
  real key (none available; I won't use yours). It's unit-tested + code-verified;
  do one real "ask" with your OpenRouter key to confirm the answer streams nicely.

- **Task 6 — how-i-build content** ✅. Replaced the 3-entry skeleton with all 13
  Part-1 principles (spec-first, the swarm, parallelism, outside voice, data
  ontology, ground truth, verify, benchmark, reverse, codify, memory, velocity,
  decompose), evidence numbers verbatim from content/methodology.md, ledger layout
  intact, no em dashes, no client names. Verified (13 entries render), build clean.

- **Task 7 — 3 abstracted case studies** ✅ (`src/components/case-studies.tsx`).
  An agent-callable archive, a source-cited content pipeline, a regulatory-
  intelligence product. Each: generic title, what it is, the ontology core move,
  status. Re-identification check passed (sector+geo+size stripped for all three);
  zero client names in rendered text (verified). Build clean. NOTE: currently
  mounted after Falsafa; Task 8 must fix the full section order to match DESIGN.md
  (hero → how-i-build → hinge → method-applied → falsafa → recognition → writing →
  about → contact).

## Next

- Task 8 (Falsafa framing + Recognition + Writing + About + Contact, and fix the
  section order). Then Chunk 4 (Tasks 9,10), Chunk 5 (Tasks 11,12).

## Decisions / notes for Adnan

- **Off-limits sweep is DEGRADED:** `~/Adnan/methodology/.offlimits-identifiers`
  is only the header stub (you never populated real identifiers). The sweep
  therefore relies on the known-client grep + the fact that authored surfaces are
  small and reviewed. Populate that file if you want a real automated off-limits
  gate.
- **Sweep hygiene:** the bundled `src/data/falsafa-corpus.json` is public MIT text
  and triggers false positives (e.g. "samaya" matches a `samaj` substring), so the
  sweep excludes it and uses specific identifiers.
- **Keyless route abuse control (v1):** the 200-char cap + fixed k=3 are the only
  guards; no rate limiter unless the deploy host makes it trivial.
- BYOK is being built dependency-free (no npm installs) per your "work
  autonomously" + the plan.
