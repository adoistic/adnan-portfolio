# Build progress — portfolio site v1

**Status: v1 build COMPLETE.** All 12 plan tasks shipped to
github.com/adoistic/adnan-portfolio (`main`). Build clean, 15/15 unit tests pass,
no console errors at desktop or mobile, confidentiality sweep clean. The only
thing left is deploy, which is yours (see open items).

Plan: `docs/superpowers/plans/2026-06-06-portfolio-site.md`.
Design system: `DESIGN.md`. Spec: `docs/superpowers/specs/2026-06-06-portfolio-site-design.md`.

## What shipped

- **Foundation** — Next.js 16 / React 19 / Tailwind v4, dark "logbook" tokens,
  Geist Mono / Geist / Newsreader, the ledger-margin `Section` primitive.
- **Hero** — restraint-as-flex: name, one downplayed line, amber evidence metrics
  with self-citation, the interactive force-directed knowledge graph (static
  constellation + tap on mobile).
- **How I build** — the 13-principle methodology spine, real evidence per line.
- **The method, applied** — 3 abstracted case studies (no client names).
- **Falsafa live query** — keyless TF-IDF librarian over a bundled corpus subset
  via `/api/query`; type a question, get a real cited passage, no key, no
  hallucination.
- **BYOK reasoning** — optional, dependency-free, OpenRouter-only. The visitor's
  key rides only browser→openrouter.ai (verified: never to our origin; `/api/query`
  stays keyless; no key logging). Answers render text-only (inert).
- **Recognition / Writing / About / Contact** — public facts; serif in Writing/About.
- **Self-citation provenance** — accessible popovers (hover, keyboard, tap).
- **Command palette** — Cmd-K / "/" + "g" graph navigator, focus-trapped.
- **No-compromise responsive** — verified 320 / 768 / 1440 / 2560 (zero horizontal
  overflow at 320, ledger rail at tablet, reading measure capped at 2560).
- **Security** — CSP (`connect-src 'self' https://openrouter.ai`), text-only
  rendering, no-key-logging; a final review confirmed the BYOK boundary and a11y.

## OPEN ITEMS FOR ADNAN (only these are left)

1. **Confirm the public contact email.** Shipped as `adnan@thothica.com` +
   `github.com/adoistic`. Change if you want a different address public.
2. **Deploy (the only remaining step).** Build is deploy-ready. It has a server
   route (`/api/query`), so it needs a Node/serverless runtime, NOT static export.
   Cloudflare Pages (with the Next-on-Pages/Workers adapter) or Vercel (zero-config)
   both work. Pick one and I'll wire the deploy.
3. **Do one real BYOK "ask" with your own OpenRouter key.** The streaming path is
   unit-tested and security-verified but never run against a live key (I won't use
   yours). One real query confirms the answer streams nicely.
4. **CSP hardening (optional).** `script-src` keeps `'unsafe-inline'` because Next
   injects inline hydration scripts; a nonce-based CSP via middleware is the
   stricter option, best added at deploy when the host is known.

## Notes / minor

- A confidentiality fix landed during the final review: the internal analysis-tool
  name had leaked into the bundled CSS (Tailwind v4 was scanning `docs/`) and into
  a few committed docs. Scrubbed from all tracked files, and Tailwind scanning is
  now scoped to `src/`. Verified: that name is in no tracked file and no built
  asset. (It does remain in earlier commit *history*; it is only a tool name, not a
  client or stealth identifier, so a history rewrite is optional, your call.)
- `src/lib/key-store.test.ts` uses a top-level `await import`, which runs fine under
  `node --test` (our standard) but would fail under `tsx`. If you wire CI, use
  `node --test`.
- Off-limits automated gate is degraded: `~/Adnan/methodology/.offlimits-identifiers`
  is still a stub. Human review + the known-client grep covered it; populate that
  file for a real automated gate.
