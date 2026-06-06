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

## Next

- Task 2 — live terminal UI (`live-query.tsx`), then Chunk 2 (CSP + BYOK), etc.

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
