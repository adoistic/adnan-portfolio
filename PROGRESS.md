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

## Next

- Task 5 (BYOK panel + tool loop + `safe-text.tsx` + `key-store.ts`), then content
  (Chunk 3: Tasks 6,7,8), Chunk 4 (9,10), Chunk 5 (11,12).

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
